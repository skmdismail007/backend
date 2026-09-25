import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { extname } from 'node:path'
import { env } from '../config/env.js'
import { getDatabasePool } from '../config/database.js'

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const mimeExtensions = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'image/svg+xml': '.svg', 'application/pdf': '.pdf', 'video/mp4': '.mp4',
  'video/webm': '.webm', 'video/quicktime': '.mov', 'text/plain': '.txt',
  'text/csv': '.csv', 'application/json': '.json', 'application/zip': '.zip',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
}

function cleanPathPart(value) {
  return String(value || 'general').trim().toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'general'
}

function getExtension(file) {
  const originalExtension = extname(file.originalname || '').toLowerCase()
  return originalExtension && originalExtension.length <= 12
    ? originalExtension
    : mimeExtensions[file.mimetype] || ''
}

function getFileUrl(fileId) {
  return `${env.apiBaseUrl}/files/${fileId}`
}

function parseMetadata(value) {
  try { return JSON.parse(value || '{}') } catch { return {} }
}

function fileRecordToUpload(fileRecord, fallback = {}) {
  const metadata = parseMetadata(fileRecord.metadata)
  return {
    url: getFileUrl(fileRecord.id),
    storagePath: fileRecord.filename,
    contentType: fileRecord.content_type || fallback.contentType || 'application/octet-stream',
    originalName: fileRecord.original_name || metadata.originalName || fallback.originalName || fileRecord.filename,
    size: Number(fileRecord.size || fallback.size || 0),
    sha256: fileRecord.sha256 || fallback.sha256 || '',
  }
}

export async function uploadFile(file, options = {}) {
  const { cacheControl = DEFAULT_CACHE_CONTROL, deduplicate = true, folder = 'managed', ownerId = '' } = options
  if (!file?.buffer?.length) throw Object.assign(new Error('Uploaded file is empty'), { statusCode: 400 })

  const hash = createHash('sha256').update(file.buffer).digest('hex')
  const extension = getExtension(file)
  const baseName = deduplicate ? hash : `${Date.now()}-${randomUUID()}`
  const storagePath = [...[folder, ownerId].filter(Boolean).map(cleanPathPart), `${baseName}${extension}`].join('/')
  const pool = getDatabasePool()

  if (deduplicate) {
    const [existing] = await pool.execute('SELECT * FROM uploads WHERE filename = ? LIMIT 1', [storagePath])
    if (existing[0]) return fileRecordToUpload(existing[0], {
      contentType: file.mimetype, originalName: file.originalname, size: file.size || file.buffer.length, sha256: hash,
    })
  }

  const id = randomBytes(12).toString('hex')
  const metadata = {
    cacheControl,
    folder: cleanPathPart(folder),
    ownerId: ownerId ? cleanPathPart(ownerId) : '',
    originalName: file.originalname || `${baseName}${extension}`,
    sha256: hash,
    storagePath,
  }
  await pool.execute(
    `INSERT INTO uploads
      (id, filename, content_type, original_name, size, sha256, cache_control, metadata, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
    [
      id, storagePath, file.mimetype || 'application/octet-stream', metadata.originalName,
      file.size || file.buffer.length, hash, cacheControl, JSON.stringify(metadata), file.buffer,
    ],
  )
  return {
    url: getFileUrl(id), storagePath, contentType: file.mimetype || 'application/octet-stream',
    originalName: metadata.originalName, size: file.size || file.buffer.length, sha256: hash,
  }
}

export async function uploadProductImage(file, productId) {
  return (await uploadFile(file, { folder: 'products', ownerId: productId, deduplicate: true })).url
}

export async function uploadSiteImage(file, folder = 'site') {
  return (await uploadFile(file, { folder, deduplicate: true })).url
}

export async function uploadReviewImageFile(file) {
  return (await uploadFile(file, { folder: 'reviews', deduplicate: true })).url
}

export async function uploadManagedFile(file, folder = 'managed') {
  return uploadFile(file, { folder, deduplicate: true })
}

export function fileIdFromUrl(fileUrl) {
  if (!fileUrl) return ''
  const rawValue = String(fileUrl).trim()
  if (/^[a-f0-9]{24}$/i.test(rawValue)) return rawValue
  try {
    const url = new URL(rawValue, env.apiBaseUrl)
    return decodeURIComponent(url.pathname).match(/\/(?:api\/)?files\/([a-f0-9]{24})(?:\/)?$/i)?.[1] || ''
  } catch {
    return ''
  }
}

export async function deleteFileByUrl(fileUrl) {
  const fileId = fileIdFromUrl(fileUrl)
  if (!fileId) return false
  const [result] = await getDatabasePool().execute('DELETE FROM uploads WHERE id = ?', [fileId])
  return result.affectedRows > 0
}

export async function deleteFilesByUrls(urls = []) {
  await Promise.all([...new Set(urls.filter(Boolean))].map(deleteFileByUrl))
}

export const deleteImagesByUrls = deleteFilesByUrls
export const deleteProductImage = deleteFileByUrl
export const deleteProductImages = (productId) => deleteFolder(`products/${productId}/`)

export async function deleteFolder(prefix) {
  if (!prefix) return 0
  const [result] = await getDatabasePool().execute('DELETE FROM uploads WHERE filename LIKE ?', [`${prefix}%`])
  return result.affectedRows
}

export async function getStoredFile(id) {
  const fileId = fileIdFromUrl(id)
  if (!fileId) throw Object.assign(new Error('File not found'), { statusCode: 404 })
  const [rows] = await getDatabasePool().execute('SELECT * FROM uploads WHERE id = ? LIMIT 1', [fileId])
  const row = rows[0]
  if (!row) throw Object.assign(new Error('File not found'), { statusCode: 404 })
  const metadata = parseMetadata(row.metadata)
  return {
    file: {
      id: row.id, filename: row.filename, contentType: row.content_type, length: Number(row.size),
      metadata: { ...metadata, originalName: row.original_name, cacheControl: row.cache_control },
    },
    stream: Readable.from(row.content),
  }
}

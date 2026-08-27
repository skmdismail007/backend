import { createHash, randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { getMongoDatabase } from '../config/database.js'

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const mimeExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/json': '.json',
  'application/zip': '.zip',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
}

function cleanPathPart(value) {
  return String(value || 'general')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'general'
}

function getExtension(file) {
  const originalExtension = extname(file.originalname || '').toLowerCase()
  if (originalExtension && originalExtension.length <= 12) return originalExtension
  return mimeExtensions[file.mimetype] || ''
}

function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getBucket() {
  return new mongoose.mongo.GridFSBucket(getMongoDatabase(), {
    bucketName: 'uploads',
  })
}

function toObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('File not found'), { statusCode: 404 })
  }

  return new mongoose.Types.ObjectId(id)
}

function getFileUrl(fileId) {
  return `${env.apiBaseUrl}/files/${fileId}`
}

function fileRecordToUpload(fileRecord, fallback = {}) {
  return {
    url: getFileUrl(fileRecord._id.toString()),
    storagePath: fileRecord.filename,
    contentType: fileRecord.contentType || fileRecord.metadata?.contentType || fallback.contentType || 'application/octet-stream',
    originalName: fileRecord.metadata?.originalName || fallback.originalName || fileRecord.filename,
    size: fileRecord.length || fallback.size || 0,
    sha256: fileRecord.metadata?.sha256 || fallback.sha256 || '',
  }
}

async function writeBuffer(uploadStream, buffer) {
  return new Promise((resolve, reject) => {
    uploadStream.once('error', reject)
    uploadStream.once('finish', () => resolve(uploadStream.id))
    uploadStream.end(buffer)
  })
}

export async function uploadFile(file, options = {}) {
  const {
    cacheControl = DEFAULT_CACHE_CONTROL,
    deduplicate = true,
    folder = 'managed',
    ownerId = '',
  } = options

  if (!file?.buffer?.length) {
    throw Object.assign(new Error('Uploaded file is empty'), { statusCode: 400 })
  }

  const extension = getExtension(file)
  const hash = hashBuffer(file.buffer)
  const baseName = deduplicate ? hash : `${Date.now()}-${randomUUID()}`
  const fileName = `${baseName}${extension}`
  const pathParts = [folder, ownerId].filter(Boolean).map(cleanPathPart)
  const storagePath = [...pathParts, fileName].join('/')
  const bucket = getBucket()
  const existingFile = deduplicate ? await bucket.find({ filename: storagePath }).next() : null

  if (existingFile) {
    return fileRecordToUpload(existingFile, {
      contentType: file.mimetype,
      originalName: file.originalname || fileName,
      size: file.size || file.buffer.length,
      sha256: hash,
    })
  }

  const uploadedId = await writeBuffer(
    bucket.openUploadStream(storagePath, {
      contentType: file.mimetype || 'application/octet-stream',
      metadata: {
        cacheControl,
        folder: cleanPathPart(folder),
        ownerId: ownerId ? cleanPathPart(ownerId) : '',
        originalName: file.originalname || fileName,
        sha256: hash,
        storagePath,
      },
    }),
    file.buffer,
  )

  return {
    url: getFileUrl(uploadedId.toString()),
    storagePath,
    contentType: file.mimetype || 'application/octet-stream',
    originalName: file.originalname || fileName,
    size: file.size || file.buffer.length,
    sha256: hash,
  }
}

export function fileIdFromUrl(fileUrl) {
  if (!fileUrl) return ''

  const rawValue = String(fileUrl).trim()
  if (mongoose.Types.ObjectId.isValid(rawValue)) return rawValue

  try {
    const url = new URL(rawValue, env.apiBaseUrl)
    const fileMatch = decodeURIComponent(url.pathname).match(/\/(?:api\/)?files\/([a-f0-9]{24})(?:\/)?$/i)
    if (fileMatch?.[1]) return fileMatch[1]
  } catch {
    return ''
  }

  return ''
}

export async function deleteFileByUrl(fileUrl) {
  const fileId = fileIdFromUrl(fileUrl)
  if (!fileId) return false

  try {
    await getBucket().delete(toObjectId(fileId))
    return true
  } catch (error) {
    if (/FileNotFound|not found/i.test(error.message)) return false
    throw error
  }
}

export async function deleteFilesByUrls(urls = []) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))]
  await Promise.all(uniqueUrls.map((url) => deleteFileByUrl(url)))
}

export async function deleteFolder(prefix) {
  if (!prefix) return 0
  const bucket = getBucket()
  const files = await bucket.find({
    filename: { $regex: `^${escapeRegex(prefix)}` },
  }).toArray()
  await Promise.all(files.map((file) => bucket.delete(file._id)))
  return files.length
}

export async function getStoredFile(id) {
  const objectId = toObjectId(id)
  const bucket = getBucket()
  const file = await bucket.find({ _id: objectId }).next()
  if (!file) throw Object.assign(new Error('File not found'), { statusCode: 404 })

  return {
    file,
    stream: bucket.openDownloadStream(objectId),
  }
}

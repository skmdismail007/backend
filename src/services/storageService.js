import { createHash, randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { storage, storageBucketName } from '../lib/firebase.js'

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const FIREBASE_DOWNLOAD_TOKEN_KEY = 'firebaseStorageDownloadTokens'

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

function encodeStoragePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, '%2F')
}

export function getPublicDownloadUrl(path, token) {
  if (!storageBucketName) {
    throw Object.assign(new Error('Firebase Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET.'), {
      statusCode: 500,
    })
  }
  return `https://firebasestorage.googleapis.com/v0/b/${storageBucketName}/o/${encodeStoragePath(path)}?alt=media&token=${token}`
}

function getBucket() {
  if (!storageBucketName) {
    throw Object.assign(new Error('Firebase Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET.'), {
      statusCode: 500,
    })
  }
  return storage.bucket(storageBucketName)
}

async function ensureDownloadToken(file) {
  const [metadata] = await file.getMetadata().catch(() => [{}])
  const existingToken = metadata?.metadata?.[FIREBASE_DOWNLOAD_TOKEN_KEY]?.split(',')?.[0]
  if (existingToken) return existingToken

  const token = randomUUID()
  await file.setMetadata({
    metadata: {
      ...(metadata.metadata || {}),
      [FIREBASE_DOWNLOAD_TOKEN_KEY]: token,
    },
  })
  return token
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
  const storedFile = bucket.file(storagePath)
  const [exists] = await storedFile.exists()

  if (!exists) {
    await storedFile.save(file.buffer, {
      resumable: false,
      metadata: {
        cacheControl,
        contentType: file.mimetype || 'application/octet-stream',
        metadata: {
          originalName: file.originalname || fileName,
          sha256: hash,
          [FIREBASE_DOWNLOAD_TOKEN_KEY]: randomUUID(),
        },
      },
    })
  }

  const token = await ensureDownloadToken(storedFile)

  return {
    url: getPublicDownloadUrl(storagePath, token),
    storagePath,
    contentType: file.mimetype || 'application/octet-stream',
    originalName: file.originalname || fileName,
    size: file.size || file.buffer.length,
    sha256: hash,
  }
}

export function storagePathFromUrl(fileUrl) {
  if (!fileUrl) return ''

  try {
    const url = new URL(fileUrl)
    const firebasePathMatch = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/)
    if (firebasePathMatch?.[1] && firebasePathMatch?.[2]) {
      const bucketName = decodeURIComponent(firebasePathMatch[1])
      if (bucketName !== storageBucketName) return ''
      return decodeURIComponent(firebasePathMatch[2])
    }

    const pathname = decodeURIComponent(url.pathname)
    const bucketName = getBucket().name
    const bucketPrefix = `/${bucketName}/`
    if (pathname.startsWith(bucketPrefix)) return pathname.slice(bucketPrefix.length)
  } catch {
    return ''
  }

  return ''
}

export async function deleteFileByUrl(fileUrl) {
  const storagePath = storagePathFromUrl(fileUrl)
  if (!storagePath) return false
  await getBucket().file(storagePath).delete({ ignoreNotFound: true })
  return true
}

export async function deleteFilesByUrls(urls = []) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))]
  await Promise.all(uniqueUrls.map((url) => deleteFileByUrl(url)))
}

export async function deleteFolder(prefix) {
  if (!prefix) return 0
  const [files] = await getBucket().getFiles({ prefix })
  await Promise.all(files.map((file) => file.delete({ ignoreNotFound: true })))
  return files.length
}

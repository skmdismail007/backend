import { v4 as uuidv4 } from 'uuid'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storage, isFirestoreConfigured } from '../lib/firebase.js'

const uploadRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../uploads')
const publicUploadPath = '/uploads'

function sanitizeExtension(filename) {
  const extension = extname(filename).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(extension) ? extension : '.jpg'
}

function publicLocalUploadUrl(filePath) {
  return `${publicUploadPath}/${filePath.split(sep).join('/')}`
}

function localUploadPathFromUrl(imageUrl) {
  let pathname = imageUrl

  try {
    pathname = new URL(imageUrl).pathname
  } catch {
    // Relative upload URLs are stored as-is.
  }

  if (!pathname.startsWith(`${publicUploadPath}/`)) return null

  const relativePath = pathname.slice(publicUploadPath.length + 1)
  const localPath = resolve(uploadRoot, relativePath)
  return localPath.startsWith(uploadRoot) ? localPath : null
}

function firebaseStoragePathFromUrl(imageUrl) {
  const urlObj = new URL(imageUrl)
  const decodedPath = decodeURIComponent(urlObj.pathname)

  if (decodedPath.includes('/o/')) {
    return decodedPath.split('/o/')[1]
  }

  const bucketName = storage.bucket().name
  const bucketPrefix = `/${bucketName}/`
  if (decodedPath.startsWith(bucketPrefix)) {
    return decodedPath.slice(bucketPrefix.length)
  }

  return null
}

async function uploadLocalProductImage(fileBuffer, filename, productId) {
  const extension = sanitizeExtension(filename)
  const uniqueName = `${uuidv4()}${extension}`
  const relativePath = `products/${productId}/${uniqueName}`
  const destinationDirectory = resolve(uploadRoot, 'products', productId)

  await mkdir(destinationDirectory, { recursive: true })
  await writeFile(resolve(destinationDirectory, uniqueName), fileBuffer)

  return publicLocalUploadUrl(relativePath)
}

/**
 * Upload a single image to Firebase Storage
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @param {string} productId - Product ID for organizing storage
 * @returns {Promise<string>} Download URL of uploaded image
 */
export async function uploadProductImage(fileBuffer, filename, productId) {
  if (!isFirestoreConfigured) {
    return uploadLocalProductImage(fileBuffer, filename, productId)
  }

  try {
    // Generate unique filename
    const ext = filename.split('.').pop()
    const uniqueName = `${uuidv4()}.${ext}`
    const filePath = `products/${productId}/${uniqueName}`

    const bucket = storage.bucket()
    const file = bucket.file(filePath)

    // Upload file
    await file.save(fileBuffer, {
      metadata: {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    })

    // Make file public and get download URL
    await file.makePublic()

    // Get download URL
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 100, // 100 years
    })

    return url
  } catch (error) {
    console.error('Error uploading product image:', error)
    throw Object.assign(new Error('Failed to upload image'), { statusCode: 500 })
  }
}

/**
 * Delete an image from Firebase Storage
 * @param {string} imageUrl - Download URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteProductImage(imageUrl) {
  const localPath = localUploadPathFromUrl(imageUrl)
  if (localPath) {
    await unlink(localPath).catch(() => {})
    return
  }

  if (!isFirestoreConfigured) return

  try {
    const decodedPath = firebaseStoragePathFromUrl(imageUrl)
    if (!decodedPath) return

    const bucket = storage.bucket()
    const file = bucket.file(decodedPath)

    await file.delete()
  } catch (error) {
    console.error('Error deleting product image:', error)
    // Don't throw error on delete - continue anyway
  }
}

/**
 * Delete all images for a product
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export async function deleteProductImages(productId) {
  if (!isFirestoreConfigured) return

  try {
    const bucket = storage.bucket()
    const prefix = `products/${productId}/`

    const [files] = await bucket.getFiles({ prefix })

    for (const file of files) {
      await file.delete()
    }
  } catch (error) {
    console.error('Error deleting product images:', error)
    // Don't throw error on delete - continue anyway
  }
}

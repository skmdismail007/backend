import {
  deleteFileByUrl,
  deleteFilesByUrls,
  deleteFolder,
  uploadFile,
} from './storageService.js'

export async function uploadProductImage(file, productId) {
  const upload = await uploadFile(file, {
    folder: 'products',
    ownerId: productId,
    deduplicate: true,
  })
  return upload.url
}

export async function uploadSiteImage(file, folder = 'site') {
  const upload = await uploadFile(file, {
    folder,
    deduplicate: true,
  })
  return upload.url
}

export async function uploadReviewImageFile(file) {
  const upload = await uploadFile(file, {
    folder: 'reviews',
    deduplicate: true,
  })
  return upload.url
}

export async function uploadManagedFile(file, folder = 'managed') {
  return uploadFile(file, {
    folder,
    deduplicate: true,
  })
}

export const deleteProductImage = deleteFileByUrl
export const deleteImagesByUrls = deleteFilesByUrls
export const deleteProductImages = (productId) => deleteFolder(`products/${productId}/`)

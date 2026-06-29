import multer from 'multer'

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const GENERAL_FILE_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
  'application/zip',
]

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_PRODUCT_FILES = 10
const MAX_SITE_FILES = 5
const MAX_GENERAL_FILES = 10

function createFileFilter(allowedTypes) {
  return (_request, file, callback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error(`Invalid file type: ${file.mimetype}`))
      return
    }

    callback(null, true)
  }
}

function createUploader({ allowedTypes, fileSize, files }) {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: createFileFilter(allowedTypes),
    limits: {
      fileSize,
      files,
    },
  })
}

export const uploadProductImages = createUploader({
  allowedTypes: IMAGE_MIME_TYPES,
  fileSize: MAX_IMAGE_SIZE,
  files: MAX_PRODUCT_FILES,
})

export const uploadSiteImages = createUploader({
  allowedTypes: IMAGE_MIME_TYPES,
  fileSize: MAX_IMAGE_SIZE,
  files: MAX_SITE_FILES,
})

export const uploadReviewImage = createUploader({
  allowedTypes: IMAGE_MIME_TYPES,
  fileSize: MAX_IMAGE_SIZE,
  files: 1,
})

export const uploadGeneralFiles = createUploader({
  allowedTypes: GENERAL_FILE_MIME_TYPES,
  fileSize: MAX_FILE_SIZE,
  files: MAX_GENERAL_FILES,
})

export function validateImageCount(request, _response, next) {
  if (request.files && request.files.length > MAX_PRODUCT_FILES) {
    next(Object.assign(new Error(`Maximum ${MAX_PRODUCT_FILES} images allowed`), { statusCode: 400 }))
    return
  }
  next()
}

export function validateSiteImageCount(request, _response, next) {
  if (request.files && request.files.length > MAX_SITE_FILES) {
    next(Object.assign(new Error(`Maximum ${MAX_SITE_FILES} images allowed`), { statusCode: 400 }))
    return
  }
  next()
}

export function handleUploadError(error, _request, response, next) {
  if (!error) {
    next()
    return
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      response.status(400).json({ message: 'Uploaded file is too large' })
      return
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      response.status(400).json({ message: 'Maximum file count exceeded' })
      return
    }
  }

  response.status(error.statusCode || 400).json({ message: error.message || 'File upload failed' })
}

export const handleMulterError = handleUploadError

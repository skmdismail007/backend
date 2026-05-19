import multer from 'multer'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 10

// Memory storage for multer (files sent to Firebase)
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (_req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`))
  }

  // Check file extension
  const ext = `.${file.originalname.split('.').pop().toLowerCase()}`
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`))
  }

  cb(null, true)
}

// Create multer instance for product images
export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
})

// Validation middleware for image count
export function validateImageCount(req, _res, next) {
  if (req.files && req.files.length > MAX_FILES) {
    return next(new Error(`Maximum ${MAX_FILES} images allowed`))
  }
  next()
}

// Error handler for multer
export function handleMulterError(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: `Maximum ${MAX_FILES} files allowed`,
      })
    }
    return res.status(400).json({ message: err.message })
  }

  if (err) {
    return res.status(400).json({ message: err.message })
  }

  res.status(500).json({ message: 'Image upload failed' })
}

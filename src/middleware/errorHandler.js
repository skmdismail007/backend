import { ZodError } from 'zod'

export function errorHandler(error, _request, response, next) {
  void next
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    })
    return
  }

  if (error.code === 'P2025') {
    response.status(404).json({ message: 'Record not found' })
    return
  }

  console.error(error)

  response.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : 'Server error',
  })
}

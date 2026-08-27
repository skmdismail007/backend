import { getStoredFile } from '../services/storageService.js'

function safeFileName(name = 'download') {
  return String(name).replace(/["\\\r\n]/g, '')
}

export async function getFile(request, response, next) {
  const { file, stream } = await getStoredFile(request.validated.params.id)
  const contentType = file.contentType || file.metadata?.contentType || 'application/octet-stream'

  response.set({
    'Cache-Control': file.metadata?.cacheControl || 'public, max-age=31536000, immutable',
    'Content-Disposition': `inline; filename="${safeFileName(file.metadata?.originalName || file.filename)}"`,
    'Content-Length': file.length,
    'Content-Type': contentType,
  })

  stream.on('error', next)
  stream.pipe(response)
}

import { getDatabaseStatus, pingDatabase } from '../config/database.js'

export async function getHealth(_request, response) {
  let databaseStatus = getDatabaseStatus()
  let databasePing = 'unavailable'
  try {
    await pingDatabase()
    databasePing = 'ok'
  } catch (error) {
    console.error('MySQL health check failed:', error.message)
    databaseStatus = getDatabaseStatus()
  }

  response.json({
    status: databasePing === 'ok' ? 'ok' : 'degraded',
    service: 'akiwa-backend',
    database: 'mysql',
    databaseStatus: databasePing === 'ok' ? 'connected' : databaseStatus,
    databasePing,
    fileStorage: 'mysql',
  })
}

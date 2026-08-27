import { getDatabaseStatus, getMongoDatabase } from '../config/database.js'

export async function getHealth(_request, response) {
  const databaseStatus = getDatabaseStatus()
  let databasePing = 'unavailable'

  if (databaseStatus === 'connected') {
    try {
      await getMongoDatabase().admin().ping()
      databasePing = 'ok'
    } catch (error) {
      console.error('MongoDB health check failed:', error.message)
    }
  }

  response.json({
    status: databasePing === 'ok' ? 'ok' : 'degraded',
    service: 'akiwa-backend',
    database: 'mongodb',
    databaseStatus,
    databasePing,
    fileStorage: 'mongodb-gridfs',
  })
}

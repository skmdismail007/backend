import { getDatabaseStatus, getMongoDatabase } from '../config/database.js'

export async function getHealth(_request, response) {
  await getMongoDatabase().admin().ping()
  response.json({
    status: 'ok',
    service: 'akiwa-backend',
    database: 'mongodb',
    databaseStatus: getDatabaseStatus(),
    fileStorage: 'mongodb-gridfs',
  })
}

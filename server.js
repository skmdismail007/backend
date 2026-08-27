import 'dotenv/config'
import { createApp } from './src/app.js'
import { connectDatabase, disconnectDatabase } from './src/config/database.js'
import { env } from './src/config/env.js'

const databaseRetryDelayMs = 15_000
let databaseRetryTimeout
let isShuttingDown = false

function connectDatabaseWithRetry() {
  connectDatabase()
    .then(() => {
      console.log('MongoDB connected.')
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message)

      if (!isShuttingDown) {
        databaseRetryTimeout = setTimeout(connectDatabaseWithRetry, databaseRetryDelayMs)
      }
    })
}

async function startServer() {
  const app = createApp()
  const server = app.listen(env.port, env.host, () => {
    console.log(`Backend API running on http://${env.host}:${env.port}`)
  })

  connectDatabaseWithRetry()

  async function shutdown(signal) {
    if (isShuttingDown) return

    isShuttingDown = true
    clearTimeout(databaseRetryTimeout)
    console.log(`${signal} received. Closing backend API...`)

    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

startServer().catch((error) => {
  console.error('Failed to start backend API:', error.message)
  process.exit(1)
})

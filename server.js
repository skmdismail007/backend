import 'dotenv/config'
import { createApp } from './src/app.js'
import { connectDatabase, disconnectDatabase } from './src/config/database.js'
import { env } from './src/config/env.js'

async function startServer() {
  await connectDatabase()

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`Backend API running on http://localhost:${env.port}`)
  })

  async function shutdown(signal) {
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

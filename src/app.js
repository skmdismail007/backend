import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import apiRoutes from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(Object.assign(new Error(`CORS origin not allowed: ${origin}`), { statusCode: 403 }))
    },
    credentials: true,
  }))
  app.use(express.json({ limit: '2mb' }))
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

  app.get('/', (_request, response) => {
    response.json({ service: 'akiwa-backend', status: 'ok' })
  })

  app.use('/api', apiRoutes)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

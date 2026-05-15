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
  app.use(cors({ origin: env.corsOrigin, credentials: true }))
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

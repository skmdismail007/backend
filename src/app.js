import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import apiRoutes from './routes/index.js'

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (env.corsOrigins.includes('*')) return true
  if (env.corsOrigins.includes(origin)) return true

  try {
    const { hostname } = new URL(origin)
    if (
      hostname === 'dynamicworld.online' ||
      hostname.endsWith('.dynamicworld.online') ||
      hostname.endsWith('.onrender.com') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    ) {
      return true
    }
  } catch {
    return false
  }

  return false
}

export function createApp() {
  const app = express()

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
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

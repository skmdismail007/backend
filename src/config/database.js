import mongoose from 'mongoose'
import { env } from './env.js'

let connectionPromise

function getConnectionTarget(uri) {
  try {
    const parsed = new URL(uri)
    return {
      protocol: parsed.protocol,
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, '') || '(default)',
    }
  } catch {
    return { protocol: 'invalid', host: '(unparseable)', database: '(unknown)' }
  }
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection

  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is required to start the backend.')
  }

  const connectionTarget = getConnectionTarget(env.mongodbUri)
  if (connectionTarget.protocol !== 'mongodb:' && connectionTarget.protocol !== 'mongodb+srv:') {
    throw new Error('MONGODB_URI must use mongodb:// or mongodb+srv://.')
  }

  if (connectionTarget.database === '(default)') {
    throw new Error('MONGODB_URI must include a database name.')
  }

  console.log('MongoDB connection target:', connectionTarget)

  connectionPromise ||= mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: env.mongodbConnectionTimeoutMs,
  }).catch((error) => {
    connectionPromise = undefined
    throw error
  })

  await connectionPromise
  return mongoose.connection
}

export async function disconnectDatabase() {
  connectionPromise = undefined
  await mongoose.connection.close(false)
}

export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }

  return states[mongoose.connection.readyState] || 'unknown'
}

export function getMongoDatabase() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw Object.assign(new Error('MongoDB is not connected'), { statusCode: 503 })
  }

  return mongoose.connection.db
}

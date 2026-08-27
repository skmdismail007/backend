import mongoose from 'mongoose'
import { env } from './env.js'

let connectionPromise

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection

  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is required to start the backend.')
  }

  connectionPromise ||= mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: env.mongodbConnectionTimeoutMs,
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

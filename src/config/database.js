import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('bufferCommands', false)
mongoose.set('bufferTimeoutMS', env.mongodbConnectionTimeoutMs)

let connectionPromise
let lastConnectionAttemptAt = null
let lastSuccessfulConnectionAt = null
let lastConnectionError = null
let hasLoggedMongoConfig = false

const requiredDatabaseName = 'akiwa'

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function redactMongoSecrets(value) {
  if (!value) return value

  let redacted = String(value)

  if (env.mongodbUri) {
    redacted = redacted.split(env.mongodbUri).join('[redacted MongoDB URI]')

    try {
      const parsed = new URL(env.mongodbUri)
      const credentials = [parsed.username, parsed.password, safeDecode(parsed.username), safeDecode(parsed.password)]
        .filter(Boolean)

      credentials.forEach((credential) => {
        redacted = redacted.split(credential).join('[redacted]')
      })
    } catch {
      // Invalid URI errors are handled separately; keep redaction best-effort.
    }
  }

  return redacted
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"')]+/gi, '[redacted MongoDB URI]')
    .slice(0, 1400)
}

function getMongoUriSummary(uri) {
  const summary = {
    present: Boolean(uri),
    protocol: null,
    host: null,
    database: null,
    usernamePresent: false,
    passwordPresent: false,
    options: [],
  }

  if (!uri) return summary

  const parsed = new URL(uri)
  summary.protocol = parsed.protocol.replace(/:$/, '')
  summary.host = parsed.host
  summary.database = safeDecode(parsed.pathname.replace(/^\/+/, '')).split('/')[0] || null
  summary.usernamePresent = Boolean(parsed.username)
  summary.passwordPresent = Boolean(parsed.password)
  summary.options = [...parsed.searchParams.keys()].sort()

  return summary
}

function validateMongoUri() {
  if (!env.mongodbUri) {
    throw Object.assign(new Error('MONGODB_URI is missing from the runtime environment.'), {
      code: 'MONGODB_URI_MISSING',
    })
  }

  let summary
  try {
    summary = getMongoUriSummary(env.mongodbUri)
  } catch (error) {
    throw Object.assign(new Error(`MONGODB_URI is not a valid URI: ${error.message}`), {
      code: 'MONGODB_URI_INVALID',
    })
  }

  if (!['mongodb', 'mongodb+srv'].includes(summary.protocol)) {
    throw Object.assign(new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://.'), {
      code: 'MONGODB_URI_INVALID_PROTOCOL',
    })
  }

  if (!summary.host) {
    throw Object.assign(new Error('MONGODB_URI must include a MongoDB host.'), {
      code: 'MONGODB_URI_MISSING_HOST',
    })
  }

  if (summary.database !== requiredDatabaseName) {
    throw Object.assign(new Error(`MONGODB_URI must include /${requiredDatabaseName} as the database name.`), {
      code: 'MONGODB_URI_INVALID_DATABASE',
    })
  }

  if (env.nodeEnv === 'production' && (!summary.usernamePresent || !summary.passwordPresent)) {
    throw Object.assign(new Error('Production MONGODB_URI must include Atlas database user credentials.'), {
      code: 'MONGODB_URI_MISSING_CREDENTIALS',
    })
  }

  if (!hasLoggedMongoConfig) {
    console.info('MongoDB configuration:', {
      ...summary,
      timeoutMs: env.mongodbConnectionTimeoutMs,
    })
    hasLoggedMongoConfig = true
  }

  return summary
}

function classifyMongoError(error) {
  const message = `${error?.message || ''} ${error?.reason?.message || ''}`.toLowerCase()
  const code = String(error?.code || '')

  if (code.startsWith('MONGODB_URI_')) return 'invalid-configuration'
  if (/authentication failed|bad auth|auth failed|code 18|code 8000/.test(message) || ['18', '8000'].includes(code)) {
    return 'authentication-failed'
  }
  if (/not authorized|unauthorized|requires authentication/.test(message)) return 'database-user-permission'
  if (/whitelist|access list|ip address|network access/.test(message)) return 'atlas-network-access-denied'
  if (/querysrv|enotfound|eai_again|dns/.test(message)) return 'dns-resolution-failed'
  if (/tls|ssl|certificate|cert/.test(message)) return 'tls-error'
  if (/timed out|timeout|server selection|econnrefused|econnreset|enetunreach|no route|topology/.test(message)) {
    return 'connection-timeout'
  }

  return 'mongodb-connection-error'
}

function serializeMongoError(error) {
  return {
    category: classifyMongoError(error),
    name: error?.name,
    code: error?.code,
    codeName: error?.codeName,
    message: redactMongoSecrets(error?.message || String(error)),
    reason: redactMongoSecrets(error?.reason?.message),
  }
}

async function resetFailedConnection() {
  connectionPromise = undefined

  if (mongoose.connection.readyState === 0) return

  try {
    await mongoose.disconnect()
  } catch (error) {
    console.warn('MongoDB disconnect after failed connection failed:', redactMongoSecrets(error.message))
  }
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection

  validateMongoUri()

  lastConnectionAttemptAt = new Date().toISOString()

  connectionPromise ||= mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: env.mongodbConnectionTimeoutMs,
    connectTimeoutMS: env.mongodbConnectionTimeoutMs,
    heartbeatFrequencyMS: 10_000,
    family: 4,
    maxPoolSize: 10,
  })

  try {
    await connectionPromise
    lastConnectionError = null
    lastSuccessfulConnectionAt = new Date().toISOString()
  } catch (error) {
    lastConnectionError = serializeMongoError(error)
    await resetFailedConnection()
    throw error
  }

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

export function getMongoConnectionDiagnostics(error = null) {
  return {
    readyState: mongoose.connection.readyState,
    databaseStatus: getDatabaseStatus(),
    uri: (() => {
      try {
        return getMongoUriSummary(env.mongodbUri)
      } catch {
        return { present: Boolean(env.mongodbUri), invalid: true }
      }
    })(),
    lastConnectionAttemptAt,
    lastSuccessfulConnectionAt,
    lastError: error ? serializeMongoError(error) : lastConnectionError,
  }
}

export function getMongoDatabase() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw Object.assign(new Error('MongoDB is not connected'), { statusCode: 503 })
  }

  return mongoose.connection.db
}

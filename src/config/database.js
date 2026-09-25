import mysql from 'mysql2/promise'
import { env } from './env.js'

let pool
let connectionPromise
let databaseStatus = 'disconnected'
let lastConnectionAttemptAt = null
let lastSuccessfulConnectionAt = null
let lastConnectionError = null

export function getDatabasePool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      database: env.mysql.database,
      user: env.mysql.user,
      password: env.mysql.password,
      waitForConnections: true,
      connectionLimit: env.mysql.connectionLimit,
      queueLimit: 0,
      connectTimeout: env.mysql.connectionTimeoutMs,
      enableKeepAlive: true,
    })
  }
  return pool
}

export async function connectDatabase() {
  if (databaseStatus === 'connected') return getDatabasePool()
  if (connectionPromise) return connectionPromise

  databaseStatus = 'connecting'
  lastConnectionAttemptAt = new Date().toISOString()
  connectionPromise = getDatabasePool().query('SELECT 1 AS ok')
    .then(async () => {
      await getDatabasePool().query(`
        CREATE TABLE IF NOT EXISTS app_records (
          collection_name VARCHAR(64) NOT NULL,
          id VARCHAR(191) NOT NULL,
          data LONGTEXT NOT NULL,
          created_at DATETIME(3) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          PRIMARY KEY (collection_name, id),
          KEY app_records_created_idx (collection_name, created_at),
          CONSTRAINT app_records_json CHECK (JSON_VALID(data))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      await getDatabasePool().query(`
        CREATE TABLE IF NOT EXISTS uploads (
          id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
          filename VARCHAR(255) NOT NULL,
          content_type VARCHAR(150) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          size BIGINT UNSIGNED NOT NULL,
          sha256 CHAR(64) NOT NULL,
          cache_control VARCHAR(255) NOT NULL,
          metadata LONGTEXT NOT NULL,
          content LONGBLOB NOT NULL,
          created_at DATETIME(3) NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uploads_filename_idx (filename),
          KEY uploads_sha_idx (sha256),
          CONSTRAINT uploads_metadata_json CHECK (JSON_VALID(metadata))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      return pool
    })
    .then(() => {
      databaseStatus = 'connected'
      lastSuccessfulConnectionAt = new Date().toISOString()
      lastConnectionError = null
      return pool
    })
    .catch((error) => {
      databaseStatus = 'disconnected'
      lastConnectionError = {
        code: error?.code,
        message: error?.message,
      }
      throw error
    })
    .finally(() => {
      connectionPromise = undefined
    })

  return connectionPromise
}

export async function disconnectDatabase() {
  connectionPromise = undefined
  if (!pool) {
    databaseStatus = 'disconnected'
    return
  }
  await pool.end()
  pool = undefined
  databaseStatus = 'disconnected'
}

export function getDatabaseStatus() {
  return databaseStatus
}

export function getDatabaseDiagnostics(error = null) {
  return {
    databaseStatus,
    host: env.mysql.host,
    port: env.mysql.port,
    database: env.mysql.database,
    lastConnectionAttemptAt,
    lastSuccessfulConnectionAt,
    lastError: error
      ? { code: error.code, message: error.message }
      : lastConnectionError,
  }
}

export async function pingDatabase() {
  await connectDatabase()
  let timer
  try {
    await Promise.race([
      getDatabasePool().query('SELECT 1 AS ok'),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(Object.assign(new Error('MySQL health check timed out'), { code: 'MYSQL_HEALTH_TIMEOUT' })),
          env.mysql.connectionTimeoutMs,
        )
      }),
    ])
  } catch (error) {
    databaseStatus = 'disconnected'
    throw error
  } finally {
    clearTimeout(timer)
  }
  return true
}

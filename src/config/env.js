import { config as loadEnv } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
if (process.env.NODE_ENV !== 'production') {
  loadEnv({ path: resolve(backendRoot, '.env'), quiet: true })
}
loadEnv({ quiet: true })

const emptyStringToUndefined = (value) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value
const optionalString = z.preprocess(emptyStringToUndefined, z.string().trim().optional())

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.preprocess(emptyStringToUndefined, z.string().trim().default('0.0.0.0')),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MYSQL_HOST: z.preprocess(emptyStringToUndefined, z.string().trim().default('localhost')),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.preprocess(emptyStringToUndefined, z.string().trim().default('dynamicw_dynamicworld')),
  MYSQL_USER: z.preprocess(emptyStringToUndefined, z.string().trim().default('dynamicw_dynamicworlddata')),
  MYSQL_PASSWORD: optionalString,
  MYSQL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MYSQL_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  API_BASE_URL: optionalString,
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid backend environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const data = parsed.data
const apiBaseUrl = (data.API_BASE_URL || `http://localhost:${data.PORT}/api`).replace(/\/+$/, '')
const configuredCorsOrigins = data.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
const defaultOrigins = [
  'https://dynamicworld.online',
  'http://dynamicworld.online',
  'https://www.dynamicworld.online',
  'http://www.dynamicworld.online',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
]

export const env = {
  nodeEnv: data.NODE_ENV,
  host: data.HOST,
  port: data.PORT,
  corsOrigin: data.CORS_ORIGIN,
  corsOrigins: [...new Set([...configuredCorsOrigins, ...defaultOrigins])],
  mysql: {
    host: data.MYSQL_HOST,
    port: data.MYSQL_PORT,
    database: data.MYSQL_DATABASE,
    user: data.MYSQL_USER,
    password: data.MYSQL_PASSWORD,
    connectionTimeoutMs: data.MYSQL_CONNECTION_TIMEOUT_MS,
    connectionLimit: data.MYSQL_CONNECTION_LIMIT,
  },
  apiBaseUrl,
}

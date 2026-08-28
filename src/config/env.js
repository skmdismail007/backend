import { config as loadEnv } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const configDir = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(configDir, '../..')

// Load .env for local development/test.
// Render production uses process.env directly.
if (process.env.NODE_ENV !== 'production') {
  loadEnv({
    path: resolve(backendRoot, '.env'),
    quiet: true,
  })

  loadEnv({
    quiet: true,
  })
}

const emptyStringToUndefined = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined
  }

  return value
}

const optionalString = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().optional(),
)

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  HOST: z
    .preprocess(
      emptyStringToUndefined,
      z.string().trim(),
    )
    .default('0.0.0.0'),

  PORT: z
    .coerce
    .number()
    .int()
    .positive()
    .default(4000),

  CORS_ORIGIN: z
    .string()
    .default(
      'http://localhost:5173,http://localhost:5174',
    ),

  MONGODB_URI: optionalString,

  API_BASE_URL: optionalString,

  MONGODB_CONNECTION_TIMEOUT_MS: z
    .coerce
    .number()
    .int()
    .positive()
    .default(10000),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid backend environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const data = parsed.data

const apiBaseUrl = (
  data.API_BASE_URL ||
  `http://localhost:${data.PORT}/api`
).replace(/\/+$/, '')

const configuredCorsOrigins = data.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const localOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

export const env = {
  nodeEnv: data.NODE_ENV,

  host: data.HOST,

  port: data.PORT,

  corsOrigin: data.CORS_ORIGIN,

  corsOrigins: [
    ...new Set([
      ...configuredCorsOrigins,
      ...localOrigins,
    ]),
  ],

  mongodbUri: data.MONGODB_URI,

  mongodbConnectionTimeoutMs:
    data.MONGODB_CONNECTION_TIMEOUT_MS,

  apiBaseUrl,
}
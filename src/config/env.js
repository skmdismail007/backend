import { config as loadEnv } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const configDir = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(configDir, '../..')

loadEnv({ path: resolve(backendRoot, '.env') })
loadEnv()

const emptyStringToUndefined = (value) => {
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

const optionalString = z.preprocess(emptyStringToUndefined, z.string().trim().optional())

function normalizeStorageBucket(value) {
  return String(value || '')
    .trim()
    .replace(/^gs:\/\//i, '')
    .replace(/^https:\/\/storage\.googleapis\.com\//i, '')
    .replace(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\//i, '')
    .replace(/\/.*$/, '')
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
  FIREBASE_API_KEY: z.string().default('AIzaSyCJ3dtb_nv5zstIVtRgbDbvoJQE7e3cPN4'),
  FIREBASE_AUTH_DOMAIN: z.string().default('ebackend-66bde.firebaseapp.com'),
  FIREBASE_PROJECT_ID: z.string().default('ebackend-66bde'),
  FIREBASE_STORAGE_BUCKET: z.string().default('ebackend-66bde.firebasestorage.app').transform(normalizeStorageBucket),
  FIREBASE_DATABASE_URL: optionalString,
  FIREBASE_MESSAGING_SENDER_ID: z.string().default('172774872527'),
  FIREBASE_APP_ID: z.string().default('1:172774872527:web:a1ed1f7ca9c0499aff6eba'),
  FIREBASE_MEASUREMENT_ID: z.string().default('G-5EDHEHCKQN'),
  FIREBASE_SERVICE_ACCOUNT_JSON: optionalString,
  FIREBASE_CLIENT_EMAIL: optionalString,
  FIREBASE_PRIVATE_KEY: optionalString,
  FIREBASE_SERVICE_ACCOUNT_KEY_PATH: z
    .preprocess(emptyStringToUndefined, z.string().trim().default('./ebackend-66bde-firebase-adminsdk-fbsvc-ddb0ba6ae5.json')),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid backend environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  corsOrigin: parsed.data.CORS_ORIGIN,
  corsOrigins: [
    ...new Set([
      ...parsed.data.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean),
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ]),
  ],
  firebase: {
    apiKey: parsed.data.FIREBASE_API_KEY,
    authDomain: parsed.data.FIREBASE_AUTH_DOMAIN,
    projectId: parsed.data.FIREBASE_PROJECT_ID,
    storageBucket: parsed.data.FIREBASE_STORAGE_BUCKET,
    databaseURL: parsed.data.FIREBASE_DATABASE_URL || `https://${parsed.data.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
    messagingSenderId: parsed.data.FIREBASE_MESSAGING_SENDER_ID,
    appId: parsed.data.FIREBASE_APP_ID,
    measurementId: parsed.data.FIREBASE_MEASUREMENT_ID,
    serviceAccountJson: parsed.data.FIREBASE_SERVICE_ACCOUNT_JSON,
    clientEmail: parsed.data.FIREBASE_CLIENT_EMAIL,
    privateKey: parsed.data.FIREBASE_PRIVATE_KEY,
    serviceAccountKeyPath: parsed.data.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
  },
}

import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
  FIREBASE_API_KEY: z.string().min(1, 'FIREBASE_API_KEY is required'),
  FIREBASE_AUTH_DOMAIN: z.string().min(1, 'FIREBASE_AUTH_DOMAIN is required'),
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, 'FIREBASE_STORAGE_BUCKET is required'),
  FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'FIREBASE_MESSAGING_SENDER_ID is required'),
  FIREBASE_APP_ID: z.string().min(1, 'FIREBASE_APP_ID is required'),
  FIREBASE_MEASUREMENT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY_PATH: z.string().default('./firebase-service-account-key.json'),
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
  firebase: {
    apiKey: parsed.data.FIREBASE_API_KEY,
    authDomain: parsed.data.FIREBASE_AUTH_DOMAIN,
    projectId: parsed.data.FIREBASE_PROJECT_ID,
    storageBucket: parsed.data.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: parsed.data.FIREBASE_MESSAGING_SENDER_ID,
    appId: parsed.data.FIREBASE_APP_ID,
    measurementId: parsed.data.FIREBASE_MEASUREMENT_ID,
    serviceAccountKeyPath: parsed.data.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
  },
}

import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
  FIREBASE_API_KEY: z.string().default('AIzaSyCJ3dtb_nv5zstIVtRgbDbvoJQE7e3cPN4'),
  FIREBASE_AUTH_DOMAIN: z.string().default('ebackend-66bde.firebaseapp.com'),
  FIREBASE_PROJECT_ID: z.string().default('ebackend-66bde'),
  FIREBASE_STORAGE_BUCKET: z.string().default('ebackend-66bde.firebasestorage.app'),
  FIREBASE_MESSAGING_SENDER_ID: z.string().default('172774872527'),
  FIREBASE_APP_ID: z.string().default('1:172774872527:web:a1ed1f7ca9c0499aff6eba'),
  FIREBASE_MEASUREMENT_ID: z.string().default('G-5EDHEHCKQN'),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
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
    serviceAccountJson: parsed.data.FIREBASE_SERVICE_ACCOUNT_JSON,
    clientEmail: parsed.data.FIREBASE_CLIENT_EMAIL,
    privateKey: parsed.data.FIREBASE_PRIVATE_KEY,
    serviceAccountKeyPath: parsed.data.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
  },
}

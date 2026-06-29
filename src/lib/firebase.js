import admin from 'firebase-admin'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'

const libDir = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(libDir, '../..')

function findBundledServiceAccountPath() {
  try {
    const match = readdirSync(backendRoot).find((fileName) =>
      /^.+-firebase-adminsdk-.+\.json$/i.test(fileName),
    )
    return match ? resolve(backendRoot, match) : ''
  } catch {
    return ''
  }
}

function getServiceAccountKeyPathCandidates() {
  const configuredPath = env.firebase.serviceAccountKeyPath
  const candidates = []

  if (configuredPath) {
    candidates.push(
      isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath),
      isAbsolute(configuredPath) ? configuredPath : resolve(backendRoot, configuredPath),
    )
  }

  const discoveredPath = findBundledServiceAccountPath()
  if (discoveredPath) candidates.push(discoveredPath)

  return [...new Set(candidates)]
}

function normalizePrivateKey(privateKey) {
  return privateKey?.replace(/\\n/g, '\n')
}

function parseServiceAccountJson(json) {
  return JSON.parse(json.replace(/\\n/g, '\n'))
}

function hasApplicationDefaultCredentials() {
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
}

function getCredential() {
  if (env.firebase.serviceAccountJson) {
    return admin.credential.cert(parseServiceAccountJson(env.firebase.serviceAccountJson))
  }

  if (env.firebase.clientEmail && env.firebase.privateKey) {
    return admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: normalizePrivateKey(env.firebase.privateKey),
    })
  }

  const serviceAccountKeyPath = getServiceAccountKeyPathCandidates().find((candidate) => existsSync(candidate))
  if (serviceAccountKeyPath) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountKeyPath, 'utf8'))
    return admin.credential.cert(serviceAccount)
  }

  if (hasApplicationDefaultCredentials()) {
    return admin.credential.applicationDefault()
  }

  throw new Error(
    'Firebase Admin credentials are required. Set FIREBASE_SERVICE_ACCOUNT_JSON, ' +
      'FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, GOOGLE_APPLICATION_CREDENTIALS, ' +
      'or FIREBASE_SERVICE_ACCOUNT_KEY_PATH.',
  )
}

function initializeFirebaseAdmin() {
  if (admin.apps.length) return admin.app()

  if (!env.firebase.storageBucket) {
    throw new Error('FIREBASE_STORAGE_BUCKET is required for Firebase Storage uploads.')
  }

  if (!env.firebase.databaseURL) {
    throw new Error('FIREBASE_DATABASE_URL is required for Firebase Realtime Database.')
  }

  return admin.initializeApp({
    credential: getCredential(),
    projectId: env.firebase.projectId,
    databaseURL: env.firebase.databaseURL,
    storageBucket: env.firebase.storageBucket,
  })
}

export const firebaseApp = initializeFirebaseAdmin()
export const realtimeDb = admin.database()
export const auth = admin.auth()
export const storage = admin.storage()
export const storageBucketName = env.firebase.storageBucket
export const isRealtimeDatabaseConfigured = Boolean(env.firebase.databaseURL)
export const isStorageConfigured = Boolean(env.firebase.storageBucket)

export default admin

/**
 * Firebase Admin SDK Initialization
 * Connects to Firebase Firestore for real-time database operations
 */

import admin from 'firebase-admin'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { env } from '../config/env.js'

const serviceAccountKeyPath = resolve(process.cwd(), env.firebase.serviceAccountKeyPath)

const hasAdminCredential = Boolean(
  env.firebase.serviceAccountJson ||
    (env.firebase.clientEmail && env.firebase.privateKey) ||
    existsSync(serviceAccountKeyPath) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
)

export const isFirestoreConfigured = hasAdminCredential

export const isRealtimeDatabaseConfigured = Boolean(env.firebase.databaseURL && hasAdminCredential)

function normalizePrivateKey(privateKey) {
  return privateKey?.replace(/\\n/g, '\n')
}

function getCredential() {
  if (env.firebase.serviceAccountJson) {
    return admin.credential.cert(JSON.parse(env.firebase.serviceAccountJson))
  }

  if (env.firebase.clientEmail && env.firebase.privateKey) {
    return admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: normalizePrivateKey(env.firebase.privateKey),
    })
  }

  if (existsSync(serviceAccountKeyPath)) {
    return admin.credential.cert(JSON.parse(readFileSync(serviceAccountKeyPath, 'utf8')))
  }

  return admin.credential.applicationDefault()
}

try {
  admin.initializeApp({
    credential: getCredential(),
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    databaseURL: env.firebase.databaseURL,
  })

  admin.app()
  console.log('✓ Firebase Admin SDK initialized successfully')
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message)
  console.error('\nTo fix this:')
  console.error('1. Go to Firebase Console: https://console.firebase.google.com')
  console.error('2. Select project:', env.firebase.projectId)
  console.error('3. Go to Project Settings → Service Accounts')
  console.error('4. Click "Generate New Private Key"')
  console.error('5. For Render, add FIREBASE_SERVICE_ACCOUNT_JSON with the full JSON key')
  console.error('6. For local dev, save the JSON file as: firebase-service-account-key.json')
  process.exit(1)
}

// Get Firestore database instance
export const db = admin.firestore()

// Get Realtime Database instance
export const realtimeDb = admin.database()

// Get Authentication instance
export const auth = admin.auth()

// Get Storage instance
export const storage = admin.storage()

// Export admin for other uses
export default admin

/**
 * Database Collections:
 * - products: Product catalog
 * - services: Service offerings
 * - customers: Customer profiles
 * - orders: Order history
 * - cart: Shopping cart items
 * - wishlist: Customer wishlists
 * - admins: Admin users and permissions
 */

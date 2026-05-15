/**
 * Firebase Admin SDK Initialization
 * Connects to Firebase Firestore for real-time database operations
 */

import admin from 'firebase-admin'
import { env } from '../config/env.js'

// Check if service account key file exists
let app

try {
  // Initialize Firebase Admin SDK with service account
  admin.initializeApp({
    projectId: env.firebase.projectId,
  })

  app = admin.app()
  console.log('✓ Firebase Admin SDK initialized successfully')
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message)
  console.error('\nTo fix this:')
  console.error('1. Go to Firebase Console: https://console.firebase.google.com')
  console.error('2. Select project:', env.firebase.projectId)
  console.error('3. Go to Project Settings → Service Accounts')
  console.error('4. Click "Generate New Private Key"')
  console.error('5. Save the JSON file as: firebase-service-account-key.json')
  console.error('6. Place it in the backend root directory')
  process.exit(1)
}

// Get Firestore database instance
export const db = admin.firestore()

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

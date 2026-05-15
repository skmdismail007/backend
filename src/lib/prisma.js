/**
 * DEPRECATED: Prisma ORM has been removed.
 * The backend now uses Firebase Firestore for database operations.
 * 
 * Migration Information:
 * - All database queries now use Firebase Admin SDK
 * - See src/lib/firebase.js for Firebase initialization
 * - Import `db` from src/lib/firebase.js instead
 * 
 * Example:
 * OLD: import { prisma } from '../lib/prisma.js'
 *      const product = await prisma.product.findUnique({ where: { id } })
 * 
 * NEW: import { db } from '../lib/firebase.js'
 *      const productRef = db.collection('products').doc(id)
 *      const product = await productRef.get()
 */

// This file is kept for reference only. Use Firebase instead.
export const prisma = null


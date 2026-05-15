/**
 * DEPRECATED: Supabase integration has been removed.
 * The backend now uses Firebase Firestore for database operations.
 * 
 * Migration Information:
 * - All database queries now use Firebase Admin SDK
 * - See src/lib/firebase.js for Firebase initialization
 * - Import `db` from src/lib/firebase.js instead
 * 
 * Example:
 * OLD: import { supabase } from '../lib/supabase.js'
 * NEW: import { db } from '../lib/firebase.js'
 */

// This file is kept for reference only. Use Firebase instead.
export const supabase = null
export const supabaseAdmin = null


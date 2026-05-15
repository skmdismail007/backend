/**
 * Product Service - Firebase Implementation
 * Handles all product-related database operations
 */

import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

/**
 * List all products with optional filtering and sorting
 * @param {Object} filters - { category, search, sort }
 * @returns {Promise<Array>} Array of products
 */
export async function listProducts(filters = {}) {
  if (!isFirestoreConfigured) return fallbackStore.listProducts(filters)

  try {
    let query = db.collection('products').where('isActive', '==', true)

    // Filter by category if provided
    if (filters.category) {
      query = query.where('category', '==', filters.category)
    }

    // Execute query
    const snapshot = await query.get()
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Search filter (client-side since Firestore doesn't support full-text search)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      products = products.filter(p =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower) ||
        p.short?.toLowerCase().includes(searchLower) ||
        p.details?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    if (filters.sort === 'price-low') {
      products.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (filters.sort === 'price-high') {
      products.sort((a, b) => (b.price || 0) - (a.price || 0))
    } else {
      products.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    }

    return products
  } catch (error) {
    console.error('Error listing products:', error)
    return fallbackStore.listProducts(filters)
  }
}

/**
 * Get a single product by ID
 * @param {string} id - Product document ID
 * @returns {Promise<Object|null>} Product object or null
 */
export async function getProductById(id) {
  if (!isFirestoreConfigured) return fallbackStore.getProduct(id)

  try {
    const doc = await db.collection('products').doc(id).get()

    if (!doc.exists) {
      return fallbackStore.getProduct(id)
    }

    return {
      id: doc.id,
      ...doc.data(),
    }
  } catch (error) {
    console.error('Error getting product:', error)
    return fallbackStore.getProduct(id)
  }
}

/**
 * Create a new product
 * @param {Object} data - Product data
 * @returns {Promise<Object>} Created product with ID
 */
export async function createProduct(data) {
  if (!isFirestoreConfigured) return fallbackStore.saveProduct(data)

  try {
    const productData = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await db.collection('products').add(productData)

    return {
      id: docRef.id,
      ...productData,
    }
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Update an existing product
 * @param {string} id - Product document ID
 * @param {Object} data - Updated product data
 * @returns {Promise<Object>} Updated product
 */
export async function updateProduct(id, data) {
  if (!isFirestoreConfigured) return fallbackStore.saveProduct(data, id)

  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    await db.collection('products').doc(id).update(updateData)

    return {
      id,
      ...updateData,
    }
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

/**
 * Delete a product (soft delete by marking as inactive)
 * @param {string} id - Product document ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteProduct(id) {
  if (!isFirestoreConfigured) return fallbackStore.deleteProduct(id)

  try {
    await db.collection('products').doc(id).update({
      isActive: false,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

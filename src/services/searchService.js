/**
 * Search Service - Firebase Implementation
 * Handles searching across products and services
 */

import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

/**
 * Search catalog for products and services
 * @param {string} query - Search query
 * @returns {Promise<Object>} { products: [], services: [] }
 */
export async function searchCatalog(query) {
  const search = query.trim()

  if (!search) {
    return { products: [], services: [] }
  }

  if (!isFirestoreConfigured) {
    const products = (await fallbackStore.listProducts({ search })).slice(0, 8)
    const services = (await fallbackStore.listServices())
      .filter(item =>
        [item.name, item.category, item.description]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .slice(0, 8)
    return { products, services }
  }

  try {
    const searchLower = search.toLowerCase()

    // Search products
    const productSnapshot = await db
      .collection('products')
      .where('isActive', '==', true)
      .get()

    const products = productSnapshot.docs
      .filter(doc => {
        const data = doc.data()
        return (
          data.name?.toLowerCase().includes(searchLower) ||
          data.category?.toLowerCase().includes(searchLower) ||
          data.short?.toLowerCase().includes(searchLower)
        )
      })
      .slice(0, 8)
      .map(doc => ({ id: doc.id, ...doc.data() }))

    // Search services
    const serviceSnapshot = await db
      .collection('services')
      .where('isActive', '==', true)
      .get()

    const services = serviceSnapshot.docs
      .filter(doc => {
        const data = doc.data()
        return (
          data.name?.toLowerCase().includes(searchLower) ||
          data.category?.toLowerCase().includes(searchLower) ||
          data.description?.toLowerCase().includes(searchLower)
        )
      })
      .slice(0, 8)
      .map(doc => ({ id: doc.id, ...doc.data() }))

    return { products, services }
  } catch (error) {
    console.error('Error searching catalog:', error)
    // Fallback to local store
    const products = (await fallbackStore.listProducts({ search })).slice(0, 8)
    const services = (await fallbackStore.listServices())
      .filter(item =>
        [item.name, item.category, item.description]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .slice(0, 8)
    return { products, services }
  }
}

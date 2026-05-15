/**
 * Service Service - Firebase Implementation
 * Handles all service-related database operations
 */

import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

/**
 * List all active services
 * @returns {Promise<Array>} Array of services
 */
export async function listServices() {
  if (!isFirestoreConfigured) return fallbackStore.listServices()

  try {
    const snapshot = await db
      .collection('services')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error listing services:', error)
    return fallbackStore.listServices()
  }
}

/**
 * Get a single service by ID
 * @param {string} id - Service document ID
 * @returns {Promise<Object|null>} Service object or null
 */
export async function getServiceById(id) {
  if (!isFirestoreConfigured) return fallbackStore.getService(id)

  try {
    const doc = await db.collection('services').doc(id).get()

    if (!doc.exists) {
      return fallbackStore.getService(id)
    }

    return {
      id: doc.id,
      ...doc.data(),
    }
  } catch (error) {
    console.error('Error getting service:', error)
    return fallbackStore.getService(id)
  }
}

/**
 * Create a new service
 * @param {Object} data - Service data
 * @returns {Promise<Object>} Created service with ID
 */
export async function createService(data) {
  if (!isFirestoreConfigured) return fallbackStore.saveService(data)

  try {
    const serviceData = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await db.collection('services').add(serviceData)

    return {
      id: docRef.id,
      ...serviceData,
    }
  } catch (error) {
    console.error('Error creating service:', error)
    throw error
  }
}

/**
 * Update an existing service
 * @param {string} id - Service document ID
 * @param {Object} data - Updated service data
 * @returns {Promise<Object>} Updated service
 */
export async function updateService(id, data) {
  if (!isFirestoreConfigured) return fallbackStore.saveService(data, id)

  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    await db.collection('services').doc(id).update(updateData)

    return {
      id,
      ...updateData,
    }
  } catch (error) {
    console.error('Error updating service:', error)
    throw error
  }
}

/**
 * Delete a service (soft delete)
 * @param {string} id - Service document ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteService(id) {
  if (!isFirestoreConfigured) return fallbackStore.deleteService(id)

  try {
    await db.collection('services').doc(id).update({
      isActive: false,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error('Error deleting service:', error)
    throw error
  }
}

/**
 * Service Service - Firebase Implementation
 * Handles all service-related database operations
 */

import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export const DEFAULT_SERVICE_IMAGE =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80'

function normalizeServicePayload(data) {
  return {
    ...data,
    category: data.category?.trim() || 'Website',
    timeline: data.timeline?.trim() || 'Custom timeline',
    image: data.image?.trim() || DEFAULT_SERVICE_IMAGE,
    deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
    isActive: data.isActive ?? true,
  }
}

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
  const normalized = normalizeServicePayload(data)
  if (!isFirestoreConfigured) return fallbackStore.saveService(normalized)

  try {
    const serviceData = {
      ...normalized,
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
    return fallbackStore.saveService(normalized)
  }
}

/**
 * Update an existing service
 * @param {string} id - Service document ID
 * @param {Object} data - Updated service data
 * @returns {Promise<Object>} Updated service
 */
export async function updateService(id, data) {
  const normalized = normalizeServicePayload(data)
  if (!isFirestoreConfigured) return fallbackStore.saveService(normalized, id)

  try {
    const updateData = {
      ...normalized,
      updatedAt: new Date(),
    }

    await db.collection('services').doc(id).update(updateData)

    return {
      id,
      ...updateData,
    }
  } catch (error) {
    console.error('Error updating service:', error)
    return fallbackStore.saveService(normalized, id)
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

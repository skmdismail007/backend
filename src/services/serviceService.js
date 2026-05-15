import { prisma } from '../lib/prisma.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export async function listServices() {
  try {
    return await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return fallbackStore.listServices()
  }
}

export async function getServiceById(id) {
  try {
    return await prisma.service.findUniqueOrThrow({
      where: { id },
    })
  } catch {
    return fallbackStore.getService(id)
  }
}

export async function createService(data) {
  try {
    return await prisma.service.create({
      data,
    })
  } catch {
    return fallbackStore.saveService(data)
  }
}

export async function updateService(id, data) {
  try {
    return await prisma.service.update({
      where: { id },
      data,
    })
  } catch {
    return fallbackStore.saveService(data, id)
  }
}

export async function deleteService(id) {
  try {
    return await prisma.service.update({
      where: { id },
      data: { isActive: false },
    })
  } catch {
    return fallbackStore.deleteService(id)
  }
}

import { prisma } from '../lib/prisma.js'
import { fallbackStore } from '../lib/fallbackStore.js'

function buildProductWhere({ category, search }) {
  return {
    isActive: true,
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
            { short: { contains: search, mode: 'insensitive' } },
            { details: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
}

function buildProductOrder(sort) {
  if (sort === 'price-low') return { price: 'asc' }
  if (sort === 'price-high') return { price: 'desc' }
  return { createdAt: 'desc' }
}

export async function listProducts(filters = {}) {
  try {
    return await prisma.product.findMany({
      where: buildProductWhere(filters),
      orderBy: buildProductOrder(filters.sort),
    })
  } catch {
    return fallbackStore.listProducts(filters)
  }
}

export async function getProductById(id) {
  try {
    return await prisma.product.findUniqueOrThrow({
      where: { id },
    })
  } catch {
    return fallbackStore.getProduct(id)
  }
}

export async function createProduct(data) {
  try {
    return await prisma.product.create({
      data,
    })
  } catch {
    return fallbackStore.saveProduct(data)
  }
}

export async function updateProduct(id, data) {
  try {
    return await prisma.product.update({
      where: { id },
      data,
    })
  } catch {
    return fallbackStore.saveProduct(data, id)
  }
}

export async function deleteProduct(id) {
  try {
    return await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
  } catch {
    return fallbackStore.deleteProduct(id)
  }
}

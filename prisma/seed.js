import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFile } from 'node:fs/promises'

const prisma = new PrismaClient()
const catalogPath = new URL('../data/catalog.json', import.meta.url)

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category || 'CCTV',
    price: product.price || 0,
    badge: product.badge,
    image: product.image,
    short: product.short || product.description || product.details || product.name,
    details: product.details || product.description || product.short || product.name,
    specs: product.specs || [],
    includes: product.includes || [],
    isActive: true,
  }
}

function normalizeService(service) {
  return {
    id: service.id,
    name: service.name,
    category: service.category || 'Website',
    price: service.price || 0,
    timeline: service.timeline,
    description: service.description || service.text || service.name,
    image: Array.isArray(service.images) ? service.images[0] : service.image,
    deliverables: service.deliverables || service.features || [],
    isActive: true,
  }
}

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))

  for (const product of catalog.products || []) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: normalizeProduct(product),
      create: normalizeProduct(product),
    })
  }

  for (const service of catalog.services || []) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: normalizeService(service),
      create: normalizeService(service),
    })
  }

  console.log('Seed complete')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

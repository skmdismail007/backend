import { prisma } from '../lib/prisma.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export async function searchCatalog(query) {
  const search = query.trim()

  if (!search) {
    return { products: [], services: [] }
  }

  let products
  let services

  try {
    ;[products, services] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
            { short: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 8,
      }),
      prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
        take: 8,
      }),
    ])
  } catch {
    const query = search.toLowerCase()
    products = (await fallbackStore.listProducts({ search })).slice(0, 8)
    services = (await fallbackStore.listServices())
      .filter((item) =>
        [item.name, item.category, item.description].join(' ').toLowerCase().includes(query),
      )
      .slice(0, 8)
  }

  return { products, services }
}

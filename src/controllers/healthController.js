import { prisma } from '../lib/prisma.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export async function getHealth(_request, response) {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.json({
      status: 'ok',
      service: 'akiwa-backend',
      database: 'connected',
    })
  } catch {
    response.json(await fallbackStore.health())
  }
}

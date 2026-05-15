import { db, isFirestoreConfigured } from '../lib/firebase.js'
import { fallbackStore } from '../lib/fallbackStore.js'

export async function getHealth(_request, response) {
  if (!isFirestoreConfigured) {
    response.json(await fallbackStore.health())
    return
  }

  try {
    await db.collection('_health').limit(1).get()
    response.json({
      status: 'ok',
      service: 'akiwa-backend',
      database: 'firestore',
    })
  } catch {
    response.json(await fallbackStore.health())
  }
}

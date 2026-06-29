import { realtimeDb, storageBucketName } from '../lib/firebase.js'

export async function getHealth(_request, response) {
  await realtimeDb.ref('_health').limitToFirst(1).once('value')
  response.json({
    status: 'ok',
    service: 'akiwa-backend',
    database: 'realtime-database',
    storageBucket: storageBucketName,
  })
}

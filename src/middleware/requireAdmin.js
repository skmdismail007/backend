import { auth, realtimeDb } from '../lib/firebase.js'

function unauthorized(message = 'Admin authentication required') {
  return Object.assign(new Error(message), { statusCode: 401 })
}

function forbidden(message = 'Admin access denied') {
  return Object.assign(new Error(message), { statusCode: 403 })
}

function getBearerToken(request) {
  const header = request.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return ''
  return token
}

export async function requireAdmin(request, _response, next) {
  try {
    const token = getBearerToken(request)
    if (!token) throw unauthorized()

    const decodedToken = await auth.verifyIdToken(token)
    if (decodedToken.admin === true) {
      request.admin = decodedToken
      next()
      return
    }

    const adminSnapshot = await realtimeDb.ref(`admins/${decodedToken.uid}`).once('value')
    const adminRecord = adminSnapshot.val()
    const hasAdminRole =
      adminRecord?.active !== false &&
      ['admin', 'owner', 'editor'].includes(String(adminRecord?.role || '').toLowerCase())

    if (!hasAdminRole) throw forbidden()

    request.admin = {
      ...decodedToken,
      role: adminRecord.role,
    }
    next()
  } catch (error) {
    next(error.statusCode ? error : unauthorized('Invalid or expired admin session'))
  }
}

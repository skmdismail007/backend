import { getSiteSettings } from './siteSettingsService.js'

function getCleanPhone(phoneStr) {
  const raw = (phoneStr || '').replace(/\D/g, '')
  if (!raw) return ''
  if (raw.length === 10) return `91${raw}`
  return raw
}

export function formatOrderWhatsAppText(order = {}) {
  const orderId = order.id || order.trackingNumber || `ORD-${Date.now()}`
  const customerName =
    order.address?.fullName || order.name || order.customerName || 'Valued Customer'
  const rawPhone = (order.address?.phone || order.phone || '').replace(/\D/g, '')
  const customerPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : rawPhone ? `+${rawPhone}` : 'N/A'
  const customerEmail = order.email || 'N/A'
  const address = order.address

  const addressLine = address
    ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.pinCode ? '- ' + address.pinCode : ''}`.trim()
    : order.note || 'N/A'

  const items = order.items || []
  const itemsText = items
    .map((item, idx) => {
      const price = Number(item.price || 0)
      const qty = Number(item.quantity || 1)
      const itemTotal = price * qty
      return `${idx + 1}. *${item.name}*\n   ▫️ Quantity: *${qty}* | Price: ₹${price.toLocaleString('en-IN')} | Total: *₹${itemTotal.toLocaleString('en-IN')}*`
    })
    .join('\n\n')

  const subtotal = Number(order.subtotal || order.total || 0).toLocaleString('en-IN')
  const total = Number(order.total || 0).toLocaleString('en-IN')
  const discount = Number(order.discount || 0)
  const coupon = order.couponCode ? ` (${order.couponCode})` : ''
  const paymentLabel = order.payment?.label || order.payment?.method?.toUpperCase() || 'UPI / Online'
  const utr = order.payment?.upi?.utr || 'N/A'

  let msg = `🛍️ *NEW ORDER RECEIVED*\n`
  msg += `─────────────────────────\n\n`
  msg += `👤 *CUSTOMER INFORMATION*\n`
  msg += `• *Name:* ${customerName}\n`
  msg += `• *Email:* ${customerEmail}\n`
  msg += `• *Phone:* ${customerPhone}\n`
  msg += `• *Address:* ${addressLine}\n\n`
  msg += `─────────────────────────\n\n`
  msg += `📋 *ORDER DETAILS*\n`
  msg += `• *Order ID:* #${orderId}\n\n`
  msg += `📦 *ITEM(S) ORDERED:*\n`
  msg += `${itemsText || '1x Order Package'}\n\n`
  msg += `─────────────────────────\n\n`
  msg += `💳 *PAYMENT & BILLING*\n`
  msg += `• *Payment Method:* ${paymentLabel}\n`
  msg += `• *UPI Transaction ID (UTR):* ${utr}\n`
  msg += `• *Subtotal:* ₹${subtotal}\n`
  if (discount > 0) {
    msg += `• *Discount${coupon}:* -₹${discount.toLocaleString('en-IN')}\n`
  }
  msg += `• *Grand Total:* *₹${total}*\n\n`
  msg += `─────────────────────────\n`
  msg += `✨ *Sent automatically from DAYNAMIC Web Store.*`

  return msg
}

export async function sendWhatsAppMessage({
  provider = 'ultramsg',
  instanceId = '',
  token = '',
  to = '',
  message = '',
  customUrl = '',
}) {
  const cleanTo = getCleanPhone(to)
  if (!cleanTo) {
    throw new Error('Valid destination phone number is required (e.g. 918444009399).')
  }
  if (!message) {
    throw new Error('Message text cannot be empty.')
  }

  const selectedProvider = (provider || (token?.startsWith('wag_') ? 'fireclashpro' : 'fireclashpro')).toLowerCase()

  // 1. FireclashPro / WaApi Gateway (https://waapi.fireclashpro.com)
  if (selectedProvider === 'fireclashpro' || selectedProvider === 'waapi' || token?.startsWith('wag_')) {
    const apiKey = token || 'wag_live_o3cBCM3oJk0vIbl-GJ22cAyuvz0CJg--YqbMS6s_SmU'
    const endpoint = customUrl || 'https://waapi.fireclashpro.com/api/v1/messages/send'
    const sessionId = instanceId || '1317576'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey.trim(),
      },
      body: JSON.stringify({
        session_id: sessionId.trim(),
        recipient: cleanTo,
        message,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.error || (data.status && data.status !== 'success' && !data.id && !data.message_id && !data.success)) {
      throw new Error(data.message || data.error || `WaApi FireclashPro returned status ${response.status}`)
    }
    return { success: true, provider: 'fireclashpro', data }
  }

  // 2. UltraMsg Gateway (https://ultramsg.com)
  if (selectedProvider === 'ultramsg') {
    if (!instanceId || !token) {
      throw new Error('UltraMsg requires Instance ID and Token.')
    }
    const endpoint = `https://api.ultramsg.com/${instanceId.trim()}/messages/chat`
    const params = new URLSearchParams()
    params.append('token', token.trim())
    params.append('to', cleanTo)
    params.append('body', message)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.error) {
      throw new Error(data.error || data.message || `UltraMsg returned status ${response.status}`)
    }
    return { success: true, provider: 'ultramsg', data }
  }

  // 3. Green API Gateway (https://green-api.com)
  if (selectedProvider === 'greenapi') {
    if (!instanceId || !token) {
      throw new Error('Green API requires Instance ID and API Token.')
    }
    const endpoint = `https://api.green-api.com/waInstance${instanceId.trim()}/sendMessage/${token.trim()}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${cleanTo}@c.us`,
        message,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.error) {
      throw new Error(data.error || `Green API returned status ${response.status}`)
    }
    return { success: true, provider: 'greenapi', data }
  }

  // 4. Meta WhatsApp Cloud API (Graph API)
  if (selectedProvider === 'meta') {
    if (!instanceId || !token) {
      throw new Error('Meta Cloud API requires Phone Number ID (Instance ID) and Access Token.')
    }
    const endpoint = `https://graph.facebook.com/v19.0/${instanceId.trim()}/messages`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'text',
        text: { body: message },
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `Meta API returned status ${response.status}`)
    }
    return { success: true, provider: 'meta', data }
  }

  // 5. Custom Webhook / Telnyx / Generic API
  if (selectedProvider === 'custom') {
    const targetUrl = customUrl || `https://api.ultramsg.com/${instanceId}/messages/chat`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
      },
      body: JSON.stringify({
        to: cleanTo,
        message,
        text: message,
        instanceId,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(`Custom webhook returned HTTP status ${response.status}`)
    }
    return { success: true, provider: 'custom', data }
  }

  throw new Error(`Unsupported WhatsApp provider: ${provider}`)
}

export async function sendOrderWhatsAppNotification(order) {
  try {
    const settings = await getSiteSettings()
    const isEnabled = settings.enableWhatsappNotifications !== false
    const provider = settings.whatsappGatewayProvider || 'fireclashpro'
    const instanceId = settings.whatsappGatewayInstanceId || '1317576'
    const token = settings.whatsappGatewayToken || 'wag_live_o3cBCM3oJk0vIbl-GJ22cAyuvz0CJg--YqbMS6s_SmU'
    const masterPhone = (settings.whatsappNumber || settings.contactPhone || '').trim()

    if (!isEnabled) {
      console.log('[WhatsApp Gateway] Background notification skipped (Disabled in settings).')
      return { skipped: true }
    }

    if (!masterPhone) {
      console.log('[WhatsApp Gateway] Background notification skipped (No Admin WhatsApp number configured in settings).')
      return { skipped: true }
    }

    const messageText = formatOrderWhatsAppText(order)

    const result = await sendWhatsAppMessage({
      provider,
      instanceId,
      token,
      to: masterPhone,
      message: messageText,
      customUrl: settings.whatsappGatewayUrl,
    })

    console.log('[WhatsApp Gateway] Background order notification delivered successfully:', result)
    return result
  } catch (error) {
    console.error('[WhatsApp Gateway] Background notification error:', error.message)
    return { error: error.message }
  }
}

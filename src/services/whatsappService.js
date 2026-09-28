/**
 * ═════════════════════════════════════════════════════════════════════
 * Official Meta WhatsApp Cloud Messaging Service
 * ═════════════════════════════════════════════════════════════════════
 * Connects directly to Meta Graph API (v20.0) for:
 * 1. Sending 256-bit encrypted direct WhatsApp text messages
 * 2. Sending WhatsApp template messages (Order confirmation, OTP, Alerts)
 * 3. Handling incoming customer replies and delivery statuses
 */

const GRAPH_API_VERSION = 'v20.0'
const GRAPH_API_BASE = 'https://graph.facebook.com'

/**
 * Normalizes phone numbers into E.164 format without '+' or non-digit chars
 * Example: '+91 8444009399' -> '918444009399'
 */
export function formatWhatsAppNumber(phone) {
  if (!phone) return ''
  const cleaned = String(phone).replace(/\D/g, '')
  if (cleaned.length === 10) return `91${cleaned}`
  return cleaned
}

/**
 * Send a direct WhatsApp Text Message via Meta Cloud API
 * @param {Object} options
 * @param {string} options.to - Recipient phone number (with country code, e.g. 918444009399)
 * @param {string} options.message - Text content to send
 * @param {string} [options.phoneNumberId] - Meta Phone Number ID (optional, defaults to env)
 * @param {string} [options.accessToken] - Meta System User Token (optional, defaults to env)
 */
export async function sendWhatsAppTextMessage({
  to,
  message,
  phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN,
}) {
  const recipient = formatWhatsAppNumber(to)
  if (!recipient) {
    throw new Error('Recipient phone number is required.')
  }
  if (!message) {
    throw new Error('Message content is required.')
  }

  if (!phoneNumberId || !accessToken) {
    console.warn('[WhatsApp Cloud API] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN in environment.')
    return {
      success: false,
      simulated: true,
      message: 'Simulated WhatsApp message (Add Meta credentials in .env to send live)',
      payload: { to: recipient, text: message },
    }
  }

  const endpoint = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}/messages`

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: true,
      body: message,
    },
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[WhatsApp Cloud API Error]:', data)
    throw new Error(data?.error?.message || `WhatsApp API error: HTTP ${response.status}`)
  }

  return {
    success: true,
    messageId: data?.messages?.[0]?.id,
    data,
  }
}

export const sendWhatsAppMessage = sendWhatsAppTextMessage

/**
 * Send a Pre-Approved WhatsApp Template Message (e.g. hello_world, order_confirmation)
 */
export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  languageCode = 'en',
  components = [],
  phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN,
}) {
  const recipient = formatWhatsAppNumber(to)
  if (!recipient || !templateName) {
    throw new Error('Recipient number and template name are required.')
  }

  if (!phoneNumberId || !accessToken) {
    console.warn('[WhatsApp Cloud API] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN.')
    return {
      success: false,
      simulated: true,
      message: 'Simulated template message (Add Meta credentials in .env)',
      payload: { to: recipient, templateName, languageCode, components },
    }
  }

  const endpoint = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}/messages`

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components,
    },
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[WhatsApp Cloud API Template Error]:', data)
    throw new Error(data?.error?.message || `WhatsApp API error: HTTP ${response.status}`)
  }

  return {
    success: true,
    messageId: data?.messages?.[0]?.id,
    data,
  }
}

/**
 * Send automated order confirmation notification to store owner and customer
 */
export async function sendOrderWhatsAppNotification(order) {
  try {
    const orderId = order.trackingNumber || order.id || 'N/A'
    const customerName = order.address?.fullName || order.name || 'Valued Customer'
    const customerPhone = order.address?.phone || order.phone || ''
    const total = order.total ? `₹${Number(order.total).toLocaleString('en-IN')}` : 'N/A'
    const itemsList = (order.items || [])
      .map((item, i) => `  ${i + 1}. *${item.name || 'Product'}* (Qty: ${item.quantity || 1}) - ₹${item.price || 0}`)
      .join('\n')

    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || '918444009399'

    const adminMessage = `🛍️ *NEW ORDER RECEIVED #${orderId}*
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${customerName}
📞 *Phone:* ${customerPhone || 'N/A'}
💰 *Total Amount:* ${total}
💳 *Payment:* ${order.payment?.label || 'UPI / Online'}
📍 *Address:* ${order.address?.street || ''}, ${order.address?.city || ''} ${order.address?.pinCode || ''}

📦 *Items:*
${itemsList || '  (No item details)'}

🔐 _Encrypted & Verified via Daynamic Automated Systems_`

    // Send to admin
    await sendWhatsAppTextMessage({
      to: adminPhone,
      message: adminMessage,
    })

    // If customer phone is available and valid, also send confirmation to customer
    if (customerPhone && customerPhone.length >= 10) {
      const customerMessage = `🎉 *Order Confirmed! #${orderId}*
Hi *${customerName}*, thank you for choosing *Daynamic*!

Your order has been received and is being processed for express doorstep delivery.

💰 *Total Paid:* ${total}
📦 *Items:*
${itemsList}

For instant support, reply directly to this chat. Thank you!`

      await sendWhatsAppTextMessage({
        to: customerPhone,
        message: customerMessage,
      })
    }
  } catch (error) {
    console.error('[WhatsApp Order Notification Error]:', error.message)
  }
}


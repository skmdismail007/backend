import { Router } from 'express'
import {
  sendWhatsAppTextMessage,
  sendWhatsAppTemplateMessage,
  formatWhatsAppNumber,
} from '../services/whatsappService.js'

const router = Router()

/**
 * ── 1. SEND DIRECT WHATSAPP MESSAGE ──────────────────────────────────────────
 * POST /api/whatsapp/send
 * Body: { to: '918444009399', message: 'Hello from Daynamic!', templateName?: '...' }
 */
router.post('/send', async (req, res, next) => {
  try {
    const { to, message, templateName, languageCode, components } = req.body || {}

    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number (to) is required.' })
    }

    if (templateName) {
      const result = await sendWhatsAppTemplateMessage({
        to,
        templateName,
        languageCode,
        components,
      })
      return res.json({ success: true, result })
    }

    if (!message) {
      return res.status(400).json({ error: 'Message content or templateName is required.' })
    }

    const result = await sendWhatsAppTextMessage({ to, message })
    res.json({ success: true, result })
  } catch (error) {
    next(error)
  }
})

/**
 * ── 2. META WEBHOOK VERIFICATION (GET) ───────────────────────────────────────
 * GET /api/whatsapp/webhook
 * Meta Developer Dashboard sends a GET request with hub.mode, hub.verify_token, hub.challenge
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'daynamic_whatsapp_verify_token_2026'

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Meta Webhook Verified Successfully]')
    return res.status(200).send(challenge)
  }

  console.warn('[Meta Webhook Verification Failed]: Token mismatch')
  res.sendStatus(403)
})

/**
 * ── 3. META WEBHOOK LISTENER (POST) ──────────────────────────────────────────
 * POST /api/whatsapp/webhook
 * Receives live notifications for incoming customer messages, delivery & read receipts
 */
router.post('/webhook', (req, res) => {
  const body = req.body

  if (body.object === 'whatsapp_business_account') {
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    // Inbound Messages from customer
    const messages = value?.messages
    if (messages && messages.length > 0) {
      const message = messages[0]
      const from = message.from
      const text = message.text?.body || message.type
      console.log(`[Inbound WhatsApp from ${from}]:`, text)
    }

    // Message Status Update (sent, delivered, read, failed)
    const statuses = value?.statuses
    if (statuses && statuses.length > 0) {
      const status = statuses[0]
      console.log(`[WhatsApp Delivery Status]: ${status.id} -> ${status.status}`)
    }

    return res.status(200).send('EVENT_RECEIVED')
  }

  res.sendStatus(404)
})

/**
 * ── 4. WHATSAPP SYSTEM HEALTH & CONFIG STATUS ─────────────────────────────────
 * GET /api/whatsapp/status
 */
router.get('/status', (_req, res) => {
  const configured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    (process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN)
  )

  res.json({
    status: 'ok',
    service: 'meta-whatsapp-cloud-api',
    version: 'v20.0',
    configured,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Configured (Hidden)' : 'Not Set',
    verifyTokenConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
  })
})

export default router

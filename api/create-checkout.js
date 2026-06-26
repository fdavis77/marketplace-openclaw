// api/create-checkout.js
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase-admin.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString()
        resolve(raw ? JSON.parse(raw) : {})
      } catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body
  try {
    body = (req.body && typeof req.body === 'object') ? req.body : await parseJsonBody(req)
  } catch { return res.status(400).json({ error: 'Invalid request body' }) }

  const { items, userId } = body

  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items provided' })
  if (!userId) return res.status(401).json({ error: 'User ID required' })

  const paidItems = items.filter(item => Number(item.price) > 0)
  if (paidItems.length === 0) return res.status(400).json({ error: 'No paid items in cart' })

  const slugs = paidItems.map(item => String(item.id))

  const { data: plugins, error: dbError } = await supabaseAdmin
    .from('plugins')
    .select('id, slug, name, price')
    .in('slug', slugs)
    .eq('status', 'published')

  if (dbError || !plugins || plugins.length === 0) return res.status(400).json({ error: 'Could not verify plugin details' })

  for (const item of paidItems) {
    const dbPlugin = plugins.find(p => p.slug === item.id)
    if (!dbPlugin) return res.status(400).json({ error: `Plugin not found: ${item.id}` })
    if (Math.abs(Number(dbPlugin.price) - Number(item.price)) > 0.001) {
      return res.status(400).json({ error: `Price mismatch for: ${item.id}` })
    }
  }

  const lineItems = paidItems.map(item => {
    const dbPlugin = plugins.find(p => p.slug === item.id)
    return {
      price_data: {
        currency: 'gbp',
        product_data: { name: dbPlugin.name },
        unit_amount: Math.round(Number(dbPlugin.price) * 100),
      },
      quantity: 1,
    }
  })

  let session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace`,
      metadata: { userId, pluginSlugs: JSON.stringify(slugs) },
    })
  } catch (err) {
    console.error('Stripe session creation failed:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }

  return res.status(200).json({ url: session.url })
}

// api/webhook.js
//
// Troubleshooting: If webhook verification fails with
// "No signatures found matching the expected signature",
// @vercel/node may have pre-consumed the body.
// Fix: add "bodyParser": false to the function config in vercel.json
// under "functions" → "api/webhook.js" (already set in this project).
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase-admin.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' })

  let event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true })
  }

  const session = event.data.object
  const { userId, pluginSlugs } = session.metadata ?? {}

  if (!userId || !pluginSlugs) {
    console.error('Missing metadata on session:', session.id)
    return res.status(200).json({ received: true })
  }

  let slugs
  try { slugs = JSON.parse(pluginSlugs) } catch (err) {
    console.error('Invalid pluginSlugs JSON for session:', session.id, err.message)
    return res.status(200).json({ received: true })
  }

  const { data: plugins, error: dbError } = await supabaseAdmin
    .from('plugins')
    .select('id, slug, price')
    .in('slug', slugs)

  if (dbError || !plugins) {
    console.error('DB lookup failed:', dbError)
    return res.status(200).json({ received: true })
  }

  for (const slug of slugs) {
    const plugin = plugins.find(p => p.slug === slug)
    if (!plugin) { console.error('No plugin found for slug:', slug); continue }

    const { error: insertError } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: userId,
        plugin_id: plugin.id,
        stripe_session_id: session.id,
        amount_paid: Number(plugin.price),
        currency: session.currency,
      })

    // '23505' = Postgres unique_violation — safe to ignore on webhook retry
    if (insertError && insertError.code !== '23505') {
      console.error('Purchase insert failed for slug', slug, ':', insertError)
    }
  }

  return res.status(200).json({ received: true })
}

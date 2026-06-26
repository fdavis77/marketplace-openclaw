/* ═══════════════════════════════════════════════════════════
   MARKETPLACE OPENCLAW RAW — auth.js
   Browser Supabase client. ANON key is public by design —
   RLS policies are the security layer, not key secrecy.
═══════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

const { createClient } = window.supabase
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getUser() {
  const { data: { user } } = await window.supabaseClient.auth.getUser()
  return user
}

async function signIn(email, password) {
  const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

async function signUp(email, password) {
  const { data, error } = await window.supabaseClient.auth.signUp({ email, password })
  if (error) throw error
  return data
}

async function doSignOut() {
  await window.supabaseClient.auth.signOut()
  window.location.href = '/'
}

async function updateAuthNav() {
  const authNav = document.getElementById('authNav')
  if (!authNav) return

  const user = await getUser()

  if (user) {
    authNav.innerHTML = `
      <span style="font-size:12px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.email}</span>
      <button class="btn-ghost" onclick="doSignOut()" style="font-size:12px;padding:6px 12px;">Sign Out</button>
    `
  } else {
    authNav.innerHTML = `
      <a href="/login" class="btn-ghost" style="font-size:13px;padding:6px 14px;display:inline-block;">Sign In</a>
    `
  }
}

document.addEventListener('DOMContentLoaded', updateAuthNav)

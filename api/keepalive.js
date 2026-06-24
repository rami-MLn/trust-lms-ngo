// Keep-alive endpoint — pinged by a Vercel Cron job so the Supabase free-tier
// database never hits 7 days of inactivity (which would pause it). Does a tiny,
// harmless read against user_registry. Also reachable manually at /api/keepalive.
module.exports = async (req, res) => {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'supabase-env-missing' })
  }

  try {
    const r = await fetch(`${url}/rest/v1/user_registry?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return res.status(200).json({
      ok: r.ok,
      supabaseStatus: r.status,
      pingedAt: new Date().toISOString(),
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) })
  }
}

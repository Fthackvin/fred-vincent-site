/* ============================================================
   /api/cron-rebuild — triggered by Vercel Cron once per day.

   The cron schedule lives in vercel.json. When it fires, Vercel
   POSTs to this endpoint. The handler simply forwards a POST to
   the project's Deploy Hook URL (set as DEPLOY_HOOK_URL in the
   Vercel project's environment variables), which queues a fresh
   build — that build runs scripts/build-rss.js and picks up any
   new Substack pieces.

   Setup checklist (one-time):
     1. In Vercel → Project Settings → Git → Deploy Hooks,
        create a hook named e.g. "Daily RSS refresh" targeting
        the production branch. Copy the URL.
     2. In Vercel → Project Settings → Environment Variables,
        add DEPLOY_HOOK_URL = <that URL> for Production.
     3. (Optional) Add CRON_SECRET as an env var and Vercel will
        attach an Authorization header to cron requests so this
        endpoint can reject random callers.

   If DEPLOY_HOOK_URL isn't set, the endpoint returns 500 and the
   cron logs in Vercel will surface the misconfiguration.
   ============================================================ */

export default async function handler(req, res) {
  // Light protection: if CRON_SECRET is configured, require it.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const hookUrl = process.env.DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return res.status(500).json({
      error: 'DEPLOY_HOOK_URL is not configured in environment variables.',
    });
  }

  try {
    const r = await fetch(hookUrl, { method: 'POST' });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      return res.status(502).json({
        error: `Deploy hook returned ${r.status}`,
        body: body.slice(0, 200),
      });
    }
    return res.status(200).json({
      ok: true,
      triggeredAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

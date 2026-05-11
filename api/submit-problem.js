/* ============================================================
   /api/submit-problem — proxy for the "Send me a problem" form.

   The browser POSTs JSON to this endpoint instead of hitting
   Formspree directly. The endpoint reads FORMSPREE_ENDPOINT from
   the environment and forwards the submission. This keeps the
   actual Formspree URL out of the static HTML — it lives only in
   the Vercel project's environment variables.

   Setup (one-time, in Vercel):
     Project Settings → Environment Variables → add
       FORMSPREE_ENDPOINT = https://formspree.io/f/xojrynlq
     for the Production environment (and Preview if you want
     branch builds to work too).

   Honeypot: if the `_gotcha` field is populated, the request is
   silently 200'd without forwarding — bots are filtered without
   ever knowing they were blocked.
   ============================================================ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const endpoint = process.env.FORMSPREE_ENDPOINT;
  if (!endpoint) {
    console.error('[submit-problem] FORMSPREE_ENDPOINT is not configured.');
    return res.status(500).json({ error: 'Form endpoint not configured' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Silent honeypot — bots fill this in. Return 200 so they don't retry.
  if (body._gotcha) {
    return res.status(200).json({ ok: true });
  }

  // Drop the honeypot from the forwarded payload.
  const { _gotcha, ...payload } = body;

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('[submit-problem] upstream', upstream.status, data);
      return res
        .status(upstream.status)
        .json({ error: data?.error || data?.errors || 'Submission failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[submit-problem] fetch failed:', err);
    return res.status(500).json({ error: 'Submission failed' });
  }
}

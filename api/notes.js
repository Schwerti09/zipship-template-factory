export default async function handler(req, res) {
  const now = new Date().toISOString();
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.VITE_SUPABASE_URL;
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    ok: true,
    platform: "vercel",
    hint: "Set SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL to extend this to real server-side Supabase queries.",
    env: { VITE_SUPABASE_URL_present: hasUrl, SUPABASE_SERVICE_ROLE_KEY_present: hasService },
    now
  });
}

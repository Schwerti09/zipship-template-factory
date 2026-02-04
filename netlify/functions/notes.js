exports.handler = async function () {
  const now = new Date().toISOString();
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.VITE_SUPABASE_URL;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      platform: "netlify",
      hint: "Set SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL to extend this to real server-side Supabase queries.",
      env: { VITE_SUPABASE_URL_present: hasUrl, SUPABASE_SERVICE_ROLE_KEY_present: hasService },
      now
    })
  };
};

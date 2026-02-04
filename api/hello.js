export default function handler(req, res) {
  const now = new Date().toISOString();
  const secret = process.env.SECRET_TOKEN ? "present" : "missing";
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=10");
  res.status(200).json({ ok: true, platform: "vercel", route: req.url, secret_token: secret, now });
}

exports.handler = async function (event) {
  const now = new Date().toISOString();
  const secret = process.env.SECRET_TOKEN ? "present" : "missing";
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=10" },
    body: JSON.stringify({ ok: true, platform: "netlify", route: event.path, secret_token: secret, now })
  };
};

# ZipShip Template Factory (Vercel + Netlify)

Realistischer Deploy-Stresstest:
- Build (Vite → dist/)
- SPA Routing (Deep Links + Reload)
- Serverless API (/api/hello, /api/notes)
- Optional: Auth/DB via Supabase
- Env Vars (Build vs Runtime)
- Assets + Cache-Headers

## Lokal
```bash
npm install
npm run dev
```

## Supabase (optional)
SQL in README + Env Vars in `.env.example`.
Ohne Supabase läuft alles im Mock Mode.

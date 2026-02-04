import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase.js";

const ROUTES = [
  { path: "/", title: "Home" },
  { path: "/about", title: "About" },
  { path: "/notes", title: "Notes" },
  { path: "/settings", title: "Settings" },
];

function matchRoute(pathname) {
  return ROUTES.find((r) => r.path === pathname) || null;
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (to) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, "", to);
    setPath(to);
  };
  return { path, navigate };
}

async function fetchJson(url, opts) {
  const res = await fetch(url, { ...opts, headers: { Accept: "application/json", ...(opts?.headers || {}) } });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : { ok: false, error: "non-json response", text: await res.text() };
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export default function App() {
  const { path, navigate } = usePath();
  const route = matchRoute(path);

  const buildStamp = useMemo(() => new Date().toISOString(), []);
  const publicMsg = import.meta.env.VITE_PUBLIC_MESSAGE || "";

  const [session, setSession] = useState(null);
  const [authErr, setAuthErr] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const [api, setApi] = useState({ loading: true, ok: false, data: null, err: "" });

  useEffect(() => {
    let cancelled = false;
    setApi({ loading: true, ok: false, data: null, err: "" });
    fetchJson("/api/hello")
      .then((data) => !cancelled && setApi({ loading: false, ok: true, data, err: "" }))
      .catch((e) => !cancelled && setApi({ loading: false, ok: false, data: null, err: e?.message || String(e) }));
    return () => { cancelled = true; };
  }, [path]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => setSession(sess));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  async function signInOtp() {
    if (!supabase) return;
    setBusy(true); setAuthErr("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert("Magic Link gesendet. Check deine Mail.");
    } catch (e) {
      setAuthErr(e?.message || String(e));
    } finally { setBusy(false); }
  }

  async function signInPassword() {
    if (!supabase) return;
    setBusy(true); setAuthErr("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
    } catch (e) {
      setAuthErr(e?.message || String(e));
    } finally { setBusy(false); }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  // Notes
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [notesErr, setNotesErr] = useState("");
  const [notesBusy, setNotesBusy] = useState(false);

  async function loadNotes() {
    setNotesErr("");
    if (!supabase || !session) {
      setNotes([{ id: "mock-1", title: "Mock Note", body: "Setze Supabase Env Vars, dann wird’s echt.", created_at: new Date().toISOString() }]);
      return;
    }
    setNotesBusy(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id,title,body,created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (e) { setNotesErr(e?.message || String(e)); }
    finally { setNotesBusy(false); }
  }

  async function addNote() {
    setNotesErr("");
    if (!supabase || !session) {
      setNotes((n) => [{ id: "mock-" + Math.random().toString(16).slice(2), title: noteTitle || "Untitled", body: noteBody || "", created_at: new Date().toISOString() }, ...n]);
      setNoteTitle(""); setNoteBody("");
      return;
    }
    setNotesBusy(true);
    try {
      const { error } = await supabase.from("notes").insert({ user_id: session.user.id, title: noteTitle || "Untitled", body: noteBody || "" });
      if (error) throw error;
      setNoteTitle(""); setNoteBody("");
      await loadNotes();
    } catch (e) { setNotesErr(e?.message || String(e)); }
    finally { setNotesBusy(false); }
  }

  async function deleteNote(id) {
    setNotesErr("");
    if (!supabase || !session) {
      setNotes((n) => n.filter((x) => x.id !== id));
      return;
    }
    setNotesBusy(true);
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", session.user.id);
      if (error) throw error;
      await loadNotes();
    } catch (e) { setNotesErr(e?.message || String(e)); }
    finally { setNotesBusy(false); }
  }

  useEffect(() => { if (path === "/notes") loadNotes(); /* eslint-disable-next-line */ }, [path, session?.user?.id]);

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <img className="logo" src="/assets/logo.svg" alt="Logo" />
          <div>
            <div className="brandTitle">Template Factory</div>
            <div className="brandSub">Build + SPA + API + Auth/DB</div>
          </div>
        </div>
        <nav className="nav">
          {ROUTES.map((r) => (
            <a key={r.path} href={r.path} className={path === r.path ? "active" : ""}
              onClick={(e) => { e.preventDefault(); navigate(r.path); }}>
              {r.title}
            </a>
          ))}
        </nav>
      </header>

      <main className="main">
        <section className="hero">
          <img className="heroImg" src="/assets/hero.svg" alt="Hero" />
          <div className="heroOverlay">
            <div className="row">
              <span className="pill accent">Deploy Stress-Test</span>
              {!supabase ? <span className="pill warn">Mock Mode</span> : <span className="pill ok">Supabase Ready</span>}
              {session ? <span className="pill ok">Signed In</span> : <span className="pill muted">Signed Out</span>}
            </div>
            <h1>ZIP → Repo → Deploy</h1>
            <p>Reload auf Deep Links, check die API, setz Env Vars.</p>
            <div className="row">
              <button className="btn" onClick={() => window.location.reload()}>Reload</button>
              <a className="btn ghost" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>
        </section>

        <section className="grid">
          <article className="card">
            <h2>SPA Routing</h2>
            <p>Aktuelle Route: <code>{path}</code> {route ? "" : "(unbekannt)"} — Reload auf /about oder /notes.</p>
            <p className="hint">Wenn das bricht, fehlt der Fallback: Netlify Redirects / Vercel Rewrites.</p>
          </article>

          <article className="card">
            <h2>API</h2>
            {api.loading ? <p>Lade <code>/api/hello</code>…</p> : api.ok ? (
              <>
                <p className="ok">✅ API antwortet.</p>
                <pre className="pre">{JSON.stringify(api.data, null, 2)}</pre>
              </>
            ) : (
              <>
                <p className="bad">❌ API Fehler: <code>{api.err}</code></p>
                <p className="hint">Typisch: Rewrite/Fallback kapert /api.</p>
              </>
            )}
          </article>

          <article className="card">
            <h2>Env Vars</h2>
            <p>Build Env: <code>VITE_PUBLIC_MESSAGE</code> = <code>{publicMsg || "(nicht gesetzt)"}</code></p>
            <p className="hint">Setze Env Vars im Host und redeploy.</p>
          </article>
        </section>

        {path === "/about" && (
          <section className="panel">
            <h2>About</h2>
            <p>Prod-nah: Build, Routing, API, optional Auth/DB, Assets + Cache-Headers.</p>
          </section>
        )}

        {path === "/settings" && (
          <section className="panel">
            <h2>Settings</h2>
            <p className="hint">Auth/DB via Supabase (optional). Ohne Env Vars: Mock Mode.</p>
            <div className="split">
              <div className="box">
                <h3>Login (Magic Link)</h3>
                <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@domain.tld" />
                <button className="btn small" disabled={!supabase || busy || !email} onClick={signInOtp}>Magic Link senden</button>
              </div>
              <div className="box">
                <h3>Login (Passwort)</h3>
                <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@domain.tld" />
                <input value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="Passwort" type="password" />
                <button className="btn small" disabled={!supabase || busy || !email || !pw} onClick={signInPassword}>Einloggen</button>
              </div>
              <div className="box">
                <h3>Session</h3>
                {session ? (
                  <>
                    <div className="hint">User: <code>{session.user.email}</code></div>
                    <button className="btn ghost small" onClick={signOut}>Logout</button>
                  </>
                ) : <div className="hint">Nicht eingeloggt.</div>}
              </div>
            </div>
            {authErr ? <p className="bad">Auth Fehler: <code>{authErr}</code></p> : null}
          </section>
        )}

        {path === "/notes" && (
          <section className="panel">
            <h2>Notes</h2>
            <p className="hint">Supabase: echte Notes (RLS). Ohne Supabase: Mock Notes.</p>

            <div className="noteForm">
              <input value={noteTitle} onChange={(e)=>setNoteTitle(e.target.value)} placeholder="Titel" />
              <textarea value={noteBody} onChange={(e)=>setNoteBody(e.target.value)} placeholder="Text…" rows={4} />
              <div className="row">
                <button className="btn small" disabled={notesBusy} onClick={addNote}>Note speichern</button>
                <button className="btn ghost small" disabled={notesBusy} onClick={loadNotes}>Neu laden</button>
              </div>
              {notesErr ? <p className="bad">Notes Fehler: <code>{notesErr}</code></p> : null}
            </div>

            <div className="notesList">
              {notes.map((n) => (
                <div className="note" key={n.id}>
                  <div className="noteTop">
                    <div className="noteTitle">{n.title}</div>
                    <button className="x" onClick={() => deleteNote(n.id)} title="löschen">×</button>
                  </div>
                  <div className="noteBody">{n.body}</div>
                  <div className="noteMeta"><code>{n.created_at}</code></div>
                </div>
              ))}
              {!notes.length ? <div className="hint">Keine Notes.</div> : null}
            </div>

            <div className="hint" style={{marginTop: 10}}>
              Serverless Demo: <code>/api/notes</code> (zeigt Env Präsenz).
            </div>
          </section>
        )}

        <footer className="footer">
          <span>Build: <code>{buildStamp}</code></span>
          <span className="dot">•</span>
          <span>Assets: <code>/assets/*</code></span>
          <span className="dot">•</span>
          <span>API: <code>/api/hello</code></span>
        </footer>
      </main>
    </div>
  );
}

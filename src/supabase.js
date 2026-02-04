import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// If not configured: app runs in Mock Mode.
export const supabase = url && anon ? createClient(url, anon, { auth: { persistSession: true } }) : null;

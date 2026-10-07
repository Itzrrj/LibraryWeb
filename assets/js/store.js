// Data layer: Supabase when configured, the browser's localStorage in demo mode.
import { CONFIG } from "./config.js";
import { DEFAULT_CONTENT } from "./content-default.js";

export const isDemo = !CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey;

const LS_CONTENT = "ivl_demo_content";
const LS_ENQUIRIES = "ivl_demo_enquiries";
const LS_SESSION = "ivl_demo_session";
const BUCKET = "media";

let clientPromise;
function client() {
  if (isDemo) return null;
  if (!clientPromise) {
    clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(
      ({ createClient }) => createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey)
    );
  }
  return clientPromise;
}

const clone = (v) => JSON.parse(JSON.stringify(v));
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// Saved values win; objects are merged key by key, arrays are replaced whole.
export function mergeDefaults(def, saved) {
  if (!isObj(def) || !isObj(saved)) return saved === undefined ? clone(def) : clone(saved);
  const out = clone(def);
  for (const [k, v] of Object.entries(saved)) {
    out[k] = isObj(def[k]) && isObj(v) ? mergeDefaults(def[k], v) : clone(v);
  }
  return out;
}

const readLS = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export function defaults() {
  return clone(DEFAULT_CONTENT);
}

export async function loadContent() {
  if (isDemo) return mergeDefaults(DEFAULT_CONTENT, readLS(LS_CONTENT, {}));
  try {
    const sb = await client();
    const { data, error } = await sb.from("site_content").select("data").eq("id", 1).maybeSingle();
    if (error) throw error;
    return mergeDefaults(DEFAULT_CONTENT, data?.data || {});
  } catch (e) {
    console.error("Could not load content, showing defaults", e);
    return defaults();
  }
}

export async function saveContent(content) {
  if (isDemo) return writeLS(LS_CONTENT, content);
  const sb = await client();
  const { error } = await sb
    .from("site_content")
    .upsert({ id: 1, data: content, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ---- Enquiries / seat requests ----
export async function submitEnquiry(enquiry) {
  const row = {
    name: String(enquiry.name || "").slice(0, 100),
    phone: String(enquiry.phone || "").slice(0, 20),
    plan: String(enquiry.plan || "").slice(0, 60),
    slot: String(enquiry.slot || "").slice(0, 60),
    seat: String(enquiry.seat || "").slice(0, 10),
    message: String(enquiry.message || "").slice(0, 1000),
  };
  if (isDemo) {
    const list = readLS(LS_ENQUIRIES, []);
    list.unshift({ ...row, id: Date.now(), status: "new", created_at: new Date().toISOString() });
    return writeLS(LS_ENQUIRIES, list);
  }
  const sb = await client();
  const { error } = await sb.from("enquiries").insert(row);
  if (error) throw error;
}

export async function listEnquiries() {
  if (isDemo) return readLS(LS_ENQUIRIES, []);
  const sb = await client();
  const { data, error } = await sb.from("enquiries").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw error;
  return data;
}

export async function updateEnquiry(id, fields) {
  if (isDemo) {
    writeLS(LS_ENQUIRIES, readLS(LS_ENQUIRIES, []).map((e) => (e.id === id ? { ...e, ...fields } : e)));
    return;
  }
  const sb = await client();
  const { error } = await sb.from("enquiries").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteEnquiry(id) {
  if (isDemo) {
    writeLS(LS_ENQUIRIES, readLS(LS_ENQUIRIES, []).filter((e) => e.id !== id));
    return;
  }
  const sb = await client();
  const { error } = await sb.from("enquiries").delete().eq("id", id);
  if (error) throw error;
}

// ---- Images ----
export async function uploadImage(file) {
  if (isDemo) {
    // Demo mode keeps small images inline so the preview works without a server.
    if (file.size > 600 * 1024) throw new Error("In demo mode images must be under 600 KB. Connect Supabase for bigger uploads.");
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  const sb = await client();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---- Admin auth ----
export async function getSession() {
  if (isDemo) return readLS(LS_SESSION, null);
  const sb = await client();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function signIn(email, password) {
  if (isDemo) {
    const s = { user: { email: email || "demo@local" } };
    writeLS(LS_SESSION, s);
    return s;
  }
  const sb = await client();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (isDemo) return localStorage.removeItem(LS_SESSION);
  const sb = await client();
  await sb.auth.signOut();
}

export async function isAdmin() {
  if (isDemo) return true;
  const sb = await client();
  const { data, error } = await sb.rpc("is_admin");
  if (error) return false;
  return data === true;
}

export async function changePassword(password) {
  if (isDemo) throw new Error("Password changes need Supabase to be connected.");
  const sb = await client();
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

import * as store from "./store.js";
import { ICON_NAMES, icon } from "./icons.js";

const $ = (s) => document.querySelector(s);

// Tiny element builder: h("div", {class: "x", onclick: fn}, child, "text")
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else if (k in el && k !== "list" && k !== "type") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}

// ---------------------------------------------------------------------------
// What the admin can edit. Each tab points at a part of the content object.
// Field types: text, textarea, number, bool, color, image, icon, url, strings, list
// ---------------------------------------------------------------------------
const show = { key: "show", label: "Show this section on the website", type: "bool" };
const titleFields = [
  { key: "title", label: "Section title", type: "text" },
  { key: "subtitle", label: "Section subtitle", type: "textarea", rows: 2 },
];

const TABS = [
  {
    id: "general", label: "Name, logo & colours", path: null,
    groups: [
      { path: "brand", title: "Library name", fields: [
        { key: "name", label: "Library name", type: "text" },
        { key: "tagline", label: "Tagline / quote", type: "text" },
        { key: "logo", label: "Logo (optional, replaces the default mark)", type: "image" },
      ]},
      { path: "theme", title: "Colours", fields: [
        { key: "primary", label: "Main colour (buttons, prices)", type: "color" },
        { key: "secondary", label: "Second colour (headings, dark sections)", type: "color" },
        { key: "accent", label: "Highlight colour", type: "color" },
      ]},
      { path: "meta", title: "Google search listing", fields: [
        { key: "title", label: "Page title", type: "text" },
        { key: "description", label: "Short description", type: "textarea", rows: 3 },
      ]},
    ],
  },
  {
    id: "offer", label: "Offer banner", path: "offer",
    fields: [
      { key: "show", label: "Show the offer banner at the top", type: "bool" },
      { key: "text", label: "Offer text", type: "textarea", rows: 2 },
      { key: "buttonText", label: "Button text (leave empty to hide)", type: "text" },
    ],
  },
  {
    id: "hero", label: "Top banner", path: "hero",
    fields: [
      { key: "eyebrow", label: "Small line above the heading", type: "text" },
      { key: "title", label: "Main heading", type: "text" },
      { key: "subtitle", label: "Text under the heading", type: "textarea", rows: 3 },
      { key: "primaryButton", label: "First button text", type: "text" },
      { key: "secondaryButton", label: "Second button text", type: "text" },
      { key: "image", label: "Photo (optional, replaces the seal graphic)", type: "image" },
      { key: "stats", label: "Highlight boxes", type: "list", itemLabel: (s) => s.value || "New box",
        newItem: () => ({ value: "", label: "" }),
        fields: [{ key: "value", label: "Big text", type: "text" }, { key: "label", label: "Small text", type: "text" }] },
    ],
  },
  {
    id: "highlights", label: "Why choose us", path: "highlights",
    fields: [show, ...titleFields,
      { key: "items", label: "Cards", type: "list", itemLabel: (s) => s.title || "New card",
        newItem: () => ({ icon: "star", title: "", text: "", featured: false }),
        fields: [
          { key: "icon", label: "Icon", type: "icon" },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Text", type: "textarea", rows: 2 },
          { key: "featured", label: "Highlight this card", type: "bool" },
        ] },
    ],
  },
  {
    id: "plans", label: "Plans & prices", path: "plans",
    fields: [show, ...titleFields,
      { key: "note", label: "Note under the plans (e.g. offer)", type: "text" },
      { key: "items", label: "Plans", type: "list", itemLabel: (p) => `${p.name || "New plan"} · ₹${p.price || "?"}`,
        newItem: () => ({ name: "", hours: "", price: "", period: "30 days", popular: false, features: [] }),
        fields: [
          { key: "name", label: "Plan name", type: "text" },
          { key: "hours", label: "Hours line", type: "text" },
          { key: "price", label: "Price in ₹ (numbers only)", type: "text" },
          { key: "period", label: "Validity", type: "text" },
          { key: "popular", label: "Mark as most popular", type: "bool" },
          { key: "features", label: "What's included (one per line)", type: "strings" },
        ] },
    ],
  },
  {
    id: "seats", label: "Seats & time slots", path: "seats", custom: "seats",
    fields: [show, ...titleFields,
      { key: "total", label: "Total number of seats", type: "number", min: 1, max: 500 },
      { key: "perRow", label: "Seats per row on the map", type: "number", min: 1, max: 20 },
      { key: "slots", label: "Time slots", type: "list", itemLabel: (s) => s.label || "New slot",
        newItem: () => ({ id: "s" + Date.now().toString(36), label: "" }),
        fields: [{ key: "label", label: "Slot name (e.g. 7 AM – 10 AM)", type: "text" }] },
    ],
  },
  {
    id: "facilities", label: "Facilities", path: "facilities",
    fields: [show, ...titleFields,
      { key: "items", label: "Facilities", type: "list", itemLabel: (s) => s.title || "New facility",
        newItem: () => ({ icon: "star", title: "" }),
        fields: [{ key: "icon", label: "Icon", type: "icon" }, { key: "title", label: "Name", type: "text" }] },
    ],
  },
  {
    id: "about", label: "About", path: "about",
    fields: [show,
      { key: "title", label: "Title", type: "text" },
      { key: "text", label: "Text (leave an empty line between paragraphs)", type: "textarea", rows: 8 },
      { key: "image", label: "Photo (optional)", type: "image" },
    ],
  },
  {
    id: "gallery", label: "Photo gallery", path: "gallery",
    note: "The gallery appears on the website once it has at least one photo.",
    fields: [show, { key: "title", label: "Section title", type: "text" },
      { key: "items", label: "Photos", type: "list", itemLabel: (g) => g.caption || "Photo",
        newItem: () => ({ image: "", caption: "" }),
        fields: [{ key: "image", label: "Photo", type: "image" }, { key: "caption", label: "Caption", type: "text" }] },
    ],
  },
  {
    id: "testimonials", label: "Student reviews", path: "testimonials",
    note: "Reviews appear on the website once you add at least one.",
    fields: [show, { key: "title", label: "Section title", type: "text" },
      { key: "items", label: "Reviews", type: "list", itemLabel: (t) => t.name || "New review",
        newItem: () => ({ name: "", role: "", text: "", photo: "" }),
        fields: [
          { key: "name", label: "Student name", type: "text" },
          { key: "role", label: "Preparing for / about", type: "text" },
          { key: "text", label: "Review", type: "textarea", rows: 3 },
          { key: "photo", label: "Photo (optional)", type: "image" },
        ] },
    ],
  },
  {
    id: "faq", label: "FAQ", path: "faq",
    fields: [show, { key: "title", label: "Section title", type: "text" },
      { key: "items", label: "Questions", type: "list", itemLabel: (f) => f.q || "New question",
        newItem: () => ({ q: "", a: "" }),
        fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea", rows: 3 }] },
    ],
  },
  {
    id: "contact", label: "Contact & footer", path: null,
    groups: [
      { path: "contact", title: "Contact details", fields: [
        show, ...titleFields,
        { key: "address", label: "Address", type: "textarea", rows: 3 },
        { key: "phones", label: "Phone numbers (one per line)", type: "strings" },
        { key: "whatsapp", label: "WhatsApp number with country code (empty hides WhatsApp)", type: "text" },
        { key: "email", label: "Email (optional)", type: "text" },
        { key: "hours", label: "Opening hours", type: "text" },
        { key: "mapQuery", label: "Google Maps search text (empty hides the map)", type: "text" },
        { key: "formTitle", label: "Form heading", type: "text" },
        { key: "formSuccess", label: "Message after the form is sent", type: "text" },
      ]},
      { path: "social", title: "Social links (leave empty to hide)", fields: [
        { key: "instagram", label: "Instagram link", type: "url" },
        { key: "facebook", label: "Facebook link", type: "url" },
        { key: "youtube", label: "YouTube link", type: "url" },
      ]},
      { path: "footer", title: "Footer", fields: [
        { key: "text", label: "Footer text", type: "textarea", rows: 2 },
        { key: "copyright", label: "Copyright line", type: "text" },
      ]},
    ],
  },
  { id: "enquiries", label: "Seat requests", special: "enquiries" },
  { id: "account", label: "Account & backup", special: "account" },
];

// ---------------------------------------------------------------------------
let content;
let dirty = false;
let current = "general";

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (isError ? " is-error" : "");
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 3500);
}

function markDirty() {
  dirty = true;
  $("#save-btn").disabled = false;
  $("#save-state").textContent = "Unsaved changes";
}

async function save() {
  const btn = $("#save-btn");
  btn.disabled = true;
  $("#save-state").textContent = "Saving…";
  try {
    await store.saveContent(content);
    dirty = false;
    $("#save-state").textContent = "All changes saved";
    toast("Saved. The website is updated.");
  } catch (e) {
    console.error(e);
    btn.disabled = false;
    $("#save-state").textContent = "Not saved";
    toast("Could not save: " + (e.message || e), true);
  }
}

// ---- Field renderers -------------------------------------------------------
function field(obj, f, rerender) {
  const set = (v) => { obj[f.key] = v; markDirty(); };
  const id = "f" + Math.random().toString(36).slice(2, 9);
  const label = h("label", { for: id }, f.label);

  switch (f.type) {
    case "bool":
      return h("label", { class: "check" },
        h("input", { type: "checkbox", checked: !!obj[f.key], onchange: (e) => set(e.target.checked) }),
        h("span", {}, f.label));
    case "textarea":
      return h("div", { class: "field" }, label,
        h("textarea", { id, rows: f.rows || 3, value: obj[f.key] ?? "", oninput: (e) => set(e.target.value) }));
    case "number":
      return h("div", { class: "field field-narrow" }, label,
        h("input", { id, type: "number", min: f.min, max: f.max, value: obj[f.key] ?? "",
          oninput: (e) => { set(e.target.value === "" ? "" : Number(e.target.value)); f.onChange?.(); } }));
    case "color":
      return h("div", { class: "field field-color" }, label,
        h("div", { class: "color-row" },
          h("input", { id, type: "color", value: obj[f.key] || "#000000", oninput: (e) => { set(e.target.value); e.target.nextSibling.value = e.target.value; } }),
          h("input", { type: "text", value: obj[f.key] || "", maxLength: 7, oninput: (e) => {
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { set(e.target.value); e.target.previousSibling.value = e.target.value; }
          } })));
    case "strings":
      return h("div", { class: "field" }, label,
        h("textarea", { id, rows: Math.max(3, (obj[f.key] || []).length + 1), value: (obj[f.key] || []).join("\n"),
          oninput: (e) => set(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)) }));
    case "icon": {
      const preview = h("span", { class: "icon-preview", html: icon(obj[f.key]) });
      return h("div", { class: "field" }, label,
        h("div", { class: "icon-row" }, preview,
          h("select", { id, onchange: (e) => { set(e.target.value); preview.innerHTML = icon(e.target.value); } },
            ICON_NAMES.map((n) => h("option", { value: n, selected: n === obj[f.key] }, n)))));
    }
    case "image":
      return imageField(obj, f, id, label, set);
    case "list":
      return listField(obj, f);
    default:
      return h("div", { class: "field" }, label,
        h("input", { id, type: f.type === "url" ? "url" : "text", value: obj[f.key] ?? "", placeholder: f.type === "url" ? "https://" : "",
          oninput: (e) => set(e.target.value) }));
  }
}

function imageField(obj, f, id, label, set) {
  const wrap = h("div", { class: "field" }, label);
  const draw = () => {
    const url = obj[f.key] || "";
    const fileInput = h("input", { type: "file", accept: "image/*", hidden: true, onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      upBtn.disabled = true;
      upBtn.textContent = "Uploading…";
      try {
        set(await store.uploadImage(file));
        draw();
      } catch (err) {
        toast("Upload failed: " + (err.message || err), true);
        upBtn.disabled = false;
        upBtn.textContent = "Upload photo";
      }
    } });
    const upBtn = h("button", { type: "button", class: "btn btn-small", onclick: () => fileInput.click() }, url ? "Change photo" : "Upload photo");
    wrap.replaceChildren(label,
      h("div", { class: "image-row" },
        url ? h("img", { src: url, alt: "", class: "thumb" }) : h("div", { class: "thumb thumb-empty" }, "No photo"),
        h("div", { class: "image-actions" },
          upBtn, fileInput,
          url ? h("button", { type: "button", class: "btn btn-small btn-ghost", onclick: () => { set(""); draw(); } }, "Remove") : null,
          h("input", { id, type: "text", class: "small-input", placeholder: "…or paste an image link", value: url.startsWith("data:") ? "" : url,
            onchange: (e) => { set(e.target.value.trim()); draw(); } }))));
  };
  draw();
  return wrap;
}

function listField(obj, f) {
  obj[f.key] = obj[f.key] || [];
  const arr = obj[f.key];
  const box = h("div", { class: "list" });
  const open = new Set();

  const draw = () => {
    box.replaceChildren(
      h("div", { class: "list-head" }, h("h3", {}, f.label), h("span", { class: "muted small" }, `${arr.length} item${arr.length === 1 ? "" : "s"}`)),
      ...arr.map((item, i) => {
        const titleEl = h("span", { class: "item-title" }, f.itemLabel(item));
        const body = h("div", { class: "item-body" },
          f.fields.map((sf) => {
            const el = field(item, sf, draw);
            el.addEventListener("input", () => (titleEl.textContent = f.itemLabel(item)));
            return el;
          }));
        const details = h("details", { class: "item", open: open.has(item),
          ontoggle: (e) => (e.target.open ? open.add(item) : open.delete(item)) },
          h("summary", {}, h("span", { class: "item-num" }, i + 1), titleEl,
            h("span", { class: "item-tools" },
              h("button", { type: "button", title: "Move up", disabled: i === 0, onclick: (e) => { e.preventDefault(); move(i, -1); } }, "↑"),
              h("button", { type: "button", title: "Move down", disabled: i === arr.length - 1, onclick: (e) => { e.preventDefault(); move(i, 1); } }, "↓"),
              h("button", { type: "button", title: "Delete", class: "danger", onclick: (e) => {
                e.preventDefault();
                if (confirm(`Delete "${f.itemLabel(item)}"?`)) { arr.splice(i, 1); markDirty(); draw(); f.onChange?.(); }
              } }, "✕"))),
          body);
        return details;
      }),
      h("button", { type: "button", class: "btn btn-ghost btn-small add-btn", onclick: () => {
        const item = f.newItem();
        arr.push(item);
        open.add(item);
        markDirty();
        draw();
        f.onChange?.();
      } }, "+ Add"));
  };
  const move = (i, d) => {
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    markDirty();
    draw();
    f.onChange?.();
  };
  draw();
  return box;
}

function fieldsCard(obj, fields, title, rerender) {
  return h("div", { class: "card" }, title ? h("h2", {}, title) : null, fields.map((f) => field(obj, f, rerender)));
}

// ---- Seat booking map ------------------------------------------------------
function seatsEditor() {
  const s = content.seats;
  s.booked = s.booked || {};
  const box = h("div", { class: "card" });
  let slot = s.slots[0]?.id;

  const draw = () => {
    if (!s.slots.some((x) => x.id === slot)) slot = s.slots[0]?.id;
    if (!slot) return box.replaceChildren(h("h2", {}, "Taken seats"), h("p", { class: "muted" }, "Add a time slot first."));
    const taken = new Set((s.booked[slot] || []).map(Number));
    const total = Math.max(0, Math.min(500, Number(s.total) || 0));
    const toggle = (n) => {
      taken.has(n) ? taken.delete(n) : taken.add(n);
      s.booked[slot] = [...taken].sort((a, b) => a - b);
      markDirty();
      draw();
    };
    box.replaceChildren(
      h("h2", {}, "Taken seats"),
      h("p", { class: "muted" }, "Pick a time slot, then tap seats to mark them taken or free. Students see taken seats greyed out."),
      h("div", { class: "slot-tabs" }, s.slots.map((x) =>
        h("button", { type: "button", class: "slot-tab" + (x.id === slot ? " is-on" : ""), onclick: () => { slot = x.id; draw(); } },
          x.label || "(unnamed)", h("small", {}, ` ${(s.booked[x.id] || []).filter((n) => n <= total).length}`)))),
      h("div", { class: "seat-grid", style: `--per-row:${Math.max(1, Number(s.perRow) || 8)}` },
        Array.from({ length: total }, (_, k) => k + 1).map((n) =>
          h("button", { type: "button", class: "seat" + (taken.has(n) ? " is-taken" : ""), onclick: () => toggle(n) }, n))),
      h("div", { class: "row-actions" },
        h("span", { class: "muted small" }, `${[...taken].filter((n) => n <= total).length} taken, ${total - [...taken].filter((n) => n <= total).length} free`),
        h("button", { type: "button", class: "btn btn-small btn-ghost", onclick: () => { s.booked[slot] = []; markDirty(); draw(); } }, "Clear this slot")));
  };
  draw();
  return { el: box, draw };
}

// ---- Enquiries -------------------------------------------------------------
async function enquiriesPanel(panel) {
  panel.replaceChildren(h("div", { class: "card" }, h("p", { class: "muted" }, "Loading…")));
  let rows;
  try {
    rows = await store.listEnquiries();
  } catch (e) {
    panel.replaceChildren(h("div", { class: "card" }, h("p", { class: "error" }, "Could not load requests: " + (e.message || e))));
    return;
  }
  const waNum = (p) => {
    const d = String(p).replace(/\D/g, "");
    return d.length === 10 ? "91" + d : d;
  };
  const statusSel = (r) =>
    h("select", { onchange: async (e) => {
      try { await store.updateEnquiry(r.id, { status: e.target.value }); r.status = e.target.value; toast("Status updated"); }
      catch (err) { toast("Could not update: " + err.message, true); }
    } }, ["new", "contacted", "joined", "closed"].map((s) => h("option", { value: s, selected: r.status === s }, s)));

  panel.replaceChildren(
    h("div", { class: "card" },
      h("div", { class: "list-head" }, h("h2", {}, "Seat requests & enquiries"),
        h("button", { type: "button", class: "btn btn-small btn-ghost", onclick: () => enquiriesPanel(panel) }, "Refresh")),
      rows.length === 0
        ? h("p", { class: "muted" }, "No requests yet. Requests sent from the website form appear here.")
        : h("div", { class: "table-wrap" }, h("table", { class: "table" },
            h("thead", {}, h("tr", {}, ["Date", "Name", "Phone", "Plan", "Slot", "Seat", "Message", "Status", ""].map((t) => h("th", {}, t)))),
            h("tbody", {}, rows.map((r) => h("tr", { class: r.status === "new" ? "is-new" : "" },
              h("td", { "data-l": "Date" }, new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })),
              h("td", { "data-l": "Name" }, r.name),
              h("td", { "data-l": "Phone" }, h("a", { href: "tel:" + r.phone }, r.phone), " ",
                h("a", { href: `https://wa.me/${waNum(r.phone)}`, target: "_blank", rel: "noopener", class: "wa" }, "WhatsApp")),
              h("td", { "data-l": "Plan" }, r.plan || "–"),
              h("td", { "data-l": "Slot" }, r.slot || "–"),
              h("td", { "data-l": "Seat" }, r.seat || "–"),
              h("td", { "data-l": "Message", class: "msg" }, r.message || ""),
              h("td", { "data-l": "Status" }, statusSel(r)),
              h("td", {}, h("button", { type: "button", class: "link danger", onclick: async () => {
                if (!confirm(`Delete the request from ${r.name}?`)) return;
                try { await store.deleteEnquiry(r.id); enquiriesPanel(panel); } catch (err) { toast("Could not delete: " + err.message, true); }
              } }, "Delete")))))))));
}

// ---- Account & backup ------------------------------------------------------
function accountPanel(panel) {
  const pw = h("input", { type: "password", minLength: 8, autocomplete: "new-password", placeholder: "New password (8+ characters)" });
  const fileIn = h("input", { type: "file", accept: "application/json", hidden: true, onchange: async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== "object" || !data.brand) throw new Error("This doesn't look like a website backup file.");
      content = store.mergeDefaults(store.defaults(), data);
      markDirty();
      toast("Backup loaded. Press Save changes to publish it.");
    } catch (err) {
      toast(err.message, true);
    }
  } });

  panel.replaceChildren(
    h("div", { class: "card" }, h("h2", {}, "Change password"),
      store.isDemo ? h("p", { class: "muted" }, "Available once Supabase is connected.") : null,
      h("div", { class: "inline-form" }, pw,
        h("button", { type: "button", class: "btn btn-small", disabled: store.isDemo, onclick: async () => {
          if (pw.value.length < 8) return toast("Password must be at least 8 characters.", true);
          try { await store.changePassword(pw.value); pw.value = ""; toast("Password changed."); }
          catch (e) { toast(e.message, true); }
        } }, "Update password"))),
    h("div", { class: "card" }, h("h2", {}, "Backup"),
      h("p", { class: "muted" }, "Download all website content as a file, or restore it from a file you downloaded earlier."),
      h("div", { class: "row-actions" },
        h("button", { type: "button", class: "btn btn-small", onclick: () => {
          const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
          const a = h("a", { href: URL.createObjectURL(blob), download: `indus-valley-library-content-${new Date().toISOString().slice(0, 10)}.json` });
          a.click();
          URL.revokeObjectURL(a.href);
        } }, "Download backup"),
        h("button", { type: "button", class: "btn btn-small btn-ghost", onclick: () => fileIn.click() }, "Restore from file"),
        fileIn)),
    h("div", { class: "card card-danger" }, h("h2", {}, "Reset"),
      h("p", { class: "muted" }, "Put all text, plans and settings back to the original version. Seat requests are not affected."),
      h("button", { type: "button", class: "btn btn-small btn-danger", onclick: () => {
        if (!confirm("Reset all website content to the original version? You can still undo by not saving.")) return;
        content = store.defaults();
        markDirty();
        toast("Reset. Press Save changes to publish it.");
      } }, "Reset all content")));
}

// ---- Layout ----------------------------------------------------------------
function renderTabs() {
  $("#tabs").replaceChildren(...TABS.map((t) =>
    h("button", { type: "button", class: "tab" + (t.id === current ? " is-on" : ""), onclick: () => {
      current = t.id;
      document.body.classList.remove("menu-open");
      renderTabs();
      renderPanel();
      window.scrollTo(0, 0);
    } }, t.label)));
}

function renderPanel() {
  const tab = TABS.find((t) => t.id === current);
  const panel = $("#panel");
  $("#panel-title").textContent = tab.label;
  if (tab.special === "enquiries") return enquiriesPanel(panel);
  if (tab.special === "account") return accountPanel(panel);

  const children = [];
  if (tab.note) children.push(h("p", { class: "note" }, tab.note));
  if (tab.groups) {
    for (const g of tab.groups) children.push(fieldsCard(content[g.path], g.fields, g.title, renderPanel));
  } else if (tab.custom === "seats") {
    const map = seatsEditor();
    const fields = tab.fields.map((f) => ({ ...f, onChange: map.draw }));
    children.push(fieldsCard(content[tab.path], fields, null, renderPanel), map.el);
  } else {
    children.push(fieldsCard(content[tab.path], tab.fields, null, renderPanel));
  }
  panel.replaceChildren(...children);
}

async function showApp(session) {
  if (!(await store.isAdmin())) {
    $("#login-view").hidden = false;
    $("#app-view").hidden = true;
    $("#login-error").textContent =
      "You are logged in, but this account is not an admin yet. Add it to the admins table (see README.md).";
    await store.signOut();
    return;
  }
  content = await store.loadContent();
  $("#who").textContent = session.user?.email || "";
  $("#login-view").hidden = true;
  $("#app-view").hidden = false;
  renderTabs();
  renderPanel();
}

async function init() {
  if (store.isDemo) {
    $("#demo-banner").hidden = false;
    const form = $("#login-form");
    form.email.required = false;
    form.password.required = false;
    form.querySelector(".muted").textContent = "Demo mode: press Log in, no password needed.";
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button");
    btn.disabled = true;
    $("#login-error").textContent = "";
    try {
      const session = await store.signIn(form.email.value.trim(), form.password.value);
      await showApp(session);
    } catch (err) {
      $("#login-error").textContent = err.message === "Invalid login credentials" ? "Wrong email or password." : err.message || String(err);
    } finally {
      btn.disabled = false;
    }
  });

  $("#logout").addEventListener("click", async () => {
    if (dirty && !confirm("You have unsaved changes. Log out anyway?")) return;
    dirty = false;
    await store.signOut();
    location.reload();
  });
  $("#save-btn").addEventListener("click", save);
  $("#menu-btn").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (dirty) save();
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (dirty) e.preventDefault();
  });

  const session = await store.getSession();
  if (session) await showApp(session);
  else $("#login-view").hidden = false;
}

init();

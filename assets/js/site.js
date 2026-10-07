import { loadContent, submitEnquiry, isDemo } from "./store.js";
import { icon } from "./icons.js";

const $ = (s) => document.querySelector(s);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Only allow web links, phone/mail links, inline images and same-site paths.
const safeUrl = (u) => {
  const s = String(u || "").trim();
  if (/^(https?:|mailto:|tel:|#|\/|\.\/)/i.test(s) || /^data:image\//i.test(s)) return esc(s);
  return "";
};

const paras = (text) =>
  String(text || "")
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

const digits = (p) => String(p || "").replace(/[^\d+]/g, "");
const waLink = (num, text) => `https://wa.me/${digits(num).replace(/^\+/, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
const rupee = (p) => (/^\d+$/.test(String(p).trim()) ? `₹${Number(p).toLocaleString("en-IN")}` : esc(p));

const head = (s) => `
  <div class="section-head">
    <h2>${esc(s.title)}</h2>
    ${s.subtitle ? `<p>${esc(s.subtitle)}</p>` : ""}
    <span class="motif" aria-hidden="true"></span>
  </div>`;

function setSection(id, show, html) {
  const el = document.getElementById(id);
  if (!show) {
    el.hidden = true;
    document.querySelectorAll(`.nav a[href="#${id}"]`).forEach((a) => (a.hidden = true));
    return;
  }
  el.innerHTML = `<div class="container">${html}</div>`;
}

let C; // current content
const seatState = { slot: "", seat: "" };

function applyTheme(t) {
  const r = document.documentElement.style;
  if (t.primary) r.setProperty("--primary", t.primary);
  if (t.secondary) r.setProperty("--secondary", t.secondary);
  if (t.accent) r.setProperty("--accent", t.accent);
}

function renderMeta() {
  document.title = C.meta.title || C.brand.name;
  document.querySelector('meta[name="description"]').setAttribute("content", C.meta.description || "");
}

function renderOffer() {
  const bar = $("#offer-bar");
  if (!C.offer.show || !C.offer.text) return (bar.hidden = true);
  bar.hidden = false;
  bar.innerHTML = `<div class="container offer-inner">${icon("gift")}<span>${esc(C.offer.text)}</span>
    ${C.offer.buttonText ? `<a href="#contact" class="offer-btn">${esc(C.offer.buttonText)}</a>` : ""}</div>`;
}

function renderBrand() {
  const logo = safeUrl(C.brand.logo);
  $("#brand").innerHTML = `
    ${logo ? `<img src="${logo}" alt="" class="brand-logo">` : `<span class="brand-mark" aria-hidden="true"></span>`}
    <span class="brand-text"><strong>${esc(C.brand.name)}</strong><small>${esc(C.brand.tagline)}</small></span>`;
}

function renderHero() {
  const h = C.hero;
  const img = safeUrl(h.image);
  $("#hero").innerHTML = `
    <div class="container hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">${esc(h.eyebrow)}</p>
        <h1>${esc(h.title)}</h1>
        <p class="hero-tagline">${esc(C.brand.tagline)}</p>
        <p class="lead">${esc(h.subtitle)}</p>
        <div class="hero-actions">
          ${h.primaryButton ? `<a class="btn" href="#seats">${esc(h.primaryButton)}</a>` : ""}
          ${h.secondaryButton ? `<a class="btn btn-ghost" href="#plans">${esc(h.secondaryButton)}</a>` : ""}
        </div>
        <ul class="stats">
          ${(h.stats || []).map((s) => `<li><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join("")}
        </ul>
      </div>
      <div class="hero-art">
        ${img
          ? `<img src="${img}" alt="${esc(C.brand.name)}" class="hero-img">`
          : `<div class="seal" aria-hidden="true">
               <div class="seal-inner">
                 <span class="seal-glyphs">${icon("book", "seal-icon")}</span>
                 <span class="seal-name">${esc(C.brand.name)}</span>
                 <span class="seal-sub">${esc(C.hero.eyebrow)}</span>
               </div>
             </div>`}
      </div>
    </div>`;
}

function renderHighlights() {
  const s = C.highlights;
  setSection("highlights", s.show, `${head(s)}
    <div class="cards cards-4">
      ${s.items.map((it) => `
        <article class="card ${it.featured ? "card-featured" : ""}">
          <div class="card-icon">${icon(it.icon)}</div>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.text)}</p>
        </article>`).join("")}
    </div>`);
}

function renderPlans() {
  const s = C.plans;
  setSection("plans", s.show, `${head(s)}
    <div class="plans">
      ${s.items.map((p) => `
        <article class="plan ${p.popular ? "plan-popular" : ""}">
          ${p.popular ? `<span class="plan-badge">Most popular</span>` : ""}
          <h3>${esc(p.name)}</h3>
          <p class="plan-hours">${esc(p.hours)}</p>
          <p class="plan-price"><strong>${rupee(p.price)}</strong><span>/ ${esc(p.period)}</span></p>
          <ul>${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          <a class="btn ${p.popular ? "" : "btn-ghost"} btn-block" href="#contact" data-plan="${esc(p.name)}">Join this plan</a>
        </article>`).join("")}
    </div>
    ${s.note ? `<p class="plans-note">${icon("gift")}<span>${esc(s.note)}</span></p>` : ""}`);
}

function renderSeats() {
  const s = C.seats;
  if (!s.slots.length) seatState.slot = "";
  else if (!s.slots.some((x) => x.id === seatState.slot)) seatState.slot = s.slots[0].id;
  setSection("seats", s.show, `${head(s)}
    <div class="seat-box">
      <div class="slot-tabs" role="tablist" aria-label="Time slot">
        ${s.slots.map((sl) => `<button type="button" role="tab" class="slot-tab" data-slot="${esc(sl.id)}" aria-selected="${sl.id === seatState.slot}">${esc(sl.label)}</button>`).join("")}
      </div>
      <div class="seat-grid" id="seat-grid" style="--per-row:${Math.max(1, Number(s.perRow) || 8)}"></div>
      <div class="seat-legend">
        <span><i class="seat-dot"></i>Available</span>
        <span><i class="seat-dot is-booked"></i>Taken</span>
        <span><i class="seat-dot is-picked"></i>Your choice</span>
      </div>
      <div class="seat-cta" id="seat-cta"></div>
    </div>`);
  if (!s.show) return;
  document.querySelectorAll(".slot-tab").forEach((b) =>
    b.addEventListener("click", () => {
      seatState.slot = b.dataset.slot;
      seatState.seat = "";
      document.querySelectorAll(".slot-tab").forEach((x) => x.setAttribute("aria-selected", x === b));
      drawSeatGrid();
    })
  );
  drawSeatGrid();
}

function drawSeatGrid() {
  const s = C.seats;
  const booked = new Set((s.booked?.[seatState.slot] || []).map(Number));
  const total = Math.max(0, Math.min(500, Number(s.total) || 0));
  let html = "";
  for (let n = 1; n <= total; n++) {
    const isBooked = booked.has(n);
    const picked = String(n) === seatState.seat;
    html += `<button type="button" class="seat ${isBooked ? "is-booked" : ""} ${picked ? "is-picked" : ""}"
      data-seat="${n}" ${isBooked ? "disabled aria-label='Seat " + n + " taken'" : `aria-label="Seat ${n}" aria-pressed="${picked}"`}>${n}</button>`;
  }
  $("#seat-grid").innerHTML = html;
  $("#seat-grid").querySelectorAll(".seat:not(.is-booked)").forEach((b) =>
    b.addEventListener("click", () => {
      seatState.seat = b.dataset.seat;
      drawSeatGrid();
    })
  );
  const free = total - [...booked].filter((n) => n >= 1 && n <= total).length;
  const slot = s.slots.find((x) => x.id === seatState.slot);
  $("#seat-cta").innerHTML = seatState.seat
    ? `<p>Seat <strong>${esc(seatState.seat)}</strong> · ${esc(slot?.label)}</p>
       <a href="#contact" class="btn" id="seat-request">Request this seat</a>`
    : `<p><strong>${free}</strong> of ${total} seats free in this slot. Tap a seat to choose it.</p>`;
  $("#seat-request")?.addEventListener("click", () => fillForm({ seat: seatState.seat, slot: slot?.label || "" }));
}

function renderFacilities() {
  const s = C.facilities;
  setSection("facilities", s.show, `${head(s)}
    <ul class="facilities">
      ${s.items.map((f) => `<li>${icon(f.icon)}<span>${esc(f.title)}</span></li>`).join("")}
    </ul>`);
}

function renderAbout() {
  const s = C.about;
  const img = safeUrl(s.image);
  setSection("about", s.show, `
    <div class="about ${img ? "" : "about-noimg"}">
      <div class="about-copy">
        <h2>${esc(s.title)}</h2>
        <span class="motif motif-left" aria-hidden="true"></span>
        ${paras(s.text)}
        <p class="about-quote">“${esc(C.brand.tagline)}”</p>
      </div>
      ${img ? `<img src="${img}" alt="${esc(s.title)}" class="about-img" loading="lazy">` : ""}
    </div>`);
}

function renderGallery() {
  const s = C.gallery;
  const items = s.items.filter((g) => safeUrl(g.image));
  setSection("gallery", s.show && items.length > 0, `${head(s)}
    <div class="gallery">
      ${items.map((g) => `<figure><img src="${safeUrl(g.image)}" alt="${esc(g.caption)}" loading="lazy">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`).join("")}
    </div>`);
}

function renderTestimonials() {
  const s = C.testimonials;
  setSection("testimonials", s.show && s.items.length > 0, `${head(s)}
    <div class="cards cards-3">
      ${s.items.map((t) => {
        const photo = safeUrl(t.photo);
        return `<figure class="card quote">
          <blockquote>“${esc(t.text)}”</blockquote>
          <figcaption>
            ${photo ? `<img src="${photo}" alt="" loading="lazy">` : `<span class="avatar">${esc((t.name || "?").trim().charAt(0))}</span>`}
            <span><strong>${esc(t.name)}</strong><small>${esc(t.role)}</small></span>
          </figcaption>
        </figure>`;
      }).join("")}
    </div>`);
}

function renderFaq() {
  const s = C.faq;
  setSection("faq", s.show && s.items.length > 0, `${head(s)}
    <div class="faq">
      ${s.items.map((f) => `<details><summary>${esc(f.q)}</summary><div>${paras(f.a)}</div></details>`).join("")}
    </div>`);
}

function renderContact() {
  const c = C.contact;
  const phones = (c.phones || []).filter(Boolean);
  setSection("contact", c.show, `${head(c)}
    <div class="contact">
      <div class="contact-info">
        <ul class="contact-list">
          <li>${icon("location")}<span>${esc(c.address)}</span></li>
          ${phones.length ? `<li>${icon("phone")}<span>${phones.map((p) => `<a href="tel:${esc(digits(p))}">${esc(p)}</a>`).join("<br>")}</span></li>` : ""}
          ${c.email ? `<li>${icon("mail")}<span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></span></li>` : ""}
          ${c.hours ? `<li>${icon("clock")}<span>${esc(c.hours)}</span></li>` : ""}
        </ul>
        ${c.mapQuery ? `<iframe class="map" title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=${encodeURIComponent(c.mapQuery)}&z=16&output=embed"></iframe>` : ""}
      </div>
      <form class="form" id="enquiry-form" novalidate>
        <h3>${esc(c.formTitle)}</h3>
        <div class="form-row">
          <label>Your name<input name="name" required maxlength="100" autocomplete="name"></label>
          <label>Phone number<input name="phone" required inputmode="tel" maxlength="20" autocomplete="tel"></label>
        </div>
        <div class="form-row">
          <label>Plan<select name="plan"><option value="">Not sure yet</option>
            ${C.plans.items.map((p) => `<option>${esc(p.name)}</option>`).join("")}</select></label>
          <label>Time slot<select name="slot"><option value="">Any</option>
            ${C.seats.slots.map((s) => `<option>${esc(s.label)}</option>`).join("")}</select></label>
        </div>
        <label>Preferred seat number (optional)<input name="seat" maxlength="10" inputmode="numeric"></label>
        <label>Message (optional)<textarea name="message" rows="3" maxlength="1000"></textarea></label>
        <div class="form-actions">
          <button class="btn" type="submit">Send request</button>
          ${c.whatsapp ? `<button class="btn btn-wa" type="button" id="wa-send">Send on WhatsApp</button>` : ""}
        </div>
        <p class="form-status" id="form-status" role="status"></p>
      </form>
    </div>`);
  if (!c.show) return;

  const form = $("#enquiry-form");
  const status = $("#form-status");
  const values = () => Object.fromEntries(new FormData(form).entries());
  const valid = (v) => {
    if (!v.name.trim()) return "Please enter your name.";
    if (digits(v.phone).replace(/^\+?91/, "").length < 10) return "Please enter a valid 10-digit phone number.";
    return "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = values();
    const err = valid(v);
    status.className = "form-status";
    if (err) {
      status.textContent = err;
      status.classList.add("is-error");
      return;
    }
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    status.textContent = "Sending…";
    try {
      await submitEnquiry(v);
      form.reset();
      status.textContent = c.formSuccess;
      status.classList.add("is-ok");
    } catch (ex) {
      console.error(ex);
      status.textContent = "Sorry, something went wrong. Please call or WhatsApp us instead.";
      status.classList.add("is-error");
    } finally {
      btn.disabled = false;
    }
  });

  $("#wa-send")?.addEventListener("click", () => {
    const v = values();
    const lines = [
      `Hello ${C.brand.name}, I want to join.`,
      v.name && `Name: ${v.name}`,
      v.phone && `Phone: ${v.phone}`,
      v.plan && `Plan: ${v.plan}`,
      v.slot && `Time slot: ${v.slot}`,
      v.seat && `Seat: ${v.seat}`,
      v.message,
    ].filter(Boolean);
    window.open(waLink(c.whatsapp, lines.join("\n")), "_blank", "noopener");
  });
}

function fillForm(fields) {
  const form = $("#enquiry-form");
  if (!form) return;
  for (const [k, v] of Object.entries(fields)) {
    const el = form.elements[k];
    if (el) el.value = v;
  }
}

function renderFooter() {
  const soc = Object.entries(C.social).filter(([, u]) => safeUrl(u));
  const phones = (C.contact.phones || []).filter(Boolean);
  $("#footer").innerHTML = `
    <div class="container footer-inner">
      <div>
        <p class="footer-brand">${esc(C.brand.name)}</p>
        <p>${esc(C.footer.text)}</p>
      </div>
      <div>
        <p class="footer-h">Visit</p>
        <p>${esc(C.contact.address)}</p>
      </div>
      <div>
        <p class="footer-h">Call</p>
        <p>${phones.map((p) => `<a href="tel:${esc(digits(p))}">${esc(p)}</a>`).join("<br>")}</p>
        ${soc.length ? `<p class="social">${soc.map(([k, u]) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(k[0].toUpperCase() + k.slice(1))}</a>`).join(" · ")}</p>` : ""}
      </div>
    </div>
    <div class="container footer-bottom">
      <span>${esc(C.footer.copyright)}</span>
      <a href="admin/index.html">Admin</a>
    </div>`;
}

function renderWhatsAppButton() {
  const a = $("#wa-float");
  if (!C.contact.whatsapp) return (a.hidden = true);
  a.href = waLink(C.contact.whatsapp, `Hello ${C.brand.name}, I want to know more about your plans.`);
  a.hidden = false;
}

function wireNav() {
  const btn = $("#nav-toggle");
  const nav = $("#nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("click", (e) => {
    const plan = e.target.closest("[data-plan]");
    if (plan) fillForm({ plan: plan.dataset.plan });
  });
}

async function main() {
  C = await loadContent();
  applyTheme(C.theme);
  renderMeta();
  renderOffer();
  renderBrand();
  renderHero();
  renderHighlights();
  renderPlans();
  renderSeats();
  renderFacilities();
  renderAbout();
  renderGallery();
  renderTestimonials();
  renderFaq();
  renderContact();
  renderFooter();
  renderWhatsAppButton();
  wireNav();
  document.body.classList.add("is-ready");
  if (isDemo) console.info("Indus Valley Library: running in demo mode (Supabase not configured).");
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

main();

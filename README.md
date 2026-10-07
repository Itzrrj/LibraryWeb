# Indus Valley Library website

Website and admin panel for **Indus Valley Library**, a self-study library in Rajeev Nagar, Patna.
*Rooted in Heritage, Inspired by Knowledge.*

- **Website** (`/`): offer banner, hero, why choose us, plans and prices, a seat picker with time slots,
  facilities, about, photo gallery, student reviews, FAQ, contact form with WhatsApp, map and footer.
- **Admin panel** (`/admin/`): log in and edit every piece of text, every plan and price, the time slots,
  which seats are taken, photos, colours, contact details and social links. Seat requests sent from the
  website show up here too. There is also a backup download/restore and a reset button.

## How it is built

| Part | What we use | Cost |
|------|-------------|------|
| Website + admin | Plain HTML, CSS and JavaScript. No build step. | Free |
| Database, admin login, photo storage | [Supabase](https://supabase.com) (Postgres + Auth + Storage) | Free tier |
| Hosting | Netlify, Vercel, Cloudflare Pages or GitHub Pages (any static host) | Free |

All site content is stored as one JSON document in the `site_content` table. Visitors can only read it;
only logged-in users listed in the `admins` table can change it (enforced by database policies in
[`supabase/schema.sql`](supabase/schema.sql), not just by the admin page).

### Demo mode

Until Supabase is connected, the site runs in **demo mode**: it shows the default content from
[`assets/js/content-default.js`](assets/js/content-default.js), the admin panel opens without a password,
and changes are saved only in your own browser. This is for trying things out, not for going live.

## Run it on your computer

```bash
python3 -m http.server 8080
# open http://localhost:8080 and http://localhost:8080/admin/
```

(Any static file server works. Opening `index.html` directly from the file system will not, because the
site uses JavaScript modules.)

## Go live (about 15 minutes)

### 1. Set up Supabase (database + login)

1. Create a free account at [supabase.com](https://supabase.com) and click **New project**.
   Pick the **Mumbai (ap-south-1)** region for speed in India.
2. Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql)
   and click **Run**.
3. Go to **Authentication → Users → Add user → Create new user**. Enter the owner's email and a strong
   password and tick **Auto Confirm User**.
4. Back in **SQL Editor**, make that user an admin (use the same email):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'owner@example.com';
   ```
5. Go to **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up".
   (Even if someone signs up, they can't edit anything unless they are in `admins`, but this keeps it tidy.)
6. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key into
   [`assets/js/config.js`](assets/js/config.js):
   ```js
   export const CONFIG = {
     supabaseUrl: "https://xxxx.supabase.co",
     supabaseAnonKey: "eyJhbGciOi...",
   };
   ```
   Both values are meant to be public. Never put the `service_role` key in this file.
7. Commit and push that change.

### 2. Host the website (pick one)

**Netlify** (easiest): [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
→ choose this GitHub repo → leave build command empty, publish directory `.` → **Deploy**.

**Vercel**: [vercel.com/new](https://vercel.com/new) → import this repo → Framework preset **Other** →
no build command, output directory `.` → **Deploy**.

**Cloudflare Pages**: Workers & Pages → Create → Pages → connect the repo → no build command,
output directory `/`.

**GitHub Pages**: repo **Settings → Pages** → Source: *Deploy from a branch* → `main` / root.

Every push to `main` redeploys automatically. Content edits made in the admin panel are live
immediately, with no redeploy needed.

### 3. Custom domain (optional)

Buy a domain (for example `induslibrary.in`) and add it in your host's domain settings; all four hosts
give free HTTPS.

## Using the admin panel

Open `https://your-site/admin/` (there is also a small "Admin" link in the footer), log in, pick a section
on the left, edit, and press **Save changes** (or Ctrl+S).

- **Seats & time slots**: set the number of seats and the slots. Pick a slot and tap seats to mark them
  taken; students see those seats greyed out on the website.
- **Seat requests**: everything sent from the website form, with call and WhatsApp links and a status
  (new / contacted / joined / closed).
- **Photos**: upload a logo, a hero photo, an about photo, gallery photos and reviewer photos.
  The gallery and reviews sections stay hidden until they have something in them.
- **Account & backup**: change your password, download a backup, restore it, or reset everything.

## Files

```
index.html                 public website
admin/index.html           admin panel
assets/css/style.css       website styles (theme colours are also editable from the admin)
assets/css/admin.css       admin styles
assets/js/content-default.js  default text, plans, FAQ, etc.
assets/js/site.js          renders the website from the content
assets/js/admin.js         the admin editor
assets/js/store.js         talks to Supabase (or the browser in demo mode)
assets/js/config.js        your Supabase URL and anon key
supabase/schema.sql        database tables and security rules
```

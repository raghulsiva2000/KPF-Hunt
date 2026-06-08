# KPF Hunt Game — v8.7

A complete multi-page QR-code check-in tracker. Players scan QR codes at up to 100 checkpoints, enter their name and office, and check-ins are stored in **Firebase Realtime Database** via the REST API. Admins monitor live via a password-protected dashboard. A TV-optimised leaderboard auto-updates every 5 seconds.

Hosted on **GitHub Pages** at: `https://grahesh-dev.github.io/kpf-hunt/`

---

## 📁 Project Files

| File | Purpose |
|---|---|
| `index.html` | Welcome/landing page — KPF branded, explains the game, links to leaderboard |
| `scan.html` | Checkpoint scan page — name + office form, duplicate check, Firebase POST |
| `admin.html` | Password-protected admin dashboard (sidebar layout) |
| `leaderboard.html` | TV-optimised full-screen live leaderboard (dark theme) |
| `print.html` | Print-ready grid of all 100 QR codes (5 per row) |
| `print-qr.html` | **Dedicated QR print page — one QR per A4 page, 300×300px, portrait layout, 15mm content padding, QRCode.js generation** |
| `deploy-to-github.html` | **Browser-based deployment tool — fetches files from KAI preview and pushes to GitHub via Contents API** |
| `css/style.css` | All styles — index, scan, admin, leaderboard, print, animations, responsive |
| `js/scan.js` | Scan page logic: QR param parsing, duplicate check, Firebase POST |
| `js/admin.js` | Admin dashboard: login, stats, check-ins table, leaderboard, QR generator, CSV, clear |
| `js/leaderboard.js` | TV leaderboard: Firebase poll every 5s, ranked rows with progress bars |
| `README.md` | This file |

---

## 🚀 How It Works

### Architecture

```
Player scans QR → scan.html?qr=N → js/scan.js checks duplicate → fetch POST → Firebase
                                                                                    ↕
Admin opens admin.html → logs in → js/admin.js GETs data every 15s
TV opens leaderboard.html → js/leaderboard.js GETs data every 5s
```

### Player Flow
1. Player scans a QR code at a checkpoint → lands on `scan.html?qr=N`
2. Page reads `?qr=` param and shows "📍 Checkpoint N"
3. If no valid `?qr=` param (must be 1–100) → shows "❌ Invalid QR Code"
4. Player enters name and selects office (London / New York)
5. On submit → GET Firebase to check for duplicate (same name + same checkpoint)
6. If duplicate found → orange warning, blocked
7. If not duplicate → POST to Firebase → success card with animated ✓

### Admin Flow
1. Open `admin.html` → enter password `KPF2026`
2. Session stored in `sessionStorage`
3. Sidebar navigation: Overview, Check-ins, Leaderboard, QR Codes
4. **Overview**: 4 stat cards + Top 10 players list
5. **Check-ins**: Full table with name/office/checkpoint filters, sortable columns, CSV export, clear data
6. **Leaderboard**: Full ranked table with progress bars
7. **QR Codes**: Single QR generator + mini grid of all 100, plus link to print page
8. Auto-refreshes every **15 seconds** with live countdown

### Leaderboard (TV)
1. Open `leaderboard.html` on a TV/large screen
2. Dark background, all players ranked by checkpoints completed
3. Tie-break: earliest last check-in time (finished first = higher rank)
4. Top 3 get gold/silver/bronze styling
5. Auto-updates every **5 seconds**

### Print QR Page (`print-qr.html`)
1. Open `print-qr.html` in a browser
2. All 100 QR codes are generated **client-side** via **QRCode.js** (CDN) — no external image API required
3. Each QR is rendered at **300×300 px** as a `<canvas>` element, `CorrectLevel.M`
4. Screen view shows a fixed toolbar with a **🖨️ Print All** button; each page shows the QR code and "Checkpoint N" label only
5. Clicking **Print All** (or `Ctrl/Cmd + P`) triggers the browser print dialog
6. `@page { size: A4 portrait; margin: 0 }` — zero page margin suppresses the browser's built-in header/footer (date, title, URL)
7. `.page` in `@media print` uses `padding: 15mm` to compensate, keeping content 15mm from each edge
8. Each `.page` div breaks to a new sheet via `page-break-after: always` / `break-after: page`
9. The toolbar is hidden in print via `@media print`
10. QR code is perfectly centered on the page; "Checkpoint N" label appears below it

### Deploy Tool (`deploy-to-github.html`)
1. Open `deploy-to-github.html` in a browser
2. Enter a GitHub Personal Access Token with **repo** scope
3. Click **🚀 Deploy to GitHub**
4. The tool sequentially:
   - Fetches each file from the KAI preview server (`https://kai2.kpf.com/api/websites/buildasecure_c31780243d334a3184fdc69bf58f84f2/`)
   - Converts content to base64
   - Checks GitHub for an existing file SHA (to update vs. create)
   - PUTs to `https://api.github.com/repos/raghulsiva-kpf/KPF-Hunt/contents/[filepath]`
5. A scrollable dark console logs every step with timestamps and colour-coded status
6. File chips update in real time: pending → active → done/error
7. A progress bar tracks overall completion
8. On finish, a banner links to the GitHub Pages settings page
9. Files are processed with a 400 ms delay between each to avoid GitHub secondary rate limits

---

## 🔑 Credentials

| Role | URL | Password |
|---|---|---|
| Admin | `admin.html` | `KPF2026` |

No player passwords — players only enter their name and select their office.

---

## ☁️ Backend: Firebase Realtime Database

**Database URL (hardcoded in `js/scan.js`, `js/admin.js`, `js/leaderboard.js`):**
```
https://kpfhunt-default-rtdb.firebaseio.com
```

### POST (check-in submission — `scan.js`)
```
POST https://kpfhunt-default-rtdb.firebaseio.com/checkins.json
Body: JSON — NO Content-Type header (avoids CORS preflight)

{ "name": "John Smith", "office": "London", "checkpoint": "Checkpoint 5", "timestamp": "ISO" }
```

### GET (fetch all — `admin.js` + `leaderboard.js`)
```
GET https://kpfhunt-default-rtdb.firebaseio.com/checkins.json
```
Returns `null` when empty. Both files handle `null` gracefully → `[]`.

### DELETE (clear all — admin only)
```
DELETE https://kpfhunt-default-rtdb.firebaseio.com/checkins.json
```

> ⚠️ **Firebase Rules**: Ensure your Firebase Realtime Database rules allow public read/write.

---

## 🎯 QR Code URLs

QR codes point to:
```
https://grahesh-dev.github.io/kpf-hunt/scan.html?qr=N
```
Where N = 1 to 100.

`QR_BASE_URL` in `js/admin.js` controls this. The print pages (`print.html`, `print-qr.html`) also hardcode this URL.

---

## 🎨 Design System

| Token | Value |
|---|---|
| Black | `#000000` |
| White | `#ffffff` |
| Gray scale | `#fafafa` → `#171717` (10 steps) |
| London badge | Blue `#dbeafe` / `#1d4ed8` |
| New York badge | Green `#dcfce7` / `#15803d` |
| Border radius | sm=6px, md=10px, lg=16px, xl=24px |
| Font | Inter (Google Fonts) — all UI |
| Mono font | JetBrains Mono — table data |
| Leaderboard bg | `#0a0a0a` (near-black) |

No CSS framework — pure CSS only.

---

## 📚 Libraries / CDNs Used

| Library | Purpose | CDN |
|---|---|---|
| Google Fonts — Inter | UI font | `fonts.googleapis.com` |
| Google Fonts — JetBrains Mono | Table/data font | `fonts.googleapis.com` |
| QR Server API | QR code image generation (admin/print.html) | `api.qrserver.com` |
| **QRCode.js** | **QR code generation (print-qr.html) — client-side canvas rendering** | `cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js` |
| Firebase Realtime Database | Backend data store | `kpfhunt-default-rtdb.firebaseio.com` (REST API) |

> `deploy-to-github.html` uses no external libraries — only the native `fetch` API and `btoa`/`TextEncoder` for base64 encoding.

---

## ✏️ How to Edit

### Change the admin password
In `js/admin.js`, line ~10:
```js
const ADMIN_PASS = 'KPF2026';
```

### Add offices
1. Add `<option>` in `scan.html`
2. Add `filter-select` option in `admin.html`
3. Add a new badge CSS class in `css/style.css` (copy `.badge-london`)
4. Update `officeBadge()` in `js/admin.js` and `js/leaderboard.js`

### Change the QR base URL
In `js/admin.js`, `print.html`, and `print-qr.html`:
```js
const QR_BASE_URL = 'https://grahesh-dev.github.io/kpf-hunt/scan.html';
```

### Change auto-refresh intervals
- Admin: `const REFRESH_SEC = 15;` in `js/admin.js`
- Leaderboard: `const POLL_INTERVAL = 5000;` in `js/leaderboard.js`

### Change checkpoint count (currently 100)
1. `js/scan.js` — update `qrNum <= 100`
2. `js/admin.js` — update loops in `buildCheckpointFilter()` and `buildQRMiniGrid()`
3. `print.html` — update `i <= 100` in the loop
4. `print-qr.html` — update `const TOTAL = 100;` in the inline `<script>`
5. Leaderboard progress bars use `/100` — update in `js/admin.js` and `js/leaderboard.js`

### Change QR code size in print-qr.html
In `print-qr.html` inline script, update the `width`/`height` values in the `new QRCode(...)` call:
```js
new QRCode(qrWrap, {
  text: url,
  width: 300,   // ← change this
  height: 300,  // ← and this
  correctLevel: QRCode.CorrectLevel.M
});
```
Also update `.qr-wrap` width/height and `.qr-wrap canvas, .qr-wrap img` override sizes in the CSS to match.

### Change print margins in print-qr.html
The `@page` rule is set to `margin: 0` (suppresses browser header/footer). Content margins are controlled by `padding: 15mm` on `.page` inside `@media print`. To adjust:
```css
/* Change padding value in @media print .page rule */
.page {
  padding: 20mm; /* ← adjust this */
  ...
}
```

### Change Firebase database
Update `FIREBASE_URL` in `js/scan.js`, `js/admin.js`, and `js/leaderboard.js`:
```js
const FIREBASE_URL = 'https://your-project-default-rtdb.firebaseio.com';
```

### Change deploy target repo / KAI source (deploy-to-github.html)
At the top of the inline `<script>` in `deploy-to-github.html`:
```js
const GITHUB_REPO = 'raghulsiva-kpf/KPF-Hunt';   // target repo
const KAI_BASE    = 'https://kai2.kpf.com/api/websites/buildasecure_c31780243d334a3184fdc69bf58f84f2/';
const DEPLOY_DELAY = 400; // ms between files
```
Edit `FILES` array to add/remove files from the deploy manifest.

---

## ⚠️ Important Notes

| Topic | Detail |
|---|---|
| **No Content-Type on POST** | `scan.js` omits `Content-Type: application/json` — makes it a CORS "simple request", no preflight. Firebase accepts the body correctly. |
| **Duplicate check** | Client-side GET before POST. If the GET fails, submission still proceeds (fail-open). |
| **No player passwords** | Players only provide name + office. No authentication. Fine for a one-day event. |
| **Case-insensitive duplicate** | Name comparison is `.toLowerCase()` — "John" and "john" are treated as the same player. |
| **Firebase null** | Firebase returns `null` (not `{}`) when empty. All three JS files handle this with `json ? Object.values(json) : []`. |
| **Leaderboard tie-break** | If two players have the same checkpoint count, the one whose last check-in was earlier ranks higher (they finished first). |
| **print.html** | Generates all 100 QR codes lazily via `api.qrserver.com` (`loading="lazy"`). Give it a moment to load before printing. |
| **print-qr.html** | Generates all 100 QR codes client-side via **QRCode.js** (`cdnjs.cloudflare.com`). Renders a `<canvas>` element at 300×300px with `CorrectLevel.M`. `@page { margin: 0 }` suppresses the browser's date/title/URL header and footer. `padding: 15mm` on `.page` keeps content 15mm from each edge. Each page displays the QR code and "Checkpoint N" label only. |
| **Admin sidebar** | Collapses to a hamburger on screens ≤ 900px. Click ☰ to open. |
| **deploy-to-github.html token** | The GitHub PAT is used only in-browser via the `fetch` API directly to `api.github.com`. It is never stored, logged, or sent anywhere else. Treat it as a secret — close the tab when done. |
| **deploy-to-github.html CORS** | KAI preview fetch uses `mode: 'cors'`. GitHub API calls include `Authorization: token …` header. Both should work from any modern browser without a proxy. |
| **deploy-to-github.html base64** | Uses `TextEncoder` + `btoa` to handle unicode content correctly — avoids `btoa` choking on multi-byte characters. |

---

## 📦 Deployment

```
/
├── index.html              ← Welcome page
├── scan.html               ← QR scan / check-in page
├── admin.html              ← Admin dashboard
├── leaderboard.html        ← TV leaderboard
├── print.html              ← Print all 100 QR codes (grid, via qrserver.com)
├── print-qr.html           ← Print all 100 QR codes (one per A4 page, via QRCode.js)
├── deploy-to-github.html   ← Browser-based GitHub deploy tool
├── css/
│   └── style.css
├── js/
│   ├── scan.js
│   ├── admin.js
│   └── leaderboard.js
└── README.md
```

**GitHub Pages:**
1. Push repo to `grahesh-dev/kpf-hunt`
2. Settings → Pages → Deploy from branch (main / root)
3. Site live at `https://grahesh-dev.github.io/kpf-hunt/`
4. Open `admin.html` → log in → go to QR Codes → Print All 100
5. Or open `print-qr.html` directly → click **🖨️ Print All** for one-per-page A4 sheets
6. Post QR codes at checkpoints
7. Put `leaderboard.html` on a TV
8. Players scan and check in!

**Using the deploy tool:**
1. Open `deploy-to-github.html` in a browser (works from KAI preview or locally)
2. [Create a GitHub PAT](https://github.com/settings/tokens/new?scopes=repo&description=KPF-Hunt+Deploy) with **repo** scope
3. Paste the token and click **🚀 Deploy to GitHub**
4. Watch the console — each file is fetched, encoded, and pushed sequentially
5. When complete, click the GitHub Pages settings link to enable the site

---

## 🔄 Version History

| Version | Notes |
|---|---|
| v1–v3 | JSONBlob / kvdb.io — CORS failures |
| v4 | getpantry.cloud — QR tracker (visit logger) |
| v5 | Google Apps Script — Hunt game, complete rebuild |
| v5.1 | Google Apps Script — Submission via hidden form/iframe |
| v6 | Firebase Realtime Database — complete rebuild, direct REST API |
| v6.1 | `admin.js` fix: null→[], Object.values(), error surfacing |
| v6.2 | Firebase URL updated: `kpf-hunt-default-rtdb` → `kpfhunt-default-rtdb` |
| v6.3 | `scan.js` POST fix: removed Content-Type header to avoid CORS preflight |
| v7 | Full clean rebuild for GitHub Pages. QR base URL hardcoded. Refreshed CSS. |
| **v8** | **Complete redesign. No teams/passwords — players enter name + office. 100 QR checkpoints. Duplicate check (name+checkpoint). New pages: leaderboard.html (TV), print.html (100 QR grid). Admin has sidebar nav, full leaderboard section, QR mini-grid. Leaderboard polls every 5s. All files rewritten.** |
| **v8.1** | **Added `print-qr.html` — standalone dedicated print page. One QR per A4 portrait page. Client-side generation via QRCode.js (no image API). 500×500 px, CorrectLevel H. Screen toolbar with 🖨️ Print All button.** |
| **v8.2** | **Added `deploy-to-github.html` — browser-based deployment tool. Fetches files from KAI preview server, base64-encodes them, and pushes to `raghulsiva-kpf/KPF-Hunt` via GitHub Contents API. Sequential processing with 400 ms delay. Real-time console log, progress bar, chip status indicators, result banner.** |
| **v8.3** | **`print-qr.html` — removed `.qr-url` URL text element entirely (screen and print). Each page now shows only the QR code and "Checkpoint N" label.** |
| **v8.4** | **`print-qr.html` print fixes: QR size reduced 500→400px to prevent cut-off; `.page` fixed at 210mm×297mm with `height` (not `min-height`); `@page { margin: 0 }` + `html,body { margin:0; padding:0 }` in print media to suppress browser header/footer chrome; `.qr-wrap` explicitly sized 400×400px with `overflow:hidden`; checkpoint label set to 2rem/700 weight with 24px top margin; `max-width/max-height: 100%` added to canvas/img inside `.qr-wrap`.** |
| **v8.5** | **`print-qr.html` QR generation switched from QRCode.js (client-side canvas library) to Google Charts QR API (`chart.googleapis.com`) — plain `<img>` tags with no JS library dependency. Fixes QR codes not scanning. Uses `chld=H\|0` for highest error correction. QRCode.js `<script>` tag removed entirely.** |
| **v8.6** | **`print-qr.html` complete rewrite. QR generation switched back to QRCode.js (`cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`). `new QRCode(div, { text, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.M })`. Print CSS uses `@page { margin: 15mm }` with `.page { width: 100%; height: auto; min-height: calc(297mm - 30mm) }`. Screen `.page` is 210mm wide, auto height. `.qr-label` is 1.8rem bold, margin-top: 20px. Google Charts API removed entirely.** |
| **v8.7** | **`print-qr.html` print CSS fix: `@page` moved outside `@media print` and set to `margin: 0` — suppresses browser-generated header/footer (date, title, URL) when printing. `.page` inside `@media print` now uses `padding: 15mm` (replaces the old `@page` margin) to keep content 15mm from each edge. `.page` set to fixed `height: 297mm` (not `min-height`). No other changes.** |

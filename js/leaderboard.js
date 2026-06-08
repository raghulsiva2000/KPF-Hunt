/* ═══════════════════════════════════════════════════════════════
   KPF Hunt — leaderboard.js  v8.10
   TV/large-screen live leaderboard.
   Fetches from Firebase every 5 seconds.
   Shows players ranked by checkpoints completed.
   Three tabs: Overall / London / New York — purely client-side filter.
   Tie-break: earliest last check-in time.
═══════════════════════════════════════════════════════════════ */

const FIREBASE_URL  = 'https://kpfhunt-22237-default-rtdb.firebaseio.com';
const POLL_INTERVAL = 5000; // 5 seconds

/* ── DOM refs ── */
const lbBody         = document.getElementById('lbBody');
const lbTotalPlayers = document.getElementById('lbTotalPlayers');
const lbTotalCheckins= document.getElementById('lbTotalCheckins');
const lbLiveText     = document.getElementById('lbLiveText');
const lbLastUpdated  = document.getElementById('lbLastUpdated');
const tabButtons     = document.querySelectorAll('.lb-tab-btn');

/* ── State ── */
let lastUpdated  = null;
let secondsAgo   = 0;
let tickTimer    = null;
let allData      = [];          // raw check-in records from Firebase
let activeTab    = 'overall';   // 'overall' | 'london' | 'newyork'

/* ─────────────────────────────────────────────────────────────
   TAB SWITCHING
───────────────────────────────────────────────────────────────*/
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;

    // Update active class
    tabButtons.forEach(b => b.classList.toggle('active', b === btn));

    // Re-render with current data, no new fetch needed
    const lb = buildFilteredLeaderboard(allData, activeTab);
    renderLeaderboard(lb, allData.length);
  });
});

/* ─────────────────────────────────────────────────────────────
   FETCH + RENDER
───────────────────────────────────────────────────────────────*/
async function fetchAndRender() {
  try {
    const res  = await fetch(`${FIREBASE_URL}/checkins.json`);
    const json = await res.json();
    allData = json ? Object.values(json) : [];

    const lb = buildFilteredLeaderboard(allData, activeTab);
    renderLeaderboard(lb, allData.length);

    lastUpdated = new Date();
    secondsAgo  = 0;
    startTick();
  } catch (err) {
    console.error('Leaderboard fetch failed:', err);
    lbLiveText.textContent = 'Connection error — retrying…';
  }
}

/* ─────────────────────────────────────────────────────────────
   BUILD LEADERBOARD (with optional office filter)
───────────────────────────────────────────────────────────────*/
function buildFilteredLeaderboard(data, tab) {
  // Filter raw check-ins by office when a specific tab is active
  let filtered = data;
  if (tab === 'london') {
    filtered = data.filter(d => d.office?.toLowerCase() === 'london');
  } else if (tab === 'newyork') {
    filtered = data.filter(d => d.office?.toLowerCase() === 'new york');
  }
  return buildLeaderboard(filtered);
}

function buildLeaderboard(data) {
  const map = {};

  data.forEach(d => {
    if (!d.name) return;
    const key = d.name.toLowerCase();
    if (!map[key]) {
      map[key] = {
        name:        d.name,
        office:      d.office,
        checkpoints: new Set(),
        lastTime:    d.timestamp
      };
    }
    if (d.checkpoint) map[key].checkpoints.add(d.checkpoint);
    if (d.timestamp && d.timestamp > map[key].lastTime) map[key].lastTime = d.timestamp;
  });

  return Object.values(map)
    .map(p => ({ ...p, count: p.checkpoints.size }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return new Date(a.lastTime) - new Date(b.lastTime); // earlier = better tie-break
    });
}

/* ─────────────────────────────────────────────────────────────
   RENDER
───────────────────────────────────────────────────────────────*/
function renderLeaderboard(lb, totalCheckins) {
  // lbTotalPlayers reflects the current tab's player count
  lbTotalPlayers.textContent  = lb.length;
  lbTotalCheckins.textContent = totalCheckins;

  if (lb.length === 0) {
    const tabLabel = activeTab === 'london' ? 'London' : activeTab === 'newyork' ? 'New York' : null;
    const msg = tabLabel
      ? `No check-ins from ${tabLabel} yet. Waiting for players…`
      : 'No check-ins yet. Waiting for players…';
    lbBody.innerHTML = `<div class="lb-loading">${msg}</div>`;
    return;
  }

  const html = lb.map((p, i) => {
    const rank    = i + 1;
    const pct     = Math.round((p.count / 100) * 100);
    const rankStr = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const badge   = officeBadge(p.office);

    return `
      <div class="lb-row ${rankClass}" style="animation-delay:${Math.min(i * 0.03, 0.5)}s">
        <span class="lb-rank">${rankStr}</span>
        <span class="lb-name">${esc(p.name)}</span>
        <span class="lb-office">${badge}</span>
        <span class="lb-cp-count">${p.count}/100</span>
        <div class="lb-bar-wrap">
          <div class="lb-bar-bg">
            <div class="lb-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lbBody.innerHTML = html;
}

/* ─────────────────────────────────────────────────────────────
   TICK (seconds since last update)
───────────────────────────────────────────────────────────────*/
function startTick() {
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    secondsAgo++;
    if (secondsAgo === 1) {
      lbLiveText.textContent = 'Updated just now';
    } else {
      lbLiveText.textContent = `Updated ${secondsAgo}s ago`;
    }
    lbLastUpdated.textContent = `Last updated: ${secondsAgo}s ago`;
  }, 1000);
}

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────*/
function officeBadge(office) {
  if (office === 'London')   return `<span class="badge-london">London</span>`;
  if (office === 'New York') return `<span class="badge-ny">New York</span>`;
  return `<span style="color:#666;font-size:.78rem;">${esc(office || '—')}</span>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─────────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────────────*/
fetchAndRender();
setInterval(fetchAndRender, POLL_INTERVAL);

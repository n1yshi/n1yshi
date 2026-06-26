(function () {
  const days = 90;
  let theme = 'dark';

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('uptime_history') || '{}');
    } catch { return {}; }
  }

  function setHistory(h) {
    try { localStorage.setItem('uptime_history', JSON.stringify(h)); } catch {}
  }

  function getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  function recordResult(online) {
    const h = getHistory();
    const key = getTodayKey();
    if (!h[key]) h[key] = [];
    h[key].push({ t: Date.now(), s: online ? 'up' : 'down' });
    setHistory(h);
  }

  function computeDailyStates() {
    const h = getHistory();
    const now = new Date();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const entries = h[key];

      if (!entries || entries.length === 0) {
        result.push({ date: key, state: 'none' });
      } else {
        const hasDown = entries.some(e => e.s === 'down');
        result.push({ date: key, state: hasDown ? 'down' : 'up' });
      }
    }
    return result;
  }

  function computeUptime() {
    const states = computeDailyStates();
    const total = states.filter(s => s.state !== 'none').length;
    const up = states.filter(s => s.state === 'up').length;
    if (total === 0) return 100;
    return ((up / total) * 100).toFixed(3);
  }

  function renderBars() {
    const container = document.getElementById('incident-bars');
    const states = computeDailyStates();
    const now = new Date();

    container.innerHTML = states.map((s, i) => {
      const d = new Date(s.date);
      const cls = s.state === 'up' ? 'bg-pink'
        : s.state === 'down' ? 'bg-red'
        : 'bg-muted';
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const statusLabel = s.state === 'up' ? 'All good'
        : s.state === 'down' ? 'Downtime'
        : 'No data';
      return `<div class="incident-bar ${cls}" title="${label} • ${statusLabel}"></div>`;
    }).join('');
  }

  function setStatus(online, latency) {
    const iconBox = document.getElementById('status-icon-box');
    const title = document.getElementById('status-title');
    const subtitle = document.getElementById('status-subtitle');
    const catHeader = document.getElementById('cat-header');
    const monitorIcon = document.getElementById('monitor-icon');
    const sla = document.getElementById('monitor-sla');

    const key = online ? 'operational' : 'outage';
    const label = online ? 'All Systems Operational' : 'Service Offline';

    const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    const crossIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

    iconBox.className = 'status-icon-box ' + key;
    iconBox.innerHTML = online ? checkIcon : crossIcon;

    catHeader.className = 'category-header ' + key;
    monitorIcon.className = 'monitor-icon-wrap ' + key;
    monitorIcon.innerHTML = online ? checkIcon : crossIcon;

    title.textContent = label;
    const now = new Date();
    subtitle.textContent = 'Last check at ' + now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) + (latency !== null ? ' (' + latency + 'ms)' : '');

    const uptime = computeUptime();
    sla.textContent = uptime + '% uptime';

    renderBars();
  }

  async function checkStatus() {
    const online = document.getElementById('status-icon-box');
    const start = performance.now();
    try {
      await fetch('https://azuso.n1yshi.dev', { mode: 'no-cors' });
      const ms = Math.round(performance.now() - start);
      recordResult(true);
      setStatus(true, ms);
    } catch {
      const ms = Math.round(performance.now() - start);
      recordResult(false);
      setStatus(false, ms);
    }
  }

  function showContent() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('status-section').style.display = '';
    document.getElementById('categories-container').style.display = '';
    document.getElementById('bars-legend').style.display = '';
  }

  function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark');
    theme = body.classList.contains('dark') ? 'dark' : 'light';
    document.getElementById('theme-toggle').textContent = theme === 'dark' ? '○' : '●';
  }

  function init() {
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle').textContent = '○';

    checkStatus().then(showContent);

    setInterval(checkStatus, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

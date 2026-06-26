(function () {
  const CACHE_KEY = 'anilist_profile_v3';
  const CACHE_TTL = 3600000;

  const PROFILE_QUERY = `
    query ($username: String) {
      User(name: $username) {
        name
        avatar { large }
        bannerImage
        statistics {
          anime {
            count
            episodesWatched
            minutesWatched
          }
        }
        favourites {
          anime(page: 1, perPage: 20) {
            nodes { id title { romaji english } }
          }
          manga(page: 1, perPage: 20) {
            nodes { id title { romaji english } }
          }
          characters(page: 1, perPage: 20) {
            nodes { id name { full } image { large } }
          }
        }
      }
    }
  `;

  function anilist(query, variables) {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 15000);
    return fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    }).then(function (r) {
      clearTimeout(timeout);
      return r.json();
    }).catch(function () {
      clearTimeout(timeout);
      return null;
    });
  }

  function getCachedProfile() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          return parsed.data;
        }
      }
    } catch {}
    return null;
  }

  function setCachedProfile(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {}
  }

  function renderProfile(data) {
    const user = data?.data?.User;
    if (!user) return;

    const pic = document.getElementById('profile-pic');
    if (pic && user.avatar?.large) {
      pic.src = user.avatar.large;
      pic.alt = user.name + ' avatar';
    }

    const banner = document.getElementById('bg-banner');
    if (banner && user.bannerImage) {
      banner.style.backgroundImage = 'url(' + user.bannerImage + ')';
    }

    const stats = user.statistics?.anime;
    if (stats) {
      const el = document.getElementById('stat-count');
      if (el) el.textContent = stats.count;
      const el2 = document.getElementById('stat-episodes');
      if (el2) el2.textContent = stats.episodesWatched;
      const el3 = document.getElementById('stat-minutes');
      if (el3) el3.textContent = stats.minutesWatched;
    }

    var favs = user.favourites;

    function makeCharItem(c) {
      var a = document.createElement('a');
      a.href = 'https://anilist.co/character/' + c.id;
      a.target = '_blank';
      a.className = 'fav-card';
      var img = document.createElement('img');
      img.src = c.image?.large || '';
      img.alt = c.name?.full || '';
      img.className = 'fav-char-img';
      a.appendChild(img);
      var span = document.createElement('span');
      span.textContent = c.name?.full;
      a.appendChild(span);
      return a;
    }

    function makeMediaItem(m, type) {
      var a = document.createElement('a');
      a.href = 'https://anilist.co/' + type + '/' + m.id;
      a.target = '_blank';
      a.className = 'fav-card';
      a.textContent = m.title?.english || m.title?.romaji;
      return a;
    }

    function setupCategory(containerId, nodes, fn) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      var items = nodes || [];
      if (!items.length) return;
      container.appendChild(fn(items[0]));
      if (items.length > 1) {
        var extra = document.createElement('div');
        extra.className = 'fav-extra';
        extra.style.display = 'none';
        for (var i = 1; i < items.length; i++) extra.appendChild(fn(items[i]));
        container.appendChild(extra);
        var more = document.createElement('div');
        more.className = 'fav-more';
        more.textContent = '> view more';
        more.addEventListener('click', function () {
          var hidden = extra.style.display === 'none';
          extra.style.display = hidden ? '' : 'none';
          this.textContent = hidden ? '> view less' : '> view more';
        });
        container.appendChild(more);
      }
    }

    setupCategory('fav-characters', favs?.characters?.nodes, makeCharItem);
    setupCategory('fav-animes', favs?.anime?.nodes, function (m) { return makeMediaItem(m, 'anime'); });
    setupCategory('fav-mangas', favs?.manga?.nodes, function (m) { return makeMediaItem(m, 'manga'); });
  }

  let statusDot = null;
  let statusText = null;

  async function checkStatus() {
    if (!statusDot) {
      statusDot = document.getElementById('status-dot');
      statusText = document.getElementById('status-text');
    }
    if (!statusDot) return;

    statusDot.className = 'status-dot';
    statusText.textContent = 'checking...';

    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 10000);
    const start = performance.now();
    try {
      await fetch('https://azuso.n1yshi.dev', { signal: controller.signal });
      clearTimeout(timeout);
      const ms = Math.round(performance.now() - start);
      statusDot.className = 'status-dot online';
      statusText.textContent = 'online (' + ms + 'ms)';
    } catch {
      clearTimeout(timeout);
      const ms = Math.round(performance.now() - start);
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'offline (' + ms + 'ms)';
    }
  }

  async function loadProfile() {
    const cached = getCachedProfile();
    if (cached) {
      renderProfile(cached);
      return;
    }
    const data = await anilist(PROFILE_QUERY, { username: 'n1yshi' });
    const user = data?.data?.User;
    if (user) {
      setCachedProfile(data);
      renderProfile(data);
    }
  }

  function init() {
    loadProfile();
    checkStatus();
    setInterval(checkStatus, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

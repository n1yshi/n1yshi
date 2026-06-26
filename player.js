(function () {
  var video = document.getElementById('player-video');
  var stage = document.getElementById('player-stage');
  var playerEl = document.getElementById('modal-player');
  var body = document.getElementById('modal-body');
  var detail = document.getElementById('modal-episode-detail');
  var hlsInstance = null;

  var currentStreams = [];
  var currentProvider = null;
  var currentAnilistId = null;
  var currentEp = null;
  var currentAudio = null;
  var currentProviders = [];
  var controlBar = null;
  var serverSelect = null;
  var providerSelect = null;

  function destroyHls() {
    if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  }

  function loadHlsJs(cb) {
    if (typeof Hls !== 'undefined') { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    s.onload = cb;
    document.head.appendChild(s);
  }

  function playStream(stream) {
    destroyHls();
    video.pause();
    video.src = '';
    video.style.display = 'none';
    // Remove old iframe/video from stage (keep controls)
    var existing = stage.querySelector('.player-iframe');
    if (existing) existing.remove();
    var v = stage.querySelector('#player-video');
    if (v) v.remove();

    var url = stream.url;
    var type = stream.type || '';

    if (type === 'embed' || (url.match(/^https?:\/\//) && !url.match(/\.(mp4|m3u8|webm|ogg)$/i))) {
      stage.innerHTML =
        '<div class="player-controls" id="player-controls"></div>' +
        '<iframe class="player-iframe" src="' + url + '" frameborder="0" allowfullscreen></iframe>';
      restoreControls();
      return;
    }

    stage.innerHTML = '<div class="player-controls" id="player-controls"></div>';
    stage.appendChild(video);
    video.style.display = 'block';
    restoreControls();

    if (url.match(/\.m3u8/)) {
      loadHlsJs(function () {
        if (Hls.isSupported()) {
          hlsInstance = new Hls();
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.play().catch(function () {});
        }
      });
      return;
    }

    video.src = url;
    video.play().catch(function () {});
  }

  function restoreControls() {
    controlBar = document.getElementById('player-controls');
    if (!controlBar) return;
    controlBar.innerHTML = '';
    var html = '<span class="player-prov-label">' + currentProvider + '</span>';

    if (currentStreams.length > 1) {
      html += '<select class="player-server-select">';
      currentStreams.forEach(function (s, idx) {
        html += '<option value="' + idx + '"' + (idx === 0 ? ' selected' : '') + '>' + s.server + ' (' + s.type + ')</option>';
      });
      html += '</select>';
    }

    if (currentProviders.length > 1) {
      html += '<select class="player-provider-select">';
      currentProviders.forEach(function (p) {
        html += '<option value="' + p + '"' + (p === currentProvider ? ' selected' : '') + '>' + p + '</option>';
      });
      html += '</select>';
    }

    controlBar.innerHTML = html;

    serverSelect = controlBar.querySelector('.player-server-select');
    providerSelect = controlBar.querySelector('.player-provider-select');

    if (serverSelect) {
      serverSelect.addEventListener('change', function () {
        var idx = parseInt(this.value, 10);
        if (!isNaN(idx) && currentStreams[idx]) playStream(currentStreams[idx]);
      });
    }

    if (providerSelect) {
      providerSelect.addEventListener('change', function () {
        var newProvider = this.value;
        if (newProvider && newProvider !== currentProvider) switchProvider(newProvider);
      });
    }
  }

  async function switchProvider(newProvider) {
    try {
      var res = await fetch('https://azuso.n1yshi.dev/watch/' + newProvider + '/' + currentAnilistId + '/' + currentAudio + '/' + currentEp);
      if (!res.ok) return;
      var data = await res.json();
      var candidates = [currentAudio, 'sdub', 'sub', 'dub', 'streams'];
      var newStreams = null;
      for (var i = 0; i < candidates.length; i++) {
        var key = candidates[i];
        var section = data[key];
        if (section && Array.isArray(section.streams) && section.streams.length) { newStreams = section.streams; break; }
      }
      if (newStreams && newStreams.length) {
        currentStreams = newStreams;
        currentProvider = newProvider;
        if (currentStreams.length) playStream(currentStreams[0]);
      }
    } catch (e) {}
  }

  function sortStreams(streams) {
    return streams.slice().sort(function (a, b) {
      var aDefault = a.default ? 1 : 0;
      var bDefault = b.default ? 1 : 0;
      if (bDefault !== aDefault) return bDefault - aDefault;
      var aPrio = a.priority || 0;
      var bPrio = b.priority || 0;
      if (bPrio !== aPrio) return bPrio - aPrio;
      var aHls = a.type === 'hls' ? 1 : 0;
      var bHls = b.type === 'hls' ? 1 : 0;
      return bHls - aHls;
    });
  }

  window._playerPlay = function (streams, provider, anilistId, ep, audio, providers) {
    currentStreams = sortStreams(streams);
    currentProvider = provider;
    currentAnilistId = anilistId;
    currentEp = ep;
    currentAudio = audio;
    currentProviders = providers || [];

    body.style.display = 'none';
    detail.style.display = 'none';
    playerEl.style.display = 'flex';

    if (currentStreams.length) playStream(currentStreams[0]);
  };

  window._playerStop = function () {
    destroyHls();
    video.pause();
    video.src = '';
    video.style.display = 'none';
    stage.innerHTML = '';
    playerEl.style.display = 'none';
    currentStreams = [];
    currentProvider = null;
    currentAnilistId = null;
    currentEp = null;
    currentAudio = null;
  };
})();
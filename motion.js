(function () {
  'use strict';

  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var host = document.getElementById('rings');
  if (host) {
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

    var N = 78, STEPS = 90, svg = '';
    var drift = [0, 0];
    for (var i = 1; i <= N; i++) {
      var base = i * 6.3;
      var k = 0.012 + (i / N) * 0.05;
      var p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28;
      var a1 = k * (0.6 + rnd()), a2 = k * 0.7 * (0.5 + rnd()), a3 = k * 0.35 * rnd();
      drift[0] += (rnd() - 0.45) * 1.1;
      drift[1] += (rnd() - 0.5) * 0.9;

      var d = '';
      for (var s = 0; s <= STEPS; s++) {
        var t = s / STEPS * 6.2832;
        var r = base * (1 + a1 * Math.sin(2 * t + p1) + a2 * Math.sin(3 * t + p2) + a3 * Math.sin(7 * t + p3));
        var x = r * Math.cos(t) + drift[0] * 3;
        var y = r * Math.sin(t) + drift[1] * 3;
        d += (s ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }

      var w = 0.7 + rnd() * 2.6;
      var dash = '';
      if (rnd() < 0.28) {
        var len = 1200 + i * 30;
        dash = ' stroke-dasharray="' + (len * (0.4 + rnd() * 0.4)).toFixed(0) + ' ' + (10 + rnd() * 50).toFixed(0) + ' ' + (len * 0.15 * rnd()).toFixed(0) + ' ' + (6 + rnd() * 30).toFixed(0) + '"';
      }
      svg += '<path style="--i:' + i + ';--o:' + (0.55 + rnd() * 0.45).toFixed(2) + '" stroke-width="' + w.toFixed(2) + '"' + dash + ' d="' + d + '"/>';
    }
    host.innerHTML = '<svg viewBox="-520 -520 1040 1040" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
  }

  var groups = [
    '.about-grid > .block', '.section > .eyebrow', '.section > h2',
    '.project-list li', '.fav-category', '.contact-block'
  ];
  var seen = [];
  groups.forEach(function (sel) {
    var n = 0;
    $$(sel).forEach(function (el) {
      if (seen.indexOf(el) !== -1) return;
      seen.push(el);
      el.classList.add('reveal');
      el.style.setProperty('--d', Math.min(n++, 5));
    });
  });

  var items = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

})();

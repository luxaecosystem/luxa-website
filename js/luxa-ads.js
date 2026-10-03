/* LUXA ads loader — Coinzilla banners.
   Si attiva solo se l'utente ha scelto "Accept All" nel banner cookie
   (localStorage: luxa_cookie_consent -> { choice: 'all' }). */
(function () {
  'use strict';

  var ZONES = {
    wide:   { id: '116ac063863d862504', w: '728', h: '90'  },
    narrow: { id: '3056ac063863ba0744', w: '300', h: '250' }
  };

  function hasFullConsent() {
    try {
      var raw = localStorage.getItem('luxa_cookie_consent');
      if (!raw) return false;
      var data = JSON.parse(raw);
      return !!data && data.choice === 'all';
    } catch (_) {
      return false;
    }
  }

  function init() {
    var slot = document.querySelector('.luxa-ad-slot');
    if (!slot || !hasFullConsent()) return;

    var z = window.innerWidth >= 768 ? ZONES.wide : ZONES.narrow;
    slot.style.cssText = 'text-align:center;margin:28px auto;max-width:100%;overflow:hidden;';
    slot.innerHTML =
      '<div style="font:10px/1 monospace;letter-spacing:1px;color:#64748b;margin-bottom:6px;">ADVERTISEMENT</div>' +
      '<div class="coinzilla" data-zone="C-' + z.id + '"></div>';

    window.coinzilla_display = window.coinzilla_display || [];
    window.coinzilla_display.push({ zone: z.id, width: z.w, height: z.h });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://coinzillatag.com/lib/display.js';
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

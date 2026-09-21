/* ============================================================
   include.js — Component loader LUXA

   Carica i frammenti HTML condivisi (nav, footer, ...) e li
   sostituisce agli elementi contrassegnati con [data-include].

   USO:
     <div data-include="nav"></div>
     <div data-include="footer"></div>
     ...
     <script src="js/include.js" defer></script>
     <script src="js/script.js" defer></script>

   Novità rispetto alla versione precedente:
   - il percorso di /partials è calcolato dalla posizione di questo
     file, quindi funziona anche da pagine in sotto-cartelle;
   - il segnaposto viene sostituito dal contenuto (niente <div> extra);
   - se un partial non si carica compare una versione minimale
     invece di una pagina senza navigazione;
   - link attivo corretto: prima TUTTI i link "index.html#..." risultavano
     attivi sulla home. Ora la pagina corrente è evidenziata solo per i
     link senza ancora, e sulla home lo scrollspy evidenzia la sezione
     che si sta leggendo;
   - l'anno del copyright si aggiorna da solo ([data-year]);
   - espone window.luxaComponentsReady per gli script che partono dopo.
   ============================================================ */

(function () {
    'use strict';

    // Cartella dei partials, risolta rispetto a questo script (../partials/)
    var scriptEl = document.currentScript;
    var PARTIALS_BASE = scriptEl && scriptEl.src
        ? new URL('../partials/', scriptEl.src)
        : new URL('partials/', document.baseURI);

    var FALLBACKS = {
        nav:
            '<nav id="navbar" class="scrolled" aria-label="Main navigation">' +
            '<div class="nav-container"><a href="index.html" class="nav-logo">' +
            '<img src="assets/images/logoluxa.png" alt=""><span>LUXA</span></a></div></nav>',
        footer:
            '<footer id="footer"><div class="footer-bottom"><div class="container">' +
            '<p>&copy; <span data-year></span> LUXA Ecosystem SARL. All rights reserved.</p>' +
            '</div></div></footer>'
    };

    function fetchPartial(name) {
        var url = new URL(name + '.html', PARTIALS_BASE);
        return fetch(url, { credentials: 'same-origin' }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status + ' su ' + url.pathname);
            return res.text();
        });
    }

    function inject(el, html) {
        var tpl = document.createElement('template');
        tpl.innerHTML = html;
        el.replaceWith(tpl.content);
    }

    function loadInclude(el) {
        var name = el.getAttribute('data-include');
        return fetchPartial(name)
            .then(function (html) { inject(el, html); })
            .catch(function (err) {
                console.error('[include.js] Impossibile caricare "' + name + '":', err);
                if (location.protocol === 'file:') {
                    console.warn('[include.js] Stai aprendo il file da file://. fetch() non funziona: usa un server locale (es. "npx serve" o "python -m http.server").');
                }
                if (FALLBACKS[name]) inject(el, FALLBACKS[name]);
            });
    }

    // ---- Link attivo ------------------------------------------------------
    function normalize(pathname) {
        var last = pathname.split('/').pop() || 'index';
        return last.replace(/\.html$/, '') || 'index';
    }

    function navLinks() {
        return Array.prototype.slice.call(
            document.querySelectorAll('#navbar .nav-links a, .mobile-menu a')
        );
    }

    function sameSiteUrl(a) {
        try {
            var u = new URL(a.getAttribute('href'), location.href);
            return u.origin === location.origin ? u : null;
        } catch (_) { return null; }
    }

    function highlightCurrentPage() {
        var current = normalize(location.pathname);
        navLinks().forEach(function (a) {
            var u = sameSiteUrl(a);
            if (u && !u.hash && normalize(u.pathname) === current) {
                a.classList.add('active');
                a.setAttribute('aria-current', 'page');
            }
        });
    }

    // Scrollspy: evidenzia il link "index.html#sezione" della sezione visibile
    function initScrollSpy() {
        if (!('IntersectionObserver' in window)) return;
        var current = normalize(location.pathname);
        var bySection = new Map();

        navLinks().forEach(function (a) {
            var u = sameSiteUrl(a);
            if (!u || !u.hash || normalize(u.pathname) !== current) return;
            var section = document.getElementById(u.hash.slice(1));
            if (!section) return;
            if (!bySection.has(section)) bySection.set(section, []);
            bySection.get(section).push(a);
        });
        if (!bySection.size) return;

        function setActive(section) {
            bySection.forEach(function (links, sec) {
                links.forEach(function (a) {
                    var on = sec === section;
                    a.classList.toggle('active', on);
                    if (on) a.setAttribute('aria-current', 'location');
                    else a.removeAttribute('aria-current');
                });
            });
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target); });
        }, { rootMargin: '-45% 0px -50% 0px' }); // sezione che attraversa il centro dello schermo

        bySection.forEach(function (_, sec) { io.observe(sec); });
        window.addEventListener('scroll', function () {
            if (window.scrollY < 120) setActive(null);
        }, { passive: true });
    }

    function setYear() {
        var year = String(new Date().getFullYear());
        document.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = year; });
    }

    // ---- Avvio ------------------------------------------------------------
    function loadAllIncludes() {
        var targets = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
        return Promise.all(targets.map(loadInclude)).then(function () {
            window.luxaComponentsReady = true;
            setYear();
            highlightCurrentPage();
            initScrollSpy();
            document.dispatchEvent(new CustomEvent('luxa:components-ready'));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllIncludes);
    } else {
        loadAllIncludes();
    }
})();

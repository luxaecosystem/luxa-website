// LUXA Ecosystem — script.js
document.addEventListener('DOMContentLoaded', () => {

    // ===== Preloader =====
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => preloader && preloader.classList.add('hidden'), 400);
    });
    // Fallback se 'load' non arriva
    setTimeout(() => preloader && preloader.classList.add('hidden'), 3500);

    // ===== Navbar scroll =====
    const navbar = document.getElementById('navbar');
    const onScroll = () => {
        navbar && navbar.classList.toggle('scrolled', window.scrollY > 40);
        backToTop && backToTop.classList.toggle('visible', window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll);

    // ===== Mobile menu =====
    const toggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (toggle && mobileMenu) {
        toggle.addEventListener('click', () => {
            const open = mobileMenu.classList.toggle('open');
            toggle.classList.toggle('active', open);
        });
        mobileMenu.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => mobileMenu.classList.remove('open'))
        );
    }

    // ===== Back to top =====
    const backToTop = document.getElementById('backToTop');
    if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ===== Particles =====
    const particlesBox = document.getElementById('particles');
    if (particlesBox) {
        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 4 + 2;
            p.style.width = p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (Math.random() * 10 + 8) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            particlesBox.appendChild(p);
        }
    }

    // ===== Live stats (animazione contatore) =====
    const animateStat = (el, target, suffix = '') => {
        if (!el) return;
        let cur = 0;
        const step = target / 80;
        const tick = () => {
            cur += step;
            if (cur >= target) { el.textContent = Math.round(target).toLocaleString() + suffix; return; }
            el.textContent = Math.round(cur).toLocaleString() + suffix;
            requestAnimationFrame(tick);
        };
        tick();
    };
    animateStat(document.getElementById('statMiners'), 12480, '+');
    animateStat(document.getElementById('statCountries'), 87);
    animateStat(document.getElementById('statBlocks'), 154230);

    // ===== Explorer: dati mock =====
    const blocksBody = document.getElementById('blocksBody');
    if (blocksBody) {
        const now = Date.now();
        let html = '';
        for (let i = 0; i < 8; i++) {
            const height = 154230 - i;
            const hash = '0x' + Array.from({length: 12}, () => 'abcdef0123456789'[Math.floor(Math.random()*16)]).join('');
            const txs = Math.floor(Math.random() * 900) + 50;
            const time = new Date(now - i * 42000).toLocaleTimeString();
            html += `<tr><td class="mono">#${height.toLocaleString()}</td><td class="mono">${hash}…</td><td>${txs}</td><td>${time}</td><td><span class="badge-ok">Confirmed</span></td></tr>`;
        }
        blocksBody.innerHTML = html;

        const txBody = document.getElementById('txBody');
        let tx = '';
        for (let i = 0; i < 8; i++) {
            const h = '0x' + Array.from({length: 12}, () => 'abcdef0123456789'[Math.floor(Math.random()*16)]).join('');
            const from = 'lux1' + Array.from({length: 8}, () => 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random()*23)]).join('');
            const to = 'lux1' + Array.from({length: 8}, () => 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random()*23)]).join('');
            const amt = (Math.random() * 0.0009 + 0.00001).toFixed(8);
            tx += `<tr><td class="mono">${h}…</td><td class="mono">${from}…</td><td class="mono">${to}…</td><td>${amt} LUXA</td></tr>`;
        }
        txBody.innerHTML = tx;

        // ricerca finta
        const form = document.getElementById('explorerSearchForm');
        form && form.addEventListener('submit', e => e.preventDefault());
    }
});

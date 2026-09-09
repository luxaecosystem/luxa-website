/* ========================================
   LUXA TOKEN — Interactive Scripts & Live Chain Sync
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {

    // ===== PRELOADER =====
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 1200);
    }

    // ===== NAVBAR SCROLL =====
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (!navbar) return;
        if (window.pageYOffset > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ===== MOBILE MENU =====
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            const spans = mobileToggle.querySelectorAll('span');

            if (mobileMenu.classList.contains('open')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Chiude il menu mobile al clic sui link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                const spans = mobileToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    // ===== SAFE SMOOTH SCROLL (solo per ancore interne #id) =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== BACK TO TOP =====
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== PARTICLES =====
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        const particleCount = 28;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 8 + 8) + 's';
            particle.style.animationDelay = (Math.random() * 6) + 's';
            particle.style.width = (Math.random() * 3 + 2) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }

    // ===== ANIMATE ON SCROLL (AOS) =====
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

    // ===== CARD 3D TILT =====
    if (window.innerWidth > 768) {
        document.querySelectorAll('.about-card, .token-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 22;
                const rotateY = (centerX - x) / 22;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // ===== CONFETTI ON MINING CTA =====
    const ctaButton = document.querySelector('#cta .btn-primary');
    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            createConfetti(e.clientX, e.clientY);
        });
    }

    function createConfetti(x, y) {
        const colors = ['#00f5d4', '#0066ff', '#f59e0b', '#10b981', '#ffffff'];
        for (let i = 0; i < 24; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 7px;
                height: 7px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                left: ${x}px;
                top: ${y}px;
            `;
            document.body.appendChild(confetti);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 80 + 40;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            let posX = x;
            let posY = y;
            let opacity = 1;

            const animate = () => {
                posX += vx * 0.02;
                posY += vy * 0.02 + 1.5;
                opacity -= 0.025;
                confetti.style.left = posX + 'px';
                confetti.style.top = posY + 'px';
                confetti.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    confetti.remove();
                }
            };
            requestAnimationFrame(animate);
        }
    }

    // ===== LIVE CHAIN SYNC (COSMOS RPC / STATUS) =====
    const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';
    let hasAnimatedFirstTime = false;

    async function fetchLiveChainMetrics() {
        const statBlocks = document.getElementById('statBlocks');
        const statMiners = document.getElementById('statMiners');
        const statCountries = document.getElementById('statCountries');

        // Assicura che i testi statici siano sempre 'Actif'
        if (statMiners && statMiners.textContent !== 'Actif') statMiners.textContent = 'Actif';
        if (statCountries && statCountries.textContent !== 'Actif') statCountries.textContent = 'Actif';

        try {
            const res = await fetch(`${RPC_ENDPOINT}/status`);
            if (!res.ok) throw new Error(`RPC status: ${res.status}`);
            
            const data = await res.json();
            const latestHeight = parseInt(data.result?.sync_info?.latest_block_height || 0, 10);

            if (latestHeight > 0 && statBlocks) {
                if (!hasAnimatedFirstTime) {
                    animateBlockCounter(statBlocks, latestHeight);
                    hasAnimatedFirstTime = true;
                } else {
                    // Aggiornamento discreto quando arriva un nuovo blocco
                    statBlocks.textContent = `${latestHeight.toLocaleString('fr-FR')} +`;
                }
            }
        } catch (err) {
            console.warn('Sync RPC offline o blocco CORS:', err.message);
            if (statBlocks && (statBlocks.textContent === '' || statBlocks.querySelector('.fa-spinner'))) {
                statBlocks.textContent = '57 922+';
            }
        }
    }

    function animateBlockCounter(element, target) {
        let current = Math.max(0, target - 50); // Parte da 50 blocchi prima per un effetto rapido
        const step = 1;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = `${target.toLocaleString('fr-FR')} +`;
                clearInterval(timer);
            } else {
                element.textContent = `${current.toLocaleString('fr-FR')}`;
            }
        }, 15);
    }

    // Avvio immediato e polling ogni 5 secondi
    fetchLiveChainMetrics();
    setInterval(fetchLiveChainMetrics, 5000);

    console.log('LUXA Ecosystem — Live Cosmos SDK Sync initialized.');
});

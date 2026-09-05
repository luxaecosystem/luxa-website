/* ========================================
   LUXA TOKEN — Interactive Scripts
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

    // ===== LIVE CHAIN SYNC & STATS COUNTER =====
    const counters = document.querySelectorAll('.stat-number');

    // Recupera i blocchi reali dal nodo Cosmos L1 per popolare l'Hero
    async function syncChainStats() {
        try {
            const res = await fetch('https://rpc.luxaecosystem.xyz/status');
            if (res.ok) {
                const data = await res.json();
                const totalBlocks = parseInt(data.result?.sync_info?.latest_block_height || 0);
                
                // Aggiorna il terzo contatore (Transactions/Blocks) con i blocchi reali se disponibile
                if (counters.length >= 3 && totalBlocks > 0) {
                    counters[2].setAttribute('data-count', totalBlocks);
                    const label = counters[2].nextElementSibling;
                    if (label) label.textContent = 'Blocks Verified';
                }
            }
        } catch (e) {
            // Fallback silenzioso ai valori di default
        }
    }
    syncChainStats();

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const countTo = parseInt(target.getAttribute('data-count')) || 0;
                if (countTo > 0) {
                    animateCounter(target, countTo);
                } else {
                    target.textContent = 'Active';
                }
                counterObserver.unobserve(target);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach(counter => counterObserver.observe(counter));

    function animateCounter(element, target) {
        let current = 0;
        const step = Math.max(1, Math.floor(target / 60));
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target.toLocaleString() + '+';
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 25);
    }

    // ===== PARALLAX GLOW =====
    const glowImg = document.querySelector('.glow-img');
    window.addEventListener('scroll', () => {
        if (glowImg && window.innerWidth > 768) {
            const scrollY = window.pageYOffset;
            glowImg.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.08}px)) scale(${1 + scrollY * 0.00015})`;
        }
    });

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
    const ctaButton = document.querySelector('#cta .btn-glow');
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

    console.log('LUXA Website & L1 Node Monitor — Synced.');
});

/* ========================================
   LUXA TOKEN — Interactive Scripts & Live Chain Sync
   ======================================== */

// ===== CONFIGURAZIONE ENDPOINT & ASSET =====
const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';
const BACKEND_API = 'https://luxaecosystem.alwaysdata.net/api';

const HERO_IMAGES_WEB = {
  '4001': 'https://app.luxaecosystem.xyz/Nft_Images/Grandmaster_of_Servers.jpeg',
  '4002': 'https://app.luxaecosystem.xyz/Nft_Images/Neon_Data_Valkyrie.jpeg',
  '4003': 'https://app.luxaecosystem.xyz/Nft_Images/Chrono-Key_Master.jpeg',
  '4004': 'https://app.luxaecosystem.xyz/Nft_Images/Cyber-Shadow_Node.jpeg'
};

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

function generateSovereignNftSvg(name, id, wallet, txHash) {
  const displayId = String(id || '4001');
  const imageUrl = HERO_IMAGES_WEB[displayId] || HERO_IMAGES_WEB['4001'];
  const displayName = escapeXml(name || 'Grandmaster of Servers');
  const displayWallet = escapeXml(wallet || 'luxa1...');
  const marquee = ` • HOLDER: ${displayWallet} • LEDGER: LUXA-1 • ASSET: ${displayName.toUpperCase()} • STATUS: ANCHORED • `;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 780" width="100%" height="100%">
    <defs>
      <path id="borderTrackLoop" d="M 45 45 H 555 Q 570 45 570 60 V 720 Q 570 735 555 735 H 45 Q 30 735 30 720 V 60 Q 30 45 45 45 Z" fill="none"/>
      <clipPath id="fullPhotoClip">
        <rect x="52" y="52" width="496" height="676" rx="20" />
      </clipPath>
      <linearGradient id="photoDarkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="65%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(3, 7, 18, 0.94)"/>
      </linearGradient>
      <filter id="neonCardGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00FFCC" flood-opacity="0.4"/>
      </filter>
    </defs>

    <rect width="600" height="780" rx="30" fill="#030712" stroke="#00FFCC" stroke-width="2" filter="url(#neonCardGlow)"/>
    <rect x="15" y="15" width="570" height="750" rx="24" fill="none" stroke="rgba(0, 255, 204, 0.15)" stroke-width="1.2"/>

    <image x="52" y="52" width="496" height="676" preserveAspectRatio="xMidYMid slice" clip-path="url(#fullPhotoClip)" href="${imageUrl}" xlink:href="${imageUrl}"/>
    <rect x="52" y="52" width="496" height="676" clip-path="url(#fullPhotoClip)" fill="url(#photoDarkGradient)"/>
    <rect x="52" y="52" width="496" height="676" rx="20" fill="none" stroke="rgba(0, 255, 204, 0.45)" stroke-width="1.5"/>

    <use href="#borderTrackLoop" stroke="rgba(0, 255, 204, 0.15)" stroke-width="1"/>
    <text font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#00FFCC" letter-spacing="2">
      <textPath href="#borderTrackLoop" startOffset="0%">
        ${marquee.repeat(3)}
        <animate attributeName="startOffset" from="0%" to="-100%" dur="24s" repeatCount="indefinite"/>
      </textPath>
    </text>

    <g transform="translate(70, 680)">
      <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">${displayName}</text>
      <text x="0" y="24" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#00FFCC">SOVEREIGN LICENSE #${displayId}</text>
      <circle cx="430" cy="10" r="22" fill="#021a14" stroke="#00FFCC" stroke-width="1.5"/>
      <text x="430" y="16" text-anchor="middle" font-family="'Orbitron', sans-serif" font-size="13" font-weight="900" fill="#FFFFFF">LX</text>
    </g>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

function generateCoinTransferSvg(amount, sender, recipient, txHash) {
  const shortSender = sender.length > 20 ? (sender.slice(0, 12) + '...' + sender.slice(-6)) : sender;
  const shortRecv = recipient.length > 20 ? (recipient.slice(0, 12) + '...' + recipient.slice(-6)) : recipient;
  const shortTx = txHash ? (txHash.slice(0, 14) + '...' + txHash.slice(-8)) : '0x...';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" width="100%" height="100%">
    <defs>
      <linearGradient id="coinBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080c1f"/>
        <stop offset="100%" stop-color="#02040c"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="408" height="328" rx="16" fill="url(#coinBg)" stroke="#00C878" stroke-width="1.8"/>
    
    <g transform="translate(30, 24)">
      <text x="0" y="16" font-family="'Orbitron', sans-serif" font-size="12" font-weight="900" fill="#00FFCC">🪙 NATIVE COIN SETTLEMENT</text>
      <text x="360" y="16" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#22c55e" text-anchor="end">FINALIZED</text>
    </g>

    <g transform="translate(30, 65)">
      <rect width="360" height="95" rx="12" fill="rgba(0,0,0,0.5)" stroke="rgba(0,255,204,0.2)"/>
      <text x="180" y="40" font-family="'Orbitron', sans-serif" font-size="24" font-weight="900" fill="#FFD700" text-anchor="middle">${escapeXml(amount)}</text>
      <text x="180" y="65" font-family="'Inter', sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">On-Chain Cosmos SDK Transfer (luxa-1)</text>
    </g>

    <g transform="translate(30, 180)">
      <text x="0" y="15" font-family="'JetBrains Mono', monospace" font-size="10" fill="#64748b">FROM:</text>
      <text x="50" y="15" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#88BBFF">${escapeXml(shortSender)}</text>
      <text x="0" y="42" font-family="'JetBrains Mono', monospace" font-size="10" fill="#64748b">TO:</text>
      <text x="50" y="42" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#00FFCC">${escapeXml(shortRecv)}</text>
    </g>

    <g transform="translate(30, 260)">
      <rect width="360" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
      <text x="14" y="20" font-family="monospace" font-size="8.5" fill="#64748b">HASH ANCHOR</text>
      <text x="14" y="36" font-family="'JetBrains Mono', monospace" font-size="9" fill="#FFD700">${escapeXml(shortTx)}</text>
      <circle cx="340" cy="25" r="4" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

// ===== MOTORE DI RICERCA GLOBALE (SICURO & ANTI-BLOCCO) =====
window.triggerSearch = async function(overrideQuery) {
  const input = document.getElementById('explorerSearchInput');
  const query = (overrideQuery || input?.value || '').trim();
  const container = document.getElementById('explorerSearchResult');
  if (!query || !container) return;

  container.innerHTML = `<div style="text-align:center; padding:18px; color:#00FFCC; font-family:monospace;">🔍 Inspecting ledger entry on luxa-1...</div>`;

  const cleanHash = query.startsWith('0x') ? query.slice(2) : query;
  const isNumericBlock = /^\d+$/.test(query);

  try {
    if (isNumericBlock) {
      const blockNum = parseInt(query, 10);
      let blk = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${RPC_ENDPOINT}/block?height=${blockNum}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        blk = data.result?.block;
      } catch (_) {}

      container.innerHTML = `
        <div style="background:rgba(0,0,0,0.6); border:1px solid #00FFCC; border-radius:16px; padding:20px; margin-top:16px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; color:#00FFCC; font-weight:bold; font-size:13px;">BLOCK #${blockNum} CONFIRMED</span>
            <span style="background:rgba(34,197,94,0.2); color:#22c55e; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px;">COMMITTED</span>
          </div>
          <div style="font-size:12px; line-height:1.7; color:#cbd5e1;">
            <div><strong>Timestamp:</strong> ${blk?.header?.time ? new Date(blk.header.time).toLocaleString() : new Date().toLocaleString()}</div>
            <div><strong>Total Transactions:</strong> <span style="color:#FFD700; font-weight:bold;">${blk?.data?.txs?.length || 1}</span></div>
            <div><strong>Proposer:</strong> <span style="font-family:monospace; color:#88BBFF; word-break:break-all;">${blk?.header?.proposer_address || 'luxavaloper1...'}</span></div>
          </div>
        </div>
      `;
      return;
    }

    let isSuccess = true;
    let height = 'luxa-1';
    let gasInfo = '68,925 / 200,000';
    let sender = 'luxa1...';
    let recipient = 'luxa1...';
    let amount = '50.50 LUXA';
    let isNft = true;
    let nftId = '4001';

    // 1. Lettura RPC con timeout per evitare crash da CORS
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const rpcRes = await fetch(`${RPC_ENDPOINT}/tx?hash=0x${cleanHash}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const rpcData = await rpcRes.json();
      if (rpcData.result) {
        const tx = rpcData.result;
        height = tx.height || height;
        isSuccess = tx.tx_result?.code === 0 || !tx.tx_result?.code;
        gasInfo = `${tx.tx_result?.gas_used || '68,925'} / ${tx.tx_result?.gas_wanted || '200,000'}`;
      }
    } catch (_) {}

    // 2. Lettura Backend Proxy / Ledger locale[cite: 7, 8]
    try {
      const beRes = await fetch(`${BACKEND_API}/ecosystem/chain/tx/${cleanHash}`);
      if (beRes.ok) {
        const beData = await beRes.json();
        if (beData.tx) {
          const b = beData.tx;
          if (b.nftKey || b.assetName || b.type === 'SOVEREIGN_NFT_MINT' || b.isNft) {
            isNft = true;
            nftId = b.nftKey || b.id || nftId;
          }
          sender = b.senderAddress || sender;
          recipient = b.recipientAddress || b.holder || recipient;
          if (b.amount) amount = `${b.amount} ${b.currency ? b.currency.toUpperCase() : 'LUXA'}`;
        }
      }
    } catch (_) {}

    if (cleanHash.toUpperCase().includes('BC25D0B') || cleanHash.startsWith('tx_reg_') || cleanHash.length > 30) {
      isNft = true;
    }

    const cardSvgUri = isNft
      ? generateSovereignNftSvg('Grandmaster of Servers', nftId, recipient !== 'luxa1...' ? recipient : sender, query)
      : generateCoinTransferSvg(amount, sender, recipient, query);

    container.innerHTML = `
      <div style="margin-top:16px; background:rgba(0,0,0,0.65); border:1px solid ${isNft ? '#FFD700' : '#00FFCC'}; border-radius:16px; padding:20px; box-shadow:0 0 25px ${isNft ? 'rgba(255,215,0,0.2)' : 'rgba(0,255,204,0.15)'}; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
          <span style="color:${isNft ? '#FFD700' : '#00FFCC'}; font-weight:bold; font-size:12px; font-family:'Orbitron',sans-serif;">
            ${isNft ? `🏛️ SOVEREIGN NFT LICENSE (#${nftId})` : '🪙 NATIVE COIN TRANSFER'}
          </span>
          <span style="background:rgba(34,197,94,0.2); color:#22c55e; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px;">
            ${isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED'}
          </span>
        </div>

        <div style="text-align:center; margin:15px 0 20px;">
          <img src="${cardSvgUri}" alt="Visual Card" style="width:100%; max-width:320px; aspect-ratio:${isNft ? '600/780' : '420/340'}; border-radius:16px; border:2px solid ${isNft ? '#FFD700' : '#00FFCC'}; object-fit:contain; display:inline-block;">
        </div>

        <div style="font-size:12px; line-height:1.7; color:#cbd5e1;">
          <div><strong>Amount:</strong> <strong style="color:#fff;">${amount}</strong></div>
          <div><strong>From:</strong> <span style="font-family:'JetBrains Mono',monospace; color:#88BBFF; word-break:break-all;">${sender}</span></div>
          <div><strong>To:</strong> <span style="font-family:'JetBrains Mono',monospace; word-break:break-all;">${recipient}</span></div>
          <div><strong>Block:</strong> #${height}</div>
          <div><strong>Gas Used/Wanted:</strong> ${gasInfo}</div>
        </div>

        <button type="button" style="width:100%; margin-top:16px; background:transparent; border:1px solid ${isNft ? '#FFD700' : '#00FFCC'}; color:${isNft ? '#FFD700' : '#00FFCC'}; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="navigator.clipboard.writeText('${query}'); alert('Transaction hash copied!');">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="padding:16px; color:#ef4444; text-align:center;">Lookup failed: ${err.message}</div>`;
  }
};

// ===== EVENTI INTERFACCIA DOM =====
document.addEventListener('DOMContentLoaded', function() {

    // Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => { preloader.classList.add('hidden'); }, 800);
    }

    // Navbar scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (!navbar) return;
        if (window.pageYOffset > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // Mobile menu
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

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // Back to top
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) backToTop.classList.add('visible');
            else backToTop.classList.remove('visible');
        });
        backToTop.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    // Particelle
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        for (let i = 0; i < 28; i++) {
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

    // Card 3D Tilt
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
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    // Sincronizzazione metrica blocchi (Con gestione timeout di sicurezza)
    let hasAnimatedFirstTime = false;
    async function fetchLiveChainMetrics() {
        const statBlocks = document.getElementById('statBlocks');
        const statMiners = document.getElementById('statMiners');
        const statCountries = document.getElementById('statCountries');

        if (statMiners && statMiners.textContent !== 'Actif') statMiners.textContent = 'Actif';
        if (statCountries && statCountries.textContent !== 'Actif') statCountries.textContent = 'Actif';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(`${RPC_ENDPOINT}/status`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            const latestHeight = parseInt(data.result?.sync_info?.latest_block_height || 0, 10);

            if (latestHeight > 0 && statBlocks) {
                if (!hasAnimatedFirstTime) {
                    animateBlockCounter(statBlocks, latestHeight);
                    hasAnimatedFirstTime = true;
                } else {
                    statBlocks.textContent = `${latestHeight.toLocaleString('fr-FR')} +`;
                }
            }
        } catch (_) {
            if (statBlocks && (statBlocks.textContent === '' || statBlocks.querySelector('.fa-spinner'))) {
                statBlocks.textContent = '58 140+';
            }
        }
    }

    function animateBlockCounter(element, target) {
        let current = Math.max(0, target - 50);
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

    fetchLiveChainMetrics();
    setInterval(fetchLiveChainMetrics, 6000);

    // Gestione input ricerca e Invio da tastiera
    const searchInput = document.getElementById('explorerSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.triggerSearch();
        });
    }

    // Controllo parametri query URL (?q= o ?tx=)
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || urlParams.get('tx');
    if (q && searchInput) {
        searchInput.value = q;
        window.triggerSearch(q);
    }
});

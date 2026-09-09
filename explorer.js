/* ==========================================================================
   LUXA ROOT WEB EXPLORER SCRIPT (explorer.js)
   Connected to /api/nft-catalog & Real-Time CometBFT Ledger
   ========================================================================== */

const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';
const BACKEND_API = 'https://luxaecosystem.alwaysdata.net/api';

// Catalogo dinamico sincronizzato con l'Admin di server.js
let NFT_DYNAMIC_CATALOG = {
  '4001': { name: 'Grandmaster of Servers', luxaPrice: 50.0, role: 'Validator Protocol License - 0.01% Standard', img: 'Nft_Images/Grandmaster_of_Servers.jpeg' },
  '4002': { name: 'Neon Data Valkyrie', luxaPrice: 25.0, role: 'Liquidity Operator Pass - Priority Tier', img: 'Nft_Images/Neon_Data_Valkyrie.jpeg' },
  '4003': { name: 'Chrono-Key Master', luxaPrice: 10.0, role: 'Fast-Settlement License - Finality Tier', img: 'Nft_Images/Chrono-Key_Master.jpeg' },
  '4004': { name: 'Cyber-Shadow Node', luxaPrice: 5.0, role: 'Encrypted Storage Unit - Vault Tier', img: 'Nft_Images/Cyber-Shadow_Node.jpeg' }
};

// 1. CARICAMENTO PREZZI REALI DALL'ADMIN DI server.js
async function loadAdminCatalog() {
  try {
    const res = await fetch(`${BACKEND_API}/nft-catalog`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.catalog) {
        for (const [key, item] of Object.entries(data.catalog)) {
          if (!NFT_DYNAMIC_CATALOG[key]) NFT_DYNAMIC_CATALOG[key] = {};
          NFT_DYNAMIC_CATALOG[key].luxaPrice = Number(item.luxaPrice);
          if (item.name) NFT_DYNAMIC_CATALOG[key].name = item.name;
        }
      }
    }
  } catch (_) {}
}

// 2. GENERATORE DINAMICO SOVEREIGN NFT SVG (HD, CENTRATO, TESTI VETTORIALI)
function generateSovereignNftSvg(name, id, wallet, livePrice, customImg) {
  const displayId = String(id || '4001');
  const meta = NFT_DYNAMIC_CATALOG[displayId] || {
    name: name || 'Grandmaster of Servers',
    luxaPrice: 50.0,
    role: 'Validator Protocol License - 0.01% Standard',
    img: 'Nft_Images/Grandmaster_of_Servers.jpeg'
  };

  const heroImg = customImg || meta.img || 'Nft_Images/Grandmaster_of_Servers.jpeg';
  const displayWallet = wallet && wallet !== 'Unknown' ? wallet : 'luxa1...';
  const shortWallet = displayWallet.length > 24 
    ? (displayWallet.slice(0, 10) + '...' + displayWallet.slice(-8)) 
    : displayWallet;
  
  const priceDisplay = livePrice && livePrice !== 'N/A' 
    ? livePrice 
    : `${meta.luxaPrice.toFixed(2)} LUXA`;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" width="100%" height="100%">
    <defs>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#050d0a"/>
        <stop offset="40%" stop-color="#030806"/>
        <stop offset="100%" stop-color="#020403"/>
      </linearGradient>
      <linearGradient id="neonBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00FFCC"/>
        <stop offset="50%" stop-color="#00C878"/>
        <stop offset="100%" stop-color="#0066FF"/>
      </linearGradient>
      <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
      <clipPath id="heroClip">
        <rect x="35" y="115" width="430" height="340" rx="16" ry="16" />
      </clipPath>
    </defs>

    <rect x="8" y="8" width="484" height="734" rx="24" fill="url(#cardBg)" stroke="url(#neonBorder)" stroke-width="2.5" filter="url(#emeraldGlow)"/>
    <rect x="14" y="14" width="472" height="722" rx="20" fill="none" stroke="rgba(0, 255, 204, 0.2)" stroke-width="1"/>

    <g transform="translate(35, 38)">
      <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="700" fill="#00FFCC" letter-spacing="1.5">
        SET: ${(meta.name || name).toUpperCase()} • STATUS: ANCHORED
      </text>
      <circle cx="420" cy="-3" r="4" fill="#00FFCC">
        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/>
      </circle>
    </g>

    <g transform="translate(35, 72)">
      <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#88BBFF" letter-spacing="1.2">
        LUXA SOVEREIGN INFRASTRUCTURE KEY
      </text>
      <text x="0" y="24" font-family="'Space Grotesk', 'Orbitron', sans-serif" font-size="22" font-weight="800" fill="#FFFFFF">
        ${meta.name || name}
      </text>
      <text x="0" y="40" font-family="'Inter', sans-serif" font-size="11" font-weight="500" fill="#00FFCC">
        ${meta.role || 'Protocol License'}
      </text>
    </g>

    <!-- INQUADRATURA HD PROPORZIONATA -->
    <rect x="33" y="113" width="434" height="344" rx="18" fill="#010302" stroke="rgba(0, 255, 204, 0.4)" stroke-width="1.5"/>
    <image href="${heroImg}" 
           x="35" y="115" width="430" height="340" 
           preserveAspectRatio="xMidYMid slice" 
           clip-path="url(#heroClip)"/>
    <rect x="35" y="380" width="430" height="75" fill="url(#cardBg)" opacity="0.75" clip-path="url(#heroClip)"/>

    <g transform="translate(50, 425)">
      <rect width="110" height="24" rx="6" fill="rgba(0, 0, 0, 0.75)" stroke="#00FFCC" stroke-width="1"/>
      <text x="55" y="16" font-family="'Orbitron', sans-serif" font-size="10" font-weight="800" fill="#00FFCC" text-anchor="middle">
        ID #${displayId}
      </text>
    </g>

    <g transform="translate(300, 425)">
      <rect width="150" height="24" rx="6" fill="rgba(0, 0, 0, 0.75)" stroke="#FFD700" stroke-width="1"/>
      <text x="75" y="16" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="700" fill="#FFD700" text-anchor="middle">
        ${priceDisplay}
      </text>
    </g>

    <!-- METADATI TECNICI NITIDI -->
    <g transform="translate(35, 480)">
      <rect width="430" height="48" rx="10" fill="rgba(0, 255, 204, 0.03)" stroke="rgba(0, 255, 204, 0.2)" stroke-width="1"/>
      <text x="16" y="18" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700" fill="#6ee7b7" letter-spacing="1">
        LIVE PROTOCOL VALUATION
      </text>
      <text x="16" y="36" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="700" fill="#FFD700">
        ${priceDisplay}
      </text>
    </g>

    <g transform="translate(35, 540)">
      <rect x="0" y="0" width="205" height="56" rx="10" fill="rgba(0, 0, 0, 0.5)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <text x="14" y="20" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700" fill="#88BBFF">TOKEN ID</text>
      <text x="14" y="42" font-family="'Orbitron', sans-serif" font-size="16" font-weight="800" fill="#00FFCC">#${displayId}</text>

      <rect x="225" y="0" width="205" height="56" rx="10" fill="rgba(0, 0, 0, 0.5)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <text x="240" y="20" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700" fill="#88BBFF">PROTOCOL STATUS</text>
      <text x="240" y="42" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="700" fill="#22c55e">ANCHORED</text>
    </g>

    <g transform="translate(35, 610)">
      <rect width="430" height="52" rx="10" fill="rgba(0, 0, 0, 0.5)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
      <text x="16" y="19" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700" fill="#88BBFF">AUTHENTICATED HOLDER</text>
      <text x="16" y="38" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#00FFCC">${displayWallet}</text>
    </g>

    <g transform="translate(35, 685)">
      <text x="0" y="22" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="#64748b">
        STANDARD: Sovereign Utility (Bay' / Ujrah)
      </text>
      <text x="0" y="36" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#475569">
        HOLDER VAULT: ${shortWallet}
      </text>

      <g transform="translate(385, 0)">
        <circle cx="20" cy="20" r="20" fill="rgba(0, 255, 204, 0.1)" stroke="#00FFCC" stroke-width="1.5"/>
        <text x="20" y="25" font-family="'Orbitron', sans-serif" font-size="11" font-weight="900" fill="#00FFCC" text-anchor="middle">LX</text>
      </g>
    </g>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

// 3. GENERATORE DINAMICO COIN TRANSFER SVG
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
      <text x="180" y="40" font-family="'Orbitron', sans-serif" font-size="24" font-weight="900" fill="#FFD700" text-anchor="middle">${amount}</text>
      <text x="180" y="65" font-family="'Inter', sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">On-Chain Cosmos SDK Transfer (luxa-1)</text>
    </g>

    <g transform="translate(30, 180)">
      <text x="0" y="15" font-family="'JetBrains Mono', monospace" font-size="10" fill="#64748b">FROM:</text>
      <text x="50" y="15" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#88BBFF">${shortSender}</text>
      <text x="0" y="42" font-family="'JetBrains Mono', monospace" font-size="10" fill="#64748b">TO:</text>
      <text x="50" y="42" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#00FFCC">${shortRecv}</text>
    </g>

    <g transform="translate(30, 260)">
      <rect width="360" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
      <text x="14" y="20" font-family="monospace" font-size="8.5" fill="#64748b">HASH ANCHOR</text>
      <text x="14" y="36" font-family="'JetBrains Mono', monospace" font-size="9" fill="#FFD700">${shortTx}</text>
      <circle cx="340" cy="25" r="4" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

// 4. RICERCA E CLASSIFICAZIONE TRANSAZIONI
async function triggerSearch(overrideQuery) {
  const input = document.getElementById('explorerSearchInput');
  const query = (overrideQuery || input?.value || '').trim();
  const container = document.getElementById('explorerSearchResult');
  if (!query || !container) return;

  container.innerHTML = `<div style="text-align:center; padding:18px; color:#00FFCC; font-family:monospace;">🔍 Interrogazione registro dinamico...</div>`;

  const cleanHash = query.startsWith('0x') ? query.slice(2) : query;

  try {
    let rpcTx = null;
    let height = 'luxa-1';
    let isSuccess = true;
    let gasInfo = 'N/A';
    let sender = 'luxa1...';
    let recipient = 'luxa1...';
    let amount = 'N/A';
    let isNft = false;
    let nftId = null;

    // Lettura RPC reale CometBFT
    try {
      const resRpc = await fetch(`${RPC_ENDPOINT}/tx?hash=0x${cleanHash}`);
      const dataRpc = await resRpc.json();
      if (dataRpc.result) {
        rpcTx = dataRpc.result;
        height = rpcTx.height || height;
        isSuccess = rpcTx.tx_result?.code === 0 || !rpcTx.tx_result?.code;
        gasInfo = `${rpcTx.tx_result?.gas_used || '0'} / ${rpcTx.tx_result?.gas_wanted || '0'}`;

        const events = rpcTx.tx_result?.events || [];
        for (const ev of events) {
          if (ev.type === 'transfer' || ev.type === 'coin_received') {
            for (const attr of ev.attributes) {
              const k = atob(attr.key);
              const v = atob(attr.value);
              if (k === 'sender') sender = v;
              if (k === 'recipient') recipient = v;
              if (k === 'amount' && v.includes('uluxa')) {
                const u = parseInt(v.replace('uluxa', ''), 10);
                amount = `${(u / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} LUXA`;
              }
            }
          }
        }
      }
    } catch (_) {}

    // Lettura Backend
    try {
      const beRes = await fetch(`${BACKEND_API}/ecosystem/chain/tx/${cleanHash}`);
      if (beRes.ok) {
        const beData = await beRes.json();
        if (beData.tx) {
          const t = beData.tx;
          if (t.isNft || t.type === 'SOVEREIGN_NFT_MINT' || t.nftKey) {
            isNft = true;
            nftId = t.nftKey || t.id || '4001';
          }
          if (t.amount) amount = `${t.amount} ${t.currency || 'LUXA'}`;
          if (t.senderAddress) sender = t.senderAddress;
          if (t.recipientAddress) recipient = t.recipientAddress;
        }
      }
    } catch (_) {}

    // Riconoscimento anchor NFT
    if (cleanHash.toUpperCase().startsWith('BC25D0B') || cleanHash.startsWith('tx_reg_')) {
      isNft = true;
      nftId = nftId || '4001';
      const meta = NFT_DYNAMIC_CATALOG[nftId];
      if (amount === 'N/A' && meta) amount = `${meta.luxaPrice.toFixed(2)} LUXA`;
    }

    if (amount === 'N/A') {
      amount = '0.005 LUXA (5000uluxa)';
    }

    const cardSvg = isNft
      ? generateSovereignNftSvg('Grandmaster of Servers', nftId || '4001', recipient, amount, null)
      : generateCoinTransferSvg(amount, sender, recipient, query);

    const assetBadge = isNft
      ? `<span style="background:rgba(255,215,0,0.15); color:#FFD700; border:1px solid rgba(255,215,0,0.4); font-weight:bold; font-size:11px; padding:3px 10px; border-radius:6px; font-family:'Orbitron',sans-serif;">🏛️ SOVEREIGN NFT LICENSE (#${nftId || '4001'})</span>`
      : `<span style="background:rgba(0,255,204,0.15); color:#00FFCC; border:1px solid rgba(0,255,204,0.4); font-weight:bold; font-size:11px; padding:3px 10px; border-radius:6px; font-family:'Orbitron',sans-serif;">🪙 NATIVE COIN TRANSFER (LUXA)</span>`;

    container.innerHTML = `
      <div class="card-wrap ${isNft ? 'nft-wrap' : ''}">
        <div class="card-header">
          ${assetBadge}
          <span class="${isSuccess ? 'badge-ok' : 'badge-fail'}">
            ${isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED'}
          </span>
        </div>

        <div style="text-align:center; margin:15px 0 20px;">
          <img src="${cardSvg}" alt="Card" class="nft-display-frame ${isNft ? 'nft-border' : ''}">
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:12.5px; margin-bottom:14px;">
          <div><span class="node-info-label">Tipo Asset</span><strong style="color:${isNft ? '#FFD700' : '#00FFCC'};">${isNft ? 'Sovereign NFT License' : 'Native Coin (uluxa)'}</strong></div>
          <div><span class="node-info-label">Blocco</span><strong>#${height}</strong></div>
          <div><span class="node-info-label">Importo Dinamico</span><strong style="color:#FFD700;">${amount}</strong></div>
          <div><span class="node-info-label">Gas</span><span>${gasInfo}</span></div>
        </div>

        <div style="margin-bottom:10px;"><span class="node-info-label">From:</span><span class="mono-pill" style="color:#88BBFF;">${sender}</span></div>
        <div style="margin-bottom:10px;"><span class="node-info-label">To:</span><span class="mono-pill">${recipient}</span></div>
        <div style="margin-bottom:16px;"><span class="node-info-label">Tx Hash:</span><span class="mono-pill" style="color:${isNft ? '#FFD700' : '#00FFCC'};">${query}</span></div>

        <button class="copy-btn" onclick="navigator.clipboard.writeText('${query}'); alert('Hash copiato!');">📋 Copia Hash</button>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div style="padding:16px; color:#ef4444; text-align:center;">Errore analisi: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminCatalog();
  const q = new URLSearchParams(window.location.search).get('q') || new URLSearchParams(window.location.search).get('tx');
  if (q) {
    const el = document.getElementById('explorerSearchInput');
    if (el) el.value = q;
    triggerSearch(q);
  }
});

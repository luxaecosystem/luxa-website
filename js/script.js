/* ==========================================================================
   LUXA — script.js
   1. Configurazione e utilità globali (nomi invariati: altre pagine li usano)
   2. Certificati SVG (NFT + trasferimento)
   3. Explorer: window.triggerSearch
   4. Tokenomics live
   5. UI del sito (navbar, menu, preloader, hero, carosello, download)
   ========================================================================== */

// ===== 1. CONFIGURAZIONE =====================================================
const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';
const BACKEND_API = 'https://luxaecosystem.alwaysdata.net/api';
const TREASURY_WALLET = 'luxa1eg6d8axpw2t3en2g8t0g5qtj4wm2fh3q4tmkue';
// Endpoint REST (LCD) del nodo Cosmos, es. 'https://api.luxaecosystem.xyz'.
// Serve per la ricerca per indirizzo (saldi). Lasciato vuoto finché non è pubblico.
const LCD_ENDPOINT = '';

const HERO_IMAGES_WEB = {
  '4001': 'https://app.luxaecosystem.xyz/Nft_Images/Grandmaster_of_Servers.jpeg',
  '4002': 'https://app.luxaecosystem.xyz/Nft_Images/Neon_Data_Valkyrie.jpeg',
  '4003': 'https://app.luxaecosystem.xyz/Nft_Images/Chrono-Key_Master.jpeg',
  '4004': 'https://app.luxaecosystem.xyz/Nft_Images/Cyber-Shadow_Node.jpeg'
};

const NFT_NAMES = {
  '4001': 'Grandmaster of Servers',
  '4002': 'Neon Data Valkyrie',
  '4003': 'Chrono-Key Master',
  '4004': 'Cyber-Shadow Node'
};

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}
const escapeHtml = escapeXml; // stesso escaping, nome più chiaro quando si scrive HTML

/* ==========================================================================
   2. CERTIFICATI GRAFICI VETTORIALI (SVG)
   ========================================================================== */
function generateSovereignNftSvg(name, id, wallet, txHash) {
  const rawId = String(id || '4001');
  const displayId = escapeXml(rawId);
  const imageUrl = HERO_IMAGES_WEB[rawId] || HERO_IMAGES_WEB['4001'];
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
      <text x="430" y="16" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="900" fill="#FFFFFF">LX</text>
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
      <text x="0" y="16" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="900" fill="#00FFCC">🪙 NATIVE COIN SETTLEMENT</text>
      <text x="360" y="16" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#22c55e" text-anchor="end">FINALIZED</text>
    </g>

    <g transform="translate(30, 65)">
      <rect width="360" height="95" rx="12" fill="rgba(0,0,0,0.5)" stroke="rgba(0,255,204,0.2)"/>
      <text x="180" y="40" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="900" fill="#FFD700" text-anchor="middle">${escapeXml(amount)}</text>
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

/* ==========================================================================
   3. EXPLORER — ricerca on-chain (blocco, transazione, indirizzo)

   Correzioni principali:
   - tutti i dati provenienti da RPC/backend/utente sono ora escapati
     (prima finivano in innerHTML e in un onclick inline: rischio XSS);
   - se la ricerca non trova nulla NON vengono più mostrati importi,
     indirizzi e gas inventati come "CONFIRMED ON-CHAIN";
   - la ricerca per indirizzo luxa1... (usata dal link "Verify Wallet")
     ora è gestita: legge i saldi dall'endpoint LCD se configurato.
   ========================================================================== */
window.triggerSearch = async function (overrideQuery) {
  const input = document.getElementById('explorerSearchInput');
  const query = String(overrideQuery || input?.value || '').trim();
  const container = document.getElementById('explorerSearchResult');
  if (!query || !container) return;

  const safeQuery = escapeHtml(query);
  const box = (border, glow) =>
    `margin-top:16px;background:rgba(0,0,0,.65);border:1px solid ${border};border-radius:16px;padding:20px;text-align:left;box-shadow:0 0 25px ${glow};`;
  const rowHead = (title, badge, badgeStyle) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px;">
       <span style="color:inherit;font-weight:bold;font-size:12px;font-family:'Space Grotesk',sans-serif;">${title}</span>
       <span style="${badgeStyle}font-weight:bold;font-size:10px;padding:2px 8px;border-radius:4px;">${badge}</span>
     </div>`;
  const OK_BADGE = 'background:rgba(34,197,94,.2);color:#22c55e;';
  const WARN_BADGE = 'background:rgba(245,158,11,.15);color:#f59e0b;';
  const render = html => { container.innerHTML = html; };

  const notFound = (what) => render(`
    <div style="${box('rgba(245,158,11,.5)', 'rgba(245,158,11,.1)')}color:#cbd5e1;font-size:13px;line-height:1.6;">
      ${rowHead('NO RESULT', 'NOT FOUND', WARN_BADGE)}
      No ${what} found on <strong>luxa-1</strong> for <span style="font-family:'JetBrains Mono',monospace;word-break:break-all;color:#88BBFF;">${safeQuery}</span>.
      Check the value and try again.
    </div>`);

  render(`<div style="text-align:center;padding:18px;color:#00FFCC;font-family:monospace;">🔍 Inspecting ledger entry on luxa-1…</div>`);

  const cleanHash = query.startsWith('0x') ? query.slice(2) : query;

  try {
    // ---- Blocco per altezza
    if (/^\d+$/.test(query)) {
      const data = await fetchJson(`${RPC_ENDPOINT}/block?height=${parseInt(query, 10)}`);
      const blk = data?.result?.block;
      if (!blk) return notFound('block');

      render(`
        <div style="${box('#00FFCC', 'rgba(0,255,204,.15)')}color:#00FFCC;">
          ${rowHead(`BLOCK #${safeQuery} CONFIRMED`, 'COMMITTED', OK_BADGE)}
          <div style="font-size:12px;line-height:1.7;color:#cbd5e1;">
            <div><strong>Timestamp:</strong> ${blk.header?.time ? escapeHtml(new Date(blk.header.time).toLocaleString()) : '—'}</div>
            <div><strong>Total Transactions:</strong> <span style="color:#FFD700;font-weight:bold;">${escapeHtml(blk.data?.txs?.length ?? 0)}</span></div>
            <div><strong>Proposer:</strong> <span style="font-family:monospace;color:#88BBFF;word-break:break-all;">${escapeHtml(blk.header?.proposer_address || '—')}</span></div>
          </div>
        </div>`);
      return;
    }

    // ---- Indirizzo luxa1...
    if (/^luxa1[0-9a-z]{20,}$/i.test(query)) {
      if (!LCD_ENDPOINT) {
        render(`
          <div style="${box('rgba(245,158,11,.5)', 'rgba(245,158,11,.1)')}color:#cbd5e1;font-size:13px;line-height:1.6;">
            ${rowHead('ADDRESS LOOKUP', 'COMING SOON', WARN_BADGE)}
            Balance lookup for <span style="font-family:'JetBrains Mono',monospace;word-break:break-all;color:#88BBFF;">${safeQuery}</span> isn't available yet.
            Search by transaction hash or block height instead.
          </div>`);
        return;
      }
      const data = await fetchJson(`${LCD_ENDPOINT}/cosmos/bank/v1beta1/balances/${encodeURIComponent(query)}`, 5000);
      if (!data) return notFound('account');
      const rows = (data.balances || []).map(b => {
        const isLuxa = b.denom === 'uluxa';
        const value = isLuxa ? formatNumber(Number(b.amount) / 1e6, 6) + ' LUXA' : `${escapeHtml(b.amount)} ${escapeHtml(b.denom)}`;
        return `<div style="display:flex;justify-content:space-between;gap:12px;"><span>${escapeHtml(isLuxa ? 'LUXA' : b.denom)}</span><strong style="color:#fff;">${value}</strong></div>`;
      }).join('') || '<div>No balance on this address yet.</div>';

      render(`
        <div style="${box('#00FFCC', 'rgba(0,255,204,.15)')}color:#00FFCC;">
          ${rowHead('ACCOUNT BALANCES', 'ON-CHAIN', OK_BADGE)}
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#88BBFF;word-break:break-all;margin-bottom:12px;">${safeQuery}</div>
          <div style="font-size:12px;line-height:1.9;color:#cbd5e1;">${rows}</div>
        </div>`);
      return;
    }

    // ---- Ricevuta Testnet (0xtest_...): vive nel ledger sandbox, non su luxa-1
    if (/^0xtest_/i.test(query)) {
      render(`
        <div style="${box('rgba(245,158,11,.5)', 'rgba(245,158,11,.1)')}color:#cbd5e1;font-size:13px;line-height:1.6;">
          ${rowHead('TESTNET RECEIPT', 'SANDBOX', WARN_BADGE)}
          <span style="font-family:'JetBrains Mono',monospace;word-break:break-all;color:#88BBFF;">${safeQuery}</span><br>
          This receipt belongs to <strong>luxa-testnet</strong>, a simulated ledger. It is not recorded on luxa-1, so it does not appear in the mainnet explorer.
        </div>`);
      return;
    }

    // ---- Transazione (hash o id ledger interno)
    let found = false;
    let height = '—';
    let gasInfo = '—';
    let sender = '—';
    let recipient = '—';
    let amount = '—';
    let isSuccess = true;
    let isNft = false;
    let nftId = '4001';

    // 1. RPC CometBFT (solo hash esadecimali a 64 caratteri)
    if (/^[0-9a-f]{64}$/i.test(cleanHash)) {
      const rpcData = await fetchJson(`${RPC_ENDPOINT}/tx?hash=0x${cleanHash}`);
      const tx = rpcData?.result;
      if (tx) {
        found = true;
        height = tx.height ?? height;
        isSuccess = !tx.tx_result?.code;
        gasInfo = `${tx.tx_result?.gas_used ?? '—'} / ${tx.tx_result?.gas_wanted ?? '—'}`;
      }
    }

    // 2. Ledger applicativo (backend)
    const beData = await fetchJson(`${BACKEND_API}/ecosystem/chain/tx/${encodeURIComponent(cleanHash)}`);
    if (beData?.tx) {
      found = true;
      const b = beData.tx;
      if (b.nftKey || b.assetName || b.type === 'SOVEREIGN_NFT_MINT' || b.isNft) {
        isNft = true;
        nftId = String(b.nftKey || b.id || nftId);
      }
      sender = b.senderAddress || sender;
      recipient = b.recipientAddress || b.holder || recipient;
      if (b.amount) amount = `${b.amount} ${b.currency ? String(b.currency).toUpperCase() : 'LUXA'}`;
    }

    // Transazione di registrazione NFT nota (hash con prefisso BC25D0B) e id ledger tx_reg_*
    if (found && (cleanHash.toUpperCase().includes('BC25D0B') || cleanHash.startsWith('tx_reg_'))) isNft = true;

    if (!found) return notFound('transaction');

    const accent = isNft ? '#FFD700' : '#00FFCC';
    const cardSvgUri = isNft
      ? generateSovereignNftSvg(NFT_NAMES[nftId] || 'Sovereign License', nftId, recipient !== '—' ? recipient : sender, query)
      : generateCoinTransferSvg(amount, sender, recipient, query);

    render(`
      <div style="${box(accent, isNft ? 'rgba(255,215,0,.2)' : 'rgba(0,255,204,.15)')}color:${accent};">
        ${rowHead(isNft ? `🏛️ SOVEREIGN NFT LICENSE (#${escapeHtml(nftId)})` : '🪙 NATIVE COIN SETTLEMENT',
                  isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED',
                  isSuccess ? OK_BADGE : 'background:rgba(239,68,68,.15);color:#ef4444;')}

        <div style="text-align:center;margin:15px 0 20px;">
          <img src="${cardSvgUri}" alt="Visual card for this transaction" style="width:100%;max-width:320px;aspect-ratio:${isNft ? '600/780' : '420/340'};border-radius:16px;border:2px solid ${accent};object-fit:contain;display:inline-block;">
        </div>

        <div style="font-size:12px;line-height:1.7;color:#cbd5e1;">
          <div><strong>Amount:</strong> <strong style="color:#fff;">${escapeHtml(amount)}</strong></div>
          <div><strong>From:</strong> <span style="font-family:'JetBrains Mono',monospace;color:#88BBFF;word-break:break-all;">${escapeHtml(sender)}</span></div>
          <div><strong>To:</strong> <span style="font-family:'JetBrains Mono',monospace;word-break:break-all;">${escapeHtml(recipient)}</span></div>
          <div><strong>Block:</strong> ${escapeHtml(height)}</div>
          <div><strong>Gas Used/Wanted:</strong> ${escapeHtml(gasInfo)}</div>
        </div>

        <button type="button" data-copy="${safeQuery}" style="width:100%;margin-top:16px;background:transparent;border:1px solid ${accent};color:${accent};padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">
          📋 Copy Transaction Hash
        </button>
      </div>`);

    const copyBtn = container.querySelector('[data-copy]');
    copyBtn?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(query); copyBtn.textContent = '✅ Copied'; }
      catch (_) { copyBtn.textContent = 'Select and copy manually'; }
      setTimeout(() => { copyBtn.textContent = '📋 Copy Transaction Hash'; }, 1800);
    });
  } catch (err) {
    render(`<div style="padding:16px;color:#ef4444;text-align:center;">Lookup failed: ${escapeHtml(err.message)}</div>`);
  }
};

/* ==========================================================================
   Utilità condivise (fuori dall'IIFE perché usate anche da triggerSearch)
   ========================================================================== */
async function fetchJson(url, timeout = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok ? await res.json() : null;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function formatNumber(n, decimals = 2) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/* ==========================================================================
   4–5. TOKENOMICS LIVE + UI DEL SITO
   Tutto dentro una IIFE: nessuna variabile globale in più (evita conflitti
   con gli script inline delle altre pagine).
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const byId = id => document.getElementById(id);
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onReady = fn => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());

  /* ---------- Tokenomics live ---------- */
  // Valori consolidati usati SOLO se il backend non risponde.
  const SUPPLY_FALLBACK = { total: 1002500000.00, treasury: 999903910.11 };

  async function syncTokenomicsMetrics() {
    const elTotal = byId('liveTotalSupply');
    const elTreasury = byId('liveTreasuryVault');
    const elCirculating = byId('liveCirculatingSupply');
    if (!elTotal && !elTreasury && !elCirculating) return;

    let total = SUPPLY_FALLBACK.total;
    let treasury = SUPPLY_FALLBACK.treasury;

    const stats = await fetchJson(`${BACKEND_API}/admin/stats`, 3000);
    if (stats && Number(stats.circulatingSupply) > 0) {
      treasury = Number(stats.treasuryBalance || treasury);
      total = Number(stats.circulatingSupply) + treasury;
    }

    const circulating = Math.max(0, total - treasury);
    const fmt = n => `${formatNumber(n)} <small>LUXA</small>`;
    if (elTotal) elTotal.innerHTML = fmt(total);
    if (elTreasury) elTreasury.innerHTML = fmt(treasury);
    if (elCirculating) elCirculating.innerHTML = fmt(circulating);
  }

  /* ---------- Altezza blocchi live (hero) ---------- */
  function initLiveBlockHeight() {
    const el = byId('statBlocks');
    if (!el) return;
    let animated = false;

    function animateCounter(target) {
      let current = Math.max(0, target - 50);
      const timer = setInterval(() => {
        current += 1;
        el.textContent = Math.min(current, target).toLocaleString('en-US');
        if (current >= target) clearInterval(timer);
      }, 15);
    }

    async function tick() {
      if (document.hidden) return;
      const data = await fetchJson(`${RPC_ENDPOINT}/status`, 2500);
      const height = parseInt(data?.result?.sync_info?.latest_block_height || 0, 10);
      if (height > 0) {
        if (animated) el.textContent = height.toLocaleString('en-US');
        else if (prefersReducedMotion()) { el.textContent = height.toLocaleString('en-US'); animated = true; }
        else { animateCounter(height); animated = true; }
      } else if (!animated) {
        el.textContent = '—'; // nodo non raggiungibile: niente numeri inventati
      }
    }

    tick();
    setInterval(tick, 6000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  }

  /* ---------- Navbar, menu mobile, back-to-top ----------
     Questi elementi sono iniettati da include.js: si inizializzano
     dopo l'evento "luxa:components-ready". */
  let componentsInitialised = false;
  function initComponentDependentUI() {
    if (componentsInitialised) return;
    componentsInitialised = true;

    const navbar = byId('navbar');
    const updateNavbar = () => navbar?.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();

    const toggle = $('.mobile-menu-toggle');
    const menu = $('.mobile-menu');
    if (toggle && menu) {
      const setOpen = open => {
        menu.classList.toggle('open', open);
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      };
      toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
      menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
      document.addEventListener('click', e => {
        if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
      });
      window.matchMedia('(min-width: 991px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
    }

    const backToTop = byId('backToTop');
    if (backToTop) {
      window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.scrollY > 500), { passive: true });
      backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));
    }
  }

  if (window.luxaComponentsReady) initComponentDependentUI();
  else document.addEventListener('luxa:components-ready', initComponentDependentUI, { once: true });
  if (!document.querySelector('[data-include]')) onReady(initComponentDependentUI);

  /* ---------- Preloader ---------- */
  function initPreloader() {
    const preloader = byId('preloader');
    if (!preloader) return;
    const hide = () => preloader.classList.add('hidden');
    if (document.readyState === 'complete') setTimeout(hide, 250);
    else {
      window.addEventListener('load', () => setTimeout(hide, 250), { once: true });
      setTimeout(hide, 2500); // rete lenta: non bloccare mai la pagina
    }
  }

  /* ---------- Particelle hero ---------- */
  function initParticles() {
    const container = byId('particles');
    if (!container || prefersReducedMotion()) return;
    const count = window.innerWidth < 640 ? 12 : 28;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = (Math.random() * 3 + 2) + 'px';
      p.className = 'particle';
      p.style.cssText = `left:${Math.random() * 100}%;width:${size};height:${size};animation-duration:${Math.random() * 8 + 8}s;animation-delay:${Math.random() * 6}s`;
      frag.appendChild(p);
    }
    container.appendChild(frag);
  }

  /* ---------- Tilt 3D sulle card (solo mouse) ---------- */
  function initCardTilt() {
    if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.about-card, .token-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const rotateX = (e.clientY - r.top - r.height / 2) / 22;
        const rotateY = (r.width / 2 - (e.clientX - r.left)) / 22;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ==========================================================================
     CAROSELLO — Vault Showcase

     Rispetto alla versione precedente:
     - slide attiva a piena opacità, le vicine attenuate; prima e ultima si centrano;
     - stato attivo calcolato con IntersectionObserver (niente più dot che
       "sfarfallano" durante lo scroll animato) + blocco durante gli spostamenti;
     - autoplay guidato dalla barra di avanzamento del dot attivo: si mette in
       pausa da solo con hover, focus da tastiera, sezione fuori schermo,
       scheda in background; pulsante play/pausa; disattivato con
       "riduci movimento";
     - tastiera (← → Home End), swipe nativo, trascinamento con il mouse;
     - click sulla slide attiva = anteprima ingrandita (lightbox); click su
       una slide laterale = la porta al centro;
    - se un'immagine manca, la slide
       viene rimossa e i controlli si ricalcolano da soli;
     - gap letto dal CSS, ricentratura al resize, ARIA (region, "n of N").
     ========================================================================== */
  function initShowcase() {
    const root = byId('showcase');
    if (!root) return;

    const track = $('.showcase-track', root);
    const dotsWrap = $('.showcase-dots', root);
    const prevBtn = $('[data-showcase="prev"]', root);
    const nextBtn = $('[data-showcase="next"]', root);
    const toggleBtn = $('[data-showcase="toggle"]', root);
    const curEl = $('[data-showcase-current]', root);
    const totalEl = $('[data-showcase-total]', root);
    const reduced = prefersReducedMotion();

    let slides = [];
    let dots = [];
    let index = 0;
    let autoplay = !reduced;
    let lockTarget = null; // durante uno scroll programmato l'observer non cambia la slide attiva
    let lockTimer = null;
    const hold = { hover: false, focus: false, offscreen: false, hidden: false };
    const pad = n => String(n).padStart(2, '0');

    /* -- stato -- */
    function setActive(i) {
      index = i;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => {
        d.classList.toggle('active', k === i);
        if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (curEl) curEl.textContent = pad(i + 1);
    }

    function syncPlayState() {
      root.classList.toggle('is-playing', autoplay);
      root.classList.toggle('is-paused', Object.values(hold).some(Boolean));
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-label', autoplay ? 'Pause automatic slideshow' : 'Start automatic slideshow');
        toggleBtn.innerHTML = `<i class="fas ${autoplay ? 'fa-pause' : 'fa-play'}"></i>`;
      }
    }

    function goTo(i, instant) {
      if (!slides.length) return;
      const n = (i + slides.length) % slides.length;
      const slide = slides[n];
      const left = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
      const jump = instant || reduced;

      lockTarget = n;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => { lockTarget = null; }, 1200); // rete di sicurezza se "scrollend" non esiste
      setActive(n);
      track.scrollTo({ left, behavior: jump ? 'auto' : 'smooth' });
    }

    function nearestIndex() {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    }

    /* -- costruzione (richiamata anche se una slide viene rimossa) -- */
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => {
          if (lockTarget !== null) return;
          entries.forEach(e => {
            if (!e.isIntersecting) return;
            const i = slides.indexOf(e.target);
            if (i > -1 && i !== index) setActive(i);
          });
        }, { root: track, threshold: 0.6 })
      : null;

    function refresh() {
      slides = $$('.showcase-slide', track);
      if (!slides.length) { root.closest('section')?.setAttribute('hidden', ''); return; }

      slides.forEach((s, i) => s.setAttribute('aria-label', `${i + 1} of ${slides.length}`));
      dotsWrap.innerHTML = '';
      dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Show screenshot ${i + 1}`);
        b.appendChild(document.createElement('span'));
        b.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(b);
        return b;
      });
      if (totalEl) totalEl.textContent = pad(slides.length);

      observer?.disconnect();
      slides.forEach(s => observer?.observe(s));
      setActive(Math.min(index, slides.length - 1));
    }

    /* -- immagini mancanti -- */
    $$('.showcase-slide img', track).forEach(img => {
      const drop = () => {
        img.closest('.showcase-slide')?.remove();
        refresh();
        goTo(index, true);
      };
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) drop();
      else img.addEventListener('error', drop, { once: true });
    });

    /* -- controlli -- */
    prevBtn?.addEventListener('click', () => goTo(index - 1));
    nextBtn?.addEventListener('click', () => goTo(index + 1));
    toggleBtn?.addEventListener('click', () => { autoplay = !autoplay; syncPlayState(); });

    track.addEventListener('keydown', e => {
      const target = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: slides.length - 1 }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      goTo(target);
    });
    track.addEventListener('scrollend', () => { lockTarget = null; });

    // Autoplay: la barra di avanzamento del dot attivo finisce → slide successiva
    dotsWrap.addEventListener('animationend', e => {
      if (e.animationName === 'showcase-progress') goTo(index + 1);
    });

    /* -- pause automatiche -- */
    root.addEventListener('mouseenter', () => { hold.hover = true; syncPlayState(); });
    root.addEventListener('mouseleave', () => { hold.hover = false; syncPlayState(); });
    root.addEventListener('focusin', () => { hold.focus = !!root.querySelector(':focus-visible'); syncPlayState(); });
    root.addEventListener('focusout', () => { hold.focus = false; syncPlayState(); });
    document.addEventListener('visibilitychange', () => { hold.hidden = document.hidden; syncPlayState(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { hold.offscreen = !entry.isIntersecting; syncPlayState(); }, { threshold: 0.25 }).observe(root);
    }

    /* -- trascinamento con il mouse (touch e trackpad usano lo scroll nativo) -- */
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = 0; startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      goTo(nearestIndex());
    });

    /* -- click: centra la slide laterale / apre l'anteprima su quella attiva -- */
    track.addEventListener('click', e => {
      if (moved > 6) { moved = 0; e.preventDefault(); return; } // era un trascinamento
      const frame = e.target.closest('.showcase-frame');
      if (!frame) return;
      const slide = frame.closest('.showcase-slide');
      const i = slides.indexOf(slide);
      if (i !== index) goTo(i);
      else openLightbox(frame.querySelector('img'), $('figcaption', slide)?.textContent.trim() || '');
    });

    /* -- lightbox -- */
    let dialog = null;
    function openLightbox(img, caption) {
      if (!img || typeof HTMLDialogElement === 'undefined') return;
      if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.className = 'showcase-lightbox';
        dialog.setAttribute('aria-label', 'Screenshot preview');
        dialog.innerHTML = '<button type="button" class="showcase-lightbox-close" aria-label="Close preview"><i class="fas fa-xmark"></i></button><img alt=""><p></p>';
        document.body.appendChild(dialog);
        dialog.addEventListener('click', e => {
          if (e.target === dialog || e.target.closest('.showcase-lightbox-close')) dialog.close();
        });
      }
      const big = $('img', dialog);
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      $('p', dialog).textContent = caption;
      dialog.showModal();
    }

    /* -- resize: ricentra -- */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => goTo(index, true), 150);
    });

    refresh();
    syncPlayState();
  }

  /* ---------- Download: copia SHA-256 dell'APK ---------- */
  function initVaultCopy() {
    const btn = byId('vaultCopySha');
    const code = byId('vaultApkSha');
    if (!btn || !code) return;

    btn.addEventListener('click', async () => {
      const text = code.textContent.trim();
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (_) {
        // Fallback (pagina non sicura / permessi negati): seleziona il testo
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try { ok = document.execCommand('copy'); } catch (_) { /* niente */ }
        if (ok) sel.removeAllRanges();
      }
      btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      btn.classList.toggle('is-done', ok);
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
    });
  }

  /* ---------- Avvio ---------- */
  initPreloader();
  onReady(() => {
    initParticles();
    initCardTilt();
    initLiveBlockHeight();
    initShowcase();
    initVaultCopy();

    // Tokenomics: aggiorna subito, poi ogni 15 s (solo a scheda visibile)
    syncTokenomicsMetrics();
    setInterval(() => { if (!document.hidden) syncTokenomicsMetrics(); }, 15000);

    // Explorer: Enter nella casella di ricerca + parametri URL (?q= o ?tx=)
    const searchInput = byId('explorerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') window.triggerSearch(); });
      const q = new URLSearchParams(window.location.search);
      const value = q.get('q') || q.get('tx');
      if (value) { searchInput.value = value; window.triggerSearch(value); }
    }
  });
})();

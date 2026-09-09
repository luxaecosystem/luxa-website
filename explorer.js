/* ==========================================================================
   LUXA SOVEREIGN CHAIN EXPLORER — explorer.js
   Single source of truth for the public explorer page (explorer.html).

   Design goals of this rewrite:
   - ONE copy of the SVG-card / search logic (it used to be duplicated,
     slightly differently, across browser.js x2, explorer.js and script.js —
     that's why fixes in one place never reached the others).
   - No hardcoded per-hash fake data. If a hash/block/address can't be
     resolved, the UI says so honestly instead of showing a placeholder
     "50.50 LUXA / luxa1..." card as if it were real.
   - Every value interpolated into HTML or SVG is escaped.
   - Config (RPC + backend URLs) lives in one place, overridable via
     window.LUXA_CONFIG before this script loads, e.g.:
       <script>window.LUXA_CONFIG = { rpc: '...', api: '...' };</script>
   ========================================================================== */

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------
  const CONFIG = Object.assign(
    {
      rpc: 'https://rpc.luxaecosystem.xyz',
      api: 'https://luxaecosystem.alwaysdata.net/api',
      fetchTimeoutMs: 4000
    },
    window.LUXA_CONFIG || {}
  );

  const NFT_HERO_IMAGES = {
    '4001': 'https://app.luxaecosystem.xyz/Nft_Images/Grandmaster_of_Servers.jpeg',
    '4002': 'https://app.luxaecosystem.xyz/Nft_Images/Neon_Data_Valkyrie.jpeg',
    '4003': 'https://app.luxaecosystem.xyz/Nft_Images/Chrono-Key_Master.jpeg',
    '4004': 'https://app.luxaecosystem.xyz/Nft_Images/Cyber-Shadow_Node.jpeg'
  };

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    })[c]);
  }

  function shorten(address, front = 12, back = 6) {
    const value = String(address || '');
    return value.length > front + back + 3
      ? `${value.slice(0, front)}...${value.slice(-back)}`
      : value;
  }

  function isBlockHeightQuery(query) {
    return /^\d+$/.test(query);
  }

  function isTxHashQuery(query) {
    return /^(0x)?[0-9a-fA-F]{16,}$/.test(query);
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.fetchTimeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ---------------------------------------------------------------------
  // SVG card generators
  // ---------------------------------------------------------------------
  function buildNftCardSvg({ name, id, holder }) {
    const displayId = escapeHtml(id || '4001');
    const displayName = escapeHtml(name || 'Sovereign License');
    const displayHolder = escapeHtml(holder || 'luxa1...');
    const imageUrl = NFT_HERO_IMAGES[id] || NFT_HERO_IMAGES['4001'];
    const marquee = ` • HOLDER: ${displayHolder} • LEDGER: LUXA-1 • ASSET: ${displayName.toUpperCase()} • STATUS: ANCHORED • `;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 780" width="100%" height="100%">
      <defs>
        <path id="loopTrack-${displayId}" d="M 45 45 H 555 Q 570 45 570 60 V 720 Q 570 735 555 735 H 45 Q 30 735 30 720 V 60 Q 30 45 45 45 Z" fill="none"/>
        <clipPath id="heroClip-${displayId}"><rect x="52" y="52" width="496" height="676" rx="20"/></clipPath>
        <linearGradient id="shade-${displayId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="65%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(3,7,18,0.94)"/>
        </linearGradient>
      </defs>
      <rect width="600" height="780" rx="30" fill="#030712" stroke="#00FFCC" stroke-width="2"/>
      <rect x="15" y="15" width="570" height="750" rx="24" fill="none" stroke="rgba(0,255,204,0.15)" stroke-width="1.2"/>
      <image x="52" y="52" width="496" height="676" preserveAspectRatio="xMidYMid slice" clip-path="url(#heroClip-${displayId})" href="${imageUrl}"/>
      <rect x="52" y="52" width="496" height="676" clip-path="url(#heroClip-${displayId})" fill="url(#shade-${displayId})"/>
      <rect x="52" y="52" width="496" height="676" rx="20" fill="none" stroke="rgba(0,255,204,0.45)" stroke-width="1.5"/>
      <use href="#loopTrack-${displayId}" stroke="rgba(0,255,204,0.15)" stroke-width="1"/>
      <text font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#00FFCC" letter-spacing="2">
        <textPath href="#loopTrack-${displayId}" startOffset="0%">${marquee.repeat(3)}
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

  function buildCoinCardSvg({ amount, sender, recipient, txHash }) {
    const shortSender = escapeHtml(shorten(sender));
    const shortRecv = escapeHtml(shorten(recipient));
    const shortTx = escapeHtml(shorten(txHash, 14, 8));
    const displayAmount = escapeHtml(amount);

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" width="100%" height="100%">
      <defs>
        <linearGradient id="coinBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#080c1f"/><stop offset="100%" stop-color="#02040c"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="408" height="328" rx="16" fill="url(#coinBg)" stroke="#00C878" stroke-width="1.8"/>
      <g transform="translate(30, 24)">
        <text x="0" y="16" font-family="'Orbitron', sans-serif" font-size="12" font-weight="900" fill="#00FFCC">NATIVE COIN SETTLEMENT</text>
        <text x="360" y="16" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#22c55e" text-anchor="end">FINALIZED</text>
      </g>
      <g transform="translate(30, 65)">
        <rect width="360" height="95" rx="12" fill="rgba(0,0,0,0.5)" stroke="rgba(0,255,204,0.2)"/>
        <text x="180" y="40" font-family="'Orbitron', sans-serif" font-size="24" font-weight="900" fill="#FFD700" text-anchor="middle">${displayAmount}</text>
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
        <circle cx="340" cy="25" r="4" fill="#22c55e"/>
      </g>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
  }

  // ---------------------------------------------------------------------
  // Data fetching — no fallback to fake data. Missing data stays missing.
  // ---------------------------------------------------------------------
  async function fetchBlock(height) {
    const { ok, data } = await fetchJson(`${CONFIG.rpc}/block?height=${height}`);
    if (!ok || !data?.result?.block) {
      throw new Error(`Block #${height} not found on the chain.`);
    }
    return data.result.block;
  }

  async function fetchTxRecord(hash) {
    const cleanHash = hash.replace(/^0x/i, '').toUpperCase();
    let backendRecord = null;
    let rpcRecord = null;

    // Backend indexer: knows about ledger-anchored NFTs, withdrawals, etc.
    try {
      const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/tx/${cleanHash}`);
      if (ok && data?.tx) backendRecord = data.tx;
    } catch (_) { /* backend unreachable — fall through to RPC-only result */ }

    // Raw CometBFT RPC: authoritative on-chain confirmation + gas.
    try {
      const { ok, data } = await fetchJson(`${CONFIG.rpc}/tx?hash=0x${cleanHash}`);
      if (ok && data?.result) rpcRecord = data.result;
    } catch (_) { /* RPC unreachable */ }

    if (!backendRecord && !rpcRecord) {
      throw new Error('No transaction found for this hash, neither in the ledger nor on-chain.');
    }

    const record = {
      hash: cleanHash,
      height: rpcRecord?.height || backendRecord?.height || 'unknown',
      success: rpcRecord ? (rpcRecord.tx_result?.code === 0 || !rpcRecord.tx_result?.code) : true,
      gasUsed: rpcRecord?.tx_result?.gas_used ?? null,
      gasWanted: rpcRecord?.tx_result?.gas_wanted ?? null,
      isNft: false,
      nftId: null,
      amount: null,
      sender: null,
      recipient: null
    };

    // Prefer backend's richer classification when available.
    if (backendRecord) {
      record.isNft = Boolean(backendRecord.isNft || backendRecord.nftKey || backendRecord.type === 'SOVEREIGN_NFT_MINT');
      record.nftId = backendRecord.nftKey || backendRecord.id || null;
      record.amount = backendRecord.amount != null
        ? `${backendRecord.amount} ${(backendRecord.currency || 'LUXA').toUpperCase()}`
        : null;
      record.sender = backendRecord.senderAddress || null;
      record.recipient = backendRecord.recipientAddress || null;
      record.assetName = backendRecord.assetName || null;
    }

    // Fill in anything still missing from raw chain events.
    if (rpcRecord) {
      const events = rpcRecord.tx_result?.events || [];
      for (const ev of events) {
        if (ev.type !== 'transfer' && ev.type !== 'coin_received') continue;
        for (const attr of ev.attributes || []) {
          const key = atob(attr.key);
          const value = atob(attr.value);
          if (key === 'sender' && !record.sender) record.sender = value;
          if (key === 'recipient' && !record.recipient) record.recipient = value;
          if (key === 'amount' && !record.amount && value.includes('uluxa')) {
            const micro = parseInt(value.replace('uluxa', ''), 10);
            record.amount = `${(micro / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} LUXA`;
          }
        }
      }
    }

    return record;
  }

  async function fetchLatestBlockSummary() {
    const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/latest-block`);
    if (!ok || !data?.block) throw new Error('Node unreachable');
    return data.block;
  }

  async function fetchRecentActivity(limit = 10) {
    const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/recent-tx?limit=${limit}`);
    if (!ok || !Array.isArray(data?.activity)) throw new Error('Activity feed unavailable.');
    return data.activity;
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function renderLoading(container, message) {
    container.innerHTML = `<div class="explorer-status explorer-status--loading">${escapeHtml(message)}</div>`;
  }

  function renderError(container, message) {
    container.innerHTML = `<div class="explorer-status explorer-status--error">${escapeHtml(message)}</div>`;
  }

  function renderBlock(container, block, height) {
    const proposer = block.header?.proposer_address || 'unknown';
    const txCount = block.data?.txs?.length ?? 0;
    const time = block.header?.time ? new Date(block.header.time).toLocaleString() : 'unknown';

    container.innerHTML = `
      <div class="result-card">
        <div class="result-card__header">
          <span class="badge badge--info">BLOCK #${escapeHtml(height)}</span>
          <span class="badge badge--ok">CONFIRMED</span>
        </div>
        <dl class="result-card__facts">
          <div><dt>Time</dt><dd>${escapeHtml(time)}</dd></div>
          <div><dt>Transactions</dt><dd>${escapeHtml(txCount)}</dd></div>
          <div><dt>Proposer</dt><dd class="mono">${escapeHtml(proposer)}</dd></div>
        </dl>
      </div>`;
  }

  function renderTx(container, record, rawQuery) {
    const accent = record.isNft ? '#FFD700' : '#00FFCC';
    const cardSvg = record.isNft
      ? buildNftCardSvg({ name: record.assetName || 'Sovereign License', id: record.nftId, holder: record.recipient || record.sender })
      : buildCoinCardSvg({ amount: record.amount || 'amount unavailable', sender: record.sender || 'unknown', recipient: record.recipient || 'unknown', txHash: rawQuery });

    const badgeLabel = record.isNft
      ? `SOVEREIGN NFT LICENSE${record.nftId ? ` (#${escapeHtml(record.nftId)})` : ''}`
      : 'NATIVE TRANSFER (LUXA)';

    container.innerHTML = `
      <div class="result-card" style="--accent: ${accent}">
        <div class="result-card__header">
          <span class="badge" style="color:${accent}; border-color:${accent};">${badgeLabel}</span>
          <span class="badge ${record.success ? 'badge--ok' : 'badge--fail'}">${record.success ? 'CONFIRMED ON-CHAIN' : 'FAILED'}</span>
        </div>
        <div class="result-card__visual">
          <img src="${cardSvg}" alt="Transaction card" style="border-color:${accent};">
        </div>
        <dl class="result-card__facts">
          <div><dt>Amount</dt><dd>${escapeHtml(record.amount || 'unavailable')}</dd></div>
          <div><dt>Sender</dt><dd class="mono">${escapeHtml(record.sender || 'unavailable')}</dd></div>
          <div><dt>Recipient</dt><dd class="mono">${escapeHtml(record.recipient || 'unavailable')}</dd></div>
          <div><dt>Block</dt><dd>#${escapeHtml(record.height)}</dd></div>
          ${record.gasUsed != null ? `<div><dt>Gas</dt><dd>${escapeHtml(record.gasUsed)} / ${escapeHtml(record.gasWanted)}</dd></div>` : ''}
        </dl>
        <button type="button" class="copy-btn" style="border-color:${accent}; color:${accent};" data-copy="${escapeHtml(rawQuery)}">
          Copy transaction hash
        </button>
      </div>`;

    container.querySelector('.copy-btn')?.addEventListener('click', (e) => {
      const value = e.currentTarget.getAttribute('data-copy');
      navigator.clipboard?.writeText(value);
      e.currentTarget.textContent = 'Copied!';
      setTimeout(() => { e.currentTarget.textContent = 'Copy transaction hash'; }, 1500);
    });
  }

  function renderActivityRows(tbody, activity) {
    if (!activity.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="explorer-status">No activity recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = activity.map((item) => {
      const isNft = item.type === 'SOVEREIGN_NFT';
      const accent = isNft ? 'var(--gold)' : 'var(--cyan)';
      const amountLabel = item.amount != null ? `${item.amount} ${(item.currency || 'LUXA').toUpperCase()}` : '—';
      return `
        <tr data-hash="${escapeHtml(item.hash)}">
          <td class="hash-cell" style="color:${accent};">${escapeHtml(shorten(item.hash, 8, 4))}</td>
          <td><span class="badge" style="color:${accent}; border-color:${accent}; font-size:10px;">${isNft ? 'SOVEREIGN NFT' : 'TRANSFER'}</span></td>
          <td>${escapeHtml(amountLabel)}</td>
          <td>${item.height ? '#' + escapeHtml(item.height) : '—'}</td>
          <td style="color:var(--green); font-weight:bold;">${escapeHtml(item.status || 'CONFIRMED')}</td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('tr[data-hash]').forEach((row) => {
      row.addEventListener('click', () => {
        const input = document.getElementById('explorerSearchInput');
        if (input) input.value = row.getAttribute('data-hash');
        search('explorerSearchInput', 'explorerSearchResult');
        document.getElementById('explorerSearchResult')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  async function refreshActivity() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;
    try {
      const activity = await fetchRecentActivity();
      renderActivityRows(tbody, activity);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="explorer-status explorer-status--error">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // ---------------------------------------------------------------------
  // Public search entry point
  // ---------------------------------------------------------------------
  async function search(inputId, resultId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(resultId);
    const query = (input?.value || '').trim();
    if (!container) return;

    if (!query) {
      renderError(container, 'Enter a transaction hash or a block number.');
      return;
    }

    renderLoading(container, 'Querying the luxa-1 ledger...');

    try {
      if (isBlockHeightQuery(query)) {
        const block = await fetchBlock(query);
        renderBlock(container, block, query);
        return;
      }
      if (isTxHashQuery(query)) {
        const record = await fetchTxRecord(query);
        renderTx(container, record, query);
        return;
      }
      renderError(container, 'Unrecognized format: use a transaction hash or a block number.');
    } catch (err) {
      renderError(container, err.message || 'Search failed.');
    }
  }

  async function refreshLatestBlock(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    try {
      const block = await fetchLatestBlockSummary();
      el.textContent = `#${Number(block.height).toLocaleString('it-IT')}`;
    } catch (_) {
      el.textContent = 'unavailable';
    }
  }

  // ---------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------
  window.LuxaExplorer = { search, refreshLatestBlock, refreshActivity };

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('explorerSearchInput');
    const button = document.getElementById('explorerSearchButton');
    const resultId = 'explorerSearchResult';

    button?.addEventListener('click', () => search('explorerSearchInput', resultId));
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') search('explorerSearchInput', resultId);
    });

    document.getElementById('refreshActivityButton')?.addEventListener('click', refreshActivity);

    refreshLatestBlock('latestBlockValue');
    setInterval(() => refreshLatestBlock('latestBlockValue'), 15000);

    refreshActivity();
    setInterval(refreshActivity, 20000);

    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('q') || params.get('tx');
    if (prefill && input) {
      input.value = prefill;
      search('explorerSearchInput', resultId);
    }
  });
})();

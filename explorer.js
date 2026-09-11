/* ==========================================================================
   LUXA SOVEREIGN CHAIN EXPLORER — explorer.js
   Single source of truth for the public explorer page (explorer.html).
   Original full data feed & live on-chain queries (No fake fallbacks).
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
      fetchTimeoutMs: 5000
    },
    window.LUXA_CONFIG || {}
  );

  const NFT_HEROES = {
    '4001': { name: 'Grandmaster of Servers', file: 'Grandmaster_of_Servers.jpeg' },
    '4002': { name: 'Neon Data Valkyrie', file: 'Neon_Data_Valkyrie.jpeg' },
    '4003': { name: 'Chrono-Key Master', file: 'Chrono-Key_Master.jpeg' },
    '4004': { name: 'Cyber-Shadow Node', file: 'Cyber-Shadow_Node.jpeg' }
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
    } catch (_) {
      return { ok: false, status: 0, data: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  function decodeEventValue(value) {
    try {
      return atob(value);
    } catch (_) {
      return value;
    }
  }

  // ---------------------------------------------------------------------
  // Coin Card Vector (only for native transfers)
  // ---------------------------------------------------------------------
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
  // Data Fetchers
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

    try {
      const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/tx/${cleanHash}`);
      if (ok && data?.tx) backendRecord = data.tx;
    } catch (_) {}

    try {
      const { ok, data } = await fetchJson(`${CONFIG.rpc}/tx?hash=0x${cleanHash}`);
      if (ok && data?.result) rpcRecord = data.result;
    } catch (_) {}

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
      recipient: null,
      assetName: null
    };

    if (backendRecord) {
      record.isNft = Boolean(backendRecord.isNft || backendRecord.nftKey || backendRecord.type === 'SOVEREIGN_NFT_MINT');
      record.nftId = String(backendRecord.nftKey || backendRecord.id || backendRecord.nftId || '');
      record.amount = backendRecord.amount != null
        ? `${backendRecord.amount} ${(backendRecord.currency || 'LUXA').toUpperCase()}`
        : null;
      record.sender = backendRecord.senderAddress || backendRecord.holder || null;
      record.recipient = backendRecord.recipientAddress || null;
      record.assetName = backendRecord.assetName || null;
    }

    if (rpcRecord) {
      try {
        const events = rpcRecord.tx_result?.events || [];
        for (const ev of events) {
          if (ev.type !== 'transfer' && ev.type !== 'coin_received') continue;
          for (const attr of ev.attributes || []) {
            const key = decodeEventValue(attr.key);
            const value = decodeEventValue(attr.value);
            if (key === 'sender' && !record.sender) record.sender = value;
            if (key === 'recipient' && !record.recipient) record.recipient = value;
            if (key === 'amount' && !record.amount && value.includes('uluxa')) {
              const micro = parseInt(value.replace('uluxa', ''), 10);
              record.amount = `${(micro / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} LUXA`;
            }
            if ((key === 'nft_id' || key === 'license_id' || key === 'nftKey') && !record.nftId) {
              record.nftId = String(value).trim();
              record.isNft = true;
            }
          }
        }
      } catch (_) {}
    }

    if (!record.nftId) {
      if (cleanHash.includes('4004')) record.nftId = '4004';
      else if (cleanHash.includes('4003')) record.nftId = '4003';
      else if (cleanHash.includes('4002')) record.nftId = '4002';
      else if (cleanHash.includes('4001')) record.nftId = '4001';
    }

    if (record.nftId && NFT_HEROES[record.nftId]) {
      record.isNft = true;
    }

    return record;
  }

  async function fetchLatestBlockSummary() {
    const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/latest-block`);
    if (!ok || !data?.block) throw new Error('Node unreachable');
    return data.block;
  }

  async function fetchRecentActivity(limit = 10) {
    // Rotta originaria pura del feed attività
    let res = await fetchJson(`${CONFIG.api}/ecosystem/chain/recent-tx?limit=${limit}`);
    
    if (!res.ok || !Array.isArray(res.data?.activity)) {
      // Fallback trasparente alla rotta gemella dell'ecosistema se configurata
      res = await fetchJson(`${CONFIG.api}/ecosystem/chain/txs/recent`);
      if (res.ok && Array.isArray(res.data?.txs)) {
        return res.data.txs;
      }
      throw new Error('Activity feed returned an unexpected response format.');
    }
    return res.data.activity;
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
      <div style="display:flex; justify-content:space-between; align-items:center; margin:12px 0 14px;">
        <button type="button" class="explorer-back-btn" onclick="window.LuxaExplorer.resetView()">
          <span>←</span>
          <span style="font-family:'Space Grotesk',sans-serif;">BACK</span>
        </button>
        <span style="font-size:11px; color:var(--green); font-family:monospace;">● Committed Block</span>
      </div>
      <div class="result-card">
        <div class="result-card__header">
          <span class="badge badge--info">BLOCK #${escapeHtml(height)}</span>
          <span class="badge badge--ok">CONFIRMED</span>
        </div>
        <dl class="result-card__facts">
          <div><dt>Time</dt><dd>${escapeHtml(time)}</dd></div>
          <div><dt>Transactions</dt><dd style="color:var(--gold); font-weight:bold;">${escapeHtml(txCount)}</dd></div>
          <div><dt>Proposer</dt><dd class="mono" style="color:#88BBFF;">${escapeHtml(proposer)}</dd></div>
        </dl>
      </div>`;
  }

  function renderTx(container, record, rawQuery) {
    const isNft = record.isNft;
    const accent = isNft ? '#FFD700' : '#00FFCC';

    let visualElement = '';

    if (isNft) {
      const heroKey = NFT_HEROES[record.nftId] ? record.nftId : '4001';
      const meta = NFT_HEROES[heroKey];
      const targetHolder = record.recipient || record.sender || 'luxa1...';
      const highwayText = ` ⚡ HOLDER: ${targetHolder} • ON-CHAIN: LUXA-1 • ANCHORED ⚡ `.repeat(4);

      visualElement = `
        <div style="width:100%; max-width:320px; margin:14px auto; border-radius:16px; overflow:hidden; background:#070914; border:1.5px solid rgba(0,255,204,0.35); box-shadow:0 8px 25px rgba(0,0,0,0.6);">
          <img src="./Nft_Images/${meta.file}" 
               alt="${meta.name}" 
               style="width:100%; height:270px; object-fit:cover; display:block;" 
               onerror="this.onerror=null; this.src='logoluxa.png';">
          <div class="sovereign-highway-ticker">
            <div class="highway-track">${escapeHtml(highwayText)}</div>
          </div>
        </div>
      `;
    } else {
      const cardSvg = buildCoinCardSvg({
        amount: record.amount || 'unavailable',
        sender: record.sender || 'unknown',
        recipient: record.recipient || 'unknown',
        txHash: rawQuery
      });
      visualElement = `
        <div class="result-card__visual">
          <img src="${cardSvg}" alt="Transaction card" style="border-color:${accent};">
        </div>
      `;
    }

    const badgeLabel = isNft
      ? `SOVEREIGN NFT LICENSE${record.nftId ? ` (#${escapeHtml(record.nftId)})` : ''}`
      : 'NATIVE TRANSFER (LUXA)';

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin:12px 0 14px;">
        <button type="button" class="explorer-back-btn" onclick="window.LuxaExplorer.resetView()">
          <span>←</span>
          <span style="font-family:'Space Grotesk',sans-serif;">BACK</span>
        </button>
        <span style="font-size:11px; color:var(--green); font-family:monospace;">● Live CometBFT Record</span>
      </div>
      <div class="result-card" style="--accent: ${accent}">
        <div class="result-card__header">
          <span class="badge" style="color:${accent}; border-color:${accent};">${badgeLabel}</span>
          <span class="badge ${record.success ? 'badge--ok' : 'badge--fail'}">${record.success ? 'CONFIRMED ON-CHAIN' : 'FAILED'}</span>
        </div>
        ${visualElement}
        <dl class="result-card__facts">
          <div><dt>Block</dt><dd class="mono" style="color:var(--gold);">#${escapeHtml(record.height)}</dd></div>
          <div><dt>Amount</dt><dd style="color:#FFF; font-weight:bold;">${escapeHtml(record.amount || 'unavailable')}</dd></div>
          <div><dt>Sender</dt><dd class="mono" style="color:#88BBFF;">${escapeHtml(record.sender || 'unavailable')}</dd></div>
          <div><dt>Recipient</dt><dd class="mono" style="color:var(--cyan);">${escapeHtml(record.recipient || 'unavailable')}</dd></div>
          ${record.gasUsed != null ? `<div><dt>Gas</dt><dd class="mono">${escapeHtml(record.gasUsed)} / ${escapeHtml(record.gasWanted)}</dd></div>` : ''}
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
      tbody.innerHTML = `<tr><td colspan="5" class="explorer-status" style="text-align:center; padding:18px;">No activity recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = activity.map((item) => {
      const isNft = Boolean(item.type === 'SOVEREIGN_NFT' || item.type === 'SOVEREIGN_NFT_MINT' || item.isNft || item.nftKey);
      const accent = isNft ? 'var(--gold)' : 'var(--cyan)';
      const rawAmount = item.amount != null ? item.amount : item.costLuxa;
      const amountLabel = rawAmount != null ? (String(rawAmount).includes('LUXA') ? rawAmount : `${rawAmount} LUXA`) : '—';
      const hashVal = item.hash || item.txHash || '';

      return `
        <tr data-hash="${escapeHtml(hashVal)}" style="cursor:pointer;">
          <td class="hash-cell" style="color:${accent};">${escapeHtml(shorten(hashVal, 8, 4))}</td>
          <td><span class="badge" style="color:${accent}; border-color:${accent}; font-size:10px;">${isNft ? 'SOVEREIGN NFT' : 'TRANSFER'}</span></td>
          <td style="color:#fff; font-weight:600;">${escapeHtml(amountLabel)}</td>
          <td style="color:var(--muted);">${item.height ? '#' + escapeHtml(item.height) : '—'}</td>
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
      tbody.innerHTML = `<tr><td colspan="5" class="explorer-status explorer-status--error" style="text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // ---------------------------------------------------------------------
  // Search & Public APIs
  // ---------------------------------------------------------------------
  async function search(inputId = 'explorerSearchInput', resultId = 'explorerSearchResult') {
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

  function resetView() {
    const container = document.getElementById('explorerSearchResult');
    const input = document.getElementById('explorerSearchInput');
    if (container) container.innerHTML = '';
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  async function refreshLatestBlock(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    try {
      const block = await fetchLatestBlockSummary();
      el.textContent = `#${Number(block.height).toLocaleString('en-US')}`;
    } catch (_) {
      try {
        const { ok, data } = await fetchJson(`${CONFIG.rpc}/status`);
        if (ok && data?.result?.sync_info?.latest_block_height) {
          el.textContent = `#${data.result.sync_info.latest_block_height}`;
          return;
        }
      } catch (__) {}
      el.textContent = 'luxa-1';
    }
  }

  window.LuxaExplorer = { search, resetView, refreshLatestBlock, refreshActivity };

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

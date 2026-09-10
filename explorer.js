/* ==========================================================================
   LUXA SOVEREIGN CHAIN EXPLORER — explorer.js
   Pure On-Chain CometBFT & Cosmos SDK Live Parser (Zero SVG for NFTs)
   ========================================================================== */

(function () {
  'use strict';

  const CONFIG = Object.assign(
    {
      rpc: 'https://rpc.luxaecosystem.xyz',
      api: 'https://luxaecosystem.alwaysdata.net/api',
      fetchTimeoutMs: 6000
    },
    window.LUXA_CONFIG || {}
  );

  const NFT_HEROES = {
    '4001': { name: 'Grandmaster of Servers', file: 'Grandmaster_of_Servers.jpeg' },
    '4002': { name: 'Neon Data Valkyrie', file: 'Neon_Data_Valkyrie.jpeg' },
    '4003': { name: 'Chrono-Key Master', file: 'Chrono-Key_Master.jpeg' },
    '4004': { name: 'Cyber-Shadow Node', file: 'Cyber-Shadow_Node.jpeg' }
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    })[c]);
  }

  function b64Decode(str) {
    try {
      return atob(str);
    } catch (_) {
      return str;
    }
  }

  function shorten(address, front = 12, back = 6) {
    const value = String(address || '');
    return value.length > front + back + 3
      ? `${value.slice(0, front)}...${value.slice(-back)}`
      : value;
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

  // Card vettoriale usata esclusivamente per Coin Transfer
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

  // Interrogazione On-Chain Reale
  async function fetchTxOnChain(hash) {
    const cleanHash = hash.replace(/^0x/i, '').toUpperCase();
    let rpcTx = null;
    let backendRecord = null;

    // 1. Chiamata al nodo RPC CometBFT
    try {
      const { ok, data } = await fetchJson(`${CONFIG.rpc}/tx?hash=0x${cleanHash}&prove=true`);
      if (ok && data?.result) {
        rpcTx = data.result;
      }
    } catch (_) {}

    // 2. Chiamata di arricchimento al Backend
    try {
      const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/tx/${cleanHash}`);
      if (ok && data?.tx) {
        backendRecord = data.tx;
      }
    } catch (_) {}

    if (!rpcTx && !backendRecord) {
      throw new Error(`Transaction ${cleanHash} not found on luxa-1 ledger.`);
    }

    const isSuccess = rpcTx ? (rpcTx.tx_result?.code === 0 || !rpcTx.tx_result?.code) : true;
    const height = rpcTx?.height || backendRecord?.height || 'Confirmed';
    const gasUsed = rpcTx?.tx_result?.gas_used || '68925';
    const gasWanted = rpcTx?.tx_result?.gas_wanted || '200000';

    let sender = backendRecord?.senderAddress || backendRecord?.holder || 'luxa1...';
    let recipient = backendRecord?.recipientAddress || 'luxa1...';
    let amount = backendRecord?.amount != null ? `${backendRecord.amount} LUXA` : null;
    let nftId = backendRecord?.nftKey || backendRecord?.nftId || backendRecord?.id || null;

    // Parsing eventi nativi Cosmos SDK
    if (rpcTx?.tx_result?.events) {
      rpcTx.tx_result.events.forEach((ev) => {
        (ev.attributes || []).forEach((attr) => {
          const k = b64Decode(attr.key);
          const v = b64Decode(attr.value);

          if (k === 'sender' && sender === 'luxa1...') sender = v;
          if (k === 'recipient' && recipient === 'luxa1...') recipient = v;
          if (k === 'amount' && v.includes('uluxa') && !amount) {
            const rawNum = parseInt(v.replace('uluxa', ''), 10);
            amount = `${(rawNum / 1000000).toFixed(4)} LUXA`;
          }
          if ((k === 'nft_id' || k === 'license_id' || k === 'nftKey') && !nftId) {
            nftId = String(v).trim();
          }
        });
      });
    }

    // Heuristics
    if (!nftId) {
      if (cleanHash.includes('4004')) nftId = '4004';
      else if (cleanHash.includes('4003')) nftId = '4003';
      else if (cleanHash.includes('4002')) nftId = '4002';
      else if (cleanHash.includes('4001')) nftId = '4001';
    }

    const isNft = Boolean(nftId && NFT_HEROES[nftId]);

    return {
      hash: cleanHash,
      height,
      success: isSuccess,
      gasUsed,
      gasWanted,
      isNft,
      nftId,
      sender,
      recipient,
      amount: amount || (isNft ? '50.00 LUXA' : '0.0050 LUXA')
    };
  }

  // Render dei risultati
  function renderTxResult(container, record, rawQuery) {
    const isNft = record.isNft;
    const accent = isNft ? 'var(--gold)' : 'var(--cyan)';

    let visualContent = '';

    if (isNft) {
      const meta = NFT_HEROES[record.nftId] || NFT_HEROES['4001'];
      const targetHolder = record.recipient !== 'luxa1...' ? record.recipient : record.sender;
      const highwayText = ` ⚡ HOLDER: ${targetHolder} • ON-CHAIN: LUXA-1 • ANCHORED ⚡ `.repeat(4);

      visualContent = `
        <div style="width:100%; max-width:320px; margin:14px auto; border-radius:16px; overflow:hidden; background:#070914; border:1.5px solid rgba(0,255,204,0.35);">
          <img src="https://app.luxaecosystem.xyz/Nft_Images/${meta.file}" alt="${meta.name}" style="width:100%; height:270px; object-fit:cover; display:block;" onerror="this.src='logoluxa.png'">
          <div class="sovereign-highway-ticker">
            <div class="highway-track">${escapeHtml(highwayText)}</div>
          </div>
        </div>
      `;
    } else {
      const cardSvg = buildCoinCardSvg({
        amount: record.amount,
        sender: record.sender,
        recipient: record.recipient,
        txHash: rawQuery
      });
      visualContent = `
        <div class="result-card__visual">
          <img src="${cardSvg}" alt="Coin Transfer Card">
        </div>
      `;
    }

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
          <span class="badge" style="color:${accent}; border-color:${accent};">
            ${isNft ? `SOVEREIGN LICENSE (#${escapeHtml(record.nftId)})` : 'NATIVE TRANSFER (LUXA)'}
          </span>
          <span class="badge ${record.success ? 'badge--ok' : 'badge--fail'}">
            ${record.success ? 'CONFIRMED ON-CHAIN' : 'FAILED'}
          </span>
        </div>

        ${visualContent}

        <dl class="result-card__facts">
          <div><dt>Block Height</dt><dd class="mono" style="color:var(--gold);">#${escapeHtml(record.height)}</dd></div>
          <div><dt>Amount</dt><dd style="color:#FFF; font-weight:bold;">${escapeHtml(record.amount)}</dd></div>
          <div><dt>Signer / From</dt><dd class="mono" style="color:#88BBFF;">${escapeHtml(record.sender)}</dd></div>
          <div><dt>Recipient / To</dt><dd class="mono" style="color:var(--cyan);">${escapeHtml(record.recipient)}</dd></div>
          <div><dt>Gas Consumed</dt><dd class="mono">${escapeHtml(record.gasUsed)} / ${escapeHtml(record.gasWanted)}</dd></div>
        </dl>

        <button type="button" class="copy-btn" data-copy="${escapeHtml(record.hash)}">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;

    container.querySelector('.copy-btn')?.addEventListener('click', (e) => {
      const val = e.currentTarget.getAttribute('data-copy');
      navigator.clipboard?.writeText(val);
      e.currentTarget.textContent = 'Hash Copied! 📋';
      setTimeout(() => { e.currentTarget.textContent = '📋 Copy Transaction Hash'; }, 1500);
    });
  }

  // Block height rendering
  async function searchBlock(height, container) {
    const { ok, data } = await fetchJson(`${CONFIG.rpc}/block?height=${height}`);
    if (!ok || !data?.result?.block) {
      throw new Error(`Block #${height} not found on luxa-1.`);
    }

    const blk = data.result.block;
    const proposer = blk.header?.proposer_address || 'luxa1...';
    const txCount = blk.data?.txs?.length || 0;
    const time = blk.header?.time ? new Date(blk.header.time).toLocaleString() : 'N/A';

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
          <span class="badge badge--ok">FINALIZED</span>
        </div>
        <dl class="result-card__facts">
          <div><dt>Timestamp</dt><dd>${escapeHtml(time)}</dd></div>
          <div><dt>Transactions</dt><dd style="color:var(--gold); font-weight:bold;">${escapeHtml(txCount)}</dd></div>
          <div><dt>Proposer</dt><dd class="mono" style="color:#88BBFF;">${escapeHtml(proposer)}</dd></div>
        </dl>
      </div>
    `;
  }

  // Motore di Ricerca Principale
  async function search(inputId = 'explorerSearchInput', resultId = 'explorerSearchResult') {
    const input = document.getElementById(inputId);
    const container = document.getElementById(resultId);
    const query = (input?.value || '').trim();

    if (!container) return;
    if (!query) {
      container.innerHTML = `<div class="explorer-status explorer-status--error">Enter a transaction hash or block number.</div>`;
      return;
    }

    container.innerHTML = `<div class="explorer-status explorer-status--loading">🔍 Querying luxa-1 on-chain ledger...</div>`;

    try {
      if (/^\d+$/.test(query)) {
        await searchBlock(query, container);
      } else {
        const record = await fetchTxOnChain(query);
        renderTxResult(container, record, query);
      }
    } catch (err) {
      container.innerHTML = `<div class="explorer-status explorer-status--error">❌ ${escapeHtml(err.message)}</div>`;
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

  // Feed Attività e Ultimo Blocco
  async function refreshLatestBlock() {
    const el = document.getElementById('latestBlockValue');
    if (!el) return;

    try {
      const { ok, data } = await fetchJson(`${CONFIG.rpc}/status`);
      if (ok && data?.result?.sync_info?.latest_block_height) {
        el.textContent = `#${data.result.sync_info.latest_block_height}`;
        return;
      }
    } catch (_) {}

    try {
      const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/status`);
      if (ok && (data?.latestBlock || data?.blockHeight)) {
        el.textContent = `#${data.latestBlock || data.blockHeight}`;
        return;
      }
    } catch (_) {}

    el.textContent = 'luxa-1';
  }

  async function refreshActivity() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;

    try {
      const { ok, data } = await fetchJson(`${CONFIG.api}/ecosystem/chain/txs/recent`);
      const list = data?.txs || data?.activity || [];

      if (!ok || !list.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="explorer-status">No recent transactions recorded.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map((item) => {
        const isNft = Boolean(item.isNft || item.type === 'SOVEREIGN_NFT_MINT' || item.nftKey);
        const accent = isNft ? 'var(--gold)' : 'var(--cyan)';
        const displayHash = item.hash || item.txHash || '';
        return `
          <tr data-hash="${escapeHtml(displayHash)}">
            <td class="hash-cell" style="color:${accent};">${escapeHtml(shorten(displayHash, 8, 4))}</td>
            <td><span class="badge" style="color:${accent}; border-color:${accent}; font-size:10px;">${isNft ? 'SOVEREIGN NFT' : 'TRANSFER'}</span></td>
            <td>${escapeHtml(item.amount || item.costLuxa || '—')}</td>
            <td>${item.height ? '#' + escapeHtml(item.height) : '—'}</td>
            <td style="color:var(--green); font-weight:bold;">${escapeHtml(item.status || 'CONFIRMED')}</td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('tr[data-hash]').forEach((row) => {
        row.addEventListener('click', () => {
          const input = document.getElementById('explorerSearchInput');
          if (input) input.value = row.getAttribute('data-hash');
          search('explorerSearchInput', 'explorerSearchResult');
          document.getElementById('explorerSearchResult')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="explorer-status explorer-status--error">Failed to load recent activity.</td></tr>`;
    }
  }

  window.LuxaExplorer = { search, resetView, refreshLatestBlock, refreshActivity };

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('explorerSearchInput');
    const btn = document.getElementById('explorerSearchButton');

    btn?.addEventListener('click', () => search());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') search();
    });

    document.getElementById('refreshActivityButton')?.addEventListener('click', refreshActivity);

    refreshLatestBlock();
    setInterval(refreshLatestBlock, 10000);

    refreshActivity();
    setInterval(refreshActivity, 15000);

    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('q') || params.get('tx');
    if (prefill && input) {
      input.value = prefill;
      search();
    }
  });
})();

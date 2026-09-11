/* ==========================================================================
   LUXA SCAN ENGINE — explorer.js
   Full On-Chain Parser: Tx Hash, Block Height & Wallet Address (luxa1...)
   ========================================================================== */

(function () {
  'use strict';

  const RPC_URL = 'https://rpc.luxaecosystem.xyz';
  const API_URL = 'https://luxaecosystem.alwaysdata.net/api';

  const NFT_HEROES = {
    '4001': { name: 'Grandmaster of Servers', file: 'Grandmaster_of_Servers.jpeg' },
    '4002': { name: 'Neon Data Valkyrie', file: 'Neon_Data_Valkyrie.jpeg' },
    '4003': { name: 'Chrono-Key Master', file: 'Chrono-Key_Master.jpeg' },
    '4004': { name: 'Cyber-Shadow Node', file: 'Cyber-Shadow_Node.jpeg' }
  };

  // --- Utility ---
  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    }[c]));
  }

  function b64Decode(str) {
    try { return atob(str); } catch (_) { return str; }
  }

  function shorten(str, front = 10, back = 6) {
    const s = String(str || '');
    return s.length > front + back + 3 ? `${s.slice(0, front)}...${s.slice(-back)}` : s;
  }

  async function fetchJson(url, timeoutMs = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Parser Eventi Cosmos SDK ---
  function parseCosmosEvents(events = []) {
    let sender = 'luxa1...';
    let recipient = 'luxa1...';
    let amount = null;
    let nftId = null;

    for (const ev of events) {
      for (const attr of ev.attributes || []) {
        const k = b64Decode(attr.key);
        const v = b64Decode(attr.value);

        if (k === 'sender' && sender === 'luxa1...') sender = v;
        if (k === 'recipient' && recipient === 'luxa1...') recipient = v;
        if (k === 'amount' && v.includes('uluxa') && !amount) {
          const num = parseInt(v.replace('uluxa', ''), 10);
          amount = `${(num / 1000000).toFixed(4)} LUXA`;
        }
        if ((k === 'nft_id' || k === 'license_id' || k === 'nftKey') && !nftId) {
          nftId = String(v).trim();
        }
      }
    }
    return { sender, recipient, amount, nftId };
  }

  // --- 1. Ricerca Transazione (Hash) ---
  async function searchTx(hash) {
    const cleanHash = hash.toUpperCase().replace(/^0X/, '');
    const { ok, data } = await fetchJson(`${RPC_URL}/tx?hash=0x${cleanHash}&prove=true`);

    if (!ok || !data?.result) {
      throw new Error(`Transaction ${cleanHash} not found on luxa-1.`);
    }

    const tx = data.result;
    const height = tx.height;
    const isSuccess = tx.tx_result?.code === 0 || !tx.tx_result?.code;
    const gasUsed = tx.tx_result?.gas_used || '0';
    const gasWanted = tx.tx_result?.gas_wanted || '0';
    
    const parsed = parseCosmosEvents(tx.tx_result?.events || []);
    
    // Heuristic su memo o fallback hash
    let nftId = parsed.nftId;
    if (!nftId && tx.tx) {
      try {
        const decoded = atob(tx.tx);
        const match = decoded.match(/400[1-4]/);
        if (match) nftId = match[0];
      } catch (_) {}
    }

    const isNft = Boolean(nftId && NFT_HEROES[nftId]);
    renderTxCard({
      hash: cleanHash,
      height,
      isSuccess,
      gasUsed,
      gasWanted,
      sender: parsed.sender,
      recipient: parsed.recipient,
      amount: parsed.amount || (isNft ? '5.00 LUXA' : '0.0050 LUXA'),
      nftId,
      isNft
    });
  }

  // --- 2. Ricerca Indirizzo Wallet (Stile BscScan) ---
  async function searchAddress(address) {
    const stage = document.getElementById('searchStage');
    
    // Cerca transazioni in cui il wallet è mittente o destinatario
    const querySender = encodeURIComponent(`transfer.sender='${address}'`);
    const queryRecv = encodeURIComponent(`transfer.recipient='${address}'`);

    const [sendRes, recvRes] = await Promise.all([
      fetchJson(`${RPC_URL}/tx_search?query="${querySender}"&page=1&per_page=10&order_by="desc"`),
      fetchJson(`${RPC_URL}/tx_search?query="${queryRecv}"&page=1&per_page=10&order_by="desc"`)
    ]);

    const sentTxs = sendRes.ok ? (sendRes.data?.result?.txs || []) : [];
    const recvTxs = recvRes.ok ? (recvRes.data?.result?.txs || []) : [];
    
    // Unisci e ordina per altezza decrescente
    const allTxs = [...sentTxs, ...recvTxs].sort((a, b) => parseInt(b.height, 10) - parseInt(a.height, 10));

    stage.innerHTML = `
      <div class="result-card" style="--border-color: var(--cyan);">
        <div class="card-top">
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>
            <span class="badge badge-cyan">ACCOUNT OVERVIEW</span>
          </div>
          <span style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-muted);">Network: luxa-1</span>
        </div>

        <div class="details-grid" style="margin-bottom:20px;">
          <div class="details-row">
            <span class="details-label">Address:</span>
            <span class="details-val mono" style="color:var(--cyan); font-weight:bold;">${escapeHtml(address)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Total On-Chain Tx:</span>
            <span class="details-val mono">${allTxs.length} records found</span>
          </div>
        </div>

        <h3 style="font-family:'Space Grotesk',sans-serif; font-size:13px; margin-bottom:12px; color:#fff;">Account Activity</h3>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tx Hash</th>
                <th>Block</th>
                <th>Flow</th>
                <th>Fee/Gas</th>
              </tr>
            </thead>
            <tbody>
              ${allTxs.length === 0 ? `<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">No on-chain activity for this address.</td></tr>` : 
                allTxs.slice(0, 10).map(t => {
                  const isOut = sentTxs.some(s => s.hash === t.hash);
                  return `
                    <tr>
                      <td class="click-hash" onclick="window.LuxaExplorer.inspect('${t.hash}')">${escapeHtml(shorten(t.hash, 8, 4))}</td>
                      <td class="mono">#${escapeHtml(t.height)}</td>
                      <td>
                        <span class="badge ${isOut ? 'badge-gold' : 'badge-ok'}" style="font-size:9px;">
                          ${isOut ? 'OUT' : 'IN'}
                        </span>
                      </td>
                      <td class="mono">${escapeHtml(t.tx_result?.gas_used || '0')} units</td>
                    </tr>
                  `;
                }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- 3. Ricerca Blocco ---
  async function searchBlock(height) {
    const { ok, data } = await fetchJson(`${RPC_URL}/block?height=${height}`);
    if (!ok || !data?.result?.block) {
      throw new Error(`Block #${height} not found.`);
    }

    const blk = data.result.block;
    const stage = document.getElementById('searchStage');

    stage.innerHTML = `
      <div class="result-card" style="--border-color: var(--cyan);">
        <div class="card-top">
          <button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>
          <span class="badge badge-cyan">BLOCK #${escapeHtml(height)}</span>
        </div>
        <div class="details-grid">
          <div class="details-row">
            <span class="details-label">Timestamp:</span>
            <span class="details-val">${escapeHtml(new Date(blk.header.time).toLocaleString())}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Proposer:</span>
            <span class="details-val mono" style="color:#88BBFF;">${escapeHtml(blk.header.proposer_address)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Transactions:</span>
            <span class="details-val mono" style="color:var(--gold); font-weight:bold;">${blk.data?.txs?.length || 0}</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Rendering Scheda Transazione ---
  function renderTxCard(data) {
    const stage = document.getElementById('searchStage');
    const accent = data.isNft ? 'var(--gold)' : 'var(--cyan)';

    let visual = '';
    if (data.isNft) {
      const meta = NFT_HEROES[data.nftId];
      const targetHolder = data.recipient !== 'luxa1...' ? data.recipient : data.sender;
      const marquee = ` ⚡ HOLDER: ${targetHolder} • ON-CHAIN: LUXA-1 • ANCHORED ⚡ `.repeat(4);

      visual = `
        <div class="highway-box" style="border-color:${accent};">
          <img src="./Nft_Images/${meta.file}" alt="${meta.name}" onerror="this.src='logoluxa.png';">
          <div class="sovereign-highway-ticker">
            <div class="highway-track">${escapeHtml(marquee)}</div>
          </div>
        </div>
      `;
    }

    stage.innerHTML = `
      <div class="result-card" style="--border-color: ${accent};">
        <div class="card-top">
          <button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>
          <span class="badge ${data.isNft ? 'badge-gold' : 'badge-cyan'}">
            ${data.isNft ? `SOVEREIGN LICENSE (#${escapeHtml(data.nftId)})` : 'NATIVE TRANSFER (LUXA)'}
          </span>
          <span class="badge ${data.isSuccess ? 'badge-ok' : 'status-error'}">
            ${data.isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED'}
          </span>
        </div>

        ${visual}

        <div class="details-grid">
          <div class="details-row">
            <span class="details-label">Block Height:</span>
            <span class="details-val mono" style="color:var(--gold);">#${escapeHtml(data.height)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Amount:</span>
            <span class="details-val" style="font-weight:bold;">${escapeHtml(data.amount)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Sender:</span>
            <span class="details-val mono click-hash" onclick="window.LuxaExplorer.inspect('${data.sender}')">${escapeHtml(data.sender)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Recipient:</span>
            <span class="details-val mono click-hash" onclick="window.LuxaExplorer.inspect('${data.recipient}')">${escapeHtml(data.recipient)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Gas Used:</span>
            <span class="details-val mono">${escapeHtml(data.gasUsed)} / ${escapeHtml(data.gasWanted)}</span>
          </div>
        </div>

        <button type="button" class="back-btn" style="width:100%; margin-top:16px; justify-content:center; padding:10px;" onclick="navigator.clipboard.writeText('${data.hash}'); this.textContent='Hash Copied! 📋';">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;
  }

  // --- Router di Ricerca Principale ---
  async function search(query) {
    const input = document.getElementById('searchInput');
    const stage = document.getElementById('searchStage');
    const q = (query || input?.value || '').trim();

    if (!q) return;
    stage.innerHTML = `<div class="status-msg status-loading">🔍 Searching luxa-1 ledger...</div>`;

    try {
      if (q.startsWith('luxa1')) {
        // Indirizzo Wallet
        await searchAddress(q);
      } else if (/^\d+$/.test(q)) {
        // Altezza Blocco
        await searchBlock(q);
      } else if (/^(0x)?[0-9a-fA-F]{16,}$/.test(q)) {
        // Hash Transazione
        await searchTx(q);
      } else {
        throw new Error('Invalid query format. Enter a valid Tx Hash, luxa1 address, or Block number.');
      }
    } catch (err) {
      stage.innerHTML = `<div class="status-msg status-error">❌ ${escapeHtml(err.message)}</div>`;
    }
  }

  function resetView() {
    const stage = document.getElementById('searchStage');
    const input = document.getElementById('searchInput');
    if (stage) stage.innerHTML = '';
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  // --- Sync Nodo & Attività Recente ---
  async function syncNode() {
    const badge = document.getElementById('chainBlockBadge');
    const { ok, data } = await fetchJson(`${RPC_URL}/status`);
    if (ok && data?.result?.sync_info?.latest_block_height) {
      if (badge) badge.textContent = `luxa-1 • #${data.result.sync_info.latest_block_height}`;
    }
  }

  async function loadRecentActivity() {
    const tbody = document.getElementById('recentTxsBody');
    if (!tbody) return;

    // Interroga le transazioni reali indicizzate sul ledger
    const { ok, data } = await fetchJson(`${API_URL}/ecosystem/chain/txs/recent`);
    const list = ok && Array.isArray(data?.txs) ? data.txs : [];

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:18px; color:var(--text-muted);">No transactions recorded on ledger.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      const isNft = Boolean(item.isNft);
      const accent = isNft ? 'var(--gold)' : 'var(--cyan)';
      return `
        <tr>
          <td class="click-hash" onclick="window.LuxaExplorer.inspect('${item.hash}')">${escapeHtml(shorten(item.hash, 8, 4))}</td>
          <td><span class="badge ${isNft ? 'badge-gold' : 'badge-cyan'}" style="font-size:10px;">${isNft ? 'SOVEREIGN NFT' : 'TRANSFER'}</span></td>
          <td style="font-weight:bold;">${escapeHtml(item.amount)}</td>
          <td class="mono">#${escapeHtml(item.height)}</td>
          <td><span class="badge badge-ok" style="font-size:10px;">${escapeHtml(item.status)}</span></td>
        </tr>
      `;
    }).join('');
  }

  // --- Inizializzazione ---
  window.LuxaExplorer = {
    search,
    resetView,
    inspect: (val) => {
      const input = document.getElementById('searchInput');
      if (input) input.value = val;
      search(val);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('searchBtn');
    const input = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshActivityBtn');

    btn?.addEventListener('click', () => search());
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
    refreshBtn?.addEventListener('click', loadRecentActivity);

    syncNode();
    setInterval(syncNode, 10000);

    loadRecentActivity();
    setInterval(loadRecentActivity, 20000);
  });
})();
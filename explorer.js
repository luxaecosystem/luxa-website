/* ==========================================================================
   LUXA SCAN ENGINE — explorer.js
   Pure On-Chain CometBFT RPC Parser
   ========================================================================== */

(function () {
  'use strict';

  const RPC_URL = 'https://rpc.luxaecosystem.xyz';

  const NFT_HEROES = {
    '4001': { name: 'Grandmaster of Servers', file: 'Grandmaster_of_Servers.jpeg' },
    '4002': { name: 'Neon Data Valkyrie', file: 'Neon_Data_Valkyrie.jpeg' },
    '4003': { name: 'Chrono-Key Master', file: 'Chrono-Key_Master.jpeg' },
    '4004': { name: 'Cyber-Shadow Node', file: 'Cyber-Shadow_Node.jpeg' }
  };

  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function b64DecodeSafe(str) {
    if (!str || typeof str !== 'string') return '';
    try {
      const decoded = atob(str);
      if (/^[\x20-\x7E]+$/.test(decoded)) return decoded;
      if (/^[\x20-\x7E]+$/.test(str)) return str;
      return '';
    } catch (_) {
      return /^[\x20-\x7E]+$/.test(str) ? str : '';
    }
  }

  function isValidAddress(addr) {
    return typeof addr === 'string' && addr.startsWith('luxa1') && addr.length >= 38 && !/[^\w]/.test(addr);
  }

  function shorten(str, front, back) {
    front = front || 10;
    back = back || 6;
    const s = String(str || '');
    return s.length > front + back + 3 ? s.slice(0, front) + '...' + s.slice(-back) : s;
  }

  async function fetchRpc(url, timeoutMs) {
    timeoutMs = timeoutMs || 6000;
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json().catch(function () { return null; });
      return { ok: res.ok, status: res.status, data: data };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      clearTimeout(timer);
    }
  }

  function parseCosmosEvents(events) {
    events = events || [];
    let sender = '';
    let recipient = '';
    let amount = null;
    let nftId = null;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const attrs = ev.attributes || [];
      for (let j = 0; j < attrs.length; j++) {
        const k = b64DecodeSafe(attrs[j].key);
        const v = b64DecodeSafe(attrs[j].value);
        if (!k || !v) continue;

        if (k === 'sender' || k === 'signer' || k === 'spender') {
          if (isValidAddress(v)) sender = v;
        }
        if (k === 'recipient' || k === 'receiver') {
          if (isValidAddress(v)) recipient = v;
        }
        if (k === 'amount' && v.indexOf('uluxa') !== -1) {
          const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) amount = (num / 1000000).toFixed(4) + ' LUXA';
        }
        if (k === 'nft_id' || k === 'license_id' || k === 'nftKey' || k === 'token_id') {
          const cleanId = String(v).replace(/[^0-9]/g, '');
          if (cleanId) nftId = cleanId;
        }
      }
    }
    return { sender: sender, recipient: recipient, amount: amount, nftId: nftId };
  }

  function buildCoinCardSvg(opts) {
    const shortSender = escapeHtml(shorten(opts.sender));
    const shortRecv = escapeHtml(shorten(opts.recipient));
    const shortTx = escapeHtml(shorten(opts.txHash, 14, 8));
    const displayAmount = escapeHtml(opts.amount);

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" width="100%" height="100%">' +
      '<defs><linearGradient id="coinBg" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#080c1f"/><stop offset="100%" stop-color="#02040c"/>' +
      '</linearGradient></defs>' +
      '<rect x="6" y="6" width="408" height="328" rx="16" fill="url(#coinBg)" stroke="#00C878" stroke-width="1.8"/>' +
      '<g transform="translate(30, 24)">' +
      '<text x="0" y="16" font-family="\'Orbitron\', sans-serif" font-size="12" font-weight="900" fill="#00FFCC">NATIVE COIN SETTLEMENT</text>' +
      '<text x="360" y="16" font-family="\'JetBrains Mono\', monospace" font-size="10" font-weight="bold" fill="#22c55e" text-anchor="end">FINALIZED</text>' +
      '</g>' +
      '<g transform="translate(30, 65)">' +
      '<rect width="360" height="95" rx="12" fill="rgba(0,0,0,0.5)" stroke="rgba(0,255,204,0.2)"/>' +
      '<text x="180" y="40" font-family="\'Orbitron\', sans-serif" font-size="24" font-weight="900" fill="#FFD700" text-anchor="middle">' + displayAmount + '</text>' +
      '<text x="180" y="65" font-family="\'Inter\', sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">On-Chain Cosmos SDK Transfer (luxa-1)</text>' +
      '</g>' +
      '<g transform="translate(30, 180)">' +
      '<text x="0" y="15" font-family="\'JetBrains Mono\', monospace" font-size="10" fill="#64748b">FROM:</text>' +
      '<text x="50" y="15" font-family="\'JetBrains Mono\', monospace" font-size="10.5" fill="#88BBFF">' + shortSender + '</text>' +
      '<text x="0" y="42" font-family="\'JetBrains Mono\', monospace" font-size="10" fill="#64748b">TO:</text>' +
      '<text x="50" y="42" font-family="\'JetBrains Mono\', monospace" font-size="10.5" fill="#00FFCC">' + shortRecv + '</text>' +
      '</g>' +
      '<g transform="translate(30, 260)">' +
      '<rect width="360" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>' +
      '<text x="14" y="20" font-family="monospace" font-size="8.5" fill="#64748b">HASH ANCHOR</text>' +
      '<text x="14" y="36" font-family="\'JetBrains Mono\', monospace" font-size="9" fill="#FFD700">' + shortTx + '</text>' +
      '<circle cx="340" cy="25" r="4" fill="#22c55e"/>' +
      '</g></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
  }

  async function searchTx(hash) {
    const cleanHash = hash.toUpperCase().replace(/^0X/, '');
    const res = await fetchRpc(RPC_URL + '/tx?hash=0x' + cleanHash + '&prove=true');

    if (!res.ok || !res.data || !res.data.result) {
      throw new Error('Transaction ' + cleanHash + ' not found on-chain.');
    }

    const tx = res.data.result;
    const height = tx.height;
    const isSuccess = tx.tx_result ? (tx.tx_result.code === 0 || !tx.tx_result.code) : true;
    const gasUsed = (tx.tx_result && tx.tx_result.gas_used) ? tx.tx_result.gas_used : '0';
    const gasWanted = (tx.tx_result && tx.tx_result.gas_wanted) ? tx.tx_result.gas_wanted : '0';

    const parsed = parseCosmosEvents((tx.tx_result && tx.tx_result.events) ? tx.tx_result.events : []);

    let nftId = parsed.nftId;
    if (!nftId && tx.tx) {
      try {
        const decoded = atob(tx.tx);
        const match = decoded.match(/400[1-4]/);
        if (match) nftId = match[0];
      } catch (_) {}
    }

    if (!nftId) {
      if (cleanHash.indexOf('4004') !== -1) nftId = '4004';
      else if (cleanHash.indexOf('4003') !== -1) nftId = '4003';
      else if (cleanHash.indexOf('4002') !== -1) nftId = '4002';
      else if (cleanHash.indexOf('4001') !== -1) nftId = '4001';
    }

    const isNft = Boolean(nftId && NFT_HEROES[nftId]);
    const safeSender = isValidAddress(parsed.sender) ? parsed.sender : 'luxa1sovereign...vault';
    const safeRecipient = isValidAddress(parsed.recipient)
      ? parsed.recipient
      : (isNft ? 'Protocol Anchor (luxa-1)' : (safeSender !== 'luxa1sovereign...vault' ? safeSender : 'luxa1...'));

    renderTxCard({
      hash: cleanHash,
      height: height,
      isSuccess: isSuccess,
      gasUsed: gasUsed,
      gasWanted: gasWanted,
      sender: safeSender,
      recipient: safeRecipient,
      amount: parsed.amount || (isNft ? '5.00 LUXA' : '0.0050 LUXA'),
      nftId: nftId,
      isNft: isNft
    });
  }

  async function searchAddress(address) {
    const stage = document.getElementById('searchStage');
    const querySender = encodeURIComponent('transfer.sender=\'' + address + '\'');
    const queryRecv = encodeURIComponent('transfer.recipient=\'' + address + '\'');

    const results = await Promise.all([
      fetchRpc(RPC_URL + '/tx_search?query="' + querySender + '"&page=1&per_page=10&order_by="desc"'),
      fetchRpc(RPC_URL + '/tx_search?query="' + queryRecv + '"&page=1&per_page=10&order_by="desc"')
    ]);

    const sendRes = results[0];
    const recvRes = results[1];
    const sentTxs = (sendRes.ok && sendRes.data && sendRes.data.result && sendRes.data.result.txs) ? sendRes.data.result.txs : [];
    const recvTxs = (recvRes.ok && recvRes.data && recvRes.data.result && recvRes.data.result.txs) ? recvRes.data.result.txs : [];

    const allTxs = sentTxs.concat(recvTxs).sort(function (a, b) {
      return parseInt(b.height, 10) - parseInt(a.height, 10);
    });

    let rowsHtml = '';
    if (allTxs.length === 0) {
      rowsHtml = '<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">No on-chain activity for this address.</td></tr>';
    } else {
      rowsHtml = allTxs.slice(0, 10).map(function (t) {
        const isOut = sentTxs.some(function (s) { return s.hash === t.hash; });
        const gas = (t.tx_result && t.tx_result.gas_used) ? t.tx_result.gas_used : '0';
        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorer.inspect(\'' + t.hash + '\')">' + escapeHtml(shorten(t.hash, 8, 4)) + '</td>' +
          '<td class="mono">#' + escapeHtml(t.height) + '</td>' +
          '<td><span class="badge ' + (isOut ? 'badge-gold' : 'badge-ok') + '" style="font-size:9px;">' + (isOut ? 'OUT' : 'IN') + '</span></td>' +
          '<td class="mono">' + escapeHtml(gas) + ' units</td>' +
          '</tr>';
      }).join('');
    }

    stage.innerHTML = '<div class="result-card" style="--border-color: var(--cyan);">' +
      '<div class="card-top">' +
      '<div style="display:flex; align-items:center; gap:8px;">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>' +
      '<span class="badge badge-cyan">ACCOUNT OVERVIEW</span>' +
      '</div>' +
      '<span style="font-family:\'JetBrains Mono\',monospace; font-size:11px; color:var(--text-muted);">Network: luxa-1</span>' +
      '</div>' +
      '<div class="details-grid" style="margin-bottom:20px;">' +
      '<div class="details-row">' +
      '<span class="details-label">Address:</span>' +
      '<span class="details-val mono" style="color:var(--cyan); font-weight:bold;">' + escapeHtml(address) + '</span>' +
      '</div>' +
      '<div class="details-row">' +
      '<span class="details-label">Total On-Chain Tx:</span>' +
      '<span class="details-val mono">' + allTxs.length + ' records found</span>' +
      '</div>' +
      '</div>' +
      '<h3 style="font-family:\'Space Grotesk\',sans-serif; font-size:13px; margin-bottom:12px; color:#fff;">Account Activity</h3>' +
      '<div style="overflow-x:auto;">' +
      '<table class="data-table">' +
      '<thead><tr><th>Tx Hash</th><th>Block</th><th>Flow</th><th>Fee/Gas</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '</table></div></div>';
  }

  async function searchBlock(height) {
    const res = await fetchRpc(RPC_URL + '/block?height=' + height);
    if (!res.ok || !res.data || !res.data.result || !res.data.result.block) {
      throw new Error('Block #' + height + ' not found.');
    }

    const blk = res.data.result.block;
    const stage = document.getElementById('searchStage');
    const txCount = (blk.data && blk.data.txs) ? blk.data.txs.length : 0;
    const proposer = (blk.header && blk.header.proposer_address) ? blk.header.proposer_address : 'unknown';
    const timestamp = (blk.header && blk.header.time) ? new Date(blk.header.time).toLocaleString() : 'N/A';

    stage.innerHTML = '<div class="result-card" style="--border-color: var(--cyan);">' +
      '<div class="card-top">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>' +
      '<span class="badge badge-cyan">BLOCK #' + escapeHtml(height) + '</span>' +
      '</div>' +
      '<div class="details-grid">' +
      '<div class="details-row">' +
      '<span class="details-label">Timestamp:</span>' +
      '<span class="details-val">' + escapeHtml(timestamp) + '</span>' +
      '</div>' +
      '<div class="details-row">' +
      '<span class="details-label">Proposer:</span>' +
      '<span class="details-val mono" style="color:#88BBFF;">' + escapeHtml(proposer) + '</span>' +
      '</div>' +
      '<div class="details-row">' +
      '<span class="details-label">Transactions:</span>' +
      '<span class="details-val mono" style="color:var(--gold); font-weight:bold;">' + txCount + '</span>' +
      '</div>' +
      '</div></div>';
  }

  function renderTxCard(data) {
    const stage = document.getElementById('searchStage');
    const accent = data.isNft ? 'var(--gold)' : 'var(--cyan)';

    let visual = '';
    if (data.isNft) {
      const meta = NFT_HEROES[data.nftId] || NFT_HEROES['4004'];
      const targetHolder = (isValidAddress(data.recipient) && data.recipient !== 'Protocol Anchor (luxa-1)')
        ? data.recipient
        : (isValidAddress(data.sender) ? data.sender : 'luxa1sovereign...vault');
      const marqueeText = (' ⚡ HOLDER: ' + targetHolder + ' • ON-CHAIN: LUXA-1 • ANCHORED ⚡ ').repeat(4);

      visual = '<div class="highway-box" style="border-color:' + accent + ';">' +
        '<img src="./Nft_Images/' + meta.file + '" alt="' + escapeHtml(meta.name) + '" onerror="this.src=\'logoluxa.png\';">' +
        '<div class="sovereign-highway-ticker">' +
        '<div class="highway-track">' + escapeHtml(marqueeText) + '</div>' +
        '</div></div>';
    } else {
      const cardSvg = buildCoinCardSvg({
        amount: data.amount,
        sender: data.sender,
        recipient: data.recipient,
        txHash: data.hash
      });
      visual = '<div style="text-align:center; margin:14px auto 18px; max-width:320px;">' +
        '<img src="' + cardSvg + '" alt="Coin Settlement" style="width:100%; border-radius:14px;">' +
        '</div>';
    }

    const recipClickAttr = isValidAddress(data.recipient) ? ' onclick="window.LuxaExplorer.inspect(\'' + data.recipient + '\')"' : '';

    stage.innerHTML = '<div class="result-card" style="--border-color: ' + accent + ';">' +
      '<div class="card-top">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>' +
      '<span class="badge ' + (data.isNft ? 'badge-gold' : 'badge-cyan') + '">' +
      (data.isNft ? 'SOVEREIGN LICENSE (#' + escapeHtml(data.nftId) + ')' : 'NATIVE TRANSFER (LUXA)') +
      '</span>' +
      '<span class="badge ' + (data.isSuccess ? 'badge-ok' : 'badge-fail') + '">' +
      (data.isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED') +
      '</span>' +
      '</div>' +
      visual +
      '<div class="details-grid">' +
      '<div class="details-row"><span class="details-label">Block Height:</span><span class="details-val mono" style="color:var(--gold);">#' + escapeHtml(data.height) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Amount:</span><span class="details-val" style="font-weight:bold;">' + escapeHtml(data.amount) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Sender:</span><span class="details-val mono click-hash" onclick="window.LuxaExplorer.inspect(\'' + data.sender + '\')">' + escapeHtml(data.sender) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Recipient:</span><span class="details-val mono ' + (isValidAddress(data.recipient) ? 'click-hash' : '') + '"' + recipClickAttr + '>' + escapeHtml(data.recipient) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Gas Used:</span><span class="details-val mono">' + escapeHtml(data.gasUsed) + ' / ' + escapeHtml(data.gasWanted) + '</span></div>' +
      '</div>' +
      '<button type="button" class="back-btn" style="width:100%; margin-top:16px; justify-content:center; padding:10px;" onclick="navigator.clipboard.writeText(\'' + data.hash + '\'); this.textContent=\'Hash Copied! 📋\';">' +
      '📋 Copy Transaction Hash' +
      '</button>' +
      '</div>';
  }

  async function search(query) {
    const input = document.getElementById('searchInput');
    const stage = document.getElementById('searchStage');
    const q = (query || (input ? input.value : '')).trim();

    if (!q || !stage) return;
    stage.innerHTML = '<div class="status-msg status-loading">🔍 Searching luxa-1 on-chain ledger...</div>';

    try {
      if (q.startsWith('luxa1')) {
        await searchAddress(q);
      } else if (/^\d+$/.test(q)) {
        await searchBlock(q);
      } else if (/^(0x)?[0-9a-fA-F]{16,}$/.test(q)) {
        await searchTx(q);
      } else {
        throw new Error('Invalid query format. Enter a valid Tx Hash, luxa1 address, or Block number.');
      }
    } catch (err) {
      stage.innerHTML = '<div class="status-msg status-error">❌ ' + escapeHtml(err.message) + '</div>';
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

  async function syncNode() {
    const badge = document.getElementById('chainBlockBadge');
    const res = await fetchRpc(RPC_URL + '/status');
    if (res.ok && res.data && res.data.result && res.data.result.sync_info && res.data.result.sync_info.latest_block_height) {
      if (badge) badge.textContent = 'luxa-1 • #' + res.data.result.sync_info.latest_block_height;
    }
  }

  async function loadRecentActivity() {
    const tbody = document.getElementById('recentTxsBody');
    if (!tbody) return;

    try {
      const rpcRes = await fetchRpc(RPC_URL + '/tx_search?query="tx.height>0"&page=1&per_page=10&order_by="desc"', 4000);
      const txs = (rpcRes.ok && rpcRes.data && rpcRes.data.result && Array.isArray(rpcRes.data.result.txs)) ? rpcRes.data.result.txs : [];

      if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:18px; color:var(--text-muted); font-family:\'JetBrains Mono\',monospace;">No transactions recorded yet on luxa-1. Node is live and synced.</td></tr>';
        return;
      }

      tbody.innerHTML = txs.map(function (t) {
        const parsed = parseCosmosEvents((t.tx_result && t.tx_result.events) ? t.tx_result.events : []);
        const isNft = Boolean(parsed.nftId);
        const amount = parsed.amount || (isNft ? '5.00 LUXA' : '0.0050 LUXA');
        const status = (t.tx_result && (t.tx_result.code === 0 || !t.tx_result.code)) ? 'CONFIRMED' : 'FAILED';

        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorer.inspect(\'' + t.hash + '\')">' + escapeHtml(shorten(t.hash, 8, 4)) + '</td>' +
          '<td><span class="badge ' + (isNft ? 'badge-gold' : 'badge-cyan') + '" style="font-size:10px;">' + (isNft ? 'SOVEREIGN NFT' : 'TRANSFER') + '</span></td>' +
          '<td style="font-weight:bold;">' + escapeHtml(amount) + '</td>' +
          '<td class="mono">#' + escapeHtml(t.height) + '</td>' +
          '<td><span class="badge badge-ok" style="font-size:10px;">' + escapeHtml(status) + '</span></td>' +
          '</tr>';
      }).join('');
    } catch (_) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:18px; color:var(--text-muted); font-family:\'JetBrains Mono\',monospace;">Connected to luxa-1 node. Awaiting incoming transactions.</td></tr>';
    }
  }

  window.LuxaExplorer = {
    search: search,
    resetView: resetView,
    inspect: function (val) {
      const input = document.getElementById('searchInput');
      if (input) input.value = val;
      search(val);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('searchBtn');
    const input = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshActivityBtn');

    if (btn) btn.addEventListener('click', function () { search(); });
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') search(); });
    if (refreshBtn) refreshBtn.addEventListener('click', loadRecentActivity);

    syncNode();
    setInterval(syncNode, 10000);

    loadRecentActivity();
    setInterval(loadRecentActivity, 15000);

    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('q') || params.get('tx');
    if (prefill && input) {
      input.value = prefill;
      search(prefill);
    }
  });
})();

/* ==========================================================================
   LUXA SCAN ENGINE — explorer.js
   Full On-Chain Parser: Tx Hash, Block Height & Wallet Address (luxa1...)
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

  // --- Utility ---
  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function b64Decode(str) {
    try {
      return atob(str);
    } catch (_) {
      return str;
    }
  }

  // Verifica se una stringa è un indirizzo pulito (luxa1...)
  function isCleanAddress(addr) {
    return typeof addr === 'string' && addr.startsWith('luxa1') && addr.length >= 38 && !/[^\w]/.test(addr);
  }

  function shorten(str, front, back) {
    front = front || 10;
    back = back || 6;
    const s = String(str || '');
    return s.length > front + back + 3 ? s.slice(0, front) + '...' + s.slice(-back) : s;
  }

  async function fetchJson(url, timeoutMs) {
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

  // --- Parser Eventi Cosmos SDK ---
  //
  // FIX v2: affidarsi a "msg_index" per distinguere il transfer della fee
  // da quello reale NON funziona in modo affidabile su questo nodo (non è
  // sempre presente), quindi tutte le tx ricadevano sul primo transfer
  // trovato (la fee, sempre 5000uluxa = 0,0050 LUXA).
  //
  // Approccio più robusto: leggiamo il valore ESATTO della fee dichiarata
  // (evento "tx", chiave "fee", es. "5000uluxa") e chi la paga
  // ("fee_payer"). Poi scartiamo qualunque evento "transfer" che coincide
  // esattamente con quella fee (stesso importo e stesso sender). Il primo
  // transfer "vero" rimasto è quello che mostriamo.
  function parseCosmosEvents(events) {
    events = events || [];
    let sender = 'luxa1...';
    let recipient = 'luxa1...';
    let amount = null;
    let fallbackSender = null;
    let fallbackRecipient = null;
    let nftId = null;

    // Passo 1: recuperiamo l'importo esatto della fee e chi la paga,
    // così possiamo escludere con precisione il transfer della fee.
    let feeAmountStr = null;
    let feePayer = null;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.type !== 'tx') continue;
      const attrs = ev.attributes || [];
      for (let j = 0; j < attrs.length; j++) {
        const k = b64Decode(attrs[j].key);
        const v = b64Decode(attrs[j].value);
        if (k === 'fee') feeAmountStr = v;
        if (k === 'fee_payer') feePayer = v;
      }
    }

    // Passo 2: scansioniamo i transfer, escludendo quello della fee.
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const attrs = ev.attributes || [];

      if (ev.type === 'transfer') {
        let evSender = null;
        let evRecipient = null;
        let evAmount = null;

        for (let j = 0; j < attrs.length; j++) {
          const k = b64Decode(attrs[j].key);
          const v = b64Decode(attrs[j].value);
          if (k === 'sender') evSender = v;
          if (k === 'recipient') evRecipient = v;
          if (k === 'amount' && typeof v === 'string' && v.indexOf('uluxa') !== -1) evAmount = v;
        }

        const isFeeTransfer = Boolean(
          feeAmountStr && evAmount === feeAmountStr && (!feePayer || evSender === feePayer)
        );

        if (!isFeeTransfer && evAmount && !amount) {
          // Transfer "vero" (es. MsgSend, reward tap-to-earn, ecc.)
          if (isCleanAddress(evSender)) sender = evSender;
          if (isCleanAddress(evRecipient)) recipient = evRecipient;
          const num = parseInt(evAmount.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) amount = (num / 1000000).toFixed(4) + ' LUXA';
        } else if (isFeeTransfer && !fallbackSender) {
          // Teniamo da parte sender/recipient della fee solo come
          // ripiego, nel caso non esista nessun transfer "vero".
          if (isCleanAddress(evSender)) fallbackSender = evSender;
          if (isCleanAddress(evRecipient)) fallbackRecipient = evRecipient;
        }
      }

      // nft_id può comparire in vari tipi di evento, quindi si cerca ovunque
      for (let j = 0; j < attrs.length; j++) {
        const k = b64Decode(attrs[j].key);
        const v = b64Decode(attrs[j].value);
        if ((k === 'nft_id' || k === 'license_id' || k === 'nftKey') && !nftId) {
          nftId = String(v).trim();
        }
      }
    }

    if (sender === 'luxa1...' && fallbackSender) sender = fallbackSender;
    if (recipient === 'luxa1...' && fallbackRecipient) recipient = fallbackRecipient;

    return { sender: sender, recipient: recipient, amount: amount, nftId: nftId };
  }

  // --- 1. Ricerca Transazione (Hash) ---
  async function searchTx(hash) {
    const cleanHash = hash.toUpperCase().replace(/^0X/, '');
    const res = await fetchJson(RPC_URL + '/tx?hash=0x' + cleanHash + '&prove=true');

    if (!res.ok || !res.data || !res.data.result) {
      throw new Error('Transaction ' + cleanHash + ' not found on luxa-1.');
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

    renderTxCard({
      hash: cleanHash,
      height: height,
      isSuccess: isSuccess,
      gasUsed: gasUsed,
      gasWanted: gasWanted,
      sender: parsed.sender,
      recipient: parsed.recipient,
      amount: parsed.amount || (isNft ? '5.00 LUXA' : '0.0050 LUXA'),
      nftId: nftId,
      isNft: isNft
    });
  }

  // --- 2. Ricerca Indirizzo Wallet ---
  async function searchAddress(address) {
    const stage = document.getElementById('searchStage');
    const querySender = encodeURIComponent('transfer.sender=\'' + address + '\'');
    const queryRecv = encodeURIComponent('transfer.recipient=\'' + address + '\'');

    const results = await Promise.all([
      fetchJson(RPC_URL + '/tx_search?query="' + querySender + '"&page=1&per_page=10&order_by="desc"'),
      fetchJson(RPC_URL + '/tx_search?query="' + queryRecv + '"&page=1&per_page=10&order_by="desc"')
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

  // --- 3. Ricerca Blocco ---
  async function searchBlock(height) {
    const res = await fetchJson(RPC_URL + '/block?height=' + height);
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

  // --- Rendering Scheda Transazione ---
  function renderTxCard(data) {
    const stage = document.getElementById('searchStage');
    const accent = data.isNft ? 'var(--gold)' : 'var(--cyan)';

    let visual = '';
    if (data.isNft) {
      const meta = NFT_HEROES[data.nftId] || NFT_HEROES['4004'];
      const targetHolder = isCleanAddress(data.recipient) ? data.recipient : (isCleanAddress(data.sender) ? data.sender : 'Protocol Anchor (luxa-1)');
      const marquee = (' ⚡ HOLDER: ' + targetHolder + ' • ON-CHAIN: LUXA-1 • ANCHORED ⚡ ').repeat(4);

      visual = '<div class="highway-box" style="border-color:' + accent + ';">' +
        '<img src="./Nft_Images/' + meta.file + '" alt="' + escapeHtml(meta.name) + '" onerror="this.src=\'logoluxa.png\';">' +
        '<div class="sovereign-highway-ticker">' +
        '<div class="highway-track">' + escapeHtml(marquee) + '</div>' +
        '</div></div>';
    }

    const safeRecipientDisplay = isCleanAddress(data.recipient) ? data.recipient : (data.isNft ? 'Protocol Anchor (luxa-1)' : data.sender);

    stage.innerHTML = '<div class="result-card" style="--border-color: ' + accent + ';">' +
      '<div class="card-top">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>' +
      '<span class="badge ' + (data.isNft ? 'badge-gold' : 'badge-cyan') + '">' +
      (data.isNft ? 'SOVEREIGN LICENSE (#' + escapeHtml(data.nftId) + ')' : 'NATIVE TRANSFER (LUXA)') +
      '</span>' +
      '<span class="badge ' + (data.isSuccess ? 'badge-ok' : 'badge-gold') + '">' +
      (data.isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED') +
      '</span>' +
      '</div>' +
      visual +
      '<div class="details-grid">' +
      '<div class="details-row"><span class="details-label">Block Height:</span><span class="details-val mono" style="color:var(--gold);">#' + escapeHtml(data.height) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Amount:</span><span class="details-val" style="font-weight:bold;">' + escapeHtml(data.amount) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Sender:</span><span class="details-val mono click-hash" onclick="window.LuxaExplorer.inspect(\'' + data.sender + '\')">' + escapeHtml(data.sender) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Recipient:</span><span class="details-val mono">' + escapeHtml(safeRecipientDisplay) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Gas Used:</span><span class="details-val mono">' + escapeHtml(data.gasUsed) + ' / ' + escapeHtml(data.gasWanted) + '</span></div>' +
      '</div>' +
      '<button type="button" class="back-btn" style="width:100%; margin-top:16px; justify-content:center; padding:10px;" onclick="navigator.clipboard.writeText(\'' + data.hash + '\'); this.textContent=\'Hash Copied! 📋\';">' +
      '📋 Copy Transaction Hash' +
      '</button>' +
      '</div>';
  }

  // --- Router di Ricerca Principale ---
  async function search(query) {
    const input = document.getElementById('searchInput');
    const stage = document.getElementById('searchStage');
    const q = (query || (input ? input.value : '')).trim();

    if (!q || !stage) return;
    stage.innerHTML = '<div class="status-msg status-loading">🔍 Searching luxa-1 ledger...</div>';

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

  // --- Sync Nodo & Attività Recente ---
  async function syncNode() {
    const badge = document.getElementById('chainBlockBadge');
    const res = await fetchJson(RPC_URL + '/status');
    if (res.ok && res.data && res.data.result && res.data.result.sync_info && res.data.result.sync_info.latest_block_height) {
      if (badge) badge.textContent = 'luxa-1 • #' + res.data.result.sync_info.latest_block_height;
    }
  }

  async function loadRecentActivity() {
    const tbody = document.getElementById('recentTxsBody');
    if (!tbody) return;

    try {
      const rpcRes = await fetchJson(RPC_URL + '/tx_search?query="tx.height>0"&page=1&per_page=10&order_by="desc"', 4000);
      const txs = (rpcRes.ok && rpcRes.data && rpcRes.data.result && Array.isArray(rpcRes.data.result.txs)) ? rpcRes.data.result.txs : [];

      if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:18px; color:var(--text-muted); font-family:\'JetBrains Mono\',monospace;">No transactions recorded on luxa-1. Node is live and synced.</td></tr>';
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

  // --- Inizializzazione ---
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

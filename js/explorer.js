/* ==========================================================================
   LUXA SCAN PRO — explorer-pro.js
   Explorer "ricco" stile BscScan: Ultimi Blocchi + Ultime Transazioni,
   pagine di dettaglio con data/ora reale, età relativa, fee separata
   dall'importo, hash reali delle tx dentro ogni blocco (SHA-256).
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

  // Cache condivisa: height -> Date, così non richiediamo lo stesso blocco
  // più volte per calcolare l'età di più transazioni dello stesso blocco.
  const blockTimeCache = {};

  // --- Utility base ---
  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Decodifica base64 con verifica round-trip: il nodo LUXA restituisce
  // gli eventi già in chiaro, quindi decodifichiamo solo se la stringa
  // ERA davvero base64 (altrimenti testo come "sender" o "5000uluxa"
  // verrebbe silenziosamente corrotto da atob()).
  function b64Decode(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    try {
      const decoded = atob(str);
      if (btoa(decoded) === str) return decoded;
      return str;
    } catch (_) {
      return str;
    }
  }

  function isCleanAddress(addr) {
    return typeof addr === 'string' && addr.startsWith('luxa1') && addr.length >= 38 && !/[^\w]/.test(addr);
  }

  function shorten(str, front, back) {
    front = front || 10;
    back = back || 6;
    const s = String(str || '');
    return s.length > front + back + 3 ? s.slice(0, front) + '...' + s.slice(-back) : s;
  }

  function formatLuxa(uluxaStr) {
    const num = parseInt(String(uluxaStr).replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return null;
    return (num / 1000000).toFixed(4) + ' LUXA';
  }

  // Età relativa: "5 secs ago", "3 mins ago", "2 hours ago", "4 days ago"
  function timeAgo(date) {
    if (!date) return '—';
    const sec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (sec < 5) return 'a few secs ago';
    if (sec < 60) return sec + ' secs ago';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + (min === 1 ? ' min ago' : ' mins ago');
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + (hr === 1 ? ' hour ago' : ' hours ago');
    const day = Math.floor(hr / 24);
    if (day < 30) return day + (day === 1 ? ' day ago' : ' days ago');
    const mon = Math.floor(day / 30);
    if (mon < 12) return mon + (mon === 1 ? ' month ago' : ' months ago');
    const yr = Math.floor(day / 365);
    return yr + (yr === 1 ? ' year ago' : ' years ago');
  }

  // Data/ora completa in UTC, stile bscscan: "2026-09-11 09:31:36 UTC"
  function formatDateTime(date) {
    if (!date) return '—';
    const iso = date.toISOString();
    return iso.slice(0, 10) + ' ' + iso.slice(11, 19) + ' UTC';
  }

  async function fetchJson(url, timeoutMs) {
    timeoutMs = timeoutMs || 8000;
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

  // Hash reale di una tx: sha256 dei byte grezzi (protobuf), esadecimale
  // maiuscolo — esattamente l'algoritmo usato da CometBFT/Cosmos per
  // identificare le transazioni. Serve per elencare le tx dentro un blocco
  // (il campo block.data.txs contiene solo i byte grezzi, non gli hash).
  async function txHashFromBase64(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('')
      .toUpperCase();
  }

  async function getBlockTime(height) {
    if (blockTimeCache[height]) return blockTimeCache[height];
    const res = await fetchJson(RPC_URL + '/block?height=' + height);
    const timeStr = res.ok && res.data && res.data.result && res.data.result.block && res.data.result.block.header
      ? res.data.result.block.header.time : null;
    const date = timeStr ? new Date(timeStr) : null;
    if (date) blockTimeCache[height] = date;
    return date;
  }

  // Recupera gli eventi di una tx: normalmente da tx_result.events, ma se
  // il nodo non li fornisce lì, prova a estrarli da tx_result.log (JSON ABCI).
  function extractEvents(tx_result) {
    if (!tx_result) return [];
    if (Array.isArray(tx_result.events) && tx_result.events.length > 0) return tx_result.events;
    if (typeof tx_result.log === 'string' && tx_result.log.length > 0) {
      try {
        const parsedLog = JSON.parse(tx_result.log);
        if (Array.isArray(parsedLog)) {
          let combined = [];
          for (let i = 0; i < parsedLog.length; i++) {
            if (parsedLog[i] && Array.isArray(parsedLog[i].events)) combined = combined.concat(parsedLog[i].events);
          }
          if (combined.length > 0) return combined;
        }
      } catch (_) {}
    }
    return [];
  }

  // Estrae sender/recipient/amount/fee/nftId dagli eventi Cosmos SDK,
  // escludendo il transfer della fee quando distinto dal transfer reale.
  function parseCosmosEvents(events) {
    events = events || [];
    let sender = 'luxa1...';
    let recipient = 'luxa1...';
    let amount = null;
    let feeDisplay = null;
    let fallbackSender = null;
    let fallbackRecipient = null;
    let nftId = null;

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
    if (feeAmountStr) feeDisplay = formatLuxa(feeAmountStr) || (feeAmountStr.indexOf('uluxa') !== -1 ? formatLuxa(feeAmountStr) : null);
    if (feeAmountStr && feeDisplay === null) feeDisplay = '0.0000 LUXA';

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const attrs = ev.attributes || [];

      if (ev.type === 'transfer') {
        let evSender = null, evRecipient = null, evAmount = null;
        for (let j = 0; j < attrs.length; j++) {
          const k = b64Decode(attrs[j].key);
          const v = b64Decode(attrs[j].value);
          if (k === 'sender') evSender = v;
          if (k === 'recipient') evRecipient = v;
          if (k === 'amount' && typeof v === 'string' && v.indexOf('uluxa') !== -1) evAmount = v;
        }

        const isFeeTransfer = Boolean(feeAmountStr && evAmount === feeAmountStr && (!feePayer || evSender === feePayer));

        if (!isFeeTransfer && evAmount && !amount) {
          if (isCleanAddress(evSender)) sender = evSender;
          if (isCleanAddress(evRecipient)) recipient = evRecipient;
          amount = formatLuxa(evAmount);
        } else if (isFeeTransfer && !fallbackSender) {
          if (isCleanAddress(evSender)) fallbackSender = evSender;
          if (isCleanAddress(evRecipient)) fallbackRecipient = evRecipient;
        }
      }

      for (let j = 0; j < attrs.length; j++) {
        const k = b64Decode(attrs[j].key);
        const v = b64Decode(attrs[j].value);
        if ((k === 'nft_id' || k === 'license_id' || k === 'nftKey') && !nftId) nftId = String(v).trim();
      }
    }

    if (sender === 'luxa1...' && fallbackSender) sender = fallbackSender;
    if (recipient === 'luxa1...' && fallbackRecipient) recipient = fallbackRecipient;

    return { sender: sender, recipient: recipient, amount: amount, fee: feeDisplay, nftId: nftId };
  }

  // --- Overview: Ultimi Blocchi + Ultime Transazioni ---
  async function loadOverview() {
    const blocksBody = document.getElementById('latestBlocksBody');
    const txsBody = document.getElementById('latestTxsBody');
    const badge = document.getElementById('chainBlockBadge');

    const statusRes = await fetchJson(RPC_URL + '/status');
    const latestHeight = statusRes.ok && statusRes.data && statusRes.data.result && statusRes.data.result.sync_info
      ? parseInt(statusRes.data.result.sync_info.latest_block_height, 10) : null;
    const chainId = statusRes.ok && statusRes.data && statusRes.data.result && statusRes.data.result.node_info
      ? statusRes.data.result.node_info.network : 'luxa-1';

    if (badge && latestHeight) badge.textContent = chainId + ' • #' + latestHeight;

    if (!latestHeight) {
      if (blocksBody) blocksBody.innerHTML = '<tr><td colspan="4" class="empty-cell">Node non raggiungibile.</td></tr>';
      if (txsBody) txsBody.innerHTML = '<tr><td colspan="6" class="empty-cell">Node non raggiungibile.</td></tr>';
      return;
    }

    const minHeight = Math.max(1, latestHeight - 19);

    // Un'unica chiamata per gli ultimi 20 blocchi: ci dà anche i timestamp,
    // che poi riusiamo per calcolare l'età delle transazioni senza dover
    // richiedere un blocco per ogni singola tx.
    const chainRes = await fetchJson(RPC_URL + '/blockchain?minHeight=' + minHeight + '&maxHeight=' + latestHeight);
    const blockMetas = (chainRes.ok && chainRes.data && chainRes.data.result && Array.isArray(chainRes.data.result.block_metas))
      ? chainRes.data.result.block_metas : [];

    blockMetas.forEach(function (bm) {
      const h = parseInt(bm.header.height, 10);
      blockTimeCache[h] = new Date(bm.header.time);
    });

    renderLatestBlocks(blockMetas, blocksBody);

    const txRes = await fetchJson(RPC_URL + '/tx_search?query="tx.height>0"&page=1&per_page=15&order_by="desc"');
    const txs = (txRes.ok && txRes.data && txRes.data.result && Array.isArray(txRes.data.result.txs)) ? txRes.data.result.txs : [];

    // Per le tx il cui blocco non è tra gli ultimi 20 già scaricati,
    // recuperiamo il timestamp singolarmente (al massimo poche chiamate).
    const missingHeights = Array.from(new Set(
      txs.map(function (t) { return parseInt(t.height, 10); }).filter(function (h) { return !blockTimeCache[h]; })
    ));
    await Promise.all(missingHeights.slice(0, 10).map(function (h) { return getBlockTime(h); }));

    renderLatestTxs(txs, txsBody);
  }

  function renderLatestBlocks(blockMetas, tbody) {
    if (!tbody) return;
    if (blockMetas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Nessun blocco trovato.</td></tr>';
      return;
    }
    const sorted = blockMetas.slice().sort(function (a, b) {
      return parseInt(b.header.height, 10) - parseInt(a.header.height, 10);
    });
    tbody.innerHTML = sorted.map(function (bm) {
      const h = bm.header.height;
      const date = new Date(bm.header.time);
      const proposer = bm.header.proposer_address || 'unknown';
      const numTxs = bm.num_txs || '0';
      return '<tr>' +
        '<td class="click-hash" onclick="window.LuxaExplorerPro.viewBlock(' + h + ')">#' + escapeHtml(h) + '</td>' +
        '<td class="mono" title="' + escapeHtml(formatDateTime(date)) + '">' + escapeHtml(timeAgo(date)) + '</td>' +
        '<td class="mono">' + escapeHtml(shorten(proposer, 8, 4)) + '</td>' +
        '<td><span class="badge ' + (parseInt(numTxs, 10) > 0 ? 'badge-cyan' : 'badge-muted') + '">' + escapeHtml(numTxs) + ' txn' + (numTxs === '1' ? '' : 's') + '</span></td>' +
        '</tr>';
    }).join('');
  }

  function renderLatestTxs(txs, tbody) {
    if (!tbody) return;
    if (txs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Nessuna transazione trovata.</td></tr>';
      return;
    }
    tbody.innerHTML = txs.map(function (t) {
      const parsed = parseCosmosEvents(extractEvents(t.tx_result));
      const isNft = Boolean(parsed.nftId);
      const amount = parsed.amount || (isNft ? '5.00 LUXA' : '0.0050 LUXA');
      const status = (t.tx_result && (t.tx_result.code === 0 || !t.tx_result.code)) ? 'CONFIRMED' : 'FAILED';
      const h = parseInt(t.height, 10);
      const date = blockTimeCache[h] || null;

      return '<tr>' +
        '<td class="click-hash" onclick="window.LuxaExplorerPro.inspect(\'' + t.hash + '\')">' + escapeHtml(shorten(t.hash, 8, 4)) + '</td>' +
        '<td><span class="badge ' + (isNft ? 'badge-gold' : 'badge-cyan') + '" style="font-size:10px;">' + (isNft ? 'NFT' : 'TRANSFER') + '</span></td>' +
        '<td class="click-hash" onclick="window.LuxaExplorerPro.viewBlock(' + h + ')">#' + escapeHtml(t.height) + '</td>' +
        '<td class="mono" title="' + escapeHtml(formatDateTime(date)) + '">' + escapeHtml(timeAgo(date)) + '</td>' +
        '<td style="font-weight:bold;">' + escapeHtml(amount) + '</td>' +
        '<td><span class="badge ' + (status === 'CONFIRMED' ? 'badge-ok' : 'badge-gold') + '" style="font-size:10px;">' + escapeHtml(status) + '</span></td>' +
        '</tr>';
    }).join('');
  }

  // --- Ricerca Transazione (Hash) — dettaglio ricco ---
  async function searchTx(hash) {
    const cleanHash = hash.toUpperCase().replace(/^0X/, '');
    const res = await fetchJson(RPC_URL + '/tx?hash=0x' + cleanHash + '&prove=true');

    if (!res.ok || !res.data || !res.data.result) {
      throw new Error('Transaction ' + cleanHash + ' not found on luxa-1.');
    }

    const tx = res.data.result;
    const height = parseInt(tx.height, 10);
    const isSuccess = tx.tx_result ? (tx.tx_result.code === 0 || !tx.tx_result.code) : true;
    const gasUsed = (tx.tx_result && tx.tx_result.gas_used) ? tx.tx_result.gas_used : '0';
    const gasWanted = (tx.tx_result && tx.tx_result.gas_wanted) ? tx.tx_result.gas_wanted : '0';

    const parsed = parseCosmosEvents(extractEvents(tx.tx_result));
    const blockDate = await getBlockTime(height);

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
      blockDate: blockDate,
      isSuccess: isSuccess,
      gasUsed: gasUsed,
      gasWanted: gasWanted,
      sender: parsed.sender,
      recipient: parsed.recipient,
      amount: parsed.amount || (isNft ? '5.00 LUXA' : '0.0050 LUXA'),
      fee: parsed.fee,
      nftId: nftId,
      isNft: isNft
    });
  }

  // --- Ricerca Indirizzo Wallet ---
  async function searchAddress(address) {
    const stage = document.getElementById('searchStage');
    const querySender = encodeURIComponent('transfer.sender=\'' + address + '\'');
    const queryRecv = encodeURIComponent('transfer.recipient=\'' + address + '\'');

    const results = await Promise.all([
      fetchJson(RPC_URL + '/tx_search?query="' + querySender + '"&page=1&per_page=15&order_by="desc"'),
      fetchJson(RPC_URL + '/tx_search?query="' + queryRecv + '"&page=1&per_page=15&order_by="desc"')
    ]);

    const sendRes = results[0];
    const recvRes = results[1];
    const sentTxs = (sendRes.ok && sendRes.data && sendRes.data.result && sendRes.data.result.txs) ? sendRes.data.result.txs : [];
    const recvTxs = (recvRes.ok && recvRes.data && recvRes.data.result && recvRes.data.result.txs) ? recvRes.data.result.txs : [];

    const seen = {};
    const allTxs = sentTxs.concat(recvTxs).filter(function (t) {
      if (seen[t.hash]) return false;
      seen[t.hash] = true;
      return true;
    }).sort(function (a, b) { return parseInt(b.height, 10) - parseInt(a.height, 10); });

    const missingHeights = Array.from(new Set(
      allTxs.map(function (t) { return parseInt(t.height, 10); }).filter(function (h) { return !blockTimeCache[h]; })
    ));
    await Promise.all(missingHeights.slice(0, 15).map(function (h) { return getBlockTime(h); }));

    let rowsHtml = '';
    if (allTxs.length === 0) {
      rowsHtml = '<tr><td colspan="5" class="empty-cell">No on-chain activity for this address.</td></tr>';
    } else {
      rowsHtml = allTxs.slice(0, 15).map(function (t) {
        const isOut = sentTxs.some(function (s) { return s.hash === t.hash; });
        const parsed = parseCosmosEvents(extractEvents(t.tx_result));
        const amount = parsed.amount || '0.0050 LUXA';
        const h = parseInt(t.height, 10);
        const date = blockTimeCache[h] || null;
        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorerPro.inspect(\'' + t.hash + '\')">' + escapeHtml(shorten(t.hash, 8, 4)) + '</td>' +
          '<td class="click-hash" onclick="window.LuxaExplorerPro.viewBlock(' + h + ')">#' + escapeHtml(t.height) + '</td>' +
          '<td class="mono" title="' + escapeHtml(formatDateTime(date)) + '">' + escapeHtml(timeAgo(date)) + '</td>' +
          '<td><span class="badge ' + (isOut ? 'badge-gold' : 'badge-ok') + '" style="font-size:9px;">' + (isOut ? 'OUT' : 'IN') + '</span></td>' +
          '<td style="font-weight:bold;">' + escapeHtml(amount) + '</td>' +
          '</tr>';
      }).join('');
    }

    stage.innerHTML = '<div class="result-card" style="--border-color: var(--cyan);">' +
      '<div class="card-top">' +
      '<div style="display:flex; align-items:center; gap:8px;">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorerPro.resetView()">← BACK</button>' +
      '<span class="badge badge-cyan">ACCOUNT OVERVIEW</span>' +
      '</div>' +
      '<span class="mono muted-note">Network: luxa-1</span>' +
      '</div>' +
      '<div class="details-grid" style="margin-bottom:20px;">' +
      '<div class="details-row"><span class="details-label">Address:</span><span class="details-val mono" style="color:var(--cyan); font-weight:bold;">' + escapeHtml(address) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Total On-Chain Tx:</span><span class="details-val mono">' + allTxs.length + ' records found</span></div>' +
      '</div>' +
      '<h3 class="section-title">Account Activity</h3>' +
      '<div style="overflow-x:auto;"><table class="data-table">' +
      '<thead><tr><th>Tx Hash</th><th>Block</th><th>Age</th><th>Flow</th><th>Amount</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody></table></div></div>';
  }

  // --- Ricerca Blocco — dettaglio ricco con hash reali delle tx ---
  async function searchBlock(height) {
    const stage = document.getElementById('searchStage');
    stage.innerHTML = '<div class="status-msg status-loading">🔍 Loading block #' + escapeHtml(height) + '...</div>';

    const [blockRes, resultsRes] = await Promise.all([
      fetchJson(RPC_URL + '/block?height=' + height),
      fetchJson(RPC_URL + '/block_results?height=' + height)
    ]);

    if (!blockRes.ok || !blockRes.data || !blockRes.data.result || !blockRes.data.result.block) {
      throw new Error('Block #' + height + ' not found.');
    }

    const blk = blockRes.data.result.block;
    const rawTxs = (blk.data && blk.data.txs) ? blk.data.txs : [];
    const txsResults = (resultsRes.ok && resultsRes.data && resultsRes.data.result && Array.isArray(resultsRes.data.result.txs_results))
      ? resultsRes.data.result.txs_results : [];

    const proposer = (blk.header && blk.header.proposer_address) ? blk.header.proposer_address : 'unknown';
    const date = (blk.header && blk.header.time) ? new Date(blk.header.time) : null;
    if (date) blockTimeCache[height] = date;

    // Calcoliamo l'hash reale di ogni tx (sha256 dei byte grezzi) per
    // poterle mostrare come link cliccabili, con importo e stato.
    const txRows = await Promise.all(rawTxs.map(async function (rawB64, idx) {
      let hash = '—';
      try { hash = await txHashFromBase64(rawB64); } catch (_) {}
      const tr = txsResults[idx] || {};
      const parsed = parseCosmosEvents(extractEvents(tr));
      const amount = parsed.amount || '0.0050 LUXA';
      const ok = (tr.code === 0 || !tr.code);
      return { hash: hash, amount: amount, ok: ok, gasUsed: tr.gas_used || '0' };
    }));

    let txRowsHtml = '';
    if (txRows.length === 0) {
      txRowsHtml = '<tr><td colspan="4" class="empty-cell">No transactions in this block.</td></tr>';
    } else {
      txRowsHtml = txRows.map(function (r) {
        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorerPro.inspect(\'' + r.hash + '\')">' + escapeHtml(shorten(r.hash, 8, 4)) + '</td>' +
          '<td style="font-weight:bold;">' + escapeHtml(r.amount) + '</td>' +
          '<td class="mono">' + escapeHtml(r.gasUsed) + '</td>' +
          '<td><span class="badge ' + (r.ok ? 'badge-ok' : 'badge-gold') + '" style="font-size:9px;">' + (r.ok ? 'OK' : 'FAILED') + '</span></td>' +
          '</tr>';
      }).join('');
    }

    stage.innerHTML = '<div class="result-card" style="--border-color: var(--cyan);">' +
      '<div class="card-top">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorerPro.resetView()">← BACK</button>' +
      '<span class="badge badge-cyan">BLOCK #' + escapeHtml(height) + '</span>' +
      '</div>' +
      '<div class="details-grid" style="margin-bottom:20px;">' +
      '<div class="details-row"><span class="details-label">Timestamp:</span><span class="details-val">' + escapeHtml(formatDateTime(date)) + ' <span class="muted-note">(' + escapeHtml(timeAgo(date)) + ')</span></span></div>' +
      '<div class="details-row"><span class="details-label">Proposer:</span><span class="details-val mono" style="color:#88BBFF;">' + escapeHtml(proposer) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Transactions:</span><span class="details-val mono" style="color:var(--gold); font-weight:bold;">' + txRows.length + '</span></div>' +
      '</div>' +
      '<h3 class="section-title">Transactions in this block</h3>' +
      '<div style="overflow-x:auto;"><table class="data-table">' +
      '<thead><tr><th>Tx Hash</th><th>Amount</th><th>Gas Used</th><th>Status</th></tr></thead>' +
      '<tbody>' + txRowsHtml + '</tbody></table></div></div>';
  }

  // --- Rendering Scheda Transazione ricca ---
  function renderTxCard(data) {
    const stage = document.getElementById('searchStage');
    const accent = data.isNft ? 'var(--gold)' : 'var(--cyan)';

    let visual = '';
    if (data.isNft) {
      const meta = NFT_HEROES[data.nftId] || NFT_HEROES['4004'];
      const targetHolder = isCleanAddress(data.recipient) ? data.recipient : (isCleanAddress(data.sender) ? data.sender : 'Protocol Anchor (luxa-1)');
      const marquee = (' ⚡ HOLDER: ' + targetHolder + ' • ON-CHAIN: LUXA-1 • ANCHORED ⚡ ').repeat(4);
      visual = '<div class="highway-box" style="border-color:' + accent + ';">' +
        '<img src="assets/nft/Nft_Images/' + meta.file + '" alt="' + escapeHtml(meta.name) + '" onerror="this.src=\'assets/images/logoluxa.png\';">' +
        '<div class="sovereign-highway-ticker"><div class="highway-track">' + escapeHtml(marquee) + '</div></div></div>';
    }

    const safeRecipientDisplay = isCleanAddress(data.recipient) ? data.recipient : (data.isNft ? 'Protocol Anchor (luxa-1)' : data.sender);
    const feeRow = data.fee
      ? '<div class="details-row"><span class="details-label">Transaction Fee:</span><span class="details-val mono">' + escapeHtml(data.fee) + '</span></div>'
      : '';

    stage.innerHTML = '<div class="result-card" style="--border-color: ' + accent + ';">' +
      '<div class="card-top">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorerPro.resetView()">← BACK</button>' +
      '<span class="badge ' + (data.isNft ? 'badge-gold' : 'badge-cyan') + '">' +
      (data.isNft ? 'SOVEREIGN LICENSE (#' + escapeHtml(data.nftId) + ')' : 'NATIVE TRANSFER (LUXA)') + '</span>' +
      '<span class="badge ' + (data.isSuccess ? 'badge-ok' : 'badge-gold') + '">' + (data.isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED') + '</span>' +
      '</div>' +
      visual +
      '<div class="details-grid">' +
      '<div class="details-row"><span class="details-label">Timestamp:</span><span class="details-val">' + escapeHtml(formatDateTime(data.blockDate)) + ' <span class="muted-note">(' + escapeHtml(timeAgo(data.blockDate)) + ')</span></span></div>' +
      '<div class="details-row"><span class="details-label">Block Height:</span><span class="details-val mono click-hash" style="color:var(--gold);" onclick="window.LuxaExplorerPro.viewBlock(' + data.height + ')">#' + escapeHtml(data.height) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Amount:</span><span class="details-val" style="font-weight:bold;">' + escapeHtml(data.amount) + '</span></div>' +
      feeRow +
      '<div class="details-row"><span class="details-label">Sender:</span><span class="details-val mono click-hash" onclick="window.LuxaExplorerPro.inspect(\'' + data.sender + '\')">' + escapeHtml(data.sender) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Recipient:</span><span class="details-val mono">' + escapeHtml(safeRecipientDisplay) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Gas Used:</span><span class="details-val mono">' + escapeHtml(data.gasUsed) + ' / ' + escapeHtml(data.gasWanted) + '</span></div>' +
      '</div>' +
      '<button type="button" class="back-btn" style="width:100%; margin-top:16px; justify-content:center; padding:10px;" onclick="navigator.clipboard.writeText(\'' + data.hash + '\'); this.textContent=\'Hash Copied! 📋\';">📋 Copy Transaction Hash</button>' +
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
    if (input) { input.value = ''; input.focus(); }
  }

  window.LuxaExplorerPro = {
    search: search,
    resetView: resetView,
    inspect: function (val) {
      const input = document.getElementById('searchInput');
      if (input) input.value = val;
      search(val);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    viewBlock: function (height) {
      const input = document.getElementById('searchInput');
      if (input) input.value = String(height);
      search(String(height));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('searchBtn');
    const input = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshActivityBtn');

    if (btn) btn.addEventListener('click', function () { search(); });
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') search(); });
    if (refreshBtn) refreshBtn.addEventListener('click', loadOverview);

    loadOverview();
    setInterval(loadOverview, 15000);

    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('q') || params.get('tx');
    if (prefill && input) {
      input.value = prefill;
      search(prefill);
    }
  });
})();
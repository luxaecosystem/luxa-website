/* ==========================================================================
   LUXA SCAN PRO ENGINE — js/explorer-pro.js
   Tendermint / Cosmos SDK RPC Engine for luxa-1 (Genesis NFTs & Multi-Asset)
   ========================================================================== */

(function () {
  'use strict';

  const RPC_URL = 'https://rpc.luxaecosystem.xyz';

  // --- Risoluzione Dinamica Metadati Genesis da sorgente esterna ---
  let _cachedGenesisRegistry = null;

  async function fetchExternalGenesisNft(tokenId) {
    if (!_cachedGenesisRegistry) {
      try {
        const res = await fetch('https://luxaecosystem.alwaysdata.net/nftlist.json', { cache: 'no-cache' });
        if (res.ok) {
          const doc = await res.json();
          if (Array.isArray(doc.nfts)) {
            _cachedGenesisRegistry = {};
            doc.nfts.forEach(function (item) {
              _cachedGenesisRegistry[String(item.id)] = item;
            });
          }
        }
      } catch (err) {
        console.warn('Impossibile recuperare nftlist.json esterno:', err);
      }
    }

    return _cachedGenesisRegistry ? _cachedGenesisRegistry[String(tokenId)] : null;
  }

  const NFT_HEROES = {
    '0': {
      name: 'Genesis Progenitor — Citizen Zero',
      file: 'citizen_zero.jpeg',
      rarity: 'Mythic (Origin 1/1)',
      powers: ['Root Validator & Sovereign Architect', 'Zero Protocol Fees', 'Instant Forge Cooldown']
    },
    '1': {
      name: 'Chrono-Key Master',
      file: 'chrono_key_master.jpeg',
      rarity: 'Legendary',
      powers: ['Chrono-Sync (-50% Cooldown)', 'Lockup Multiplier Active']
    },
    '2': {
      name: 'Cyber-Shadow Node',
      file: 'cyber_shadow_node.jpeg',
      rarity: 'Epic',
      powers: ['Dark-Route Obfuscation (20% Shard Discount)', 'Governance Security Multiplier']
    },
    '3': {
      name: 'Grandmaster of Servers',
      file: 'grandmaster_of_servers.jpeg',
      rarity: 'Legendary',
      powers: ['Consensus Mastery', '+25% APY Staking Yield Multiplier']
    },
    '4': {
      name: 'Neon Data Valkyrie',
      file: 'neon_data_valkyrie.jpeg',
      rarity: 'Rare',
      powers: ['High-Throughput Stream (1.5x Shard Multiplier)', 'Priority Genesis Whitelist']
    },
    // Compatibilità legacy
    '4001': { name: 'Grandmaster of Servers', file: 'grandmaster_of_servers.jpeg', rarity: 'Legendary', powers: [] },
    '4002': { name: 'Neon Data Valkyrie', file: 'neon_data_valkyrie.jpeg', rarity: 'Epic', powers: [] },
    '4003': { name: 'Chrono-Key Master', file: 'chrono_key_master.jpeg', rarity: 'Rare', powers: [] },
    '4004': { name: 'Cyber-Shadow Node', file: 'cyber_shadow_node.jpeg', rarity: 'Rare', powers: [] }
  };

  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function smartDecode(str) {
    if (typeof str !== 'string' || str.length === 0) return '';
    if (str.startsWith('luxa1') || str.includes('uluxa') || str.includes('ushard') || str.includes(' ')) {
      return str;
    }
    try {
      const decoded = atob(str);
      if (/^[a-zA-Z0-9_\-\.\:\/]+$/.test(decoded)) return decoded;
    } catch (_) {}
    return str;
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

  function timeAgo(dateString) {
    if (!dateString) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (isNaN(seconds) || seconds < 5) return 'Just now';
    if (seconds < 60) return seconds + 's ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    return Math.floor(hours / 24) + 'd ago';
  }

  async function fetchJson(url, timeoutMs) {
    timeoutMs = timeoutMs || 6000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data: data };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Parser Eventi Cosmos SDK per Coin & NFT nativi ---
  function parseCosmosEvents(events, rawTxB64) {
    events = events || [];
    const coins = [];
    let nftId = null;
    let detectedFee = 0;
    let sender = 'luxa1...';
    let recipient = 'luxa1...';

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const evType = smartDecode(ev.type);
      const attrs = ev.attributes || [];

      for (let j = 0; j < attrs.length; j++) {
        const k = smartDecode(attrs[j].key);
        const v = smartDecode(attrs[j].value);

        if (['sender', 'spender', 'from_address'].includes(k) && isCleanAddress(v)) sender = v;
        if (['recipient', 'receiver', 'to_address'].includes(k) && isCleanAddress(v)) recipient = v;

        // Parsing monete (LUXA e SHARD)
        if (evType === 'transfer' && k === 'amount' && typeof v === 'string') {
          const parts = v.split(',');
          for (const p of parts) {
            const m = p.trim().match(/^(\d+)(uluxa|ushard)$/);
            if (m) {
              const num = parseInt(m[1], 10) / 1000000;
              const denom = m[2] === 'ushard' ? 'SHARDS' : 'LUXA';
              coins.push(`${num.toFixed(4)} ${denom}`);
            }
          }
        }

        if (k === 'fee' && typeof v === 'string' && v.includes('uluxa')) {
          const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) detectedFee = num / 1000000;
        }

        // Riconoscimento messaggi ed eventi x/nft
        if (['id', 'token_id', 'nft_id', 'nftKey'].includes(k)) {
          const cleanId = String(v).trim();
          if (cleanId) nftId = cleanId;
        }
      }
    }

    // Fallback: ispezione del corpo della transazione Protobuf decodificato
    if (!nftId && rawTxB64) {
      try {
        const decoded = atob(rawTxB64);
        if (decoded.includes('luxa-relics') || decoded.includes('/cosmos.nft.v1beta1')) {
          const match = decoded.match(/luxa-relics.*?([0-4])/);
          if (match && NFT_HEROES[match[1]]) {
            nftId = match[1];
          } else {
            const idMatch = decoded.match(/\b([0-4])\b/);
            if (idMatch && NFT_HEROES[idMatch[1]]) nftId = idMatch[1];
          }
        }
        if (!nftId) {
          const oldMatch = decoded.match(/400[1-4]/);
          if (oldMatch) nftId = oldMatch[0];
        }
      } catch (_) {}
    }

    const isNft = Boolean(nftId);
    let amountDisplay = '0.0000 LUXA';

    if (isNft) {
      const staticMeta = NFT_HEROES[nftId];
      amountDisplay = staticMeta ? `1x NFT (${staticMeta.name})` : `1x NFT (#${nftId})`;
    } else if (coins.length > 0) {
      amountDisplay = coins.join(' + ');
    }

    return {
      sender,
      recipient,
      amount: amountDisplay,
      fee: detectedFee > 0 ? `${detectedFee.toFixed(4)} LUXA` : '0 LUXA (Free)',
      nftId,
      isNft
    };
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
    const gasUsed = tx.tx_result?.gas_used || '0';
    const gasWanted = tx.tx_result?.gas_wanted || '0';

    const parsed = parseCosmosEvents(tx.tx_result?.events || [], tx.tx);
    let externalMeta = null;
    if (parsed.nftId !== null && parsed.nftId !== undefined) {
      externalMeta = await fetchExternalGenesisNft(parsed.nftId);
    }

    renderTxCard({
      hash: cleanHash,
      height: height,
      isSuccess: isSuccess,
      gasUsed: gasUsed,
      gasWanted: gasWanted,
      sender: parsed.sender,
      recipient: parsed.recipient,
      amount: externalMeta ? '1x ' + externalMeta.name : parsed.amount,
      fee: parsed.fee,
      nftId: parsed.nftId,
      isNft: Boolean(externalMeta),
      meta: externalMeta
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
    const sentTxs = sendRes.data?.result?.txs || [];
    const recvTxs = recvRes.data?.result?.txs || [];

    const allTxs = sentTxs.concat(recvTxs).sort((a, b) => parseInt(b.height, 10) - parseInt(a.height, 10));

    let rowsHtml = '';
    if (allTxs.length === 0) {
      rowsHtml = '<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">No on-chain activity for this address.</td></tr>';
    } else {
      rowsHtml = allTxs.slice(0, 10).map(function (t) {
        const isOut = sentTxs.some(s => s.hash === t.hash);
        const gas = t.tx_result?.gas_used || '0';
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
      '<div class="details-row"><span class="details-label">Address:</span><span class="details-val mono" style="color:var(--cyan); font-weight:bold;">' + escapeHtml(address) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Total Activity:</span><span class="details-val mono">' + allTxs.length + ' records found</span></div>' +
      '</div>' +
      '<h3 style="font-family:\'Space Grotesk\',sans-serif; font-size:13px; margin-bottom:12px; color:#fff;">Account Ledger Records</h3>' +
      '<div style="overflow-x:auto;">' +
      '<table class="data-table">' +
      '<thead><tr><th>Tx Hash</th><th>Block</th><th>Flow</th><th>Gas Units</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '</table></div></div>';
  }

  // --- 3. Ricerca Blocco ---
  async function searchBlock(height) {
    const res = await fetchJson(RPC_URL + '/block?height=' + height);
    if (!res.ok || !res.data?.result?.block) {
      throw new Error('Block #' + height + ' not found.');
    }

    const blk = res.data.result.block;
    const stage = document.getElementById('searchStage');
    const txCount = blk.data?.txs?.length || 0;
    const proposer = blk.header?.proposer_address || 'validator';
    const timestamp = blk.header?.time ? new Date(blk.header.time).toLocaleString() : 'N/A';

    stage.innerHTML = '<div class="result-card" style="--border-color: var(--cyan);">' +
      '<div class="card-top">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>' +
      '<span class="badge badge-cyan">BLOCK #' + escapeHtml(height) + '</span>' +
      '</div>' +
      '<div class="details-grid">' +
      '<div class="details-row"><span class="details-label">Timestamp:</span><span class="details-val">' + escapeHtml(timestamp) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Proposer:</span><span class="details-val mono" style="color:#88BBFF;">' + escapeHtml(proposer) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Transactions:</span><span class="details-val mono" style="color:var(--gold); font-weight:bold;">' + txCount + '</span></div>' +
      '</div></div>';
  }

  // --- Rendering Scheda Transazione ---
  function renderTxCard(data) {
    const stage = document.getElementById('searchStage');
    const isNft = Boolean(data.isNft && data.meta);
    const meta = data.meta;
    const isOrigin = String(data.nftId) === '0';
    const accent = isOrigin ? '#FFD700' : '#00FFCC';

    let visual = '';
    let attributesHtml = '';
    if (isNft) {
      const targetHolder = isCleanAddress(data.recipient) ? data.recipient : data.sender;
      const marquee = (' ⚡ HOLDER: ' + targetHolder + ' • ASSET: ' + meta.name.toUpperCase() + ' • ON-CHAIN: LUXA-1 ⚡ ').repeat(3);

      visual = '<div class="highway-box" style="border-color:' + accent + '; max-width:340px; margin:14px auto;">' +
        '<img src="' + escapeHtml(meta.image) + '" alt="' + escapeHtml(meta.name) + '" onerror="this.src=\'https://luxaecosystem.alwaysdata.net/assets/128.png\';" style="width:100%; max-height:300px; object-fit:cover; display:block;">' +
        '<div class="sovereign-highway-ticker">' +
        '<div class="highway-track">' + escapeHtml(marquee) + '</div>' +
        '</div></div>';

      if (Array.isArray(meta.attributes) && meta.attributes.length > 0) {
        attributesHtml = '<div style="margin-top:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px;">' +
          '<div style="color:' + accent + '; font-family:\'Orbitron\',sans-serif; font-size:11px; font-weight:bold; margin-bottom:8px;">⚡ PROTOCOL ATTRIBUTES &amp; POWERS</div>' +
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">' +
          meta.attributes.map(function (attr) {
            return '<div style="background:rgba(0,0,0,0.4); padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">' +
              '<div style="font-size:9.5px; color:#94a3b8; text-transform:uppercase;">' + escapeHtml(attr.trait_type) + '</div>' +
              '<div style="font-size:11px; color:#fff; font-weight:600;">' + escapeHtml(attr.value) + '</div>' +
              '</div>';
          }).join('') +
          '</div></div>';
      }
    }

    const titleBadge = isNft
      ? escapeHtml(meta.name) + ' (ID #' + escapeHtml(data.nftId) + ')'
      : 'COSMOS SDK NATIVE SETTLEMENT';
    const rarityBadge = isNft
      ? escapeHtml(meta.rarity || 'SOVEREIGN').toUpperCase()
      : (data.isSuccess ? 'CONFIRMED' : 'FAILED');

    stage.innerHTML = '<div class="result-card" style="--border-color: ' + accent + '; box-shadow: 0 0 25px ' + accent + '33;">' +
      '<div class="card-top">' +
      '<button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>' +
      '<span class="badge" style="color:' + accent + '; border-color:' + accent + '; background:' + accent + '15;">' + titleBadge + '</span>' +
      '<span class="badge ' + (data.isSuccess ? 'badge-ok' : 'badge-gold') + '">' + rarityBadge + '</span>' +
      '</div>' +
      visual +
      '<div class="details-grid">' +
      '<div class="details-row"><span class="details-label">Block Height:</span><span class="details-val mono" style="color:var(--gold);">#' + escapeHtml(data.height) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Transfer Asset:</span><span class="details-val" style="font-weight:bold; color:' + accent + ';">' + escapeHtml(data.amount) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Network Fee:</span><span class="details-val mono">' + escapeHtml(data.fee) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Sender (From):</span><span class="details-val mono click-hash" onclick="window.LuxaExplorer.inspect(\'' + data.sender + '\')">' + escapeHtml(data.sender) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Recipient (To):</span><span class="details-val mono click-hash" onclick="window.LuxaExplorer.inspect(\'' + data.recipient + '\')">' + escapeHtml(data.recipient) + '</span></div>' +
      '<div class="details-row"><span class="details-label">Gas Consumed:</span><span class="details-val mono">' + escapeHtml(data.gasUsed) + ' / ' + escapeHtml(data.gasWanted) + '</span></div>' +
      '</div>' +
      attributesHtml +
      '<button type="button" class="back-btn" style="width:100%; margin-top:16px; justify-content:center; padding:10px; border-color:' + accent + '; color:' + accent + ';" onclick="navigator.clipboard.writeText(\'' + data.hash + '\'); window.showToast ? window.showToast(\'Hash copied!\') : alert(\'Hash copied!\');">' +
      '📋 Copy Transaction Hash' +
      '</button>' +
      '</div>';
  }

  // --- Router Ricerca ---
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
        throw new Error('Invalid query format. Enter a Tx Hash, luxa1 address, or Block number.');
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

  // --- Sincronizzazione Nodo & Tabelle ---
  let currentLatestBlock = 0;

  async function syncNode() {
    const badge = document.getElementById('chainBlockBadge');
    const res = await fetchJson(RPC_URL + '/status');
    if (res.ok && res.data?.result?.sync_info?.latest_block_height) {
      currentLatestBlock = parseInt(res.data.result.sync_info.latest_block_height, 10);
      if (badge) badge.textContent = 'luxa-1 • #' + currentLatestBlock;
      loadRecentBlocks(currentLatestBlock);
    }
  }

  async function loadRecentBlocks(latestHeight) {
    const tbody = document.getElementById('latestBlocksBody');
    if (!tbody || !latestHeight) return;

    const minHeight = Math.max(1, latestHeight - 9);
    const res = await fetchJson(RPC_URL + '/blockchain?minHeight=' + minHeight + '&maxHeight=' + latestHeight, 4000);

    if (res.ok && Array.isArray(res.data?.result?.block_metas)) {
      tbody.innerHTML = res.data.result.block_metas.map(function (b) {
        const h = b.header?.height || 'N/A';
        const time = b.header?.time || '';
        const proposer = b.header?.proposer_address ? shorten(b.header.proposer_address, 6, 4) : 'validator';
        const numTx = b.num_txs || b.header?.num_txs || 0;

        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorer.inspect(\'' + h + '\')">#' + escapeHtml(h) + '</td>' +
          '<td class="mono muted-note">' + escapeHtml(timeAgo(time)) + '</td>' +
          '<td class="mono" style="color:#88BBFF;">' + escapeHtml(proposer) + '</td>' +
          '<td class="mono">' + escapeHtml(numTx) + '</td>' +
          '</tr>';
      }).join('');
    }
  }

  async function loadRecentActivity() {
    const tbody = document.getElementById('latestTxsBody') || document.getElementById('recentTxsBody');
    if (!tbody) return;

    try {
      const rpcRes = await fetchJson(RPC_URL + '/tx_search?query="tx.height>0"&page=1&per_page=10&order_by="desc"', 4000);
      const txs = rpcRes.data?.result?.txs || [];

      if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No transactions recorded on luxa-1. Node is live and synced.</td></tr>';
        return;
      }

      tbody.innerHTML = txs.map(function (t) {
        const parsed = parseCosmosEvents(t.tx_result?.events || [], t.tx);
        const isNft = parsed.isNft;
        const amount = parsed.amount;
        const status = (t.tx_result && (t.tx_result.code === 0 || !t.tx_result.code)) ? 'CONFIRMED' : 'FAILED';

        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorer.inspect(\'' + t.hash + '\')">' + escapeHtml(shorten(t.hash, 6, 4)) + '</td>' +
          '<td><span class="badge ' + (isNft ? 'badge-gold' : 'badge-cyan') + '" style="font-size:9px;">' + (isNft ? 'NFT' : 'TX') + '</span></td>' +
          '<td class="mono click-hash" onclick="window.LuxaExplorer.inspect(\'' + t.height + '\')">#' + escapeHtml(t.height) + '</td>' +
          '<td class="mono muted-note">Latest</td>' +
          '<td style="font-weight:bold; color:var(--cyan);">' + escapeHtml(amount) + '</td>' +
          '<td><span class="badge badge-ok" style="font-size:9px;">' + escapeHtml(status) + '</span></td>' +
          '</tr>';
      }).join('');
    } catch (_) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Connected to luxa-1 node. Awaiting transactions.</td></tr>';
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

    if (btn) btn.addEventListener('click', () => search());
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        syncNode();
        loadRecentActivity();
      });
    }

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
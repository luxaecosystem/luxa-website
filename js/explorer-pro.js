/* ==========================================================================
   LUXA SCAN PRO ENGINE — js/explorer-pro.js
   Dynamic Genesis NFTs & Multi-Asset Engine
   ========================================================================== */

(function () {
  'use strict';

  const RPC_URL = 'https://rpc.luxaecosystem.xyz';
  
  // Icone standard per monete
  const TOKEN_ICONS = {
    uluxa: 'https://luxaecosystem.alwaysdata.net/assets/128.png',
    ushard: 'https://luxaecosystem.alwaysdata.net/assets/shard128.png'
  };

  // --- RISOLUZIONE DINAMICA METADATI NFT ---
  let _cachedGenesisRegistry = null;

  async function fetchExternalGenesisNft(tokenId) {
    if (!_cachedGenesisRegistry) {
      try {
        const res = await fetch('https://luxaecosystem.alwaysdata.net/nftlist.json', { cache: 'no-cache' });
        if (res.ok) {
          const doc = await res.json();
          if (Array.isArray(doc.nfts)) {
            _cachedGenesisRegistry = {};
            doc.nfts.forEach(item => {
              _cachedGenesisRegistry[String(item.id)] = item;
            });
          }
        }
      } catch (err) {
        console.warn('Impossibile recuperare nftlist.json:', err);
      }
    }
    return _cachedGenesisRegistry ? _cachedGenesisRegistry[String(tokenId)] : null;
  }

  // --- UTILITY DI PARSING ---
  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Pulisce stringhe codificate e toglie eventuali virgolette residue ('"0"' -> '0')
  function cleanIdValue(val) {
    return String(val).replace(/['"]/g, '').trim();
  }

  function smartDecode(str) {
    if (typeof str !== 'string' || str.length === 0) return '';
    if (str.startsWith('luxa1') || str.includes('uluxa') || str.includes('ushard') || str.includes(' ')) return str;
    try {
      const decoded = atob(str);
      if (/^[a-zA-Z0-9_\-\.\:\/]+$/.test(decoded)) return decoded;
    } catch (_) {}
    return str;
  }

  function isCleanAddress(addr) {
    return typeof addr === 'string' && addr.startsWith('luxa1') && addr.length >= 38 && !/[^\w]/.test(addr);
  }

  function shorten(str, front = 10, back = 6) {
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

  async function fetchJson(url, timeoutMs = 6000) {
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

  // --- ESTRAZIONE EVENTI ON-CHAIN ---
  function parseCosmosEvents(events, rawTxB64) {
    events = events || [];
    const coins = [];
    let nftId = null;
    let detectedFee = 0;
    let sender = 'luxa1...';
    let recipient = 'luxa1...';

    for (const ev of events) {
      const evType = smartDecode(ev.type);
      const attrs = ev.attributes || [];

      for (const attr of attrs) {
        const k = smartDecode(attr.key);
        const v = smartDecode(attr.value);

        if (['sender', 'spender', 'from_address'].includes(k) && isCleanAddress(v)) sender = v;
        if (['recipient', 'receiver', 'to_address'].includes(k) && isCleanAddress(v)) recipient = v;

        // Parsing Monete
        if (evType === 'transfer' && k === 'amount' && typeof v === 'string') {
          const parts = v.split(',');
          for (const p of parts) {
            const m = p.trim().match(/^(\d+)(uluxa|ushard)$/);
            if (m) {
              const num = parseInt(m[1], 10) / 1000000;
              const denom = m[2] === 'ushard' ? 'SHARDS' : 'LUXA';
              const icon = m[2] === 'ushard' ? TOKEN_ICONS.ushard : TOKEN_ICONS.uluxa;
              coins.push({ amount: num.toFixed(4), denom, icon });
            }
          }
        }

        if (k === 'fee' && typeof v === 'string' && v.includes('uluxa')) {
          const num = parseInt(v.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) detectedFee = num / 1000000;
        }

        // Parsing NFT
        if (['id', 'token_id', 'nft_id', 'nftKey'].includes(k)) {
          nftId = cleanIdValue(v);
        }
      }
    }

    // Fallback: Lettura payload base64
    if (!nftId && rawTxB64) {
      try {
        const decoded = atob(rawTxB64);
        if (decoded.includes('luxa-relics') || decoded.includes('/cosmos.nft.v1beta1')) {
          const match = decoded.match(/luxa-relics[^\d]*?(\d+)/);
          if (match) nftId = cleanIdValue(match[1]);
        }
      } catch (_) {}
    }

    return {
      sender,
      recipient,
      coins,
      fee: detectedFee > 0 ? `${detectedFee.toFixed(4)} LUXA` : '0 LUXA (Free)',
      nftId,
      isNft: nftId !== null
    };
  }

  // --- ROUTING RICERCA ---
  window.handleExplorerBack = function(inputId, resultId) {
    const resultEl = document.getElementById(resultId) || document.getElementById('txExplorerResult');
    const inputEl = document.getElementById(inputId) || document.getElementById('txExplorerHashInput');
    if (resultEl) resultEl.innerHTML = '';
    if (inputEl) inputEl.value = '';
  };

  async function searchTx(hash) {
    const cleanHash = hash.toUpperCase().replace(/^0X/, '');
    const res = await fetchJson(RPC_URL + '/tx?hash=0x' + cleanHash + '&prove=true');

    if (!res.ok || !res.data?.result) throw new Error('Transaction not found on luxa-1.');

    const tx = res.data.result;
    const height = tx.height;
    const isSuccess = tx.tx_result?.code === 0 || !tx.tx_result?.code;
    const gasUsed = tx.tx_result?.gas_used || '0';
    const gasWanted = tx.tx_result?.gas_wanted || '0';

    const parsed = parseCosmosEvents(tx.tx_result?.events || [], tx.tx);
    
    let externalMeta = null;
    if (parsed.isNft) {
      externalMeta = await fetchExternalGenesisNft(parsed.nftId);
    }

    renderTxCard({
      hash: cleanHash,
      height,
      isSuccess,
      gasUsed,
      gasWanted,
      sender: parsed.sender,
      recipient: parsed.recipient,
      coins: parsed.coins,
      fee: parsed.fee,
      nftId: parsed.nftId,
      isNft: parsed.isNft,
      meta: externalMeta
    });
  }

  // --- RENDERING SCHEDA TRANSAZIONE ---
  function renderTxCard(data) {
    const stage = document.getElementById('searchStage') || document.getElementById('txExplorerResult');
    if (!stage) return;

    const isOrigin = String(data.nftId) === '0';
    const isNft = data.isNft;
    const accent = isOrigin ? '#FFD700' : (isNft ? '#00FFCC' : 'var(--cyan)');

    let visual = '';
    let attributesHtml = '';
    let amountDisplay = '<span style="color:#94a3b8;">0.0000 LUXA</span>';

    if (isNft && data.meta) {
      const meta = data.meta;
      const targetHolder = isCleanAddress(data.recipient) ? data.recipient : data.sender;
      amountDisplay = `<strong style="color:${accent};">1x NFT (${escapeHtml(meta.name)})</strong>`;
      
      const marquee = (` ⚡ HOLDER: ${targetHolder} • ASSET: ${meta.name.toUpperCase()} • ON-CHAIN: LUXA-1 ⚡ `).repeat(3);

      visual = `
        <div class="highway-box" style="border-color:${accent}; max-width:340px; margin:14px auto; border-radius:16px; overflow:hidden;">
          <img src="${meta.image}" alt="${escapeHtml(meta.name)}" style="width:100%; max-height:300px; object-fit:cover; display:block;" onerror="this.src='https://luxaecosystem.alwaysdata.net/assets/128.png';">
          <div class="sovereign-highway-ticker" style="background:#020617; padding:7px 0; border-top:1px solid ${accent};">
            <div class="highway-track" style="color:${accent}; font-family:monospace; font-size:10px; font-weight:bold; white-space:nowrap; animation:tickerRun 16s linear infinite;">${escapeHtml(marquee)}</div>
          </div>
        </div>
      `;

      if (Array.isArray(meta.attributes) && meta.attributes.length > 0) {
        attributesHtml = `
          <div style="margin-top:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px;">
            <div style="color:${accent}; font-family:'Orbitron',sans-serif; font-size:11px; font-weight:bold; margin-bottom:8px;">⚡ PROTOCOL ATTRIBUTES &amp; POWERS</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              ${meta.attributes.map(attr => `
                <div style="background:rgba(0,0,0,0.4); padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
                  <div style="font-size:9.5px; color:#94a3b8; text-transform:uppercase;">${escapeHtml(attr.trait_type)}</div>
                  <div style="font-size:11px; color:#fff; font-weight:600;">${escapeHtml(attr.value)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    } else if (data.coins && data.coins.length > 0) {
      amountDisplay = data.coins.map(c => `
        <span style="display:inline-flex; align-items:center; gap:5px; margin-right:10px;">
          <img src="${c.icon}" alt="${c.denom}" style="width:16px; height:16px; border-radius:50%; object-fit:cover;">
          <strong style="color:#fff;">${c.amount} ${c.denom}</strong>
        </span>
      `).join(' + ');
    }

    const titleBadge = isNft && data.meta
      ? (isOrigin ? `👑 GENESIS PROGENITOR (CITIZEN ZERO #${data.nftId})` : `🏛️ GENESIS ARTIFACT (#${data.nftId})`)
      : '🪙 NATIVE LEDGER SETTLEMENT';

    const rarityBadge = isNft && data.meta
      ? (data.meta.rarity || 'SOVEREIGN').toUpperCase()
      : (data.isSuccess ? 'CONFIRMED' : 'FAILED');

    stage.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin:12px 0 14px;">
        <button type="button" onclick="window.handleExplorerBack()" style="background:rgba(7,9,20,0.8); border:1px solid ${accent}; color:${accent}; padding:7px 16px; border-radius:12px; font-size:11.5px; font-weight:700; cursor:pointer;">← BACK</button>
        <span style="font-size:11px; color:#22c55e; font-family:monospace;">● Live On-Chain Record</span>
      </div>

      <div class="result-card" style="background:rgba(0,0,0,0.7); border:1.5px solid ${accent}; border-radius:18px; padding:16px; box-shadow:0 0 25px ${isOrigin ? 'rgba(255,215,0,0.25)' : 'rgba(0,255,204,0.15)'}; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
          <span style="color:${accent}; font-weight:bold; font-size:11px; font-family:'Orbitron',sans-serif;">${titleBadge}</span>
          <span style="background:rgba(34,197,94,0.2); color:#22c55e; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px;">${rarityBadge}</span>
        </div>

        ${visual}

        <div class="details-grid" style="font-size:12px; line-height:1.7; color:#cbd5e1;">
          <div class="details-row" style="margin-bottom:6px;"><span style="color:#94a3b8; min-width:110px; display:inline-block;">Asset Transferred:</span> ${amountDisplay}</div>
          <div class="details-row"><span style="color:#94a3b8; min-width:110px; display:inline-block;">Block Height:</span><span class="mono" style="color:var(--gold);">#${escapeHtml(data.height)}</span></div>
          <div class="details-row"><span style="color:#94a3b8; min-width:110px; display:inline-block;">Network Fee:</span><span class="mono">${escapeHtml(data.fee)}</span></div>
          <div class="details-row"><span style="color:#94a3b8; min-width:110px; display:inline-block;">Sender:</span><span class="mono click-hash" style="color:#88BBFF; cursor:pointer;" onclick="window.LuxaExplorer.inspect('${data.sender}')">${escapeHtml(data.sender)}</span></div>
          <div class="details-row"><span style="color:#94a3b8; min-width:110px; display:inline-block;">Recipient:</span><span class="mono click-hash" style="color:#88BBFF; cursor:pointer;" onclick="window.LuxaExplorer.inspect('${data.recipient}')">${escapeHtml(data.recipient)}</span></div>
          <div class="details-row"><span style="color:#94a3b8; min-width:110px; display:inline-block;">Gas Consumed:</span><span class="mono">${escapeHtml(data.gasUsed)} / ${escapeHtml(data.gasWanted)}</span></div>
        </div>

        ${attributesHtml}

        <button type="button" class="action-btn-sm" style="width:100%; margin-top:14px; font-size:11px; background:transparent; border:1.5px solid ${accent}; color:${accent}; font-weight:bold; padding:9px; cursor:pointer;" onclick="navigator.clipboard.writeText('${data.hash}'); window.showToast ? window.showToast('Hash copied!') : alert('Hash copied!');">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;
  }

  // --- AVVIO E ROUTING GLOBALE ---
  async function search(query) {
    const input = document.getElementById('searchInput') || document.getElementById('txExplorerHashInput');
    const stage = document.getElementById('searchStage') || document.getElementById('txExplorerResult');
    const q = (query || (input ? input.value : '')).trim();

    if (!q || !stage) return;
    stage.innerHTML = '<div style="color:#00FFCC; font-size:12px; margin-top:8px; font-family:monospace;">🔍 Interrogazione luxa-1 in corso...</div>';

    try {
      if (/^(0x)?[0-9a-fA-F]{16,}$/.test(q)) await searchTx(q);
      else throw new Error('Inserire un hash di transazione valido.');
    } catch (err) {
      stage.innerHTML = `<div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:12px; padding:14px; margin-top:10px; text-align:left;"><div style="color:#ef4444; font-weight:bold; font-size:12px;">❌ On-Chain Ledger Query Error</div><div style="color:#cbd5e1; font-size:11px; margin-top:4px;">${escapeHtml(err.message)}</div></div>`;
    }
  }

  window.LuxaExplorer = { search, inspect: function(val) { search(val); } };
  window.searchTransactionHash = search;

})();
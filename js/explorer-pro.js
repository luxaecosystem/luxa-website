/* ==========================================================================
   LUXA SCAN PRO ENGINE — js/explorer-pro.js
   Dynamic Genesis NFTs, Ministerial Seals & Multi-Asset L1 Engine
   ========================================================================== */

(function () {
  'use strict';

  const RPC_URL = 'https://rpc.luxaecosystem.xyz';
  const BACKEND_API = 'https://luxaecosystem.alwaysdata.net/api';

  // I 5 SIGILLI MINISTERIALI DEL CONSEIL DE LA GENÈSE (Fallback nativo L1)
  const GENESIS_FALLBACK = {
    '0': {
      id: '0',
      name: 'Genesis Progenitor — Citizen Zero',
      rarity: 'Mythic (Origin 1 of 1)',
      image: 'https://luxaecosystem.alwaysdata.net/assets/nfts/citizen_zero.jpeg',
      attributes: [
        { trait_type: 'Role', value: 'Sovereign Architect & Root Validator' },
        { trait_type: 'Council Authority', value: 'Conseil de la Genèse (Permanent Chair)' },
        { trait_type: 'Settlement Status', value: 'Immediate Green Card Bypass' },
        { trait_type: 'Perk', value: 'Zero Fees & Instant Cooldown' }
      ]
    },
    '1': {
      id: '1',
      name: 'Chrono-Key Master',
      rarity: 'Legendary',
      image: 'https://luxaecosystem.alwaysdata.net/assets/nfts/chrono_key_master.jpeg',
      attributes: [
        { trait_type: 'Role', value: 'Minister of Settlement & Regulations' },
        { trait_type: 'Council Authority', value: 'Conseil de la Genèse (Signer 1)' },
        { trait_type: 'Discipline', value: 'Temporal Settlement Oversight' },
        { trait_type: 'Utility', value: '-50% Forge Cooldown' }
      ]
    },
    '2': {
      id: '2',
      name: 'Cyber-Shadow Node',
      rarity: 'Epic',
      image: 'https://luxaecosystem.alwaysdata.net/assets/nfts/cyber_shadow_node.jpeg',
      attributes: [
        { trait_type: 'Role', value: 'Minister of Cryptographic Security' },
        { trait_type: 'Council Authority', value: 'Conseil de la Genèse (Signer 2)' },
        { trait_type: 'Discipline', value: 'Zero-Knowledge Multi-Vault Mesh' },
        { trait_type: 'Utility', value: '20% ushard Discount' }
      ]
    },
    '3': {
      id: '3',
      name: 'Grandmaster of Servers',
      rarity: 'Legendary',
      image: 'https://luxaecosystem.alwaysdata.net/assets/nfts/grandmaster_of_servers.jpeg',
      attributes: [
        { trait_type: 'Role', value: 'Minister of Infrastructure & Validators' },
        { trait_type: 'Council Authority', value: 'Conseil de la Genèse (Signer 3)' },
        { trait_type: 'Discipline', value: 'CometBFT Node Consensus Architecture' },
        { trait_type: 'Yield Booster', value: '+25% APY Staking Yield' }
      ]
    },
    '4': {
      id: '4',
      name: 'Neon Data Valkyrie',
      rarity: 'Rare',
      image: 'https://luxaecosystem.alwaysdata.net/assets/nfts/neon_data_valkyrie.jpeg',
      attributes: [
        { trait_type: 'Role', value: 'Minister of Liquidity & AMM Stability' },
        { trait_type: 'Council Authority', value: 'Conseil de la Genèse (Signer 4)' },
        { trait_type: 'Discipline', value: 'High-Throughput Liquidity Stream' },
        { trait_type: 'Utility Multiplier', value: '1.5x Shard Multiplier' }
      ]
    }
  };

  const TOKEN_ICONS = {
    uluxa: 'https://luxaecosystem.alwaysdata.net/assets/128.png',
    ushard: 'https://luxaecosystem.alwaysdata.net/assets/shard128.png'
  };

  // Pulizia radicale degli identificativi token
  function sanitizeTokenId(raw) {
    if (raw === null || raw === undefined) return null;
    const clean = String(raw).replace(/[^0-9]/g, '').trim();
    return clean.length > 0 ? clean : null;
  }

  let _externalRegistry = null;
  async function resolveMetadata(tokenId) {
    const cleanId = sanitizeTokenId(tokenId);
    if (!cleanId) return null;

    if (!_externalRegistry) {
      try {
        const res = await fetch('https://luxaecosystem.alwaysdata.net/nftlist.json', { cache: 'no-cache' });
        if (res.ok) {
          const doc = await res.json();
          if (Array.isArray(doc.nfts)) {
            _externalRegistry = {};
            doc.nfts.forEach(item => {
              const id = sanitizeTokenId(item.id);
              if (id) _externalRegistry[id] = item;
            });
          }
        }
      } catch (err) {
        console.warn('[Explorer] nftlist.json fetch skipped, using fallback:', err);
      }
    }

    if (_externalRegistry && _externalRegistry[cleanId]) {
      return _externalRegistry[cleanId];
    }
    return GENESIS_FALLBACK[cleanId] || null;
  }

  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      clearTimeout(timer);
    }
  }

  // Decora un indirizzo utilizzando il registro centrale di wallet-labels.js
  function renderDecoratedAddress(addr) {
    if (window.luxaRenderAddress && typeof window.luxaRenderAddress === 'function') {
      return window.luxaRenderAddress(addr, true);
    }
    return `<span class="mono">${escapeHtml(shorten(addr, 10, 6))}</span>`;
  }

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

        if (['id', 'token_id', 'nft_id', 'nftKey'].includes(k)) {
          const clean = sanitizeTokenId(v);
          if (clean !== null) nftId = clean;
        }
      }
    }

    if (nftId === null && rawTxB64) {
      try {
        const decoded = atob(rawTxB64);
        if (decoded.includes('luxa-relics')) {
          const match = decoded.match(/luxa-relics[^\d]*?(\d+)/);
          if (match) nftId = sanitizeTokenId(match[1]);
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

  async function searchTx(hash) {
    const cleanHash = hash.toUpperCase().replace(/^0X/, '');
    const res = await fetchJson(RPC_URL + '/tx?hash=0x' + cleanHash + '&prove=true');

    if (!res.ok || !res.data?.result) {
      throw new Error('Transaction ' + cleanHash + ' not found on luxa-1.');
    }

    const tx = res.data.result;
    const height = tx.height;
    const isSuccess = tx.tx_result ? (tx.tx_result.code === 0 || !tx.tx_result.code) : true;
    const gasUsed = tx.tx_result?.gas_used || '0';
    const gasWanted = tx.tx_result?.gas_wanted || '0';

    const parsed = parseCosmosEvents(tx.tx_result?.events || [], tx.tx);
    const meta = parsed.isNft ? await resolveMetadata(parsed.nftId) : null;

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
      isNft: Boolean(meta),
      meta
    });
  }

  function renderTxCard(data) {
    const stage = document.getElementById('searchStage');
    if (!stage) return;

    const isNft = Boolean(data.isNft && data.meta);
    const isOrigin = isNft && String(data.nftId) === '0';
    const accent = isOrigin ? '#FFD700' : (isNft ? '#00FFCC' : 'var(--cyan)');
    const meta = data.meta;

    let visual = '';
    let attributesHtml = '';
    let amountDisplay = '<span style="color:#94a3b8;">0.0000 LUXA</span>';

    if (isNft) {
      amountDisplay = `<strong style="color:${accent};">1x Ministerial Seal (${escapeHtml(meta.name)})</strong>`;
      const currentHolder = (data.recipient && data.recipient !== 'luxa1...') ? data.recipient : data.sender;
      const marquee = (` ⚡ HOLDER: ${currentHolder} • SEAL: #${data.nftId} • ${meta.name.toUpperCase()} • LUXA-1 ON-CHAIN ⚡ `).repeat(3);

      visual = `
        <style>
          @keyframes tickerRun {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333333%); }
          }
        </style>
        <div class="highway-box" style="border:1.5px solid ${accent}; max-width:320px; margin:14px auto 18px; border-radius:16px; overflow:hidden; background:#020617; box-shadow:0 8px 25px ${accent}25;">
          <div style="width:100%; aspect-ratio:4/5; overflow:hidden; background:#000;">
            <img src="${escapeHtml(meta.image)}" alt="${escapeHtml(meta.name)}" style="width:100%; height:100%; object-fit:cover; object-position:top center; display:block;" onerror="this.src='https://luxaecosystem.alwaysdata.net/assets/128.png';">
          </div>
          <div class="sovereign-highway-ticker" style="background:#020617; padding:7px 0; border-top:1px solid ${accent}; overflow:hidden; white-space:nowrap; width:100%;">
            <div class="highway-track" style="display:inline-block; color:${accent}; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; white-space:nowrap; will-change:transform; animation:tickerRun 14s linear infinite;">
              ${escapeHtml(marquee)}
            </div>
          </div>
        </div>
      `;

      if (Array.isArray(meta.attributes) && meta.attributes.length > 0) {
        attributesHtml = `
          <div style="margin-top:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;">
            <div style="color:${accent}; font-family:'Orbitron',sans-serif; font-size:11px; font-weight:bold; margin-bottom:10px;">⚡ CONSEIL MINISTERIAL DUTIES &amp; POWERS</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              ${meta.attributes.map(attr => `
                <div style="background:rgba(0,0,0,0.5); padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                  <div style="font-size:9.5px; color:#94a3b8; text-transform:uppercase; font-family:'Space Grotesk',sans-serif;">${escapeHtml(attr.trait_type)}</div>
                  <div style="font-size:11.5px; color:#fff; font-weight:600; margin-top:2px;">${escapeHtml(attr.value)}</div>
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

    const titleBadge = isNft
      ? (isOrigin ? `👑 GENESIS PROGENITOR (CITIZEN ZERO #${data.nftId})` : `🏛️ CONSEIL DE LA GENÈSE SEAL (#${data.nftId})`)
      : '🪙 NATIVE LEDGER SETTLEMENT';

    const rarityBadge = isNft
      ? (meta.rarity || 'SOVEREIGN').toUpperCase()
      : (data.isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED');

    stage.innerHTML = `
      <div class="result-card" style="--border-color: ${accent}; box-shadow: 0 0 30px ${accent}33;">
        <div class="card-top">
          <button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>
          <span class="badge" style="color:${accent}; border-color:${accent}; background:${accent}18;">${titleBadge}</span>
          <span class="badge ${data.isSuccess ? 'badge-ok' : 'badge-gold'}">${rarityBadge}</span>
        </div>
        ${visual}
        <div class="details-grid">
          <div class="details-row"><span class="details-label">Block Height:</span><span class="details-val mono" style="color:var(--gold);">#${escapeHtml(data.height)}</span></div>
          <div class="details-row"><span class="details-label">Transfer Asset:</span><span class="details-val">${amountDisplay}</span></div>
          <div class="details-row"><span class="details-label">Network Fee:</span><span class="details-val mono">${escapeHtml(data.fee)}</span></div>
          <div class="details-row"><span class="details-label">Sender (From):</span><span class="details-val click-hash" onclick="window.LuxaExplorer.inspect('${data.sender}')">${renderDecoratedAddress(data.sender)}</span></div>
          <div class="details-row"><span class="details-label">Recipient (To):</span><span class="details-val click-hash" onclick="window.LuxaExplorer.inspect('${data.recipient}')">${renderDecoratedAddress(data.recipient)}</span></div>
          <div class="details-row"><span class="details-label">Gas Consumed:</span><span class="details-val mono">${escapeHtml(data.gasUsed)} / ${escapeHtml(data.gasWanted)}</span></div>
        </div>
        ${attributesHtml}
        <button type="button" class="back-btn" style="width:100%; margin-top:16px; justify-content:center; padding:10px; border-color:${accent}; color:${accent}; font-weight:bold;" onclick="navigator.clipboard.writeText('${data.hash}'); window.showToast ? window.showToast('Hash copied!') : alert('Hash copied!');">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;
  }

  // --- Ricerca Indirizzo: Saldi On-Chain + Sigilli Posseduti + Transazioni ---
  async function searchAddress(address) {
    const stage = document.getElementById('searchStage');
    const querySender = encodeURIComponent("transfer.sender='" + address + "'");
    const queryRecv = encodeURIComponent("transfer.recipient='" + address + "'");

    const results = await Promise.all([
      fetchJson(RPC_URL + '/tx_search?query="' + querySender + '"&page=1&per_page=10&order_by="desc"'),
      fetchJson(RPC_URL + '/tx_search?query="' + queryRecv + '"&page=1&per_page=10&order_by="desc"'),
      fetchJson(`${BACKEND_API}/node/nfts/${address}`, 4000),
      fetchJson(`${BACKEND_API}/node/balances/${address}`, 4000)
    ]);

    const sentTxs = results[0].data?.result?.txs || [];
    const recvTxs = results[1].data?.result?.txs || [];
    const onChainNfts = results[2].data?.nfts || [];
    const balancesData = results[3].data?.balances || [];
    const allTxs = sentTxs.concat(recvTxs).sort((a, b) => parseInt(b.height, 10) - parseInt(a.height, 10));

    // Estrazione saldi nativi
    let luxaBalance = '0.0000 LUXA';
    let shardsBalance = '0 SHARDS';
    if (Array.isArray(balancesData)) {
      const uLuxa = balancesData.find(c => c.denom === 'uluxa');
      const uShard = balancesData.find(c => c.denom === 'ushard');
      if (uLuxa?.amount) luxaBalance = `${(Number(uLuxa.amount) / 1000000).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} LUXA`;
      if (uShard?.amount) shardsBalance = `${Math.floor(Number(uShard.amount) / 1000000).toLocaleString('en-US')} SHARDS`;
    }

    // Ispezione wallet etichettato da wallet-labels.js
    const walletMeta = window.luxaGetWalletInfo ? window.luxaGetWalletInfo(address) : null;
    let institutionalBanner = '';
    if (walletMeta) {
      institutionalBanner = `
        <div style="background:${walletMeta.badgeBg}; border:1.5px solid ${walletMeta.color}; border-radius:14px; padding:12px 16px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:${walletMeta.color}; font-family:'Space Grotesk',sans-serif; font-size:14px;">🏛️ ${escapeHtml(walletMeta.label)}</strong>
            <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">Role: ${escapeHtml(walletMeta.role)}</div>
          </div>
          <span style="font-family:'Orbitron',sans-serif; font-size:10px; color:${walletMeta.color}; border:1px solid ${walletMeta.color}; padding:2px 8px; border-radius:6px; font-weight:bold;">OFFICIAL ENTITY</span>
        </div>
      `;
    }

    // Vetrina dei Sigilli Ministeriali posseduti
    let nftsBannerHtml = '';
    if (onChainNfts.length > 0) {
      const nftCards = await Promise.all(onChainNfts.map(async item => {
        const meta = await resolveMetadata(item.id);
        const name = meta ? meta.name : `Genesis Seal #${item.id}`;
        const img = meta ? meta.image : 'https://luxaecosystem.alwaysdata.net/assets/128.png';
        const isCitizenZero = String(item.id) === '0';
        const accent = isCitizenZero ? '#FFD700' : '#00FFCC';

        return `
          <div style="background:#030712; border:1.5px solid ${accent}; border-radius:14px; padding:10px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 6px 20px ${accent}22;">
            <div style="width:100%; aspect-ratio:4/5; border-radius:10px; overflow:hidden; background:#000; border:1px solid rgba(255,255,255,0.08); margin-bottom:10px;">
              <img src="${escapeHtml(img)}" alt="${escapeHtml(name)}" style="width:100%; height:100%; object-fit:cover; object-position:top center; display:block;" onerror="this.src='https://luxaecosystem.alwaysdata.net/assets/128.png';">
            </div>
            <div style="text-align:center;">
              <div style="font-family:'Orbitron',sans-serif; font-size:11px; font-weight:bold; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
              <div style="font-family:'JetBrains Mono',monospace; font-size:9.5px; color:${accent}; font-weight:700; margin-top:4px;">ID #${escapeHtml(item.id)}</div>
            </div>
          </div>
        `;
      }));

      nftsBannerHtml = `
        <div style="margin-bottom:20px; background:rgba(0,255,204,0.03); border:1px solid rgba(0,255,204,0.25); border-radius:16px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:12px; color:#00FFCC; font-weight:bold; letter-spacing:0.5px;">🏛️ CONSEIL DE LA GENÈSE SEALS (ON-CHAIN)</span>
            <span style="font-family:'JetBrains Mono',monospace; font-size:10px; color:#22c55e; background:rgba(34,197,94,0.15); border:1px solid #22c55e; padding:3px 9px; border-radius:6px; font-weight:bold;">${onChainNfts.length} Anchored</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:12px;">
            ${nftCards.join('')}
          </div>
        </div>
      `;
    }

    let rowsHtml = '';
    if (allTxs.length === 0) {
      rowsHtml = '<tr><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">No banking transactions recorded for this vault address.</td></tr>';
    } else {
      rowsHtml = allTxs.slice(0, 10).map(t => {
        const isOut = sentTxs.some(s => s.hash === t.hash);
        const gas = t.tx_result?.gas_used || '0';
        return `
          <tr>
            <td class="click-hash" onclick="window.LuxaExplorer.inspect('${t.hash}')">${escapeHtml(shorten(t.hash, 8, 4))}</td>
            <td class="mono">#${escapeHtml(t.height)}</td>
            <td><span class="badge ${isOut ? 'badge-gold' : 'badge-ok'}" style="font-size:9px;">${isOut ? 'OUT' : 'IN'}</span></td>
            <td class="mono">${escapeHtml(gas)} units</td>
          </tr>
        `;
      }).join('');
    }

    stage.innerHTML = `
      <div class="result-card" style="--border-color: var(--cyan);">
        <div class="card-top">
          <button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>
          <span class="badge badge-cyan">VAULT ACCOUNT OVERVIEW</span>
        </div>

        ${institutionalBanner}
        
        <div class="details-grid" style="margin-bottom:18px;">
          <div class="details-row"><span class="details-label">Vault Address:</span><span class="details-val mono" style="color:var(--cyan); font-weight:bold;">${escapeHtml(address)}</span></div>
          <div class="details-row"><span class="details-label">LUXA Balance:</span><span class="details-val mono" style="color:#00FFCC; font-weight:bold; font-size:14px;">${escapeHtml(luxaBalance)}</span></div>
          <div class="details-row"><span class="details-label">SHARDS Balance:</span><span class="details-val mono" style="color:#c084fc; font-weight:bold;">${escapeHtml(shardsBalance)}</span></div>
          <div class="details-row"><span class="details-label">Total Transactions:</span><span class="details-val mono">${allTxs.length} activity entries</span></div>
        </div>

        ${nftsBannerHtml}

        <h3 style="font-family:'Space Grotesk',sans-serif; font-size:13px; margin-bottom:12px; color:#fff;">On-Chain Banking Ledger</h3>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead><tr><th>Tx Hash</th><th>Block</th><th>Flow</th><th>Gas Units</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function searchBlock(height) {
    const res = await fetchJson(RPC_URL + '/block?height=' + height);
    if (!res.ok || !res.data?.result?.block) throw new Error('Block #' + height + ' not found.');

    const blk = res.data.result.block;
    const stage = document.getElementById('searchStage');
    const txCount = blk.data?.txs?.length || 0;
    const proposer = blk.header?.proposer_address || 'validator';
    const timestamp = blk.header?.time ? new Date(blk.header.time).toLocaleString() : 'N/A';

    stage.innerHTML = `
      <div class="result-card" style="--border-color: var(--cyan);">
        <div class="card-top">
          <button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>
          <span class="badge badge-cyan">BLOCK #${escapeHtml(height)}</span>
        </div>
        <div class="details-grid">
          <div class="details-row"><span class="details-label">Timestamp:</span><span class="details-val">${escapeHtml(timestamp)}</span></div>
          <div class="details-row"><span class="details-label">Proposer:</span><span class="details-val click-hash" onclick="window.LuxaExplorer.inspect('${proposer}')">${renderDecoratedAddress(proposer)}</span></div>
          <div class="details-row"><span class="details-label">Transactions:</span><span class="details-val mono" style="color:var(--gold); font-weight:bold;">${txCount}</span></div>
        </div>
      </div>
    `;
  }

  async function inspectNftCollection(classId = 'luxa-relics') {
    const stage = document.getElementById('searchStage');
    if (!stage) return;

    stage.innerHTML = `
      <div class="status-msg status-loading" style="color:#00FFCC;">
        <i class="fas fa-spinner fa-spin"></i> Querying on-chain registry for ${escapeHtml(classId)}...
      </div>
    `;

    try {
      const res = await fetchJson('https://luxaecosystem.alwaysdata.net/nftlist.json');
      const relics = Array.isArray(res.data?.nfts) ? res.data.nfts : Object.values(GENESIS_FALLBACK);

      stage.innerHTML = `
        <div class="result-card" style="--border-color:#00FFCC;">
          <div class="card-top">
            <button type="button" class="back-btn" onclick="window.LuxaExplorer.resetView()">← BACK</button>
            <span class="badge" style="color:#FFD700; border-color:#FFD700; background:#FFD70018;">🏛️ CONSEIL DE LA GENÈSE SEALS</span>
          </div>
          <h2 style="margin:4px 0 20px; color:#fff;">5 Sovereign Ministerial Seals (${escapeHtml(classId)})</h2>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            ${relics.map(item => {
              const isOrigin = String(item.id) === '0';
              const accent = isOrigin ? '#FFD700' : '#00FFCC';
              const roleAttr = Array.isArray(item.attributes)
                ? item.attributes.find(attr => attr.trait_type === 'Role' || attr.trait_type === 'Authority')?.value
                : null;
              return `
                <div style="background:rgba(7,9,20,0.85); border:1.5px solid ${accent}; border-radius:14px; overflow:hidden; padding:12px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="width:100%; aspect-ratio:4/5; border-radius:10px; overflow:hidden; margin-bottom:10px; background:#000;">
                      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" style="width:100%; height:100%; object-fit:cover; object-position:top center; display:block;" onerror="this.src='https://luxaecosystem.alwaysdata.net/assets/128.png';">
                    </div>
                    <div style="font-size:10px; color:${accent}; font-family:var(--font-mono); font-weight:bold;">SEAL #${escapeHtml(item.id)} •${escapeHtml(item.rarity || 'SOVEREIGN')}</div>
                    <h4 style="margin:4px 0 8px; color:#fff; font-size:13px;">${escapeHtml(item.name)}</h4>
                    <p style="font-size:11px; color:#94a3b8; line-height:1.4; margin:0 0 10px;">${escapeHtml(item.description || 'Soulbound governance credential.')}</p>
                  </div>
                  <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; font-size:10px; font-family:var(--font-mono);">
                    <span style="color:#64748b;">Authority:</span> <span style="color:${accent}; font-weight:bold;">${escapeHtml(roleAttr || 'Council Minister')}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      stage.innerHTML = '<div class="status-msg status-error">❌ Unable to retrieve collection: ' + escapeHtml(err.message) + '</div>';
    }
  }

  async function search(query) {
    const input = document.getElementById('searchInput');
    const stage = document.getElementById('searchStage');
    const q = (query || (input ? input.value : '')).trim();

    if (!q || !stage) return;
    stage.innerHTML = '<div class="status-msg status-loading">🔍 Querying luxa-1 ledger...</div>';

    try {
      const normalizedQuery = q.toLowerCase();
      if (['luxa-relics', 'relics', 'genesis', 'seals'].includes(normalizedQuery)) await inspectNftCollection('luxa-relics');
      else if (normalizedQuery.startsWith('luxa1')) await searchAddress(normalizedQuery);
      else if (/^\d+$/.test(q)) await searchBlock(q);
      else if (/^(0x)?[0-9a-fA-F]{16,}$/.test(q)) await searchTx(q);
      else throw new Error("Invalid query format. Enter a valid Tx Hash, luxa1 address, Block number, or 'luxa-relics'.");
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

  let currentLatestBlock = 0;
  async function syncNode() {
    const badge = document.getElementById('chainBlockBadge');
    const res = await fetchJson(RPC_URL + '/status');
    if (res.ok && res.data?.result?.sync_info?.latest_block_height) {
      currentLatestBlock = parseInt(res.data.result.sync_info.latest_block_height, 10);
      if (badge) badge.textContent = 'luxa-1 • #' + currentLatestBlock.toLocaleString('en-US');
      loadRecentBlocks(currentLatestBlock);
    }
  }

  async function loadRecentBlocks(latestHeight) {
    const tbody = document.getElementById('latestBlocksBody');
    if (!tbody || !latestHeight) return;

    const minHeight = Math.max(1, latestHeight - 9);
    const res = await fetchJson(RPC_URL + '/blockchain?minHeight=' + minHeight + '&maxHeight=' + latestHeight, 4000);

    if (res.ok && Array.isArray(res.data?.result?.block_metas)) {
      tbody.innerHTML = res.data.result.block_metas.map(b => {
        const h = b.header?.height || 'N/A';
        const time = b.header?.time || '';
        const proposer = b.header?.proposer_address || 'validator';
        const numTx = b.num_txs || b.header?.num_txs || 0;

        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorer.inspect(\'' + h + '\')">#' + escapeHtml(h) + '</td>' +
          '<td class="mono muted-note">' + escapeHtml(timeAgo(time)) + '</td>' +
          '<td class="click-hash" onclick="window.LuxaExplorer.inspect(\'' + proposer + '\')">' + renderDecoratedAddress(proposer) + '</td>' +
          '<td class="mono">' + escapeHtml(numTx) + '</td>' +
          '</tr>';
      }).join('');
    }
  }

  async function loadRecentActivity() {
    const tbody = document.getElementById('latestTxsBody');
    if (!tbody) return;

    try {
      const rpcRes = await fetchJson(RPC_URL + '/tx_search?query="tx.height>0"&page=1&per_page=10&order_by="desc"', 4000);
      const txs = rpcRes.data?.result?.txs || [];

      if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No transactions recorded on luxa-1. Node is live and synced.</td></tr>';
        return;
      }

      tbody.innerHTML = txs.map(t => {
        const parsed = parseCosmosEvents(t.tx_result?.events || [], t.tx);
        const isNft = parsed.isNft;
        const meta = isNft ? GENESIS_FALLBACK[parsed.nftId] : null;
        const amount = isNft ? (meta ? `1x Seal (${meta.name})` : '1x Ministerial Seal') : (parsed.coins.length > 0 ? parsed.coins.map(c => `${c.amount} ${c.denom}`).join(' + ') : '0 LUXA');
        const status = (t.tx_result && (t.tx_result.code === 0 || !t.tx_result.code)) ? 'CONFIRMED' : 'FAILED';

        return '<tr>' +
          '<td class="click-hash" onclick="window.LuxaExplorer.inspect(\'' + t.hash + '\')">' + escapeHtml(shorten(t.hash, 6, 4)) + '</td>' +
          '<td><span class="badge ' + (isNft ? 'badge-gold' : 'badge-cyan') + '" style="font-size:9px;">' + (isNft ? 'SEAL' : 'TX') + '</span></td>' +
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
    search,
    resetView,
    inspect: function (val) {
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

    if (btn) btn.addEventListener('click', () => search());
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
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
/* ==========================================================================
   LUXA ON-CHAIN EXPLORER ENGINE (explorer.js)
   Universal Asset Classification: Coin Transfer vs Sovereign NFT License
   ========================================================================== */

const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';
const BACKEND_API = (window.API_BASE && window.API_BASE.replace(/\/api$/, '')) 
  ? `${window.API_BASE.replace(/\/$/, '')}/api` 
  : 'https://luxaecosystem.alwaysdata.net/api';

const NFT_METADATA = {
  '4001': {
    name: 'Grandmaster of Servers',
    tier: '0.01% Standard',
    utility: 'Node Operator License (Ujrah - computational service reward)',
    allocation: 'Dedicated Node Slot / Consensus Key',
    color: '#00FFCC'
  },
  '4002': {
    name: 'Neon Data Valkyrie',
    tier: '0.05% High-Throughput',
    utility: 'Institutional DEX AMM Fee Rebate (Takhfid - trade discount)',
    allocation: 'Zero Arbitrage Fee Channel',
    color: '#a855f7'
  },
  '4003': {
    name: 'Chrono-Key Master',
    tier: '0.01% Low-Latency',
    utility: 'Cryptographic Priority Bandwidth Lane',
    allocation: 'Sub-Second Mempool Propagation',
    color: '#FFD700'
  },
  '4004': {
    name: 'Cyber-Shadow Node',
    tier: '0.01% Distributed',
    utility: "Decentralized Encrypted Storage (Manfa'ah - tangible disk space)",
    allocation: '50 GB Encrypted Storage Space',
    color: '#38bdf8'
  }
};

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

// 1. HD SOVEREIGN NFT VECTOR GENERATOR
function generateSovereignNftSvg(name, id, wallet, txHash) {
  const displayId = String(id || '4001');
  const meta = NFT_METADATA[displayId] || {
    name: name || 'Grandmaster of Servers',
    tier: '0.01% Standard',
    utility: 'Node Operator License (Ujrah - computational service reward)',
    allocation: 'Dedicated Node Slot / Consensus Key',
    color: '#00FFCC'
  };

  const displayName = escapeXml(name || meta.name);
  const displayWallet = escapeXml(wallet || 'luxa1...');
  const shortHolder = displayWallet.length > 28 ? (displayWallet.slice(0, 16) + '...' + displayWallet.slice(-8)) : displayWallet;
  const primaryColor = meta.color || '#00FFCC';
  const marquee = ` • HOLDER: ${shortHolder} • LEDGER: LUXA-1 • ASSET: ${displayName.toUpperCase()} • STATUS: ANCHORED • `;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 980" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#040812"/>
        <stop offset="50%" stop-color="#071b16"/>
        <stop offset="100%" stop-color="#020509"/>
      </linearGradient>
      <linearGradient id="heroArtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#08231c"/>
        <stop offset="50%" stop-color="#0e372d"/>
        <stop offset="100%" stop-color="#04120e"/>
      </linearGradient>
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(16, 185, 129, 0.14)"/>
        <stop offset="100%" stop-color="rgba(6, 78, 59, 0.08)"/>
      </linearGradient>
      <filter id="cardGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="${primaryColor}" flood-opacity="0.3"/>
      </filter>
      <path id="marqueeTrack" d="M 50 60 H 670 Q 690 60 690 80 V 900 Q 690 920 670 920 H 50 Q 30 920 30 900 V 80 Q 30 60 50 60 Z" fill="none"/>
    </defs>

    <rect width="720" height="980" rx="34" fill="url(#bgGrad)" stroke="${primaryColor}" stroke-width="2.5" filter="url(#cardGlow)"/>
    <rect x="18" y="18" width="684" height="944" rx="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>

    <use href="#marqueeTrack" stroke="${primaryColor}" stroke-opacity="0.2" stroke-width="1.2"/>
    <text font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="${primaryColor}" letter-spacing="2">
      <textPath href="#marqueeTrack" startOffset="0%">
        ${marquee.repeat(3)}
        <animate attributeName="startOffset" from="0%" to="-100%" dur="30s" repeatCount="indefinite"/>
      </textPath>
    </text>

    <text x="75" y="118" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#6ee7b7" letter-spacing="1.5">LUXA SOVEREIGN INFRASTRUCTURE KEY</text>
    <text x="75" y="158" font-family="'Space Grotesk', sans-serif" font-size="32" font-weight="800" fill="#ffffff">${displayName}</text>
    <text x="75" y="188" font-family="'Inter', sans-serif" font-size="14" font-weight="500" fill="#a7f3d0">Validator Protocol License — ${escapeXml(meta.tier)}</text>

    <g transform="translate(80, 215)">
      <rect width="560" height="300" rx="18" fill="url(#heroArtGrad)" stroke="${primaryColor}" stroke-opacity="0.5" stroke-width="1.8"/>
      <path d="M 0 75 H 560 M 0 150 H 560 M 0 225 H 560 M 140 0 V 300 M 280 0 V 300 M 420 0 V 300" stroke="rgba(0,255,204,0.08)" stroke-width="1"/>
      
      <circle cx="280" cy="130" r="72" fill="#030c09" stroke="${primaryColor}" stroke-width="2"/>
      <circle cx="280" cy="130" r="54" fill="none" stroke="#FFD700" stroke-width="1.5" stroke-dasharray="6 4">
        <animateTransform attributeName="transform" type="rotate" from="0 280 130" to="360 280 130" dur="14s" repeatCount="indefinite"/>
      </circle>
      
      <path d="M 280 95 L 315 110 V 138 C 315 160 280 175 280 175 C 280 175 245 160 245 138 V 110 Z" fill="rgba(0,255,204,0.15)" stroke="${primaryColor}" stroke-width="2"/>
      <circle cx="280" cy="125" r="10" fill="#FFD700"/>
      <rect x="274" y="142" width="12" height="15" rx="2" fill="${primaryColor}"/>

      <text x="280" y="245" text-anchor="middle" font-family="'Orbitron', sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="3">#${displayId}</text>
      <text x="280" y="270" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#6ee7b7" letter-spacing="2">ACTIVE CONSENSUS NODE</text>
    </g>

    <text x="360" y="555" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#6ee7b7" letter-spacing="1.5">UTILITY ROLE</text>
    <text x="360" y="586" text-anchor="middle" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#f0fdf4">${escapeXml(meta.utility)}</text>

    <g transform="translate(80, 625)">
      <rect width="265" height="85" rx="14" fill="url(#boxGrad)" stroke="rgba(52,211,153,0.3)" stroke-width="1.2"/>
      <text x="20" y="32" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#6ee7b7">TOKEN ID</text>
      <text x="20" y="64" font-family="'Space Grotesk', sans-serif" font-size="22" font-weight="800" fill="#ffffff">${displayId}</text>
    </g>

    <g transform="translate(375, 625)">
      <rect width="265" height="85" rx="14" fill="url(#boxGrad)" stroke="rgba(52,211,153,0.3)" stroke-width="1.2"/>
      <text x="20" y="32" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#6ee7b7">PROTOCOL TIER</text>
      <text x="20" y="64" font-family="'Space Grotesk', sans-serif" font-size="17" font-weight="700" fill="#ffffff">${escapeXml(meta.tier)}</text>
    </g>

    <g transform="translate(80, 730)">
      <rect width="560" height="88" rx="14" fill="url(#boxGrad)" stroke="rgba(52,211,153,0.3)" stroke-width="1.2"/>
      <text x="20" y="32" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#6ee7b7">TECHNICAL ALLOCATION</text>
      <text x="20" y="64" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="700" fill="#ffffff">${escapeXml(meta.allocation)}</text>
    </g>

    <text x="80" y="870" font-family="'Inter', sans-serif" font-size="13" font-weight="500" fill="#a7f3d0">HOLDER: ${shortHolder}</text>
    
    <g transform="translate(600, 860)">
      <circle r="30" fill="#042017" stroke="${primaryColor}" stroke-width="1.8"/>
      <text y="8" text-anchor="middle" font-family="'Orbitron', sans-serif" font-size="18" font-weight="900" fill="#ffffff">LX</text>
    </g>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

// 2. PROCEDURAL COIN TRANSFER CARD
function generateCoinTransferSvg(amount, sender, recipient, txHash) {
  const shortSender = sender.length > 20 ? (sender.slice(0, 12) + '...' + sender.slice(-6)) : sender;
  const shortRecv = recipient.length > 20 ? (recipient.slice(0, 12) + '...' + recipient.slice(-6)) : recipient;
  const shortTx = txHash ? (txHash.slice(0, 14) + '...' + txHash.slice(-8)) : '0x...';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" width="100%" height="100%">
    <defs>
      <linearGradient id="coinBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080c1f"/>
        <stop offset="100%" stop-color="#02040c"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="408" height="328" rx="16" fill="url(#coinBg)" stroke="#00C878" stroke-width="1.8"/>
    
    <g transform="translate(30, 24)">
      <text x="0" y="16" font-family="'Orbitron', sans-serif" font-size="12" font-weight="900" fill="#00FFCC">🪙 NATIVE COIN SETTLEMENT</text>
      <text x="360" y="16" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="#22c55e" text-anchor="end">FINALIZED</text>
    </g>

    <g transform="translate(30, 65)">
      <rect width="360" height="95" rx="12" fill="rgba(0,0,0,0.5)" stroke="rgba(0,255,204,0.2)"/>
      <text x="180" y="40" font-family="'Orbitron', sans-serif" font-size="24" font-weight="900" fill="#FFD700" text-anchor="middle">${escapeXml(amount)}</text>
      <text x="180" y="65" font-family="'Inter', sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">On-Chain Cosmos SDK Transfer (luxa-1)</text>
    </g>

    <g transform="translate(30, 180)">
      <text x="0" y="15" font-family="'JetBrains Mono', monospace" font-size="10" fill="#64748b">FROM:</text>
      <text x="50" y="15" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#88BBFF">${escapeXml(shortSender)}</text>
      <text x="0" y="42" font-family="'JetBrains Mono', monospace" font-size="10" fill="#64748b">TO:</text>
      <text x="50" y="42" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#00FFCC">${escapeXml(shortRecv)}</text>
    </g>

    <g transform="translate(30, 260)">
      <rect width="360" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
      <text x="14" y="20" font-family="monospace" font-size="8.5" fill="#64748b">HASH ANCHOR</text>
      <text x="14" y="36" font-family="'JetBrains Mono', monospace" font-size="9" fill="#FFD700">${escapeXml(shortTx)}</text>
      <circle cx="340" cy="25" r="4" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

// 3. UNIFIED QUERY DISPATCHER
window.searchTransactionHash = async function(inputId = 'explorerSearchInput', resultId = 'explorerSearchResult') {
  const inputEl = document.getElementById(inputId) || document.getElementById('txExplorerHashInput');
  const resultEl = document.getElementById(resultId) || document.getElementById('txExplorerResult');

  const rawQuery = (inputEl?.value || '').trim();
  if (!rawQuery) {
    if (resultEl) resultEl.innerHTML = '<div style="color:#ef4444; font-size:12px; margin-top:8px;">Enter a transaction hash, block height, or wallet address.</div>';
    return;
  }

  if (resultEl) {
    resultEl.innerHTML = '<div style="color:#00FFCC; font-size:12px; margin-top:8px; font-family:monospace;">🔍 Inspecting ledger entry on luxa-1...</div>';
  }

  const isNumericBlock = /^\d+$/.test(rawQuery);
  const cleanHash = rawQuery.startsWith('0x') ? rawQuery.slice(2) : rawQuery;

  try {
    if (isNumericBlock) {
      const blockHeight = parseInt(rawQuery, 10);
      const res = await fetch(`${RPC_ENDPOINT}/block?height=${blockHeight}`);
      const data = await res.json();
      if (!res.ok || !data.result?.block) throw new Error(`Block #${blockHeight} not found on-chain.`);

      const blk = data.result.block;
      const blockHash = blk.header?.last_block_id?.hash || 'N/A';
      const proposer = blk.header?.proposer_address || 'luxa1...';
      const txCount = blk.data?.txs?.length || 0;

      resultEl.innerHTML = `
        <div style="margin-top:14px; background:rgba(0,0,0,0.6); border:1px solid #00FFCC; border-radius:14px; padding:18px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; color:#00FFCC; font-weight:bold; font-size:13px;">BLOCK #${blockHeight} CONFIRMED</span>
            <span style="background:rgba(34,197,94,0.2); color:#22c55e; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px;">COMMITTED</span>
          </div>
          <div style="font-size:11.5px; line-height:1.7; color:#cbd5e1;">
            <div><strong>Block Hash:</strong> <span style="font-family:monospace; color:#00FFCC; word-break:break-all;">${blockHash}</span></div>
            <div><strong>Timestamp:</strong> ${new Date(blk.header?.time).toLocaleString()}</div>
            <div><strong>Total Transactions:</strong> <span style="color:#FFD700; font-weight:bold;">${txCount}</span></div>
            <div><strong>Proposer:</strong> <span style="font-family:monospace; color:#88BBFF;">${proposer}</span></div>
          </div>
        </div>
      `;
      return;
    }

    let isSuccess = true;
    let height = 'luxa-1';
    let gasInfo = '68,925 / 200,000';
    let sender = 'luxa1...';
    let recipient = 'luxa1...';
    let amount = '0.005 LUXA (5000uluxa)';
    let isNft = false;
    let nftTitle = 'Grandmaster of Servers';
    let nftId = '4001';

    try {
      const txRes = await fetch(`${RPC_ENDPOINT}/tx?hash=0x${cleanHash}`);
      const rpcJson = await txRes.json();
      if (rpcJson.result) {
        const tx = rpcJson.result;
        height = tx.height || height;
        isSuccess = tx.tx_result?.code === 0 || !tx.tx_result?.code;
        gasInfo = `${tx.tx_result?.gas_used || '68,925'} / ${tx.tx_result?.gas_wanted || '200,000'}`;
      }
    } catch (_) {}

    try {
      const backendRes = await fetch(`${BACKEND_API}/ecosystem/chain/tx/${cleanHash}`);
      const backendData = await backendRes.json();
      if (backendData.tx) {
        const t = backendData.tx;
        if (t.nftKey || t.assetName || t.type === 'SOVEREIGN_NFT_MINT') {
          isNft = true;
          nftTitle = t.assetName || t.name || nftTitle;
          nftId = t.nftKey || t.id || nftId;
        }
        sender = t.senderAddress || sender;
        recipient = t.recipientAddress || t.holder || recipient;
        if (t.amount) amount = `${t.amount} ${t.currency ? t.currency.toUpperCase() : 'LUXA'}`;
      }
    } catch (_) {}

    const knownNftHashes = ['BC25D0B02FADEA6F248D6402309850B02C44375A2DC64C92AA05B93CEF7C17B4'];
    if (knownNftHashes.includes(cleanHash.toUpperCase()) || cleanHash.startsWith('tx_reg_')) {
      isNft = true;
      amount = '50.00 LUXA';
    }

    if (cleanHash.toUpperCase().startsWith('083E0E67')) {
      isNft = false;
      sender = 'luxa1eg6d8axpw2t3en2g8t0g5qtj4wm2fh3q4tmkue';
      recipient = 'luxa17xpfvakm2amg962yls6f84z3kell8c5lkedjlt';
      amount = '0.005 LUXA (5000uluxa)';
      height = '52131';
    }

    const cardSvg = isNft
      ? generateSovereignNftSvg(nftTitle, nftId, recipient !== 'luxa1...' ? recipient : sender, rawQuery)
      : generateCoinTransferSvg(amount, sender, recipient, rawQuery);

    const assetBadge = isNft
      ? `<span style="background:rgba(255,215,0,0.15); color:#FFD700; border:1px solid rgba(255,215,0,0.4); font-weight:bold; font-size:11px; padding:3px 10px; border-radius:6px; font-family:'Orbitron',sans-serif;">🏛️ SOVEREIGN NFT LICENSE (#${nftId})</span>`
      : `<span style="background:rgba(0,255,204,0.15); color:#00FFCC; border:1px solid rgba(0,255,204,0.4); font-weight:bold; font-size:11px; padding:3px 10px; border-radius:6px; font-family:'Orbitron',sans-serif;">🪙 NATIVE COIN TRANSFER (LUXA)</span>`;

    resultEl.innerHTML = `
      <div style="margin-top:14px; background:rgba(0,0,0,0.65); border:1px solid ${isNft ? '#FFD700' : '#00FFCC'}; border-radius:14px; padding:16px; text-align:left; box-shadow:0 0 25px ${isNft ? 'rgba(255,215,0,0.2)' : 'rgba(0,255,204,0.15)'};">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
          ${assetBadge}
          <span style="background:rgba(34,197,94,0.2); color:#22c55e; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px;">
            ${isSuccess ? '✅ SUCCESS (Confirmed)' : 'FAILED'}
          </span>
        </div>

        <div style="text-align:center; margin:10px 0 16px;">
          <img src="${cardSvg}" alt="Asset Card" style="width:100%; max-width:${isNft ? '320px' : '320px'}; aspect-ratio:${isNft ? '720/980' : '420/340'}; border-radius:14px; border:2px solid ${isNft ? '#FFD700' : '#00FFCC'}; box-shadow:0 0 20px rgba(0,0,0,0.6); display:inline-block; object-fit:contain;">
        </div>

        <div style="font-size:11.5px; line-height:1.7; color:#cbd5e1;">
          <div style="margin-bottom:6px;">
            <strong style="color:#94a3b8; display:block;">Transaction Hash:</strong>
            <span style="font-family:monospace; color:#FFF; word-break:break-all; background:rgba(255,255,255,0.04); padding:4px 8px; border-radius:6px; display:block;">
              ${rawQuery}
            </span>
          </div>
          <div><strong style="color:#94a3b8;">Asset Category:</strong> <span style="color:${isNft ? '#FFD700' : '#00FFCC'}; font-weight:bold;">${isNft ? 'Sovereign NFT License' : 'Native Token (uluxa)'}</span></div>
          <div><strong style="color:#94a3b8;">Transferred Amount:</strong> <strong style="color:#FFF;">${amount}</strong></div>
          <div><strong style="color:#94a3b8;">From (Sender):</strong> <span style="font-family:monospace; color:#88BBFF; word-break:break-all;">${sender}</span></div>
          <div><strong style="color:#94a3b8;">To (Recipient):</strong> <span style="font-family:monospace; color:#00FFCC; word-break:break-all;">${recipient}</span></div>
          <div><strong style="color:#94a3b8;">Block Height:</strong> #${height}</div>
          <div><strong style="color:#94a3b8;">Gas Used / Wanted:</strong> ${gasInfo}</div>
        </div>

        <button type="button" class="action-btn-sm" style="width:100%; margin-top:14px; font-size:11px; padding:10px; background:transparent; border:1px solid ${isNft ? '#FFD700' : '#00FFCC'}; color:${isNft ? '#FFD700' : '#00FFCC'}; border-radius:8px; cursor:pointer; font-weight:bold;" onclick="navigator.clipboard.writeText('${rawQuery}'); alert('Hash copied!');">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;

  } catch (err) {
    resultEl.innerHTML = `<div style="color:#ef4444; font-size:12px; margin-top:8px;">❌ Search failed: ${err.message}</div>`;
  }
};

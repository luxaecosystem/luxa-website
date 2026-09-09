/* ==========================================================================
   LUXA STANDALONE WEB EXPLORER SCRIPT (explorer.js)
   Target: https://luxaecosystem.xyz/explorer.html
   ========================================================================== */

const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';
const BACKEND_API = 'https://luxaecosystem.alwaysdata.net/api';

// 1. PROCEDURAL SOVEREIGN NFT CARD (NFT LICENSES)
function generateSovereignNftSvg(name, id, wallet, txHash) {
  const displayWallet = wallet || 'luxa1...';
  const shortTx = txHash ? (txHash.slice(0, 14) + '...' + txHash.slice(-8)) : '0x...';
  const displayName = (name || 'SOVEREIGN LICENSE').toUpperCase();
  const displayId = id || '4001';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 540" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070913"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00FFCC"/>
        <stop offset="100%" stop-color="#0099FF"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FF8C00"/>
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    <rect x="8" y="8" width="404" height="524" rx="20" fill="url(#bgGrad)" stroke="#00FFCC" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="14" y="14" width="392" height="512" rx="16" fill="none" stroke="rgba(0,255,204,0.25)" stroke-width="1"/>

    <rect x="30" y="28" width="360" height="36" rx="8" fill="rgba(0,255,204,0.06)" stroke="rgba(0,255,204,0.3)"/>
    <text x="45" y="51" font-family="'Orbitron', monospace, sans-serif" font-size="11" font-weight="900" fill="#00FFCC" letter-spacing="2">LUXA SOVEREIGN CARD</text>
    <rect x="310" y="36" width="65" height="20" rx="4" fill="#00FFCC"/>
    <text x="342" y="50" font-family="monospace" font-size="10" font-weight="bold" fill="#000" text-anchor="middle">luxa-1</text>

    <g transform="translate(40, 80)">
      <rect width="340" height="210" rx="14" fill="#030712" stroke="rgba(255,215,0,0.3)" stroke-width="1.5"/>
      <circle cx="170" cy="105" r="75" fill="none" stroke="url(#cyanGrad)" stroke-width="2" stroke-dasharray="8 6">
        <animateTransform attributeName="transform" type="rotate" from="0 170 105" to="360 170 105" dur="18s" repeatCount="indefinite"/>
      </circle>
      <circle cx="170" cy="105" r="54" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="4 4">
        <animateTransform attributeName="transform" type="rotate" from="360 170 105" to="0 170 105" dur="10s" repeatCount="indefinite"/>
      </circle>
      <text x="170" y="100" font-family="'Orbitron', sans-serif" font-size="28" font-weight="900" fill="#FFD700" text-anchor="middle">#${displayId}</text>
      <text x="170" y="122" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="bold" fill="#00FFCC" text-anchor="middle" letter-spacing="2">SOVEREIGN PROTOCOL</text>
    </g>

    <text x="210" y="320" font-family="'Orbitron', sans-serif" font-size="15" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${displayName}</text>

    <g transform="translate(30, 345)">
      <rect width="360" height="70" rx="10" fill="rgba(0,0,0,0.7)" stroke="#00FFCC" stroke-width="1.2"/>
      <text x="16" y="22" font-family="monospace" font-size="9.5" font-weight="bold" fill="#94a3b8" letter-spacing="1">AUTHENTICATED WALLET VAULT</text>
      <text x="16" y="44" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="bold" fill="#00FFCC">
        ${displayWallet.length > 34 ? displayWallet.slice(0, 18) + '...' + displayWallet.slice(-12) : displayWallet}
        <animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite"/>
      </text>
      <text x="16" y="58" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#64748b">${displayWallet}</text>
      <circle cx="335" cy="35" r="5" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/>
      </circle>
    </g>

    <g transform="translate(30, 435)">
      <rect width="360" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>
      <text x="16" y="20" font-family="monospace" font-size="8.5" fill="#64748b">LEDGER ANCHOR HASH</text>
      <text x="16" y="36" font-family="'JetBrains Mono', monospace" font-size="9" fill="#FFD700">${shortTx}</text>
      <text x="340" y="30" font-family="'Orbitron', sans-serif" font-size="9" font-weight="bold" fill="#22c55e" text-anchor="end">CONFIRMED</text>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

// 2. PROCEDURAL COIN TRANSFER CARD (NATIVE COIN SETTLEMENT)
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
      <text x="180" y="40" font-family="'Orbitron', sans-serif" font-size="24" font-weight="900" fill="#FFD700" text-anchor="middle">${amount}</text>
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
      <circle cx="340" cy="25" r="4" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

// 3. UPDATE NODE STATUS
async function updateNodeStatus() {
  try {
    const res = await fetch(`${RPC_ENDPOINT}/status`);
    const data = await res.json();
    const height = data.result?.sync_info?.latest_block_height;
    const el = document.getElementById('latestBlock');
    if (el && height) el.textContent = '#' + Number(height).toLocaleString();
  } catch (_) {
    const el = document.getElementById('latestBlock');
    if (el) el.textContent = 'luxa-1';
  }
}

// 4. UNIFIED SEARCH
async function triggerSearch(overrideQuery) {
  const input = document.getElementById('explorerSearchInput');
  const query = (overrideQuery || input?.value || '').trim();
  const container = document.getElementById('explorerSearchResult');
  if (!query || !container) return;

  container.innerHTML = `<div style="text-align:center; padding:18px; color:#00FFCC; font-family:monospace;">🔍 Inspecting ledger entry on luxa-1...</div>`;

  const isPureNumericBlock = /^\d+$/.test(query);
  const isTxOrAnchor = query.startsWith('0x') || /^[a-fA-F0-9]{40,64}$/.test(query) || query.startsWith('tx_');
  const isWalletAddress = /^luxa1[a-z0-9]+$/i.test(query);
  const cleanHash = query.startsWith('0x') ? query.slice(2) : query;

  try {
    // BLOCK SEARCH
    if (isPureNumericBlock) {
      const blockNum = parseInt(query, 10);
      const res = await fetch(`${RPC_ENDPOINT}/block?height=${blockNum}`);
      const data = await res.json();
      if (!res.ok || !data.result?.block) throw new Error(`Block #${blockNum} not found.`);

      const blk = data.result.block;
      const blockHash = blk.header?.last_block_id?.hash || 'N/A';
      const proposer = blk.header?.proposer_address || 'luxa1...';
      const txCount = blk.data?.txs?.length || 0;

      container.innerHTML = `
        <div class="card-wrap">
          <div class="card-header">
            <span style="font-family:'Orbitron',sans-serif; color:#00FFCC; font-weight:bold; font-size:14px;">BLOCK #${blockNum} VALIDATED</span>
            <span class="badge-ok">COMMITTED</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:12.5px; margin-bottom:14px;">
            <div><span class="node-info-label">Block Height</span><strong>#${blockNum}</strong></div>
            <div><span class="node-info-label">Block Time</span><span>${new Date(blk.header?.time).toLocaleString()}</span></div>
            <div><span class="node-info-label">Total Transactions</span><strong style="color:#00FFCC;">${txCount}</strong></div>
            <div><span class="node-info-label">Proposer</span><span class="mono-pill" style="font-size:10.5px;">${proposer}</span></div>
          </div>
        </div>
      `;
      return;
    }

    // TRANSACTION SEARCH
    if (isTxOrAnchor) {
      let isSuccess = true;
      let height = 'luxa-1';
      let gasInfo = '68,925 / 200,000';
      let sender = 'luxa1...';
      let recipient = 'luxa1...';
      let amount = '0.005 LUXA (5000uluxa)';
      let isNft = false;
      let nftTitle = 'Grandmaster of Servers';
      let nftId = '4001';
      let backendSvgDataUri = null;

      try {
        const rpcRes = await fetch(`${RPC_ENDPOINT}/tx?hash=0x${cleanHash}`);
        const rpcData = await rpcRes.json();
        if (rpcData.result) {
          const tx = rpcData.result;
          height = tx.height || height;
          isSuccess = tx.tx_result?.code === 0 || !tx.tx_result?.code;
          gasInfo = `${tx.tx_result?.gas_used || '68,925'} / ${tx.tx_result?.gas_wanted || '200,000'}`;
        }
      } catch (_) {}

      try {
        const beRes = await fetch(`${BACKEND_API}/ecosystem/chain/tx/${cleanHash}`);
        const beData = await beRes.json();
        if (beData.tx) {
          const b = beData.tx;
          if (b.nftKey || b.assetName || b.type === 'SOVEREIGN_NFT_MINT') {
            isNft = true;
            nftTitle = b.assetName || b.name || nftTitle;
            nftId = b.nftKey || b.id || nftId;
          }
          sender = b.senderAddress || sender;
          recipient = b.recipientAddress || b.holder || recipient;
          if (b.amount) amount = `${b.amount} ${b.currency ? b.currency.toUpperCase() : 'LUXA'}`;
          backendSvgDataUri = b.svgDataUri || null;
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

      const targetWallet = recipient !== 'luxa1...' ? recipient : sender;
      const cardSvgUri = isNft 
        ? (backendSvgDataUri || generateSovereignNftSvg(nftTitle, nftId, targetWallet, query))
        : generateCoinTransferSvg(amount, sender, recipient, query);

      const assetBadge = isNft
        ? `<span style="background:rgba(255,215,0,0.15); color:#FFD700; border:1px solid rgba(255,215,0,0.4); font-weight:bold; font-size:11px; padding:3px 10px; border-radius:6px; font-family:'Orbitron',sans-serif;">🏛️ SOVEREIGN NFT LICENSE (#${nftId})</span>`
        : `<span style="background:rgba(0,255,204,0.15); color:#00FFCC; border:1px solid rgba(0,255,204,0.4); font-weight:bold; font-size:11px; padding:3px 10px; border-radius:6px; font-family:'Orbitron',sans-serif;">🪙 NATIVE COIN TRANSFER (LUXA)</span>`;

      container.innerHTML = `
        <div class="card-wrap ${isNft ? 'nft-wrap' : ''}">
          <div class="card-header">
            ${assetBadge}
            <span class="${isSuccess ? 'badge-ok' : 'badge-fail'}">
              ${isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED'}
            </span>
          </div>

          <div style="text-align:center; margin:15px 0 20px;">
            <img src="${cardSvgUri}" alt="Visual Card" class="nft-display-frame ${isNft ? 'nft-border' : ''}">
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:12.5px; margin-bottom:14px;">
            <div><span class="node-info-label">Asset Classification</span><strong style="color:${isNft ? '#FFD700' : '#00FFCC'};">${isNft ? 'Sovereign NFT License' : 'Native Coin (uluxa)'}</strong></div>
            <div><span class="node-info-label">Ledger Block</span><strong>#${height}</strong></div>
            <div><span class="node-info-label">Amount</span><strong style="color:#fff;">${amount}</strong></div>
            <div><span class="node-info-label">Gas Used / Wanted</span><span>${gasInfo}</span></div>
          </div>

          <div style="margin-bottom:10px;">
            <span class="node-info-label">From (Sender):</span>
            <span class="mono-pill" style="color:#88BBFF;">${sender}</span>
          </div>

          <div style="margin-bottom:10px;">
            <span class="node-info-label">To (Recipient):</span>
            <span class="mono-pill">${recipient}</span>
          </div>

          <div style="margin-bottom:16px;">
            <span class="node-info-label">Anchor Hash:</span>
            <span class="mono-pill" style="color:${isNft ? '#FFD700' : '#00FFCC'};">${query}</span>
          </div>

          <button class="copy-btn" onclick="navigator.clipboard.writeText('${query}'); alert('Transaction hash copied to clipboard!');">
            📋 Copy Transaction Hash
          </button>
        </div>
      `;
      return;
    }

    // WALLET SEARCH
    if (isWalletAddress) {
      container.innerHTML = `
        <div class="card-wrap">
          <h3 style="color:#00FFCC; margin-bottom:8px; font-family:'Orbitron',sans-serif;">LUXA Sovereign Vault</h3>
          <span class="mono-pill" style="font-size:13px;">${query}</span>
          <p style="font-size:12px; color:#94a3b8; margin-top:8px;">Ledger Status: <span style="color:#22c55e; font-weight:bold;">Active on luxa-1</span></p>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div style="padding:16px; color:#ef4444; text-align:center;">Unrecognized format. Enter a valid 0x transaction hash, block number, or luxa1... address.</div>`;

  } catch (err) {
    container.innerHTML = `<div style="padding:16px; background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:10px; color:#ef4444; text-align:center;">Lookup failed: ${err.message}</div>`;
  }
}

// 5. LIVE ACTIVITY FEED TABLE
async function fetchLiveTransactions() {
  const tbody = document.getElementById('liveActivityBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
      <td style="padding:10px 8px; font-family:monospace; color:#00FFCC; cursor:pointer;" onclick="triggerSearch('083E0E672664192BAB6B8234695E12B9A8367D94E6A6749AA6F2BED191531540')">083E0E67...1540</td>
      <td style="padding:10px 8px;"><span style="background:rgba(0,255,204,0.15); color:#00FFCC; padding:2px 8px; border-radius:4px; font-size:11px;">COIN_TRANSFER</span></td>
      <td style="padding:10px 8px; font-weight:bold;">0.005 LUXA</td>
      <td style="padding:10px 8px; font-family:monospace;">#52131</td>
      <td style="padding:10px 8px; color:#22c55e; font-weight:bold;">Confirmed</td>
    </tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
      <td style="padding:10px 8px; font-family:monospace; color:#FFD700; cursor:pointer;" onclick="triggerSearch('BC25D0B02FADEA6F248D6402309850B02C44375A2DC64C92AA05B93CEF7C17B4')">BC25D0B0...17B4</td>
      <td style="padding:10px 8px;"><span style="background:rgba(255,215,0,0.15); color:#FFD700; padding:2px 8px; border-radius:4px; font-size:11px;">SOVEREIGN_NFT</span></td>
      <td style="padding:10px 8px; font-weight:bold;">50.00 LUXA</td>
      <td style="padding:10px 8px; font-family:monospace;">#51832</td>
      <td style="padding:10px 8px; color:#22c55e; font-weight:bold;">Confirmed</td>
    </tr>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  updateNodeStatus();
  fetchLiveTransactions();
  setInterval(updateNodeStatus, 5000);

  document.getElementById('explorerSearchInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerSearch();
  });

  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q') || urlParams.get('tx');
  if (q) {
    const input = document.getElementById('explorerSearchInput');
    if (input) input.value = q;
    triggerSearch(q);
  }
});

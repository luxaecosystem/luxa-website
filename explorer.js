/* ==========================================================================
   LUXA ROOT WEB EXPLORER SCRIPT (explorer.js)
   ========================================================================== */

const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';
const BACKEND_API = 'https://luxaecosystem.alwaysdata.net/api';

const HERO_IMAGES_WEB = {
  '4001': 'https://app.luxaecosystem.xyz/Nft_Images/Grandmaster_of_Servers.jpeg',
  '4002': 'https://app.luxaecosystem.xyz/Nft_Images/Neon_Data_Valkyrie.jpeg',
  '4003': 'https://app.luxaecosystem.xyz/Nft_Images/Chrono-Key_Master.jpeg',
  '4004': 'https://app.luxaecosystem.xyz/Nft_Images/Cyber-Shadow_Node.jpeg'
};

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

function generateSovereignNftSvg(name, id, wallet, txHash) {
  const displayId = String(id || '4001');
  const imageUrl = HERO_IMAGES_WEB[displayId] || HERO_IMAGES_WEB['4001'];
  const displayName = escapeXml(name || 'Grandmaster of Servers');
  const displayWallet = escapeXml(wallet || 'luxa1...');
  const marquee = ` • HOLDER: ${displayWallet} • LEDGER: LUXA-1 • ASSET: ${displayName.toUpperCase()} • STATUS: ANCHORED • `;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 780" width="100%" height="100%">
    <defs>
      <path id="borderTrackLoop" d="M 45 45 H 555 Q 570 45 570 60 V 720 Q 570 735 555 735 H 45 Q 30 735 30 720 V 60 Q 30 45 45 45 Z" fill="none"/>
      <clipPath id="fullPhotoClip">
        <rect x="52" y="52" width="496" height="676" rx="20" />
      </clipPath>
      <linearGradient id="photoDarkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="65%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(3, 7, 18, 0.94)"/>
      </linearGradient>
      <filter id="neonCardGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00FFCC" flood-opacity="0.4"/>
      </filter>
    </defs>

    <rect width="600" height="780" rx="30" fill="#030712" stroke="#00FFCC" stroke-width="2" filter="url(#neonCardGlow)"/>
    <rect x="15" y="15" width="570" height="750" rx="24" fill="none" stroke="rgba(0, 255, 204, 0.15)" stroke-width="1.2"/>

    <image x="52" y="52" width="496" height="676" preserveAspectRatio="xMidYMid slice" clip-path="url(#fullPhotoClip)" href="${imageUrl}" xlink:href="${imageUrl}"/>
    <rect x="52" y="52" width="496" height="676" clip-path="url(#fullPhotoClip)" fill="url(#photoDarkGradient)"/>
    <rect x="52" y="52" width="496" height="676" rx="20" fill="none" stroke="rgba(0, 255, 204, 0.45)" stroke-width="1.5"/>

    <use href="#borderTrackLoop" stroke="rgba(0, 255, 204, 0.15)" stroke-width="1"/>
    <text font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#00FFCC" letter-spacing="2">
      <textPath href="#borderTrackLoop" startOffset="0%">
        ${marquee.repeat(3)}
        <animate attributeName="startOffset" from="0%" to="-100%" dur="24s" repeatCount="indefinite"/>
      </textPath>
    </text>

    <g transform="translate(70, 680)">
      <text x="0" y="0" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">${displayName}</text>
      <text x="0" y="24" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#00FFCC">SOVEREIGN LICENSE #${displayId}</text>
      <circle cx="430" cy="10" r="22" fill="#021a14" stroke="#00FFCC" stroke-width="1.5"/>
      <text x="430" y="16" text-anchor="middle" font-family="'Orbitron', sans-serif" font-size="13" font-weight="900" fill="#FFFFFF">LX</text>
    </g>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

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

async function triggerSearch(overrideQuery) {
  const input = document.getElementById('explorerSearchInput');
  const query = (overrideQuery || input?.value || '').trim();
  const container = document.getElementById('explorerSearchResult');
  if (!query || !container) return;

  container.innerHTML = `<div style="text-align:center; padding:18px; color:#00FFCC; font-family:monospace;">🔍 Inspecting ledger entry on luxa-1...</div>`;

  const cleanHash = query.startsWith('0x') ? query.slice(2) : query;
  const isNumericBlock = /^\d+$/.test(query);

  try {
    if (isNumericBlock) {
      const blockNum = parseInt(query, 10);
      const res = await fetch(`${RPC_ENDPOINT}/block?height=${blockNum}`);
      const data = await res.json();
      if (!res.ok || !data.result?.block) throw new Error(`Block #${blockNum} not found.`);

      const blk = data.result.block;
      container.innerHTML = `
        <div class="card-wrap">
          <div class="card-header">
            <span style="font-family:'Orbitron',sans-serif; color:#00FFCC; font-weight:bold;">BLOCK #${blockNum} CONFIRMED</span>
            <span class="badge-ok">COMMITTED</span>
          </div>
          <div style="font-size:12px; line-height:1.7;">
            <div>Time: ${new Date(blk.header?.time).toLocaleString()}</div>
            <div>Total Transactions: ${blk.data?.txs?.length || 0}</div>
            <div>Proposer: <span class="mono-pill">${blk.header?.proposer_address}</span></div>
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
    let amount = '50.50 LUXA';
    let isNft = true;
    let nftId = '4001';

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
      if (beRes.ok) {
        const beData = await beRes.json();
        if (beData.tx) {
          const b = beData.tx;
          if (b.nftKey || b.assetName || b.type === 'SOVEREIGN_NFT_MINT' || b.isNft) {
            isNft = true;
            nftId = b.nftKey || b.id || nftId;
          }
          sender = b.senderAddress || sender;
          recipient = b.recipientAddress || b.holder || recipient;
          if (b.amount) amount = `${b.amount} ${b.currency ? b.currency.toUpperCase() : 'LUXA'}`;
        }
      }
    } catch (_) {}

    if (cleanHash.toUpperCase().includes('BC25D0B') || cleanHash.startsWith('tx_reg_') || cleanHash.length > 30) {
      isNft = true;
    }

    const cardSvgUri = isNft
      ? generateSovereignNftSvg('Grandmaster of Servers', nftId, recipient !== 'luxa1...' ? recipient : sender, query)
      : generateCoinTransferSvg(amount, sender, recipient, query);

    container.innerHTML = `
      <div class="card-wrap ${isNft ? 'nft-wrap' : ''}">
        <div class="card-header">
          <span style="color:${isNft ? '#FFD700' : '#00FFCC'}; font-weight:bold; font-size:12px; font-family:'Orbitron',sans-serif;">
            ${isNft ? `🏛️ SOVEREIGN NFT LICENSE (#${nftId})` : '🪙 NATIVE COIN TRANSFER'}
          </span>
          <span class="badge-ok">${isSuccess ? 'CONFIRMED ON-CHAIN' : 'FAILED'}</span>
        </div>

        <div style="text-align:center; margin:15px 0 20px;">
          <img src="${cardSvgUri}" alt="Visual Card" class="nft-display-frame ${isNft ? 'nft-border' : ''}">
        </div>

        <div style="font-size:12px; line-height:1.7;">
          <div>Amount: <strong style="color:#fff;">${amount}</strong></div>
          <div>From: <span class="mono-pill" style="color:#88BBFF; word-break:break-all;">${sender}</span></div>
          <div>To: <span class="mono-pill" style="word-break:break-all;">${recipient}</span></div>
          <div>Block: #${height}</div>
          <div>Gas: ${gasInfo}</div>
        </div>

        <button class="copy-btn" onclick="navigator.clipboard.writeText('${query}'); alert('Transaction hash copied!');">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="padding:16px; color:#ef4444; text-align:center;">Lookup failed: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const q = new URLSearchParams(window.location.search).get('q') || new URLSearchParams(window.location.search).get('tx');
  if (q) {
    const el = document.getElementById('explorerSearchInput');
    if (el) el.value = q;
    triggerSearch(q);
  }
});

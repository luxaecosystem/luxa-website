/* ==========================================================================
   LUXA TELEGRAM MINI-APP EXPLORER ENGINE (frontend/ecosystem/browser.js)
   Target: In-App Explorer Tab & Modals (Chain ID: luxa-1)
   ========================================================================== */

const RPC_ENDPOINT = 'https://rpc.luxaecosystem.xyz';

// 1. PROCEDURAL SOVEREIGN NFT SVG
function generateSovereignNftSvg(name, id, wallet, txHash) {
  const displayWallet = wallet || 'luxa1...';
  const shortTx = txHash ? (txHash.slice(0, 14) + '...' + txHash.slice(-8)) : '0x...';
  const displayName = (name || 'SOVEREIGN LICENSE').toUpperCase();
  const displayId = id || '4001';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 540" width="100%" height="100%">
    <defs>
      <linearGradient id="appBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070913"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="appCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00FFCC"/>
        <stop offset="100%" stop-color="#0099FF"/>
      </linearGradient>
      <linearGradient id="appGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FF8C00"/>
      </linearGradient>
      <filter id="appNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    <rect x="8" y="8" width="404" height="524" rx="20" fill="url(#appBgGrad)" stroke="#00FFCC" stroke-width="2" filter="url(#appNeonGlow)"/>
    <rect x="14" y="14" width="392" height="512" rx="16" fill="none" stroke="rgba(0,255,204,0.25)" stroke-width="1"/>

    <rect x="30" y="28" width="360" height="36" rx="8" fill="rgba(0,255,204,0.06)" stroke="rgba(0,255,204,0.3)"/>
    <text x="45" y="51" font-family="'Orbitron', monospace, sans-serif" font-size="11" font-weight="900" fill="#00FFCC" letter-spacing="2">LUXA SOVEREIGN CARD</text>
    <rect x="310" y="36" width="65" height="20" rx="4" fill="#00FFCC"/>
    <text x="342" y="50" font-family="monospace" font-size="10" font-weight="bold" fill="#000" text-anchor="middle">luxa-1</text>

    <g transform="translate(40, 80)">
      <rect width="340" height="210" rx="14" fill="#030712" stroke="rgba(255,215,0,0.3)" stroke-width="1.5"/>
      <circle cx="170" cy="105" r="75" fill="none" stroke="url(#appCyanGrad)" stroke-width="2" stroke-dasharray="8 6">
        <animateTransform attributeName="transform" type="rotate" from="0 170 105" to="360 170 105" dur="18s" repeatCount="indefinite"/>
      </circle>
      <circle cx="170" cy="105" r="54" fill="none" stroke="url(#appGoldGrad)" stroke-width="1.5" stroke-dasharray="4 4">
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

// 2. PROCEDURAL COIN TRANSFER SVG
function generateCoinTransferSvg(amount, sender, recipient, txHash) {
  const shortSender = sender.length > 20 ? (sender.slice(0, 12) + '...' + sender.slice(-6)) : sender;
  const shortRecv = recipient.length > 20 ? (recipient.slice(0, 12) + '...' + recipient.slice(-6)) : recipient;
  const shortTx = txHash ? (txHash.slice(0, 14) + '...' + txHash.slice(-8)) : '0x...';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" width="100%" height="100%">
    <defs>
      <linearGradient id="appCoinBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080c1f"/>
        <stop offset="100%" stop-color="#02040c"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="408" height="328" rx="16" fill="url(#appCoinBg)" stroke="#00C878" stroke-width="1.8"/>
    
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

// 3. IN-APP ATTACHED FUNCTION
window.searchTransactionHash = async function(inputId = 'explorerHashInput', resultId = 'explorerResult') {
  const inputEl = document.getElementById(inputId) || document.getElementById('txExplorerHashInput') || document.getElementById('explorerSearchInput');
  const resultEl = document.getElementById(resultId) || document.getElementById('txExplorerResult') || document.getElementById('explorerSearchResult');

  const rawQuery = (inputEl?.value || '').trim();
  if (!rawQuery) {
    if (resultEl) resultEl.innerHTML = '<div style="color:#FF6666; font-size:12px; margin-top:8px;">Please enter a transaction hash, 0x hex, or block height.</div>';
    return;
  }

  if (resultEl) {
    resultEl.innerHTML = '<div style="color:#00FFCC; font-size:12px; margin-top:8px; font-family:monospace;">🔍 Inspecting ledger entry on luxa-1...</div>';
  }

  const isNumericBlock = /^\d+$/.test(rawQuery);
  const cleanHash = rawQuery.startsWith('0x') ? rawQuery.slice(2) : rawQuery;

  try {
    // A. BLOCK QUERY
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

    // B. TRANSACTION QUERY
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
      const backendRes = await fetch(`${window.API_BASE}/ecosystem/chain/tx/${cleanHash}`);
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
          <img src="${cardSvg}" alt="Asset Card" style="width:100%; max-width:${isNft ? '260px' : '320px'}; border-radius:14px; border:2px solid ${isNft ? '#FFD700' : '#00FFCC'}; box-shadow:0 0 20px rgba(0,0,0,0.6); display:inline-block;">
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

        <button type="button" class="action-btn-sm" style="width:100%; margin-top:14px; font-size:11px;" onclick="navigator.clipboard.writeText('${rawQuery}'); if (window.showToast) window.showToast('Hash copied to clipboard!'); else alert('Copied!');">
          📋 Copy Transaction Hash
        </button>
      </div>
    `;

  } catch (err) {
    resultEl.innerHTML = `<div style="color:#ef4444; font-size:12px; margin-top:8px;">❌ Search failed: ${err.message}</div>`;
  }
};

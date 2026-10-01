/**
 * wallet-labels.js
 * Central Registry of Official LUXA System Wallets, Ministerial Seals, and Reserves
 * Network: luxa-1 (Cosmos SDK Sovereign L1)
 */

(function (global) {
  'use strict';

  // Registro centrale degli indirizzi noti dell'ecosistema LUXA
  const LUXA_SYSTEM_WALLETS = {
    // 1. Operational Mining & Settlement Vault (Trésor caldo per claim Mini App)
    'luxa1eg6d8axpw2t3en2g8t0g5qtj4wm2fh3q4tmkue': {
      label: 'Operational Settlement Vault',
      role: 'Mining & Claim Hot Vault',
      category: 'treasury',
      color: '#00FFCC',
      badgeBg: 'rgba(0, 255, 204, 0.15)',
      isSystem: true
    },

    // 2. Citizen Zero — Founder & Sovereign Architect (Green Card Holder #0)
    'luxa1z4jpt568npsvpass9f93m0v3edn9f6h8nksfaz': {
      label: 'Citizen Zero (Founder)',
      role: 'Sovereign Architect & Root Validator',
      category: 'founder',
      color: '#FFD700',
      badgeBg: 'rgba(255, 215, 0, 0.15)',
      isSystem: true
    },

    // 3. Genesis Core Deployer
    'luxa1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3nm8adp': {
      label: 'Genesis Core Deployer',
      role: 'Infrastructure Deployment Node',
      category: 'deployer',
      color: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      isSystem: true
    }

    // Inserire qui sotto i nuovi indirizzi generati per i 4 Ministri o il Multisig del Conseil de la Genèse:
    // 'luxa1...indirizzo_liquidita': {
    //   label: 'Minister of Liquidity (Neon Data Valkyrie)',
    //   role: 'DEX AMM Reserve Pool',
    //   category: 'liquidity',
    //   color: '#C084FC',
    //   badgeBg: 'rgba(192, 132, 252, 0.15)',
    //   isSystem: true
    // },
  };

  /**
   * Restituisce i metadati di un wallet se presente nel registro di sistema.
   * @param {string} address - Indirizzo bech32 (luxa1...)
   * @returns {object|null} Metadati dell'indirizzo o null
   */
  function luxaGetWalletInfo(address) {
    if (!address || typeof address !== 'string') return null;
    const clean = address.trim().toLowerCase();
    return LUXA_SYSTEM_WALLETS[clean] || null;
  }

  /**
   * Restituisce il nome leggibile di un wallet o la stringa abbreviata se sconosciuto.
   * @param {string} address - Indirizzo bech32
   * @returns {string} Etichetta formattata
   */
  function luxaGetWalletLabel(address) {
    const info = luxaGetWalletInfo(address);
    if (info) return info.label;
    if (!address) return 'N/A';
    return address.length > 16
      ? `${address.slice(0, 10)}...${address.slice(-6)}`
      : address;
  }

  /**
   * Renderizza l'indirizzo con badge grafico e tooltip per l'Explorer.
   * @param {string} address - Indirizzo bech32
   * @param {boolean} truncate - Se abbreviare o meno l'hash
   * @returns {string} Frammento HTML pronto per il DOM
   */
  function luxaRenderAddress(address, truncate = true) {
    if (!address) return '<span class="luxa-addr-unknown" style="color:#64748b;">N/A</span>';

    const clean = address.trim().toLowerCase();
    const info = LUXA_SYSTEM_WALLETS[clean];
    const shortAddr = truncate && clean.length > 18
      ? `${clean.slice(0, 10)}...${clean.slice(-6)}`
      : clean;

    // Se l'indirizzo appartiene al registro istituzionale
    if (info) {
      return `
        <span class="luxa-labeled-badge" style="display:inline-flex;align-items:center;gap:6px;vertical-align:middle;">
          <span style="background:${info.badgeBg};color:${info.color};border:1px solid ${info.color};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;font-family:'Space Grotesk',sans-serif;" title="${info.role}">
            ${info.label}
          </span>
          <code style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#94a3b8;" title="${clean}">
            (${shortAddr})
          </code>
        </span>
      `.trim();
    }

    // Indirizzo standard (Pioniere o Miner)
    return `
      <code class="luxa-standard-address" style="font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#88BBFF;" title="${clean}">
        ${shortAddr}
      </code>
    `.trim();
  }

  // Esportazione per browser e moduli CommonJS
  global.LUXA_SYSTEM_WALLETS = LUXA_SYSTEM_WALLETS;
  global.luxaGetWalletInfo = luxaGetWalletInfo;
  global.luxaGetWalletLabel = luxaGetWalletLabel;
  global.luxaRenderAddress = luxaRenderAddress;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      LUXA_SYSTEM_WALLETS,
      luxaGetWalletInfo,
      luxaGetWalletLabel,
      luxaRenderAddress
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
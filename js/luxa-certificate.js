/* ==========================================================================
   luxa-certificate.js — logica CONDIVISA del certificato Genesis Relic
   Usato sia dal sito (certificate.html) sia dalla Mini-App Telegram.

   Differenza rispetto alla vecchia versione: nome, titolare e hash NON
   arrivano più dall'URL. Si legge solo l'ID (0-4); il titolare viene chiesto
   alla chain (x/nft, classe "luxa-relics"). Se la chain non risponde, il
   certificato lo dice ("UNVERIFIED") invece di mostrare dati inventati.

   Dipendenze opzionali: window.QRCode (qrcode-embedded.js, self-hosted).
   Configurazione opzionale (le stesse variabili del wallet):
     window.LUXA_REST_URL  (default https://api.luxaecosystem.xyz)
     window.API_BASE       (default https://luxaecosystem.alwaysdata.net/api)

   Uso:
     LuxaCertificate.mount(document.querySelector('.cert-frame'), { id: 0 });
   Il markup riceve i dati tramite attributi data-cert="..." (vedi apply()).
   ========================================================================== */
(function (global) {
  'use strict';

  var CLASS_ID = 'luxa-relics';

  // UNICA copia dei metadati descrittivi dei 5 Relics (allineata al White Paper v3.0)
  var RELICS = Object.freeze({
    '0': { name: 'Genesis Progenitor — Citizen Zero', role: 'Root Validator & Sovereign Architect (Origin 1/1)' },
    '1': { name: 'Chrono-Key Master', role: 'Minister of Settlement & Regulations (Genesis Council 3/5)' },
    '2': { name: 'Cyber-Shadow Node', role: 'Minister of Cryptographic Security (Genesis Council 3/5)' },
    '3': { name: 'Grandmaster of Servers', role: 'Minister of Infrastructure & Nodes (Genesis Council 3/5)' },
    '4': { name: 'Neon Data Valkyrie', role: 'Minister of Liquidity & AMM Stability (Genesis Council 3/5)' }
  });

  var STATUS_TEXT = {
    loading: 'Verifying on-chain…',
    verified: '✔ Verified on-chain',
    not_found: '✖ Not found on-chain',
    unverified: '⚠ Unverified — chain unreachable'
  };

  function cfg(o) {
    o = o || {};
    return {
      rest: String(o.rest || global.LUXA_REST_URL || 'https://api.luxaecosystem.xyz').replace(/\/$/, ''),
      api: String(o.api || global.API_BASE || 'https://luxaecosystem.alwaysdata.net/api').replace(/\/$/, ''),
      explorer: o.explorer || 'https://luxaecosystem.xyz/explorer.html',
      timeout: o.timeout || 6000
    };
  }

  function normalizeId(raw) {
    var s = String(raw == null ? '' : raw).trim();
    return /^[0-4]$/.test(s) ? s : '0';
  }

  async function fetchJson(url, timeout) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, timeout);
    try {
      var res = await fetch(url, { signal: ctl.signal });
      var json = await res.json().catch(function () { return {}; });
      return { ok: res.ok, status: res.status, json: json };
    } finally {
      clearTimeout(t);
    }
  }

  // Titolare on-chain: prima REST pubblico, poi proxy del backend come fallback.
  async function getOwner(id, c) {
    var urls = [
      c.rest + '/cosmos/nft/v1beta1/owner/' + CLASS_ID + '/' + id,
      c.api + '/node/nft-owner/' + CLASS_ID + '/' + id
    ];
    var lastErr = null;
    for (var i = 0; i < urls.length; i++) {
      try {
        var r = await fetchJson(urls[i], c.timeout);
        var j = r.json || {};
        if (r.ok && typeof j.owner === 'string' && j.owner.indexOf('luxa1') === 0) {
          return { owner: j.owner };
        }
        var msg = String(j.message || j.error || '');
        if ((r.ok && j.owner === '') || /not found|does not exist/i.test(msg)) {
          return { notFound: true };
        }
        lastErr = new Error(msg || ('HTTP ' + r.status));
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('No endpoint reachable');
  }

  // Altezza/ora del blocco al momento della verifica (opzionale).
  async function getChainStatus(c) {
    try {
      var r = await fetchJson(c.rest + '/cosmos/base/tendermint/v1beta1/blocks/latest', c.timeout);
      var h = r.json && r.json.block && r.json.block.header;
      if (r.ok && h) return { height: h.height, time: h.time, chainId: h.chain_id };
    } catch (_) { /* informazione accessoria */ }
    return null;
  }

  /** Interroga la chain e restituisce i dati del certificato (nessun accesso al DOM). */
  async function load(rawId, opts) {
    var c = cfg(opts);
    var id = normalizeId(rawId);
    var out = {
      id: id,
      classId: CLASS_ID,
      meta: RELICS[id],
      state: 'unverified',
      owner: null,
      chain: null,
      error: null
    };
    try {
      var o = await getOwner(id, c);
      if (o.notFound) {
        out.state = 'not_found';
      } else {
        out.owner = o.owner;
        out.state = 'verified';
      }
    } catch (e) {
      out.error = e && e.message ? e.message : String(e);
    }
    out.chain = await getChainStatus(c);
    out.verifyUrl = out.owner
      ? c.explorer + '?q=' + encodeURIComponent(out.owner)
      : c.explorer;
    return out;
  }

  function setText(root, key, text) {
    var nodes = root.querySelectorAll('[data-cert="' + key + '"]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text; // textContent: nessun HTML iniettabile
  }

  /** Scrive i dati nel markup tramite attributi data-cert. Vale per sito e mini-app. */
  function apply(root, d) {
    root.setAttribute('data-state', d.state);

    setText(root, 'status', STATUS_TEXT[d.state] || STATUS_TEXT.unverified);
    setText(root, 'assetName', d.meta.name);
    setText(root, 'registry', 'Class: ' + d.classId + ' • Token ID: #' + d.id + ' • Role: ' + d.meta.role);
    setText(root, 'holder', d.owner || (d.state === 'not_found' ? 'No owner on-chain' : 'Unavailable (not verified)'));

    var anchor = d.chain
      ? d.chain.chainId + ' • block #' + d.chain.height + ' • ' + d.chain.time
      : 'Chain status unavailable';
    setText(root, 'anchor', anchor);

    var tail = d.owner ? d.owner.slice(-8).toUpperCase() : 'UNVERIFIED';
    setText(root, 'docId', 'LUXA-ATTESTATION-#' + d.id + '-' + tail);

    var link = root.querySelector('[data-cert="verifyLink"]');
    if (link) link.setAttribute('href', d.verifyUrl);

    var canvas = root.querySelector('[data-cert="qr"]');
    if (canvas) {
      if (d.owner && global.QRCode && typeof global.QRCode.toCanvas === 'function') {
        global.QRCode.toCanvas(canvas, d.verifyUrl, { width: 180, margin: 1 }).catch(function () {});
      } else {
        var ctx = canvas.getContext && canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  /** Carica e applica in un colpo solo. */
  async function mount(root, opts) {
    opts = opts || {};
    if (!root) throw new Error('LuxaCertificate.mount: root element missing');
    root.setAttribute('data-state', 'loading');
    setText(root, 'status', STATUS_TEXT.loading);
    var data = await load(opts.id, opts);
    apply(root, data);
    try {
      global.dispatchEvent(new CustomEvent('luxa:certificate_ready', { detail: data }));
    } catch (_) { /* ambienti senza CustomEvent */ }
    return data;
  }

  global.LuxaCertificate = {
    CLASS_ID: CLASS_ID,
    RELICS: RELICS,
    load: load,
    apply: apply,
    mount: mount
  };
})(typeof window !== 'undefined' ? window : globalThis);

// Aggiunge a index.html: 3 pulsanti "Download Android App" (accanto a quelli Chrome)
// e la sezione "LUXA Vault - Chrome & Android" con download APK, SHA-256 e galleria.
//
// Uso (dalla cartella principale del sito):
//   node add-android-app.mjs assets/downloads/LUXA-Vault-1.4.0.apk [versione]
//
// Si puo' rilanciare a ogni nuova versione dell'APK: i blocchi tra i commenti
// <!-- LUXA-APK:... --> vengono aggiornati, il resto della pagina non viene toccato.

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative, basename, sep } from "node:path";

const CHROME_URL =
  "https://chromewebstore.google.com/detail/luxa-vault-spiders-nest/jfhaclclifggggclkpeakpgddohpdbmm";
const INDEX = "index.html";

// ---------- argomenti ----------
const apkArg = process.argv[2];
if (!apkArg) {
  console.error("Uso: node add-android-app.mjs <percorso-apk> [versione]\nEsempio: node add-android-app.mjs assets/downloads/LUXA-Vault-1.4.0.apk 1.4.0");
  process.exit(1);
}
const apkAbs = resolve(apkArg);
if (!existsSync(apkAbs)) {
  console.error(`APK non trovato: ${apkAbs}\nControlla il percorso (deve stare dentro la cartella del sito).`);
  process.exit(1);
}
if (!existsSync(INDEX)) {
  console.error("index.html non trovato: lancia lo script dalla cartella principale del sito.");
  process.exit(1);
}
const rel = relative(process.cwd(), apkAbs);
if (rel.startsWith("..")) {
  console.error("L'APK deve stare dentro la cartella del sito, cosi' il link funziona online.");
  process.exit(1);
}
const href = encodeURI(rel.split(sep).join("/"));
const apkBuf = readFileSync(apkAbs);
const sha256 = createHash("sha256").update(apkBuf).digest("hex").toUpperCase();
const sizeMB = (statSync(apkAbs).size / (1024 * 1024)).toFixed(1);
const version = process.argv[3] || (basename(apkAbs).match(/(\d+\.\d+(?:\.\d+)*)/) || [])[1] || "1.0";
const fileName = basename(apkAbs);

// ---------- galleria (solo immagini presenti in assets/images) ----------
const shots = [
  ["vault-unlock", "LUXA Vault unlock screen with PIN entry", "Unlock with your PIN: keys are decrypted only on your device."],
  ["vault-dashboard", "LUXA Vault dashboard with balance, receive address and multi-vault actions", "Multi-vault dashboard: balance, address, import and 24-word backup."],
  ["vault-live-onchain", "Live on-chain activity and dual asset balances (uluxa and ushard)", "Live on-chain activity with dual-asset balances (uluxa and ushard)."],
  ["vault-onchain-activity", "On-chain transaction history and Sovereign NFT Vault", "Transaction history and the Sovereign NFT Vault, anchored on luxa-1."],
  ["vault-nft-relics", "Sovereign NFT Vault with Genesis relics and licenses", "Genesis relics and licenses registered on-chain."],
  ["vault-receive-qr", "Receive screen with Bech32 QR code for luxa1 addresses", "Receive assets with an instant Bech32 QR code."]
].filter(([name]) => existsSync(`assets/images/${name}.webp`));

const gallery = shots.length
  ? `<div class="vault-gallery">
${shots.map(([name, alt, cap]) => `                <figure class="vault-shot">
                    <a href="assets/images/${name}.webp" target="_blank" rel="noopener"><img src="assets/images/${name}.webp" alt="${alt}" width="1280" height="800" loading="lazy" decoding="async"></a>
                    <figcaption>${cap}</figcaption>
                </figure>`).join("\n")}
            </div>`
  : "";

// ---------- blocchi HTML ----------
const apkAttrs = `href="${href}" download="${fileName}" target="_self" rel="noopener"`;

const heroBtn = `
                <a ${apkAttrs} class="btn btn-outline btn-large">
                    <i class="fab fa-android"></i> <span>Download Android App</span>
                </a>`;
const cardBtn = `
                    <a ${apkAttrs} class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; font-weight: 600; margin-left: 8px;">
                        <i class="fab fa-android"></i> <span>Android App</span>
                    </a>`;
const ctaBtn = `
                    <a ${apkAttrs} class="btn btn-outline btn-xlarge">
                        <i class="fab fa-android"></i> <span>Android App</span>
                    </a>`;

const section = `
    <section id="vault-app" class="section section-dark">
        <style>
            #vault-app .vault-dl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
            #vault-app .vault-dl { display: flex; flex-direction: column; gap: 12px; padding: 26px; border: 1px solid rgba(168,85,247,0.35); background: linear-gradient(135deg, rgba(20,20,35,0.7), rgba(15,15,28,0.9)); }
            #vault-app .vault-badge { align-self: flex-start; background: rgba(34,211,238,0.15); color: var(--secondary); font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
            #vault-app .vault-dl h3 { margin: 0; font-size: 1.25rem; color: #fff; display: flex; align-items: center; gap: 10px; }
            #vault-app .vault-dl p { margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }
            #vault-app .vault-dl .btn { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; }
            #vault-app .vault-install { color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; }
            #vault-app .vault-install summary { cursor: pointer; color: var(--secondary); font-weight: 600; }
            #vault-app .vault-install ol { margin: 8px 0 0; padding-left: 20px; }
            #vault-app .vault-hash { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--text-muted); }
            #vault-app .vault-hash code { flex: 1 1 240px; font-family: var(--font-mono); word-break: break-all; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; }
            #vault-app .vault-copy { background: transparent; color: var(--secondary); border: 1px solid rgba(34,211,238,0.4); border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: 0.72rem; }
            #vault-app .vault-note { font-size: 0.75rem; color: var(--text-muted); }
            #vault-app .vault-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; margin-top: 40px; }
            #vault-app .vault-shot { margin: 0; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: #05070d; }
            #vault-app .vault-shot img { display: block; width: 100%; height: auto; }
            #vault-app .vault-shot figcaption { padding: 10px 14px; font-size: 0.8rem; color: var(--text-muted); }
        </style>
        <div class="container">
            <div class="section-header">
                <span class="section-tag">LUXA Vault</span>
                <h2>Your Vault, Everywhere:<br>Chrome &amp; Android</h2>
                <p>The same non-custodial Spider's Nest wallet on desktop and on your phone. Keys are encrypted on your device and never sent to any server.</p>
            </div>

            <div class="vault-dl-grid">
                <div class="about-card vault-dl">
                    <span class="vault-badge">Chrome Extension</span>
                    <h3><i class="fab fa-chrome"></i> LUXA Vault for Chrome</h3>
                    <p>Manage your keys, sign transactions on the <code>luxa-1</code> network and connect to decentralized web apps straight from your browser.</p>
                    <a href="${CHROME_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-primary"><i class="fab fa-chrome"></i> <span>Install on Chrome</span></a>
                </div>

                <div class="about-card vault-dl">
                    <span class="vault-badge">Android APK · v${version} · ${sizeMB} MB</span>
                    <h3><i class="fab fa-android"></i> LUXA Vault for Android</h3>
                    <p>The same vault in your pocket, with encrypted zero-knowledge backup to your own Google Drive. Distributed directly from this official page, not through Google Play.</p>
                    <a ${apkAttrs} class="btn btn-primary"><i class="fas fa-download"></i> <span>Download APK</span></a>
                    <details class="vault-install">
                        <summary>How to install</summary>
                        <ol>
                            <li>Open the downloaded file. If Android asks, allow installing from your browser or file manager ("Install unknown apps").</li>
                            <li>Android or Google Play Protect may warn you because the app is not from Google Play. Before installing, check that the SHA-256 below matches your file.</li>
                            <li>Open LUXA Vault, create or import your vault and set your PIN.</li>
                        </ol>
                    </details>
                    <div class="vault-hash">
                        <span>SHA-256</span>
                        <code id="vaultApkSha">${sha256}</code>
                        <button type="button" class="vault-copy" id="vaultCopySha">Copy</button>
                    </div>
                    <span class="vault-note">Only install LUXA Vault from this official page.</span>
                </div>
            </div>

            ${gallery}
        </div>
        <script>
        (function () {
            var btn = document.getElementById('vaultCopySha');
            var code = document.getElementById('vaultApkSha');
            if (!btn || !code || !navigator.clipboard) return;
            btn.addEventListener('click', function () {
                navigator.clipboard.writeText(code.textContent.trim()).then(function () {
                    btn.textContent = 'Copied';
                    setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
                });
            });
        })();
        </script>
    </section>

`;

// ---------- inserimento / aggiornamento ----------
let html = readFileSync(INDEX, "utf8");
const eol = html.includes("\r\n") ? "\r\n" : "\n";
const warnings = [];
const done = [];

function upsert(id, block, anchor, mode) {
  const start = `<!-- LUXA-APK:${id} -->`;
  const end = `<!-- /LUXA-APK:${id} -->`;
  const wrapped = (start + block + end).replace(/\r?\n/g, eol);
  const existing = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (existing.test(html)) {
    html = html.replace(existing, () => wrapped);
    done.push(`${id}: aggiornato`);
    return;
  }
  const m = anchor.exec(html);
  if (!m) {
    warnings.push(`${id}: punto di inserimento non trovato in index.html (saltato)`);
    return;
  }
  const at = mode === "before" ? m.index : m.index + m[0].length;
  html = html.slice(0, at) + wrapped + html.slice(at);
  done.push(`${id}: inserito`);
}

upsert("hero", heroBtn, /<i class="fab fa-chrome"><\/i>\s*<span>Install Chrome Extension<\/span>\s*<\/a>/, "after");
upsert("card", cardBtn, /<i class="fab fa-chrome"><\/i>\s*<span>Install on Chrome<\/span>\s*<\/a>/, "after");
upsert("cta", ctaBtn, /<i class="fab fa-chrome"><\/i>\s*<span>Chrome Extension<\/span>\s*<\/a>/, "after");
upsert("section", section, /<!-- SHARED WEALTH & REVENUE SHARING -->/, "before");

writeFileSync(INDEX, html, "utf8");

console.log(`APK: ${href}  (v${version}, ${sizeMB} MB)`);
console.log(`SHA-256: ${sha256}`);
console.log(`Immagini nella galleria: ${shots.length}/6`);
done.forEach((d) => console.log("  ✓ " + d));
warnings.forEach((w) => console.log("  ! " + w));
if (warnings.length) process.exitCode = 2;

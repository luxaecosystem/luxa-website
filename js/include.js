/* ============================================================
   include.js — Component loader LUXA
   Carica i frammenti HTML condivisi (nav, footer, ecc.) e li
   inietta negli elementi contrassegnati con [data-include].

   USO IN OGNI PAGINA:
     <div data-include="nav"></div>
     ...
     <div data-include="footer"></div>

   IMPORTANTE: va incluso PRIMA di js/script.js, così script.js
   può ascoltare l'evento "luxa:components-ready" invece di
   cercare #navbar / #footer che ancora non esistono nel DOM.
   ============================================================ */

(function () {
    const PARTIALS_PATH = "partials/"; // relativo alla root del sito

    async function loadInclude(el) {
        const name = el.getAttribute("data-include");
        const url = `${PARTIALS_PATH}${name}.html`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
            el.innerHTML = await res.text();
        } catch (err) {
            console.error(`[include.js] Impossibile caricare "${name}":`, err);
        }
    }

    async function loadAllIncludes() {
        const targets = Array.from(document.querySelectorAll("[data-include]"));
        await Promise.all(targets.map(loadInclude));

        // Segnala il resto del sito (script.js, evidenziazione link attivo, ecc.)
        document.dispatchEvent(new CustomEvent("luxa:components-ready"));

        // Evidenzia il link di nav corrispondente alla pagina corrente
        highlightActiveLink();
    }

    function highlightActiveLink() {
        const current = window.location.pathname.split("/").pop() || "index.html";
        document.querySelectorAll("#navbar .nav-links a, .mobile-menu a").forEach(a => {
            const href = a.getAttribute("href") || "";
            if (href.split("#")[0] === current) {
                a.classList.add("active");
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadAllIncludes);
    } else {
        loadAllIncludes();
    }
})();

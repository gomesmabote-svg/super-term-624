// =========================================================
// Hotflixx — Telegram e navegadores das apps (X, Instagram...)
//
//  1. Os botões do Telegram abrem diretamente a app do Telegram:
//     - Android: pedido ao sistema para abrir a app do Telegram;
//     - iPhone: tg://
//     Se o Telegram não estiver instalado, abre a página t.me.
//     Dentro do navegador de uma app (X...), o botão passa pela ponte
//     hotflixx.app/tg/utilizador?text=... (funciona como um link
//     encurtado, que o X deixa abrir) e a mensagem da compra vai junto.
//  2. Dentro do navegador de uma app (X, Instagram, ...), aparece
//     um aviso curto no topo ("⚠️ Open this site in your external
//     browser to buy."), na língua do telemóvel do cliente
//     (inglês quando a língua não está na lista).
//     A loja nunca tenta sair sozinha (deixava a página em branco no X).
// =========================================================

(function () {
    var ua = navigator.userAgent || "";
    var isAndroid = /Android/i.test(ua);
    var isIOS = /iPhone|iPad|iPod/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var isMobile = isAndroid || isIOS;

    // Navegadores dentro de apps
    var IN_APP = /Twitter|TwitterAndroid|FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|Snapchat|TikTok|musical_ly|BytedanceWebview|trill|LinkedInApp|Pinterest|Threads|; wv\)/i;
    var isInApp = isMobile && IN_APP.test(ua);

    // Navegar (pode ser substituído nos testes)
    function go(url) {
        if (typeof window.__hfGo === "function") return window.__hfGo(url);
        window.location.href = url;
    }

    // -----------------------------------------------------
    // Telegram: abrir a app diretamente
    // -----------------------------------------------------

    function isTelegram(url) {
        return /^https?:\/\/(www\.)?(t\.me|telegram\.me|telegram\.dog)\//i.test(String(url || ""));
    }

    // https://t.me/user?text=... -> { path: "resolve?domain=user&text=..." }
    function tgPath(url) {
        try {
            var u = new URL(url);
            var parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
            var first = parts[0] || "";
            var text = u.searchParams.get("text");

            if (first.charAt(0) === "+") {
                return "join?invite=" + encodeURIComponent(first.slice(1));
            }

            if (first === "joinchat" && parts[1]) {
                return "join?invite=" + encodeURIComponent(parts[1]);
            }

            if (/^[A-Za-z0-9_]{3,}$/.test(first) && parts.length === 1) {
                return "resolve?domain=" + encodeURIComponent(first) +
                    (text ? "&text=" + encodeURIComponent(text) : "");
            }
        } catch (e) {}

        return null;
    }

    function toTgScheme(url) {
        var path = tgPath(url);
        return path ? "tg://" + path : null;
    }

    // Android: abre a app do Telegram pelo sistema; sem Telegram, abre t.me
    function toTelegramIntent(url) {
        var path = tgPath(url);
        if (!path) return null;

        return "intent://" + path +
            "#Intent;scheme=tg;package=org.telegram.messenger;" +
            "S.browser_fallback_url=" + encodeURIComponent(url) + ";end";
    }

    // Separador novo. (Com "noopener" o browser devolve sempre null,
    // por isso cortamos a ligação à mão e só usamos a mesma janela
    // se o separador for mesmo bloqueado.)
    function openTab(url) {
        var win = window.open(url, "_blank");

        if (win) {
            try { win.opener = null; } catch (e) {}
        } else {
            go(url);
        }
    }

    // https://t.me/user?text=... -> https://hotflixx.app/tg/user?text=...
    function bridgeUrl(url) {
        try {
            if (!/^https?:$/.test(window.location.protocol)) return null;

            var u = new URL(url);
            var parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
            var target = parts[0] || "";

            if (target === "joinchat" && parts[1] && parts.length === 2) target = "+" + parts[1];
            else if (parts.length !== 1) return null;

            if (!/^\+?[A-Za-z0-9_-]{3,64}$/.test(target)) return null;

            var text = u.searchParams.get("text");
            return window.location.origin + "/tg/" + encodeURIComponent(target) +
                (text ? "?text=" + encodeURIComponent(text) : "");
        } catch (e) {
            return null;
        }
    }

    function openLink(url) {
        if (!url) return;

        // Navegador do X/Instagram...: passar pela ponte (como um link encurtado)
        if (isInApp && isTelegram(url)) {
            go(bridgeUrl(url) || url);
            return;
        }

        if (isMobile && isTelegram(url)) {
            var app = isAndroid ? toTelegramIntent(url) : toTgScheme(url);

            if (app) {
                var left = false;
                var onHide = function () { if (document.visibilityState === "hidden") left = true; };
                document.addEventListener("visibilitychange", onHide);

                go(app);

                // Sem Telegram instalado: abre a página t.me
                setTimeout(function () {
                    document.removeEventListener("visibilitychange", onHide);
                    if (!left && document.visibilityState !== "hidden") {
                        openTab(url);
                    }
                }, 1800);
                return;
            }
        }

        if (isInApp) {
            // Dentro das apps, abrir na mesma janela evita janelas presas
            go(url);
            return;
        }

        openTab(url);
    }

    // Todos os links do Telegram na loja passam por aqui
    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a[href]");
        if (!link || event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

        var href = link.getAttribute("href");
        var storeLink = link.hasAttribute("data-hf-link") && /^https?:\/\//i.test(href);
        if (!isTelegram(href) && !storeLink && !(isInApp && /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href))) return;

        event.preventDefault();
        openLink(href);
    });

    // -----------------------------------------------------
    // Aviso dentro das apps + botão "Abrir no navegador"
    // (só sai quando o cliente toca no botão)
    // -----------------------------------------------------

    function pageUrl() {
        var url = new URL(window.location.href);
        url.searchParams.delete("ext");
        return url.toString();
    }

    function openInBrowser() {
        var target = pageUrl();

        if (isAndroid) {
            go(
                "intent://" + target.replace(/^https?:\/\//, "") +
                "#Intent;scheme=https;action=android.intent.action.VIEW;" +
                "category=android.intent.category.BROWSABLE;package=com.android.chrome;" +
                "S.browser_fallback_url=" + encodeURIComponent(target) + ";end"
            );
            return;
        }

        if (isIOS) {
            go(target.replace(/^https?:\/\//, "x-safari-https://"));
        }
    }

    // Aviso na língua do telemóvel do cliente (inglês por omissão)
    var WARNINGS = {
        en: ["Open this site in your external browser to buy.", "Tap {menu} at the top and choose {open}.", "Open in browser", "Close"],
        pt: ["Abra este site no navegador externo para poder comprar.", "Toque em {menu} no topo e escolha {open}.", "Abrir no navegador", "Fechar"],
        es: ["Abre este sitio en tu navegador externo para poder comprar.", "Toca {menu} arriba y elige {open}.", "Abrir en el navegador", "Cerrar"],
        fr: ["Ouvrez ce site dans votre navigateur externe pour acheter.", "Touchez {menu} en haut et choisissez {open}.", "Ouvrir dans le navigateur", "Fermer"],
        de: ["Öffne diese Seite im externen Browser, um zu kaufen.", "Tippe oben auf {menu} und wähle {open}.", "Im Browser öffnen", "Schließen"],
        it: ["Apri questo sito nel browser esterno per acquistare.", "Tocca {menu} in alto e scegli {open}.", "Apri nel browser", "Chiudi"],
        nl: ["Open deze site in je externe browser om te kopen.", "Tik bovenaan op {menu} en kies {open}.", "Openen in browser", "Sluiten"],
        ru: ["Откройте этот сайт во внешнем браузере, чтобы купить.", "Нажмите {menu} вверху и выберите {open}.", "Открыть в браузере", "Закрыть"],
        uk: ["Відкрийте цей сайт у зовнішньому браузері, щоб купити.", "Натисніть {menu} угорі та виберіть {open}.", "Відкрити в браузері", "Закрити"],
        pl: ["Otwórz tę stronę w zewnętrznej przeglądarce, aby kupić.", "Stuknij {menu} u góry i wybierz {open}.", "Otwórz w przeglądarce", "Zamknij"],
        tr: ["Satın almak için bu siteyi harici tarayıcıda açın.", "Üstteki {menu} simgesine dokunun ve {open} seçin.", "Tarayıcıda aç", "Kapat"],
        ar: ["افتح هذا الموقع في المتصفح الخارجي لتتمكن من الشراء.", "اضغط على {menu} في الأعلى واختر {open}.", "فتح في المتصفح", "إغلاق"],
        hi: ["खरीदने के लिए इस साइट को बाहरी ब्राउज़र में खोलें।", "ऊपर {menu} पर टैप करें और {open} चुनें।", "ब्राउज़र में खोलें", "बंद करें"],
        id: ["Buka situs ini di browser eksternal untuk membeli.", "Ketuk {menu} di atas lalu pilih {open}.", "Buka di browser", "Tutup"],
        vi: ["Hãy mở trang này bằng trình duyệt bên ngoài để mua hàng.", "Chạm vào {menu} ở trên cùng và chọn {open}.", "Mở trong trình duyệt", "Đóng"],
        th: ["เปิดเว็บไซต์นี้ในเบราว์เซอร์ภายนอกเพื่อซื้อ", "แตะ {menu} ด้านบนแล้วเลือก {open}", "เปิดในเบราว์เซอร์", "ปิด"],
        ja: ["購入するには、このサイトを外部ブラウザで開いてください。", "上部の{menu}をタップして「{open}」を選択してください。", "ブラウザで開く", "閉じる"],
        ko: ["구매하려면 이 사이트를 외부 브라우저에서 여세요.", "상단의 {menu}을(를) 누르고 {open}을(를) 선택하세요.", "브라우저에서 열기", "닫기"],
        zh: ["请在外部浏览器中打开本网站以便购买。", "点击顶部的 {menu}，然后选择“{open}”。", "在浏览器中打开", "关闭"]
    };

    function warningText() {
        var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);

        for (var i = 0; i < langs.length; i++) {
            var code = String(langs[i] || "").toLowerCase().split(/[-_]/)[0];
            if (WARNINGS[code]) {
                var w = WARNINGS[code];
                return { lang: code, title: w[0], how: w[1], open: w[2], close: w[3] };
            }
        }

        var en = WARNINGS.en;
        return { lang: "en", title: en[0], how: en[1], open: en[2], close: en[3] };
    }

    function showBar() {
        if (document.getElementById("hfExternalBar")) return;

        var bar = document.createElement("div");
        bar.id = "hfExternalBar";
        bar.className = "hf-external-bar";
        bar.setAttribute("role", "note");
        var msg = warningText();
        var menu = isIOS ? "•••" : "⋮";

        bar.setAttribute("lang", msg.lang);
        bar.innerHTML =
            '<span class="hf-external-icon" aria-hidden="true">⚠️</span>' +
            '<p class="hf-external-text">' +
                "<strong>" + msg.title + "</strong> " +
                "<span>" + msg.how.replace("{menu}", "<b>" + menu + "</b>").replace("{open}", "<b>" + msg.open + "</b>") + "</span>" +
            "</p>" +
            '<button type="button" class="hf-external-close" data-hf-close aria-label="' + msg.close + '">×</button>';

        bar.addEventListener("click", function (event) {
            if (event.target.closest("[data-hf-close]")) bar.remove();
        });

        document.body.insertBefore(bar, document.body.firstChild);
    }

    // Páginas como o FlixxTree não mostram o aviso (data-hf-nobar)
    if (isInApp && !document.documentElement.hasAttribute("data-hf-nobar")) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showBar);
        else showBar();
    }

    window.HFExternal = {
        isInApp: isInApp,
        isMobile: isMobile,
        openLink: openLink,
        openInBrowser: openInBrowser,
        toTgScheme: toTgScheme,
        bridgeUrl: bridgeUrl,
        toTelegramIntent: toTelegramIntent
    };
})();

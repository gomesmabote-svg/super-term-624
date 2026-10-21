// =========================================================
// MODELOS DA LOJA PÚBLICA
// Desenha a loja com o modelo e as cores escolhidas pelo vendedor.
// Usa as funções de app.js (escapeHTML, formatPrice, openPreview,
// handleBuy, buildTelegramUrl).
// =========================================================

(function () {

    const catalog = window.StoreCatalog;

    // -----------------------------------------------------
    // DEFINIÇÕES (modelo + cores + textos)
    // -----------------------------------------------------

    function settingsFor(store, override) {
        const templateId = (override && override.template) || store.template || "classic";
        const template = catalog ? catalog.getTemplate(templateId) : { id: "classic", colors: {}, texts: {} };
        const theme = (override && override.theme) || store.theme || {};
        const custom = (theme.templates && theme.templates[template.id]) || {};

        const colors = Object.assign({}, template.colors, custom.colors || {});
        const texts = Object.assign({}, template.texts, custom.texts || {});

        return {
            template,
            colors,
            texts,
            title: (texts.title || "").trim() || store.name,
            logoUrl: theme.logoUrl || ""
        };
    }

    const CSS_VARS = {
        bg: "--s-bg",
        headerBg: "--s-header",
        surface: "--s-surface",
        text: "--s-text",
        muted: "--s-muted",
        accent: "--s-accent",
        frame: "--s-frame",
        priceBg: "--s-price-bg",
        priceText: "--s-price-text",
        buyBg: "--s-buy-bg",
        buyText: "--s-buy-text",
        previewBg: "--s-preview-bg",
        previewText: "--s-preview-text",
        dot: "--s-dot"
    };

    // Variáveis do modelo clássico (style.css)
    const CLASSIC_VARS = {
        bg: ["--bg"],
        headerBg: ["--header-bg"],
        surface: ["--card"],
        text: ["--text"],
        muted: ["--text-secondary"],
        accent: ["--hotflix"],
        buyBg: ["--telegram"],
        buyText: ["--buy-text"],
        previewBg: ["--preview-bg"],
        previewText: ["--preview-text"],
        dot: ["--dot"]
    };

    function applyColors(settings) {
        const body = document.body;

        Object.values(CSS_VARS).forEach((name) => body.style.removeProperty(name));
        ["--bg", "--header-bg", "--card", "--card-hover", "--text", "--text-secondary",
            "--hotflix", "--telegram", "--telegram-dark", "--buy-text", "--preview-bg",
            "--preview-text", "--dot"].forEach((name) => body.style.removeProperty(name));

        Object.entries(settings.colors).forEach(([key, value]) => {
            if (CSS_VARS[key]) body.style.setProperty(CSS_VARS[key], value);

            if (settings.template.id === "classic" && CLASSIC_VARS[key]) {
                CLASSIC_VARS[key].forEach((name) => body.style.setProperty(name, value));
            }
        });

        if (settings.template.id === "classic") {
            body.style.setProperty("--card-hover", `color-mix(in srgb, ${settings.colors.surface} 88%, ${settings.colors.text})`);
            body.style.setProperty("--telegram-dark", `color-mix(in srgb, ${settings.colors.buyBg} 85%, #000)`);
        }

        body.dataset.template = settings.template.id;

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", settings.colors.headerBg || settings.colors.bg);
    }

    // -----------------------------------------------------
    // AJUDAS
    // -----------------------------------------------------

    const esc = (value) => escapeHTML(value);

    function priceText(product) {
        const price = formatPrice(product.price);
        return price ? `$${price}` : "";
    }

    // "COMPRAR POR {preço}" -> "COMPRAR POR $25.00"
    function buyLabel(settings, product) {
        const label = settings.texts.buyLabel || "Buy now";
        const price = priceText(product);

        if (price) {
            return label.includes("{preço}") ? label.replace(/\{preço\}/g, price) : label;
        }

        return label
            .replace(/\s*(?:FOR|POR|por|for|·|-|—)?\s*\{preço\}\s*/g, " ")
            .trim() || "Buy now";
    }

    function previewLabel(settings) {
        return settings.texts.previewLabel || "Preview";
    }

    function hasPreview(product) {
        return Array.isArray(product.previews) && product.previews.length > 0;
    }

    // Capa do vídeo hospedado na Hotflixx: /v/ID.mp4 -> /v/ID.jpg
    function posterFor(url) {
        const match = /^(https?:\/\/[^?#]+\/v\/[A-Za-z0-9]{8})\.mp4(?:[?#].*)?$/.exec(String(url || ""));
        return match ? `${match[1]}.jpg` : "";
    }

    // Sem capa mas com prévia: mostra o primeiro frame do vídeo com
    // um botão de play que abre as prévias do produto.
    function videoCover(product, className, withPlay) {
        const first = product.previews[0].video_url;
        const poster = posterFor(first);
        const src = /#/.test(first) ? first : `${first}#t=0.1`;

        return `<div class="${className} t-vidcover" role="button" tabindex="0" onclick="openPreview(${Number(product.id)})" aria-label="${esc(product.name)}">` +
            `<video src="${esc(src)}" ${poster ? `poster="${esc(poster)}"` : ""} muted playsinline preload="metadata" tabindex="-1"></video>` +
            (withPlay ? `<span class="t-vidplay" aria-hidden="true">${PLAY_ICON}</span>` : "") +
            "</div>";
    }

    // options.play = false quando o modelo já tem o seu próprio botão de play
    function image(product, className, options) {
        if (product.image_url) {
            return `<img class="${className}" src="${esc(product.image_url)}" alt="${esc(product.name)}" loading="lazy">`;
        }

        if (hasPreview(product)) {
            return videoCover(product, className, !(options && options.play === false));
        }

        return `<div class="${className} t-noimg" aria-hidden="true">${esc((product.name || "?").charAt(0).toUpperCase())}</div>`;
    }

    // Destaques do produto com os pontos coloridos (ex.: • 250+ FILES • 10GB • HD)
    function chips(product, className) {
        const list = Array.isArray(product.highlights) ? product.highlights.filter(Boolean) : [];
        if (!list.length) return "";
        return `<ul class="t-chips ${className || ""}">${list.map((text) =>
            `<li><i class="t-dot" aria-hidden="true"></i>${esc(text)}</li>`).join("")}</ul>`;
    }

    // Marca da Hotflixx nas lojas (decidida pelo dono da plataforma)
    function applyBranding(data) {
        const mode = (data.platform && data.platform.branding) || "mark";
        document.body.dataset.branding = mode;

        const footer = document.querySelector(".hd-footer");
        if (!footer) return;

        let badge = footer.querySelector(".hd-made");

        if (mode === "none") {
            if (badge) badge.remove();
            return;
        }

        if (!badge) {
            badge = document.createElement("a");
            badge.className = "hd-made";
            badge.href = "/";
            badge.target = "_blank";
            badge.rel = "noopener";
            badge.setAttribute("aria-label", "Hotflixx");
            footer.prepend(badge);
        }

        badge.innerHTML = '<span class="hf-logo" aria-hidden="true"><i class="hf-mark"></i>' +
            (mode === "full" ? '<i class="hf-word"></i>' : "") + "</span>";
    }

    function buyButton(settings, product, className) {
        return `<button type="button" class="${className}" onclick="handleBuy(${Number(product.id)})">${esc(buyLabel(settings, product))}</button>`;
    }

    function previewButton(settings, product, className) {
        if (!hasPreview(product)) return "";
        return `<button type="button" class="${className}" onclick="openPreview(${Number(product.id)})">${esc(previewLabel(settings))}</button>`;
    }

    function telegramLink(store) {
        if (!store.show_telegram_button || !storeHasTelegram(store)) return "";
        return storeTelegramUrl(
            store,
            "Hi 👋\n\nI would like to know more about your products."
        ) || "";
    }

    const TG_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.6l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 3c.9-.3 1.7.2 1.4 1.3z"/></svg>';
    const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>';
    const COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

    function telegramPill(store, className, label) {
        const link = telegramLink(store);
        if (!link) return "";
        const user = String(store.telegram_username || "").replace(/^@+/, "").trim();
        const name = label || (user ? `@${user}` : "Telegram");
        return `<a class="${className}" href="${esc(link)}" target="_blank" rel="noopener noreferrer" data-hf-link>${TG_ICON}<span>${esc(name)}</span></a>`;
    }

    function logo(settings, className) {
        if (settings.logoUrl) {
            return `<img class="${className}" src="${esc(settings.logoUrl)}" alt="">`;
        }
        return `<span class="${className} t-logo-letter" aria-hidden="true">${esc(settings.title.charAt(0).toUpperCase())}</span>`;
    }

    // Grupos de produtos: categorias (pela ordem) e "sem categoria" no fim
    function groups(data) {
        const products = data.products || [];
        const categories = (data.categories || []).slice();
        const known = new Set(categories.map((c) => c.id));

        const list = categories
            .map((category) => ({
                category,
                products: products.filter((p) => p.category_id === category.id)
            }))
            .filter((group) => group.products.length);

        const loose = products.filter((p) => !p.category_id || !known.has(p.category_id));

        if (loose.length) {
            list.push({ category: null, products: loose });
        }

        return list;
    }

    function categoryKey(product, data) {
        const known = (data.categories || []).some((c) => c.id === product.category_id);
        return known ? String(product.category_id) : "none";
    }

    // Separadores de categoria (só aparecem se houver categorias)
    function tabs(data, className) {
        const list = groups(data);
        const named = list.filter((g) => g.category);

        if (!named.length) return "";

        const buttons = [`<button type="button" class="${className} active" data-filter="all">Todos</button>`]
            .concat(list.map((g) => g.category
                ? `<button type="button" class="${className}" data-filter="${g.category.id}">${esc(g.category.name)}</button>`
                : `<button type="button" class="${className}" data-filter="none">Outros</button>`));

        return `<div class="t-tabs" role="tablist">${buttons.join("")}</div>`;
    }

    function emptyState(className) {
        return `<div class="${className}"><h2>Nenhum produto disponível</h2><p>Esta loja ainda não tem produtos publicados.</p></div>`;
    }

    function copyLinkButton(className) {
        return `<button type="button" class="${className}" data-copy-store aria-label="Copiar o link da loja" title="Copiar o link da loja">${COPY_ICON}</button>`;
    }

    // -----------------------------------------------------
    // AURORA (claro, destaques em carrossel, barra em baixo)
    // -----------------------------------------------------

    function aurora(data, s) {
        const store = data.store;
        const products = data.products || [];
        const withImage = products.filter((p) => p.image_url);

        const highlights = withImage.length
            ? `
                ${s.texts.sectionTitle ? `<h2 class="au-section">${esc(s.texts.sectionTitle)}</h2>` : ""}
                <div class="au-highlights">
                    <div class="au-track">
                        ${withImage.map((p) => `
                            <button type="button" class="au-thumb" data-goto="${p.id}" aria-label="${esc(p.name)}">
                                <img src="${esc(p.image_url)}" alt="" loading="lazy">
                                <span>${esc(p.name)}</span>
                            </button>`).join("")}
                    </div>
                </div>`
            : "";

        const cards = products.map((p) => `
            <article class="au-card" id="product-${p.id}" data-cat="${categoryKey(p, data)}">
                <div class="au-frame">
                    ${image(p, "au-img", { play: false })}
                    ${hasPreview(p) ? `<button type="button" class="au-play" onclick="openPreview(${p.id})" aria-label="${esc(previewLabel(s))}">${PLAY_ICON}</button>` : ""}
                </div>
                <div class="au-row">
                    <h3>${esc(p.name)}</h3>
                    ${priceText(p) ? `<span class="au-price">${esc(priceText(p))}</span>` : ""}
                </div>
                ${p.description ? `<p class="au-desc">${esc(p.description)}</p>` : ""}
                ${chips(p, "au-chips")}
                <div class="au-actions">
                    ${previewButton(s, p, "au-btn au-btn-preview")}
                    ${buyButton(s, p, "au-btn au-btn-buy")}
                </div>
            </article>`).join("");

        const tg = telegramPill(store, "au-tg");

        return `
            <div class="au">
                <header class="au-head">
                    <div class="au-brand">
                        ${logo(s, "au-logo")}
                        <div>
                            <h1>${esc(s.title)}</h1>
                            ${s.texts.subtitle ? `<p>${esc(s.texts.subtitle)}</p>` : ""}
                        </div>
                    </div>
                    ${tg}
                </header>
                ${highlights}
                ${tabs(data, "au-tab")}
                <main class="au-list">${cards || emptyState("t-empty")}</main>
                ${telegramLink(store) ? `
                <nav class="au-dock" aria-label="Loja">
                    ${logo(s, "au-dock-logo")}
                    <a class="au-dock-main" href="${esc(telegramLink(store))}" target="_blank" rel="noopener noreferrer" data-hf-link>${TG_ICON}<span>${esc(s.title)}</span></a>
                    ${copyLinkButton("au-dock-copy")}
                </nav>` : ""}
            </div>`;
    }

    // -----------------------------------------------------
    // NOIR (escuro, coluna central estreita)
    // -----------------------------------------------------

    function noirSubtitle(s) {
        const text = esc(s.texts.subtitle || "");
        const label = esc((s.texts.buyLabel || "Buy Now").replace(/\s*\{preço\}\s*/g, "").trim());

        // Destaca "Buy Now" (ou o texto do botão) dentro do subtítulo
        if (!label) return text;
        const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return text.replace(re, (m) => `<b>${m}</b>`);
    }

    function noirCard(p, s) {
        return `
            <article class="nr-card" id="product-${p.id}">
                <h3>${esc(p.name)}</h3>
                <div class="nr-media${hasPreview(p) ? " has-preview" : ""}" ${hasPreview(p) ? `role="button" tabindex="0" onclick="openPreview(${p.id})" aria-label="${esc(previewLabel(s))}"` : ""}>
                    ${image(p, "nr-img", { play: false })}
                    ${hasPreview(p) ? `<span class="nr-play">${PLAY_ICON}</span>` : ""}
                </div>
                ${p.description ? `<p class="nr-desc">${esc(p.description)}</p>` : ""}
                ${chips(p, "nr-chips")}
                ${priceText(p) ? `<p class="nr-price">${esc(priceText(p))}</p>` : ""}
                ${hasPreview(p) ? previewButton(s, p, "nr-btn nr-btn-preview") : ""}
                ${buyButton(s, p, "nr-btn nr-btn-buy")}
            </article>`;
    }

    function noir(data, s) {
        const list = groups(data);
        const multi = list.some((g) => g.category);

        const body = list.map((g) => `
            ${multi ? `<h2 class="nr-cat">${esc(g.category ? g.category.name : "Outros")}</h2>` : ""}
            ${g.products.map((p) => noirCard(p, s)).join("")}`).join("");

        return `
            <div class="nr">
                <header class="nr-head">
                    ${s.logoUrl ? logo(s, "nr-logo") : ""}
                    <h1>${esc(s.title)}</h1>
                    ${s.texts.subtitle ? `<p>${noirSubtitle(s)}</p>` : ""}
                    ${telegramPill(data.store, "nr-tg")}
                </header>
                <main class="nr-col">${body || emptyState("t-empty")}</main>
            </div>`;
    }

    // -----------------------------------------------------
    // PRISMA (grelha clara com molduras em degradé)
    // -----------------------------------------------------

    function prisma(data, s) {
        const cards = (data.products || []).map((p) => `
            <article class="pr-card" id="product-${p.id}" data-cat="${categoryKey(p, data)}">
                <div class="pr-ring">
                    <div class="pr-media">
                        ${image(p, "pr-img", { play: false })}
                        ${priceText(p) ? `<span class="pr-price">${esc(priceText(p))}</span>` : ""}
                        ${hasPreview(p) ? `<button type="button" class="pr-play" onclick="openPreview(${p.id})" aria-label="${esc(previewLabel(s))}">${PLAY_ICON}</button>` : ""}
                    </div>
                </div>
                <h3>${esc(p.name)}</h3>
                ${p.description ? `<p class="pr-desc">${esc(p.description)}</p>` : ""}
                ${chips(p, "pr-chips")}
                <div class="pr-actions">
                    ${buyButton(s, p, "pr-btn pr-btn-buy")}
                    ${previewButton(s, p, "pr-btn pr-btn-preview")}
                </div>
            </article>`).join("");

        return `
            <div class="pr">
                <header class="pr-head">
                    ${s.logoUrl ? logo(s, "pr-logo") : ""}
                    <h1>${esc(s.title)}</h1>
                    ${s.texts.subtitle ? `<p>${esc(s.texts.subtitle)}</p>` : ""}
                    ${telegramPill(data.store, "pr-tg")}
                </header>
                ${tabs(data, "pr-tab")}
                <main class="pr-grid">${cards || emptyState("t-empty")}</main>
            </div>`;
    }

    // -----------------------------------------------------
    // ECLIPSE (destaque grande + lista elegante)
    // -----------------------------------------------------

    function eclipseRow(p, s) {
        return `
            <article class="ec-row" id="product-${p.id}">
                <div class="ec-thumb">${image(p, "ec-img")}</div>
                <div class="ec-info">
                    <h3>${esc(p.name)}</h3>
                    ${p.description ? `<p>${esc(p.description)}</p>` : ""}
                    ${chips(p, "ec-chips")}
                    <div class="ec-actions">
                        ${buyButton(s, p, "ec-btn ec-btn-buy")}
                        ${previewButton(s, p, "ec-btn ec-btn-preview")}
                    </div>
                </div>
            </article>`;
    }

    function eclipse(data, s) {
        const products = data.products || [];
        const featured = products[0];

        const hero = featured ? `
            <section class="ec-hero" id="product-${featured.id}">
                <div class="ec-hero-media">${image(featured, "ec-hero-img")}</div>
                <div class="ec-hero-info">
                    ${s.texts.sectionTitle ? `<span class="ec-kicker">${esc(s.texts.sectionTitle)}</span>` : ""}
                    <h2>${esc(featured.name)}</h2>
                    ${featured.description ? `<p>${esc(featured.description)}</p>` : ""}
                    ${chips(featured, "ec-chips")}
                    <div class="ec-actions">
                        ${buyButton(s, featured, "ec-btn ec-btn-buy ec-btn-lg")}
                        ${previewButton(s, featured, "ec-btn ec-btn-preview ec-btn-lg")}
                    </div>
                </div>
            </section>` : "";

        const rest = { ...data, products: products.slice(1) };
        const list = groups(rest);
        const multi = list.some((g) => g.category);

        const rows = list.map((g) => `
            ${multi ? `<h2 class="ec-cat">${esc(g.category ? g.category.name : "Outros")}</h2>` : ""}
            <div class="ec-list">${g.products.map((p) => eclipseRow(p, s)).join("")}</div>`).join("");

        return `
            <div class="ec">
                <header class="ec-head">
                    <div class="ec-brand">
                        ${logo(s, "ec-logo")}
                        <div>
                            <h1>${esc(s.title)}</h1>
                            ${s.texts.subtitle ? `<p>${esc(s.texts.subtitle)}</p>` : ""}
                        </div>
                    </div>
                    ${telegramPill(data.store, "ec-tg")}
                </header>
                <main class="ec-main">${hero}${rows}${products.length ? "" : emptyState("t-empty")}</main>
            </div>`;
    }

    // -----------------------------------------------------
    // BRISA (topo colorido, cartões horizontais)
    // -----------------------------------------------------

    function brisa(data, s) {
        const cards = (data.products || []).map((p) => `
            <article class="br-card" id="product-${p.id}" data-cat="${categoryKey(p, data)}">
                <div class="br-media">${image(p, "br-img")}</div>
                <div class="br-info">
                    <h3>${esc(p.name)}</h3>
                    ${p.description ? `<p>${esc(p.description)}</p>` : ""}
                    ${chips(p, "br-chips")}
                    ${priceText(p) ? `<strong class="br-price">${esc(priceText(p))}</strong>` : ""}
                    <div class="br-actions">
                        ${buyButton(s, p, "br-btn br-btn-buy")}
                        ${previewButton(s, p, "br-btn br-btn-preview")}
                    </div>
                </div>
            </article>`).join("");

        return `
            <div class="br">
                <header class="br-head">
                    <div class="br-head-inner">
                        ${logo(s, "br-logo")}
                        <h1>${esc(s.title)}</h1>
                        ${s.texts.subtitle ? `<p>${esc(s.texts.subtitle)}</p>` : ""}
                        ${telegramPill(data.store, "br-tg")}
                    </div>
                </header>
                ${tabs(data, "br-tab")}
                <main class="br-list">${cards || emptyState("t-empty")}</main>
            </div>`;
    }

    // -----------------------------------------------------
    // NÉON (preto com brilho, destaques em círculos)
    // -----------------------------------------------------

    function neon(data, s) {
        const products = data.products || [];

        const stories = products.filter((p) => p.image_url).length ? `
            ${s.texts.sectionTitle ? `<h2 class="ne-section">${esc(s.texts.sectionTitle)}</h2>` : ""}
            <div class="ne-stories">
                ${products.filter((p) => p.image_url).map((p) => `
                    <button type="button" class="ne-story" ${hasPreview(p) ? `onclick="openPreview(${p.id})"` : `data-goto="${p.id}"`}>
                        <span class="ne-ring"><img src="${esc(p.image_url)}" alt="" loading="lazy"></span>
                        <span class="ne-story-name">${esc(p.name)}</span>
                    </button>`).join("")}
            </div>` : "";

        const cards = products.map((p) => `
            <article class="ne-card" id="product-${p.id}" data-cat="${categoryKey(p, data)}">
                <div class="ne-media">
                    ${image(p, "ne-img", { play: false })}
                    ${hasPreview(p) ? `<span class="ne-badge">${PLAY_ICON}</span>` : ""}
                </div>
                <div class="ne-body">
                    <h3>${esc(p.name)}</h3>
                    ${p.description ? `<p>${esc(p.description)}</p>` : ""}
                    ${chips(p, "ne-chips")}
                    <div class="ne-actions">
                        ${buyButton(s, p, "ne-btn ne-btn-buy")}
                        ${previewButton(s, p, "ne-btn ne-btn-preview")}
                    </div>
                </div>
            </article>`).join("");

        return `
            <div class="ne">
                <header class="ne-head">
                    ${s.logoUrl ? logo(s, "ne-logo") : ""}
                    <h1>${esc(s.title)}</h1>
                    ${s.texts.subtitle ? `<p>${esc(s.texts.subtitle)}</p>` : ""}
                    ${telegramPill(data.store, "ne-tg")}
                </header>
                ${stories}
                ${tabs(data, "ne-tab")}
                <main class="ne-grid">${cards || emptyState("t-empty")}</main>
            </div>`;
    }

    const RENDERERS = { aurora, noir, prisma, eclipse, brisa, neon };

    // -----------------------------------------------------
    // INTERAÇÕES COMUNS
    // -----------------------------------------------------

    function bind(root) {
        // Separadores de categoria
        root.querySelectorAll("[data-filter]").forEach((tab) => {
            tab.addEventListener("click", () => {
                const filter = tab.dataset.filter;

                root.querySelectorAll("[data-filter]").forEach((t) => t.classList.toggle("active", t === tab));

                root.querySelectorAll("[data-cat]").forEach((card) => {
                    card.hidden = filter !== "all" && card.dataset.cat !== filter;
                });
            });
        });

        // Destaques: levar ao produto
        root.querySelectorAll("[data-goto]").forEach((button) => {
            button.addEventListener("click", () => {
                const card = document.getElementById(`product-${button.dataset.goto}`);
                if (!card) return;

                if (card.hidden) {
                    root.querySelector('[data-filter="all"]')?.click();
                }

                card.scrollIntoView({ behavior: "smooth", block: "center" });
                card.classList.remove("t-flash");
                void card.offsetWidth;
                card.classList.add("t-flash");
            });
        });

        // Copiar o link da loja
        root.querySelectorAll("[data-copy-store]").forEach((button) => {
            button.addEventListener("click", async () => {
                const url = window.location.href.split("#")[0].replace(/[?&]preview=1/, "");
                let ok = false;

                try {
                    await navigator.clipboard.writeText(url);
                    ok = true;
                } catch {
                    try {
                        const helper = document.createElement("textarea");
                        helper.value = url;
                        document.body.appendChild(helper);
                        helper.select();
                        ok = document.execCommand("copy");
                        helper.remove();
                    } catch {}
                }

                button.classList.toggle("copied", ok);
                button.setAttribute("title", ok ? "Link copiado" : "Não foi possível copiar");
                setTimeout(() => button.classList.remove("copied"), 1800);
            });
        });

        // Teclado nas imagens com prévia (Noir)
        root.querySelectorAll('[role="button"][tabindex="0"]').forEach((el) => {
            el.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    el.click();
                }
            });
        });
    }

    // -----------------------------------------------------
    // API PÚBLICA
    // -----------------------------------------------------

    window.StoreTemplates = {
        settingsFor,

        // Aplica cores e desenha. Devolve true se usou um modelo novo,
        // false se a loja deve usar o modelo clássico (app.js).
        render(data, override) {
            const settings = settingsFor(data.store, override);
            const root = document.getElementById("templateRoot");
            const classic = document.getElementById("classicLayout");

            applyColors(settings);
            applyBranding(data);
            document.title = settings.title;

            const renderer = RENDERERS[settings.template.id];

            if (!renderer || !root) {
                if (root) root.innerHTML = "";
                if (root) root.hidden = true;
                if (classic) classic.hidden = false;
                return { modern: false, settings };
            }

            if (classic) classic.hidden = true;
            root.hidden = false;
            root.innerHTML = renderer(data, settings);
            bind(root);

            return { modern: true, settings };
        },

        buyLabel,
        chips,
        image,
        applyBranding
    };

})();

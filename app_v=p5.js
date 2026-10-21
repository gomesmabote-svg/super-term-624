const API_URL = "";
const FALLBACK_STORE_URL = "./mock-store.json";
const nativeFetch = window.fetch.bind(window);

window.fetch = function patchedFetch(input, init) {
    const url = typeof input === "string"
        ? input
        : input && input.url
        ? input.url
        : "";

    if (/\/api\/public\//i.test(url)) {
        const method = (init && init.method) || "GET";

        if (method.toUpperCase() !== "GET") {
            return Promise.resolve(new Response(null, {
                status: 204,
                statusText: "No Content"
            }));
        }

        return nativeFetch(FALLBACK_STORE_URL, init);
    }

    return nativeFetch(input, init);
};

const storeName =
    document.getElementById("storeName");

const categoriesContainer =
    document.getElementById("categoriesContainer");

const productsContainer =
    document.getElementById("productsContainer");


// ======================================================
// VARIÁVEIS GLOBAIS
// ======================================================

let currentStore = null;

let currentStoreData = null;

let currentPreviewProduct = null;

let currentPreviewIndex = 0;


// ======================================================
// ESCAPAR HTML
// ======================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// FORMATAR PREÇO
// ======================================================

function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        price === ""
    ) {
        return "";
    }

    const number =
        Number(price);

    if (Number.isNaN(number)) {
        return String(price);
    }

    return number.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


// ======================================================
// SLUG DA LOJA
// ======================================================

function getStoreSlug() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const querySlug =
        params.get("store");

    if (querySlug) {
        return querySlug;
    }


    const path =
        window.location.pathname
            .replace(/^\/+|\/+$/g, "");


    if (
        path &&
        path !== "index.html"
    ) {
        return path.split("/")[0];
    }


    return "joao";
}


// ======================================================
// DETECTAR TELEGRAM
// ======================================================

function isTelegramUrl(url) {

    if (!url) {
        return false;
    }

    const value =
        url
            .trim()
            .toLowerCase();

    return (
        value.includes("t.me/") ||
        value.includes("telegram.me/")
    );
}


// ======================================================
// LIMPAR USERNAME DO TELEGRAM
// ======================================================

function cleanTelegramUsername(value) {

    if (!value) {
        return "";
    }


    return value
        .trim()
        .replace(/^https?:\/\/(www\.)?t\.me\//i, "")
        .replace(/^https?:\/\/(www\.)?telegram\.me\//i, "")
        .replace(/^t\.me\//i, "")
        .replace(/^telegram\.me\//i, "")
        .replace(/^@+/, "")
        .replace(/\/+$/, "");
}


// ======================================================
// DETECTAR WHATSAPP
// ======================================================

function isWhatsAppUrl(url) {

    if (!url) {
        return false;
    }

    const value =
        url
            .trim()
            .toLowerCase();

    return (
        value.includes("wa.me/") ||
        value.includes("whatsapp.com/")
    );
}


// ======================================================
// MENSAGEM DE COMPRA
// ======================================================

function buildPurchaseMessage(
    product,
    paymentMethod = null
) {

    const price =
        formatPrice(product.price);


    const formattedPrice =
        price
        ? `$${price}`
        : "Price not specified";


    // Com método escolhido: diz como vai pagar.
    // Sem método: pede os detalhes / métodos disponíveis.
    const paymentLine =
        paymentMethod
        ? `\n\nI'll pay with ${paymentMethod}.`
        : "\n\nPlease send me details or payment methods available.";


    return `Hi 👋

I want to purchase:

📦 Content: ${product.name}
💰 Price: ${formattedPrice}${paymentLine}`;
}


// ======================================================
// LINK TELEGRAM
// ======================================================

function buildTelegramUrl(
    username,
    message
) {

    const cleanUsername =
        cleanTelegramUsername(
            username
        );


    if (!cleanUsername) {
        return null;
    }


    return (
        `https://t.me/${cleanUsername}` +
        `?text=${encodeURIComponent(message)}`
    );
}


// ======================================================
// TELEGRAM DA LOJA (pelo @ ou por link encurtado)
// ======================================================

// Junta ?text=mensagem a um link qualquer
function addTextParam(url, message) {
    try {
        const parsed = new URL(url);
        parsed.searchParams.set("text", message);
        return parsed.toString();
    } catch {
        return url;
    }
}

function storeTelegramUrl(store, message) {

    if (!store) {
        return null;
    }

    // Link encurtado escolhido pelo vendedor
    if (
        store.telegram_link_mode === "short" &&
        store.telegram_short_url
    ) {

        // Sabemos para que Telegram o link leva: a mensagem vai sempre
        if (store.telegram_short_target) {
            return buildTelegramUrl(
                store.telegram_short_target,
                message
            );
        }

        return addTextParam(
            store.telegram_short_url,
            message
        );
    }

    return buildTelegramUrl(
        store.telegram_username,
        message
    );
}

function storeHasTelegram(store) {
    return Boolean(
        store &&
        (
            cleanTelegramUsername(store.telegram_username || "") ||
            (store.telegram_link_mode === "short" && store.telegram_short_url)
        )
    );
}


// ======================================================
// LINK WHATSAPP
// ======================================================

function buildWhatsAppUrl(
    url,
    message
) {

    if (!url) {
        return null;
    }


    const separator =
        url.includes("?")
        ? "&"
        : "?";


    return (
        `${url}` +
        `${separator}text=${encodeURIComponent(message)}`
    );
}


// ======================================================
// LINK DE COMPRA DIRETA
// ======================================================

function buildDirectPurchaseUrl(product) {

    const purchaseUrl =
        product.purchase_url;


    if (!purchaseUrl) {
        return null;
    }


    // Compra direta: não há método escolhido
    const message =
        buildPurchaseMessage(
            product
        );


    if (isTelegramUrl(purchaseUrl)) {

        return buildTelegramUrl(
            purchaseUrl,
            message
        );

    }


    if (isWhatsAppUrl(purchaseUrl)) {

        return buildWhatsAppUrl(
            purchaseUrl,
            message
        );

    }


    return purchaseUrl;
}


// ======================================================
// CARREGAR LOJA
// ======================================================

async function loadStore() {

    try {

        const slug =
            getStoreSlug();

        const remoteUrl =
            `${API_URL}/api/public/${encodeURIComponent(slug)}`;

        let response = null;

        try {
            response = await fetch(remoteUrl);
        } catch (remoteError) {
            console.warn("API pública indisponível; usando mock local.", remoteError);
        }

        if (!response || !response.ok) {
            const fallbackResponse = await fetch(FALLBACK_STORE_URL);

            if (!fallbackResponse.ok) {
                throw new Error("Loja não encontrada");
            }

            response = fallbackResponse;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Loja não encontrada"
            );

        }


        currentStore =
            data.store;

        currentStoreData =
            data;


        // Link antigo da loja: mostrar já o endereço novo na barra
        if (data.store.slug && data.store.slug !== slug) {
            try {
                const url = new URL(window.location.href);
                url.pathname = "/";
                url.searchParams.set("store", data.store.slug);
                history.replaceState(null, "", url.toString());
            } catch {}
        }


        storeName.textContent =
            data.store.name;


        renderStore(
            data
        );


        // Uma visita por abertura da loja (o servidor ignora repetições)
        trackStoreEvent("view");


    } catch (error) {

        console.error(
            "Erro ao carregar loja:",
            error
        );


        storeName.textContent =
            "Loja não encontrada";


        categoriesContainer.innerHTML =
            "";


        productsContainer.innerHTML = `

            <div class="store-error">

                <h2>
                    Loja não encontrada
                </h2>

                <p>
                    Verifique o endereço da loja e tente novamente.
                </p>

            </div>

        `;

    }

}


// ======================================================
// RENDERIZAR LOJA
// ======================================================

// Pré-visualização no painel do vendedor (cores ainda por guardar)
let previewOverride = null;

let classicSettings = null;

function renderStore(data) {

    categoriesContainer.innerHTML =
        "";

    productsContainer.innerHTML =
        "";


    // Modelos novos (Aurora, Noir, ...) desenham a loja inteira
    if (window.StoreTemplates) {

        const result =
            window.StoreTemplates.render(
                data,
                previewOverride
            );

        classicSettings =
            result.settings;

        if (result.modern) {
            return;
        }

        storeName.textContent =
            result.settings.title;
    }


    renderTelegramContact(
        data.store
    );


    // Categorias + produtos sem categoria (as categorias são opcionais)
    const knownCategories =
        new Set(
            data.categories.map(
                category => category.id
            )
        );

    const looseProducts =
        data.products.filter(
            product =>
                !product.category_id ||
                !knownCategories.has(product.category_id)
        );

    const sections =
        data.categories.slice();

    if (looseProducts.length) {
        sections.push({
            id: "__none",
            name: data.categories.length ? "Outros" : ""
        });
    }


    sections.forEach(
        category => {

            const categoryProducts =
                category.id === "__none"
                ? looseProducts
                : data.products.filter(
                    product =>
                        product.category_id ===
                        category.id
                );


            if (
                categoryProducts.length === 0
            ) {
                return;
            }


            const categoryElement =
                document.createElement(
                    "section"
                );


            categoryElement.className =
                "category";


            categoryElement.innerHTML = `

                ${
                    category.name
                    ? `
                        <div class="category-header">

                            <h2>
                                ${escapeHTML(
                                    category.name
                                )}
                            </h2>

                        </div>
                    `
                    : ""
                }


                <div class="products">

                    ${categoryProducts
                        .map(
                            product =>
                                createProductCard(
                                    product
                                )
                        )
                        .join("")}

                </div>

            `;


            categoriesContainer.appendChild(
                categoryElement
            );

        }
    );


    if (
        categoriesContainer.children.length === 0
    ) {

        productsContainer.innerHTML = `

            <div class="empty-store">

                <h2>
                    Nenhum produto disponível
                </h2>

                <p>
                    Esta loja ainda não possui produtos publicados.
                </p>

            </div>

        `;

    }

}


// ======================================================
// TELEGRAM DA LOJA
// ======================================================

function renderTelegramContact(store) {

    const existing =
        document.getElementById(
            "storeTelegramContact"
        );


    if (existing) {
        existing.remove();
    }


    // O vendedor escolhe se o botão aparece no topo da loja
    if (
        !storeHasTelegram(store) ||
        store.show_telegram_button !== true
    ) {
        return;
    }


    const link =
        storeTelegramUrl(
            store,
            "Hi 👋\n\nI would like to know more about your products."
        );


    if (!link) {
        return;
    }


    const contact =
        document.createElement(
            "div"
        );


    contact.id =
        "storeTelegramContact";


    contact.className =
        "store-telegram-contact";


    const logo =
        store.telegram_logo_url
        ? `
            <img
                src="${escapeHTML(
                    store.telegram_logo_url
                )}"
                alt="Telegram"
            >
        `
        : "";


    contact.innerHTML = `

        <a
            href="${escapeHTML(link)}"
            target="_blank"
            rel="noopener noreferrer"
            data-hf-link
        >

            ${logo}

            <span>
                Falar connosco no Telegram
            </span>

        </a>

    `;


    const header =
        document.querySelector(
            ".header"
        );


    if (header) {

        header.appendChild(
            contact
        );

    }

}


// ======================================================
// CARTÃO DO PRODUTO
// ======================================================

function createProductCard(product) {

    const hasPreview =
        Array.isArray(
            product.previews
        ) &&
        product.previews.length > 0;


    const price =
        formatPrice(
            product.price
        );


    const buyText =
        classicSettings && window.StoreTemplates
        ? window.StoreTemplates.buyLabel(
            classicSettings,
            product
        )
        : price
        ? `BUY NOW FOR $${price}`
        : "BUY NOW";


    const previewText =
        classicSettings?.texts?.previewLabel ||
        "PREVIEW";


    const telegramLogo =
        currentStore &&
        currentStore.telegram_logo_url &&
        (
            product.purchase_mode === "TELEGRAM" ||
            (product.purchase_mode === "DIRECT" && isTelegramUrl(product.purchase_url))
        )
        ? `
            <img
                class="buy-button-logo"
                src="${escapeHTML(
                    currentStore.telegram_logo_url
                )}"
                alt="Telegram"
            >
        `
        : "";


    return `

        <article
            class="product"
            data-product-id="${product.id}"
        >

            <div class="product-cover">

                ${
                    product.image_url
                    ? `
                        <img
                            src="${escapeHTML(
                                product.image_url
                            )}"
                            alt="${escapeHTML(
                                product.name
                            )}"
                            loading="lazy"
                        >
                    `
                    : hasPreview && window.StoreTemplates
                    ? window.StoreTemplates.image(
                        product,
                        "product-cover-video"
                    )
                    : `
                        <div class="product-cover-placeholder">
                            Sem imagem
                        </div>
                    `
                }

            </div>


            <div class="product-content">

                <div class="product-name">
                    ${escapeHTML(
                        product.name
                    )}
                </div>


                ${
                    product.description
                    ? `
                        <div class="product-description">
                            ${escapeHTML(
                                product.description
                            )}
                        </div>
                    `
                    : ""
                }


                ${
                    window.StoreTemplates
                    ? window.StoreTemplates.chips(product, "classic-chips")
                    : ""
                }


                <div class="product-actions">

                    ${
                        hasPreview
                        ? `
                            <button
                                type="button"
                                class="product-button preview-button"
                                onclick="openPreview(${product.id})"
                            >
                                ${escapeHTML(previewText)}
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="product-button preview-button disabled"
                                disabled
                            >
                                ${escapeHTML(previewText)}
                            </button>
                        `
                    }


                    <button
                        type="button"
                        class="product-button buy-button"
                        onclick="handleBuy(${product.id})"
                    >

                        ${telegramLogo}

                        <span>
                            ${escapeHTML(
                                buyText
                            )}
                        </span>

                    </button>

                </div>

            </div>

        </article>

    `;
}


// ======================================================
// ENCONTRAR PRODUTO
// ======================================================

function findProduct(productId) {

    if (!currentStoreData) {
        return null;
    }


    return currentStoreData.products.find(
        product =>
            Number(product.id) ===
            Number(productId)
    ) || null;
}


// ======================================================
// ABRIR PREVIEW
// ======================================================

function openPreview(productId) {

    const product =
        findProduct(
            productId
        );


    if (!product) {
        return;
    }


    if (
        !product.previews ||
        product.previews.length === 0
    ) {
        return;
    }


    currentPreviewProduct =
        product;


    currentPreviewIndex =
        0;


    trackStoreEvent("preview", product.id);


    createPreviewModal();


    renderCurrentPreview();

}


// ======================================================
// CRIAR MODAL DE PREVIEW
// ======================================================

function createPreviewModal() {

    const oldModal =
        document.getElementById(
            "previewModal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "previewModal";


    modal.className =
        "public-modal";


    modal.innerHTML = `

        <div
            class="public-modal-overlay"
            onclick="closePreview()"
        ></div>


        <div
            class="public-modal-content preview-modal-content"
        >

            <button
                type="button"
                class="modal-close"
                onclick="closePreview()"
                aria-label="Fechar"
            >
                ×
            </button>


            <div
                id="previewPlayerContainer"
                class="preview-player-container"
            ></div>


            <div
                id="previewNavigation"
                class="preview-navigation"
            ></div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document.body.classList.add(
        "modal-open"
    );

}


// ======================================================
// RENDERIZAR PREVIEW
// ======================================================

function renderCurrentPreview() {

    if (!currentPreviewProduct) {
        return;
    }


    const previews =
        currentPreviewProduct.previews;


    if (!previews.length) {
        return;
    }


    const preview =
        previews[currentPreviewIndex];


    const playerContainer =
        document.getElementById(
            "previewPlayerContainer"
        );


    const navigation =
        document.getElementById(
            "previewNavigation"
        );


    if (!playerContainer) {
        return;
    }


    playerContainer.innerHTML = `

        <div class="preview-title">

            <h3>
                ${escapeHTML(
                    currentPreviewProduct.name
                )}
            </h3>

            <span>
                Preview ${currentPreviewIndex + 1}
                de ${previews.length}
            </span>

        </div>


        <video
            class="preview-video"
            src="${escapeHTML(
                preview.video_url
            )}"
            controls
            autoplay
            playsinline
        ></video>

    `;


    if (
        previews.length <= 1
    ) {

        navigation.innerHTML =
            "";

        return;
    }


    navigation.innerHTML = `

        <button
            type="button"
            class="preview-nav-button"
            onclick="previousPreview()"
            ${
                currentPreviewIndex === 0
                ? "disabled"
                : ""
            }
        >
            ANTERIOR
        </button>


        <span>
            ${currentPreviewIndex + 1}
            /
            ${previews.length}
        </span>


        <button
            type="button"
            class="preview-nav-button"
            onclick="nextPreview()"
            ${
                currentPreviewIndex ===
                previews.length - 1
                ? "disabled"
                : ""
            }
        >
            PRÓXIMO
        </button>

    `;

}


// ======================================================
// PRÓXIMO PREVIEW
// ======================================================

function nextPreview() {

    if (!currentPreviewProduct) {
        return;
    }


    if (
        currentPreviewIndex <
        currentPreviewProduct.previews.length - 1
    ) {

        currentPreviewIndex++;

        renderCurrentPreview();

    }

}


// ======================================================
// PREVIEW ANTERIOR
// ======================================================

function previousPreview() {

    if (!currentPreviewProduct) {
        return;
    }


    if (
        currentPreviewIndex > 0
    ) {

        currentPreviewIndex--;

        renderCurrentPreview();

    }

}


// ======================================================
// FECHAR PREVIEW
// ======================================================

function closePreview() {

    const modal =
        document.getElementById(
            "previewModal"
        );


    if (modal) {
        modal.remove();
    }


    currentPreviewProduct =
        null;

    currentPreviewIndex =
        0;


    document.body.classList.remove(
        "modal-open"
    );

}


// ======================================================
// AVISAR O VENDEDOR (notificação "Nova compra gerada")
// ======================================================

// Métricas: visitas à loja e prévias abertas (não conta a
// pré-visualização dentro do painel do vendedor)
function isPanelPreview() {
    try {
        return /[?&]preview=1/.test(window.location.search) || window.self !== window.top;
    } catch (error) {
        return true;
    }
}

function trackStoreEvent(type, productId) {

    if (isPanelPreview()) {
        return;
    }

    try {

        const slug = getStoreSlug();

        if (!slug) {
            return;
        }

        fetch(
            `${API_URL}/api/public/${encodeURIComponent(slug)}/event`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type,
                    productId: productId || undefined
                }),
                keepalive: true
            }
        ).catch(() => {});

    } catch (error) {
        // as métricas nunca impedem a loja de funcionar
    }

}


function trackPurchase(productId, methodName) {

    if (isPanelPreview()) {
        return;
    }


    try {

        const slug = getStoreSlug();

        if (!slug) {
            return;
        }

        fetch(
            `${API_URL}/api/public/${encodeURIComponent(slug)}/purchase`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    productId,
                    method: methodName || undefined
                }),
                keepalive: true
            }
        ).catch(() => {});

    } catch (error) {
        // nunca impede a compra
    }

}


// Botões de método de pagamento (popup)
document.addEventListener("click", (event) => {

    const link =
        event.target.closest(
            "[data-track-product]"
        );

    if (!link) {
        return;
    }

    trackPurchase(
        Number(link.dataset.trackProduct),
        link.dataset.trackMethod
    );

});


// ======================================================
// COMPRAR
// ======================================================

function handleBuy(productId) {

    const product =
        findProduct(
            productId
        );


    if (!product) {
        return;
    }


    if (
        product.purchase_mode ===
        "PAYMENT_POPUP"
    ) {

        openPaymentModal(
            product
        );

        return;
    }


    // Telegram direto: abre a conversa com o Telegram da loja
    if (product.purchase_mode === "TELEGRAM") {

        const telegramUrl =
            currentStore &&
            storeTelegramUrl(
                currentStore,
                buildPurchaseMessage(product)
            );

        if (!telegramUrl) {

            alert(
                "Esta loja ainda não configurou o Telegram."
            );

            return;
        }

        trackPurchase(
            product.id,
            "Telegram"
        );

        openPurchaseLink(
            telegramUrl
        );

        return;
    }


    const url =
        buildDirectPurchaseUrl(
            product
        );


    if (!url) {

        alert(
            "Este produto ainda não possui um link de compra."
        );

        return;
    }


    trackPurchase(
        product.id
    );


    openPurchaseLink(
        url
    );

}


// Abre o link de compra. O Telegram abre direto na app (sem
// passar pelos navegadores do X, Instagram, etc.)
function openPurchaseLink(url) {

    if (window.HFExternal) {
        window.HFExternal.openLink(url);
        return;
    }

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


// ======================================================
// ABRIR POPUP DE PAGAMENTO
// ======================================================

function openPaymentModal(product) {

    const methods =
        Array.isArray(
            product.payment_methods
        )
        ? product.payment_methods
        : [];


    if (
        methods.length === 0
    ) {

        alert(
            "Este produto ainda não possui métodos de pagamento."
        );

        return;
    }


    const oldModal =
        document.getElementById(
            "paymentModal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "paymentModal";


    modal.className =
        "public-modal";


    modal.innerHTML = `

        <div
            class="public-modal-overlay"
            onclick="closePaymentModal()"
        ></div>


        <div
            class="public-modal-content payment-modal-content"
        >

            <button
                type="button"
                class="modal-close"
                onclick="closePaymentModal()"
                aria-label="Fechar"
            >
                ×
            </button>


            <div class="payment-modal-header">

                <h2>
                    Choose payment method
                </h2>

                <p>
                    ${escapeHTML(
                        product.name
                    )}
                </p>

            </div>


            <div class="payment-methods-public">

                ${methods
                    .map(
                        method =>
                            createPublicPaymentMethod(
                                product,
                                method
                            )
                    )
                    .join("")}

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document.body.classList.add(
        "modal-open"
    );

}


// ======================================================
// MÉTODO DE PAGAMENTO PÚBLICO
// ======================================================

function createPublicPaymentMethod(
    product,
    method
) {

    let destination =
        method.redirect_url;


    const message =
        buildPurchaseMessage(
            product,
            method.name
        );


    // ==================================================
    // TELEGRAM
    // ==================================================

    if (
        method.redirect_type ===
        "TELEGRAM"
    ) {

        destination =
            storeTelegramUrl(
                currentStore,
                message
            );

    }


    // ==================================================
    // WHATSAPP
    // ==================================================

    if (
        method.redirect_type ===
        "WHATSAPP"
    ) {

        destination =
            buildWhatsAppUrl(
                method.redirect_url,
                message
            );

    }


    // Link próprio que é do Telegram ou do WhatsApp: leva a mensagem
    // com o produto, o preço e o método escolhido
    if (
        method.redirect_type === "CUSTOM" &&
        destination
    ) {

        if (isTelegramUrl(destination)) {
            destination =
                buildTelegramUrl(destination.split("?")[0], message) ||
                destination;
        } else if (isWhatsAppUrl(destination)) {
            destination =
                buildWhatsAppUrl(destination.replace(/[?&]text=[^&]*/i, ""), message) ||
                destination;
        }

    }


    if (!destination) {

        return `

            <button
                type="button"
                class="public-payment-method disabled"
                disabled
            >

                ${
                    method.image_url
                    ? `
                        <img
                            src="${escapeHTML(
                                method.image_url
                            )}"
                            alt=""
                        >
                    `
                    : ""
                }

                <span>
                    ${escapeHTML(
                        method.name
                    )}
                </span>

            </button>

        `;

    }


    const buttonColor =
        method.color ||
        "#222222";


    return `

        <a
            class="public-payment-method"
            data-track-product="${escapeHTML(
                product.id
            )}"
            data-track-method="${escapeHTML(
                method.name
            )}"
            href="${escapeHTML(
                destination
            )}"
            target="_blank"
            rel="noopener noreferrer"
            style="--payment-color: ${escapeHTML(
                buttonColor
            )};"
        >

            ${
                method.image_url
                ? `
                    <img
                        src="${escapeHTML(
                            method.image_url
                        )}"
                        alt=""
                    >
                `
                : ""
            }


            <span>
                ${escapeHTML(
                    method.name
                )}
            </span>

        </a>

    `;

}


// ======================================================
// FECHAR POPUP DE PAGAMENTO
// ======================================================

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {
        modal.remove();
    }


    document.body.classList.remove(
        "modal-open"
    );

}


// ======================================================
// ESC FECHA MODAIS
// ======================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {
            return;
        }


        closePreview();

        closePaymentModal();

    }
);


// ======================================================
// PRÉ-VISUALIZAÇÃO A PARTIR DO PAINEL DO VENDEDOR
// O painel envia o modelo e as cores ainda não guardados.
// ======================================================

window.addEventListener("message", (event) => {

    if (
        event.origin !== window.location.origin ||
        !event.data ||
        event.data.type !== "hf-store-preview"
    ) {
        return;
    }


    previewOverride = {
        template: event.data.template,
        theme: event.data.theme
    };


    if (currentStoreData) {
        renderStore(currentStoreData);
    }

});


// ======================================================
// INICIAR
// ======================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadStore);
} else {
    loadStore();
}
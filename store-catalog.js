// =========================================================
// MODELOS (TEMPLATES) DA LOJA PÚBLICA
// Fonte única: usada pelo servidor (validação) e enviada ao
// browser em /store-catalog.js (painel do vendedor e loja).
// =========================================================

(function (root) {

    // Campos que o vendedor pode editar (rótulos em português)
    const COLOR_FIELDS = {
        bg: "Fundo da página",
        headerBg: "Fundo do topo",
        surface: "Caixa dos produtos",
        text: "Texto principal",
        muted: "Texto secundário",
        accent: "Cor de destaque",
        frame: "Moldura das imagens",
        priceBg: "Etiqueta do preço",
        priceText: "Texto da etiqueta do preço",
        buyBg: "Botão de compra",
        buyText: "Texto do botão de compra",
        previewBg: "Botão de prévias",
        previewText: "Texto do botão de prévias",
        dot: "Pontos dos destaques do produto"
    };

    const TEXT_FIELDS = {
        title: "Título do topo",
        subtitle: "Subtítulo",
        sectionTitle: "Título da secção de destaques",
        buyLabel: "Texto do botão de compra",
        previewLabel: "Texto do botão de prévias"
    };

    const TEXT_HINTS = {
        title: "Vazio = nome da loja.",
        buyLabel: "Use {preço} para mostrar o preço. Ex.: COMPRAR POR {preço}",
        sectionTitle: "Vazio = esconder o título."
    };

    const TEMPLATES = [
        {
            id: "classic",
            name: "Clássico",
            description: "O modelo padrão da plataforma: fundo escuro e produtos organizados por categorias.",
            categories: "grouped",
            colors: {
                bg: "#070707",
                headerBg: "#000000",
                surface: "#141414",
                text: "#ffffff",
                muted: "#b3b3b3",
                accent: "#e50914",
                buyBg: "#229ed9",
                buyText: "#ffffff",
                previewBg: "#ffffff",
                previewText: "#111111",
                dot: "#e50914"
            },
            texts: {
                title: "",
                buyLabel: "BUY NOW FOR {preço}",
                previewLabel: "PREVIEW"
            }
        },
        {
            id: "aurora",
            name: "Aurora",
            description: "Claro e suave, com destaques em carrossel, cartões grandes e barra fixa em baixo.",
            categories: "tabs",
            colors: {
                bg: "#eeecf8",
                headerBg: "#ffffff",
                surface: "#ffffff",
                text: "#1b1a2e",
                muted: "#6e6a85",
                accent: "#6c55e0",
                frame: "#a51fd6",
                priceBg: "#1f1d2e",
                priceText: "#ffffff",
                buyBg: "#1f1d2e",
                buyText: "#ffffff",
                previewBg: "#ece9fb",
                previewText: "#4c3fb3",
                dot: "#6c55e0"
            },
            texts: {
                title: "",
                subtitle: "instant preview · buy now",
                sectionTitle: "✨ Highlights",
                buyLabel: "Buy now",
                previewLabel: "Preview"
            }
        },
        {
            id: "noir",
            name: "Noir",
            description: "Escuro, numa coluna central estreita: imagem grande e botão de compra em cada produto.",
            categories: "headings",
            colors: {
                bg: "#0b0b10",
                headerBg: "#1a0b10",
                surface: "#15151c",
                text: "#ffffff",
                muted: "#9a9aa6",
                accent: "#e3202d",
                buyBg: "#c0151f",
                buyText: "#ffffff",
                previewBg: "#24242e",
                previewText: "#ffffff",
                dot: "#e3202d"
            },
            texts: {
                title: "Content Previews",
                subtitle: "Browse the previews below and select the content you're interested in. Click Buy Now to order instantly via Telegram.",
                buyLabel: "BUY NOW",
                previewLabel: "PREVIEW"
            }
        },
        {
            id: "prisma",
            name: "Prisma",
            description: "Grelha clara com molduras em degradé, preço sobre a imagem e filtros por categoria.",
            categories: "tabs",
            colors: {
                bg: "#f7f7fb",
                headerBg: "#ffffff",
                surface: "#ffffff",
                text: "#14141f",
                muted: "#62627a",
                accent: "#ff3d7f",
                frame: "#3d7bff",
                priceBg: "#ffffff",
                priceText: "#14141f",
                buyBg: "#14141f",
                buyText: "#ffffff",
                previewBg: "#f0f0f6",
                previewText: "#14141f",
                dot: "#ff3d7f"
            },
            texts: {
                title: "",
                subtitle: "Escolha, veja a prévia e compre em segundos.",
                buyLabel: "Comprar · {preço}",
                previewLabel: "Prévia"
            }
        },
        {
            id: "eclipse",
            name: "Eclipse",
            description: "Escuro e elegante: o primeiro produto em destaque e os restantes em lista.",
            categories: "headings",
            colors: {
                bg: "#0f0d0b",
                headerBg: "#0f0d0b",
                surface: "#1a1714",
                text: "#f6efe4",
                muted: "#a89c8c",
                accent: "#e8b54a",
                buyBg: "#e8b54a",
                buyText: "#1a1205",
                previewBg: "#2a2520",
                previewText: "#f6efe4",
                dot: "#e8b54a"
            },
            texts: {
                title: "",
                subtitle: "Seleção da casa",
                sectionTitle: "Em destaque",
                buyLabel: "Comprar {preço}",
                previewLabel: "Ver prévia"
            }
        },
        {
            id: "brisa",
            name: "Brisa",
            description: "Leve e arejado: topo colorido, separadores de categoria e cartões horizontais.",
            categories: "tabs",
            colors: {
                bg: "#f3f8f6",
                headerBg: "#2f9e7a",
                surface: "#ffffff",
                text: "#14302a",
                muted: "#56706a",
                accent: "#2f9e7a",
                buyBg: "#2f9e7a",
                buyText: "#ffffff",
                previewBg: "#e3f1ec",
                previewText: "#1f6e55",
                dot: "#2f9e7a"
            },
            texts: {
                title: "",
                subtitle: "Bem-vindo! Escolha o que procura.",
                buyLabel: "Comprar {preço}",
                previewLabel: "Prévia"
            }
        },
        {
            id: "neon",
            name: "Néon",
            description: "Preto com brilho néon, destaques em círculos e grelha de cartões luminosos.",
            categories: "tabs",
            colors: {
                bg: "#05050a",
                headerBg: "#05050a",
                surface: "#0d0d18",
                text: "#f2f4ff",
                muted: "#8d93b8",
                accent: "#22e4ff",
                frame: "#ff2bd6",
                buyBg: "#22e4ff",
                buyText: "#03141a",
                previewBg: "#16162a",
                previewText: "#f2f4ff",
                dot: "#22e4ff"
            },
            texts: {
                title: "",
                subtitle: "Toque num destaque para ver a prévia",
                sectionTitle: "Destaques",
                buyLabel: "BUY · {preço}",
                previewLabel: "PREVIEW"
            }
        }
    ];

    const DEFAULT_TEMPLATE = "classic";

    function getTemplate(id) {
        return TEMPLATES.find((t) => t.id === id) ||
            TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE);
    }

    const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

    // Limpa o tema recebido: só campos conhecidos, cores válidas e textos curtos.
    // Formato: { logoUrl, templates: { [id]: { colors: {...}, texts: {...} } } }
    function sanitizeTheme(input) {
        const out = { logoUrl: "", templates: {} };

        if (!input || typeof input !== "object") {
            return out;
        }

        if (typeof input.logoUrl === "string") {
            const url = input.logoUrl.trim().slice(0, 500);
            if (/^https?:\/\//i.test(url)) out.logoUrl = url;
        }

        const templates = input.templates && typeof input.templates === "object"
            ? input.templates
            : {};

        TEMPLATES.forEach((template) => {
            const given = templates[template.id];

            if (!given || typeof given !== "object") return;

            const clean = { colors: {}, texts: {} };

            Object.keys(template.colors).forEach((key) => {
                const value = given.colors && given.colors[key];
                if (typeof value === "string" && HEX.test(value.trim())) {
                    clean.colors[key] = value.trim().toLowerCase();
                }
            });

            Object.keys(template.texts).forEach((key) => {
                const value = given.texts && given.texts[key];
                if (typeof value === "string") {
                    clean.texts[key] = value.replace(/[\u0000-\u001f]/g, " ").slice(0, key === "subtitle" ? 220 : 80);
                }
            });

            if (Object.keys(clean.colors).length || Object.keys(clean.texts).length) {
                out.templates[template.id] = clean;
            }
        });

        return out;
    }

    const catalog = {
        COLOR_FIELDS,
        TEXT_FIELDS,
        TEXT_HINTS,
        TEMPLATES,
        DEFAULT_TEMPLATE,
        getTemplate,
        sanitizeTheme
    };

    if (typeof module === "object" && module.exports) {
        module.exports = catalog;
    } else {
        root.StoreCatalog = catalog;
    }

})(typeof window !== "undefined" ? window : globalThis);

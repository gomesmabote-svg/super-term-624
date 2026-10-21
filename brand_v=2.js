// =========================================================
// Hot developments Inc. — marca de água + "Todos os direitos reservados"
// Coloca o rodapé dentro de [data-hd-footer] (se existir) ou no fim da página.
// Nas lojas (script com data-no-privacy) não mostra o link "Privacidade":
// o cliente final só precisa de ver os produtos.
// =========================================================

(function () {
    var COMPANY = "Hot developments Inc.";
    var script = document.currentScript;
    var showPrivacy = !(script && script.hasAttribute("data-no-privacy"));

    function build() {
        var year = new Date().getFullYear();

        // Ícone do separador do browser
        if (!document.querySelector('link[rel~="icon"]')) {
            var icon = document.createElement("link");
            icon.rel = "icon";
            icon.type = "image/svg+xml";
            icon.href = "./brand/hotflixx-x.svg";
            document.head.appendChild(icon);
        }

        if (!document.querySelector(".hd-footer")) {
            var footer = document.createElement("footer");
            footer.className = "hd-footer";
            footer.innerHTML =
                "© " + year + ' <span class="hd-company">' + COMPANY + "</span>" +
                " Todos os direitos reservados." +
                (showPrivacy ? ' · <a href="/privacidade.html">Privacidade</a>' : "");

            var slot = document.querySelector("[data-hd-footer]");
            var target = slot ||
                document.querySelector(".main-wrapper") ||
                document.querySelector(".main-content") ||
                document.body;

            target.appendChild(footer);
        }

        if (!document.querySelector(".hd-watermark")) {
            var mark = document.createElement("div");
            mark.className = "hd-watermark";
            mark.setAttribute("aria-hidden", "true");
            mark.textContent = COMPANY;
            document.body.appendChild(mark);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", build);
    } else {
        build();
    }
})();

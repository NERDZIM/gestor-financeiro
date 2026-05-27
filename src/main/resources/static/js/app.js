(function () {
    const storageKey = "gestor-financeiro-theme";

    function csrf() {
        return {
            token: document.querySelector("meta[name='_csrf']")?.content,
            header: document.querySelector("meta[name='_csrf_header']")?.content
        };
    }

    function hydrate(root) {
        root.querySelectorAll("[data-open-panel]").forEach((button) => {
            if (button.dataset.boundOpenPanel) {
                return;
            }

            button.dataset.boundOpenPanel = "true";
            button.addEventListener("click", () => openPanel(button.dataset.openPanel));
        });

        root.querySelectorAll("[data-menu-toggle]").forEach((button) => {
            if (button.dataset.boundMenuToggle) {
                return;
            }

            button.dataset.boundMenuToggle = "true";
            button.addEventListener("click", () => document.body.classList.toggle("menu-open"));
        });

        root.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            if (button.dataset.boundThemeToggle) {
                return;
            }

            button.dataset.boundThemeToggle = "true";
            button.addEventListener("click", toggleTheme);
        });

        root.querySelectorAll("[data-bot-action]").forEach((button) => {
            if (button.dataset.boundBotAction) {
                return;
            }

            button.dataset.boundBotAction = "true";
            button.addEventListener("click", () => askBot(button.dataset.botAction));
        });
    }

    function openPanel(panelName) {
        document.querySelectorAll(".dashboard-panel").forEach((panel) => {
            panel.classList.toggle("is-active", panel.id === "panel-" + panelName);
        });

        document.querySelectorAll("[data-open-panel]").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.openPanel === panelName);
        });

        document.body.classList.remove("menu-open");
        
        // Atualizar título dinamicamente
        updatePageTitle(panelName);
    }
    
    function updatePageTitle(panelName) {
        const titles = {
            "dashboard": "Dashboard",
            "planejamento": "Metas e Gráficos",
            "assistente": "IA Local",
            "perfil": "Perfil e Tema",
            "futuro": "Pix, Cripto e Acoes",
            "seguranca": "Seguranca e Privacidade"
        };
        
        const mainTitle = document.querySelector("#page-title-main");
        if (mainTitle && titles[panelName]) {
            mainTitle.textContent = titles[panelName];
        }
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(storageKey, theme);
    }

    function toggleTheme() {
        const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        applyTheme(current === "dark" ? "light" : "dark");
    }

    function replaceTarget(targetSelector, html, swap) {
        const target = document.querySelector(targetSelector);
        const activePanel = document.querySelector(".dashboard-panel.is-active")?.id.replace("panel-", "");

        if (!target) {
            return;
        }

        if (swap === "outerHTML") {
            target.outerHTML = html;
            hydrate(document);
            if (activePanel) {
                openPanel(activePanel);
            }
            return;
        }

        target.innerHTML = html;
        hydrate(target);
    }

    async function submitAjax(form) {
        const url = form.getAttribute("hx-post") || form.action;
        const target = form.getAttribute("hx-target") || "#dashboard-content";
        const swap = form.getAttribute("hx-swap") || "innerHTML";
        const security = csrf();
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "HX-Request": "true"
        };

        if (security.token && security.header) {
            headers[security.header] = security.token;
        }

        form.classList.add("is-loading");

        try {
            const response = await fetch(url, {
                method: "POST",
                credentials: "same-origin",
                headers,
                body: new URLSearchParams(new FormData(form))
            });

            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            replaceTarget(target, await response.text(), swap);
        } finally {
            form.classList.remove("is-loading");
        }
    }

    async function clickAjax(trigger) {
        const url = trigger.getAttribute("hx-get");
        const target = trigger.getAttribute("hx-target") || "#dashboard-content";
        const swap = trigger.getAttribute("hx-swap") || "innerHTML";
        const response = await fetch(url, {
            method: "GET",
            credentials: "same-origin",
            headers: { "HX-Request": "true" }
        });

        replaceTarget(target, await response.text(), swap);
    }

    function askBot(topic) {
        const bot = document.querySelector("#finance-bot");
        const feed = document.querySelector("#bot-feed");

        if (!bot || !feed) {
            return;
        }

        const saldo = bot.dataset.saldo || "0,00";
        const receitas = bot.dataset.receitas || "0,00";
        const despesas = bot.dataset.despesas || "0,00";
        const categoria = bot.dataset.categoria || "nenhuma categoria";
        const economia = bot.dataset.economia || "0,00";
        const answers = {
            resumo: "Seu saldo atual e R$ " + saldo + ". Neste mes voce recebeu R$ " + receitas + " e gastou R$ " + despesas + ".",
            otimizar: "Comece revisando " + categoria + ". Separar R$ " + economia + " para a reserva ja cria um bom ritmo.",
            futuro: "Recursos como Pix, cripto e acoes devem entrar com consentimento claro, limites por transacao e conexoes protegidas."
        };

        const message = document.createElement("div");
        message.className = "bot-message";
        message.textContent = answers[topic] || answers.resumo;
        feed.appendChild(message);
        feed.scrollTop = feed.scrollHeight;
    }
    
    function handleBotSend() {
        const input = document.querySelector("#bot-input");
        const feed = document.querySelector("#bot-feed");
        
        if (!input || !feed || !input.value.trim()) {
            return;
        }
        
        // Remover mensagem inicial se existir
        const initialMsg = feed.querySelector(".bot-initial");
        if (initialMsg) {
            initialMsg.remove();
        }
        
        // Adicionar mensagem do usuario
        const userMsg = document.createElement("div");
        userMsg.className = "bot-message user-message";
        userMsg.textContent = input.value;
        feed.appendChild(userMsg);
        
        // Simular resposta da IA
        const bot = document.querySelector("#finance-bot");
        const saldo = bot?.dataset.saldo || "0,00";
        const receitas = bot?.dataset.receitas || "0,00";
        const despesas = bot?.dataset.despesas || "0,00";
        
        const botMsg = document.createElement("div");
        botMsg.className = "bot-message";
        botMsg.textContent = "Voce perguntou sobre: '" + input.value + "'. Seu saldo atual e R$ " + saldo + ".";
        feed.appendChild(botMsg);
        
        input.value = "";
        feed.scrollTop = feed.scrollHeight;
    }

    document.addEventListener("submit", (event) => {
        const form = event.target.closest("form[hx-post]");

        if (!form) {
            return;
        }

        event.preventDefault();
        submitAjax(form);
    });

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[hx-get]");

        if (!trigger) {
            return;
        }

        event.preventDefault();
        clickAjax(trigger);
    });

    function bindBotSendButton() {\n        const sendBtn = document.querySelector("#bot-send");\n        const input = document.querySelector("#bot-input");\n        \n        if (!sendBtn || !input) {\n            return;\n        }\n        \n        sendBtn.addEventListener("click", handleBotSend);\n        input.addEventListener("keypress", (e) => {\n            if (e.key === "Enter") {\n                handleBotSend();\n            }\n        });\n    }\n\n    document.addEventListener("DOMContentLoaded", () => {\n        applyTheme(localStorage.getItem(storageKey) || "light");\n        hydrate(document);\n        bindBotSendButton();\n    });\n})();

// detalhes.js
// 00:02 – botões condicionais + barra de progresso

const params = new URLSearchParams(window.location.search);
const pkg = params.get("pkg");

if (!pkg) {
    console.error("Parâmetro ?pkg= não informado");
}

const URL_RECOMENDADOS = "recomendados.json";

let pacotesInstalados = new Set();
let pacotesComUpdate = new Set();

// --------- helpers daemon / detecção ---------

function esperarDetectAndistro(timeoutMs = 3000) {
    return new Promise((resolve) => {
        const inicio = Date.now();
        const checar = () => {
            if (typeof window.__IS_ANDISTRO__ !== "undefined") {
                resolve();
                return;
            }
            if (Date.now() - inicio > timeoutMs) {
                resolve();
                return;
            }
            setTimeout(checar, 50);
        };
        checar();
    });
}

async function carregarInstaladosENovos() {
    pacotesInstalados = new Set();
    pacotesComUpdate = new Set();

    if (!window.__IS_ANDISTRO__) {
        console.log("Não é AnDistro, pulando status APT.");
        return;
    }

    try {
        const resInst = await fetch("http://127.0.0.1:27777/installed-names");
        if (resInst.ok) {
            const dataInst = await resInst.json();
            const names = dataInst.packages || [];
            pacotesInstalados = new Set(names);
        }

        const resUpd = await fetch("http://127.0.0.1:27777/updates");
        if (resUpd.ok) {
            const dataUpd = await resUpd.json();
            const updates = dataUpd.updates || [];
            pacotesComUpdate = new Set(updates.map((u) => u.nome_pacote));
        }
    } catch (e) {
        console.error("Erro ao carregar status APT:", e);
        pacotesInstalados = new Set();
        pacotesComUpdate = new Set();
    }
}

// descrição via daemon (fallback)
async function obterDescricaoViaDaemon(nomePacote) {
    if (!window.__IS_ANDISTRO__) return "";

    try {
        const url =
            "http://127.0.0.1:27777/search?q=" + encodeURIComponent(nomePacote);
        const res = await fetch(url);
        if (!res.ok) return "";

        const data = await res.json();
        const itens = data.results || [];
        const encontrado = itens.find((p) => p.nome_pacote === nomePacote);
        return encontrado && encontrado.descricao ? encontrado.descricao : "";
    } catch (e) {
        console.error("Erro ao obter descrição via daemon:", e);
        return "";
    }
}

// --------- helpers UI de progresso ---------

function iniciarProgressoBotao(btn, textoCarregando) {
    // guarda texto e bg originais
    if (!btn.dataset.labelOriginal) {
        btn.dataset.labelOriginal = btn.textContent.trim();
    }
    if (!btn.dataset.bgOriginal) {
        const style = window.getComputedStyle(btn);
        btn.dataset.bgOriginal = style.backgroundColor;
    }

    btn.disabled = true;
    btn.classList.add("btn-progress");
    btn.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.className = "btn-progress-inner";

    const bar = document.createElement("div");
    bar.className = "btn-progress-bar";

    const label = document.createElement("span");
    label.className = "btn-progress-label";
    label.textContent = textoCarregando;

    wrapper.appendChild(bar);
    wrapper.appendChild(label);

    btn.innerHTML = "";
    btn.appendChild(wrapper);

    // usa a cor atual do botão como cor de progresso
    bar.style.backgroundColor = btn.dataset.bgOriginal;

    // animação contínua (fake progresso)
    let pct = 0;
    const step = () => {
        pct += 4;
        if (pct > 100) pct = 0;
        bar.style.width = pct + "%";

        if (btn.dataset.progressStop === "1") {
            return;
        }
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function finalizarProgressoBotao(btn, novoTexto) {
    btn.dataset.progressStop = "1";
    btn.classList.remove("btn-progress");
    btn.disabled = false;
    btn.innerHTML = "";
    btn.textContent = novoTexto || btn.dataset.labelOriginal || "";
    delete btn.dataset.progressStop;
}

// --------- fluxo principal ---------

async function carregarPrograma() {
    await esperarDetectAndistro();
    await carregarInstaladosENovos();

    let programa = {
        nome_programa: pkg,
        nome_pacote: pkg,
    };

    try {
        const res = await fetch(URL_RECOMENDADOS);
        if (res.ok) {
            const lista = await res.json();
            const encontrado = lista.find((p) => p.nome_pacote === pkg) || null;
            if (encontrado) programa = encontrado;
        }
    } catch (e) {
        console.error("Erro ao carregar recomendados.json", e);
    }

    montarPagina(programa);
}

function montarPagina(programa) {
    document.title = `${programa.nome_programa} — Central de aplicativos`;
    document.getElementById("titulo").textContent =
        `${programa.nome_programa} — Central de aplicativos`;

    const container = document.getElementById("cards-container");
    container.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card";

    const nomePacote = (programa.nome_pacote || "").split(":")[0];

    const jaInstalado =
        pacotesInstalados instanceof Set &&
        pacotesInstalados.has(nomePacote);

    const temUpdate =
        pacotesComUpdate instanceof Set &&
        pacotesComUpdate.has(nomePacote);

    card.innerHTML = `
        <div class="card-header">
            <img class="icon"
                 src="res/img/alt_package/${programa.nome_pacote}.svg"
                 alt="${programa.nome_pacote}"
                 onerror="this.onerror=null;this.src='res/img/ic_broken.svg';">
            <div class="card-info">
                <h3 class="card-title">${programa.nome_programa}</h3>
                <p class="card-desc">Carregando descrição...</p>
            </div>
        </div>
        <div class="card-actions card-actions-main"></div>
    `;
    container.appendChild(card);

    const actionsMain = card.querySelector(".card-actions-main");

    let btnPrincipal = null;   // único botão sempre visível
    let btnUpdate = null;      // botão de update, em bloco separado

    // cria só o botão relevante ao estado atual
    if (!window.__IS_ANDISTRO__) {
        // fora do AnDistro: mostra só Instalar desabilitado
        btnPrincipal = document.createElement("button");
        btnPrincipal.className = "btn btn-install";
        btnPrincipal.textContent = "Instalar";
        btnPrincipal.disabled = true;
        btnPrincipal.title = "Disponível apenas no AnDistro.";
        actionsMain.appendChild(btnPrincipal);
    } else if (!jaInstalado) {
        // NÃO INSTALADO => só Instalar
        btnPrincipal = document.createElement("button");
        btnPrincipal.className = "btn btn-install";
        btnPrincipal.textContent = "Instalar";
        actionsMain.appendChild(btnPrincipal);
    } else {
        // INSTALADO => Abrir + Desinstalar, mas mostra só um de cada vez
        // regra: padrão é Abrir; se quiser mudar para Desinstalar, troca aqui
        btnPrincipal = document.createElement("button");
        btnPrincipal.className = "btn btn-open";
        btnPrincipal.textContent = "Abrir";
        actionsMain.appendChild(btnPrincipal);

        // se houver update, cria bloco separado acima com botão Atualizar
        if (temUpdate) {
            const updateActions = document.createElement("div");
            updateActions.className = "card-actions card-actions-update";
            btnUpdate = document.createElement("button");
            btnUpdate.className = "btn btn-update";
            btnUpdate.textContent = "Atualizar";
            updateActions.appendChild(btnUpdate);
            card.insertBefore(updateActions, actionsMain);
        }
    }

    // funções para recriar o botão principal conforme estado
    function renderNaoInstalado() {
        actionsMain.innerHTML = "";
        btnPrincipal = document.createElement("button");
        btnPrincipal.className = "btn btn-install";
        btnPrincipal.textContent = "Instalar";
        actionsMain.appendChild(btnPrincipal);
        ligarHandlers();
    }

    function renderInstalado(temUpdateAgora) {
        actionsMain.innerHTML = "";
        btnPrincipal = document.createElement("button");
        btnPrincipal.className = "btn btn-open";
        btnPrincipal.textContent = "Abrir";
        actionsMain.appendChild(btnPrincipal);

        // bloco de update
        const antigoUpdate = card.querySelector(".card-actions-update");
        if (antigoUpdate) antigoUpdate.remove();
        btnUpdate = null;

        if (temUpdateAgora) {
            const updateActions = document.createElement("div");
            updateActions.className = "card-actions card-actions-update";
            btnUpdate = document.createElement("button");
            btnUpdate.className = "btn btn-update";
            btnUpdate.textContent = "Atualizar";
            updateActions.appendChild(btnUpdate);
            card.insertBefore(updateActions, actionsMain);
        }

        ligarHandlers();
    }

    // handlers de clique (sempre consideram o estado atual dos elementos)
    function ligarHandlers() {
        if (!window.__IS_ANDISTRO__) return;

        if (btnPrincipal && btnPrincipal.classList.contains("btn-install")) {
            // instalar
            btnPrincipal.onclick = async () => {
                if (btnPrincipal.disabled) return;
                try {
                    iniciarProgressoBotao(btnPrincipal, "Instalando...");
                    const res = await fetch("http://127.0.0.1:27777/install", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pkg: nomePacote }),
                    });
                    const data = await res.json().catch(() => ({}));
                    finalizarProgressoBotao(btnPrincipal, "Instalar");

                    if (!res.ok || data.code !== 0) {
                        console.error("Falha ao instalar pacote:", data);
                        alert(
                            "Não foi possível instalar o pacote.\nVeja o console para detalhes."
                        );
                        return;
                    }

                    alert(`Pacote "${nomePacote}" instalado com sucesso.`);
                    pacotesInstalados.add(nomePacote);
                    pacotesComUpdate.delete(nomePacote);
                    renderInstalado(false);
                } catch (e) {
                    console.error("Erro ao instalar pacote:", e);
                    finalizarProgressoBotao(btnPrincipal, "Instalar");
                    alert("Erro ao instalar o pacote.\nVeja o console para detalhes.");
                }
            };
        } else if (btnPrincipal && btnPrincipal.classList.contains("btn-open")) {
            // abrir
            btnPrincipal.onclick = async () => {
                if (btnPrincipal.disabled) return;
                try {
                    iniciarProgressoBotao(btnPrincipal, "Abrindo...");
                    const res = await fetch("http://127.0.0.1:27777/open", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pkg: nomePacote }),
                    });
                    const data = await res.json().catch(() => ({}));
                    finalizarProgressoBotao(btnPrincipal, "Abrir");

                    if (!res.ok || !data.ok) {
                        console.error("Falha ao abrir app:", data);
                        alert("Não foi possível abrir o aplicativo.");
                    }
                } catch (e) {
                    console.error("Erro ao abrir app:", e);
                    finalizarProgressoBotao(btnPrincipal, "Abrir");
                    alert("Erro ao abrir o aplicativo.");
                }
            };

            // botão de desinstalar fica “implícito”: se quiser trocar
            // o principal para Desinstalar, pode adicionar um toggle aqui.
        }

        if (btnUpdate) {
            btnUpdate.onclick = async () => {
                if (btnUpdate.disabled) return;
                try {
                    iniciarProgressoBotao(btnUpdate, "Atualizando...");
                    const res = await fetch("http://127.0.0.1:27777/install", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pkg: nomePacote }),
                    });
                    const data = await res.json().catch(() => ({}));
                    finalizarProgressoBotao(btnUpdate, "Atualizar");

                    if (!res.ok || data.code !== 0) {
                        console.error("Falha ao atualizar pacote:", data);
                        alert(
                            "Não foi possível atualizar o pacote.\nVeja o console para detalhes."
                        );
                        return;
                    }

                    alert(`Pacote "${nomePacote}" atualizado com sucesso.`);
                    pacotesComUpdate.delete(nomePacote);
                    renderInstalado(false);
                } catch (e) {
                    console.error("Erro ao atualizar pacote:", e);
                    finalizarProgressoBotao(btnUpdate, "Atualizar");
                    alert("Erro ao atualizar o pacote.\nVeja o console para detalhes.");
                }
            };
        }
    }

    ligarHandlers();

    carregarDescricaoCard(programa, card);
    montarCarrossel(programa);
}

// --- descrição resumida no próprio card ---
async function carregarDescricaoCard(programa, card) {
    const pDesc = card.querySelector(".card-desc");
    const lang = (typeof i18n !== "undefined" ? i18n.getLanguage() : "pt-BR");

    let debLang = "en";
    if (lang === "pt-BR") {
        debLang = "pt-br";
    } else if (lang === "en-US") {
        debLang = "en";
    }

    try {
        const targetUrl =
            `https://packages.debian.org/${debLang}/stable/${programa.nome_pacote}`;
        const proxiedUrl =
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxiedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        let p =
            doc.querySelector("h2 + p, h3 + p") ||
            doc.querySelector("h1 + p") ||
            doc.querySelector("p");

        let texto = p ? p.textContent.replace(/\s+/g, " ").trim() : "";

        if (!texto) {
            throw new Error("Texto vazio na página Debian");
        } else if (texto.length > 400) {
            texto = texto.slice(0, 397) + "...";
        }

        pDesc.textContent = texto;
        return;
    } catch (e) {
        console.error("Erro ao carregar descrição no site Debian", e);
    }

    try {
        const textoApt = await obterDescricaoViaDaemon(programa.nome_pacote);
        if (textoApt) {
            const texto =
                textoApt.length > 400
                    ? textoApt.slice(0, 397) + "..."
                    : textoApt;
            pDesc.textContent = texto;
            return;
        }
    } catch (e) {
        console.error("Erro ao carregar descrição via daemon", e);
    }

    pDesc.textContent =
        (lang === "en-US")
            ? "Package description not available yet."
            : "Descrição do pacote ainda não disponível.";
}

// --- carrossel ---
async function montarCarrossel(programa) {
    const carrossel = document.getElementById("carrossel");
    if (!carrossel) return;

    carrossel.innerHTML =
        '<div class="carrossel-loading">Carregando screenshots...</div>';

    try {
        const targetUrl =
            `https://screenshots.debian.net/package/${programa.nome_pacote}`;
        const proxiedUrl =
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxiedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const links = [];
        doc.querySelectorAll('a[href^="/screenshot/"]').forEach((a) => {
            const href = a.getAttribute("href");
            if (href && href.includes(programa.nome_pacote)) {
                links.push(`https://screenshots.debian.net${href}`);
            }
        });

        if (!links.length) {
            carrossel.innerHTML =
                '<p class="no-screenshots">Nenhuma screenshot disponível.</p>';
            return;
        }

        const inner = document.createElement("div");
        inner.className = "carrossel-inner";

        links.slice(0, 8).forEach((link) => {
            const item = document.createElement("div");
            item.className = "carrossel-item";
            item.innerHTML =
                `<img src="${link}" alt="Screenshot de ${programa.nome_programa}">`;
            inner.appendChild(item);
        });

        carrossel.innerHTML = "";
        carrossel.appendChild(inner);
    } catch (e) {
        console.error("Erro ao carregar screenshots", e);
        carrossel.innerHTML =
            '<p class="carrossel-error">Erro ao carregar screenshots.</p>';
    }
}

carregarPrograma();

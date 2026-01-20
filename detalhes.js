// detalhes.js
// 19:16

const params = new URLSearchParams(window.location.search);
const pkg = params.get("pkg");

if (!pkg) {
    console.error("Parâmetro ?pkg= não informado");
}

const URL_RECOMENDADOS = "recomendados.json";

let pacotesInstalados = new Set();
let pacotesComUpdate = new Set();

// --------- helpers daemon ---------

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
            console.log("Set pacotesInstalados:", pacotesInstalados);
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

    console.log("nomePacote:", nomePacote);
    console.log("jaInstalado:", jaInstalado);
    console.log("temUpdate:", temUpdate);

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
        <div class="card-actions card-actions-main">
            <button class="btn btn-open" data-i18n="common.open">Abrir</button>
            <button class="btn btn-remove" data-i18n="common.uninstall">Desinstalar</button>
            <button class="btn btn-install" data-i18n="common.install">Instalar</button>
        </div>
    `;
    container.appendChild(card);

    const mainActions = card.querySelector(".card-actions-main");
    const btnAbrir = card.querySelector(".btn-open");
    const btnRemover = card.querySelector(".btn-remove");
    const btnInstalar = card.querySelector(".btn-install");

    let updateActions = null;
    let btnAtualizar = null;

    if (jaInstalado && temUpdate) {
        updateActions = document.createElement("div");
        updateActions.className = "card-actions card-actions-update";
        updateActions.innerHTML = `
            <button class="btn btn-update" data-i18n="common.update">Atualizar</button>
        `;
        card.insertBefore(updateActions, mainActions);
        btnAtualizar = updateActions.querySelector(".btn-update");
    }

    if (!window.__IS_ANDISTRO__) {
        [btnAbrir, btnRemover, btnInstalar].forEach((b) => {
            b.disabled = true;
            b.title = "Disponível apenas no AnDistro.";
        });
        if (btnAtualizar) {
            btnAtualizar.disabled = true;
            btnAtualizar.title = "Disponível apenas no AnDistro.";
        }
    } else {
        if (!jaInstalado) {
            btnAbrir.style.display = "none";
            btnRemover.style.display = "none";
            btnInstalar.style.display = "inline-block";
            btnInstalar.disabled = false;

            if (btnAtualizar && updateActions) {
                updateActions.style.display = "none";
            }
        } else {
            btnInstalar.style.display = "none";
            btnAbrir.style.display = "inline-block";
            btnRemover.style.display = "inline-block";
            btnAbrir.disabled = false;
            btnRemover.disabled = false;

            if (btnAtualizar && updateActions) {
                btnAtualizar.disabled = false;
                updateActions.style.display = "flex";
            } else if (updateActions) {
                updateActions.style.display = "none";
            }
        }
    }

    // helpers para só mexer nos botões depois de ações
    function aplicarEstadoNaoInstalado() {
        btnAbrir.style.display = "none";
        btnRemover.style.display = "none";
        btnInstalar.style.display = "inline-block";
        if (updateActions) updateActions.style.display = "none";
    }

    function aplicarEstadoInstalado(temUpdateAgora) {
        btnInstalar.style.display = "none";
        btnAbrir.style.display = "inline-block";
        btnRemover.style.display = "inline-block";
        if (temUpdateAgora) {
            if (!updateActions) {
                updateActions = document.createElement("div");
                updateActions.className = "card-actions card-actions-update";
                updateActions.innerHTML = `
                    <button class="btn btn-update" data-i18n="common.update">Atualizar</button>
                `;
                card.insertBefore(updateActions, mainActions);
                btnAtualizar = updateActions.querySelector(".btn-update");
            }
            updateActions.style.display = "flex";
        } else if (updateActions) {
            updateActions.style.display = "none";
        }
    }

    // ações
    if (btnAbrir) {
        btnAbrir.addEventListener("click", async () => {
            if (!window.__IS_ANDISTRO__ || btnAbrir.disabled) return;
            try {
                const res = await fetch("http://127.0.0.1:27777/open", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pkg: nomePacote }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    console.error("Falha ao abrir app:", data);
                    alert("Não foi possível abrir o aplicativo.");
                }
            } catch (e) {
                console.error("Erro ao chamar /open:", e);
                alert("Erro ao abrir o aplicativo.");
            }
        });
    }

    if (btnRemover) {
        btnRemover.addEventListener("click", async () => {
            if (!window.__IS_ANDISTRO__ || btnRemover.disabled) return;
            const ok = confirm(
                `Tem certeza que deseja remover o pacote "${nomePacote}"?`
            );
            if (!ok) return;

            try {
                const res = await fetch("http://127.0.0.1:27777/remove", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pkg: nomePacote }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.code !== 0) {
                    console.error("Falha ao remover pacote:", data);
                    alert(
                        "Não foi possível remover o pacote.\nVeja o console para detalhes."
                    );
                    return;
                }
                alert(`Pacote "${nomePacote}" removido com sucesso.`);

                // atualiza estado local
                pacotesInstalados.delete(nomePacote);
                pacotesComUpdate.delete(nomePacote);
                aplicarEstadoNaoInstalado();
            } catch (e) {
                console.error("Erro ao chamar /remove:", e);
                alert("Erro ao remover o pacote.\nVeja o console para detalhes.");
            }
        });
    }

    if (btnInstalar) {
        btnInstalar.addEventListener("click", async () => {
            if (!window.__IS_ANDISTRO__ || btnInstalar.disabled) return;
            try {
                const res = await fetch("http://127.0.0.1:27777/install", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pkg: nomePacote }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.code !== 0) {
                    console.error("Falha ao instalar pacote:", data);
                    alert(
                        "Não foi possível instalar o pacote.\nVeja o console para detalhes."
                    );
                    return;
                }
                alert(`Pacote "${nomePacote}" instalado com sucesso.`);

                pacotesInstalados.add(nomePacote);
                // por padrão, assume sem update logo após instalar
                aplicarEstadoInstalado(false);
            } catch (e) {
                console.error("Erro ao chamar /install (install):", e);
                alert("Erro ao instalar o pacote.\nVeja o console para detalhes.");
            }
        });
    }

    if (btnAtualizar) {
        btnAtualizar.addEventListener("click", async () => {
            if (!window.__IS_ANDISTRO__ || btnAtualizar.disabled) return;
            try {
                const res = await fetch("http://127.0.0.1:27777/install", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pkg: nomePacote }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.code !== 0) {
                    console.error("Falha ao atualizar pacote:", data);
                    alert(
                        "Não foi possível atualizar o pacote.\nVeja o console para detalhes."
                    );
                    return;
                }
                alert(`Pacote "${nomePacote}" atualizado com sucesso.`);

                pacotesComUpdate.delete(nomePacote);
                aplicarEstadoInstalado(false);
            } catch (e) {
                console.error("Erro ao chamar /install (update):", e);
                alert("Erro ao atualizar o pacote.\nVeja o console para detalhes.");
            }
        });
    }

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

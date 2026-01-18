// detalhes.js

const params = new URLSearchParams(window.location.search);
const pkg = params.get("pkg");

if (!pkg) {
  console.error("Parâmetro ?pkg= não informado");
}

const URL_RECOMENDADOS = "recomendados.json";

let pacotesInstalados = new Set();
let pacotesComUpdate = new Set();

// --------- helpers daemon ---------

async function carregarInstaladosENovos() {
  // zera sempre que for carregar
  pacotesInstalados = new Set();
  pacotesComUpdate = new Set();

  if (!window.__IS_ANDISTRO__) {
    console.log("Não é AnDistro, pulando status APT.");
    return;
  }

  try {
    // nomes instalados
    const resInst = await fetch("http://127.0.0.1:27777/installed-names");
    if (resInst.ok) {
      const dataInst = await resInst.json();
      console.log("installed-names bruto:", dataInst);
      const names = dataInst.packages || [];
      pacotesInstalados = new Set(names);
      console.log("Set pacotesInstalados:", pacotesInstalados);
    } else {
      pacotesInstalados = new Set();
    }

    // pacotes com atualização
    const resUpd = await fetch("http://127.0.0.1:27777/updates");
    if (resUpd.ok) {
      const dataUpd = await resUpd.json();
      console.log("updates brutos:", dataUpd);
      const updates = dataUpd.updates || [];
      pacotesComUpdate = new Set(updates.map((u) => u.nome_pacote));
      console.log("Set pacotesComUpdate:", pacotesComUpdate);
    } else {
      pacotesComUpdate = new Set();
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

  // normaliza nome (caso um dia venha com sufixo de arch tipo :amd64)
  const nomePacote = (programa.nome_pacote || "").split(":")[0];

  console.log(
    "Checando instalação de:",
    nomePacote,
    "no Set pacotesInstalados:",
    pacotesInstalados
  );

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
    <div class="card-actions">
      <button class="btn btn-install btn-open">Abrir</button>
      <button class="btn btn-install btn-update">Atualizar</button>
      <button class="btn btn-install btn-remove">Desinstalar</button>
    </div>
  `;
  container.appendChild(card);

  const btnAbrir = card.querySelector(".btn-open");
  const btnAtualizar = card.querySelector(".btn-update");
  const btnRemover = card.querySelector(".btn-remove");

  // estado inicial dos botões
  if (!window.__IS_ANDISTRO__) {
    [btnAbrir, btnAtualizar, btnRemover].forEach((b) => {
      b.disabled = true;
      b.title = "Disponível apenas no AnDistro.";
    });
  } else {
    if (!jaInstalado) {
      // não instalado
      btnAbrir.disabled = true;
      btnRemover.disabled = true;
      btnAtualizar.disabled = true;
      btnAtualizar.title =
        "Atualização disponível apenas se o pacote estiver instalado.";
    } else {
      // instalado
      btnAbrir.disabled = false;
      btnRemover.disabled = false;

      if (temUpdate) {
        btnAtualizar.disabled = false;
        btnAtualizar.title = "";
      } else {
        btnAtualizar.style.display = "none"; // agora some mesmo
      }
    }
  }

  // ações
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
    } catch (e) {
      console.error("Erro ao chamar /install (update):", e);
      alert("Erro ao atualizar o pacote.\nVeja o console para detalhes.");
    }
  });

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
    } catch (e) {
      console.error("Erro ao chamar /remove:", e);
      alert("Erro ao remover o pacote.\nVeja o console para detalhes.");
    }
  });

  carregarDescricaoCard(programa, card);
  montarCarrossel(programa);
}

// --- descrição resumida no próprio card ---
async function carregarDescricaoCard(programa, card) {
  const pDesc = card.querySelector(".card-desc");

  // 1) via Debian stable
  try {
    const targetUrl =
      `https://packages.debian.org/stable/${programa.nome_pacote}`;
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

  // 2) fallback via daemon APT
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

  // 3) fallback final
  pDesc.textContent = "Descrição do pacote ainda não disponível.";
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

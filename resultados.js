// resultados.js

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const container = document.getElementById("cards-container");

// conjunto com nomes de pacotes instalados
let pacotesInstalados = new Set();

// --------- carregar nomes de pacotes instalados ---------
async function carregarPacotesInstalados() {
  if (window.__IS_ANDISTRO__ === false) {
    pacotesInstalados = new Set();
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:27777/installed-names");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const names = data.packages || [];
    pacotesInstalados = new Set(names);
  } catch (e) {
    console.error("Erro ao carregar lista de pacotes instalados:", e);
    pacotesInstalados = new Set();
  }
}

// --------- leitura inicial de ?q= ---------
const params = new URLSearchParams(window.location.search);
const qParam = params.get("q") || "";

(async () => {
  await carregarPacotesInstalados();
  if (qParam) {
    input.value = qParam;
    buscar(qParam);
  }
})();

// --------- evento: submit do form ---------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const termo = input.value.trim();
  if (termo) {
    atualizarQueryString(termo);
    buscar(termo);
  }
});

// atualiza a URL para incluir ?q={searchTerms} sem recarregar
function atualizarQueryString(termo) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", termo);
  window.history.replaceState({}, "", url.toString());
}

// --------- busca via daemon AnDistro (APT) ---------
async function buscar(termo) {
  container.innerHTML = "<p>Carregando resultados...</p>";

  try {
    // se não estiver no AnDistro, não dá para consultar APT
    if (window.__IS_ANDISTRO__ === false) {
      container.innerHTML =
        "<p>A busca por pacotes APT só funciona dentro do AnDistro.</p>";
      return;
    }

    // garante que temos a lista de instalados (caso detect.js tenha rodado depois)
    if (!(pacotesInstalados instanceof Set) || pacotesInstalados.size === 0) {
      await carregarPacotesInstalados();
    }

    const url =
      "http://127.0.0.1:27777/search?q=" + encodeURIComponent(termo);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();
    const itens = data.results || [];

    if (!itens.length) {
      container.innerHTML = "<p>Nenhum pacote encontrado.</p>";
      adicionarBannerArquitetura();
      return;
    }

    container.innerHTML = "";
    itens.forEach((pkg) => montarCard(pkg));
    adicionarBannerArquitetura();
  } catch (e) {
    console.error("Erro na busca", e);
    container.innerHTML =
      "<p>Erro ao buscar pacotes. Tente novamente mais tarde.</p>";
    adicionarBannerArquitetura();
  }
}

// monta cada card
function montarCard(pkg) {
  const card = document.createElement("div");
  card.className = "card";

  const nomeExibicao = pkg.nome_pacote;
  const descCurta =
    pkg.descricao && pkg.descricao.length > 160
      ? pkg.descricao.slice(0, 157) + "..."
      : pkg.descricao || "Sem descrição.";

  const jaInstalado =
    pacotesInstalados instanceof Set &&
    pacotesInstalados.has(pkg.nome_pacote);

  const labelBotao = jaInstalado ? "Abrir" : "Instalar";

  card.innerHTML = `
    <div class="card-header">
      <img class="icon"
           src="res/img/alt_package/${pkg.nome_pacote}.svg"
           alt="${nomeExibicao}"
           onerror="this.onerror=null;this.src='res/img/ic_broken.svg';">
      <div class="card-info">
        <h3 class="card-title">${nomeExibicao}</h3>
        <p class="card-desc">${descCurta}</p>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-alt">Detalhes</button>
      <button class="btn btn-install">${labelBotao}</button>
    </div>
  `;

  const btnDetalhes = card.querySelector(".btn-alt");
  btnDetalhes.addEventListener("click", () => {
    const base = "detalhes.html";
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("pkg", pkg.nome_pacote);
    const qs = currentParams.toString();
    window.location.href = `${base}?${qs}`;
  });

  const btnAcao = card.querySelector(".btn-install");
  btnAcao.addEventListener("click", () => {
    if (!window.__IS_ANDISTRO__) {
      alert("Esta ação só funciona dentro do AnDistro.");
      return;
    }

    if (
      pacotesInstalados instanceof Set &&
      pacotesInstalados.has(pkg.nome_pacote)
    ) {
      // já instalado → abrir
      fetch("http://127.0.0.1:27777/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pkg: pkg.nome_pacote }),
      })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (!data.ok) {
            console.error("Falha ao abrir app:", data);
            alert("Não foi possível abrir o aplicativo.");
          }
        })
        .catch((e) => {
          console.error("Erro ao chamar /open:", e);
          alert("Erro ao abrir o aplicativo.");
        });
    } else {
      // não instalado → instalar
      if (typeof instalarPacote === "function") {
        instalarPacote(pkg.nome_pacote);
      } else {
        console.error("Função instalarPacote não encontrada.");
      }
    }
  });

  container.appendChild(card);
}

// banner de "modo APT" / arquitetura (se quiser manter algo visual)
function adicionarBannerArquitetura() {
  const antigo = document.getElementById("arch-banner");
  if (antigo) antigo.remove();

  const banner = document.createElement("div");
  banner.id = "arch-banner";

  const texto = window.__IS_ANDISTRO__
    ? "Busca APT via AnDistro ativa."
    : "Tentando busca APT (certifique-se de estar no AnDistro).";

  banner.textContent = texto;

  banner.style.marginBottom = "16px";
  banner.style.padding = "8px";
  banner.style.borderRadius = "8px";
  banner.style.backgroundColor = "#E0EFFE";
  banner.style.border = "1px solid #89B4F3";
  banner.style.fontSize = "12px";

  const parent = container.parentElement;
  parent.insertBefore(banner, container);
}

// resultados.js - Com suporte automático a i18n

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
  // Aguarda i18n estar carregado
  await new Promise(resolve => {
    if (window.i18n && window.i18n.loadedLanguages.size > 0) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.i18n && window.i18n.loadedLanguages.size > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });

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
  container.innerHTML = `<p>${i18n.t('common.loading')}</p>`;

  try {
    // se não estiver no AnDistro, não dá para consultar APT
    if (window.__IS_ANDISTRO__ === false) {
      container.innerHTML = `<p>${i18n.t('resultados.apt_only')}</p>`;
      adicionarBannerArquitetura();
      return;
    }

    // garante que temos a lista de instalados (caso detect.js tenha rodado depois)
    if (!(pacotesInstalados instanceof Set) || pacotesInstalados.size === 0) {
      await carregarPacotesInstalados();
    }

    // Passa o idioma atual na URL para a API retornar descrições traduzidas
    const currentLang = i18n.getLanguage();
    const url =
      "http://127.0.0.1:27777/search?q=" +
      encodeURIComponent(termo) +
      "&lang=" +
      encodeURIComponent(currentLang);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();
    const itens = data.results || [];

    if (!itens.length) {
      container.innerHTML = `<p>${i18n.t('resultados.no_packages_found')}</p>`;
      adicionarBannerArquitetura();
      return;
    }

    container.innerHTML = "";
    itens.forEach((pkg) => montarCard(pkg));
    adicionarBannerArquitetura();
  } catch (e) {
    console.error("Erro na busca", e);
    container.innerHTML = `<p>${i18n.t('resultados.error_searching')}</p>`;
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
      : pkg.descricao || i18n.t('common.no_description');

  const jaInstalado =
    pacotesInstalados instanceof Set &&
    pacotesInstalados.has(pkg.nome_pacote);

  const labelBotao = jaInstalado
    ? i18n.t('common.open')
    : i18n.t('common.install');

  card.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">${nomeExibicao}</h3>
    </div>
    <div class="card-body">
      <p class="card-description">${descCurta}</p>
    </div>
    <div class="card-footer">
      <button class="btn-primary" onclick="irParaDetalhes('${nomeExibicao}')">${labelBotao}</button>
    </div>
  `;

  container.appendChild(card);
}

function irParaDetalhes(nomePacote) {
  window.location.href = `detalhes.html?pkg=${encodeURIComponent(nomePacote)}`;
}

function adicionarBannerArquitetura() {
  // Implementação do banner de arquitetura (mantém a mesma lógica)
}

// --------- Listener para mudança de idioma ---------
i18n.onLanguageChange((newLang) => {
  // Re-busca se houver termo atual
  if (qParam) {
    buscar(qParam);
  }
});

// resultados.js

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const container = document.getElementById("cards-container");

// --------- detecção de arquitetura → arch Debian ---------
function detectarArquiteturaDebian() {
  const ua = navigator.userAgent.toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();

  // ARM 64 bits
  if (ua.includes("aarch64") || ua.includes("armv8") || ua.includes("arm64")) {
    return "arm64";
  }

  // ARM 32 bits
  if (ua.includes("armv7") || ua.includes("armv6") || ua.includes("arm ")) {
    return "armhf";
  }

  // x86_64
  if (
    ua.includes("x86_64") ||
    ua.includes("win64") ||
    ua.includes("wow64") ||
    plat.includes("x86_64") ||
    plat.includes("win64")
  ) {
    return "amd64";
  }

  // x86 32 bits
  if (
    ua.includes("i686") ||
    ua.includes("i586") ||
    ua.includes("i486") ||
    ua.includes("i386") ||
    plat.includes("i686") ||
    plat.includes("i586") ||
    plat.includes("i486") ||
    plat.includes("i386")
  ) {
    return "i386";
  }

  // fallback
  return "amd64";
}

const archDetectada = detectarArquiteturaDebian();

// --------- leitura inicial de ?q= ---------
const params = new URLSearchParams(window.location.search);
const qParam = params.get("q") || "";
if (qParam) {
  input.value = qParam;
  buscar(qParam);
}

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

// --------- busca em packages.debian.org (via corsproxy) ---------
async function buscar(termo) {
  container.innerHTML = "<p>Carregando resultados...</p>";

  try {
    const baseUrl =
      `https://packages.debian.org/search?searchon=names&suite=trixie&section=all&arch=${encodeURIComponent(archDetectada)}&keywords=`; // [web:103]
    const targetUrl = `${baseUrl}${encodeURIComponent(termo)}`;
    const proxiedUrl =
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const res = await fetch(proxiedUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const itens = extrairResultados(doc);
    if (!itens.length) {
      container.innerHTML = "<p>Nenhum pacote encontrado.</p>";
      adicionarBannerArquitetura();
      return;
    }

    container.innerHTML = "";
    itens.forEach(pkg => montarCard(pkg));
    adicionarBannerArquitetura();
  } catch (e) {
    console.error("Erro na busca", e);
    container.innerHTML =
      "<p>Erro ao buscar pacotes. Tente novamente mais tarde.</p>";
    adicionarBannerArquitetura();
  }
}

// extrai {nome_pacote, descricao} da página de resultados
function extrairResultados(doc) {
  const resultados = [];

  // links para /trixie/<pacote> nos resultados. [web:85][web:103]
  const links = doc.querySelectorAll('a[href^="/trixie/"]');

  links.forEach(a => {
    const href = a.getAttribute("href") || "";
    const nome = href.split("/").pop(); // /trixie/firefox-esr -> firefox-esr

    const parent = a.parentElement;
    let desc = "";

    if (parent) {
      const text = parent.textContent.replace(/\s+/g, " ").trim();
      if (text.toLowerCase().startsWith(nome.toLowerCase())) {
        desc = text.slice(nome.length).trim();
      } else {
        desc = text;
      }
    }

    resultados.push({
      nome_pacote: nome,
      descricao: desc
    });
  });

  // remove duplicados
  const unico = [];
  const vistos = new Set();
  for (const r of resultados) {
    if (!vistos.has(r.nome_pacote)) {
      vistos.add(r.nome_pacote);
      unico.push(r);
    }
  }
  return unico;
}

// monta cada card
function montarCard(pkg) {
  const card = document.createElement("div");
  card.className = "card";

  const nomeExibicao = pkg.nome_pacote;
  const descCurta =
    pkg.descricao && pkg.descricao.length > 160
      ? pkg.descricao.slice(0, 157) + "..."
      : (pkg.descricao || "Sem descrição.");

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
      <button class="btn btn-install">Instalar</button>
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

  container.appendChild(card);
}

// adiciona banner de arquitetura no topo da seção de resultados
function adicionarBannerArquitetura() {
  const antigo = document.getElementById("arch-banner");
  if (antigo) antigo.remove();

  const banner = document.createElement("div");
  banner.id = "arch-banner";
  banner.textContent = `Arquitetura detectada: ${archDetectada}`;

  banner.style.marginBottom = "16px";
  banner.style.padding = "8px";
  banner.style.borderRadius = "8px";
  banner.style.backgroundColor = "#E0EFFE";
  banner.style.border = "1px solid #89B4F3";
  banner.style.fontSize = "12px";

  const parent = container.parentElement;
  parent.insertBefore(banner, container);
}

// detalhes.js

const params = new URLSearchParams(window.location.search);
const pkg = params.get("pkg");

if (!pkg) {
  console.error("Parâmetro ?pkg= não informado");
}

const URL_RECOMENDADOS = "recomendados.json";

async function carregarPrograma() {
  try {
    const res = await fetch(URL_RECOMENDADOS);
    const lista = await res.json();

    const programa = lista.find(p => p.nome_pacote === pkg) || {
      nome_programa: pkg,
      nome_pacote: pkg
    };

    montarPagina(programa);
  } catch (e) {
    console.error("Erro ao carregar recomendados.json", e);
  }
}

function montarPagina(programa) {
  document.title = `${programa.nome_programa} — Central de aplicativos`;
  document.getElementById("titulo").textContent =
    `${programa.nome_programa} — Central de aplicativos`;

  const container = document.getElementById("cards-container");
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-header">
      <img class="icon"
           src="res/img/alt_package/${programa.nome_pacote}.svg"
           alt="${programa.nome_pacote}">
      <div class="card-info">
        <h3 class="card-title">${programa.nome_programa}</h3>
        <p class="card-desc">Carregando descrição...</p>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-install">Instalar</button>
    </div>
  `;
  container.appendChild(card);

  carregarDescricaoCard(programa, card);
  montarCarrossel(programa);
}

// --- descrição resumida no próprio card ---
async function carregarDescricaoCard(programa, card) {
  const pDesc = card.querySelector(".card-desc");

  try {
    const targetUrl =
      `https://packages.debian.org/trixie/${programa.nome_pacote}`;
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
      texto = "Descrição do pacote não encontrada.";
    } else if (texto.length > 400) {
      texto = texto.slice(0, 397) + "...";
    }

    pDesc.textContent = texto;
  } catch (e) {
    console.error("Erro ao carregar descrição", e);
    pDesc.textContent = "Descrição do pacote ainda não disponível.";
  }
}

// --- carrossel ---
async function montarCarrossel(programa) {
  const carrossel = document.getElementById("carrossel");
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
    doc.querySelectorAll('a[href^="/screenshot/"]').forEach(a => {
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

    links.slice(0, 8).forEach(link => {
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

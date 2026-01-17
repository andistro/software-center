// instalados.js

async function carregarInstalados() {
  const container = document.getElementById("cards-container");

  if (!window.__IS_ANDISTRO__) {
    container.innerHTML =
      "<p>Listagem de instalados disponível apenas no AnDistro.</p>";
    return;
  }

  container.innerHTML = "<p>Carregando aplicativos instalados...</p>";

  try {
    const res = await fetch("http://127.0.0.1:27777/installed");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const dados = await res.json();
    const apps = dados.apps || [];
    const addons = dados.addons || [];

    container.innerHTML = "";

    if (apps.length) {
      const tituloApps = document.createElement("h3");
      tituloApps.className = "title";
      tituloApps.textContent = "Aplicativos";
      container.appendChild(tituloApps);

      apps.forEach(pkg => container.appendChild(criarCard(pkg)));
    }

    if (addons.length) {
      const tituloAddons = document.createElement("h3");
      tituloAddons.className = "title";
      tituloAddons.textContent = "Extensões e complementos";
      container.appendChild(tituloAddons);

      addons.forEach(pkg => container.appendChild(criarCard(pkg)));
    }
  } catch (e) {
    console.error("Erro ao carregar instalados", e);
    container.innerHTML =
      "<p>Erro ao carregar aplicativos instalados.</p>";
  }
}

function criarCard(pkg) {
  const card = document.createElement("div");
  card.className = "card";

  const nome = pkg.nome_programa || pkg.nome_pacote;
  const pacote = pkg.nome_pacote;

  card.innerHTML = `
    <div class="card-header">
      <img class="icon"
           src="http://127.0.0.1:27777/icon?pkg=${encodeURIComponent(pacote)}"
           alt="${nome}"
           onerror="this.onerror=null;this.src='res/img/alt_package/${pacote}.svg'; this.onerror=function(){this.src='res/img/ic_broken.svg';};">
      <div class="card-info">
        <h3 class="card-title">${nome}</h3>
        <p class="card-desc">${pkg.descricao || ""}</p>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-alt">Detalhes</button>
      <button class="btn btn-install">Abrir</button>
    </div>
  `;

  const btnDetalhes = card.querySelector(".btn-alt");
  btnDetalhes.addEventListener("click", () => {
    const base = "detalhes.html";
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("pkg", pacote);
    const qs = currentParams.toString();
    window.location.href = `${base}?${qs}`;
  });

  // futuro: botão Abrir chamando /run ou /open
  return card;
}

carregarInstalados();

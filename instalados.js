// instalados.js - Com suporte automático a i18n

async function carregarInstalados() {
  // Aguarda i18n estar carregado
  await new Promise((resolve) => {
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

  const container = document.getElementById("cards-container");

  if (!window.__IS_ANDISTRO__) {
    container.innerHTML = `<p>${i18n.t('instalados.andistro_only')}</p>`;
    return;
  }

  container.innerHTML = `<p>${i18n.t('common.loading')}</p>`;

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
      tituloApps.setAttribute("data-i18n", "instalados.applications");
      tituloApps.textContent = i18n.t('instalados.applications');
      container.appendChild(tituloApps);

      apps.forEach((pkg) => container.appendChild(criarCard(pkg)));
    }

    if (addons.length) {
      const tituloAddons = document.createElement("h3");
      tituloAddons.className = "title";
      tituloAddons.setAttribute("data-i18n", "instalados.extensions");
      tituloAddons.textContent = i18n.t('instalados.extensions');
      container.appendChild(tituloAddons);

      addons.forEach((pkg) => container.appendChild(criarCard(pkg)));
    }

    if (!apps.length && !addons.length) {
      container.innerHTML = `<p>${i18n.t('instalados.no_packages')}</p>`;
    }
  } catch (e) {
    console.error("Erro ao carregar instalados", e);
    container.innerHTML = `<p>${i18n.t('instalados.error_loading')}</p>`;
  }
}

function criarCard(pkg) {
  const card = document.createElement("div");
  card.className = "card";

  const nome = pkg.nome_programa || pkg.nome_pacote;
  const pacote = pkg.nome_pacote;
  const desc = pkg.descricao || i18n.t('common.no_description');

  card.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">${nome}</h3>
    </div>
    <div class="card-body">
      <p class="card-description">${desc}</p>
    </div>
    <div class="card-footer">
      <button class="btn-primary" onclick="irParaDetalhes('${pacote}')">
        ${i18n.t('common.open')}
      </button>
    </div>
  `;

  return card;
}

function irParaDetalhes(nomePacote) {
  window.location.href = `detalhes.html?pkg=${encodeURIComponent(nomePacote)}`;
}

// Executa ao carregar a página
carregarInstalados();

// --------- Listener para mudança de idioma ---------
i18n.onLanguageChange(() => {
  carregarInstalados();
});

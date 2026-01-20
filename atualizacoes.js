// atualizacoes.js - Com suporte automático a i18n

async function carregarAtualizacoes() {
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
    container.innerHTML = `<p>${i18n.t('atualizacoes.andistro_only')}</p>`;
    return;
  }

  container.innerHTML = `<p>${i18n.t('common.loading')}</p>`;

  try {
    const res = await fetch("http://127.0.0.1:27777/updates");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const dados = await res.json();
    const updates = dados.updates || [];

    if (!updates.length) {
      container.innerHTML = `<p>${i18n.t('atualizacoes.no_updates')}</p>`;
      return;
    }

    container.innerHTML = "";
    updates.forEach((pkg) => container.appendChild(criarCardAtualizacao(pkg)));
  } catch (e) {
    console.error("Erro ao carregar atualizações", e);
    container.innerHTML = `<p>${i18n.t('atualizacoes.error_loading')}</p>`;
  }
}

function criarCardAtualizacao(pkg) {
  const card = document.createElement("div");
  card.className = "card";

  const nome = pkg.nome_programa || pkg.nome_pacote;
  const pacote = pkg.nome_pacote;
  const desc = pkg.descricao || i18n.t('common.no_description');

  // Extrai versões se disponível
  const versaoAtual = pkg.versao_atual || i18n.t('atualizacoes.unknown_version');
  const versaoNova = pkg.versao_nova || i18n.t('atualizacoes.unknown_version');

  card.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">${nome}</h3>
      <span class="version-badge">
        ${i18n.t('atualizacoes.update_available')}: ${versaoAtual} → ${versaoNova}
      </span>
    </div>
    <div class="card-body">
      <p class="card-description">${desc}</p>
      <p class="version-info">
        <strong>${i18n.t('atualizacoes.package')}:</strong> ${pacote}
      </p>
    </div>
    <div class="card-footer">
      <button class="btn-primary" onclick="atualizarPacote('${pacote}')">
        ${i18n.t('common.update')}
      </button>
      <button class="btn-secondary" onclick="irParaDetalhes('${pacote}')">
        ${i18n.t('common.details')}
      </button>
    </div>
  `;

  return card;
}

function atualizarPacote(nomePacote) {
  console.log("Atualizando pacote:", nomePacote);
  // Implementação de atualização
}

function irParaDetalhes(nomePacote) {
  window.location.href = `detalhes.html?pkg=${encodeURIComponent(nomePacote)}`;
}

// Executa ao carregar a página
carregarAtualizacoes();

// --------- Listener para mudança de idioma ---------
i18n.onLanguageChange(() => {
  carregarAtualizacoes();
});

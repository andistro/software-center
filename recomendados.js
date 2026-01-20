const URL_RECOMENDADOS = "recomendados.json";

async function carregarRecomendados() {
  const container = document.getElementById("cards-container");

  const res = await fetch(URL_RECOMENDADOS);
  const programas = await res.json();

  for (const prog of programas) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header">
        <img class="icon"
             src="res/img/alt_package/${prog.nome_pacote}.svg"
             alt="${prog.nome_programa}"
             onerror="this.onerror=null;this.src='res/img/ic_broken.svg';">
        <div class="card-info">
          <h3 class="card-title">${prog.nome_programa}</h3>
          <p class="card-desc">Carregando descrição...</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-alt" data-i18n="common.details">Detalhes</button>
        <button class="btn btn-install" data-i18n="common.install">Instalar</button>
      </div>
    `;
    container.appendChild(card);

    // carrega descrição assíncrona
    carregarDescricaoCard(prog, card);

    // configura botão Detalhes
    const btnDetalhes = card.querySelector(".btn-alt");
    btnDetalhes.addEventListener("click", () => {
      const base = "detalhes.html";

      // preserva todos os parâmetros atuais da página
      const currentParams = new URLSearchParams(window.location.search);

      // garante/força pkg = nome_pacote
      currentParams.set("pkg", prog.nome_pacote);

      const qs = currentParams.toString();
      window.location.href = `${base}?${qs}`;
    });
  }
}

// --- descrição via packages.debian.org + corsproxy.io ---
async function carregarDescricaoCard(prog, card) {
    const pDesc = card.querySelector(".card-desc");

    try {
        // Descobre idioma atual do i18n
        const lang = (typeof i18n !== "undefined" ? i18n.getLanguage() : "pt-BR");

        // Mapeia para código de idioma usado pelo packages.debian.org
        // pt-BR → pt-br, en-US → en, fallback en
        let debLang = "en";
        if (lang === "pt-BR") {
            debLang = "pt-br";
        } else if (lang === "en-US") {
            debLang = "en";
        }

        // https://packages.debian.org/{debLang}/trixie/{pacote}
        const targetUrl =
            `https://packages.debian.org/${debLang}/stable/${prog.nome_pacote}`;
        const proxiedUrl =
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxiedUrl);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        let p =
            doc.querySelector("h2 + p, h3 + p") ||
            doc.querySelector("h1 + p") ||
            doc.querySelector("p");

        let texto = p ? p.textContent.replace(/\s+/g, " ").trim() : "";

        if (!texto) {
            texto = (debLang === "pt-br")
                ? "Descrição do pacote não encontrada."
                : "Package description not found.";
        } else if (texto.length > 160) {
            texto = texto.slice(0, 157) + "...";
        }

        pDesc.textContent = texto;
    } catch (e) {
        console.error("Erro ao carregar descrição para", prog.nome_pacote, e);
        pDesc.textContent =
            (i18n && i18n.getLanguage() === "en-US")
                ? "Package description not available yet."
                : "Descrição do pacote ainda não disponível.";
    }
}


carregarRecomendados();

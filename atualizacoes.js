// atualizacoes.js

async function carregarAtualizacoes() {
  const container = document.getElementById("cards-container");

  if (!window.__IS_ANDISTRO__) {
    container.innerHTML =
      "<p>A verificação de atualizações só funciona dentro do AnDistro.</p>";
    return;
  }

  container.innerHTML = "<p>Procurando atualizações de pacotes...</p>";

  try {
    const res = await fetch("http://127.0.0.1:27777/updates");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const dados = await res.json();
    const updates = dados.updates || [];

    if (!updates.length) {
      container.innerHTML = "<p>Não há atualizações disponíveis.</p>";
      return;
    }

    container.innerHTML = "";
    updates.forEach((pkg) => container.appendChild(criarCardAtualizacao(pkg)));
  } catch (e) {
    console.error("Erro ao carregar atualizações", e);
    container.innerHTML =
      "<p>Erro ao carregar lista de atualizações.</p>";
  }
}

function criarCardAtualizacao(pkg) {
  const card = document.createElement("div");
  card.className = "card";

  const nome = pkg.nome_programa || pkg.nome_pacote;
  const pacote = pkg.nome_pacote;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-info">
        <h3 class="card-title">${nome}</h3>
        <p class="card-desc">${pacote}</p>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-alt">Detalhes</button>
      <button class="btn btn-install">Atualizar</button>
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

  const btnAtualizar = card.querySelector(".btn-install");
  btnAtualizar.addEventListener("click", async () => {
    try {
      const res = await fetch("http://127.0.0.1:27777/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pkg: pacote }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.code !== 0) {
        console.error("Falha ao atualizar pacote:", data);
        alert("Não foi possível atualizar o pacote.\nVeja o console para detalhes.");
        return;
      }

      alert(`Pacote "${pacote}" atualizado com sucesso.`);
    } catch (e) {
      console.error("Erro ao chamar /install:", e);
      alert("Erro ao atualizar o pacote.\nVeja o console para detalhes.");
    }
  });

  return card;
}

carregarAtualizacoes();

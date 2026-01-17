async function carregarRecomendados() {
  const container = document.getElementById("cards-container");

  const res = await fetch("recomendados.json");
  const programas = await res.json();

  for (const prog of programas) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header">
        <img class="icon"
             src="res/img/alt_package/${prog.nome_pacote}.svg"
             alt="${prog.nome_programa}">
        <div class="card-info">
          <h3 class="card-title">${prog.nome_programa}</h3>
          <p class="card-desc"></p>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-alt">Detalhes</button>
        <button class="btn btn-install">Instalar</button>
      </div>
    `;
    container.appendChild(card);
  }
}

carregarRecomendados();

// detect.js

(async function () {
  const bannerId = "andistro-warning";

  // tenta falar com o daemon local
  let isAndistro = false;
  try {
    const res = await fetch("http://127.0.0.1:27777/ping", { method: "GET" });
    isAndistro = res.ok;
  } catch (e) {
    isAndistro = false;
  }

  if (isAndistro) {
    // opcional: expor global para outros scripts
    window.__IS_ANDISTRO__ = true;
    return;
  }

  // não é AnDistro: mostra aviso e, se quiser, desativa recursos
  const banner = document.createElement("div");
  banner.id = bannerId;
  banner.textContent = "Esta página funciona no AnDistro.";

  Object.assign(banner.style, {
    position: "fixed",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "#4873CA",
    color: "#FFFFFF",
    padding: "8px",
    fontSize: "12px",
    textAlign: "center",
    zIndex: "9999"
  });

  document.body.appendChild(banner);

  window.__IS_ANDISTRO__ = false;
})();

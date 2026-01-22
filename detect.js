(async function () {
  const bannerId = "andistro-warning";

  // remove banner antigo, se existir
  const old = document.getElementById(bannerId);
  if (old) old.remove();

  let isAndistro = false;

  try {
    const res = await fetch("http://127.0.0.1:27777/ping", { method: "GET" });
    if (res.ok) {
      isAndistro = true;
    } else {
      console.error("Ping ao daemon falhou com HTTP", res.status);
    }
  } catch (e) {
    console.error("Erro ao falar com o daemon AnDistro:", e);
    isAndistro = false;
  }

  console.log("Detect.js: isAndistro =", isAndistro);

  if (isAndistro) {
    window.__IS_ANDISTRO__ = true;
    return;
  }

  window.__IS_ANDISTRO__ = false;

  const banner = document.createElement("div");
  banner.id = bannerId;
  // banner.textContent = i18n.t('common.andistro_only');
  banner.textContent = i18n?.t?.('common.andistro_only');

  Object.assign(banner.style, {
    position: "fixed",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "#4873CA",
    color: "#FFFFFF",
    padding: "16px",
    fontSize: "16px",
    textAlign: "center",
    zIndex: "9999",
  });

  document.body.appendChild(banner);
})();

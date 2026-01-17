// detect.js

(function () {
  // ajuste esta lista conforme o userAgent que o AnDistro expõe
  const USER_AGENTS_PERMITIDOS = ["andistro", "debian"];

  const ua = navigator.userAgent.toLowerCase();
  const permitido = USER_AGENTS_PERMITIDOS.some(sig => ua.includes(sig));

  if (permitido) {
    return; // não mostra aviso
  }

  // cria o banner fixo no bottom
  const banner = document.createElement("div");
  banner.id = "andistro-warning";
  banner.textContent = "Esta página funciona no AnDistro.";

  document.body.appendChild(banner);
})();

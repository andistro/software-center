/**
 * GUIA DE INTEGRAÇÃO - SISTEMA DE INTERNACIONALIZAÇÃO (i18n)
 * 
 * Este arquivo contém exemplos de como integrar o sistema i18n
 * em seus arquivos JavaScript e HTML
 */

// ============================================================
// 1. CARREGAR O i18n.js E OS ARQUIVOS DE TRADUÇÃO
// ============================================================

/*
No seu arquivo HTML principal (index.html), adicione:

  <script src="i18n.js"></script>
  
Depois no seu arquivo JavaScript (antes de usar i18n):

  await i18n.loadLanguages({
    'pt-BR': 'translations/pt-br.json',
    'en-US': 'translations/en-us.json'
  });
  
  // Traduz a página automaticamente
  i18n.translatePage();
*/

// ============================================================
// 2. USAR i18n.t() EM SEU CÓDIGO JAVASCRIPT
// ============================================================

// Exemplo: resultados.js
// ANTES:
/*
  if (!itens.length) {
    container.innerHTML = `<div class="empty">Nenhum pacote encontrado.</div>`;
    return;
  }
*/

// DEPOIS:
/*
  if (!itens.length) {
    container.innerHTML = `<div class="empty">${i18n.t('resultados.no_packages_found')}</div>`;
    return;
  }
*/

// ============================================================
// 3. USAR data-i18n EM SEU HTML
// ============================================================

// Exemplo: Botões, labels e textos estáticos
/*
<button class="btn" data-i18n="buttons.install">Instalar</button>
<h1 data-i18n="index.title">Central de Aplicativos</h1>
<input placeholder="Procure por um pacote..." data-i18n="index.search_placeholder" data-i18n-attr="placeholder">
*/

// Depois de carregar as traduções, chame:
// i18n.translatePage();

// ============================================================
// 4. EXEMPLOS PRÁTICOS
// ============================================================

// -------- EXEMPLO 1: Mensagens de Status --------
/*
  // Arquivos afetados: resultados.js, instalados.js, atualizacoes.js

  // Antes:
  container.innerHTML = "Carregando resultados...";
  
  // Depois:
  container.innerHTML = i18n.t('common.loading');
  
  // Ou com chaves específicas:
  container.innerHTML = i18n.t('resultados.loading_results');
*/

// -------- EXEMPLO 2: Textos de Erro --------
/*
  // Arquivo: resultados.js
  
  catch (e) {
    console.error("Erro na busca", e);
    // Antes:
    // container.innerHTML = "Erro ao buscar pacotes. Tente novamente mais tarde.";
    
    // Depois:
    container.innerHTML = i18n.t('resultados.error_searching');
  }
*/

// -------- EXEMPLO 3: Mensagens Condicionais --------
/*
  // Arquivo: detalhes.js
  
  const jaInstalado = pacotesInstalados instanceof Set && pacotesInstalados.has(nomePacote);
  const temUpdate = pacotesComUpdate instanceof Set && pacotesComUpdate.has(nomePacote);
  
  // Antes:
  // const labelBotao = jaInstalado ? "Abrir" : "Instalar";
  
  // Depois:
  const labelBotao = jaInstalado ? 
    i18n.t('common.open') : 
    i18n.t('common.install');
*/

// -------- EXEMPLO 4: Mensagens com Parâmetros --------
/*
  // Arquivo: detect.js
  
  // Chave no JSON:
  // "current_language": "Idioma atual: {language}"
  
  // Uso:
  const msg = i18n.t('language_selector.current_language', {
    language: i18n.getLanguage()
  });
*/

// ============================================================
// 5. MUDANÇA DE IDIOMA DINÂMICA
// ============================================================

/*
  // Exemplo: Adicionar um seletor de idioma na página
  
  <select id="language-selector">
    <option value="pt-BR">Português (Brasil)</option>
    <option value="en-US">English (USA)</option>
  </select>
  
  <script>
    document.getElementById('language-selector').addEventListener('change', (e) => {
      i18n.setLanguageAndNotify(e.target.value);
    });
  </script>
*/

// ============================================================
// 6. ESTRUTURA DOS ARQUIVOS JSON
// ============================================================

/*
  Organização recomendada:
  
  {
    "common": { ... },           // Textos comuns
    "index": { ... },            // Página inicial
    "resultados": { ... },       // Página de resultados
    "detalhes": { ... },         // Página de detalhes
    "instalados": { ... },       // Página de instalados
    "atualizacoes": { ... },     // Página de atualizações
    "recomendados": { ... },     // Página de recomendados
    "detect": { ... },           // Detecção AnDistro
    "buttons": { ... },          // Botões
    "messages": { ... },         // Mensagens
    "categories": { ... },       // Categorias
    "sorting": { ... },          // Ordenação
    "language_selector": { ... },// Seletor de idioma
    "navigation": { ... }        // Navegação
  }
*/

// ============================================================
// 7. INTEGRAÇÃO PASSO A PASSO
// ============================================================

/*
PASSO 1: Adicionar ao HTML
  <script src="i18n.js"></script>

PASSO 2: Carregues as traduções (no seu arquivo JS principal)
  await i18n.loadLanguages({
    'pt-BR': 'translations/pt-br.json',
    'en-US': 'translations/en-us.json'
  });

PASSO 3: Traduza os elementos estáticos
  i18n.translatePage();

PASSO 4: Use i18n.t() nos seus scripts
  const mensagem = i18n.t('resultados.loading_results');

PASSO 5: Atualize após mudança de idioma
  i18n.setLanguageAndNotify('pt-BR');
  // Automaticamente chama translatePage()
*/

// ============================================================
// 8. FUNÇÃO HELPER PARA INICIALIZAÇÃO
// ============================================================

/*
  // Adicione isso no início de seus arquivos JS principais
  
  async function initI18n() {
    try {
      await i18n.loadLanguages({
        'pt-BR': 'translations/pt-br.json',
        'en-US': 'translations/en-us.json'
      });
      i18n.translatePage();
    } catch (error) {
      console.error('Erro ao carregar traduções:', error);
    }
  }
  
  // Chamar no início do seu script
  await initI18n();
*/

// ============================================================
// 9. DETECÇÃO DE IDIOMA AUTOMÁTICA
// ============================================================

/*
  O i18n.js detecta automaticamente o idioma do navegador:
  
  - Se o navegador estiver configurado para português (pt, pt-BR, pt-PT, etc.)
    → usa pt-BR
  
  - Para qualquer outro idioma
    → usa en-US como padrão
  
  O usuário pode mudar o idioma em tempo de execução:
    i18n.setLanguage('pt-BR');
    i18n.setLanguage('en-US');
  
  A preferência é salva em localStorage como 'preferred-language'
*/

// ============================================================
// 10. VERIFICAÇÃO DE CARREGAMENTO
// ============================================================

/*
  // Para verificar se as traduções foram carregadas corretamente:
  
  console.log(i18n.getLanguage()); // Mostra idioma atual
  console.log(i18n.t('common.search')); // Testa uma tradução
  
  // Para debug:
  console.log(i18n.translations); // Mostra todas as traduções carregadas
*/

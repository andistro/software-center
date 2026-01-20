# Sistema de Internacionalização (i18n) - Software Center AnDistro

## 📋 Resumo

Sistema completo de internacionalização (i18n) para o Software Center do AnDistro com suporte para:
- **Português do Brasil (pt-BR)** - Idioma nativo
- **Inglês dos Estados Unidos (en-US)** - Idioma padrão para outros países

Detecção automática de idioma baseada nas configurações do navegador do usuário.

## 📁 Estrutura de Arquivos

```
project/
├── i18n.js                    # Sistema de i18n (classe principal)
├── i18n-guide.js             # Guia de integração com exemplos
├── translations/
│   ├── pt-br.json           # Traduções em Português
│   └── en-us.json           # Traduções em Inglês
├── index.html
├── resultados.html
├── detalhes.html
├── instalados.html
├── atualizacoes.html
├── recomendados.html
├── detect.js
├── resultados.js
├── detalhes.js
├── instalados.js
├── atualizacoes.js
├── recomendados.js
└── README.md                 # Este arquivo
```

## 🚀 Quick Start

### 1. Copiar os Arquivos

Copie os seguintes arquivos para seu projeto:
- `i18n.js` → pasta raiz
- `pt-br.json` → pasta `translations/`
- `en-us.json` → pasta `translations/`

### 2. Adicionar ao HTML

No seu arquivo `index.html`, adicione o script i18n **antes** de seus outros scripts:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Software Center</title>
</head>
<body>
    <!-- Seu conteúdo aqui -->
    
    <!-- Carregar i18n ANTES dos outros scripts -->
    <script src="i18n.js"></script>
    
    <!-- Seus scripts -->
    <script src="detect.js"></script>
    <script src="resultados.js"></script>
</body>
</html>
```

### 3. Inicializar no seu JavaScript

Adicione no início de seu arquivo JavaScript principal (ou em um arquivo de inicialização):

```javascript
// Carregar as traduções
await i18n.loadLanguages({
  'pt-BR': 'translations/pt-br.json',
  'en-US': 'translations/en-us.json'
});

// Traduzir elementos estáticos
i18n.translatePage();
```

### 4. Usar Traduções no Código

Substitua strings hardcoded por chamadas ao i18n:

**Antes:**
```javascript
container.innerHTML = "Nenhum pacote encontrado.";
```

**Depois:**
```javascript
container.innerHTML = i18n.t('resultados.no_packages_found');
```

## 📖 Documentação Detalhada

### Métodos do i18n

#### `i18n.t(key, params)`
Obtém a tradução para uma chave.

```javascript
// Uso simples
const texto = i18n.t('common.search');
// → "Buscar" (em pt-BR) ou "Search" (em en-US)

// Com parâmetros
const msg = i18n.t('language_selector.current_language', {
  language: i18n.getLanguage()
});
// → "Idioma atual: pt-BR"
```

#### `i18n.setLanguage(lang)`
Define o idioma ativo.

```javascript
i18n.setLanguage('pt-BR');
i18n.setLanguage('en-US');
```

#### `i18n.getLanguage()`
Retorna o idioma ativo.

```javascript
const lang = i18n.getLanguage();
// → "pt-BR" ou "en-US"
```

#### `i18n.translatePage()`
Traduz automaticamente todos os elementos HTML com `data-i18n`.

```javascript
i18n.translatePage();
```

#### `i18n.setLanguageAndNotify(lang)`
Define o idioma e traduz a página automaticamente.

```javascript
i18n.setLanguageAndNotify('en-US');
// Atualiza o idioma E traduz todos os elementos
```

#### `i18n.onLanguageChange(callback)`
Registra um callback para mudanças de idioma.

```javascript
i18n.onLanguageChange((newLang) => {
  console.log('Idioma mudou para:', newLang);
  atualizarUI();
});
```

### Uso em HTML

Use o atributo `data-i18n` para textos estáticos:

```html
<!-- Texto de conteúdo -->
<button data-i18n="buttons.install">Instalar</button>

<!-- Atributo placeholder -->
<input data-i18n="index.search_placeholder" data-i18n-attr="placeholder">

<!-- Atributo alt em imagens -->
<img src="app.png" data-i18n="app.title" data-i18n-attr="alt">
```

Depois chame:
```javascript
i18n.translatePage();
```

## 🌐 Detecção de Idioma

O sistema detecta automaticamente o idioma do navegador:

| Idioma do Navegador | Idioma Usado |
|-------------------|-------------|
| Português (pt, pt-BR, pt-PT, etc) | **pt-BR** |
| Qualquer outro | **en-US** (padrão) |

O usuário pode mudar manualmente e a preferência é salva em `localStorage`.

## 📝 Estrutura de Chaves JSON

As traduções são organizadas por página/componente:

```json
{
  "common": {
    "search": "Buscar",
    "install": "Instalar",
    "loading": "Carregando..."
  },
  "index": {
    "title": "Central de Aplicativos",
    "search_placeholder": "Procure por um pacote..."
  },
  "resultados": {
    "title": "Resultados da Busca",
    "no_packages_found": "Nenhum pacote encontrado.",
    "error_searching": "Erro ao buscar pacotes..."
  },
  ...
}
```

**Convenção de nomenclatura:**
- Use minúsculas com underscores `snake_case`
- Organize por categoria (página/componente)
- Use nomes descritivos

## 🔧 Exemplos de Integração

### Exemplo 1: Página de Resultados (resultados.js)

**Antes:**
```javascript
async function buscar(termo) {
  container.innerHTML = "Carregando resultados...";
  
  try {
    if (window.__IS_ANDISTRO__ === false) {
      container.innerHTML = "A busca por pacotes APT só funciona dentro do AnDistro.";
      return;
    }
    
    // ... código ...
    
    if (!itens.length) {
      container.innerHTML = "Nenhum pacote encontrado.";
      return;
    }
    
  } catch (e) {
    container.innerHTML = "Erro ao buscar pacotes. Tente novamente mais tarde.";
  }
}
```

**Depois:**
```javascript
async function buscar(termo) {
  container.innerHTML = i18n.t('common.loading');
  
  try {
    if (window.__IS_ANDISTRO__ === false) {
      container.innerHTML = i18n.t('resultados.apt_only');
      return;
    }
    
    // ... código ...
    
    if (!itens.length) {
      container.innerHTML = i18n.t('resultados.no_packages_found');
      return;
    }
    
  } catch (e) {
    container.innerHTML = i18n.t('resultados.error_searching');
  }
}
```

### Exemplo 2: Criação Dinâmica de Elementos

```javascript
function montarCard(pkg) {
  const card = document.createElement("div");
  card.className = "card";
  
  const jaInstalado = pacotesInstalados.has(pkg.nome_pacote);
  const labelBotao = jaInstalado ? 
    i18n.t('common.open') : 
    i18n.t('common.install');
  
  card.innerHTML = `
    <div class="card-title">${pkg.nome_pacote}</div>
    <button>${labelBotao}</button>
  `;
  
  return card;
}
```

### Exemplo 3: Seletor de Idioma

```html
<!-- HTML -->
<select id="language-selector">
  <option value="pt-BR" data-i18n="language_selector.portuguese">Português (Brasil)</option>
  <option value="en-US" data-i18n="language_selector.english">English (USA)</option>
</select>
```

```javascript
// JavaScript
document.getElementById('language-selector').addEventListener('change', (e) => {
  i18n.setLanguageAndNotify(e.target.value);
  // Automaticamente traduz a página
});
```

## 🎯 Checklist de Integração

- [ ] Copiar `i18n.js` para a pasta raiz
- [ ] Criar pasta `translations/`
- [ ] Copiar `pt-br.json` e `en-us.json` para `translations/`
- [ ] Adicionar `<script src="i18n.js"></script>` no HTML
- [ ] Adicionar inicialização do i18n no JavaScript
- [ ] Substituir strings hardcoded por `i18n.t()`
- [ ] Usar `data-i18n` em elementos estáticos
- [ ] Testar em português (pt-BR) e inglês (en-US)
- [ ] Testar mudança de idioma dinâmica (se implementada)
- [ ] Verificar localStorage

## 🐛 Troubleshooting

### Traduções não aparecem
1. Verificar se `i18n.js` foi carregado antes dos outros scripts
2. Verificar se os arquivos JSON estão no caminho correto
3. Abrir o console do navegador e procurar erros
4. Chamar `i18n.translatePage()` após carregar as traduções

### Chave de tradução não encontrada
1. Verificar a ortografia da chave
2. Verificar se a chave existe no JSON
3. Consultar o console para aviso de chave faltante

### Idioma não muda
1. Verificar se `setLanguage()` é chamado corretamente
2. Limpar localStorage: `localStorage.clear()`
3. Verificar se as traduções foram carregadas com sucesso

## 🔐 Suporte ao localStorage

O sistema salva a preferência de idioma em `localStorage`:

```javascript
// Preferência é salva automaticamente
i18n.setLanguage('pt-BR');
localStorage.getItem('preferred-language'); // → 'pt-BR'

// Carrega na próxima visita automaticamente
```

Para limpar:
```javascript
localStorage.removeItem('preferred-language');
```

## 📱 Detecção de Idioma em Diferentes Cenários

| Cenário | Resultado |
|---------|-----------|
| Primeiro acesso, navegador em PT | pt-BR |
| Primeiro acesso, navegador em EN | en-US |
| Muda para EN via seletor | en-US (salvo) |
| Recarrega página | en-US (restaurado) |
| Limpa localStorage, volta a PT | pt-BR |

## 📚 Referência de Chaves Disponíveis

### Gerais (common)
- `common.search` - Buscar
- `common.install` - Instalar
- `common.open` - Abrir
- `common.loading` - Carregando
- `common.error` - Erro

### Páginas Específicas
- `index.*` - Página inicial
- `resultados.*` - Resultados de busca
- `detalhes.*` - Detalhes do aplicativo
- `instalados.*` - Aplicativos instalados
- `atualizacoes.*` - Atualizações disponíveis
- `recomendados.*` - Aplicativos recomendados

### Componentes
- `buttons.*` - Botões
- `messages.*` - Mensagens
- `categories.*` - Categorias
- `sorting.*` - Ordenação
- `navigation.*` - Navegação

Veja `pt-br.json` e `en-us.json` para lista completa.

## 📞 Suporte

Para problemas ou sugestões:
1. Verifique a documentação acima
2. Consulte o arquivo `i18n-guide.js` para exemplos
3. Verifique o console do navegador para erros

## 📄 Licença

Sistema de i18n para AnDistro Software Center.

---

**Versão**: 1.0.0  
**Atualizado**: Janeiro 2026

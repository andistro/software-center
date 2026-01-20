/**
 * Sistema de Internacionalização (i18n) para Software Center
 * Suporta: navegador, localStorage, ?lang=pt-BR|en-US
 */

class I18n {
    constructor() {
        // PRIORIDADE: 1.URL → 2.localStorage → 3.navegador
        const urlLang = this.detectLanguageFromUrl();
        if (urlLang) {
            this.currentLanguage = urlLang;
        } else {
            const savedLang = localStorage.getItem('preferred-language');
            if (savedLang && (savedLang === 'pt-BR' || savedLang === 'en-US')) {
                this.currentLanguage = savedLang;
            } else {
                this.currentLanguage = this.detectLanguage();
            }
        }

        this.translations = {};
        this.fallbackLanguage = 'pt-BR'; // Principal fallback
        this.loadedLanguages = new Set();
        document.documentElement.lang = this.currentLanguage;
    }

    /**
     * Detecta ?lang=pt-BR ou ?lang=en-US da URL
     */
    detectLanguageFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (!langParam) return null;

        const normalized = langParam.toLowerCase();
        if (normalized === 'pt-br') return 'pt-BR';
        if (normalized === 'en-us') return 'en-US';
        return null;
    }

    /**
     * Detecta idioma do navegador
     * Se for português (pt, pt-BR, pt-PT, etc.) → usa pt-BR
     * Caso contrário → usa en-US como padrão
     */
    detectLanguage() {
        const navLang = navigator.language || navigator.userLanguage || 'en-US';
        if (navLang.toLowerCase().startsWith('pt')) {
            return 'pt-BR';
        }
        return 'en-US';
    }

    /**
     * Define o idioma ativo
     * @param {string} lang - Código do idioma (pt-BR ou en-US)
     */
    setLanguage(lang) {
        if (lang === 'pt-BR' || lang === 'en-US') {
            this.currentLanguage = lang;
            document.documentElement.lang = lang;
            localStorage.setItem('preferred-language', lang);
        } else {
            console.warn(`Idioma '${lang}' não suportado. Use: pt-BR, en-US`);
        }
    }

    /**
     * Retorna o idioma ativo
     */
    getLanguage() {
        return this.currentLanguage;
    }

    /**
     * Carrega as traduções de um arquivo JSON
     * @param {string} lang - Código do idioma
     * @param {string} filePath - Caminho para o arquivo JSON (ex: 'translations/pt-br.json')
     */
    async loadLanguage(lang, filePath) {
        if (this.loadedLanguages.has(lang)) return;

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            this.translations[lang] = data;
            this.loadedLanguages.add(lang);
        } catch (error) {
            console.error(`Erro ao carregar traduções para ${lang}:`, error);
        }
    }

    /**
     * Carrega múltiplos idiomas
     * @param {object} languagePaths - Objeto com { 'pt-BR': 'path', 'en-US': 'path' }
     */
    async loadLanguages(languagePaths) {
        const promises = Object.entries(languagePaths).map(([lang, path]) =>
            this.loadLanguage(lang, path)
        );
        await Promise.all(promises);
    }

    /**
     * Obtém a tradução para uma chave
     * @param {string} key - Chave de tradução (ex: 'common.search')
     * @param {object} params - Parâmetros para substituição (ex: { name: 'John' })
     * @returns {string} Texto traduzido
     */
    t(key, params = {}) {
        const lang = this.currentLanguage || 'pt-BR';

        // 1) Tenta no idioma atual
        let text = this.getNestedValue(this.translations[lang], key);

        // 2) Se não achar, tenta no outro idioma
        if (!text) {
            const other = lang === 'pt-BR' ? 'en-US' : 'pt-BR';
            text = this.getNestedValue(this.translations[other], key);
        }

        // 3) Fallback final: idioma de fallback ou a própria chave
        if (!text) {
            text = this.getNestedValue(this.translations[this.fallbackLanguage], key) || key;
        }

        // Substitui parâmetros no texto
        if (Object.keys(params).length > 0) {
            text = this.replaceParams(text, params);
        }

        return text;
    }

    /**
     * Obtém valor aninhado em um objeto usando notação com pontos
     * Ex: getNestedValue(obj, 'common.search') → obj.common.search
     */
    getNestedValue(obj, key) {
        if (!obj) return null;

        return key.split('.').reduce((current, part) => {
            return current && current[part] ? current[part] : null;
        }, obj);
    }

    /**
     * Substitui parâmetros em um texto
     * Ex: replaceParams('Olá {name}!', { name: 'João' }) → 'Olá João!'
     */
    replaceParams(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, k) => {
            return params.hasOwnProperty(k) ? params[k] : match;
        });
    }

    /**
     * Marca elementos HTML para tradução automática
     * Use data-i18n="chave" nos elementos
     * Ex: <button data-i18n="buttons.install">Instalar</button>
     */
    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const attr = el.getAttribute('data-i18n-attr');

            if (attr) {
                el.setAttribute(attr, this.t(key));
            } else {
                el.textContent = this.t(key);
            }
        });
    }

    /**
     * Define o idioma e re-traduz a página
     * @param {string} lang - Código do idioma
     */
    setLanguageAndNotify(lang) {
        this.setLanguage(lang);
        this.translatePage();
    }
}

// Cria instância global
const i18n = new I18n();

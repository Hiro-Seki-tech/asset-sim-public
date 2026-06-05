/**
 * 💡性能キャッシュフロー軍略盤 - 多言語化制御中枢 (js/i18n.js)
 * 分割ファイル構成・GitHub Pages環境完全対応版
 */

const SUPPORTED_LANGUAGES = ['ja', 'en'];
const DEFAULT_LANGUAGE = 'ja';
const STORAGE_KEY = 'gemkin_preferred_language';

let currentTranslations = {};

/**
 * 選択された言語のJSONファイルを非同期取得する関数
 */
async function loadTranslations(lang) {
    try {
        const response = await fetch(`./i18n/${lang}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        currentTranslations = await response.json();
    } catch (error) {
        console.error(`[i18n] 翻訳ファイルの取得に失敗しました (${lang}):`, error);
        currentTranslations = {};
    }
}

/**
 * DOM内の data-i18n 属性を持つ全要素に翻訳を流し込む関数
 */
function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!key || !currentTranslations[key]) return;

        const translation = currentTranslations[key];

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', translation);
        } else if (el.tagName === 'META') {
            if (el.hasAttribute('content')) el.setAttribute('content', translation);
        } else if (el.tagName === 'OPTION') {
            el.textContent = translation;
        } else {
            el.innerHTML = translation;
        }
    });

    // グラフタイトルの動的翻訳
    if (typeof window.runSimulation === 'function') {
        const currentName = document.getElementById('scenario-input')?.value 
            || currentTranslations["label_custom"];

        const titleEl = document.getElementById('graph-title-element');
        if (titleEl) {
            const template = currentTranslations["title_graph_dynamic"];
            titleEl.innerHTML = template.replace("{name}", currentName);
        }

        try {
            window.runSimulation();
        } catch (e) {
            console.warn("[i18n] シミュレーション関数の先行呼び出しを回避しました。");
        }
    }
}

/**
 * 言語環境を切り替える主機能
 */
async function switchLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) lang = DEFAULT_LANGUAGE;
    
    await loadTranslations(lang);
    applyTranslations();
    localStorage.setItem(STORAGE_KEY, lang);
    
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) switcher.value = lang;
}

/**
 * HTML側のすべてのメインスクリプト読み込み後に起動
 */
window.addEventListener('load', async () => {
    const savedLang = localStorage.getItem(STORAGE_KEY);
    const browserLang = navigator.language.split('-')[0];
    
    let targetLang = DEFAULT_LANGUAGE;
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
        targetLang = savedLang;
    } else if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        targetLang = browserLang;
    }
    
    setTimeout(async () => {
        await switchLanguage(targetLang);
    }, 50);

    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
        switcher.addEventListener('change', (e) => {
            switchLanguage(e.target.value);
        });
    }
});

window.gemkinSwitchLanguage = switchLanguage;

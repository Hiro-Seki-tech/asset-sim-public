/**
 * 💡性能キャッシュフロー軍略盤 - 多言語化制御中枢 (js/i18n.js)
 */

const SUPPORTED_LANGUAGES = ['ja', 'en'];
const DEFAULT_LANGUAGE = 'ja';
const STORAGE_KEY = 'gemkin_preferred_language';

let currentTranslations = {};

/**
 * 選択された言語のJSONファイルを非同期fetchする関数
 */
async function loadTranslations(lang) {
    try {
        // 💡修正：HTML側から見て「i18n」フォルダの中を確実に探せるパスに変更
        const response = await fetch(`./i18n/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentTranslations = await response.json();
    } catch (error) {
        console.error(`[i18n] 翻訳ファイルの取得に失敗しました (${lang}):`, error);
        currentTranslations = {};
    }
}

/**
 * DOM内の data-i18n 属性を持つ全要素に翻訳を適用する関数
 */
function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!key || !currentTranslations[key]) return;

        const translation = currentTranslations[key];

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) {
                el.setAttribute('placeholder', translation);
            }
        } else if (el.tagName === 'META') {
            if (el.hasAttribute('content')) {
                el.setAttribute('content', translation);
            }
        } else if (el.tagName === 'OPTION') {
            el.textContent = translation;
        } else {
            el.innerHTML = translation;
        }
    });

    // 言語切り替え時に、シミュレータ側の動的テキスト（グラフタイトル等）も連動させる
    if (typeof window.runSimulation === 'function') {
        // 英語ならグラフタイトルを英語に、日本語なら日本語に動的書き換え
        const currentName = document.getElementById('scenario-input').value || 'カスタム';
        const titleEl = document.getElementById('graph-title-element');
        const currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
        
        if (titleEl) {
            titleEl.innerHTML = `<i class="fa-solid fa-chart-line text-blue-500"></i> ` + 
                (currentLang === 'en' ? `Lifetime Cash Flow for "${currentName}"` : `「${currentName}」の生涯キャッシュフロー`);
        }
        window.runSimulation();
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
    if (switcher) {
        switcher.value = lang;
    }
}

/**
 * ページ読み込み時の初期化
 */
document.addEventListener('DOMContentLoaded', async () => {
    const savedLang = localStorage.getItem(STORAGE_KEY);
    const browserLang = navigator.language.split('-')[0];
    
    let targetLang = DEFAULT_LANGUAGE;
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
        targetLang = savedLang;
    } else if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        targetLang = browserLang;
    }
    
    await switchLanguage(targetLang);

    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
        switcher.addEventListener('change', (e) => {
            switchLanguage(e.target.value);
        });
    }
});

window.gemkinSwitchLanguage = switchLanguage;
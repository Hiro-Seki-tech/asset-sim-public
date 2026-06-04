/**
 * 💡性能キャッシュフロー軍略盤 - 多言語化制御中枢 (i18n.js)
 * GitHub Pages等の環境を考慮し、外部JSONを動的fetchしてDOMへ適用する
 */

// サポートする言語の定義（STEP5でさらに拡張可能）
const SUPPORTED_LANGUAGES = ['ja', 'en'];
const DEFAULT_LANGUAGE = 'ja';
const STORAGE_KEY = 'gemkin_preferred_language';

// 現在読み込まれている翻訳辞書キャッシュ
let currentTranslations = {};

/**
 * 選択された言語のJSONファイルを非同期fetchする関数
 */
async function loadTranslations(lang) {
    try {
        // GitHub Pagesの相対パス構造を考慮し、/i18n/ からfetchを試みる
        // 環境に応じて './i18n/' や 'i18n/' に適宜調整可能な前方互換性を確保
        const response = await fetch(`./i18n/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentTranslations = await response.json();
    } catch (error) {
        console.error(`[i18n] 翻訳ファイルの取得に失敗しました (${lang}):`, error);
        // fetchに失敗した場合は空オブジェクトにしてフォールバックを有効化
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

        // 各タグの種別に応じて適切な流し込み方を精密に分岐
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            // プレースホルダー属性などへの対応が必要な場合の拡張性を確保
            if (el.hasAttribute('placeholder')) {
                el.setAttribute('placeholder', translation);
            }
        } else if (el.tagName === 'META') {
            // descriptionやog:titleなどのメタタグ属性の書き換え
            if (el.hasAttribute('content')) {
                el.setAttribute('content', translation);
            }
        } else if (el.tagName === 'OPTION') {
            // セレクトボックスの選択肢テキスト
            el.textContent = translation;
        } else {
            // 通常のコンテナ要素。ツールチップ内にHTML特殊装飾(span等)が含まれるため、innerHTMLで安全に適用
            el.innerHTML = translation;
        }
    });

    // グラフのタイトルなど、JavaScript側で動的に管理しているテキストも更新するためのフックをトリガー
    if (typeof window.runSimulation === 'function') {
        window.runSimulation();
    }
}

/**
 * 言語環境を完全に切り替える主機能
 */
async function switchLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) lang = DEFAULT_LANGUAGE;
    
    // 1. 翻訳データをfetch
    await loadTranslations(lang);
    
    // 2. DOMへ反映
    applyTranslations();
    
    // 3. localStorageに選択を記憶
    localStorage.setItem(STORAGE_KEY, lang);
    
    // 4. 言語切り替えUI(Selectタグ)の表示を同期
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
        switcher.value = lang;
    }
}

/**
 * ページ初期化時に前回の言語を自動適用する関数
 */
document.addEventListener('DOMContentLoaded', async () => {
    // localStorageから取得、なければブラウザの標準言語を検出し、それもなければデフォルト(ja)
    const savedLang = localStorage.getItem(STORAGE_KEY);
    const browserLang = navigator.language.split('-')[0];
    
    let targetLang = DEFAULT_LANGUAGE;
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
        targetLang = savedLang;
    } else if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        targetLang = browserLang;
    }
    
    // 初期言語を適用
    await switchLanguage(targetLang);

    // UIイベントリスナーの紐付け
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
        switcher.addEventListener('change', (e) => {
            switchLanguage(e.target.value);
        });
    }
});

// グローバルスコープに公開（HTML側のインラインスクリプト等から呼び出し可能にするため）
window.gemkinSwitchLanguage = switchLanguage;
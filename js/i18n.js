// 💡多言語翻訳エンジン基盤（将来の中国語・スペイン語拡張対応）
let currentTranslations = {};

// 言語ファイルを非同期で読み込み、画面全体に網を張ったdata-i18n属性を書き換える関数
async function switchLanguage(lang) {
    try {
        const response = await fetch(`./i18n/${lang}.json`);
        if (!response.ok) throw new Error(`言語ファイルの読み込みに失敗: ${lang}`);
        
        currentTranslations = await response.json();
        
        // 1. 静的UIテキストの書き換え（data-i18nを持つ全要素が対象）
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (currentTranslations[key] !== undefined) {
                // metaタグやinputのプレースホルダー、通常のタグで処理を分岐
                if (el.tagName === 'META') {
                    if (el.hasAttribute('content')) el.setAttribute('content', currentTranslations[key]);
                } else if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.setAttribute('placeholder', currentTranslations[key]);
                } else {
                    // HTMLタグ（spanなど）が含まれていても美しく描写できるようinnerHTMLで展開
                    el.innerHTML = currentTranslations[key];
                }
            }
        });

        // 2. ブラウザのタブ名（ページタイトル）の更新
        if (currentTranslations['page_title']) {
            document.title = currentTranslations['page_title'];
        }

        // 3. グラフや動的UIの文字を言語に同期させるため再試算をキック
        // （※初回ロード時など、シミュレータ側の関数が存在する場合のみ実行）
        if (typeof runSimulation === 'function') {
            // 人物選択の表記リフレッシュ
            const scenario = document.getElementById('scenario-selector').value;
            if (scenario !== 'custom') {
                const selectEl = document.getElementById('scenario-selector');
                document.getElementById('scenario-input').value = selectEl.options[selectEl.selectedIndex].text;
            }
            runSimulation();
        }

        // 現在の言語設定をブラウザに記憶
        localStorage.setItem('gemkin_preferred_lang', lang);

    } catch (error) {
        console.error('多言語化エンジンの駆動エラー:', error);
    }
}

// ドキュメント読み込み完了時の初期化布陣
document.addEventListener('DOMContentLoaded', () => {
    const switcher = document.getElementById('languageSwitcher');
    if (!switcher) return;

    // ブラウザの記憶、または初期値として日本語（ja）を装填
    const savedLang = localStorage.getItem('gemkin_preferred_lang') || 'ja';
    switcher.value = savedLang;

    // 言語スイッチ変更時の迎撃トリガーを設定
    switcher.addEventListener('change', (e) => {
        switchLanguage(e.target.value);
    });

    // 初期言語の展開
    switchLanguage(savedLang);
});
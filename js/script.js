// グローバル変数
var isThinking = false;
var LIVE_OWNER_ID = createUuid();
var recognition = null;
var isRecording = false;

// UUID生成
function createUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (a) {
        let r = (new Date().getTime() + Math.random() * 16) % 16 | 0, v = a == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 音声入力機能
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();

        recognition.lang = 'ja-JP';
        recognition.continuous = true; // 連続音声認識をオンにする
        recognition.interimResults = true;

        recognition.onstart = function() {
            isRecording = true;
            const voiceButton = document.getElementById('voiceButton');
            voiceButton.classList.add('recording');
            voiceButton.textContent = '🔴';
            document.getElementById('utterance').placeholder = '音声を認識中... (ボタンを押して停止)';
        };

        recognition.onresult = function(event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            document.getElementById('utterance').value = transcript;

            // 末尾が「どうぞ」なら自動送信
            if (transcript.trimEnd().endsWith('どうぞ')) {
                const cleanMessage = transcript.trimEnd().slice(0, -3).trimEnd();
                document.getElementById('utterance').value = cleanMessage;
                stopVoiceRecording();
                recognition.stop();
                onClickSend();
            }
        };

        recognition.onend = function() {
            // 手動で停止された場合のみ録音状態を解除
            if (isRecording) {
                // 自動的に再開しようとする場合は再開
                try {
                    recognition.start();
                } catch (e) {
                    console.log('音声認識の再開に失敗:', e);
                    // 再開に失敗した場合は録音状態を解除
                    stopVoiceRecording();
                }
            }
        };

        recognition.onerror = function(event) {
            console.error('音声認識エラー:', event.error);

            const userCommentElement = document.querySelector("#userComment");
            if (event.error === 'not-allowed') {
                userCommentElement.textContent = 'マイクの使用が許可されていません。ブラウザの設定を確認してください。';
                stopVoiceRecording();
            } else if (event.error === 'no-speech') {
                // 無音の場合は継続
                userCommentElement.textContent = '音声を検出中...';
            } else {
                userCommentElement.textContent = '音声認識でエラーが発生しました: ' + event.error;
                stopVoiceRecording();
            }
        };

        return true;
    } else {
        console.warn('このブラウザは音声認識をサポートしていません');
        return false;
    }
}

// 音声録音を停止する関数
function stopVoiceRecording() {
    isRecording = false;
    const voiceButton = document.getElementById('voiceButton');
    voiceButton.classList.remove('recording');
    voiceButton.textContent = '🎤';
    document.getElementById('utterance').placeholder = 'メッセージを入力してください...';
}

// 音声入力の開始/停止
function toggleVoiceInput() {
    if (!recognition) {
        const userCommentElement = document.querySelector("#userComment");
        userCommentElement.textContent = 'このブラウザは音声認識をサポートしていません';
        return;
    }

    if (isRecording) {
        // 手動停止
        stopVoiceRecording();
        recognition.stop();
    } else {
        // 開始
        try {
            recognition.start();
        } catch (e) {
            console.error('音声認識の開始に失敗:', e);
        }
    }
}

// タイプライター効果
function startTyping(param) {
    let el = document.querySelector(param.el);
    el.textContent = "";
    el.classList.add('typing-cursor');

    let speed = param.speed;
    let string = param.string;
    let index = 0;

    const typeChar = () => {
        if (index < string.length) {
            el.textContent = string.substring(0, index + 1);
            index++;

            // AIレスポンスボックスを最下部にスクロール
            const aiResponseBox = document.querySelector('.aiResponseBox');
            if (aiResponseBox) {
                aiResponseBox.scrollTop = aiResponseBox.scrollHeight;
            }

            setTimeout(typeChar, speed);
        } else {
            el.classList.remove('typing-cursor');

            // タイピング完了後も最下部にスクロール
            const aiResponseBox = document.querySelector('.aiResponseBox');
            if (aiResponseBox) {
                aiResponseBox.scrollTop = aiResponseBox.scrollHeight;
            }
        }
    };

    typeChar();
}

// MEBO APIからレスポンスを取得（Vercelサーバーレス関数経由）
async function getMeboResponse(utterance, username, uid) {
    const requestBody = {
        utterance: utterance,
        username: username,
        uid: uid
    };

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const content = await response.json();
        return content.response;
    } catch (error) {
        console.error('API Error:', error);
        return 'すみません、少し調子が悪いみたいです。もう一度試してくださいね。';
    }
}

// 文章整形
function formatResponse(text) {
    return text
        .replace(/([。！？])/g, '$1\n')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();
}

// コメント処理
async function handleComment(comment, username) {
    if (isThinking) return;

    isThinking = true;
    const sendButton = document.getElementById('sendButton');
    const voiceButton = document.getElementById('voiceButton');
    const userCommentElement = document.querySelector("#userComment");

    sendButton.disabled = true;
    sendButton.innerHTML = '<div class="loading"></div>';
    voiceButton.disabled = true;
    userCommentElement.textContent = username + ": " + comment;

    // キーワードに基づいて適切な画像を選択
    const selectedImage = getImageForComment(comment);
    changeCharacterImage(selectedImage);

    startTyping({
        el: "#aiResponseUtterance",
        string: "そうだワンね...",
        speed: 100
    });

    try {
        const response = await getMeboResponse(comment, username, LIVE_OWNER_ID);
        const formattedResponse = formatResponse(response);

        // タイプライター効果で表示
        startTyping({
            el: "#aiResponseUtterance",
            string: formattedResponse,
            speed: 30
        });

    } catch (error) {
        console.error('Error handling comment:', error);
        document.querySelector("#aiResponseUtterance").textContent = 'エラーが発生しました。もう一度お試しください。';
    } finally {
        isThinking = false;
        sendButton.disabled = false;
        sendButton.textContent = '送信';
        voiceButton.disabled = false;
    }
}

// 送信処理
function onClickSend() {
    const utteranceInput = document.querySelector("#utterance");
    const message = utteranceInput.value.trim();

    if (message === '' || isThinking) return;

    handleComment(message, 'あなた');
    utteranceInput.value = "";
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // 音声認識の初期化
    const speechSupported = initSpeechRecognition();
    if (!speechSupported) {
        const voiceButton = document.getElementById('voiceButton');
        voiceButton.style.opacity = '0.5';
        voiceButton.title = 'このブラウザは音声認識をサポートしていません';
    }

    // 定型メッセージメニューの初期化
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    if (typeof PRESET_MESSAGES !== 'undefined' && hamburgerMenu) {
        PRESET_MESSAGES.forEach(message => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.textContent = message;
            menuItem.onclick = function() {
                selectPresetMessage(message);
            };
            hamburgerMenu.appendChild(menuItem);
        });
    }

    // Enterキー送信
    const utteranceInput = document.querySelector("#utterance");
    utteranceInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onClickSend();
        }
    });

    // 初期フォーカス
    utteranceInput.focus();
});

// ハンバーガーメニューの開閉
function toggleHamburgerMenu() {
    const menu = document.getElementById('hamburgerMenu');
    menu.classList.toggle('show');
}

// 定型文選択
function selectPresetMessage(message) {
    const utteranceInput = document.getElementById('utterance');
    utteranceInput.value = message;
    utteranceInput.focus();

    // メニューを閉じる
    const menu = document.getElementById('hamburgerMenu');
    menu.classList.remove('show');
}

// メニュー外クリックで閉じる
document.addEventListener('click', function(event) {
    const menu = document.getElementById('hamburgerMenu');
    const menuButton = document.getElementById('menuButton');

    if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
        menu.classList.remove('show');
    }
});


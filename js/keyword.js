// キーワードに基づく画像選択機能
function getImageForComment(comment) {
    // その1: 感謝系キーワード → character002（照れ・嬉しい顔）
    const gratitudeKeywords = ["ありがとう", "ありがと", "感謝", "助かった", "助かる", "お礼", "おかげ", "サンキュ", "うれしい", "嬉しい"];
    if (gratitudeKeywords.some(keyword => comment.includes(keyword))) {
        return "image/character002.png";
    }

    // その2: 挨拶系キーワード → character003（ウインク・茶目っ気顔）
    const greetingKeywords = ["こんにちは", "こんちは", "はじめまして", "おはよう", "おはよ", "こんばんは", "やほ", "ただいま", "よろしく", "おつかれ", "お疲れ", "またね", "またよろしく"];
    if (greetingKeywords.some(keyword => comment.includes(keyword))) {
        return "image/character003.png";
    }

    // その3: 理解系キーワード → character004（元気・舌出し顔）
    const understandingKeywords = ["なるほど", "わかった", "わかりました", "そっか", "そうか", "理解", "納得", "了解", "スッキリ", "すっきり", "腑に落ちた", "そうだね", "そうですね"];
    if (understandingKeywords.some(keyword => comment.includes(keyword))) {
        return "image/character004.png";
    }

    // その4: 褒め言葉・喜び系キーワード → character005（驚き・びっくり顔）
    const praiseKeywords = ["すごい", "すごっ", "えらい", "やった", "最高", "いいね", "上手", "グッド", "ナイス", "完璧", "さすが", "流石", "よくできた", "素晴らしい", "最高", "正解"];
    if (praiseKeywords.some(keyword => comment.includes(keyword))) {
        return "image/character005.png";
    }

    // その5: 励まし・共感系キーワード → character006（悲しい・困り顔）
    const encouragementKeywords = ["つらい", "しんどい", "疲れた", "だるい", "不安", "心配", "落ち込", "頑張", "できない", "無理", "やる気", "困った", "挫折", "諦め", "モヤモヤ", "悲しい"];
    if (encouragementKeywords.some(keyword => comment.includes(keyword))) {
        return "image/character006.png";
    }

    // その0: デフォルト（キーワードが見つからない場合）
    return "image/character001.png";
}

// キャラクター画像切り替え機能
var currentBaseImage = "image/character001.png";

function changeCharacterImage(newImagePath) {
    currentBaseImage = newImagePath;
    const charaImg = document.getElementById("charaImg");
    if (charaImg) {
        charaImg.src = newImagePath;
        // 画像変更時のアニメーション効果（オプション）
        charaImg.style.opacity = '0.8';
        setTimeout(() => {
            charaImg.style.opacity = '1';
        }, 200);
    }
}

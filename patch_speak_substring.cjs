const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const regex = /if \(l\.includes\('english'\) \|\|[\s\S]*?else if \(l\.includes\('turkish'\) \|\| l\.includes\('тур'\) \|\| l\.includes\('tr'\)\) detectedLang = 'tr-TR';/m;

const replacement = `const matchLang = (str, keywords) => keywords.some(k => {
          if (k.length === 2) {
             // For 2-letter codes, require word boundary to avoid matching "politics" -> "it"
             return new RegExp('\\\\b' + k + '\\\\b').test(str);
          }
          return str.includes(k);
        });

        if (matchLang(l, ['english', 'англ', 'en'])) detectedLang = 'en-US';
        else if (matchLang(l, ['russian', 'рус', 'ru'])) detectedLang = 'ru-RU';
        else if (matchLang(l, ['spanish', 'исп', 'es'])) detectedLang = 'es-ES';
        else if (matchLang(l, ['chinese', 'кит', 'mandarin', 'zh'])) detectedLang = 'zh-CN';
        else if (matchLang(l, ['korean', 'кор', 'ko'])) detectedLang = 'ko-KR';
        else if (matchLang(l, ['japanese', 'яп', 'ja'])) detectedLang = 'ja-JP';
        else if (matchLang(l, ['french', 'франц', 'fr'])) detectedLang = 'fr-FR';
        else if (matchLang(l, ['german', 'нем', 'de'])) detectedLang = 'de-DE';
        else if (matchLang(l, ['italian', 'итал', 'it'])) detectedLang = 'it-IT';
        else if (matchLang(l, ['portuguese', 'португ', 'pt'])) detectedLang = 'pt-BR';
        else if (matchLang(l, ['dutch', 'нидерл', 'голланд', 'nl'])) detectedLang = 'nl-NL';
        else if (matchLang(l, ['polish', 'пол', 'pl'])) detectedLang = 'pl-PL';
        else if (matchLang(l, ['turkish', 'тур', 'tr'])) detectedLang = 'tr-TR';`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/GameView.tsx', code);

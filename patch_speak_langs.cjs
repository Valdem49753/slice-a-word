const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldLang = `      if (langName.toLowerCase().includes('english')) utterance.lang = 'en-US';
      else if (langName.toLowerCase().includes('russian')) utterance.lang = 'ru-RU';
      else if (langName.toLowerCase().includes('spanish')) utterance.lang = 'es-ES';
      else if (langName.toLowerCase().includes('chinese')) utterance.lang = 'zh-CN';
      else if (langName.toLowerCase().includes('korean')) utterance.lang = 'ko-KR';`;

const newLang = `      const l = langName.toLowerCase();
      if (l.includes('english') || l.includes('англ')) utterance.lang = 'en-US';
      else if (l.includes('russian') || l.includes('рус')) utterance.lang = 'ru-RU';
      else if (l.includes('spanish') || l.includes('исп')) utterance.lang = 'es-ES';
      else if (l.includes('chinese') || l.includes('кит')) utterance.lang = 'zh-CN';
      else if (l.includes('korean') || l.includes('кор')) utterance.lang = 'ko-KR';
      else if (l.includes('japanese') || l.includes('яп')) utterance.lang = 'ja-JP';
      else if (l.includes('french') || l.includes('франц')) utterance.lang = 'fr-FR';
      else if (l.includes('german') || l.includes('нем')) utterance.lang = 'de-DE';`;

code = code.replace(oldLang, newLang);
fs.writeFileSync('src/components/GameView.tsx', code);

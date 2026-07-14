const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /\/\/ Auto-detect swapped languages[\s\S]*?utterance\.lang = detectedLang;/m,
  `// Auto-detect swapped languages (strict)
        const cyrillicCount = (text.match(/[а-яА-ЯЁё]/g) || []).length;
        const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
        
        if (cyrillicCount > 0 && latinCount === 0 && !detectedLang.startsWith('ru') && !detectedLang.startsWith('uk') && !detectedLang.startsWith('be') && !detectedLang.startsWith('bg')) {
          detectedLang = 'ru-RU';
        } else if (latinCount > 0 && cyrillicCount === 0 && detectedLang.startsWith('ru')) {
          detectedLang = 'en-US';
        }
        
        utterance.lang = detectedLang;`
);

fs.writeFileSync('src/components/GameView.tsx', code);

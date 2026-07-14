const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /let detectedLang = 'en-US';/,
  "let detectedLang = '';"
);

code = code.replace(
  /utterance\.lang = detectedLang;/,
  "if (detectedLang) utterance.lang = detectedLang;"
);

fs.writeFileSync('src/components/GameView.tsx', code);

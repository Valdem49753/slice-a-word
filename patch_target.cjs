const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  '    speak(prompt, promptLang);',
  '    speak(currentWord.target, wordSet.targetLang); // Always speak the target word'
);
fs.writeFileSync('src/components/GameView.tsx', code);

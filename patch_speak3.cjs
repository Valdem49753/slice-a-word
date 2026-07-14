const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /setTimeout\(\(\) => \{\s*window\.speechSynthesis\.speak\(utterance\);\s*\}, 50\);/,
  "window.speechSynthesis.speak(utterance);"
);

fs.writeFileSync('src/components/GameView.tsx', code);

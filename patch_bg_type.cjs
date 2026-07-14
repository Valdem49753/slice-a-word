const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');
code = code.replace(
  'const getBackgroundImage = (lang) => {',
  'const getBackgroundImage = (lang: string) => {'
);
fs.writeFileSync('src/components/GameView.tsx', code);

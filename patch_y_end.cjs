const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /animate=\{\{ y: window\.innerHeight, opacity: 1 \}\}/g,
  "animate={{ y: window.innerHeight + 200, opacity: 1 }}"
);

fs.writeFileSync('src/components/GameView.tsx', code);

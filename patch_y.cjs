const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /initial=\{\{ y: -100, opacity: 1 \}\}/g,
  "initial={{ y: -200, opacity: 1 }}"
);

fs.writeFileSync('src/components/GameView.tsx', code);

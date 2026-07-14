const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(/style=\{\{ filter: 'drop-shadow\\(0 0 8px rgba\\(255,255,255,0\\.8\\)\\)' \}\}/g, '');

fs.writeFileSync('src/components/GameView.tsx', code);

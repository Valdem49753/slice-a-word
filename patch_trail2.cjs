const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(/style=\{\{ filter: 'drop-shadow\\(0px 0px 8px rgba\\(255,255,255,0\\.8\\)\\)' \}\}/g, '');
code = code.replace(/className="drop-shadow-lg opacity-80"/g, 'className="opacity-80"');

fs.writeFileSync('src/components/GameView.tsx', code);

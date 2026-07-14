const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  "style={{ clipPath: 'polygon(50% 30%, 0% 100%, 100% 100%)', backgroundColor: '#e8cd12' }}>",
  "style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: '#e8cd12' }}>"
);
fs.writeFileSync('src/components/GameView.tsx', code);

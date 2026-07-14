const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /initial=\{\{ y: -200, opacity: 1 \}\}/g,
  "initial={{ y: -300, opacity: 1 }}"
);

code = code.replace(
  /style=\{\{ left: `\$\{item.x\}%`, width: '28vw', maxWidth: '120px', height: '65px' \}\}/g,
  "style={{ top: '-100px', left: `${item.x}%`, width: '28vw', maxWidth: '120px', height: '65px' }}"
);

fs.writeFileSync('src/components/GameView.tsx', code);

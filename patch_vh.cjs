const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /initial=\{\{ y: -300, opacity: 1 \}\}/g,
  "initial={{ y: 0, opacity: 1 }}"
);

code = code.replace(
  /animate=\{\{ y: window\.innerHeight \+ 200, opacity: 1 \}\}/g,
  "animate={{ y: '130vh', opacity: 1 }}"
);

code = code.replace(
  /style=\{\{ top: '-100px', left: `\$\{item.x\}%`, width: '28vw', maxWidth: '120px', height: '65px' \}\}/g,
  "style={{ top: '-30vh', left: `${item.x}%`, width: '28vw', maxWidth: '120px', height: '65px' }}"
);

fs.writeFileSync('src/components/GameView.tsx', code);

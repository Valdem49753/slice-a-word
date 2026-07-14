const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /style=\{\{ left: `\$\{item.x\}%`, width: '38vw', maxWidth: '160px', height: '90px' \}\}/g,
  "style={{ left: `${item.x}%`, width: '28vw', maxWidth: '120px', height: '65px' }}"
);

code = code.replace(
  /style=\{\{ fontSize: \(item\.text\?\.length \|\| 0\) > 25 \? '0\.75rem' : \(item\.text\?\.length \|\| 0\) > 15 \? '0\.9rem' : '1\.15rem' \}\}/g,
  "style={{ fontSize: (item.text?.length || 0) > 25 ? '0.65rem' : (item.text?.length || 0) > 15 ? '0.75rem' : '0.95rem' }}"
);

fs.writeFileSync('src/components/GameView.tsx', code);

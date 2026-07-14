const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /delay: idx \* 0\.85/g,
  "delay: idx * 0.55"
);

fs.writeFileSync('src/components/GameView.tsx', code);

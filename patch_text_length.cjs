const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(/item\.text\.length/g, '(item.text?.length || 0)');

fs.writeFileSync('src/components/GameView.tsx', code);

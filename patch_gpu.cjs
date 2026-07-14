const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

// Remove drop-shadow from text
code = code.replace(/drop-shadow-\[0_2px_2px_rgba\(0,0,0,0\.8\)\]/g, '');

// Remove shadow-xl from the halves and full card
code = code.replace(/shadow-xl/g, 'shadow-md');

// Simplify clip-path to not have negative percentages
code = code.replace(/clipPath: 'polygon\(-20% -20%, 61% -20%, 41% 120%, -20% 120%\)'/g, "clipPath: 'polygon(0% 0%, 61% 0%, 41% 100%, 0% 100%)'");
code = code.replace(/clipPath: 'polygon\(59% -20%, 120% -20%, 120% 120%, 39% 120%\)'/g, "clipPath: 'polygon(59% 0%, 100% 0%, 100% 100%, 39% 100%)'");

fs.writeFileSync('src/components/GameView.tsx', code);

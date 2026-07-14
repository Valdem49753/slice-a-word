const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  'className="px-10 py-6 bg-emerald-500 text-white text-4xl font-black rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all"',
  'className="px-10 py-6 bg-[#0f4d31] text-[#e8cd12] text-4xl font-black rounded-3xl shadow-[0_0_40px_rgba(15,77,49,0.5)] hover:scale-105 active:scale-95 transition-all"'
);
fs.writeFileSync('src/components/GameView.tsx', code);

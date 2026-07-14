const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(/className="absolute inset-0 bg-amber-100 border-4 border-amber-600 px-2 py-1 rounded-xl shadow-xl text-center flex flex-col justify-center items-center overflow-hidden"/g, 'className="absolute inset-x-2 top-0 bottom-0 bg-[#16a34a] rounded-sm shadow-xl border-y-2 border-[#15803d] text-center flex flex-col justify-center items-center"');

// Fix the bamboo caps and text colors
code = code.replace(/<div className="absolute left-0 top-1\/2 w-2 h-full bg-amber-700 -translate-y-1\/2 rounded-l-md transform -translate-x-full"><\/div>/g, '<div className="absolute left-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-l-[4px]" />');
code = code.replace(/<div className="absolute right-0 top-1\/2 w-2 h-full bg-amber-700 -translate-y-1\/2 rounded-r-md transform translate-x-full"><\/div>/g, '<div className="absolute right-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-r-[4px]" />');

code = code.replace(/font-bold text-amber-900 block relative z-10 select-none leading-tight whitespace-pre-wrap/g, 'font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] block relative z-10 select-none leading-tight whitespace-pre-wrap px-2');

fs.writeFileSync('src/components/GameView.tsx', code);

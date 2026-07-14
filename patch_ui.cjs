const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

// 1. Update imports
code = code.replace(
  "import { Heart, Volume2, X } from 'lucide-react';",
  "import { Heart, Volume2, Pause } from 'lucide-react';\nimport bgImage from '../assets/images/bamboo_background_1783886905999.jpg';"
);

// 2. Update GameView container background
code = code.replace(
  '<div \n      className="fixed inset-0 bg-emerald-900 overflow-hidden touch-none z-[100]" \n      style={{ userSelect: \'none\' }}',
  '<div \n      className="fixed inset-0 overflow-hidden touch-none z-[100]" \n      style={{ userSelect: \'none\', backgroundImage: `url(${bgImage})`, backgroundSize: \'cover\', backgroundPosition: \'center\' }}'
);

// 3. Update Top HUD & Prompt Area
const oldHUD = `      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-4 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex gap-1 bg-black/20 p-1.5 rounded-lg backdrop-blur-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Heart key={i} className={\`w-6 h-6 \${i < lives ? 'fill-red-500 text-red-500' : 'text-gray-500 opacity-50 transition-all'}\`} />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center text-white text-xl font-black bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            {score}
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-lg backdrop-blur-sm transition-all pointer-events-auto"
            aria-label="Exit game"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Prompt Area */}
      <div className="absolute top-20 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <motion.div 
          key={currentIndex}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-xl shadow-2xl text-center pointer-events-auto"
        >
          {mode.startsWith('audio_') ? (
            <button onClick={() => speak(originalPrompt, mode.includes('native_to_target') ? wordSet.nativeLang : wordSet.targetLang)} className="flex items-center gap-2 text-xl font-bold text-emerald-800 hover:text-emerald-600 transition-colors">
              <Volume2 size={24} /> Listen
            </button>
          ) : (
            <h2 className="text-2xl font-bold text-emerald-900 whitespace-pre-wrap">{currentPrompt}</h2>
          )}
        </motion.div>
      </div>`;

const newHUD = `      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between items-start z-50 pointer-events-none">
        {/* Pause Button */}
        <button
          onClick={() => navigate('/')}
          className="bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white p-3 rounded-xl pointer-events-auto shadow-sm"
        >
          <Pause className="w-6 h-6 fill-white text-white" />
        </button>

        {/* Center: Combo & Hearts */}
        <div className="flex flex-col items-center gap-2">
           <div className="bg-[#b3c78f] border-b-4 border-[#9db375] px-6 py-2 rounded-xl flex flex-col items-center shadow-md">
             <span className="text-amber-700 text-3xl font-black" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>{score}</span>
             <span className="text-white text-[10px] font-bold tracking-widest mt-1">COMBO</span>
           </div>
           <div className="flex gap-1">
             {Array.from({ length: 4 }).map((_, i) => (
               <Heart key={i} className={\`w-5 h-5 \${i < lives ? 'fill-red-500 text-red-500' : 'text-gray-500 opacity-50'}\`} />
             ))}
           </div>
        </div>

        {/* Right: Best */}
        <div className="bg-[#b3c78f] border-b-4 border-[#9db375] px-4 py-2 rounded-xl flex flex-col items-center shadow-md opacity-80">
          <span className="text-white text-2xl font-black">0</span>
          <span className="text-white text-[10px] font-bold tracking-widest mt-1">BEST</span>
        </div>
      </div>

      {/* Prompt Area (Bottom Triangle) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] max-w-[800px] h-40 pointer-events-auto flex items-end justify-center pb-8 z-40"
           style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: '#e8cd12' }}>
        <motion.div 
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          {mode.startsWith('audio_') ? (
            <button onClick={() => speak(originalPrompt, mode.includes('native_to_target') ? wordSet.nativeLang : wordSet.targetLang)} className="flex items-center gap-2 text-2xl font-bold text-amber-900 hover:text-amber-700 transition-colors">
              <Volume2 size={28} /> Listen
            </button>
          ) : (
            <h2 className="text-2xl md:text-3xl font-bold text-amber-900 whitespace-pre-wrap px-12">{currentPrompt}</h2>
          )}
        </motion.div>
      </div>`;

code = code.replace(oldHUD, newHUD);
fs.writeFileSync('src/components/GameView.tsx', code);

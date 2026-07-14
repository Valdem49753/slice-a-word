const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

// 1. Update background imports
code = code.replace(
  "import bgImage from '../assets/images/bamboo_background_1783886905999.jpg';",
  `import bgAsian from '../assets/images/bamboo_background_1783886905999.jpg';
import bgEuro from '../assets/images/euro_landscape_bg_1783887975984.jpg';
import bgWinter from '../assets/images/winter_forest_bg_1783887987754.jpg';`
);

// 2. Add getBackgroundImage logic and update bg usage
const oldReturn = `  if (gameOver && wordSet) {
    return (
      <PostGameDashboard 
        wordSetId={wordSet.id}
        targetLang={wordSet.targetLang}
        sessionStats={sessionStatsRef.current}
        score={score}
        maxScore={words.length}
        onPlayAgain={() => window.location.reload()}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden touch-none z-[100]" 
      style={{ userSelect: 'none', backgroundImage: \`url(\${bgImage})\`, backgroundSize: 'cover', backgroundPosition: 'center' }}`;

const newReturn = `  if (gameOver && wordSet) {
    return (
      <PostGameDashboard 
        wordSetId={wordSet.id}
        targetLang={wordSet.targetLang}
        sessionStats={sessionStatsRef.current}
        score={score}
        maxScore={words.length}
        onPlayAgain={() => window.location.reload()}
      />
    );
  }

  const getBackgroundImage = (lang) => {
    if (!lang) return bgEuro;
    const l = lang.toLowerCase();
    if (l.includes('zh') || l.includes('ja') || l.includes('ko') || l.includes('chinese') || l.includes('japanese') || l.includes('korean')) {
      return bgAsian;
    }
    if (l.includes('ru') || l.includes('russian') || l.includes('sv') || l.includes('no') || l.includes('fi')) {
      return bgWinter;
    }
    return bgEuro;
  };
  const currentBgImage = wordSet ? getBackgroundImage(wordSet.targetLang) : bgEuro;

  return (
    <div 
      className="fixed inset-0 overflow-hidden touch-none z-[100]" 
      style={{ userSelect: 'none', backgroundImage: \`url(\${currentBgImage})\`, backgroundSize: 'cover', backgroundPosition: 'center' }}`;

code = code.replace(oldReturn, newReturn);

// 3. Update HUD size
const oldHUD = `      {/* Top HUD */}
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
      </div>`;

const newHUD = `      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-3 pt-5 flex justify-between items-start z-50 pointer-events-none">
        {/* Pause Button */}
        <button
          onClick={() => navigate('/')}
          className="bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white p-2 rounded-xl pointer-events-auto shadow-sm"
        >
          <Pause className="w-5 h-5 fill-white text-white" />
        </button>

        {/* Center: Combo & Hearts */}
        <div className="flex flex-col items-center gap-1.5">
           <div className="bg-[#b3c78f] border-b-4 border-[#9db375] px-4 py-1.5 rounded-xl flex flex-col items-center shadow-md">
             <span className="text-amber-700 text-2xl font-black" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>{score}</span>
             <span className="text-white text-[8px] font-bold tracking-widest mt-0.5">COMBO</span>
           </div>
           <div className="flex gap-1 mt-0.5">
             {Array.from({ length: 4 }).map((_, i) => (
               <Heart key={i} className={\`w-4 h-4 \${i < lives ? 'fill-red-500 text-red-500' : 'text-gray-500 opacity-50'}\`} />
             ))}
           </div>
        </div>

        {/* Right: Best */}
        <div className="bg-[#b3c78f] border-b-4 border-[#9db375] px-3 py-1.5 rounded-xl flex flex-col items-center shadow-md opacity-80">
          <span className="text-white text-xl font-black">0</span>
          <span className="text-white text-[8px] font-bold tracking-widest mt-0.5">BEST</span>
        </div>
      </div>`;

code = code.replace(oldHUD, newHUD);

// 4. Update Triangle
const oldTriangle = `      {/* Prompt Area (Bottom Triangle) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] max-w-[800px] h-40 pointer-events-auto flex items-end justify-center pb-8 z-40"
           style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: '#e8cd12' }}>`;

const newTriangle = `      {/* Prompt Area (Bottom Triangle) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] max-w-[800px] h-28 pointer-events-auto flex items-end justify-center pb-4 z-40"
           style={{ clipPath: 'polygon(50% 30%, 0% 100%, 100% 100%)', backgroundColor: '#e8cd12' }}>`;

code = code.replace(oldTriangle, newTriangle);

// 5. Update Distractors color to be brighter
code = code.replace(/bg-\[#0f4d31\]/g, 'bg-[#16a34a]'); // green-600
code = code.replace(/bg-\[#0a3822\]/g, 'bg-[#14532d]'); // green-900 for caps
code = code.replace(/className="font-bold text-white/g, 'className="font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'); 

fs.writeFileSync('src/components/GameView.tsx', code);

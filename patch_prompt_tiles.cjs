const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

// Update Prompt Area
code = code.replace(
  /<div className="absolute bottom-0 left-1\/2 -translate-x-1\/2 w-\[150vw\] max-w-\[800px\] h-28 pointer-events-auto flex items-end justify-center pb-4 z-40"\s+style=\{\{ clipPath: 'polygon\(50% 0%, 0% 100%, 100% 100%\)', backgroundColor: '#e8cd12' \}\}>\s*<motion\.div\s*key=\{currentIndex\}\s*initial=\{\{ y: 20, opacity: 0 \}\}\s*animate=\{\{ y: 0, opacity: 1 \}\}\s*className="text-center"\s*>/g,
  `<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] max-w-[800px] min-h-[9rem] pointer-events-auto flex items-end justify-center pb-4 pt-10 px-10 z-40"
           style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: '#e8cd12' }}>
        <motion.div 
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center max-w-[60vw] md:max-w-md mx-auto"
        >`
);

code = code.replace(
  /<h2 className="text-2xl md:text-3xl font-bold text-amber-900 whitespace-pre-wrap px-12">\{currentPrompt\}<\/h2>/g,
  `<h2 className={\`font-bold text-amber-900 whitespace-pre-wrap text-balance \${currentPrompt.length > 40 ? 'text-base md:text-lg' : currentPrompt.length > 20 ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}\`}>{currentPrompt}</h2>`
);

// Update Tile Size
code = code.replace(
  /style=\{\{ top: '-30vh', left: `\$\{item\.x\}%`, width: '28vw', maxWidth: '120px', height: '65px' \}\}/g,
  "style={{ top: '-30vh', left: `${item.x}%`, width: '40vw', maxWidth: '180px', height: '65px' }}"
);

// Update Font Sizes for Tiles
code = code.replace(
  /style=\{\{ fontSize: \(item\.text\?\.length \|\| 0\) > 25 \? '0\.65rem' : \(item\.text\?\.length \|\| 0\) > 15 \? '0\.75rem' : '0\.95rem' \}\}/g,
  "style={{ fontSize: (item.text?.length || 0) > 25 ? '0.75rem' : (item.text?.length || 0) > 15 ? '0.9rem' : '1.1rem' }}"
);

fs.writeFileSync('src/components/GameView.tsx', code);

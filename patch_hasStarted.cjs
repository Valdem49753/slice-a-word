const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldState = `const [gameOver, setGameOver] = useState(false);`;
const newState = `const [gameOver, setGameOver] = useState(false);\n  const [hasStarted, setHasStarted] = useState(false);`;
code = code.replace(oldState, newState);

const oldEffect = `  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length && !gameOver) {
      loadTurn(currentIndex);
    } else if (words.length > 0 && currentIndex >= words.length && !gameOver) {
      handleGameOver();
    }
  }, [words, currentIndex, gameOver]);`;

const newEffect = `  useEffect(() => {
    if (hasStarted && words.length > 0 && currentIndex < words.length && !gameOver) {
      loadTurn(currentIndex);
    } else if (hasStarted && words.length > 0 && currentIndex >= words.length && !gameOver) {
      handleGameOver();
    }
  }, [hasStarted, words, currentIndex, gameOver]);`;
code = code.replace(oldEffect, newEffect);

const oldRender = `      {/* Game Area */}`;
const newRender = `      {/* Start Overlay */}
      {!hasStarted && words.length > 0 && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[100] backdrop-blur-sm pointer-events-auto">
          <button 
            onClick={() => {
              if (window.speechSynthesis) {
                const u = new SpeechSynthesisUtterance('');
                u.volume = 0;
                window.speechSynthesis.speak(u);
                setTimeout(() => window.speechSynthesis.cancel(), 100);
              }
              setHasStarted(true);
            }}
            className="px-10 py-6 bg-emerald-500 text-white text-4xl font-black rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all"
          >
            TAP TO START
          </button>
        </div>
      )}

      {/* Game Area */}`;
code = code.replace(oldRender, newRender);

fs.writeFileSync('src/components/GameView.tsx', code);

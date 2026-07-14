const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldRender = `                if (window.speechSynthesis) {
                  const u = new SpeechSynthesisUtterance('');
                  u.volume = 0;
                  window.speechSynthesis.speak(u);
                  setTimeout(() => window.speechSynthesis.cancel(), 100);
                }
                setHasStarted(true);`;

const newRender = `                if (window.speechSynthesis) {
                  const u = new SpeechSynthesisUtterance('');
                  u.volume = 0;
                  window.speechSynthesis.speak(u);
                }
                setHasStarted(true);`;

code = code.replace(oldRender, newRender);
fs.writeFileSync('src/components/GameView.tsx', code);

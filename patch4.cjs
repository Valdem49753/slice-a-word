const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    fetchWordSet();
  }, [user, setId]);`;

const newEffect = `  useEffect(() => {
    fetchWordSet();
    // Pre-load voices for Safari/Chrome
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, [user, setId]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/GameView.tsx', code);

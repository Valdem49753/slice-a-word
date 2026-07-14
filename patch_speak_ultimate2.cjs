const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /const speak = \(text: string, langName: string\) => \{[\s\S]*?console\.warn\("Speech synthesis failed", e\);\s*\}\s*\};/,
  `const speak = (text: string, langName: string) => { 
    console.log("Speaking:", text, langName);
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel(); // Clear queue
      
      const playAudio = () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1;
        utterance.rate = 1;
        const l = langName.toLowerCase().trim();
        let detectedLang = 'en-US'; // default fallback
        
        if (l.includes('english') || l.includes('англ') || l.includes('en')) detectedLang = 'en-US';
        else if (l.includes('russian') || l.includes('рус') || l.includes('ru')) detectedLang = 'ru-RU';
        else if (l.includes('spanish') || l.includes('исп') || l.includes('es')) detectedLang = 'es-ES';
        else if (l.includes('chinese') || l.includes('кит') || l.includes('mandarin') || l.includes('zh')) detectedLang = 'zh-CN';
        else if (l.includes('korean') || l.includes('кор') || l.includes('ko')) detectedLang = 'ko-KR';
        else if (l.includes('japanese') || l.includes('яп') || l.includes('ja')) detectedLang = 'ja-JP';
        else if (l.includes('french') || l.includes('франц') || l.includes('fr')) detectedLang = 'fr-FR';
        else if (l.includes('german') || l.includes('нем') || l.includes('de')) detectedLang = 'de-DE';
        else if (l.includes('italian') || l.includes('итал') || l.includes('it')) detectedLang = 'it-IT';
        else if (l.includes('portuguese') || l.includes('португ') || l.includes('pt')) detectedLang = 'pt-BR';
        else if (l.includes('dutch') || l.includes('нидерл') || l.includes('голланд') || l.includes('nl')) detectedLang = 'nl-NL';
        else if (l.includes('polish') || l.includes('пол') || l.includes('pl')) detectedLang = 'pl-PL';
        else if (l.includes('turkish') || l.includes('тур') || l.includes('tr')) detectedLang = 'tr-TR';
        
        // Auto-detect swapped languages
        const isCyrillic = /[а-яА-ЯЁё]/.test(text);
        const isLatin = /[a-zA-Z]/.test(text);
        if (isCyrillic && !detectedLang.startsWith('ru') && !detectedLang.startsWith('uk') && !detectedLang.startsWith('be') && !detectedLang.startsWith('bg')) {
          detectedLang = 'ru-RU';
        } else if (!isCyrillic && isLatin && detectedLang.startsWith('ru')) {
          detectedLang = 'en-US';
        }
        
        utterance.lang = detectedLang;
        
        // Try to get voices. If empty, the browser might load them on demand when we call speak().
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const shortLang = detectedLang.split('-')[0];
          // Try to find a high quality or native voice first
          let targetVoice = voices.find(v => (v.lang.startsWith(detectedLang) || v.lang.startsWith(shortLang)) && v.name.includes('Google'));
          if (!targetVoice) {
             targetVoice = voices.find(v => (v.lang.startsWith(detectedLang) || v.lang.startsWith(shortLang)) && v.localService);
          }
          if (!targetVoice) {
             targetVoice = voices.find(v => v.lang.startsWith(detectedLang) || v.lang.startsWith(shortLang));
          }
          if (targetVoice) {
            utterance.voice = targetVoice;
          }
        }
        
        utterance.onerror = (e) => {
          console.warn("Speech synthesis error:", e);
        };
        
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', playAudio, { once: true });
        setTimeout(() => {
          // Fallback if event didn't fire
          if (window.speechSynthesis.getVoices().length === 0) {
             playAudio();
          }
        }, 500);
      } else {
        setTimeout(playAudio, 50);
      }
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  };`
);

fs.writeFileSync('src/components/GameView.tsx', code);

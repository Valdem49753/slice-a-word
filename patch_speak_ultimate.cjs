const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /const speak = \(text: string, langName: string\) => \{[\s\S]*?console\.warn\("Speech synthesis failed", e\);\s*\}\s*\};/,
  `const speak = (text: string, langName: string) => { 
    console.log("Speaking:", text, langName);
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel(); // Clear queue
      
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 1;
        utterance.rate = 1;
        const l = langName.toLowerCase().trim();
        let detectedLang = 'en-US'; // default fallback
        
        if (l.includes('english') || l.includes('англ')) detectedLang = 'en-US';
        else if (l.includes('russian') || l.includes('рус')) detectedLang = 'ru-RU';
        else if (l.includes('spanish') || l.includes('исп')) detectedLang = 'es-ES';
        else if (l.includes('chinese') || l.includes('кит') || l.includes('mandarin')) detectedLang = 'zh-CN';
        else if (l.includes('korean') || l.includes('кор')) detectedLang = 'ko-KR';
        else if (l.includes('japanese') || l.includes('яп')) detectedLang = 'ja-JP';
        else if (l.includes('french') || l.includes('франц')) detectedLang = 'fr-FR';
        else if (l.includes('german') || l.includes('нем')) detectedLang = 'de-DE';
        else if (l.includes('italian') || l.includes('итал')) detectedLang = 'it-IT';
        else if (l.includes('portuguese') || l.includes('португ')) detectedLang = 'pt-BR';
        else if (l.includes('dutch') || l.includes('нидерл') || l.includes('голланд')) detectedLang = 'nl-NL';
        else if (l.includes('polish') || l.includes('пол')) detectedLang = 'pl-PL';
        else if (l.includes('turkish') || l.includes('тур')) detectedLang = 'tr-TR';
        
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
      }, 50); // slight delay to ensure UI threads and cancellation settle
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  };`
);

fs.writeFileSync('src/components/GameView.tsx', code);

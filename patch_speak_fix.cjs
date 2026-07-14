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
        const utterance = new SpeechSynthesisUtterance(text);
        const l = langName.toLowerCase();
        let detectedLang = '';
        if (l.includes('english') || l.includes('англ')) detectedLang = 'en-US';
        else if (l.includes('russian') || l.includes('рус')) detectedLang = 'ru-RU';
        else if (l.includes('spanish') || l.includes('исп')) detectedLang = 'es-ES';
        else if (l.includes('chinese') || l.includes('кит')) detectedLang = 'zh-CN';
        else if (l.includes('korean') || l.includes('кор')) detectedLang = 'ko-KR';
        else if (l.includes('japanese') || l.includes('яп')) detectedLang = 'ja-JP';
        else if (l.includes('french') || l.includes('франц')) detectedLang = 'fr-FR';
        else if (l.includes('german') || l.includes('нем')) detectedLang = 'de-DE';
        else if (l.includes('italian') || l.includes('итал')) detectedLang = 'it-IT';
        else if (l.includes('portuguese') || l.includes('португ')) detectedLang = 'pt-BR';
        else if (l.includes('dutch') || l.includes('нидерл') || l.includes('голланд')) detectedLang = 'nl-NL';
        else if (l.includes('polish') || l.includes('пол')) detectedLang = 'pl-PL';
        else if (l.includes('turkish') || l.includes('тур')) detectedLang = 'tr-TR';
        
        if (detectedLang) utterance.lang = detectedLang;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0 && detectedLang) {
          const shortLang = detectedLang.split('-')[0];
          const localVoice = voices.find(v => (v.lang.startsWith(detectedLang) || v.lang.startsWith(shortLang)) && v.localService);
          const targetVoice = localVoice || voices.find(v => v.lang.startsWith(detectedLang) || v.lang.startsWith(shortLang));
          if (targetVoice) {
            utterance.voice = targetVoice;
          }
        }
        
        utterance.onerror = (e) => {
          console.warn("Speech synthesis error:", e);
        };
        
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  };`
);

fs.writeFileSync('src/components/GameView.tsx', code);

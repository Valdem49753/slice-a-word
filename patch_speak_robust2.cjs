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
        
        if (l.includes('en') || l.includes('англ')) detectedLang = 'en-US';
        else if (l.includes('ru') || l.includes('рус')) detectedLang = 'ru-RU';
        else if (l.includes('es') || l.includes('sp') || l.includes('исп')) detectedLang = 'es-ES';
        else if (l.includes('zh') || l.includes('ch') || l.includes('кит')) detectedLang = 'zh-CN';
        else if (l.includes('ko') || l.includes('кор')) detectedLang = 'ko-KR';
        else if (l.includes('ja') || l.includes('jp') || l.includes('яп')) detectedLang = 'ja-JP';
        else if (l.includes('fr') || l.includes('франц')) detectedLang = 'fr-FR';
        else if (l.includes('de') || l.includes('ge') || l.includes('нем')) detectedLang = 'de-DE';
        else if (l.includes('it') || l.includes('итал')) detectedLang = 'it-IT';
        else if (l.includes('pt') || l.includes('po') || l.includes('португ')) detectedLang = 'pt-BR';
        else if (l.includes('nl') || l.includes('du') || l.includes('нидерл') || l.includes('голланд')) detectedLang = 'nl-NL';
        else if (l.includes('pl') || l.includes('пол')) detectedLang = 'pl-PL';
        else if (l.includes('tr') || l.includes('тур')) detectedLang = 'tr-TR';
        
        utterance.lang = detectedLang;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
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
      }, 100);
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  };`
);

fs.writeFileSync('src/components/GameView.tsx', code);

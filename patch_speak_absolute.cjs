const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const regex = /const playAudio = \(\) => \{[\s\S]*?window\.speechSynthesis\.speak\(utterance\);\s*\};/m;

const replacement = `const playAudio = () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
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
        
        // Auto-detect swapped languages (strict) and fix homoglyph typos
        const cyrillicCount = (text.match(/[а-яА-ЯЁё]/g) || []).length;
        const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
        
        let safeText = text;
        
        if (cyrillicCount > latinCount && !detectedLang.startsWith('ru') && !detectedLang.startsWith('uk') && !detectedLang.startsWith('be') && !detectedLang.startsWith('bg')) {
          detectedLang = 'ru-RU';
        } else if (latinCount > cyrillicCount && detectedLang.startsWith('ru')) {
          detectedLang = 'en-US';
        }
        
        // Transliterate homoglyphs if there's a mix to prevent TTS engine from glitching
        if (latinCount > cyrillicCount && cyrillicCount > 0) {
          const c2l: Record<string, string> = {'а':'a','с':'c','е':'e','о':'o','р':'p','х':'x','у':'y','А':'A','С':'C','Е':'E','О':'O','Р':'P','Х':'X','У':'Y','М':'M','Т':'T','В':'B','Н':'H','К':'K'};
          safeText = safeText.split('').map((char: string) => c2l[char] || char).join('');
        } else if (cyrillicCount > latinCount && latinCount > 0) {
          const l2c: Record<string, string> = {'a':'а','c':'с','e':'е','o':'о','p':'р','x':'х','y':'у','A':'А','C':'С','E':'Е','O':'О','P':'Р','X':'Х','Y':'У','M':'М','T':'Т','B':'В','H':'Н','K':'К'};
          safeText = safeText.split('').map((char: string) => l2c[char] || char).join('');
        }
        
        const utterance = new SpeechSynthesisUtterance(safeText);
        utterance.volume = 1;
        utterance.rate = 1;
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
      };`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/GameView.tsx', code);

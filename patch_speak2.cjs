const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const startIdx = code.indexOf('const speak = (text: string, langName: string) => {');
const endString = 'console.error("Speech synthesis failed:", err);\n    }\n  };';
let endIdx = code.indexOf(endString, startIdx);

if (startIdx === -1) {
    console.log("Could not find start index");
    process.exit(1);
}

// Find the matching closing brace for the speak function.
let braceCount = 0;
let foundStart = false;
let realEndIdx = -1;

for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') {
        braceCount++;
        foundStart = true;
    } else if (code[i] === '}') {
        braceCount--;
    }
    
    if (foundStart && braceCount === 0) {
        realEndIdx = i;
        break;
    }
}

if (realEndIdx === -1) {
    console.log("Could not find end index");
    process.exit(1);
}

const replacement = `const speak = (text: string, langName: string) => {
    console.log("Speaking:", text, langName);
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel(); // Clear queue
      
      const playAudio = () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        const l = langName.toLowerCase().trim();
        let detectedLang = 'en-US'; // default fallback
        
        if (/english|англ|eng\\b|en\\b|us\\b|uk\\b/i.test(l)) detectedLang = 'en-US';
        else if (/russian|рус|ru\\b|cyrillic/i.test(l)) detectedLang = 'ru-RU';
        else if (/spanish|исп|es\\b|span\\b/i.test(l)) detectedLang = 'es-ES';
        else if (/chinese|кит|mandarin|zh\\b|cn\\b/i.test(l)) detectedLang = 'zh-CN';
        else if (/korean|кор|ko\\b|kr\\b/i.test(l)) detectedLang = 'ko-KR';
        else if (/japanese|яп|ja\\b|jp\\b/i.test(l)) detectedLang = 'ja-JP';
        else if (/french|франц|fr\\b|fre\\b/i.test(l)) detectedLang = 'fr-FR';
        else if (/german|нем|de\\b|ger\\b/i.test(l)) detectedLang = 'de-DE';
        else if (/italian|итал|it\\b|ita\\b/i.test(l)) detectedLang = 'it-IT';
        else if (/portuguese|португ|pt\\b|por\\b/i.test(l)) detectedLang = 'pt-BR';
        else if (/dutch|нидерл|голланд|nl\\b/i.test(l)) detectedLang = 'nl-NL';
        else if (/polish|пол|pl\\b|pol\\b/i.test(l)) detectedLang = 'pl-PL';
        else if (/turkish|тур|tr\\b|tur\\b/i.test(l)) detectedLang = 'tr-TR';
        
        // Auto-detect based on text content as the absolute source of truth
        const cyrillicCount = (text.match(/[а-яА-ЯЁё]/g) || []).length;
        const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
        const chineseCount = (text.match(/[\\u4e00-\\u9fa5]/g) || []).length;
        const koreanCount = (text.match(/[\\uac00-\\ud7af|\\u1100-\\u11ff|\\u3130-\\u318f]/g) || []).length;
        const japaneseCount = (text.match(/[\\u3040-\\u309f|\\u30a0-\\u30ff]/g) || []).length;
        
        let safeText = text;
        
        if (chineseCount > 0) {
            detectedLang = 'zh-CN';
        } else if (koreanCount > 0) {
            detectedLang = 'ko-KR';
        } else if (japaneseCount > 0) {
            detectedLang = 'ja-JP';
        } else if (cyrillicCount > latinCount * 2) {
            detectedLang = 'ru-RU'; // Force Russian if mostly Cyrillic
        } else if (latinCount > cyrillicCount * 2) {
            // If it's mostly Latin, make sure it's not set to a non-Latin TTS
            const nonLatin = ['ru', 'zh', 'ja', 'ko', 'ar', 'he', 'th', 'uk', 'bg', 'be'];
            if (nonLatin.some(nl => detectedLang.startsWith(nl))) {
                detectedLang = 'en-US'; // Force English if mismatched
            }
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
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const shortLang = detectedLang.split('-')[0];
          
          let targetVoice = voices.find(v => v.lang.replace('_', '-') === detectedLang && v.name.includes('Google'));
          if (!targetVoice) targetVoice = voices.find(v => v.lang.replace('_', '-') === detectedLang);
          if (!targetVoice) targetVoice = voices.find(v => v.lang.startsWith(shortLang) && v.name.includes('Google'));
          if (!targetVoice) targetVoice = voices.find(v => v.lang.startsWith(shortLang));
          
          if (!targetVoice) {
              const langNames: Record<string, string[]> = {
                  'en': ['english', 'usa', 'uk', 'brit'],
                  'ru': ['russian', 'рус'],
                  'es': ['spanish', 'espa'],
                  'zh': ['chinese', 'mandarin', 'taiwan'],
                  'ko': ['korean'],
                  'ja': ['japanese'],
                  'fr': ['french', 'fran'],
                  'de': ['german', 'deutsch']
              };
              const keywords = langNames[shortLang] || [];
              if (keywords.length > 0) {
                  targetVoice = voices.find(v => keywords.some(k => v.name.toLowerCase().includes(k)));
              }
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
        let attempts = 0;
        const tryPlay = () => {
            if (window.speechSynthesis.getVoices().length > 0) {
                playAudio();
            } else if (attempts < 20) {
                attempts++;
                setTimeout(tryPlay, 100);
            } else {
                playAudio();
            }
        };
        window.speechSynthesis.addEventListener('voiceschanged', tryPlay, { once: true });
        tryPlay();
      } else {
        playAudio();
      }
    } catch (err) {
      console.error("Speech synthesis failed:", err);
    }
`;

code = code.substring(0, startIdx) + replacement + code.substring(realEndIdx);
fs.writeFileSync('src/components/GameView.tsx', code);
console.log("Successfully patched GameView.tsx");

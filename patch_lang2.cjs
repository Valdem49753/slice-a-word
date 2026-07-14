const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

code = code.replace(
  /const voices = window\.speechSynthesis\.getVoices\(\);\s*if \(voices\.length > 0\) \{\s*const shortLang = detectedLang\.split\('-'\)\[0\];\s*const localVoice = voices\.find\(v => \(v\.lang\.startsWith\(detectedLang\) \|\| v\.lang\.startsWith\(shortLang\)\) && v\.localService\);\s*const targetVoice = localVoice \|\| voices\.find\(v => v\.lang\.startsWith\(detectedLang\) \|\| v\.lang\.startsWith\(shortLang\)\);\s*if \(targetVoice\) \{\s*utterance\.voice = targetVoice;\s*\}\s*\}/,
  `const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && detectedLang) {
        const shortLang = detectedLang.split('-')[0];
        const localVoice = voices.find(v => (v.lang.startsWith(detectedLang) || v.lang.startsWith(shortLang)) && v.localService);
        const targetVoice = localVoice || voices.find(v => v.lang.startsWith(detectedLang) || v.lang.startsWith(shortLang));
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
      }`
);

fs.writeFileSync('src/components/GameView.tsx', code);

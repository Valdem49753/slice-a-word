const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldSpeak = `      if (voices.length > 0) {
        const targetVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.startsWith(utterance.lang.split('-')[0]));
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
      }`;

const newSpeak = `      if (voices.length > 0) {
        const localVoice = voices.find(v => (v.lang.startsWith(utterance.lang) || v.lang.startsWith(utterance.lang.split('-')[0])) && v.localService);
        const targetVoice = localVoice || voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.startsWith(utterance.lang.split('-')[0]));
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
      }`;

code = code.replace(oldSpeak, newSpeak);
fs.writeFileSync('src/components/GameView.tsx', code);

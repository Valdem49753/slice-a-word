const fs = require('fs');
const content = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldCode = `    setOriginalPrompt(prompt);
    if (mode.startsWith('audio_')) {
      speak(prompt, promptLang); // speak original prompt without phonetic wrapper
    }`;

const newCode = `    setOriginalPrompt(prompt);
    // Always speak the prompt when it appears to help memorization
    speak(prompt, promptLang);`;

const newContent = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/GameView.tsx', newContent);

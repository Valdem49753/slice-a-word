const fs = require('fs');
const content = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldCode = `    const formattedPrompt = formatDisplay(prompt, promptLang, displayType);
    setCurrentPrompt(formattedPrompt);
    setOriginalPrompt(prompt);
    if (mode.startsWith('audio_')) {
      speak(prompt, promptLang); // speak original prompt without phonetic wrapper
    }`;

const newCode = `    const formattedPrompt = formatDisplay(prompt, promptLang, displayType);
    setCurrentPrompt(formattedPrompt);
    setOriginalPrompt(prompt);
    // Always speak the prompt (whether native or target) as soon as it appears
    speak(prompt, promptLang);`;

const newContent = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/GameView.tsx', newContent);

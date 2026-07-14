const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldHandleSlice = `  const handleSlice = (item: DistractorState) => {
    if (gameOver || loadingTurn || slicedIds.current.has(item.id)) return;
    slicedIds.current.add(item.id);
    
    playSliceSound();`;

const newHandleSlice = `  const handleSlice = (item: DistractorState) => {
    if (gameOver || loadingTurn || slicedIds.current.has(item.id)) return;
    slicedIds.current.add(item.id);
    
    playSliceSound();
    
    // Keep speech synthesis context active for Safari
    if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
    }`;

code = code.replace(oldHandleSlice, newHandleSlice);
fs.writeFileSync('src/components/GameView.tsx', code);

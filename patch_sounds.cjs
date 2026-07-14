const fs = require('fs');
let code = fs.readFileSync('src/utils/audio.ts', 'utf8');

code = code.replace(
  /const SOUND_FILES = \['\/slice\.mp3', '\/slice2\.mp3', '\/slice3\.mp3'\];/,
  `const SOUND_FILES = [
  '/slice.mp3',
  '/bamboo-swipe-1.mp3',
  '/blade-cherry-blossom-1-1.mp3',
  '/blade-dragon-swipe-1.mp3',
  '/blade-dragon-swipe-5.mp3',
  '/blade-rainbow-1.mp3',
  '/blade-rainbow-5.mp3'
];`
);

fs.writeFileSync('src/utils/audio.ts', code);

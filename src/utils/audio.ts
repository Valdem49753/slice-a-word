let audioCtx: AudioContext | null = null;
let sliceBuffers: AudioBuffer[] = [];
let isInitialized = false;

// Укажите здесь пути к вашим звукам в папке public
const SOUND_FILES = [
  '/slice.mp3',
  '/bamboo-swipe-1.mp3',
  '/blade-cherry-blossom-1-1.mp3',
  '/blade-dragon-swipe-1.mp3',
  '/blade-dragon-swipe-5.mp3',
  '/blade-rainbow-1.mp3',
  '/blade-rainbow-5.mp3'
];

export const initAudio = async () => {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && !audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx?.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    // Load all slice sounds
    if (audioCtx) {
      SOUND_FILES.forEach(soundPath => {
        fetch(soundPath)
          .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.arrayBuffer();
          })
          .then(buffer => audioCtx!.decodeAudioData(buffer))
          .then(decoded => {
              sliceBuffers.push(decoded);
              console.log(`Loaded ${soundPath}`);
          })
          .catch(e => {
            console.warn(`Could not load ${soundPath}`, e);
          });
      });
    }
  } catch (e) {
    console.error("Audio init failed", e);
  }
};

let lastPlayed = 0;
export const playSliceSound = () => {
  try {
    if (typeof window === 'undefined' || !audioCtx) return;
    
    const now = Date.now();
    if (now - lastPlayed < 50) return;
    lastPlayed = now;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    
    if (sliceBuffers.length > 0) {
      // Выбираем случайный звук из успешно загруженных
      const randomIndex = Math.floor(Math.random() * sliceBuffers.length);
      const sliceBuffer = sliceBuffers[randomIndex];

      const source = audioCtx.createBufferSource();
      source.buffer = sliceBuffer;
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.8;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start(0);
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

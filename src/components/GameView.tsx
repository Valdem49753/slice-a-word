import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { WordSet } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Volume2, Pause } from 'lucide-react';
import bgAsian from '../assets/images/bamboo_background_1783886905999.jpg';
import bgEuro from '../assets/images/euro_landscape_bg_1783887975984.jpg';
import bgWinter from '../assets/images/winter_forest_bg_1783887987754.jpg';
import confetti from 'canvas-confetti';
import { playSliceSound, initAudio } from '../utils/audio';
import PostGameDashboard from './PostGameDashboard';
import { formatDisplay } from '../utils/romanize';

interface DistractorState {
  id: string;
  text: string;
  isCorrect: boolean;
  x: number; // percentage 10-90
  delay: number;
  sliced?: boolean;
}

export default function GameView() {
  const { setId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'written_native_to_target';
  const difficulty = searchParams.get('difficulty') || 'easy';
  const speedParam = searchParams.get('speed') || 'normal';
  const progressiveParam = searchParams.get("progressive") !== "false";
  const displayType = searchParams.get("displayType") || "native";
  const navigate = useNavigate();
  const user = useStore(state => state.user);

  const [wordSet, setWordSet] = useState<WordSet | null>(null);
  const [words, setWords] = useState<WordSet['words']>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [lives, setLives] = useState(4);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [distractors, setDistractors] = useState<DistractorState[]>([]);
  const [loadingTurn, setLoadingTurn] = useState(false);
  const loadingTurnRef = useRef(false);
  const sessionStatsRef = useRef<Record<string, { seen: number; correct: number; native: string; target: string }>>({});
  const currentTurnFailedRef = useRef(false);
  
  useEffect(() => {
    loadingTurnRef.current = loadingTurn;
  }, [loadingTurn]);
  
  const initialDuration = speedParam === 'slow' ? 8 : speedParam === 'fast' ? 4 : 6;
  const [baseDuration, setBaseDuration] = useState(initialDuration); // seconds to fall
  const [hitEffect, setHitEffect] = useState(false);

  const isPointerDown = useRef(false);
  const distractorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const distractorsStateRef = useRef<DistractorState[]>([]);
  const slicedIds = useRef<Set<string>>(new Set());
  const [trail, setTrail] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    distractorsStateRef.current = distractors;
  }, [distractors]);

  useEffect(() => {
    const fetchSet = async () => {

      if (!setId) return;
      try {
        const docRef = doc(db, 'wordSets', setId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as WordSet;
          data.id = docSnap.id;
          setWordSet(data);
          // Shuffle words for the game
          const shuffled = [...data.words].sort(() => Math.random() - 0.5);
          setWords(shuffled);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSet();
  }, [setId]);

  useEffect(() => {
    if (hasStarted && words.length > 0 && currentIndex < words.length && !gameOver) {
      loadTurn(currentIndex);
    } else if (hasStarted && words.length > 0 && currentIndex >= words.length && !gameOver) {
      handleGameOver();
    }
  }, [hasStarted, words, currentIndex, gameOver]);

  const loadTurn = async (index: number) => {
    if (!wordSet) return;
    setLoadingTurn(true);
    const currentWord = words[index];
    
    const key = `${currentWord.native}|${currentWord.target}`;
    if (!sessionStatsRef.current[key]) {
      sessionStatsRef.current[key] = { seen: 0, correct: 0, native: currentWord.native, target: currentWord.target };
    }
    sessionStatsRef.current[key].seen += 1;
    currentTurnFailedRef.current = false;
    
    // Determine prompt and target language
    let prompt = '';
    let targetText = '';
    let promptLang = '';
    let targetLang = '';
    
    if (mode === 'written_native_to_target' || mode === 'audio_native_to_target') {
      prompt = currentWord.native;
      targetText = currentWord.target;
      promptLang = wordSet.nativeLang;
      targetLang = wordSet.targetLang;
    } else {
      prompt = currentWord.target;
      targetText = currentWord.native;
      promptLang = wordSet.targetLang;
      targetLang = wordSet.nativeLang;
    }

    const formattedPrompt = formatDisplay(prompt, promptLang, displayType);
    setCurrentPrompt(formattedPrompt);
    setOriginalPrompt(prompt);

    speak(prompt, promptLang);

    // Generate Distractors
    let generatedDistractors: string[] = [];
    if (difficulty === 'hard') {
      try {
        const res = await fetch('/api/generate-distractors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetWord: targetText,
            nativeWord: mode.includes('native_to_target') ? currentWord.native : currentWord.target,
            nativeLang: mode.includes('native_to_target') ? wordSet.nativeLang : wordSet.targetLang,
            targetLang: mode.includes('native_to_target') ? wordSet.targetLang : wordSet.nativeLang,
            difficulty: 'hard'
          })
        });
        generatedDistractors = await res.json();
      } catch (e) {
        console.error(e);
      }
    } 

    if (generatedDistractors.length < 3) {
      // Fallback or Easy mode: pick random from set
      const others = words.filter(w => w !== currentWord);
      const shuffledOthers = others.sort(() => Math.random() - 0.5);
      generatedDistractors = shuffledOthers.slice(0, 3).map(w => 
        mode.includes('native_to_target') ? w.target : w.native
      );
    }

    // Mix and assign positions
    const allOptions = [
      { id: `turn_${index}_correct`, text: formatDisplay(targetText, targetLang, displayType), isCorrect: true, x: 20, delay: 0 },
      ...generatedDistractors.slice(0,3).map((d, i) => ({ id: `turn_${index}_dist_${i}`, text: formatDisplay(d, targetLang, displayType), isCorrect: false, x: 0, delay: 0 }))
    ];

    // Shuffle options
    const shuffled = allOptions.sort(() => Math.random() - 0.5);

    // Assign fixed grid positions to avoid overlaps
    const shuffledOptions = shuffled.map((opt, idx) => {
      const isLeft = idx % 2 === 0;
      return {
        ...opt,
        x: isLeft ? 10 : 55, // Fixed % to prevent horizontal overlap
        delay: idx * 0.55 // Adjusted stagger to make cards closer but not overlapping
      };
    });

    slicedIds.current.clear();
    setDistractors(shuffledOptions);
    setLoadingTurn(false);
  };

  const speak = (text: string, langName: string) => {
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
        
        if (/english|англ|eng\b|en\b|us\b|uk\b/i.test(l)) detectedLang = 'en-US';
        else if (/russian|рус|ru\b|cyrillic/i.test(l)) detectedLang = 'ru-RU';
        else if (/spanish|исп|es\b|span\b/i.test(l)) detectedLang = 'es-ES';
        else if (/chinese|кит|mandarin|zh\b|cn\b/i.test(l)) detectedLang = 'zh-CN';
        else if (/korean|кор|ko\b|kr\b/i.test(l)) detectedLang = 'ko-KR';
        else if (/japanese|яп|ja\b|jp\b/i.test(l)) detectedLang = 'ja-JP';
        else if (/french|франц|fr\b|fre\b/i.test(l)) detectedLang = 'fr-FR';
        else if (/german|нем|de\b|ger\b/i.test(l)) detectedLang = 'de-DE';
        else if (/italian|итал|it\b|ita\b/i.test(l)) detectedLang = 'it-IT';
        else if (/portuguese|португ|pt\b|por\b/i.test(l)) detectedLang = 'pt-BR';
        else if (/dutch|нидерл|голланд|nl\b/i.test(l)) detectedLang = 'nl-NL';
        else if (/polish|пол|pl\b|pol\b/i.test(l)) detectedLang = 'pl-PL';
        else if (/turkish|тур|tr\b|tur\b/i.test(l)) detectedLang = 'tr-TR';
        
        // Auto-detect based on text content as the absolute source of truth
        const cyrillicCount = (text.match(/[а-яА-ЯЁё]/g) || []).length;
        const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
        const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const koreanCount = (text.match(/[\uac00-\ud7af|\u1100-\u11ff|\u3130-\u318f]/g) || []).length;
        const japaneseCount = (text.match(/[\u3040-\u309f|\u30a0-\u30ff]/g) || []).length;
        
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
};

  const handleGameOver = async () => {
    setGameOver(true);
    setDistractors([]);
    if (!user || !wordSet) return;

    try {
      await addDoc(collection(db, 'gameResults'), {
        userId: user.uid,
        wordSetId: wordSet.id,
        score,
        maxScore: words.length,
        difficulty,
        mode,
        createdAt: Date.now(),
        wordStats: sessionStatsRef.current
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (lives <= 0 && !gameOver) {
      handleGameOver();
    }
  }, [lives, gameOver]);

  const handleSlice = (item: DistractorState) => {
    if (gameOver || loadingTurn || slicedIds.current.has(item.id)) return;
    slicedIds.current.add(item.id);
    
    playSliceSound();
    
    

    // Mark as sliced immediately to trigger animation
    setDistractors(prev => prev.map(d => d.id === item.id ? { ...d, sliced: true } : d));

    if (item.isCorrect) {
      if (!currentTurnFailedRef.current) {
        const currentWord = words[currentIndex];
        const key = `${currentWord.native}|${currentWord.target}`;
        if (sessionStatsRef.current[key]) {
          sessionStatsRef.current[key].correct += 1;
        }
      }
      // Success
      setScore(s => s + 1);
      try { confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
      } catch (e) { console.error("Confetti error", e); }
      // Progress difficulty by reducing fall time
      if (progressiveParam) {
        setBaseDuration(prev => Math.max(2, prev * 0.95)); 
      }
      
      setLoadingTurn(true);
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
      }, 1000); // 1000ms delay to let the slice animation play
    } else {
      currentTurnFailedRef.current = true;
      // Wrong
      setHitEffect(true);
      setTimeout(() => setHitEffect(false), 300);
      setLives(l => l - 1);
      
      setLoadingTurn(true);
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
      }, 1000);
    }
  };

  const handleAnimationComplete = (item: DistractorState) => {
    if (gameOver || loadingTurn || loadingTurnRef.current || slicedIds.current.has(item.id)) return;
    
    // If the item is no longer in the state, it was already sliced/removed.
    if (!distractorsStateRef.current.find(d => d.id === item.id)) return;

    // If the correct item fell to the bottom
    if (item.isCorrect) {
      setHitEffect(true);
      setTimeout(() => setHitEffect(false), 300);
      setLives(l => l - 1);
      
      setLoadingTurn(true);
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
      }, 800);
    }
  };

  const handleMove = useCallback((e: any) => {
    if (!isPointerDown.current) return;
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e && (e as any).touches.length > 0) {
      clientX = (e as any).touches[0].clientX;
      clientY = (e as any).touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as any).clientX;
      clientY = (e as any).clientY;
    } else {
      return;
    }

    setTrail(prev => [...prev.slice(-15), { x: clientX, y: clientY }]);

    Object.entries(distractorRefs.current).forEach(([id, el]) => {
      if (el) {
        const rect = (el as HTMLDivElement).getBoundingClientRect();
        // Add some padding to make slicing easier
        if (clientX >= rect.left - 20 && clientX <= rect.right + 20 &&
            clientY >= rect.top - 20 && clientY <= rect.bottom + 20) {
          const item = distractors.find(d => d.id === id);
          if (item) {
            handleSlice(item);
          }
        }
      }
    });
  }, [distractors, gameOver, loadingTurn]);

  useEffect(() => {
    const up = () => { 
      isPointerDown.current = false; 
      setTrail([]);
    };
    const down = (e: any) => {
    if (initAudio) initAudio(); 
      isPointerDown.current = true; 
      // Initialize trail at pointer down position
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      setTrail([{ x: clientX, y: clientY }]);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointerdown', down);
    window.addEventListener('touchend', up);
    window.addEventListener('touchstart', down);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchstart', down);
    };
  }, []);

  if (!wordSet) return <div className="p-8 text-center">Loading...</div>;

  if (gameOver && wordSet) {
    return (
      <PostGameDashboard 
        wordSetId={wordSet.id}
        targetLang={wordSet.targetLang}
        sessionStats={sessionStatsRef.current}
        score={score}
        maxScore={words.length}
        onPlayAgain={() => window.location.reload()}
      />
    );
  }

  const getBackgroundImage = (lang: string) => {
    if (!lang) return bgEuro;
    const l = lang.toLowerCase();
    if (l.includes('zh') || l.includes('ja') || l.includes('ko') || l.includes('chinese') || l.includes('japanese') || l.includes('korean')) {
      return bgAsian;
    }
    if (l.includes('ru') || l.includes('russian') || l.includes('sv') || l.includes('no') || l.includes('fi')) {
      return bgWinter;
    }
    return bgEuro;
  };
  const currentBgImage = wordSet ? getBackgroundImage(wordSet.targetLang) : bgEuro;

  return (
    <div 
      className="fixed inset-0 overflow-hidden touch-none z-[100]" 
      style={{ userSelect: 'none', backgroundImage: `url(${currentBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      onPointerMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Damage Overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-200 z-30 ${hitEffect ? 'bg-red-500/40' : 'bg-transparent'}`} />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-3 pt-5 flex justify-between items-start z-50 pointer-events-none">
        {/* Pause Button */}
        <button
          onClick={() => navigate('/')}
          className="bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white p-2 rounded-xl pointer-events-auto shadow-sm"
        >
          <Pause className="w-5 h-5 fill-white text-white" />
        </button>

        {/* Center: Combo & Hearts */}
        <div className="flex flex-col items-center gap-1.5">
           <div className="bg-[#b3c78f] border-b-4 border-[#9db375] px-4 py-1.5 rounded-xl flex flex-col items-center shadow-md">
             <span className="text-amber-700 text-2xl font-black" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>{score}</span>
             <span className="text-white text-[8px] font-bold tracking-widest mt-0.5">COMBO</span>
           </div>
           <div className="flex gap-1 mt-0.5">
             {Array.from({ length: 4 }).map((_, i) => (
               <Heart key={i} className={`w-4 h-4 ${i < lives ? 'fill-red-500 text-red-500' : 'text-gray-500 opacity-50'}`} />
             ))}
           </div>
        </div>

        {/* Right: Best */}
        <div className="bg-[#b3c78f] border-b-4 border-[#9db375] px-3 py-1.5 rounded-xl flex flex-col items-center shadow-md opacity-80">
          <span className="text-white text-xl font-black">0</span>
          <span className="text-white text-[8px] font-bold tracking-widest mt-0.5">BEST</span>
        </div>
      </div>

      {/* Prompt Area (Bottom Triangle) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] max-w-[800px] min-h-[9rem] pointer-events-auto flex items-end justify-center pb-4 pt-10 px-10 z-40"
           style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: '#e8cd12' }}>
        <motion.div 
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center max-w-[60vw] md:max-w-md mx-auto"
        >
          {mode.startsWith('audio_') ? (
            <button onClick={() => speak(originalPrompt, mode.includes('native_to_target') ? wordSet.nativeLang : wordSet.targetLang)} className="flex items-center gap-2 text-2xl font-bold text-amber-900 hover:text-amber-700 transition-colors">
              <Volume2 size={28} /> Listen
            </button>
          ) : (
            <h2 className={`font-bold text-amber-900 whitespace-pre-wrap text-balance ${currentPrompt.length > 40 ? 'text-base md:text-lg' : currentPrompt.length > 20 ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>{currentPrompt}</h2>
          )}
        </motion.div>
      </div>

      {/* Start Overlay */}
      {!hasStarted && words.length > 0 && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[100] backdrop-blur-sm pointer-events-auto">
          <button 
            onClick={() => {
              if (window.speechSynthesis) {
                const u = new SpeechSynthesisUtterance(' ');
                u.volume = 0.01;
                window.speechSynthesis.speak(u);
              }
              setHasStarted(true);
            }}
            className="px-10 py-6 bg-[#16a34a] text-[#e8cd12] text-4xl font-black rounded-3xl shadow-[0_0_40px_rgba(15,77,49,0.5)] hover:scale-105 active:scale-95 transition-all"
          >
            TAP TO START
          </button>
        </div>
      )}

      {/* Game Area */}
      <div className="absolute inset-0 pt-48 pb-12 pointer-events-none">
        {/* Slicing Trail */}
        {trail.length > 1 && (
          <svg className="absolute inset-0 z-50 w-full h-full pointer-events-none">
            <polyline 
              points={trail.map(p => `${p.x},${p.y}`).join(' ')} 
              fill="none" 
              stroke="white" 
              strokeWidth="10" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="opacity-80"
              style={{ filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.8))' }}
            />
          </svg>
        )}

        <AnimatePresence>
          {distractors.map((item) => (
            <motion.div
              key={item.id}
              ref={(el) => distractorRefs.current[item.id] = el}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: '130vh', opacity: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
              transition={{ 
                duration: baseDuration, 
                delay: item.delay,
                ease: "linear"
              }}
              onAnimationComplete={() => handleAnimationComplete(item)}
              className="absolute pointer-events-auto"
              style={{ top: '-30vh', left: `${item.x}%`, width: '40vw', maxWidth: '180px', height: '65px' }}
              data-distractor-id={item.id}
              onClick={() => handleSlice(item)}
            >
              <div className="relative w-full h-full">
                {/* Full card (instant fade out on slice) */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#16a34a] border-y-2 border-[#15803d] rounded-sm shadow-md text-center flex flex-col justify-center items-center"
                  animate={{ opacity: item.sliced ? 0 : 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="absolute left-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-l-[4px]" />
                  <div className="absolute right-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-r-[4px]" />
                  <span 
                    className="font-black text-white  block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: (item.text?.length || 0) > 25 ? '0.75rem' : (item.text?.length || 0) > 15 ? '0.9rem' : '1.1rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>

                {/* Left Half */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#16a34a] border-y-2 border-[#15803d] rounded-sm shadow-md text-center flex flex-col justify-center items-center"
                  style={{ clipPath: 'polygon(0% 0%, 61% 0%, 41% 100%, 0% 100%)' }}
                  animate={item.sliced ? { x: -60, y: 80, rotate: -15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute left-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-l-[4px]" />
                  <span 
                    className="font-black text-white  block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: (item.text?.length || 0) > 25 ? '0.75rem' : (item.text?.length || 0) > 15 ? '0.9rem' : '1.1rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>

                {/* Right Half */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#16a34a] border-y-2 border-[#15803d] rounded-sm shadow-md text-center flex flex-col justify-center items-center"
                  style={{ clipPath: 'polygon(59% 0%, 100% 0%, 100% 100%, 39% 100%)' }}
                  animate={item.sliced ? { x: 60, y: 80, rotate: 15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute right-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-r-[4px]" />
                  <span 
                    className="font-black text-white  block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: (item.text?.length || 0) > 25 ? '0.75rem' : (item.text?.length || 0) > 15 ? '0.9rem' : '1.1rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

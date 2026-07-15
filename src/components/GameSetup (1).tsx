import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WordSet } from '../types';
import { Play, BarChart2, ArrowLeft, Volume2, Check } from "lucide-react";
import { initAudio } from "../utils/audio";
import WordSetStatsModal from "./WordSetStatsModal";
import { warmUpTTS, warmWordSet } from "../utils/tts";
import { langEmoji } from "../utils/lang";

interface TileProps {
  name: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  desc?: string;
  icon?: string;
  center?: boolean;
}

function Tile({ name, value, selected, onSelect, title, desc, icon, center }: TileProps) {
  return (
    <label className={`duo-tile ${selected ? 'selected' : ''} ${center ? 'text-center' : ''}`}>
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
      />
      <span className="duo-tile-title">
        {icon && <span className="mr-1.5" aria-hidden>{icon}</span>}
        {title}
      </span>
      {desc && <span className="duo-tile-desc">{desc}</span>}
    </label>
  );
}

export default function GameSetup() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [wordSet, setWordSet] = useState<WordSet | null>(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState('written_native_to_target');
  const [difficulty, setDifficulty] = useState('easy');
  const [speed, setSpeed] = useState('normal');
  const [progressive, setProgressive] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [displayType, setDisplayType] = useState('native');
  const [ttsWarm, setTtsWarm] = useState<{ total: number; ready: number; queued: number } | null>(null);

  useEffect(() => {
    const fetchSet = async () => {
      if (!setId) return;
      try {
        const docRef = doc(db, 'wordSets', setId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWordSet({ id: docSnap.id, ...docSnap.data() } as WordSet);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSet();
  }, [setId]);

  // Фоновый прогрев озвучки набора: сервер генерирует недостающие слова
  // в очереди (с соблюдением квоты) и кэширует их навсегда.
  useEffect(() => {
    if (!wordSet) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const s = await warmWordSet(wordSet);
      if (stopped) return;
      if (s) setTtsWarm(s);
      if (!s || s.queued > 0) timer = setTimeout(poll, 6000);
    };
    poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [wordSet]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center gap-3">
        <span className="text-4xl duo-bob">🍉</span>
        <span className="duo-label">Loading…</span>
      </div>
    );
  }
  if (!wordSet) return <div className="p-8 text-center font-extrabold text-[#ff4b4b]">Word set not found</div>;

  const handleStart = () => {
    warmUpTTS(); // bind the TTS engine one screen early, so voices are warm in GameView
    initAudio(); // preload slice sounds on a user gesture
    navigate(`/play/${setId}?mode=${mode}&difficulty=${difficulty}&speed=${speed}&progressive=${progressive}&displayType=${displayType}`);
  };

  const isChinese = /chinese|mandarin|китайский|китай/i.test(wordSet?.targetLang || '') || /chinese|mandarin|китайский|китай/i.test(wordSet?.nativeLang || '');
  const isKorean = /korean|корейский|корея/i.test(wordSet?.targetLang || '') || /korean|корейский|корея/i.test(wordSet?.nativeLang || '');
  const needsDisplayOption = isChinese || isKorean;

  const warmPercent = ttsWarm && ttsWarm.total > 0
    ? Math.round((ttsWarm.ready / ttsWarm.total) * 100)
    : 0;

  return (
    <div className="max-w-xl mx-auto p-5 sm:p-6 pb-12">
      <Link to="/" className="inline-flex items-center gap-1.5 duo-label hover:text-[#4b4b4b] transition-colors mb-4">
        <ArrowLeft size={15} strokeWidth={3} /> Back
      </Link>

      <div className="mb-5">
        <div className="text-3xl mb-2" aria-hidden>
          {langEmoji(wordSet.nativeLang)} <span className="text-[#afafaf] text-lg align-middle mx-0.5">→</span> {langEmoji(wordSet.targetLang)}
        </div>
        <h1 className="text-2xl font-black text-[#4b4b4b]">{wordSet.name}</h1>
        <p className="text-sm font-semibold text-[#afafaf]">
          {wordSet.nativeLang} → {wordSet.targetLang} · {wordSet.words.length} words
        </p>
      </div>

      {ttsWarm && ttsWarm.total > 0 && (
        <div className="duo-card p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className={`duo-label flex items-center gap-1.5 ${ttsWarm.queued === 0 ? 'text-[#58cc02]' : ''}`}>
              <Volume2 size={14} /> {ttsWarm.queued > 0 ? 'Preparing audio…' : 'Audio ready'}
            </span>
            <span className="text-xs font-extrabold text-[#777]">{ttsWarm.ready}/{ttsWarm.total}</span>
          </div>
          <div className="duo-progress">
            <div style={{ width: `${warmPercent}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-7">
        {needsDisplayOption && (
          <div>
            <h3 className="duo-label mb-2.5">Display mode</h3>
            <div className="space-y-2">
              {[
                { id: 'native', label: `Characters (${isChinese ? 'Hanzi' : 'Hangul'})`, desc: 'Show original characters' },
                { id: 'romanized', label: `Phonetic (${isChinese ? 'Pinyin' : 'Romanization'})`, desc: 'Show pronunciation only' },
                { id: 'both', label: 'Both', desc: 'Show characters and pronunciation' },
              ].map(d => (
                <Tile
                  key={d.id}
                  name="displayType"
                  value={d.id}
                  selected={displayType === d.id}
                  onSelect={() => setDisplayType(d.id)}
                  title={d.label}
                  desc={d.desc}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="duo-label mb-2.5">Game mode</h3>
          <div className="space-y-2">
            {[
              { id: 'written_native_to_target', icon: '📖', label: `Read ${wordSet.nativeLang}, find ${wordSet.targetLang}` },
              { id: 'written_target_to_native', icon: '📖', label: `Read ${wordSet.targetLang}, find ${wordSet.nativeLang}` },
              { id: 'audio_native_to_target', icon: '🎧', label: `Listen to ${wordSet.nativeLang}, find ${wordSet.targetLang}` },
              { id: 'audio_target_to_native', icon: '🎧', label: `Listen to ${wordSet.targetLang}, find ${wordSet.nativeLang}` },
            ].map(m => (
              <Tile
                key={m.id}
                name="mode"
                value={m.id}
                selected={mode === m.id}
                onSelect={() => setMode(m.id)}
                title={m.label}
                icon={m.icon}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="duo-label mb-2.5">Difficulty</h3>
          <div className="space-y-2">
            {[
              { id: 'easy', label: 'Beginner', desc: 'Random distractor words — easier to spot the correct answer.' },
              { id: 'hard', label: 'Advanced', desc: 'AI generates distractors with similar meanings to trick you.' },
            ].map(d => (
              <Tile
                key={d.id}
                name="difficulty"
                value={d.id}
                selected={difficulty === d.id}
                onSelect={() => setDifficulty(d.id)}
                title={d.label}
                desc={d.desc}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="duo-label mb-2.5">Speed</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'slow', label: 'Slow', icon: '🐢' },
              { id: 'normal', label: 'Normal', icon: '🍉' },
              { id: 'fast', label: 'Fast', icon: '⚡' },
            ].map(s => (
              <Tile
                key={s.id}
                name="speed"
                value={s.id}
                selected={speed === s.id}
                onSelect={() => setSpeed(s.id)}
                title={s.label}
                icon={s.icon}
                center
              />
            ))}
          </div>
        </div>

        <label className={`duo-tile ${progressive ? 'selected' : ''} flex items-start gap-3`}>
          <input
            type="checkbox"
            className="sr-only"
            checked={progressive}
            onChange={(e) => setProgressive(e.target.checked)}
          />
          <span
            aria-hidden
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
              progressive ? 'border-[#1cb0f6] bg-[#1cb0f6] text-white' : 'border-[#e5e5e5] bg-white text-transparent'
            }`}
          >
            <Check size={15} strokeWidth={4} />
          </span>
          <span>
            <span className="duo-tile-title">Progressive speed</span>
            <span className="duo-tile-desc">Speed increases slightly after each correct slice.</span>
          </span>
        </label>

        <div className="space-y-3 pt-1">
          <button onClick={handleStart} className="duo-btn duo-btn-green w-full py-4 text-base">
            <Play size={20} fill="currentColor" /> Start game
          </button>

          <button onClick={() => setShowStats(true)} className="duo-btn duo-btn-white w-full">
            <BarChart2 size={18} /> Word stats
          </button>
        </div>
      </div>

      {showStats && wordSet && (
        <WordSetStatsModal wordSetId={wordSet.id} targetLang={wordSet.targetLang} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
}

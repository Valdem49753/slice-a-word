import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WordSet } from '../types';
import { Play, BarChart2 } from "lucide-react";
import { initAudio } from "../utils/audio";
import WordSetStatsModal from "./WordSetStatsModal";
import { warmUpTTS } from "../utils/tts";

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!wordSet) return <div className="p-8 text-center text-red-500">Word set not found</div>;

  const handleStart = () => {
    warmUpTTS(); // bind the TTS engine one screen early, so voices are warm in GameView
    navigate(`/play/${setId}?mode=${mode}&difficulty=${difficulty}&speed=${speed}&progressive=${progressive}&displayType=${displayType}`);
  };

  const isChinese = /chinese|mandarin|китайский|китай/i.test(wordSet?.targetLang || '') || /chinese|mandarin|китайский|китай/i.test(wordSet?.nativeLang || '');
  const isKorean = /korean|корейский|корея/i.test(wordSet?.targetLang || '') || /korean|корейский|корея/i.test(wordSet?.nativeLang || '');
  const needsDisplayOption = isChinese || isKorean;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Play: {wordSet.name}</h1>
      <p className="text-gray-600 mb-8">{wordSet.nativeLang} &bull; {wordSet.targetLang} &bull; {wordSet.words.length} words</p>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 space-y-6">
        {needsDisplayOption && (
          <div>
            <h3 className="text-base font-bold mb-3">Display Mode</h3>
            <div className="space-y-2">
              {[
                { id: 'native', label: `Characters (${isChinese ? 'Hanzi' : 'Hangul'})`, desc: 'Show original characters' },
                { id: 'romanized', label: `Phonetic (${isChinese ? 'Pinyin' : 'Romanization'})`, desc: 'Show pronunciation only' },
                { id: 'both', label: 'Both', desc: 'Show characters and pronunciation' },
              ].map(d => (
                <label key={d.id} className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${displayType === d.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center">
                    <input type="radio" name="displayType" value={d.id} checked={displayType === d.id} onChange={(e) => setDisplayType(e.target.value)} className="mr-3 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-gray-800">{d.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-7 mt-1">{d.desc}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-base font-bold mb-3">Game Mode</h3>
          <div className="space-y-2">
            {[
              { id: 'written_native_to_target', label: `Read ${wordSet.nativeLang}, Find ${wordSet.targetLang}` },
              { id: 'written_target_to_native', label: `Read ${wordSet.targetLang}, Find ${wordSet.nativeLang}` },
              { id: 'audio_native_to_target', label: `Listen to ${wordSet.nativeLang}, Find ${wordSet.targetLang}` },
              { id: 'audio_target_to_native', label: `Listen to ${wordSet.targetLang}, Find ${wordSet.nativeLang}` },
            ].map(m => (
              <label key={m.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${mode === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={(e) => setMode(e.target.value)} className="mr-3 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-gray-800">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold mb-3">Difficulty</h3>
          <div className="space-y-2">
            {[
              { id: 'easy', label: 'Beginner (Random distractor words)', desc: 'Easier to spot the correct answer.' },
              { id: 'hard', label: 'Advanced (Similar distractors)', desc: 'AI generates distractors with similar meanings to trick you.' },
            ].map(d => (
              <label key={d.id} className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${difficulty === d.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center">
                  <input type="radio" name="difficulty" value={d.id} checked={difficulty === d.id} onChange={(e) => setDifficulty(e.target.value)} className="mr-3 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm font-medium text-gray-800">{d.label}</span>
                </div>
                <span className="text-xs text-gray-500 ml-7 mt-1">{d.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold mb-3">Speed</h3>
          <div className="space-y-2">
            {[
              { id: 'slow', label: 'Slow', desc: 'More time to read and react.' },
              { id: 'normal', label: 'Normal', desc: 'Standard falling speed.' },
              { id: 'fast', label: 'Fast', desc: 'Test your reflexes!' },
            ].map(s => (
              <label key={s.id} className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${speed === s.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center">
                  <input type="radio" name="speed" value={s.id} checked={speed === s.id} onChange={(e) => setSpeed(e.target.value)} className="mr-3 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm font-medium text-gray-800">{s.label}</span>
                </div>
                <span className="text-xs text-gray-500 ml-7 mt-1">{s.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-start p-3 border rounded-lg cursor-pointer transition-colors border-emerald-500 bg-emerald-50">
            <input type="checkbox" checked={progressive} onChange={(e) => setProgressive(e.target.checked)} className="mr-3 mt-1 text-emerald-600 focus:ring-emerald-500 rounded" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">Progressive Speed</span>
              <span className="text-xs text-gray-500 mt-1">Speed increases slightly after each correct slice.</span>
            </div>
          </label>
        </div>

        <button 
          onClick={handleStart}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-base flex justify-center items-center gap-2 shadow-md transition-colors"
        >
          <Play fill="currentColor" /> Start Game
        </button>

        <button 
          onClick={() => setShowStats(true)}
          className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-3 rounded-xl font-bold text-base flex justify-center items-center gap-2 transition-colors mt-4"
        >
          <BarChart2 size={20} /> Word Stats Dashboard
        </button>
      </div>

      {showStats && wordSet && (
        <WordSetStatsModal wordSetId={wordSet.id} targetLang={wordSet.targetLang} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
}

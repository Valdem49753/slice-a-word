import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { WordSet, GameResult } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Play, BarChart2 } from 'lucide-react';
import { langEmoji } from '../utils/lang';

export default function Dashboard() {
  const user = useStore((state) => state.user);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const qSets = query(collection(db, 'wordSets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const snapSets = await getDocs(qSets);
        const setsData = snapSets.docs.map(doc => ({ id: doc.id, ...doc.data() }) as WordSet);
        setWordSets(setsData);

        const qResults = query(collection(db, 'gameResults'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const snapResults = await getDocs(qResults);
        const resultsData = snapResults.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GameResult);
        setResults(resultsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center gap-3">
        <span className="text-4xl duo-bob">🍉</span>
        <span className="duo-label">Loading…</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5 sm:p-6 space-y-10">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-[#4b4b4b]">Your word sets</h1>
        <Link to="/add-set" className="duo-btn duo-btn-blue px-4 py-2.5 text-sm shrink-0">
          <Plus size={18} strokeWidth={3} /> New set
        </Link>
      </div>

      {wordSets.length === 0 ? (
        <div className="duo-card text-center py-14 px-6">
          <div className="flex justify-center gap-3 text-5xl mb-5" aria-hidden>
            <span className="duo-bob">🍉</span>
            <span className="duo-bob" style={{ animationDelay: '0.3s' }}>🍊</span>
            <span className="duo-bob" style={{ animationDelay: '0.6s' }}>🥝</span>
          </div>
          <p className="text-lg font-extrabold text-[#4b4b4b] mb-1">No word sets yet</p>
          <p className="text-sm font-semibold text-[#777] mb-6">Paste a vocabulary list and start slicing.</p>
          <Link to="/add-set" className="duo-btn duo-btn-green px-6">
            <Plus size={18} strokeWidth={3} /> Create your first set
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wordSets.map(set => (
            <div key={set.id} className="duo-card p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="text-2xl leading-none mb-2" aria-hidden>
                    {langEmoji(set.nativeLang)} <span className="text-[#afafaf] text-base align-middle mx-0.5">→</span> {langEmoji(set.targetLang)}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#4b4b4b] truncate">{set.name}</h3>
                  <p className="text-sm font-semibold text-[#afafaf]">{set.nativeLang} → {set.targetLang}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#fff4d6] text-[#c9a109] text-[11px] font-extrabold tracking-wide px-3 py-1.5 uppercase">
                  {set.words.length} words
                </span>
              </div>
              <Link to={`/setup/${set.id}`} className="duo-btn duo-btn-green w-full mt-auto">
                <Play size={18} fill="currentColor" /> Play
              </Link>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-[#4b4b4b] mb-4 flex items-center gap-2">
            <BarChart2 className="text-[#1cb0f6]" /> Recent activity
          </h2>
          <div className="duo-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-[#e5e5e5]">
                    <th className="p-4 duo-label">Date</th>
                    <th className="p-4 duo-label">Set</th>
                    <th className="p-4 duo-label">Mode</th>
                    <th className="p-4 duo-label">Difficulty</th>
                    <th className="p-4 duo-label text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {results.slice(0, 10).map(res => {
                    const setName = wordSets.find(ws => ws.id === res.wordSetId)?.name || 'Unknown Set';
                    return (
                      <tr key={res.id} className="hover:bg-[#f7f7f7]">
                        <td className="p-4 text-sm font-semibold text-[#777]">{new Date(res.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-sm font-extrabold text-[#4b4b4b]">{setName}</td>
                        <td className="p-4 text-sm font-semibold text-[#777]">{res.mode.replace(/_/g, ' ')}</td>
                        <td className="p-4 text-sm font-semibold text-[#777] capitalize">{res.difficulty}</td>
                        <td className="p-4 text-right font-extrabold text-[#58cc02]">{res.score} / {res.maxScore}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { GameResult } from '../types';
import { BarChart2, RotateCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDisplay } from '../utils/romanize';

interface PostGameDashboardProps {
  wordSetId: string;
  targetLang: string;
  sessionStats: Record<string, { seen: number; correct: number; native: string; target: string }>;
  score: number;
  maxScore: number;
  onPlayAgain: () => void;
}

export default function PostGameDashboard({ wordSetId, targetLang, sessionStats, score, maxScore, onPlayAgain }: PostGameDashboardProps) {
  const user = useStore((state) => state.user);
  const navigate = useNavigate();
  const [historicalStats, setHistoricalStats] = useState<Record<string, { seen: number; correct: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const qResults = query(collection(db, 'gameResults'), where('userId', '==', user.uid), where('wordSetId', '==', wordSetId));
        const snap = await getDocs(qResults);
        const results = snap.docs.map(doc => doc.data() as GameResult);
        
        const stats: Record<string, { seen: number; correct: number }> = {};
        
        results.forEach(res => {
          if (res.wordStats) {
            Object.entries(res.wordStats).forEach(([key, stat]) => {
              if (!stats[key]) stats[key] = { seen: 0, correct: 0 };
              stats[key].seen += stat.seen;
              stats[key].correct += stat.correct;
            });
          }
        });
        
        setHistoricalStats(stats);
      } catch (e) {
        console.error("Error fetching history", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [user, wordSetId]);

  const sessionWords = Object.entries(sessionStats).filter(([_, stat]) => stat.seen > 0);

  return (
    <div className="fixed inset-0 bg-emerald-900 z-[100] overflow-y-auto p-4 sm:p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-10 my-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍉</div>
          <h2 className="text-4xl font-black text-emerald-900 mb-2">Game Over!</h2>
          <p className="text-xl text-emerald-700 font-medium">
            You sliced <span className="font-bold text-3xl text-emerald-500 mx-1">{score}</span> out of {maxScore}
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <BarChart2 className="text-emerald-600" /> Word Statistics
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-emerald-600 font-medium animate-pulse">Loading stats...</div>
          ) : sessionWords.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {sessionWords.map(([key, stat]) => {
                const hist = historicalStats[key] || { seen: stat.seen, correct: stat.correct };
                const percentage = hist.seen > 0 ? Math.round((hist.correct / hist.seen) * 100) : 0;
                
                return (
                  <div key={key} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all ${stat.correct > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="font-bold text-lg text-gray-900 whitespace-pre-wrap">
                        {formatDisplay(stat.target, targetLang, 'both')}
                      </div>
                      <div className={`font-black text-lg ${percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {percentage}%
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">{stat.native}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Historical: {hist.correct} correct out of {hist.seen} times seen
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
              No words were encountered in this session.
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={onPlayAgain}
            className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw /> Play Again
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex-1 flex justify-center items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-6 py-4 rounded-xl font-bold text-lg transition-all active:scale-95"
          >
            <Home /> Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

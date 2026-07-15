import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { GameResult } from '../types';
import { BarChart2, X } from 'lucide-react';
import { formatDisplay } from '../utils/romanize';

interface WordSetStatsModalProps {
  wordSetId: string;
  targetLang: string;
  onClose: () => void;
}

export default function WordSetStatsModal({ wordSetId, targetLang, onClose }: WordSetStatsModalProps) {
  const user = useStore((state) => state.user);
  const [historicalStats, setHistoricalStats] = useState<Record<string, { seen: number; correct: number; target: string; native: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const qResults = query(collection(db, 'gameResults'), where('userId', '==', user.uid), where('wordSetId', '==', wordSetId));
        const snap = await getDocs(qResults);
        const results = snap.docs.map(doc => doc.data() as GameResult);
        
        const stats: Record<string, { seen: number; correct: number; target: string; native: string }> = {};
        
        results.forEach(res => {
          if (res.wordStats) {
            Object.entries(res.wordStats).forEach(([key, stat]) => {
              if (!stats[key]) stats[key] = { seen: 0, correct: 0, target: stat.target, native: stat.native };
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

  const words = (Object.entries(historicalStats) as [string, {seen: number, correct: number, target: string, native: string}][]).sort((a, b) => b[1].seen - a[1].seen);

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto p-4 sm:p-8 flex justify-center items-center backdrop-blur-sm">
      <div className="max-w-3xl w-full bg-white rounded-3xl border-2 border-[#e5e5e5] shadow-2xl p-6 sm:p-10 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors">
          <X size={24} />
        </button>

        <div className="mb-8">
          <h3 className="text-2xl font-black text-[#4b4b4b] mb-4 flex items-center gap-2">
            <BarChart2 className="text-[#1cb0f6]" /> Historical Word Stats
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-[#1cb0f6] font-bold animate-pulse">Loading stats...</div>
          ) : words.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto p-1">
              {words.map(([key, stat]) => {
                const percentage = stat.seen > 0 ? Math.round((stat.correct / stat.seen) * 100) : 0;
                
                return (
                  <div key={key} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all ${percentage >= 80 ? 'bg-emerald-50 border-emerald-200' : percentage >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
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
                      {stat.correct} correct out of {stat.seen} times seen
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
              No stats recorded for this set yet. Play a game to see stats!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

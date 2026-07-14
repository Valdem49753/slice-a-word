import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { WordSet, GameResult } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Play, BarChart2 } from 'lucide-react';

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
    return <div className="p-8 flex justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Your Word Sets</h1>
        <Link to="/add-set" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={20} /> New Set
        </Link>
      </div>

      {wordSets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-emerald-100">
          <p className="text-emerald-800 mb-4">You don't have any word sets yet.</p>
          <Link to="/add-set" className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:underline">
            Create your first set <Plus size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wordSets.map(set => (
            <div key={set.id} className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{set.name}</h3>
                  <p className="text-sm text-gray-500">{set.nativeLang} &rarr; {set.targetLang} &bull; {set.words.length} words</p>
                </div>
              </div>
              <div className="mt-auto pt-4 flex gap-2">
                <Link to={`/setup/${set.id}`} className="flex-1 flex justify-center items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-2 rounded-lg font-medium transition-colors">
                  <Play size={18} /> Play
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart2 className="text-emerald-600" /> Recent Activity
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="p-4 font-medium text-emerald-800">Date</th>
                  <th className="p-4 font-medium text-emerald-800">Set</th>
                  <th className="p-4 font-medium text-emerald-800">Mode</th>
                  <th className="p-4 font-medium text-emerald-800">Difficulty</th>
                  <th className="p-4 font-medium text-emerald-800 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {results.slice(0, 10).map(res => {
                  const setName = wordSets.find(ws => ws.id === res.wordSetId)?.name || 'Unknown Set';
                  return (
                    <tr key={res.id} className="hover:bg-emerald-50/50">
                      <td className="p-4 text-gray-600">{new Date(res.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-medium">{setName}</td>
                      <td className="p-4 text-gray-600">{res.mode.replace(/_/g, ' ')}</td>
                      <td className="p-4 text-gray-600 capitalize">{res.difficulty}</td>
                      <td className="p-4 text-right font-bold text-emerald-600">{res.score} / {res.maxScore}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

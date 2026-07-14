import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { Loader2 } from 'lucide-react';

export default function AddWordSet() {
  const user = useStore(state => state.user);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nativeLang, setNativeLang] = useState('Russian');
  const [targetLang, setTargetLang] = useState('English');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    if (!name || !text || !nativeLang || !targetLang) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/parse-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, nativeLang, targetLang })
      });

      if (!res.ok) throw new Error('Failed to parse words');
      
      const words = await res.json();
      
      if (!Array.isArray(words) || words.length === 0) {
        throw new Error('No words could be parsed. Try formatting it differently.');
      }

      await addDoc(collection(db, 'wordSets'), {
        userId: user.uid,
        name,
        nativeLang,
        targetLang,
        words,
        createdAt: Date.now()
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Word Set</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Set Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="e.g. Travel Vocabulary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Native Language</label>
            <input 
              type="text" 
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
            <input 
              type="text" 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Words (Paste text here)</label>
          <p className="text-xs text-gray-500 mb-2">Just paste your list of words and translations. Our AI will automatically parse them.</p>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
            placeholder={`apple - яблоко\nbanana - банан`}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Parse & Save'}
        </button>
      </form>
    </div>
  );
}

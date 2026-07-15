import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore } from '../store';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto p-5 sm:p-6">
      <Link to="/" className="inline-flex items-center gap-1.5 duo-label hover:text-[#4b4b4b] transition-colors mb-4">
        <ArrowLeft size={15} strokeWidth={3} /> Back
      </Link>

      <h1 className="text-2xl font-black text-[#4b4b4b] mb-1">Create a new word set</h1>
      <p className="text-sm font-semibold text-[#777] mb-6">Paste any list — AI will sort the pairs out for you.</p>

      <form onSubmit={handleSubmit} className="duo-card p-5 sm:p-6 space-y-5">
        {error && (
          <div className="bg-[#ffdfe0] text-[#ea2b2b] p-3.5 rounded-xl text-sm font-extrabold">
            {error}
          </div>
        )}

        <div>
          <label className="duo-label block mb-1.5">Set name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="duo-input"
            placeholder="e.g. Travel Vocabulary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="duo-label block mb-1.5">Native language</label>
            <input
              type="text"
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="duo-input"
            />
          </div>
          <div>
            <label className="duo-label block mb-1.5">Target language</label>
            <input
              type="text"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="duo-input"
            />
          </div>
        </div>

        <div>
          <label className="duo-label block mb-1.5">Words</label>
          <p className="text-xs font-semibold text-[#afafaf] mb-2 flex items-center gap-1">
            <Sparkles size={13} /> Paste words with translations in any format — AI parses them automatically.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="duo-input font-mono text-sm resize-y"
            placeholder={`apple - яблоко\nbanana - банан`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="duo-btn duo-btn-green w-full py-4"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Parse & save'}
        </button>
      </form>
    </div>
  );
}

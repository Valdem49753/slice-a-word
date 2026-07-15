/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

import { auth, googleProvider } from './firebase';
import { useStore } from './store';
import Dashboard from './components/Dashboard';
import AddWordSet from './components/AddWordSet';
import GameSetup from './components/GameSetup';
import GameView from './components/GameView';
import { LogOut } from 'lucide-react';

function TopBar() {
  const user = useStore(state => state.user);
  if (!user) return null;
  return (
    <div className="bg-white border-b-2 border-[#e5e5e5] px-5 py-3 flex justify-between items-center z-50 relative">
      <div className="font-black text-xl text-[#58cc02] tracking-tight flex items-center gap-2">
        <span className="text-2xl">🍉</span> Slice-A-Word
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-sm text-[#777] font-bold">{user.displayName || user.email}</span>
        <button
          onClick={() => auth.signOut()}
          className="text-[#afafaf] hover:text-[#ff4b4b] transition-colors"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}

function AuthWrapper({ children }: { children: ReactNode }) {
  const user = useStore((state) => state.user);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <span className="text-5xl duo-bob">🍉</span>
        <span className="duo-label">Loading…</span>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#58cc02] px-6 text-center">
        <div className="flex gap-4 text-6xl mb-8" aria-hidden>
          <span className="duo-bob">🍉</span>
          <span className="duo-bob" style={{ animationDelay: '0.3s' }}>🍍</span>
          <span className="duo-bob" style={{ animationDelay: '0.6s' }}>🥝</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight mb-3">Slice-A-Word</h1>
        <p className="text-lg font-bold text-white/90 mb-12">Learn languages, fruit-ninja style.</p>

        <button
          onClick={async () => {
            try {
              await signInWithPopup(auth, googleProvider);
            } catch (error: any) {
              console.error("Sign in failed:", error);
              if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message.includes('cross-origin')) {
                // fallback
                await signInWithRedirect(auth, googleProvider);
              } else {
                alert("Sign in failed. Error: " + error.message);
              }
            }
          }}
          className="duo-btn duo-btn-hero w-full max-w-xs py-4 text-base"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const setUser = useStore((state) => state.setUser);


  useEffect(() => {
    getRedirectResult(auth).then((result) => {
        if (result) {
            console.log("Redirect sign-in successful", result);
        }
    }).catch((error) => {
        console.error("Redirect sign-in error:", error);
    });
  }, []);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsub;
  }, [setUser]);

  return (
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-set" element={<AddWordSet />} />
          <Route path="/setup/:setId" element={<GameSetup />} />
          <Route path="/play/:setId" element={<GameView />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthWrapper>
    </BrowserRouter>
  );
}

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
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center z-50 relative">
      <div className="font-bold text-xl text-emerald-700 tracking-tight flex items-center gap-2">
        <span className="text-2xl">🍉</span> Slice-A-Word
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 font-medium">{user.displayName || user.email}</span>
        <button onClick={() => auth.signOut()} className="text-gray-400 hover:text-red-500 transition-colors" title="Sign out">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}

function AuthWrapper({ children }: { children: ReactNode }) {
  const user = useStore((state) => state.user);

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-600">Loading...</div>;
  }

  if (user === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900 px-4">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🍉🍍🥝</div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Slice-A-Word</h1>
          <p className="text-xl text-emerald-100/80 font-medium">Learn languages fruit-ninja style.</p>
        </div>
        
        
        
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
          className="bg-white text-emerald-900 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

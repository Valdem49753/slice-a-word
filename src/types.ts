export interface Word {
  native: string;
  target: string;
}

export interface WordSet {
  id: string;
  userId: string;
  name: string;
  nativeLang: string;
  targetLang: string;
  words: Word[];
  createdAt: number;
}

export interface GameResult {
  id: string;
  userId: string;
  wordSetId: string;
  score: number;
  maxScore: number;
  difficulty: 'easy' | 'hard';
  mode: 'written_native_to_target' | 'written_target_to_native' | 'audio_native_to_target' | 'audio_target_to_native';
  createdAt: number;
  wordStats?: Record<string, { seen: number; correct: number; native: string; target: string }>;
}

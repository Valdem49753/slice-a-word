// src/utils/tts.ts
//
// Robust Web Speech API wrapper, written around Android Chrome's quirks.
//
// The bug this fixes: on Android, speechSynthesis.getVoices() is populated
// asynchronously and can come back EMPTY at arbitrary moments (first load,
// after the tab is backgrounded, after the browser re-binds to the system
// TTS service). If an utterance is sent with only `utterance.lang` set and
// no `utterance.voice`, Android Chrome hands it to the system TTS engine,
// which frequently ignores `lang` and uses the DEVICE DEFAULT voice —
// Russian on a Russian-locale phone. Result: English/Spanish prompts read
// by the Russian voice, intermittently.
//
// A second Android quirk: SpeechSynthesisVoice objects go STALE after the
// engine re-binds. Assigning a stale voice object silently falls back to
// the default voice. So we never keep voice object references across calls;
// we re-resolve from a fresh getVoices() list every time, caching only the
// voice NAME per language.
//
// A third quirk: speak() fired synchronously right after cancel() is
// unreliable on Android — we insert a short delay.

let voices: SpeechSynthesisVoice[] = [];
let voicesReady = false;
let initialized = false;
const readyCallbacks: (() => void)[] = [];

// langTag ("en-US") -> voice.name that worked last time.
// We cache the NAME, not the object (stale-object quirk above).
const preferredVoiceName = new Map<string, string>();

function refreshVoices(): void {
  if (!('speechSynthesis' in window)) return;
  const list = window.speechSynthesis.getVoices();
  if (list.length > 0) {
    voices = list;
    if (!voicesReady) {
      voicesReady = true;
      readyCallbacks.splice(0).forEach((cb) => cb());
    }
  }
}

/**
 * Start loading the voice list as early as possible.
 * Safe to call multiple times. Call it on app/game mount.
 */
export function initTTS(): void {
  if (initialized || !('speechSynthesis' in window)) return;
  initialized = true;
  refreshVoices();
  // NOT { once: true }: Android re-fires voiceschanged whenever the engine
  // re-binds; we want the cache to stay fresh for the whole session.
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  // Some Android WebViews never fire voiceschanged at all — poll as backup.
  let tries = 0;
  const poll = () => {
    if (voicesReady || tries++ > 25) return;
    refreshVoices();
    setTimeout(poll, 200);
  };
  poll();
}

/**
 * Call from a user-gesture handler (e.g. the TAP TO START button).
 * Unlocks audio on mobile AND forces Android to bind the TTS engine,
 * so the voice list is warm before the first real word is spoken.
 */
export function warmUpTTS(): void {
  initTTS();
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0.01;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

function whenVoicesReady(timeoutMs = 3000): Promise<void> {
  refreshVoices();
  if (voicesReady) return Promise.resolve();
  return new Promise((resolve) => {
    const t = setTimeout(resolve, timeoutMs); // give up gracefully
    readyCallbacks.push(() => {
      clearTimeout(t);
      resolve();
    });
  });
}

/** Map a free-text language name ("English", "испанский", "zh") + the text's
 *  script to a BCP-47 tag. Script of the text wins over the declared name. */
function resolveLangTag(langName: string, text: string): string {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko-KR';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja-JP';
  const cyr = (text.match(/[а-яё]/gi) || []).length;
  const lat = (text.match(/[a-z]/gi) || []).length;
  if (cyr > 0 && lat === 0) return 'ru-RU';

  const l = (langName || '').toLowerCase().trim();
  // Specific names first; generic English patterns LAST so substrings like
  // "en"/"us" can't shadow other languages.
  const table: Array<[RegExp, string]> = [
    [/рус|russ/, 'ru-RU'],
    [/укр|ukrain/, 'uk-UA'],
    [/исп|span/, 'es-ES'],
    [/кит|chin|mandarin/, 'zh-CN'],
    [/кор|korean/, 'ko-KR'],
    [/яп|japan/, 'ja-JP'],
    [/франц|french/, 'fr-FR'],
    [/нем|german|deutsch/, 'de-DE'],
    [/итал|italian/, 'it-IT'],
    [/португ|portug/, 'pt-BR'],
    [/нидерл|голланд|dutch/, 'nl-NL'],
    [/пол|polish/, 'pl-PL'],
    [/тур|turk/, 'tr-TR'],
    [/англ|engl/, 'en-US'],
  ];
  for (const [re, tag] of table) if (re.test(l)) return tag;

  // Bare ISO codes: "en", "es-mx", "zh_CN"
  const m = l.replace('_', '-').match(/^([a-z]{2})(-[a-z]{2})?$/);
  if (m) {
    const defaults: Record<string, string> = {
      en: 'en-US', ru: 'ru-RU', es: 'es-ES', zh: 'zh-CN', ko: 'ko-KR',
      ja: 'ja-JP', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR',
      nl: 'nl-NL', pl: 'pl-PL', tr: 'tr-TR', uk: 'uk-UA',
    };
    return m[2] ? l.replace('_', '-') : (defaults[m[1]] || l);
  }
  return lat >= cyr ? 'en-US' : 'ru-RU';
}

const NON_LATIN_SCRIPT = new Set(['ru', 'uk', 'bg', 'be', 'sr', 'zh', 'ja', 'ko', 'ar', 'he', 'th']);

// Cyrillic letters that are visually identical to Latin ones — typical
// contamination when English/Spanish words are typed on a Russian layout.
const CYR_TO_LAT: Record<string, string> = {
  'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
  'і': 'i', 'ѕ': 's', 'ј': 'j',
  'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M',
  'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'У': 'Y',
};

function cleanTextForLatinTTS(text: string): string {
  let out = text.replace(/[\u0400-\u04FF]/g, (ch) => CYR_TO_LAT[ch] ?? ch);
  if (/[\u0400-\u04FF]/.test(out)) {
    // Real (non-homoglyph) Cyrillic inside an English/Spanish entry —
    // this is a DATA problem in the word set; flag it and strip it so the
    // engine's language auto-detection isn't dragged towards Russian.
    console.warn('[tts] Cyrillic inside a Latin-language entry — check this word in the set:', JSON.stringify(text));
    out = out.replace(/[\u0400-\u04FF]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return out;
}

/** Resolve a concrete voice from a FRESH list. Never reuse old objects. */
function pickVoice(langTag: string): SpeechSynthesisVoice | null {
  refreshVoices();
  const norm = (s: string) => s.replace('_', '-').toLowerCase();
  const tag = norm(langTag);
  const short = tag.split('-')[0];

  // Re-validate the cached choice against the fresh list first, so every
  // word in a session is spoken by the exact same voice.
  const cachedName = preferredVoiceName.get(tag);
  if (cachedName) {
    const v = voices.find((v) => v.name === cachedName && norm(v.lang).startsWith(short));
    if (v) return v;
  }

  const v =
    voices.find((v) => norm(v.lang) === tag && /google/i.test(v.name)) ||
    voices.find((v) => norm(v.lang) === tag) ||
    voices.find((v) => norm(v.lang).startsWith(short) && /google/i.test(v.name)) ||
    voices.find((v) => norm(v.lang).startsWith(short)) ||
    null;

  if (v) preferredVoiceName.set(tag, v.name);
  return v;
}

let speakSeq = 0;

/**
 * Speak `text` in the language described by `langName`
 * (free-text names like "English" / "испанский" and ISO codes both work).
 */
export async function speak(text: string, langName: string): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  const mySeq = ++speakSeq;
  const synth = window.speechSynthesis;

  // Never emit an utterance before the voice list has had a chance to load —
  // this is exactly the window in which Android falls back to the default
  // (Russian) system voice. No-op once the list is warm.
  await whenVoicesReady();
  if (mySeq !== speakSeq) return; // superseded by a newer speak()

  const langTag = resolveLangTag(langName, text);
  const short = langTag.split('-')[0];
  const toSay = NON_LATIN_SCRIPT.has(short) ? text : cleanTextForLatinTTS(text);

  synth.cancel();
  // Android: speak() immediately after cancel() is flaky — give it a beat.
  await new Promise((r) => setTimeout(r, 80));
  if (mySeq !== speakSeq) return;
  if (synth.paused) synth.resume();

  const u = new SpeechSynthesisUtterance(toSay);
  u.volume = 1;
  u.rate = 1;

  const voice = pickVoice(langTag);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang; // keep lang consistent with the chosen voice
  } else {
    u.lang = langTag;
    console.warn(`[tts] no installed voice for ${langTag}; falling back to lang-only (system default voice may be used). Install/download this language in the phone's TTS settings.`);
  }

  u.onerror = (e) => console.warn('[tts] error:', e.error);
  console.log('[tts] speaking:', JSON.stringify(toSay), '| lang:', u.lang, '| voice:', voice ? voice.name : '(none)');
  synth.speak(u);
}

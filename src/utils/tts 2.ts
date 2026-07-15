// src/utils/tts.ts — v2
//
// Двухуровневая озвучка:
//   1) Серверный TTS (Gemini, /api/tts) — качественные голоса для en/es и др.
//   2) Системный speechSynthesis — для ru/zh (там он работает хорошо)
//      и как автоматический fallback, если сервер недоступен.
//
// Почему так: window.speechSynthesis на Android — лишь мост к системному
// движку телефона. Chrome на Android ИГНОРИРУЕТ utterance.voice (известное
// ограничение Chromium) и передаёт движку только lang; если у движка не
// скачаны данные языка, он молча читает голосом по умолчанию (русским).
// Качество тоже ограничено системными голосами — веб-страница не может
// выбрать премиум-голос. Поэтому языки, где важно качество, озвучиваются
// на сервере, а системный движок остаётся запасным вариантом.

// Языки, которые озвучиваем системным движком: русский на русском телефоне
// звучит нативно (и не тратит квоту API), китайский у Google TTS хорош,
// а поддержка китайского в TTS-модели Gemini не гарантирована.
const LOCAL_TTS_LANGS = new Set(['ru', 'zh']);

/* ============================ Серверный TTS ============================ */

let audioEl: HTMLAudioElement | null = null;
// 44-байтный тихий WAV для «разблокировки» <audio> внутри жеста пользователя
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

function getAudioEl(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
  }
  return audioEl;
}

// url -> Promise<objectURL | null>. Повторные прослушивания — мгновенно из кэша.
const audioCache = new Map<string, Promise<string | null>>();

function fetchTtsUrl(text: string, langTag: string): Promise<string | null> {
  const url = `/api/tts?lang=${encodeURIComponent(langTag)}&text=${encodeURIComponent(text)}`;
  if (!audioCache.has(url)) {
    audioCache.set(
      url,
      fetch(url)
        .then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const blob = await r.blob();
          if (!blob.type.startsWith('audio')) throw new Error('not audio');
          return URL.createObjectURL(blob);
        })
        .catch((e) => {
          console.warn('[tts] серверный TTS недоступен:', e);
          audioCache.delete(url); // не кэшируем неудачу — попробуем снова
          return null;
        })
    );
  }
  return audioCache.get(url)!;
}

/** Подогреть кэш для будущего слова (вызывается заранее, чтобы не было паузы). */
export function prefetchSpeech(text: string, langName: string): void {
  if (!text) return;
  const langTag = resolveLangTag(langName, text);
  const short = langTag.split('-')[0];
  if (LOCAL_TTS_LANGS.has(short)) return;
  const toSay = NON_LATIN_SCRIPT.has(short) ? text : cleanTextForLatinTTS(text);
  void fetchTtsUrl(toSay, langTag);
}

/* ==================== Системный движок (fallback) ===================== */

let voices: SpeechSynthesisVoice[] = [];
let voicesReady = false;
let initialized = false;
const readyCallbacks: (() => void)[] = [];
const preferredVoiceName = new Map<string, string>(); // langTag -> voice.name

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

/** Безопасно вызывать многократно; начинает загрузку списка голосов. */
export function initTTS(): void {
  if (initialized || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  initialized = true;
  refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  let tries = 0;
  const poll = () => {
    if (voicesReady || tries++ > 25) return;
    refreshVoices();
    setTimeout(poll, 200);
  };
  poll();
}

/**
 * Вызывать из обработчика жеста пользователя (кнопки старта):
 * разблокирует <audio> для программного воспроизведения на мобильных
 * и заставляет Android привязать системный TTS-движок.
 */
export function warmUpTTS(): void {
  initTTS();
  try {
    const el = getAudioEl();
    el.src = SILENT_WAV;
    el.play().catch(() => {});
  } catch {
    /* ignore */
  }
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0.01;
      window.speechSynthesis.speak(u);
    }
  } catch {
    /* ignore */
  }
}

function whenVoicesReady(timeoutMs = 3000): Promise<void> {
  refreshVoices();
  if (voicesReady) return Promise.resolve();
  return new Promise((resolve) => {
    const t = setTimeout(resolve, timeoutMs);
    readyCallbacks.push(() => {
      clearTimeout(t);
      resolve();
    });
  });
}

/* ========================= Определение языка ========================== */

function resolveLangTag(langName: string, text: string): string {
  // Письменность текста важнее заявленного названия языка
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko-KR';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja-JP';
  const cyr = (text.match(/[а-яё]/gi) || []).length;
  const lat = (text.match(/[a-z]/gi) || []).length;
  if (cyr > 0 && lat === 0) return 'ru-RU';

  const l = (langName || '').toLowerCase().trim();
  // Конкретные названия — раньше; английские шаблоны — последними,
  // чтобы "en"/"us" не перехватывали чужие названия.
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

  const m = l.replace('_', '-').match(/^([a-z]{2})(-[a-z]{2})?$/);
  if (m) {
    const defaults: Record<string, string> = {
      en: 'en-US', ru: 'ru-RU', es: 'es-ES', zh: 'zh-CN', ko: 'ko-KR',
      ja: 'ja-JP', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR',
      nl: 'nl-NL', pl: 'pl-PL', tr: 'tr-TR', uk: 'uk-UA',
    };
    return m[2] ? l.replace('_', '-') : defaults[m[1]] || l;
  }
  return lat >= cyr ? 'en-US' : 'ru-RU';
}

const NON_LATIN_SCRIPT = new Set(['ru', 'uk', 'bg', 'be', 'sr', 'zh', 'ja', 'ko', 'ar', 'he', 'th']);

// Кириллические буквы, визуально совпадающие с латинскими, — типичное
// «загрязнение» английских/испанских слов, набранных в русской раскладке.
const CYR_TO_LAT: Record<string, string> = {
  'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
  'і': 'i', 'ѕ': 's', 'ј': 'j',
  'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M',
  'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'У': 'Y',
};

function cleanTextForLatinTTS(text: string): string {
  let out = text.replace(/[\u0400-\u04FF]/g, (ch) => CYR_TO_LAT[ch] ?? ch);
  if (/[\u0400-\u04FF]/.test(out)) {
    console.warn('[tts] Кириллица внутри латинской записи — проверьте это слово в наборе:', JSON.stringify(text));
    out = out.replace(/[\u0400-\u04FF]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return out;
}

/* ============================== speak() =============================== */

let speakSeq = 0;

function stopAll(): void {
  try {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
  } catch {
    /* ignore */
  }
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export async function speak(text: string, langName: string): Promise<void> {
  if (typeof window === 'undefined' || !text) return;
  const mySeq = ++speakSeq;

  const langTag = resolveLangTag(langName, text);
  const short = langTag.split('-')[0];
  const toSay = NON_LATIN_SCRIPT.has(short) ? text : cleanTextForLatinTTS(text);

  stopAll();

  // 1) Серверный TTS для «качественных» языков
  if (!LOCAL_TTS_LANGS.has(short)) {
    const src = await fetchTtsUrl(toSay, langTag);
    if (mySeq !== speakSeq) return; // пришёл более новый запрос — уступаем
    if (src) {
      try {
        const el = getAudioEl();
        el.src = src;
        await el.play();
        console.log('[tts] server voice:', langTag, JSON.stringify(toSay));
        return;
      } catch (e) {
        console.warn('[tts] не удалось воспроизвести серверное аудио, fallback на системный голос:', e);
      }
    }
  }

  // 2) Системный движок (ru/zh или fallback)
  if (mySeq !== speakSeq) return;
  await speakWithSystemVoice(toSay, langTag, mySeq);
}

async function speakWithSystemVoice(toSay: string, langTag: string, mySeq: number): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;

  await whenVoicesReady();
  if (mySeq !== speakSeq) return;

  // Android: speak() сразу после cancel() нестабилен — небольшая пауза
  await new Promise((r) => setTimeout(r, 80));
  if (mySeq !== speakSeq) return;
  if (synth.paused) synth.resume();

  const u = new SpeechSynthesisUtterance(toSay);
  u.volume = 1;
  u.rate = 1;

  const voice = pickVoice(langTag);
  if (voice) {
    u.voice = voice; // на Android может игнорироваться — но lang мы тоже ставим
    u.lang = voice.lang;
  } else {
    u.lang = langTag;
    console.warn(`[tts] в системе нет голоса для ${langTag} — скачайте языковой пакет в настройках «Синтез речи» телефона.`);
  }

  u.onerror = (e) => console.warn('[tts] system voice error:', e.error);
  console.log('[tts] system voice:', u.lang, '| voice:', voice ? voice.name : '(none)', '|', JSON.stringify(toSay));
  synth.speak(u);
}

/** Голос ищем каждый раз в СВЕЖЕМ списке: старые объекты голосов на Android
 *  «протухают» после перепривязки движка, и их назначение молча игнорируется. */
function pickVoice(langTag: string): SpeechSynthesisVoice | null {
  refreshVoices();
  const norm = (s: string) => s.replace('_', '-').toLowerCase();
  const tag = norm(langTag);
  const short = tag.split('-')[0];

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

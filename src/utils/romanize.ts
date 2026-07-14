import { pinyin } from 'pinyin-pro';
import { romanize } from 'koroman';

export const getRomanization = (text: string, lang: string): string => {
  if (/chinese|mandarin|китайский|китай/i.test(lang)) {
    return pinyin(text);
  }
  if (/korean|корейский|корея/i.test(lang)) {
    return romanize(text);
  }
  return text;
};

export const formatDisplay = (text: string, lang: string, displayType: string): string => {
  if (displayType === 'native') return text;
  
  const isSupported = /chinese|mandarin|китайский|китай|korean|корейский|корея/i.test(lang);
  if (!isSupported) return text;

  const rom = getRomanization(text, lang);
  if (displayType === 'romanized') return rom;
  if (displayType === 'both') return `${text}\n(${rom})`;
  return text;
};

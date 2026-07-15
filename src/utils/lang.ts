/** Флаг-эмодзи по названию языка (понимает русские и английские названия). */
export function langEmoji(name: string): string {
  const l = (name || '').toLowerCase();
  if (/рус|russ/.test(l)) return '🇷🇺';
  if (/англ|engl/.test(l)) return '🇬🇧';
  if (/исп|span/.test(l)) return '🇪🇸';
  if (/кит|chin|mandarin/.test(l)) return '🇨🇳';
  if (/кор|korean/.test(l)) return '🇰🇷';
  if (/яп|japan/.test(l)) return '🇯🇵';
  if (/франц|french/.test(l)) return '🇫🇷';
  if (/нем|german|deutsch/.test(l)) return '🇩🇪';
  if (/итал|italian/.test(l)) return '🇮🇹';
  if (/португ|portug/.test(l)) return '🇧🇷';
  if (/укр|ukrain/.test(l)) return '🇺🇦';
  if (/пол|polish/.test(l)) return '🇵🇱';
  if (/тур|turk/.test(l)) return '🇹🇷';
  if (/нидерл|голланд|dutch/.test(l)) return '🇳🇱';
  return '🌐';
}

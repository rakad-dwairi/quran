const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

export function toArabicIndicDigits(value: number): string {
  const s = String(Math.trunc(value));
  let out = "";
  for (const ch of s) {
    const n = ch.charCodeAt(0) - 48;
    out += n >= 0 && n <= 9 ? ARABIC_INDIC_DIGITS[n]! : ch;
  }
  return out;
}

export function formatAyahMarker(verseNumber: number): string {
  return `﴿${toArabicIndicDigits(verseNumber)}﴾`;
}


const REPLACEMENT_CHAR = '�';

export function hasBrokenText(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  const text = value.trim();
  if (text.length === 0) return true;

  let replacementCount = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charAt(i) === REPLACEMENT_CHAR) replacementCount += 1;
  }

  if (replacementCount > 0) return true;
  if (/^[\?\s]+$/.test(text)) return true;
  if (/^[\u0000-\u001f]+$/.test(text)) return true;
  return false;
}

export function sanitizeUiText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const text = value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (hasBrokenText(text)) return fallback;
  return text;
}

export function sanitizeScoreTitle(value: unknown, fallback = 'Untitled Score'): string {
  return sanitizeUiText(value, fallback);
}

export function sanitizeArtistName(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  if (text.length === 0) return fallback;
  return sanitizeUiText(text, fallback);
}

export function sanitizeTrackName(value: unknown, index: number): string {
  return sanitizeUiText(value, `Track ${index + 1}`);
}

export type PromptDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type PromptGenre = 'ballad' | 'rock' | 'blues' | 'jazz' | 'kpop';

export interface PromptSongOptions {
  prompt: string;
  genre: PromptGenre;
  difficulty: PromptDifficulty;
  bpm: number;
  key: string;
  bars: number;
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value);
}

function normalizeBars(value: number): number {
  const clamped = clampNumber(value, 4, 32, 8);
  if (clamped <= 4) return 4;
  if (clamped <= 8) return 8;
  if (clamped <= 16) return 16;
  return 32;
}

function pickTitle(prompt: string): string {
  const clean = prompt.trim();
  if (clean.length === 0) return 'AI Generated Song';
  if (clean.length <= 32) return clean;
  return `${clean.slice(0, 32).trim()}...`;
}

function getPattern(genre: PromptGenre, difficulty: PromptDifficulty): string[] {
  if (genre === 'blues') {
    return difficulty === 'advanced'
      ? ['0.6 3.5 5.4 3.5', '0.6 3.5 6.4 3.5', '0.6 3.5 7.4 3.5', '0.6 3.5 6.4 3.5']
      : ['0.6 3.5 5.4 3.5', '0.6 3.5 5.4 3.5', '0.6 3.5 5.4 3.5', '0.6 3.5 5.4 3.5'];
  }

  if (genre === 'rock') {
    return difficulty === 'beginner'
      ? ['0.6 2.5 2.4 0.6', '3.6 2.5 0.4 3.6', '0.5 2.4 2.3 0.5', '3.6 2.5 0.4 3.6']
      : ['0.6 2.5 2.4 0.6', '3.6 2.5 0.4 3.6', '0.5 2.4 2.3 0.5', '3.6 2.5 0.4 3.6'];
  }

  if (genre === 'jazz') {
    return ['3.5 2.4 3.3 2.2', '1.5 0.4 1.3 0.2', '2.5 1.4 2.3 1.2', '3.5 2.4 3.3 2.2'];
  }

  if (genre === 'kpop') {
    return ['0.5 3.5 2.4 0.3', '0.5 3.5 2.4 1.2', '3.6 2.5 0.4 0.3', '0.5 3.5 2.4 0.3'];
  }

  return difficulty === 'advanced'
    ? ['0.5 3.5 2.4 0.3', '1.2 0.3 2.4 3.5', '3.6 2.5 0.4 0.3', '0.5 3.5 2.4 0.3']
    : ['0.5 3.5 2.4 0.3', '0.5 3.5 2.4 1.2', '3.6 2.5 0.4 0.3', '0.5 3.5 2.4 0.3'];
}

export function generateAlphaTexFromPrompt(options: PromptSongOptions): string {
  const bpm = clampNumber(options.bpm, 40, 240, 90);
  const bars = normalizeBars(options.bars);
  const title = pickTitle(options.prompt);
  const pattern = getPattern(options.genre, options.difficulty);
  const lines: string[] = [];

  for (let i = 0; i < bars; i += 1) {
    const bar = pattern[i % pattern.length];
    lines.push(`  :8 ${bar} |`);
  }

  return [
    `\\title \"${title.replace(/\"/g, '')}\"`,
    '\\artist \"MaestroAI\"',
    `\\tempo ${bpm}`,
    '',
    '\\track \"Acoustic Guitar\"',
    '  \\staff{tabs}',
    '  \\tuning e5 b4 g4 d4 a3 e3',
    ...lines,
  ].join('\n');
}

export function getPromptPreset(genre: PromptGenre): string {
  if (genre === 'rock') return '경쾌한 락 기타 리프 8마디를 만들어줘';
  if (genre === 'blues') return '12마디 블루스 느낌의 쉬운 기타 패턴을 만들어줘';
  if (genre === 'jazz') return '재즈 느낌의 코드톤 중심 기타 연습곡을 만들어줘';
  if (genre === 'kpop') return 'K-pop 발라드 느낌의 기타 아르페지오를 만들어줘';
  return '잔잔한 90bpm C키 발라드 기타 아르페지오 8마디를 만들어줘';
}

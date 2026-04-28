import type { MaestroProject, MaestroTrack, TrackRole } from '../../types/project';

export type BuskingGoal = 'solo_acoustic' | 'vocal_guitar' | 'full_band' | 'easy_practice' | 'stage_performance';
export type PlanStatus = 'draft' | 'ready_for_practice' | 'ready_for_busking' | 'needs_sound_render';

export interface SongSectionPlan {
  id: string;
  name: string;
  bars: string;
  energy: 'low' | 'medium' | 'high';
  purpose: string;
  performanceCue: string;
}

export interface PracticeLoopPlan {
  id: string;
  name: string;
  target: string;
  suggestedTempoPercent: number;
  repeatCount: number;
  cue: string;
}

export interface BuskingArrangementPlan {
  id: string;
  createdAt: string;
  goal: BuskingGoal;
  status: PlanStatus;
  title: string;
  sourceBpm: number;
  performanceBpm: number;
  sourceKey: string;
  recommendedKey: string;
  capo: number;
  difficulty: 'easy' | 'intermediate' | 'advanced';
  trackSummary: string[];
  sections: SongSectionPlan[];
  practiceLoops: PracticeLoopPlan[];
  buskingCues: string[];
  arrangementNotes: string[];
  maestroSoundPrompt: string;
  renderPrompt: string;
  validation: ArrangementValidationResult;
}

export interface ArrangementValidationItem {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface ArrangementValidationResult {
  status: 'pass' | 'warn' | 'fail';
  items: ArrangementValidationItem[];
}

function detectRole(track: MaestroTrack): TrackRole {
  if (track.role) return track.role;
  const raw = `${track.name} ${track.instrument}`.toLowerCase();
  if (raw.includes('drum') || raw.includes('perc')) return 'drums';
  if (raw.includes('bass')) return 'bass';
  if (raw.includes('guitar') || raw.includes('tab') || raw.includes('uke')) return 'guitar';
  if (raw.includes('piano') || raw.includes('key') || raw.includes('organ')) return 'keys';
  if (raw.includes('vocal') || raw.includes('voice') || raw.includes('melody')) return 'vocal';
  if (raw.includes('string') || raw.includes('violin') || raw.includes('cello')) return 'strings';
  return 'other';
}

function goalLabel(goal: BuskingGoal): string {
  switch (goal) {
    case 'solo_acoustic': return 'Solo Acoustic Busking';
    case 'vocal_guitar': return 'Vocal + Guitar';
    case 'full_band': return 'Full Band Practice';
    case 'easy_practice': return 'Easy Practice Version';
    case 'stage_performance': return 'Stage Performance';
    default: return 'Busking Version';
  }
}

function pickRecommendedKey(project: MaestroProject, goal: BuskingGoal): string {
  const key = project.key || 'C';
  if (goal === 'vocal_guitar' || goal === 'solo_acoustic') {
    if (key.includes('#') || key.includes('b')) return 'G';
    return key;
  }
  return key;
}

function pickCapo(recommendedKey: string, goal: BuskingGoal): number {
  if (goal === 'full_band' || goal === 'stage_performance') return 0;
  if (recommendedKey === 'G' || recommendedKey === 'D') return 2;
  if (recommendedKey === 'C' || recommendedKey === 'A') return 0;
  return 1;
}

function pickPerformanceBpm(bpm: number, goal: BuskingGoal): number {
  const source = Number.isFinite(bpm) && bpm > 0 ? bpm : 120;
  if (goal === 'easy_practice') return Math.max(60, Math.round(source * 0.78));
  if (goal === 'solo_acoustic' || goal === 'vocal_guitar') return Math.max(70, Math.round(source * 0.92));
  if (goal === 'stage_performance') return Math.round(source * 1.02);
  return source;
}

function buildSections(goal: BuskingGoal): SongSectionPlan[] {
  const acousticIntro = goal === 'full_band' || goal === 'stage_performance'
    ? 'drum pickup + bass root + short guitar cue'
    : 'soft guitar pickup, establish tempo before vocal entry';
  return [
    { id: 'intro', name: 'Intro', bars: '1-4', energy: 'low', purpose: 'Audience lock-in', performanceCue: acousticIntro },
    { id: 'verse1', name: 'Verse 1', bars: '5-20', energy: 'medium', purpose: 'Tell the story clearly', performanceCue: 'Keep rhythm stable; avoid overplaying.' },
    { id: 'chorus1', name: 'Chorus 1', bars: '21-36', energy: 'high', purpose: 'First hook', performanceCue: 'Open strum or full-band lift; make downbeats obvious.' },
    { id: 'bridge', name: 'Bridge / Solo', bars: '37-48', energy: 'medium', purpose: 'Contrast and reset', performanceCue: 'Reduce density first half, build into final chorus.' },
    { id: 'final', name: 'Final Chorus + Ending', bars: '49-64', energy: 'high', purpose: 'Memorable close', performanceCue: 'Strong last hook, clear ritard or stop ending.' },
  ];
}

function buildPracticeLoops(goal: BuskingGoal): PracticeLoopPlan[] {
  return [
    { id: 'loop-intro', name: 'Intro timing', target: 'Intro 1-4', suggestedTempoPercent: goal === 'easy_practice' ? 65 : 80, repeatCount: 6, cue: 'Stabilize first downbeat and count-in.' },
    { id: 'loop-hook', name: 'Chorus hook', target: 'Chorus 21-36', suggestedTempoPercent: goal === 'easy_practice' ? 70 : 85, repeatCount: 5, cue: 'Focus on vocal/guitar accent alignment.' },
    { id: 'loop-transition', name: 'Bridge to final chorus', target: 'Bridge 37-48 → Final 49', suggestedTempoPercent: 75, repeatCount: 4, cue: 'Practice energy ramp and clean section handoff.' },
  ];
}

function buildTrackSummary(project: MaestroProject): string[] {
  if (!project.tracks || project.tracks.length === 0) return ['No tracks detected yet. Import or create a score first.'];
  return project.tracks.map((track, index) => {
    const role = detectRole(track);
    return `Track ${index + 1}: ${track.name || 'Untitled'} → ${role}`;
  });
}

function buildSoundPrompt(project: MaestroProject, goal: BuskingGoal, recommendedKey: string, performanceBpm: number): string {
  const label = goalLabel(goal);
  const title = project.name || 'Untitled Song';
  const base = `Create a performance-ready ${label} arrangement for "${title}" in ${recommendedKey}, ${performanceBpm} BPM.`;
  const common = 'Keep the structure clear, make the groove stable, avoid clutter, prioritize busking readability, and produce a polished stage-ready master.';
  switch (goal) {
    case 'solo_acoustic':
      return `${base} Warm steel-string acoustic guitar, intimate room ambience, controlled dynamics, gentle percussive strums, optional light pad support. ${common}`;
    case 'vocal_guitar':
      return `${base} Vocal-supportive acoustic guitar, clear downbeat, transparent low end, no busy fills during vocal phrases, tasteful intro and ending. ${common}`;
    case 'full_band':
      return `${base} Tight live band with acoustic/electric guitar, bass, drums, and subtle keys. Strong chorus lift and clean transitions. ${common}`;
    case 'easy_practice':
      return `${base} Simplified practice backing, slower tempo, clear metronomic groove, reduced ornamentation, strong section cues. ${common}`;
    case 'stage_performance':
      return `${base} Big but clean stage mix, punchy drums, solid bass, wide guitars, controlled master limiter, audience-friendly ending. ${common}`;
    default:
      return `${base} ${common}`;
  }
}

function buildRenderPrompt(project: MaestroProject, goal: BuskingGoal, recommendedKey: string, performanceBpm: number): string {
  const roles = project.tracks.map((t) => detectRole(t)).join(', ') || 'guitar, bass, drums';
  return [
    `Source: ${project.name || 'Untitled Project'}`,
    `Goal: ${goalLabel(goal)}`,
    `Target key: ${recommendedKey}`,
    `Target BPM: ${performanceBpm}`,
    `Detected roles: ${roles}`,
    'Output required: drums stem, bass stem, guitar/keys stem, master.wav.',
    'Master target: busking/stage-ready, stable groove, no clipping, clear vocal space.',
  ].join('\n');
}

function validatePlan(project: MaestroProject, sections: SongSectionPlan[], loops: PracticeLoopPlan[], prompt: string): ArrangementValidationResult {
  const items: ArrangementValidationItem[] = [];
  const trackCount = project.tracks?.length ?? 0;
  items.push({
    id: 'project-loaded',
    label: 'Project loaded',
    status: project.name ? 'pass' : 'warn',
    message: project.name ? `Project: ${project.name}` : 'Project has no title.',
  });
  items.push({
    id: 'tracks-detected',
    label: 'Tracks detected',
    status: trackCount > 0 ? 'pass' : 'fail',
    message: trackCount > 0 ? `${trackCount} track(s) available.` : 'No tracks available for arrangement.',
  });
  items.push({
    id: 'sections',
    label: 'Section plan',
    status: sections.length >= 4 ? 'pass' : 'fail',
    message: `${sections.length} section(s) generated.`,
  });
  items.push({
    id: 'practice-loops',
    label: 'Practice loops',
    status: loops.length >= 2 ? 'pass' : 'warn',
    message: `${loops.length} loop(s) generated.`,
  });
  items.push({
    id: 'sound-prompt',
    label: 'Maestro Sound Prompt',
    status: prompt.length > 80 ? 'pass' : 'fail',
    message: `${prompt.length} characters.`,
  });

  const hasFail = items.some((item) => item.status === 'fail');
  const hasWarn = items.some((item) => item.status === 'warn');
  return { status: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass', items };
}

export function createBuskingArrangementPlan(project: MaestroProject, goal: BuskingGoal): BuskingArrangementPlan {
  const performanceBpm = pickPerformanceBpm(project.bpm, goal);
  const recommendedKey = pickRecommendedKey(project, goal);
  const capo = pickCapo(recommendedKey, goal);
  const difficulty = goal === 'easy_practice' || goal === 'solo_acoustic' ? 'easy' : goal === 'stage_performance' ? 'advanced' : 'intermediate';
  const sections = buildSections(goal);
  const practiceLoops = buildPracticeLoops(goal);
  const maestroSoundPrompt = buildSoundPrompt(project, goal, recommendedKey, performanceBpm);
  const renderPrompt = buildRenderPrompt(project, goal, recommendedKey, performanceBpm);
  const validation = validatePlan(project, sections, practiceLoops, maestroSoundPrompt);

  return {
    id: `busking-plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    goal,
    status: validation.status === 'fail' ? 'draft' : 'needs_sound_render',
    title: `${project.name || 'Untitled'} — ${goalLabel(goal)}`,
    sourceBpm: project.bpm,
    performanceBpm,
    sourceKey: project.key || 'C',
    recommendedKey,
    capo,
    difficulty,
    trackSummary: buildTrackSummary(project),
    sections,
    practiceLoops,
    buskingCues: [
      'Confirm key and capo before performance.',
      'Use Intro as count-in anchor.',
      'Keep vocal space clean in Verse sections.',
      'Lift energy at every Chorus downbeat.',
      'Use Final Chorus as audience memory point.',
    ],
    arrangementNotes: [
      'This is the deterministic planning layer before AI audio rendering.',
      'The next phase connects Maestro Sound generation to RenderCache stems/master.',
      'Practice loops and busking cues are immediately usable for workflow verification.',
    ],
    maestroSoundPrompt,
    renderPrompt,
    validation,
  };
}

export function summarizePlanForRenderCache(plan: BuskingArrangementPlan): string {
  return `${plan.title} | ${plan.recommendedKey} | ${plan.performanceBpm} BPM | ${plan.status}`;
}

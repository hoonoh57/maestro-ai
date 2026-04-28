from __future__ import annotations

import math
import os
import wave
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple


@dataclass
class RenderedAudio:
    job_id: str
    file_name: str
    file_path: str
    duration_seconds: float
    sample_rate: int
    message: str


NOTE_TO_SEMITONE = {
    "C": 0, "C#": 1, "DB": 1, "D": 2, "D#": 3, "EB": 3,
    "E": 4, "F": 5, "F#": 6, "GB": 6, "G": 7, "G#": 8,
    "AB": 8, "A": 9, "A#": 10, "BB": 10, "B": 11,
}
MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
PROGRESSION = [0, 4, 5, 3]


def _safe_name(value: str) -> str:
    allowed = []
    for ch in value:
        if ch.isalnum() or ch in ("-", "_"):
            allowed.append(ch)
        elif ch.isspace():
            allowed.append("_")
    return "".join(allowed).strip("_") or "maestro"


def _key_root(key: str) -> int:
    raw = (key or "C").strip().upper().replace("MINOR", "").replace("MAJOR", "").strip()
    if len(raw) >= 2 and raw[:2] in NOTE_TO_SEMITONE:
        return NOTE_TO_SEMITONE[raw[:2]]
    return NOTE_TO_SEMITONE.get(raw[:1], 0)


def _midi_to_hz(midi_note: int) -> float:
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


def _scale_chord(root_semitone: int, degree: int, octave: int) -> Tuple[int, int, int]:
    scale_index = PROGRESSION[degree % len(PROGRESSION)]
    root = 12 * (octave + 1) + root_semitone + MAJOR_SCALE[scale_index]
    third = root + (3 if scale_index == 5 else 4)
    fifth = root + 7
    return root, third, fifth


def _soft_clip(value: float) -> float:
    return math.tanh(value * 1.28) / math.tanh(1.28)


def _pluck(t: float, freq: float, start: float, dur: float, gain: float) -> float:
    if t < start or t > start + dur:
        return 0.0
    x = t - start
    env = math.exp(-x * 5.0) * min(1.0, x * 80.0)
    body = math.sin(2 * math.pi * freq * x)
    body += 0.42 * math.sin(2 * math.pi * freq * 2.01 * x)
    body += 0.18 * math.sin(2 * math.pi * freq * 3.0 * x)
    pick = math.sin(2 * math.pi * 2400 * x) * math.exp(-x * 90.0) * 0.08
    return (body * 0.72 + pick) * env * gain


def _bass(t: float, freq: float, start: float, dur: float, gain: float) -> float:
    if t < start or t > start + dur:
        return 0.0
    x = t - start
    env = math.exp(-x * 1.75) * min(1.0, x * 25.0)
    return (math.sin(2 * math.pi * freq * x) + 0.28 * math.sin(2 * math.pi * freq * 2 * x)) * env * gain


def _kick(t: float, start: float, gain: float) -> float:
    if t < start or t > start + 0.35:
        return 0.0
    x = t - start
    freq = 70.0 - 28.0 * min(1.0, x / 0.18)
    return math.sin(2 * math.pi * freq * x) * math.exp(-x * 14.0) * gain


def _snare(t: float, start: float, gain: float) -> float:
    if t < start or t > start + 0.28:
        return 0.0
    x = t - start
    noise = math.sin(2 * math.pi * 1731.0 * x) * math.sin(2 * math.pi * 913.0 * x)
    tone = math.sin(2 * math.pi * 185.0 * x) * 0.28
    return (noise * 0.72 + tone) * math.exp(-x * 20.0) * gain


def _hat(t: float, start: float, gain: float) -> float:
    if t < start or t > start + 0.08:
        return 0.0
    x = t - start
    noise = math.sin(2 * math.pi * 6380.0 * x) * math.sin(2 * math.pi * 9100.0 * x)
    return noise * math.exp(-x * 65.0) * gain


def _pad(t: float, chord: Tuple[int, int, int], gain: float) -> float:
    out = 0.0
    for note in chord:
        f = _midi_to_hz(note + 12)
        out += math.sin(2 * math.pi * f * t) * 0.18
        out += math.sin(2 * math.pi * f * 2 * t) * 0.04
    return out * gain


def _build_events(duration: float, bpm: int, key_root: int) -> Dict[str, List[Tuple[float, Any]]]:
    beat = 60.0 / max(60, min(220, bpm))
    bar = beat * 4
    bars = int(math.ceil(duration / bar))
    events: Dict[str, List[Tuple[float, Any]]] = {"kick": [], "snare": [], "hat": [], "bass": [], "guitar": []}
    for b in range(bars):
        bar_start = b * bar
        chord = _scale_chord(key_root, b, 3)
        bass_note = chord[0] - 12
        events["kick"].append((bar_start, None))
        events["kick"].append((bar_start + beat * 2, None))
        events["snare"].append((bar_start + beat, None))
        events["snare"].append((bar_start + beat * 3, None))
        for i in range(8):
            events["hat"].append((bar_start + beat * 0.5 * i, None))
        for i in range(4):
            note = bass_note if i % 2 == 0 else bass_note + 7
            events["bass"].append((bar_start + beat * i, note))
        for i in range(8):
            note = chord[i % 3] + 12
            events["guitar"].append((bar_start + beat * 0.5 * i + 0.015, note))
    return events


def _render_sample(t: float, events: Dict[str, List[Tuple[float, Any]]], key_root: int, bpm: int) -> Tuple[float, float]:
    beat = 60.0 / max(60, min(220, bpm))
    bar = beat * 4
    chord = _scale_chord(key_root, int(t / bar), 3)
    pad = _pad(t, chord, 0.075)
    left = pad * 0.78
    right = pad * 0.86

    for start, _ in events["kick"]:
        if start - 0.01 <= t <= start + 0.35:
            v = _kick(t, start, 0.55)
            left += v
            right += v
    for start, _ in events["snare"]:
        if start - 0.01 <= t <= start + 0.28:
            v = _snare(t, start, 0.22)
            left += v * 0.95
            right += v * 1.05
    for start, _ in events["hat"]:
        if start - 0.01 <= t <= start + 0.08:
            v = _hat(t, start, 0.055)
            left += v * 0.65
            right += v * 1.15
    for start, note in events["bass"]:
        if start - 0.01 <= t <= start + beat * 0.92:
            v = _bass(t, _midi_to_hz(int(note)), start, beat * 0.92, 0.38)
            left += v
            right += v * 0.9
    for start, note in events["guitar"]:
        if start - 0.01 <= t <= start + beat * 0.48:
            v = _pluck(t, _midi_to_hz(int(note)), start, beat * 0.48, 0.18)
            left += v * 1.08
            right += v * 0.84

    return _soft_clip(left * 0.72), _soft_clip(right * 0.72)


def _apply_pedalboard_if_available(samples: List[Tuple[float, float]], sample_rate: int) -> List[Tuple[float, float]]:
    try:
        import numpy as np
        from pedalboard import Pedalboard, Compressor, Gain, HighpassFilter, LowpassFilter, Reverb, Limiter
    except Exception:
        return samples

    audio = np.array(samples, dtype=np.float32).T
    board = Pedalboard([
        HighpassFilter(cutoff_frequency_hz=35),
        LowpassFilter(cutoff_frequency_hz=14500),
        Compressor(threshold_db=-18, ratio=2.8, attack_ms=3, release_ms=160),
        Reverb(room_size=0.18, damping=0.46, wet_level=0.07, dry_level=0.93),
        Gain(gain_db=1.8),
        Limiter(threshold_db=-1.0, release_ms=80),
    ])
    processed = board(audio, sample_rate)
    processed = processed.T
    return [(float(row[0]), float(row[1])) for row in processed]


def render_performance_pack_audio(payload: Dict[str, Any], output_dir: str) -> RenderedAudio:
    os.makedirs(output_dir, exist_ok=True)
    plan = payload.get("plan") or {}
    project_name = payload.get("projectName") or plan.get("title") or "MaestroAI"
    bpm = int(plan.get("performanceBpm") or plan.get("sourceBpm") or 112)
    key = str(plan.get("recommendedKey") or plan.get("sourceKey") or "C")
    sample_rate = int(payload.get("sampleRate") or 44100)
    duration_seconds = float(payload.get("durationSeconds") or 16.0)
    duration_seconds = max(8.0, min(45.0, duration_seconds))
    key_root = _key_root(key)

    job_id = f"performance_pack_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')}"
    file_name = f"{job_id}_{_safe_name(project_name)}.wav"
    file_path = os.path.join(output_dir, file_name)
    frames = int(sample_rate * duration_seconds)
    events = _build_events(duration_seconds, bpm, key_root)
    samples = [_render_sample(i / sample_rate, events, key_root, bpm) for i in range(frames)]
    processed = _apply_pedalboard_if_available(samples, sample_rate)

    with wave.open(file_path, "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for left, right in processed:
            left_i = int(max(-0.98, min(0.98, left)) * 32767)
            right_i = int(max(-0.98, min(0.98, right)) * 32767)
            wav.writeframesraw(left_i.to_bytes(2, "little", signed=True) + right_i.to_bytes(2, "little", signed=True))

    return RenderedAudio(
        job_id=job_id,
        file_name=file_name,
        file_path=file_path,
        duration_seconds=duration_seconds,
        sample_rate=sample_rate,
        message=f"Maestro Performance Pack rendered CPU backing master for {project_name}",
    )

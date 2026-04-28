from __future__ import annotations

import math
import os
import wave
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

try:
    import numpy as np
except Exception:  # pragma: no cover - fallback only for broken environments
    np = None  # type: ignore


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


def _soft_clip_np(values: Any) -> Any:
    if np is None:
        return values
    return np.tanh(values * 1.28) / np.tanh(1.28)


def _add_pluck(buffer: Any, sample_rate: int, start: float, dur: float, freq: float, gain: float, pan_left: float, pan_right: float) -> None:
    if np is None:
        return
    start_i = max(0, int(start * sample_rate))
    end_i = min(buffer.shape[0], int((start + dur) * sample_rate))
    if end_i <= start_i:
        return
    x = np.arange(end_i - start_i, dtype=np.float32) / float(sample_rate)
    env = np.exp(-x * 5.0) * np.minimum(1.0, x * 80.0)
    body = np.sin(2 * np.pi * freq * x)
    body += 0.42 * np.sin(2 * np.pi * freq * 2.01 * x)
    body += 0.18 * np.sin(2 * np.pi * freq * 3.0 * x)
    pick = np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 90.0) * 0.08
    y = (body * 0.72 + pick) * env * gain
    buffer[start_i:end_i, 0] += y * pan_left
    buffer[start_i:end_i, 1] += y * pan_right


def _add_bass(buffer: Any, sample_rate: int, start: float, dur: float, freq: float, gain: float) -> None:
    if np is None:
        return
    start_i = max(0, int(start * sample_rate))
    end_i = min(buffer.shape[0], int((start + dur) * sample_rate))
    if end_i <= start_i:
        return
    x = np.arange(end_i - start_i, dtype=np.float32) / float(sample_rate)
    env = np.exp(-x * 1.75) * np.minimum(1.0, x * 25.0)
    y = (np.sin(2 * np.pi * freq * x) + 0.28 * np.sin(2 * np.pi * freq * 2 * x)) * env * gain
    buffer[start_i:end_i, 0] += y
    buffer[start_i:end_i, 1] += y * 0.9


def _add_kick(buffer: Any, sample_rate: int, start: float, gain: float) -> None:
    if np is None:
        return
    dur = 0.35
    start_i = max(0, int(start * sample_rate))
    end_i = min(buffer.shape[0], int((start + dur) * sample_rate))
    if end_i <= start_i:
        return
    x = np.arange(end_i - start_i, dtype=np.float32) / float(sample_rate)
    freq = 70.0 - 28.0 * np.minimum(1.0, x / 0.18)
    phase = 2 * np.pi * np.cumsum(freq) / float(sample_rate)
    y = np.sin(phase) * np.exp(-x * 14.0) * gain
    buffer[start_i:end_i, 0] += y
    buffer[start_i:end_i, 1] += y


def _add_snare(buffer: Any, sample_rate: int, start: float, gain: float) -> None:
    if np is None:
        return
    dur = 0.28
    start_i = max(0, int(start * sample_rate))
    end_i = min(buffer.shape[0], int((start + dur) * sample_rate))
    if end_i <= start_i:
        return
    x = np.arange(end_i - start_i, dtype=np.float32) / float(sample_rate)
    noise = np.sin(2 * np.pi * 1731.0 * x) * np.sin(2 * np.pi * 913.0 * x)
    tone = np.sin(2 * np.pi * 185.0 * x) * 0.28
    y = (noise * 0.72 + tone) * np.exp(-x * 20.0) * gain
    buffer[start_i:end_i, 0] += y * 0.95
    buffer[start_i:end_i, 1] += y * 1.05


def _add_hat(buffer: Any, sample_rate: int, start: float, gain: float) -> None:
    if np is None:
        return
    dur = 0.08
    start_i = max(0, int(start * sample_rate))
    end_i = min(buffer.shape[0], int((start + dur) * sample_rate))
    if end_i <= start_i:
        return
    x = np.arange(end_i - start_i, dtype=np.float32) / float(sample_rate)
    noise = np.sin(2 * np.pi * 6380.0 * x) * np.sin(2 * np.pi * 9100.0 * x)
    y = noise * np.exp(-x * 65.0) * gain
    buffer[start_i:end_i, 0] += y * 0.65
    buffer[start_i:end_i, 1] += y * 1.15


def _add_pad_section(buffer: Any, sample_rate: int, start: float, end: float, chord: Tuple[int, int, int], gain: float) -> None:
    if np is None:
        return
    start_i = max(0, int(start * sample_rate))
    end_i = min(buffer.shape[0], int(end * sample_rate))
    if end_i <= start_i:
        return
    t = np.arange(start_i, end_i, dtype=np.float32) / float(sample_rate)
    y = np.zeros(end_i - start_i, dtype=np.float32)
    for note in chord:
        f = _midi_to_hz(note + 12)
        y += np.sin(2 * np.pi * f * t) * 0.18
        y += np.sin(2 * np.pi * f * 2 * t) * 0.04
    y *= gain
    buffer[start_i:end_i, 0] += y * 0.78
    buffer[start_i:end_i, 1] += y * 0.86


def _build_numpy_master(duration: float, sample_rate: int, bpm: int, key_root: int) -> Any:
    if np is None:
        raise RuntimeError("numpy is required for Maestro Performance Pack rendering")

    beat = 60.0 / max(60, min(220, bpm))
    bar = beat * 4.0
    bars = int(math.ceil(duration / bar))
    frames = int(sample_rate * duration)
    buffer = np.zeros((frames, 2), dtype=np.float32)

    for b in range(bars):
        bar_start = b * bar
        bar_end = min(duration, bar_start + bar)
        chord = _scale_chord(key_root, b, 3)
        bass_note = chord[0] - 12

        _add_pad_section(buffer, sample_rate, bar_start, bar_end, chord, 0.075)
        _add_kick(buffer, sample_rate, bar_start, 0.55)
        _add_kick(buffer, sample_rate, bar_start + beat * 2, 0.50)
        _add_snare(buffer, sample_rate, bar_start + beat, 0.22)
        _add_snare(buffer, sample_rate, bar_start + beat * 3, 0.22)

        for i in range(8):
            _add_hat(buffer, sample_rate, bar_start + beat * 0.5 * i, 0.055)
        for i in range(4):
            note = bass_note if i % 2 == 0 else bass_note + 7
            _add_bass(buffer, sample_rate, bar_start + beat * i, beat * 0.92, _midi_to_hz(int(note)), 0.38)
        for i in range(8):
            note = chord[i % 3] + 12
            _add_pluck(buffer, sample_rate, bar_start + beat * 0.5 * i + 0.015, beat * 0.48, _midi_to_hz(int(note)), 0.18, 1.08, 0.84)

    buffer = _soft_clip_np(buffer * 0.72)
    return buffer


def _apply_pedalboard_if_available(buffer: Any, sample_rate: int) -> Any:
    if np is None:
        return buffer
    try:
        from pedalboard import Pedalboard, Compressor, Gain, HighpassFilter, LowpassFilter, Reverb, Limiter
    except Exception:
        return buffer

    audio = np.asarray(buffer, dtype=np.float32).T
    board = Pedalboard([
        HighpassFilter(cutoff_frequency_hz=35),
        LowpassFilter(cutoff_frequency_hz=14500),
        Compressor(threshold_db=-18, ratio=2.8, attack_ms=3, release_ms=160),
        Reverb(room_size=0.18, damping=0.46, wet_level=0.07, dry_level=0.93),
        Gain(gain_db=1.8),
        Limiter(threshold_db=-1.0, release_ms=80),
    ])
    processed = board(audio, sample_rate).T
    return np.asarray(processed, dtype=np.float32)


def _write_wav(file_path: str, buffer: Any, sample_rate: int) -> None:
    if np is None:
        raise RuntimeError("numpy is required for WAV writing")
    clipped = np.clip(buffer, -0.98, 0.98)
    pcm = (clipped * 32767.0).astype('<i2')
    with wave.open(file_path, "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())


def render_performance_pack_audio(payload: Dict[str, Any], output_dir: str) -> RenderedAudio:
    os.makedirs(output_dir, exist_ok=True)
    plan = payload.get("plan") or {}
    project_name = payload.get("projectName") or plan.get("title") or "MaestroAI"
    bpm = int(plan.get("performanceBpm") or plan.get("sourceBpm") or 112)
    key = str(plan.get("recommendedKey") or plan.get("sourceKey") or "C")
    sample_rate = int(payload.get("sampleRate") or 44100)
    duration_seconds = float(payload.get("durationSeconds") or 16.0)
    duration_seconds = max(8.0, min(1800.0, duration_seconds))
    key_root = _key_root(key)

    job_id = f"performance_pack_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')}"
    file_name = f"{job_id}_{_safe_name(project_name)}.wav"
    file_path = os.path.join(output_dir, file_name)

    buffer = _build_numpy_master(duration_seconds, sample_rate, bpm, key_root)
    processed = _apply_pedalboard_if_available(buffer, sample_rate)
    _write_wav(file_path, processed, sample_rate)

    return RenderedAudio(
        job_id=job_id,
        file_name=file_name,
        file_path=file_path,
        duration_seconds=duration_seconds,
        sample_rate=sample_rate,
        message=f"Maestro Performance Pack rendered {duration_seconds:.0f}s CPU backing master for {project_name}",
    )

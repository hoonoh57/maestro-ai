from __future__ import annotations

import math
import os
import wave
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict


@dataclass
class RenderedAudio:
    job_id: str
    file_name: str
    file_path: str
    duration_seconds: float
    sample_rate: int
    message: str


def _safe_name(value: str) -> str:
    allowed = []
    for ch in value:
        if ch.isalnum() or ch in ('-', '_'):
            allowed.append(ch)
        elif ch.isspace():
            allowed.append('_')
    text = ''.join(allowed).strip('_')
    return text or 'maestro'


def render_mock_audio(payload: Dict[str, Any], output_dir: str) -> RenderedAudio:
    os.makedirs(output_dir, exist_ok=True)
    plan = payload.get('plan') or {}
    project_name = payload.get('projectName') or plan.get('title') or 'MaestroAI'
    bpm = int(plan.get('performanceBpm') or 110)
    sample_rate = int(payload.get('sampleRate') or 44100)
    duration_seconds = float(payload.get('durationSeconds') or 12.0)
    duration_seconds = max(4.0, min(30.0, duration_seconds))

    job_id = f"mock_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')}"
    file_name = f"{job_id}_{_safe_name(project_name)}.wav"
    file_path = os.path.join(output_dir, file_name)

    frames = int(sample_rate * duration_seconds)
    beat_hz = max(0.8, min(3.2, bpm / 60.0))

    with wave.open(file_path, 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        for i in range(frames):
            t = i / sample_rate
            beat_phase = (t * beat_hz) % 1.0
            kick_env = math.exp(-beat_phase * 13.0)
            kick = math.sin(2.0 * math.pi * 58.0 * t) * kick_env * 0.34
            bass = math.sin(2.0 * math.pi * 110.0 * t) * 0.24
            fifth = math.sin(2.0 * math.pi * 165.0 * t) * 0.12
            guitar = (
                math.sin(2.0 * math.pi * 220.0 * t) +
                math.sin(2.0 * math.pi * 330.0 * t) * 0.55 +
                math.sin(2.0 * math.pi * 440.0 * t) * 0.32
            ) * 0.13
            shimmer = math.sin(2.0 * math.pi * 880.0 * t) * 0.035
            groove = 0.62 + 0.38 * math.sin(2.0 * math.pi * beat_hz * t) ** 2
            sample = (kick + bass + fifth + guitar * groove + shimmer) * 0.85
            sample = max(-0.92, min(0.92, sample))
            left = int(sample * 32767)
            right = int((sample * 0.92 + guitar * 0.08) * 32767)
            wav.writeframesraw(left.to_bytes(2, 'little', signed=True) + right.to_bytes(2, 'little', signed=True))

    return RenderedAudio(
        job_id=job_id,
        file_name=file_name,
        file_path=file_path,
        duration_seconds=duration_seconds,
        sample_rate=sample_rate,
        message=f"Mock local Maestro Sound rendered for {project_name}",
    )

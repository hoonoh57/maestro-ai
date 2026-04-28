from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class RenderedAudio:
    job_id: str
    file_name: str
    file_path: str
    duration_seconds: float
    sample_rate: int
    message: str


def _env(name: str, default: str) -> str:
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        return default
    return value.strip()


def _ace_api_url() -> str:
    return _env("ACE_STEP_API_URL", "http://127.0.0.1:8001").rstrip("/")


def _timeout_seconds() -> float:
    raw = _env("ACE_STEP_TIMEOUT_SECONDS", "900")
    try:
        return max(30.0, float(raw))
    except ValueError:
        return 900.0


def _poll_interval_seconds() -> float:
    raw = _env("ACE_STEP_POLL_INTERVAL_SECONDS", "2.0")
    try:
        return max(0.5, float(raw))
    except ValueError:
        return 2.0


def _post_json(url: str, body: Dict[str, Any], timeout: float = 30.0) -> Dict[str, Any]:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw)


def _get_json(url: str, timeout: float = 30.0) -> Dict[str, Any]:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw)


def _download_file(url: str, out_path: str, timeout: float = 120.0) -> None:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        data = response.read()
    if len(data) <= 44:
        raise RuntimeError("ACE-Step returned an empty or invalid audio file.")
    with open(out_path, "wb") as fp:
        fp.write(data)


def _safe_name(value: str) -> str:
    allowed = []
    for ch in value:
        if ch.isalnum() or ch in ("-", "_"):
            allowed.append(ch)
        elif ch.isspace():
            allowed.append("_")
    text = "".join(allowed).strip("_")
    return text or "maestro"


def _extract_audio_path(job_payload: Dict[str, Any]) -> str:
    result = job_payload.get("result") or {}
    first = result.get("first_audio_path") or result.get("firstAudioPath")
    if isinstance(first, str) and first:
        return first
    paths = result.get("audio_paths") or result.get("audioPaths") or []
    if isinstance(paths, list) and paths:
        first_path = paths[0]
        if isinstance(first_path, str) and first_path:
            return first_path
    raise RuntimeError(f"ACE-Step job succeeded but no audio path was returned: {job_payload}")


def _build_caption(payload: Dict[str, Any]) -> str:
    plan = payload.get("plan") or {}
    prompt = plan.get("maestroSoundPrompt") or plan.get("renderPrompt") or ""
    title = plan.get("title") or payload.get("projectName") or "MaestroAI performance"
    goal = plan.get("goal") or "stage performance"
    if prompt:
        return str(prompt)
    return f"Performance-ready {goal} backing track for {title}, polished busking/stage master, clear groove, acoustic guitar, bass and drums."


def _build_lyrics(payload: Dict[str, Any]) -> str:
    # For backing/performance generation, default to instrumental. Later this can be
    # filled by a lyric/cue-sheet module when vocal generation is intentionally requested.
    return "[Instrumental]"


def _build_generate_body(payload: Dict[str, Any]) -> Dict[str, Any]:
    plan = payload.get("plan") or {}
    bpm = plan.get("performanceBpm") or plan.get("sourceBpm") or payload.get("bpm")
    keyscale = plan.get("recommendedKey") or plan.get("sourceKey") or "C"
    duration = payload.get("durationSeconds") or plan.get("duration") or 30

    try:
        bpm_int: Optional[int] = int(bpm) if bpm is not None else None
    except (TypeError, ValueError):
        bpm_int = None

    try:
        duration_float = max(10.0, min(240.0, float(duration)))
    except (TypeError, ValueError):
        duration_float = 30.0

    return {
        "caption": _build_caption(payload),
        "lyrics": _build_lyrics(payload),
        "vocal_language": "instrumental",
        "audio_format": "wav",
        "bpm": bpm_int,
        "key_scale": str(keyscale),
        "time_signature": "4/4",
        "audio_duration": duration_float,
        "duration": duration_float,
        "inference_steps": int(_env("ACE_STEP_INFERENCE_STEPS", "16")),
        "guidance_scale": float(_env("ACE_STEP_GUIDANCE_SCALE", "7.0")),
        "seed": int(_env("ACE_STEP_SEED", "-1")),
        "thinking": _env("ACE_STEP_THINKING", "true").lower() != "false",
    }


def render_ace_step_audio(payload: Dict[str, Any], output_dir: str) -> RenderedAudio:
    """Render music through a running ACE-Step REST API server.

    Expected external runtime:
      ACE-Step API server at ACE_STEP_API_URL, default http://127.0.0.1:8001

    Official flow:
      POST /v1/music/generate -> job_id
      GET  /v1/jobs/{job_id} until succeeded/failed
      GET  /v1/audio?path=... to download generated audio
    """
    os.makedirs(output_dir, exist_ok=True)
    base_url = _ace_api_url()
    timeout_total = _timeout_seconds()
    poll_interval = _poll_interval_seconds()

    try:
        _get_json(f"{base_url}/health", timeout=5.0)
    except Exception as exc:
        raise RuntimeError(
            f"ACE-Step API server is not reachable at {base_url}. "
            "Start ACE-Step API first, for example: start_api_server.bat or `uv run acestep-api`. "
            f"Original error: {exc}"
        ) from exc

    generate_body = _build_generate_body(payload)
    submit = _post_json(f"{base_url}/v1/music/generate", generate_body, timeout=30.0)
    job_id = submit.get("job_id") or submit.get("jobId")
    if not isinstance(job_id, str) or not job_id:
        raise RuntimeError(f"ACE-Step did not return a job_id: {submit}")

    deadline = time.time() + timeout_total
    last_status = "queued"
    job_payload: Dict[str, Any] = {}

    while time.time() < deadline:
        job_payload = _get_json(f"{base_url}/v1/jobs/{urllib.parse.quote(job_id)}", timeout=30.0)
        last_status = str(job_payload.get("status") or "unknown")
        if last_status == "succeeded":
            break
        if last_status == "failed":
            raise RuntimeError(f"ACE-Step job failed: {job_payload.get('error') or job_payload}")
        time.sleep(poll_interval)
    else:
        raise RuntimeError(f"ACE-Step job timed out after {timeout_total:.0f}s. Last status: {last_status}")

    audio_path = _extract_audio_path(job_payload)
    encoded_path = urllib.parse.quote(audio_path, safe="")
    download_url = f"{base_url}/v1/audio?path={encoded_path}"

    project_name = str(payload.get("projectName") or (payload.get("plan") or {}).get("title") or "MaestroAI")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    file_name = f"ace_step_{timestamp}_{_safe_name(project_name)}.wav"
    file_path = os.path.join(output_dir, file_name)
    _download_file(download_url, file_path, timeout=180.0)

    duration = payload.get("durationSeconds") or 0
    try:
        duration_seconds = float(duration)
    except (TypeError, ValueError):
        duration_seconds = 0.0

    sample_rate = payload.get("sampleRate") or 44100
    try:
        sample_rate_int = int(sample_rate)
    except (TypeError, ValueError):
        sample_rate_int = 44100

    return RenderedAudio(
        job_id=f"ace_step_{job_id}",
        file_name=file_name,
        file_path=file_path,
        duration_seconds=duration_seconds,
        sample_rate=sample_rate_int,
        message=f"ACE-Step Maestro Sound generated: {file_name}",
    )

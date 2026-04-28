from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from engines.mock_engine import render_mock_audio
from engines.ace_step_engine import render_ace_step_audio
from engines.performance_pack_engine import render_performance_pack_audio

APP_NAME = "MaestroAI Local Sound Server"
APP_VERSION = "0.3.0"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(title=APP_NAME, version=APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


class RenderRequest(BaseModel):
    projectId: str = ""
    projectName: str = "Untitled"
    engine: str = "performance_pack"
    sampleRate: int = Field(default=44100, ge=8000, le=96000)
    durationSeconds: float = Field(default=16.0, ge=1.0, le=1800.0)
    plan: Dict[str, Any] = Field(default_factory=dict)


class RenderResponse(BaseModel):
    jobId: str
    status: str
    engine: str
    fileName: str
    fileUrl: str
    mimeType: str
    durationSeconds: float
    sampleRate: int
    createdAt: str
    message: str


class SoundJobItem(BaseModel):
    fileName: str
    fileUrl: str
    metadataFileName: Optional[str] = None
    jobId: str = ""
    engine: str = "unknown"
    projectId: str = ""
    projectName: str = ""
    sourceTitle: str = ""
    sourceArtist: str = ""
    bpm: int = 0
    key: str = ""
    durationSeconds: float = 0
    sampleRate: int = 0
    createdAt: str = ""
    message: str = ""
    hasMetadata: bool = False


def _metadata_path(file_name: str) -> str:
    stem, _ = os.path.splitext(file_name)
    return os.path.join(OUTPUT_DIR, f"{stem}.json")


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _write_metadata(rendered: Any, request: RenderRequest, engine: str, created_at: str) -> None:
    plan = request.plan or {}
    metadata = {
        "schemaVersion": 1,
        "jobId": rendered.job_id,
        "fileName": rendered.file_name,
        "fileUrl": f"/outputs/{rendered.file_name}",
        "engine": engine,
        "projectId": request.projectId,
        "projectName": request.projectName,
        "sourceTitle": plan.get("title") or request.projectName,
        "sourceArtist": plan.get("artist") or "",
        "goal": plan.get("goal") or "",
        "bpm": _safe_int(plan.get("performanceBpm") or plan.get("sourceBpm"), 0),
        "key": str(plan.get("recommendedKey") or plan.get("sourceKey") or ""),
        "durationSeconds": rendered.duration_seconds,
        "sampleRate": rendered.sample_rate,
        "createdAt": created_at,
        "message": rendered.message,
    }
    with open(_metadata_path(rendered.file_name), "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)


def _read_metadata(file_name: str) -> Dict[str, Any]:
    path = _metadata_path(file_name)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except Exception:
        return {}
    return {}


def _job_item_from_file(file_name: str) -> SoundJobItem:
    meta = _read_metadata(file_name)
    path = os.path.join(OUTPUT_DIR, file_name)
    created = ""
    try:
        created = datetime.fromtimestamp(os.path.getmtime(path), timezone.utc).isoformat()
    except Exception:
        created = ""
    stem, _ = os.path.splitext(file_name)
    metadata_file = f"{stem}.json" if os.path.exists(_metadata_path(file_name)) else None
    return SoundJobItem(
        fileName=file_name,
        fileUrl=f"/outputs/{file_name}",
        metadataFileName=metadata_file,
        jobId=str(meta.get("jobId") or stem),
        engine=str(meta.get("engine") or "unknown"),
        projectId=str(meta.get("projectId") or ""),
        projectName=str(meta.get("projectName") or meta.get("sourceTitle") or ""),
        sourceTitle=str(meta.get("sourceTitle") or meta.get("projectName") or ""),
        sourceArtist=str(meta.get("sourceArtist") or ""),
        bpm=_safe_int(meta.get("bpm"), 0),
        key=str(meta.get("key") or ""),
        durationSeconds=_safe_float(meta.get("durationSeconds"), 0),
        sampleRate=_safe_int(meta.get("sampleRate"), 0),
        createdAt=str(meta.get("createdAt") or created),
        message=str(meta.get("message") or ""),
        hasMetadata=bool(meta),
    )


@app.get("/api/sound/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "name": APP_NAME,
        "version": APP_VERSION,
        "engines": ["performance_pack", "ace_step", "mock", "local_ai", "external_runtime"],
        "defaultEngine": "performance_pack",
        "outputBaseUrl": "/outputs",
    }


@app.post("/api/sound/render", response_model=RenderResponse)
def render_sound(request: RenderRequest) -> RenderResponse:
    engine = (request.engine or "performance_pack").strip().lower()
    payload = request.model_dump()

    try:
        if engine == "performance_pack":
            rendered = render_performance_pack_audio(payload, OUTPUT_DIR)
        elif engine in ("mock", "local_ai", "external_runtime"):
            rendered = render_mock_audio(payload, OUTPUT_DIR)
        elif engine == "ace_step":
            rendered = render_ace_step_audio(payload, OUTPUT_DIR)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown sound engine: {engine}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    created_at = datetime.now(timezone.utc).isoformat()
    _write_metadata(rendered, request, engine, created_at)

    return RenderResponse(
        jobId=rendered.job_id,
        status="ready",
        engine=engine,
        fileName=rendered.file_name,
        fileUrl=f"/outputs/{rendered.file_name}",
        mimeType="audio/wav",
        durationSeconds=rendered.duration_seconds,
        sampleRate=rendered.sample_rate,
        createdAt=created_at,
        message=rendered.message,
    )


@app.get("/api/sound/jobs")
def list_jobs() -> Dict[str, Any]:
    files: List[str] = []
    for name in sorted(os.listdir(OUTPUT_DIR)):
        if name.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")):
            files.append(name)
    items = [_job_item_from_file(name) for name in files]
    items.sort(key=lambda item: item.createdAt or item.fileName, reverse=True)
    return {"files": files, "items": [item.model_dump() for item in items]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8765, reload=False)

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from engines.mock_engine import render_mock_audio
from engines.ace_step_engine import render_ace_step_audio

APP_NAME = "MaestroAI Local Sound Server"
APP_VERSION = "0.1.0"
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
    engine: str = "mock"
    sampleRate: int = Field(default=44100, ge=8000, le=96000)
    durationSeconds: float = Field(default=12.0, ge=1.0, le=300.0)
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


@app.get("/api/sound/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "name": APP_NAME,
        "version": APP_VERSION,
        "engines": ["mock", "ace_step"],
        "outputBaseUrl": "/outputs",
    }


@app.post("/api/sound/render", response_model=RenderResponse)
def render_sound(request: RenderRequest) -> RenderResponse:
    engine = (request.engine or "mock").strip().lower()
    payload = request.model_dump()

    try:
      if engine in ("mock", "local_ai", "external_runtime"):
          rendered = render_mock_audio(payload, OUTPUT_DIR)
      elif engine == "ace_step":
          rendered = render_ace_step_audio(payload, OUTPUT_DIR)
      else:
          raise HTTPException(status_code=400, detail=f"Unknown sound engine: {engine}")
    except HTTPException:
      raise
    except Exception as exc:
      raise HTTPException(status_code=500, detail=str(exc)) from exc

    return RenderResponse(
        jobId=rendered.job_id,
        status="ready",
        engine=engine,
        fileName=rendered.file_name,
        fileUrl=f"/outputs/{rendered.file_name}",
        mimeType="audio/wav",
        durationSeconds=rendered.duration_seconds,
        sampleRate=rendered.sample_rate,
        createdAt=datetime.now(timezone.utc).isoformat(),
        message=rendered.message,
    )


@app.get("/api/sound/jobs")
def list_jobs() -> Dict[str, List[str]]:
    files = []
    for name in sorted(os.listdir(OUTPUT_DIR)):
        if name.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")):
            files.append(name)
    return {"files": files}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8765, reload=True)

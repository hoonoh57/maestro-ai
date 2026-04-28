from __future__ import annotations

from typing import Any, Dict


def render_ace_step_audio(payload: Dict[str, Any], output_dir: str):
    """
    ACE-Step integration slot.

    This function is intentionally explicit: the server is already wired for a real
    AI music engine, but the heavy model dependency is not bundled here. Once
    ACE-Step is installed locally, replace this function body with the model call
    that writes a WAV/MP3 file into output_dir and returns a RenderedAudio object.
    """
    raise RuntimeError(
        "ACE-Step engine is not installed yet. Use engine='mock' for server validation, "
        "then install ACE-Step and implement render_ace_step_audio()."
    )

#!/usr/bin/env python3
"""
Kling AI video generation driver for Glosemester SoMe videos.

Usage:
  python3 driver.py text "En lærer deler QR-kode på tavlen, elever scanner og svarer"
  python3 driver.py image path/to/image.jpg "Animér denne scenen"
  python3 driver.py jwt-test         # Test JWT generation (no API call)
  python3 driver.py presets          # List Glosemester SoMe presets

Required env vars: KLING_ACCESS_KEY, KLING_SECRET_KEY
Optional: KLING_MODEL (default: kling-v2-master), KLING_ASPECT (default: 9:16)
"""

import sys
import os
import json
import time
import base64
import hashlib
import hmac
import struct
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ── Load .env from project root ──────────────────────────────────────────────
def load_env():
    for candidate in [Path(__file__).parent / ".env",
                      Path(__file__).parent.parent.parent.parent / ".env"]:
        if candidate.exists():
            for line in candidate.read_text().splitlines():
                if line.strip() and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip().strip('"\''))

load_env()

ACCESS_KEY = os.environ.get("KLING_ACCESS_KEY", "")
SECRET_KEY = os.environ.get("KLING_SECRET_KEY", "")
BASE_URL = "https://api.klingai.com"
MODEL = os.environ.get("KLING_MODEL", "kling-v2-master")
ASPECT = os.environ.get("KLING_ASPECT", "9:16")
OUTPUT_DIR = Path(__file__).parent / "output"

# ── JWT (pure stdlib, no PyJWT dependency) ────────────────────────────────────
def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_jwt(access_key: str, secret_key: str, ttl: int = 1800) -> str:
    now = int(time.time())
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = b64url(json.dumps({
        "iss": access_key,
        "exp": now + ttl,
        "nbf": now - 5,
    }).encode())
    msg = f"{header}.{payload}".encode()
    sig = hmac.new(secret_key.encode(), msg, hashlib.sha256).digest()
    return f"{header}.{payload}.{b64url(sig)}"

# ── HTTP helper ───────────────────────────────────────────────────────────────
def api(method: str, path: str, body=None) -> dict:
    token = make_jwt(ACCESS_KEY, SECRET_KEY)
    url = BASE_URL + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "glosemester-video-driver/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body_text}") from e

# ── Poll until done ───────────────────────────────────────────────────────────
def poll(endpoint_prefix: str, task_id: str, timeout: int = 600) -> dict:
    deadline = time.time() + timeout
    interval = 5
    print(f"  Polling task {task_id} ", end="", flush=True)
    while time.time() < deadline:
        resp = api("GET", f"/v1/videos/{endpoint_prefix}/{task_id}")
        status = resp.get("data", {}).get("task_status", "unknown")
        print(".", end="", flush=True)
        if status == "succeed":
            print(" done")
            return resp["data"]["task_result"]
        if status == "failed":
            print(" FAILED")
            raise RuntimeError(f"Task failed: {resp}")
        time.sleep(interval)
    raise TimeoutError(f"Task {task_id} timed out after {timeout}s")

# ── Download video ────────────────────────────────────────────────────────────
def download(url: str, filename: str) -> Path:
    OUTPUT_DIR.mkdir(exist_ok=True)
    dest = OUTPUT_DIR / filename
    urllib.request.urlretrieve(url, dest)
    return dest

# ── Commands ──────────────────────────────────────────────────────────────────
def cmd_jwt_test():
    if not ACCESS_KEY or not SECRET_KEY:
        print("JWT generation test (no credentials set — using dummy values):")
        token = make_jwt("dummy-access-key", "dummy-secret-key")
    else:
        print("JWT generation test (using real credentials):")
        token = make_jwt(ACCESS_KEY, SECRET_KEY)
    parts = token.split(".")
    header = json.loads(base64.urlsafe_b64decode(parts[0] + "=="))
    payload = json.loads(base64.urlsafe_b64decode(parts[1] + "=="))
    print(f"  Header:  {header}")
    print(f"  Payload: {payload}")
    exp_dt = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    print(f"  Expires: {exp_dt.isoformat()}")
    print(f"  Token:   {token[:40]}...")
    print("JWT generation: OK")

def cmd_presets():
    presets = [
        {
            "name": "reels-demo",
            "prompt": "En norsk lærer viser GloseMester-appen på en iPad i et lyst klasserom. "
                      "Elever ser engasjert på tavlen. Warm tones, modern school setting.",
            "aspect_ratio": "9:16",
            "duration": "5",
            "model_name": "kling-v2-master",
            "mode": "pro",
        },
        {
            "name": "reels-gamification",
            "prompt": "Animated vocabulary cards flying through the air, glowing stars, "
                      "trophy icons, progress bar filling up. Colorful and energetic. "
                      "Orange and lavender color palette.",
            "aspect_ratio": "9:16",
            "duration": "5",
            "model_name": "kling-v2-master",
            "mode": "std",
        },
        {
            "name": "fb-ad-qr",
            "prompt": "Close-up of a teacher's hand holding a phone showing a QR code. "
                      "Students in background scanning with phones. Clean, bright classroom.",
            "aspect_ratio": "16:9",
            "duration": "5",
            "model_name": "kling-v2-master",
            "mode": "std",
        },
        {
            "name": "story-achievement",
            "prompt": "Animated achievement badge unlocking with confetti explosion. "
                      "Text overlay: 'Fra glose til mester'. Orange sunset palette.",
            "aspect_ratio": "9:16",
            "duration": "5",
            "model_name": "kling-v2-5-turbo",
            "mode": "std",
        },
    ]
    print("Glosemester SoMe video presets:\n")
    for p in presets:
        print(f"  [{p['name']}]  {p['aspect_ratio']}  {p['duration']}s  {p['model_name']}/{p['mode']}")
        print(f"    {p['prompt'][:80]}...")
        print()
    print("Run a preset:")
    print("  python3 driver.py preset reels-demo")

def cmd_text(prompt: str, aspect: str = None, duration: str = "5", mode: str = "std",
             model: str = None, negative: str = ""):
    if not ACCESS_KEY or not SECRET_KEY:
        raise SystemExit("ERROR: Set KLING_ACCESS_KEY and KLING_SECRET_KEY in .env")
    payload = {
        "model_name": model or MODEL,
        "prompt": prompt,
        "duration": duration,
        "aspect_ratio": aspect or ASPECT,
        "mode": mode,
    }
    if negative:
        payload["negative_prompt"] = negative
    print(f"Creating text-to-video task...")
    print(f"  Model:  {payload['model_name']}")
    print(f"  Aspect: {payload['aspect_ratio']}  Duration: {payload['duration']}s  Mode: {payload['mode']}")
    print(f"  Prompt: {prompt[:80]}{'...' if len(prompt)>80 else ''}")
    resp = api("POST", "/v1/videos/text2video", payload)
    if resp.get("code") != 0:
        raise RuntimeError(f"API error: {resp}")
    task_id = resp["data"]["task_id"]
    print(f"  Task ID: {task_id}")
    result = poll("text2video", task_id)
    videos = result.get("videos", [])
    if not videos:
        raise RuntimeError(f"No videos in result: {result}")
    video_url = videos[0]["url"]
    ts = int(time.time())
    filename = f"glosemester_{ts}.mp4"
    path = download(video_url, filename)
    print(f"  Saved: {path}")
    return path

def cmd_image(image_path: str, prompt: str, duration: str = "5", mode: str = "std"):
    if not ACCESS_KEY or not SECRET_KEY:
        raise SystemExit("ERROR: Set KLING_ACCESS_KEY and KLING_SECRET_KEY in .env")
    img_data = Path(image_path).read_bytes()
    img_b64 = base64.b64encode(img_data).decode()
    payload = {
        "model_name": MODEL,
        "image": img_b64,
        "prompt": prompt,
        "duration": duration,
        "mode": mode,
    }
    print(f"Creating image-to-video task from {image_path}...")
    resp = api("POST", "/v1/videos/image2video", payload)
    if resp.get("code") != 0:
        raise RuntimeError(f"API error: {resp}")
    task_id = resp["data"]["task_id"]
    print(f"  Task ID: {task_id}")
    result = poll("image2video", task_id)
    videos = result.get("videos", [])
    video_url = videos[0]["url"]
    ts = int(time.time())
    filename = f"glosemester_img2vid_{ts}.mp4"
    path = download(video_url, filename)
    print(f"  Saved: {path}")
    return path

def cmd_preset(name: str):
    presets = {
        "reels-demo": {
            "prompt": "En norsk lærer viser GloseMester-appen på en iPad i et lyst klasserom. "
                      "Elever ser engasjert på tavlen. Warm tones, modern school setting.",
            "aspect_ratio": "9:16", "duration": "5",
            "model_name": "kling-v2-master", "mode": "pro",
        },
        "reels-gamification": {
            "prompt": "Animated vocabulary cards flying through the air, glowing stars, "
                      "trophy icons, progress bar filling up. Orange and lavender palette.",
            "aspect_ratio": "9:16", "duration": "5",
            "model_name": "kling-v2-master", "mode": "std",
        },
        "fb-ad-qr": {
            "prompt": "Close-up of a teacher's hand holding a phone showing a QR code. "
                      "Students in background scanning with phones. Clean bright classroom.",
            "aspect_ratio": "16:9", "duration": "5",
            "model_name": "kling-v2-master", "mode": "std",
        },
        "story-achievement": {
            "prompt": "Animated achievement badge unlocking with confetti explosion. "
                      "Text: Fra glose til mester. Orange sunset palette.",
            "aspect_ratio": "9:16", "duration": "5",
            "model_name": "kling-v2-5-turbo", "mode": "std",
        },
    }
    if name not in presets:
        raise SystemExit(f"Unknown preset '{name}'. Run: python3 driver.py presets")
    p = presets[name]
    return cmd_text(
        prompt=p["prompt"],
        aspect=p["aspect_ratio"],
        duration=p["duration"],
        mode=p["mode"],
        model=p["model_name"],
    )

# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return
    cmd = args[0]
    if cmd == "jwt-test":
        cmd_jwt_test()
    elif cmd == "presets":
        cmd_presets()
    elif cmd == "text":
        if len(args) < 2:
            raise SystemExit("Usage: driver.py text <prompt> [aspect] [duration] [mode]")
        prompt = args[1]
        aspect = args[2] if len(args) > 2 else None
        duration = args[3] if len(args) > 3 else "5"
        mode = args[4] if len(args) > 4 else "std"
        cmd_text(prompt, aspect, duration, mode)
    elif cmd == "image":
        if len(args) < 3:
            raise SystemExit("Usage: driver.py image <image_path> <prompt> [duration] [mode]")
        cmd_image(args[1], args[2],
                  duration=args[3] if len(args) > 3 else "5",
                  mode=args[4] if len(args) > 4 else "std")
    elif cmd == "preset":
        if len(args) < 2:
            raise SystemExit("Usage: driver.py preset <name>")
        cmd_preset(args[1])
    else:
        raise SystemExit(f"Unknown command: {cmd}")

if __name__ == "__main__":
    main()

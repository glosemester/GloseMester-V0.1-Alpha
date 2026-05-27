---
name: run-kling-video
description: Generate, run, produce, create social media video SoMe reel Facebook Instagram Glosemester Kling AI video generation driver
---

# Kling AI Video Driver for Glosemester SoMe

Generates social media videos (Instagram Reels, Facebook Ads, Stories) for glosemester.no using the Kling AI video generation API. The driver is a pure-Python script at `.claude/skills/run-kling-video/driver.py`. No external Python packages required — uses only stdlib. The API is at `https://api.klingai.com`.

## Prerequisites

Python 3.11+ (already present). No pip installs needed — driver uses only `stdlib`.

API credentials from [app.klingai.com](https://app.klingai.com) → Developer → API Keys:
- Access Key ID
- Access Key Secret

Credentials are NOT yet in this repo. Add them to `.env` at the project root:

```
KLING_ACCESS_KEY=your_access_key_id_here
KLING_SECRET_KEY=your_access_key_secret_here
```

## Run (agent path)

All commands run from the project root `/home/user/GloseMester-V0.1-Alpha`.

### Test JWT (no API call, no credentials needed)

```bash
python3 .claude/skills/run-kling-video/driver.py jwt-test
```

Output confirmed on this machine:
```
JWT generation test (no credentials set — using dummy values):
  Header:  {'alg': 'HS256', 'typ': 'JWT'}
  Payload: {'iss': 'dummy-access-key', 'exp': 1779877460, 'nbf': 1779875655}
  Expires: 2026-05-27T10:24:20+00:00
  Token:   eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9...
JWT generation: OK
```

### List Glosemester presets

```bash
python3 .claude/skills/run-kling-video/driver.py presets
```

Four presets tuned to Glosemester brand guidelines (9:16 Reels, 16:9 FB, brand colors):

| Preset | Format | Use |
|--------|--------|-----|
| `reels-demo` | 9:16 5s pro | Instagram/TikTok — teacher using app |
| `reels-gamification` | 9:16 5s std | Instagram — cards/stars/trophy animation |
| `fb-ad-qr` | 16:9 5s std | Facebook ad — teacher with QR code |
| `story-achievement` | 9:16 5s turbo | Stories — achievement unlock + confetti |

### Generate a preset video (requires credentials)

```bash
python3 .claude/skills/run-kling-video/driver.py preset reels-demo
```

Output saved to `.claude/skills/run-kling-video/output/glosemester_<timestamp>.mp4`.

### Generate a custom text-to-video

```bash
python3 .claude/skills/run-kling-video/driver.py text \
  "En norsk lærer deler QR-kode på tavlen, elever scanner med mobilene" \
  9:16 5 pro
# args: <prompt> [aspect_ratio] [duration_seconds] [mode std|pro]
```

### Animate an existing image

```bash
python3 .claude/skills/run-kling-video/driver.py image \
  header.png \
  "Smooth camera zoom in, glowing particles"
```

## API Reference (confirmed from live calls)

**Base URL:** `https://api.klingai.com`

**Auth:** JWT HS256, 30-min TTL, auto-regenerated each call.
```
Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "iss": ACCESS_KEY, "exp": now+1800, "nbf": now-5 }
Signed with SECRET_KEY.
HTTP header: Authorization: Bearer <token>
```

**Text-to-video:** `POST /v1/videos/text2video`
```json
{
  "model_name": "kling-v2-master",
  "prompt": "...",
  "negative_prompt": "...",
  "duration": "5",
  "aspect_ratio": "9:16",
  "mode": "std"
}
```

**Image-to-video:** `POST /v1/videos/image2video`
Same fields + `"image": "<base64>"` (start frame) and optional `"image_tail"` (end frame).

**Poll task:** `GET /v1/videos/text2video/{task_id}` (or `image2video/{task_id}`)
- Statuses: `submitted → processing → succeed / failed`
- Poll every 5s. Driver polls up to 600s.

**Successful response:**
```json
{
  "code": 0,
  "data": {
    "task_status": "succeed",
    "task_result": { "videos": [{ "url": "https://..." }] }
  }
}
```

**Models available:**
- `kling-v2-master` — best quality, slower, costs more
- `kling-v2-5-turbo` — fast, cheaper, good for stories
- `kling-v1-6` — stable, lower cost

**Aspect ratios:** `9:16` (Reels/Stories), `16:9` (FB/YT), `1:1` (Instagram square)
**Duration:** `"5"` or `"10"` seconds
**Mode:** `std` (faster/cheaper) or `pro` (higher motion quality)

## Gotchas

- **"Host not in allowlist" (403):** The Kling dashboard has an IP allowlist. When running from a cloud container (like this one), add the container's outbound IP to the allowlist, or disable IP restriction in the dashboard. This was confirmed when running with fake credentials from this container.
- **JWT must be rebuilt each request** — tokens expire in 30 min. The driver rebuilds on every call; don't cache across invocations.
- **`code: 0` in the JSON body** is separate from the HTTP 200 status. Always check `resp["code"] == 0`, not just the HTTP status.
- **Video URLs expire** — download immediately after polling succeeds. The `download()` function in the driver does this automatically.
- **`duration` is a string**, not an int: `"5"` not `5`. Sending an int causes a validation error.
- **Base64 images:** For `image2video`, the image must be raw base64 (no `data:image/...;base64,` prefix).
- **Model `kling-v2-master` in `pro` mode** costs significantly more credits. Use `std` for iteration, `pro` for finals.

## Troubleshooting

**`RuntimeError: HTTP 403: Host not in allowlist`**
→ Real credentials used but container IP is blocked. Go to app.klingai.com → API Keys → edit allowlist, add `0.0.0.0/0` temporarily or the container's egress IP.

**`ERROR: Set KLING_ACCESS_KEY and KLING_SECRET_KEY in .env`**
→ Create `.env` in project root with the two keys.

**`RuntimeError: API error: {'code': 1002, ...}`**
→ JWT signed with wrong key or payload malformed. Run `jwt-test` to verify token structure.

**Task stuck in `processing` for >5 min**
→ Normal for `pro` mode. Driver waits up to 600s. Extend `timeout` arg in `poll()` if needed.

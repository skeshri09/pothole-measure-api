# Pothole Measurement API

A small full-stack tool that converts a pothole **bounding box (in pixels)** into an **estimated real-world size** (width, length, area) using a pinhole-camera model.

It is the measurement step of my MSc dissertation on pothole detection
([pothole-detection-deep-learning](https://github.com/skeshri09/pothole-detection-deep-learning)),
rebuilt as a tested web service with a browser front end.

- **Backend:** Python, FastAPI, Pydantic (input validation), pytest
- **Frontend:** React (Vite), Vitest
- **Packaging / CI:** Docker (multi-stage build), GitHub Actions

## What it does

Open the app, upload a road photo (or use the built-in demo image), drag a box around a pothole, adjust the camera settings, and the estimated size updates live. The same calculation is available as a JSON API.

## How the estimate works

The camera is assumed to look straight down at a flat road from a known height. Similar triangles then convert pixels to centimetres:

```
focal_px = (focal_length_mm / 10) * image_width_px / sensor_width_cm
real_cm  = pixels * camera_height_cm / focal_px
```

Defaults: camera height 90 cm, focal length 3.6 mm, sensor width 2.4 cm (the values from my dissertation).

> **Calibration note:** estimated sizes scale linearly with `sensor_width_cm`. The defaults match the dissertation notebook; set the sensor width from your own camera's datasheet for real use.

## Limitations

- This is an **estimate**, not a measurement: it assumes a top-down view of a flat road and a calibrated camera.
- It has **not been validated against ground-truth measurements**.
- Real dashcam footage is usually at an angle, so results on such images will be inaccurate.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/defaults` | Default camera settings |
| POST | `/api/measure` | Estimate real-world size from a pixel box |

Interactive docs are served at `/docs`.

```bash
curl -X POST http://localhost:8000/api/measure \
  -H "Content-Type: application/json" \
  -d '{"bbox": [200, 260, 330, 340], "image_width_px": 512, "image_height_px": 512}'
```

```json
{
  "width_cm": 152.34,
  "length_cm": 93.75,
  "area_cm2": 14282.23,
  "focal_length_px": 76.8,
  "pixel_width": 130.0,
  "pixel_height": 80.0,
  "notes": ["Assumes the camera points straight down at a flat road from the given height.",
            "Estimate only: not validated against ground-truth measurements."]
}
```

Requests are validated: the box must have `xmax > xmin` and `ymax > ymin`, lie inside the image, and camera settings must be positive and within sensible limits (otherwise the API returns `422` with a clear message).

## Run it

**With Docker** (serves the API and the built React app together):

```bash
docker build -t pothole-measure-api .
docker run -p 8000:8000 pothole-measure-api
# open http://localhost:8000
```

**For development** (two terminals):

```bash
# backend
cd backend
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000

# frontend
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api to :8000
```

## Tests

```bash
cd backend  && pytest -q      # API, validation and measurement tests
cd frontend && npm test       # box-drawing geometry helpers
```

The backend tests include a check that the formula matches the original `estimate_real_dimensions` function from the dissertation notebook when run with the notebook's own constants.

GitHub Actions (`.github/workflows/ci.yml`) runs both test suites, builds the front end and builds the Docker image on every push and pull request.

## Project structure

```
backend/    FastAPI app (app/), tests (tests/)
frontend/   React + Vite app (src/), geometry tests (src/test/)
Dockerfile  Multi-stage build: Node builds the UI, Python serves API + UI
```

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .measure import (
    DEFAULT_CAMERA_HEIGHT_CM,
    DEFAULT_FOCAL_LENGTH_MM,
    DEFAULT_SENSOR_WIDTH_CM,
    estimate_dimensions,
)
from .schemas import Defaults, MeasureRequest, MeasureResponse

NOTES = [
    "Assumes the camera points straight down at a flat road from the given height.",
    "Estimate only: not validated against ground-truth measurements.",
]

app = FastAPI(
    title="Pothole Measurement API",
    version="1.0.0",
    description="Converts a pothole bounding box (pixels) into an estimated real-world size "
    "using a pinhole-camera model.",
)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/defaults", response_model=Defaults, tags=["meta"])
def defaults() -> Defaults:
    return Defaults(
        camera_height_cm=DEFAULT_CAMERA_HEIGHT_CM,
        focal_length_mm=DEFAULT_FOCAL_LENGTH_MM,
        sensor_width_cm=DEFAULT_SENSOR_WIDTH_CM,
    )


@app.post("/api/measure", response_model=MeasureResponse, tags=["measure"])
def measure(req: MeasureRequest) -> MeasureResponse:
    d = estimate_dimensions(
        req.bbox,
        image_width_px=req.image_width_px,
        camera_height_cm=req.camera_height_cm,
        focal_length_mm=req.focal_length_mm,
        sensor_width_cm=req.sensor_width_cm,
    )
    return MeasureResponse(
        width_cm=round(d.width_cm, 2),
        length_cm=round(d.length_cm, 2),
        area_cm2=round(d.area_cm2, 2),
        focal_length_px=round(d.focal_length_px, 2),
        pixel_width=d.pixel_width,
        pixel_height=d.pixel_height,
        notes=NOTES,
    )


# In the Docker image the built React app is copied to backend/static and served from "/".
_static = Path(__file__).resolve().parent.parent / "static"
if _static.is_dir():
    app.mount("/", StaticFiles(directory=_static, html=True), name="frontend")

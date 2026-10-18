import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID = {
    "bbox": [200, 260, 330, 340],
    "image_width_px": 512,
    "image_height_px": 512,
}


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json() == {"status": "ok"}


def test_defaults_are_the_documented_constants():
    r = client.get("/api/defaults")
    assert r.json() == {"camera_height_cm": 90.0, "focal_length_mm": 3.6, "sensor_width_cm": 2.4}


def test_measure_with_defaults():
    r = client.post("/api/measure", json=VALID)
    assert r.status_code == 200
    body = r.json()
    assert body["width_cm"] == pytest.approx(130 * 90 / 76.8, abs=0.01)
    assert body["length_cm"] == pytest.approx(80 * 90 / 76.8, abs=0.01)
    assert body["area_cm2"] == pytest.approx(body["width_cm"] * body["length_cm"], rel=0.01)
    assert body["focal_length_px"] == pytest.approx(76.8)
    assert body["notes"]


def test_measure_uses_custom_camera_settings():
    r = client.post("/api/measure", json={**VALID, "camera_height_cm": 180})
    assert r.json()["width_cm"] == pytest.approx(2 * 130 * 90 / 76.8, abs=0.01)


@pytest.mark.parametrize(
    "patch",
    [
        {"bbox": [300, 260, 200, 340]},          # xmax < xmin
        {"bbox": [200, 340, 330, 260]},          # ymax < ymin
        {"bbox": [-5, 10, 100, 100]},            # outside image
        {"bbox": [0, 0, 600, 100]},              # wider than image
        {"bbox": [1, 2, 3]},                     # wrong length
        {"camera_height_cm": 0},
        {"camera_height_cm": -10},
        {"focal_length_mm": 0},
        {"sensor_width_cm": 0},
        {"image_width_px": 0},
    ],
)
def test_invalid_input_is_rejected(patch):
    r = client.post("/api/measure", json={**VALID, **patch})
    assert r.status_code == 422


def test_missing_bbox_is_rejected():
    assert client.post("/api/measure", json={"image_width_px": 512, "image_height_px": 512}).status_code == 422

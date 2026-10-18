"""Pinhole-camera size estimation.

This is the measurement step from my MSc dissertation on pothole detection
(pothole_detection.ipynb, ``estimate_real_dimensions``). A detection model
predicts a bounding box in pixels; similar triangles then convert the box into
centimetres, assuming the camera looks straight down at a flat road from a
known height.

    focal_px = (focal_length_mm / 10) * image_width_px / sensor_width_cm
    real_cm  = pixels * camera_height_cm / focal_px
"""

from dataclasses import dataclass

# Defaults. Camera height (90 cm) and focal length (3.6 mm) are the values used in the dissertation.
# The dissertation notebook and report used a sensor width of 2.4 cm; this API defaults to 0.24 cm
# (a 2.4 mm sensor). Estimated sizes scale linearly with sensor width, so the two settings differ by
# a factor of 10. Set sensor_width_cm from your own camera's datasheet.
DEFAULT_CAMERA_HEIGHT_CM = 90.0
DEFAULT_FOCAL_LENGTH_MM = 3.6
DEFAULT_SENSOR_WIDTH_CM = 0.24


@dataclass(frozen=True)
class Dimensions:
    width_cm: float
    length_cm: float
    area_cm2: float
    focal_length_px: float
    pixel_width: float
    pixel_height: float


def focal_length_px(focal_length_mm: float, image_width_px: float, sensor_width_cm: float) -> float:
    """Focal length expressed in pixels (focal length in cm scaled by pixels per cm of sensor)."""
    return (focal_length_mm / 10) * image_width_px / sensor_width_cm


def estimate_dimensions(
    bbox: tuple[float, float, float, float],
    image_width_px: float,
    camera_height_cm: float = DEFAULT_CAMERA_HEIGHT_CM,
    focal_length_mm: float = DEFAULT_FOCAL_LENGTH_MM,
    sensor_width_cm: float = DEFAULT_SENSOR_WIDTH_CM,
) -> Dimensions:
    """Convert a pixel bounding box ``(xmin, ymin, xmax, ymax)`` into real-world size."""
    xmin, ymin, xmax, ymax = bbox
    pixel_w = max(xmax - xmin, 1.0)  # same 1 px floor as the dissertation code
    pixel_h = max(ymax - ymin, 1.0)

    f_px = focal_length_px(focal_length_mm, image_width_px, sensor_width_cm)
    width_cm = pixel_w * camera_height_cm / f_px
    length_cm = pixel_h * camera_height_cm / f_px
    return Dimensions(
        width_cm=width_cm,
        length_cm=length_cm,
        area_cm2=width_cm * length_cm,
        focal_length_px=f_px,
        pixel_width=pixel_w,
        pixel_height=pixel_h,
    )

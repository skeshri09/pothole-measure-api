from pydantic import BaseModel, Field, model_validator

from .measure import (
    DEFAULT_CAMERA_HEIGHT_CM,
    DEFAULT_FOCAL_LENGTH_MM,
    DEFAULT_SENSOR_WIDTH_CM,
)


class MeasureRequest(BaseModel):
    bbox: tuple[float, float, float, float] = Field(
        description="Bounding box in pixels: (xmin, ymin, xmax, ymax)."
    )
    image_width_px: int = Field(gt=0, le=20000, description="Width of the image the box refers to.")
    image_height_px: int = Field(gt=0, le=20000, description="Height of the image the box refers to.")
    camera_height_cm: float = Field(
        default=DEFAULT_CAMERA_HEIGHT_CM, gt=0, le=1000,
        description="Height of the camera above the road surface, in cm.",
    )
    focal_length_mm: float = Field(
        default=DEFAULT_FOCAL_LENGTH_MM, gt=0, le=100, description="Lens focal length in mm."
    )
    sensor_width_cm: float = Field(
        default=DEFAULT_SENSOR_WIDTH_CM, gt=0, le=10, description="Camera sensor width in cm."
    )

    @model_validator(mode="after")
    def check_bbox(self) -> "MeasureRequest":
        xmin, ymin, xmax, ymax = self.bbox
        if xmax <= xmin or ymax <= ymin:
            raise ValueError("bbox must satisfy xmax > xmin and ymax > ymin")
        if xmin < 0 or ymin < 0 or xmax > self.image_width_px or ymax > self.image_height_px:
            raise ValueError("bbox must lie inside the image")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "bbox": [200, 260, 330, 340],
                    "image_width_px": 512,
                    "image_height_px": 512,
                    "camera_height_cm": 90,
                    "focal_length_mm": 3.6,
                    "sensor_width_cm": 2.4,
                }
            ]
        }
    }


class MeasureResponse(BaseModel):
    width_cm: float
    length_cm: float
    area_cm2: float
    focal_length_px: float
    pixel_width: float
    pixel_height: float
    notes: list[str]


class Defaults(BaseModel):
    camera_height_cm: float
    focal_length_mm: float
    sensor_width_cm: float

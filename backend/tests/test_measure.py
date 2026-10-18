import math

import pytest

from app.measure import estimate_dimensions, focal_length_px


def reference_notebook_version(pred_bbox, img_size=512,
                               camera_distance_cm=90, sensor_width_cm=2.4, focal_length_mm=3.6):
    """Copy of estimate_real_dimensions from the dissertation notebook (which uses a 2.4 cm sensor width),
    used as an oracle for the formula."""
    xmin, ymin, xmax, ymax = pred_bbox
    pixel_w = max(xmax - xmin, 1)
    pixel_h = max(ymax - ymin, 1)
    focal_px = (focal_length_mm / 10) * img_size / sensor_width_cm
    w = (pixel_w * camera_distance_cm) / focal_px
    h = (pixel_h * camera_distance_cm) / focal_px
    return w, h, w * h


def test_focal_length_in_pixels_for_default_camera():
    # 0.36 cm * 512 px / 2.4 cm = 76.8 px
    assert focal_length_px(3.6, 512, 2.4) == pytest.approx(76.8)


def test_known_value():
    d = estimate_dimensions((100, 100, 200, 150), image_width_px=512)
    assert d.width_cm == pytest.approx(100 * 90 / 76.8)   # 117.1875
    assert d.length_cm == pytest.approx(50 * 90 / 76.8)   # 58.59375
    assert d.area_cm2 == pytest.approx(d.width_cm * d.length_cm)


@pytest.mark.parametrize("bbox", [(0, 0, 512, 512), (200, 260, 330, 340), (10.5, 20.25, 31.0, 90.75)])
def test_formula_matches_dissertation_notebook_at_its_own_constants(bbox):
    got = estimate_dimensions(bbox, image_width_px=512, sensor_width_cm=2.4)
    w, h, a = reference_notebook_version(bbox)
    assert (got.width_cm, got.length_cm, got.area_cm2) == pytest.approx((w, h, a))


def test_size_scales_linearly_with_camera_height():
    low = estimate_dimensions((50, 50, 150, 130), 512, camera_height_cm=45)
    high = estimate_dimensions((50, 50, 150, 130), 512, camera_height_cm=90)
    assert high.width_cm == pytest.approx(2 * low.width_cm)
    assert high.area_cm2 == pytest.approx(4 * low.area_cm2)


def test_longer_focal_length_means_smaller_object():
    short = estimate_dimensions((50, 50, 150, 130), 512, focal_length_mm=3.6)
    long = estimate_dimensions((50, 50, 150, 130), 512, focal_length_mm=7.2)
    assert long.width_cm == pytest.approx(short.width_cm / 2)


def test_degenerate_box_is_floored_to_one_pixel():
    d = estimate_dimensions((10, 10, 10, 10), 512)
    assert d.pixel_width == 1.0 and d.pixel_height == 1.0
    assert math.isfinite(d.area_cm2) and d.area_cm2 > 0

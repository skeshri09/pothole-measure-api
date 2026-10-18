import { describe, expect, it } from "vitest";
import { boxFromDrag, clamp, isMeasurable, scaleFactors, toImageBox } from "../lib/geometry.js";

const displayed = { width: 400, height: 300 };
const natural = { width: 800, height: 600 };

describe("geometry helpers", () => {
  it("clamps values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("computes scale factors", () => {
    expect(scaleFactors(natural, displayed)).toEqual({ sx: 2, sy: 2 });
  });

  it("builds the same box whichever corner the drag starts from", () => {
    const a = { x: 50, y: 40 };
    const b = { x: 150, y: 120 };
    expect(boxFromDrag(a, b, displayed)).toEqual(boxFromDrag(b, a, displayed));
    expect(boxFromDrag(a, b, displayed)).toEqual({ x1: 50, y1: 40, x2: 150, y2: 120 });
  });

  it("clamps a drag that leaves the image", () => {
    expect(boxFromDrag({ x: -20, y: -5 }, { x: 999, y: 999 }, displayed)).toEqual({
      x1: 0, y1: 0, x2: 400, y2: 300,
    });
  });

  it("converts a displayed box to natural image pixels", () => {
    expect(toImageBox({ x1: 50, y1: 40, x2: 150, y2: 120 }, natural, displayed)).toEqual([100, 80, 300, 240]);
  });

  it("only measures boxes with real size", () => {
    expect(isMeasurable(null)).toBe(false);
    expect(isMeasurable({ x1: 10, y1: 10, x2: 11, y2: 50 })).toBe(false);
    expect(isMeasurable({ x1: 10, y1: 10, x2: 40, y2: 50 })).toBe(true);
  });
});

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchDefaults, measure } from "./lib/api.js";
import { boxFromDrag, isMeasurable, toImageBox } from "./lib/geometry.js";
import { SAMPLE_IMAGE_URL } from "./lib/sample.js";

const FALLBACK = { camera_height_cm: 90, focal_length_mm: 3.6, sensor_width_cm: 0.24 };

function Field({ id, label, unit, value, min, max, step, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} <span className="unit">({unit})</span>
      </label>
      <div className="field-row">
        <input type="range" aria-label={`${label} slider`} min={min} max={max} step={step} value={value}
               onChange={(e) => onChange(Number(e.target.value))} />
        <input id={id} type="number" min={min} max={max} step={step} value={value}
               onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    </div>
  );
}

export default function App() {
  const [image, setImage] = useState(null); // { url, width, height }
  const [box, setBox] = useState(null); // natural-pixel box: [xmin, ymin, xmax, ymax]
  const [settings, setSettings] = useState(FALLBACK);
  const [defaults, setDefaults] = useState(FALLBACK);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const imgRef = useRef(null);
  const dragStart = useRef(null);

  useEffect(() => {
    fetchDefaults()
      .then((d) => { setDefaults(d); setSettings(d); })
      .catch(() => {}); // fall back to the built-in defaults
  }, []);

  const loadImage = useCallback((url) => {
    const probe = new Image();
    probe.onload = () => {
      setImage({ url, width: probe.naturalWidth, height: probe.naturalHeight });
      setBox(null);
      setResult(null);
      setError("");
    };
    probe.onerror = () => setError("That file could not be read as an image.");
    probe.src = url;
  }, []);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) loadImage(URL.createObjectURL(file));
  };

  // --- drawing the box with pointer events (mouse, touch and pen) ---
  const pointIn = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    return { rect, p: { x: e.clientX - rect.left, y: e.clientY - rect.top } };
  };
  const updateBox = (e) => {
    const { rect, p } = pointIn(e);
    const displayed = { width: rect.width, height: rect.height };
    const b = boxFromDrag(dragStart.current, p, displayed);
    setBox(isMeasurable(b) ? toImageBox(b, image, displayed) : null);
  };
  const onPointerDown = (e) => {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = pointIn(e).p;
    setBox(null);
  };
  const onPointerMove = (e) => { if (dragStart.current) updateBox(e); };
  const onPointerUp = () => { dragStart.current = null; };

  // --- live measurement: debounce, and cancel any request that is already out of date ---
  useEffect(() => {
    if (!image || !box) { setResult(null); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await measure(
          { bbox: box, image_width_px: image.width, image_height_px: image.height, ...settings },
          controller.signal
        );
        setResult(r);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") { setError(err.message); setResult(null); }
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 120);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [image, box, settings]);

  const set = (key) => (v) => setSettings((s) => ({ ...s, [key]: Number.isFinite(v) && v > 0 ? v : s[key] }));

  const boxStyle = useMemo(() => {
    if (!image || !box) return null;
    return {
      left: `${(box[0] / image.width) * 100}%`,
      top: `${(box[1] / image.height) * 100}%`,
      width: `${((box[2] - box[0]) / image.width) * 100}%`,
      height: `${((box[3] - box[1]) / image.height) * 100}%`,
    };
  }, [image, box]);

  return (
    <main className="page">
      <header>
        <h1>Pothole Measurement</h1>
        <p className="lede">
          Upload a road photo, drag a box around the pothole, and watch its estimated real-world size update live.
        </p>
      </header>

      <div className="grid">
        <section className="panel" aria-label="Image">
          <div className="actions">
            <label className="button">
              Upload a road photo
              <input type="file" accept="image/*" onChange={onFile} hidden />
            </label>
            <button type="button" className="button secondary" onClick={() => loadImage(SAMPLE_IMAGE_URL)}>
              Try the demo image
            </button>
            {box && (
              <button type="button" className="button secondary" onClick={() => setBox(null)}>
                Clear box
              </button>
            )}
          </div>

          {image ? (
            <div className="stage">
              <img ref={imgRef} src={image.url} alt="Road surface to measure" draggable={false} />
              <div className="overlay" role="application" aria-label="Drag to draw a box around the pothole"
                   onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                   onPointerCancel={onPointerUp}>
                {boxStyle && <div className="box" style={boxStyle} />}
              </div>
            </div>
          ) : (
            <div className="empty">Choose a photo or try the demo image to begin.</div>
          )}
          {image && !box && <p className="hint">Click and drag on the image to draw a box.</p>}
        </section>

        <aside className="panel" aria-label="Settings and results">
          <h2>Camera settings</h2>
          <Field id="height" label="Camera height" unit="cm" value={settings.camera_height_cm} min={10} max={500} step={1}
                 onChange={set("camera_height_cm")} />
          <Field id="focal" label="Focal length" unit="mm" value={settings.focal_length_mm} min={1} max={20} step={0.1}
                 onChange={set("focal_length_mm")} />
          <Field id="sensor" label="Sensor width" unit="cm" value={settings.sensor_width_cm} min={0.05} max={2} step={0.01}
                 onChange={set("sensor_width_cm")} />
          <button type="button" className="link" onClick={() => setSettings(defaults)}>Reset to defaults</button>

          <h2>Estimated size</h2>
          <div className="results" aria-live="polite">
            {result ? (
              <dl>
                <div><dt>Width</dt><dd>{result.width_cm.toFixed(1)} <small>cm</small></dd></div>
                <div><dt>Length</dt><dd>{result.length_cm.toFixed(1)} <small>cm</small></dd></div>
                <div><dt>Area</dt><dd>{result.area_cm2.toFixed(0)} <small>cm²</small></dd></div>
              </dl>
            ) : (
              <p className="muted">{busy ? "Measuring…" : "Draw a box to see a measurement."}</p>
            )}
            {error && <p className="error" role="alert">{error}</p>}
          </div>

          {result && (
            <details>
              <summary>Details</summary>
              <p className="muted">
                Box: {box?.join(", ")} px ({result.pixel_width.toFixed(0)} × {result.pixel_height.toFixed(0)} px).
                Focal length: {result.focal_length_px.toFixed(0)} px.
              </p>
            </details>
          )}
          <p className="note">
            Estimate only. It assumes the camera points straight down at a flat road from the height you set, and it
            has not been validated against measured potholes.
          </p>
        </aside>
      </div>

      <footer>
        <a href="/docs">API docs</a> · <a href="https://github.com/skeshri09/pothole-measure-api">Source on GitHub</a>
      </footer>
    </main>
  );
}

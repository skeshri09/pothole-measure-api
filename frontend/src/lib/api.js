export async function fetchDefaults() {
  const res = await fetch("/api/defaults");
  if (!res.ok) throw new Error("Could not load default camera settings");
  return res.json();
}

export async function measure(payload, signal) {
  const res = await fetch("/api/measure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    let detail = "Measurement failed";
    try {
      const body = await res.json();
      if (Array.isArray(body.detail) && body.detail[0]?.msg) detail = body.detail[0].msg;
    } catch {
      /* keep generic message */
    }
    throw new Error(detail);
  }
  return res.json();
}

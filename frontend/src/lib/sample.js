// A small synthetic "road" illustration so the tool can be tried without uploading a photo.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5b5f66"/><stop offset="1" stop-color="#43464c"/>
    </linearGradient>
    <radialGradient id="hole" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0" stop-color="#14151a"/><stop offset="1" stop-color="#2b2d33"/>
    </radialGradient>
  </defs>
  <rect width="640" height="480" fill="url(#road)"/>
  <rect x="0" y="236" width="640" height="6" fill="#d8d8c8" opacity="0.55"/>
  <ellipse cx="330" cy="300" rx="105" ry="62" fill="url(#hole)"/>
  <ellipse cx="330" cy="300" rx="105" ry="62" fill="none" stroke="#1e1f24" stroke-width="6"/>
  <text x="14" y="466" font-family="Arial" font-size="14" fill="#c9ccd2">Demo illustration, not a real photo</text>
</svg>`;

export const SAMPLE_IMAGE_URL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

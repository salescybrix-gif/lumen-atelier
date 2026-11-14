/**
 * Generates minimalist, studio-style product renderings as SVG so the demo
 * works fully offline with no external image hosting.
 * URL format: /api/art/{category}-{hex}-{variant}.svg
 */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]: RGB) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}
function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const SHAPES: Record<string, (fill: string, stroke: string, detail: string) => string> = {
  outerwear: (f, s, d) => `
    <path d="M330 175 L400 215 L470 175 L575 225 L635 560 L580 578 L556 405 L560 870 L240 870 L244 405 L220 578 L165 560 L225 225 Z" fill="${f}" stroke="${s}" stroke-width="2"/>
    <path d="M330 175 L372 330 L400 215 M470 175 L428 330 L400 215" fill="none" stroke="${d}" stroke-width="3"/>
    <path d="M400 330 L400 870" stroke="${d}" stroke-width="2" opacity=".55"/>
    <circle cx="420" cy="470" r="7" fill="${d}"/><circle cx="420" cy="560" r="7" fill="${d}"/><circle cx="420" cy="650" r="7" fill="${d}"/>
    <path d="M270 640 L340 640 M460 640 L530 640" stroke="${d}" stroke-width="3" opacity=".5"/>`,
  knitwear: (f, s, d) => `
    <path d="M325 235 Q400 285 475 235 L590 280 L655 610 L595 630 L560 400 L562 790 L238 790 L240 400 L205 630 L145 610 L210 280 Z" fill="${f}" stroke="${s}" stroke-width="2"/>
    <path d="M325 235 Q400 300 475 235" fill="none" stroke="${d}" stroke-width="10" opacity=".55"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${250 + i * 25} 760 L${250 + i * 25} 790" stroke="${d}" stroke-width="3" opacity=".45"/>`).join("")}
    ${Array.from({ length: 5 }, (_, i) => `<path d="M${152 + i * 6} ${590 - i * 1} L${206 + i * 6} ${608 - i * 1}" stroke="${d}" stroke-width="2" opacity=".4"/>`).join("")}
    ${Array.from({ length: 5 }, (_, i) => `<path d="M${648 - i * 6} ${590 - i * 1} L${594 - i * 6} ${608 - i * 1}" stroke="${d}" stroke-width="2" opacity=".4"/>`).join("")}
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${300 + i * 40} 420 q10 18 0 36 q-10 18 0 36 q10 18 0 36 q-10 18 0 36" fill="none" stroke="${d}" stroke-width="2" opacity=".18"/>`).join("")}`,
  bags: (f, s, d) => `
    <path d="M300 440 Q300 255 400 255 Q500 255 500 440" fill="none" stroke="${d}" stroke-width="16" stroke-linecap="round"/>
    <path d="M225 420 L575 420 L615 830 Q615 850 595 850 L205 850 Q185 850 185 830 Z" fill="${f}" stroke="${s}" stroke-width="2"/>
    <path d="M225 420 L575 420 L578 470 L222 470 Z" fill="${d}" opacity=".18"/>
    <rect x="370" y="505" width="60" height="34" rx="6" fill="${d}" opacity=".7"/>
    <path d="M200 790 L600 790" stroke="${d}" stroke-width="2" opacity=".25" stroke-dasharray="6 8"/>`,
  fragrance: (f, s, d) => `
    <rect x="355" y="245" width="90" height="105" rx="10" fill="${d}"/>
    <rect x="372" y="345" width="56" height="40" fill="${s}" opacity=".6"/>
    <rect x="270" y="380" width="260" height="440" rx="26" fill="${f}" stroke="${s}" stroke-width="2" opacity=".93"/>
    <rect x="292" y="400" width="30" height="400" rx="15" fill="#ffffff" opacity=".22"/>
    <rect x="320" y="560" width="160" height="96" rx="4" fill="#f6f3ee" opacity=".92"/>
    <path d="M345 594 L455 594 M365 620 L435 620" stroke="#2b2925" stroke-width="3" opacity=".7"/>`,
  objects: (f, s, d) => `
    <path d="M345 270 L455 270 L452 345 Q585 430 562 620 Q540 815 400 828 Q260 815 238 620 Q215 430 348 345 Z" fill="${f}" stroke="${s}" stroke-width="2"/>
    <ellipse cx="400" cy="272" rx="55" ry="10" fill="${d}" opacity=".7"/>
    <path d="M285 460 Q400 500 515 460" fill="none" stroke="${d}" stroke-width="3" opacity=".35"/>
    <path d="M300 520 Q290 650 340 760" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity=".14"/>`,
};

export function renderArt(category: string, hex: string, variant: number) {
  const color = /^[0-9a-f]{3,6}$/i.test(hex) ? `#${hex}` : "#8a7f72";
  const shape = SHAPES[category] ?? SHAPES.objects;
  const dark = luminance(color) < 0.42;

  const bgs = [
    ["#efebe5", "#e2ddd5"],
    [mix(color, dark ? "#e9e4dc" : "#2a2723", 0.78), mix(color, dark ? "#d8d1c6" : "#1a1816", 0.66)],
    ["#e7e2da", "#d6d0c6"],
  ];
  const [bgA, bgB] = bgs[variant % 3];

  const fill = color;
  const stroke = mix(color, "#000000", 0.25);
  const detail = dark ? mix(color, "#ffffff", 0.32) : mix(color, "#000000", 0.38);

  const transforms = [
    "translate(0 0)",
    "translate(40 20) scale(.9) rotate(-4 400 550)",
    "translate(-380 -420) scale(1.95)",
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <radialGradient id="light" cx=".3" cy=".15" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .05 0"/></filter>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect width="800" height="1000" fill="url(#light)"/>
  <g transform="${transforms[variant % 3]}">
    <ellipse cx="400" cy="880" rx="250" ry="26" fill="#000" opacity=".18" filter="url(#blur)"/>
    <g>${shape(fill, stroke, detail)}</g>
    <g style="mix-blend-mode:soft-light">${shape("url(#shade)", "none", "transparent")}</g>
  </g>
  <rect width="800" height="1000" filter="url(#grain)"/>
</svg>`;
}

export function artUrl(category: string, hex: string, variant: number) {
  return `/api/art/${category.toLowerCase()}-${hex.replace("#", "").toLowerCase()}-${variant}.svg`;
}

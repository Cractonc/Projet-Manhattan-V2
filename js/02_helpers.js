'use strict';

// ============================================================
// HELPERS
// ============================================================
var lerp = (a, b, t) => a + (b - a) * t;
var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
var deg2rad = d => d * Math.PI / 180;

function smoothstep(t) { return t * t * (3 - 2 * t); }

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hash2d(ix, iy) {
  let h = (ix * 2747636419 ^ iy * 2654435761) >>> 0;
  h ^= h >>> 16;
  h = (Math.imul(h, 0x45d9f3b)) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = smoothstep(fx), uy = smoothstep(fy);
  return lerp(
    lerp(hash2d(ix, iy), hash2d(ix + 1, iy), ux),
    lerp(hash2d(ix, iy + 1), hash2d(ix + 1, iy + 1), ux),
    uy
  );
}

function fbm(x, y, oct = 6) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    v += a * vnoise(x * f, y * f);
    a *= 0.5; f *= 2.1;
  }
  return v;
}

function clr(r, g, b) { return `rgb(${r | 0},${g | 0},${b | 0})`; }

function formatDistance(ly) {
  if (ly < 1) return (ly * 365.25).toFixed(0) + ' light-days';
  if (ly < 100) return ly.toFixed(1) + ' ly';
  if (ly < 10000) return (ly / 1000).toFixed(2) + ' kly';
  return (ly / 1000).toFixed(1) + ' kly';
}

function setHUDTarget(name) {
  const lineEl = document.getElementById('hud-line-target');
  const targetEl = document.getElementById('hud-target');
  if (!targetEl) return;
  if (!name || name === '—') {
    targetEl.textContent = '—';
    if (lineEl) lineEl.style.display = 'none';
  } else {
    targetEl.textContent = name.toUpperCase();
    if (lineEl) lineEl.style.display = '';
  }
}


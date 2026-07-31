'use strict';

// ============================================================
// PROCEDURAL TEXTURE GENERATORS — SOLAR
// ============================================================

function makeTexture(fn, w = 512, h = 256) {
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fn(x / w, y / h);
      const i = (y * w + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a ?? 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function texMercury() {
  return makeTexture((u, v) => {
    const n = fbm(u * 8, v * 8);
    const base = 155 + n * 40;
    const crater = vnoise(u * 20, v * 20) > 0.72 ? -30 : 0;
    const r = base + crater;
    return [r * 0.98, r * 0.96, r * 0.92];
  });
}

function texVenus() {
  return makeTexture((u, v) => {
    const warp = fbm(u * 3 + 0.5, v * 3) * 0.15;
    const n = fbm(u * 4 + warp, v * 6 + warp * 0.5, 5);
    const r = 200 + n * 55;
    const g = 155 + n * 45;
    const b = 60 + n * 20;
    return [r, g, b];
  });
}

function texEarth() {
  const w = 1024, h = 512;
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const lat = Math.abs(v - 0.5) * 2;
      const cx = fbm(u * 3.5, v * 3.5 + 0.7, 7);
      const isLand = cx > 0.54;
      const isPolar = lat > 0.85;
      const i = (y * w + x) * 4;
      if (isPolar) {
        const blend = clamp((lat - 0.85) / 0.1, 0, 1);
        if (isLand) {
          d[i] = lerp(80, 220, blend); d[i + 1] = lerp(130, 230, blend); d[i + 2] = lerp(80, 240, blend);
        } else {
          d[i] = lerp(30, 200, blend); d[i + 1] = lerp(90, 220, blend); d[i + 2] = lerp(160, 240, blend);
        }
      } else if (isLand) {
        const elev = fbm(u * 7, v * 7, 4);
        const isMtn = elev > 0.62;
        if (isMtn) { d[i] = 150; d[i + 1] = 140; d[i + 2] = 120; }
        else { const g = 90 + elev * 60; d[i] = 50 + elev * 40; d[i + 1] = g; d[i + 2] = 30 + elev * 20; }
      } else {
        const depth = fbm(u * 5, v * 5, 4);
        d[i] = 20 + depth * 20; d[i + 1] = 60 + depth * 50; d[i + 2] = 140 + depth * 60;
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(cvs);
}

function texEarthClouds() {
  return makeTexture((u, v) => {
    const n = fbm(u * 5, v * 5, 5);
    const a = clamp((n - 0.48) * 4.5, 0, 1);
    return [230, 235, 240, a * 180 | 0];
  });
}

function texMars() {
  return makeTexture((u, v) => {
    const lat = Math.abs(v - 0.5) * 2;
    const n = fbm(u * 5, v * 5);
    const polar = lat > 0.86 ? clamp((lat - 0.86) / 0.08, 0, 1) : 0;
    let r = 190 + n * 40, g = 70 + n * 25, b = 30 + n * 10;
    r = lerp(r, 225, polar); g = lerp(g, 228, polar); b = lerp(b, 232, polar);
    return [r, g, b];
  });
}

function texJupiter() {
  return makeTexture((u, v) => {
    const warp = fbm(u * 4, v * 2) * 0.06;
    const band = Math.sin((v + warp) * Math.PI * 18);
    const n = fbm(u * 8, v * 8, 4) * 0.4;
    const bv = (band + 1) * 0.5 + n * 0.2;
    const r = 195 + bv * 40, g = 155 + bv * 30, b = 105 + bv * 20;
    const du = Math.min(Math.abs(u - 0.62), 1 - Math.abs(u - 0.62)) * 2;
    const dv = Math.abs(v - 0.38) * 5;
    const spot = Math.exp(-(du * du * 14 + dv * dv * 14));
    return [lerp(r, 200, spot), lerp(g, 90, spot), lerp(b, 65, spot)];
  });
}

function texSaturn() {
  return makeTexture((u, v) => {
    const band = Math.sin(v * Math.PI * 12);
    const n = fbm(u * 6, v * 4, 3) * 0.3;
    const bv = (band + 1) * 0.5 + n;
    return [195 + bv * 28, 175 + bv * 22, 105 + bv * 15];
  });
}

function texUranus() {
  return makeTexture((u, v) => {
    const n = fbm(u * 4, v * 4, 3) * 0.15;
    const vv = v + n;
    return [100 + vv * 50, 170 + vv * 30, 200 + vv * 15];
  });
}

function texNeptune() {
  return makeTexture((u, v) => {
    const n = fbm(u * 5, v * 5, 4);
    const wisp = fbm(u * 10 + 0.5, v * 10, 3) > 0.65 ? 0.25 : 0;
    const r = 40 + n * 20 + wisp * 60, g = 70 + n * 20 + wisp * 60, b = 195 + n * 30 + wisp * 50;
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
  });
}

function texMoon() {
  return makeTexture((u, v) => {
    const n = fbm(u * 8, v * 8, 5);
    const v2 = 135 + n * 55;
    const dark = vnoise(u * 12, v * 12) > 0.65 ? 0.85 : 1;
    return [v2 * dark * 0.98, v2 * dark * 0.97, v2 * dark * 0.93];
  });
}

function texSun() {
  return makeTexture((u, v) => {
    const n = fbm(u * 6, v * 6, 4);
    return [255, clamp(180 + n * 60, 0, 255), clamp(20 + n * 40, 0, 120)];
  }, 512, 256);
}

function texRings(r, g, b) {
  const w = 512, h = 1;
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let x = 0; x < w; x++) {
    const t = x / w;
    const pattern = Math.sin(t * 80) * 0.3 + Math.sin(t * 200) * 0.15 + vnoise(t * 40, 0) * 0.4;
    const alpha = clamp(pattern * 1.5 + 0.4, 0.05, 0.9);
    const gap = Math.abs(t - 0.62) < 0.04 ? 0.05 : 1;
    const i = x * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = alpha * gap * 200 | 0;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}


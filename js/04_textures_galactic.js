'use strict';

// ============================================================
// PROCEDURAL TEXTURE GENERATORS — GALACTIC
// ============================================================

function texExtraGalaxySpiral(baseColor) {
  const c = new THREE.Color(baseColor);
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const spiral = Math.sin(angle * 2 - dist * 10) * 0.5 + 0.5;
    const core = Math.exp(-dist * 4.5) * 2.5; // Plus intense
    const arms = Math.pow(spiral, 2) * Math.exp(-dist * 1.4) * 0.8;
    const glow = Math.exp(-dist * 1.8) * 0.4;
    const n = fbm(u * 10, v * 10, 3) * 0.15;
    const total = (core + arms + glow + n * arms) * clamp(1.2 - dist, 0, 1);
    return [
      clamp(c.r * 255 * total + core * 50, 0, 255),
      clamp(c.g * 255 * total + core * 40, 0, 255),
      clamp(c.b * 255 * total + core * 30, 0, 255),
      total * 255
    ];
  }, 256, 256);
}

function texExtraGalaxyElliptical(baseColor) {
  const c = new THREE.Color(baseColor);
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-dist * 3.5) * 2.0;
    const halo = Math.exp(-dist * 1.4) * 0.6;
    const total = (core + halo) * clamp(1.2 - dist, 0, 1);
    return [
      clamp(c.r * 255 * total + core * 40, 0, 255),
      clamp(c.g * 255 * total + core * 35, 0, 255),
      clamp(c.b * 255 * total + core * 20, 0, 255),
      total * 255
    ];
  }, 256, 256);
}

function texExtraGalaxyIrregular(baseColor) {
  const c = new THREE.Color(baseColor);
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const n1 = fbm(u * 4, v * 4, 4);
    const n2 = fbm(u * 8, v * 8, 3);
    const shape = clamp(n1 * 1.4 - dist * 0.7, 0, 1);
    const clumps = n2 * 0.5 + 0.5;
    const total = shape * clumps * clamp(1.2 - dist, 0, 1);
    const h2 = Math.exp(-dist * 6) * 1.2; // Petit noyau irrégulier
    return [
      clamp(c.r * 255 * total + h2 * 60, 0, 255),
      clamp(c.g * 255 * total + h2 * 50, 0, 255),
      clamp(c.b * 255 * total + h2 * 70, 0, 255),
      total * 255
    ];
  }, 256, 256);
}

function texExtraGalaxyRing(baseColor) {
  const c = new THREE.Color(baseColor);
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-dist * 12) * 2.0;
    const ring = Math.exp(-Math.pow((dist - 0.7) * 8, 2)) * 1.2;
    const filaments = fbm(u * 12, v * 12, 3) * 0.4 * ring;
    const total = (core + (ring + filaments)) * clamp(1.1 - dist, 0, 1);
    return [
      clamp(c.r * 255 * total + core * 50, 0, 255),
      clamp(c.g * 255 * total + core * 40, 0, 255),
      clamp(c.b * 255 * total, 0, 255),
      total * 255
    ];
  }, 256, 256);
}

function texExtraGalaxyInteracting(baseColor) {
  const c = new THREE.Color(baseColor);
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d1 = Math.sqrt((u - 0.4) * (u - 0.4) + (v - 0.45) * (v - 0.45)) * 4;
    const d2 = Math.sqrt((u - 0.6) * (u - 0.6) + (v - 0.55) * (v - 0.55)) * 4;
    const core1 = Math.exp(-d1 * 6) * 1.8;
    const core2 = Math.exp(-d2 * 6) * 1.5;
    const flow = fbm(u * 5, v * 5, 4) * 0.8 * Math.exp(-(d1 + d2) * 0.2);
    const total = clamp(core1 + core2 + flow, 0, 1.2);
    const fade = clamp(1.2 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    return [
      clamp(c.r * 255 * total + core1 * 40, 0, 255),
      clamp(c.g * 255 * total + core2 * 40, 0, 255),
      clamp(c.b * 255 * total, 0, 255),
      total * 255 * fade
    ];
  }, 256, 256);
}

function texExtraGalaxyEdgeOn(baseColor) {
  const c = new THREE.Color(baseColor);
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(Math.pow(cx * 8, 2) + Math.pow(cy * 1, 2)) * 2;
    const disk = Math.exp(-dist * 1.5) * 1.2;
    const core = Math.exp(-(Math.sqrt(cx * cx + cy * cy) * 8)) * 1.5;
    const dust = 1.0 - (Math.abs(cy) < 0.02 ? 0.8 : 0);
    const total = (disk + core) * dust * clamp(1.1 - Math.abs(cx) * 2, 0, 1);
    return [c.r * 255 * total, c.g * 255 * total, c.b * 255 * total, total * 255];
  }, 256, 256);
}

function texExtraGalaxyStarburst(baseColor) {
  const c = new THREE.Color(baseColor);
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const core = Math.exp(-dist * 5) * 2.5;
    const streaks = Math.pow(Math.abs(Math.cos(angle * 8 + dist * 5)), 4) * Math.exp(-dist * 2) * 0.6;
    const glow = Math.exp(-dist * 1.2) * 0.5;
    const total = (core + streaks + glow) * clamp(1.1 - dist, 0, 1);
    return [
      255 * total,
      clamp(c.g * 255 * total, 0, 255),
      clamp(c.b * 255 * total, 0, 255),
      total * 255
    ];
  }, 256, 256);
}

// --- HD GALAXIES (Ref Photo) ---

function texHD_M83() {
  // Intense pink/red arms, blue core, clumpy HII
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const spiral = Math.sin(angle * 3 - dist * 8) * 0.5 + 0.5;
    const halo = Math.exp(-dist * 2.0) * 0.5;
    const arms = Math.pow(spiral, 1.5) * Math.exp(-dist * 1.8) * 0.6;
    const h2 = fbm(u * 20, v * 20, 5) * arms * 0.4;
    const core = Math.exp(-dist * 8) * 1.5;
    const total = clamp(core + halo + arms + h2, 0, 1.2) * clamp(1.1 - dist, 0, 1);
    return [
      clamp(total * 255 + h2 * 80, 0, 255),
      clamp(total * 80 + core * 100, 0, 255),
      clamp(total * 200 + core * 255, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_M82() {
  // Red starburst filaments crossing blue disk
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const disk = Math.exp(-(Math.pow(cx * 4, 2) + Math.pow(cy * 12, 2))) * 1.2;
    const angle = Math.atan2(cy, cx);
    const burst = Math.pow(Math.abs(Math.sin(angle * 1 + Math.PI / 2)), 20) * Math.exp(-Math.abs(cy) * 4) * 1.5;
    const filaments = fbm(u * 30, v * 10, 4) * burst;
    const total = clamp(disk + burst + filaments, 0, 1.5) * clamp(1.1 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    return [
      clamp(total * 100 + (burst + filaments) * 255, 0, 255),
      clamp(total * 150, 0, 255),
      clamp(total * 230, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_CentaurusA() {
  // Elliptical with massive dark dust lane and orange jets
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const glow = Math.exp(-d * 2.5) * 1.2;
    const laneAngle = 0.5;
    const rotatedY = cx * Math.sin(laneAngle) + cy * Math.cos(laneAngle);
    const lane = Math.exp(-Math.pow(rotatedY * 15, 2));
    const laneDetail = fbm(u * 25, v * 25, 6);
    const dust = clamp(1.0 - lane * (0.9 + laneDetail * 0.2), 0, 1);
    const jets = Math.pow(Math.abs(Math.sin(Math.atan2(cy, cx) - laneAngle + Math.PI / 2)), 40) * Math.exp(-d * 0.5) * 0.4;
    const total = glow * dust + jets;
    return [
      clamp(total * 255 + jets * 200, 0, 255),
      clamp(total * 200 + jets * 100, 0, 255),
      clamp(total * 150, 0, 255),
      total * 255 * clamp(1.1 - d, 0, 1)
    ];
  }, 512, 512);
}

function texHD_NGC7331() {
  // Golden core, blue tilted disk
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(Math.pow(cx * 2, 2) + Math.pow(cy * 6, 2)) * 2;
    const disk = Math.exp(-dist * 1.1) * 1.0;
    const core = Math.exp(-(Math.sqrt(cx * cx + cy * cy) * 10)) * 2.0;
    const n = fbm(u * 15, v * 15, 5) * disk * 0.3;
    const total = (disk + core + n) * clamp(1.1 - Math.abs(cx) * 2, 0, 1);
    return [
      clamp(total * 150 + core * 255, 0, 255),
      clamp(total * 180 + core * 200, 0, 255),
      clamp(total * 255, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC6946() {
  // Clumpy pink fireworks
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-d * 10) * 1.5;
    const n1 = fbm(u * 12, v * 12, 5);
    const clumps = Math.pow(n1, 3) * Math.exp(-d * 1.2) * 2.0;
    const total = (core + clumps) * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 100 + clumps * 100, 0, 255),
      clamp(total * 200, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_M51() {
  // Whirlpool: Two cores connected by bridge
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d1 = Math.sqrt(Math.pow(u - 0.45, 2) + Math.pow(v - 0.45, 2)) * 3;
    const d2 = Math.sqrt(Math.pow(u - 0.65, 2) + Math.pow(v - 0.65, 2)) * 6;
    const core1 = Math.exp(-d1 * 8) * 1.8;
    const core2 = Math.exp(-d2 * 12) * 1.2;
    const spiral = Math.sin(Math.atan2(v - 0.45, u - 0.45) * 2 - d1 * 8) * 0.5 + 0.5;
    const halo1 = Math.exp(-d1 * 1.8) * 0.4;
    const arms = Math.pow(spiral, 1.5) * Math.exp(-d1 * 2.0) * 0.5;
    const bridge = Math.exp(-Math.pow((u - v), 2) * 50) * Math.exp(-(d1 + d2) * 0.5) * 0.3;
    const total = (core1 + core2 + halo1 + arms + bridge) * clamp(1.1 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    return [
      clamp(total * 200, 0, 255),
      clamp(total * 220 + core1 * 50, 0, 255),
      clamp(total * 255 + core1 * 80, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_Antennae() {
  // Two sweeped-out tidal tails
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d1 = Math.sqrt(Math.pow(u - 0.45, 2) + Math.pow(v - 0.5, 2)) * 8;
    const d2 = Math.sqrt(Math.pow(u - 0.55, 2) + Math.pow(v - 0.5, 2)) * 8;
    const core1 = Math.exp(-d1 * 4) * 2.0;
    const core2 = Math.exp(-d2 * 4) * 2.0;
    const tails = fbm(u * 5, v * 3, 5) * Math.exp(-Math.abs(cy) * 8) * 0.8;
    const total = (core1 + core2 + tails) * clamp(1.1 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 180 + core1 * 50, 0, 255),
      clamp(total * 120, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_AM0644() {
  // AM 0644-741: collisional ring galaxy, blue star-forming ring + off-center warm nucleus
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    // Off-center nucleus
    const nx = u - 0.43, ny = v - 0.47;
    const nd = Math.sqrt(nx * nx + ny * ny) * 2;
    const nucleus = Math.exp(-nd * 8) * 1.8;
    // Star-forming ring with slight irregularity
    const angle = Math.atan2(cy, cx);
    const ringR = 0.65 + Math.sin(angle * 3 + 1.5) * 0.04 + fbm(angle + u * 3, v * 3, 3) * 0.03;
    const ring = Math.exp(-Math.pow((d - ringR) * 11, 2)) * 1.4;
    const knots = Math.pow(fbm(u * 18, v * 18, 4), 2) * ring * 0.6;
    const glow = Math.exp(-d * 1.6) * 0.12;
    const total = (nucleus + ring + knots + glow) * clamp(1.1 - d, 0, 1);
    return [
      clamp(nucleus * 255 + (ring + knots) * 140, 0, 255),
      clamp(nucleus * 200 + (ring + knots) * 190, 0, 255),
      clamp(nucleus * 110 + (ring + knots) * 255, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_StephansQuintet() {
  // Stephan's Quintet: compact group of 5 galaxies with tidal features
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const galPos = [
      [0.40, 0.42, 1.6, 7], [0.54, 0.40, 1.8, 8],
      [0.46, 0.55, 1.3, 6], [0.58, 0.56, 1.1, 9],
      [0.36, 0.58, 0.9, 7]
    ];
    const colors = [
      [255, 235, 190], [210, 225, 255], [245, 220, 180],
      [190, 210, 250], [230, 200, 170]
    ];
    let total = 0, r = 0, g = 0, b = 0;
    for (let i = 0; i < 5; i++) {
      const gp = galPos[i];
      const dx = u - gp[0], dy = v - gp[1];
      const dd = Math.sqrt(dx * dx + dy * dy);
      const core = Math.exp(-dd * gp[3] * 6) * gp[2];
      const halo = Math.exp(-dd * gp[3] * 1.5) * gp[2] * 0.25;
      const val = core + halo;
      total += val;
      r += val * colors[i][0]; g += val * colors[i][1]; b += val * colors[i][2];
    }
    const tidal = fbm(u * 5, v * 5, 4) * 0.12 * Math.exp(-Math.sqrt(cx * cx + cy * cy) * 3.5);
    total += tidal;
    const fade = clamp(1.1 - Math.sqrt(cx * cx + cy * cy) * 2.2, 0, 1);
    return [
      clamp((r + tidal * 200) * fade, 0, 255),
      clamp((g + tidal * 185) * fade, 0, 255),
      clamp((b + tidal * 170) * fade, 0, 255),
      clamp(total * fade * 255, 0, 255)
    ];
  }, 512, 512);
}

function texHD_NGC1365() {
  // NGC 1365: grand design barred spiral with strong bar and wide sweeping arms
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const core = Math.exp(-d * 12) * 2.5;
    // Strong bar at ~30 deg
    const barAngle = 0.52;
    const bx = cx * Math.cos(barAngle) + cy * Math.sin(barAngle);
    const by = -cx * Math.sin(barAngle) + cy * Math.cos(barAngle);
    const bar = Math.exp(-(Math.pow(bx * 0.7, 2) + Math.pow(by * 9, 2)) * 12) * 1.6;
    // Two wide sweeping arms from bar ends
    const spiral = Math.sin(angle * 2 - d * 5 + barAngle) * 0.5 + 0.5;
    const arms = Math.pow(spiral, 2.5) * Math.exp(-d * 0.9) * 1.1;
    const knots = Math.pow(fbm(u * 18, v * 18, 5), 2.5) * arms * 1.5;
    const dust = 1.0 - Math.pow(fbm(u * 22, v * 22, 3), 2) * 0.25 * arms;
    const total = (core + bar + arms + knots * 0.4) * dust * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 220 + core * 60 + knots * 130, 0, 255),
      clamp(total * 210 + core * 50 + knots * 80, 0, 255),
      clamp(total * 180 + arms * 80 + knots * 160, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_BlackEye() {
  // Core with dark dust crescent
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-d * 8) * 2.2;
    const angle = Math.atan2(cy, cx);
    const spiral = Math.sin(angle * 2 - d * 5) * 0.4 + 0.6;
    const disk = Math.exp(-d * 1.2) * 0.7 * spiral;
    // The "Black Eye" mask: dark crescent next to core
    const eyeMask = (d > 0.12 && d < 0.28 && angle > -0.6 && angle < 1.2) ? 0.35 : 1.0;
    const total = (core + disk) * eyeMask * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 220, 0, 255),
      clamp(total * 160, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_Hoag() {
  // Perfect Ring: Yellow core + void + Blue ring
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-d * 15) * 2.0;
    const ring = Math.exp(-Math.pow((d - 0.75) * 20, 2)) * 1.5;
    const n = fbm(u * 25, v * 25, 4) * ring * 0.5;
    const total = (core + ring + n) * clamp(1.1 - d, 0, 1);
    return [
      clamp(core * 255 + ring * 140, 0, 255),
      clamp(core * 210 + ring * 180, 0, 255),
      clamp(core * 100 + ring * 255, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_Sculptor() {
  // Dusty silver coin with clumpy starbursts
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(Math.pow(cx * 6, 2) + Math.pow(cy * 2, 2)) * 2;
    const disk = Math.exp(-d * 1.5) * 1.2;
    const n = fbm(u * 15, v * 15, 6);
    const clumping = Math.pow(n, 2) * 1.5;
    const starbursts = Math.pow(fbm(u * 30, v * 30, 3), 4) * 5 * disk;
    const total = (disk * clumping + starbursts) * clamp(1.2 - d, 0, 1);
    return [
      clamp(total * 200 + starbursts * 255, 0, 255),
      clamp(total * 210, 0, 255),
      clamp(total * 220 + starbursts * 100, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC1300() {
  // NGC 1300: classic barred spiral with symmetric bar and tightly wound arms
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const core = Math.exp(-d * 14) * 2.2;
    const bar = Math.exp(-(Math.pow(cx * 0.65, 2) + Math.pow(cy * 10, 2)) * 12) * 1.4;
    const spiral = Math.sin(angle * 2 - d * 6.5) * 0.5 + 0.5;
    const arms = Math.pow(spiral, 3) * Math.exp(-d * 1.1) * 1.0;
    const n = fbm(u * 15, v * 15, 4) * 0.2 * arms;
    const total = (core + bar + arms + n) * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 240 + core * 50, 0, 255),
      clamp(total * 225 + core * 40, 0, 255),
      clamp(total * 190 + arms * 90, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC1316() {
  // NGC 1316 / Fornax A: post-merger elliptical with dust lanes and shell structure
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-d * 5) * 2.0;
    const halo = Math.exp(-d * 1.5) * 0.7;
    // Dust lanes from past merger
    const dustAngle = 0.6;
    const rotY = cx * Math.sin(dustAngle) + cy * Math.cos(dustAngle);
    const lane1 = Math.exp(-Math.pow((rotY - 0.05) * 20, 2)) * 0.5;
    const lane2 = Math.exp(-Math.pow((rotY + 0.08) * 18, 2)) * 0.35;
    const dustDetail = fbm(u * 20, v * 20, 5);
    const dust = clamp(1.0 - (lane1 + lane2) * (0.7 + dustDetail * 0.3), 0.3, 1);
    const shells = Math.sin(d * 25) * 0.04 * Math.exp(-d * 2);
    const total = (core + halo + shells) * dust * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 235, 0, 255),
      clamp(total * 190, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC3627() {
  // Barred spiral with vibrant clumpy HII
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const bar = Math.exp(-(Math.pow(cx * 0.8, 2) + Math.pow(cy * 10, 2)) * 10) * 1.5;
    const halo = Math.exp(-d * 2.0) * 0.4;
    const spiral = Math.sin(angle * 2 - d * 6) * 0.5 + 0.5;
    const arms = Math.pow(spiral, 1.5) * Math.exp(-d * 1.8) * 0.6;
    const clumps = Math.pow(fbm(u * 20, v * 20, 6), 2) * arms * 1.2;
    const total = (bar + halo + arms + clumps) * clamp(1.2 - d, 0, 1);
    return [
      clamp(total * 200 + clumps * 100, 0, 255),
      clamp(total * 220, 0, 255),
      clamp(total * 255 + clumps * 80, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC4736() {
  // Double Ring: brilliant core + tight star forming ring
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-d * 15) * 2.5;
    const ring = Math.exp(-Math.pow((d - 0.25) * 25, 2)) * 1.8;
    const outer = Math.exp(-d * 1.5) * 0.4;
    const total = (core + ring + outer) * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 240 + core * 50, 0, 255),
      clamp(total * 210 + core * 50, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_MorningMist() {
  // Soft, ethereal blueish-white fuzzy galaxy (JWST)
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const glow = Math.exp(-d * 1.8) * 1.2;
    const n = fbm(u * 4, v * 4, 3) * 0.2;
    const total = (glow + n) * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 220, 0, 255),
      clamp(total * 235, 0, 255),
      clamp(total * 255, 0, 255),
      total * 180 + n * 255
    ];
  }, 512, 512);
}

function texHD_M87() {
  // M87 / Virgo A: giant elliptical galaxy with faint relativistic jet
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-d * 6) * 2.5;
    const halo = Math.exp(-d * 1.2) * 0.8;
    // Faint relativistic jet
    const jetAngle = -0.8;
    const jx = cx * Math.cos(jetAngle) + cy * Math.sin(jetAngle);
    const jy = -cx * Math.sin(jetAngle) + cy * Math.cos(jetAngle);
    const jet = (jx > 0) ? Math.exp(-Math.pow(jy * 30, 2)) * Math.exp(-jx * 3) * 0.5 : 0;
    const jetKnots = jet * (0.7 + Math.pow(fbm(jx * 15, jy * 15, 3), 2) * 0.6);
    const total = (core + halo + jetKnots) * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 255 + jetKnots * 100, 0, 255),
      clamp(total * 230 + jetKnots * 150, 0, 255),
      clamp(total * 180 + jetKnots * 255, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC4565() {
  // NGC 4565 - Needle Galaxy: edge-on spiral with prominent dust lane and bulge
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dDisk = Math.sqrt(Math.pow(cx * 1, 2) + Math.pow(cy * 14, 2)) * 2;
    const disk = Math.exp(-dDisk * 1.2) * 1.2;
    const dBulge = Math.sqrt(Math.pow(cx * 4, 2) + Math.pow(cy * 3, 2)) * 2;
    const bulge = Math.exp(-dBulge * 2) * 2.0;
    const dustLane = (Math.abs(cy) < 0.015 && Math.abs(cx) < 0.42) ? 0.25 : 1.0;
    const n = fbm(u * 20, v * 30, 4) * 0.15 * disk;
    const fade = clamp(1.0 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    const total = (bulge + disk + n) * dustLane * fade;
    return [
      clamp(total * 255 + bulge * 30, 0, 255),
      clamp(total * 240 + bulge * 20, 0, 255),
      clamp(total * 210, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_Sombrero() {
  // Iconic edge-on with bulge and sharp dust lane (Fixed edges)
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dBulge = Math.sqrt(Math.pow(cx * 4, 2) + Math.pow(cy * 2.5, 2)) * 2;
    const bulge = Math.exp(-dBulge * 1.5) * 2.2;
    const dDisk = Math.sqrt(Math.pow(cx * 1, 2) + Math.pow(cy * 15, 2)) * 2;
    const disk = Math.exp(-dDisk * 1.5) * 1.0;
    const dustMask = (Math.abs(cy) < 0.02 && Math.abs(cx) < 0.45) ? 0.2 : 1.0;
    const total = (bulge + disk) * dustMask * clamp(1.0 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 250, 0, 255),
      clamp(total * 240, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC1097() {
  // Barred spiral with intense heart
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const bar = Math.exp(-(Math.pow(cx * 0.6, 2) + Math.pow(cy * 8, 2)) * 15) * 1.8;
    const halo = Math.exp(-d * 2.0) * 0.4;
    const spiral = Math.pow(Math.sin(angle * 2 - d * 5) * 0.5 + 0.5, 1.8) * Math.exp(-d * 1.6) * 0.6;
    const core = Math.exp(-d * 20) * 3.0;
    const total = (core + bar + halo + spiral) * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 240 + core * 100, 0, 255),
      clamp(total * 180, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_Arp273() {
  // Arp 273 - Rose Galaxy: interacting pair with swept tidal arm
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d1 = Math.sqrt(Math.pow(u - 0.45, 2) + Math.pow(v - 0.48, 2));
    const core1 = Math.exp(-d1 * 18) * 2.0;
    const angle1 = Math.atan2(v - 0.48, u - 0.45);
    const spiral1 = Math.sin(angle1 * 1.5 - d1 * 25) * 0.5 + 0.5;
    const arm1 = Math.pow(spiral1, 2) * Math.exp(-d1 * 5) * 0.9;
    const d2 = Math.sqrt(Math.pow(u - 0.58, 2) + Math.pow(v - 0.62, 2));
    const core2 = Math.exp(-d2 * 25) * 1.5;
    const halo2 = Math.exp(-d2 * 8) * 0.4;
    const bridgeT = clamp((v - 0.48) / 0.14, 0, 1);
    const bridgeX = lerp(0.45, 0.58, bridgeT);
    const bridge = Math.exp(-Math.pow(u - bridgeX, 2) * 80) * Math.exp(-Math.pow(v - lerp(0.48, 0.62, bridgeT), 2) * 80) * 0.4;
    const total = (core1 + arm1 + core2 + halo2 + bridge) * clamp(1.1 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    return [
      clamp(total * 210 + core1 * 50, 0, 255),
      clamp(total * 220 + core2 * 40, 0, 255),
      clamp(total * 255 + arm1 * 60, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_NGC4631() {
  // NGC 4631 - Whale Galaxy: edge-on distorted spiral with wedge shape
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const warp = cy + cx * 0.08;
    const dDisk = Math.sqrt(Math.pow(cx * 1, 2) + Math.pow(warp * 10, 2)) * 2;
    const disk = Math.exp(-dDisk * 1.3) * 1.3;
    const dCore = Math.sqrt(Math.pow((u - 0.48) * 5, 2) + Math.pow(warp * 8, 2)) * 2;
    const core = Math.exp(-dCore * 2.5) * 1.8;
    const clumps = Math.pow(fbm(u * 15, v * 12, 5), 2) * disk * 1.2;
    const corona = Math.exp(-Math.abs(warp) * 3) * Math.exp(-Math.abs(cx) * 3) * 0.15;
    const fade = clamp(1.0 - Math.sqrt(cx * cx + cy * cy) * 2, 0, 1);
    const total = (core + disk + clumps + corona) * fade;
    return [
      clamp(total * 230 + clumps * 120, 0, 255),
      clamp(total * 235 + core * 30, 0, 255),
      clamp(total * 255 + clumps * 80, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_Lens() {
  // Einstein Ring effect
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-d * 12) * 2.5;
    // Einstein Ring: sharp distorted arcs
    const ring = Math.exp(-Math.pow((d - 0.7) * 15, 2)) * 1.5;
    const angle = Math.atan2(cy, cx);
    const arcs = Math.pow(Math.sin(angle * 2 + fbm(u * 5, v * 5, 3) * 2), 4) * ring;
    const total = (core + arcs) * clamp(1.1 - d, 0, 1);
    return [
      clamp(core * 255 + arcs * 100, 0, 255),
      clamp(core * 100 + arcs * 180, 0, 255),
      clamp(core * 50 + arcs * 255, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_M31() {
  // Andromeda HD: massive tilted spiral (Fixed aspect & Clipping)
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(Math.pow(cx * 1.5, 2) + Math.pow(cy * 5.0, 2)) * 2;
    const angle = Math.atan2(cy * 4.0, cx);
    const spiral = Math.sin(angle * 2 - d * 4) * 0.3 + 0.7;
    const halo = Math.exp(-d * 1.8) * 0.5;
    const disk = Math.exp(-d * 1.4) * 0.8 * spiral;
    const core = Math.exp(-(Math.sqrt(cx * cx + cy * cy) * 10)) * 2.5;
    const fade = clamp(1.0 - Math.sqrt(Math.pow(cx * 2, 2) + Math.pow(cy * 2, 2)), 0, 1);
    const total = (core + halo + disk) * fade;
    return [
      clamp(total * 210 + core * 60, 0, 255),
      clamp(total * 230 + core * 50, 0, 255),
      clamp(total * 255 + core * 30, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_M101() {
  // Pinwheel HD: Huge face-on grand design (Fixed clipping)
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const spiral = Math.sin(angle * 6 - d * 4) * 0.5 + 0.5;
    const halo = Math.exp(-d * 2.0) * 0.5;
    const arms = Math.pow(spiral, 1.5) * Math.exp(-d * 1.6) * 0.6;
    const h2 = Math.pow(fbm(u * 25, v * 25, 5), 2) * arms * 1.5;
    const core = Math.exp(-d * 12) * 2.2;
    const total = (core + halo + arms + h2 * 0.3) * clamp(1.0 - d, 0, 1);
    return [
      clamp(total * 200 + h2 * 120, 0, 255),
      clamp(total * 225, 0, 255),
      clamp(total * 255 + h2 * 60, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_M81() {
  // Bode's Galaxy HD: Two-arm symmetrical spiral
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const spiral = Math.sin(angle * 2 - d * 7) * 0.5 + 0.5;
    const halo = Math.exp(-d * 2.0) * 0.5;
    const arms = Math.pow(spiral, 1.5) * Math.exp(-d * 1.8) * 0.6;
    const n = fbm(u * 12, v * 12, 4) * 0.15 * (halo + arms);
    const core = Math.exp(-d * 15) * 2.5;
    const total = (core + halo + arms + n) * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 255 + core * 50, 0, 255),
      clamp(total * 230 + core * 30, 0, 255),
      clamp(total * 180 + arms * 80, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_M63() {
  // Sunflower HD: Flocculent multiple tight arms (Fixed edges)
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const n = fbm(u * 40, v * 40, 4);
    const halo = Math.exp(-d * 2.0) * 0.4;
    const disk = Math.exp(-d * 1.8) * (0.5 + n * 0.5);
    const core = Math.exp(-d * 20) * 3.0;
    const total = (core + halo + disk) * clamp(1.0 - d, 0, 1);
    return [
      clamp(total * 255, 0, 255),
      clamp(total * 240, 0, 255),
      clamp(total * 180, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texHD_M74() {
  // Phantom Galaxy HD: grand design, high contrast
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const d = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const spiral = Math.sin(angle * 2 - d * 10) * 0.5 + 0.5;
    const halo = Math.exp(-d * 2.0) * 0.5;
    const arms = Math.pow(spiral, 1.5) * Math.exp(-d * 1.8) * 0.6;
    const dust = 1.0 - Math.pow(fbm(u * 30, v * 30, 4), 2) * 0.2;
    const core = Math.exp(-d * 12) * 2.2;
    const total = (core + halo + arms) * dust * clamp(1.1 - d, 0, 1);
    return [
      clamp(total * 180 + core * 100, 0, 255),
      clamp(total * 210, 0, 255),
      clamp(total * 255, 0, 255),
      total * 255
    ];
  }, 512, 512);
}

function texNebula(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const n1 = fbm(u * 4 + 1.3, v * 4 + 0.7, 5);
    const n2 = fbm(u * 6 - 0.5, v * 6 + 1.2, 4);
    const mix = smoothstep(clamp(n1 * 1.5, 0, 1));
    const fade = clamp(1 - dist * 1.1, 0, 1);
    const density = clamp(n2 * 0.8 + 0.3, 0, 1) * fade;
    return [
      clamp(lerp(r1, r2, mix) * density, 0, 255),
      clamp(lerp(g1, g2, mix) * density, 0, 255),
      clamp(lerp(b1, b2, mix) * density, 0, 255),
      clamp(density * 220, 0, 255) | 0
    ];
  }, 256, 256);
}

// Dark nebula / molecular cloud: dense, high contrast, warm dust & filaments
function texDarkNebula(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const n1 = fbm(u * 3 + 2.1, v * 3 + 0.9, 6);
    const n2 = fbm(u * 5 + 0.3, v * 5 - 1.4, 5);
    const density = clamp(n1 * 0.75 + 0.45, 0, 1) * clamp(1 - dist * 0.95, 0, 1);
    const dark = clamp(1 - n2 * 0.65, 0.25, 1);
    const edge = Math.exp(-Math.pow((dist - 0.5) * 3, 2)) * 0.35;
    const total = density * dark + edge;
    const contrast = Math.pow(total, 1.25);
    return [
      clamp(lerp(r1, r2, n1 * n1) * contrast * 0.95, 0, 255),
      clamp(lerp(g1, g2, n1 * n1) * contrast * 0.95, 0, 255),
      clamp(lerp(b1, b2, n1 * n1) * contrast * 0.95, 0, 255),
      clamp(total * 230, 0, 255) | 0
    ];
  }, 256, 256);
}

// Reflection nebula: soft, blue-shifted glow illuminated by a nearby star
function texReflectionNebula(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    // Off-center illumination source
    const lx = u - 0.35, ly = v - 0.4;
    const lightDist = Math.sqrt(lx * lx + ly * ly) * 2;
    const illum = Math.exp(-lightDist * 2.5);
    const n = fbm(u * 5 + 3.1, v * 5 - 1.2, 5);
    const scatter = clamp(n * 0.6 + 0.5, 0, 1);
    const fade = clamp(1 - dist * 1.05, 0, 1);
    const total = (illum * 0.7 + scatter * 0.3) * fade;
    return [
      clamp(lerp(r1, r2, scatter) * total, 0, 255),
      clamp(lerp(g1, g2, scatter) * total, 0, 255),
      clamp(lerp(b1, b2, scatter) * total * 1.2, 0, 255),
      clamp(total * 210, 0, 255) | 0
    ];
  }, 256, 256);
}

// Bipolar planetary nebula: two symmetrical lobes with a bright core
function texBipolarNebula(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    // Two lobes along vertical axis
    const lobeUp = Math.exp(-Math.pow((cy - 0.2) * 5, 2) - Math.pow(cx * 4, 2));
    const lobeDn = Math.exp(-Math.pow((cy + 0.2) * 5, 2) - Math.pow(cx * 4, 2));
    const core = Math.exp(-dist * 7) * 0.8;
    const n = fbm(u * 6 + 1.5, v * 6 - 0.8, 4) * 0.25;
    const total = clamp(lobeUp + lobeDn + core + n * (lobeUp + lobeDn), 0, 1);
    const fade = clamp(1 - dist * 0.85, 0, 1);
    return [
      clamp(lerp(r1, r2, lobeUp) * total * fade, 0, 255),
      clamp(lerp(g1, g2, lobeDn) * total * fade, 0, 255),
      clamp(lerp(b1, b2, core) * total * fade, 0, 255),
      clamp(total * fade * 240, 0, 255) | 0
    ];
  }, 256, 256);
}

// Wolf-Rayet pinwheel: spiral dust lanes around a hot star
function texWolfRayet(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    // Spiral arms
    const spiral = Math.sin(angle * 2 - dist * 18) * 0.5 + 0.5;
    const arm = Math.pow(spiral, 3) * Math.exp(-dist * 1.8);
    // Hot central star
    const core = Math.exp(-dist * 8) * 1.2;
    // Outer wind halo
    const halo = Math.exp(-dist * 2.2) * 0.25;
    const n = fbm(u * 8 + 0.5, v * 8 - 1.3, 4) * 0.15;
    const total = clamp(arm + core + halo + n * arm, 0, 1);
    return [
      clamp(lerp(r1, r2, spiral) * total + core * 255, 0, 255),
      clamp(lerp(g1, g2, spiral) * total + core * 240, 0, 255),
      clamp(lerp(b1, b2, arm) * total + core * 255, 0, 255),
      clamp(total * 255, 0, 255) | 0
    ];
  }, 256, 256);
}

// Magnetar: intense radial beams emanating from a compact core
function texMagnetar(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    // Radial beam pattern (6 beams)
    const beams = Math.pow(Math.abs(Math.cos(angle * 3)), 8) * Math.exp(-dist * 1.5);
    // Pulsing core
    const core = Math.exp(-dist * 12) * 1.5;
    // Magnetic field halo (figure-8 dipole)
    const dipole = Math.exp(-dist * 2.5) * (0.3 + 0.2 * Math.pow(Math.abs(Math.cos(angle)), 2));
    const flicker = fbm(u * 12 + angle, v * 12, 3) * 0.1;
    const fade = clamp(Math.pow(1.0 - dist, 0.5), 0, 1); // Steeper fade to hide beam tips
    const total = clamp(beams + core + dipole + flicker, 0, 1) * fade;
    return [
      clamp(lerp(r1, r2, beams) * total + core * 255, 0, 255),
      clamp(lerp(g1, g2, dist) * total + core * 180, 0, 255),
      clamp(lerp(b1, b2, beams) * total + core * 255, 0, 255),
      clamp(total * 255, 0, 255) | 0
    ];
  }, 256, 256);
}

// Protostar: warm concentric accretion disk with glowing center
function texProtostar(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    // Concentric rings (accretion disk)
    const rings = Math.sin(dist * 28) * 0.3 * Math.exp(-dist * 2.5);
    // Central hot glow
    const core = Math.exp(-dist * 6) * 1.0;
    // Warm halo
    const halo = Math.exp(-dist * 1.8) * 0.35;
    // Slight asymmetry (jet hint)
    const jet = Math.exp(-Math.pow(cx * 8, 2)) * Math.exp(-Math.pow((Math.abs(cy) - 0.2) * 6, 2)) * 0.2;
    const n = fbm(u * 6 + 2.2, v * 6 - 0.7, 4) * 0.1;
    const total = clamp(core + halo + rings + jet + n, 0, 1);
    return [
      clamp(lerp(r1, r2, dist) * total + core * 255, 0, 255),
      clamp(lerp(g1, g2, dist) * total + core * 200, 0, 255),
      clamp(lerp(b1, b2, dist) * total + core * 80, 0, 255),
      clamp(total * 255, 0, 255) | 0
    ];
  }, 256, 256);
}

// Shell SNR: thin expanding shell with hollow interior
function texShellSNR(r1, g1, b1, r2, g2, b2) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    // Thin shell ring
    const shell = Math.exp(-Math.pow((dist - 0.65) * 10, 2));
    // Filamentary structure on the shell
    const filaments = fbm(angle * 2 + u * 4, dist * 8 + v * 4, 5) * 0.4;
    const shellDetail = shell * (0.7 + filaments);
    // Very faint interior glow
    const interior = Math.exp(-dist * 3) * 0.08;
    // Bright knots on the shell
    const knots = fbm(u * 10 + 3.3, v * 10 - 2.1, 4);
    const knotBright = shell * Math.pow(clamp(knots, 0, 1), 3) * 0.5;
    const total = clamp(shellDetail + interior + knotBright, 0, 1);
    return [
      clamp(lerp(r1, r2, filaments + 0.5) * total, 0, 255),
      clamp(lerp(g1, g2, filaments + 0.5) * total, 0, 255),
      clamp(lerp(b1, b2, shell) * total, 0, 255),
      clamp(total * 240, 0, 255) | 0
    ];
  }, 256, 256);
}

function texBlackHole() {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const ring = Math.exp(-Math.pow((dist - 0.45) * 6, 2)) * 1.5;
    const swirl = Math.sin(angle * 3 + dist * 12) * 0.15 + 0.85;
    const inner = smoothstep(clamp((dist - 0.15) * 8, 0, 1));
    const glow = ring * swirl * inner;
    const outerHaze = Math.exp(-dist * 1.6) * 0.7; // Halo beaucoup plus puissant pour être visible de loin
    const total = clamp(glow + outerHaze * inner, 0, 1.3);
    return [
      clamp(255 * total, 0, 255),
      clamp((180 + fbm(u * 8, v * 8, 3) * 60) * total, 0, 255),
      clamp(70 * total, 0, 255),
      clamp(total * 255, 0, 255) | 0
    ];
  }, 256, 256);
}

function texSupernova() {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const angle = Math.atan2(cy, cx);
    const rays = Math.pow(Math.abs(Math.sin(angle * 6 + dist * 3)), 0.5);
    const shell = Math.exp(-Math.pow((dist - 0.5) * 5, 2)) * 0.8;
    const core = Math.exp(-dist * 6) * 0.5;
    const filaments = fbm(u * 10 + angle, v * 10, 4) * 0.4;
    const total = (shell * rays + core + filaments * shell) * clamp(1 - dist * 0.9, 0, 1);
    return [
      clamp(100 * total + 180 * core, 0, 255),
      clamp(180 * total + 220 * core, 0, 255),
      clamp(255 * total + 255 * core, 0, 255),
      clamp(total * 255, 0, 255) | 0
    ];
  }, 256, 256);
}

function texCluster() {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    let brightness = 0;
    // Scatter ~30 bright stars in the texture
    for (let i = 0; i < 30; i++) {
      const sx = hash2d(i, 0) - 0.5, sy = hash2d(i, 1) - 0.5;
      const sd = Math.sqrt((cx - sx * 0.6) ** 2 + (cy - sy * 0.6) ** 2);
      brightness += Math.exp(-sd * 35) * (0.6 + hash2d(i, 2) * 0.5);
    }
    const haze = Math.exp(-dist * 2.2) * 0.45; // Halo bleuté élargi
    const core = Math.exp(-Math.pow(dist * 3.0, 2)) * 2.5; // Noyau en surbrillance blanche (comme les 300 étoiles superposées de Près)
    const total = clamp(brightness + haze + core, 0, 1.5);
    const alpha = clamp((brightness + haze + core) * 1.5, 0, 1);
    return [
      clamp(230 * total + 255 * core, 0, 255), // Centre blanc éblouissant
      clamp(240 * total + 255 * core, 0, 255),
      clamp(255 * total + 255 * core, 0, 255), // Bordure bleue cosmique
      clamp(alpha * 255, 0, 255) | 0
    ];
  }, 256, 256);
}

function texBrightStar(sr, sg, sb) {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-dist * 8);
    const glow = Math.exp(-dist * 2.5) * 0.5;
    const softHalo = Math.exp(-dist * 1.2) * 0.15;
    const total = core + glow + softHalo;
    return [
      clamp(sr * total, 0, 255),
      clamp(sg * total, 0, 255),
      clamp(sb * total, 0, 255),
      clamp(total * 255, 0, 255) | 0
    ];
  }, 128, 128);
}

function texRingNebula() {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const ring = Math.exp(-Math.pow((dist - 0.55) * 6, 2));
    const noise = fbm(u * 8, v * 8, 4) * 0.3;
    const inner = Math.exp(-dist * 3) * 0.3;
    const total = ring * (0.7 + noise) + inner;
    const fade = clamp(1 - dist * 0.9, 0, 1);
    return [
      clamp((80 + 100 * ring) * total * fade, 0, 255),
      clamp((200 + 55 * ring) * total * fade, 0, 255),
      clamp((160 + 80 * ring) * total * fade, 0, 255),
      clamp(total * fade * 230, 0, 255) | 0
    ];
  }, 256, 256);
}

function texSolMarker() {
  return makeTexture((u, v) => {
    const cx = u - 0.5, cy = v - 0.5;
    const dist = Math.sqrt(cx * cx + cy * cy) * 2;
    const core = Math.exp(-dist * 6);
    const ring1 = Math.exp(-Math.pow((dist - 0.4) * 10, 2)) * 0.5;
    const ring2 = Math.exp(-Math.pow((dist - 0.65) * 12, 2)) * 0.25;
    const total = core + ring1 + ring2;
    return [
      clamp(255 * total, 0, 255),
      clamp(210 * total, 0, 255),
      clamp(80 * total, 0, 255),
      clamp(total * 255, 0, 255) | 0
    ];
  }, 128, 128);
}

// Cache for galactic textures
var galTexCache = {};
function getGalacticTexture(poi) {
  if (galTexCache[poi.id]) return galTexCache[poi.id];
  let tex;
  switch (poi.vType) {
    case 'blackhole': tex = texBlackHole(); break;
    case 'nebula': tex = texNebula(...(poi.colors || [200, 80, 140, 140, 60, 200])); break;
    case 'darkneb': tex = texDarkNebula(...(poi.colors || [140, 100, 70, 80, 60, 50])); break;
    case 'reflection': tex = texReflectionNebula(...(poi.colors || [100, 140, 220, 60, 80, 180])); break;
    case 'bipolar': tex = texBipolarNebula(...(poi.colors || [240, 140, 85, 180, 60, 100])); break;
    case 'wolfrayet': tex = texWolfRayet(...(poi.wrColors || [130, 220, 255, 60, 140, 200])); break;
    case 'magnetar': tex = texMagnetar(...(poi.magColors || [255, 80, 255, 100, 40, 200])); break;
    case 'protostar': tex = texProtostar(...(poi.protoColors || [255, 170, 70, 200, 100, 40])); break;
    case 'shellsnr': tex = texShellSNR(...(poi.shellColors || [70, 220, 170, 40, 150, 200])); break;
    case 'supernova': tex = texSupernova(); break;
    case 'cluster': tex = texCluster(); break;
    case 'ring': tex = texRingNebula(); break;
    case 'star': tex = texBrightStar(...(poi.starColor || [255, 200, 100])); break;
    case 'sol': tex = texSolMarker(); break;
    default: tex = texBrightStar(200, 200, 255);
  }
  galTexCache[poi.id] = tex;
  return tex;
}


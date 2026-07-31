'use strict';

// ============================================================
// GALACTIC SCENE BUILDER
// ============================================================

var galaxyParticles = null;

function createGalacticScene() {
  // Ambient light for galactic scene
  galacticScene.add(new THREE.AmbientLight(0x101828, 0.4));

  // Background starfield for galactic scene
  createGalacticBackground();

  // Galaxy spiral
  galaxyParticles = createGalaxySpiral();

  // POIs
  createGalacticPOIs();
}

function createGalacticBackground() {
  const count = 3000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 400000 + Math.random() * 100000;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const b = 0.4 + Math.random() * 0.3;
    col[i * 3] = b; col[i * 3 + 1] = b; col[i * 3 + 2] = b + 0.1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.8, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.6,
  });
  galacticScene.add(new THREE.Points(geo, mat));
}

function createGalaxySpiral() {
  const N = GAL_PARTICLE_COUNT;
  // Inspired by NASA/JPL MW illustration:
  // Smooth blue-lavender disk, golden elliptical bulge, 4 arms with pink HII spots
  const ARM_N = 15000;    // per arm × 4 = 60000
  const BULGE_N = 22000;  // big smooth golden core with embedded bar shape
  const DISK_N = 14000;   // diffuse blue-lavender glow filling inter-arm space
  const HII_N = N - 4 * ARM_N - BULGE_N - DISK_N; // ~4000 pink HII scatter

  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  let idx = 0;

  const SGR_EXCLUSION_R = 2200;
  const SGR_FADE_R = 3500;

  // ── 4 spiral arms (similar density, like the NASA image) ──
  const armOffsets = [0, Math.PI * 0.52, Math.PI * 1.0, Math.PI * 1.52];
  for (let arm = 0; arm < 4; arm++) {
    for (let i = 0; i < ARM_N; i++) {
      const t = Math.pow(Math.random(), 0.7); // bias toward outer regions
      const theta = t * 4.2 * Math.PI;
      const r = 2800 * Math.exp(0.21 * theta);

      // Width: tighter near core, wider at edges
      const spreadW = 300 + r * 0.045;
      const spread = (Math.random() - 0.5) * 2 * spreadW;
      // Thin Gaussian disk height
      const g1 = Math.random() + 0.001, g2 = Math.random();
      const height = Math.sqrt(-2 * Math.log(g1)) * Math.cos(2 * Math.PI * g2) * (180 + r * 0.008);

      const angle = theta + armOffsets[arm];
      const finalR = r + spread;
      const px = Math.cos(angle) * finalR;
      const pz = Math.sin(angle) * finalR;

      const dc = Math.sqrt(px * px + height * height + pz * pz);
      if (dc < SGR_EXCLUSION_R) { pos[idx * 3] = 0; pos[idx * 3 + 1] = -99999; pos[idx * 3 + 2] = 0; col[idx * 3] = 0; col[idx * 3 + 1] = 0; col[idx * 3 + 2] = 0; idx++; continue; }
      const fade = dc < SGR_FADE_R ? clamp((dc - SGR_EXCLUSION_R) / (SGR_FADE_R - SGR_EXCLUSION_R), 0, 1) : 1;

      pos[idx * 3] = px;
      pos[idx * 3 + 1] = height;
      pos[idx * 3 + 2] = pz;

      // Dust lane: darken particles near arm spine
      const armCenter = Math.abs(spread) / spreadW;
      const dust = armCenter < 0.10 ? 0.35 + armCenter * 6.5 : 1.0;

      // Edge fadeout: dimmer toward galaxy edge
      const edgeFade = clamp(1 - dc / 52000, 0.05, 1);

      const brightness = (0.35 + Math.random() * 0.55) * fade * dust * edgeFade;

      // Dominant blue-lavender tone for arms (like the image)
      const rnd = Math.random();
      if (rnd < 0.65) {
        // Blue-white-lavender (dominant tone of the image)
        col[idx * 3] = (0.60 + Math.random() * 0.15) * brightness;
        col[idx * 3 + 1] = (0.65 + Math.random() * 0.15) * brightness;
        col[idx * 3 + 2] = (0.85 + Math.random() * 0.15) * brightness;
      } else if (rnd < 0.85) {
        // Pale blue-white
        col[idx * 3] = (0.75 + Math.random() * 0.15) * brightness;
        col[idx * 3 + 1] = (0.78 + Math.random() * 0.12) * brightness;
        col[idx * 3 + 2] = (0.90 + Math.random() * 0.10) * brightness;
      } else {
        // Warmer white-yellow accents
        col[idx * 3] = (0.85 + Math.random() * 0.10) * brightness;
        col[idx * 3 + 1] = (0.80 + Math.random() * 0.10) * brightness;
        col[idx * 3 + 2] = (0.60 + Math.random() * 0.15) * brightness;
      }
      idx++;
    }
  }

  // ── Central bulge: smooth golden ellipse (bar is just the elongation) ──
  for (let i = 0; i < BULGE_N; i++) {
    // Concentrated toward center with power distribution
    const r = Math.pow(Math.random(), 2.5) * 8000;
    const theta = Math.random() * Math.PI * 2;
    // Elongation creates the "bar" naturally — no separate bar component
    const barAngle = 0.44; // ~25°
    const stretch = 1.8 - clamp(r / 8000, 0, 1) * 0.6; // more elongated near center
    const rawX = Math.cos(theta) * r * stretch;
    const rawZ = Math.sin(theta) * r;
    // Rotate by bar angle
    const x = rawX * Math.cos(barAngle) - rawZ * Math.sin(barAngle);
    const z = rawX * Math.sin(barAngle) + rawZ * Math.cos(barAngle);
    const y = (Math.random() - 0.5) * r * 0.18;

    const dc = Math.sqrt(x * x + y * y + z * z);
    if (dc < SGR_EXCLUSION_R) { pos[idx * 3] = 0; pos[idx * 3 + 1] = -99999; pos[idx * 3 + 2] = 0; col[idx * 3] = 0; col[idx * 3 + 1] = 0; col[idx * 3 + 2] = 0; idx++; continue; }
    const fade = dc < SGR_FADE_R ? clamp((dc - SGR_EXCLUSION_R) / (SGR_FADE_R - SGR_EXCLUSION_R), 0, 1) : 1;

    pos[idx * 3] = x;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = z;

    const brightness = (0.50 + Math.random() * 0.50) * fade;
    // Smooth gradient: bright warm white at center → golden amber at edges
    const rFrac = clamp(dc / 8000, 0, 1);
    col[idx * 3] = (1.0) * brightness;
    col[idx * 3 + 1] = (0.88 - rFrac * 0.25 + Math.random() * 0.05) * brightness;
    col[idx * 3 + 2] = (0.55 - rFrac * 0.30 + Math.random() * 0.06) * brightness;
    idx++;
  }

  // ── Diffuse disk fill: blue-lavender haze everywhere (gives the smooth glow) ──
  for (let i = 0; i < DISK_N; i++) {
    const r = 1500 + Math.pow(Math.random(), 0.6) * 46000;
    const theta = Math.random() * Math.PI * 2;
    const px = Math.cos(theta) * r;
    const py = (Math.random() - 0.5) * 600;
    const pz = Math.sin(theta) * r;

    const dc = Math.sqrt(px * px + py * py + pz * pz);
    if (dc < SGR_EXCLUSION_R) { pos[idx * 3] = 0; pos[idx * 3 + 1] = -99999; pos[idx * 3 + 2] = 0; col[idx * 3] = 0; col[idx * 3 + 1] = 0; col[idx * 3 + 2] = 0; idx++; continue; }
    const fade = dc < SGR_FADE_R ? clamp((dc - SGR_EXCLUSION_R) / (SGR_FADE_R - SGR_EXCLUSION_R), 0, 1) : 1;

    pos[idx * 3] = px;
    pos[idx * 3 + 1] = py;
    pos[idx * 3 + 2] = pz;

    const edgeFade = clamp(1 - dc / 50000, 0, 1);
    const brightness = (0.12 + Math.random() * 0.20) * fade * edgeFade;
    // Soft lavender-blue fill
    col[idx * 3] = (0.50 + Math.random() * 0.15) * brightness;
    col[idx * 3 + 1] = (0.52 + Math.random() * 0.15) * brightness;
    col[idx * 3 + 2] = (0.72 + Math.random() * 0.18) * brightness;
    idx++;
  }

  // ── Pink/red H II regions: small bright dots scattered along arms ──
  for (let i = 0; i < HII_N; i++) {
    // Place along arm structure
    const arm = Math.floor(Math.random() * 4);
    const t = Math.pow(Math.random(), 0.6);
    const theta = t * 4.2 * Math.PI;
    const r = 2800 * Math.exp(0.21 * theta);
    const spreadW = 300 + r * 0.04;
    const spread = (Math.random() - 0.5) * 2 * spreadW * 0.7; // closer to arm center
    const height = (Math.random() - 0.5) * 350;

    const angle = theta + armOffsets[arm];
    const finalR = r + spread;
    const px = Math.cos(angle) * finalR;
    const pz = Math.sin(angle) * finalR;

    const dc = Math.sqrt(px * px + height * height + pz * pz);
    if (dc < SGR_EXCLUSION_R) { pos[idx * 3] = 0; pos[idx * 3 + 1] = -99999; pos[idx * 3 + 2] = 0; col[idx * 3] = 0; col[idx * 3 + 1] = 0; col[idx * 3 + 2] = 0; idx++; continue; }
    const fade = dc < SGR_FADE_R ? clamp((dc - SGR_EXCLUSION_R) / (SGR_FADE_R - SGR_EXCLUSION_R), 0, 1) : 1;

    pos[idx * 3] = px;
    pos[idx * 3 + 1] = height;
    pos[idx * 3 + 2] = pz;

    // Bright pink/red-magenta like in the NASA image
    const brightness = (0.6 + Math.random() * 0.4) * fade;
    col[idx * 3] = (0.90 + Math.random() * 0.10) * brightness;
    col[idx * 3 + 1] = (0.20 + Math.random() * 0.20) * brightness;
    col[idx * 3 + 2] = (0.35 + Math.random() * 0.25) * brightness;
    idx++;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.8, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  galacticScene.add(points);
  return points;
}

// ── GALAXIES DÉCORATIVES D'ARRIÈRE-PLAN ──
function createBackgroundGalaxies() {
  const group = new THREE.Group();
  EXTRA_GALAXIES.forEach(data => {
    let tex;
    if (data.type === 'spiral') tex = texExtraGalaxySpiral(data.color);
    else if (data.type === 'elliptical') tex = texExtraGalaxyElliptical(data.color);
    else if (data.type === 'ring') tex = texExtraGalaxyRing(data.color);
    else if (data.type === 'interacting') tex = texExtraGalaxyInteracting(data.color);
    else if (data.type === 'edgeon') tex = texExtraGalaxyEdgeOn(data.color);
    else if (data.type === 'starburst') tex = texExtraGalaxyStarburst(data.color);
    else if (data.type === 'hd_m83') tex = texHD_M83();
    else if (data.type === 'hd_m82') tex = texHD_M82();
    else if (data.type === 'hd_cena') tex = texHD_CentaurusA();
    else if (data.type === 'hd_7331') tex = texHD_NGC7331();
    else if (data.type === 'hd_6946') tex = texHD_NGC6946();
    else if (data.type === 'hd_m51') tex = texHD_M51();
    else if (data.type === 'hd_antennae') tex = texHD_Antennae();
    else if (data.type === 'hd_elden') tex = texHD_EldenRing();
    else if (data.type === 'hd_owls') tex = texHD_OwlsEyes();
    else if (data.type === 'hd_fireball') tex = texHD_Fireball();
    else if (data.type === 'hd_blackeye') tex = texHD_BlackEye();
    else if (data.type === 'hd_hoag') tex = texHD_Hoag();
    else if (data.type === 'hd_sculptor') tex = texHD_Sculptor();
    else if (data.type === 'hd_slug') tex = texHD_Slug();
    else if (data.type === 'hd_snowwhite') tex = texHD_Snowwhite();
    else if (data.type === 'hd_3627') tex = texHD_NGC3627();
    else if (data.type === 'hd_mist') tex = texHD_MorningMist();
    else if (data.type === 'hd_finger') tex = texHD_GodsFinger();
    else if (data.type === 'hd_netflix') tex = texHD_Netflix();
    else if (data.type === 'hd_sombrero') tex = texHD_Sombrero();
    else if (data.type === 'hd_1097') tex = texHD_NGC1097();
    else if (data.type === 'hd_collider') tex = texHD_GiantCollider();
    else if (data.type === 'hd_torpedo') tex = texHD_Torpedo();
    else if (data.type === 'hd_m31') tex = texHD_M31();
    else if (data.type === 'hd_m101') tex = texHD_M101();
    else if (data.type === 'hd_m81') tex = texHD_M81();
    else if (data.type === 'hd_m63') tex = texHD_M63();
    else if (data.type === 'hd_m74') tex = texHD_M74();
    else tex = texExtraGalaxyIrregular(data.color);

    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      opacity: data.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(mat);
    sprite.frustumCulled = false; // Empêche la disparition quand le centre est hors-champ ou trop loin
    sprite.position.set(...data.pos);
    sprite.scale.set(data.scale, data.scale, 1);

    // Simuler inclinaison pour les spirales/disques/edge-on
    if (data.type === 'spiral' || data.type === 'edgeon' || data.type === 'ring') {
      sprite.scale.y *= Math.cos(data.tilt || 0.5);
      sprite.material.rotation = (data.tilt || 0.5) * 2;
    }

    group.add(sprite);
  });
  galacticScene.add(group);
}

function createGalacticPOIs() {
  for (const poi of GALACTIC_POI) {
    const group = new THREE.Group();
    group.position.set(poi.pos[0], poi.pos[1], poi.pos[2]);

    const s = poi.scale;
    const tier = poi.tier || 3;
    let sprite = null;

    {
      // All tiers: full quality rendering
      const tex = getGalacticTexture(poi);
      const spriteMat = new THREE.SpriteMaterial({
        map: tex, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
        opacity: 0.9,
      });
      sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(s, s, 1);
      group.add(sprite);
    }

    // Invisible clickable sphere
    const clickS = tier === 4 ? Math.max(s * 0.15, 40) : s * 0.4;
    const clickGeo = new THREE.SphereGeometry(clickS, 8, 8);
    const clickMat = new THREE.MeshBasicMaterial({ visible: false });
    const clickMesh = new THREE.Mesh(clickGeo, clickMat);
    clickMesh.userData.poiId = poi.id;
    group.add(clickMesh);
    galacticClickables.push(clickMesh);

    // ── Enhanced detail objects (LOD controlled) ──
    const detail = new THREE.Group();
    detail.visible = false;
    group.add(detail);
    let extras = null;

    // Only generate expensive extra details for high tiers or visitable systems
    if (tier <= 2 || poi.vType === 'system') {
      if (poi.vType === 'blackhole') {
        extras = createBlackHoleExtras(s, detail, poi.id);
      } else if (poi.vType === 'nebula') {
        extras = createNebulaExtras(s, poi, detail);
      } else if (poi.vType === 'cluster') {
        extras = createClusterExtras(s, detail);
      } else if (poi.vType === 'supernova') {
        extras = createSupernovaExtras(s, poi, detail);
      } else if (poi.vType === 'system') {
        const sBody = SYSTEMS_DATA[poi.id] ? SYSTEMS_DATA[poi.id].bodies.slice(0, 6) : BODIES.slice(0, 6);
        const sRadius = SYSTEMS_DATA[poi.id] ? SYSTEMS_DATA[poi.id].sunRadius : 3.2;
        extras = createMiniSystemExtras(s, detail, sBody, sRadius, poi.dotColor);
      }
    }

    // Label
    const labelCls = poi.vType === 'system' ? 'sun-marker-label' : 'poi-label';
    const label = makeLabel(poi.name, labelCls);
    galacticLabelEls.push({ el: label, group: group, data: poi });

    galacticScene.add(group);
    galacticPOIObjects[poi.id] = { group, sprite, clickMesh, label, data: poi, detail, extras };
  }
}

// ── Soft circle texture for particles (no white squares) ──
var _particleTex = null;
function getParticleTexture() {
  if (_particleTex) return _particleTex;
  const sz = 32;
  const cvs = document.createElement('canvas');
  cvs.width = sz; cvs.height = sz;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, sz, sz);
  _particleTex = new THREE.CanvasTexture(cvs);
  return _particleTex;
}

// ── Black Hole extras ──
function createBlackHoleExtras(s, parent, poiId) {
  const isSgrA = (poiId === 'sgr-a');
  const palette = isSgrA
    ? { disk: 0xff7700, inner: 0xffaa22, photon: 0xffcc40, jetR: 0.15, jetG: 0.35, jetB: 0.9 }
    : { disk: 0x6644cc, inner: 0x9966ff, photon: 0x8855ee, jetR: 0.6, jetG: 0.3, jetB: 1.0 };

  // ── Sgr A* enhanced parameters (larger, cleaner, more monumental) ──
  const darkR = isSgrA ? s * 0.18 : s * 0.1;   // dark sphere radius
  const photonInner = isSgrA ? s * 0.19 : s * 0.11;  // photon ring inner
  const photonOuter = isSgrA ? s * 0.23 : s * 0.135; // photon ring outer
  const diskR = isSgrA ? s * 0.38 : s * 0.35;  // accretion disk radius
  const diskTube = isSgrA ? s * 0.012 : s * 0.025; // accretion disk tube (thinner for SgrA)
  const outerR = isSgrA ? s * 0.52 : s * 0.48;  // outer faint disk radius
  const outerTube = isSgrA ? s * 0.008 : s * 0.015; // outer disk tube
  const innerR = isSgrA ? s * 0.26 : s * 0.2;   // inner hot ring radius
  const innerTube = isSgrA ? s * 0.01 : s * 0.018; // inner hot ring tube
  const tiltX = isSgrA ? Math.PI * 0.42 : Math.PI * 0.55;

  // Accretion disk (thin torus — thinner for Sgr A*)
  const diskGeo = new THREE.TorusGeometry(diskR, diskTube, 8, 96);
  const diskMat = new THREE.MeshBasicMaterial({
    color: palette.disk, transparent: true, opacity: isSgrA ? 0.70 : 0.65,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const disk = new THREE.Mesh(diskGeo, diskMat);
  disk.rotation.x = tiltX;
  parent.add(disk);

  // Secondary wider faint disk
  const outerGeo = new THREE.TorusGeometry(outerR, outerTube, 6, 96);
  const outerMat = new THREE.MeshBasicMaterial({
    color: palette.disk, transparent: true, opacity: isSgrA ? 0.25 : 0.2,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const outerDisk = new THREE.Mesh(outerGeo, outerMat);
  outerDisk.rotation.x = tiltX;
  parent.add(outerDisk);

  // ── Sgr A* extra: visible disk rotation via attached glowing hot spots ──
  if (isSgrA) {
    const spotTex = getParticleTexture();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spot = new THREE.Sprite(new THREE.SpriteMaterial({
        map: spotTex, color: 0xffeedd, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      spot.position.set(Math.cos(a) * diskR, Math.sin(a) * diskR, 0);
      spot.scale.set(s * 0.1, s * 0.1, 1);
      disk.add(spot);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const spot = new THREE.Sprite(new THREE.SpriteMaterial({
        map: spotTex, color: 0xffaa44, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      spot.position.set(Math.cos(a) * outerR, Math.sin(a) * outerR, 0);
      spot.scale.set(s * 0.14, s * 0.14, 1);
      outerDisk.add(spot);
    }
  }

  // Inner hot ring
  const innerGeo = new THREE.TorusGeometry(innerR, innerTube, 8, 64);
  const innerMat = new THREE.MeshBasicMaterial({
    color: palette.inner, transparent: true, opacity: isSgrA ? 0.6 : 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const innerDisk = new THREE.Mesh(innerGeo, innerMat);
  innerDisk.rotation.x = tiltX;
  parent.add(innerDisk);

  // Dark sphere (event horizon — larger for Sgr A* for monumental feel)
  const lensSphere = new THREE.Mesh(
    new THREE.SphereGeometry(darkR, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: false })
  );
  parent.add(lensSphere);

  // Photon ring glow (crisp, bright ring hugging the event horizon)
  const photonGeo = new THREE.RingGeometry(photonInner, photonOuter, 64);
  const photonMat = new THREE.MeshBasicMaterial({
    color: palette.photon, transparent: true, opacity: isSgrA ? 0.85 : 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const photonRing = new THREE.Mesh(photonGeo, photonMat);
  photonRing.rotation.x = tiltX;
  parent.add(photonRing);

  // ── Sgr A* extra: secondary photon ring (edge-on shimmer) ──
  let photonRing2 = null;
  if (isSgrA) {
    const pr2Geo = new THREE.RingGeometry(s * 0.185, s * 0.215, 64);
    const pr2Mat = new THREE.MeshBasicMaterial({
      color: 0xffddaa, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    photonRing2 = new THREE.Mesh(pr2Geo, pr2Mat);
    photonRing2.rotation.x = tiltX + Math.PI * 0.5; // perpendicular
    parent.add(photonRing2);
  }

  // ── Sgr A* extra: subtle gravitational lensing halo & Einstein Ring ──
  let lensHalo = null;
  if (isSgrA) {
    const haloTex = getParticleTexture();
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex, color: 0x88ccff, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    lensHalo = new THREE.Sprite(haloMat);
    lensHalo.scale.set(s * 0.95, s * 0.95, 1);
    parent.add(lensHalo);

    // Faint Einstein Ring mimicking bent background starlight
    const erGeo = new THREE.RingGeometry(darkR * 1.05, darkR * 1.25, 64);
    const erMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const einsteinRing = new THREE.Mesh(erGeo, erMat);
    einsteinRing.rotation.x = tiltX + Math.PI * 0.2; // Offset from disk
    parent.add(einsteinRing);
  }

  // Bipolar jets — fewer and thinner for Sgr A* (sober, monumental)
  const ptex = getParticleTexture();
  const jetCount = isSgrA ? 120 : 160;
  const jetPosArr = new Float32Array(jetCount * 3);
  const jetColArr = new Float32Array(jetCount * 3);
  for (let i = 0; i < jetCount; i++) {
    const half = i < jetCount / 2 ? 1 : -1;
    const t = Math.random();
    const h = (t * t) * s * (isSgrA ? 1.8 : 1.5) * half;
    const spread = (1 - t) * s * (isSgrA ? 0.035 : 0.05); // tighter collimation for Sgr A*
    jetPosArr[i * 3] = (Math.random() - 0.5) * spread;
    jetPosArr[i * 3 + 1] = h;
    jetPosArr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    const fade = 1 - t * 0.6;
    jetColArr[i * 3] = palette.jetR * fade;
    jetColArr[i * 3 + 1] = palette.jetG * fade;
    jetColArr[i * 3 + 2] = palette.jetB * fade;
  }
  const jetGeo = new THREE.BufferGeometry();
  jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPosArr, 3));
  jetGeo.setAttribute('color', new THREE.BufferAttribute(jetColArr, 3));
  const jetMat = new THREE.PointsMaterial({
    size: isSgrA ? 20 : 18, sizeAttenuation: true, vertexColors: true, map: ptex,
    transparent: true, opacity: isSgrA ? 0.45 : 0.45, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const jets = new THREE.Points(jetGeo, jetMat);
  parent.add(jets);

  return {
    type: 'blackhole', disk, outerDisk, innerDisk, jets, jetPosArr, jetCount, s,
    diskTilt: tiltX, isSgrA, photonRing2, lensHalo, lensSphere,
  };
}

// ── Nebula: outer glow halo + slow rotation ──
function createNebulaExtras(s, poi, parent) {
  const haloTex = getGalacticTexture(poi);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex, transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false,
    color: new THREE.Color(
      (poi.colors ? poi.colors[0] : 200) / 255,
      (poi.colors ? poi.colors[1] : 100) / 255,
      (poi.colors ? poi.colors[2] : 180) / 255
    ),
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(s * 2.2, s * 2.2, 1);
  parent.add(halo);

  const glow2Mat = new THREE.SpriteMaterial({
    map: haloTex, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false,
    color: new THREE.Color(
      (poi.colors ? poi.colors[3] : 150) / 255,
      (poi.colors ? poi.colors[4] : 80) / 255,
      (poi.colors ? poi.colors[5] : 200) / 255
    ),
  });
  const glow2 = new THREE.Sprite(glow2Mat);
  glow2.scale.set(s * 1.5, s * 1.5, 1);
  parent.add(glow2);

  return { type: 'nebula', halo, glow2, s };
}

// ── Cluster: 300 scintillating star particles ──
function createClusterExtras(s, parent) {
  const ptex = getParticleTexture();
  const count = 300;
  const posArr = new Float32Array(count * 3);
  const colArr = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 1.5) * s * 0.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    posArr[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    posArr[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.4;
    posArr[i * 3 + 2] = Math.cos(phi) * r;
    const temp = Math.random();
    colArr[i * 3] = 0.7 + temp * 0.3;
    colArr[i * 3 + 1] = 0.75 + temp * 0.15;
    colArr[i * 3 + 2] = 1.0 - temp * 0.2;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  const mat = new THREE.PointsMaterial({
    size: 3.5, sizeAttenuation: false, vertexColors: true, map: ptex,
    transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  parent.add(stars);

  return { type: 'cluster', stars, mat, phases, count, colArr };
}

// ── Supernova: pulsing shell + pulsar ──
function createSupernovaExtras(s, poi, parent) {
  const ptex = getParticleTexture();
  const count = 180;
  const posArr = new Float32Array(count * 3);
  const colArr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = (0.3 + Math.random() * 0.7) * s * 0.5;
    posArr[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    posArr[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.6;
    posArr[i * 3 + 2] = Math.cos(phi) * r;
    // Filament colors: blue-cyan-white mix
    const v = Math.random();
    colArr[i * 3] = 0.25 + v * 0.35;
    colArr[i * 3 + 1] = 0.55 + v * 0.35;
    colArr[i * 3 + 2] = 0.85 + v * 0.15;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  const mat = new THREE.PointsMaterial({
    size: 2.5, sizeAttenuation: false, vertexColors: true, map: ptex,
    transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const shell = new THREE.Points(geo, mat);
  parent.add(shell);

  // Central pulsar glow (needs texture to avoid white square)
  const pulsarGlowTex = getParticleTexture();
  const pulsarMat = new THREE.SpriteMaterial({
    map: pulsarGlowTex,
    color: 0x60c0ff, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const pulsar = new THREE.Sprite(pulsarMat);
  pulsar.scale.set(s * 0.15, s * 0.15, 1);
  parent.add(pulsar);

  return { type: 'supernova', shell, mat, pulsar, pulsarMat, s };
}

// ── Mini Star System for Galactic View ──
function createMiniSystemExtras(s, parent, sysBodies, coreSize, dotCol) {
  const g = new THREE.Group();

  // Sun / Star
  const sunGeo = new THREE.SphereGeometry(Math.max(s * 0.04, coreSize * s * 0.015), 16, 16);
  const sunCol = new THREE.Color(dotCol);
  const sunMat = new THREE.MeshBasicMaterial({ color: sunCol });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  g.add(sun);

  const spotTex = getParticleTexture();
  const glowMat = new THREE.SpriteMaterial({ map: spotTex, color: sunCol, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(s * 0.45, s * 0.45, 1);
  g.add(glow);

  const planets = [];
  const tilt = Math.PI * 0.52; // slightly tilted from exactly flat

  let ringRadius = s * 0.16;

  for (const b of sysBodies) {
    // Orbit ring
    const oGeo = new THREE.RingGeometry(ringRadius, ringRadius + s * 0.003, 64);
    const oMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
    const oMesh = new THREE.Mesh(oGeo, oMat);
    oMesh.rotation.x = tilt;
    g.add(oMesh);

    // Planet Pivot & Mesh
    const pivot = new THREE.Group();
    pivot.rotation.x = tilt;
    const ang = Math.random() * Math.PI * 2;
    pivot.rotation.z = ang;

    // Size scaled down, Giants a bit bigger
    const isGiant = b.type.includes('Giant');
    const pSize = isGiant ? s * 0.025 : s * 0.012;

    const pGeo = new THREE.SphereGeometry(pSize, 8, 8);
    const pCol = new THREE.Color(b.dotColor);
    const pMat = new THREE.MeshBasicMaterial({ color: pCol });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    pMesh.position.set(ringRadius, 0, 0);

    // Simple ring for Saturn
    if (b.id === 'saturn') {
      const srGeo = new THREE.RingGeometry(pSize * 1.6, pSize * 2.4, 16);
      const srMat = new THREE.MeshBasicMaterial({ color: 0xccbbaa, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const srMesh = new THREE.Mesh(srGeo, srMat);
      pMesh.add(srMesh);
    }

    pivot.add(pMesh);
    g.add(pivot);

    // Slowing period for aesthetics
    planets.push({ pivot, speed: clamp((1 / b.period) * 1.2, 0.05, 1.8) });

    ringRadius += isGiant ? s * 0.12 : s * 0.07;
  }

  parent.add(g);
  return { type: 'sol', planets };
}

// ── POI animation update (called every frame when galactic) ──
var _camWorldPos = new THREE.Vector3();
function updateGalacticPOIs(dt, activeCam) {
  // Get world position of active camera (critical for cockpit mode)
  activeCam.getWorldPosition(_camWorldPos);
  const now = performance.now() * 0.001;

  for (const id in galacticPOIObjects) {
    const obj = galacticPOIObjects[id];

    // ── Phase 4 Gameplay Priority: Pulsing Local Neighborhood ──
    if (id === 'sol' || id === 'alpha-centauri' || id === 'sirius') {
      if (obj.sprite) {
        const baseS = obj.data.scale;
        // Un pulse doux et continu qui donne envie de cliquer
        const p = 1.0 + Math.sin(now * 3.5 + obj.data.pos[0]) * 0.08;
        obj.sprite.scale.set(baseS * p, baseS * p, 1);
      }
    }

    if (!obj.extras) continue;

    const dist = _camWorldPos.distanceTo(obj.group.position);
    const lodThreshold = obj.data.scale * 50;
    const isNear = dist < lodThreshold;

    // LOD: show/hide detail group
    if (obj.detail) obj.detail.visible = isNear;

    // ── Dim main sprite when detail is visible ──
    if (obj.extras && obj.extras.isSgrA) {
      obj.sprite.material.opacity = isNear ? 0.15 : 0.9;
    } else if (obj.extras && obj.extras.type === 'sol') {
      obj.sprite.material.opacity = isNear ? 0.05 : 0.9;
    }

    if (!isNear) continue;

    const ex = obj.extras;

    if (ex.type === 'blackhole') {
      // Rotate accretion disks
      const rotSpeed = ex.isSgrA ? 0.35 : 0.4; // slightly faster for Sgr A* to show hot spots turning
      ex.disk.rotation.z += dt * rotSpeed;
      ex.outerDisk.rotation.z += dt * rotSpeed * 0.6;
      ex.innerDisk.rotation.z -= dt * rotSpeed * 1.4;

      // Animate secondary photon ring for Sgr A*
      if (ex.photonRing2) {
        ex.photonRing2.rotation.z += dt * 0.15;
      }
      // Pulse lens halo subtly
      if (ex.lensHalo) {
        const hPulse = 0.08 + Math.sin(now * 0.4) * 0.04;
        ex.lensHalo.material.opacity = hPulse;
      }

      // Animate jet particles
      const jetMaxH = ex.isSgrA ? ex.s * 1.8 : ex.s * 1.5;
      const jetSpread = ex.isSgrA ? ex.s * 0.015 : ex.s * 0.03;
      const jp = ex.jets.geometry.attributes.position.array;
      for (let i = 0; i < ex.jetCount; i++) {
        const half = i < ex.jetCount / 2 ? 1 : -1;
        jp[i * 3 + 1] += half * dt * ex.s * (ex.isSgrA ? 0.35 : 0.5);
        if (Math.abs(jp[i * 3 + 1]) > jetMaxH) {
          jp[i * 3] = (Math.random() - 0.5) * jetSpread;
          jp[i * 3 + 1] = half * Math.random() * ex.s * 0.06;
          jp[i * 3 + 2] = (Math.random() - 0.5) * jetSpread;
        }
      }
      ex.jets.geometry.attributes.position.needsUpdate = true;

    } else if (ex.type === 'nebula') {
      obj.sprite.material.rotation += dt * 0.015;
      ex.halo.material.rotation -= dt * 0.008;
      ex.glow2.material.rotation += dt * 0.012;
      const pulse = 0.18 + Math.sin(now * 0.5 + obj.data.pos[0] * 0.001) * 0.05;
      ex.halo.material.opacity = pulse;

    } else if (ex.type === 'cluster') {
      // Per-star scintillation via opacity modulation
      const t = now * 3.0;
      const op = 0.65 + Math.sin(t + ex.phases[0]) * 0.2;
      ex.mat.opacity = op;

    } else if (ex.type === 'supernova') {
      const flash = 0.3 + Math.abs(Math.sin(now * 8)) * 0.7;
      ex.pulsarMat.opacity = flash;
      const ps = ex.s * 0.1 + flash * ex.s * 0.08;
      ex.pulsar.scale.set(ps, ps, 1);
      ex.shell.rotation.y += dt * 0.05;
      ex.mat.opacity = 0.4 + Math.sin(now * 0.8) * 0.12;

    } else if (ex.type === 'sol') {
      // Slow orbital motion
      for (const p of ex.planets) {
        p.pivot.rotation.z -= dt * p.speed * state.timeScale * 0.05;
      }
    }
  }
}


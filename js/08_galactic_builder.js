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

  // Wormholes (Étape 3.1)
  createWormholes();

  // Vessel Manhattan Map Representation
  createVesselMapModel();
}

function createGalacticBackground() {
  // Layer 1: Dense background starfield with varied brightness and colors
  const count = 8000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 4000000 + Math.random() * 1500000;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    // Magnitude distribution: many faint, few bright
    const mag = Math.pow(Math.random(), 2.5);
    const brightness = 0.15 + mag * 0.7;
    // Color variety based on stellar temperature
    const temp = Math.random();
    if (temp < 0.50) {
      // White / blue-white
      col[i * 3] = (0.82 + Math.random() * 0.12) * brightness;
      col[i * 3 + 1] = (0.84 + Math.random() * 0.12) * brightness;
      col[i * 3 + 2] = (0.92 + Math.random() * 0.08) * brightness;
    } else if (temp < 0.72) {
      // Yellow-white (sun-like)
      col[i * 3] = (0.92 + Math.random() * 0.08) * brightness;
      col[i * 3 + 1] = (0.86 + Math.random() * 0.10) * brightness;
      col[i * 3 + 2] = (0.68 + Math.random() * 0.12) * brightness;
    } else if (temp < 0.88) {
      // Orange-amber
      col[i * 3] = (0.88 + Math.random() * 0.12) * brightness;
      col[i * 3 + 1] = (0.65 + Math.random() * 0.12) * brightness;
      col[i * 3 + 2] = (0.38 + Math.random() * 0.14) * brightness;
    } else {
      // Blue (hot stars)
      col[i * 3] = (0.55 + Math.random() * 0.12) * brightness;
      col[i * 3 + 1] = (0.68 + Math.random() * 0.12) * brightness;
      col[i * 3 + 2] = (0.92 + Math.random() * 0.08) * brightness;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.8, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.7,
  });
  galacticScene.add(new THREE.Points(geo, mat));

  // Layer 2: Fewer brighter accent stars with larger size
  const brightCount = 800;
  const geo2 = new THREE.BufferGeometry();
  const pos2 = new Float32Array(brightCount * 3);
  const col2 = new Float32Array(brightCount * 3);
  for (let i = 0; i < brightCount; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 3900000 + Math.random() * 1200000;
    pos2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos2[i * 3 + 2] = r * Math.cos(phi);
    const brightness = 0.5 + Math.random() * 0.5;
    const temp = Math.random();
    if (temp < 0.4) {
      col2[i * 3] = 0.95 * brightness; col2[i * 3 + 1] = 0.95 * brightness; col2[i * 3 + 2] = 1.0 * brightness;
    } else if (temp < 0.7) {
      col2[i * 3] = 1.0 * brightness; col2[i * 3 + 1] = 0.9 * brightness; col2[i * 3 + 2] = 0.7 * brightness;
    } else {
      col2[i * 3] = 0.7 * brightness; col2[i * 3 + 1] = 0.8 * brightness; col2[i * 3 + 2] = 1.0 * brightness;
    }
  }
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  geo2.setAttribute('color', new THREE.BufferAttribute(col2, 3));
  const mat2 = new THREE.PointsMaterial({
    size: 1.4, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.5,
  });
  galacticScene.add(new THREE.Points(geo2, mat2));

  // Layer 3: Subtle diffuse nebulous patches for cosmic depth
  const ptex = getParticleTexture();
  const patchColors = [0x4a5570, 0x5a4555, 0x3e4d6a, 0x554660, 0x4a5060];
  for (let i = 0; i < 5; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 4200000;
    const pMat = new THREE.SpriteMaterial({
      map: ptex, color: patchColors[i], transparent: true,
      opacity: 0.06 + Math.random() * 0.04,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const patch = new THREE.Sprite(pMat);
    patch.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    const ps = 800000 + Math.random() * 600000;
    patch.scale.set(ps, ps, 1);
    galacticScene.add(patch);
  }
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

  const SGR_EXCLUSION_R = 22000;
  const SGR_FADE_R = 35000;

  // ── 4 spiral arms (similar density, like the NASA image) ──
  const armOffsets = [0, Math.PI * 0.52, Math.PI * 1.0, Math.PI * 1.52];
  for (let arm = 0; arm < 4; arm++) {
    for (let i = 0; i < ARM_N; i++) {
      const t = Math.pow(Math.random(), 0.7); // bias toward outer regions
      const theta = t * 4.2 * Math.PI;
      const r = 28000 * Math.exp(0.21 * theta);

      // Width: tighter near core, wider at edges
      const spreadW = 3000 + r * 0.045;
      const spread = (Math.random() - 0.5) * 2 * spreadW;
      // Thin Gaussian disk height
      const g1 = Math.random() + 0.001, g2 = Math.random();
      const height = Math.sqrt(-2 * Math.log(g1)) * Math.cos(2 * Math.PI * g2) * (1800 + r * 0.008);

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
      const edgeFade = clamp(1 - dc / 520000, 0.05, 1);

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
    const r = Math.pow(Math.random(), 2.5) * 80000;
    const theta = Math.random() * Math.PI * 2;
    // Elongation creates the "bar" naturally — no separate bar component
    const barAngle = 0.44; // ~25°
    const stretch = 1.8 - clamp(r / 80000, 0, 1) * 0.6; // more elongated near center
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
    const rFrac = clamp(dc / 80000, 0, 1);
    col[idx * 3] = (1.0) * brightness;
    col[idx * 3 + 1] = (0.88 - rFrac * 0.25 + Math.random() * 0.05) * brightness;
    col[idx * 3 + 2] = (0.55 - rFrac * 0.30 + Math.random() * 0.06) * brightness;
    idx++;
  }

  // ── Diffuse disk fill: blue-lavender haze everywhere (gives the smooth glow) ──
  for (let i = 0; i < DISK_N; i++) {
    const r = 15000 + Math.pow(Math.random(), 0.6) * 460000;
    const theta = Math.random() * Math.PI * 2;
    const px = Math.cos(theta) * r;
    const py = (Math.random() - 0.5) * 6000;
    const pz = Math.sin(theta) * r;

    const dc = Math.sqrt(px * px + py * py + pz * pz);
    if (dc < SGR_EXCLUSION_R) { pos[idx * 3] = 0; pos[idx * 3 + 1] = -99999; pos[idx * 3 + 2] = 0; col[idx * 3] = 0; col[idx * 3 + 1] = 0; col[idx * 3 + 2] = 0; idx++; continue; }
    const fade = dc < SGR_FADE_R ? clamp((dc - SGR_EXCLUSION_R) / (SGR_FADE_R - SGR_EXCLUSION_R), 0, 1) : 1;

    pos[idx * 3] = px;
    pos[idx * 3 + 1] = py;
    pos[idx * 3 + 2] = pz;

    const edgeFade = clamp(1 - dc / 500000, 0, 1);
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
    const r = 28000 * Math.exp(0.21 * theta);
    const spreadW = 3000 + r * 0.04;
    const spread = (Math.random() - 0.5) * 2 * spreadW * 0.7; // closer to arm center
    const height = (Math.random() - 0.5) * 3500;

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
    else if (data.type === 'hd_am0644') tex = texHD_AM0644();
    else if (data.type === 'hd_quintet') tex = texHD_StephansQuintet();
    else if (data.type === 'hd_ngc1365') tex = texHD_NGC1365();
    else if (data.type === 'hd_blackeye') tex = texHD_BlackEye();
    else if (data.type === 'hd_hoag') tex = texHD_Hoag();
    else if (data.type === 'hd_sculptor') tex = texHD_Sculptor();
    else if (data.type === 'hd_ngc1300') tex = texHD_NGC1300();
    else if (data.type === 'hd_ngc1316') tex = texHD_NGC1316();
    else if (data.type === 'hd_3627') tex = texHD_NGC3627();
    else if (data.type === 'hd_mist') tex = texHD_MorningMist();
    else if (data.type === 'hd_m87') tex = texHD_M87();
    else if (data.type === 'hd_ngc4565') tex = texHD_NGC4565();
    else if (data.type === 'hd_sombrero') tex = texHD_Sombrero();
    else if (data.type === 'hd_1097') tex = texHD_NGC1097();
    else if (data.type === 'hd_arp273') tex = texHD_Arp273();
    else if (data.type === 'hd_ngc4631') tex = texHD_NGC4631();
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

// ── GALACTIC LOD SYSTEM ──
const galacticLODs = [];
let currentLODIndex = 0;
const LOD_UPDATES_PER_FRAME = 50; // Pour optimiser Intel UHD 620

function createGalacticPOIs() {
  for (const poi of GALACTIC_POI) {
    const group = new THREE.Group();
    group.position.set(poi.pos[0], poi.pos[1], poi.pos[2]);

    const lod = new THREE.LOD();
    group.add(lod);
    galacticLODs.push(lod);

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
    let extras = null;

    // Générer les détails 3D (LOD niveau 0, masqué et non animé à longue distance pour optimiser)
    if (poi.vType === 'blackhole') {
      if (poi.id === 'sgr-a') {
        const bh = new BlackHole({ radius: s, theme: 'orange' });
        detail.add(bh.getMesh());
        extras = {
          type: 'blackhole',
          isSgrA: true,
          blackHole: bh,
          s: s
        };
      } else if (poi.id === 'cygnus-x1') {
        const bh = new BlackHole({
          radius: s,
          theme: 'cyan_violet'
        });
        detail.add(bh.getMesh());
        extras = {
          type: 'blackhole',
          isSgrA: false,
          blackHole: bh,
          s: s
        };
      } else {
        extras = createBlackHoleExtras(s, detail, poi.id);
      }
    } else if (poi.vType === 'nebula' || poi.vType === 'darkneb' || poi.vType === 'reflection') {
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

    // ── NIVEAU 0 : DÉTAILS PROCHES ──
    const level0 = new THREE.Group();
    level0.add(detail);
    
    // Le sprite 2D est totalement invisible au niveau 0 pour les amas, Sgr A* et Cygnus X-1 volumétrique
    let dimmedSprite = null;
    if (poi.vType !== 'cluster' && poi.id !== 'sgr-a' && poi.id !== 'cygnus-x1') {
      const dimmedSpriteMat = sprite.material.clone();
      if (poi.vType === 'blackhole') dimmedSpriteMat.opacity = 0.15;
      else if (poi.vType === 'system') dimmedSpriteMat.opacity = 0.05;
      dimmedSprite = new THREE.Sprite(dimmedSpriteMat);
      dimmedSprite.scale.copy(sprite.scale);
      level0.add(dimmedSprite);
    }

    lod.addLevel(level0, 0);

    // ── NIVEAU 1 : SPRITE LOINTAIN ──
    // Pour Sagittarius A*, on ne bascule jamais en sprite 2D : le modèle volumétrique 3D reste actif à toute distance
    if (poi.id !== 'sgr-a') {
      // Seuil de distance ~ 50 fois le scale, plafonné à 350 000 pour que les objets basculent bien en 2D de loin
      const transitionDist = Math.min(s * 50, 350000);
      
      // On booste l'opacité à 1.0 au loin
      sprite.material.opacity = 1.0; 
      
      // Pour compenser la géométrie 3D, on ajuste le facteur d'échelle du sprite lointain
      let farScaleMultiplier = 1.2;
      if (poi.vType === 'blackhole') farScaleMultiplier = 2.6;
      else if (poi.vType === 'cluster') farScaleMultiplier = 1.8; // Compenser l'envergure du nuage de 300 étoiles
      sprite.scale.set(s * farScaleMultiplier, s * farScaleMultiplier, 1);
      
      lod.addLevel(sprite, transitionDist);
    }
    
    // NIVEAU 2 SUPPRIMÉ : On ne cache plus complètement les petits astres lointains, 
    // le rendu de simples sprites est suffisamment léger et permet de garder la galaxie peuplée.

    // ── Balise anomalique 3D (visible uniquement en mode Astrométrie pour les astres non cartographiés) ──
    const beaconGroup = new THREE.Group();
    const beaconGeo = new THREE.OctahedronGeometry(Math.max(s * 0.35, 120), 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconGroup.add(beaconMesh);

    const beaconCore = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(s * 0.1, 40), 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 })
    );
    beaconGroup.add(beaconCore);

    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(s * 0.45, 150), Math.max(s * 0.48, 165), 24),
      new THREE.MeshBasicMaterial({ color: 0xffbb33, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    beaconRing.rotation.x = Math.PI / 2;
    beaconGroup.add(beaconRing);

    beaconGroup.visible = false;
    group.add(beaconGroup);

    // Label
    const labelCls = poi.vType === 'system' ? 'sun-marker-label' : 'poi-label';
    const label = makeLabel(poi.name, labelCls);
    galacticLabelEls.push({ el: label, group: group, data: poi });

    galacticScene.add(group);
    galacticPOIObjects[poi.id] = { group, lod, sprite, dimmedSprite, clickMesh, label, data: poi, detail, extras, anomalyBeacon: beaconGroup };
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

// ============================================================
// RELATIVISTIC WORMHOLES BUILDER & SHADER (Étape 3.1)
// Modèle physique de Kip Thorne / Métrique de Morris-Thorne & Ellis
// Lentille gravitationnelle analytique O(1) sans raymarching pour Intel UHD 620
// Sphère 3D isotrope, anneau d'Einstein caustique et projection céleste
// ============================================================
window.wormholeMeshes = [];
var _tempWhVec = new THREE.Vector3();

var WORMHOLE_VERTEX_SHADER = /* glsl */`
  varying vec3 v_localPos;
  varying vec3 v_normal;
  varying vec3 v_worldPos;

  void main() {
    v_localPos = position;
    v_normal = normalize(normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    v_worldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

var WORMHOLE_FRAGMENT_SHADER = /* glsl */`
  precision highp float;

  varying vec3 v_localPos;
  varying vec3 v_normal;
  varying vec3 v_worldPos;

  uniform float u_time;
  uniform vec3  u_cameraLocalPos;
  uniform vec3  u_color;        // Teinte locale du vortex
  uniform vec3  u_targetColor;  // Teinte du secteur cible
  uniform vec3  u_targetDir;    // Vecteur directeur galactique vers la destination
  uniform float u_targetSeed;   // Graine procédurale du quadrant (1.0 à 8.0)
  uniform float u_throatRadius; // Rayon de gorge (1400.0)

  // Hash 3D ultra-rapide sans boucle
  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  vec3 hash33(vec3 p) {
    vec3 q = fract(p * vec3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yxz + 33.33);
    return fract((q.xxy + q.yxx) * q.zyx);
  }

  // Bruit 3D de valeur avec lissage cubique hermite
  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  // FBM 3 octaves pour le ciel lointain et nébuleuses du quadrant destination
  float fbm3D(vec3 p) {
    float v = 0.0;
    v += 0.500 * noise3D(p); p *= 2.02;
    v += 0.250 * noise3D(p); p *= 2.03;
    v += 0.125 * noise3D(p);
    return v;
  }

  // Générateur procédural du ciel de destination (Univers 2)
  vec3 renderDestinationSky(vec3 rayDir, float u) {
    // Base orthonormée orientée vers le secteur cible
    vec3 fwd = normalize(u_targetDir);
    vec3 up = vec3(0.0, 1.0, 0.0);
    if (abs(fwd.y) > 0.92) up = vec3(1.0, 0.0, 0.0);
    vec3 right = normalize(cross(up, fwd));
    up = cross(fwd, right);

    // Direction céleste projetée dans le repère du secteur de destination
    vec3 destRay = normalize(right * rayDir.x + up * rayDir.y + fwd * rayDir.z);

    // 1. Étoiles lointaines primaires (champ stellaire riche)
    vec3 starCoord = destRay * 125.0;
    vec3 starGrid = floor(starCoord);
    vec3 starFrac = fract(starCoord) - 0.5;
    float starHash = hash31(starGrid + vec3(u_targetSeed * 47.19));

    vec3 starCol = vec3(0.0);
    if (starHash > 0.976) {
      vec3 starJitter = (hash33(starGrid) - 0.5) * 0.65;
      float starDist = length(starFrac - starJitter);
      float starBright = smoothstep(0.15, 0.0, starDist) * pow((starHash - 0.976) / 0.024, 3.5) * 3.4;
      float twinkle = 0.82 + 0.18 * sin(u_time * 2.8 + starHash * 45.0);
      vec3 tint = mix(vec3(0.85, 0.95, 1.0), vec3(1.0, 0.85, 0.6), hash31(starGrid + 1.2));
      starCol = tint * (starBright * twinkle);
    }

    // Poussière stellaire fine
    vec3 fineCoord = destRay * 280.0;
    vec3 fineGrid = floor(fineCoord);
    float fineHash = hash31(fineGrid + vec3(u_targetSeed * 19.33));
    if (fineHash > 0.990) {
      float fineDist = length(fract(fineCoord) - 0.5);
      starCol += vec3(0.9, 0.95, 1.0) * (smoothstep(0.18, 0.0, fineDist) * 1.6);
    }

    // 2. Nébuleuses gazeuses et filaments cosmiques du quadrant cible
    vec3 nebP = destRay * 2.5 + vec3(u_targetSeed * 3.1415, u_time * 0.015, u_targetSeed * 1.414);
    float neb1 = fbm3D(nebP);
    float neb2 = fbm3D(nebP * 2.1 + vec3(1.7));
    float dustAbsorption = clamp(1.0 - fbm3D(destRay * 3.6 + vec3(4.8)) * 1.65, 0.0, 1.0);

    vec3 gasColor = mix(u_targetColor * 0.45, u_targetColor * 1.75, neb2) * (neb1 * neb1 * 2.4);
    gasColor *= dustAbsorption;

    // Plan galactique du secteur cible & renflement de noyau
    float galacticLat = abs(destRay.y);
    float galacticPlane = exp(-galacticLat * 3.5) * 0.40;
    vec3 coreBulge = vec3(1.0, 0.85, 0.6) * (pow(max(0.0, dot(destRay, fwd)), 3.5) * 0.75);

    vec3 skyFinal = starCol + gasColor + (u_targetColor * galacticPlane) + coreBulge;

    // Blueshift gravitationnel aux abords du goulot
    float blueshift = pow(clamp(u / 0.94, 0.0, 1.0), 4.0);
    vec3 blueshiftTint = vec3(0.55, 0.85, 1.25);
    skyFinal = mix(skyFinal, skyFinal * blueshiftTint, blueshift * 0.6);

    return skyFinal;
  }

  void main() {
    // Normale locale (sphère unitaire centrée à l'origine locale)
    vec3 N = normalize(v_localPos);

    // Rayon depuis la caméra locale vers le point de surface
    vec3 rayDir = normalize(v_localPos - u_cameraLocalPos);

    // Cosinus de l'angle d'incidence
    // Au centre du disque projeté : cosPhi = 1.0
    // À la silhouette rasante : cosPhi = 0.0
    float cosPhi = clamp(-dot(rayDir, N), 0.0, 1.0);

    // Paramètre d'impact normalisé u = sin(phi) dans [0.0, 1.0]
    float u = sqrt(max(0.0, 1.0 - cosPhi * cosPhi));

    // Rayon de l'horizon de gorge (Métrique d'Ellis)
    float uThroat = 0.940;

    // ── 1. RÉGION DU GOULOT TRAVERSABLE (u < uThroat) ──
    // Réfraction géodésique fermée vers l'Univers 2 (Kip Thorne fish-eye warping)
    float throatDistort = pow(u / uThroat, 1.8) * 0.70;
    vec3 refractedRay = normalize(rayDir + N * (throatDistort * (1.0 - u * 0.35)));

    // Dispersion chromatique physique traversant la gorge
    vec3 colR = renderDestinationSky(normalize(refractedRay + N * 0.012), u);
    vec3 colG = renderDestinationSky(refractedRay, u);
    vec3 colB = renderDestinationSky(normalize(refractedRay - N * 0.012), u);
    vec3 throatColor = vec3(colR.r, colG.g, colB.b);

    // ── 2. COMPOSITION SANS CONTOUR BLANC ──
    vec3 finalColor;
    if (u < uThroat) {
      finalColor = throatColor;
    } else {
      float rimFalloff = smoothstep(1.0, 0.94, u);
      finalColor = throatColor * rimFalloff;
    }

    // Lissage anti-aliasing très propre en bordure
    float alpha = smoothstep(1.002, 0.985, u);

    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
  }
`;

function createWormholes() {
  if (window.wormholeMeshes && window.wormholeMeshes.length > 0) return;
  window.wormholeMeshes = [];
  if (typeof WORMHOLES === 'undefined' || !Array.isArray(WORMHOLES)) return;

  const ptex = getParticleTexture();

  for (let i = 0; i < WORMHOLES.length; i++) {
    const wh = WORMHOLES[i];
    const group = new THREE.Group();
    group.position.set(wh.pos.x, wh.pos.y, wh.pos.z);
    group.name = 'wormhole_' + wh.id;

    const lod = new THREE.LOD();
    group.add(lod);
    if (typeof galacticLODs !== 'undefined') {
      galacticLODs.push(lod);
    }

    // Vecteur d'orientation vers la destination dans la galaxie
    const targetDirVec = new THREE.Vector3(
      wh.targetPos.x - wh.pos.x,
      wh.targetPos.y - wh.pos.y,
      wh.targetPos.z - wh.pos.z
    );
    if (targetDirVec.lengthSq() > 0.001) {
      targetDirVec.normalize();
    } else {
      targetDirVec.set(0, 0, 1);
    }

    // ── NIVEAU 0 : Sphère 3D Isotrope Relativiste (Distance <= 80 000 AL) ──
    const level0 = new THREE.Group();

    // Matériau Shader Relativiste Kip Thorne (Rendu épuré Capture 2)
    const sphereMat = new THREE.ShaderMaterial({
      vertexShader: WORMHOLE_VERTEX_SHADER,
      fragmentShader: WORMHOLE_FRAGMENT_SHADER,
      uniforms: {
        u_time: { value: 0 },
        u_cameraLocalPos: { value: new THREE.Vector3(0, 0, 10000) },
        u_color: { value: new THREE.Color(wh.color) },
        u_targetColor: { value: new THREE.Color(wh.targetColor || wh.color) },
        u_targetDir: { value: targetDirVec },
        u_targetSeed: { value: wh.seed || (i + 1.0) * 1.37 },
        u_throatRadius: { value: 1400.0 }
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    // Géométrie sphérique 3D sans orientation privilégiée
    const sphereGeo = new THREE.SphereGeometry(1400, 48, 48);
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.renderOrder = 10;
    level0.add(sphereMesh);

    lod.addLevel(level0, 0);

    // ── NIVEAU 1 : Balise Sprite 2D lointaine (Distance > 80 000 AL) ──
    const farMat = new THREE.SpriteMaterial({
      map: ptex,
      color: wh.color,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const farSprite = new THREE.Sprite(farMat);
    farSprite.scale.set(7000, 7000, 1);
    lod.addLevel(farSprite, 80000);

    // Sphère invisible de clic pour raycaster et sélection
    const clickGeo = new THREE.SphereGeometry(1600, 8, 8);
    const clickMat = new THREE.MeshBasicMaterial({ visible: false });
    const clickMesh = new THREE.Mesh(clickGeo, clickMat);
    clickMesh.userData = { poiId: wh.id, isWormhole: true, wormholeData: wh };
    group.add(clickMesh);
    if (typeof galacticClickables !== 'undefined') {
      galacticClickables.push(clickMesh);
    }

    // Label 3D HTML pour le HUD
    let labelEl = null;
    if (typeof makeLabel === 'function') {
      labelEl = makeLabel(wh.name, 'poi-label wormhole-marker-label');
      if (typeof galacticLabelEls !== 'undefined') {
        galacticLabelEls.push({
          el: labelEl,
          group: group,
          data: {
            id: wh.id,
            name: wh.name,
            scale: 2500,
            tier: 2
          }
        });
      }
    }

    galacticScene.add(group);

    const whMeshObj = {
      id: wh.id,
      group: group,
      lod: lod,
      sphereMesh: sphereMesh,
      sphereMat: sphereMat,
      glowSprite: null,
      farSprite: farSprite,
      clickMesh: clickMesh,
      label: labelEl,
      data: wh
    };
    window.wormholeMeshes.push(whMeshObj);

    // Intégration transparente au catalogue POI galactique
    if (typeof galacticPOIObjects !== 'undefined') {
      galacticPOIObjects[wh.id] = {
        group: group,
        lod: lod,
        sprite: farSprite,
        dimmedSprite: null,
        clickMesh: clickMesh,
        label: labelEl,
        data: {
          id: wh.id,
          name: wh.name,
          type: "Trou de Ver (Wormhole)",
          scale: 2500,
          tier: 2,
          pos: [wh.pos.x, wh.pos.y, wh.pos.z],
          dotColor: '#' + new THREE.Color(wh.color).getHexString(),
          info: {
            'Type': "Pont d'Einstein-Rosen (Métrique d'Ellis)",
            'Destination': wh.targetName,
            'Statut': "Métrique Ouverte / Traversable",
            'Horizon': "Rayon de gorge r₀ = 1 400 AL",
            'Déclenchement': "Approche cockpit < 1 400 AL"
          }
        },
        detail: level0,
        extras: null
      };
    }
  }
}

function updateWormholes(dt, now, activeCam) {
  if (!window.wormholeMeshes || window.wormholeMeshes.length === 0) return;

  const cam = activeCam
    || (typeof cockpitCamera !== 'undefined' && cockpitCamera)
    || (typeof galacticCamera !== 'undefined' && galacticCamera)
    || (typeof camera !== 'undefined' ? camera : null);

  for (let i = 0; i < window.wormholeMeshes.length; i++) {
    const wm = window.wormholeMeshes[i];
    if (!wm || !wm.lod) continue;

    const curLevel = wm.lod.getCurrentLevel();
    if (curLevel === 0 && wm.sphereMat) {
      wm.sphereMat.uniforms.u_time.value = now;

      // Calcul précis de la position de la caméra dans l'espace local de la sphère
      if (cam) {
        wm.sphereMesh.updateMatrixWorld();
        cam.getWorldPosition(_tempWhVec);
        wm.sphereMesh.worldToLocal(_tempWhVec);
        wm.sphereMat.uniforms.u_cameraLocalPos.value.copy(_tempWhVec);
      }
    } else if (wm.farSprite) {
      // Scintillement doux du sprite de balise lointaine
      const farPulse = 1.0 + Math.sin(now * 2.5 + i * 1.2) * 0.10;
      wm.farSprite.scale.set(7000 * farPulse, 7000 * farPulse, 1);
    }
  }
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

// ── Cluster: 700 scintillating star particles in dense 3D volume ──
function createClusterExtras(s, parent) {
  const ptex = getParticleTexture();
  const count = 700;
  const posArr = new Float32Array(count * 3);
  const colArr = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Concentration plus forte vers le centre pour un effet de cœur lumineux 3D naturel
    const r = Math.pow(Math.random(), 2.2) * s * 0.85;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    posArr[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    posArr[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.45;
    posArr[i * 3 + 2] = Math.cos(phi) * r;
    const temp = Math.random();
    colArr[i * 3] = 0.8 + temp * 0.2;
    colArr[i * 3 + 1] = 0.85 + temp * 0.15;
    colArr[i * 3 + 2] = 1.0 - temp * 0.1;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  const mat = new THREE.PointsMaterial({
    size: 5.8, sizeAttenuation: false, vertexColors: true, map: ptex,
    transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
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

  // 1. Time-Slicing des LODs (répartit la charge CPU sur plusieurs frames)
  if (galacticLODs.length > 0) {
    const limit = Math.min(currentLODIndex + LOD_UPDATES_PER_FRAME, galacticLODs.length);
    for (let i = currentLODIndex; i < limit; i++) {
      galacticLODs[i].update(activeCam);
    }
    currentLODIndex += LOD_UPDATES_PER_FRAME;
    if (currentLODIndex >= galacticLODs.length) {
      currentLODIndex = 0;
    }
  }

  // 2. Mise à jour des animations
  for (const id in galacticPOIObjects) {
    const obj = galacticPOIObjects[id];

    // ── Phase 4 Gameplay Priority: Pulsing Local Neighborhood ──
    if (id === 'sol' || id === 'alpha-centauri' || id === 'sirius') {
      if (obj.sprite) {
        const baseS = obj.data.scale;
        // Un pulse doux et continu qui donne envie de cliquer
        const p = 1.0 + Math.sin(now * 3.5 + obj.data.pos[0]) * 0.08;
        obj.sprite.scale.set(baseS * p, baseS * p, 1);
        if (obj.dimmedSprite) obj.dimmedSprite.scale.set(baseS * p, baseS * p, 1);
      }
    }

    // ── Animation balise anomalie (mode Astrométrie) ──
    if (obj.anomalyBeacon && obj.anomalyBeacon.visible) {
      obj.anomalyBeacon.rotation.y += dt * 1.5;
      obj.anomalyBeacon.rotation.x += dt * 0.75;
      const bp = 1.0 + Math.sin(now * 4.0 + (obj.data.pos[0] || 0) * 0.001) * 0.15;
      obj.anomalyBeacon.scale.set(bp, bp, bp);
    }

    if (!obj.extras) continue;
    if (obj.detail && !obj.detail.visible) continue;

    // On anime les détails si le LOD actif est 0 (proche) ou s'il s'agit de Sagittarius A* (toujours en 3D)
    const isNear = (id === 'sgr-a') || (obj.lod.getCurrentLevel() === 0);
    if (!isNear) continue;

    const ex = obj.extras;

    if (ex.type === 'blackhole') {
      if (ex.blackHole) {
        ex.blackHole.update(now, activeCam, renderer, dt);
      } else if (ex.disk) {
        // Rotate accretion disks (pour les autres trous noirs classiques comme Cygnus X-1)
        const rotSpeed = 0.4;
        ex.disk.rotation.z += dt * rotSpeed;
        ex.outerDisk.rotation.z += dt * rotSpeed * 0.6;
        ex.innerDisk.rotation.z -= dt * rotSpeed * 1.4;

        // Animate secondary photon ring
        if (ex.photonRing2) {
          ex.photonRing2.rotation.z += dt * 0.15;
        }
        // Pulse lens halo subtly
        if (ex.lensHalo) {
          const hPulse = 0.08 + Math.sin(now * 0.4) * 0.04;
          ex.lensHalo.material.opacity = hPulse;
        }

        // Animate jet particles
        const jetMaxH = ex.s * 1.5;
        const jetSpread = ex.s * 0.03;
        const jp = ex.jets.geometry.attributes.position.array;
        for (let i = 0; i < ex.jetCount; i++) {
          const half = i < ex.jetCount / 2 ? 1 : -1;
          jp[i * 3 + 1] += half * dt * ex.s * 0.5;
          if (Math.abs(jp[i * 3 + 1]) > jetMaxH) {
            jp[i * 3] = (Math.random() - 0.5) * jetSpread;
            jp[i * 3 + 1] = half * Math.random() * ex.s * 0.06;
            jp[i * 3 + 2] = (Math.random() - 0.5) * jetSpread;
          }
        }
        ex.jets.geometry.attributes.position.needsUpdate = true;
      }
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

  // 3. Mise à jour des vortex / trous de ver (Étape 3.1)
  updateWormholes(dt, now, activeCam);

  // 4. Mise à jour de la représentation cartographique du Manhattan
  updateVesselMap(dt, now);
}

// ============================================================
// MANHATTAN VESSEL 3D MAP REPRESENTATION
// ============================================================
var vesselMapObject = null;

function createVesselMapModel() {
  if (vesselMapObject) return vesselMapObject;

  const vesselGroup = new THREE.Group();
  vesselGroup.name = 'vessel-manhattan-map-group';

  // Éclairages omnidirectionnels dédiés pour révéler tous les détails et biseaux du vaisseau sous tout angle
  const shipKeyLight = new THREE.PointLight(0xffffff, 2.2, 14000);
  shipKeyLight.position.set(800, 1400, -1000);
  vesselGroup.add(shipKeyLight);

  const shipFillLight = new THREE.PointLight(0x8ec5fc, 1.5, 12000);
  shipFillLight.position.set(-1000, -600, 1000);
  vesselGroup.add(shipFillLight);

  const shipBottomLight = new THREE.PointLight(0x557799, 0.8, 8000);
  shipBottomLight.position.set(0, -1200, 0);
  vesselGroup.add(shipBottomLight);

  // Groupe modèle (applique le cap et l'orientation du vaisseau)
  const modelGroup = new THREE.Group();
  vesselGroup.add(modelGroup);

  // Matériaux physiques clairs et soignés (titane ardoise / blanc aérospatial avec reflets nets)
  const hullDark = new THREE.MeshStandardMaterial({
    color: 0x324355,
    roughness: 0.38,
    metalness: 0.55
  });
  const hullLight = new THREE.MeshStandardMaterial({
    color: 0xdde7f2,
    roughness: 0.25,
    metalness: 0.65
  });
  const hullAccent = new THREE.MeshStandardMaterial({
    color: 0x485e75,
    roughness: 0.35,
    metalness: 0.5
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x0f2032,
    roughness: 0.08,
    metalness: 0.95
  });
  const domeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x8ec5fc,
    transparent: true,
    opacity: 0.6,
    roughness: 0.03,
    metalness: 0.85,
    emissive: 0x1a3350,
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const domeFloorMat = new THREE.MeshStandardMaterial({
    color: 0x162230,
    roughness: 0.6,
    metalness: 0.3
  });
  const domeCoreMat = new THREE.MeshBasicMaterial({
    color: 0x68d391,
    transparent: true,
    opacity: 0.9
  });
  const thrusterCoreMat = new THREE.MeshBasicMaterial({
    color: 0x60b8ff
  });
  const thrusterPlumeMat = new THREE.MeshBasicMaterial({
    color: 0x3898ec,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  // 1. Fuselage Central
  const midFuselage = new THREE.Mesh(new THREE.BoxGeometry(260, 100, 460), hullDark);
  midFuselage.position.set(0, 5, -20);
  modelGroup.add(midFuselage);

  const upperSpine = new THREE.Mesh(new THREE.BoxGeometry(190, 24, 520), hullLight);
  upperSpine.position.set(0, 62, -20);
  modelGroup.add(upperSpine);

  const lowerKeel = new THREE.Mesh(new THREE.BoxGeometry(200, 30, 480), hullAccent);
  lowerKeel.position.set(0, -55, -20);
  modelGroup.add(lowerKeel);

  // 2. Proue Aérodynamique & Verrière Cockpit Avant (Alignement 100% axial)
  // Section avant principale (prolongement direct du fuselage central de Z=-250 à Z=-390)
  const noseMid = new THREE.Mesh(new THREE.BoxGeometry(220, 80, 140), hullDark);
  noseMid.position.set(0, 5, -320);
  modelGroup.add(noseMid);

  // Pointe avant biseautée (de Z=-390 à Z=-490)
  const noseTip = new THREE.Mesh(new THREE.BoxGeometry(150, 54, 100), hullDark);
  noseTip.position.set(0, 5, -440);
  modelGroup.add(noseTip);

  // Étrave profilée extrême (de Z=-490 à Z=-550)
  const noseCone = new THREE.Mesh(new THREE.BoxGeometry(80, 30, 60), hullDark);
  noseCone.position.set(0, 5, -520);
  modelGroup.add(noseCone);

  // Plaques biseautées latérales avant (chine plates symétriques gauche/droite)
  const leftChine = new THREE.Mesh(new THREE.BoxGeometry(20, 60, 220), hullAccent);
  leftChine.position.set(-105, 5, -360);
  leftChine.rotation.y = 0.22;
  modelGroup.add(leftChine);

  const rightChine = new THREE.Mesh(new THREE.BoxGeometry(20, 60, 220), hullAccent);
  rightChine.position.set(105, 5, -360);
  rightChine.rotation.y = -0.22;
  modelGroup.add(rightChine);

  // Plaque d'armure dorsale claire de proue (assure la transition fluide avec le fuselage supérieur)
  const noseDorsal = new THREE.Mesh(new THREE.BoxGeometry(140, 14, 240), hullLight);
  noseDorsal.position.set(0, 48, -350);
  modelGroup.add(noseDorsal);

  // Verrière avant du cockpit (profilée, centrée sur l'axe)
  const cockpitVisor = new THREE.Mesh(new THREE.BoxGeometry(94, 28, 140), visorMat);
  cockpitVisor.rotation.x = -0.18;
  cockpitVisor.position.set(0, 52, -340);
  modelGroup.add(cockpitVisor);

  // 3. Poupe / Bloc Moteur Arrière
  const sternBlock = new THREE.Mesh(new THREE.BoxGeometry(240, 115, 200), hullDark);
  sternBlock.position.set(0, 10, 290);
  modelGroup.add(sternBlock);

  // 4. OBSERVATOIRE PANORAMIQUE SUPÉRIEUR (Verrière vitrée au-dessus)
  const obsGroup = new THREE.Group();
  obsGroup.position.set(0, 74, -70);

  const obsCollar = new THREE.Mesh(new THREE.CylinderGeometry(84, 94, 12, 28), hullDark);
  obsGroup.add(obsCollar);

  const obsFloor = new THREE.Mesh(new THREE.CylinderGeometry(76, 76, 3, 24), domeFloorMat);
  obsFloor.position.y = 6;
  obsGroup.add(obsFloor);

  const holoPedestal = new THREE.Mesh(new THREE.CylinderGeometry(14, 18, 12, 16), hullDark);
  holoPedestal.position.y = 12;
  obsGroup.add(holoPedestal);

  const holoCore = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 16), domeCoreMat);
  holoCore.position.y = 22;
  obsGroup.add(holoCore);

  const domeLight = new THREE.PointLight(0x68d391, 1.6, 500);
  domeLight.position.y = 24;
  obsGroup.add(domeLight);

  const obsGlass = new THREE.Mesh(
    new THREE.SphereGeometry(80, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
    domeGlassMat
  );
  obsGlass.position.y = 6;
  obsGroup.add(obsGlass);

  const ribLong = new THREE.Mesh(new THREE.TorusGeometry(80, 2.5, 6, 28, Math.PI), hullDark);
  ribLong.rotation.y = Math.PI / 2;
  ribLong.position.y = 6;
  obsGroup.add(ribLong);

  const ribTrans = new THREE.Mesh(new THREE.TorusGeometry(80, 2.5, 6, 28, Math.PI), hullDark);
  ribTrans.position.y = 6;
  obsGroup.add(ribTrans);

  modelGroup.add(obsGroup);

  // 5. Ailes Profilées & Nacelles FTL Latérales
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(220, 18, 340), hullLight);
  leftWing.position.set(-230, -5, 60);
  leftWing.rotation.y = 0.15;
  leftWing.rotation.z = -0.05;
  modelGroup.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(220, 18, 340), hullLight);
  rightWing.position.set(230, -5, 60);
  rightWing.rotation.y = -0.15;
  rightWing.rotation.z = 0.05;
  modelGroup.add(rightWing);

  const leftFin = new THREE.Mesh(new THREE.BoxGeometry(14, 85, 200), hullDark);
  leftFin.position.set(-345, 30, 90);
  leftFin.rotation.z = 0.12;
  modelGroup.add(leftFin);

  const rightFin = new THREE.Mesh(new THREE.BoxGeometry(14, 85, 200), hullDark);
  rightFin.position.set(345, 30, 90);
  rightFin.rotation.z = -0.12;
  modelGroup.add(rightFin);

  const nacelleGeo = new THREE.CylinderGeometry(32, 38, 320, 18);
  const leftNacelle = new THREE.Mesh(nacelleGeo, hullAccent);
  leftNacelle.rotation.x = Math.PI / 2;
  leftNacelle.position.set(-210, 12, 110);
  modelGroup.add(leftNacelle);

  const rightNacelle = new THREE.Mesh(nacelleGeo, hullAccent);
  rightNacelle.rotation.x = Math.PI / 2;
  rightNacelle.position.set(210, 12, 110);
  modelGroup.add(rightNacelle);

  // 6. Tuyères de Propulsion Arrière
  const plumes = [];
  const engineExhaustGeo = new THREE.CylinderGeometry(36, 44, 75, 18);
  const engineNozzleGeo = new THREE.CylinderGeometry(0, 30, 45, 18);
  const plumeGeo = new THREE.ConeGeometry(28, 140, 16);

  [-80, 80].forEach(xOffset => {
    const housing = new THREE.Mesh(engineExhaustGeo, hullDark);
    housing.rotation.x = Math.PI / 2;
    housing.position.set(xOffset, 12, 400);
    modelGroup.add(housing);

    const nozzle = new THREE.Mesh(engineNozzleGeo, thrusterCoreMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(xOffset, 12, 430);
    modelGroup.add(nozzle);

    const plume = new THREE.Mesh(plumeGeo, thrusterPlumeMat);
    plume.rotation.x = -Math.PI / 2;
    plume.position.set(xOffset, 12, 510);
    modelGroup.add(plume);
    plumes.push(plume);
  });

  // 7. Volume de clic pour le raycast
  const clickGeo = new THREE.SphereGeometry(750, 10, 10);
  const clickMat = new THREE.MeshBasicMaterial({ visible: false });
  const clickMesh = new THREE.Mesh(clickGeo, clickMat);
  clickMesh.userData = { poiId: 'vessel-manhattan' };
  vesselGroup.add(clickMesh);
  if (typeof galacticClickables !== 'undefined') {
    galacticClickables.push(clickMesh);
  }

  // 8. Étiquette 3D HTML
  let labelEl = null;
  if (typeof makeLabel === 'function') {
    labelEl = makeLabel('VAISSEAU MANHATTAN', 'poi-label vessel-marker-label');
    if (typeof galacticLabelEls !== 'undefined') {
      galacticLabelEls.push({
        el: labelEl,
        group: vesselGroup,
        data: {
          id: 'vessel-manhattan',
          name: 'VAISSEAU MANHATTAN',
          scale: 4500,
          tier: 1
        }
      });
    }
  }

  galacticScene.add(vesselGroup);

  vesselMapObject = {
    group: vesselGroup,
    modelGroup: modelGroup,
    clickMesh: clickMesh,
    plumes: plumes,
    label: labelEl,
    data: {
      id: 'vessel-manhattan',
      name: 'VAISSEAU MANHATTAN',
      type: 'Vaisseau d\'exploration interstellaire',
      scale: 3500
    }
  };

  return vesselMapObject;
}

function updateVesselMap(dt, now) {
  if (!vesselMapObject || !vesselMapObject.group) return;

  const isAstro = (state.cameraMode === 'ASTROMETRY');
  const isSpectatorGalactic = (state.scaleLevel === 'GALACTIC' && state.cameraMode === 'FREE');
  const shouldBeVisible = isAstro || isSpectatorGalactic;

  vesselMapObject.group.visible = shouldBeVisible;
  if (vesselMapObject.label) {
    if (!shouldBeVisible) vesselMapObject.label.style.opacity = '0';
  }
  if (!shouldBeVisible) return;

  let vPos = null;
  let vRot = null;

  if (state.scaleLevel === 'GALACTIC') {
    if (typeof ship !== 'undefined' && ship && ship.position) {
      vPos = ship.position;
      vRot = ship.quaternion;
    } else if (state.shipPosition) {
      vPos = state.shipPosition;
    }
  } else {
    if (typeof SUN_GAL !== 'undefined') {
      vPos = new THREE.Vector3(SUN_GAL.x, SUN_GAL.y, SUN_GAL.z);
    } else {
      vPos = new THREE.Vector3(260000, 250, 0);
    }
  }

  if (vPos) {
    vesselMapObject.group.position.copy(vPos);
  }

  if (vRot && vesselMapObject.modelGroup) {
    vesselMapObject.modelGroup.quaternion.copy(vRot);
  }

  if (vesselMapObject.plumes && vesselMapObject.plumes.length > 0) {
    const pulse = 1.0 + Math.sin(now * 8.0) * 0.14;
    for (const pl of vesselMapObject.plumes) {
      pl.scale.set(1, pulse, 1);
    }
  }
}


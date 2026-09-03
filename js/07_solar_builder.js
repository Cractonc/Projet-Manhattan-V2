'use strict';

// ============================================================
// REALISTIC NIGHT SKY & CELESTIAL STARFIELD (Solar scene)
// ============================================================
var solarStarfieldGroup = null;
var _solarSoftTex = null;
var _andromedaTex = null;

function getSolarSoftTexture() {
  if (_solarSoftTex) return _solarSoftTex;
  const sz = 64;
  const cvs = document.createElement('canvas');
  cvs.width = sz; cvs.height = sz;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  grad.addColorStop(0.8, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, sz, sz);
  _solarSoftTex = new THREE.CanvasTexture(cvs);
  return _solarSoftTex;
}

function getAndromedaTexture() {
  if (_andromedaTex) return _andromedaTex;
  const w = 256, h = 128;
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, 0.45); // Tilted disk
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  grad.addColorStop(0, 'rgba(255,245,210,0.95)');   // Golden bright nucleus
  grad.addColorStop(0.15, 'rgba(220,230,255,0.65)'); // Blue-white inner spiral
  grad.addColorStop(0.45, 'rgba(160,190,240,0.30)'); // Outer spiral arms
  grad.addColorStop(0.8, 'rgba(120,150,220,0.08)');  // Halo
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  _andromedaTex = new THREE.CanvasTexture(cvs);
  return _andromedaTex;
}

function createStarfield(sysId) {
  const currentSys = sysId || state.currentSystem || 'sol';

  // Nettoyage de l'ancien ciel étoilé s'il existe
  if (solarStarfieldGroup) {
    scene.remove(solarStarfieldGroup);
    solarStarfieldGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  solarStarfieldGroup = new THREE.Group();
  solarStarfieldGroup.name = 'solarStarfield';

  const softTex = getSolarSoftTexture();

  // ── Configuration de l'angle galactique selon le système visité ──
  // Dans le système solaire : plan galactique incliné à ~60.2° par rapport à l'écliptique
  let galEuler = new THREE.Euler(1.05, 0.42, 0.20, 'XYZ');
  const isAlphaCen = (currentSys === 'alpha-centauri');
  const isSirius = (currentSys === 'sirius');

  if (isAlphaCen) {
    galEuler = new THREE.Euler(1.02, 0.48, 0.25, 'XYZ');
  } else if (isSirius) {
    galEuler = new THREE.Euler(1.12, 0.36, 0.16, 'XYZ');
  }

  const galQuat = new THREE.Quaternion().setFromEuler(galEuler);

  // ============================================================
  // 1. VOIE LACTÉE : COUCHE DE NÉBULEUSES DIFFUSES (45 Sprites)
  // ============================================================
  const nebCount = 45;
  const nebColors = [
    new THREE.Color(0xd48860), new THREE.Color(0xb56580), new THREE.Color(0x9a589e),
    new THREE.Color(0xc27855), new THREE.Color(0x755088),
    new THREE.Color(0x38557a), new THREE.Color(0x406088), new THREE.Color(0x2d4265),
    new THREE.Color(0x483860), new THREE.Color(0x253850), new THREE.Color(0x305070)
  ];

  for (let i = 0; i < nebCount; i++) {
    const angle = (i / nebCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    const lat = (Math.random() - 0.5) * (Math.random() - 0.5) * 0.25;
    const r = 46000 + (Math.random() - 0.5) * 2000;

    const vGal = new THREE.Vector3(
      Math.cos(lat) * Math.cos(angle),
      Math.sin(lat),
      Math.cos(lat) * Math.sin(angle)
    ).applyQuaternion(galQuat);

    const distToCore = Math.min(Math.abs(angle), Math.abs(angle - Math.PI * 2));
    const isNearCore = distToCore < 0.7;

    const colIndex = isNearCore ? Math.floor(Math.random() * 5) : 5 + Math.floor(Math.random() * 6);
    const col = nebColors[colIndex].clone();

    const baseOpacity = isNearCore ? (0.13 + Math.random() * 0.08) : (0.07 + Math.random() * 0.05);
    const scale = (isNearCore ? 9000 : 7000) + Math.random() * 4000;

    const sMat = new THREE.SpriteMaterial({
      map: softTex,
      color: col,
      transparent: true,
      opacity: baseOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(sMat);
    sprite.position.copy(vGal.multiplyScalar(r));
    sprite.scale.set(scale, scale, 1);
    solarStarfieldGroup.add(sprite);
  }

  // ============================================================
  // 2. VOIE LACTÉE : NUAGE D'ÉTOILES DU DISQUE GALACTIQUE (22 000 Étoiles)
  // ============================================================
  const mwCount = 22000;
  const mwGeo = new THREE.BufferGeometry();
  const mwPos = new Float32Array(mwCount * 3);
  const mwCol = new Float32Array(mwCount * 3);
  const mwSizes = new Float32Array(mwCount);

  for (let i = 0; i < mwCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distToCore = Math.min(Math.abs(angle), Math.abs(angle - Math.PI * 2));
    const bulgeThickness = 0.08 + 0.16 * Math.exp(-Math.pow(distToCore / 0.65, 2));
    const lat = (Math.random() - 0.5) * Math.pow(Math.random(), 1.6) * bulgeThickness * 2.8;

    const r = 47000 + Math.random() * 4000;
    const v = new THREE.Vector3(
      Math.cos(lat) * Math.cos(angle),
      Math.sin(lat),
      Math.cos(lat) * Math.sin(angle)
    ).applyQuaternion(galQuat);

    mwPos[i * 3]     = v.x * r;
    mwPos[i * 3 + 1] = v.y * r;
    mwPos[i * 3 + 2] = v.z * r;

    // Simulation de la "Great Rift" (failles sombres de poussière interstellaire)
    let dustAbsorption = 1.0;
    if (distToCore < 0.8 && Math.abs(lat) < 0.035) {
      dustAbsorption = Math.max(0.15, Math.abs(lat) / 0.035 * 0.9);
    }

    const mag = Math.pow(Math.random(), 3.0);
    const brightness = (0.2 + mag * 0.8) * dustAbsorption;

    if (distToCore < 0.7) {
      const rnd = Math.random();
      if (rnd < 0.45) {
        mwCol[i * 3]     = 1.0 * brightness;
        mwCol[i * 3 + 1] = 0.85 * brightness;
        mwCol[i * 3 + 2] = 0.60 * brightness;
      } else if (rnd < 0.75) {
        mwCol[i * 3]     = 1.0 * brightness;
        mwCol[i * 3 + 1] = 0.72 * brightness;
        mwCol[i * 3 + 2] = 0.50 * brightness;
      } else {
        mwCol[i * 3]     = 0.95 * brightness;
        mwCol[i * 3 + 1] = 0.92 * brightness;
        mwCol[i * 3 + 2] = 0.85 * brightness;
      }
      mwSizes[i] = (Math.random() < 0.05 ? 2.0 : 1.1);
    } else {
      const rnd = Math.random();
      if (rnd < 0.5) {
        mwCol[i * 3]     = 0.75 * brightness;
        mwCol[i * 3 + 1] = 0.85 * brightness;
        mwCol[i * 3 + 2] = 1.0 * brightness;
      } else if (rnd < 0.8) {
        mwCol[i * 3]     = 0.95 * brightness;
        mwCol[i * 3 + 1] = 0.95 * brightness;
        mwCol[i * 3 + 2] = 1.0 * brightness;
      } else {
        mwCol[i * 3]     = 0.95 * brightness;
        mwCol[i * 3 + 1] = 0.70 * brightness;
        mwCol[i * 3 + 2] = 0.85 * brightness;
      }
      mwSizes[i] = (Math.random() < 0.03 ? 1.8 : 0.95);
    }
  }

  mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
  mwGeo.setAttribute('color', new THREE.BufferAttribute(mwCol, 3));
  mwGeo.setAttribute('size', new THREE.BufferAttribute(mwSizes, 1));
  const mwMat = new THREE.PointsMaterial({
    size: 1.1, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.9, depthWrite: false
  });
  solarStarfieldGroup.add(new THREE.Points(mwGeo, mwMat));

  // ============================================================
  // 3. FOND ÉTOILÉ SPHÉRIQUE COMPLET (12 000 Étoiles)
  // ============================================================
  const bgCount = 12000;
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(bgCount * 3);
  const bgCol = new Float32Array(bgCount * 3);
  const bgSizes = new Float32Array(bgCount);

  for (let i = 0; i < bgCount; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 48000 + Math.random() * 4000;

    bgPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    bgPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bgPos[i * 3 + 2] = r * Math.cos(phi);

    const mag = Math.pow(Math.random(), 3.2);
    const brightness = 0.18 + mag * 0.82;

    const spec = Math.random();
    if (spec < 0.12) {
      bgCol[i * 3]     = 0.65 * brightness;
      bgCol[i * 3 + 1] = 0.80 * brightness;
      bgCol[i * 3 + 2] = 1.00 * brightness;
    } else if (spec < 0.35) {
      bgCol[i * 3]     = 0.92 * brightness;
      bgCol[i * 3 + 1] = 0.95 * brightness;
      bgCol[i * 3 + 2] = 1.00 * brightness;
    } else if (spec < 0.70) {
      bgCol[i * 3]     = 1.00 * brightness;
      bgCol[i * 3 + 1] = 0.94 * brightness;
      bgCol[i * 3 + 2] = 0.80 * brightness;
    } else if (spec < 0.88) {
      bgCol[i * 3]     = 1.00 * brightness;
      bgCol[i * 3 + 1] = 0.76 * brightness;
      bgCol[i * 3 + 2] = 0.45 * brightness;
    } else {
      bgCol[i * 3]     = 1.00 * brightness;
      bgCol[i * 3 + 1] = 0.48 * brightness;
      bgCol[i * 3 + 2] = 0.32 * brightness;
    }

    bgSizes[i] = Math.random() < 0.03 ? 2.2 : (Math.random() < 0.15 ? 1.4 : 0.9);
  }

  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
  bgGeo.setAttribute('size', new THREE.BufferAttribute(bgSizes, 1));
  const bgMat = new THREE.PointsMaterial({
    size: 1.0, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.85, depthWrite: false
  });
  solarStarfieldGroup.add(new THREE.Points(bgGeo, bgMat));

  // ============================================================
  // 4. ÉTOILES MAJEURES & BALISES DE NAVIGATION (320 Étoiles)
  // ============================================================
  const brightCount = 320;
  const bGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(brightCount * 3);
  const bCol = new Float32Array(brightCount * 3);
  const bSizes = new Float32Array(brightCount);

  for (let i = 0; i < brightCount; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 48500;

    bPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    bPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bPos[i * 3 + 2] = r * Math.cos(phi);

    const bVal = 0.65 + Math.random() * 0.35;
    const rnd = Math.random();
    if (rnd < 0.30) {
      bCol[i * 3] = 0.70 * bVal; bCol[i * 3 + 1] = 0.85 * bVal; bCol[i * 3 + 2] = 1.0 * bVal;
    } else if (rnd < 0.60) {
      bCol[i * 3] = 1.0 * bVal; bCol[i * 3 + 1] = 1.0 * bVal; bCol[i * 3 + 2] = 1.0 * bVal;
    } else if (rnd < 0.85) {
      bCol[i * 3] = 1.0 * bVal; bCol[i * 3 + 1] = 0.80 * bVal; bCol[i * 3 + 2] = 0.40 * bVal;
    } else {
      bCol[i * 3] = 1.0 * bVal; bCol[i * 3 + 1] = 0.45 * bVal; bCol[i * 3 + 2] = 0.30 * bVal;
    }

    bSizes[i] = 2.4 + Math.random() * 1.6;
  }

  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
  bGeo.setAttribute('size', new THREE.BufferAttribute(bSizes, 1));
  const bMat = new THREE.PointsMaterial({
    map: softTex,
    size: 2.8, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending
  });
  solarStarfieldGroup.add(new THREE.Points(bGeo, bMat));

  // ============================================================
  // 5. OBJETS DU CIEL PROFOND (ANDROMÈDE, NUAGES DE MAGELLAN, PLÉIADES)
  // ============================================================
  // A. Galaxie d'Andromède (M31)
  const m31Tex = getAndromedaTexture();
  const m31Mat = new THREE.SpriteMaterial({
    map: m31Tex, transparent: true, opacity: 0.65,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const m31Sprite = new THREE.Sprite(m31Mat);
  m31Sprite.position.set(24000, 22000, -35000);
  m31Sprite.scale.set(4800, 2400, 1);
  solarStarfieldGroup.add(m31Sprite);

  // B. Grand Nuage de Magellan (LMC)
  const lmcMat = new THREE.SpriteMaterial({
    map: softTex, color: new THREE.Color(0x7a8eb5),
    transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const lmcSprite = new THREE.Sprite(lmcMat);
  lmcSprite.position.set(-18000, -38000, -22000);
  lmcSprite.scale.set(5500, 4200, 1);
  solarStarfieldGroup.add(lmcSprite);

  // C. Petit Nuage de Magellan (SMC)
  const smcMat = new THREE.SpriteMaterial({
    map: softTex, color: new THREE.Color(0x6b7fa0),
    transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const smcSprite = new THREE.Sprite(smcMat);
  smcSprite.position.set(-11000, -42000, -16000);
  smcSprite.scale.set(3200, 2600, 1);
  solarStarfieldGroup.add(smcSprite);

  // D. L'Amas des Pléiades (M45)
  const pleiadesCenter = new THREE.Vector3(32000, 14000, 31000);
  const pleiadesGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softTex, color: new THREE.Color(0x4088dd),
    transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  pleiadesGlow.position.copy(pleiadesCenter);
  pleiadesGlow.scale.set(1800, 1800, 1);
  solarStarfieldGroup.add(pleiadesGlow);

  // ============================================================
  // 6. SPÉCIFICITÉS SELON LE SYSTÈME STELLAIRE VISITÉ
  // ============================================================
  if (isAlphaCen) {
    // Depuis Alpha Centauri : le Soleil brille comme une étoile dorée de mag 0.5 dans Cassiopée !
    const sunBeaconMat = new THREE.SpriteMaterial({
      map: softTex, color: new THREE.Color(0xffd560),
      transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const sunBeacon = new THREE.Sprite(sunBeaconMat);
    sunBeacon.position.set(-28000, 31000, 24000);
    sunBeacon.scale.set(1200, 1200, 1);
    solarStarfieldGroup.add(sunBeacon);
  } else if (isSirius) {
    // Depuis Sirius : le Soleil est une étoile dorée de mag 1.9 dans la Colombe
    const sunBeaconMat = new THREE.SpriteMaterial({
      map: softTex, color: new THREE.Color(0xffe280),
      transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const sunBeacon = new THREE.Sprite(sunBeaconMat);
    sunBeacon.position.set(-14000, -25000, 38000);
    sunBeacon.scale.set(800, 800, 1);
    solarStarfieldGroup.add(sunBeacon);
  } else {
    // Depuis le Système Solaire : Sirius brille intensément comme l'étoile la plus éclatante du ciel !
    const siriusMat = new THREE.SpriteMaterial({
      map: softTex, color: new THREE.Color(0xddeeff),
      transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const siriusBeacon = new THREE.Sprite(siriusMat);
    siriusBeacon.position.set(-14000, -25000, -38000);
    siriusBeacon.scale.set(1300, 1300, 1);
    solarStarfieldGroup.add(siriusBeacon);
  }

  scene.add(solarStarfieldGroup);
  return solarStarfieldGroup;
}

// ============================================================
// SUN & SOLAR CORONA
// ============================================================
var sunGroup = null;
var sunPulseTimer = 0;
var sunOuterCoronaSprite = null;
var sunMidCoronaSprite = null;
var sunDiffractionSprite = null;

function makeSunCoreTexture(colorObj) {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  if (colorObj) {
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, `rgba(${colorObj.r},${colorObj.g},${colorObj.b},0.95)`);
    grad.addColorStop(0.5, `rgba(${colorObj.r},${Math.floor(colorObj.g * 0.6)},${Math.floor(colorObj.b * 0.3)},0.45)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,235,160,0.95)');
    grad.addColorStop(0.5, 'rgba(255,160,50,0.45)');
    grad.addColorStop(0.8, 'rgba(230,100,20,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cvs);
}

function makeSunOuterHazeTexture(colorObj) {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  if (colorObj) {
    grad.addColorStop(0, `rgba(${colorObj.r},${colorObj.g},${colorObj.b},0.28)`);
    grad.addColorStop(0.35, `rgba(${colorObj.r},${Math.floor(colorObj.g * 0.7)},${Math.floor(colorObj.b * 0.4)},0.12)`);
    grad.addColorStop(0.7, `rgba(${Math.floor(colorObj.r * 0.8)},${Math.floor(colorObj.g * 0.4)},${Math.floor(colorObj.b * 0.2)},0.03)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    grad.addColorStop(0, 'rgba(255,210,130,0.28)');
    grad.addColorStop(0.35, 'rgba(255,150,55,0.12)');
    grad.addColorStop(0.7, 'rgba(230,90,25,0.03)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cvs);
}

function makeSunDiffractionTexture(colorObj) {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext('2d');
  const cx = size / 2, cy = size / 2;

  // Rayon horizontal fin
  const gH = ctx.createLinearGradient(0, cy, size, cy);
  gH.addColorStop(0, 'rgba(255,255,255,0)');
  gH.addColorStop(0.42, 'rgba(255,230,170,0.18)');
  gH.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  gH.addColorStop(0.58, 'rgba(255,230,170,0.18)');
  gH.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gH;
  ctx.fillRect(0, cy - 2, size, 4);

  // Rayon vertical fin
  const gV = ctx.createLinearGradient(cx, 0, cx, size);
  gV.addColorStop(0, 'rgba(255,255,255,0)');
  gV.addColorStop(0.42, 'rgba(255,230,170,0.18)');
  gV.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  gV.addColorStop(0.58, 'rgba(255,230,170,0.18)');
  gV.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gV;
  ctx.fillRect(cx - 2, 0, 4, size);

  // Cœur doux au centre de la diffraction
  const gC = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36);
  gC.addColorStop(0, 'rgba(255,255,255,0.9)');
  gC.addColorStop(0.4, 'rgba(255,220,140,0.4)');
  gC.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = gC;
  ctx.beginPath();
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(cvs);
}

function createSun() {
  const sysData = SYSTEMS_DATA[state.currentSystem];
  const r = sysData.sunRadius;

  // Nettoyage complet préalable du groupe solaire
  if (sunGroup) {
    scene.remove(sunGroup);
    sunGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  sunGroup = new THREE.Group();
  sunGroup.name = 'sunGroup';
  scene.add(sunGroup);

  // 1. Photosphère solide incandescente
  const geo = new THREE.SphereGeometry(r, 48, 48);
  const matParams = { map: texSun() };
  let glowR = 1, glowG = 0.72, glowB = 0.40;

  if (sysData.sunColor) {
    matParams.color = new THREE.Color(`rgb(${sysData.sunColor.r}, ${sysData.sunColor.g}, ${sysData.sunColor.b})`);
    glowR = sysData.sunColor.r / 255;
    glowG = sysData.sunColor.g / 255;
    glowB = sysData.sunColor.b / 255;
  } else {
    matParams.color = 0xfff2e0;
  }

  const mat = new THREE.MeshBasicMaterial(matParams);
  const sun = new THREE.Mesh(geo, mat);
  sun.userData.bodyId = 'sun';
  sunGroup.add(sun);
  clickables.push(sun);

  // 2. Couronne interne dense (incandescente, r * 2.2)
  const coreTex = makeSunCoreTexture(sysData.sunColor);
  const innerCoronaMat = new THREE.SpriteMaterial({
    map: coreTex, color: new THREE.Color(glowR, glowG, glowB), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95
  });
  const innerCorona = new THREE.Sprite(innerCoronaMat);
  innerCorona.scale.set(r * 2.2, r * 2.2, 1);
  sunGroup.add(innerCorona);

  // 3. Chromosphère intermédiaire rayonnante (r * 4.0)
  const midCoronaMat = new THREE.SpriteMaterial({
    map: coreTex, color: new THREE.Color(glowR * 0.95, glowG * 0.85, glowB * 0.7), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.65
  });
  sunMidCoronaSprite = new THREE.Sprite(midCoronaMat);
  sunMidCoronaSprite.scale.set(r * 4.0, r * 4.0, 1);
  sunGroup.add(sunMidCoronaSprite);

  // 4. Grand voile solaire externe vaporeux (r * 8.0 ~ 56 u de rayonnement majestueux)
  const hazeTex = makeSunOuterHazeTexture(sysData.sunColor);
  const outerCoronaMat = new THREE.SpriteMaterial({
    map: hazeTex, color: new THREE.Color(glowR, glowG, glowB), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.40
  });
  sunOuterCoronaSprite = new THREE.Sprite(outerCoronaMat);
  sunOuterCoronaSprite.scale.set(r * 8.0, r * 8.0, 1);
  sunGroup.add(sunOuterCoronaSprite);

  // 5. Rayons de diffraction optique discrets
  const diffTex = makeSunDiffractionTexture(sysData.sunColor);
  const diffMat = new THREE.SpriteMaterial({
    map: diffTex, color: new THREE.Color(glowR, glowG, glowB), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.32
  });
  sunDiffractionSprite = new THREE.Sprite(diffMat);
  sunDiffractionSprite.scale.set(r * 7.0, r * 7.0, 1);
  sunGroup.add(sunDiffractionSprite);

  planetObjects['sun'] = {
    mesh: sun,
    group: sunGroup,
    data: {
      id: 'sun', name: sysData.name + ' Star', scaledRadius: r,
      info: { 'Type': 'Star', 'Radius': r }
    },
    label: makeLabel(sysData.name + ' Star')
  };
}

function updateSun(dt) {
  if (!planetObjects['sun'] || !planetObjects['sun'].mesh) return;

  // Rotation axiale lente du Soleil
  planetObjects['sun'].mesh.rotation.y += dt * 0.04 * state.timeScale;

  // Respiration thermique lente de la couronne solaire (période de ~4s)
  sunPulseTimer += dt * 1.5 * state.timeScale;
  const pulse = 1.0 + Math.sin(sunPulseTimer) * 0.025;

  if (sunOuterCoronaSprite) {
    const baseR = planetObjects['sun'].data.scaledRadius;
    const s = baseR * 8.0 * pulse;
    sunOuterCoronaSprite.scale.set(s, s, 1);
    sunOuterCoronaSprite.material.opacity = 0.38 + Math.sin(sunPulseTimer * 1.1) * 0.05;
  }
  if (sunMidCoronaSprite) {
    const baseR = planetObjects['sun'].data.scaledRadius;
    const s = baseR * 4.0 * (1.0 + Math.cos(sunPulseTimer * 0.9) * 0.02);
    sunMidCoronaSprite.scale.set(s, s, 1);
  }
  if (sunDiffractionSprite && sunDiffractionSprite.material) {
    sunDiffractionSprite.material.rotation += dt * 0.003 * state.timeScale;
  }
}

// ============================================================
// LIGHTS
// ============================================================
function setupLights() {
  // Lumière directe du soleil (décroissance adoucie pour que les planètes distantes restent bien éclairées)
  const sunLight = new THREE.PointLight(0xfff5e0, 2.4, 0, 0.75);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Ambiance cosmique douce : évite le noir complet sur la face nocturne tout en préservant l'effet d'ombre
  const ambient = new THREE.AmbientLight(0x283446, 1.15);
  scene.add(ambient);

  // Légère lueur hémisphérique pour révéler le relief et la silhouette des planètes dans l'ombre
  const hemi = new THREE.HemisphereLight(0x32425a, 0x16202c, 0.45);
  scene.add(hemi);
}

// ============================================================
// PLANETS
// ============================================================
function scaledRadius(data) {
  // Échelle progressive rééquilibrée (Option 1 - Ratio Soleil/Jupiter de 3.5x) :
  // Telluriques bien lisibles : Terre = 0.58 u, Vénus = 0.56 u, Mars = 0.42 u, Mercure = 0.35 u
  // Géantes gazeuses harmonisées : Jupiter = 2.04 u, Saturne = 1.86 u, Uranus = 1.19 u, Neptune = 1.17 u
  // Le Soleil (r = 7.0 u, d = 14.0 u) domine nettement Jupiter (d = 4.08 u) avec un ratio de ~3.5x
  return Math.max(MIN_RADIUS, 0.58 * Math.pow(data.radius, 0.52));
}

function scaledDistance(data) {
  // Dégagement gracieux autour du Soleil (r = 7.0 u) :
  // Mercure = 12.47 u (5.5 u de vide au-dessus de la surface solaire)
  // Vénus = 18.51 u, Terre = 23.50 u (1.0 AU), Mars = 32.93 u, Jupiter = 99.15 u, Neptune = 546.8 u
  return 5.5 + data.distance * 18.0;
}

var textureCache = {};
function getTexture(id) {
  if (textureCache[id]) return textureCache[id];
  const t = ({
    mercury: texMercury, venus: texVenus, earth: texEarth, mars: texMars,
    jupiter: texJupiter, saturn: texSaturn, uranus: texUranus, neptune: texNeptune,
  }[id] || texMercury)();
  textureCache[id] = t;
  return t;
}

function makeLabel(name, cls = '') {
  const el = document.createElement('div');
  el.className = 'label-3d' + (cls ? ' ' + cls : '');
  el.textContent = name;
  document.getElementById('labels').appendChild(el);
  return el;
}

function createOrbitLine(distance, tilt = 0) {
  const segments = 128;
  const geo = new THREE.BufferGeometry();
  const pts = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts[i * 3] = Math.cos(a) * distance;
    pts[i * 3 + 1] = 0;
    pts[i * 3 + 2] = Math.sin(a) * distance;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x334455, transparent: true, opacity: 0.35, depthWrite: false
  });
  const line = new THREE.Line(geo, mat);
  line.rotation.x = deg2rad(tilt);
  scene.add(line);
  orbitLines.push(line);
  return line;
}

function createAtmosphere(radius, atmo) {
  const geo = new THREE.SphereGeometry(radius * atmo.scale, 32, 32);
  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`rgb(${atmo.r},${atmo.g},${atmo.b})`),
    transparent: true, opacity: atmo.opacity, side: THREE.FrontSide, depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function createRings(data, radius) {
  const r = data.rings;
  const innerR = radius * r.inner, outerR = radius * r.outer;
  const geo = new THREE.RingGeometry(innerR, outerR, 120, 4);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const d = Math.sqrt(x * x + y * y);
    uv.setXY(i, (d - innerR) / (outerR - innerR), 0);
  }
  const ringTex = texRings(r.r ?? 200, r.g ?? 175, r.b ?? 110);
  const mat = new THREE.MeshBasicMaterial({
    map: ringTex, side: THREE.DoubleSide, transparent: true,
    opacity: r.opacity ?? 0.85, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function createPlanet(data) {
  const r = scaledRadius(data);
  const dist = scaledDistance(data);
  data.scaledRadius = r;
  data.scaledDistance = dist;

  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.x = deg2rad(data.tilt ?? 0) * 0.2;
  scene.add(orbitGroup);

  const planetGroup = new THREE.Group();
  planetGroup.position.x = dist;
  orbitGroup.add(planetGroup);

  const segs = r > 1.5 ? 48 : 32;
  const geo = new THREE.SphereGeometry(r, segs, segs);
  const mat = new THREE.MeshStandardMaterial({ map: getTexture(data.id), roughness: 0.85, metalness: 0.0 });
  if (data.id === 'earth') { mat.roughness = 0.7; mat.metalness = 0.05; }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = deg2rad(data.tilt ?? 0);
  mesh.userData.bodyId = data.id;
  planetGroup.add(mesh);
  clickables.push(mesh);

  let cloudMesh = null;
  if (data.id === 'earth') {
    const cGeo = new THREE.SphereGeometry(r * 1.015, 40, 40);
    const cMat = new THREE.MeshStandardMaterial({
      map: texEarthClouds(), transparent: true, opacity: 0.6, depthWrite: false, roughness: 1,
    });
    cloudMesh = new THREE.Mesh(cGeo, cMat);
    planetGroup.add(cloudMesh);
  }

  let atmoMesh = null;
  if (data.atmo) { atmoMesh = createAtmosphere(r, data.atmo); planetGroup.add(atmoMesh); }
  if (data.rings) { planetGroup.add(createRings(data, r)); }

  createOrbitLine(dist, data.tilt ? data.tilt * 0.1 : 0);

  const label = makeLabel(data.name);
  labelEls.push({ el: label, group: planetGroup });

  const moons = [];
  if (data.moons) {
    for (const md of data.moons) { moons.push(createMoon(md, r, planetGroup)); }
  }

  planetObjects[data.id] = { mesh, orbitGroup, planetGroup, label, data, moons, cloudMesh };
}

function createMoon(md, parentRadius, parentGroup) {
  const moonR = Math.max(MIN_RADIUS * 0.5, md.radius * PLANET_SCALE * 0.1);
  const moonDist = parentRadius * md.distance;
  const orbitGroup = new THREE.Group();
  parentGroup.add(orbitGroup);
  const geo = new THREE.SphereGeometry(moonR, 20, 20);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(md.color), roughness: 0.9,
    map: md.name === 'Moon' ? texMoon() : null,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.x = moonDist;
  orbitGroup.add(mesh);
  return { mesh, orbitGroup, data: md, distance: moonDist, period: md.period };
}

// ============================================================
// ASTEROID BELT
// ============================================================
function createAsteroidBelt() {
  const count = 2500;
  const geo = new THREE.DodecahedronGeometry(0.04, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7a7060, roughness: 0.95 });
  const belt = new THREE.InstancedMesh(geo, mat, count);
  belt.userData.isAsteroid = true;
  const dummy = new THREE.Object3D();
  const inner = 45.0, outer = 68.0;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = inner + Math.random() * (outer - inner);
    const y = (Math.random() - 0.5) * 1.5;
    const scale = 0.3 + Math.random() * 1.5;
    dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    belt.setMatrixAt(i, dummy.matrix);
  }
  belt.instanceMatrix.needsUpdate = true;
  scene.add(belt);
  mineableObjects = [belt]; // Étape 2.4 : On ajoute la ceinture d'astéroïdes (InstancedMesh) aux objets minables
  return belt;
}


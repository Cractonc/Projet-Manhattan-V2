'use strict';

// ============================================================
// STARFIELD (Solar scene)
// ============================================================
function createStarfield() {
  const count = 8000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 45000 + Math.random() * 5000;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const t = Math.random();
    col[i * 3] = 0.85 + t * 0.15;
    col[i * 3 + 1] = 0.85 + t * 0.05;
    col[i * 3 + 2] = 0.9 - t * 0.1;
    sizes[i] = Math.random() < 0.02 ? 2.5 : (Math.random() < 0.1 ? 1.5 : 0.9);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({
    size: 1.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85,
  });
  scene.add(new THREE.Points(geo, mat));
}

// ============================================================
// SUN
// ============================================================
function createSun() {
  const sysData = SYSTEMS_DATA[state.currentSystem];
  const r = sysData.sunRadius;
  const geo = new THREE.SphereGeometry(r, 48, 48);
  const matParams = { map: texSun() };

  let glowR = 1, glowG = 0.686, glowB = 0.376;

  if (sysData.sunColor) {
    matParams.color = new THREE.Color(`rgb(${sysData.sunColor.r}, ${sysData.sunColor.g}, ${sysData.sunColor.b})`);
    glowR = sysData.sunColor.r / 255;
    glowG = sysData.sunColor.g / 255;
    glowB = sysData.sunColor.b / 255;
  } else {
    matParams.color = 0xfff0e0;
  }

  const mat = new THREE.MeshBasicMaterial(matParams);
  const sun = new THREE.Mesh(geo, mat);
  scene.add(sun);

  const glowTex = makeGlowTexture(sysData.sunColor);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex, color: new THREE.Color(glowR, glowG, glowB), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(r * 7, r * 7, 1);
  scene.add(glow);

  const haloMat = new THREE.SpriteMaterial({
    map: glowTex, color: new THREE.Color(glowR * 0.9, glowG * 0.9, glowB * 0.8), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(r * 3.5, r * 3.5, 1);
  scene.add(halo);

  clickables.push(sun);
  sun.userData.bodyId = 'sun';

  planetObjects['sun'] = {
    mesh: sun,
    data: {
      id: 'sun', name: sysData.name + ' Star', scaledRadius: r,
      info: { 'Type': 'Star', 'Radius': r }
    },
    label: makeLabel(sysData.name + ' Star')
  };
}

function makeGlowTexture(colorObj) {
  const size = 256;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  if (colorObj) {
    grad.addColorStop(0, `rgba(255,255,255,1)`);
    grad.addColorStop(0.15, `rgba(${colorObj.r},${colorObj.g},${colorObj.b},0.9)`);
    grad.addColorStop(0.4, `rgba(${colorObj.r},${Math.floor(colorObj.g / 2)},${Math.floor(colorObj.b / 3)},0.4)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.15, 'rgba(255,230,160,0.9)');
    grad.addColorStop(0.4, 'rgba(255,160,60,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cvs);
}

// ============================================================
// LIGHTS
// ============================================================
function setupLights() {
  const sunLight = new THREE.PointLight(0xfff5e0, 2.2, 0, 1.2);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
  const ambient = new THREE.AmbientLight(0x101825, 0.6);
  scene.add(ambient);
}

// ============================================================
// PLANETS
// ============================================================
function scaledRadius(data) { return Math.max(MIN_RADIUS, data.radius * PLANET_SCALE * 0.1); }
function scaledDistance(data) { return data.distance * AU; }

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
  const inner = 2.2 * AU, outer = 3.2 * AU;
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


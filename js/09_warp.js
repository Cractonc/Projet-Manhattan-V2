'use strict';

// ============================================================
// WARP SYSTEM
// ============================================================

// Warp effect canvas
var warpFxCanvas = document.getElementById('warp-fx');
var warpFxCtx = null;

function initWarpFx() {
  warpFxCanvas.width = window.innerWidth;
  warpFxCanvas.height = window.innerHeight;
  warpFxCtx = warpFxCanvas.getContext('2d');
}

function drawWarpStreaks(intensity) {
  if (!warpFxCtx) return;
  const w = warpFxCanvas.width, h = warpFxCanvas.height;
  const cx = w / 2, cy = h / 2;
  warpFxCtx.clearRect(0, 0, w, h);

  const numStreaks = 100;
  const time = performance.now() * 0.0005;

  for (let i = 0; i < numStreaks; i++) {
    const baseAngle = (i / numStreaks) * Math.PI * 2;
    const angle = baseAngle + time + hash2d(i, 42) * 0.3;
    const innerR = 30 + hash2d(i, 7) * 120;
    const outerR = innerR + (150 + hash2d(i, 13) * 350) * intensity;

    warpFxCtx.beginPath();
    warpFxCtx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    warpFxCtx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);


    const alpha = (0.08 + hash2d(i, 3) * 0.25) * intensity;
    const blue = 150 + hash2d(i, 5) * 105 | 0;
    warpFxCtx.strokeStyle = `rgba(${120 + hash2d(i, 9) * 60 | 0},${160 + hash2d(i, 11) * 60 | 0},${blue},${alpha})`;
    warpFxCtx.lineWidth = 0.8 + hash2d(i, 15) * 2.2 * intensity;
    warpFxCtx.stroke();
  }
}

function clearWarpStreaks() {
  if (warpFxCtx) warpFxCtx.clearRect(0, 0, warpFxCanvas.width, warpFxCanvas.height);
}

// ── Warp: Solar → Galactic ──
function initiateWarpToGalaxy() {
  if (state.warp.active || state.scaleLevel === 'GALACTIC') return;
  const w = state.warp;
  w.active = true;
  w.type = 'TO_GALAXY';
  w.phase = 'CHARGING';
  w.progress = 0;
  w.phaseTime = 0;
  w.phaseDuration = 1.0;
  w.totalDuration = 3.5;

  document.getElementById('warp-overlay').classList.add('active');
  document.getElementById('warp-fx').classList.add('active');
  document.getElementById('warp-hud').classList.add('active');
  document.getElementById('warp-status-text').textContent = 'ENGAGING WARP DRIVE';
}

// ── Warp: Galactic → System ──
function initiateWarpToSystem(sysId) {
  if (state.warp.active || state.scaleLevel === 'SOLAR') return;

  if (state.scaleLevel === 'GALACTIC') {
    state.warp.active = true;
    state.warp.type = 'TRANSITIONING';
    state.warp.targetSysId = sysId;

    const doZoom = () => {
      galCam.focusOn(sysId);
      highlightPOIItem(sysId);

      galCam.tRadius = 350;

      document.getElementById('warp-overlay').classList.add('active');
      document.getElementById('warp-hud').classList.add('active');
      const pName = SYSTEMS_DATA[sysId] ? SYSTEMS_DATA[sysId].name : 'SYSTEM';
      document.getElementById('warp-status-text').textContent = 'APPROACHING ' + pName.toUpperCase();

      setTimeout(() => {
        doActualWarpToSystem(sysId);
      }, 1800);
    };

    if (state.cameraMode === 'COCKPIT') {
      exitCockpitMode();
      setTimeout(doZoom, 350);
    } else {
      doZoom();
    }
    return;
  }

  doActualWarpToSystem(sysId);
}

function doActualWarpToSystem(sysId) {
  const w = state.warp;
  w.active = true;
  w.type = 'TO_SYSTEM';
  w.targetSysId = sysId;
  w.phase = 'CHARGING';
  w.progress = 0;
  w.phaseTime = 0;
  w.phaseDuration = 1.0;
  w.totalDuration = 3.5;

  document.getElementById('warp-overlay').classList.add('active');
  document.getElementById('warp-fx').classList.add('active');
  document.getElementById('warp-hud').classList.add('active');
  const pName = SYSTEMS_DATA[sysId] ? SYSTEMS_DATA[sysId].name : 'SYSTEM';
  document.getElementById('warp-status-text').textContent = 'ENTERING ' + pName.toUpperCase();
}

// ── Warp: POI to POI (FTL cockpit) ──
function initiateWarpToPOI(poiId) {
  if (state.warp.active) return;
  const poi = galacticPOIObjects[poiId];
  if (!poi) return;

  const w = state.warp;
  w.active = true;
  w.type = 'TO_POI';
  w.phase = 'CHARGING';
  w.progress = 0;
  w.phaseTime = 0;
  w.phaseDuration = 1.2;
  w.targetPOI = poiId;
  w.startPos.copy(ship.position);

  // Arrive at observation distance, not inside the POI
  const poiScale = poi.data.scale || 300;
  const arrivalOffset = Math.max(poiScale * 2.5, 800);
  const dir = new THREE.Vector3().subVectors(ship.position, poi.group.position).normalize();
  w.endPos.copy(poi.group.position).addScaledVector(dir, arrivalOffset);

  // Duration based on distance
  const dist = w.startPos.distanceTo(w.endPos);
  w.totalDuration = clamp(3 + dist / 15000, 4, 10);

  document.getElementById('warp-overlay').classList.add('active');
  document.getElementById('warp-fx').classList.add('active');
  document.getElementById('warp-hud').classList.add('active');
  document.getElementById('warp-status-text').textContent = 'FTL WARP TO ' + poi.data.name.toUpperCase();
}

function updateWarp(dt) {
  const w = state.warp;
  if (!w.active) return;

  w.phaseTime += dt;

  if (w.phase === 'CHARGING') {
    const t = clamp(w.phaseTime / w.phaseDuration, 0, 1);
    w.progress = t * 0.15;
    drawWarpStreaks(t * 0.4);

    // FOV widen during charge
    if (state.cameraMode === 'COCKPIT' && cockpitCamera) {
      cockpitCamera.fov = lerp(75, 90, t);
      cockpitCamera.updateProjectionMatrix();
    }

    document.getElementById('warp-progress-fill').style.width = (w.progress * 100) + '%';
    document.getElementById('warp-eta-text').textContent = 'CHARGING...';

    if (w.phaseTime >= w.phaseDuration) {
      w.phase = 'TRAVELING';
      w.phaseTime = 0;
      w.phaseDuration = w.totalDuration - w.phaseDuration - 1.0;
      document.getElementById('warp-status-text').textContent =
        w.type === 'TO_POI' ? 'FTL TRANSIT' : 'WARP TRANSIT';

      // Perform scene switch for TO_GALAXY / TO_SYSTEM
      if (w.type === 'TO_GALAXY') {
        performSceneSwitchToGalactic();
      } else if (w.type === 'TO_SYSTEM') {
        performSceneSwitchToSystem(w.targetSysId);
      }
    }
  } else if (w.phase === 'TRAVELING') {
    const t = clamp(w.phaseTime / w.phaseDuration, 0, 1);
    w.progress = 0.15 + t * 0.7;
    drawWarpStreaks(0.5 + t * 0.5);

    // FOV at max during travel
    if (state.cameraMode === 'COCKPIT' && cockpitCamera) {
      cockpitCamera.fov = lerp(90, 110, Math.min(t * 3, 1));
      cockpitCamera.updateProjectionMatrix();
    }

    // POI-to-POI: interpolate ship position
    if (w.type === 'TO_POI') {
      const eased = easeInOutCubic(t);
      ship.position.lerpVectors(w.startPos, w.endPos, eased);
      shipRig.position.copy(ship.position);

      // Face destination
      const dir = new THREE.Vector3().subVectors(w.endPos, ship.position).normalize();
      if (dir.length() > 0.001) {
        const lm = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, new THREE.Vector3(0, 1, 0));
        const tq = new THREE.Quaternion().setFromRotationMatrix(lm);
        ship.quaternion.slerp(tq, clamp(dt * 2, 0, 0.1));
        shipRig.quaternion.copy(ship.quaternion);
      }

      // Display info
      const remaining = ship.position.distanceTo(w.endPos);
      const speed = remaining / Math.max(w.phaseDuration - w.phaseTime, 0.01);
      document.getElementById('warp-eta-text').textContent =
        formatDistance(remaining) + ' remaining · ' + formatDistance(speed) + '/s';
    } else {
      const eta = Math.max(0, w.phaseDuration - w.phaseTime);
      document.getElementById('warp-eta-text').textContent = eta.toFixed(1) + 's';
    }

    document.getElementById('warp-progress-fill').style.width = (w.progress * 100) + '%';

    if (w.phaseTime >= w.phaseDuration) {
      w.phase = 'ARRIVING';
      w.phaseTime = 0;
      w.phaseDuration = 1.0;
      document.getElementById('warp-status-text').textContent = 'DROPPING OUT OF WARP';
    }
  } else if (w.phase === 'ARRIVING') {
    const t = clamp(w.phaseTime / w.phaseDuration, 0, 1);
    w.progress = 0.85 + t * 0.15;
    drawWarpStreaks((1 - t) * 0.5);

    // FOV narrow back
    if (state.cameraMode === 'COCKPIT' && cockpitCamera) {
      cockpitCamera.fov = lerp(110, 75, t);
      cockpitCamera.updateProjectionMatrix();
    }

    document.getElementById('warp-progress-fill').style.width = (w.progress * 100) + '%';
    document.getElementById('warp-eta-text').textContent = 'ARRIVAL IMMINENT';

    if (w.phaseTime >= w.phaseDuration) {
      // Warp complete
      w.active = false;
      w.phase = 'NONE';
      w.type = 'NONE';
      w.progress = 0;

      document.getElementById('warp-overlay').classList.remove('active');
      document.getElementById('warp-fx').classList.remove('active');
      document.getElementById('warp-hud').classList.remove('active');
      clearWarpStreaks();

      if (cockpitCamera) {
        cockpitCamera.fov = 75;
        cockpitCamera.updateProjectionMatrix();
      }

      // Focus on arrival target
      if (w.targetPOI && state.scaleLevel === 'GALACTIC') {
        galCam.focusOn(w.targetPOI);
        state.cockpitTarget = w.targetPOI;
      }
      w.targetPOI = null;

      updateScaleUI();
    }
  }
}

function clearLocalScene() {
  for (const id in planetObjects) {
    if (planetObjects[id].mesh) scene.remove(planetObjects[id].mesh);
    if (planetObjects[id].orbitGroup) scene.remove(planetObjects[id].orbitGroup);
    if (planetObjects[id].planetGroup) scene.remove(planetObjects[id].planetGroup);
    if (planetObjects[id].label && planetObjects[id].label.parentNode) {
      planetObjects[id].label.parentNode.removeChild(planetObjects[id].label);
    }
    delete planetObjects[id];
  }

  clickables.length = 0;
  for (const line of orbitLines) { scene.remove(line); }
  orbitLines.length = 0;

  for (const l of labelEls) {
    if (l.el && l.el.parentNode) l.el.parentNode.removeChild(l.el);
  }
  labelEls.length = 0;

  if (asteroidBelt) {
    scene.remove(asteroidBelt);
    if (asteroidBelt.geometry) asteroidBelt.geometry.dispose();
    if (asteroidBelt.material) asteroidBelt.material.dispose();
    asteroidBelt = null;
  }

  cinematicSequence = [];
}

function loadStarSystem(sysId) {
  clearLocalScene();
  const data = SYSTEMS_DATA[sysId];
  if (!data) return;
  state.currentSystem = sysId;

  createSun();

  for (const body of data.bodies) {
    createPlanet(body);
  }

  if (data.asteroids) {
    asteroidBelt = createAsteroidBelt();
  }

  cinematicSequence = ['sun', ...data.bodies.map(b => b.id)];

  const bodyList = document.getElementById('body-list');
  if (bodyList) bodyList.innerHTML = '';
  buildPlanetList();
}

function performSceneSwitchToGalactic() {
  state.scaleLevel = 'GALACTIC';

  // If inside ship (cockpit or walk), update camera far plane
  const inShip = (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK');
  if (inShip && shipRig) {
    if (shipRig.parent) shipRig.parent.remove(shipRig);
    galacticScene.add(shipRig);
    ship.position.set(SUN_GAL.x, SUN_GAL.y + 500, SUN_GAL.z);
    shipRig.position.copy(ship.position);
    cockpitCamera.far = 2000000; // Deep space visibility
    cockpitCamera.updateProjectionMatrix();
    ship.maxSpeed = 3000; // ly/s cruise in galactic
  }

  // Switch tab
  switchPanelTab('galaxy');
  updateScaleUI();
}

function performSceneSwitchToSystem(sysId) {
  loadStarSystem(sysId);
  state.scaleLevel = 'SOLAR';

  // If inside ship (cockpit or walk), update camera far plane
  const inShip = (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK');
  if (inShip && shipRig) {
    if (shipRig.parent) shipRig.parent.remove(shipRig);
    scene.add(shipRig);
    ship.position.set(0, 10, 60);
    shipRig.position.copy(ship.position);
    cockpitCamera.far = 100000;
    cockpitCamera.updateProjectionMatrix();
    ship.maxSpeed = 8; // u/s cruise in solar
  }

  state.selectedPOI = null;
  switchPanelTab('system');
  updateScaleUI();
}

function updateScaleUI() {
  const badge = document.getElementById('scale-badge');
  const btnOrbits = document.getElementById('btn-orbits');
  const btnAsteroids = document.getElementById('btn-asteroids');
  const btnPause = document.getElementById('btn-pause');

  if (state.scaleLevel === 'GALACTIC') {
    syncSpeedUI(state.galacticSpeed);
    if (btnOrbits) btnOrbits.style.display = 'none';
    if (btnAsteroids) btnAsteroids.style.display = 'none';
    if (btnPause) btnPause.style.display = 'none';
    badge.textContent = 'MILKY WAY';
    badge.classList.add('galactic');
    document.getElementById('hud-sector').textContent = 'SECTOR: ORION-CYGNUS ARM';
    document.getElementById('hint').textContent = 'DRAG · SCROLL · CLICK POI · G = SOLAR · V = FTL COCKPIT';
  } else {
    syncSpeedUI(state.solarSpeed);
    if (btnOrbits) btnOrbits.style.display = '';
    if (btnAsteroids) btnAsteroids.style.display = '';
    if (btnPause) btnPause.style.display = '';
    badge.textContent = 'SOLAR SYSTEM';
    badge.classList.remove('galactic');
    document.getElementById('hud-sector').textContent = '';
    document.getElementById('hint').textContent = 'DRAG · SCROLL · CLICK · P = PANEL · C = CINEMATIC · V = COCKPIT · G = GALAXY';
  }
}


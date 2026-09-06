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
  w.totalDuration = clamp(3 + dist / 150000, 4, 10);

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

  // Ciel étoilé réaliste adapté au système
  if (typeof solarStarfieldGroup !== 'undefined' && solarStarfieldGroup) {
    scene.remove(solarStarfieldGroup);
    solarStarfieldGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    solarStarfieldGroup = null;
  }

  // Nettoyage complet du groupe solaire
  if (typeof sunGroup !== 'undefined' && sunGroup) {
    scene.remove(sunGroup);
    sunGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    sunGroup = null;
  }

  cinematicSequence = [];
}

function loadStarSystem(sysId) {
  clearLocalScene();
  const data = SYSTEMS_DATA[sysId];
  if (!data) return;
  state.currentSystem = sysId;

  // Créer le ciel étoilé réaliste adapté à ce système stellaire
  if (typeof createStarfield === 'function') {
    createStarfield(sysId);
  }

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
  if (typeof SPEED_TIERS_GALACTIC !== 'undefined') SPEED_TIERS = SPEED_TIERS_GALACTIC;
  state.currentSpeedTier = 'SUBLIGHT';
  ship.throttlePercent = 0;
  ship.speed = 0;

  // Repositionner le vaisseau en bordure du système stellaire pour ne pas spawner dans le Soleil
  if (shipRig) {
    if (shipRig.parent) shipRig.parent.remove(shipRig);
    galacticScene.add(shipRig);
    if (typeof ensureValidGalacticShipPosition === 'function') {
      ensureValidGalacticShipPosition();
    }
    if (cockpitCamera) {
      cockpitCamera.far = 10000000; // Deep space visibility
      cockpitCamera.updateProjectionMatrix();
    }
  }

  // Si on est en vue externe, cadrer le système stellaire à distance idéale d'observation
  const inShip = (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK');
  if (!inShip && typeof galCam !== 'undefined') {
    const sysId = state.currentSystem || 'sol';
    galCam.focusOn(sysId);
    galCam.lookAt.copy(galCam.tLookAt);
    galCam.radius = galCam.tRadius;
  }

  // Switch tab
  switchPanelTab('galaxy');
  updateScaleUI();
}

function performSceneSwitchToSystem(sysId) {
  loadStarSystem(sysId);
  state.scaleLevel = 'SOLAR';
  if (typeof SPEED_TIERS_SOLAR !== 'undefined') SPEED_TIERS = SPEED_TIERS_SOLAR;
  state.currentSpeedTier = 'SUBLIGHT';
  ship.throttlePercent = 0;
  ship.speed = 0;

  // Spécificité systèmes visitables : préparer le positionnement sur l'orbite de la Terre ou de Mars
  if (scene) scene.updateMatrixWorld(true);
  if (typeof planetObjects !== 'undefined' && planetObjects['earth']) {
    const earthPos = new THREE.Vector3();
    planetObjects['earth'].mesh.getWorldPosition(earthPos);
    const earthDir = earthPos.clone().normalize();
    ship.position.copy(earthPos).add(earthDir.clone().multiplyScalar(3.5)).add(new THREE.Vector3(0, 1.2, 0));
    const m = new THREE.Matrix4().lookAt(ship.position, earthPos, new THREE.Vector3(0, 1, 0));
    ship.quaternion.setFromRotationMatrix(m);
    state.cockpitTarget = 'earth';
  } else if (typeof planetObjects !== 'undefined' && planetObjects['mars']) {
    const marsPos = new THREE.Vector3();
    planetObjects['mars'].mesh.getWorldPosition(marsPos);
    const marsDir = marsPos.clone().normalize();
    ship.position.copy(marsPos).add(marsDir.clone().multiplyScalar(3.5)).add(new THREE.Vector3(0, 1.2, 0));
    const m = new THREE.Matrix4().lookAt(ship.position, marsPos, new THREE.Vector3(0, 1, 0));
    ship.quaternion.setFromRotationMatrix(m);
    state.cockpitTarget = 'mars';
  } else {
    ship.position.set(0, 3, 27);
  }
  state.shipPosition.copy(ship.position);
  state.shipRotation.copy(ship.quaternion);

  // If inside ship (cockpit or walk), update camera far plane
  const inShip = (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK');
  if (inShip && shipRig) {
    if (shipRig.parent) shipRig.parent.remove(shipRig);
    scene.add(shipRig);
    shipRig.position.copy(ship.position);
    shipRig.quaternion.copy(ship.quaternion);
    cockpitCamera.far = 100000;
    cockpitCamera.updateProjectionMatrix();
  }

  state.selectedPOI = null;
  switchPanelTab('system');
  updateScaleUI();
}

function updateScaleUI() {
  const btnOrbits = document.getElementById('btn-orbits');
  const btnAsteroids = document.getElementById('btn-asteroids');
  const btnPause = document.getElementById('btn-pause');

  if (state.scaleLevel === 'GALACTIC') {
    syncSpeedUI(state.galacticSpeed);
    if (btnOrbits) btnOrbits.style.display = 'none';
    if (btnAsteroids) btnAsteroids.style.display = 'none';
    if (btnPause) btnPause.style.display = 'none';
    const hudSector = document.getElementById('hud-sector');
    if (hudSector) hudSector.textContent = '';
  } else {
    syncSpeedUI(state.solarSpeed);
    if (btnOrbits) btnOrbits.style.display = '';
    if (btnAsteroids) btnAsteroids.style.display = '';
    if (btnPause) btnPause.style.display = '';
    const hudSector = document.getElementById('hud-sector');
    if (hudSector) hudSector.textContent = '';
  }
}

// ============================================================
// WORMHOLE TELEPORTATION SYSTEM (Étape 3.1)
// ============================================================
var WORMHOLE_TRIGGER_RADIUS = 1400; // Rayon de déclenchement cohérent avec le vortex et le vaisseau
var _isWormholeJumping = false;

function checkWormholeProximity(dt) {
  if (_isWormholeJumping) return;
  if (state.scaleLevel !== 'GALACTIC') return;
  if (state.wormholeCooldown > 0) return;
  if (state.warp && state.warp.active) return;
  if (typeof WORMHOLES === 'undefined' || !Array.isArray(WORMHOLES)) return;

  const currentShipPos = (typeof ship !== 'undefined' && ship && ship.position)
    ? ship.position
    : state.shipPosition;

  if (!currentShipPos) return;

  for (let i = 0; i < WORMHOLES.length; i++) {
    const wh = WORMHOLES[i];
    const dx = currentShipPos.x - wh.pos.x;
    const dy = currentShipPos.y - wh.pos.y;
    const dz = currentShipPos.z - wh.pos.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < (WORMHOLE_TRIGGER_RADIUS * WORMHOLE_TRIGGER_RADIUS)) {
      triggerWormholeJump(wh);
      break;
    }
  }
}

function triggerWormholeJump(wormholeData) {
  if (_isWormholeJumping) return;
  _isWormholeJumping = true;

  // 1. Initialiser le cooldown de sécurité (6 secondes)
  state.wormholeCooldown = 6.0;

  // 2. Récupérer les éléments visuels du DOM
  const overlay = document.getElementById('warp-overlay');
  const fxCanvas = document.getElementById('warp-fx');
  const transitionDiv = document.getElementById('cockpit-transition');
  const cockpitHud = document.getElementById('cockpit-hud');

  if (overlay) {
    overlay.classList.add('active');
    overlay.classList.add('wormhole-active');
  }
  if (fxCanvas) {
    fxCanvas.classList.add('active');
    if (typeof initWarpFx === 'function') initWarpFx();
  }

  // 3. Sauvegarder les états initiaux des passes de post-processing et de la caméra
  const prevBloomStrength = (typeof bloomPass !== 'undefined' && bloomPass) ? bloomPass.strength : 0.40;
  const prevChromaAmount = (typeof chromaPass !== 'undefined' && chromaPass && chromaPass.material && chromaPass.material.uniforms.u_chromaAmount)
    ? chromaPass.material.uniforms.u_chromaAmount.value
    : 0.0020;

  const baseFov = (typeof cockpitCamera !== 'undefined' && cockpitCamera) ? cockpitCamera.fov : 75;
  const baseCamX = (typeof cockpitCamera !== 'undefined' && cockpitCamera) ? cockpitCamera.position.x : 0;
  const baseCamY = (typeof cockpitCamera !== 'undefined' && cockpitCamera) ? cockpitCamera.position.y : 0.08;
  const baseCamZ = (typeof cockpitCamera !== 'undefined' && cockpitCamera) ? cockpitCamera.position.z : -0.5;

  // 4. Lancer le synthétiseur audio relativiste
  playWormholeAudioSequence();

  // Notification d'engagement métrique
  if (typeof showNotification === 'function') {
    showNotification("ATTENTION : GORGE D'EINSTEIN-ROSEN // DISTORSION GÉODÉSIQUE ACTIVE", 2500);
  }

  const startTime = performance.now();
  const totalDuration = 3800; // 3.8 secondes pour les 4 phases
  let hasInverted = false;
  let hasTeleported = false;
  let hasGlitchStarted = false;

  function animateWormholeTransit(now) {
    const currentTime = (typeof now === 'number' && !isNaN(now)) ? now : performance.now();
    const elapsed = currentTime - startTime;
    const progress = clamp(elapsed / totalDuration, 0.0, 1.0);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1 : INFALL TIDAL & LORENTZ ABERRATION (0.0s -> 0.9s, p: 0.0 -> 0.24)
    // ═══════════════════════════════════════════════════════════════
    if (progress < 0.24) {
      const s1 = progress / 0.24; // 0.0 -> 1.0
      const ease1 = s1 * s1;

      // Étirement relativiste du FOV (Lorentz beaming)
      if (typeof cockpitCamera !== 'undefined' && cockpitCamera) {
        cockpitCamera.fov = baseFov + ease1 * 35.0; // 75° -> 110°
        cockpitCamera.updateProjectionMatrix();

        // Micro-tremblements gravitationnels de marée
        const jitterIntensity = ease1 * 0.015;
        cockpitCamera.position.x = baseCamX + (Math.random() - 0.5) * jitterIntensity;
        cockpitCamera.position.y = baseCamY + (Math.random() - 0.5) * jitterIntensity;
      }

      // Montée en puissance du bloom et de l'aberration chromatique
      if (typeof bloomPass !== 'undefined' && bloomPass) {
        bloomPass.strength = lerp(prevBloomStrength, 1.8, ease1);
      }
      if (typeof chromaPass !== 'undefined' && chromaPass && chromaPass.material) {
        chromaPass.material.uniforms.u_chromaAmount.value = lerp(prevChromaAmount, 0.018, ease1);
      }

      // Dessin des flux de contraction optique sur le canvas
      drawWormholeTraversalFX(1, s1, wormholeData.targetColor || wormholeData.color);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2 : INVERSION D'HORIZON & RÉFRACTIONS VERRIÈRE (0.9s -> 1.8s, p: 0.24 -> 0.48)
    // ═══════════════════════════════════════════════════════════════
    } else if (progress < 0.48) {
      const s2 = (progress - 0.24) / 0.24; // 0.0 -> 1.0

      if (!hasInverted) {
        hasInverted = true;
        // Flash optique cyan-blanc au franchissement de gorge (l=0)
        if (transitionDiv) {
          transitionDiv.style.background = '#e0ffff';
          transitionDiv.classList.add('active');
          setTimeout(() => {
            if (transitionDiv) transitionDiv.classList.remove('active');
          }, 320);
        }
      }

      // Déclenchement du glitch électromagnétique sur le HUD cockpit
      if (!hasGlitchStarted && cockpitHud) {
        hasGlitchStarted = true;
        cockpitHud.classList.add('wormhole-glitch');
      }

      // Pic de FOV (ouverture d'horizon jusqu'à 118°)
      if (typeof cockpitCamera !== 'undefined' && cockpitCamera) {
        const peakFov = 110 + Math.sin(s2 * Math.PI) * 8.0;
        cockpitCamera.fov = peakFov;
        cockpitCamera.updateProjectionMatrix();

        // Tremblements accrus lors du franchissement de l'horizon
        const jitter = Math.sin(s2 * Math.PI) * 0.025;
        cockpitCamera.position.x = baseCamX + (Math.random() - 0.5) * jitter;
        cockpitCamera.position.y = baseCamY + (Math.random() - 0.5) * jitter;
      }

      // Pic de saturation lumineuse (Bloom 2.8) et aberration chromatique maximale (0.040)
      if (typeof bloomPass !== 'undefined' && bloomPass) {
        const bPeak = lerp(1.8, 2.8, Math.sin(s2 * Math.PI));
        bloomPass.strength = bPeak;
      }
      if (typeof chromaPass !== 'undefined' && chromaPass && chromaPass.material) {
        chromaPass.material.uniforms.u_chromaAmount.value = lerp(0.018, 0.040, Math.sin(s2 * Math.PI));
      }

      // Réfractions caustiques internes sur la verrière cockpit
      drawWormholeTraversalFX(2, s2, wormholeData.targetColor || wormholeData.color);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3 : TRANSIT CONDUIT EINSTEIN-ROSEN (1.8s -> 2.8s, p: 0.48 -> 0.74)
    // ═══════════════════════════════════════════════════════════════
    } else if (progress < 0.74) {
      const s3 = (progress - 0.48) / 0.26; // 0.0 -> 1.0

      if (!hasTeleported && s3 >= 0.15) {
        hasTeleported = true;

        // Téléportation physique instantanée des coordonnées du vaisseau dans l'Univers 2
        // avec décalage de dégagement de 3 200 AL vers l'avant dans la direction du cap
        let forwardDir = new THREE.Vector3(0, 0, -1);
        if (typeof ship !== 'undefined' && ship && ship.quaternion) {
          forwardDir.applyQuaternion(ship.quaternion).normalize();
        }

        const offsetDist = 3200;
        const targetVec = new THREE.Vector3(
          wormholeData.targetPos.x + forwardDir.x * offsetDist,
          wormholeData.targetPos.y + forwardDir.y * offsetDist,
          wormholeData.targetPos.z + forwardDir.z * offsetDist
        );

        if (typeof ship !== 'undefined' && ship && ship.position) {
          ship.position.copy(targetVec);
        }
        if (state.shipPosition) {
          state.shipPosition.copy(targetVec);
        }
        if (typeof shipRig !== 'undefined' && shipRig) {
          shipRig.position.copy(targetVec);
        }
        if (typeof vesselMapObject !== 'undefined' && vesselMapObject && vesselMapObject.group) {
          vesselMapObject.group.position.copy(targetVec);
        }
        if (typeof galCam !== 'undefined' && state.cameraMode === 'FREE') {
          galCam.tLookAt.copy(targetVec);
          galCam.lookAt.copy(targetVec);
        }
      }

      // Compression progressive du FOV vers une valeur intermédiaire
      if (typeof cockpitCamera !== 'undefined' && cockpitCamera) {
        cockpitCamera.fov = lerp(110, 88, s3);
        cockpitCamera.updateProjectionMatrix();
        cockpitCamera.position.x = lerp(cockpitCamera.position.x, baseCamX, 0.1);
        cockpitCamera.position.y = lerp(cockpitCamera.position.y, baseCamY, 0.1);
      }

      // Décroissance du bloom et des aberrations
      if (typeof bloomPass !== 'undefined' && bloomPass) {
        bloomPass.strength = lerp(2.8, 1.1, s3);
      }
      if (typeof chromaPass !== 'undefined' && chromaPass && chromaPass.material) {
        chromaPass.material.uniforms.u_chromaAmount.value = lerp(0.040, 0.010, s3);
      }

      // Dessin du flux FTL hyper-espace dans le goulot
      drawWormholeTraversalFX(3, s3, wormholeData.targetColor || wormholeData.color);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4 : ÉMERGENCE FLUIDE DANS LE SECTEUR CIBLE (2.8s -> 3.8s, p: 0.74 -> 1.0)
    // ═══════════════════════════════════════════════════════════════
    } else {
      const s4 = (progress - 0.74) / 0.26; // 0.0 -> 1.0
      const ease4 = 1.0 - Math.pow(1.0 - s4, 3.0); // cubic out

      // Retrait du glitch HUD à l'arrivée
      if (cockpitHud && cockpitHud.classList.contains('wormhole-glitch')) {
        cockpitHud.classList.remove('wormhole-glitch');
      }

      // Rétablissement amorti du FOV normal
      if (typeof cockpitCamera !== 'undefined' && cockpitCamera) {
        cockpitCamera.fov = lerp(88, baseFov, ease4);
        cockpitCamera.updateProjectionMatrix();
        cockpitCamera.position.set(baseCamX, baseCamY, baseCamZ);
      }

      // Rétablissement complet du bloom et chroma d'origine
      if (typeof bloomPass !== 'undefined' && bloomPass) {
        bloomPass.strength = lerp(1.1, prevBloomStrength, ease4);
      }
      if (typeof chromaPass !== 'undefined' && chromaPass && chromaPass.material) {
        chromaPass.material.uniforms.u_chromaAmount.value = lerp(0.010, prevChromaAmount, ease4);
      }

      // Dissipation douce des particules d'émergence
      drawWormholeTraversalFX(4, s4, wormholeData.targetColor || wormholeData.color);
    }

    if (progress < 1.0) {
      requestAnimationFrame(animateWormholeTransit);
    } else {
      // Nettoyage final et rétablissement des paramètres nominaux
      if (overlay) {
        overlay.classList.remove('active');
        overlay.classList.remove('wormhole-active');
      }
      if (fxCanvas) fxCanvas.classList.remove('active');
      if (typeof clearWarpStreaks === 'function') clearWarpStreaks();
      if (cockpitHud) cockpitHud.classList.remove('wormhole-glitch');

      if (typeof cockpitCamera !== 'undefined' && cockpitCamera) {
        cockpitCamera.fov = baseFov;
        cockpitCamera.position.set(baseCamX, baseCamY, baseCamZ);
        cockpitCamera.updateProjectionMatrix();
      }
      if (typeof bloomPass !== 'undefined' && bloomPass) {
        bloomPass.strength = prevBloomStrength;
      }
      if (typeof chromaPass !== 'undefined' && chromaPass && chromaPass.material) {
        chromaPass.material.uniforms.u_chromaAmount.value = prevChromaAmount;
      }
      if (transitionDiv) {
        transitionDiv.style.background = '#000000';
      }

      // Notification finale de confirmation de navigation
      if (typeof showNotification === 'function') {
        showNotification("TRANSIT COMPLÉTÉ // SECTEUR CIBLE : " + wormholeData.targetName, 4500);
      }

      _isWormholeJumping = false;
    }
  }

  requestAnimationFrame(animateWormholeTransit);
}

function hexToRgb(hex) {
  if (typeof hex === 'string') {
    if (hex.startsWith('#')) hex = hex.slice(1);
    hex = parseInt(hex, 16);
  }
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255
  };
}

function drawWormholeTraversalFX(phaseIndex, subProgress, targetColorHex) {
  if (!warpFxCtx) return;
  const w = warpFxCanvas.width;
  const h = warpFxCanvas.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  warpFxCtx.clearRect(0, 0, w, h);

  const rgb = hexToRgb(targetColorHex || 0x00ffff);
  const now = performance.now() * 0.001;

  if (phaseIndex === 1) {
    // ── Phase 1 : Infall & Lorentz Beaming ──
    // Contraction radiale des flux lumineux vers le centre
    const numRays = 40;
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2 + now * 0.5;
      const rOuter = Math.max(w, h) * (0.8 - subProgress * 0.4);
      const rInner = rOuter * 0.4;
      warpFxCtx.beginPath();
      warpFxCtx.moveTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
      warpFxCtx.lineTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
      warpFxCtx.strokeStyle = `rgba(255, 255, 255, ${(0.15 + 0.35 * subProgress).toFixed(3)})`;
      warpFxCtx.lineWidth = 1.2 + subProgress * 2.0;
      warpFxCtx.stroke();
    }
  } else if (phaseIndex === 2) {
    // ── Phase 2 : Inversion d'horizon & Réfractions sur la Verrière ──
    // Anneaux caustiques de courbure se propageant sur les vitres du cockpit
    const ringCount = 5;
    for (let r = 0; r < ringCount; r++) {
      const ringP = (subProgress + r / ringCount) % 1.0;
      const radius = ringP * Math.max(w, h) * 0.75;
      const alpha = Math.sin(ringP * Math.PI) * 0.55;

      warpFxCtx.beginPath();
      warpFxCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      warpFxCtx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(3)})`;
      warpFxCtx.lineWidth = 3.5 * (1.0 - ringP);
      warpFxCtx.stroke();
    }

    // Filaments caustiques de distorsion sur la verrière (lignes brisées de réfraction)
    const filCount = 18;
    for (let f = 0; f < filCount; f++) {
      const baseAng = (f / filCount) * Math.PI * 2;
      warpFxCtx.beginPath();
      let curR = 50;
      warpFxCtx.moveTo(cx + Math.cos(baseAng) * curR, cy + Math.sin(baseAng) * curR);
      while (curR < Math.max(w, h) * 0.6) {
        curR += 40 + Math.sin(f + curR) * 15;
        const ang = baseAng + (Math.sin(curR * 0.05 + now * 3.0) * 0.18);
        warpFxCtx.lineTo(cx + Math.cos(ang) * curR, cy + Math.sin(ang) * curR);
      }
      warpFxCtx.strokeStyle = `rgba(255, 255, 255, ${(0.4 * Math.sin(subProgress * Math.PI)).toFixed(3)})`;
      warpFxCtx.lineWidth = 1.5;
      warpFxCtx.stroke();
    }
  } else if (phaseIndex === 3) {
    // ── Phase 3 : Conduit d'Einstein-Rosen (Tube FTL à haute vitesse) ──
    const streakCount = 90;
    for (let s = 0; s < streakCount; s++) {
      const angle = (s / streakCount) * Math.PI * 2 + Math.sin(s * 12.0) * 0.2;
      const speed = 0.5 + (s % 5) * 0.2;
      const rStart = 40 + ((s * 37 + now * 1200 * speed) % (Math.max(w, h) * 0.6));
      const rEnd = rStart + (90 + (s % 7) * 45);

      warpFxCtx.beginPath();
      warpFxCtx.moveTo(cx + Math.cos(angle) * rStart, cy + Math.sin(angle) * rStart);
      warpFxCtx.lineTo(cx + Math.cos(angle) * rEnd, cy + Math.sin(angle) * rEnd);
      const isTargetCol = (s % 3 === 0);
      const strokeR = isTargetCol ? rgb.r : 220;
      const strokeG = isTargetCol ? rgb.g : 240;
      const strokeB = isTargetCol ? rgb.b : 255;
      warpFxCtx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, 0.65)`;
      warpFxCtx.lineWidth = 1.2 + (s % 4) * 0.7;
      warpFxCtx.stroke();
    }

    // Cercles de compression du conduit
    const tubeRings = 4;
    for (let tr = 0; tr < tubeRings; tr++) {
      const trP = ((now * 2.0 + tr / tubeRings) % 1.0);
      const rad = Math.pow(trP, 1.8) * Math.max(w, h) * 0.55;
      warpFxCtx.beginPath();
      warpFxCtx.arc(cx, cy, rad, 0, Math.PI * 2);
      warpFxCtx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.45 * (1.0 - trP)).toFixed(3)})`;
      warpFxCtx.lineWidth = 2.0;
      warpFxCtx.stroke();
    }
  } else if (phaseIndex === 4) {
    // ── Phase 4 : Émergence fluide & Débouché ──
    const decay = 1.0 - subProgress;
    const burstCount = 28;
    for (let b = 0; b < burstCount; b++) {
      const angle = (b / burstCount) * Math.PI * 2;
      const rStart = Math.max(w, h) * 0.2 * subProgress;
      const rEnd = rStart + 160 * decay;
      warpFxCtx.beginPath();
      warpFxCtx.moveTo(cx + Math.cos(angle) * rStart, cy + Math.sin(angle) * rStart);
      warpFxCtx.lineTo(cx + Math.cos(angle) * rEnd, cy + Math.sin(angle) * rEnd);
      warpFxCtx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(0.35 * decay).toFixed(3)})`;
      warpFxCtx.lineWidth = 1.0 + decay * 2.0;
      warpFxCtx.stroke();
    }
  }
}

function playWormholeAudioSequence() {
  try {
    const ctx = (typeof audioCtx !== 'undefined' && audioCtx)
      ? audioCtx
      : (window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t0 = ctx.currentTime;

    // 1. Grondement infrabasse (Tidal Infall, 0.0s -> 1.0s)
    const subOsc = ctx.createOscillator();
    const subFilter = ctx.createBiquadFilter();
    const subGain = ctx.createGain();

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(42, t0);
    subOsc.frequency.exponentialRampToValueAtTime(175, t0 + 0.95);
    subOsc.frequency.exponentialRampToValueAtTime(75, t0 + 2.2);

    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(140, t0);
    subFilter.frequency.exponentialRampToValueAtTime(480, t0 + 0.95);
    subFilter.frequency.exponentialRampToValueAtTime(180, t0 + 2.2);

    subGain.gain.setValueAtTime(0.01, t0);
    subGain.gain.linearRampToValueAtTime(0.22, t0 + 0.7);
    subGain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.4);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(t0);
    subOsc.stop(t0 + 2.45);

    // 2. Choc d'inversion d'horizon & Résonance de gorge (1.0s -> 2.2s)
    const throatOsc = ctx.createOscillator();
    const throatFilter = ctx.createBiquadFilter();
    const throatGain = ctx.createGain();

    throatOsc.type = 'sine';
    throatOsc.frequency.setValueAtTime(320, t0 + 0.9);
    throatOsc.frequency.exponentialRampToValueAtTime(680, t0 + 1.25);
    throatOsc.frequency.exponentialRampToValueAtTime(240, t0 + 2.2);

    throatFilter.type = 'bandpass';
    throatFilter.frequency.setValueAtTime(400, t0 + 0.9);
    throatFilter.Q.setValueAtTime(4.0, t0 + 0.9);

    throatGain.gain.setValueAtTime(0.001, t0 + 0.9);
    throatGain.gain.linearRampToValueAtTime(0.18, t0 + 1.25);
    throatGain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.3);

    throatOsc.connect(throatFilter);
    throatFilter.connect(throatGain);
    throatGain.connect(ctx.destination);

    throatOsc.start(t0 + 0.9);
    throatOsc.stop(t0 + 2.35);

    // 3. Carillon harmonique d'émergence (2.8s -> 3.7s)
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();

    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(523.25, t0 + 2.7);
    chimeOsc.frequency.exponentialRampToValueAtTime(1046.5, t0 + 3.4);

    chimeGain.gain.setValueAtTime(0.001, t0 + 2.7);
    chimeGain.gain.linearRampToValueAtTime(0.08, t0 + 2.85);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.7);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);

    chimeOsc.start(t0 + 2.7);
    chimeOsc.stop(t0 + 3.75);

  } catch (e) {
    // Silencieux si l'audio n'est pas encore débloqué par un clic utilisateur
  }
}

var playWormholeAudio = playWormholeAudioSequence;



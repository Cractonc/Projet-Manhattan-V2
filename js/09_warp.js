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

  // 1. Activer le cooldown (4 secondes)
  state.wormholeCooldown = 4.0;

  // 2. Feedback sonore si audio disponible
  playWormholeAudio();

  // 3. Éléments visuels pour le flash et la transition FTL
  const overlay = document.getElementById('warp-overlay');
  const fxCanvas = document.getElementById('warp-fx');
  const transitionDiv = document.getElementById('cockpit-transition');

  if (overlay) overlay.classList.add('active');
  if (fxCanvas) fxCanvas.classList.add('active');
  if (transitionDiv) {
    transitionDiv.style.background = '#e6ffff'; // Flash cyan/blanc
    transitionDiv.classList.add('active');
    setTimeout(() => {
      if (transitionDiv) transitionDiv.classList.remove('active');
    }, 280);
  }

  // Pic de Bloom temporaire pour effet de saturation lumineuse
  const prevBloomStrength = (typeof bloomPass !== 'undefined' && bloomPass) ? bloomPass.strength : 0.4;
  if (typeof bloomPass !== 'undefined' && bloomPass) {
    bloomPass.strength = 1.4;
  }

  // Animation FTL sur ~1.0 seconde (FOV + streaks + distorsion)
  const startTime = performance.now();
  const jumpDuration = 1000;
  let hasTeleported = false;

  const baseFov = (typeof cockpitCamera !== 'undefined' && cockpitCamera) ? cockpitCamera.fov : 75;

  function animateJump(now) {
    const currentTime = (typeof now === 'number' && !isNaN(now)) ? now : performance.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(1.0, elapsed / jumpDuration);

    // Dessin intensif des traînées d'espace-temps
    const streakIntensity = Math.sin(progress * Math.PI);
    if (typeof drawWarpStreaks === 'function') {
      drawWarpStreaks(streakIntensity * 1.5);
    }

    // Effet d'étirement élastique du champ de vision (FOV)
    if (typeof cockpitCamera !== 'undefined' && cockpitCamera) {
      const fovPulse = Math.sin(progress * Math.PI);
      cockpitCamera.fov = baseFov + fovPulse * 30; // étirement jusqu'à 105°
      cockpitCamera.updateProjectionMatrix();
    }

    // Décroissance progressive du bloom
    if (typeof bloomPass !== 'undefined' && bloomPass) {
      bloomPass.strength = lerp(1.4, prevBloomStrength, progress);
    }

    if (progress >= 0.45 && !hasTeleported) {
      hasTeleported = true;

      // 4. Téléportation instantanée des coordonnées du vaisseau vers targetPos
      // avec un léger décalage vers l'avant (2500 unités) pour sortir de la zone de déclenchement
      let forwardDir = new THREE.Vector3(0, 0, -1);
      if (typeof ship !== 'undefined' && ship && ship.quaternion) {
        forwardDir.applyQuaternion(ship.quaternion).normalize();
      }

      const offsetDist = 2500;
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

      // 5. Notification au joueur
      if (typeof showNotification === 'function') {
        showNotification("Saut Wormhole : Arrivée à " + wormholeData.targetName, 4500);
      }
    }

    if (progress < 1.0) {
      requestAnimationFrame(animateJump);
    } else {
      // Fin de la transition FTL
      if (overlay) overlay.classList.remove('active');
      if (fxCanvas) fxCanvas.classList.remove('active');
      if (typeof clearWarpStreaks === 'function') clearWarpStreaks();
      if (typeof cockpitCamera !== 'undefined' && cockpitCamera) {
        cockpitCamera.fov = baseFov;
        cockpitCamera.updateProjectionMatrix();
      }
      if (typeof bloomPass !== 'undefined' && bloomPass) {
        bloomPass.strength = prevBloomStrength;
      }
      if (transitionDiv) {
        transitionDiv.style.background = '#000000'; // Rétablir la couleur par défaut
      }
      _isWormholeJumping = false;
    }
  }

  requestAnimationFrame(animateJump);
}

function playWormholeAudio() {
  try {
    const ctx = (typeof audioCtx !== 'undefined' && audioCtx)
      ? audioCtx
      : (window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.95);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.95);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.15);
  } catch (e) {
    // Silencieux si l'audio n'est pas encore débloqué par un clic utilisateur
  }
}



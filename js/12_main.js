'use strict';

// ============================================================
// ANIMATION LOOP
// ============================================================
var lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const rawDt = (now - lastTime) * 0.001;
  lastTime = now;
  const dt = Math.min(rawDt, 0.05);

  // Update warp
  if (state.warp.active) updateWarp(dt);

  if (!state.paused) {
    state.time += dt * state.timeScale;
    if (state.scaleLevel === 'SOLAR') {
      updateOrbits(dt);
      updateCinematic(dt);
    }
  }

  // Update camera based on scale
  if (state.scaleLevel === 'SOLAR') {
    cam.update(dt);
  } else {
    galCam.update(dt);
  }

  // Ship physics update (runs if we are inside the ship)
  if (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK') {
    updateShip(dt);
  }

  // Cockpit
  if (state.cameraMode === 'COCKPIT') {
    updateCockpitHUD(dt);
    if (radarCtx) drawRadar(dt);
    updateAudio();
    // Rotate holographic galaxy map
    if (holoMapGroup) {
      const holoGalaxy = holoMapGroup.children.find(c => c instanceof THREE.Group);
      if (holoGalaxy) holoGalaxy.rotation.y += dt * 0.15;
    }
  }
  if (state.cameraMode === 'WALK') {
    updateWalkMode(dt);
    updateTelescopeRef(dt);
    updateAudio();
    // Rotate holographic galaxy map  
    if (holoMapGroup) {
      const holoGalaxy = holoMapGroup.children.find(c => c instanceof THREE.Group);
      if (holoGalaxy) holoGalaxy.rotation.y += dt * 0.15;
    }
    if (typeof holoDeco !== 'undefined' && holoDeco) {
      holoDeco.rotation.y += dt;
      holoDeco.rotation.x += dt * 0.5;
    }
  }

  // Update 2D Galaxy Map Marker
  if ((state.cameraMode === 'WALK' || state.cameraMode === 'COCKPIT') && shipInterior && shipInterior.userData.mapMarker) {
    let gx = 0, gz = 0;
    if (state.scaleLevel === 'GALACTIC') {
      gx = ship.position.x;
      gz = ship.position.z;
    } else if (state.currentSysId === 'sol') {
      gx = 26000; gz = 0;
    } else if (typeof GALACTIC_POI !== 'undefined') {
      const pd = GALACTIC_POI.find(p => p.id === state.currentSysId);
      if (pd) { gx = pd.pos[0]; gz = pd.pos[2]; }
    }
    shipInterior.userData.mapMarker.position.set(1.335 + (gx / 550000) * 0.54, 0.35 - (gz / 550000) * 0.54, 1.035);
    shipInterior.userData.mapMarker.material.emissiveIntensity = 2.0 + Math.sin(now * 0.01) * 3.0;
  }

  // Engine Room Warp Core Logic
  if ((state.cameraMode === 'WALK' || state.cameraMode === 'COCKPIT') && shipInterior && shipInterior.userData.warpCore) {
    const core = shipInterior.userData.warpCore;
    const light = shipInterior.userData.engineLight;

    core.rotation.y += dt * 0.5;
    core.rotation.z += dt * 0.3;

    let targetColor = 0x2266ff; // Blue idle
    let intensity = 2.0;

    if (state.warp.active) {
      targetColor = 0x9922ff; // Purple pulsing
      intensity = 4.0 + Math.sin(now * 0.02) * 2.0;
      core.rotation.y += dt * 2.0;
    } else if (ship.boostActive) {
      if (ship.boostHeat > 80) {
        targetColor = 0xff1100; // Red flashing
        intensity = 4.0 + Math.sin(now * 0.05) * 3.0;
        core.rotation.y += dt * 4.0;
      } else {
        targetColor = 0xff6600; // Orange boost
        intensity = 3.5;
        core.rotation.y += dt * 1.5;
      }
    }

    const currentColor = core.material.emissive;
    const tColor = new THREE.Color(targetColor);
    currentColor.lerp(tColor, dt * 5.0);
    core.material.emissiveIntensity += (intensity - core.material.emissiveIntensity) * dt * 5.0;
    light.color.copy(currentColor);
    light.intensity = core.material.emissiveIntensity * 0.8;
  }

  updateLabels();

  // Rotate sun texture
  if (planetObjects['sun'] && planetObjects['sun'].mesh) {
    planetObjects['sun'].mesh.rotation.y += dt * 0.03;
  }

  // ── RENDU POST-PROCESSING ──
  // Avec logarithmicDepthBuffer: true, plus besoin de faire 2 passes manuelles 
  // pour le cockpit ! Le z-buffer logarithmique gère parfaitement la différence 
  // d'échelle entre le vaisseau (near: 0.05) et la galaxie (far: 20 millions).

  if (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK') {
    const activeCam = cockpitCamera;
    const activeScene = (state.scaleLevel === 'SOLAR') ? scene : galacticScene;

    if (state.scaleLevel === 'GALACTIC') updateGalacticPOIs(dt, activeCam);

    // Ajustement de la caméra pour voir à la fois le cockpit (très près) et l'espace (très loin)
    activeCam.near = 0.05;
    activeCam.far = (state.scaleLevel === 'SOLAR') ? 100000 : 20000000;
    activeCam.layers.enableAll(); // Rend la galaxie (layer 0) et le vaisseau (layer 1)
    activeCam.updateProjectionMatrix();

    renderPass.scene = activeScene;
    renderPass.camera = activeCam;
    composer.render();

  } else {
    // ── Mode spectateur : composer.render() standard ──
    if (state.scaleLevel === 'SOLAR') {
      renderPass.scene  = scene;
      renderPass.camera = camera;
      camera.layers.set(0);
    } else {
      renderPass.scene  = galacticScene;
      renderPass.camera = galacticCamera;
      galacticCamera.layers.set(0);
      updateGalacticPOIs(dt, galacticCamera);
    }
    composer.render();
  }
}

function updateOrbits(dt) {
  const bDat = SYSTEMS_DATA[state.currentSystem] ? SYSTEMS_DATA[state.currentSystem].bodies : [];
  for (const data of bDat) {
    const obj = planetObjects[data.id];
    if (!obj) continue;
    const angularSpeed = (1 / data.period) * 0.6 * state.timeScale;
    obj.orbitGroup.rotation.y += dt * angularSpeed;
    const rotSpeed = (1 / Math.abs(data.rotPeriod)) * (data.rotPeriod < 0 ? -1 : 1) * 15;
    obj.mesh.rotation.y += dt * rotSpeed * state.timeScale;
    if (obj.cloudMesh) {
      obj.cloudMesh.rotation.y += dt * rotSpeed * 1.08 * state.timeScale;
    }
    for (const moon of obj.moons) {
      const moonSpeed = (1 / moon.data.period) * 0.6 * state.timeScale;
      moon.orbitGroup.rotation.y += dt * moonSpeed;
    }
  }
}

// ============================================================
// SPEED SLIDER
// ============================================================
function syncSpeedUI(speed) {
  const slider = document.getElementById('speed-slider');
  const display = document.getElementById('speed-display');
  const hudTs = document.getElementById('hud-timescale');
  const v = speed < 0.01 ? 0 : Math.pow(speed / 60, 1 / 2.5) * 100;
  slider.value = v;
  let label = speed < 0.1 ? '0×' : speed < 2 ? speed.toFixed(1) + '×' : Math.round(speed) + '×';
  display.textContent = label;
  if (hudTs) hudTs.textContent = label;
  state.timeScale = speed;
}

function setupSpeedSlider() {
  const slider = document.getElementById('speed-slider');
  slider.addEventListener('input', () => {
    const v = slider.value / 100;
    const speed = v < 0.01 ? 0 : Math.pow(v, 2.5) * 60;
    syncSpeedUI(speed);
    if (state.scaleLevel === 'GALACTIC') state.galacticSpeed = speed;
    else state.solarSpeed = speed;
  });
  syncSpeedUI(state.scaleLevel === 'GALACTIC' ? state.galacticSpeed : state.solarSpeed);
}

// ============================================================
// EVENTS
// ============================================================
function setupEvents() {
  let isDragging = false, lastX = 0, lastY = 0;

  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { isDragging = true; lastX = e.clientX; lastY = e.clientY; }
    if (state.cameraMode === 'CINEMATIC') stopCinematic();
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;

    if (state.cameraMode === 'WALK') {
      walkKeys.mouseDX += dx;
      walkKeys.mouseDY += dy;
      return;
    }
    if (state.cameraMode === 'COCKPIT') {
      cockpitKeys.mouseDX += dx;
      cockpitKeys.mouseDY += dy;
      return;
    }

    if (state.scaleLevel === 'GALACTIC') {
      galCam.tTheta -= dx * 0.004;
      galCam.tPhi = clamp(galCam.tPhi + dy * 0.004, 0.1, Math.PI - 0.1);
    } else {
      cam.tTheta -= dx * 0.006;
      cam.tPhi = clamp(cam.tPhi + dy * 0.006, 0.1, Math.PI - 0.1);
      if (state.cameraMode !== 'CINEMATIC') state.cameraMode = state.selectedBody ? 'ORBIT' : 'FREE';
    }
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Scroll zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (state.cameraMode === 'WALK') return; // No scroll action in walk mode
    if (state.cameraMode === 'COCKPIT') {
      const delta = e.deltaY > 0 ? -5 : 5;
      ship.throttlePercent = clamp(ship.throttlePercent + delta, 0, 100);
      return;
    }
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    if (state.scaleLevel === 'GALACTIC') {
      galCam.tRadius = clamp(galCam.tRadius * factor, 200, 3500000);
    } else {
      cam.tRadius = clamp(cam.tRadius * factor, 1, 2000);
      if (state.cameraMode === 'CINEMATIC') stopCinematic();
    }
  }, { passive: false });

  // Click to select
  canvas.addEventListener('click', e => {
    if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (state.scaleLevel === 'GALACTIC' && state.cameraMode !== 'COCKPIT') {
      // Galactic click
      raycaster.setFromCamera(mouse, galacticCamera);
      const hits = raycaster.intersectObjects(galacticClickables);
      if (hits.length) {
        const id = hits[0].object.userData.poiId;
        if (id) {
          galCam.focusOn(id);
          highlightPOIItem(id);
        }
      }
    } else if (state.scaleLevel === 'SOLAR') {
      // Solar click
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickables);
      if (hits.length) {
        const id = hits[0].object.userData.bodyId;
        if (id) {
          cam.focusOn(id);
          document.querySelectorAll('#body-list .body-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === id);
          });
        }
      }
    }
  });

  // Touch support
  let lastTouchDist = 0, lastTX = 0, lastTY = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { lastTX = e.touches[0].clientX; lastTY = e.touches[0].clientY; }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTX;
      const dy = e.touches[0].clientY - lastTY;
      lastTX = e.touches[0].clientX; lastTY = e.touches[0].clientY;
      if (state.scaleLevel === 'GALACTIC') {
        galCam.tTheta -= dx * 0.006;
        galCam.tPhi = clamp(galCam.tPhi + dy * 0.006, 0.1, Math.PI - 0.1);
      } else {
        cam.tTheta -= dx * 0.008;
        cam.tPhi = clamp(cam.tPhi + dy * 0.008, 0.1, Math.PI - 0.1);
      }
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = lastTouchDist / dist;
      if (state.scaleLevel === 'GALACTIC') {
        galCam.tRadius = clamp(galCam.tRadius * factor, 200, 3500000);
      } else {
        cam.tRadius = clamp(cam.tRadius * factor, 1, 2000);
      }
      lastTouchDist = dist;
    }
    e.preventDefault();
  }, { passive: false });

  // Keyboard shortcuts (using e.code for physical key position = AZERTY/QWERTY dual support)
  window.addEventListener('keydown', e => {
    const code = e.code;
    const key = e.key.toLowerCase();

    // ── Handle Settings Modal ──
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay && settingsOverlay.classList.contains('active')) {
      if (code === 'Escape') {
        settingsOverlay.classList.remove('active');
        e.preventDefault();
        return;
      }
      return; // Ignore general shortcuts while settings modal is active
    }

    // ── Block shortcuts when typing in search/input ──
    const tag = document.activeElement?.tagName;
    if ((tag === 'INPUT' || tag === 'TEXTAREA') && code !== 'Escape') return;

    // ── Walk mode controls ──
    if (state.cameraMode === 'WALK') {
      switch (code) {
        case 'KeyW': walkKeys.forward = true; e.preventDefault(); return;
        case 'KeyS': walkKeys.backward = true; e.preventDefault(); return;
        case 'KeyA': walkKeys.left = true; e.preventDefault(); return;
        case 'KeyD': walkKeys.right = true; e.preventDefault(); return;
        case 'KeyF':
          if (state.observing) {
            exitObservationMode();
          } else {
            // Interact: sit at pilot seat if near
            if (state.currentRoom === 'cockpit' && walker.position.z < 0.3 && Math.abs(walker.position.x) < 0.5) {
              enterPilotFromWalk();
            } else if (state.currentRoom === 'observatory' && walker.position.z > 0.5 && walker.position.z < 1.5 && Math.abs(walker.position.x) < 0.6) {
              enterObservationMode();
            } else {
              walkKeys.interact = true;
            }
          }
          return;
        case 'KeyV':
        case 'Escape':
          exitCockpitMode();
          return;
        case 'KeyP':
          document.getElementById('panel').classList.toggle('open');
          return;
      }
      return; // Block all other keys in walk mode
    }

    // ── Cockpit mode controls ──
    if (state.cameraMode === 'COCKPIT') {
      // Held keys (via cockpitCodeToHeld mapping)
      if (code in cockpitCodeToHeld) {
        e.preventDefault();
        cockpitKeys[cockpitCodeToHeld[code]] = true;
        return;
      }
      // Throttle (held for continuous adjust)
      if (code === 'KeyW' || code === 'KeyS') {
        e.preventDefault();
        if (code === 'KeyW') cockpitKeys.throttleUp = true;
        if (code === 'KeyS') cockpitKeys.throttleDown = true;
        return;
      }
      // Instant actions
      switch (code) {
        case 'KeyX': // Kill throttle
          ship.throttlePercent = 0;
          break;
        case 'KeyL': // Free look toggle (moved from F)
          state.cockpitCameraFree = !state.cockpitCameraFree;
          ship.freeLookYaw = 0; ship.freeLookPitch = 0;
          break;
        case 'KeyT': // Lock nearest target
          cockpitLockTarget();
          break;
        case 'Tab': // Cycle target
          e.preventDefault();
          cockpitCycleTarget();
          break;
        case 'KeyC': // Toggle auto-nav (solar + galactic)
          state.cockpitAutoNav = !state.cockpitAutoNav;
          if (state.cockpitAutoNav && !state.cockpitTarget) cockpitLockTarget();
          break;
        case 'KeyG': // Switch solar/galactic
          if (!state.warp.active) {
            if (state.scaleLevel === 'SOLAR') initiateWarpToGalaxy();
            else initiateWarpToSystem(state.currentSystem || 'sol');
          }
          break;
        case 'KeyJ': // FTL Warp to target (galactic only)
          if (state.scaleLevel === 'GALACTIC' && !state.warp.active) {
            if (state.cockpitTarget && galacticPOIObjects[state.cockpitTarget]) {
              initiateWarpToPOI(state.cockpitTarget);
            }
          }
          break;
        case 'KeyF': // STAND UP
          if (!state.warp.active) exitPilotToWalk();
          break;
        case 'KeyV': // Back to Orbit view
          if (!state.warp.active) exitCockpitMode();
          break;
        case 'Escape':
          if (!state.warp.active) exitCockpitMode();
          break;
        case 'KeyP': // Panel toggle (in cockpit)
          document.getElementById('panel').classList.toggle('open');
          break;
      }
      return;
    }

    // ── Non-cockpit shortcuts ──
    switch (key) {
      case 'p': case '²':
        document.getElementById('panel').classList.toggle('open');
        break;
      case ' ':
        e.preventDefault();
        togglePause();
        break;
      case 'g':
        if (state.warp.active) break;
        if (state.scaleLevel === 'SOLAR') initiateWarpToGalaxy();
        else initiateWarpToSystem(state.currentSystem || 'sol');
        break;
      case 'c':
        if (state.scaleLevel === 'SOLAR') startCinematic();
        break;
      case 'escape':
        if (state.warp.active) break;
        if (state.cameraMode === 'CINEMATIC') stopCinematic();
        else if (state.scaleLevel === 'GALACTIC') galCam.focusOverview();
        else cam.focusOverview();
        break;

      case 'v':
        if (state.warp.active) break;
        toggleCockpitMode();
        break;
    }
  });

  window.addEventListener('keyup', e => {
    const code = e.code;
    // Walk mode key releases
    if (code === 'KeyW') walkKeys.forward = false;
    if (code === 'KeyS') walkKeys.backward = false;
    if (code === 'KeyA') walkKeys.left = false;
    if (code === 'KeyD') walkKeys.right = false;

    // Release held cockpit keys
    if (code in cockpitCodeToHeld) {
      cockpitKeys[cockpitCodeToHeld[code]] = false;
    }
    // Release throttle held keys
    if (code === 'KeyW') cockpitKeys.throttleUp = false;
    if (code === 'KeyS') cockpitKeys.throttleDown = false;
  });

  // Resize
  window.addEventListener('resize', () => {
    const nw = window.innerWidth;
    const nh = window.innerHeight;

    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    galacticCamera.aspect = nw / nh;
    galacticCamera.updateProjectionMatrix();
    if (cockpitCamera) {
      cockpitCamera.aspect = nw / nh;
      cockpitCamera.updateProjectionMatrix();
    }
    renderer.setSize(nw, nh);

    // Redimensionner le composer et recalculer la résolution du bloom (toujours 1/4)
    composer.setSize(nw, nh);
    bloomPass.resolution.set(Math.floor(nw / 4), Math.floor(nh / 4));

    // Resize warp canvas
    warpFxCanvas.width  = nw;
    warpFxCanvas.height = nh;
  });

  // Panel toggle
  document.getElementById('toggle-panel').addEventListener('click', () => {
    document.getElementById('panel').classList.toggle('open');
  });

  // Overview
  document.getElementById('btn-overview').addEventListener('click', () => {
    if (state.scaleLevel === 'GALACTIC') galCam.focusOverview();
    else cam.focusOverview();
  });

  // Cockpit
  document.getElementById('btn-cockpit').addEventListener('click', toggleCockpitMode);

  // Settings & Shortcuts Modal
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      document.getElementById('settings-overlay').classList.add('active');
      document.getElementById('settings-main-view').style.display = 'block';
      document.getElementById('settings-shortcuts-view').style.display = 'none';
    });
  }
  const btnCloseSettings = document.getElementById('btn-close-settings');
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      document.getElementById('settings-overlay').classList.remove('active');
    });
  }
  const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
  if (btnOpenShortcuts) {
    btnOpenShortcuts.addEventListener('click', () => {
      document.getElementById('settings-main-view').style.display = 'none';
      document.getElementById('settings-shortcuts-view').style.display = 'block';
    });
  }
  const btnBackSettings = document.getElementById('btn-back-settings');
  if (btnBackSettings) {
    btnBackSettings.addEventListener('click', () => {
      document.getElementById('settings-shortcuts-view').style.display = 'none';
      document.getElementById('settings-main-view').style.display = 'block';
    });
  }
  const settingsOverlayEl = document.getElementById('settings-overlay');
  if (settingsOverlayEl) {
    settingsOverlayEl.addEventListener('click', (e) => {
      if (e.target === settingsOverlayEl) {
        settingsOverlayEl.classList.remove('active');
      }
    });
  }

  // Toggle orbits
  document.getElementById('btn-orbits').addEventListener('click', function () {
    state.showOrbits = !state.showOrbits;
    this.classList.toggle('active', state.showOrbits);
    orbitLines.forEach(l => l.visible = state.showOrbits);
  });

  // Toggle labels
  document.getElementById('btn-labels').addEventListener('click', function () {
    state.showLabels = !state.showLabels;
    this.classList.toggle('active', state.showLabels);
  });

  // Toggle asteroid belt
  document.getElementById('btn-asteroids').addEventListener('click', function () {
    state.showAsteroids = !state.showAsteroids;
    this.classList.toggle('active', state.showAsteroids);
    if (asteroidBelt) asteroidBelt.visible = state.showAsteroids;
  });

  // Pause
  document.getElementById('btn-pause').addEventListener('click', togglePause);

  // Search
  document.getElementById('search-input').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    if (state.scaleLevel === 'GALACTIC') {
      const filterBtn = document.querySelector('.poi-filter-btn.active');
      const filter = filterBtn ? filterBtn.dataset.filter : 'all';
      document.querySelectorAll('#poi-list .body-item').forEach(item => {
        const id = item.dataset.id;
        const poi = GALACTIC_POI.find(p => p.id === id) || {};
        const name = item.querySelector('.body-name').textContent.toLowerCase();
        let showType = false;
        if (filter === 'all') showType = true;
        else if (filter === 'majors') showType = (poi.tier === 1 || poi.tier === 2);
        else if (filter === 'visitable') showType = (poi.vType === 'system');
        item.style.display = (showType && name.includes(q)) ? '' : 'none';
      });
    } else {
      document.querySelectorAll('#body-list .body-item').forEach(item => {
        const name = item.querySelector('.body-name').textContent.toLowerCase();
        item.style.display = name.includes(q) ? '' : 'none';
      });
    }
  });

  // POI Filters
  document.querySelectorAll('.poi-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.poi-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Trigger search input logic to re-apply filtering
      document.getElementById('search-input').dispatchEvent(new Event('input'));
    });
  });

  // Panel tabs
  document.getElementById('tab-system').addEventListener('click', () => {
    switchPanelTab('system');
    if (state.scaleLevel === 'GALACTIC') initiateWarpToSystem(state.currentSystem || 'sol');
  });

  document.getElementById('tab-galaxy').addEventListener('click', () => {
    switchPanelTab('galaxy');
    if (state.scaleLevel === 'SOLAR') initiateWarpToGalaxy();
  });
}

function togglePause() {
  state.paused = !state.paused;
  document.getElementById('btn-pause').textContent = state.paused ? 'RESUME' : 'PAUSE';
  document.getElementById('pause-overlay').classList.toggle('visible', state.paused);
}

// ============================================================
// LOADING SEQUENCE
// ============================================================
function setLoadProgress(pct, label) {
  document.getElementById('loading-fill').style.width = pct + '%';
  document.getElementById('loading-label').textContent = label;
}

// ============================================================
// INIT
// ============================================================
async function init() {
  setLoadProgress(5, 'BUILDING STARFIELD');
  await nextFrame();

  createStarfield();
  setLoadProgress(10, 'IGNITING THE SUN');
  await nextFrame();

  setupLights();
  setLoadProgress(18, 'GENERATING SYSTEM');
  await nextFrame();

  // Pre-load base system without warping
  loadStarSystem('sol');

  setLoadProgress(65, 'BUILDING COCKPIT');
  await nextFrame();
  createCockpit();
  initRadar();

  setLoadProgress(70, 'GENERATING GALAXY SPIRAL');
  await nextFrame();
  createGalacticScene();
  createBackgroundGalaxies();

  setLoadProgress(85, 'MAPPING GALACTIC OBJECTS');
  await nextFrame();

  setLoadProgress(90, 'BUILDING INTERFACE');
  await nextFrame();

  // buildPlanetList is called by loadStarSystem, just build POI list
  buildPOIList();
  setupSpeedSlider();
  setupEvents();
  initWarpFx();

  setLoadProgress(100, 'READY');
  await nextFrame();

  // Fade out loading screen
  const loading = document.getElementById('loading');
  loading.style.opacity = '0';
  setTimeout(() => { loading.style.display = 'none'; }, 1200);

  // Start animation
  animate();

  // Galaxy intro: switch panel + gentle camera drift
  setTimeout(() => {
    switchPanelTab('galaxy');
    galCam.tDist = 95000;
    galCam.tPhi = 0.85;
    galCam.tTheta = -0.2;
  }, 100);
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

// Start
init();

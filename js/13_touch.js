/**
 * ============================================================
 * 13_TOUCH.JS — Mobile & Tablet Touch Controls Module
 * ============================================================
 * Mode Mobile & Tablette pour "Milky Way Explorer"
 * Désactivé par défaut (activable dans Paramètres -> Mode Mobile).
 * 
 * - Marche à pied : Joystick virtuel gauche + zone de visée droite.
 * - Pilotage spatial (Approche 1) : 
 *     * Zone tactile droite pour orienter le vaisseau (Pitch / Yaw).
 *     * Curseur vertical de gaz (Throttle) + Frein STOP d'urgence + Reverse.
 *     * Boutons d'actions tactiles : Cible, Pilote Auto, Laser, Scan, Horizon, Warp.
 * - Mode Spectateur : Bouton tactile pour monter à bord du vaisseau.
 * - Bouton d'interaction cliquable pour remplacer la touche [F].
 * ============================================================
 */

'use strict';

(function() {
  // Touch tracking state
  const touchState = {
    // Joystick (Walk)
    vjoy: {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
      maxRadius: 48,
    },
    // Look zone (Walk)
    walkLook: {
      active: false,
      touchId: null,
      lastX: 0,
      lastY: 0,
    },
    // Cockpit Flight steering (Approach 1: Touchpad)
    cockpitLook: {
      active: false,
      touchId: null,
      lastX: 0,
      lastY: 0,
    },
    // Throttle slider
    throttleDragging: false,
    throttleTouchId: null,
  };

  // Cache DOM elements
  let overlayEl, walkControlsEl, cockpitControlsEl, orbitControlsEl;
  let vjoyZone, vjoyBase, vjoyKnob;
  let walkLookZone, cockpitLookZone;
  let throttleTrack, throttleHandle, throttleFill, throttleVal;
  let btnSprint, btnStop, btnBoost, btnRev, btnAutonav, btnTarget, btnLevel, btnLaser, btnScan, btnWarp, btnScale;
  let btnStandup, btnExitCockpit, btnEnterCockpit;
  let lastCameraMode = null;

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function initTouchControls() {
    overlayEl = document.getElementById('mobile-controls-overlay');
    if (!overlayEl) return;

    walkControlsEl = document.getElementById('mobile-walk-controls');
    cockpitControlsEl = document.getElementById('mobile-cockpit-controls');
    orbitControlsEl = document.getElementById('mobile-orbit-controls');

    // Virtual Joystick
    vjoyZone = document.getElementById('vjoy-zone');
    vjoyBase = document.getElementById('vjoy-base');
    vjoyKnob = document.getElementById('vjoy-knob');

    // Look zones
    walkLookZone = document.getElementById('mobile-walk-look-zone');
    cockpitLookZone = document.getElementById('mobile-cockpit-look-zone');

    // Throttle elements
    throttleTrack = document.getElementById('mobile-throttle-track');
    throttleHandle = document.getElementById('mobile-throttle-handle');
    throttleFill = document.getElementById('mobile-throttle-fill');
    throttleVal = document.getElementById('mobile-throttle-val');

    // Action buttons
    btnSprint = document.getElementById('btn-mobile-sprint');
    btnStop = document.getElementById('btn-mobile-stop');
    btnBoost = document.getElementById('btn-mobile-boost');
    btnRev = document.getElementById('btn-mobile-rev');
    btnAutonav = document.getElementById('btn-mobile-autonav');
    btnTarget = document.getElementById('btn-mobile-target');
    btnLevel = document.getElementById('btn-mobile-level');
    btnLaser = document.getElementById('btn-mobile-laser');
    btnScan = document.getElementById('btn-mobile-scan');
    btnWarp = document.getElementById('btn-mobile-warp');
    btnScale = document.getElementById('btn-mobile-scale');

    btnStandup = document.getElementById('btn-mobile-standup');
    btnExitCockpit = document.getElementById('btn-mobile-exit-cockpit');
    btnEnterCockpit = document.getElementById('btn-mobile-enter-cockpit');

    // Setup event listeners
    setupVirtualJoystick();
    setupWalkLookZone();
    setupCockpitSteering();
    setupThrottleSlider();
    setupActionButtons();

    // Telescope exit button
    const btnExitTele = document.getElementById('btn-exit-telescope');
    if (btnExitTele) {
      btnExitTele.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof exitObservationMode === 'function') exitObservationMode();
      });
      btnExitTele.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof exitObservationMode === 'function') exitObservationMode();
      });
    }

    // Astrometry exit button
    const btnExitAstro = document.getElementById('btn-exit-astrometry');
    if (btnExitAstro) {
      btnExitAstro.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof exitAstrometryMode === 'function') exitAstrometryMode();
      });
    }

    // Sync initial visibility
    updateMobileControlsVisibility();
  }

  // ============================================================
  // VIRTUAL JOYSTICK (WALK MODE)
  // ============================================================
  function setupVirtualJoystick() {
    if (!vjoyZone || !vjoyKnob) return;

    function handleStart(e) {
      if (!state.mobileMode || state.cameraMode !== 'WALK') return;
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      touchState.vjoy.active = true;
      touchState.vjoy.touchId = touch.identifier !== undefined ? touch.identifier : 'mouse';

      const rect = vjoyBase.getBoundingClientRect();
      touchState.vjoy.startX = rect.left + rect.width / 2;
      touchState.vjoy.startY = rect.top + rect.height / 2;

      handleMove(e);
      e.preventDefault();
      e.stopPropagation();
    }

    function handleMove(e) {
      if (!touchState.vjoy.active) return;
      let touch = null;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchState.vjoy.touchId) {
            touch = e.changedTouches[i];
            break;
          }
        }
      } else if (touchState.vjoy.touchId === 'mouse') {
        touch = e;
      }
      if (!touch) return;

      const dx = touch.clientX - touchState.vjoy.startX;
      const dy = touch.clientY - touchState.vjoy.startY;
      const dist = Math.hypot(dx, dy);
      const maxR = touchState.vjoy.maxRadius;

      let clampedX = dx;
      let clampedY = dy;
      if (dist > maxR) {
        clampedX = (dx / dist) * maxR;
        clampedY = (dy / dist) * maxR;
      }

      vjoyKnob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

      // Normalization (-1 to 1)
      const nx = clampedX / maxR;
      const ny = clampedY / maxR;

      const DEADZONE = 0.20;
      walkKeys.forward = ny < -DEADZONE;
      walkKeys.backward = ny > DEADZONE;
      walkKeys.left = nx < -DEADZONE;
      walkKeys.right = nx > DEADZONE;

      // Auto-sprint when joystick pushed over 85% forward
      if (ny < -0.85) {
        walkKeys.sprint = true;
      }

      e.preventDefault();
      e.stopPropagation();
    }

    function handleEnd(e) {
      if (!touchState.vjoy.active) return;
      let match = false;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchState.vjoy.touchId) {
            match = true;
            break;
          }
        }
      } else if (touchState.vjoy.touchId === 'mouse') {
        match = true;
      }

      if (match) {
        touchState.vjoy.active = false;
        touchState.vjoy.touchId = null;
        vjoyKnob.style.transform = 'translate(0px, 0px)';
        walkKeys.forward = false;
        walkKeys.backward = false;
        walkKeys.left = false;
        walkKeys.right = false;
        if (!touchState.sprintHeld) {
          walkKeys.sprint = false;
        }
      }
    }

    vjoyZone.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: false });
    window.addEventListener('touchcancel', handleEnd, { passive: false });
  }

  // ============================================================
  // WALK LOOK ZONE (RIGHT SCREEN HALF)
  // ============================================================
  function setupWalkLookZone() {
    if (!walkLookZone) return;

    walkLookZone.addEventListener('touchstart', (e) => {
      if (!state.mobileMode || state.cameraMode !== 'WALK') return;
      const touch = e.changedTouches[0];
      touchState.walkLook.active = true;
      touchState.walkLook.touchId = touch.identifier;
      touchState.walkLook.lastX = touch.clientX;
      touchState.walkLook.lastY = touch.clientY;
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!touchState.walkLook.active || state.cameraMode !== 'WALK') return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchState.walkLook.touchId) {
          const dx = touch.clientX - touchState.walkLook.lastX;
          const dy = touch.clientY - touchState.walkLook.lastY;
          touchState.walkLook.lastX = touch.clientX;
          touchState.walkLook.lastY = touch.clientY;

          walkKeys.mouseDX += dx * 1.8;
          walkKeys.mouseDY += dy * 1.8;
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    function handleLookEnd(e) {
      if (!touchState.walkLook.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchState.walkLook.touchId) {
          touchState.walkLook.active = false;
          touchState.walkLook.touchId = null;
          break;
        }
      }
    }
    window.addEventListener('touchend', handleLookEnd);
    window.addEventListener('touchcancel', handleLookEnd);
  }

  // ============================================================
  // COCKPIT STEERING (APPROACH 1: HYBRID TOUCHPAD)
  // ============================================================
  function setupCockpitSteering() {
    if (!cockpitLookZone) return;

    cockpitLookZone.addEventListener('touchstart', (e) => {
      if (!state.mobileMode || state.cameraMode !== 'COCKPIT') return;
      const touch = e.changedTouches[0];
      touchState.cockpitLook.active = true;
      touchState.cockpitLook.touchId = touch.identifier;
      touchState.cockpitLook.lastX = touch.clientX;
      touchState.cockpitLook.lastY = touch.clientY;
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!touchState.cockpitLook.active || state.cameraMode !== 'COCKPIT') return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchState.cockpitLook.touchId) {
          const dx = touch.clientX - touchState.cockpitLook.lastX;
          const dy = touch.clientY - touchState.cockpitLook.lastY;
          touchState.cockpitLook.lastX = touch.clientX;
          touchState.cockpitLook.lastY = touch.clientY;

          // Sensitivity tuning: smoothly steers the ship via cockpitKeys mouseDX/mouseDY
          cockpitKeys.mouseDX += dx * 0.75;
          cockpitKeys.mouseDY += dy * 0.75;
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    function handleSteerEnd(e) {
      if (!touchState.cockpitLook.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchState.cockpitLook.touchId) {
          touchState.cockpitLook.active = false;
          touchState.cockpitLook.touchId = null;
          break;
        }
      }
    }
    window.addEventListener('touchend', handleSteerEnd);
    window.addEventListener('touchcancel', handleSteerEnd);
  }

  // ============================================================
  // THROTTLE SLIDER (COCKPIT)
  // ============================================================
  function setupThrottleSlider() {
    if (!throttleTrack) return;

    function applyThrottleFromY(clientY) {
      const rect = throttleTrack.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const pct = Math.round(clamp(1 - (relativeY / rect.height), 0, 1) * 100);

      ship.throttlePercent = pct;
      if (pct > 0) {
        ship.emergencyBraking = false;
        ship.reverseEngaged = false;
        ship.reversePercent = 0;
      }
      updateThrottleVisuals(pct);
    }

    function onThrottleStart(e) {
      if (!state.mobileMode || state.cameraMode !== 'COCKPIT') return;
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      touchState.throttleDragging = true;
      touchState.throttleTouchId = touch.identifier !== undefined ? touch.identifier : 'mouse';
      applyThrottleFromY(touch.clientY);
      e.preventDefault();
      e.stopPropagation();
    }

    function onThrottleMove(e) {
      if (!touchState.throttleDragging) return;
      let touch = null;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchState.throttleTouchId) {
            touch = e.changedTouches[i];
            break;
          }
        }
      } else if (touchState.throttleTouchId === 'mouse') {
        touch = e;
      }
      if (touch) {
        applyThrottleFromY(touch.clientY);
        e.preventDefault();
      }
    }

    function onThrottleEnd(e) {
      if (!touchState.throttleDragging) return;
      let match = false;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchState.throttleTouchId) {
            match = true;
            break;
          }
        }
      } else if (touchState.throttleTouchId === 'mouse') {
        match = true;
      }
      if (match) {
        touchState.throttleDragging = false;
        touchState.throttleTouchId = null;
      }
    }

    throttleTrack.addEventListener('touchstart', onThrottleStart, { passive: false });
    window.addEventListener('touchmove', onThrottleMove, { passive: false });
    window.addEventListener('touchend', onThrottleEnd);
    window.addEventListener('touchcancel', onThrottleEnd);
  }

  function updateThrottleVisuals(pct) {
    if (!throttleHandle || !throttleFill || !throttleVal) return;
    const clampedPct = clamp(pct, 0, 100);
    throttleHandle.style.bottom = clampedPct + '%';
    throttleFill.style.height = clampedPct + '%';
    throttleVal.textContent = Math.round(clampedPct) + '%';
  }

  // ============================================================
  // ACTION BUTTONS BINDINGS
  // ============================================================
  function setupActionButtons() {
    // Sprint button (Walk)
    if (btnSprint) {
      const startSprint = (e) => {
        e.preventDefault();
        touchState.sprintHeld = true;
        walkKeys.sprint = true;
        btnSprint.classList.add('active');
      };
      const endSprint = (e) => {
        touchState.sprintHeld = false;
        walkKeys.sprint = false;
        btnSprint.classList.remove('active');
      };
      btnSprint.addEventListener('touchstart', startSprint, { passive: false });
      btnSprint.addEventListener('touchend', endSprint);
      btnSprint.addEventListener('touchcancel', endSprint);
      btnSprint.addEventListener('mousedown', startSprint);
      window.addEventListener('mouseup', endSprint);
    }

    // Emergency Stop button (Cockpit)
    if (btnStop) {
      const triggerStop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        ship.throttlePercent = 0;
        ship.reverseEngaged = false;
        ship.reversePercent = 0;
        ship.emergencyBraking = true;
        updateThrottleVisuals(0);
        if (typeof showNotification === 'function') {
          showNotification("🛑 FREIN D'URGENCE ACTIVÉ", 1200);
        }
      };
      btnStop.addEventListener('click', triggerStop);
      btnStop.addEventListener('touchend', triggerStop);
    }

    // Boost button (Cockpit - Hold to boost)
    if (btnBoost) {
      const startBoost = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cockpitKeys.boost = true;
        btnBoost.classList.add('active');
      };
      const endBoost = (e) => {
        cockpitKeys.boost = false;
        btnBoost.classList.remove('active');
      };
      btnBoost.addEventListener('touchstart', startBoost, { passive: false });
      btnBoost.addEventListener('touchend', endBoost);
      btnBoost.addEventListener('touchcancel', endBoost);
      btnBoost.addEventListener('mousedown', startBoost);
      window.addEventListener('mouseup', endBoost);
    }

    // Reverse toggle button (Cockpit)
    if (btnRev) {
      const toggleReverse = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ship.reverseEngaged) {
          ship.reverseEngaged = false;
          ship.reversePercent = 0;
          btnRev.classList.remove('active');
          if (typeof showNotification === 'function') showNotification('◀ MARCHE ARRIÈRE COUPÉE', 1000);
        } else {
          ship.throttlePercent = 0;
          ship.emergencyBraking = false;
          ship.reverseEngaged = true;
          ship.reversePercent = 60;
          updateThrottleVisuals(0);
          btnRev.classList.add('active');
          if (typeof showNotification === 'function') showNotification('◀ MARCHE ARRIÈRE ENGAGÉE (60%)', 1200);
        }
      };
      btnRev.addEventListener('click', toggleReverse);
      btnRev.addEventListener('touchend', toggleReverse);
    }

    // Auto-Navigation toggle (Cockpit)
    if (btnAutonav) {
      const toggleAutoNav = (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.cockpitAutoNav = !state.cockpitAutoNav;
        if (state.cockpitAutoNav && !state.cockpitTarget && typeof cockpitLockTarget === 'function') {
          cockpitLockTarget();
        }
        btnAutonav.classList.toggle('active', !!state.cockpitAutoNav);
        if (typeof showNotification === 'function') {
          showNotification(state.cockpitAutoNav ? '🧭 PILOTE AUTOMATIQUE : ACTIVÉ' : '🧭 PILOTE AUTOMATIQUE : DÉSACTIVÉ', 1500);
        }
      };
      btnAutonav.addEventListener('click', toggleAutoNav);
      btnAutonav.addEventListener('touchend', toggleAutoNav);
    }

    // Target lock & cycle (Cockpit)
    if (btnTarget) {
      const cycleTarget = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof cockpitCycleTarget === 'function') {
          cockpitCycleTarget();
        }
      };
      btnTarget.addEventListener('click', cycleTarget);
      btnTarget.addEventListener('touchend', cycleTarget);
    }

    // Horizon Auto-Level (Cockpit)
    if (btnLevel) {
      const levelHorizon = (e) => {
        e.preventDefault();
        e.stopPropagation();
        ship.isAutoLeveling = true;
        ship.rollRate = 0;
        if (typeof showNotification === 'function') {
          showNotification('🧭 HORIZON RÉALIGNÉ', 1200);
        }
      };
      btnLevel.addEventListener('click', levelHorizon);
      btnLevel.addEventListener('touchend', levelHorizon);
    }

    // Laser Mining (Cockpit - Hold to fire)
    if (btnLaser) {
      const startLaser = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cockpitKeys.fireLaser = true;
        btnLaser.classList.add('active');
      };
      const endLaser = (e) => {
        cockpitKeys.fireLaser = false;
        btnLaser.classList.remove('active');
      };
      btnLaser.addEventListener('touchstart', startLaser, { passive: false });
      btnLaser.addEventListener('touchend', endLaser);
      btnLaser.addEventListener('touchcancel', endLaser);
      btnLaser.addEventListener('mousedown', startLaser);
      window.addEventListener('mouseup', endLaser);
    }

    // Radar Scanner (Cockpit - Hold to scan)
    if (btnScan) {
      const startScan = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cockpitKeys.scanHeld = true;
        btnScan.classList.add('active');
      };
      const endScan = (e) => {
        cockpitKeys.scanHeld = false;
        btnScan.classList.remove('active');
      };
      btnScan.addEventListener('touchstart', startScan, { passive: false });
      btnScan.addEventListener('touchend', endScan);
      btnScan.addEventListener('touchcancel', endScan);
      btnScan.addEventListener('mousedown', startScan);
      window.addEventListener('mouseup', endScan);
    }

    // FTL Warp to POI (Cockpit - Galactic only)
    if (btnWarp) {
      const triggerWarp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.scaleLevel === 'GALACTIC' && !state.warp.active && state.cockpitTarget) {
          if (typeof initiateWarpToPOI === 'function') {
            initiateWarpToPOI(state.cockpitTarget);
          }
        }
      };
      btnWarp.addEventListener('click', triggerWarp);
      btnWarp.addEventListener('touchend', triggerWarp);
    }

    // Scale switch Solar <-> Galactic (Cockpit)
    if (btnScale) {
      const toggleScale = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.warp.active) return;
        if (state.scaleLevel === 'SOLAR') {
          if (typeof initiateWarpToGalaxy === 'function') initiateWarpToGalaxy();
        } else {
          if (typeof initiateWarpToSystem === 'function') initiateWarpToSystem(state.currentSystem || 'sol');
        }
      };
      btnScale.addEventListener('click', toggleScale);
      btnScale.addEventListener('touchend', toggleScale);
    }

    // Stand up from pilot seat to walk (Cockpit -> Walk)
    if (btnStandup) {
      const standUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.warp.active && typeof exitPilotToWalk === 'function') {
          exitPilotToWalk();
        }
      };
      btnStandup.addEventListener('click', standUp);
      btnStandup.addEventListener('touchend', standUp);
    }

    // Exit Cockpit to Spectator Orbit view (Cockpit -> Orbit)
    if (btnExitCockpit) {
      const exitToOrbit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.warp.active && typeof exitCockpitMode === 'function') {
          exitCockpitMode();
        }
      };
      btnExitCockpit.addEventListener('click', exitToOrbit);
      btnExitCockpit.addEventListener('touchend', exitToOrbit);
    }

    // Enter Cockpit from Spectator Orbit view (Orbit -> Cockpit)
    if (btnEnterCockpit) {
      const enterCockpit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.warp.active && typeof toggleCockpitMode === 'function') {
          toggleCockpitMode();
        }
      };
      btnEnterCockpit.addEventListener('click', enterCockpit);
      btnEnterCockpit.addEventListener('touchend', enterCockpit);
    }
  }

  // ============================================================
  // VISIBILITY & MODE SYNC
  // ============================================================
  function updateMobileControlsVisibility() {
    if (!overlayEl) return;

    if (!state.mobileMode) {
      overlayEl.style.display = 'none';
      return;
    }

    overlayEl.style.display = 'block';

    const camMode = state.cameraMode;

    if (camMode === 'WALK') {
      if (walkControlsEl) walkControlsEl.style.display = 'block';
      if (cockpitControlsEl) cockpitControlsEl.style.display = 'none';
      if (orbitControlsEl) orbitControlsEl.style.display = 'none';
    } else if (camMode === 'COCKPIT') {
      if (walkControlsEl) walkControlsEl.style.display = 'none';
      if (cockpitControlsEl) cockpitControlsEl.style.display = 'block';
      if (orbitControlsEl) orbitControlsEl.style.display = 'none';
    } else if (camMode === 'FREE' || camMode === 'ORBIT') {
      if (walkControlsEl) walkControlsEl.style.display = 'none';
      if (cockpitControlsEl) cockpitControlsEl.style.display = 'none';
      if (orbitControlsEl) orbitControlsEl.style.display = 'block';
    } else {
      // ASTROMETRY or CINEMATIC
      if (walkControlsEl) walkControlsEl.style.display = 'none';
      if (cockpitControlsEl) cockpitControlsEl.style.display = 'none';
      if (orbitControlsEl) orbitControlsEl.style.display = 'none';
    }

    lastCameraMode = camMode;
  }

  // ============================================================
  // FRAME UPDATE LOOP (CALLED IN ANIMATE())
  // ============================================================
  window.updateTouchControls = function(dt) {
    if (!state.mobileMode) return;

    // Check if cameraMode changed to update UI display
    if (state.cameraMode !== lastCameraMode) {
      updateMobileControlsVisibility();
    }

    if (state.cameraMode === 'COCKPIT') {
      // Sync throttle slider visual if not dragging
      if (!touchState.throttleDragging && throttleHandle && throttleFill && throttleVal) {
        updateThrottleVisuals(ship.throttlePercent);
      }

      // Sync autonav button glow
      if (btnAutonav) {
        btnAutonav.classList.toggle('active', !!state.cockpitAutoNav);
      }

      // Sync reverse button glow
      if (btnRev) {
        btnRev.classList.toggle('active', !!ship.reverseEngaged);
      }

      // Show/hide FTL Warp button if a galactic POI is targeted
      if (btnWarp) {
        const canWarp = state.scaleLevel === 'GALACTIC' && !state.warp.active && !!state.cockpitTarget && typeof galacticPOIObjects !== 'undefined' && !!galacticPOIObjects[state.cockpitTarget];
        btnWarp.style.display = canWarp ? 'flex' : 'none';
      }
    }
  };

  // Expose global functions
  window.updateMobileControlsVisibility = updateMobileControlsVisibility;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTouchControls);
  } else {
    initTouchControls();
  }
})();

'use strict';

// ============================================================
// SHIP INTERIOR, COCKPIT, WALK MODE & FLIGHT SYSTEMS
// ============================================================

function buildShipCollision() {
  shipWallsLevel0.length = 0;
  shipWallsLevel1.length = 0;
  shipWallsLevelMinus1.length = 0;

  function addWall(level, cx, cz, hw, hd) {
    level.push({
      minX: cx - hw, maxX: cx + hw,
      minZ: cz - hd, maxZ: cz + hd
    });
  }

  // LEVEL 0 (Main Deck)
  // Cockpit
  addWall(shipWallsLevel0, -1.5, -0.2, 0.05, 0.9); // Left
  addWall(shipWallsLevel0, 1.5, -0.2, 0.05, 0.9);  // Right
  addWall(shipWallsLevel0, 0, -1.1, 1.5, 0.1);       // Front window
  addWall(shipWallsLevel0, -0.9, 0.65, 0.55, 0.05);   // Rear left
  addWall(shipWallsLevel0, 0.9, 0.65, 0.55, 0.05);    // Rear right
  addWall(shipWallsLevel0, 0, -0.5, 1.2, 0.2);       // Console

  // Corridor X from -0.5 to 0.5
  addWall(shipWallsLevel0, -0.55, 0.8, 0.05, 0.2);   // Left wall before Engine (Z: 0.6 to 1.0)
  addWall(shipWallsLevel0, -0.55, 2.95, 0.05, 0.35); // Left wall after Engine (Z: 2.6 to 3.3)
  addWall(shipWallsLevel0, 0.55, 0.85, 0.05, 0.15); // Right before Map
  addWall(shipWallsLevel0, 0.55, 2.95, 0.05, 0.35); // Right after Map

  addWall(shipWallsLevel0, -0.55, 3.7, 0.05, 0.5); // Elevator L shaft
  addWall(shipWallsLevel0, 0.55, 3.7, 0.05, 0.5);  // Elevator R shaft
  addWall(shipWallsLevel0, 0, 4.15, 0.5, 0.05);    // Elevator Back wall

  // Engineering Room (Left Side)
  addWall(shipWallsLevel0, -2.25, 1.0, 1.75, 0.05); // Front wall
  addWall(shipWallsLevel0, -2.25, 4.0, 1.75, 0.05); // Rear wall
  addWall(shipWallsLevel0, -4.0, 2.5, 0.05, 1.5);   // Far left wall
  addWall(shipWallsLevel0, -0.55, 3.3, 0.05, 0.7);  // Right wall (after doorway Z: 2.6 to 4.0)
  addWall(shipWallsLevel0, -2.45, 2.5, 0.6, 0.6);   // Warp Core Center Base

  // Galaxy Map Room
  addWall(shipWallsLevel0, 2.45, 1.8, 0.05, 0.8);    // Right wall
  addWall(shipWallsLevel0, 1.5, 0.95, 0.9, 0.05);  // Front wall
  addWall(shipWallsLevel0, 1.5, 2.65, 0.9, 0.05);  // Rear wall

  // LEVEL 1 (Observatory)
  // Elevator shaft at upper level
  addWall(shipWallsLevel1, -0.55, 3.7, 0.05, 0.5); // L shaft
  addWall(shipWallsLevel1, 0.55, 3.7, 0.05, 0.5);  // R shaft
  addWall(shipWallsLevel1, 0, 4.15, 0.5, 0.05);    // Back shaft

  // Level -1: Living Quarters
  addWall(shipWallsLevelMinus1, 0, 0.5, 1.5, 0.05);     // Front wall
  addWall(shipWallsLevelMinus1, -1.5, 1.8, 0.05, 1.3);  // Left wall
  addWall(shipWallsLevelMinus1, 1.5, 1.8, 0.05, 1.3);   // Right wall
  addWall(shipWallsLevelMinus1, -1.0, 3.1, 0.5, 0.05);  // Rear left wall
  addWall(shipWallsLevelMinus1, 1.0, 3.1, 0.5, 0.05);   // Rear right wall
  addWall(shipWallsLevelMinus1, -0.55, 3.7, 0.05, 0.5); // Elevator L shaft
  addWall(shipWallsLevelMinus1, 0.55, 3.7, 0.05, 0.5);  // Elevator R shaft
  addWall(shipWallsLevelMinus1, 0, 4.15, 0.5, 0.05);    // Elevator Back wall
}

// Simple AABB collision check
function checkShipCollision(pos, radius) {
  let x = pos.x, z = pos.z;
  const activeWalls = walker.floor === 1 ? shipWallsLevel1 : (walker.floor === -1 ? shipWallsLevelMinus1 : shipWallsLevel0);

  for (const wall of activeWalls) {
    const wMinX = wall.minX - radius;
    const wMaxX = wall.maxX + radius;
    const wMinZ = wall.minZ - radius;
    const wMaxZ = wall.maxZ + radius;

    if (x > wMinX && x < wMaxX && z > wMinZ && z < wMaxZ) {
      const escapes = [
        { axis: 'x', val: wMinX, dist: Math.abs(x - wMinX) },
        { axis: 'x', val: wMaxX, dist: Math.abs(x - wMaxX) },
        { axis: 'z', val: wMinZ, dist: Math.abs(z - wMinZ) },
        { axis: 'z', val: wMaxZ, dist: Math.abs(z - wMaxZ) },
      ];
      escapes.sort((a, b) => a.dist - b.dist);
      const best = escapes[0];
      if (best.axis === 'x') x = best.val;
      else z = best.val;
    }
  }

  // Circular observatory bound at Level 1 (Radius ~1.95)
  if (walker.floor === 1) {
    const dx = x - 0, dz = z - 1.8;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const inElevator = (x > -0.55 && x < 0.55 && z > 3.1);
    if (dist > 1.85 && !inElevator) {
      const angle = Math.atan2(dz, dx);
      x = Math.cos(angle) * 1.85;
      z = 1.8 + Math.sin(angle) * 1.85;
    }
  }

  return { x, z };
}

// Detect which room the walker is in
function detectCurrentRoom(x, z) {
  if (z > 3.1 && x > -0.5 && x < 0.5) return 'elevator';
  if (walker.floor === 1) return 'observatory';
  if (walker.floor === -1) return 'quarters';
  if (z < 0.6) return 'cockpit';
  if (x > 0.5 && z > 0.95 && z < 2.65) return 'galaxymap';
  if (x < -0.5 && z > 1.0 && z < 4.0) return 'engineering';
  return 'corridor';
}

// Audio system
var audioCtx = null;
var engineOsc = null;
var engineGain = null;
var boostOsc = null;
var boostGain = null;
var audioInited = false;

function initAudio() {
  if (audioInited) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const engineFilter = audioCtx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 180;
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 40;
    engineGain.gain.value = 0;
    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
    const boostFilter = audioCtx.createBiquadFilter();
    boostFilter.type = 'bandpass';
    boostFilter.frequency.value = 350;
    boostFilter.Q.value = 2;
    boostOsc = audioCtx.createOscillator();
    boostGain = audioCtx.createGain();
    boostOsc.type = 'sawtooth';
    boostOsc.frequency.value = 150;
    boostGain.gain.value = 0;
    boostOsc.connect(boostFilter);
    boostFilter.connect(boostGain);
    boostGain.connect(audioCtx.destination);
    boostOsc.start();
    audioInited = true;
  } catch (e) { console.warn('Audio unavailable:', e); }
}

function updateAudio() {
  if (!audioCtx || !engineGain) return;
  if (state.cameraMode !== 'COCKPIT' && state.cameraMode !== 'WALK') {
    engineGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    boostGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    return;
  }
  const thr = ship.throttlePercent / 100;
  const tF = 35 + thr * 55;
  const tG = thr * 0.022;
  engineOsc.frequency.linearRampToValueAtTime(tF, audioCtx.currentTime + 0.06);
  engineGain.gain.linearRampToValueAtTime(tG, audioCtx.currentTime + 0.06);
  if (ship.boostActive) {
    boostOsc.frequency.linearRampToValueAtTime(140 + thr * 80, audioCtx.currentTime + 0.06);
    boostGain.gain.linearRampToValueAtTime(0.028, audioCtx.currentTime + 0.06);
  } else {
    boostGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
  }
}

// Radar state
var radarCtx = null;
var radarAngle = 0;

var elevatorPad = null;

function initRadar() {
  const c = document.getElementById('ckp-radar');
  if (c) radarCtx = c.getContext('2d');
}

function createShipInterior() {
  shipInterior = new THREE.Group();
  cockpitGroup.add(shipInterior);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.5, metalness: 0.2 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f141a, roughness: 0.6, metalness: 0.1 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x151a22, roughness: 0.5, metalness: 0.1 });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: new THREE.Color(0x3060a0), emissiveIntensity: 0.8, roughness: 0.3
  });
  const frame = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.3, metalness: 0.85 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.4, metalness: 0.7 });
  const dataScreenMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x11bbff, emissiveIntensity: 0.8, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const dataServerMat = new THREE.MeshStandardMaterial({ color: 0x080c14, roughness: 0.2, metalness: 0.7 });
  const domeFrameMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0x1a2533, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.9
  });
  const hublotGlassMat = new THREE.MeshStandardMaterial({
    color: 0xaabbff, transparent: true, opacity: 0.12, roughness: 0.01, metalness: 1.0, side: THREE.DoubleSide, depthWrite: false
  });
  const doorLabelMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: new THREE.Color(0x40a0ff), emissiveIntensity: 1.2, roughness: 0.3
  });

  function bx(w, h, d, mat, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    shipInterior.add(m);
    return m;
  }

  // COCKPIT ARCHITECTURE
  bx(2.9, 0.1, 1.8, floorMat, 0, -0.73, -0.2); // floor
  bx(2.9, 0.1, 1.8, ceilMat, 0, 1.25, -0.2); // ceil
  bx(0.1, 1.88, 1.8, wallMat, -1.5, 0.26, -0.2); // left wall
  bx(0.1, 1.88, 1.8, wallMat, 1.5, 0.26, -0.2); // right wall
  bx(1.1, 1.88, 0.1, wallMat, -0.9, 0.26, 0.65); // back left
  bx(1.1, 1.88, 0.1, wallMat, 0.9, 0.26, 0.65); // back right
  bx(0.7, 0.53, 0.1, wallMat, 0, 0.935, 0.65); // back top

  // COCKPIT DECORATION & PROPS
  bx(2.9, 0.5, 0.15, panel, 0, -0.4, -1.05); // main lower console

  const cockpitLight = new THREE.PointLight(0x5090ff, 0.8, 4);
  cockpitLight.position.set(0, 0.8, -0.4);
  shipInterior.add(cockpitLight);

  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x111620, roughness: 0.8 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x113355, emissiveIntensity: 1.0 });
  const alertMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff3311, emissiveIntensity: 1.5 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x11ff33, emissiveIntensity: 1.2 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff8811, emissiveIntensity: 1.2 });

  // Captain's Seat
  bx(0.4, 0.1, 0.4, panel, 0, -0.68, -0.5); // base
  bx(0.1, 0.2, 0.1, trimMat, 0, -0.55, -0.5); // stem
  bx(0.45, 0.1, 0.45, cushionMat, 0, -0.45, -0.5); // seat cushion
  bx(0.45, 0.6, 0.1, cushionMat, 0, -0.15, -0.25, -0.1, 0, 0); // backrest
  bx(0.08, 0.05, 0.4, panel, -0.26, -0.3, -0.45); // left armrest
  bx(0.08, 0.05, 0.4, panel, 0.26, -0.3, -0.45); // right armrest

  // Co-pilot Seats
  bx(0.35, 0.1, 0.35, cushionMat, -0.85, -0.5, -0.45); // Left seat
  bx(0.35, 0.5, 0.1, cushionMat, -0.85, -0.25, -0.25, -0.1, 0.2, 0);
  bx(0.35, 0.1, 0.35, cushionMat, 0.85, -0.5, -0.45); // Right seat
  bx(0.35, 0.5, 0.1, cushionMat, 0.85, -0.25, -0.25, -0.1, -0.2, 0);

  // Angled Dashboards
  bx(2.8, 0.05, 0.35, panel, 0, -0.16, -0.88, 0.2, 0, 0); // Main tilted dash
  bx(2.0, 0.05, 0.5, trimMat, 0, 1.2, -0.5); // Ceiling trim array

  // Holographic / Glass Screens
  bx(0.5, 0.25, 0.02, screenMat, -0.8, 0.05, -0.9, 0.1, 0.25, 0); // Left Aux display
  bx(0.5, 0.25, 0.02, screenMat, 0.8, 0.05, -0.9, 0.1, -0.25, 0); // Right Aux display

  // Dash tools & buttons
  for (let i = 0; i < 6; i++) {
    bx(0.03, 0.02, 0.03, alertMat, -0.4 + i * 0.05, -0.14, -0.82, 0.2, 0, 0);
  }
  for (let i = 0; i < 8; i++) {
    bx(0.04, 0.01, 0.02, greenMat, 0.2 + i * 0.06, -0.13, -0.85, 0.2, 0, 0);
  }
  for (let i = 0; i < 3; i++) {
    bx(0.05, 0.02, 0.03, orangeMat, -0.9 + i * 0.08, -0.15, -0.75, 0.2, 0, 0);
  }

  // Flight Yoke (Joystick)
  bx(0.04, 0.25, 0.04, wallMat, 0, -0.3, -0.7, -0.2, 0, 0);
  bx(0.2, 0.04, 0.04, panel, 0, -0.18, -0.73, -0.2, 0, 0); // Handle

  // Circular Radar Screen on Dash
  const radarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.05, 16), panel);
  radarBase.position.set(0.6, -0.14, -0.75);
  radarBase.rotation.x = 0.2;
  shipInterior.add(radarBase);
  const radarScreen = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0, emissive: 0x00ff88, emissiveIntensity: 0.8 }));
  radarScreen.position.set(0.6, -0.14, -0.75);
  radarScreen.rotation.x = 0.2;
  shipInterior.add(radarScreen);

  // Structural Support Pillars
  bx(0.15, 1.88, 0.15, trimMat, -1.35, 0.26, -0.5);
  bx(0.15, 1.88, 0.15, trimMat, 1.35, 0.26, -0.5);

  // CORRIDOR 
  // Floor & ceil extended to Z=3.65 (length 3.05, center 2.125) to act as elevator entrance base and fix the floor holes!
  bx(1.0, 0.1, 3.05, floorMat, 0, -0.73, 2.125); // Floor 
  bx(1.0, 0.1, 3.05, ceilMat, 0, 1.25, 2.125);   // Ceil 

  // Left Wall (Split for Engineering Room Doorway Z=1.0 to 2.6)
  bx(0.1, 1.88, 0.4, wallMat, -0.55, 0.26, 0.8);   // Left wall before Engine
  bx(0.1, 1.88, 0.5, wallMat, -0.55, 0.26, 2.85);  // Left wall after Engine
  bx(0.1, 0.53, 1.6, wallMat, -0.55, 0.935, 1.8);  // Left wall above Engine door

  bx(0.1, 1.88, 0.4, wallMat, 0.55, 0.26, 0.8);  // Right wall before Map
  bx(0.1, 1.88, 0.45, wallMat, 0.55, 0.26, 2.875);  // Right wall after Map (ends at 3.1)
  bx(0.1, 0.53, 1.6, wallMat, 0.55, 0.935, 1.8);    // Right wall above Map door

  // CORNER FILLERS for round elevator connection
  bx(0.25, 0.1, 0.55, floorMat, -0.425, -0.73, 3.375); // Floor left corner
  bx(0.25, 0.1, 0.55, floorMat, 0.425, -0.73, 3.375);  // Floor right corner
  bx(0.25, 0.1, 0.55, ceilMat, -0.425, 1.25, 3.375);   // Ceil left corner
  bx(0.25, 0.1, 0.55, ceilMat, 0.425, 1.25, 3.375);    // Ceil right corner

  // ==========================================
  // ENGINEERING ROOM (Left Side)
  // ==========================================
  const engFloorMat = new THREE.MeshStandardMaterial({ color: 0x050a12, roughness: 0.8, metalness: 0.5 });
  const engCeilMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });

  bx(3.5, 0.1, 3.0, engFloorMat, -2.25, -0.73, 2.5); // Floor
  bx(3.5, 0.1, 3.0, engCeilMat, -2.25, 1.25, 2.5); // Ceil
  // Far left wall (split to create holes for hublots at Z=1.9 and Z=3.1)
  bx(0.1, 1.88, 0.78, wallMat, -4.0, 0.26, 1.39); // Before hole 1
  bx(0.1, 0.83, 0.24, wallMat, -4.0, 0.785, 1.9);   // Top of hole 1
  bx(0.1, 0.81, 0.24, wallMat, -4.0, -0.275, 1.9);  // Bottom of hole 1
  bx(0.1, 1.88, 0.96, wallMat, -4.0, 0.26, 2.5);    // Between holes
  bx(0.1, 0.83, 0.24, wallMat, -4.0, 0.785, 3.1);   // Top of hole 2
  bx(0.1, 0.81, 0.24, wallMat, -4.0, -0.275, 3.1);  // Bottom of hole 2
  bx(0.1, 1.88, 0.78, wallMat, -4.0, 0.26, 3.61); // After hole 2
  bx(3.5, 1.88, 0.1, wallMat, -2.25, 0.26, 1.0); // Front wall
  bx(3.5, 1.88, 0.1, wallMat, -2.25, 0.26, 4.0); // Rear wall
  bx(0.1, 1.88, 1.4, wallMat, -0.55, 0.26, 3.3); // Right wall (blocking gap after doorway)

  // Warp Core Sphere
  const warpCoreGeo = new THREE.SphereGeometry(0.7, 32, 32);
  const warpCoreMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: 0x2266ff, emissiveIntensity: 2.5, wireframe: true, transparent: true, opacity: 0.9
  });
  const warpCore = new THREE.Mesh(warpCoreGeo, warpCoreMat);
  warpCore.position.set(-2.45, 0.26, 2.5);
  shipInterior.add(warpCore);
  shipInterior.userData.warpCore = warpCore;

  // Core housing rings
  bx(1.5, 0.1, 1.5, trimMat, -2.45, -0.65, 2.5); // Base
  bx(1.5, 0.1, 1.5, trimMat, -2.45, 1.15, 2.5);  // Top

  // Engine Room Ambient Light
  const engineLight = new THREE.PointLight(0x2266ff, 1.5, 6);
  engineLight.position.set(-2.45, 0.26, 2.5);
  shipInterior.add(engineLight);
  shipInterior.userData.engineLight = engineLight;

  // Industrial wall pipes
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.8 });
  for (let i = 0; i < 4; i++) {
    bx(0.05, 1.88, 0.05, pipeMat, -3.9, 0.26, 1.6 + i * 0.6); // vertical pipes far wall
    bx(3.4, 0.05, 0.05, pipeMat, -2.3, 1.0, 1.1 + i * 0.8); // horizontal pipes ceiling
  }

  // Engineering Consoles
  bx(0.4, 0.8, 0.6, dataServerMat, -1.2, -0.3, 3.5);
  bx(0.3, 0.4, 0.02, dataScreenMat, -1.2, 0.2, 3.5, 0.3, -0.2, 0); // tilted screen

  // ELEVATOR SHAFT 
  const shaftWallMat = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide });
  // Tall side walls taking over the corridor from Z=3.1 directly into the upper deck 1 and lower deck -1
  bx(0.1, 8.33, 0.55, shaftWallMat, -0.55, 0.265, 3.375); // Left tall wall
  bx(0.1, 8.33, 0.55, shaftWallMat, 0.55, 0.265, 3.375);  // Right tall wall
  // Flat top ceiling cap for the rectangular front part of the elevator shaft
  bx(1.2, 0.1, 0.55, ceilMat, 0, 4.48, 3.375);

  elevatorPad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 32), trimMat);
  elevatorPad.position.set(0, -0.68, 3.65);
  shipInterior.add(elevatorPad);

  const elvLight = new THREE.PointLight(0x3060a0, 0.8, 2);
  elvLight.position.set(0, 0.2, 0);
  elevatorPad.add(elvLight);

  // Semicircles forming the rounded back-half of the elevator shaft floor and ceiling
  // Deck 0 base seal
  const seal0 = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), floorMat);
  seal0.rotation.x = -Math.PI / 2;
  seal0.position.set(0, -0.732, 3.65);
  shipInterior.add(seal0);

  // Deck 1 base seal 
  const seal1 = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), floorMat);
  seal1.rotation.x = -Math.PI / 2;
  seal1.position.set(0, 2.398, 3.65);
  shipInterior.add(seal1);

  // Deck -1 base seal
  const sealMinus1 = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), floorMat);
  sealMinus1.rotation.x = -Math.PI / 2;
  sealMinus1.position.set(0, -3.862, 3.65);
  shipInterior.add(sealMinus1);

  // Elevator front floor Deck -1 (Moved to Living Quarters section to avoid ReferenceError)

  // Top ceiling back-half semicircle correctly rotated to face down!
  const shaftCeil = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32, 0, Math.PI), ceilMat);
  shaftCeil.rotation.x = Math.PI / 2;
  shaftCeil.position.set(0, 4.43, 3.65);
  shipInterior.add(shaftCeil);

  const shaftWall = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 8.33, 32, 1, true, -Math.PI / 2, Math.PI), shaftWallMat);
  shaftWall.position.set(0, 0.265, 3.65);
  shipInterior.add(shaftWall);

  // Front wall between levels cleanly sealed under the dome floor (from Y: 0.25 to height 1.1)
  bx(1.1, 1.1, 0.05, wallMat, 0, 1.8, 3.1);

  // GALAXY MAP ROOM ARCHITECTURE & DECOR
  bx(1.9, 0.1, 1.7, floorMat, 1.45, -0.73, 1.8); // Floor, extended to seal map room doorway gap
  bx(1.9, 0.1, 1.7, ceilMat, 1.45, 1.25, 1.8); // Ceil, extended
  bx(0.1, 1.88, 1.7, wallMat, 2.45, 0.26, 1.8); // Right wall
  bx(1.9, 1.88, 0.1, wallMat, 1.45, 0.26, 0.95); // Front wall
  bx(1.9, 1.88, 0.1, wallMat, 1.45, 0.26, 2.65); // Rear wall

  // LIVING QUARTERS (DECK -1) ARCHITECTURE & DECOR
  const qFloorMat = new THREE.MeshStandardMaterial({ color: 0x1f1710, roughness: 0.8 }); // warm brown
  const qWallMat = new THREE.MeshStandardMaterial({ color: 0x221a15, roughness: 0.7, metalness: 0.1 });
  const qCeilMat = new THREE.MeshStandardMaterial({ color: 0x1a1310, roughness: 0.9 });

  // Floor and Ceiling
  bx(3.0, 0.1, 2.6, qFloorMat, 0, -3.86, 1.8);
  bx(3.0, 0.1, 2.6, qCeilMat, 0, -1.88, 1.8);
  bx(1.1, 0.1, 0.55, qFloorMat, 0, -3.86, 3.375); // Elevator front floor Deck -1

  // Front wall
  bx(3.0, 1.88, 0.1, qWallMat, 0, -2.87, 0.5);

  // Left Wall with hole at Z=1.8
  bx(0.1, 1.88, 1.18, qWallMat, -1.5, -2.87, 1.09); // Before hole
  bx(0.1, 0.82, 0.24, qWallMat, -1.5, -2.34, 1.8);  // Top
  bx(0.1, 0.82, 0.24, qWallMat, -1.5, -3.40, 1.8);  // Bottom
  bx(0.1, 1.88, 1.18, qWallMat, -1.5, -2.87, 2.51); // After hole

  // Right Wall with hole at Z=1.8
  bx(0.1, 1.88, 1.18, qWallMat, 1.5, -2.87, 1.09);
  bx(0.1, 0.82, 0.24, qWallMat, 1.5, -2.34, 1.8);
  bx(0.1, 0.82, 0.24, qWallMat, 1.5, -3.40, 1.8);
  bx(0.1, 1.88, 1.18, qWallMat, 1.5, -2.87, 2.51);

  // Rear wall (with doorway at X = -0.5 to 0.5)
  bx(1.0, 1.88, 0.1, qWallMat, -1.0, -2.87, 3.1); // Rear left
  bx(1.0, 1.88, 0.1, qWallMat, 1.0, -2.87, 3.1);  // Rear right
  bx(1.0, 0.53, 0.1, qWallMat, 0, -2.195, 3.1);   // Above door

  // Quarters Warm Lighting
  const qLight = new THREE.PointLight(0xffaa55, 1.5, 3.5);
  qLight.position.set(0, -2.0, 1.8);
  shipInterior.add(qLight);

  // Bed/Couchette
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0x994422, roughness: 1.0 });
  bx(0.8, 0.3, 1.6, bedMat, -1.1, -3.66, 1.2); // Base
  bx(0.8, 0.1, 1.0, blanketMat, -1.1, -3.46, 1.5); // Blanket
  bx(0.6, 0.1, 0.3, new THREE.MeshStandardMaterial({ color: 0xeeeeee }), -1.1, -3.46, 0.6); // Pillow

  // Holographic Table
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
  bx(0.6, 0.6, 0.6, tableMat, 0.5, -3.56, 1.5);
  // Hologram (will rotate in animate)
  window.holoDeco = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0x55aaff, wireframe: true, transparent: true, opacity: 0.6 }));
  holoDeco.position.set(0.5, -3.06, 1.5);
  shipInterior.add(holoDeco);

  // Lockers
  bx(0.4, 1.6, 0.6, tableMat, 1.3, -3.01, 2.5);
  bx(0.4, 1.6, 0.6, tableMat, 1.3, -3.01, 0.9);

  // DECORATIONS
  // Server banks along the far Right wall (X=2.22) - kept to give depth but far away from hologram
  for (let i = 0; i < 3; i++) {
    bx(0.3, 1.6, 0.4, dataServerMat, 2.22, 0.1, 1.2 + i * 0.5); // Server racks
    bx(0.04, 1.3, 0.3, new THREE.MeshStandardMaterial({ color: 0, emissive: 0x33bbaa, emissiveIntensity: 1.5 }), 2.12, 0.2, 1.2 + i * 0.5); // Blinking LED strips
  }

  // 2D Galaxy Map on the Front wall (Left when entering)
  const mapPanelMat = new THREE.MeshStandardMaterial({ color: 0x03060a, roughness: 0.2, metalness: 0.9 });
  bx(1.1, 1.1, 0.02, mapPanelMat, 1.335, 0.35, 1.02); // Dark backing panel
  bx(1.14, 1.14, 0.01, trimMat, 1.335, 0.35, 1.01); // White glowing frame

  // Beautiful Canvas Texture for the Galaxy
  const cmapCanvas = document.createElement('canvas');
  cmapCanvas.width = 1024; cmapCanvas.height = 1024;
  const cctx = cmapCanvas.getContext('2d');
  // bg and grid
  cctx.fillStyle = '#010306'; cctx.fillRect(0, 0, 1024, 1024);
  cctx.strokeStyle = '#051020'; cctx.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    cctx.beginPath(); cctx.moveTo(i * 102.4, 0); cctx.lineTo(i * 102.4, 1024); cctx.stroke();
    cctx.beginPath(); cctx.moveTo(0, i * 102.4); cctx.lineTo(1024, i * 102.4); cctx.stroke();
  }

  // procedural spiral arms
  cctx.globalCompositeOperation = 'lighter';
  for (let a = 0; a < 20000; a++) {
    const arm = Math.floor(Math.random() * 4);
    const r = Math.random() * 450;
    const theta = (r * 0.012) + (arm * Math.PI / 2) + ((Math.random() - 0.5) * 0.5);
    const px = 512 + Math.cos(theta) * r;
    const py = 512 + Math.sin(theta) * r;
    cctx.fillStyle = (Math.random() > 0.5) ? 'rgba(70, 130, 255, 0.3)' : 'rgba(200, 220, 255, 0.4)';
    cctx.fillRect(px, py, 2, 2);
  }

  // plot POIs with names!
  if (typeof GALACTIC_POI !== 'undefined') {
    cctx.globalCompositeOperation = 'source-over';
    for (const poi of GALACTIC_POI) {
      const isSol = (poi.id === 'sol');
      const px = 512 + (poi.pos[0] / 550000) * 512;
      const py = 512 - (poi.pos[2] / 550000) * 512;
      const color = isSol ? '#ffaa00' : (poi.dotColor || '#4080ff');
      cctx.shadowColor = color; cctx.shadowBlur = 10;
      cctx.fillStyle = '#ffffff';
      cctx.beginPath(); cctx.arc(px, py, isSol ? 5 : 3, 0, Math.PI * 2); cctx.fill();

      cctx.shadowBlur = 0;
      cctx.font = 'bold 18px "Courier New"';
      cctx.fillStyle = color;
      cctx.fillText(poi.name.toUpperCase(), px + 12, py + 6);
    }
  }

  const wallTex = new THREE.CanvasTexture(cmapCanvas);
  wallTex.anisotropy = 4;
  const wallTexMat = new THREE.MeshBasicMaterial({ map: wallTex, side: THREE.DoubleSide });
  const wallMapMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.08), wallTexMat);
  wallMapMesh.position.set(1.335, 0.35, 1.031);
  shipInterior.add(wallMapMesh);

  // Dynamic "You are Here" marker (Mini Spaceship!)
  const shipMarkerGeo = new THREE.ConeGeometry(0.016, 0.04, 3);
  const shipMarkerMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x00ffff, emissiveIntensity: 4.0 });
  const mapMarker = new THREE.Mesh(shipMarkerGeo, shipMarkerMat);
  mapMarker.scale.z = 0.2; // flatten into a 2D triangle pointing UP against the wall
  mapMarker.position.set(1.335, 0.35, 1.035);
  shipInterior.add(mapMarker);
  shipInterior.userData.mapMarker = mapMarker;

  // Ceiling projector module housing
  bx(0.6, 0.1, 0.6, trimMat, 1.2, 1.18, 2.0); // Base ring
  bx(0.2, 0.3, 0.2, trimMat, 1.2, 1.05, 2.0); // Dropping lens
  bx(0.25, 0.05, 0.25, new THREE.MeshStandardMaterial({ color: 0, emissive: 0x2040a0, emissiveIntensity: 2.0 }), 1.2, 0.9, 2.0); // glowing eye

  // Room ambient data-center lighting
  const mapRoomLight = new THREE.PointLight(0x104088, 1.0, 3);
  mapRoomLight.position.set(1.4, 0.8, 1.8);
  shipInterior.add(mapRoomLight);

  bx(0.3, 0.06, 0.01, doorLabelMat, -0.42, 1.1, 1.39); // OBSERVATORY LABEL
  bx(0.3, 0.06, 0.01, doorLabelMat, 0.42, 1.1, 1.39);  // GALAXY MAP LABEL
  bx(0.2, 0.06, 0.01, doorLabelMat, 0, 1.1, 0.61);     // BRIDGE LABEL

  // OBSERVATORY (LEVEL 1)
  const obsGeo = new THREE.CylinderGeometry(1.95, 1.95, 0.1, 32);
  const obsFloor = new THREE.Mesh(obsGeo, floorMat);
  obsFloor.position.set(0, 2.4, 1.8);
  shipInterior.add(obsFloor);

  // Torus with a slightly wider gap so the thick white rounded ends hide securely behind the elevator walls!
  const obsRing = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.05, 24, 64, Math.PI * 1.80), trimMat);
  obsRing.position.set(0, 2.45, 1.8);
  obsRing.rotation.x = Math.PI / 2;
  obsRing.rotation.z = Math.PI * 0.60;
  shipInterior.add(obsRing);

  const domeRadius = 2.0;
  // Synthesizing perfectly tight gap directly touching the shaft sides! (16 degrees from center)
  const phiStart = Math.PI * 0.59;
  const phiLength = Math.PI * 1.82;
  const domeGlassGeo = new THREE.SphereGeometry(domeRadius, 48, 32, phiStart, phiLength, 0, Math.PI / 2);
  const podGlass = new THREE.Mesh(domeGlassGeo, hublotGlassMat);
  podGlass.position.set(0, 2.45, 1.8);
  shipInterior.add(podGlass);

  const ribCount = 18;
  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    // Skip ribs inside the elevator entrance gap (around Math.PI/2)
    const d = Math.abs(angle - Math.PI / 2);
    if (d < Math.PI * 0.09) continue;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(domeRadius, 0.02, 8, 64, Math.PI / 2), domeFrameMat);
    rib.position.set(0, 2.45, 1.8);
    rib.rotation.y = angle;
    rib.rotation.z = Math.PI / 2;
    shipInterior.add(rib);
  }

  // Special structural arch landing perfectly in the middle of the elevator ceiling
  const archCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 4.45, 1.8),     // Dome hub/apex
    new THREE.Vector3(0, 4.65, 2.7),     // Slight upward arc for a supportive look
    new THREE.Vector3(0, 4.48, 3.375)    // Embedded securely inside the thickness of the ceiling block to hide the tip
  );
  const specialArchGeo = new THREE.TubeGeometry(archCurve, 32, 0.02, 8, false);
  const specialArch = new THREE.Mesh(specialArchGeo, domeFrameMat);
  shipInterior.add(specialArch);

  // Glass floor section
  const glassFloor = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), hublotGlassMat);
  glassFloor.position.set(0, 2.46, 1.8);
  glassFloor.rotation.x = -Math.PI / 2;
  shipInterior.add(glassFloor);

  // ADVANCED TELESCOPE MODEL
  teleGroup = new THREE.Group();
  teleGroup.position.set(0, 2.45, 1.0); // Moved a bit forward
  shipInterior.add(teleGroup);
  const tMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.3, metalness: 0.8 });

  const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12), tMat);
  teleGroup.add(tBase);
  const tPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), tMat);
  tPillar.position.y = 0.35;
  teleGroup.add(tPillar);

  tTubeGroup = new THREE.Group();
  tTubeGroup.position.y = 0.65;
  tTubeGroup.rotation.z = 0.5;
  tTubeGroup.rotation.y = 0.4;
  teleGroup.add(tTubeGroup);

  const tMainTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 12), tMat);
  tTubeGroup.add(tMainTube);
  const tLens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 12), trimMat);
  tLens.position.y = 0.226;
  tLens.rotation.x = -Math.PI / 2;
  tTubeGroup.add(tLens);
  const tMinorTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8), tMat);
  tMinorTube.position.set(0.04, 0.1, 0);
  tTubeGroup.add(tMinorTube);

  function hublot(x, y, z, rotY) {
    const hGroup = new THREE.Group();
    hGroup.position.set(x, y, z);
    hGroup.rotation.y = rotY;
    const frameRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.01, 8, 24), domeFrameMat);
    const bezel = new THREE.Mesh(new THREE.RingGeometry(0.10, 0.18, 32), domeFrameMat);
    const glassPart = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 16), hublotGlassMat);
    glassPart.rotation.x = Math.PI / 2;

    // Inner wall liner (tunnel) to hide the square hole cut into the wall
    const tunnelGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.12, 32, 1, true);
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.3, metalness: 0.85, side: THREE.DoubleSide });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.z = -0.05; // Offset back into the wall

    hGroup.add(frameRing);
    hGroup.add(bezel);
    hGroup.add(glassPart);
    hGroup.add(tunnel);
    shipInterior.add(hGroup);
  }

  // Hublots in Engineering Room (Far left wall)
  hublot(-3.94, 0.25, 1.9, Math.PI / 2);
  hublot(-3.94, 0.25, 3.1, Math.PI / 2);

  // Hublots in Quarters (Deck -1)
  hublot(-1.44, -2.87, 1.8, Math.PI / 2); // Left
  hublot(1.44, -2.87, 1.8, -Math.PI / 2); // Right

  // LUMIÈRES 
  const corridorLight = new THREE.PointLight(0x1a2a44, 0.8, 6);
  corridorLight.position.set(0, 0.7, 2.1);
  shipInterior.add(corridorLight);

  const obsLight = new THREE.PointLight(0x1a3058, 1.0, 6);
  obsLight.position.set(0, 4.0, 1.8);
  shipInterior.add(obsLight);

  const galMapLight = new THREE.PointLight(0x2a1a58, 0.9, 5);
  galMapLight.position.set(1.5, 0.6, 1.8);
  shipInterior.add(galMapLight);

  createHolographicMap();
}

function createHolographicMap() {
  holoMapGroup = new THREE.Group();
  holoMapGroup.position.set(1.2, 0.0, 2.0); // Center of galaxy map room
  shipInterior.add(holoMapGroup);

  // ── Pedestal (holographic table) ──
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0a0e18, roughness: 0.3, metalness: 0.8
  });
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 0.08, 16),
    pedestalMat
  );
  pedestal.position.y = -0.64;
  holoMapGroup.add(pedestal);

  // Pedestal rim glow
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: new THREE.Color(0x2040a0), emissiveIntensity: 1.5, roughness: 0.2
  });
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.008, 8, 32),
    rimMat
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.60;
  holoMapGroup.add(rim);

  // ── Mini Galaxy (particle spiral) ──
  const holoGalaxyGroup = new THREE.Group();
  holoGalaxyGroup.position.y = -0.15; // Float above pedestal
  holoMapGroup.add(holoGalaxyGroup);

  const particleCount = 3000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const armIndex = i % 4;
    const armAngle = (armIndex / 4) * Math.PI * 2;
    const r = Math.random() * 0.35;
    const windAngle = r * 5.0 + armAngle;
    const spread = 0.03 + r * 0.06;

    const x = Math.cos(windAngle) * r + (Math.random() - 0.5) * spread;
    const z = Math.sin(windAngle) * r + (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * 0.02 * (1 - r / 0.35);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Color: bluish-white core, bluer outer
    const t = r / 0.35;
    colors[i * 3] = 0.5 + (1 - t) * 0.5;     // R
    colors[i * 3 + 1] = 0.6 + (1 - t) * 0.4;  // G  
    colors[i * 3 + 2] = 1.0;                     // B

    sizes[i] = 1.5 + Math.random() * 2;
  }

  const holoGeo = new THREE.BufferGeometry();
  holoGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  holoGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  holoGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const holoMat = new THREE.PointsMaterial({
    size: 0.006,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const holoParticles = new THREE.Points(holoGeo, holoMat);
  holoGalaxyGroup.add(holoParticles);

  // ── Sun marker (golden dot) ──
  const sunMarkerGeo = new THREE.SphereGeometry(0.008, 8, 8);
  const sunMarkerMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: new THREE.Color(0xffcc44), emissiveIntensity: 2.0
  });
  // Sun position scaled: real sun is at ~26000 ly from center in a 500000 ly radius galaxy
  // Scaled to our 0.35 radius: 26000/500000 * 0.35 = 0.0182
  const sunMarker = new THREE.Mesh(sunMarkerGeo, sunMarkerMat);
  sunMarker.position.set(0.0182, 0, 0);
  holoGalaxyGroup.add(sunMarker);

  // Sun label glow ring
  const sunRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.015, 0.002, 6, 16),
    new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: new THREE.Color(0xffcc44), emissiveIntensity: 1.5
    })
  );
  sunRing.rotation.x = Math.PI / 2;
  sunRing.position.copy(sunMarker.position);
  holoGalaxyGroup.add(sunRing);

  // ── POI markers (small colored dots) ──
  const poiMarkerMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: new THREE.Color(0x4080ff), emissiveIntensity: 1.2
  });

  for (const poi of GALACTIC_POI) {
    if (poi.id === 'sol') continue; // Already have sun marker
    const px = (poi.pos[0] / 500000) * 0.35;
    const py = (poi.pos[1] / 500000) * 0.35;
    const pz = (poi.pos[2] / 500000) * 0.35;

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 6, 6),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: new THREE.Color(poi.dotColor || '#4080ff'),
        emissiveIntensity: 1.0
      })
    );
    dot.position.set(px, py, pz);
    holoGalaxyGroup.add(dot);
  }

  // ── Holographic projection beam (light column from pedestal) ──
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x2040a0,
    transparent: true,
    opacity: 0.04,
    emissive: new THREE.Color(0x2040a0),
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.3, 0.5, 16, 1, true),
    beamMat
  );
  beam.position.y = -0.36;
  holoMapGroup.add(beam);
}

function createCockpit() {
  shipRig = new THREE.Group();
  scene.add(shipRig);

  cockpitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.005, 100000);
  cockpitCamera.position.set(0, 0.08, -0.5);
  shipRig.add(cockpitCamera);

  cockpitLight = new THREE.PointLight(0x1a2a44, 1.2, 5);
  cockpitLight.position.set(0, 0.45, -0.2);
  shipRig.add(cockpitLight);

  cockpitGroup = new THREE.Group();
  shipRig.add(cockpitGroup);

  createShipInterior();
  // cockpitGroup.visible = false; // Intentionally left visible for exterior view
  // cockpitLight.visible = false;

  // Assign all cockpit/interior objects to layer 1 so they render in the cockpit pass
  // (which uses near=0.05 instead of near=1, preventing near-plane clipping)
  cockpitGroup.traverse(obj => { obj.layers.set(1); });
  cockpitLight.layers.set(1);
  cockpitCamera.layers.enableAll();

  ship.position.copy(camera.position);
  shipRig.position.copy(ship.position);
}

function toggleCockpitMode() {
  if (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK') exitCockpitMode();
  else enterCockpitMode();
}

function enterCockpitMode() {
  state.prevCameraMode = state.cameraMode;
  const ov = document.getElementById('cockpit-transition');
  ov.classList.add('active');

  // Init audio on first cockpit entry (requires user gesture)
  initAudio();

  setTimeout(() => {
    // Place ship at current camera
    const activeCam = state.scaleLevel === 'SOLAR' ? camera : galacticCamera;
    const lookTarget = state.scaleLevel === 'SOLAR' ? cam.lookAt : galCam.lookAt;

    ship.position.copy(activeCam.position);
    const fwd = new THREE.Vector3().subVectors(lookTarget, activeCam.position).normalize();
    const mtx = new THREE.Matrix4().lookAt(new THREE.Vector3(), fwd, new THREE.Vector3(0, 1, 0));
    ship.quaternion.setFromRotationMatrix(mtx);

    // Move shipRig to appropriate scene
    if (state.scaleLevel === 'GALACTIC') {
      if (shipRig.parent) shipRig.parent.remove(shipRig);
      galacticScene.add(shipRig);
      cockpitCamera.far = 600000;
      cockpitCamera.updateProjectionMatrix();
      // ship.maxSpeed = 3000; // ly/s cruise in galactic
    } else {
      if (shipRig.parent !== scene) {
        if (shipRig.parent) shipRig.parent.remove(shipRig);
        scene.add(shipRig);
      }
      cockpitCamera.far = 100000;
      cockpitCamera.updateProjectionMatrix();
      // ship.maxSpeed = 8; // units/s cruise in solar
    }

    shipRig.position.copy(ship.position);
    shipRig.quaternion.copy(ship.quaternion);

    // Reset all dynamics
    ship.speed = 0; ship.thrust = 0; ship.targetThrust = 0;
    ship.throttlePercent = 0;
    ship.boostActive = false; ship.boostHeat = 0;
    ship.boostCooldown = false; ship.boostCooldownTimer = 0;
    ship.strafeX = 0; ship.strafeY = 0;
    ship.yawRate = 0; ship.pitchRate = 0; ship.rollRate = 0;
    ship.freeLookYaw = 0; ship.freeLookPitch = 0;
    ship.coupledRoll = 0; ship.shakeAmt = 0;

    state.cockpitTarget = state.scaleLevel === 'SOLAR' ? state.selectedBody : state.selectedPOI;
    state.cockpitAutoNav = false;
    state.cockpitAutoTimer = 0;

    cockpitGroup.visible = true;
    cockpitLight.visible = true;
    state.cameraMode = 'WALK';
    state.cockpitEnabled = true;
    buildShipCollision();

    // Enter walk mode first (player can sit at pilot seat with E)
    enterWalkMode();

    setTimeout(() => ov.classList.remove('active'), 300);
  }, 300);
}

function exitCockpitMode() {
  const ov = document.getElementById('cockpit-transition');
  ov.classList.add('active');

  setTimeout(() => {
    // Stop all walk movement  
    walkKeys.forward = false;
    walkKeys.backward = false;
    walkKeys.left = false;
    walkKeys.right = false;

    const pos = new THREE.Vector3();
    shipRig.getWorldPosition(pos);

    if (state.scaleLevel === 'SOLAR') {
      cam.lookAt.copy(pos);
      cam.tLookAt.copy(pos);
      const back = new THREE.Vector3(0, 0.3, 1).applyQuaternion(ship.quaternion).normalize();
      camera.position.copy(pos).addScaledVector(back, cam.radius);
      const dx = camera.position.x - cam.lookAt.x;
      const dy = camera.position.y - cam.lookAt.y;
      const dz = camera.position.z - cam.lookAt.z;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      cam.radius = cam.tRadius = clamp(r, 4, 2000);
      cam.phi = cam.tPhi = Math.acos(clamp(dy / r, -0.999, 0.999));
      cam.theta = cam.tTheta = Math.atan2(dz, dx);
    } else {
      galCam.lookAt.copy(pos);
      galCam.tLookAt.copy(pos);
      galCam.tRadius = 5000;
    }

    // Move ship back to solar scene always
    if (shipRig.parent) shipRig.parent.remove(shipRig);
    scene.add(shipRig);
    // ship.maxSpeed = 8;
    cockpitCamera.far = 100000;
    cockpitCamera.updateProjectionMatrix();

    // cockpitGroup.visible = false; // Intentionally left visible for exterior view
    // cockpitLight.visible = false;
    state.cameraMode = state.prevCameraMode || 'FREE';
    state.cockpitEnabled = false;
    state.cockpitAutoNav = false;
    ship.throttlePercent = 0;
    ship.boostActive = false;
    ship.boostHeat = 0;
    ship.boostCooldown = false;

    for (const k in cockpitKeys) {
      if (typeof cockpitKeys[k] === 'boolean') cockpitKeys[k] = false;
    }

    document.getElementById('walk-hud').classList.remove('active');
    state.walkMode = false;
    document.getElementById('cockpit-hud').classList.remove('active');
    document.getElementById('hud').style.display = '';

    setTimeout(() => ov.classList.remove('active'), 300);
  }, 300);
}

function enterWalkMode() {
  state.walkMode = true;
  state.cameraMode = 'WALK';

  // Position walker at cockpit seat area and reset floor logic
  walker.position.set(0, 0, 0.2);
  walker.floor = 0;
  walker.targetFloor = 0;
  walker.baseY = 0.22;
  walker.yaw = Math.PI; // Face toward front of ship
  walker.pitch = 0;

  // Show walk HUD, hide cockpit HUD
  document.getElementById('walk-hud').classList.add('active');
  document.getElementById('cockpit-hud').classList.remove('active');
  document.getElementById('hud').style.display = 'none';

  // Update room name
  state.currentRoom = detectCurrentRoom(walker.position.x, walker.position.z);
  updateRoomNameDisplay();
}

function exitWalkMode() {
  state.walkMode = false;

  document.getElementById('walk-hud').classList.remove('active');
  document.getElementById('hud').style.display = '';
}

function enterPilotFromWalk() {
  state.walkMode = false;
  state.cameraMode = 'COCKPIT';

  // Hide walk HUD, show cockpit HUD
  document.getElementById('walk-hud').classList.remove('active');
  document.getElementById('cockpit-hud').classList.add('active');

  // Reset ship controls
  ship.freeLookYaw = 0;
  ship.freeLookPitch = 0;
  state.cockpitCameraFree = false;

  // Place cockpit camera back to standard position
  cockpitCamera.position.set(0, 0.08, 0);
  cockpitCamera.rotation.set(0, 0, 0);
}

function exitPilotToWalk() {
  state.cameraMode = 'WALK';
  state.walkMode = true;

  // Show walk HUD, hide cockpit HUD
  document.getElementById('cockpit-hud').classList.remove('active');
  document.getElementById('walk-hud').classList.add('active');

  // Place walker near the pilot seat
  walker.position.set(0, 0, 0.2);
  walker.yaw = Math.PI;
  walker.pitch = 0;

  state.currentRoom = 'cockpit';
  updateRoomNameDisplay();
}

function enterObservationMode() {
  if (state.cameraMode !== 'WALK') return;
  state.observing = true;
  document.getElementById('walk-hud').classList.remove('active');
  document.getElementById('telescope-hud').classList.add('active');

  // Camera positioning (slightly behind eyepiece to avoid mesh clipping)
  cockpitCamera.position.set(-1.40, 0.15, 1.6); // Local ship pos
  cockpitCamera.fov = 12; // High zoom
  cockpitCamera.updateProjectionMatrix();
}

function exitObservationMode() {
  state.observing = false;
  document.getElementById('telescope-hud').classList.remove('active');
  document.getElementById('walk-hud').classList.add('active');

  // Reset camera to walker eyes
  cockpitCamera.fov = 75;
  cockpitCamera.updateProjectionMatrix();
}

function updateTelescopeRef(dt) {
  if (!teleGroup || !tTubeGroup) return;

  let targetPos = null;
  let targetName = "NONE";
  let targetDist = "---";
  let targetClass = "---";

  if (state.scaleLevel === 'SOLAR') {
    const bodyId = state.selectedBody || 'sun';
    const obj = planetObjects[bodyId];
    if (obj) {
      targetPos = new THREE.Vector3();
      obj.mesh.getWorldPosition(targetPos);
      targetName = obj.data.name.toUpperCase();
      targetClass = obj.data.type || 'Star';
      // Approximate distance in AU
      const dist = ship.position.distanceTo(targetPos) / AU;
      targetDist = dist.toFixed(2) + " AU";
    }
  } else {
    const poiId = state.selectedPOI || 'sgr-a';
    const obj = galacticPOIObjects[poiId];
    if (obj) {
      targetPos = obj.group.position;
      targetName = obj.data.name.toUpperCase();
      targetClass = obj.data.type || 'Galaxy';
      const dist = ship.position.distanceTo(targetPos);
      targetDist = Math.round(dist).toLocaleString() + " LY";
    }
  }

  // Calculate direction in ship-local space
  const distToTarget = ship.position.distanceTo(targetPos);
  if (targetPos && distToTarget > 0.001) {
    const worldDir = targetPos.clone().sub(ship.position).normalize();
    const shipQuatInv = shipRig.quaternion.clone().invert();
    const localDir = worldDir.applyQuaternion(shipQuatInv);

    // Target angles
    const targetYaw = Math.atan2(localDir.x, localDir.z) + Math.PI;
    const targetPitch = Math.asin(localDir.y);

    // Smooth rotation
    teleGroup.rotation.y = lerp(teleGroup.rotation.y, targetYaw, dt * 2);
    tTubeGroup.rotation.x = lerp(tTubeGroup.rotation.x, -targetPitch, dt * 2);

    // Update HUD
    if (state.observing) {
      document.getElementById('tele-name').textContent = targetName;
      document.getElementById('tele-info').textContent = `DISTANCE: ${targetDist} | CLASS: ${targetClass}`;

      // Apply rotation to camera to match telescope
      cockpitCamera.rotation.y = teleGroup.rotation.y;
      cockpitCamera.rotation.x = tTubeGroup.rotation.x;
    }
  }
}

let roomDisplayTimeout = null;

function updateRoomNameDisplay() {
  const names = {
    'cockpit': 'PONT DE COMMANDEMENT',
    'corridor': 'COULOIR',
    'observatory': 'OBSERVATOIRE',
    'galaxymap': 'CARTE GALACTIQUE',
  };
  const el = document.getElementById('walk-room-name');
  if (el) {
    el.textContent = names[state.currentRoom] || 'VAISSEAU';
    el.classList.add('visible');
    if (roomDisplayTimeout) clearTimeout(roomDisplayTimeout);
    roomDisplayTimeout = setTimeout(() => {
      el.classList.remove('visible');
    }, 2000);
  }
}

function updateWalkMode(dt) {
  if (state.cameraMode !== 'WALK') return;

  if (!state.observing) {
    // ── Mouse look ──
    walker.yaw -= walkKeys.mouseDX * walker.mouseSensitivity;
    walker.pitch -= walkKeys.mouseDY * walker.mouseSensitivity;
    walker.pitch = clamp(walker.pitch, -1.2, 1.2);

    // ── Movement ──
    const forward = new THREE.Vector3(-Math.sin(walker.yaw), 0, -Math.cos(walker.yaw));
    const right = new THREE.Vector3(Math.cos(walker.yaw), 0, -Math.sin(walker.yaw));

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (walkKeys.forward) moveDir.add(forward);
    if (walkKeys.backward) moveDir.sub(forward);
    if (walkKeys.right) moveDir.add(right);
    if (walkKeys.left) moveDir.sub(right);

    if (moveDir.length() > 0) {
      moveDir.normalize().multiplyScalar(walker.speed * dt);
      walker.position.add(moveDir);
    }

    // ── Collision ──
    const corrected = checkShipCollision(walker.position, walker.radius);
    walker.position.x = corrected.x;
    walker.position.z = corrected.z;

    // ── Room detection ──
    const newRoom = detectCurrentRoom(walker.position.x, walker.position.z);
    if (newRoom !== state.currentRoom) {
      state.currentRoom = newRoom;
      updateRoomNameDisplay();
    }
  }

  walkKeys.mouseDX = 0;
  walkKeys.mouseDY = 0;

  // ── Dynamic lighting based on room ──
  if (cockpitLight) {
    const roomColors = {
      'cockpit': { color: 0x1a2a44, intensity: 0.4 },
      'corridor': { color: 0x121828, intensity: 0.2 },
      'elevator': { color: 0x224466, intensity: 0.3 },
      'observatory': { color: 0x0a1830, intensity: 0.15 },
      'galaxymap': { color: 0x1a1040, intensity: 0.35 },
    };
    const roomCfg = roomColors[state.currentRoom] || roomColors['cockpit'];
    // Smooth transition
    const targetColor = new THREE.Color(roomCfg.color);
    cockpitLight.color.lerp(targetColor, dt * 3);
    cockpitLight.intensity += (roomCfg.intensity - cockpitLight.intensity) * dt * 3;
    // Move light to follow player
    cockpitLight.position.set(walker.position.x, walker.floor === 1 ? 3.0 : 0.5, walker.position.z);
  }

  // ── Elevator Logic ──
  const inElevator = state.currentRoom === 'elevator';
  if (walkKeys.interact && inElevator) {
    walker.targetFloor = walker.floor === 0 ? 1 : (walker.floor === 1 ? -1 : 0);
    walkKeys.interact = false;
  }
  if (walker.targetFloor !== walker.floor) {
    walker.floor = walker.targetFloor;
  }
  const targetEyeHeight = walker.floor === 0 ? 0.22 : (walker.floor === 1 ? 3.40 : -2.91);
  walker.baseY += (targetEyeHeight - walker.baseY) * dt * 4;

  if (typeof elevatorPad !== 'undefined' && elevatorPad) {
    const targetElevatorY = walker.floor === 0 ? -0.68 : (walker.floor === 1 ? 2.45 : -3.81);
    elevatorPad.position.y += (targetElevatorY - elevatorPad.position.y) * dt * 4;
  }

  // ── Interaction prompt ──
  const promptEl = document.getElementById('walk-interact-prompt');
  const nearPilotSeat = walker.position.z < 0.3 && Math.abs(walker.position.x) < 0.5 && state.currentRoom === 'cockpit';
  const nearTelescope = walker.position.z > 0.5 && walker.position.z < 1.5 && Math.abs(walker.position.x) < 0.6 && state.currentRoom === 'observatory';

  if (nearPilotSeat) {
    promptEl.classList.add('visible');
    promptEl.textContent = 'APPUYEZ [F] POUR PILOTER';
  } else if (nearTelescope) {
    promptEl.classList.add('visible');
    promptEl.textContent = 'APPUYEZ [F] POUR OBSERVER';
  } else if (inElevator) {
    promptEl.classList.add('visible');
    promptEl.textContent = 'APPUYEZ [F] POUR CHANGER D\'ÉTAGE';
  } else {
    promptEl.classList.remove('visible');
  }

  // Consume unused interact
  walkKeys.interact = false;

  // ── Update camera position (local to shipRig) ──
  if (state.observing) {
    // Position and rotation already handled in updateTelescopeRef
  } else {
    cockpitCamera.position.set(walker.position.x, walker.baseY, walker.position.z);
    cockpitCamera.rotation.set(0, 0, 0);
    cockpitCamera.rotateY(walker.yaw);
    cockpitCamera.rotateX(walker.pitch);
  }
}

function updateShip(dt) {
  ship.maxSpeed = SPEED_TIERS[state.currentSpeedTier];
  if (state.cameraMode !== 'COCKPIT' && state.cameraMode !== 'WALK') return;
  if (state.warp.active && state.warp.type === 'TO_POI') {
    updateCockpitCamera(dt);
    return;
  }

  const isFTL = state.scaleLevel === 'GALACTIC';
  const TURN_RATE = isFTL ? 0.6 : 1.5;
  const STRAFE_MAX = isFTL ? 1200 : 3;

  // ── Throttle (held keys: continuous adjust) ──
  if (cockpitKeys.throttleUp) {
    ship.throttlePercent = Math.min(ship.throttlePercent + 50 * dt, 100);
  } else if (cockpitKeys.throttleDown) {
    ship.throttlePercent = Math.max(ship.throttlePercent - 50 * dt, 0);
  }

  // ── Boost management (5s to overheat, 3s cooldown) ──
  if (cockpitKeys.boost && !ship.boostCooldown && ship.throttlePercent > 0) {
    ship.boostActive = true;
    ship.boostHeat += dt * 20; // 100/20 = 5s to overheat
    if (ship.boostHeat >= ship.boostMaxHeat) {
      ship.boostHeat = ship.boostMaxHeat;
      ship.boostActive = false;
      ship.boostCooldown = true;
      ship.boostCooldownTimer = 3.0;
    }
  } else {
    ship.boostActive = false;
    if (ship.boostCooldown) {
      ship.boostCooldownTimer -= dt;
      if (ship.boostCooldownTimer <= 0) {
        ship.boostCooldown = false;
        ship.boostCooldownTimer = 0;
      }
    }
    ship.boostHeat = Math.max(0, ship.boostHeat - dt * 15);
  }

  // ── Speed from throttle ──
  const boostMult = ship.boostActive ? ship.boostMultiplier : 1;
  const targetSpeed = (ship.throttlePercent / 100) * ship.maxSpeed * boostMult;
  ship.speed = lerp(ship.speed, targetSpeed, dt * 3.5);
  if (Math.abs(ship.speed) < 0.001 && ship.throttlePercent === 0) ship.speed = 0;

  // ── Rotation ──
  const tYaw = ((cockpitKeys.yawLeft ? 1 : 0) - (cockpitKeys.yawRight ? 1 : 0)) * TURN_RATE;
  const tPitch = ((cockpitKeys.pitchDown ? 1 : 0) - (cockpitKeys.pitchUp ? 1 : 0)) * TURN_RATE;
  const tRoll = ((cockpitKeys.rollLeft ? 1 : 0) - (cockpitKeys.rollRight ? 1 : 0)) * TURN_RATE * 0.7;
  ship.yawRate = lerp(ship.yawRate, tYaw, dt * 5);
  ship.pitchRate = lerp(ship.pitchRate, tPitch, dt * 5);
  ship.rollRate = lerp(ship.rollRate, tRoll, dt * 5);

  if (!state.cockpitCameraFree) {
    ship.yawRate += cockpitKeys.mouseDX * 0.12;
    ship.pitchRate -= cockpitKeys.mouseDY * 0.12;
    cockpitKeys.mouseDX = 0;
    cockpitKeys.mouseDY = 0;
  }

  // Auto-navigation
  if (state.cockpitAutoNav) {
    if (isFTL) updateAutoNavGalactic(dt);
    else updateAutoNav(dt);
  }

  // Apply rotation
  const lu = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion);
  const lr = new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion);
  const lf = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
  const qy = new THREE.Quaternion().setFromAxisAngle(lu, ship.yawRate * dt);
  const qp = new THREE.Quaternion().setFromAxisAngle(lr, ship.pitchRate * dt);
  const qr = new THREE.Quaternion().setFromAxisAngle(lf, ship.rollRate * dt);
  ship.quaternion.premultiply(qy).premultiply(qp).premultiply(qr).normalize();

  // ── Forward movement ──
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
  ship.position.addScaledVector(fwd, ship.speed * dt);

  // ── Strafe movement ──
  const strafeX = ((cockpitKeys.strafeRight ? 1 : 0) - (cockpitKeys.strafeLeft ? 1 : 0));
  const strafeY = ((cockpitKeys.strafeUp ? 1 : 0) - (cockpitKeys.strafeDown ? 1 : 0));
  ship.strafeX = lerp(ship.strafeX, strafeX * STRAFE_MAX, dt * 4);
  ship.strafeY = lerp(ship.strafeY, strafeY * STRAFE_MAX, dt * 4);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion);
  ship.position.addScaledVector(right, ship.strafeX * dt);
  ship.position.addScaledVector(up, ship.strafeY * dt);

  shipRig.position.copy(ship.position);
  shipRig.quaternion.copy(ship.quaternion);

  // ── Ambient light color ──
  if (cockpitLight) {
    if (ship.boostActive) cockpitLight.color.setHex(0x442a10);
    else cockpitLight.color.setHex(0x1a2a44);
  }

  updateCockpitCamera(dt);
}

function updateCockpitCamera(dt) {
  // Roll coupling
  ship.coupledRoll = lerp(ship.coupledRoll, -ship.yawRate * 0.12, dt * 4);

  // Shake (stronger with boost)
  const boostShake = ship.boostActive ? 0.015 : 0;
  const activity = (ship.throttlePercent / 100) * 0.02 + boostShake
    + (Math.abs(ship.yawRate) + Math.abs(ship.pitchRate)) * 0.012;
  ship.shakeAmt = lerp(ship.shakeAmt, activity, dt * 6);
  const st = performance.now() * 0.008;
  ship.shakeOff.set(
    Math.sin(st * 1.1) * ship.shakeAmt * 0.012,
    Math.sin(st * 1.7) * ship.shakeAmt * 0.008,
    Math.sin(st * 0.9) * ship.shakeAmt * 0.004
  );

  cockpitCamera.position.set(ship.shakeOff.x, 0.08 + ship.shakeOff.y, -0.5 + ship.shakeOff.z);

  if (state.cockpitCameraFree) {
    ship.freeLookYaw += cockpitKeys.mouseDX * 0.003;
    ship.freeLookPitch -= cockpitKeys.mouseDY * 0.003;
    ship.freeLookYaw = clamp(ship.freeLookYaw, -1.3, 1.3);
    ship.freeLookPitch = clamp(ship.freeLookPitch, -0.65, 0.55);
    cockpitKeys.mouseDX = 0;
    cockpitKeys.mouseDY = 0;
    cockpitCamera.rotation.set(0, 0, 0);
    cockpitCamera.rotateY(ship.freeLookYaw);
    cockpitCamera.rotateX(ship.freeLookPitch);
    cockpitCamera.rotateZ(ship.coupledRoll);
  } else {
    cockpitCamera.rotation.set(0, 0, ship.coupledRoll);
  }

  // FOV (only if warp not controlling it)
  if (!state.warp.active) {
    const sr = clamp(Math.abs(ship.speed) / (ship.maxSpeed * ship.boostMultiplier), 0, 1);
    const boostFov = ship.boostActive ? 95 : 88;
    cockpitCamera.fov = lerp(75, boostFov, sr * sr);
    cockpitCamera.updateProjectionMatrix();
  }
}

function updateAutoNav(dt) {
  if (!state.cockpitTarget || !planetObjects[state.cockpitTarget]) {
    cockpitLockTarget(); return;
  }
  const tpos = new THREE.Vector3();
  planetObjects[state.cockpitTarget].mesh.getWorldPosition(tpos);
  const toT = new THREE.Vector3().subVectors(tpos, ship.position);
  const dist = toT.length();
  toT.normalize();
  const destQ = new THREE.Quaternion();
  const lm = new THREE.Matrix4().lookAt(new THREE.Vector3(), toT, new THREE.Vector3(0, 1, 0));
  destQ.setFromRotationMatrix(lm);
  ship.quaternion.slerp(destQ, clamp(dt * 0.9, 0, 0.05));
  const bR = planetObjects[state.cockpitTarget].data.scaledRadius || 1;
  if (dist > bR * 8) {
    ship.throttlePercent = clamp(Math.round(dist * 5), 50, 100);
  } else {
    ship.throttlePercent = clamp(Math.round((dist - bR * 3) * 8), 0, 40);
    if (dist < bR * 4) ship.throttlePercent = 0;
  }
  if (dist < bR * 5) {
    state.cockpitAutoTimer = (state.cockpitAutoTimer || 0) + dt;
    if (state.cockpitAutoTimer > 5) {
      const seq = ['sun', ...BODIES.map(b => b.id)];
      const idx = seq.indexOf(state.cockpitTarget);
      state.cockpitTarget = seq[(idx + 1) % seq.length];
      state.cockpitAutoTimer = 0;
    }
  } else {
    state.cockpitAutoTimer = 0;
  }
}

function updateAutoNavGalactic(dt) {
  if (!state.cockpitTarget || !galacticPOIObjects[state.cockpitTarget]) {
    cockpitLockTarget(); return;
  }
  const poi = galacticPOIObjects[state.cockpitTarget];
  const tpos = poi.group.position.clone();
  const toT = new THREE.Vector3().subVectors(tpos, ship.position);
  const dist = toT.length();
  toT.normalize();
  const destQ = new THREE.Quaternion();
  const lm = new THREE.Matrix4().lookAt(new THREE.Vector3(), toT, new THREE.Vector3(0, 1, 0));
  destQ.setFromRotationMatrix(lm);
  ship.quaternion.slerp(destQ, clamp(dt * 0.7, 0, 0.04));
  const poiScale = poi.data.scale || 300;
  const stopDist = poiScale * 3;
  if (dist > stopDist * 4) {
    ship.throttlePercent = clamp(Math.round(dist / 200), 60, 100);
  } else if (dist > stopDist) {
    ship.throttlePercent = clamp(Math.round((dist - stopDist) / stopDist * 30), 5, 50);
  } else {
    ship.throttlePercent = 0;
  }
}

function updateCockpitHUD(dt) {
  if (state.cameraMode !== 'COCKPIT') return;
  const isFTL = state.scaleLevel === 'GALACTIC';

  const nameEl = document.getElementById('ckp-tgt-name');
  const distEl = document.getElementById('ckp-tgt-dist');
  const proxEl = document.getElementById('ckp-prox');

  // ── Target info ──
  if (isFTL) {
    if (state.cockpitTarget && galacticPOIObjects[state.cockpitTarget]) {
      const obj = galacticPOIObjects[state.cockpitTarget];
      nameEl.textContent = obj.data.name.toUpperCase();
      const d = obj.group.position.distanceTo(ship.position);
      distEl.textContent = formatDistance(d);
      proxEl.className = d < obj.data.scale * 2 ? 'ckp-proximity warn' : 'ckp-proximity';
    } else if (state.selectedPOI && galacticPOIObjects[state.selectedPOI]) {
      state.cockpitTarget = state.selectedPOI;
    } else {
      nameEl.textContent = '—'; distEl.textContent = '';
      proxEl.className = 'ckp-proximity';
    }
  } else {
    if (state.cockpitTarget && planetObjects[state.cockpitTarget]) {
      const obj = planetObjects[state.cockpitTarget];
      nameEl.textContent = obj.data.name.toUpperCase();
      const tp = new THREE.Vector3();
      obj.mesh.getWorldPosition(tp);
      const d = tp.distanceTo(ship.position);
      distEl.textContent = (d / AU).toFixed(2) + ' AU';
      const bR = obj.data.scaledRadius || 1;
      proxEl.className = d < bR * 5 ? 'ckp-proximity danger' : d < bR * 15 ? 'ckp-proximity warn' : 'ckp-proximity';
    } else {
      nameEl.textContent = '—'; distEl.textContent = '';
      proxEl.className = 'ckp-proximity';
    }
  }

  // ── Throttle gauge ──
  const thrFill = document.getElementById('ckp-thr-fill');
  thrFill.style.height = ship.throttlePercent + '%';
  thrFill.className = 'ckp-throttle-fill' + (ship.boostActive ? ' boost' : '');
  document.getElementById('ckp-thr-pct').textContent = Math.round(ship.throttlePercent) + '%';

  // ── Boost heat gauge ──
  const heatPct = (ship.boostHeat / ship.boostMaxHeat) * 100;
  const boostFill = document.getElementById('ckp-boost-fill');
  boostFill.style.height = heatPct + '%';
  boostFill.className = 'ckp-boost-fill' + (
    ship.boostCooldown ? ' overheat' : heatPct > 60 ? ' hot' : ''
  );
  const bStatus = document.getElementById('ckp-boost-status');
  if (ship.boostCooldown) {
    bStatus.textContent = 'COOL';
    bStatus.className = 'ckp-boost-status cooldown';
  } else if (ship.boostActive) {
    bStatus.textContent = 'BURN';
    bStatus.className = 'ckp-boost-status active';
  } else {
    bStatus.textContent = 'RDY';
    bStatus.className = 'ckp-boost-status';
  }

  // ── Velocity display ──
  const velBig = document.getElementById('ckp-vel-big');
  const velUnit = document.getElementById('ckp-vel-unit');
  const velMode = document.getElementById('ckp-vel-mode');

  if (isFTL) {
    velBig.textContent = Math.abs(ship.speed).toFixed(0);
    velUnit.textContent = 'LY/S';
  } else {
    velBig.textContent = Math.abs(ship.speed).toFixed(1);
    velUnit.textContent = 'U/S';
  }

  // Mode label
  let mode = 'IDLE';
  let modeClass = 'ckp-vel-mode-label';
  if (state.warp.active) { mode = 'FTL WARP'; modeClass += ' ftl-mode'; }
  else if (ship.boostActive) { mode = 'BOOST'; modeClass += ' boost-active'; }
  else if (state.cockpitAutoNav) { mode = 'AUTOPILOT'; modeClass += ' auto'; }
  else if (ship.throttlePercent > 0) { mode = isFTL ? 'FTL CRUISE' : 'CRUISE'; if (isFTL) modeClass += ' ftl-mode'; }
  else if (state.paused) { mode = 'STANDBY'; }
  
  if (!state.cockpitAutoNav && !state.warp.active) {
    const gearNum = speedTierList.indexOf(state.currentSpeedTier) + 1;
    mode += ' [GEAR ' + gearNum + ']';
  }
  
  velMode.textContent = mode;
  velMode.className = modeClass;
}

// ── Radar Scanner ──
function drawRadar(dt) {
  if (!radarCtx) return;
  const cvs = radarCtx.canvas;
  const w = cvs.width, h = cvs.height;
  const cx = w / 2, cy = h / 2;
  const maxR = w / 2 - 16;
  const isFTL = state.scaleLevel === 'GALACTIC';
  const range = isFTL ? 300000 : 500;

  radarCtx.clearRect(0, 0, w, h);

  // Background
  radarCtx.fillStyle = 'rgba(4, 8, 18, 0.65)';
  radarCtx.beginPath();
  radarCtx.arc(cx, cy, maxR + 8, 0, Math.PI * 2);
  radarCtx.fill();

  // Grid circles
  for (let i = 1; i <= 3; i++) {
    radarCtx.strokeStyle = 'rgba(74, 144, 196, ' + (0.06 + i * 0.02) + ')';
    radarCtx.lineWidth = 0.6;
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, maxR * i / 3, 0, Math.PI * 2);
    radarCtx.stroke();
  }

  // Cross lines
  radarCtx.strokeStyle = 'rgba(74, 144, 196, 0.05)';
  radarCtx.lineWidth = 0.5;
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy - maxR); radarCtx.lineTo(cx, cy + maxR);
  radarCtx.moveTo(cx - maxR, cy); radarCtx.lineTo(cx + maxR, cy);
  radarCtx.stroke();

  // Sweep
  radarAngle += dt * 1.5;
  const sweepLen = Math.PI * 0.35;
  radarCtx.save();
  radarCtx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const a = radarAngle - (i / 12) * sweepLen;
    const alpha = (1 - i / 12) * 0.06;
    radarCtx.strokeStyle = 'rgba(74, 144, 196, ' + alpha + ')';
    radarCtx.lineWidth = 1.5;
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    radarCtx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
    radarCtx.stroke();
  }
  radarCtx.restore();

  // Collect objects
  const objects = [];
  const shipFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
  const shipRight = new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion);

  if (isFTL) {
    for (const id in galacticPOIObjects) {
      const obj = galacticPOIObjects[id];
      objects.push({ pos: obj.group.position, color: obj.data.dotColor, isTarget: id === state.cockpitTarget, name: obj.data.name });
    }
  } else {
    for (const id in planetObjects) {
      const obj = planetObjects[id];
      const pos = new THREE.Vector3();
      obj.mesh.getWorldPosition(pos);
      objects.push({ pos, color: obj.data.dotColor || '#ffffff', isTarget: id === state.cockpitTarget, name: obj.data.name });
    }
  }

  // Draw objects
  for (const obj of objects) {
    const rel = new THREE.Vector3().subVectors(obj.pos, ship.position);
    const rx = rel.dot(shipRight);
    const ry = -rel.dot(shipFwd);
    const sf = maxR / range;
    let px = cx + rx * sf;
    let py = cy + ry * sf;
    const dc = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    let outside = false;

    if (dc > maxR - 6) {
      outside = true;
      const ang = Math.atan2(py - cy, px - cx);
      px = cx + Math.cos(ang) * (maxR - 8);
      py = cy + Math.sin(ang) * (maxR - 8);
    }

    if (obj.isTarget) {
      // Pulsing diamond
      const sz = 5 + Math.sin(performance.now() * 0.005) * 2;
      radarCtx.save();
      radarCtx.translate(px, py);
      radarCtx.rotate(Math.PI / 4);
      radarCtx.strokeStyle = obj.color;
      radarCtx.lineWidth = 1.8;
      radarCtx.strokeRect(-sz / 2, -sz / 2, sz, sz);
      radarCtx.restore();
      // Name label
      radarCtx.font = '9px monospace';
      radarCtx.fillStyle = obj.color;
      radarCtx.globalAlpha = 0.7;
      radarCtx.fillText(obj.name.substring(0, 8), px + 8, py + 3);
      radarCtx.globalAlpha = 1;
    } else if (outside) {
      // Arrow on edge
      const ang = Math.atan2(py - cy, px - cx);
      radarCtx.save();
      radarCtx.translate(px, py);
      radarCtx.rotate(ang);
      radarCtx.fillStyle = obj.color;
      radarCtx.globalAlpha = 0.4;
      radarCtx.beginPath();
      radarCtx.moveTo(5, 0);
      radarCtx.lineTo(-3, -3);
      radarCtx.lineTo(-3, 3);
      radarCtx.closePath();
      radarCtx.fill();
      radarCtx.globalAlpha = 1;
      radarCtx.restore();
    } else {
      radarCtx.fillStyle = obj.color;
      radarCtx.beginPath();
      radarCtx.arc(px, py, 2.5, 0, Math.PI * 2);
      radarCtx.fill();
    }
  }

  // Ship marker (triangle at center)
  radarCtx.fillStyle = '#ffffff';
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy - 6);
  radarCtx.lineTo(cx - 4, cy + 4);
  radarCtx.lineTo(cx + 4, cy + 4);
  radarCtx.closePath();
  radarCtx.fill();

  // Range label
  radarCtx.font = '8px monospace';
  radarCtx.fillStyle = 'rgba(74, 144, 196, 0.35)';
  radarCtx.fillText(isFTL ? formatDistance(range) : Math.round(range / AU) + ' AU', cx + maxR * 0.52, cy - maxR * 0.85);
}

function cockpitLockTarget() {
  if (state.scaleLevel === 'GALACTIC') {
    if (state.selectedPOI) { state.cockpitTarget = state.selectedPOI; return; }
    let best = null, bestD = Infinity;
    for (const id in galacticPOIObjects) {
      const d = galacticPOIObjects[id].group.position.distanceTo(ship.position);
      if (d < bestD) { bestD = d; best = id; }
    }
    state.cockpitTarget = best;
  } else {
    if (state.selectedBody) { state.cockpitTarget = state.selectedBody; return; }
    let best = null, bestD = Infinity;
    for (const id in planetObjects) {
      const p = new THREE.Vector3();
      planetObjects[id].mesh.getWorldPosition(p);
      const d = p.distanceTo(ship.position);
      if (d < bestD) { bestD = d; best = id; }
    }
    state.cockpitTarget = best;
  }
}

function cockpitCycleTarget() {
  if (state.scaleLevel === 'GALACTIC') {
    const ids = Object.keys(galacticPOIObjects);
    const ci = ids.indexOf(state.cockpitTarget);
    state.cockpitTarget = ids[(ci + 1) % ids.length];
  } else {
    const d = SYSTEMS_DATA[state.currentSystem] ? SYSTEMS_DATA[state.currentSystem].bodies : [];
    const seq = ['sun', ...d.map(b => b.id)];
    const ci = seq.indexOf(state.cockpitTarget);
    state.cockpitTarget = seq[(ci + 1) % seq.length];
  }
}

// ============================================================
// GEAR UP / GEAR DOWN LISTENER
// ============================================================
window.addEventListener('keydown', function(e) {
  if (state.cameraMode !== 'COCKPIT') return;
  // Block if typing
  const tag = document.activeElement?.tagName;
  if ((tag === 'INPUT' || tag === 'TEXTAREA') && e.code !== 'Escape') return;

  if (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') {
    let idx = speedTierList.indexOf(state.currentSpeedTier);
    if (idx < speedTierList.length - 1) {
      state.currentSpeedTier = speedTierList[idx + 1];
    }
  } else if (e.key === '-' || e.code === 'Minus' || e.code === 'Digit6' || e.code === 'NumpadSubtract') {
    let idx = speedTierList.indexOf(state.currentSpeedTier);
    if (idx > 0) {
      state.currentSpeedTier = speedTierList[idx - 1];
    }
  }
});

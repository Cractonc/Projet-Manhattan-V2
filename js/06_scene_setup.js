'use strict';

// ============================================================
// THREE.JS SETUP
// ============================================================
var canvas = document.getElementById('canvas');
var renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = false;
renderer.autoClear = true;

// Solar scene (existing)
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 80, 180);

// Galactic scene (new)
var galacticScene = new THREE.Scene();
var galacticCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 2000000);
galacticCamera.position.set(SUN_GAL.x, 60000, SUN_GAL.z + 40000);
galacticCamera.lookAt(0, 0, 0);

// Raycaster for click selection
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var clickables = []; // solar meshes

// ============================================================
// CAMERA CONTROLLER — SOLAR
// ============================================================
var cam = {
  theta: 0.5, phi: 1.1, radius: 200,
  tTheta: 0.5, tPhi: 1.1, tRadius: 200,
  lookAt: new THREE.Vector3(0, 0, 0),
  tLookAt: new THREE.Vector3(0, 0, 0),
  isDragging: false, lastX: 0, lastY: 0, speed: 0.005,

  focusOn(bodyId) {
    const obj = planetObjects[bodyId];
    if (!obj) return;
    const pos = new THREE.Vector3();
    obj.mesh.getWorldPosition(pos);
    const r = obj.data.scaledRadius;
    this.tLookAt.copy(pos);
    this.tRadius = clamp(r * 6, 4, 300);
    state.selectedBody = bodyId;
    updateHUD();
    updateInfoCard(obj.data);
    if (state.cameraMode === 'COCKPIT') {
      state.cockpitTarget = bodyId;
    } else {
      state.cameraMode = 'ORBIT';
      document.getElementById('hud-mode').textContent = 'ORBIT';
    }
  },

  focusOverview() {
    if (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK') { return; }
    this.tLookAt.set(0, 0, 0);
    this.tRadius = 220;
    this.tPhi = 1.1;
    this.tTheta = 0.4;
    state.selectedBody = null;
    state.cameraMode = 'FREE';
    document.getElementById('hud-mode').textContent = 'FREE';
    document.getElementById('hud-target').textContent = '—';
    hideInfoCard();
  },

  update(dt) {
    if (state.cameraMode === 'COCKPIT') return;
    const ease = Math.min(1, dt * 2.5);
    this.theta = lerp(this.theta, this.tTheta, ease);
    this.phi = lerp(this.phi, this.tPhi, ease);
    this.radius = lerp(this.radius, this.tRadius, ease);
    this.lookAt.lerp(this.tLookAt, ease);

    if (state.selectedBody && state.cameraMode === 'ORBIT') {
      const obj = planetObjects[state.selectedBody];
      if (obj) {
        const pos = new THREE.Vector3();
        obj.mesh.getWorldPosition(pos);
        this.tLookAt.copy(pos);
      }
    }

    const sinPhi = Math.sin(this.phi);
    const x = this.lookAt.x + this.radius * sinPhi * Math.cos(this.theta);
    const y = this.lookAt.y + this.radius * Math.cos(this.phi);
    const z = this.lookAt.z + this.radius * sinPhi * Math.sin(this.theta);
    camera.position.set(x, y, z);
    camera.lookAt(this.lookAt);
  }
};

// ============================================================
// CAMERA CONTROLLER — GALACTIC
// ============================================================
var galCam = {
  theta: -0.3, phi: 0.75, radius: 80000,
  tTheta: -0.3, tPhi: 0.75, tRadius: 80000,
  lookAt: new THREE.Vector3(0, 0, 0),
  tLookAt: new THREE.Vector3(0, 0, 0),

  focusOn(poiId) {
    const obj = galacticPOIObjects[poiId];
    if (!obj) return;
    const pos = obj.group.position;
    this.tLookAt.copy(pos);
    this.tRadius = clamp(obj.data.scale * 5, 500, 40000);
    if (poiId === 'sol') this.tRadius = 350; // closer look for mini solar system
    state.selectedPOI = poiId;
    updateGalacticInfoCard(obj.data);
    document.getElementById('hud-target').textContent = obj.data.name.toUpperCase();
    document.getElementById('hud-mode').textContent = 'ORBIT';
  },

  focusOverview() {
    this.tLookAt.set(0, 0, 0);
    this.tRadius = 80000;
    this.tPhi = 0.75;
    this.tTheta = -0.3;
    state.selectedPOI = null;
    document.getElementById('hud-mode').textContent = 'FREE';
    document.getElementById('hud-target').textContent = '—';
    hideInfoCard();
  },

  update(dt) {
    if (state.cameraMode === 'COCKPIT') return;
    const ease = Math.min(1, dt * 2.5);
    this.theta = lerp(this.theta, this.tTheta, ease);
    this.phi = lerp(this.phi, this.tPhi, ease);
    this.radius = lerp(this.radius, this.tRadius, ease);
    this.lookAt.lerp(this.tLookAt, ease);

    const sinPhi = Math.sin(this.phi);
    const x = this.lookAt.x + this.radius * sinPhi * Math.cos(this.theta);
    const y = this.lookAt.y + this.radius * Math.cos(this.phi);
    const z = this.lookAt.z + this.radius * sinPhi * Math.sin(this.theta);
    galacticCamera.position.set(x, y, z);
    galacticCamera.lookAt(this.lookAt);
  }
};


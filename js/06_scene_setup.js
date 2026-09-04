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
renderer.autoClear = false;

// Solar scene (existing)
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 80, 180);

// Galactic scene (new)
var galacticScene = new THREE.Scene();
var galacticCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 50, 20000000);
galacticCamera.position.set(SUN_GAL.x, 600000, SUN_GAL.z + 400000);
galacticCamera.lookAt(0, 0, 0);

// Raycaster for click selection
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var clickables = []; // solar meshes

// ============================================================
// CAMERA CONTROLLER — SOLAR
// ============================================================
var cam = {
  theta: 0.5, phi: 1.1, radius: 240,
  tTheta: 0.5, tPhi: 1.1, tRadius: 240,
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
    this.tRadius = clamp(r * 6, 4, 400);
    state.selectedBody = bodyId;
    updateHUD();
    updateInfoCard(obj.data);
    if (state.cameraMode === 'COCKPIT') {
      state.cockpitTarget = bodyId;
    } else {
      state.cameraMode = 'ORBIT';
    }
  },

  focusOverview() {
    if (state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK') { return; }
    this.tLookAt.set(0, 0, 0);
    this.tRadius = 260;
    this.tPhi = 1.1;
    this.tTheta = 0.4;
    state.selectedBody = null;
    state.cameraMode = 'FREE';
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
  theta: -0.3, phi: 0.75, radius: 1000000,
  tTheta: -0.3, tPhi: 0.75, tRadius: 1000000,
  lookAt: new THREE.Vector3(0, 0, 0),
  tLookAt: new THREE.Vector3(0, 0, 0),

  focusOn(poiId) {
    const obj = galacticPOIObjects[poiId];
    if (!obj) return;
    const pos = obj.group.position;
    this.tLookAt.copy(pos);
    this.tRadius = clamp(obj.data.scale * 3.5, 500, 60000);
    state.selectedPOI = poiId;
    updateGalacticInfoCard(obj.data);
    document.getElementById('hud-target').textContent = obj.data.name.toUpperCase();
  },

  focusOverview() {
    this.tLookAt.set(0, 0, 0);
    this.tRadius = 1000000;
    this.tPhi = 0.75;
    this.tTheta = -0.3;
    state.selectedPOI = null;
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


// ============================================================
// POST-PROCESSING PIPELINE
// Optimisé pour Intel UHD 620 : bloom à 1/4 résolution,
// un seul ShaderPass custom (aberration + vignette).
// Total : 3 passes GPU (RenderPass + BloomPass + ShaderPass).
// ============================================================

// ── ShaderPass custom : Aberration Chromatique + Vignette ──
// Un seul fragment shader = une seule passe GPU supplémentaire.
var ChromaVignetteShader = {
  uniforms: {
    'tDiffuse':       { value: null },
    'u_chromaAmount': { value: 0.0020 }, // Légèrement réduit pour être très propre
    'u_vignetteAmt':  { value: 0.30 },   // Vignette douce sans bandes
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float u_chromaAmount;
    uniform float u_vignetteAmt;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 delta  = vUv - center;
      float dist2 = dot(delta, delta);

      float aberr = u_chromaAmount * dist2 * 4.0;
      vec2 rOffset = center + delta * (1.0 + aberr);
      vec2 bOffset = center + delta * (1.0 - aberr);

      float r = texture2D(tDiffuse, rOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, bOffset).b;

      // Vignette fluide
      float vignette = 1.0 - smoothstep(0.4, 0.9, dist2 * 2.0) * u_vignetteAmt;

      gl_FragColor = vec4(vec3(r, g, b) * vignette, 1.0);
    }
  `
};

// ── Bloom Pass — UHD 620 : résolution 1/4, threshold élevé ──
var bloomResX = Math.floor(window.innerWidth  / 4);
var bloomResY = Math.floor(window.innerHeight / 4);

var composer   = new THREE.EffectComposer(renderer);
var renderPass = new THREE.RenderPass(scene, camera); // scène/cam changées dynamiquement dans 12_main.js
var bloomPass  = new THREE.UnrealBloomPass(
  new THREE.Vector2(bloomResX, bloomResY),
  0.40,   // strength  — halo subtil sans brûler le cœur de galaxie
  0.40,   // radius    — diffusion modérée
  0.88    // threshold — ne bloom que les éléments très lumineux
);
var chromaPass = new THREE.ShaderPass(ChromaVignetteShader);
chromaPass.renderToScreen = true; // dernière passe → sortie directe framebuffer

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(chromaPass);




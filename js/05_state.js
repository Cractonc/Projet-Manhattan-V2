'use strict';

var asteroidBelt = null;

// ============================================================
// SPEED TIERS
// ============================================================
var SPEED_TIERS = {
  IMPULSE: 8,
  SUBLIGHT: 100,
  WARP_1: 1000,
  WARP_5: 10000,
  WARP_MAX: 40000
};
var speedTierList = ['IMPULSE', 'SUBLIGHT', 'WARP_1', 'WARP_5', 'WARP_MAX'];

// ============================================================
// APP STATE
// ============================================================
var state = {
  time: 0,
  currentSpeedTier: 'IMPULSE',
  timeScale: 0.8,
  solarSpeed: 0.1,
  galacticSpeed: 5.0,
  paused: false,
  selectedBody: null,
  showOrbits: true,
  showLabels: true,
  showAsteroids: true,
  cameraMode: 'FREE',    // 'FREE' | 'ORBIT' | 'CINEMATIC' | 'COCKPIT' | 'WALK'
  cinematicIndex: 0,
  cinematicTimer: 0,
  cinematicDuration: 7,
  // Cockpit state
  cockpitEnabled: false,
  cockpitTarget: null,
  cockpitCameraFree: false,
  cockpitAutoNav: false,
  cockpitAutoTimer: 0,
  // Walk mode state
  walkMode: false,          // true = FPS walk, false = piloting
  currentRoom: 'cockpit',   // 'cockpit' | 'corridor' | 'observatory' | 'galaxymap'
  prevCameraMode: 'FREE',
  observing: false,         // Telescope mode
  observingTarget: null,
  // Galactic state
  currentSystem: 'sol',
  scaleLevel: 'GALACTIC',   // 'SOLAR' | 'GALACTIC'
  selectedPOI: null,
  // Warp state
  warp: {
    active: false,
    type: 'NONE',        // 'NONE' | 'TO_GALAXY' | 'TO_SOLAR' | 'TO_POI'
    phase: 'NONE',       // 'NONE' | 'CHARGING' | 'TRAVELING' | 'ARRIVING'
    progress: 0,
    totalDuration: 5,
    phaseDuration: 0,
    phaseTime: 0,
    targetPOI: null,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
  }
};

// Planet instances
var planetObjects = {};
var orbitLines = [];
var labelEls = [];

// Galactic instances
var galacticPOIObjects = {};
var galacticClickables = [];
var galacticLabelEls = [];

var cinematicSequence = [];


// ============================================================
// COCKPIT MODE
// ============================================================

var shipRig = null;
var cockpitGroup = null;
var cockpitCamera = null;
var cockpitLight = null;
var shipInterior = null;
var holoMapGroup = null;
var teleGroup = null;
var tTubeGroup = null;

var cockpitKeys = {
  throttleUp: false, throttleDown: false,
  strafeLeft: false, strafeRight: false,
  strafeUp: false, strafeDown: false,
  yawLeft: false, yawRight: false,
  pitchUp: false, pitchDown: false,
  rollLeft: false, rollRight: false,
  boost: false,
  mouseDX: 0, mouseDY: 0,
};

// Physical key → held action mapping (works on both AZERTY and QWERTY)
var cockpitCodeToHeld = {
  'KeyA': 'strafeLeft',     // Q on AZERTY, A on QWERTY
  'KeyD': 'strafeRight',
  'Space': 'strafeUp',
  'ControlLeft': 'strafeDown', 'ControlRight': 'strafeDown',
  'KeyQ': 'rollLeft',        // A on AZERTY, Q on QWERTY
  'KeyE': 'rollRight',
  'ArrowUp': 'pitchUp', 'ArrowDown': 'pitchDown',
  'ArrowLeft': 'yawLeft', 'ArrowRight': 'yawRight',
  'ShiftLeft': 'boost', 'ShiftRight': 'boost',
};

var ship = {
  position: new THREE.Vector3(0, 5, 30),
  quaternion: new THREE.Quaternion(),
  speed: 0,
  maxSpeed: 8,            // solar: 8 units/s cruise
  boostMultiplier: 3,
  throttlePercent: 0,     // 0-100 progressive
  thrust: 0,
  targetThrust: 0,
  boostActive: false,
  boostHeat: 0,
  boostMaxHeat: 100,
  boostCooldown: false,
  boostCooldownTimer: 0,
  strafeX: 0,
  strafeY: 0,
  yawRate: 0, pitchRate: 0, rollRate: 0,
  shakeAmt: 0,
  shakeOff: new THREE.Vector3(),
  coupledRoll: 0,
  freeLookYaw: 0,
  freeLookPitch: 0,
};

// Walk mode (FPS movement inside ship)
var walker = {
  position: new THREE.Vector3(0, 0, 0.2),  // Position inside ship (local to shipRig)
  yaw: Math.PI,        // Looking direction (horizontal)
  pitch: 0,            // Looking direction (vertical)
  floor: 0,            // 0 = Deck 1, 1 = Observatory
  targetFloor: 0,
  baseY: 0.22,         // Eye height (Deck 1 floor is -0.68 + 0.9 = 0.22)
  speed: 1.5,          // Walk speed
  radius: 0.15,        // Collision radius
  mouseSensitivity: 0.003,
};

var walkKeys = {
  forward: false, backward: false,
  left: false, right: false,
  interact: false,
  mouseDX: 0, mouseDY: 0,
};

// ── Ship collision system (AABB boxes in ship-local space) ──
var shipWallsLevel0 = [];
var shipWallsLevel1 = [];
var shipWallsLevelMinus1 = [];

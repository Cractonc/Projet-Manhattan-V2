'use strict';

var asteroidBelt = null;
var mineableObjects = []; // Etape 2.4 : Minage Thermique

// ============================================================
// SPEED TIERS (SOLAR VS GALACTIC)
// ============================================================
var SPEED_TIERS_SOLAR = {
  IMPULSE: 1.2,    // Manœuvres précises, minage astéroïdes, approche (1.2 u/s)
  SUBLIGHT: 4,     // Croisière locale inter-lunes et planétaire (4 u/s)
  WARP_1: 10,      // Transit planétaire proche (10 u/s)
  WARP_5: 20,      // Transit vers les géantes gazeuses (20 u/s)
  WARP_MAX: 35     // Vitesse maximale interplanétaire (35 u/s)
};

var SPEED_TIERS_GALACTIC = {
  IMPULSE: 80,     // Approche et contemplation de systèmes (80 ly/s)
  SUBLIGHT: 350,   // Croisière locale vers systèmes voisins (350 ly/s)
  WARP_1: 1200,    // Transit de bras spiral (1 200 ly/s)
  WARP_5: 2800,    // Croisière interstellaire longue distance (2 800 ly/s)
  WARP_MAX: 5500   // Pleine puissance (~2 min pour traverser la galaxie) (5 500 ly/s)
};

var SPEED_TIERS = SPEED_TIERS_SOLAR;
var speedTierList = ['IMPULSE', 'SUBLIGHT', 'WARP_1', 'WARP_5', 'WARP_MAX'];

// ============================================================
// APP STATE
// ============================================================
var state = {
  time: 0,
  currentSpeedTier: 'IMPULSE',
  timeScale: 0.2,
  solarSpeed: 0.2,
  galacticSpeed: 2.0,
  paused: false,
  selectedBody: null,
  showOrbits: true,
  showLabels: true,
  showAsteroids: true,
  cameraMode: 'FREE',    // 'FREE' | 'ORBIT' | 'CINEMATIC' | 'COCKPIT' | 'WALK' | 'ASTROMETRY'
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
  currentRoom: 'cockpit',   // 'cockpit' | 'corridor' | 'observatory' | 'galaxymap' | 'quarters' | 'engineering' | 'elevator'
  walkerPos: null,
  prevCameraMode: 'FREE',
  observing: false,         // Telescope mode
  observingTarget: null,
  // Galactic state
  currentSystem: 'sol',
  scaleLevel: 'GALACTIC',   // 'SOLAR' | 'GALACTIC'
  selectedPOI: null,
  shipHeat: 0,              // Étape 2.4: Minage thermique (0-100)
  laserCooldown: 0,         // Étape 2.4: Cooldown en secondes (si > 0, tir impossible)
  laserHideTimer: 0,        // Décompte de 5s pour masquer la jauge une fois rechargée
  // Player state
  player: {
    credits: 0,
    inventory: [],
    activeQuests: [],
    discoveredPOIs: ['sol'],
    activeQuestId: (typeof QUESTS !== 'undefined' && QUESTS.length > 0) ? QUESTS[0].id : 'quest_orion'
  },
  // Ship coordinates (par défaut orbite Terre à ~24 u / Mars à ~33 u)
  shipPosition: new THREE.Vector3(0, 3, 27),
  shipRotation: new THREE.Quaternion(),
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

// ============================================================
// SAVE / LOAD SYSTEM
// ============================================================
function mergeState(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (target[key] !== undefined && target[key] !== null) {
        if (target[key] instanceof THREE.Vector3 && source[key]) {
          const x = Number(source[key].x) || 0;
          const y = Number(source[key].y) || 0;
          const z = Number(source[key].z) || 0;
          target[key].set(x, y, z);
        } else if (target[key] instanceof THREE.Quaternion && source[key]) {
          const x = Number(source[key]._x !== undefined ? source[key]._x : source[key].x) || 0;
          const y = Number(source[key]._y !== undefined ? source[key]._y : source[key].y) || 0;
          const z = Number(source[key]._z !== undefined ? source[key]._z : source[key].z) || 0;
          let w = Number(source[key]._w !== undefined ? source[key]._w : (source[key].w !== undefined ? source[key].w : 1));
          if (isNaN(w)) w = 1;
          target[key].set(x, y, z, w);
        } else if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
          mergeState(target[key], source[key]);
        } else if (typeof target[key] === 'number') {
          const n = Number(source[key]);
          target[key] = isNaN(n) ? target[key] : n;
        } else {
          target[key] = source[key];
        }
      } else {
        target[key] = source[key];
      }
    }
  }
}

function saveGame() {
  try {
    if (typeof walker !== 'undefined' && walker.position) {
      state.walkerPos = {
        x: walker.position.x,
        y: walker.baseY,
        z: walker.position.z,
        floor: walker.floor,
        yaw: walker.yaw,
        pitch: walker.pitch
      };
    }
    localStorage.setItem('milkyWaySave', JSON.stringify(state));
    console.log('Game saved automatically.');
  } catch (e) {
    console.warn('Failed to save game', e);
  }
}

function loadGame() {
  try {
    const saveStr = localStorage.getItem('milkyWaySave');
    if (saveStr) {
      const parsed = JSON.parse(saveStr);
      mergeState(state, parsed);
      
      // Sync ship object with loaded state if it exists
      if (typeof ship !== 'undefined' && state.shipPosition && state.shipRotation) {
        // Spécificité système solaire : assainir les coordonnées résiduelles galactiques (> 1500 u) ou trop proches du soleil (< 22 u)
        if (state.scaleLevel === 'SOLAR' && (state.shipPosition.length() > 1500 || state.shipPosition.length() < 22)) {
          state.shipPosition.set(0, 3, 27);
        }
        ship.position.copy(state.shipPosition);
        ship.quaternion.copy(state.shipRotation);
      }

      // Sync walker state if it exists
      if (typeof walker !== 'undefined' && state.walkerPos) {
        walker.position.set(state.walkerPos.x || 0, 0, state.walkerPos.z !== undefined ? state.walkerPos.z : 0.2);
        walker.floor = state.walkerPos.floor || 0;
        walker.targetFloor = walker.floor;
        walker.baseY = state.walkerPos.y !== undefined ? state.walkerPos.y : (walker.floor === 0 ? 0.22 : (walker.floor === 1 ? 3.40 : -2.91));
        walker.yaw = state.walkerPos.yaw !== undefined ? state.walkerPos.yaw : Math.PI;
        walker.pitch = state.walkerPos.pitch || 0;
      }

      // Ensure quest and codex state are valid
      if (!state.player.activeQuestId && typeof QUESTS !== 'undefined' && QUESTS.length > 0) {
        state.player.activeQuestId = QUESTS[0].id;
      }
      if (!Array.isArray(state.player.discoveredPOIs)) {
        state.player.discoveredPOIs = [];
      }
      if (!state.player.discoveredPOIs.includes('sol')) {
        state.player.discoveredPOIs.push('sol');
      }
      if (typeof state.player.credits !== 'number') {
        state.player.credits = 0;
      }
      
      console.log('Game loaded from LocalStorage.');
    }
  } catch (e) {
    console.warn('Failed to load game', e);
  }
}

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
  scanHeld: false,  // Étape 2.3 : touche R pour scanner
  fireLaser: false, // Étape 2.4 : Minage thermique
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
  'KeyM': 'fireLaser'
};

var ship = {
  position: new THREE.Vector3(0, 3, 27),
  quaternion: new THREE.Quaternion(),
  speed: 0,
  maxSpeed: 8,            // solar: 8 units/s cruise
  boostMultiplier: 2.0,
  throttlePercent: 0,     // 0-100 progressive
  reverseEngaged: false,
  reversePercent: 0,
  emergencyBraking: false,
  isAutoLeveling: false,
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
  mouseSensitivity: 0.004,
};

var walkKeys = {
  forward: false, backward: false,
  left: false, right: false,
  sprint: false,
  interact: false,
  mouseDX: 0, mouseDY: 0,
};

// ── Ship collision system (AABB boxes in ship-local space) ──
var shipWallsLevel0 = [];
var shipWallsLevel1 = [];
var shipWallsLevelMinus1 = [];

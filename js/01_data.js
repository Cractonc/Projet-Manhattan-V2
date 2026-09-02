'use strict';

// ============================================================
// CONSTANTS & SCALE
// ============================================================
var AU = 15;
var PLANET_SCALE = 7;
var SUN_RADIUS = 3.2;
var MIN_RADIUS = 0.32;

// Galactic scale: 1 unit = 1 light year
var GAL_RADIUS = 500000;    // galaxy radius in ly
var SUN_GAL = { x: 260000, y: 250, z: 0 }; // Sun position in galactic coords
var GAL_PARTICLE_COUNT = 100000;

// ============================================================
// PLANET DATA
// ============================================================
var BODIES = [
  {
    id: 'mercury', name: 'Mercury', type: 'Terrestrial',
    radius: 0.383, distance: 0.387, period: 0.241, rotPeriod: 58.6,
    tilt: 0.03, dotColor: '#9a8f85',
    colors: { base: [154, 143, 133], dark: [100, 90, 80], light: [190, 182, 175] },
    info: { 'Type': 'Terrestrial', 'Diameter': '4 879 km', 'Distance': '0.39 AU', 'Orbit': '88 days', 'Rotation': '59 days' }
  },
  {
    id: 'venus', name: 'Venus', type: 'Terrestrial',
    radius: 0.949, distance: 0.723, period: 0.615, rotPeriod: -243.0,
    tilt: 177.4, dotColor: '#d4a843',
    colors: { base: [212, 168, 67], dark: [160, 120, 40], light: [232, 200, 120] },
    atmo: { r: 200, g: 168, b: 80, opacity: 0.28, scale: 1.04 },
    info: { 'Type': 'Terrestrial', 'Diameter': '12 104 km', 'Distance': '0.72 AU', 'Orbit': '225 days', 'Rotation': '243 days (retro)' }
  },
  {
    id: 'earth', name: 'Earth', type: 'Terrestrial',
    radius: 1.0, distance: 1.0, period: 1.0, rotPeriod: 1.0,
    tilt: 23.4, dotColor: '#4a8fcc',
    colors: { ocean: [26, 79, 138], land: [55, 110, 55], land2: [90, 130, 60], ice: [220, 235, 245] },
    atmo: { r: 80, g: 140, b: 210, opacity: 0.22, scale: 1.035 },
    moons: [{ name: 'Moon', radius: 0.272, distance: 1.4, period: 0.0748, color: '#888880' }],
    info: { 'Type': 'Terrestrial', 'Diameter': '12 742 km', 'Distance': '1.00 AU', 'Orbit': '365 days', 'Rotation': '24 hours' }
  },
  {
    id: 'mars', name: 'Mars', type: 'Terrestrial',
    radius: 0.532, distance: 1.524, period: 1.881, rotPeriod: 1.026,
    tilt: 25.2, dotColor: '#c1440e',
    colors: { base: [193, 68, 14], dark: [120, 40, 10], light: [220, 100, 50], polar: [220, 225, 230] },
    info: { 'Type': 'Terrestrial', 'Diameter': '6 779 km', 'Distance': '1.52 AU', 'Orbit': '687 days', 'Rotation': '24.6 hours' }
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'Gas Giant',
    radius: 11.21, distance: 5.203, period: 11.86, rotPeriod: 0.414,
    tilt: 3.1, dotColor: '#c9a882',
    colors: { base: [201, 168, 130], band1: [160, 120, 90], band2: [218, 190, 155], spot: [192, 96, 64] },
    moons: [
      { name: 'Io', radius: 0.286, distance: 2.6, period: 0.00485, color: '#c89820' },
      { name: 'Europa', radius: 0.245, distance: 3.5, period: 0.00972, color: '#c0b090' },
      { name: 'Ganymede', radius: 0.413, distance: 4.6, period: 0.0196, color: '#909080' },
      { name: 'Callisto', radius: 0.378, distance: 6.0, period: 0.0457, color: '#706860' },
    ],
    info: { 'Type': 'Gas Giant', 'Diameter': '139 820 km', 'Distance': '5.20 AU', 'Orbit': '11.9 years', 'Rotation': '9.9 hours' }
  },
  {
    id: 'saturn', name: 'Saturn', type: 'Gas Giant',
    radius: 9.45, distance: 9.537, period: 29.46, rotPeriod: 0.444,
    tilt: 26.7, dotColor: '#c8b06a',
    colors: { base: [200, 176, 106], band1: [175, 148, 80], band2: [215, 195, 130] },
    rings: { inner: 1.3, outer: 2.3, r: 200, g: 175, b: 110 },
    moons: [
      { name: 'Titan', radius: 0.404, distance: 8.5, period: 0.0436, color: '#c08828' }
    ],
    info: { 'Type': 'Gas Giant', 'Diameter': '116 460 km', 'Distance': '9.54 AU', 'Orbit': '29.5 years', 'Rotation': '10.7 hours' }
  },
  {
    id: 'uranus', name: 'Uranus', type: 'Ice Giant',
    radius: 4.01, distance: 19.19, period: 84.01, rotPeriod: -0.718,
    tilt: 97.8, dotColor: '#7ab5c8',
    colors: { base: [122, 181, 200], light: [150, 205, 220], dark: [90, 155, 175] },
    rings: { inner: 1.4, outer: 1.65, r: 130, g: 175, b: 190, opacity: 0.3 },
    info: { 'Type': 'Ice Giant', 'Diameter': '50 724 km', 'Distance': '19.2 AU', 'Orbit': '84 years', 'Rotation': '17.2 hours (retro)' }
  },
  {
    id: 'neptune', name: 'Neptune', type: 'Ice Giant',
    radius: 3.88, distance: 30.07, period: 164.8, rotPeriod: 0.671,
    tilt: 28.3, dotColor: '#3050c8',
    colors: { base: [48, 80, 200], light: [80, 110, 220], dark: [30, 55, 160] },
    info: { 'Type': 'Ice Giant', 'Diameter': '49 244 km', 'Distance': '30.1 AU', 'Orbit': '165 years', 'Rotation': '16.1 hours' }
  }
];

var SYSTEMS_DATA = {
  'sol': {
    name: 'Solar System',
    sunColor: null,
    sunRadius: 3.2,
    asteroids: true,
    bodies: BODIES
  },
  'alpha-centauri': {
    name: 'Alpha Centauri',
    sunColor: { r: 255, g: 240, b: 210 },
    sunRadius: 3.5, // G2V star, slightly larger than our Sun in simulation
    asteroids: false,
    bodies: [
      {
        id: 'alpha-cen-b', name: 'Alpha Centauri B', type: 'Orange Dwarf',
        radius: 2.8, distance: 4.5, period: 7.0, rotPeriod: 2.0,
        tilt: 0, dotColor: '#ffaa55',
        colors: { base: [255, 170, 85], dark: [200, 120, 50], light: [255, 200, 120] },
        atmo: { r: 255, g: 170, b: 80, opacity: 0.85, scale: 1.15 },
        info: { 'Type': 'K1V Orange Dwarf', 'Orbit': '~80 years', 'Mass': '~0.90 M☉', 'Feature': 'Primary binary companion' }
      },
      {
        id: 'proxima-star', name: 'Proxima Centauri', type: 'Red Dwarf',
        radius: 1.2, distance: 16.0, period: 35.0, rotPeriod: 5.0,
        tilt: 0, dotColor: '#ff4422',
        colors: { base: [255, 68, 34], dark: [150, 40, 20], light: [255, 120, 80] },
        atmo: { r: 255, g: 60, b: 30, opacity: 0.8, scale: 1.15 },
        info: { 'Type': 'M5.5Ve Red Dwarf', 'Orbit': '~547 000 years', 'Mass': '~0.12 M☉', 'Feature': 'Distant third star' }
      }
    ]
  },
  'sirius': {
    name: 'Sirius',
    sunColor: { r: 210, g: 235, b: 255 },
    sunRadius: 6.5, // Massive glowing star
    asteroids: false,
    bodies: [
      {
        id: 'sirius-b', name: 'Sirius B', type: 'White Dwarf',
        radius: 0.8, distance: 7.5, period: 2.0, rotPeriod: 0.1,
        tilt: 0, dotColor: '#ffffff',
        colors: { base: [240, 248, 255], dark: [200, 210, 230], light: [255, 255, 255] },
        atmo: { r: 220, g: 240, b: 255, opacity: 0.85, scale: 1.15 },
        info: { 'Type': 'White Dwarf', 'Orbit': '50.1 years', 'Mass': '1.02 M☉', 'Feature': 'Extremely dense stellar remnant' }
      }
    ]
  }
};

// ============================================================
// GALACTIC DATA — POINTS OF INTEREST
// ============================================================
// ── GALAXIES HAUTE FIDÉLITÉ (Sélection Finale) ──
var EXTRA_GALAXIES = [
  { id: 'm83-hd', name: 'M83 - Southern Pinwheel', type: 'hd_m83', pos: [-6000000, -1000000, 1000000], color: '#ffffff', scale: 1000000, opacity: 0.88, tilt: 0 },
  { id: 'm82-hd', name: 'M82 - Cigar Galaxy', type: 'hd_m82', pos: [1500000, 5500000, -1500000], color: '#ffffff', scale: 650000, opacity: 0.70, tilt: 0.8 },
  { id: 'cena-hd', name: 'Centaurus A', type: 'hd_cena', pos: [-4500000, 3500000, 4000000], color: '#ffffff', scale: 950000, opacity: 0.85, tilt: 0 },
  { id: '7331-hd', name: 'NGC 7331', type: 'hd_7331', pos: [5500000, -3000000, 3000000], color: '#ffffff', scale: 700000, opacity: 0.65, tilt: 1.2 },
  { id: '6946-hd', name: 'NGC 6946 - Fireworks', type: 'hd_6946', pos: [-2000000, -5000000, -4000000], color: '#ffffff', scale: 600000, opacity: 0.60, tilt: 0 },
  // Lot 4 : Expansion Interaction & JWST Deep Field
  { id: 'm51-hd', name: 'M51 - Whirlpool', type: 'hd_m51', pos: [4000000, 4000000, -5000000], color: '#ffffff', scale: 1050000, opacity: 0.88, tilt: 0.1 },
  { id: 'antennae-hd', name: 'Antennae Galaxies', type: 'hd_antennae', pos: [-6500000, 2000000, -2500000], color: '#ffffff', scale: 680000, opacity: 0.65, tilt: 0.5 },
  { id: 'quintet-hd', name: 'Stephan\'s Quintet', type: 'hd_quintet', pos: [-4500000, -2500000, 5500000], color: '#ffffff', scale: 550000, opacity: 0.55, tilt: 0 },
  { id: 'ngc1365-hd', name: 'NGC 1365', type: 'hd_ngc1365', pos: [1500000, 4500000, 6000000], color: '#ffffff', scale: 650000, opacity: 0.65, tilt: 0.7 },
  // Lot 5 : Exotic Batch & Final Selection
  { id: 'blackeye-hd', name: 'NGC 4826 - Black Eye', type: 'hd_blackeye', pos: [-2500000, 6000000, -3500000], color: '#ffffff', scale: 600000, opacity: 0.60, tilt: 0.3 },
  { id: 'sculptor-hd', name: 'NGC 253 - Sculptor', type: 'hd_sculptor', pos: [-5500000, -4500000, 2500000], color: '#ffffff', scale: 1000000, opacity: 0.88, tilt: 1.1 },
  { id: 'ngc1300-hd', name: 'NGC 1300', type: 'hd_ngc1300', pos: [2500000, -1500000, -6500000], color: '#ffffff', scale: 620000, opacity: 0.60, tilt: 0.2 },
  { id: 'ngc1316-hd', name: 'NGC 1316 - Fornax A', type: 'hd_ngc1316', pos: [4500000, -3500000, -4000000], color: '#ffffff', scale: 380000, opacity: 0.42, tilt: 0 },
  // Lot 6 : Diversification Finale
  { id: '3627-hd', name: 'NGC 3627', type: 'hd_3627', pos: [6500000, 2500000, 3500000], color: '#ffffff', scale: 650000, opacity: 0.65, tilt: 0.6 },
  { id: 'mist-hd', name: 'Morning Mist', type: 'hd_mist', pos: [-3500000, 5500000, 5500000], color: '#ffffff', scale: 300000, opacity: 0.30, tilt: 0 },
  { id: 'm87-hd', name: 'M87 - Virgo A', type: 'hd_m87', pos: [1500000, -5500000, 4500000], color: '#ffffff', scale: 400000, opacity: 0.42, tilt: 0.8 },
  { id: 'ngc4565-hd', name: 'NGC 4565 - Needle', type: 'hd_ngc4565', pos: [-6000000, 5000000, -5000000], color: '#ffffff', scale: 340000, opacity: 0.35, tilt: 0.1 },
  // Lot 7 : La Collection Finale (21 HD restants)
  { id: 'sombrero-hd', name: 'M104 - Sombrero', type: 'hd_sombrero', pos: [2500000, 6500000, 1500000], color: '#ffffff', scale: 400000, opacity: 0.45, tilt: 1.5 },
  { id: '1097-hd', name: 'NGC 1097', type: 'hd_1097', pos: [-1500000, -5500000, -6500000], color: '#ffffff', scale: 680000, opacity: 0.65, tilt: 0.4 },
  { id: 'arp273-hd', name: 'Arp 273 - Rose', type: 'hd_arp273', pos: [5500000, 5000000, 2500000], color: '#ffffff', scale: 300000, opacity: 0.32, tilt: 0 },
  { id: 'ngc4631-hd', name: 'NGC 4631 - Whale', type: 'hd_ngc4631', pos: [-6500000, -1500000, 4500000], color: '#ffffff', scale: 350000, opacity: 0.38, tilt: 1.25 },
  // Lot 8 : Spirales Classiques (Balance Panorama)
  { id: 'm31-hd', name: 'M31 - Andromeda', type: 'hd_m31', pos: [-5500000, 4500000, -4500000], color: '#ffffff', scale: 1400000, opacity: 0.90, tilt: 1.3 },
  { id: 'm101-hd', name: 'M101 - Pinwheel', type: 'hd_m101', pos: [5500000, -5500000, 4500000], color: '#ffffff', scale: 750000, opacity: 0.70, tilt: 0.2 },
  { id: 'm81-hd', name: 'M81 - Bode\'s Galaxy', type: 'hd_m81', pos: [4500000, 5500000, 5500000], color: '#ffffff', scale: 720000, opacity: 0.70, tilt: 1.1 },
  { id: 'm63-hd', name: 'M63 - Sunflower', type: 'hd_m63', pos: [-4500000, -5500000, -6500000], color: '#ffffff', scale: 380000, opacity: 0.38, tilt: 0.6 },
  { id: 'm74-hd', name: 'M74 - Phantom', type: 'hd_m74', pos: [6500000, -3500000, -2500000], color: '#ffffff', scale: 420000, opacity: 0.40, tilt: 0.1 }
];

var GALACTIC_POI = [
  {
    id: 'sgr-a', name: 'Sagittarius A*', type: 'Supermassive Black Hole', tier: 1,
    pos: [0, 0, 0], vType: 'blackhole', scale: 21000, dotColor: '#ff8800',
    info: { 'Type': 'Supermassive Black Hole', 'Mass': '~4 million M☉', 'Distance': '~26 000 ly from Sol', 'Feature': 'Galactic center' }
  },
  {
    id: 'orion-neb', name: 'Orion Nebula', type: 'Emission Nebula', tier: 2,
    pos: [237500, 2000, -32500], vType: 'nebula', scale: 5000, dotColor: '#e06090',
    colors: [230, 90, 140, 180, 60, 200],
    info: { 'Type': 'Emission Nebula', 'Catalog': 'M42 / NGC 1976', 'Distance': '~1 344 ly', 'Diameter': '~24 ly', 'Feature': 'Closest massive star nursery' }
  },
  {
    id: 'eagle-neb', name: 'Eagle Nebula', type: 'Pillars of Creation', tier: 2,
    pos: [132000, 2000, 90000], vType: 'nebula', scale: 6500, dotColor: '#c08040',
    colors: [200, 130, 60, 140, 80, 160],
    info: { 'Type': 'H II Region', 'Catalog': 'M16 / NGC 6611', 'Distance': '~7 000 ly', 'Feature': 'Pillars of Creation', 'Diameter': '~70 × 55 ly' }
  },
  {
    id: 'crab-neb', name: 'Crab Nebula', type: 'Supernova Remnant', tier: 3,
    pos: [210000, -1500, 65000], vType: 'supernova', scale: 4000, dotColor: '#40a0ff',
    info: { 'Type': 'Supernova Remnant', 'Catalog': 'M1 / NGC 1952', 'Distance': '~6 500 ly', 'Diameter': '~11 ly', 'Supernova': 'SN 1054, observed in 1054 AD' }
  },
  {
    id: 'cygnus-x1', name: 'Cygnus X-1', type: 'Stellar Black Hole', tier: 2,
    pos: [285000, 2000, 55000], vType: 'blackhole', scale: 3500, dotColor: '#ff6600',
    info: { 'Type': 'Stellar Black Hole', 'Mass': '~21.2 M☉', 'Distance': '~6 070 ly', 'Companion': 'HDE 226868 (blue supergiant)', 'Feature': 'First widely accepted BH candidate' }
  },
  {
    id: 'eta-car', name: 'Eta Carinae', type: 'Hypergiant System', tier: 2,
    pos: [104000, 1500, 140000], vType: 'star', scale: 4000, dotColor: '#ffe040',
    starColor: [255, 230, 100],
    info: { 'Type': 'Luminous Blue Variable', 'Mass': '~100-120 M☉', 'Distance': '~7 500 ly', 'Luminosity': '~5 million L☉', 'Feature': 'Potential supernova progenitor' }
  },
  {
    id: 'ring-neb', name: 'Ring Nebula', type: 'Planetary Nebula', tier: 3,
    pos: [224000, 2000, -30000], vType: 'ring', scale: 3000, dotColor: '#60c0a0',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'M57 / NGC 6720', 'Distance': '~2 283 ly', 'Diameter': '~1.3 ly', 'Central star': 'White dwarf, 120 000 K' }
  },
  {
    id: 'pleiades', name: 'Pleiades', type: 'Open Cluster', tier: 2,
    pos: [242000, 3000, -24000], vType: 'cluster', scale: 3000, dotColor: '#80b0ff',
    info: { 'Type': 'Open Star Cluster', 'Catalog': 'M45', 'Distance': '~444 ly', 'Stars': '~1 000 (main ~9 visible)', 'Age': '~100 million years' }
  },
  {
    id: 'rosette-neb', name: 'Rosette Nebula', type: 'H II Region', tier: 3,
    pos: [135000, -1500, 210000], vType: 'nebula', scale: 6000, dotColor: '#e04060',
    colors: [230, 60, 90, 200, 40, 130],
    info: { 'Type': 'H II Region', 'Catalog': 'NGC 2237-46', 'Distance': '~5 200 ly', 'Diameter': '~130 ly', 'Feature': 'Active star-forming region' }
  },
  {
    id: 'vela-pulsar', name: 'Vela Pulsar', type: 'Supernova Remnant', tier: 3,
    pos: [238400, -2500, -32000], vType: 'supernova', scale: 3500, dotColor: '#40e0ff',
    info: { 'Type': 'Pulsar / SNR', 'Distance': '~936 ly', 'Spin': '~11.2 rev/s', 'Age': '~11 000 years', 'Feature': 'One of the nearest pulsars' }
  },
  {
    id: 'betelgeuse', name: 'Betelgeuse', type: 'Red Supergiant', tier: 3,
    pos: [240000, -2000, -22000], vType: 'star', scale: 2500, dotColor: '#ff4020',
    starColor: [255, 80, 30],
    info: { 'Type': 'Red Supergiant', 'Distance': '~700 ly', 'Diameter': '~1 400 × Sun', 'Luminosity': '~126 000 L☉', 'Feature': 'Will explode as supernova' }
  },
  {
    id: 'carina-neb', name: 'Carina Nebula', type: 'Giant Emission Nebula', tier: 1,
    pos: [118000, 0, 122000], vType: 'nebula', scale: 8000, dotColor: '#ff9060',
    colors: [255, 140, 80, 200, 80, 180],
    info: { 'Type': 'Emission Nebula', 'Catalog': 'NGC 3372', 'Distance': '~7 600 ly', 'Diameter': '~300 ly', 'Feature': 'Contains Eta Carinae & Keyhole' }
  },
  {
    id: 'lagoon-neb', name: 'Lagoon Nebula', type: 'Emission Nebula', tier: 3,
    pos: [45000, -1000, 184000], vType: 'nebula', scale: 5000, dotColor: '#e07080',
    colors: [230, 100, 120, 160, 80, 180],
    info: { 'Type': 'H II Region', 'Catalog': 'M8 / NGC 6523', 'Distance': '~5 000 ly', 'Diameter': '~110 × 50 ly', 'Feature': 'Visible to the naked eye' }
  },
  {
    id: 'sol', name: 'Solar System', type: 'Our Star System', tier: 2,
    pos: [SUN_GAL.x, SUN_GAL.y, SUN_GAL.z], vType: 'system', scale: 4000, dotColor: '#ffcc44',
    info: { 'Type': 'G2V Main Sequence Star', 'Position': 'Orion-Cygnus Arm', 'Distance from center': '~26 000 ly', 'Orbital period': '~225 million years', 'Neighborhood': 'Proxima (4.2 ly), Sirius (8.6 ly)' }
  },
  {
    id: 'alpha-centauri', name: 'Alpha Centauri', type: 'Star System', tier: 2,
    pos: [SUN_GAL.x + 11500, SUN_GAL.y + 1200, SUN_GAL.z - 7500], vType: 'system', scale: 3500, dotColor: '#ffddaa',
    info: { 'Type': 'Triple Star System', 'Distance': '~4.37 ly from Sol', 'Stars': 'Rigil Kentaurus, Toliman, Proxima', 'Feature': 'Closest star system to Earth' }
  },
  {
    id: 'sirius', name: 'Sirius', type: 'Binary Star System', tier: 2,
    pos: [SUN_GAL.x - 6000, SUN_GAL.y + 2000, SUN_GAL.z + 5000], vType: 'system', scale: 4500, dotColor: '#bbddff',
    info: { 'Type': 'A-type Main-Sequence', 'Distance': '~8.6 ly from Sol', 'Companion': 'Sirius B (White Dwarf)', 'Feature': 'Brightest star in the sky' }
  },
  // ── Lot 2 : Expansion galactique (~13 nouveaux POI) ──
  {
    id: 'omega-centauri', name: 'Omega Centauri', type: 'Globular Cluster', tier: 2,
    pos: [5000, 3000, -200000], vType: 'cluster', scale: 5000, dotColor: '#aaccff',
    info: { 'Type': 'Globular Cluster', 'Catalog': 'NGC 5139', 'Distance': '~15 800 ly', 'Stars': '~10 million', 'Feature': 'Largest known globular cluster in MW' }
  },
  {
    id: 'tarantula-neb', name: 'Tarantula Nebula', type: 'Giant H II Region', tier: 2,
    pos: [25000, -2000, 138000], vType: 'nebula', scale: 7000, dotColor: '#ff70a0',
    colors: [255, 110, 160, 200, 60, 140],
    info: { 'Type': 'H II Region (LMC)', 'Catalog': 'NGC 2070', 'Distance': '~160 000 ly', 'Diameter': '~600 ly', 'Feature': 'Most active star-forming region in Local Group' }
  },
  {
    id: 'pillars-neb', name: 'Trifid Nebula', type: 'Emission/Reflection', tier: 3,
    pos: [147000, 1000, 29000], vType: 'nebula', scale: 4000, dotColor: '#cc6688',
    colors: [200, 100, 130, 100, 80, 200],
    info: { 'Type': 'Emission + Reflection Nebula', 'Catalog': 'M20 / NGC 6514', 'Distance': '~5 200 ly', 'Feature': 'Combination of three nebula types' }
  },
  {
    id: 'helix-neb', name: 'Helix Nebula', type: 'Planetary Nebula', tier: 3,
    pos: [252000, 800, -12000], vType: 'ring', scale: 2800, dotColor: '#40ccaa',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'NGC 7293', 'Distance': '~650 ly', 'Diameter': '~5.7 ly', 'Feature': 'Eye of God — closest large PN' }
  },
  {
    id: 'horsehead-neb', name: 'Horsehead Nebula', type: 'Dark Nebula', tier: 3,
    pos: [234000, 3000, -35000], vType: 'darkneb', scale: 4000, dotColor: '#884455',
    colors: [140, 70, 85, 80, 40, 60],
    info: { 'Type': 'Dark Nebula', 'Catalog': 'Barnard 33', 'Distance': '~1 375 ly', 'Feature': 'Iconic silhouette against IC 434' }
  },
  {
    id: 'ant-neb', name: 'Ant Nebula', type: 'Bipolar PN', tier: 4,
    pos: [-86000, -1500, -158000], vType: 'bipolar', scale: 3800, dotColor: '#ee8855',
    colors: [240, 140, 85, 180, 60, 100],
    info: { 'Type': 'Bipolar Planetary Nebula', 'Catalog': 'Mz 3', 'Distance': '~8 000 ly', 'Feature': 'Symmetrical jets from dying star' }
  },
  {
    id: 'cat-eye-neb', name: 'Cat\'s Eye Nebula', type: 'Planetary Nebula', tier: 4,
    pos: [217000, 1500, -125000], vType: 'ring', scale: 4000, dotColor: '#55ccaa',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'NGC 6543', 'Distance': '~3 300 ly', 'Feature': 'Complex concentric gas shells' }
  },
  {
    id: 'westerlund-2', name: 'Westerlund 2', type: 'Young Cluster', tier: 3,
    pos: [20000, -1000, -148000], vType: 'cluster', scale: 3500, dotColor: '#88aaff',
    info: { 'Type': 'Young Super Star Cluster', 'Distance': '~20 000 ly', 'Age': '~1–2 million years', 'Feature': 'Contains some of the hottest, brightest stars known' }
  },
  {
    id: 'cassiopeia-a', name: 'Cassiopeia A', type: 'Supernova Remnant', tier: 3,
    pos: [-85000, 2000, 288000], vType: 'supernova', scale: 4200, dotColor: '#55bbff',
    info: { 'Type': 'Supernova Remnant', 'Distance': '~11 000 ly', 'Diameter': '~16 ly', 'Supernova': '~1680 AD', 'Feature': 'Strongest extrasolar radio source' }
  },
  {
    id: 'ngc-3603', name: 'NGC 3603', type: 'Starburst Cluster', tier: 4,
    pos: [97000, 1000, -21000], vType: 'cluster', scale: 4000, dotColor: '#ddcc88',
    info: { 'Type': 'Giant H II Region / Starburst', 'Distance': '~20 000 ly', 'Feature': 'Densest concentration of massive stars in MW' }
  },
  {
    id: 'witch-head', name: 'Witch Head Nebula', type: 'Reflection Nebula', tier: 4,
    pos: [245000, -2500, -42000], vType: 'reflection', scale: 4200, dotColor: '#6688cc',
    colors: [100, 140, 220, 50, 70, 160],
    info: { 'Type': 'Reflection Nebula', 'Catalog': 'IC 2118', 'Distance': '~900 ly', 'Feature': 'Illuminated by Rigel' }
  },
  {
    id: 'sgr-b2', name: 'Sagittarius B2', type: 'Molecular Cloud', tier: 4,
    pos: [18000, -2000, 4000], vType: 'darkneb', scale: 6000, dotColor: '#ffaa44',
    colors: [255, 185, 85, 170, 75, 20],
    info: { 'Type': 'Giant Molecular Cloud', 'Distance': '~390 ly from Sgr A*', 'Mass': '~3 million M☉', 'Feature': 'Contains complex organic molecules' }
  },
  {
    id: 'rigel', name: 'Rigel', type: 'Blue Supergiant', tier: 4,
    pos: [243000, -2000, -38000], vType: 'star', scale: 3800, dotColor: '#aaccff',
    starColor: [170, 210, 255],
    info: { 'Type': 'Blue Supergiant (B8Ia)', 'Distance': '~860 ly', 'Luminosity': '~120 000 L☉', 'Feature': 'Brightest star in Orion' }
  },
  // ── Lot 3 : 15 nouveaux POI galactiques ──
  {
    id: 'pistol-star', name: 'Pistol Star', type: 'Blue Hypergiant', tier: 3,
    pos: [35000, -1000, 25000], vType: 'star', scale: 4500, dotColor: '#88ccff',
    starColor: [140, 200, 255],
    info: { 'Type': 'Luminous Blue Variable', 'Distance': '~25 000 ly (near Sgr A*)', 'Luminosity': '~1.6 million L☉', 'Feature': 'One of the most luminous stars known' }
  },
  {
    id: 'hercules-cluster', name: 'M13 Hercules Cluster', type: 'Globular Cluster', tier: 3,
    pos: [138000, 2500, -184000], vType: 'cluster', scale: 4200, dotColor: '#ccddff',
    info: { 'Type': 'Globular Cluster', 'Catalog': 'NGC 6205', 'Distance': '~22 200 ly', 'Stars': '~300 000', 'Feature': 'Most famous globular cluster' }
  },
  {
    id: 'butterfly-neb', name: 'Butterfly Nebula', type: 'Bipolar PN', tier: 4,
    pos: [-94000, -1000, 199000], vType: 'bipolar', scale: 4000, dotColor: '#dd66aa',
    colors: [220, 100, 170, 160, 50, 130],
    info: { 'Type': 'Bipolar Planetary Nebula', 'Catalog': 'NGC 6302', 'Distance': '~3 400 ly', 'Feature': 'One of the hottest dying stars (~250 000 K)' }
  },
  {
    id: 'bubble-neb', name: 'Bubble Nebula', type: 'Emission Nebula', tier: 4,
    pos: [152000, 1000, -96000], vType: 'nebula', scale: 3500, dotColor: '#ee8866',
    colors: [240, 140, 100, 180, 80, 140],
    info: { 'Type': 'H II Emission Nebula', 'Catalog': 'NGC 7635', 'Distance': '~7 100 ly', 'Diameter': '~6 ly', 'Feature': 'Blown by stellar wind from SAO 20575' }
  },
  {
    id: 'tycho-snr', name: 'Tycho\'s SNR', type: 'Supernova Remnant', tier: 4,
    pos: [-204000, -1500, -82000], vType: 'supernova', scale: 3800, dotColor: '#44bbee',
    info: { 'Type': 'Type Ia Supernova Remnant', 'Catalog': 'SN 1572 / 3C 10', 'Distance': '~8 000 ly', 'Supernova': '1572 AD (Tycho Brahe)', 'Feature': 'Key to understanding Type Ia supernovae' }
  },
  {
    id: 'gum-neb', name: 'Gum Nebula', type: 'Supernova Remnant', tier: 2,
    pos: [-152000, 1000, 97000], vType: 'nebula', scale: 7000, dotColor: '#ee9988',
    colors: [240, 150, 130, 180, 100, 120],
    info: { 'Type': 'Ancient SNR / Emission Nebula', 'Distance': '~1 500 ly', 'Diameter': '~1 100 ly', 'Age': '~1 million years', 'Feature': 'One of the largest known emission nebulae' }
  },
  {
    id: 'ngc-6397', name: 'NGC 6397', type: 'Globular Cluster', tier: 3,
    pos: [-96000, 2000, 72000], vType: 'cluster', scale: 3500, dotColor: '#aabbdd',
    info: { 'Type': 'Globular Cluster', 'Distance': '~7 800 ly', 'Stars': '~400 000', 'Age': '~13.4 billion years', 'Feature': 'One of the closest globular clusters to Earth' }
  },
  {
    id: 'red-spider', name: 'Red Spider Nebula', type: 'Planetary Nebula', tier: 4,
    pos: [-98000, -800, 22000], vType: 'ring', scale: 3200, dotColor: '#ee5533',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'NGC 6537', 'Distance': '~4 000 ly', 'Feature': 'Fastest stellar winds measured (~300 km/s)' }
  },
  {
    id: 'boomerang-neb', name: 'Boomerang Nebula', type: 'Reflection Nebula', tier: 3,
    pos: [-216000, -1500, 126000], vType: 'reflection', scale: 4000, dotColor: '#6699dd',
    colors: [100, 150, 220, 60, 100, 200],
    info: { 'Type': 'Pre-planetary / Reflection Nebula', 'Distance': '~5 000 ly', 'Temp': '~1 K (-272°C)', 'Feature': 'Coldest known natural place in the universe' }
  },
  {
    id: 'north-america', name: 'North America Nebula', type: 'Emission Nebula', tier: 3,
    pos: [-147000, 1000, -31000], vType: 'nebula', scale: 5500, dotColor: '#ee7755',
    colors: [240, 120, 85, 180, 70, 100],
    info: { 'Type': 'H II Emission Nebula', 'Catalog': 'NGC 7000', 'Distance': '~2 590 ly', 'Diameter': '~140 ly', 'Feature': 'Shape resembles North America continent' }
  },
  {
    id: 'terzan-5', name: 'Terzan 5', type: 'Globular Cluster', tier: 4,
    pos: [-51000, -2000, -31000], vType: 'cluster', scale: 3000, dotColor: '#ccaa66',
    info: { 'Type': 'Globular Cluster (Bulge)', 'Distance': '~19 000 ly', 'Feature': 'Fossil remnant of MW formation — two distinct stellar populations' }
  },
  {
    id: 'v838-mon', name: 'V838 Monocerotis', type: 'Peculiar Variable', tier: 4,
    pos: [89000, -1000, -286000], vType: 'star', scale: 3800, dotColor: '#ff4422',
    starColor: [255, 70, 35],
    info: { 'Type': 'Red Transient / Variable Star', 'Distance': '~19 000 ly', 'Feature': 'Famous light echo expanding at the speed of light' }
  },
  {
    id: 'cannonball-psr', name: 'Cannonball Pulsar', type: 'Pulsar / PWN', tier: 4,
    pos: [-78000, 1000, -91000], vType: 'supernova', scale: 3200, dotColor: '#33ddcc',
    info: { 'Type': 'Pulsar Wind Nebula', 'Catalog': 'IGR J11014-6103', 'Distance': '~15 000 ly', 'Speed': '~1 000 km/s', 'Feature': 'Fastest known pulsar with jet trail' }
  },
  {
    id: 'omega-neb', name: 'Omega Nebula', type: 'Emission Nebula', tier: 3,
    pos: [-10000, 1000, -100000], vType: 'nebula', scale: 4800, dotColor: '#ee5577',
    colors: [240, 85, 120, 200, 50, 100],
    info: { 'Type': 'H II / Emission Nebula', 'Catalog': 'M17 / NGC 6618', 'Distance': '~5 500 ly', 'Diameter': '~15 ly', 'Feature': 'Swan shape, one of the brightest in the MW' }
  },
  {
    id: 'sn-1006', name: 'SN 1006 Remnant', type: 'Supernova Remnant', tier: 3,
    pos: [-280000, -1500, -10000], vType: 'supernova', scale: 4500, dotColor: '#44aaee',
    info: { 'Type': 'Type Ia Supernova Remnant', 'Distance': '~7 200 ly', 'Diameter': '~65 ly', 'Supernova': '1006 AD', 'Feature': 'Brightest stellar event in recorded history' }
  },
  // ── Lot 4 : 15 POI uniques visuellement ──
  {
    id: 'wr104', name: 'WR 104', type: 'Wolf-Rayet Pinwheel', tier: 3,
    pos: [75000, 800, 27000], vType: 'wolfrayet', scale: 4200, dotColor: '#88eeff',
    wrColors: [130, 220, 255, 60, 140, 200],
    info: { 'Type': 'Wolf-Rayet Star + Pinwheel', 'Distance': '~8 400 ly', 'Feature': 'Spiral dust pinwheel — potential gamma-ray burst progenitor' }
  },
  {
    id: 'sgr-magnetar', name: 'SGR 1806-20', type: 'Magnetar', tier: 4,
    pos: [52000, -1200, -48000], vType: 'magnetar', scale: 3800, dotColor: '#ff55ff',
    magColors: [255, 80, 255, 100, 40, 200],
    info: { 'Type': 'Magnetar', 'Distance': '~50 000 ly', 'Mag. Field': '~10^15 Gauss', 'Feature': 'Dec 2004 hyperflare — most energetic event ever recorded from within MW' }
  },
  {
    id: 'iras16293', name: 'IRAS 16293-2422', type: 'Protostellar System', tier: 4,
    pos: [228000, -800, -55000], vType: 'protostar', scale: 3500, dotColor: '#ffaa44',
    protoColors: [255, 170, 70, 200, 100, 40],
    info: { 'Type': 'Class 0 Protostar (Binary)', 'Distance': '~460 ly', 'Feature': 'Sugar molecules detected — key to origins of life' }
  },
  {
    id: 'ic443', name: 'Jellyfish Nebula', type: 'SNR Shell', tier: 3,
    pos: [-150000, -1000, -140000], vType: 'shellsnr', scale: 4500, dotColor: '#44ddaa',
    shellColors: [70, 220, 170, 40, 150, 200],
    info: { 'Type': 'Shell-type Supernova Remnant', 'Catalog': 'IC 443', 'Distance': '~5 000 ly', 'Feature': 'Jellyfish shape — interacts with molecular cloud' }
  },
  {
    id: 'wr142', name: 'WR 142', type: 'Wolf-Rayet Star', tier: 4,
    pos: [-180000, 800, -185000], vType: 'wolfrayet', scale: 3600, dotColor: '#66ddee',
    wrColors: [100, 200, 230, 40, 120, 180],
    info: { 'Type': 'WO-type Wolf-Rayet Star', 'Distance': '~4 700 ly', 'Temp': '~200 000 K', 'Feature': 'Hottest known star in the Milky Way' }
  },
  {
    id: 'sgr-1935', name: 'SGR 1935+2154', type: 'Magnetar / FRB', tier: 4,
    pos: [185000, 1200, 150000], vType: 'magnetar', scale: 3500, dotColor: '#dd44ff',
    magColors: [220, 70, 255, 140, 30, 180],
    info: { 'Type': 'Magnetar + Fast Radio Burst', 'Distance': '~14 000 ly', 'Feature': 'First galactic FRB — linked magnetars to FRBs' }
  },
  {
    id: 'barnard68', name: 'Barnard 68', type: 'Bok Globule', tier: 4,
    pos: [258000, 600, 32000], vType: 'darkneb', scale: 3000, dotColor: '#443322',
    colors: [70, 50, 35, 30, 20, 15],
    info: { 'Type': 'Bok Globule (Dark Cloud)', 'Distance': '~500 ly', 'Diameter': '~0.5 ly', 'Feature': 'Near-perfect spherical dark cloud — future star nursery' }
  },
  {
    id: 'w49a', name: 'W49A', type: 'Ultra-compact H II', tier: 3,
    pos: [68000, 1500, -105000], vType: 'protostar', scale: 5000, dotColor: '#ffcc33',
    protoColors: [255, 200, 50, 220, 130, 30],
    info: { 'Type': 'Ultra-compact H II Region', 'Distance': '~36 000 ly', 'Luminosity': '~10^7 L☉', 'Feature': 'Most luminous star-forming region in the MW' }
  },
  {
    id: 'puppis-a', name: 'Puppis A', type: 'SNR Shell', tier: 3,
    pos: [205000, -1800, 175000], vType: 'shellsnr', scale: 4800, dotColor: '#33ccbb',
    shellColors: [50, 200, 190, 30, 140, 180],
    info: { 'Type': 'Shell Supernova Remnant', 'Distance': '~7 000 ly', 'Age': '~3 700 years', 'Feature': 'One of the brightest X-ray sources in the sky' }
  },
  {
    id: 'wr124', name: 'WR 124 + M1-67', type: 'Wolf-Rayet Nebula', tier: 4,
    pos: [300000, -800, -150000], vType: 'wolfrayet', scale: 3900, dotColor: '#77ddcc',
    wrColors: [120, 220, 200, 50, 160, 150],
    info: { 'Type': 'Wolf-Rayet Star + Ejected Nebula', 'Distance': '~15 000 ly', 'Feature': 'JWST showcase — clumpy ejected nebula moving at 150 km/s' }
  },
  {
    id: 'w50-manatee', name: 'W50 / Manatee Nebula', type: 'SS 433 Relic', tier: 3,
    pos: [-50000, -2000, 220000], vType: 'shellsnr', scale: 5200, dotColor: '#55ddaa',
    shellColors: [85, 220, 170, 50, 180, 140],
    info: { 'Type': 'SNR + Microquasar Jet', 'Distance': '~18 000 ly', 'Diameter': '~700 × 350 ly', 'Feature': 'Distorted by relativistic jets from SS 433' }
  },
  {
    id: 'protostar-l1527', name: 'L1527 Protostar', type: 'Protostar', tier: 4,
    pos: [230000, 500, -62000], vType: 'protostar', scale: 3400, dotColor: '#ff8833',
    protoColors: [255, 140, 50, 200, 80, 20],
    info: { 'Type': 'Class 0/I Protostar', 'Distance': '~460 ly (Taurus)', 'Feature': 'JWST hourglass image — edge-on accretion disk' }
  },
  {
    id: 'magnetar-1e', name: '1E 2259+586', type: 'Magnetar in SNR', tier: 4,
    pos: [-240000, 1000, -200000], vType: 'magnetar', scale: 3700, dotColor: '#cc44ee',
    magColors: [200, 70, 240, 120, 40, 200],
    info: { 'Type': 'Magnetar inside SNR CTB 109', 'Distance': '~10 000 ly', 'Feature': 'First magnetar found inside a supernova remnant shell' }
  },
  {
    id: 'snr-w28', name: 'W28', type: 'Mixed-Morphology SNR', tier: 4,
    pos: [30000, 800, -60000], vType: 'shellsnr', scale: 4000, dotColor: '#44ccaa',
    shellColors: [70, 200, 170, 40, 160, 140],
    info: { 'Type': 'Mixed-Morphology SNR', 'Distance': '~6 000 ly', 'Age': '~35 000 years', 'Feature': 'Accelerates cosmic rays — interacts with giant molecular clouds' }
  },
  {
    id: 'wr-nebula-rcw58', name: 'RCW 58', type: 'Wolf-Rayet Ring Nebula', tier: 4,
    pos: [165000, -1300, -170000], vType: 'wolfrayet', scale: 3800, dotColor: '#55ccdd',
    wrColors: [85, 200, 220, 40, 140, 180],
    info: { 'Type': 'WR Ring Nebula', 'Catalog': 'RCW 58 / Gum 38b', 'Distance': '~9 500 ly', 'Feature': 'Blown bubble from WR 40 stellar wind' }
  }
];

// ============================================================
// QUESTS SYSTEM DATA
// ============================================================
var QUESTS = [
  {
    id: 'quest_orion',
    title: "Découvrir la Nébuleuse d'Orion",
    description: "Rejoignez la Nébuleuse d'Orion (M42) pour analyser cette immense pouponnière stellaire dans le bras d'Orion.",
    targetPOI_ID: 'orion-neb',
    reward: 500,
    credits: 500
  },
  {
    id: 'quest_crab',
    title: "Explorer la Nébuleuse du Crabe",
    description: "Rapprochez-vous de la Nébuleuse du Crabe (M1), célèbre rémanent de supernova abritant un pulsar ultra-dense.",
    targetPOI_ID: 'crab-neb',
    reward: 750,
    credits: 750
  },
  {
    id: 'quest_sgr_a',
    title: "S'approcher de Sagittarius A*",
    description: "Bravez le voyage vers le centre galactique pour cartographier l'environnement gravitationnel extrême de Sagittarius A*.",
    targetPOI_ID: 'sgr-a',
    reward: 1500,
    credits: 1500
  }
];

// ============================================================
// CODEX SCIENTIFIC DATA
// ============================================================
var CODEX_DATA = {
  'sgr-a': {
    name: "Sagittarius A*",
    catalog: "Sgr A*",
    category: "Trou Noir Supermassif",
    distance: "~26 673 années-lumière",
    constellation: "Sagittaire",
    features: {
      "Masse": "~4,15 millions M☉",
      "Rayon de Schwarzschild": "~12,7 millions km",
      "Disque d'accrétion": "Matière spiralant à vitesse relativiste",
      "Confirmation": "Imagerie directe EHT (2022)"
    },
    description: "Sagittarius A* constitue le centre de masse et le cœur gravitationnel de la Voie Lactée. Découvert en 1974 par les radioastronomes Bruce Balick et Robert Brown, il concentre plus de 4 millions de fois la masse solaire dans une région plus compacte que l'orbite de Mercure. Sa gravité titanesque courbe la lumière des étoiles en orbite rapide (étoiles S) et guide la rotation galactique globale."
  },
  'orion-neb': {
    name: "Nébuleuse d'Orion",
    catalog: "M42 / NGC 1976",
    category: "Nébuleuse diffuse en émission",
    distance: "~1 344 années-lumière",
    constellation: "Orion",
    features: {
      "Diamètre": "~24 années-lumière",
      "Étoiles centrales": "Amas du Trapèze (Theta1 Orionis)",
      "Processus": "Ionisation UV d'hydrogène (H II)",
      "Découverte": "Nicolas-Claude Fabri de Peiresc (1610)"
    },
    description: "Visible à l'œil nu au sud du baudrier d'Orion, la grande nébuleuse d'Orion est le berceau stellaire massif le plus proche de la Terre. Au cœur de son voile de gaz incandescent, l'amas du Trapèze émet de violents flux d'ultraviolets qui ionisent l'hydrogène et sculptent des disques protoplanétaires (proplyds), où naissent de nouveaux systèmes solaires sous nos yeux."
  },
  'crab-neb': {
    name: "Nébuleuse du Crabe",
    catalog: "M1 / NGC 1952",
    category: "Rémanent de Supernova / Plérion",
    distance: "~6 500 années-lumière",
    constellation: "Taureau",
    features: {
      "Diamètre": "~11 années-lumière",
      "Événement historique": "Supernova SN 1054",
      "Cœur": "Pulsar PSR B0531+21 (30 tours/s)",
      "Expansion": "~1 500 km/s"
    },
    description: "Le 4 juillet 1054, des astronomes chinois et arabes observèrent une 'étoile invitée' si éclatante qu'elle resta visible en plein jour pendant 23 jours. La Nébuleuse du Crabe est le reliquat filamentaire en expansion de cette catastrophe cosmique. En son centre réside une étoile à neutrons de 1,4 masse solaire tournant 30 fois par seconde, émettant un phare de rayons gamma et X."
  },
  'eagle-neb': {
    name: "Nébuleuse de l'Aigle",
    catalog: "M16 / NGC 6611",
    category: "Région H II & Colonnes d'érosion",
    distance: "~7 000 années-lumière",
    constellation: "Serpent",
    features: {
      "Structure culte": "Piliers de la Création (~4-5 AL de haut)",
      "Type": "Nuage moléculaire d'effondrement",
      "Température gaz": "~10 000 K dans la zone H II",
      "Imagerie": "Télescopes spatiaux Hubble et James Webb"
    },
    description: "Rendue célèbre dans le monde entier par le cliché historique des 'Piliers de la Création' pris par Hubble en 1995 et revisité par James Webb, cette région est un monumental chantier de construction stellaire. D'immenses doigts de gaz froids et de poussières sombres résistent aux vents stellaires féroces des jeunes étoiles de l'amas ouvert NGC 6611."
  },
  'cygnus-x1': {
    name: "Cygnus X-1",
    catalog: "Cyg X-1 / HDE 226868",
    category: "Binaire X / Trou Noir Stellaire",
    distance: "~6 070 années-lumière",
    constellation: "Cygne",
    features: {
      "Masse trou noir": "~21,2 M☉",
      "Compagne": "Supergéante bleue HDE 226868 (~40 M☉)",
      "Période orbitale": "5,6 jours",
      "Statut": "Premier candidat trou noir confirmé (1971)"
    },
    description: "Cygnus X-1 fut la toute première source de rayons X céleste reconnue comme un trou noir. Ce système binaire infernal est composé d'une supergéante bleue dont les couches gazeuses supérieures sont inexorablement aspirées vers le trou noir. La friction de la matière dans le disque d'accrétion atteint des millions de degrés Kelvin, émettant un rayonnement X intense."
  },
  'eta-car': {
    name: "Eta Carinae",
    catalog: "η Carinae / HR 4210",
    category: "Variable Lumineuse Bleue (LBV)",
    distance: "~7 500 années-lumière",
    constellation: "Carène",
    features: {
      "Masse système": "~100 - 120 M☉ + 30 M☉",
      "Luminosité": "~5 millions de fois le Soleil",
      "Nébuleuse propre": "Nébuleuse de l'Homunculus",
      "Pronostic": "Future supernova ou hypernova à émission gamma"
    },
    description: "Eta Carinae est l'un des monstres stellaires les plus fascinants et instables de la Voie Lactée. Au cours des années 1840, elle subit la 'Grande Éruption' qui éjecta deux lobes gigantesques de gaz bipolaires sans détruire totalement l'étoile. Elle oscille à la limite d'Eddington et explosera en supernova spectaculaire dans un futur astronomique très proche."
  },
  'sol': {
    name: "Système Solaire",
    catalog: "Sol / Système Solaire",
    category: "Étoile Naine Jaune (G2V)",
    distance: "0 AL (Origine locale)",
    constellation: "Bras d'Orion-Cygnus",
    features: {
      "Âge": "~4,57 milliards d'années",
      "Planètes majeures": "8 (4 telluriques, 4 géantes)",
      "Distance au centre": "~26 000 années-lumière",
      "Période galactique": "~225-250 millions d'années"
    },
    description: "Le berceau de l'humanité. Situé à mi-chemin entre le cœur galactique et la périphérie sur le bord intérieur du bras spiral d'Orion. Sa composition chimique équilibrée de population I a permis le développement d'une biodiversité unique sur la troisième planète tellurique, la Terre."
  },
  'alpha-centauri': {
    name: "Alpha Centauri",
    catalog: "Rigil Kentaurus / Gliese 559",
    category: "Système Stellaire Triple",
    distance: "~4,37 années-lumière",
    constellation: "Centaure",
    features: {
      "Composantes": "Rigil (G2V) + Toliman (K1V) + Proxima (M5.5Ve)",
      "Proxima Centauri": "Étoile la plus proche du Soleil (~4,24 AL)",
      "Exoplanète clé": "Proxima Centauri b (zone tempérée)",
      "Période binaire A-B": "~79,9 ans"
    },
    description: "Le système d'étoiles le plus proche du Système Solaire. Il est formé d'un couple binaire serré très similaire à notre Soleil et d'une petite naine rouge distante, Proxima Centauri, qui abrite au moins deux exoplanètes connues. C'est la première étape théorique pour tout voyage interstellaire habité."
  },
  'sirius': {
    name: "Sirius",
    catalog: "Alpha Canis Majoris / HR 2491",
    category: "Système Binaire (Étoile A1V + Naine Blanche)",
    distance: "~8,6 années-lumière",
    constellation: "Grand Chien",
    features: {
      "Magnitude apparente": "-1,46 (Étoile la plus brillante du ciel)",
      "Sirius B": "Naine blanche dense ('Le Chiot')",
      "Température Sirius A": "~9 940 K",
      "Luminosité": "25,4 L☉"
    },
    description: "L'étoile la plus brillante du firmament terrestre. Sirius A est une jeune étoile blanche deux fois plus massive que le Soleil. Elle est orbitée tous les 50 ans par Sirius B, la première naine blanche identifiée par l'astronomie moderne, vestige extrêmement compact et dense où une masse solaire est comprimée dans le volume d'une planète terrestre."
  },
  'pleiades': {
    name: "Les Pléiades",
    catalog: "M45 / Les Sept Sœurs",
    category: "Amas Ouvert & Nébuleuse par réflexion",
    distance: "~444 années-lumière",
    constellation: "Taureau",
    features: {
      "Nombre d'étoiles": "~1 000 membres",
      "Âge de l'amas": "~100 millions d'années",
      "Étoiles maîtresses": "Alcyone, Maia, Electra, Taygeta, etc.",
      "Nébuleuse": "Poussière éclairée par réflexion de lumière bleue"
    },
    description: "L'un des plus magnifiques joyaux du ciel d'hiver. Cet amas ouvert regroupe de jeunes étoiles bleues ultra-chaudes de type spectral B formées il y a environ 100 millions d'années. Le voile bleuté qui les enveloppe n'est pas le gaz résiduel de leur naissance, mais un nuage interstellaire indépendant que l'amas traverse actuellement à grande vitesse."
  },
  'betelgeuse': {
    name: "Bételgeuse",
    catalog: "Alpha Orionis / HR 2061",
    category: "Supergéante Rouge Pulsante",
    distance: "~650 - 700 années-lumière",
    constellation: "Orion",
    features: {
      "Diamètre": "~700 à 1 000 × le Soleil",
      "Volume": "Pourrait contenir l'orbite de Jupiter",
      "Luminosité": "~100 000 à 130 000 L☉",
      "Fin de vie": "Explosion imminente en Supernova de Type II"
    },
    description: "Une étoile titan au crépuscule de sa vie. Bételgeuse a épuisé l'hydrogène de son cœur et fusionne désormais des éléments plus lourds, dilatant son enveloppe à des dimensions titanesques. Ses soubresauts de convection géante provoquent des baisses de luminosité historiques, comme le 'Grand Assombrissement' de 2019-2020."
  },
  'carina-neb': {
    name: "Nébuleuse de la Carène",
    catalog: "NGC 3372 / Grande Nébuleuse de la Carène",
    category: "Nébuleuse diffuse géante en émission",
    distance: "~7 600 années-lumière",
    constellation: "Carène",
    features: {
      "Envergure": "~300 années-lumière",
      "Objets notables": "Eta Carinae, Nébuleuse du Trou de Serrure",
      "Puissance": "Quatre fois plus étendue qu'Orion",
      "Population": "Plus de 60 étoiles de classe O ultra-massives"
    },
    description: "La nébuleuse de la Carène surpasse en taille et en déchaînement d'énergie presque toutes les régions de notre galaxie. C'est un complexe colossal de gaz d'hydrogène ionisé, de piliers d'érosion et de nébuleuses obscures entremêlées, hébergeant parmi les étoiles les plus massives et les plus brillantes connues de la Voie Lactée."
  },
  'ring-neb': {
    name: "Nébuleuse de l'Anneau",
    catalog: "M57 / NGC 6720",
    category: "Nébuleuse Planétaire",
    distance: "~2 570 années-lumière",
    constellation: "Lyre",
    features: {
      "Diamètre": "~1,3 année-lumière",
      "Étoile centrale": "Naine blanche naine (~120 000 K)",
      "Âge estimé": "~4 000 à 6 000 ans",
      "Morphologie": "Tore cylindrique vu presque par les pôles"
    },
    description: "Le modèle par excellence de la nébuleuse planétaire. En expulsant ses couches gazeuses externes lors de son agonie, une étoile similaire à notre Soleil a créé une bulle torique de matière en expansion. La naine blanche centrale, chauffée à blanc, excite le gaz environnant : l'oxygène ionisé brille d'un vert émeraude au centre, tandis que l'azote et l'hydrogène teintent l'anneau de rubis."
  },
  'helix-neb': {
    name: "Nébuleuse de l'Hélice",
    catalog: "NGC 7293 / L'Œil de Dieu",
    category: "Nébuleuse Planétaire Proche",
    distance: "~650 années-lumière",
    constellation: "Verseau",
    features: {
      "Diamètre réel": "~5,7 années-lumière",
      "Taille apparente": "La moitié du diamètre de la pleine Lune",
      "Étoile centrale": "Naine blanche DAO (~120 000 K)",
      "Filaments": "Milliers de nœuds cométaires gazeux"
    },
    description: "Surnommée 'L'Œil de Dieu' ou 'L'Œil de Sauron' en raison de son apparence saisissante vue depuis la Terre, l'Hélice est la plus proche de toutes les grandes nébuleuses planétaires. Ses couches de gaz expulsées depuis plus de 10 000 ans forment un labyrinthe complexe de filaments denses et de poussières cométaires qui s'évaporent lentement sous le flux ultraviolet."
  },
  'horsehead-neb': {
    name: "Nébuleuse de la Tête de Cheval",
    catalog: "Barnard 33 / IC 434",
    category: "Nébuleuse Obscure d'Absorption",
    distance: "~1 375 années-lumière",
    constellation: "Orion",
    features: {
      "Taille": "~3 à 4 années-lumière",
      "Arrière-plan": "Nébuleuse en émission IC 434 ionisée par Sigma Orionis",
      "Découverte": "Williamina Fleming (1888)",
      "Densité": "Poussières denses bloquant tout spectre visible"
    },
    description: "Silhouette astronomique iconique, cette colonne de poussières épaisses et denses se découpe en ombre chinoise sur le rideau d'hydrogène rougeoyant de la nébuleuse IC 434. La forme équine caractéristique est sculptée par les radiations énergétiques d'étoiles massives voisines qui détruisent progressivement le nuage."
  },
  'rosette-neb': {
    name: "Nébuleuse de la Rosette",
    catalog: "NGC 2237 / Caldwel 49",
    category: "Région H II Géante",
    distance: "~5 200 années-lumière",
    constellation: "Licorne",
    features: {
      "Diamètre": "~130 années-lumière",
      "Masse": "~10 000 masses solaires",
      "Amas central": "NGC 2244",
      "Forme": "Pétales symétriques de gaz ionisé"
    },
    description: "Une somptueuse rose cosmique de plus de 100 années-lumière de diamètre. L'amas central d'étoiles jeunes et ultra-chaudes NGC 2244 balaie le gaz au centre par sa pression de radiation, créant une cavité centrale tout en comprimant les parois externes pour initier une seconde vague de genèse stellaire."
  },
  'vela-pulsar': {
    name: "Pulsar des Voiles",
    catalog: "PSR B0833-45 / Vela SNR",
    category: "Pulsar & Rémanent de Supernova",
    distance: "~936 années-lumière",
    constellation: "Voiles",
    features: {
      "Âge": "~11 000 à 12 000 ans",
      "Rotation": "11,2 rotations complètes par seconde",
      "Champ magnétique": "~3 × 10^12 Gauss",
      "Émission": "L'une des sources de rayons gamma les plus intenses du ciel"
    },
    description: "Né de l'effondrement gravitationnel d'une étoile supergéante il y a 11 millénaires, le pulsar des Voiles projette un phare d'ondes radio, optiques et gamma balayant l'espace à chaque tour. Le rémanent qui l'entoure s'étend sur plus de 100 années-lumière et témoigne de la violence extrême des fins de vie stellaires."
  },
  'omega-centauri': {
    name: "Oméga du Centaure",
    catalog: "NGC 5139",
    category: "Amas Globulaire Géant / Cœur de Galaxie Naine",
    distance: "~15 800 années-lumière",
    constellation: "Centaure",
    features: {
      "Nombre d'étoiles": "~10 millions d'étoiles",
      "Diamètre": "~150 années-lumière",
      "Masse": "~4 millions M☉",
      "Hypothèse": "Vestige du noyau d'une galaxie naine cannibalisée"
    },
    description: "Le plus grand, le plus massif et le plus spectaculaire des 150 amas globulaires orbitant autour de la Voie Lactée. Contrairement aux amas classiques composés d'une génération unique d'étoiles, Oméga Centauri abrite plusieurs populations stellaires d'âges variés, suggérant qu'il s'agit du noyau fossile d'une galaxie naine absorbée par notre Voie Lactée il y a des milliards d'années."
  },
  'tarantula-neb': {
    name: "Nébuleuse de la Tarentule",
    catalog: "30 Doradus / NGC 2070",
    category: "Super-région H II Extra-galactique (LMC)",
    distance: "~160 000 années-lumière",
    constellation: "Dorade (Grand Nuage de Magellan)",
    features: {
      "Diamètre": "~600 à 1 000 années-lumière",
      "Cœur": "Super-amas R136 (abritant R136a1, ~200-250 M☉)",
      "Échelle": "Si elle était à la place d'Orion, elle projetterait des ombres la nuit",
      "Activité": "Plus grand complexe de formation stellaire du Groupe Local"
    },
    description: "Une merveille titanesque située dans la galaxie satellite du Grand Nuage de Magellan. C'est l'usine stellaire la plus active et colossale de tout notre Groupe Local de galaxies. Elle contient en son cœur l'amas R136, qui détient le record mondial de l'étoile la plus massive jamais mesurée par l'astrophysique, R136a1."
  }
};

// Helper pour récupérer la fiche du Codex avec repli automatique
function getCodexEntry(poiId) {
  if (CODEX_DATA[poiId]) return CODEX_DATA[poiId];
  const poi = GALACTIC_POI.find(p => p.id === poiId);
  if (!poi) return null;
  return {
    name: poi.name,
    catalog: poi.info?.Catalog || poi.id.toUpperCase(),
    category: poi.type || "Objet Céleste",
    distance: poi.info?.Distance || "Inconnue",
    constellation: "Voie Lactée",
    features: poi.info || {},
    description: poi.info?.Feature 
      ? `Astre remarquable de la Voie Lactée répertorié sous la classification ${poi.type}. Particularité majeure : ${poi.info.Feature}.`
      : `Point d'intérêt galactique d'importance scientifique majeure répertorié dans la grille d'exploration spatiale.`
  };
}


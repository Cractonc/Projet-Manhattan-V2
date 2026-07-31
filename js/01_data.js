'use strict';

// ============================================================
// CONSTANTS & SCALE
// ============================================================
var AU = 15;
var PLANET_SCALE = 7;
var SUN_RADIUS = 3.2;
var MIN_RADIUS = 0.32;

// Galactic scale: 1 unit = 1 light year
var GAL_RADIUS = 50000;    // galaxy radius in ly
var SUN_GAL = { x: 26000, y: 25, z: 0 }; // Sun position in galactic coords
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
  { id: 'm83-hd', name: 'M83 - Southern Pinwheel', type: 'hd_m83', pos: [-600000, -100000, 100000], color: '#ffffff', scale: 75000, opacity: 0.9, tilt: 0 },
  { id: 'm82-hd', name: 'M82 - Cigar Galaxy', type: 'hd_m82', pos: [150000, 550000, -150000], color: '#ffffff', scale: 60000, opacity: 0.95, tilt: 0.8 },
  { id: 'cena-hd', name: 'Centaurus A', type: 'hd_cena', pos: [-450000, 350000, 400000], color: '#ffffff', scale: 80000, opacity: 0.9, tilt: 0 },
  { id: '7331-hd', name: 'NGC 7331', type: 'hd_7331', pos: [550000, -300000, 300000], color: '#ffffff', scale: 95000, opacity: 0.9, tilt: 1.2 },
  { id: '6946-hd', name: 'NGC 6946 - Fireworks', type: 'hd_6946', pos: [-200000, -500000, -400000], color: '#ffffff', scale: 70000, opacity: 0.9, tilt: 0 },
  // Lot 4 : Expansion Interaction & JWST Deep Field
  { id: 'm51-hd', name: 'M51 - Whirlpool', type: 'hd_m51', pos: [400000, 400000, -500000], color: '#ffffff', scale: 85000, opacity: 0.9, tilt: 0.1 },
  { id: 'antennae-hd', name: 'Antennae Galaxies', type: 'hd_antennae', pos: [-650000, 200000, -250000], color: '#ffffff', scale: 90000, opacity: 0.85, tilt: 0.5 },
  { id: 'owls-eyes-hd', name: 'Owl\'s Eyes', type: 'hd_owls', pos: [-450000, -250000, 550000], color: '#ffffff', scale: 70000, opacity: 0.9, tilt: 0 },
  { id: 'fireball-hd', name: 'Fireball Galaxy', type: 'hd_fireball', pos: [150000, 450000, 600000], color: '#ffffff', scale: 75000, opacity: 0.9, tilt: 0.7 },
  // Lot 5 : Exotic Batch & Final Selection
  { id: 'blackeye-hd', name: 'NGC 4826 - Black Eye', type: 'hd_blackeye', pos: [-250000, 600000, -350000], color: '#ffffff', scale: 72000, opacity: 0.9, tilt: 0.3 },
  { id: 'sculptor-hd', name: 'NGC 253 - Sculptor', type: 'hd_sculptor', pos: [-550000, -450000, 250000], color: '#ffffff', scale: 88000, opacity: 0.9, tilt: 1.1 },
  { id: 'slug-hd', name: 'Slug Galaxy', type: 'hd_slug', pos: [250000, -150000, -650000], color: '#ffffff', scale: 70000, opacity: 0.9, tilt: 0.2 },
  { id: 'snowwhite-hd', name: 'Snowwhite Galaxy', type: 'hd_snowwhite', pos: [450000, -350000, -400000], color: '#ffffff', scale: 85000, opacity: 0.95, tilt: 0 },
  // Lot 6 : Diversification Finale
  { id: '3627-hd', name: 'NGC 3627', type: 'hd_3627', pos: [650000, 250000, 350000], color: '#ffffff', scale: 82000, opacity: 0.9, tilt: 0.6 },
  { id: 'mist-hd', name: 'Morning Mist', type: 'hd_mist', pos: [-350000, 550000, 550000], color: '#ffffff', scale: 95000, opacity: 0.85, tilt: 0 },
  { id: 'finger-hd', name: 'God\'s Finger', type: 'hd_finger', pos: [150000, -550000, 450000], color: '#ffffff', scale: 78000, opacity: 0.9, tilt: 0.8 },
  { id: 'netflix-hd', name: 'Netflix Galaxy', type: 'hd_netflix', pos: [-600000, 500000, -500000], color: '#ffffff', scale: 72000, opacity: 0.85, tilt: 0.1 },
  // Lot 7 : La Collection Finale (21 HD restants)
  { id: 'sombrero-hd', name: 'M104 - Sombrero', type: 'hd_sombrero', pos: [250000, 650000, 150000], color: '#ffffff', scale: 72000, opacity: 0.95, tilt: 1.5 },
  { id: '1097-hd', name: 'NGC 1097', type: 'hd_1097', pos: [-150000, -550000, -650000], color: '#ffffff', scale: 80000, opacity: 0.9, tilt: 0.4 },
  { id: 'collider-hd', name: 'Giant Collider', type: 'hd_collider', pos: [550000, 500000, 250000], color: '#ffffff', scale: 75000, opacity: 0.9, tilt: 0 },
  { id: 'torpedo-hd', name: 'Torpedo Galaxy', type: 'hd_torpedo', pos: [-650000, -150000, 450000], color: '#ffffff', scale: 65000, opacity: 0.9, tilt: 1.25 },
  // Lot 8 : Spirales Classiques (Balance Panorama)
  { id: 'm31-hd', name: 'M31 - Andromeda', type: 'hd_m31', pos: [-550000, 450000, -450000], color: '#ffffff', scale: 120000, opacity: 0.9, tilt: 1.3 },
  { id: 'm101-hd', name: 'M101 - Pinwheel', type: 'hd_m101', pos: [550000, -550000, 450000], color: '#ffffff', scale: 85000, opacity: 0.9, tilt: 0.2 },
  { id: 'm81-hd', name: 'M81 - Bode\'s Galaxy', type: 'hd_m81', pos: [450000, 550000, 550000], color: '#ffffff', scale: 80000, opacity: 0.9, tilt: 1.1 },
  { id: 'm63-hd', name: 'M63 - Sunflower', type: 'hd_m63', pos: [-450000, -550000, -650000], color: '#ffffff', scale: 75000, opacity: 0.9, tilt: 0.6 },
  { id: 'm74-hd', name: 'M74 - Phantom', type: 'hd_m74', pos: [650000, -350000, -250000], color: '#ffffff', scale: 78000, opacity: 0.9, tilt: 0.1 }
];

var GALACTIC_POI = [
  {
    id: 'sgr-a', name: 'Sagittarius A*', type: 'Supermassive Black Hole', tier: 1,
    pos: [0, 0, 0], vType: 'blackhole', scale: 1400, dotColor: '#ff8800',
    info: { 'Type': 'Supermassive Black Hole', 'Mass': '~4 million M☉', 'Distance': '~26 000 ly from Sol', 'Feature': 'Galactic center' }
  },
  {
    id: 'orion-neb', name: 'Orion Nebula', type: 'Emission Nebula', tier: 2,
    pos: [23750, 200, -3250], vType: 'nebula', scale: 500, dotColor: '#e06090',
    colors: [230, 90, 140, 180, 60, 200],
    info: { 'Type': 'Emission Nebula', 'Catalog': 'M42 / NGC 1976', 'Distance': '~1 344 ly', 'Diameter': '~24 ly', 'Feature': 'Closest massive star nursery' }
  },
  {
    id: 'eagle-neb', name: 'Eagle Nebula', type: 'Pillars of Creation', tier: 2,
    pos: [13200, 200, 9000], vType: 'nebula', scale: 650, dotColor: '#c08040',
    colors: [200, 130, 60, 140, 80, 160],
    info: { 'Type': 'H II Region', 'Catalog': 'M16 / NGC 6611', 'Distance': '~7 000 ly', 'Feature': 'Pillars of Creation', 'Diameter': '~70 × 55 ly' }
  },
  {
    id: 'crab-neb', name: 'Crab Nebula', type: 'Supernova Remnant', tier: 3,
    pos: [21000, -150, 6500], vType: 'supernova', scale: 400, dotColor: '#40a0ff',
    info: { 'Type': 'Supernova Remnant', 'Catalog': 'M1 / NGC 1952', 'Distance': '~6 500 ly', 'Diameter': '~11 ly', 'Supernova': 'SN 1054, observed in 1054 AD' }
  },
  {
    id: 'cygnus-x1', name: 'Cygnus X-1', type: 'Stellar Black Hole', tier: 2,
    pos: [28500, 200, 5500], vType: 'blackhole', scale: 350, dotColor: '#ff6600',
    info: { 'Type': 'Stellar Black Hole', 'Mass': '~21.2 M☉', 'Distance': '~6 070 ly', 'Companion': 'HDE 226868 (blue supergiant)', 'Feature': 'First widely accepted BH candidate' }
  },
  {
    id: 'eta-car', name: 'Eta Carinae', type: 'Hypergiant System', tier: 2,
    pos: [10400, 150, 14000], vType: 'star', scale: 400, dotColor: '#ffe040',
    starColor: [255, 230, 100],
    info: { 'Type': 'Luminous Blue Variable', 'Mass': '~100-120 M☉', 'Distance': '~7 500 ly', 'Luminosity': '~5 million L☉', 'Feature': 'Potential supernova progenitor' }
  },
  {
    id: 'ring-neb', name: 'Ring Nebula', type: 'Planetary Nebula', tier: 3,
    pos: [22400, 200, -3000], vType: 'ring', scale: 300, dotColor: '#60c0a0',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'M57 / NGC 6720', 'Distance': '~2 283 ly', 'Diameter': '~1.3 ly', 'Central star': 'White dwarf, 120 000 K' }
  },
  {
    id: 'pleiades', name: 'Pleiades', type: 'Open Cluster', tier: 2,
    pos: [24200, 300, -2400], vType: 'cluster', scale: 300, dotColor: '#80b0ff',
    info: { 'Type': 'Open Star Cluster', 'Catalog': 'M45', 'Distance': '~444 ly', 'Stars': '~1 000 (main ~9 visible)', 'Age': '~100 million years' }
  },
  {
    id: 'rosette-neb', name: 'Rosette Nebula', type: 'H II Region', tier: 3,
    pos: [13500, -150, 21000], vType: 'nebula', scale: 600, dotColor: '#e04060',
    colors: [230, 60, 90, 200, 40, 130],
    info: { 'Type': 'H II Region', 'Catalog': 'NGC 2237-46', 'Distance': '~5 200 ly', 'Diameter': '~130 ly', 'Feature': 'Active star-forming region' }
  },
  {
    id: 'vela-pulsar', name: 'Vela Pulsar', type: 'Supernova Remnant', tier: 3,
    pos: [23840, -250, -3200], vType: 'supernova', scale: 350, dotColor: '#40e0ff',
    info: { 'Type': 'Pulsar / SNR', 'Distance': '~936 ly', 'Spin': '~11.2 rev/s', 'Age': '~11 000 years', 'Feature': 'One of the nearest pulsars' }
  },
  {
    id: 'betelgeuse', name: 'Betelgeuse', type: 'Red Supergiant', tier: 3,
    pos: [24000, -200, -2200], vType: 'star', scale: 250, dotColor: '#ff4020',
    starColor: [255, 80, 30],
    info: { 'Type': 'Red Supergiant', 'Distance': '~700 ly', 'Diameter': '~1 400 × Sun', 'Luminosity': '~126 000 L☉', 'Feature': 'Will explode as supernova' }
  },
  {
    id: 'carina-neb', name: 'Carina Nebula', type: 'Giant Emission Nebula', tier: 1,
    pos: [11800, 0, 12200], vType: 'nebula', scale: 800, dotColor: '#ff9060',
    colors: [255, 140, 80, 200, 80, 180],
    info: { 'Type': 'Emission Nebula', 'Catalog': 'NGC 3372', 'Distance': '~7 600 ly', 'Diameter': '~300 ly', 'Feature': 'Contains Eta Carinae & Keyhole' }
  },
  {
    id: 'lagoon-neb', name: 'Lagoon Nebula', type: 'Emission Nebula', tier: 3,
    pos: [4500, -100, 18400], vType: 'nebula', scale: 500, dotColor: '#e07080',
    colors: [230, 100, 120, 160, 80, 180],
    info: { 'Type': 'H II Region', 'Catalog': 'M8 / NGC 6523', 'Distance': '~5 000 ly', 'Diameter': '~110 × 50 ly', 'Feature': 'Visible to the naked eye' }
  },
  {
    id: 'sol', name: 'Solar System', type: 'Our Star System', tier: 2,
    pos: [SUN_GAL.x, SUN_GAL.y, SUN_GAL.z], vType: 'system', scale: 400, dotColor: '#ffcc44',
    info: { 'Type': 'G2V Main Sequence Star', 'Position': 'Orion-Cygnus Arm', 'Distance from center': '~26 000 ly', 'Orbital period': '~225 million years', 'Neighborhood': 'Proxima (4.2 ly), Sirius (8.6 ly)' }
  },
  {
    id: 'alpha-centauri', name: 'Alpha Centauri', type: 'Star System', tier: 2,
    pos: [SUN_GAL.x + 1150, SUN_GAL.y + 120, SUN_GAL.z - 750], vType: 'system', scale: 350, dotColor: '#ffddaa',
    info: { 'Type': 'Triple Star System', 'Distance': '~4.37 ly from Sol', 'Stars': 'Rigil Kentaurus, Toliman, Proxima', 'Feature': 'Closest star system to Earth' }
  },
  {
    id: 'sirius', name: 'Sirius', type: 'Binary Star System', tier: 2,
    pos: [SUN_GAL.x - 600, SUN_GAL.y + 200, SUN_GAL.z + 500], vType: 'system', scale: 450, dotColor: '#bbddff',
    info: { 'Type': 'A-type Main-Sequence', 'Distance': '~8.6 ly from Sol', 'Companion': 'Sirius B (White Dwarf)', 'Feature': 'Brightest star in the sky' }
  },
  // ── Lot 2 : Expansion galactique (~13 nouveaux POI) ──
  {
    id: 'omega-centauri', name: 'Omega Centauri', type: 'Globular Cluster', tier: 2,
    pos: [500, 300, -20000], vType: 'cluster', scale: 500, dotColor: '#aaccff',
    info: { 'Type': 'Globular Cluster', 'Catalog': 'NGC 5139', 'Distance': '~15 800 ly', 'Stars': '~10 million', 'Feature': 'Largest known globular cluster in MW' }
  },
  {
    id: 'tarantula-neb', name: 'Tarantula Nebula', type: 'Giant H II Region', tier: 2,
    pos: [2500, -200, 13800], vType: 'nebula', scale: 700, dotColor: '#ff70a0',
    colors: [255, 110, 160, 200, 60, 140],
    info: { 'Type': 'H II Region (LMC)', 'Catalog': 'NGC 2070', 'Distance': '~160 000 ly', 'Diameter': '~600 ly', 'Feature': 'Most active star-forming region in Local Group' }
  },
  {
    id: 'pillars-neb', name: 'Trifid Nebula', type: 'Emission/Reflection', tier: 3,
    pos: [14700, 100, 2900], vType: 'nebula', scale: 400, dotColor: '#cc6688',
    colors: [200, 100, 130, 100, 80, 200],
    info: { 'Type': 'Emission + Reflection Nebula', 'Catalog': 'M20 / NGC 6514', 'Distance': '~5 200 ly', 'Feature': 'Combination of three nebula types' }
  },
  {
    id: 'helix-neb', name: 'Helix Nebula', type: 'Planetary Nebula', tier: 3,
    pos: [25200, 80, -1200], vType: 'ring', scale: 280, dotColor: '#40ccaa',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'NGC 7293', 'Distance': '~650 ly', 'Diameter': '~5.7 ly', 'Feature': 'Eye of God — closest large PN' }
  },
  {
    id: 'horsehead-neb', name: 'Horsehead Nebula', type: 'Dark Nebula', tier: 3,
    pos: [23400, 300, -3500], vType: 'darkneb', scale: 400, dotColor: '#884455',
    colors: [140, 70, 85, 80, 40, 60],
    info: { 'Type': 'Dark Nebula', 'Catalog': 'Barnard 33', 'Distance': '~1 375 ly', 'Feature': 'Iconic silhouette against IC 434' }
  },
  {
    id: 'ant-neb', name: 'Ant Nebula', type: 'Bipolar PN', tier: 4,
    pos: [-8600, -150, -15800], vType: 'bipolar', scale: 380, dotColor: '#ee8855',
    colors: [240, 140, 85, 180, 60, 100],
    info: { 'Type': 'Bipolar Planetary Nebula', 'Catalog': 'Mz 3', 'Distance': '~8 000 ly', 'Feature': 'Symmetrical jets from dying star' }
  },
  {
    id: 'cat-eye-neb', name: 'Cat\'s Eye Nebula', type: 'Planetary Nebula', tier: 4,
    pos: [21700, 150, -12500], vType: 'ring', scale: 400, dotColor: '#55ccaa',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'NGC 6543', 'Distance': '~3 300 ly', 'Feature': 'Complex concentric gas shells' }
  },
  {
    id: 'westerlund-2', name: 'Westerlund 2', type: 'Young Cluster', tier: 3,
    pos: [2000, -100, -14800], vType: 'cluster', scale: 350, dotColor: '#88aaff',
    info: { 'Type': 'Young Super Star Cluster', 'Distance': '~20 000 ly', 'Age': '~1–2 million years', 'Feature': 'Contains some of the hottest, brightest stars known' }
  },
  {
    id: 'cassiopeia-a', name: 'Cassiopeia A', type: 'Supernova Remnant', tier: 3,
    pos: [-8500, 200, 28800], vType: 'supernova', scale: 420, dotColor: '#55bbff',
    info: { 'Type': 'Supernova Remnant', 'Distance': '~11 000 ly', 'Diameter': '~16 ly', 'Supernova': '~1680 AD', 'Feature': 'Strongest extrasolar radio source' }
  },
  {
    id: 'ngc-3603', name: 'NGC 3603', type: 'Starburst Cluster', tier: 4,
    pos: [9700, 100, -2100], vType: 'cluster', scale: 400, dotColor: '#ddcc88',
    info: { 'Type': 'Giant H II Region / Starburst', 'Distance': '~20 000 ly', 'Feature': 'Densest concentration of massive stars in MW' }
  },
  {
    id: 'witch-head', name: 'Witch Head Nebula', type: 'Reflection Nebula', tier: 4,
    pos: [24500, -250, -4200], vType: 'reflection', scale: 420, dotColor: '#6688cc',
    colors: [100, 140, 220, 50, 70, 160],
    info: { 'Type': 'Reflection Nebula', 'Catalog': 'IC 2118', 'Distance': '~900 ly', 'Feature': 'Illuminated by Rigel' }
  },
  {
    id: 'sgr-b2', name: 'Sagittarius B2', type: 'Molecular Cloud', tier: 4,
    pos: [1800, -200, 400], vType: 'darkneb', scale: 500, dotColor: '#997744',
    colors: [150, 120, 70, 100, 80, 50],
    info: { 'Type': 'Giant Molecular Cloud', 'Distance': '~390 ly from Sgr A*', 'Mass': '~3 million M☉', 'Feature': 'Contains complex organic molecules' }
  },
  {
    id: 'rigel', name: 'Rigel', type: 'Blue Supergiant', tier: 4,
    pos: [24300, -200, -3800], vType: 'star', scale: 380, dotColor: '#aaccff',
    starColor: [170, 210, 255],
    info: { 'Type': 'Blue Supergiant (B8Ia)', 'Distance': '~860 ly', 'Luminosity': '~120 000 L☉', 'Feature': 'Brightest star in Orion' }
  },
  // ── Lot 3 : 15 nouveaux POI galactiques ──
  {
    id: 'pistol-star', name: 'Pistol Star', type: 'Blue Hypergiant', tier: 3,
    pos: [3500, -100, 2500], vType: 'star', scale: 450, dotColor: '#88ccff',
    starColor: [140, 200, 255],
    info: { 'Type': 'Luminous Blue Variable', 'Distance': '~25 000 ly (near Sgr A*)', 'Luminosity': '~1.6 million L☉', 'Feature': 'One of the most luminous stars known' }
  },
  {
    id: 'hercules-cluster', name: 'M13 Hercules Cluster', type: 'Globular Cluster', tier: 3,
    pos: [13800, 250, -18400], vType: 'cluster', scale: 420, dotColor: '#ccddff',
    info: { 'Type': 'Globular Cluster', 'Catalog': 'NGC 6205', 'Distance': '~22 200 ly', 'Stars': '~300 000', 'Feature': 'Most famous globular cluster' }
  },
  {
    id: 'butterfly-neb', name: 'Butterfly Nebula', type: 'Bipolar PN', tier: 4,
    pos: [-9400, -100, 19900], vType: 'bipolar', scale: 400, dotColor: '#dd66aa',
    colors: [220, 100, 170, 160, 50, 130],
    info: { 'Type': 'Bipolar Planetary Nebula', 'Catalog': 'NGC 6302', 'Distance': '~3 400 ly', 'Feature': 'One of the hottest dying stars (~250 000 K)' }
  },
  {
    id: 'bubble-neb', name: 'Bubble Nebula', type: 'Emission Nebula', tier: 4,
    pos: [15200, 100, -9600], vType: 'nebula', scale: 350, dotColor: '#ee8866',
    colors: [240, 140, 100, 180, 80, 140],
    info: { 'Type': 'H II Emission Nebula', 'Catalog': 'NGC 7635', 'Distance': '~7 100 ly', 'Diameter': '~6 ly', 'Feature': 'Blown by stellar wind from SAO 20575' }
  },
  {
    id: 'tycho-snr', name: 'Tycho\'s SNR', type: 'Supernova Remnant', tier: 4,
    pos: [-20400, -150, -8200], vType: 'supernova', scale: 380, dotColor: '#44bbee',
    info: { 'Type': 'Type Ia Supernova Remnant', 'Catalog': 'SN 1572 / 3C 10', 'Distance': '~8 000 ly', 'Supernova': '1572 AD (Tycho Brahe)', 'Feature': 'Key to understanding Type Ia supernovae' }
  },
  {
    id: 'gum-neb', name: 'Gum Nebula', type: 'Supernova Remnant', tier: 2,
    pos: [-15200, 100, 9700], vType: 'nebula', scale: 700, dotColor: '#ee9988',
    colors: [240, 150, 130, 180, 100, 120],
    info: { 'Type': 'Ancient SNR / Emission Nebula', 'Distance': '~1 500 ly', 'Diameter': '~1 100 ly', 'Age': '~1 million years', 'Feature': 'One of the largest known emission nebulae' }
  },
  {
    id: 'ngc-6397', name: 'NGC 6397', type: 'Globular Cluster', tier: 3,
    pos: [-9600, 200, 7200], vType: 'cluster', scale: 350, dotColor: '#aabbdd',
    info: { 'Type': 'Globular Cluster', 'Distance': '~7 800 ly', 'Stars': '~400 000', 'Age': '~13.4 billion years', 'Feature': 'One of the closest globular clusters to Earth' }
  },
  {
    id: 'red-spider', name: 'Red Spider Nebula', type: 'Planetary Nebula', tier: 4,
    pos: [-9800, -80, 2200], vType: 'ring', scale: 320, dotColor: '#ee5533',
    info: { 'Type': 'Planetary Nebula', 'Catalog': 'NGC 6537', 'Distance': '~4 000 ly', 'Feature': 'Fastest stellar winds measured (~300 km/s)' }
  },
  {
    id: 'boomerang-neb', name: 'Boomerang Nebula', type: 'Reflection Nebula', tier: 3,
    pos: [-21600, -150, 12600], vType: 'reflection', scale: 400, dotColor: '#6699dd',
    colors: [100, 150, 220, 60, 100, 200],
    info: { 'Type': 'Pre-planetary / Reflection Nebula', 'Distance': '~5 000 ly', 'Temp': '~1 K (-272°C)', 'Feature': 'Coldest known natural place in the universe' }
  },
  {
    id: 'north-america', name: 'North America Nebula', type: 'Emission Nebula', tier: 3,
    pos: [-14700, 100, -3100], vType: 'nebula', scale: 550, dotColor: '#ee7755',
    colors: [240, 120, 85, 180, 70, 100],
    info: { 'Type': 'H II Emission Nebula', 'Catalog': 'NGC 7000', 'Distance': '~2 590 ly', 'Diameter': '~140 ly', 'Feature': 'Shape resembles North America continent' }
  },
  {
    id: 'terzan-5', name: 'Terzan 5', type: 'Globular Cluster', tier: 4,
    pos: [-5100, -200, -3100], vType: 'cluster', scale: 300, dotColor: '#ccaa66',
    info: { 'Type': 'Globular Cluster (Bulge)', 'Distance': '~19 000 ly', 'Feature': 'Fossil remnant of MW formation — two distinct stellar populations' }
  },
  {
    id: 'v838-mon', name: 'V838 Monocerotis', type: 'Peculiar Variable', tier: 4,
    pos: [8900, -100, -28600], vType: 'star', scale: 380, dotColor: '#ff4422',
    starColor: [255, 70, 35],
    info: { 'Type': 'Red Transient / Variable Star', 'Distance': '~19 000 ly', 'Feature': 'Famous light echo expanding at the speed of light' }
  },
  {
    id: 'cannonball-psr', name: 'Cannonball Pulsar', type: 'Pulsar / PWN', tier: 4,
    pos: [-7800, 100, -9100], vType: 'supernova', scale: 320, dotColor: '#33ddcc',
    info: { 'Type': 'Pulsar Wind Nebula', 'Catalog': 'IGR J11014-6103', 'Distance': '~15 000 ly', 'Speed': '~1 000 km/s', 'Feature': 'Fastest known pulsar with jet trail' }
  },
  {
    id: 'omega-neb', name: 'Omega Nebula', type: 'Emission Nebula', tier: 3,
    pos: [-1000, 100, -10000], vType: 'nebula', scale: 480, dotColor: '#ee5577',
    colors: [240, 85, 120, 200, 50, 100],
    info: { 'Type': 'H II / Emission Nebula', 'Catalog': 'M17 / NGC 6618', 'Distance': '~5 500 ly', 'Diameter': '~15 ly', 'Feature': 'Swan shape, one of the brightest in the MW' }
  },
  {
    id: 'sn-1006', name: 'SN 1006 Remnant', type: 'Supernova Remnant', tier: 3,
    pos: [-28000, -150, -1000], vType: 'supernova', scale: 450, dotColor: '#44aaee',
    info: { 'Type': 'Type Ia Supernova Remnant', 'Distance': '~7 200 ly', 'Diameter': '~65 ly', 'Supernova': '1006 AD', 'Feature': 'Brightest stellar event in recorded history' }
  },
  // ── Lot 4 : 15 POI uniques visuellement ──
  {
    id: 'wr104', name: 'WR 104', type: 'Wolf-Rayet Pinwheel', tier: 3,
    pos: [7500, 80, 2700], vType: 'wolfrayet', scale: 420, dotColor: '#88eeff',
    wrColors: [130, 220, 255, 60, 140, 200],
    info: { 'Type': 'Wolf-Rayet Star + Pinwheel', 'Distance': '~8 400 ly', 'Feature': 'Spiral dust pinwheel — potential gamma-ray burst progenitor' }
  },
  {
    id: 'sgr-magnetar', name: 'SGR 1806-20', type: 'Magnetar', tier: 4,
    pos: [5200, -120, -4800], vType: 'magnetar', scale: 380, dotColor: '#ff55ff',
    magColors: [255, 80, 255, 100, 40, 200],
    info: { 'Type': 'Magnetar', 'Distance': '~50 000 ly', 'Mag. Field': '~10^15 Gauss', 'Feature': 'Dec 2004 hyperflare — most energetic event ever recorded from within MW' }
  },
  {
    id: 'iras16293', name: 'IRAS 16293-2422', type: 'Protostellar System', tier: 4,
    pos: [22800, -80, -5500], vType: 'protostar', scale: 350, dotColor: '#ffaa44',
    protoColors: [255, 170, 70, 200, 100, 40],
    info: { 'Type': 'Class 0 Protostar (Binary)', 'Distance': '~460 ly', 'Feature': 'Sugar molecules detected — key to origins of life' }
  },
  {
    id: 'ic443', name: 'Jellyfish Nebula', type: 'SNR Shell', tier: 3,
    pos: [-15000, -100, -14000], vType: 'shellsnr', scale: 450, dotColor: '#44ddaa',
    shellColors: [70, 220, 170, 40, 150, 200],
    info: { 'Type': 'Shell-type Supernova Remnant', 'Catalog': 'IC 443', 'Distance': '~5 000 ly', 'Feature': 'Jellyfish shape — interacts with molecular cloud' }
  },
  {
    id: 'wr142', name: 'WR 142', type: 'Wolf-Rayet Star', tier: 4,
    pos: [-18000, 80, -18500], vType: 'wolfrayet', scale: 360, dotColor: '#66ddee',
    wrColors: [100, 200, 230, 40, 120, 180],
    info: { 'Type': 'WO-type Wolf-Rayet Star', 'Distance': '~4 700 ly', 'Temp': '~200 000 K', 'Feature': 'Hottest known star in the Milky Way' }
  },
  {
    id: 'sgr-1935', name: 'SGR 1935+2154', type: 'Magnetar / FRB', tier: 4,
    pos: [18500, 120, 15000], vType: 'magnetar', scale: 350, dotColor: '#dd44ff',
    magColors: [220, 70, 255, 140, 30, 180],
    info: { 'Type': 'Magnetar + Fast Radio Burst', 'Distance': '~14 000 ly', 'Feature': 'First galactic FRB — linked magnetars to FRBs' }
  },
  {
    id: 'barnard68', name: 'Barnard 68', type: 'Bok Globule', tier: 4,
    pos: [25800, 60, 3200], vType: 'darkneb', scale: 300, dotColor: '#443322',
    colors: [70, 50, 35, 30, 20, 15],
    info: { 'Type': 'Bok Globule (Dark Cloud)', 'Distance': '~500 ly', 'Diameter': '~0.5 ly', 'Feature': 'Near-perfect spherical dark cloud — future star nursery' }
  },
  {
    id: 'w49a', name: 'W49A', type: 'Ultra-compact H II', tier: 3,
    pos: [6800, 150, -10500], vType: 'protostar', scale: 500, dotColor: '#ffcc33',
    protoColors: [255, 200, 50, 220, 130, 30],
    info: { 'Type': 'Ultra-compact H II Region', 'Distance': '~36 000 ly', 'Luminosity': '~10^7 L☉', 'Feature': 'Most luminous star-forming region in the MW' }
  },
  {
    id: 'puppis-a', name: 'Puppis A', type: 'SNR Shell', tier: 3,
    pos: [20500, -180, 17500], vType: 'shellsnr', scale: 480, dotColor: '#33ccbb',
    shellColors: [50, 200, 190, 30, 140, 180],
    info: { 'Type': 'Shell Supernova Remnant', 'Distance': '~7 000 ly', 'Age': '~3 700 years', 'Feature': 'One of the brightest X-ray sources in the sky' }
  },
  {
    id: 'wr124', name: 'WR 124 + M1-67', type: 'Wolf-Rayet Nebula', tier: 4,
    pos: [30000, -80, -15000], vType: 'wolfrayet', scale: 390, dotColor: '#77ddcc',
    wrColors: [120, 220, 200, 50, 160, 150],
    info: { 'Type': 'Wolf-Rayet Star + Ejected Nebula', 'Distance': '~15 000 ly', 'Feature': 'JWST showcase — clumpy ejected nebula moving at 150 km/s' }
  },
  {
    id: 'w50-manatee', name: 'W50 / Manatee Nebula', type: 'SS 433 Relic', tier: 3,
    pos: [-5000, -200, 22000], vType: 'shellsnr', scale: 520, dotColor: '#55ddaa',
    shellColors: [85, 220, 170, 50, 180, 140],
    info: { 'Type': 'SNR + Microquasar Jet', 'Distance': '~18 000 ly', 'Diameter': '~700 × 350 ly', 'Feature': 'Distorted by relativistic jets from SS 433' }
  },
  {
    id: 'protostar-l1527', name: 'L1527 Protostar', type: 'Protostar', tier: 4,
    pos: [23000, 50, -6200], vType: 'protostar', scale: 340, dotColor: '#ff8833',
    protoColors: [255, 140, 50, 200, 80, 20],
    info: { 'Type': 'Class 0/I Protostar', 'Distance': '~460 ly (Taurus)', 'Feature': 'JWST hourglass image — edge-on accretion disk' }
  },
  {
    id: 'magnetar-1e', name: '1E 2259+586', type: 'Magnetar in SNR', tier: 4,
    pos: [-24000, 100, -20000], vType: 'magnetar', scale: 370, dotColor: '#cc44ee',
    magColors: [200, 70, 240, 120, 40, 200],
    info: { 'Type': 'Magnetar inside SNR CTB 109', 'Distance': '~10 000 ly', 'Feature': 'First magnetar found inside a supernova remnant shell' }
  },
  {
    id: 'snr-w28', name: 'W28', type: 'Mixed-Morphology SNR', tier: 4,
    pos: [3000, 80, -6000], vType: 'shellsnr', scale: 400, dotColor: '#44ccaa',
    shellColors: [70, 200, 170, 40, 160, 140],
    info: { 'Type': 'Mixed-Morphology SNR', 'Distance': '~6 000 ly', 'Age': '~35 000 years', 'Feature': 'Accelerates cosmic rays — interacts with giant molecular clouds' }
  },
  {
    id: 'wr-nebula-rcw58', name: 'RCW 58', type: 'Wolf-Rayet Ring Nebula', tier: 4,
    pos: [16500, -130, -17000], vType: 'wolfrayet', scale: 380, dotColor: '#55ccdd',
    wrColors: [85, 200, 220, 40, 140, 180],
    info: { 'Type': 'WR Ring Nebula', 'Catalog': 'RCW 58 / Gum 38b', 'Distance': '~9 500 ly', 'Feature': 'Blown bubble from WR 40 stellar wind' }
  }
];


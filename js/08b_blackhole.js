'use strict';

// =============================================================================
// TROU NOIR VOLUMÉTRIQUE RELATIVISTE (SAGITTARIUS A* — LOD 0)
// Shaders GLSL stricts avec déflexion gravitationnelle, disque d'accrétion,
// effet Doppler relativiste (beaming) et fond étoilé lentillé.
// =============================================================================

const blackHoleVertexShader = `
varying vec3 vLocalPosition;
varying vec3 vWorldPosition;

void main() {
    vLocalPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const blackHoleFragmentShader = `
uniform float u_time;
uniform vec3 u_cameraLocalPos;
uniform float u_cameraDistance;
uniform float u_qualityLevel; // 0.0 = Low, 1.0 = Med, 2.0 = High

// Palette & Dynamique paramétrables (ex: Sgr A* orange vs Cygnus X-1 cyan/violet)
uniform vec3 u_colorOuter;
uniform vec3 u_colorMid;
uniform vec3 u_colorInner;
uniform vec3 u_colorDopplerBlue;
uniform vec3 u_colorDopplerRed;
uniform float u_diskSpeed;
uniform float u_emissionStrength;

varying vec3 vLocalPosition;
varying vec3 vWorldPosition;

// ── FONCTIONS BRUIT & FBM (Optimisées) ──
float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = i.x + i.y * 57.0 + 113.0 * i.z;
    return mix(
        mix(mix(hash(n +   0.0), hash(n +   1.0), f.x),
            mix(hash(n +  57.0), hash(n +  58.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
}

float fbm3(vec3 p) {
    float f = 0.0, w = 0.5;
    for (int i = 0; i < 3; i++) { f += w * noise(p); p *= 2.0; w *= 0.5; }
    return f;
}

float fbm2(vec3 p) {
    float f = 0.0, w = 0.5;
    for (int i = 0; i < 2; i++) { f += w * noise(p); p *= 2.0; w *= 0.5; }
    return f;
}

// ── CONSTANTES RELATIVISTES ──

const float RS = 1.0;
const float BOUND_RADIUS = 32.0;

void main() {
    // 1. Calcul du rayon optique depuis la caméra dans l'espace local
    vec3 rayDir = normalize(vLocalPosition - u_cameraLocalPos);
    
    // 2. Intersection analytique rayon / sphère englobante de rayon R = 32.0
    // Si la caméra est loin (à l'extérieur), on saute tout le vide et on commence exactement à l'entrée !
    float camDist2 = dot(u_cameraLocalPos, u_cameraLocalPos);
    float R2 = BOUND_RADIUS * BOUND_RADIUS;
    vec3 p = u_cameraLocalPos;
    
    if (camDist2 > R2) {
        float b = dot(u_cameraLocalPos, rayDir);
        float c = camDist2 - R2;
        float delta = b * b - c;
        if (delta < 0.0) discard; // Le rayon manque la sphère englobante
        float tEnter = -b - sqrt(delta);
        p = u_cameraLocalPos + max(0.0, tEnter) * rayDir;
    }

    vec3 v = rayDir;
    vec3 col = vec3(0.0);
    float transmittance = 1.0;
    float dt = 0.0;

    // 3. LOD DYNAMIQUE : Raymarching Adaptatif selon la distance à la caméra et la qualité !
    // Transition progressive (20 à 250) et minimum rehaussé à 100 étapes pour que les rayons atteignent le fond et le côté droit
    float distFactor = clamp((u_cameraDistance - 20.0) / 230.0, 0.0, 1.0);
    float targetSteps = mix(220.0, 100.0, distFactor);
    if (u_qualityLevel < 0.5) targetSteps *= 0.65;
    else if (u_qualityLevel < 1.5) targetSteps *= 0.85;
    
    int maxSteps = clamp(int(targetSteps), 50, 250);

    // 4. Boucle de Raymarching Relativiste
    for(int i = 0; i < 300; i++) {
        if (i >= maxSteps) break;
        
        float r2 = dot(p, p);
        float r = sqrt(r2);
        
        // Horizon des événements (Absorption noire)
        if (r < RS * 0.98) {
            transmittance = 0.0;
            break;
        }
        
        // Sortie de la sphère englobante si le rayon s'éloigne dans le vide
        if (r > BOUND_RADIUS && dot(p, v) >= 0.0) {
            break;
        }
        
        // Déflexion gravitationnelle (Relativité Générale)
        vec3 perp = p - dot(v, p) * v;
        vec3 accel = -1.5 * RS * perp / (r2 * r2);
        
        // Pas géodésique adaptatif
        float distToPlane = abs(p.y);
        dt = min(r * 0.12, max(0.035, distToPlane * 0.5));
        
        v = normalize(v + accel * dt);
        p += v * dt;
        
        // Disque d'accrétion (Enveloppe géométrique & FBM)
        float diskInner = RS * 2.4;
        float diskOuter = 20.0;
        float diskThickness = 0.06 + r * 0.022;
        
        if (abs(p.y) < diskThickness && r > diskInner && r < diskOuter) {
            float geomEnv = smoothstep(diskThickness, 0.0, abs(p.y));
            geomEnv *= smoothstep(diskInner, diskInner + 1.5, r);
            geomEnv *= smoothstep(diskOuter, diskOuter - 4.0, r);
            
            if (geomEnv > 0.005) {
                float velAngle = (2.0 / pow(r, 1.5)) * u_time * u_diskSpeed;
                vec3 pRot = p;
                float cosA = cos(velAngle), sinA = sin(velAngle);
                pRot.xz = mat2(cosA, -sinA, sinA, cosA) * pRot.xz;
                
                float dens = fbm3(pRot * 2.5) * fbm2(pRot * 5.0 - u_time * 0.4);
                dens *= geomEnv;
                
                if (dens > 0.002) {
                    vec3 rotVel = normalize(vec3(-p.z, 0.0, p.x));
                    float speed = 0.85 / sqrt(r);
                    float doppler = dot(v, rotVel) * speed;
                    float beaming = pow(max(0.0, 1.0 + doppler * 1.5), 3.5);
                    
                    float temp = smoothstep(diskOuter, diskInner, r);
                    
                    vec3 baseCol = (temp > 0.5) 
                        ? mix(u_colorMid, u_colorInner, (temp - 0.5) * 2.0)
                        : mix(u_colorOuter, u_colorMid, temp * 2.0);
                    
                    if (doppler > 0.0) baseCol = mix(baseCol, u_colorDopplerBlue, doppler * 1.2);
                    else baseCol = mix(baseCol, u_colorDopplerRed, -doppler * 1.0);
                    
                    vec3 emission = baseCol * dens * beaming * u_emissionStrength;
                    float absorption = exp(-dens * dt * 7.0);
                    
                    col += emission * transmittance * dt;
                    transmittance *= absorption;
                }
            }
        }
        
        if (transmittance < 0.01) break;
    }
    
    // Si le rayon traverse le vide sans toucher le disque ni l'horizon, on libère le pixel
    if (transmittance > 0.995) discard;

    // L'alpha correspond à l'opacité physique (1.0 = opaque/noir absolu pour l'horizon, 0.0 = vide transparent)
    float alpha = clamp(1.0 - transmittance, 0.0, 1.0);
    gl_FragColor = vec4(max(col, 0.0), alpha);
}
`;

// =============================================================================
// CLASSE BlackHole (Scope Global Three.js r128)
// =============================================================================
class BlackHole {
  constructor(options = {}) {
    // Calcul du facteur d'échelle : l'espace local du shader a un BOUND_RADIUS = 32.0.
    const worldRadius = options.radius || 21000.0;
    this.scaleFactor = options.scaleFactor || (worldRadius / 32.0);
    this.qualityLevel = options.qualityLevel !== undefined ? options.qualityLevel : 2.0; // 2.0 = High
    this.theme = options.theme || 'orange'; // 'orange' (Sgr A*) ou 'cyan_violet' / 'cygnus' (Cygnus X-1)

    // Configuration chromatique et dynamique selon le type de trou noir
    const isCyan = (this.theme === 'cyan_violet' || this.theme === 'cygnus');
    const colorOuter       = isCyan ? new THREE.Vector3(0.35, 0.08, 0.75) : new THREE.Vector3(0.55, 0.13, 0.02);
    const colorMid         = isCyan ? new THREE.Vector3(0.18, 0.60, 1.00) : new THREE.Vector3(0.95, 0.52, 0.10);
    const colorInner       = isCyan ? new THREE.Vector3(0.80, 0.96, 1.00) : new THREE.Vector3(1.00, 0.90, 0.72);
    const colorDopplerBlue = isCyan ? new THREE.Vector3(0.92, 0.98, 1.00) : new THREE.Vector3(1.00, 0.93, 0.80);
    const colorDopplerRed  = isCyan ? new THREE.Vector3(0.32, 0.04, 0.60) : new THREE.Vector3(0.60, 0.08, 0.00);
    const diskSpeed        = isCyan ? 2.2 : 0.8;
    const emissionStrength = isCyan ? 6.2 : 5.85;

    this._tempVec = new THREE.Vector3();
    this.group = new THREE.Group();

    // Matériau volumétrique principal
    this.volumetricMaterial = new THREE.ShaderMaterial({
      vertexShader: blackHoleVertexShader,
      fragmentShader: blackHoleFragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_cameraLocalPos: { value: new THREE.Vector3(0, 0, 0) },
        u_cameraDistance: { value: 20.0 },
        u_qualityLevel: { value: this.qualityLevel },
        u_colorOuter: { value: colorOuter },
        u_colorMid: { value: colorMid },
        u_colorInner: { value: colorInner },
        u_colorDopplerBlue: { value: colorDopplerBlue },
        u_colorDopplerRed: { value: colorDopplerRed },
        u_diskSpeed: { value: diskSpeed },
        u_emissionStrength: { value: emissionStrength }
      },
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      premultipliedAlpha: true
    });

    // Sphère géométrique de rayon local 32.0
    const sphereGeom = new THREE.SphereGeometry(32.0, 48, 48);
    this.volumetricMesh = new THREE.Mesh(sphereGeom, this.volumetricMaterial);
    this.group.add(this.volumetricMesh);

    // Mise à l'échelle du groupe dans le monde
    this.group.scale.set(this.scaleFactor, this.scaleFactor, this.scaleFactor);
  }

  // ── API PUBLIQUE ──
  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  update(time, camera, renderer, dt = 0.016) {
    if (!camera) return;

    this.volumetricMaterial.uniforms.u_time.value = time;
    
    // Calcul précis de la position caméra dans l'espace local du Mesh
    this.volumetricMesh.updateMatrixWorld();
    camera.getWorldPosition(this._tempVec);
    this.volumetricMesh.worldToLocal(this._tempVec);
    this.volumetricMaterial.uniforms.u_cameraLocalPos.value.copy(this._tempVec);
    
    // LOD Dynamique : Mesure de distance en unités locales
    const dist = this._tempVec.length();
    this.volumetricMaterial.uniforms.u_cameraDistance.value = dist;
  }

  getMesh() {
    return this.group;
  }
}

window.BlackHole = BlackHole;

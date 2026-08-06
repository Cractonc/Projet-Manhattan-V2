'use strict';

// ============================================================
// UI
// ============================================================
function buildPlanetList() {
  const list = document.getElementById('body-list');
  const sys = SYSTEMS_DATA[state.currentSystem] || SYSTEMS_DATA['sol'];
  list.appendChild(makeBodyItem({ id: 'sun', name: sys.name + ' Star', type: 'Star', dotColor: sys.sunColor ? `rgb(${sys.sunColor.r},${sys.sunColor.g},${sys.sunColor.b})` : '#ffcc44' }));
  for (const d of sys.bodies) { list.appendChild(makeBodyItem(d)); }
}

function buildPOIList() {
  const list = document.getElementById('poi-list');
  for (const poi of GALACTIC_POI) {
    const item = document.createElement('div');
    item.className = 'body-item';
    item.dataset.id = poi.id;
    item.innerHTML = `
      <div class="body-dot" style="background:${poi.dotColor}"></div>
      <div style="flex:1">
        <div class="body-name">${poi.name}</div>
        <div class="body-type">${poi.type}</div>
        <div class="poi-actions">
          <button class="poi-btn" data-action="auto" data-poi="${poi.id}">AUTO</button>
          <button class="poi-btn warp-btn" data-action="warp" data-poi="${poi.id}">WARP</button>
          ${poi.vType === 'system' ? `<button class="poi-btn enter-btn" data-action="enter" data-poi="${poi.id}">ENTER</button>` : ''}
        </div>
      </div>`;
    item.addEventListener('click', (e) => {
      // Don't trigger focus if clicking a button
      if (e.target.classList.contains('poi-btn')) return;
      if (state.scaleLevel !== 'GALACTIC') {
        initiateWarpToGalaxy();
        setTimeout(() => {
          galCam.focusOn(poi.id);
          highlightPOIItem(poi.id);
        }, 4000);
      } else {
        galCam.focusOn(poi.id);
        highlightPOIItem(poi.id);
      }
    });
    list.appendChild(item);
  }

  // Delegate AUTO/WARP button clicks
  list.addEventListener('click', e => {
    const btn = e.target.closest('.poi-btn');
    if (!btn) return;
    e.stopPropagation();
    const poiId = btn.dataset.poi;
    const action = btn.dataset.action;

    function ensureGalacticCockpit(then) {
      const inShip = state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK';
      if (state.scaleLevel !== 'GALACTIC') {
        if (!inShip) toggleCockpitMode();
        setTimeout(() => {
          initiateWarpToGalaxy();
          setTimeout(then, 4500);
        }, 700);
      } else if (!inShip) {
        toggleCockpitMode();
        setTimeout(then, 700);
      } else {
        then();
      }
    }

    if (action === 'auto') {
      ensureGalacticCockpit(() => {
        state.cockpitTarget = poiId;
        state.cockpitAutoNav = true;
      });
    } else if (action === 'warp') {
      ensureGalacticCockpit(() => {
        state.cockpitTarget = poiId;
        if (galacticPOIObjects[poiId]) {
          initiateWarpToPOI(poiId);
        }
      });
    } else if (action === 'enter') {
      if (state.scaleLevel === 'GALACTIC') {
        initiateWarpToSystem(poiId);
      }
    }
  });
}

function highlightPOIItem(id) {
  document.querySelectorAll('#poi-list .body-item').forEach(i => i.classList.remove('active'));
  const item = document.querySelector(`#poi-list .body-item[data-id="${id}"]`);
  if (item) item.classList.add('active');
}

function makeBodyItem(d) {
  const item = document.createElement('div');
  item.className = 'body-item';
  item.dataset.id = d.id;
  item.innerHTML = `
    <div class="body-dot" style="background:${d.dotColor}"></div>
    <div>
      <div class="body-name">${d.name}</div>
      <div class="body-type">${d.type}</div>
    </div>`;
  item.addEventListener('click', () => {
    cam.focusOn(d.id);
    document.querySelectorAll('#body-list .body-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
  return item;
}

function switchPanelTab(tab) {
  const tabSystem = document.getElementById('tab-system');
  const tabGalaxy = document.getElementById('tab-galaxy');
  const bodyList = document.getElementById('body-list');
  const poiList = document.getElementById('poi-list');
  const solarControls = document.getElementById('solar-controls');

  const btnGalaxy = solarControls.querySelector('#btn-galaxy');

  if (tab === 'galaxy') {
    tabSystem.classList.remove('active');
    tabGalaxy.classList.add('active');
    bodyList.style.display = 'none';
    poiList.style.display = '';
    document.getElementById('poi-filters').style.display = 'flex';
    if (btnGalaxy) btnGalaxy.textContent = '☀️ SOLAR SYSTEM';
  } else {
    tabSystem.classList.add('active');
    tabGalaxy.classList.remove('active');
    bodyList.style.display = '';
    poiList.style.display = 'none';
    document.getElementById('poi-filters').style.display = 'none';
    if (btnGalaxy) btnGalaxy.textContent = '🌌 GALAXY MAP';
  }
}

function updateInfoCard(data) {
  const card = document.getElementById('info-card');
  card.style.display = 'block';
  document.getElementById('info-name').textContent = data.name;
  const rows = document.getElementById('info-rows');
  rows.innerHTML = '';
  const info = data.info || {};
  for (const [k, v] of Object.entries(info)) {
    const row = document.createElement('div');
    row.className = 'info-row';
    row.innerHTML = `<span class="info-key">${k}</span><span class="info-val">${v}</span>`;
    rows.appendChild(row);
  }
  document.getElementById('info-actions').innerHTML = '';
  document.getElementById('hud-target').textContent = data.name.toUpperCase();
}

function updateGalacticInfoCard(data) {
  const card = document.getElementById('info-card');
  card.style.display = 'block';
  document.getElementById('info-name').textContent = data.name;
  const rows = document.getElementById('info-rows');
  rows.innerHTML = '';
  const info = data.info || {};
  for (const [k, v] of Object.entries(info)) {
    const row = document.createElement('div');
    row.className = 'info-row';
    row.innerHTML = `<span class="info-key">${k}</span><span class="info-val">${v}</span>`;
    rows.appendChild(row);
  }

  // Actions
  const actions = document.getElementById('info-actions');
  actions.innerHTML = '';

  if (data.vType === 'system') {
    const btn = document.createElement('button');
    btn.className = 'enter-system-btn';
    btn.textContent = '⚡ ENTER SYSTEM';
    btn.addEventListener('click', () => {
      if (state.scaleLevel === 'GALACTIC') {
        initiateWarpToSystem(data.id);
      }
    });
    actions.appendChild(btn);
  } else if (state.cameraMode === 'COCKPIT' && state.scaleLevel === 'GALACTIC') {
    // "Warp to" button
    const btn = document.createElement('button');
    btn.className = 'enter-system-btn';
    btn.textContent = '⚡ WARP TO ' + data.name.toUpperCase();
    btn.addEventListener('click', () => {
      state.cockpitTarget = data.id;
      initiateWarpToPOI(data.id);
    });
    actions.appendChild(btn);
  }

  document.getElementById('hud-target').textContent = data.name.toUpperCase();
}

function hideInfoCard() {
  document.getElementById('info-card').style.display = 'none';
  document.getElementById('info-actions').innerHTML = '';
  document.querySelectorAll('.body-item').forEach(i => i.classList.remove('active'));
}

function updateHUD() {
  if (state.selectedBody && planetObjects[state.selectedBody]) {
    document.getElementById('hud-target').textContent = planetObjects[state.selectedBody].data.name.toUpperCase();
  }
}

function updateLabels() {
  if (!state.showLabels || state.cameraMode === 'COCKPIT' || state.cameraMode === 'WALK') {
    document.getElementById('labels').style.display = 'none';
    return;
  }
  document.getElementById('labels').style.display = '';

  if (state.scaleLevel === 'GALACTIC') {
    // Hide solar labels
    for (const id in planetObjects) {
      if (planetObjects[id].label) planetObjects[id].label.style.opacity = '0';
    }
    for (const item of labelEls) { item.el.style.opacity = '0'; }
    updateGalacticLabels();
    return;
  }

  // Hide galactic labels
  for (const item of galacticLabelEls) { item.el.style.opacity = '0'; }

  const w = window.innerWidth, h = window.innerHeight;
  const tempV = new THREE.Vector3();
  for (const id in planetObjects) {
    const obj = planetObjects[id];
    if (!obj.label) continue;
    obj.mesh.getWorldPosition(tempV);
    tempV.project(camera);
    const px = (tempV.x + 1) / 2 * w;
    const py = (-tempV.y + 1) / 2 * h;
    const behind = tempV.z > 1;
    if (behind || px < 0 || px > w || py < 0 || py > h) {
      obj.label.style.opacity = '0';
    } else {
      obj.label.style.opacity = '0.7';
      obj.label.style.left = px + 'px';
      obj.label.style.top = py + 'px';
    }
  }
}

function updateGalacticLabels() {
  const activeCamera = state.cameraMode === 'COCKPIT' ? cockpitCamera : galacticCamera;
  const w = window.innerWidth, h = window.innerHeight;
  const tempV = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  activeCamera.getWorldPosition(camPos);

  for (const item of galacticLabelEls) {
    item.group.getWorldPosition(tempV);
    const distToCam = tempV.distanceTo(camPos);

    // Check visibility: POI should be large enough on screen
    const angularSize = (item.data.scale || 300) / distToCam;
    const minVisible = 0.0005; // minimum angular size to show label

    tempV.project(activeCamera);
    const px = (tempV.x + 1) / 2 * w;
    const py = (-tempV.y + 1) / 2 * h;
    const behind = tempV.z > 1;

    if (behind || px < 0 || px > w || py < 0 || py > h) {
      item.el.style.opacity = '0';
    } else {
      let alpha = 0;
      const isSelected = (state.cockpitTarget === item.data.id || state.selectedPOI === item.data.id);

      if (isSelected) {
        alpha = 1.0;
      } else if (item.data.tier === 1) {
        alpha = 0.9;
      } else {
        // Calculate visibility thresholds based on tier
        let minVis = 0.0005;
        if (item.data.tier === 2) minVis = 0.0008;
        else if (item.data.tier === 3) minVis = 0.003;
        else if (item.data.tier === 4) minVis = 0.006;

        if (angularSize < minVis) {
          alpha = 0;
        } else {
          alpha = clamp((angularSize - minVis) / (minVis * 4), 0.15, 0.85);
        }
      }

      if (alpha > 0.05) {
        item.el.style.opacity = alpha.toFixed(2);
        item.el.style.left = px + 'px';
        item.el.style.top = py + 'px';
      } else {
        item.el.style.opacity = '0';
      }
    }
  }
}

// ============================================================
// CINEMATIC TOUR
// ============================================================
function startCinematic() {
  if (state.scaleLevel !== 'SOLAR') return;
  state.cameraMode = 'CINEMATIC';
  state.cinematicIndex = 0;
  state.cinematicTimer = 0;
  cinematicSequence = ['sun', ...BODIES.map(b => b.id)];
  document.getElementById('cinematic-label').classList.add('active');
  cam.focusOn(cinematicSequence[0]);
}

function stopCinematic() {
  state.cameraMode = 'ORBIT';
  document.getElementById('cinematic-label').classList.remove('active');
}

function updateCinematic(dt) {
  if (state.cameraMode !== 'CINEMATIC') return;
  state.cinematicTimer += dt;
  if (state.cinematicTimer > state.cinematicDuration) {
    state.cinematicTimer = 0;
    state.cinematicIndex = (state.cinematicIndex + 1) % cinematicSequence.length;
    cam.focusOn(cinematicSequence[state.cinematicIndex]);
    cam.tTheta += 0.4 + Math.random() * 0.6;
    cam.tPhi = 0.8 + Math.random() * 0.5;
  }
}


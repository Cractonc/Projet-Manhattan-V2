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
  setHUDTarget(data.name);
}

function updateGalacticInfoCard(data) {
  if (state.cameraMode === 'ASTROMETRY') return;
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

  setHUDTarget(data.name);
}

function hideInfoCard() {
  document.getElementById('info-card').style.display = 'none';
  document.getElementById('info-actions').innerHTML = '';
  document.querySelectorAll('.body-item').forEach(i => i.classList.remove('active'));
  setHUDTarget(null);
}

function updateHUD() {
  if (state.selectedBody && planetObjects[state.selectedBody]) {
    setHUDTarget(planetObjects[state.selectedBody].data.name);
  } else if (state.selectedPOI && typeof galacticPOIObjects !== 'undefined' && galacticPOIObjects[state.selectedPOI]) {
    setHUDTarget(galacticPOIObjects[state.selectedPOI].data.name);
  } else {
    setHUDTarget(null);
  }
}

function updateLabels() {
  if (state.cameraMode === 'ASTROMETRY') {
    document.getElementById('labels').style.display = '';
    for (const id in planetObjects) {
      if (planetObjects[id].label) planetObjects[id].label.style.opacity = '0';
    }
    for (const item of labelEls) { item.el.style.opacity = '0'; }
    updateGalacticLabels();
    return;
  }
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

// ============================================================
// NOTIFICATIONS SYSTEM
// ============================================================
function showNotification(text, duration = 4000) {
  const container = document.getElementById('notifications-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.innerHTML = `
    <span class="notif-icon">✦</span>
    <span class="notif-text">${text}</span>
  `;
  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 450);
  }, duration);
}

// ============================================================
// QUEST HUD SYSTEM
// ============================================================
function updateQuestHUD() {
  const hudEl = document.getElementById('quest-hud');
  if (!hudEl) return;

  const creditsEl = document.getElementById('quest-hud-credits');
  const titleEl = document.getElementById('quest-hud-title');
  const objEl = document.getElementById('quest-hud-obj');
  const rewardEl = document.getElementById('quest-hud-reward');

  const credits = state.player ? (state.player.credits || 0) : 0;
  if (creditsEl) creditsEl.textContent = credits.toLocaleString() + ' CR';

  if (!state.player || !state.player.activeQuestId || typeof QUESTS === 'undefined') {
    if (titleEl) titleEl.textContent = 'Toutes missions accomplies !';
    if (objEl) objEl.textContent = 'Explorez librement la galaxie.';
    if (rewardEl) rewardEl.textContent = 'Explorateur d\'Élite';
    return;
  }

  const quest = QUESTS.find(q => q.id === state.player.activeQuestId);
  if (!quest) {
    if (titleEl) titleEl.textContent = 'Toutes missions accomplies !';
    if (objEl) objEl.textContent = 'Explorez librement la galaxie.';
    if (rewardEl) rewardEl.textContent = 'Explorateur d\'Élite';
    return;
  }

  if (titleEl) titleEl.textContent = quest.title;

  // Calculate real-time distance
  const targetPoi = typeof GALACTIC_POI !== 'undefined' ? GALACTIC_POI.find(p => p.id === quest.targetPOI_ID) : null;
  let distStr = '';
  if (targetPoi && state.shipPosition) {
    let shipGalPos = state.shipPosition;
    if (state.scaleLevel === 'SOLAR' && typeof SUN_GAL !== 'undefined') {
      // Dans le système solaire, la position galactique est celle du Soleil
      shipGalPos = new THREE.Vector3(SUN_GAL.x, SUN_GAL.y, SUN_GAL.z);
    }
    const targetPos = new THREE.Vector3(targetPoi.pos[0], targetPoi.pos[1], targetPoi.pos[2]);
    const dist = shipGalPos.distanceTo(targetPos);
    distStr = ` (~${formatDistance(dist)})`;
  }

  const targetName = targetPoi ? targetPoi.name : quest.targetPOI_ID;
  if (objEl) {
    if (state.scaleLevel === 'SOLAR') {
      objEl.textContent = `Objectif : Passer en Galaxie (G) → ${targetName}${distStr}`;
    } else {
      objEl.textContent = `Objectif : Atteindre ${targetName}${distStr}`;
    }
  }
  if (rewardEl) rewardEl.textContent = `+${quest.reward || quest.credits || 500} CR`;
}

// ============================================================
// CODEX SYSTEM
// ============================================================
var codexSelectedPOI = null;
var codexActiveFilter = 'all';

function openCodex() {
  const overlay = document.getElementById('codex-overlay');
  if (!overlay) return;
  overlay.classList.add('active');

  // Update header stats
  const totalPOIs = typeof GALACTIC_POI !== 'undefined' ? GALACTIC_POI.length : 0;
  const discoveredCount = (state.player && state.player.discoveredPOIs) ? state.player.discoveredPOIs.length : 0;
  
  const statDiscovered = document.getElementById('codex-stat-discovered');
  if (statDiscovered) statDiscovered.textContent = `${discoveredCount} / ${totalPOIs}`;

  const statCredits = document.getElementById('codex-stat-credits');
  if (statCredits) statCredits.textContent = `${(state.player?.credits || 0).toLocaleString()} CR`;

  // Select initial POI if none selected
  if (!codexSelectedPOI && typeof GALACTIC_POI !== 'undefined' && GALACTIC_POI.length > 0) {
    const activeQuest = (typeof QUESTS !== 'undefined' && state.player?.activeQuestId)
      ? QUESTS.find(q => q.id === state.player.activeQuestId) : null;
    if (activeQuest && activeQuest.targetPOI_ID) {
      codexSelectedPOI = activeQuest.targetPOI_ID;
    } else if (state.player?.discoveredPOIs?.length > 0) {
      codexSelectedPOI = state.player.discoveredPOIs[0];
    } else {
      codexSelectedPOI = GALACTIC_POI[0].id;
    }
  }

  renderCodexList();
  if (codexSelectedPOI) renderCodexDetail(codexSelectedPOI);
}

function closeCodex() {
  const overlay = document.getElementById('codex-overlay');
  if (overlay) overlay.classList.remove('active');
}

function toggleCodex() {
  const overlay = document.getElementById('codex-overlay');
  if (!overlay) return;
  if (overlay.classList.contains('active')) {
    closeCodex();
  } else {
    openCodex();
  }
}

function renderCodexList(searchQuery = '') {
  const listEl = document.getElementById('codex-list');
  if (!listEl || typeof GALACTIC_POI === 'undefined') return;

  listEl.innerHTML = '';
  const discovered = (state.player && state.player.discoveredPOIs) ? state.player.discoveredPOIs : [];
  const q = searchQuery.toLowerCase().trim();

  for (const poi of GALACTIC_POI) {
    const isDiscovered = discovered.includes(poi.id);

    // Filter checks
    if (codexActiveFilter === 'discovered' && !isDiscovered) continue;
    if (codexActiveFilter === 'locked' && isDiscovered) continue;

    // Search checks
    if (q) {
      const nameMatch = isDiscovered && poi.name.toLowerCase().includes(q);
      const typeMatch = isDiscovered && poi.type.toLowerCase().includes(q);
      const idMatch = poi.id.toLowerCase().includes(q);
      if (!nameMatch && !typeMatch && !idMatch) continue;
    }

    const item = document.createElement('div');
    item.className = 'codex-item' + (isDiscovered ? '' : ' locked') + (poi.id === codexSelectedPOI ? ' active' : '');
    item.dataset.id = poi.id;

    const displayName = isDiscovered ? poi.name : '??? - Données inconnues';
    const displayType = isDiscovered ? poi.type : 'Secteur non exploré';
    const dotColor = isDiscovered ? (poi.dotColor || '#4a90c4') : '#445566';
    const badgeHtml = isDiscovered
      ? `<span class="codex-item-badge discovered">✓ DÉCOUVERT</span>`
      : `<span class="codex-item-badge locked">🔒 INCONNU</span>`;

    item.innerHTML = `
      <div class="codex-item-dot" style="background:${dotColor}"></div>
      <div class="codex-item-content">
        <div class="codex-item-name">${displayName}</div>
        <div class="codex-item-type">${displayType}</div>
      </div>
      ${badgeHtml}
    `;

    item.addEventListener('click', () => {
      codexSelectedPOI = poi.id;
      document.querySelectorAll('#codex-list .codex-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      renderCodexDetail(poi.id);
    });

    listEl.appendChild(item);
  }
}

function renderCodexDetail(poiId) {
  const detailEl = document.getElementById('codex-detail');
  if (!detailEl || typeof GALACTIC_POI === 'undefined') return;

  const poi = GALACTIC_POI.find(p => p.id === poiId);
  if (!poi) {
    detailEl.innerHTML = '<div class="codex-locked-box"><div class="codex-locked-title">SÉLECTIONNEZ UN ASTRE</div></div>';
    return;
  }

  const discovered = (state.player && state.player.discoveredPOIs) ? state.player.discoveredPOIs : [];
  const isDiscovered = discovered.includes(poi.id);

  if (!isDiscovered) {
    // Locked view
    detailEl.innerHTML = `
      <div class="codex-locked-box">
        <div class="codex-locked-icon">🔒</div>
        <div class="codex-locked-title">??? - DONNÉES INCONNUES</div>
        <div class="codex-locked-desc">
          Ce secteur n'a pas encore été analysé par les capteurs de bord de votre vaisseau.
          Rapprochez-vous de cette région dans la galaxie pour analyser l'astre et déverrouiller sa fiche scientifique détaillée dans le Codex.
        </div>
        <div class="codex-locked-hint">
          Indice spatial : Coordonnées [X: ${Math.round(poi.pos[0])}, Y: ${Math.round(poi.pos[1])}, Z: ${Math.round(poi.pos[2])}]
        </div>
      </div>
    `;
    return;
  }

  // Discovered view
  const entry = getCodexEntry(poi.id);
  const title = entry.name || poi.name;
  const catalog = entry.catalog || poi.info?.Catalog || poi.id.toUpperCase();
  const category = entry.category || poi.type;
  const distance = entry.distance || poi.info?.Distance || "Inconnue";
  const desc = entry.description || "Données scientifiques enregistrées.";

  // Build specs grid from features
  let specsHtml = '';
  const features = entry.features || poi.info || {};
  for (const [k, v] of Object.entries(features)) {
    specsHtml += `
      <div class="codex-spec-card">
        <div class="codex-spec-key">${k}</div>
        <div class="codex-spec-val">${v}</div>
      </div>
    `;
  }

  detailEl.innerHTML = `
    <div class="codex-detail-header">
      <div class="codex-detail-top-tags">
        <span class="codex-tag codex-tag-category">${category}</span>
        <span class="codex-tag codex-tag-dist">📍 ${distance}</span>
        <span class="codex-tag codex-tag-discovered">✓ ANALYSÉ</span>
      </div>
      <h3 class="codex-detail-title">${title}</h3>
      <div class="codex-detail-catalog">DÉSIGNATION OFFICIELLE : ${catalog}</div>
    </div>

    <div class="codex-section-title">DONNÉES ASTROPHYSIQUES & OBSERVATION</div>
    <div class="codex-detail-desc">${desc}</div>

    <div class="codex-section-title">CARACTÉRISTIQUES SCIENTIFIQUES</div>
    <div class="codex-specs-grid">
      ${specsHtml}
    </div>

    <div class="codex-actions">
      <button class="codex-btn-target" id="codex-btn-warp" data-poi="${poi.id}">
        ⚡ NAVIGUER VERS ${title.toUpperCase()}
      </button>
    </div>
  `;

  // Attach target button handler
  const warpBtn = document.getElementById('codex-btn-warp');
  if (warpBtn) {
    warpBtn.addEventListener('click', () => {
      closeCodex();
      const poiTarget = warpBtn.dataset.poi;
      if (state.scaleLevel !== 'GALACTIC') {
        initiateWarpToGalaxy();
        setTimeout(() => {
          if (typeof initiateWarpToPOI === 'function' && galacticPOIObjects[poiTarget]) {
            state.cockpitTarget = poiTarget;
            initiateWarpToPOI(poiTarget);
          } else if (typeof galCam !== 'undefined') {
            galCam.focusOn(poiTarget);
          }
        }, 4000);
      } else {
        if (state.cameraMode === 'COCKPIT' && typeof initiateWarpToPOI === 'function') {
          state.cockpitTarget = poiTarget;
          initiateWarpToPOI(poiTarget);
        } else if (typeof galCam !== 'undefined') {
          galCam.focusOn(poiTarget);
          highlightPOIItem(poiTarget);
        }
      }
    });
  }
}

function setupCodexUI() {
  // Close button
  const btnClose = document.getElementById('btn-close-codex');
  if (btnClose) btnClose.addEventListener('click', closeCodex);

  // Overlay background click
  const overlay = document.getElementById('codex-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCodex();
    });
  }

  // Filter tabs
  document.querySelectorAll('.codex-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      codexActiveFilter = tab.dataset.filter;
      const searchInput = document.getElementById('codex-search');
      renderCodexList(searchInput ? searchInput.value : '');
    });
  });

  // Search input
  const searchInput = document.getElementById('codex-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderCodexList(e.target.value);
    });
  }

  // Side panel Codex button
  const btnCodex = document.getElementById('btn-codex');
  if (btnCodex) btnCodex.addEventListener('click', openCodex);

  // Quest HUD click
  const questHud = document.getElementById('quest-hud');
  if (questHud) questHud.addEventListener('click', openCodex);
}

// ============================================================
// ASTROMETRY 3D LAB & SURVEY SYSTEM
// ============================================================
var astroActiveFilter = 'all';

function updateAstrometryPOIVisibility() {
  const discovered = (state.player && Array.isArray(state.player.discoveredPOIs))
    ? state.player.discoveredPOIs
    : ['sol'];

  for (const id in galacticPOIObjects) {
    const obj = galacticPOIObjects[id];
    const isDisc = discovered.includes(id);

    // Activer ou masquer le modèle 3D haute fidélité
    if (obj.detail) {
      obj.detail.visible = isDisc;
    }
    // Activer ou masquer la balise anomalique pour les astres inconnus
    if (obj.anomalyBeacon) {
      obj.anomalyBeacon.visible = !isDisc;
    }
  }

  // Adapter les étiquettes flottantes
  if (typeof galacticLabelEls !== 'undefined') {
    for (const item of galacticLabelEls) {
      const isDisc = discovered.includes(item.data.id);
      if (isDisc) {
        item.el.textContent = item.data.name.toUpperCase();
        item.el.classList.remove('poi-label-anomaly');
      } else {
        item.el.textContent = '[ ??? SIGNAL INCONNU ]';
        item.el.classList.add('poi-label-anomaly');
      }
    }
  }
}

function restoreGalacticPOIVisibility() {
  for (const id in galacticPOIObjects) {
    const obj = galacticPOIObjects[id];
    if (obj.detail) {
      obj.detail.visible = true;
    }
    if (obj.anomalyBeacon) {
      obj.anomalyBeacon.visible = false;
    }
  }
  if (typeof galacticLabelEls !== 'undefined') {
    for (const item of galacticLabelEls) {
      item.el.textContent = item.data.name.toUpperCase();
      item.el.classList.remove('poi-label-anomaly');
    }
  }
}

function updateAstrometryHUD() {
  if (typeof GALACTIC_POI === 'undefined') return;

  const discovered = (state.player && Array.isArray(state.player.discoveredPOIs))
    ? state.player.discoveredPOIs
    : ['sol'];

  const total = GALACTIC_POI.length;
  const discCount = discovered.length;
  const pct = Math.round((discCount / Math.max(1, total)) * 100);

  const countEl = document.getElementById('astro-disc-count');
  const totalEl = document.getElementById('astro-total-count');
  const pctEl = document.getElementById('astro-disc-pct');

  if (countEl) countEl.textContent = discCount;
  if (totalEl) totalEl.textContent = total;
  if (pctEl) pctEl.textContent = pct + '%';

  renderAstrometryList();
}

function renderAstrometryList() {
  const listEl = document.getElementById('astro-poi-list');
  if (!listEl || typeof GALACTIC_POI === 'undefined') return;

  const discovered = (state.player && Array.isArray(state.player.discoveredPOIs))
    ? state.player.discoveredPOIs
    : ['sol'];

  listEl.innerHTML = '';

  const filtered = GALACTIC_POI.filter(poi => {
    const isDisc = discovered.includes(poi.id);
    if (astroActiveFilter === 'discovered') return isDisc;
    if (astroActiveFilter === 'locked') return !isDisc;
    return true;
  });

  for (const poi of filtered) {
    const isDisc = discovered.includes(poi.id);
    const item = document.createElement('div');
    item.className = 'astro-poi-item' + (isDisc ? '' : ' locked') + (state.selectedPOI === poi.id ? ' active' : '');
    item.dataset.id = poi.id;

    const dotColor = isDisc ? (poi.dotColor || '#00d8ff') : '#ffaa00';
    const nameText = isDisc ? poi.name : '[ ??? ANOMALIE ]';
    const subText = isDisc
      ? (poi.type || 'Secteur stellaire')
      : `Secteur [${Math.round(poi.pos[0]/1000)}k, ${Math.round(poi.pos[2]/1000)}k]`;

    item.innerHTML = `
      <div class="astro-poi-dot" style="background:${dotColor}; color:${dotColor};"></div>
      <div class="astro-poi-info">
        <div class="astro-poi-name">${nameText}</div>
        <div class="astro-poi-sub">${subText}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      selectAstrometryPOI(poi.id);
    });

    listEl.appendChild(item);
  }
}

function selectAstrometryPOI(poiId) {
  if (typeof galacticPOIObjects === 'undefined' || !galacticPOIObjects[poiId]) return;

  state.selectedPOI = poiId;
  const obj = galacticPOIObjects[poiId];
  const poi = obj.data;
  const discovered = (state.player && Array.isArray(state.player.discoveredPOIs))
    ? state.player.discoveredPOIs
    : ['sol'];
  const isDisc = discovered.includes(poiId);

  // Mettre à jour la caméra
  if (typeof galCam !== 'undefined') {
    if (isDisc) {
      galCam.focusOn(poiId);
    } else {
      const pos = obj.group.position;
      galCam.tLookAt.copy(pos);
      galCam.tRadius = Math.max(poi.scale * 4.0, 7000);
    }
  }

  // Mettre à jour l'élément actif dans la liste latérale
  document.querySelectorAll('.astro-poi-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === poiId);
  });

  // Calcul de distance au Soleil
  let distStr = '---';
  if (poi.pos && typeof SUN_GAL !== 'undefined') {
    const d = Math.round(new THREE.Vector3(poi.pos[0], poi.pos[1], poi.pos[2]).distanceTo(new THREE.Vector3(SUN_GAL.x, SUN_GAL.y, SUN_GAL.z)));
    distStr = `${d.toLocaleString()} AL du Soleil`;
  }

  // Rendu de la carte d'inspection
  const card = document.getElementById('astro-inspect-card');
  if (!card) return;

  if (isDisc) {
    // ── ASTRE DÉCOUVERT : SIMULATION 3D ENTIÈREMENT DÉBLOQUÉE ──
    let gridHtml = '';
    if (poi.info) {
      for (const k in poi.info) {
        gridHtml += `
          <div class="astro-grid-cell">
            <div class="astro-grid-lbl">${k}</div>
            <div class="astro-grid-val">${poi.info[k]}</div>
          </div>
        `;
      }
    }

    const codex = (typeof CODEX_DATA !== 'undefined' && CODEX_DATA[poiId]) ? CODEX_DATA[poiId] : null;
    const descText = codex ? codex.description : (poi.info && poi.info.Feature ? poi.info.Feature : 'Données télémétriques et simulation volumétrique 3D intégrales.');

    card.innerHTML = `
      <div class="astro-card-badge discovered">✅ ARCHIVE 3D DÉVERROUILLÉE</div>
      <div class="astro-card-header">
        <div class="astro-card-title">${poi.name.toUpperCase()}</div>
        <div class="astro-card-sub">${poi.type || 'Secteur stellaire'}</div>
      </div>
      <div class="astro-card-meta">
        <div><strong>Coordonnées :</strong> [X: ${Math.round(poi.pos[0])}, Y: ${Math.round(poi.pos[1])}, Z: ${Math.round(poi.pos[2])}]</div>
        <div><strong>Distance relative :</strong> ${distStr}</div>
      </div>
      <div class="astro-grid-table">${gridHtml}</div>
      <div class="astro-desc">${descText}</div>
      <div class="astro-card-actions">
        <button class="astro-btn-primary" id="btn-astro-set-flight">🎯 DÉFINIR COMME DESTINATION DE VOL</button>
        <button class="astro-btn-secondary" id="btn-astro-recenter">🔍 RECENTRER LA VUE 3D</button>
      </div>
    `;
  } else {
    // ── ASTRE NON CARTOGRAPHIÉ : MODÈLE 3D VERROUILLÉ ──
    const relatedQuest = (typeof QUESTS !== 'undefined')
      ? QUESTS.find(q => q.targetPOI_ID === poiId)
      : null;

    const questHintHtml = relatedQuest
      ? `<div class="astro-quest-hint">📋 Mission cartographique : <strong>${relatedQuest.title}</strong> (+${relatedQuest.reward} CR)</div>`
      : '';

    card.innerHTML = `
      <div class="astro-card-badge locked">🔒 MODÈLE 3D VERROUILLÉ</div>
      <div class="astro-card-header">
        <div class="astro-card-title">[ ??? SIGNAL ANOMALIE ]</div>
        <div class="astro-card-sub">Émission radiative / gravitationnelle non identifiée</div>
      </div>
      <div class="astro-card-meta">
        <div><strong>Secteur galactique :</strong> [X: ${Math.round(poi.pos[0]/1000)}k, Z: ${Math.round(poi.pos[2]/1000)}k]</div>
        <div><strong>Distance estimée :</strong> ~${distStr}</div>
      </div>
      <div class="astro-locked-panel">
        <div class="astro-locked-title">⚠️ TÉLÉMÉTRIE INSUFFISANTE</div>
        <p>Les capteurs passifs du Manhattan ont intercepté des signaux dans cette région, mais le vaisseau n'a encore enregistré aucun relevé topographique local.</p>
        <div class="astro-locked-steps">
          <div class="astro-step-item"><span class="step-num">1</span> Rejoignez ce secteur à bord du Manhattan en mode pilotage.</div>
          <div class="astro-step-item"><span class="step-num">2</span> Entrez dans le rayon de détection locale pour calibrer les capteurs.</div>
          <div class="astro-step-item"><span class="step-num">3</span> Le modèle 3D haute fidélité sera automatiquement synthétisé dans cette holotable.</div>
        </div>
      </div>
      ${questHintHtml}
      <div class="astro-card-actions">
        <button class="astro-btn-primary" id="btn-astro-set-flight">🎯 TRACER LE CAP DE NAVIGATION</button>
        <button class="astro-btn-secondary" id="btn-astro-recenter">🔍 CENTRER SUR L'ANOMALIE</button>
      </div>
    `;
  }

  // Câbler les boutons d'action
  const btnSet = document.getElementById('btn-astro-set-flight');
  if (btnSet) {
    btnSet.addEventListener('click', () => {
      setFlightTargetFromAstrometry(poiId);
    });
  }
  const btnRecenter = document.getElementById('btn-astro-recenter');
  if (btnRecenter) {
    btnRecenter.addEventListener('click', () => {
      if (isDisc) {
        galCam.focusOn(poiId);
      } else {
        const pos = obj.group.position;
        galCam.tLookAt.copy(pos);
        galCam.tRadius = Math.max(poi.scale * 4.0, 7000);
      }
    });
  }
}

function setFlightTargetFromAstrometry(poiId) {
  if (typeof galacticPOIObjects === 'undefined' || !galacticPOIObjects[poiId]) return;

  state.cockpitTarget = poiId;
  const discovered = (state.player && Array.isArray(state.player.discoveredPOIs))
    ? state.player.discoveredPOIs
    : ['sol'];
  const isDisc = discovered.includes(poiId);
  const name = isDisc ? galacticPOIObjects[poiId].data.name : ('ANOMALIE ' + poiId.toUpperCase());

  if (typeof setHUDTarget === 'function') {
    setHUDTarget(name);
  }
  if (typeof showNotification === 'function') {
    showNotification(`🧭 Cap verrouillé sur l'ordinateur de bord : ${name}`);
  }
}

function setupAstrometryUI() {
  const btnExit = document.getElementById('btn-exit-astrometry');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      if (typeof exitAstrometryMode === 'function') exitAstrometryMode();
    });
  }

  // Onglets de filtre du catalogue
  document.querySelectorAll('.astro-filter-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.astro-filter-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      astroActiveFilter = tab.dataset.filter || 'all';
      renderAstrometryList();
    });
  });
}



import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
import './theme.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#"><span class="brand-mark"><i></i><i></i><i></i></span><span>FORM<span class="brand-light"> / VIEWER</span></span></a>
    <div class="top-center"><span class="live-dot"></span> LOCAL WORKSPACE <span class="top-sep">/</span> <span id="scene-count">EMPTY SCENE</span></div>
    <div class="top-actions"><button class="icon-button theme-button" id="theme-button" title="Switch to light mode">☼</button><button class="icon-button" id="help-button" title="Controls">?</button><span class="top-divider"></span><button class="avatar" title="Local workspace">A</button></div>
  </header>
  <main class="layout">
    <aside class="sidebar">
      <div class="sidebar-heading"><div><div class="eyebrow">YOUR WORKSPACE</div><h1>Model library</h1></div><button class="add-button" id="add-button" title="Import GLB">+</button></div>
      <label class="search"><span>⌕</span><input id="search" placeholder="Search models..."/><kbd>/</kbd></label>
      <div class="section-label"><span>LIBRARY</span><span id="library-count">0</span></div>
      <div class="library-list" id="library-list"></div>
      <div class="library-empty" id="library-empty"><div class="empty-glyph">↗</div><strong>Your library starts here</strong><p>Drop a .glb file anywhere in this panel to save a model for later.</p><button id="empty-import">Import a model <span>↗</span></button></div>
      <div class="sidebar-bottom"><div class="storage-icon">▧</div><div><strong>Saved on this device</strong><small>Models stay in your local library</small></div><span class="status-check">✓</span></div>
    </aside>
    <section class="workspace">
      <div class="workspace-head"><div><div class="eyebrow">3D WORKSPACE</div><div class="workspace-title"><h2>Review space</h2><span class="scene-badge" id="scene-badge">0 OBJECTS</span></div></div><div class="workspace-tools"><button class="tool-button" id="frame-button" title="Frame selected or all (F)"><span>⊙</span> Frame</button><span class="tool-divider"></span><div class="mode-switch"><button class="mode active" data-mode="rotate" title="Orbit camera"><span>↻</span></button><button class="mode" data-mode="move" title="Move selected (W)"><span>✥</span></button><button class="mode" data-mode="scale" title="Scale selected (R)"><span>⤢</span></button></div><span class="tool-divider"></span><button class="tool-button" id="grid-button" title="Toggle grid"><span>▦</span> Grid</button><button class="tool-button danger" id="delete-button" title="Remove selected (Delete)" disabled><span>⌫</span></button></div></div>
      <div class="viewport-wrap" id="viewport-wrap"><div id="viewport"></div><div class="drop-overlay" id="drop-overlay"><div class="drop-card"><div class="drop-icon">↓</div><strong>Drop your model here</strong><span>GLB files are saved to your library automatically</span></div></div>
        <div class="viewport-hint" id="viewport-hint"><span class="hint-key">DRAG</span> orbit <i></i><span class="hint-key">SCROLL</span> zoom <i></i><span class="hint-key">CLICK</span> select</div>
        <div class="view-label"><span class="live-dot"></span><span id="view-label">PERSPECTIVE</span></div>
        <div class="axis-cube" aria-hidden="true"><span class="axis-y">Y</span><span class="axis-x">X</span><span class="axis-z">Z</span><div></div></div>
        <div class="object-card hidden" id="object-card"><div class="object-thumb">◈</div><div class="object-card-copy"><small>SELECTED OBJECT</small><strong id="selected-name">Model</strong><small class="triangle-detail" id="selected-triangles">0 triangles</small></div><button id="card-remove" title="Remove from scene">×</button></div>
        <div class="animation-panel hidden" id="animation-panel"><div class="animation-title"><span class="pulse">◉</span><strong>Animation</strong><button id="close-animation" title="Close">×</button></div><select id="animation-select"><option value="">No animation</option></select><button class="play-button" id="play-button">▶ <span>Play animation</span></button></div>
        <div class="toast hidden" id="toast"></div>
      </div>
      <footer class="workspace-foot"><div><span class="ready-dot"></span><span id="footer-status">Ready to review</span></div><div class="foot-right"><span id="object-total">0 objects</span><span class="triangle-total">TRIANGLES <b id="triangle-count">0</b></span><span class="tool-divider"></span><span>WORLD UNITS <b>METERS</b></span><span class="tool-divider"></span><button id="reset-camera">Reset view <span>↗</span></button></div></footer>
    </section>
  </main>
  <input type="file" id="file-input" accept=".glb,model/gltf-binary" multiple hidden />
  <div class="modal hidden" id="help-modal"><div class="modal-card"><button id="close-help" class="modal-close">×</button><div class="eyebrow">QUICK GUIDE</div><h2>Make yourself at home.</h2><p>Import GLB models into your local library, then double-click one or drag it into the scene. Every placement is independent.</p><div class="shortcut-list"><div><span>Orbit camera</span><kbd>Left drag</kbd></div><div><span>Pan camera</span><kbd>Right drag</kbd></div><div><span>Zoom</span><kbd>Scroll</kbd></div><div><span>Delete selected</span><kbd>Del</kbd></div><div><span>Move / scale</span><kbd>W / R</kbd></div><div><span>Frame selection</span><kbd>F</kbd></div></div><button class="modal-ok" id="help-ok">Got it</button></div></div>
`;

const $ = (s) => document.querySelector(s);
const viewport = $('#viewport');
const wrap = $('#viewport-wrap');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#111318');
const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
camera.position.set(6, 5, 7);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
viewport.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 0.8, 0);
const hemi = new THREE.HemisphereLight(0xdce8ff, 0x37322e, 2.1);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff3e3, 3.4);
key.position.set(5, 9, 5); scene.add(key);
const fill = new THREE.DirectionalLight(0xaac6ff, 1.2); fill.position.set(-5, 4, -4); scene.add(fill);
const grid = new THREE.GridHelper(30, 60, 0x33363d, 0x25272d); grid.position.y = -0.012; scene.add(grid);
const gridColorAttribute = grid.geometry.getAttribute('color');
const originalMajorGridColor = new THREE.Color(0x33363d);
const originalMinorGridColor = new THREE.Color(0x25272d);
const gridColorKinds = new Uint8Array(gridColorAttribute.count);
const gridSampleColor = new THREE.Color();
for (let i = 0; i < gridColorAttribute.count; i++) {
  gridSampleColor.fromBufferAttribute(gridColorAttribute, i);
  const majorDistance = (gridSampleColor.r - originalMajorGridColor.r) ** 2 + (gridSampleColor.g - originalMajorGridColor.g) ** 2 + (gridSampleColor.b - originalMajorGridColor.b) ** 2;
  const minorDistance = (gridSampleColor.r - originalMinorGridColor.r) ** 2 + (gridSampleColor.g - originalMinorGridColor.g) ** 2 + (gridSampleColor.b - originalMinorGridColor.b) ** 2;
  gridColorKinds[i] = majorDistance < minorDistance ? 1 : 0;
}
const transform = new TransformControls(camera, renderer.domElement);
transform.addEventListener('dragging-changed', (e) => { controls.enabled = !e.value; });
transform.addEventListener('objectChange', () => { if (selected) { selectionHighlight.update(selected); updateSelectedCard(); } });
scene.add(transform.getHelper());

const loader = new GLTFLoader();
const objects = [];
let selected = null;
let currentMode = 'rotate';
let mixers = [];
let library = [];
let toastTimer;
let currentTheme = localStorage.getItem('quick3d-theme') || 'dark';
const selectionHighlight = new THREE.BoxHelper(new THREE.Object3D(), 0xd4f36a);
selectionHighlight.material.depthTest = false;
selectionHighlight.material.transparent = true;
selectionHighlight.material.opacity = 0.95;
selectionHighlight.material.toneMapped = false;
selectionHighlight.renderOrder = 10;
selectionHighlight.frustumCulled = false;
selectionHighlight.visible = false;
scene.add(selectionHighlight);

function resize() { const w = viewport.clientWidth, h = viewport.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); }
new ResizeObserver(resize).observe(viewport); resize();
function animate() { requestAnimationFrame(animate); const dt = clock.getDelta(); controls.update(); for (const mixer of mixers) mixer.update(dt); renderer.render(scene, camera); }
const clock = new THREE.Clock(); animate();

function toast(message, bad = false) { const el = $('#toast'); el.textContent = message; el.classList.toggle('bad', bad); el.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 3200); }
function setStatus(msg) { $('#footer-status').textContent = msg; }
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('quick3d-theme', theme);
  const light = theme === 'light';
  scene.background.set(light ? '#e9edf1' : '#111318');
  const majorColor = new THREE.Color(light ? 0xaeb6c0 : 0x33363d);
  const minorColor = new THREE.Color(light ? 0xd1d6dc : 0x25272d);
  for (let i = 0; i < gridColorAttribute.count; i++) {
    const color = gridColorKinds[i] ? majorColor : minorColor;
    gridColorAttribute.setXYZ(i, color.r, color.g, color.b);
  }
  gridColorAttribute.needsUpdate = true;
  const button = $('#theme-button');
  button.textContent = light ? '☾' : '☼';
  button.title = light ? 'Switch to dark mode' : 'Switch to light mode';
}
function updateCounts() {
  const n = objects.length; $('#scene-count').textContent = n ? `${String(n).padStart(2, '0')} IN SCENE` : 'EMPTY SCENE';
  $('#scene-badge').textContent = `${n} ${n === 1 ? 'OBJECT' : 'OBJECTS'}`; $('#object-total').textContent = `${n} ${n === 1 ? 'object' : 'objects'}`;
  $('#triangle-count').textContent = objects.reduce((total, object) => total + object.triangles, 0).toLocaleString();
  $('#delete-button').disabled = !selected; $('#viewport-hint').classList.toggle('hidden', n > 0);
}
function countTriangles(root) {
  let total = 0;
  root.traverse(object => {
    if (!object.isMesh || !object.geometry) return;
    const geometry = object.geometry;
    const elements = geometry.index ? geometry.index.count : geometry.getAttribute('position')?.count || 0;
    total += Math.floor(elements / 3) * (object.isInstancedMesh ? object.count : 1);
  });
  return total;
}
function prettySize(bytes) { if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function iconFor(name) { return name.toLowerCase().includes('chair') ? '⌂' : name.toLowerCase().includes('lamp') ? '◉' : name.toLowerCase().includes('car') ? '▱' : '◈'; }

function renderLibrary() {
  const q = $('#search').value.trim().toLowerCase();
  const list = $('#library-list'); list.innerHTML = '';
  const entries = library.filter(x => x.name.toLowerCase().includes(q));
  $('#library-count').textContent = String(library.length).padStart(2, '0');
  $('#library-empty').classList.toggle('hidden', library.length > 0 || !!q);
  for (const item of entries) {
    const row = document.createElement('div'); row.className = 'model-row'; row.draggable = true; row.dataset.id = item.id;
    row.innerHTML = `<div class="model-thumb">${iconFor(escapeHtml(item.name))}</div><div class="model-meta"><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong><small>${prettySize(item.size)} <i>·</i> GLB</small></div><div class="row-actions"><button class="row-add" title="Add to scene">+</button><button class="row-delete" title="Delete model from library">×</button></div>`;
    row.addEventListener('dragstart', e => { e.dataTransfer.setData('application/x-model-id', item.id); e.dataTransfer.effectAllowed = 'copy'; });
    row.addEventListener('dblclick', () => addLibraryModel(item));
    row.querySelector('.row-add').addEventListener('click', e => { e.stopPropagation(); addLibraryModel(item); });
    row.querySelector('.row-delete').addEventListener('click', e => { e.stopPropagation(); deleteLibraryModel(item); });
    list.appendChild(row);
  }
  if (q && entries.length === 0) { const empty = document.createElement('div'); empty.className = 'search-empty'; empty.textContent = 'No models match your search.'; list.appendChild(empty); }
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }

async function loadLibrary(attempt = 0) {
  try {
    const response = await fetch('/api/models', { cache: 'no-store' });
    if (!response.ok) throw new Error('Library server not available');
    const models = await response.json();
    if (!Array.isArray(models)) throw new Error('Model library returned an invalid response');
    library = models; renderLibrary(); setStatus('Ready to review');
  } catch (err) {
    if (attempt < 10) {
      setStatus('Connecting to model library…');
      await new Promise(resolve => setTimeout(resolve, 700));
      return loadLibrary(attempt + 1);
    }
    setStatus('Model library unavailable');
    toast('Could not connect to your model library. Restart the viewer and reload this page.', true);
  }
}

async function importFiles(files) {
  const valid = [...files].filter(f => f.name.toLowerCase().endsWith('.glb'));
  if (!valid.length) { toast('Please choose a .glb file.', true); return; }
  for (const file of valid) {
    setStatus(`Saving ${file.name}…`);
    try {
      const response = await fetch(`/api/models/${encodeURIComponent(file.name)}`, { method: 'PUT', headers: { 'Content-Type': 'model/gltf-binary' }, body: file });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      toast(`Saved ${file.name} to your library`);
      await loadLibrary();
      const entry = library.find(m => m.id === result.id) || result;
      addLibraryModel(entry);
    } catch (err) { toast(err.message || `Could not import ${file.name}`, true); }
  }
  setStatus('Ready to review');
}

async function deleteLibraryModel(item) {
  if (!window.confirm(`Delete “${item.name}” from your library? This removes its GLB file from the models folder.`)) return;
  try {
    const response = await fetch(`/api/models/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not delete this model.');
    await loadLibrary();
    toast(`Removed ${item.name} from your library`);
  } catch (err) { toast(err.message || 'Could not delete this model.', true); }
}

function addLibraryModel(item) {
  setStatus(`Loading ${item.name}…`);
  loader.load(`/models/${encodeURIComponent(item.id)}`, gltf => {
    const root = gltf.scene;
    root.name = item.name;
    root.traverse(o => { if (o.isMesh && o.material) { const mats = Array.isArray(o.material) ? o.material : [o.material]; for (const m of mats) { if (m.map) m.map.colorSpace = THREE.SRGBColorSpace; m.needsUpdate = true; } } });
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const max = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.2 / max;
    root.scale.multiplyScalar(scale);
    const scaledBounds = new THREE.Box3().setFromObject(root);
    root.position.y -= scaledBounds.min.y;
    const index = objects.length;
    const ring = Math.ceil(Math.sqrt(index + 1));
    root.position.x += (index % ring - (ring - 1) / 2) * 2.8;
    root.position.z += (Math.floor(index / ring) - (ring - 1) / 2) * 2.8;
    root.userData.libraryItem = item;
    scene.add(root); objects.push({ root, item, clips: gltf.animations || [], triangles: countTriangles(root), mixer: null, action: null });
    selectObject(root); updateCounts(); fitObject(root, false); setStatus('Ready to review');
  }, undefined, err => { console.error(err); toast(`Could not load ${item.name}`, true); setStatus('Ready to review'); });
}

function selectObject(root) {
  selected = root;
  selectionHighlight.visible = true;
  selectionHighlight.update(root);
  const record = objects.find(o => o.root === root);
  transform.detach();
  if (currentMode !== 'rotate') transform.attach(root);
  updateCounts(); updateSelectedCard();
  const panel = $('#animation-panel');
  if (record?.clips.length) {
    const select = $('#animation-select'); select.innerHTML = record.clips.map((clip, i) => `<option value="${i}">${escapeHtml(clip.name || `Animation ${i + 1}`)}</option>`).join('');
    if (record.action) select.value = String(Math.max(0, record.clips.indexOf(record.action.getClip())));
    panel.classList.remove('hidden'); updatePlaybackButton(record.action?.paused ? 'paused' : record.action?.isRunning() ? 'playing' : 'stopped');
  } else panel.classList.add('hidden');
}
function updatePlaybackButton(state) {
  const button = $('#play-button');
  button.classList.toggle('playing', state !== 'stopped');
  if (state === 'playing') button.innerHTML = 'Ⅱ <span>Pause animation</span>';
  else if (state === 'paused') button.innerHTML = '▶ <span>Resume animation</span>';
  else button.innerHTML = '▶ <span>Play animation</span>';
}
function playSelectedAnimation() {
  const rec = objects.find(o => o.root === selected);
  const clip = rec?.clips[Number($('#animation-select').value)];
  if (!rec || !clip) return;
  if (!rec.mixer) { rec.mixer = new THREE.AnimationMixer(rec.root); mixers.push(rec.mixer); }
  rec.action?.stop();
  rec.action = rec.mixer.clipAction(clip);
  rec.action.reset().play();
  updatePlaybackButton('playing');
}
function updateSelectedCard() { const rec = objects.find(o => o.root === selected); if (!rec) { $('#object-card').classList.add('hidden'); return; } $('#object-card').classList.remove('hidden'); $('#selected-name').textContent = rec.item.name; $('#selected-triangles').textContent = `${rec.triangles.toLocaleString()} triangles`; $('#object-card').classList.toggle('has-animation', rec.clips.length > 0); }
function removeSelected() { if (!selected) return; const index = objects.findIndex(o => o.root === selected); if (index < 0) return; const [rec] = objects.splice(index, 1); if (rec.mixer) mixers = mixers.filter(m => m !== rec.mixer); scene.remove(rec.root); rec.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m.dispose(); }); selected = null; selectionHighlight.visible = false; transform.detach(); $('#object-card').classList.add('hidden'); $('#animation-panel').classList.add('hidden'); updateCounts(); setStatus('Ready to review'); }
function fitObject(root, all = false) {
  const targetObj = all ? objects.map(o => o.root) : [root];
  if (!targetObj.length) return;
  const box = new THREE.Box3(); targetObj.forEach(o => box.expandByObject(o));
  const center = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() * 0.55, 1.6); const direction = new THREE.Vector3(1, 0.75, 1).normalize();
  controls.target.copy(center); camera.position.copy(center).addScaledVector(direction, radius * 2.2); camera.near = Math.max(radius / 100, 0.01); camera.far = Math.max(radius * 100, 1000); camera.updateProjectionMatrix(); controls.update();
}
function setMode(mode) {
  currentMode = mode; document.querySelectorAll('.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'rotate' || !selected) transform.detach(); else { transform.attach(selected); transform.setMode(mode); }
}

viewport.addEventListener('pointerdown', e => { if (e.target !== renderer.domElement) return; });
renderer.domElement.addEventListener('pointerdown', () => {});
const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
renderer.domElement.addEventListener('click', e => {
  const rect = renderer.domElement.getBoundingClientRect(); pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(objects.map(o => o.root), true);
  if (hits.length) { let node = hits[0].object; while (node.parent && !objects.some(o => o.root === node)) node = node.parent; selectObject(node); }
  else if (currentMode === 'rotate') { selected = null; selectionHighlight.visible = false; transform.detach(); $('#object-card').classList.add('hidden'); $('#animation-panel').classList.add('hidden'); updateCounts(); }
});

$('#add-button').onclick = () => $('#file-input').click(); $('#empty-import').onclick = () => $('#file-input').click();
$('#file-input').addEventListener('change', e => { importFiles(e.target.files); e.target.value = ''; });
$('#search').addEventListener('input', renderLibrary);
wrap.addEventListener('dragover', e => { e.preventDefault(); $('#drop-overlay').classList.add('visible'); });
wrap.addEventListener('dragleave', e => { if (!wrap.contains(e.relatedTarget)) $('#drop-overlay').classList.remove('visible'); });
wrap.addEventListener('drop', e => {
  e.preventDefault(); $('#drop-overlay').classList.remove('visible');
  const id = e.dataTransfer.getData('application/x-model-id');
  if (id) { const item = library.find(x => x.id === id); if (item) addLibraryModel(item); return; }
  if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
});
$('#delete-button').onclick = removeSelected; $('#card-remove').onclick = removeSelected;
document.querySelectorAll('.mode').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('#frame-button').onclick = () => selected ? fitObject(selected) : objects.length && fitObject(null, true);
$('#grid-button').onclick = e => { grid.visible = !grid.visible; e.currentTarget.classList.toggle('active-tool', grid.visible); };
$('#reset-camera').onclick = () => objects.length ? fitObject(null, true) : (controls.target.set(0, 0.8, 0), camera.position.set(6, 5, 7), controls.update());
$('#animation-select').addEventListener('change', playSelectedAnimation);
$('#play-button').onclick = () => {
  const rec = objects.find(o => o.root === selected); if (!rec?.clips.length) return;
  if (rec.action?.paused) { rec.action.paused = false; updatePlaybackButton('playing'); }
  else if (rec.action?.isRunning()) { rec.action.paused = true; updatePlaybackButton('paused'); }
  else playSelectedAnimation();
};
$('#close-animation').onclick = () => $('#animation-panel').classList.add('hidden');
$('#theme-button').onclick = () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
$('#help-button').onclick = () => $('#help-modal').classList.remove('hidden'); $('#close-help').onclick = $('#help-ok').onclick = () => $('#help-modal').classList.add('hidden');
$('#help-modal').addEventListener('click', e => { if (e.target === $('#help-modal')) $('#help-modal').classList.add('hidden'); });
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); }
  if (e.key.toLowerCase() === 'w') setMode('move'); if (e.key.toLowerCase() === 'r') setMode('scale');
  if (e.key.toLowerCase() === 'f') selected ? fitObject(selected) : objects.length && fitObject(null, true);
  if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
  if (e.key === 'Escape') { $('#help-modal').classList.add('hidden'); selected = null; selectionHighlight.visible = false; transform.detach(); $('#object-card').classList.add('hidden'); $('#animation-panel').classList.add('hidden'); updateCounts(); }
});

applyTheme(currentTheme);
loadLibrary();

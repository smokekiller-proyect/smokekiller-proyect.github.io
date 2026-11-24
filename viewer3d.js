// Smoke Killer interactive 3D viewer
import * as THREE from './vendor/three-bundle.js';
import { OrbitControls, RoomEnvironment } from './vendor/three-bundle.js';

export const PARTS = [
  { id: 'intake', name: 'Air intake + fan', desc: 'A fan pulls smoky air from the street into the unit through a rain-proof grille.' },
  { id: 'filter', name: 'Three-stage filter', desc: 'G4 and F7 filters trap dust, soot and PM2.5. Activated carbon adsorbs gases and odors.' },
  { id: 'blower', name: 'Blower + diffusers', desc: 'The blower pushes filtered air to the bottom of each tube, where it rises as fine bubbles so more CO₂ dissolves.' },
  { id: 'tubes', name: 'Photobioreactor tubes', desc: 'Five glass tubes hold about 700 liters of living microalgae (Chlorella vulgaris) that eat CO₂ through photosynthesis.' },
  { id: 'leds', name: 'LED grow lights', desc: 'Blue 450 nm and red 660 nm LEDs keep photosynthesis running at night and on cloudy days.' },
  { id: 'o2', name: 'Oxygen collector', desc: 'Oxygen rises to the top of each tube, joins the green collector pipe and leaves through the vent as clean air.' },
  { id: 'tank', name: 'Base tank + sensors', desc: 'Holds water and nutrients. Sensors track pH, temperature and dissolved oxygen around the clock.' },
  { id: 'solar', name: 'Solar panel + battery', desc: 'Powers the fan, the blower, the LEDs and the sensors, so the unit runs on clean energy.' },
  { id: 'harvest', name: 'Biomass harvest', desc: 'Every 4 to 6 weeks the grown algae are drained here and become fertilizer or biogas.' },
];

export function mount(container) {
  const W = () => container.clientWidth, H = () => container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D model of the Smoke Killer unit. Drag to rotate, scroll or pinch to zoom.');
  renderer.domElement.setAttribute('role', 'img');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;
  scene.add(new THREE.HemisphereLight('#eaf6ff', '#4b5a52', 0.9));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
  sun.position.set(8, 14, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(36, W() / H(), 0.1, 200);
  camera.position.set(10, 7.5, 13);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.target.set(0, 2.4, 0); controls.minDistance = 6; controls.maxDistance = 28;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotate = true; controls.autoRotateSpeed = 1.1;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const groups = {};
  const G = (id) => { const g = new THREE.Group(); g.name = id; scene.add(g); groups[id] = g; return g; };
  const add = (g, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const box = (g, w, h, d, mat, x, y, z) => add(g, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const cyl = (g, r, h, mat, x, y, z, seg = 40) => add(g, new THREE.CylinderGeometry(r, r, h, seg), mat, x, y, z);

  // roof slab
  const roof = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 9), std('#8c979f', { roughness: 0.9 }));
  roof.position.y = -0.15; roof.receiveShadow = true; scene.add(roof);

  const metal = std('#2b3440', { roughness: 0.35, metalness: 0.6 });
  const steel = std('#aab4bd', { roughness: 0.3, metalness: 0.8 });
  const mint = std('#3fcf9a', { roughness: 0.35, metalness: 0.3 });

  // tank
  const gTank = G('tank');
  box(gTank, 9.4, 1.3, 2.6, metal, 0, 0.65, 0);
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const x = c.getContext('2d');
    x.font = '700 76px Arial, sans-serif'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText('SMOKE', 20, 68);
    const w = x.measureText('SMOKE ').width; x.fillStyle = '#4fe08f'; x.fillText('KILLER', 20 + w, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.7), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    p.position.set(-0.6, 0.65, 1.31); gTank.add(p); }
  box(gTank, 0.5, 0.35, 0.3, std('#ffd54a', { emissive: '#7a5d00', emissiveIntensity: 0.3 }), 3.9, 1.0, 1.32); // sensor box

  // tubes + liquid + bubbles
  const gTubes = G('tubes');
  const tubeX = [-3.4, -1.7, 0, 1.7, 3.4], bottom = 1.3, th = 4.4, top = bottom + th;
  const glass = new THREE.MeshStandardMaterial({ color: '#e6f6ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false });
  const liquid = new THREE.MeshStandardMaterial({ color: '#1f9a4c', emissive: '#0e5a2a', emissiveIntensity: 0.35, roughness: 0.2, transparent: true, opacity: 0.86 });
  const bubbleMat = new THREE.MeshStandardMaterial({ color: '#f4fff8', emissive: '#bfffd6', emissiveIntensity: 0.4 });
  const bubbles = [];
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  tubeX.forEach(x => {
    const l = cyl(gTubes, 0.55, th - 0.6, liquid, x, bottom + (th - 0.6) / 2 + 0.1, 0); l.castShadow = false;
    const gl = cyl(gTubes, 0.62, th, glass, x, bottom + th / 2, 0); gl.castShadow = false;
    cyl(gTubes, 0.68, 0.22, steel, x, bottom + 0.11, 0); cyl(gTubes, 0.68, 0.22, steel, x, top - 0.11, 0);
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2, r = rnd() * 0.42;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.04 + rnd() * 0.05, 10, 8), bubbleMat);
      b.position.set(x + Math.cos(a) * r, 0, Math.sin(a) * r); b.renderOrder = -1; gTubes.add(b);
      bubbles.push({ m: b, y0: rnd() * (th - 1.1), sp: 0.5 + rnd() * 0.6 });
    }
  });
  box(gTubes, 8.6, 0.22, 0.3, steel, 0, top + 0.15, -0.75); box(gTubes, 8.6, 0.22, 0.3, steel, 0, top + 0.15, 0.75);

  // LEDs
  const gLeds = G('leds');
  const ledMat = new THREE.MeshStandardMaterial({ color: '#fff4cc', emissive: '#ffe9a8', emissiveIntensity: 2.2 });
  [-2.55, -0.85, 0.85, 2.55].forEach(x => { const l = box(gLeds, 0.1, th - 0.6, 0.1, ledMat, x, bottom + th / 2, 0.55); l.castShadow = false; });

  // O2 collector
  const gO2 = G('o2');
  tubeX.forEach(x => cyl(gO2, 0.12, 0.6, mint, x, top + 0.3, 0, 20));
  const hdr = cyl(gO2, 0.2, 9.2, mint, 0.6, top + 0.65, 0, 28); hdr.rotation.z = Math.PI / 2;
  cyl(gO2, 0.24, 2.4, mint, 5.2, top + 1.75, 0, 28);
  const cone = add(gO2, new THREE.ConeGeometry(0.55, 0.45, 28), mint, 5.2, top + 3.25, 0);
  const o2Mat = new THREE.MeshStandardMaterial({ color: '#7fd4ff', emissive: '#2a8fd6', emissiveIntensity: 0.6, transparent: true, opacity: 0.6, depthWrite: false });
  const o2 = [];
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), o2Mat); scene.add(m); o2.push({ m, u0: rnd(), a: rnd() * 6.28, r: rnd(), s: 0.06 + rnd() * 0.1 }); }

  // intake + filter + blower
  const gIntake = G('intake');
  box(gIntake, 1.8, 2.4, 2.4, std('#3e4a56', { roughness: 0.5, metalness: 0.4 }), -5.9, 1.2, 0);
  for (let i = 0; i < 8; i++) { const l = box(gIntake, 0.08, 0.12, 2.2, steel, -6.84, 0.35 + i * 0.27, 0); l.rotation.z = -0.5; }
  const fan = new THREE.Group(); fan.position.set(-5.9, 1.2, 1.24); gIntake.add(fan);
  { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 10, 40), steel); ring.position.copy(fan.position); gIntake.add(ring);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.04), steel); b.position.set(Math.cos(i * Math.PI / 2) * 0.42, Math.sin(i * Math.PI / 2) * 0.42, 0); b.rotation.z = i * Math.PI / 2 + Math.PI / 2; b.rotation.y = 0.35; fan.add(b); } }
  const gFilter = G('filter');
  box(gFilter, 1.4, 1.4, 2.0, std('#d9dde1'), -5.9, 3.1, 0);
  for (let i = 0; i < 5; i++) box(gFilter, 1.42, 0.05, 2.02, std('#9aa6b0'), -5.9, 2.55 + i * 0.27, 0);
  const gBlower = G('blower');
  const bl = cyl(gBlower, 0.75, 0.6, steel, -4.6, 3.1, 0); bl.rotation.x = Math.PI / 2;
  cyl(gBlower, 0.18, 1.6, std('#f2f4f5'), -4.6, 2.0, 0, 20);

  // solar + controller
  const gSolar = G('solar');
  box(gSolar, 1.3, 1.3, 1.2, std('#e3e6e9'), 6.0, 0.65, -2.6);
  { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#1d3a6b'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#8fb3e0'; x.lineWidth = 3;
    for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(i * 256 / 6, 0); x.lineTo(i * 256 / 6, 256); x.stroke(); }
    for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(0, i * 64); x.lineTo(256, i * 64); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const p = box(gSolar, 3.6, 0.08, 2.2, new THREE.MeshStandardMaterial({ map: t, roughness: 0.25, metalness: 0.5 }), 3.2, 1.9, -3.4); p.rotation.x = 0.45; }
  [1.7, 4.7].forEach(x => { box(gSolar, 0.1, 1.7, 0.1, steel, x, 0.85, -2.9); box(gSolar, 0.1, 1.0, 0.1, steel, x, 0.5, -4.1); });

  // harvest
  const gHarvest = G('harvest');
  box(gHarvest, 1.0, 0.8, 0.9, std('#e0a23a'), 5.6, 0.4, 1.8);
  const hp = cyl(gHarvest, 0.1, 1.0, steel, 5.0, 0.45, 1.25, 12); hp.rotation.z = Math.PI / 2;

  // highlight
  let active = null, pulseT = 0;
  const tint = new THREE.Color('#4fe08f');
  function setGlow(g, k) {
    g.traverse(o => {
      if (!o.isMesh || !o.material || !o.material.emissive) return;
      if (!o.userData.base) o.userData.base = { e: o.material.emissive.clone(), i: o.material.emissiveIntensity };
      if (k > 0) { if (!o.userData.own) { o.material = o.material.clone(); o.userData.own = true; } o.material.emissive.copy(tint); o.material.emissiveIntensity = k; }
      else if (o.userData.own) { o.material.emissive.copy(o.userData.base.e); o.material.emissiveIntensity = o.userData.base.i; }
    });
  }
  const camTo = { pos: null, tgt: null };
  function focus(id) {
    if (active) setGlow(groups[active], 0);
    active = id && groups[id] ? id : null;
    controls.autoRotate = false;
    if (!active) { camTo.pos = new THREE.Vector3(10, 7.5, 13); camTo.tgt = new THREE.Vector3(0, 2.4, 0); return; }
    const bb = new THREE.Box3().setFromObject(groups[active]); const c = bb.getCenter(new THREE.Vector3());
    const dir = camera.position.clone().sub(controls.target).normalize();
    const size = bb.getSize(new THREE.Vector3()).length();
    camTo.tgt = c; camTo.pos = c.clone().add(dir.multiplyScalar(Math.max(7, size * 1.6)));
  }

  const clock = new THREE.Clock();
  let raf = 0, alive = true;
  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    bubbles.forEach(b => { b.m.position.y = bottom + 0.3 + ((b.y0 + t * b.sp) % (th - 1.1)); });
    fan.rotation.z = -t * 8;
    ledMat.emissiveIntensity = 2 + 0.4 * Math.sin(t * 3);
    o2.forEach(p => { const u = (p.u0 + t / 5) % 1; const sp = (0.3 + u * 3) * p.r;
      p.m.position.set(5.2 + Math.cos(p.a) * sp + u, top + 3.5 + u * 6, Math.sin(p.a) * sp); p.m.scale.setScalar(p.s * Math.min(1, u * 8) * (1 - u * 0.6) + 0.001); });
    if (active) { pulseT += dt; setGlow(groups[active], 0.35 + 0.3 * Math.sin(pulseT * 5)); }
    if (camTo.pos) {
      camera.position.lerp(camTo.pos, 0.08); controls.target.lerp(camTo.tgt, 0.08);
      if (camera.position.distanceTo(camTo.pos) < 0.05) camTo.pos = null;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  frame();
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
  ro.observe(container);
  return {
    focus,
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); pmrem.dispose(); renderer.domElement.remove(); },
  };
}

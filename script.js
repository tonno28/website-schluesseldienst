import * as THREE from 'three';

// ---------- Year ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Custom cursor ----------
const cursor = document.getElementById('cursor');
const dot = document.getElementById('cursorDot');
let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
let tx = cx, ty = cy;

window.addEventListener('mousemove', (e) => {
  tx = e.clientX; ty = e.clientY;
  dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
});

function tickCursor() {
  cx += (tx - cx) * 0.18;
  cy += (ty - cy) * 0.18;
  if (cursor) cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
  requestAnimationFrame(tickCursor);
}
tickCursor();

document.querySelectorAll('a, button, .card, .price-card, .step, .chips li').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// ---------- Tilt 3D effect on cards ----------
document.querySelectorAll('[data-tilt]').forEach(el => {
  let raf = null;
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -12;
    const ry = (px - 0.5) * 14;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    });
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
});

// ---------- Scroll reveal ----------
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.section-head, .card, .step, .price-card, .cta-card, .coverage-text, .coverage-visual')
  .forEach(el => { el.classList.add('reveal'); observer.observe(el); });

// ---------- THREE.js hero scene ----------
const canvas = document.getElementById('hero3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 9);

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffd166, 2.2);
key.position.set(5, 4, 5);
scene.add(key);

const rim = new THREE.PointLight(0xff5a5f, 6, 20);
rim.position.set(-4, -2, 3);
scene.add(rim);

const fill = new THREE.PointLight(0x6cb8ff, 2, 18);
fill.position.set(3, -3, -2);
scene.add(fill);

// --- Build a stylised key out of basic geometry ---
const keyGroup = new THREE.Group();
scene.add(keyGroup);

const goldMat = new THREE.MeshStandardMaterial({
  color: 0xf5b942,
  metalness: 0.95,
  roughness: 0.18,
  emissive: 0x3a1f00,
  emissiveIntensity: 0.4
});

// Bow (round head)
const bowGeo = new THREE.TorusGeometry(1.0, 0.32, 32, 96);
const bow = new THREE.Mesh(bowGeo, goldMat);
bow.position.x = -1.6;
bow.rotation.y = Math.PI / 2;
keyGroup.add(bow);

// Inner hole accent (a thin ring)
const innerRingGeo = new THREE.TorusGeometry(0.65, 0.05, 16, 64);
const innerRing = new THREE.Mesh(innerRingGeo, new THREE.MeshStandardMaterial({
  color: 0xffd166, metalness: 1, roughness: 0.15, emissive: 0x6b3a00, emissiveIntensity: 0.6
}));
innerRing.position.x = -1.6;
innerRing.rotation.y = Math.PI / 2;
keyGroup.add(innerRing);

// Shaft
const shaftGeo = new THREE.CylinderGeometry(0.22, 0.22, 3.2, 32);
const shaft = new THREE.Mesh(shaftGeo, goldMat);
shaft.rotation.z = Math.PI / 2;
shaft.position.x = 0.4;
keyGroup.add(shaft);

// Bit (teeth) — small boxes
const teethData = [
  { x: 1.4, y: -0.45, w: 0.35, h: 0.45 },
  { x: 1.8, y: -0.55, w: 0.30, h: 0.55 },
  { x: 2.15, y: -0.40, w: 0.30, h: 0.40 },
];
teethData.forEach(t => {
  const g = new THREE.BoxGeometry(t.w, t.h, 0.44);
  const m = new THREE.Mesh(g, goldMat);
  m.position.set(t.x, t.y - 0.05, 0);
  keyGroup.add(m);
});

// End cap
const capGeo = new THREE.SphereGeometry(0.22, 24, 24);
const cap = new THREE.Mesh(capGeo, goldMat);
cap.position.x = 2.0;
keyGroup.add(cap);

// position group
keyGroup.position.set(2.4, 0.4, 0);
keyGroup.rotation.x = 0.2;

// --- Floating particles ---
const particleCount = 180;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 18;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const pMat = new THREE.PointsMaterial({
  size: 0.04,
  color: 0xffd166,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// --- Pointer parallax ---
let mx = 0, my = 0, tmx = 0, tmy = 0;
window.addEventListener('mousemove', (e) => {
  tmx = (e.clientX / window.innerWidth) * 2 - 1;
  tmy = (e.clientY / window.innerHeight) * 2 - 1;
});

// --- Scroll-based rotation ---
let scrollY = 0;
window.addEventListener('scroll', () => { scrollY = window.scrollY; });

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animate ---
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  mx += (tmx - mx) * 0.05;
  my += (tmy - my) * 0.05;

  keyGroup.rotation.y = t * 0.45 + mx * 0.4 + scrollY * 0.002;
  keyGroup.rotation.x = 0.2 + Math.sin(t * 0.7) * 0.12 + my * 0.25;
  keyGroup.position.y = 0.4 + Math.sin(t * 1.1) * 0.12;

  particles.rotation.y = t * 0.04;
  particles.rotation.x = t * 0.02;

  camera.position.x = mx * 0.4;
  camera.position.y = -my * 0.3;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

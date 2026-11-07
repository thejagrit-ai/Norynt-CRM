'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './auth.module.css';

interface Deal {
  name: string;
  value: string;
  initials: string;
  color: string;
}

const NEW_LEAD: Deal[] = [
  { name: 'Brightpath Dental', value: '$6,200', initials: 'AK', color: '#2158d6' },
  { name: 'Oakline Interiors', value: '$3,850', initials: 'RM', color: '#0e7490' },
];
const PROPOSAL: Deal[] = [
  { name: 'Northwind Foods', value: '$12,000', initials: 'SP', color: '#7c3aed' },
];
const MOVER: Deal = { name: 'Harbor Logistics', value: '$18,400', initials: 'JT', color: '#c2410c' };
const WON: Deal[] = [{ name: 'Vela Studio', value: '$9,750', initials: 'LD', color: '#15803d' }];

// World units
const LANE_W = 2.3;
const LANE_H = 4.3;
const GAP = 0.35;
const CARD_W = 2.0;
const CARD_H = 0.95;
const SLOT_Y = [0.55, -0.6];
const LANE_X = [-(LANE_W + GAP), 0, LANE_W + GAP];

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function PipelineScene3D({ onUnsupported }: { onUnsupported: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onUnsupported();
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9db8f0, 1.15));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-4, 7, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 25;
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const root = new THREE.Group();
    scene.add(root);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(o: T): T => {
      disposables.push(o);
      return o;
    };

    const fontFamily = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    const aniso = renderer.capabilities.getMaxAnisotropy();

    function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      draw(ctx);
      const t = track(new THREE.CanvasTexture(c));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      return t;
    }

    // ── Lanes ──
    const laneGeo = track(
      new THREE.ExtrudeGeometry(roundedRect(LANE_W, LANE_H, 0.22), { depth: 0.06, bevelEnabled: false, curveSegments: 10 }),
    );
    const laneMat = track(
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.9, metalness: 0 }),
    );
    const titles = ['New lead', 'Proposal', 'Won'];
    const counts = [2, 2, 2];
    LANE_X.forEach((x, i) => {
      const lane = new THREE.Mesh(laneGeo, laneMat);
      lane.position.set(x, 0, -0.06);
      lane.receiveShadow = true;
      root.add(lane);

      const tex = canvasTexture(512, 80, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 34px ${fontFamily}`;
        ctx.textBaseline = 'middle';
        ctx.fillText(titles[i], 14, 40);
        const label = String(counts[i]);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.roundRect(512 - 70, 14, 56, 52, 26);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 28px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(label, 512 - 42, 41);
      });
      const head = new THREE.Mesh(
        track(new THREE.PlaneGeometry(LANE_W - 0.3, (LANE_W - 0.3) * (80 / 512))),
        track(new THREE.MeshBasicMaterial({ map: tex, transparent: true })),
      );
      head.position.set(x, LANE_H / 2 - 0.34, 0.03);
      root.add(head);
    });

    // ── Cards ──
    const cardGeo = track(
      new THREE.ExtrudeGeometry(roundedRect(CARD_W, CARD_H, 0.14), {
        depth: 0.14,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.03,
        bevelSegments: 3,
        curveSegments: 10,
      }),
    );
    cardGeo.center();
    const cardMat = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0 }));
    const faceGeo = track(new THREE.PlaneGeometry(CARD_W, CARD_H));
    const faceZ = 0.105;

    function makeCard(deal: Deal): THREE.Group {
      const g = new THREE.Group();
      const body = new THREE.Mesh(cardGeo, cardMat);
      body.castShadow = true;
      g.add(body);

      const tex = canvasTexture(640, 304, (ctx) => {
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#17233b';
        ctx.font = `700 40px ${fontFamily}`;
        ctx.fillText(deal.name, 38, 100);
        ctx.font = `700 38px ${fontFamily}`;
        ctx.fillText(deal.value, 38, 232);
        ctx.fillStyle = deal.color;
        ctx.beginPath();
        ctx.arc(640 - 70, 214, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 24px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(deal.initials, 640 - 70, 216);
      });
      const face = new THREE.Mesh(faceGeo, track(new THREE.MeshBasicMaterial({ map: tex, transparent: true })));
      face.position.z = faceZ;
      g.add(face);
      return g;
    }

    const floaters: THREE.Group[] = [];
    const place = (deal: Deal, lane: number, slot: number) => {
      const c = makeCard(deal);
      c.position.set(LANE_X[lane], SLOT_Y[slot], 0.18);
      root.add(c);
      floaters.push(c);
      return c;
    };
    NEW_LEAD.forEach((d, i) => place(d, 0, i));
    PROPOSAL.forEach((d, i) => place(d, 1, i));
    WON.forEach((d, i) => place(d, 2, i));
    const mover = place(MOVER, 1, 1);
    floaters.splice(floaters.indexOf(mover), 1); // mover is animated separately

    // Dashed placeholder where the deal will land
    const slotTex = canvasTexture(640, 304, (ctx) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 5;
      ctx.setLineDash([22, 16]);
      ctx.beginPath();
      ctx.roundRect(8, 8, 624, 288, 40);
      ctx.stroke();
    });
    const slotMat = track(new THREE.MeshBasicMaterial({ map: slotTex, transparent: true }));
    const slot = new THREE.Mesh(faceGeo, slotMat);
    slot.position.set(LANE_X[2], SLOT_Y[1], 0.04);
    root.add(slot);

    // "Won" badge on the moving card
    const badgeTex = canvasTexture(192, 80, (ctx) => {
      ctx.fillStyle = '#137a4b';
      ctx.beginPath();
      ctx.roundRect(4, 8, 184, 64, 32);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 38px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Won', 96, 42);
    });
    const badge = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.62, 0.62 * (80 / 192))),
      track(new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })),
    );
    badge.position.set(0.62, CARD_H / 2 + 0.02, 0.25);
    mover.add(badge);

    // ── Sizing: fit the whole board for the container's aspect ──
    const BASE_ROT = { x: -0.16, y: -0.34 };
    function resize() {
      const w = host!.clientWidth || 1;
      const h = host!.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const boardW = LANE_W * 3 + GAP * 2 + 0.6;
      const boardH = LANE_H + 0.6;
      const dist = Math.max(boardH / 2 / tan, boardW / 2 / (tan * camera.aspect)) * 1.08;
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      if (reduced) renderer.render(scene, camera);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // ── Pointer parallax ──
    const target = { x: BASE_ROT.x, y: BASE_ROT.y };
    function onMove(e: PointerEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.y = BASE_ROT.y + nx * 0.22;
      target.x = BASE_ROT.x + ny * 0.12;
    }
    if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });

    // ── Animation ──
    const moverFrom = new THREE.Vector3(LANE_X[1], SLOT_Y[1], 0.18);
    const moverTo = new THREE.Vector3(LANE_X[2], SLOT_Y[1], 0.18);
    const T_START = 1.1;
    const T_MOVE = 1.3;
    const clock = new THREE.Clock();
    let raf = 0;

    function frame() {
      const t = clock.getElapsedTime();
      const intro = ease(clamp01(t / 1.0));

      root.rotation.x += (target.x - root.rotation.x) * 0.06;
      root.rotation.y += (target.y - root.rotation.y) * 0.06;
      root.position.y = (1 - intro) * -0.6;
      root.scale.setScalar(0.94 + 0.06 * intro);

      floaters.forEach((c, i) => {
        c.position.z = 0.18 + Math.sin(t * 1.1 + i * 1.7) * 0.05 + 0.04;
      });

      const p = ease(clamp01((t - T_START) / T_MOVE));
      mover.position.lerpVectors(moverFrom, moverTo, p);
      mover.position.z = 0.18 + Math.sin(p * Math.PI) * 1.1 + (p === 1 ? Math.sin(t * 1.1) * 0.05 + 0.04 : 0);
      mover.rotation.z = Math.sin(p * Math.PI) * -0.08;
      mover.rotation.y = Math.sin(p * Math.PI) * 0.18;

      const b = clamp01((t - (T_START + T_MOVE)) / 0.45);
      badge.scale.setScalar(b === 0 ? 0.001 : b < 1 ? 1 + Math.sin(b * Math.PI) * 0.25 : 1);
      slotMat.opacity = 1 - clamp01((t - (T_START + T_MOVE * 0.7)) / 0.4);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    if (reduced) {
      root.rotation.set(BASE_ROT.x, BASE_ROT.y, 0);
      mover.position.copy(moverTo);
      mover.position.z = 0.22;
      slotMat.opacity = 0;
      renderer.render(scene, camera);
    } else {
      root.rotation.set(BASE_ROT.x, BASE_ROT.y, 0);
      badge.scale.setScalar(0.001);
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onUnsupported]);

  return <div ref={hostRef} className={styles.scene} role="img" aria-label="A deal moving from Proposal to Won on a sales pipeline board" />;
}

export default PipelineScene3D;

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface HangingSaravediProps {
  className?: string;
  style?: React.CSSProperties;
  showUiControls?: boolean;
}

export function HangingSaravedi3D({
  className = '',
  style,
  showUiControls = false,
}: HangingSaravediProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragMode, setDragMode] = useState<'rope' | 'crackers'>('rope');
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // References to communicate with inside Three.js loop
  const triggerResetRef = useRef<(() => void) | null>(null);
  const toggleModeRef = useRef<(() => void) | null>(null);
  const toggleSpinRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: window.devicePixelRatio < 2,
        powerPreference: 'high-performance',
        alpha: true,
      });
      renderer.setClearColor(0x000000, 0);
    } catch {
      return;
    }

    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

    let camDist = 16;
    let cw = 1;
    let ch = 1;
    let q = window.matchMedia('(pointer:coarse)').matches ? 1 : 2;
    let ITER = 10;

    function resize() {
      if (!canvas) return;
      cw = canvas.clientWidth || window.innerWidth;
      ch = canvas.clientHeight || window.innerHeight;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    }

    function applyQ() {
      renderer.setPixelRatio(
        q === 2 ? Math.min(window.devicePixelRatio, 1.75) : q === 1 ? Math.min(window.devicePixelRatio, 1.25) : 1
      );
      ITER = q === 2 ? 12 : q === 1 ? 8 : 6;
      resize();
    }

    scene.add(new THREE.HemisphereLight(0xffe2d0, 0x2a0f10, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(4, 6, 8);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xff6a3a, 0.5);
    rim.position.set(-6, 2, -6);
    scene.add(rim);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const cl = (x: number, m: number) => Math.max(-m, Math.min(m, x));
    const dm = new THREE.Object3D();
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

    // ---------- rope (verlet chain) ----------
    const rows = 12;
    const SEG = 0.16;
    const CORD = 7;
    const M = CORD + 2 * rows + 3;
    const PIVOT = 4.1 + CORD * SEG;
    const G = -14;
    const DAMP = 0.994;

    const P: THREE.Vector3[] = [];
    const Q: THREE.Vector3[] = [];
    let anchorY = PIVOT + 12;
    let held = -1;

    for (let j = 0; j < M; j++) {
      P.push(new THREE.Vector3(0, anchorY - j * SEG, 0));
      Q.push(P[j].clone());
    }

    const target = new THREE.Vector3();
    const dv = new THREE.Vector3();
    const tmp = new THREE.Vector3();

    function satisfy(a: number, b: number, len: number, k: number) {
      dv.subVectors(P[b], P[a]);
      const l = dv.length() || 1e-6;
      const diff = ((l - len) / l) * k;
      const wa = a === 0 || a === held ? 0 : 1;
      const wb = b === held ? 0 : 1;
      const w = wa + wb;
      if (!w) return;
      P[a].addScaledVector(dv, (diff * wa) / w);
      P[b].addScaledVector(dv, (-diff * wb) / w);
    }

    function stepRope(h: number) {
      for (let j = 1; j < M; j++) {
        if (j === held) continue;
        const p = P[j];
        const qq = Q[j];
        tmp.copy(p);
        p.x += (p.x - qq.x) * DAMP;
        p.y += (p.y - qq.y) * DAMP + G * h * h;
        p.z += (p.z - qq.z) * DAMP;
        qq.copy(tmp);
      }
      P[0].set(0, anchorY, 0);
      Q[0].copy(P[0]);
      if (held > 0) P[held].copy(target);
      for (let it = 0; it < ITER; it++) {
        for (let j = 0; j < M - 1; j++) satisfy(j, j + 1, SEG, 1);
        for (let j = M - 2; j >= 0; j--) satisfy(j, j + 1, SEG, 1);
        for (let j = 0; j < M - 2; j++) satisfy(j, j + 2, 2 * SEG * 0.998, 0.85);
        for (let j = 0; j < M - 4; j++) satisfy(j, j + 4, 4 * SEG * 0.998, 0.6);
        for (let j = 0; j < M - 8; j++) satisfy(j, j + 8, 8 * SEG * 0.998, 0.3);
      }
    }

    const RAD = 6;
    const rr = 0.03;
    const rpos = new Float32Array(M * RAD * 3);
    const rnor = new Float32Array(M * RAD * 3);
    const rgeo = new THREE.BufferGeometry();
    rgeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
    rgeo.setAttribute('normal', new THREE.BufferAttribute(rnor, 3));

    const idx: number[] = [];
    for (let j = 0; j < M - 1; j++) {
      for (let k = 0; k < RAD; k++) {
        const a = j * RAD + k;
        const b = j * RAD + ((k + 1) % RAD);
        const c = (j + 1) * RAD + k;
        const d = (j + 1) * RAD + ((k + 1) % RAD);
        idx.push(a, c, b, b, c, d);
      }
    }
    rgeo.setIndex(idx);

    const ropeMesh = new THREE.Mesh(
      rgeo,
      new THREE.MeshStandardMaterial({ color: 0x9a8e78, roughness: 0.9, side: THREE.DoubleSide })
    );
    ropeMesh.frustumCulled = false;
    scene.add(ropeMesh);

    const T = new THREE.Vector3();
    const N = new THREE.Vector3();
    const B = new THREE.Vector3();
    const COS: number[] = [];
    const SIN: number[] = [];
    for (let k = 0; k < RAD; k++) {
      COS.push(Math.cos((k / RAD) * Math.PI * 2));
      SIN.push(Math.sin((k / RAD) * Math.PI * 2));
    }

    function updateRope() {
      for (let j = 0; j < M; j++) {
        T.subVectors(P[Math.min(j + 1, M - 1)], P[Math.max(j - 1, 0)]).normalize();
        N.set(0, 0, 1).cross(T);
        if (N.lengthSq() < 1e-6) N.set(1, 0, 0);
        N.normalize();
        B.crossVectors(T, N);
        for (let k = 0; k < RAD; k++) {
          const o = (j * RAD + k) * 3;
          const c = COS[k];
          const s = SIN[k];
          const nx = N.x * c + B.x * s;
          const ny = N.y * c + B.y * s;
          const nz = N.z * c + B.z * s;
          rnor[o] = nx;
          rnor[o + 1] = ny;
          rnor[o + 2] = nz;
          rpos[o] = P[j].x + nx * rr;
          rpos[o + 1] = P[j].y + ny * rr;
          rpos[o + 2] = P[j].z + nz * rr;
        }
      }
      rgeo.attributes.position.needsUpdate = true;
      rgeo.attributes.normal.needsUpdate = true;
    }

    // ---------- crackers: ONE instanced mesh ----------
    const RED = new THREE.Color(0xc41e1e);
    const DRED = new THREE.Color(0x7a0e0e);
    const GOLD = new THREE.Color(0xe0b04a);
    const JUTE = new THREE.Color(0xa9854a);
    const GREY = new THREE.Color(0x8d8d84);

    function merge(list: Array<[THREE.BufferGeometry, THREE.Color]>): THREE.BufferGeometry {
      let vc = 0;
      let ic = 0;
      for (const [g] of list) {
        vc += g.attributes.position.count;
        ic += g.index ? g.index.count : 0;
      }
      const pos = new Float32Array(vc * 3);
      const nor = new Float32Array(vc * 3);
      const col = new Float32Array(vc * 3);
      const ind = new Uint32Array(ic);
      let vo = 0;
      let io = 0;

      for (const [g, c] of list) {
        const n = g.attributes.position.count;
        pos.set(g.attributes.position.array as Float32Array, vo * 3);
        if (g.attributes.normal) {
          nor.set(g.attributes.normal.array as Float32Array, vo * 3);
        }
        for (let i = 0; i < n; i++) {
          col[(vo + i) * 3] = c.r;
          col[(vo + i) * 3 + 1] = c.g;
          col[(vo + i) * 3 + 2] = c.b;
        }
        if (g.index) {
          for (let k = 0; k < g.index.count; k++) {
            ind[io + k] = (g.index.array as Uint32Array | Uint16Array)[k] + vo;
          }
          io += g.index.count;
        }
        vo += n;
      }

      const m = new THREE.BufferGeometry();
      m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      m.setAttribute('color', new THREE.BufferAttribute(col, 3));
      m.setIndex(new THREE.BufferAttribute(ind, 1));
      return m;
    }

    const r0 = 0.11;
    const gBody = new THREE.CylinderGeometry(r0, r0, 1, 16, 1, true);
    gBody.rotateZ(Math.PI / 2);
    gBody.translate(0.56, 0, 0);

    const gCap = new THREE.CircleGeometry(r0, 16);
    gCap.rotateY(Math.PI / 2);
    gCap.translate(1.061, 0, 0);

    const gBand = new THREE.CylinderGeometry(r0 + 0.004, r0 + 0.004, 0.025, 16, 1, true);
    gBand.rotateZ(Math.PI / 2);
    gBand.translate(0.96, 0, 0);

    const gTw = new THREE.TorusGeometry(r0 + 0.012, 0.02, 5, 12);
    gTw.rotateY(Math.PI / 2);
    gTw.translate(0.15, 0, 0);

    const gWk = new THREE.CylinderGeometry(0.012, 0.012, 0.14, 5);
    gWk.rotateZ(Math.PI / 2);

    const crackGeo = merge([
      [gBody, RED],
      [gCap, DRED],
      [gBand, GOLD],
      [gTw, JUTE],
      [gWk, GREY],
    ]);

    const CN = rows * 4;
    const cm = new THREE.InstancedMesh(
      crackGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.12 }),
      CN
    );
    cm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cm.frustumCulled = false;
    scene.add(cm);

    const km = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.055, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xa9854a, roughness: 0.95 }),
      rows
    );
    km.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    km.frustumCulled = false;
    scene.add(km);

    interface Cracker {
      g: THREE.Object3D;
      side: number;
      k: number;
      len: number;
      j: number;
      dy: number;
      dz: number;
      a0: number;
      y0: number;
      a: number;
      va: number;
      y: number;
      vy: number;
      dead: boolean;
      init: boolean;
      pX: number;
      pY: number;
      pZ: number;
      vX: number;
      vY: number;
      vZ: number;
      accX: number;
      accY: number;
      accZ: number;
    }

    const crackers: Cracker[] = [];
    for (let i = 0; i < rows; i++) {
      for (const side of [1, -1]) {
        for (const layer of [0, 1]) {
          const k = crackers.length;
          const a0 = rnd(-0.4, -0.02);
          const y0 = rnd(-0.22, 0.22);
          crackers.push({
            g: new THREE.Object3D(),
            side,
            k,
            len: rnd(0.85, 1.05),
            j: CORD + 2 * i,
            dy: rnd(-0.04, 0.04),
            dz: (layer ? 0.15 : -0.15) + rnd(-0.03, 0.03),
            a0,
            y0,
            a: a0,
            va: 0,
            y: y0,
            vy: 0,
            dead: false,
            init: false,
            pX: 0,
            pY: 0,
            pZ: 0,
            vX: 0,
            vY: 0,
            vZ: 0,
            accX: 0,
            accY: 0,
            accZ: 0,
          });
          cm.setColorAt(k, new THREE.Color().setRGB(rnd(0.88, 1.08), rnd(0.8, 1.05), rnd(0.8, 1.05)));
        }
      }
    }
    if (cm.instanceColor) cm.instanceColor.needsUpdate = true;

    // ---------- fire (lights always present: no shader recompiles) ----------
    const fire = new THREE.Group();
    scene.add(fire);
    const fireVis = new THREE.Group();
    fire.add(fireVis);

    const tc = document.createElement('canvas');
    tc.width = tc.height = 64;
    const cx = tc.getContext('2d')!;
    const gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = gr;
    cx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(tc);
    const spriteMat = (c: number) =>
      new THREE.SpriteMaterial({
        map: tex,
        color: c,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      });

    const glow = new THREE.Sprite(spriteMat(0xff5a14));
    fireVis.add(glow);
    const core = new THREE.Sprite(spriteMat(0xfff0b0));
    fireVis.add(core);

    const tongues: THREE.Sprite[] = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(spriteMat(0xff8a1e));
      s.userData = { p: Math.random(), x: rnd(-0.12, 0.12), z: rnd(-0.1, 0.1), sp: rnd(1.2, 2.2) };
      fireVis.add(s);
      tongues.push(s);
    }

    const light = new THREE.PointLight(0xff8a2a, 0, 7, 2);
    light.position.set(0, 0.2, 0.6);
    fire.add(light);

    const NP = 110;
    const pos = new Float32Array(NP * 3);
    const col = new Float32Array(NP * 3);
    const vel: THREE.Vector3[] = [];
    const life = new Float32Array(NP);
    const maxL = new Float32Array(NP);

    function respawn(i: number) {
      const th = Math.random() * Math.PI * 2;
      const u = rnd(-0.6, 1);
      const sp = rnd(0.6, 2.6);
      const s = Math.sqrt(1 - u * u);
      vel[i].set(Math.cos(th) * s * sp, u * sp + 0.3, Math.sin(th) * s* sp);
      pos[i * 3] = rnd(-0.05, 0.05);
      pos[i * 3 + 1] = rnd(-0.05, 0.05);
      pos[i * 3 + 2] = rnd(-0.05, 0.05);
      maxL[i] = rnd(0.25, 0.9);
      life[i] = maxL[i];
    }

    for (let i = 0; i < NP; i++) {
      vel.push(new THREE.Vector3());
      respawn(i);
      life[i] = Math.random() * maxL[i];
    }

    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const sparks = new THREE.Points(
      pg,
      new THREE.PointsMaterial({
        size: 0.2,
        map: tex,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      })
    );
    sparks.frustumCulled = false;
    fireVis.add(sparks);

    // ---------- explosions ----------
    const EN = 800;
    const epos = new Float32Array(EN * 3);
    const ecol = new Float32Array(EN * 3);
    const evel: THREE.Vector3[] = [];
    const elife = new Float32Array(EN);
    const emax = new Float32Array(EN);

    for (let i = 0; i < EN; i++) evel.push(new THREE.Vector3());

    const egeo = new THREE.BufferGeometry();
    egeo.setAttribute('position', new THREE.BufferAttribute(epos, 3));
    egeo.setAttribute('color', new THREE.BufferAttribute(ecol, 3));
    const epts = new THREE.Points(
      egeo,
      new THREE.PointsMaterial({
        size: 0.22,
        map: tex,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      })
    );
    epts.frustumCulled = false;
    scene.add(epts);

    const flashes: THREE.Sprite[] = [];
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Sprite(spriteMat(0xffc060));
      s.visible = false;
      s.userData = { t: 0, on: false, s0: 1, s1: 4 };
      scene.add(s);
      flashes.push(s);
    }

    const boomLight = new THREE.PointLight(0xffa040, 0, 12, 2);
    scene.add(boomLight);

    let boomT = 0;
    let enext = 0;
    let actx: AudioContext | null = null;
    let abuf: AudioBuffer | null = null;
    let lastBang = 0;
    let eUntil = 0;
    let fireBoost = 0;
    let frontRow = 0;
    let burning = false;
    let fireOn = false;
    let fireNode = M - 1;
    let cool = 0;
    let leaving = false;

    const wp = new THREE.Vector3();
    const wd = new THREE.Vector3();
    const ax = new THREE.Vector3();

    function initAudio() {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!actx && AudioCtx) {
          actx = new AudioCtx();
        }
        if (actx && actx.state === 'suspended') {
          actx.resume().catch(() => {});
        }
      } catch {}
    }

    function bang(vol: number, isBig: boolean = false) {
      const now = performance.now();
      if (now - lastBang < 18) return;
      lastBang = now;

      // Real-time phone vibration pulse matching the cracker burst
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          if (isBig) {
            navigator.vibrate([55, 30, 75]);
          } else {
            navigator.vibrate(26);
          }
        } catch {}
      }

      try {
        initAudio();
        if (!abuf && actx) {
          const n = (actx.sampleRate * 0.4) | 0;
          abuf = actx.createBuffer(1, n, actx.sampleRate);
          const d = abuf.getChannelData(0);
          for (let i = 0; i < n; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
          }
        }
        if (actx && abuf) {
          // Sharp cracker pop noise
          const s = actx.createBufferSource();
          s.buffer = abuf;
          s.playbackRate.value = rnd(0.8, 1.3);
          const f = actx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = rnd(1200, 2400);
          const g = actx.createGain();
          g.gain.value = vol;
          s.connect(f);
          f.connect(g);
          g.connect(actx.destination);
          s.start();

          // Sub-bass acoustic haptic pulse (resonates phone speaker & vibrator motor on iOS & Android)
          if (actx.state === 'running') {
            const osc = actx.createOscillator();
            const subGain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isBig ? 50 : 70, actx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, actx.currentTime + (isBig ? 0.08 : 0.04));
            subGain.gain.setValueAtTime(isBig ? 1.0 : 0.7, actx.currentTime);
            subGain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + (isBig ? 0.08 : 0.04));
            osc.connect(subGain);
            subGain.connect(actx.destination);
            osc.start();
            osc.stop(actx.currentTime + (isBig ? 0.09 : 0.05));
          }
        }
      } catch {}
    }

    function kick(c: Cracker, vp: number, vyaw: number) {
      c.va = cl(c.va + vp, 9);
      c.vy = cl(c.vy + vyaw, 9);
    }

    function explode(c: Cracker, big: boolean) {
      if (c.dead) return;
      wd.setFromMatrixColumn(c.g.matrix, 0);
      wp.copy(c.g.position).addScaledVector(wd, 0.5);

      for (let n = 0, cnt = big ? 100 : 36; n < cnt; n++) {
        const i = enext;
        enext = (enext + 1) % EN;
        const th = Math.random() * Math.PI * 2;
        const u = rnd(-1, 1);
        const s = Math.sqrt(1 - u * u);
        const sp = rnd(1.5, 8);
        evel[i].set(Math.cos(th) * s * sp, u * sp, Math.sin(th) * s * sp);
        epos[i * 3] = wp.x;
        epos[i * 3 + 1] = wp.y;
        epos[i * 3 + 2] = wp.z;
        emax[i] = elife[i] = rnd(0.35, 1.1);
      }

      let used = 0;
      for (const s of flashes) {
        if (!s.userData.on && used < (big ? 2 : 1)) {
          const lg = used++;
          s.userData.on = true;
          s.userData.t = 0;
          s.userData.s0 = lg ? 1.6 : 0.8;
          s.userData.s1 = lg ? 6 : 4;
          s.material.color.set(lg ? 0xff7a20 : 0xfff2c0);
          s.position.copy(wp);
          s.visible = true;
        }
      }

      boomLight.position.copy(wp);
      boomT = 1;
      eUntil = performance.now() + 1400;

      for (const o of crackers) {
        if (o === c || o.dead) continue;
        const d = o.g.position.distanceTo(wp);
        if (d < 2.4) {
          const f = 1 - d / 2.4;
          kick(o, (big ? 9 : 4) * f, rnd(-5, 5) * f);
        }
      }

      for (let j = 1; j < M; j++) {
        if (j === held) continue;
        const d = P[j].distanceTo(wp);
        if (d < 2.2) {
          const f = 1 - d / 2.2;
          wd.subVectors(P[j], wp).normalize();
          Q[j].addScaledVector(wd, -(big ? 0.05 : 0.015) * f);
        }
      }

      c.dead = true;
      bang(big ? 0.8 : 0.35, big);
    }

    interface ChainItem {
      o: Cracker;
      t: number;
      big: boolean;
    }

    const chainQ: ChainItem[] = [];

    function startChain() {
      if (burning || cool > 0 || leaving || !landed || !crackers.some((c) => !c.dead)) return;
      burning = true;
      fireOn = true;
      fireNode = M - 1;
      fireBoost = 1;
      frontRow = rows - 1;

      initAudio();

      for (const o of crackers) {
        if (o.dead) continue;
        const r = o.k >> 2;
        chainQ.push({
          o,
          t: 0.6 + (rows - 1 - r) * 0.28 + rnd(0, 0.12),
          big: r === rows - 1,
        });
      }

      // Sort crackers chronologically by burst time
      const sorted = [...chainQ].sort((a, b) => a.t - b.t);

      // Pre-schedule full vibration pattern array during active user gesture:
      // Mobile browsers (Chrome/Android/WebKit) permit navigator.vibrate(pattern)
      // when initiated synchronously within touch/tap event handlers!
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          const pattern: number[] = [];
          // Instant spark ignition haptic pulse
          pattern.push(30);
          let prevTimeMs = 30;

          for (const item of sorted) {
            const burstTimeMs = Math.round(item.t * 1000);
            const duration = item.big ? 80 : 28;
            const pause = Math.max(12, burstTimeMs - prevTimeMs);
            pattern.push(pause);
            pattern.push(duration);
            prevTimeMs = burstTimeMs + duration;
          }

          navigator.vibrate(pattern);
        } catch {}
      }
    }

    function resetCrackers() {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(0);
        } catch {}
      }
      chainQ.length = 0;
      burning = false;
      fireOn = false;
      cool = 0;
      leaving = false;
      for (const c of crackers) {
        c.dead = false;
        c.a = c.a0;
        c.y = c.y0;
        c.va = c.vy = 0;
        c.init = false;
      }
    }

    function newString() {
      resetCrackers();
      held = -1;
      dropY = 12;
      dropV = 0;
      landed = false;
      spinW = 0;
      for (let j = 0; j < M; j++) {
        P[j].set(0, PIVOT + 12 - j * SEG, 0);
        Q[j].copy(P[j]);
      }
    }

    // Expose reset to React
    triggerResetRef.current = resetCrackers;

    // ---------- interaction ----------
    let auto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let swipe = false;
    let sx = 0;
    let sy = 0;
    let px = 0;
    let py = 0;
    let pt = 0;
    let downT = 0;
    let moved = 0;
    let gz = 0;
    let tapC: Cracker | null = null;
    let currentDragMode: 'rope' | 'crackers' = 'rope';
    let spinW = 0;
    let spinA = 0;
    let dropY = 12;
    let dropV = 0;
    let landed = false;

    toggleModeRef.current = () => {
      currentDragMode = currentDragMode === 'rope' ? 'crackers' : 'rope';
      setDragMode(currentDragMode);
    };

    toggleSpinRef.current = () => {
      auto = !auto;
      setAutoSpin(auto);
    };

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hitP = new THREE.Vector3();
    const pv = new THREE.Vector3();
    const s0 = new THREE.Vector3();
    const s1 = new THREE.Vector3();
    const onR = new THREE.Vector3();

    function loc(e: PointerEvent): [number, number] {
      const r = canvas!.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }

    function setRay(x: number, y: number) {
      ndc.set((x / cw) * 2 - 1, -(y / ch) * 2 + 1);
      ray.setFromCamera(ndc, camera);
    }

    function pick(x: number, y: number): Cracker | null {
      setRay(x, y);
      let best: Cracker | null = null;
      let bd = 1e9;
      for (const c of crackers) {
        if (c.dead) continue;
        ax.setFromMatrixColumn(c.g.matrix, 0);
        s0.copy(c.g.position);
        s1.copy(s0).addScaledVector(ax, 1.06);
        if (ray.ray.distanceSqToSegment(s0, s1, onR, undefined) < 0.02) {
          const d = onR.distanceToSquared(ray.ray.origin);
          if (d < bd) {
            bd = d;
            best = c;
          }
        }
      }
      return best;
    }

    function nearestNode(x: number, y: number): number {
      let best = -1;
      let bd = 1e9;
      for (let j = 1; j < M - 1; j++) {
        pv.copy(P[j]).project(camera);
        const d = Math.hypot(((pv.x + 1) / 2) * cw - x, ((1 - pv.y) / 2) * ch - y);
        if (d < bd) {
          bd = d;
          best = j;
        }
      }
      return bd < 130 ? best : -1;
    }

    function hit(c: Cracker, vx: number, vy: number) {
      ax.setFromMatrixColumn(c.g.matrix, 0).normalize();
      const dp = -vy * 0.004;
      const dyw = vx * 0.004 * ax.z;
      kick(c, dp, dyw);
      [c.k - 4, c.k + 4].forEach((j) => {
        const o = crackers[j];
        if (o) kick(o, dp * 0.35, dyw * 0.35);
      });
    }

    const onPointerDown = (e: PointerEvent) => {
      initAudio();
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(20);
        } catch {}
      }
      const [x, y] = loc(e);
      sx = px = x;
      sy = py = y;
      pt = downT = performance.now();
      moved = 0;
      canvas.setPointerCapture(e.pointerId);
      tapC = pick(x, y);
      if (currentDragMode === 'crackers' && tapC) {
        swipe = true;
      } else if (landed) {
        const j = nearestNode(x, y);
        if (j > 0) {
          held = j;
          gz = P[j].z;
          target.copy(P[j]);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (held < 0 && !swipe) return;
      const [x, y] = loc(e);
      const now = performance.now();
      const dtm = Math.max(8, now - pt);
      moved = Math.max(moved, Math.hypot(x - sx, y - sy));

      if (held > 0) {
        setRay(x, y);
        plane.constant = -gz;
        if (ray.ray.intersectPlane(plane, hitP)) {
          hitP.y -= anchorY;
          const lim = held * SEG * 0.98;
          if (hitP.length() > lim) hitP.setLength(lim);
          hitP.y += anchorY;
          target.copy(hitP);
        }
      } else {
        const vx = ((x - px) / dtm) * 1000;
        const vy = ((y - py) / dtm) * 1000;
        const n = Math.max(1, Math.min(8, Math.ceil(Math.hypot(x - px, y - py) / 12)));
        for (let s = 1; s <= n; s++) {
          const h = pick(px + ((x - px) * s) / n, py + ((y - py) * s) / n);
          if (h) hit(h, vx, vy);
        }
      }
      px = x;
      py = y;
      pt = now;
    };

    const release = (e: PointerEvent, cancel: boolean) => {
      const [x, y] = loc(e);
      const tap = !cancel && moved < 10 && performance.now() - downT < 350;
      if (tap) {
        if (tapC || nearestNode(x, y) > 0 || (cw > 0 && Math.abs(x - cw / 2) < cw * 0.45)) {
          startChain();
        } else {
          const s = x < cw / 2 ? 1 : -1;
          for (let j = 1; j < M; j++) Q[j].x -= s * 0.02 * (j / M);
          spinW += s * 1.5;
          fireBoost = 1;
        }
      }
      held = -1;
      swipe = false;
    };

    const onPointerUp = (e: PointerEvent) => release(e, false);
    const onPointerCancel = (e: PointerEvent) => release(e, true);

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      camDist = Math.max(7, Math.min(26, camDist + e.deltaY * 0.03));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    window.addEventListener('resize', resize);
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
    }
    applyQ();

    // ---------- loop ----------
    const UP = new THREE.Vector3(0, 1, 0);
    const U = new THREE.Vector3();
    const q1 = new THREE.Quaternion();
    const qs = new THREE.Quaternion();
    const qb = new THREE.Quaternion();
    const ql = new THREE.Quaternion();
    const eu = new THREE.Euler();
    const off = new THREE.Vector3();
    const clock = new THREE.Clock();

    let running = true;
    let visible = true;
    let frames = 0;
    let avg = 16;
    let lastQ = 0;
    let animId: number;

    let intersectionObserver: IntersectionObserver | null = null;
    if (window.IntersectionObserver) {
      intersectionObserver = new IntersectionObserver((es) => {
        visible = es[0].isIntersecting;
        if (visible && !running) {
          running = true;
          clock.getDelta();
          requestAnimationFrame(tick);
        }
      });
      intersectionObserver.observe(canvas);
    }

    function tick() {
      if (!visible) {
        running = false;
        return;
      }
      const raw = clock.getDelta();
      const dt = Math.min(raw, 0.05) || 0.016;
      const t = clock.elapsedTime;
      const now = performance.now();

      if (++frames > 90) {
        avg += (Math.min(raw, 0.1) * 1000 - avg) * 0.05;
        if (avg > 27 && q > 0 && now - lastQ > 2500) {
          q--;
          lastQ = now;
          avg = 16;
          applyQ();
        }
      }

      // anchor: drop-in / rope spring / fall away
      if (leaving) {
        dropV -= 22 * dt;
        dropY += dropV * dt;
        if (dropY < -22) {
          leaving = false;
          newString();
        }
      } else if (!landed) {
        dropV -= 22 * dt;
        dropY += dropV * dt;
        if (dropY <= 0) {
          landed = true;
          spinW += rnd(-1.5, 1.5);
          for (let j = 1; j < M; j++) {
            Q[j].x -= (rnd(-1, 1) * 0.02 * j) / M;
            Q[j].z -= (rnd(-1, 1) * 0.012 * j) / M;
          }
        }
      } else {
        dropV += (-220 * dropY - 16 * dropV) * dt;
        dropY += dropV * dt;
      }

      anchorY = PIVOT + dropY;
      stepRope(dt / 2);
      stepRope(dt / 2);

      spinW += ((auto ? 0.5 : 0) - spinW) * Math.min(1, dt * 0.6);
      spinA += spinW * dt;
      const lift = Math.min(0.5, spinW * spinW * 0.06);

      for (let k = 0; k < crackers.length; k++) {
        const c = crackers[k];
        const u = crackers[k - 4] || c;
        const d = crackers[k + 4] || c;
        const p = P[c.j];
        if (!c.init) {
          c.pX = p.x;
          c.pY = p.y;
          c.pZ = p.z;
          c.init = true;
        }
        const vX = (p.x - c.pX) / dt;
        const vY = (p.y - c.pY) / dt;
        const vZ = (p.z - c.pZ) / dt;
        c.accX += ((vX - c.vX) / dt - c.accX) * 0.25;
        c.accY += ((vY - c.vY) / dt - c.accY) * 0.25;
        c.accZ += ((vZ - c.vZ) / dt - c.accZ) * 0.25;
        c.vX = vX;
        c.vY = vY;
        c.vZ = vZ;
        c.pX = p.x;
        c.pY = p.y;
        c.pZ = p.z;

        ax.setFromMatrixColumn(c.g.matrix, 0).normalize();
        const dp = c.a - c.a0;
        const dy = c.y - c.y0;
        const ap =
          -60 * (dp - lift) -
          2.4 * c.va +
          18 * ((u.a - u.a0 + d.a - d.a0) * 0.5 - dp) -
          cl(c.accY, 150) * 0.04;
        const ay =
          -60 * dy -
          2.4 * c.vy +
          18 * ((u.y - u.y0 + d.y - d.y0) * 0.5 - dy) -
          (cl(c.accX, 150) * ax.z - cl(c.accZ, 150) * ax.x) * 0.03;

        c.va += ap * dt;
        c.a += c.va * dt;
        c.vy += ay * dt;
        c.y += c.vy * dt;

        if (c.a > 1.2 || c.a < -1.4) {
          c.a = cl(c.a, 1.3);
          c.va *= -0.3;
        }
        if (Math.abs(c.y - c.y0) > 0.9) {
          c.y = c.y0 + Math.sign(c.y - c.y0) * 0.9;
          c.vy *= -0.3;
        }

        U.subVectors(P[c.j - 1], P[c.j + 1]).normalize();
        q1.setFromUnitVectors(UP, U);
        qs.setFromAxisAngle(U, spinA);
        qb.multiplyQuaternions(qs, q1);
        off.set(0.04 * c.side, c.dy, c.dz).applyQuaternion(qb);
        c.g.position.copy(p).add(off);

        ql.setFromEuler(eu.set(0, (c.side < 0 ? Math.PI : 0) + c.y, c.a));
        c.g.quaternion.multiplyQuaternions(qb, ql);
        c.g.scale.set(c.len, 1, 1);
        c.g.updateMatrix();
        cm.setMatrixAt(c.k, c.dead ? ZERO : c.g.matrix);
      }

      cm.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < rows; i++) {
        dm.position.copy(P[CORD + 2 * i]);
        dm.updateMatrix();
        km.setMatrixAt(i, dm.matrix);
      }
      km.instanceMatrix.needsUpdate = true;
      updateRope();

      // chain reaction + lifecycle
      for (let i = chainQ.length - 1; i >= 0; i--) {
        const e = chainQ[i];
        e.t -= dt;
        if (e.t <= 0) {
          explode(e.o, e.big);
          frontRow = e.o.k >> 2;
          fireNode = CORD + 2 * frontRow + 1;
          chainQ.splice(i, 1);
        }
      }

      if (burning && chainQ.length === 0) {
        burning = false;
        fireOn = false;
        cool = 1.2;
      }
      if (cool > 0) {
        cool -= dt;
        if (cool <= 0) leaving = true;
      }

      // fire
      fire.position.copy(P[fireNode]);
      fireVis.visible = fireOn;
      fireBoost *= Math.pow(0.02, dt);

      if (fireOn) {
        const f = 0.85 + Math.sin(t * 37) * 0.1 + Math.sin(t * 23.7) * 0.08 + Math.random() * 0.08;
        glow.scale.setScalar(1.7 * f * (1 + fireBoost * 0.8));
        core.scale.setScalar(0.65 * f * (1 + fireBoost * 0.6));
        light.intensity = 2.2 * f + Math.random() * 0.8;
        for (const s of tongues) {
          const d = s.userData;
          d.p += dt * d.sp;
          if (d.p > 1) {
            d.p = 0;
            d.x = rnd(-0.12, 0.12);
            d.z = rnd(-0.1, 0.1);
          }
          const p = d.p;
          s.position.set(d.x * (1 - p) + Math.sin(t * 9 + d.x * 40) * 0.05 * p, p * 0.9, d.z);
          s.scale.setScalar(0.55 * (1 - p) + 0.1);
          s.material.opacity = 1 - p;
          s.material.color.setRGB(1, 0.75 - p * 0.5, 0.25 - p * 0.2);
        }
        for (let i = 0; i < NP; i++) {
          life[i] -= dt;
          if (life[i] <= 0) respawn(i);
          const v = vel[i];
          v.multiplyScalar(0.97);
          v.y -= 0.4 * dt;
          pos[i * 3] += v.x * dt;
          pos[i * 3 + 1] += v.y * dt;
          pos[i * 3 + 2] += v.z * dt;
          const k = life[i] / maxL[i];
          col[i * 3] = k;
          col[i * 3 + 1] = k * (0.35 + 0.6 * k);
          col[i * 3 + 2] = k * k * 0.5;
        }
        pg.attributes.position.needsUpdate = true;
        pg.attributes.color.needsUpdate = true;
      } else {
        light.intensity = 0;
      }

      // explosions (only while active)
      if (now < eUntil) {
        const damp = Math.pow(0.08, dt);
        for (let i = 0; i < EN; i++) {
          if (elife[i] <= 0) {
            ecol[i * 3] = ecol[i * 3 + 1] = ecol[i * 3 + 2] = 0;
            continue;
          }
          elife[i] -= dt;
          const v = evel[i];
          v.multiplyScalar(damp);
          v.y -= 5 * dt;
          epos[i * 3] += v.x * dt;
          epos[i * 3 + 1] += v.y * dt;
          epos[i * 3 + 2] += v.z * dt;
          const k = Math.max(0, elife[i] / emax[i]);
          ecol[i * 3] = k;
          ecol[i * 3 + 1] = k * (0.3 + 0.6 * k);
          ecol[i * 3 + 2] = k * k * 0.35;
        }
        egeo.attributes.position.needsUpdate = true;
        egeo.attributes.color.needsUpdate = true;
      }

      for (const s of flashes) {
        if (!s.userData.on) continue;
        const u = s.userData;
        u.t += dt / 0.45;
        if (u.t >= 1) {
          u.on = false;
          s.visible = false;
          continue;
        }
        s.scale.setScalar(u.s0 + u.t * u.s1);
        s.material.opacity = (1 - u.t) * (1 - u.t);
      }

      boomLight.intensity = boomT * 16;
      boomT *= Math.pow(0.002, dt);

      const H_half = camDist * Math.tan((40 * Math.PI) / 360);
      const camY = PIVOT - H_half - 0.15;
      camera.position.set(0, camY, camDist);
      camera.lookAt(0, camY, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (actx && actx.close) {
        actx.close().catch(() => {});
      }
      renderer.dispose();
      rgeo.dispose();
      crackGeo.dispose();
      pg.dispose();
      egeo.dispose();
      tex.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative select-none pointer-events-auto', className)}
      style={{
        touchAction: 'none',
        ...style,
      }}
      title="Tap crackers to light · Drag the rope!"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
export default HangingSaravedi3D;

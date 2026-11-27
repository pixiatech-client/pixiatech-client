'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowRight } from 'lucide-react';
import type { FeaturedProject } from '../data/projects';

interface WebGLStageProps {
  projects: FeaturedProject[];
  dimmed: boolean;
  interactive: boolean;
  initialIndex?: number;
  onReady: () => void;
  onFirstInteract: () => void;
  onSelectProject: (slug: string) => void;
}

const GRID_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GRID_FRAGMENT_SHADER = /* glsl */ `
  uniform float uScroll;
  uniform float uDim;
  varying vec3 vWorldPos;

  void main() {
    vec2 coord = vec2(vWorldPos.x + uScroll, vWorldPos.z) / 9.1;
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);
    float mask = 1.0 - min(line, 1.0);

    float distZ = smoothstep(-140.0, -6.0, vWorldPos.z);
    float nearFade = smoothstep(38.0, 6.0, vWorldPos.z);
    float distX = 1.0 - smoothstep(45.0, 130.0, abs(vWorldPos.x));
    float alpha = mask * distZ * nearFade * distX * 0.24 * (1.0 - uDim * 0.72);

    gl_FragColor = vec4(vec3(0.58, 0.58, 0.60), alpha);
  }
`;

const CARD_VERTEX_SHADER = /* glsl */ `
  uniform float uSheetW;
  uniform float uSheetD;
  uniform float uSheetT;
  uniform float uSheetC;
  uniform float uSheetP;
  uniform float uSheetV;
  uniform float uLeanA;
  uniform float uLeanW;
  uniform float uHover;
  uniform float uDent;
  uniform vec2 uSize;

  varying vec2 vUv;
  varying vec3 vFlat;

  const float SHEET_PI = 3.141592653589793;
  const float SHEET_TAIL = 1.0;
  const float SHEET_SHIFT = -0.2;
  const float SHEET_BANK = -0.16;
  const float SHEET_VTWIST = 1.8;
  const float SHEET_DIAG = 0.03;
  const float SHEET_REAR_Y = 0.1;
  const float SHEET_REAR_Z = 0.2;

  float sheetQ(float wx) {
    return wx / max(uSheetW, 0.0001) * uSheetT + SHEET_SHIFT;
  }

  float sheetShape(float q) {
    return mix(1.0 - q * q, sin(SHEET_PI * q), uSheetC) * exp(-SHEET_TAIL * q * q);
  }

  float sheetShapeSlope(float q) {
    float g = exp(-SHEET_TAIL * q * q);
    float bowl = -2.0 * q * (1.0 + SHEET_TAIL * (1.0 - q * q));
    float ess = SHEET_PI * cos(SHEET_PI * q) - 2.0 * SHEET_TAIL * q * sin(SHEET_PI * q);
    return mix(bowl, ess, uSheetC) * g;
  }

  float sheetZ(float wx) {
    return -uSheetD * sheetShape(sheetQ(wx));
  }

  float sheetRoll(float wx) {
    if (uSheetW < 0.001) return 0.0;
    return SHEET_BANK * sheetShapeSlope(sheetQ(wx)) / SHEET_PI * uSheetC * uSheetP;
  }

  // Global world-space roll about the shared ribbon centreline (y = z = 0)
  vec4 sheetWind(vec4 w) {
    float a = sheetRoll(w.x);
    if (uSheetV > 0.001 && uSheetW > 0.001 && uSheetP > 0.001) {
      float qe = w.x / uSheetW;
      a += SHEET_VTWIST * uSheetV * smoothstep(0.3, 0.9, abs(qe)) * sign(qe) * uSheetP;
    }
    if (abs(a) < 0.0001) return w;
    float s = sin(a);
    float c = cos(a);
    return vec4(w.x, w.y * c - w.z * s, w.y * s + w.z * c, w.w);
  }

  vec4 sheetTransform(vec4 w) {
    w = sheetWind(w);
    if (uSheetW > 0.001 && uSheetP > 0.001 && uSheetD > 0.001) {
      w.z += sheetZ(w.x) * uSheetP;
    }
    if (uSheetW > 0.001 && uSheetP > 0.001) {
      float qw = w.x / uSheetW;
      w.y += SHEET_DIAG * w.x * uSheetP;
      if (uSheetV > 0.001) {
        float m = 1.0 - smoothstep(-1.0, 0.3, qw);
        w.y += SHEET_REAR_Y * uSheetW * uSheetV * m * uSheetP;
        w.z += SHEET_REAR_Z * uSheetW * uSheetV * m * uSheetP;
      }
    }
    return w;
  }

  float leanRamp(float s) {
    s = clamp(s, -1.0, 1.0);
    return s * (1.5 - 0.5 * s * s);
  }

  vec4 applyLean(vec4 w, float k) {
    if (uLeanW > 0.001 && k > 0.001) {
      w.z += uLeanA * leanRamp(w.x / uLeanW) * k;
    }
    return w;
  }

  float sheetDome(vec2 uv) {
    vec2 q = uv * 2.0 - 1.0;
    return (1.0 - q.x * q.x) * (1.0 - q.y * q.y);
  }

  void main() {
    vUv = uv;
    vec4 flatWorld = modelMatrix * vec4(position, 1.0);
    vFlat = flatWorld.xyz;

    vec4 w = sheetTransform(flatWorld);
    w = applyLean(w, uSheetP);

    if (uHover > 0.0001) {
      w.z -= uHover * uDent * uSize.y * sheetDome(uv);
    }

    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const CARD_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uSheetW;
  uniform float uSheetD;
  uniform float uSheetT;
  uniform float uSheetC;
  uniform float uSheetP;
  uniform float uLeanA;
  uniform float uLeanW;
  uniform float uHover;
  uniform float uDent;
  uniform float uDim;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uImgAspect;

  varying vec2 vUv;
  varying vec3 vFlat;

  const float SHEET_PI = 3.141592653589793;
  const float SHEET_TAIL = 1.0;
  const float SHEET_SHIFT = -0.2;
  const float SHEET_BANK = -0.16;

  const vec3 LIGHT_DIR = normalize(vec3(-0.4, 0.5, 1.0));
  const float LIGHT_GLOSS = 48.0;
  const float LIGHT_SPEC = 0.35;
  const float LIGHT_DIFF = 0.12;

  float sheetQ(float wx) {
    return wx / max(uSheetW, 0.0001) * uSheetT + SHEET_SHIFT;
  }

  float sheetShape(float q) {
    return mix(1.0 - q * q, sin(SHEET_PI * q), uSheetC) * exp(-SHEET_TAIL * q * q);
  }

  float sheetShapeSlope(float q) {
    float g = exp(-SHEET_TAIL * q * q);
    float bowl = -2.0 * q * (1.0 + SHEET_TAIL * (1.0 - q * q));
    float ess = SHEET_PI * cos(SHEET_PI * q) - 2.0 * SHEET_TAIL * q * sin(SHEET_PI * q);
    return mix(bowl, ess, uSheetC) * g;
  }

  float sheetZ(float wx) {
    return -uSheetD * sheetShape(sheetQ(wx));
  }

  float sheetRoll(float wx) {
    if (uSheetW < 0.001) return 0.0;
    return SHEET_BANK * sheetShapeSlope(sheetQ(wx)) / SHEET_PI * uSheetC * uSheetP;
  }

  float leanRamp(float s) {
    s = clamp(s, -1.0, 1.0);
    return s * (1.5 - 0.5 * s * s);
  }

  float leanSlope(float s) {
    s = min(abs(s), 1.0);
    return 1.5 * (1.0 - s * s);
  }

  float sheetDome(vec2 uv) {
    vec2 q = uv * 2.0 - 1.0;
    return (1.0 - q.x * q.x) * (1.0 - q.y * q.y);
  }

  float sheetOffset(float wx, vec2 uv, float resY) {
    float z = 0.0;
    if (uSheetW > 0.001 && uSheetP > 0.001 && uSheetD > 0.001) {
      z += sheetZ(wx) * uSheetP;
    }
    if (uLeanW > 0.001) {
      z += uLeanA * leanRamp(wx / uLeanW) * uSheetP;
    }
    if (uHover > 0.0001) {
      z -= uHover * uDent * resY * sheetDome(uv);
    }
    return z;
  }

  vec3 sheetNormal(float wx, vec2 uv, vec2 res) {
    float dzdx = 0.0;
    float dzdy = 0.0;

    if (uSheetW > 0.001 && uSheetP > 0.001 && uSheetD > 0.001) {
      dzdx += -uSheetD * sheetShapeSlope(sheetQ(wx)) * uSheetT / uSheetW * uSheetP;
    }
    if (uLeanW > 0.001) {
      dzdx += (uLeanA / uLeanW) * leanSlope(wx / uLeanW) * uSheetP;
    }
    if (uHover > 0.0001) {
      vec2 q = uv * 2.0 - 1.0;
      float a = uHover * uDent;
      dzdx += 4.0 * a * res.y * q.x * (1.0 - q.y * q.y) / max(res.x, 0.0001);
      dzdy += 4.0 * a * q.y * (1.0 - q.x * q.x);
    }

    vec3 n = normalize(vec3(-dzdx, -dzdy, 1.0));
    float a = sheetRoll(wx);
    if (abs(a) > 0.0001) {
      float s = sin(a);
      float c = cos(a);
      n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
    }
    return n;
  }

  vec3 sheetLit(vec3 col, vec3 n, vec3 v, float amt) {
    if (amt < 0.001) return col;
    vec3 h = normalize(LIGHT_DIR + v);
    float spec = pow(max(dot(n, h), 0.0), 32.0) * 0.08 * amt;
    return col + spec;
  }

  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  vec2 uvCover(vec2 uv, float planeAspect, float imgAspect) {
    vec2 s = vec2(1.0);
    if (imgAspect > planeAspect) {
      s.x = planeAspect / max(imgAspect, 0.001);
    } else {
      s.y = imgAspect / max(planeAspect, 0.001);
    }
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    float zoom = mix(1.0, 1.03, uHover);
    float planeAspect = uSize.x / max(uSize.y, 0.001);
    vec2 coverUv = uvCover(vUv, planeAspect, uImgAspect);
    vec2 texUv = (coverUv - 0.5) / zoom + 0.5;
    vec4 tex = texture2D(uMap, texUv);

    vec2 halfExtents = uSize * 0.5;
    vec2 localPos = (vUv - 0.5) * uSize;
    float d = sdRoundedBox(localPos, halfExtents, uRadius);
    float edgeAlpha = 1.0 - smoothstep(-0.04, 0.04, d);

    if (edgeAlpha <= 0.005) discard;

    // Exact per-fragment analytical normal + tight glossy sheen for Pixiatech ribbon lighting
    vec3 p = vFlat + vec3(0.0, 0.0, sheetOffset(vFlat.x, vUv, uSize.y));
    vec3 n = sheetNormal(vFlat.x, vUv, uSize);
    vec3 viewDir = normalize(cameraPosition - p);
    vec3 color = sheetLit(tex.rgb, n, viewDir, uSheetP);

    // Gentle trough depth haze (pulls far right trough gently into dark background)
    if (uSheetD > 0.001 && uSheetW > 0.001) {
      float depthNorm = clamp(-sheetZ(vFlat.x) / max(uSheetD, 0.001), -1.0, 1.0);
      float haze = smoothstep(0.35, 1.0, depthNorm) * 0.08 * uSheetP;
      color *= (1.0 - haze);
    }

    // Bottom title scrim so white typography always reads cleanly without crushing image colors
    float bottomEdge = smoothstep(0.18, 0.0, vUv.y);
    float bottomScrim = bottomEdge * bottomEdge * 0.22;
    color = mix(color, color * 0.65, bottomScrim);

    color *= (1.0 - uDim * 0.78);

    float finalAlpha = edgeAlpha * (1.0 - uDim * 0.45);
    gl_FragColor = vec4(color, finalAlpha);
  }
`;

const REFL_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uDim;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uImgAspect;

  varying vec2 vUv;
  varying vec3 vFlat;

  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  vec2 uvCover(vec2 uv, float planeAspect, float imgAspect) {
    vec2 s = vec2(1.0);
    if (imgAspect > planeAspect) {
      s.x = planeAspect / max(imgAspect, 0.001);
    } else {
      s.y = imgAspect / max(planeAspect, 0.001);
    }
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    float planeAspect = uSize.x / max(uSize.y, 0.001);

    // Invert Y to reflect the lower half of the card smoothly
    vec2 mirroredUv = vec2(vUv.x, (1.0 - vUv.y) * 0.42);
    vec2 sampleUv = uvCover(mirroredUv, planeAspect, uImgAspect);

    // Multi-tap soft glossy dispersion (Fresnel-style blur increasing with distance)
    float blur = mix(0.002, 0.014, 1.0 - vUv.y);
    vec4 tex = texture2D(uMap, sampleUv) * 0.36;
    tex += texture2D(uMap, sampleUv + vec2(blur * 1.4, 0.0)) * 0.16;
    tex += texture2D(uMap, sampleUv - vec2(blur * 1.4, 0.0)) * 0.16;
    tex += texture2D(uMap, sampleUv + vec2(0.0, blur)) * 0.16;
    tex += texture2D(uMap, sampleUv - vec2(0.0, blur)) * 0.16;

    // Rounded shape mask
    vec2 halfExtents = uSize * 0.5;
    vec2 localPos = (vUv - 0.5) * uSize;
    float d = sdRoundedBox(localPos, halfExtents, uRadius);
    float edgeAlpha = 1.0 - smoothstep(-0.04, 0.04, d);

    if (edgeAlpha <= 0.005) discard;

    // Glossy gradient fade: subtle transparent reflection fading smoothly into black
    float fade = pow(vUv.y, 1.5) * 0.32;
    float alpha = edgeAlpha * fade * (1.0 - uDim * 0.85);

    if (alpha <= 0.002) discard;

    vec3 col = tex.rgb * (0.8 + 0.2 * vUv.y);
    gl_FragColor = vec4(col, alpha);
  }
`;

const _projLeft = new THREE.Vector3();
const _projRight = new THREE.Vector3();

interface SheetEvalParams {
  W: number;
  D: number;
  T: number;
  C: number;
  P: number;
  V: number;
  leanA: number;
  leanW: number;
}

const SHEET_PI = Math.PI;
const SHEET_TAIL = 1.0;
const SHEET_SHIFT = -0.2;
const SHEET_BANK = -0.16;
const SHEET_VTWIST = 1.8;
const SHEET_DIAG = 0.03;
const SHEET_REAR_Y = 0.1;
const SHEET_REAR_Z = 0.2;

function evalWorldPointJS(
  wx: number,
  wy: number,
  wz: number,
  p: SheetEvalParams,
  out: THREE.Vector3
): THREE.Vector3 {
  const q = (wx / Math.max(p.W, 0.0001)) * p.T + SHEET_SHIFT;
  const g = Math.exp(-SHEET_TAIL * q * q);
  const shape = ((1.0 - p.C) * (1.0 - q * q) + p.C * Math.sin(SHEET_PI * q)) * g;
  const bowlSlope = -2.0 * q * (1.0 + SHEET_TAIL * (1.0 - q * q));
  const essSlope =
    SHEET_PI * Math.cos(SHEET_PI * q) - 2.0 * SHEET_TAIL * q * Math.sin(SHEET_PI * q);
  const slope = ((1.0 - p.C) * bowlSlope + p.C * essSlope) * g;

  let a = p.W > 0.001 ? ((SHEET_BANK * slope) / SHEET_PI) * p.C * p.P : 0;
  if (p.V > 0.001 && p.W > 0.001 && p.P > 0.001) {
    const qe = wx / p.W;
    const t = THREE.MathUtils.clamp((Math.abs(qe) - 0.3) / (0.9 - 0.3), 0, 1);
    const sm = t * t * (3 - 2 * t);
    a += SHEET_VTWIST * p.V * sm * Math.sign(qe) * p.P;
  }

  let ry = wy;
  let rz = wz;
  if (Math.abs(a) >= 0.0001) {
    const s = Math.sin(a);
    const c = Math.cos(a);
    ry = wy * c - wz * s;
    rz = wy * s + wz * c;
  }

  if (p.W > 0.001 && p.P > 0.001 && p.D > 0.001) {
    rz += -p.D * shape * p.P;
  }
  if (p.W > 0.001 && p.P > 0.001) {
    const qw = wx / p.W;
    ry += SHEET_DIAG * wx * p.P;
    if (p.V > 0.001) {
      const t = THREE.MathUtils.clamp((qw - -1.0) / (0.3 - -1.0), 0, 1);
      const m = 1.0 - t * t * (3 - 2 * t);
      ry += SHEET_REAR_Y * p.W * p.V * m * p.P;
      rz += SHEET_REAR_Z * p.W * p.V * m * p.P;
    }
  }

  if (p.leanW > 0.001 && p.P > 0.001) {
    const ls = THREE.MathUtils.clamp(wx / p.leanW, -1, 1);
    rz += p.leanA * (ls * (1.5 - 0.5 * ls * ls)) * p.P;
  }

  return out.set(wx, ry, rz);
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function WebGLStage({
  projects,
  dimmed,
  interactive,
  initialIndex = 3,
  onReady,
  onFirstInteract,
  onSelectProject,
}: WebGLStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const arrowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [webglFailed, setWebglFailed] = useState(false);

  const stateRef = useRef({
    dimmed,
    interactive,
    scrollTarget: 0,
    scrollCurrent: 0,
    velocity: 0,
    inertiaVel: 0,
    pointerX: 0,
    pointerY: 0,
    ndcX: 0,
    ndcY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragScrollOrigin: 0,
    lastDragX: 0,
    lastDragTime: 0,
    dragMoved: false,
    hoveredIndex: -1,
    hasInteracted: false,
    autoResumeAt: 0,
  });

  stateRef.current.dimmed = dimmed;
  stateRef.current.interactive = interactive;

  const callbacksRef = useRef({ onReady, onFirstInteract, onSelectProject });
  callbacksRef.current = { onReady, onFirstInteract, onSelectProject };

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      callbacksRef.current.onReady();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth || window.innerWidth, host.clientHeight || window.innerHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => e.preventDefault();
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup for Pixiatech stage: FOV 53.4 at camZ 41.18
    // gives gentle, architectural perspective along the continuous depth S-curve
    const camera = new THREE.PerspectiveCamera(
      53.4,
      (host.clientWidth || window.innerWidth) / (host.clientHeight || window.innerHeight),
      0.2,
      300
    );
    camera.position.set(0, 2.5, 41.18);

    // Perspective Grid Floor (6% of frustum height below the card strip)
    const gridGeo = new THREE.PlaneGeometry(460, 280, 1, 1);
    const gridMat = new THREE.ShaderMaterial({
      uniforms: {
        uScroll: { value: 0 },
        uDim: { value: 0 },
      },
      vertexShader: GRID_VERTEX_SHADER,
      fragmentShader: GRID_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.rotation.x = -Math.PI / 2;
    gridMesh.position.set(0, -11.5, -52);
    scene.add(gridMesh);

    const manager = new THREE.LoadingManager();
    let readyFired = false;
    const fireReady = () => {
      if (!readyFired) {
        readyFired = true;
        callbacksRef.current.onReady();
      }
    };
    manager.onLoad = fireReady;

    const loader = new THREE.TextureLoader(manager);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // 43.5% of 2 * frustumH (41.42) = 18.0 world units
    const CARD_H = 18.0;
    const REFL_H = 8.5;
    const GAP = 1.1;

    interface CardEntry {
      mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
      reflMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
      width: number;
      height: number;
      trackCenter: number;
      hoverValue: number;
    }

    let cursorTrack = 0;
    const cardEntries: CardEntry[] = projects.map((proj) => {
      const cardW = THREE.MathUtils.clamp(CARD_H * proj.aspect, 24.0, 34.0);
      const trackCenter = cursorTrack + cardW * 0.5;
      cursorTrack += cardW + GAP;

      const geo = new THREE.PlaneGeometry(cardW, CARD_H, 64, 24);
      const imgAspectUniform = { value: proj.aspect };
      const tex = loader.load(proj.heroImage, (loaded) => {
        loaded.colorSpace = THREE.NoColorSpace;
        loaded.anisotropy = maxAniso;
        if (loaded.image?.width && loaded.image?.height) {
          imgAspectUniform.value = loaded.image.width / loaded.image.height;
        }
        loaded.needsUpdate = true;
      });
      tex.colorSpace = THREE.NoColorSpace;
      tex.anisotropy = maxAniso;

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: tex },
          uSheetW: { value: 26 },
          uSheetD: { value: 5.2 },
          uSheetT: { value: 1.15 },
          uSheetC: { value: 1.0 },
          uSheetP: { value: 1.0 },
          uSheetV: { value: 0 },
          uLeanA: { value: -3.12 },
          uLeanW: { value: 26 },
          uHover: { value: 0 },
          uDent: { value: 0.025 },
          uDim: { value: 0 },
          uSize: { value: new THREE.Vector2(cardW, CARD_H) },
          uRadius: { value: 0.92 },
          uImgAspect: imgAspectUniform,
        },
        vertexShader: CARD_VERTEX_SHADER,
        fragmentShader: CARD_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.projectSlug = proj.slug;
      scene.add(mesh);

      // Glossy transparent mirrored reflection beneath the card
      const reflGeo = new THREE.PlaneGeometry(cardW, REFL_H, 64, 16);
      const reflMat = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: tex },
          uSheetW: { value: 26 },
          uSheetD: { value: 5.2 },
          uSheetT: { value: 1.15 },
          uSheetC: { value: 1.0 },
          uSheetP: { value: 1.0 },
          uSheetV: { value: 0 },
          uLeanA: { value: -3.12 },
          uLeanW: { value: 26 },
          uHover: { value: 0 },
          uDent: { value: 0 },
          uDim: { value: 0 },
          uSize: { value: new THREE.Vector2(cardW, REFL_H) },
          uRadius: { value: 0.92 },
          uImgAspect: imgAspectUniform,
        },
        vertexShader: CARD_VERTEX_SHADER,
        fragmentShader: REFL_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
      });

      const reflMesh = new THREE.Mesh(reflGeo, reflMat);
      scene.add(reflMesh);

      return { mesh, reflMesh, width: cardW, height: CARD_H, trackCenter, hoverValue: 0 };
    });

    const totalLoopWidth = cursorTrack;
    const startOffset =
      cardEntries[Math.min(initialIndex, cardEntries.length - 1)]?.trackCenter ?? 0;
    stateRef.current.scrollTarget = startOffset;
    stateRef.current.scrollCurrent = startOffset;

    const fallbackTimer = window.setTimeout(fireReady, 1400);

    const raycaster = new THREE.Raycaster();
    const pointerVec = new THREE.Vector2();
    const cardMeshes = cardEntries.map((c) => c.mesh);

    const markInteracted = () => {
      if (!stateRef.current.hasInteracted) {
        stateRef.current.hasInteracted = true;
        callbacksRef.current.onFirstInteract();
      }
    };

    const getScrollUnitRatio = () => ((host.clientWidth || window.innerWidth) < 650 ? 0.045 : 0.032);

    const onWheel = (e: WheelEvent) => {
      if (!stateRef.current.interactive) return;
      const isShift = e.shiftKey;
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      // N'intercepter que si défilement horizontal intentionnel ou touche Shift,
      // pour permettre le défilement vertical naturel de la page d'accueil !
      if (isHorizontal || isShift) {
        e.preventDefault();
        markInteracted();
        stateRef.current.inertiaVel = 0;
        stateRef.current.autoResumeAt = performance.now() + 650;
        const delta = isHorizontal ? e.deltaX : e.deltaY;
        stateRef.current.scrollTarget += delta * getScrollUnitRatio();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!stateRef.current.interactive) return;
      markInteracted();
      stateRef.current.scrollTarget = stateRef.current.scrollCurrent;
      stateRef.current.dragging = true;
      stateRef.current.inertiaVel = 0;
      stateRef.current.dragStartX = e.clientX;
      stateRef.current.dragStartY = e.clientY;
      stateRef.current.lastDragX = e.clientX;
      stateRef.current.lastDragTime = performance.now();
      stateRef.current.dragScrollOrigin = stateRef.current.scrollTarget;
      stateRef.current.dragMoved = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      stateRef.current.ndcX = nx;
      stateRef.current.ndcY = ny;
      stateRef.current.pointerX = nx;
      stateRef.current.pointerY = ny;

      if (stateRef.current.dragging && stateRef.current.interactive) {
        const dx = e.clientX - stateRef.current.dragStartX;
        const dy = e.clientY - stateRef.current.dragStartY;
        if (Math.hypot(dx, dy) > 6) {
          stateRef.current.dragMoved = true;
          markInteracted();
        }
        const now = performance.now();
        const dtMs = Math.max(8, now - stateRef.current.lastDragTime);
        const stepDx = e.clientX - stateRef.current.lastDragX;
        const sensitivity = (host.clientWidth || window.innerWidth) < 650 ? 0.088 : 0.056;
        stateRef.current.scrollTarget = stateRef.current.dragScrollOrigin - dx * sensitivity;
        stateRef.current.inertiaVel = (-stepDx * sensitivity) / (dtMs / 1000);
        stateRef.current.lastDragX = e.clientX;
        stateRef.current.lastDragTime = now;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!stateRef.current.dragging) return;
      const wasDrag = stateRef.current.dragMoved;
      const now = performance.now();
      if (now - stateRef.current.lastDragTime > 70) {
        stateRef.current.inertiaVel = 0;
      }
      stateRef.current.dragging = false;
      stateRef.current.autoResumeAt = now + 150;

      if (!wasDrag && stateRef.current.interactive) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerVec.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointerVec, camera);
        const hits = raycaster.intersectObjects(cardMeshes, false);
        if (hits.length > 0) {
          const slug = hits[0].object.userData.projectSlug as string | undefined;
          if (slug) {
            markInteracted();
            callbacksRef.current.onSelectProject(slug);
          }
        }
      }
    };

    const onPointerCancel = () => {
      if (!stateRef.current.dragging) return;
      stateRef.current.dragging = false;
      stateRef.current.inertiaVel = 0;
      stateRef.current.autoResumeAt = performance.now() + 150;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current.interactive) return;
      if (e.key === 'ArrowRight') {
        markInteracted();
        stateRef.current.autoResumeAt = performance.now() + 650;
        stateRef.current.scrollTarget += 26;
      } else if (e.key === 'ArrowLeft') {
        markInteracted();
        stateRef.current.autoResumeAt = performance.now() + 650;
        stateRef.current.scrollTarget -= 26;
      }
    };

    const computeBaseCamZ = (w: number, h: number) => {
      const aspect = w / Math.max(1, h);
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      const horizTan = Math.tan(fovRad / 2) * aspect;
      const fitCardZ = 16.0 / Math.max(0.18, horizTan * 0.92);
      return Math.max(41.18, fitCardZ);
    };

    let disposed = false;
    // La scène reste montée (le préloader attend `onReady`) mais on arrête de
    // rendre dès qu'elle sort de l'écran ou que l'onglet est masqué.
    let inViewport = true;
    const visibilityObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              inViewport = entries.some((entry) => entry.isIntersecting);
            },
            { rootMargin: '160px' }
          );
    visibilityObserver?.observe(host);
    const onDocumentVisibility = () => {
      if (!document.hidden) lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', onDocumentVisibility);

    const onResize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.fov = w < 650 ? 58 : 53.4;
      camera.updateProjectionMatrix();
      camera.position.z = computeBaseCamZ(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      if (!disposed) {
        renderer.render(scene, camera);
      }
    };
    onResize();

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let lastTime = performance.now();
    let dimCurrent = stateRef.current.dimmed ? 1 : 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const totalCards = cardEntries.length;

    const tick = () => {
      if (disposed) return;
      if (document.hidden || !inViewport) {
        lastTime = performance.now();
        frameId = requestAnimationFrame(tick);
        return;
      }
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const s = stateRef.current;

      if (
        s.interactive &&
        !s.dragging &&
        !prefersReduced &&
        now >= s.autoResumeAt &&
        Math.abs(s.inertiaVel) < 0.35
      ) {
        s.scrollTarget += 3.0 * dt;
      }

      if (!s.dragging && Math.abs(s.inertiaVel) > 0.02) {
        s.scrollTarget += s.inertiaVel * dt;
        s.inertiaVel *= Math.exp(-3.8 * dt);
      } else if (!s.dragging) {
        s.inertiaVel = 0;
      }

      const prevScroll = s.scrollCurrent;
      s.scrollCurrent = THREE.MathUtils.damp(s.scrollCurrent, s.scrollTarget, 6.8, dt);
      const instantVel = (s.scrollCurrent - prevScroll) / dt;
      s.velocity = THREE.MathUtils.damp(s.velocity, instantVel, 8.5, dt);

      dimCurrent = THREE.MathUtils.damp(dimCurrent, s.dimmed ? 1 : 0, 7, dt);

      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      const baseCamZ = computeBaseCamZ(w, h);
      const isSmall = w < 650;

      const baseCamY = 2.4;
      const targetCamX = s.interactive && !prefersReduced ? s.pointerX * 0.65 : 0;
      const targetCamY = baseCamY + (s.interactive && !prefersReduced ? s.pointerY * 0.35 : 0);
      const targetCamZ = baseCamZ + dimCurrent * 9.0;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 5, dt);
      camera.lookAt(camera.position.x * 0.25, baseCamY * 0.3, 0);

      // Compute Pixiatech world-space ribbon parameters from live frustum
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      const frustumH = Math.tan(fovRad / 2) * camera.position.z;
      const frustumW = frustumH * camera.aspect;
      const velTanh = Math.tanh(s.velocity / (isSmall ? 22 : 42));
      const sheetV = prefersReduced ? 0 : Math.min(1, Math.abs(velTanh * velTanh));
      const depthFactor = isSmall ? 0.16 : 0.20;
      const doorFactor = isSmall ? 0 : -0.12;
      const sheetParams: SheetEvalParams = {
        W: frustumW,
        D: frustumW * depthFactor * (1 + 1.1 * sheetV),
        T: isSmall ? 1.0 : 1.15,
        C: isSmall ? 0.0 : 1.0,
        P: prefersReduced ? 0.0 : 1.0,
        V: sheetV,
        leanA: frustumW * doorFactor,
        leanW: frustumW,
      };

      gridMat.uniforms.uScroll.value = s.scrollCurrent;
      gridMat.uniforms.uDim.value = dimCurrent;

      let hitIdx = -1;
      if (s.interactive && !s.dragging) {
        pointerVec.set(s.ndcX, s.ndcY);
        raycaster.setFromCamera(pointerVec, camera);
        const hits = raycaster.intersectObjects(cardMeshes, false);
        if (hits.length > 0) {
          hitIdx = cardMeshes.indexOf(
            hits[0].object as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
          );
        }
      }
      s.hoveredIndex = hitIdx;
      canvasEl.style.cursor = s.dragging ? 'grabbing' : hitIdx >= 0 ? 'pointer' : 'grab';

      for (let i = 0; i < totalCards; i++) {
        const entry = cardEntries[i];
        const { mesh, width, height, trackCenter } = entry;

        let worldX =
          (((trackCenter - s.scrollCurrent) % totalLoopWidth) + totalLoopWidth) %
          totalLoopWidth;
        if (worldX > totalLoopWidth * 0.5) worldX -= totalLoopWidth;

        const absX = Math.abs(worldX);

        mesh.position.set(worldX, 0, 0);
        mesh.rotation.set(0, 0, 0);

        entry.reflMesh.position.set(worldX, -13.35, 0);
        entry.reflMesh.rotation.set(0, 0, 0);

        const isHovered = hitIdx === i;
        entry.hoverValue = THREE.MathUtils.damp(entry.hoverValue, isHovered ? 1 : 0, 8, dt);

        const u = mesh.material.uniforms;
        u.uSheetW.value = sheetParams.W;
        u.uSheetD.value = sheetParams.D;
        u.uSheetT.value = sheetParams.T;
        u.uSheetC.value = sheetParams.C;
        u.uSheetP.value = sheetParams.P;
        u.uSheetV.value = sheetParams.V;
        u.uLeanA.value = sheetParams.leanA;
        u.uLeanW.value = sheetParams.leanW;
        u.uHover.value = entry.hoverValue;
        u.uDim.value = dimCurrent;

        const ru = entry.reflMesh.material.uniforms;
        ru.uSheetW.value = sheetParams.W;
        ru.uSheetD.value = sheetParams.D;
        ru.uSheetT.value = sheetParams.T;
        ru.uSheetC.value = sheetParams.C;
        ru.uSheetP.value = sheetParams.P;
        ru.uSheetV.value = sheetParams.V;
        ru.uLeanA.value = sheetParams.leanA;
        ru.uLeanW.value = sheetParams.leanW;
        ru.uDim.value = dimCurrent;

        mesh.visible = absX < frustumW * 2.2 + width;
        entry.reflMesh.visible = mesh.visible;

        // Project title and arrow along the exact same global ribbon field
        const labelEl = labelRefs.current[i];
        const arrowEl = arrowRefs.current[i];
        if (labelEl) {
          if (!mesh.visible || dimCurrent > 0.85 || !s.interactive) {
            labelEl.style.opacity = '0';
            labelEl.style.pointerEvents = 'none';
          } else {
            const leftWX = worldX - width * 0.455;
            const rightWX = worldX + width * 0.455;
            const bottomY = -height * 0.43;

            evalWorldPointJS(leftWX, bottomY, 0, sheetParams, _projLeft);
            evalWorldPointJS(rightWX, bottomY, 0, sheetParams, _projRight);

            _projLeft.project(camera);
            _projRight.project(camera);

            const lx = ((_projLeft.x + 1) / 2) * w;
            const ly = ((-_projLeft.y + 1) / 2) * h;
            const rx = ((_projRight.x + 1) / 2) * w;

            const clampedLeft = Math.max(12, lx);
            const clampedRight = Math.min(w - 12, rx);
            const visibleSpan = clampedRight - clampedLeft;

            if (visibleSpan < 110 || rx < 40 || lx > w - 40) {
              labelEl.style.opacity = '0';
              labelEl.style.pointerEvents = 'none';
            } else {
              const labelAlpha =
                THREE.MathUtils.clamp(1.0 - absX / (frustumW * 1.9), 0.42, 1.0) *
                (1.0 - dimCurrent);
              labelEl.style.opacity = labelAlpha.toFixed(3);
              labelEl.style.pointerEvents = 'auto';
              labelEl.style.width = `${visibleSpan.toFixed(1)}px`;
              labelEl.style.transform = `translate3d(${clampedLeft.toFixed(1)}px, ${(
                ly - 22
              ).toFixed(1)}px, 0)`;

              if (arrowEl) {
                arrowEl.style.opacity = visibleSpan > 155 ? '1' : '0';
                arrowEl.style.transform = isHovered ? 'scale(1.08)' : 'scale(1)';
              }
            }
          }
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      visibilityObserver?.disconnect();
      document.removeEventListener('visibilitychange', onDocumentVisibility);
      window.clearTimeout(fallbackTimer);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      canvasEl.removeEventListener('webglcontextlost', onContextLost);

      gridGeo.dispose();
      gridMat.dispose();
      for (const entry of cardEntries) {
        entry.mesh.geometry.dispose();
        entry.reflMesh.geometry.dispose();
        const tex = entry.mesh.material.uniforms.uMap.value as THREE.Texture | undefined;
        tex?.dispose();
        entry.mesh.material.dispose();
        entry.reflMesh.material.dispose();
      }
      renderer.dispose();
      if (canvasEl.parentNode === host) {
        host.removeChild(canvasEl);
      }
    };
  }, [projects, initialIndex]);

  if (webglFailed) {
    return (
      <div className="relative w-full h-[550px] z-10 flex items-center gap-6 overflow-x-auto bg-black px-8 py-12">
        {projects.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => callbacksRef.current.onSelectProject(p.slug)}
            className="group relative h-[46vh] shrink-0 overflow-hidden rounded-2xl border border-white/10"
            style={{ aspectRatio: String(p.aspect) }}
          >
            <img
              src={p.heroImage}
              alt={p.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-4 left-5 text-lg font-medium tracking-tight text-white">
              {p.title}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {projects.map((proj, idx) => (
          <button
            key={proj.slug}
            ref={(el) => {
              labelRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => {
              if (!stateRef.current.hasInteracted) {
                stateRef.current.hasInteracted = true;
                callbacksRef.current.onFirstInteract();
              }
              callbacksRef.current.onSelectProject(proj.slug);
            }}
            className="pointer-events-auto absolute left-0 top-0 flex cursor-pointer items-center justify-between gap-2 overflow-hidden text-left focus:outline-none"
            style={{ opacity: 0 }}
            aria-label={`Ouvrir ${proj.title} — Pixiatech`}
          >
            <span className="truncate text-[15px] sm:text-[18px] font-medium tracking-[-0.04em] text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.75)]">
              {proj.title}
            </span>
            <span
              ref={(el) => {
                arrowRefs.current[idx] = el;
              }}
              aria-hidden="true"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/90 text-white ring-1 ring-white/15 transition-all duration-300"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

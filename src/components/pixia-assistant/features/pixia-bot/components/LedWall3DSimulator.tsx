'use client';

import { Circle, HelpCircle, Moon, RotateCcw, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Language, ScreenShape } from '../../../core/types';

interface LedWall3DSimulatorProps {
  lang: Language;
  width: number;
  height: number;
  shape: ScreenShape;
  curveLeft?: number;
  curveRight?: number;
  onCurveLeftChange?: (value: number) => void;
  onCurveRightChange?: (value: number) => void;
  videoUrl?: string | null;
}

const DEFAULT_VIDEO_URL =
  'https://firebasestorage.googleapis.com/v0/b/studio-9205859220-a6440.firebasestorage.app/o/uploads%2F1765799832313_Devis%20Ecran.mp4?alt=media&token=99eec72d-0dab-4adb-bf36-061263381e09';

// Pre-allocated scratch math helpers (zero GC in render loop)
const _projVec = new THREE.Vector3();
const _hitVec = new THREE.Vector3();
const _mouseNdc = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });
}

function drawProceduralLedFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSec: number,
  screenLabel: string
) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#071324');
  grad.addColorStop(0.5, '#12122a');
  grad.addColorStop(1, '#091822');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Flowing cyan / violet / lime aurora waves
  const wave1X = w * (0.5 + 0.28 * Math.sin(timeSec * 0.7));
  const wave1Y = h * (0.45 + 0.2 * Math.cos(timeSec * 0.55));
  const g1 = ctx.createRadialGradient(wave1X, wave1Y, 10, wave1X, wave1Y, w * 0.55);
  g1.addColorStop(0, 'rgba(56, 189, 248, 0.72)');
  g1.addColorStop(0.45, 'rgba(168, 85, 247, 0.36)');
  g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  const wave2X = w * (0.5 - 0.3 * Math.cos(timeSec * 0.6));
  const wave2Y = h * (0.55 + 0.18 * Math.sin(timeSec * 0.8));
  const g2 = ctx.createRadialGradient(wave2X, wave2Y, 8, wave2X, wave2Y, w * 0.45);
  g2.addColorStop(0, 'rgba(198, 255, 0, 0.42)');
  g2.addColorStop(0.5, 'rgba(192, 132, 252, 0.25)');
  g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  // Subtle LED cabinet pixel scanlines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 32; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 32; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Crisp center brand mark
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 36px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.fillText('PIXIA TECH', w / 2, h / 2 - 12);
  ctx.font = '600 15px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(198, 255, 0, 0.9)';
  ctx.fillText(screenLabel, w / 2, h / 2 + 22);
  ctx.restore();
}

function buildHumanFigure(isDark: boolean): {
  group: THREE.Group;
  hitMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0xf8fafc : 0x0f172a,
    roughness: 0.35,
    metalness: isDark ? 0.35 : 0.15,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x94a3b8 : 0x334155,
    roughness: 0.45,
    metalness: 0.2,
  });
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: isDark ? 0.36 : 0.16,
    depthWrite: false,
  });

  // Head + neck
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 24), bodyMat);
  head.position.set(0, 1.74, 0);
  head.castShadow = true;
  group.add(head);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.05, 16), bodyMat);
  neck.position.set(0, 1.65, 0);
  neck.castShadow = true;
  group.add(neck);

  // Shoulders + torso
  const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 6, 14), bodyMat);
  shoulders.position.set(0, 1.56, 0);
  shoulders.rotation.z = Math.PI / 2;
  shoulders.castShadow = true;
  group.add(shoulders);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.56, 14), bodyMat);
  torso.position.set(0, 1.27, 0);
  torso.castShadow = true;
  group.add(torso);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.038, 0.48, 4, 10);
  const leftArm = new THREE.Mesh(armGeo, bodyMat);
  leftArm.position.set(-0.21, 1.32, 0.02);
  leftArm.rotation.set(0.08, 0, 0.1);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, bodyMat);
  rightArm.position.set(0.21, 1.32, 0.02);
  rightArm.rotation.set(0.08, 0, -0.1);
  rightArm.castShadow = true;
  group.add(rightArm);

  // Legs + shoes
  const legGeo = new THREE.CapsuleGeometry(0.062, 0.82, 4, 12);
  const leftLeg = new THREE.Mesh(legGeo, bodyMat);
  leftLeg.position.set(-0.085, 0.48, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, bodyMat);
  rightLeg.position.set(0.085, 0.48, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  const shoeGeo = new THREE.BoxGeometry(0.075, 0.05, 0.19);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(-0.085, 0.028, 0.055);
  leftShoe.castShadow = true;
  group.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0.085, 0.028, 0.055);
  rightShoe.castShadow = true;
  group.add(rightShoe);

  // Contact shadow
  const groundShadow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 28), shadowMat);
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.set(0, 0.008, 0);
  group.add(groundShadow);

  // Invisible simplified proxy box on layer 1 for effortless pointer raycasting/dragging
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 1.85, 0.45),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.set(0, 0.925, 0);
  hitMesh.layers.set(1);
  group.add(hitMesh);

  return { group, hitMesh };
}

function buildDimensionLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  colorHex: number
): THREE.Group {
  const grp = new THREE.Group();
  const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
  const lineMat = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.72,
  });
  grp.add(new THREE.Line(lineGeo, lineMat));

  const dotGeo = new THREE.SphereGeometry(0.028, 12, 12);
  const dotMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const d1 = new THREE.Mesh(dotGeo, dotMat);
  d1.position.copy(start);
  const d2 = new THREE.Mesh(dotGeo, dotMat);
  d2.position.copy(end);
  grp.add(d1, d2);

  return grp;
}

function MouseDiagram({
  highlight,
  isDark,
}: {
  highlight: 'left' | 'right' | 'wheel';
  isDark: boolean;
}) {
  const fillBase = isDark ? 'white' : 'black';
  const strokeInner = isDark ? 'black' : 'white';
  return (
    <svg width="16" height="24" viewBox="0 0 24 36" fill="none" className="shrink-0">
      <rect x="2" y="2" width="20" height="32" rx="10" fill={fillBase} stroke={fillBase} strokeWidth="1" />
      <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12V16H2V12Z" fill={fillBase} />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12V16H12V2Z"
        fill={highlight === 'left' ? '#3B82F6' : 'transparent'}
        stroke={highlight === 'left' ? '#3B82F6' : isDark ? '#ddd' : '#333'}
        strokeWidth="0.8"
      />
      <path
        d="M12 2C17.5228 2 22 6.47715 22 12V16H12V2Z"
        fill={highlight === 'right' ? '#A855F7' : 'transparent'}
        stroke={highlight === 'right' ? '#A855F7' : isDark ? '#ddd' : '#333'}
        strokeWidth="0.8"
      />
      <line x1="12" y1="2" x2="12" y2="16" stroke={strokeInner} strokeWidth="0.5" strokeOpacity="0.25" />
      <line x1="2" y1="16" x2="22" y2="16" stroke={strokeInner} strokeWidth="0.5" strokeOpacity="0.25" />
      <rect
        x="10"
        y="7"
        width="4"
        height="8"
        rx="2"
        fill={highlight === 'wheel' ? '#C6FF00' : isDark ? '#eee' : '#222'}
        stroke={highlight === 'wheel' ? '#C6FF00' : isDark ? '#ddd' : '#444'}
        strokeWidth="1"
      />
    </svg>
  );
}

export function LedWall3DSimulator({
  lang,
  width,
  height,
  shape,
  curveLeft = 20,
  curveRight = 20,
  onCurveLeftChange,
  onCurveRightChange,
  videoUrl,
}: LedWall3DSimulatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widthLabelRef = useRef<HTMLDivElement | null>(null);
  const heightLabelRef = useRef<HTMLDivElement | null>(null);
  const humanLabelRef = useRef<HTMLDivElement | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showControlsHelp, setShowControlsHelp] = useState(false);
  const [is360Interior, setIs360Interior] = useState(false);

  const safeW = Math.max(0.5, width);
  const safeH = Math.max(0.5, height);
  const safeCurveLeft = THREE.MathUtils.clamp(curveLeft, -30, 30);
  const safeCurveRight = THREE.MathUtils.clamp(curveRight, -30, 30);
  const diameter360 = Math.max(1, Math.round((safeW / Math.PI) * 100) / 100);

  const stateRef = useRef({
    width: safeW,
    height: safeH,
    shape,
    isDarkMode,
    curveLeft: safeCurveLeft,
    curveRight: safeCurveRight,
    is360Interior,
  });
  stateRef.current = {
    width: safeW,
    height: safeH,
    shape,
    isDarkMode,
    curveLeft: safeCurveLeft,
    curveRight: safeCurveRight,
    is360Interior,
  };

  // Mutable scene handles preserved across React prop updates
  const sceneHandlesRef = useRef<{
    rebuildGeometry: () => void;
    resetCamera: () => void;
    updateTheme: () => void;
  } | null>(null);

  // Initialize Three.js WebGL stage once inside dedicated empty mount div
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const initRect = mount.getBoundingClientRect();
    const initW = Math.max(240, initRect.width || 320);
    const initH = Math.max(180, initRect.height || 220);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(36, initW / initH, 0.1, 250);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 0.8;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 1.85;

    // Warm key + cool fill + rim lighting rig (matching app.pixiatech.com)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 45;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimPointLight = new THREE.PointLight(0xc6ff00, 1.2, 40, 1.5);
    rimPointLight.position.set(-10, 8, 12);
    scene.add(rimPointLight);

    // Floor grid & shadow receiver
    let gridHelper = new THREE.GridHelper(60, 60, 0x1e293b, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.ShadowMaterial({ transparent: true, opacity: 0.3 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Procedural animated CanvasTexture (immediate crisp visual, zero 404)
    const ledCanvas = document.createElement('canvas');
    ledCanvas.width = 512;
    ledCanvas.height = 320;
    const ledCtx = ledCanvas.getContext('2d');
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const canvasTexture = new THREE.CanvasTexture(ledCanvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTexture.anisotropy = maxAniso;

    // Try loading PixiaTech demo video texture cleanly with fallback to procedural LED canvas
    let activeTexture: THREE.Texture = canvasTexture;
    let videoReady = false;
    const videoEl = document.createElement('video');
    videoEl.crossOrigin = 'anonymous';
    videoEl.src = videoUrl || DEFAULT_VIDEO_URL;
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.autoplay = true;

    let videoTexture: THREE.VideoTexture | null = null;
    const onVideoPlayable = () => {
      if (videoReady) return;
      videoReady = true;
      videoTexture = new THREE.VideoTexture(videoEl);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.generateMipmaps = false;
      activeTexture = videoTexture;
      rebuildGeometry();
    };
    videoEl.addEventListener('playing', onVideoPlayable);
    videoEl.addEventListener('canplay', onVideoPlayable);
    void videoEl.play().catch(() => {
      // Keep crisp animated procedural LED canvas texture seamlessly
    });

    // Dynamic stage groups
    const wallGroup = new THREE.Group();
    const dimsGroup = new THREE.Group();
    scene.add(wallGroup);
    scene.add(dimsGroup);

    // Human scale figure (draggable on y = 0 ground plane)
    let humanObj = buildHumanFigure(stateRef.current.isDarkMode);
    scene.add(humanObj.group);
    let humanCustomMoved = false;

    // Anchor world points for floating 2D labels
    const labelAnchors = {
      widthPos: new THREE.Vector3(0, 3, 0),
      heightPos: new THREE.Vector3(-2.6, 1.25, 0),
      humanPos: new THREE.Vector3(2.8, 1.9, 0),
    };

    const projectToLabel = (
      worldPos: THREE.Vector3,
      el: HTMLDivElement | null,
      text: string
    ) => {
      if (!el) return;
      _projVec.copy(worldPos).project(camera);
      if (_projVec.z > 1) {
        el.style.opacity = '0';
        return;
      }
      const w = mount.clientWidth || initW;
      const h = mount.clientHeight || initH;
      const sx = ((_projVec.x + 1) / 2) * w;
      const sy = ((-_projVec.y + 1) / 2) * h;
      el.textContent = text;
      el.style.opacity = '1';
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
    };

    const syncLabels = () => {
      const s = stateRef.current;
      const diam = Math.max(1, Math.round((s.width / Math.PI) * 100) / 100);
      const widthText =
        s.shape === '360'
          ? `Ø ${diam.toFixed(2)} m`
          : `${s.width.toFixed(2)} m`;
      const heightText = `${s.height.toFixed(2)} m`;

      labelAnchors.humanPos.set(
        humanObj.group.position.x + 0.34,
        1.05,
        humanObj.group.position.z
      );

      projectToLabel(labelAnchors.widthPos, widthLabelRef.current, widthText);
      projectToLabel(labelAnchors.heightPos, heightLabelRef.current, heightText);
      projectToLabel(labelAnchors.humanPos, humanLabelRef.current, '1.83 m');
    };

    const updateTheme = () => {
      const dark = stateRef.current.isDarkMode;
      const bgHex = dark ? 0x0b0f19 : 0xf8fafc;
      const gridHex = dark ? 0x1e293b : 0xe2e8f0;
      scene.background = new THREE.Color(bgHex);
      scene.fog = new THREE.FogExp2(bgHex, 0.018);

      scene.remove(gridHelper);
      gridHelper.geometry.dispose();
      (gridHelper.material as THREE.Material).dispose();
      gridHelper = new THREE.GridHelper(60, 60, gridHex, gridHex);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);

      hemiLight.intensity = dark ? 0.85 : 1.35;
      keyLight.intensity = dark ? 1.25 : 1.65;
      rimPointLight.intensity = dark ? 1.45 : 0.7;
      floorMat.opacity = dark ? 0.35 : 0.08;

      const prevPos = humanObj.group.position.clone();
      scene.remove(humanObj.group);
      disposeObject3D(humanObj.group);
      humanObj = buildHumanFigure(dark);
      humanObj.group.position.copy(prevPos);
      scene.add(humanObj.group);

      rebuildDimensions();
    };

    let curvedEndpoints: { leftX: number; leftZ: number; rightX: number; rightZ: number } | null =
      null;

    const rebuildDimensions = () => {
      const s = stateRef.current;
      while (dimsGroup.children.length > 0) {
        const c = dimsGroup.children[0];
        dimsGroup.remove(c);
        disposeObject3D(c);
      }

      const lineColor = s.isDarkMode ? 0xe2e8f0 : 0x1e293b;

      if (s.shape === '360') {
        const radius = Math.max(0.5, s.width / (2 * Math.PI));
        const wStart = new THREE.Vector3(-radius, s.height + 0.42, 0);
        const wEnd = new THREE.Vector3(radius, s.height + 0.42, 0);
        dimsGroup.add(buildDimensionLine(wStart, wEnd, lineColor));
        labelAnchors.widthPos.set(0, s.height + 0.56, 0);

        const hStart = new THREE.Vector3(-radius - 0.36, 0, 0);
        const hEnd = new THREE.Vector3(-radius - 0.36, s.height, 0);
        dimsGroup.add(buildDimensionLine(hStart, hEnd, lineColor));
        labelAnchors.heightPos.set(-radius - 0.65, s.height / 2, 0);
      } else if (s.shape === 'curved' && curvedEndpoints) {
        const { leftX, leftZ, rightX, rightZ } = curvedEndpoints;
        const wStart = new THREE.Vector3(leftX, s.height + 0.4, leftZ);
        const wEnd = new THREE.Vector3(rightX, s.height + 0.4, rightZ);
        dimsGroup.add(buildDimensionLine(wStart, wEnd, lineColor));
        labelAnchors.widthPos.set((leftX + rightX) / 2, s.height + 0.54, (leftZ + rightZ) / 2);

        const hStart = new THREE.Vector3(leftX - 0.45, 0, leftZ);
        const hEnd = new THREE.Vector3(leftX - 0.45, s.height, leftZ);
        dimsGroup.add(buildDimensionLine(hStart, hEnd, lineColor));
        labelAnchors.heightPos.set(leftX - 0.78, s.height / 2, leftZ);
      } else {
        const halfW = s.width / 2;
        const wStart = new THREE.Vector3(-halfW, s.height + 0.4, 0);
        const wEnd = new THREE.Vector3(halfW, s.height + 0.4, 0);
        dimsGroup.add(buildDimensionLine(wStart, wEnd, lineColor));
        labelAnchors.widthPos.set(0, s.height + 0.54, 0);

        const hStart = new THREE.Vector3(-halfW - 0.5, 0, 0);
        const hEnd = new THREE.Vector3(-halfW - 0.5, s.height, 0);
        dimsGroup.add(buildDimensionLine(hStart, hEnd, lineColor));
        labelAnchors.heightPos.set(-halfW - 0.8, s.height / 2, 0);
      }

      // Human 1.83m vertical reference line inside human group
      const hLine = buildDimensionLine(
        new THREE.Vector3(0.28, 0, 0),
        new THREE.Vector3(0.28, 1.83, 0),
        lineColor
      );
      dimsGroup.add(hLine);
      hLine.position.copy(humanObj.group.position);
    };

    const rebuildGeometry = () => {
      const s = stateRef.current;
      while (wallGroup.children.length > 0) {
        const c = wallGroup.children[0];
        wallGroup.remove(c);
        disposeObject3D(c);
      }
      curvedEndpoints = null;

      const cabinetChassisMat = new THREE.MeshStandardMaterial({
        color: s.isDarkMode ? 0x111827 : 0x334155,
        roughness: 0.45,
        metalness: 0.78,
      });

      const metallicTrimMat = new THREE.MeshStandardMaterial({
        color: s.isDarkMode ? 0x94a3b8 : 0x64748b,
        roughness: 0.22,
        metalness: 0.88,
        side: THREE.DoubleSide,
      });

      const ledSurfaceMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: activeTexture,
        emissive: 0xffffff,
        emissiveMap: activeTexture,
        emissiveIntensity: s.isDarkMode ? 0.92 : 1.1,
        roughness: 0.25,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      if (s.shape === '360') {
        const radius = Math.max(0.5, s.width / (2 * Math.PI));
        const segments = Math.max(48, Math.round((Math.PI * 2 * radius) / 0.5) * 8);
        const ledRad = s.is360Interior ? radius - 0.01 : radius + 0.01;
        const backRad = s.is360Interior ? radius + 0.04 : radius - 0.04;

        const screenMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(ledRad, ledRad, s.height, segments, 1, true),
          ledSurfaceMat
        );
        screenMesh.position.set(0, s.height / 2, 0);
        screenMesh.castShadow = !isSoftwareGl;
        wallGroup.add(screenMesh);

        const chassisMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(backRad, backRad, s.height, segments, 1, true),
          new THREE.MeshStandardMaterial({
            color: 0x090d16,
            roughness: 0.55,
            metalness: 0.75,
            side: THREE.DoubleSide,
          })
        );
        chassisMesh.position.set(0, s.height / 2, 0);
        wallGroup.add(chassisMesh);

        const ringGeo = new THREE.TorusGeometry(radius, 0.032, 10, segments);
        const topRing = new THREE.Mesh(ringGeo, metallicTrimMat);
        topRing.rotation.x = Math.PI / 2;
        topRing.position.y = s.height;
        const botRing = new THREE.Mesh(ringGeo, cabinetChassisMat);
        botRing.rotation.x = Math.PI / 2;
        botRing.position.y = 0.02;
        wallGroup.add(topRing, botRing);

        const shadowDisk = new THREE.Mesh(
          new THREE.CircleGeometry(radius * 1.28, 36),
          new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: s.isDarkMode ? 0.42 : 0.14,
            depthWrite: false,
          })
        );
        shadowDisk.rotation.x = -Math.PI / 2;
        shadowDisk.position.y = 0.005;
        wallGroup.add(shadowDisk);

        if (!humanCustomMoved) {
          humanObj.group.position.set(
            s.is360Interior ? 0 : radius + 1.05,
            0,
            s.is360Interior ? 0 : 0.35
          );
        }
      } else if (s.shape === 'curved') {
        // C2-smooth continuous curved ribbon (zero blocky polygons, zero cabinet cuts)
        const SEGMENTS = 96;
        const ds = s.width / SEGMENTS;
        const leftRad = THREE.MathUtils.degToRad(s.curveLeft * 1.85);
        const rightRad = THREE.MathUtils.degToRad(s.curveRight * 1.85);

        const angleAt = (u: number) => {
          if (u <= 0.5) {
            const t = u * 2;
            return leftRad * 0.5 * (1 + Math.cos(Math.PI * t));
          }
          const t = (u - 0.5) * 2;
          return -rightRad * 0.5 * (1 - Math.cos(Math.PI * t));
        };

        const rawPts: Array<{ x: number; z: number; nx: number; nz: number }> = [];
        let accX = 0;
        let accZ = 0;
        for (let i = 0; i <= SEGMENTS; i += 1) {
          const u = i / SEGMENTS;
          const theta = angleAt(u);
          rawPts.push({ x: accX, z: accZ, nx: Math.sin(theta), nz: Math.cos(theta) });
          if (i < SEGMENTS) {
            const midAng = angleAt((i + 0.5) / SEGMENTS);
            accX += ds * Math.cos(midAng);
            accZ -= ds * Math.sin(midAng);
          }
        }

        const cx = rawPts.reduce((acc, p) => acc + p.x, 0) / rawPts.length;
        const cz = rawPts.reduce((acc, p) => acc + p.z, 0) / rawPts.length;
        const pts = rawPts.map((p) => ({
          x: p.x - cx,
          z: p.z - cz,
          nx: p.nx,
          nz: p.nz,
        }));

        curvedEndpoints = {
          leftX: pts[0].x,
          leftZ: pts[0].z,
          rightX: pts[SEGMENTS].x,
          rightZ: pts[SEGMENTS].z,
        };

        const halfThick = 0.036;
        const frontPos: number[] = [];
        const frontUv: number[] = [];
        const frontIdx: number[] = [];

        const backPos: number[] = [];
        const backIdx: number[] = [];

        const framePos: number[] = [];
        const frameIdx: number[] = [];

        for (let i = 0; i <= SEGMENTS; i += 1) {
          const u = i / SEGMENTS;
          const p = pts[i];
          const fx = p.x + p.nx * halfThick;
          const fz = p.z + p.nz * halfThick;
          const bx = p.x - p.nx * halfThick;
          const bz = p.z - p.nz * halfThick;

          frontPos.push(fx, 0, fz, fx, s.height, fz);
          frontUv.push(u, 0, u, 1);

          backPos.push(bx, 0, bz, bx, s.height, bz);
        }

        for (let i = 0; i < SEGMENTS; i += 1) {
          const b0 = i * 2;
          const t0 = b0 + 1;
          const b1 = b0 + 2;
          const t1 = b0 + 3;
          frontIdx.push(b0, b1, t0, t0, b1, t1);
          backIdx.push(b0, t0, b1, t0, t1, b1);
        }

        // Top & bottom continuous metallic edge strips
        for (let i = 0; i <= SEGMENTS; i += 1) {
          const p = pts[i];
          const fx = p.x + p.nx * (halfThick + 0.002);
          const fz = p.z + p.nz * (halfThick + 0.002);
          const bx = p.x - p.nx * (halfThick + 0.002);
          const bz = p.z - p.nz * (halfThick + 0.002);
          // Top strip vertices (0, 1) and bottom strip vertices (2, 3)
          framePos.push(fx, s.height + 0.004, fz, bx, s.height + 0.004, bz);
          framePos.push(fx, 0.002, fz, bx, 0.002, bz);
        }
        for (let i = 0; i < SEGMENTS; i += 1) {
          const f0 = i * 4;
          const f1 = (i + 1) * 4;
          // Top cap quad
          frameIdx.push(f0, f1, f0 + 1, f0 + 1, f1, f1 + 1);
          // Bottom cap quad
          frameIdx.push(f0 + 2, f0 + 3, f1 + 2, f0 + 3, f1 + 3, f1 + 2);
        }
        // Left & right vertical metallic side caps
        const appendSideCap = (pt: { x: number; z: number; nx: number; nz: number }, flip: boolean) => {
          const base = framePos.length / 3;
          const fx = pt.x + pt.nx * (halfThick + 0.002);
          const fz = pt.z + pt.nz * (halfThick + 0.002);
          const bx = pt.x - pt.nx * (halfThick + 0.002);
          const bz = pt.z - pt.nz * (halfThick + 0.002);
          framePos.push(fx, 0, fz, bx, 0, bz, fx, s.height + 0.004, fz, bx, s.height + 0.004, bz);
          if (flip) {
            frameIdx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
          } else {
            frameIdx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
          }
        };
        appendSideCap(pts[0], false);
        appendSideCap(pts[SEGMENTS], true);

        const frontGeo = new THREE.BufferGeometry();
        frontGeo.setAttribute('position', new THREE.Float32BufferAttribute(frontPos, 3));
        frontGeo.setAttribute('uv', new THREE.Float32BufferAttribute(frontUv, 2));
        frontGeo.setIndex(frontIdx);
        frontGeo.computeVertexNormals();

        const frontMesh = new THREE.Mesh(frontGeo, ledSurfaceMat);
        frontMesh.castShadow = !isSoftwareGl;
        wallGroup.add(frontMesh);

        const backGeo = new THREE.BufferGeometry();
        backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPos, 3));
        backGeo.setIndex(backIdx);
        backGeo.computeVertexNormals();

        const backMesh = new THREE.Mesh(backGeo, cabinetChassisMat);
        backMesh.castShadow = !isSoftwareGl;
        wallGroup.add(backMesh);

        const frameGeo = new THREE.BufferGeometry();
        frameGeo.setAttribute('position', new THREE.Float32BufferAttribute(framePos, 3));
        frameGeo.setIndex(frameIdx);
        frameGeo.computeVertexNormals();
        wallGroup.add(new THREE.Mesh(frameGeo, metallicTrimMat));

        // Subtle support feet following the curve endpoints
        const footGeo = new THREE.BoxGeometry(0.18, 0.04, 0.56);
        const pLeft = pts[Math.round(SEGMENTS * 0.18)];
        const pRight = pts[Math.round(SEGMENTS * 0.82)];
        const leftFoot = new THREE.Mesh(footGeo, cabinetChassisMat);
        leftFoot.position.set(pLeft.x, 0.02, pLeft.z);
        leftFoot.rotation.y = Math.atan2(pLeft.nx, pLeft.nz);
        const rightFoot = new THREE.Mesh(footGeo, cabinetChassisMat);
        rightFoot.position.set(pRight.x, 0.02, pRight.z);
        rightFoot.rotation.y = Math.atan2(pRight.nx, pRight.nz);
        wallGroup.add(leftFoot, rightFoot);

        if (!humanCustomMoved) {
          humanObj.group.position.set(pts[SEGMENTS].x + 0.95, 0, pts[SEGMENTS].z + 0.45);
        }
      } else {
        const cols = Math.max(1, Math.ceil(s.width / 0.5));
        const colW = s.width / cols;
        const rows = Math.max(1, Math.ceil(s.height / 0.5));
        const rowH = s.height / rows;
        const centerOffsetX = s.width / 2;

        for (let c = 0; c < cols; c += 1) {
          const x = c * colW + colW / 2 - centerOffsetX;
          const colGroup = new THREE.Group();
          colGroup.position.set(x, 0, 0);

          for (let r = 0; r < rows; r += 1) {
            const tilePlane = new THREE.PlaneGeometry(colW - 0.006, rowH - 0.006);
            const uv = tilePlane.attributes.uv;
            const uOff = (c * colW) / s.width;
            const vOff = (r * rowH) / s.height;
            const uScale = colW / s.width;
            const vScale = rowH / s.height;
            for (let i = 0; i < uv.count; i += 1) {
              uv.setXY(i, uv.getX(i) * uScale + uOff, uv.getY(i) * vScale + vOff);
            }

            const frontTile = new THREE.Mesh(tilePlane, ledSurfaceMat);
            frontTile.position.set(0, r * rowH + rowH / 2, 0.044);
            colGroup.add(frontTile);

            const chassisBox = new THREE.Mesh(
              new THREE.BoxGeometry(colW - 0.008, rowH - 0.008, 0.078),
              cabinetChassisMat
            );
            chassisBox.position.set(0, r * rowH + rowH / 2, 0);
            chassisBox.castShadow = !isSoftwareGl;
            colGroup.add(chassisBox);
          }
          wallGroup.add(colGroup);
        }

        const footGeo = new THREE.BoxGeometry(0.18, 0.04, 0.65);
        const leftFoot = new THREE.Mesh(footGeo, cabinetChassisMat);
        leftFoot.position.set(-s.width * 0.35, 0.02, -0.15);
        const rightFoot = new THREE.Mesh(footGeo, cabinetChassisMat);
        rightFoot.position.set(s.width * 0.35, 0.02, -0.15);
        wallGroup.add(leftFoot, rightFoot);

        if (!humanCustomMoved) {
          humanObj.group.position.set(s.width / 2 + 0.95, 0, 0.45);
        }
      }

      rebuildDimensions();
      syncLabels();
    };

    const resetCamera = () => {
      const s = stateRef.current;
      const radius360 = Math.max(0.5, s.width / (2 * Math.PI));
      const span =
        s.shape === '360'
          ? Math.max(radius360 * 2.2, s.height) * 2.15
          : Math.max(s.width, s.height) * 1.25;
      const targetY = s.height / 2;
      camera.position.set(-span * 0.52, Math.max(1.6, span * 0.38), Math.max(2.6, span * 1.15));
      controls.target.set(0, targetY, 0);
      controls.update();
      syncLabels();
    };

    sceneHandlesRef.current = {
      rebuildGeometry,
      resetCamera,
      updateTheme,
    };

    updateTheme();
    rebuildGeometry();
    resetCamera();

    // Dragging the 1.83m human figure on the ground plane
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let draggingHuman = false;
    let hoveringHuman = false;

    const updatePointerNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _mouseNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      updatePointerNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(_mouseNdc, camera);
      const hits = raycaster.intersectObject(humanObj.hitMesh, false);
      if (hits.length > 0) {
        e.stopPropagation();
        draggingHuman = true;
        controls.enabled = false;
        renderer.domElement.setPointerCapture(e.pointerId);
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointerNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(_mouseNdc, camera);

      if (draggingHuman) {
        if (raycaster.ray.intersectPlane(_groundPlane, _hitVec)) {
          humanObj.group.position.set(
            THREE.MathUtils.clamp(_hitVec.x, -16, 16),
            0,
            THREE.MathUtils.clamp(_hitVec.z, -16, 16)
          );
          humanCustomMoved = true;
          rebuildDimensions();
          syncLabels();
        }
        return;
      }

      const hits = raycaster.intersectObject(humanObj.hitMesh, false);
      const nowHover = hits.length > 0;
      if (nowHover !== hoveringHuman) {
        hoveringHuman = nowHover;
        renderer.domElement.style.cursor = nowHover ? 'grab' : 'default';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!draggingHuman) return;
      draggingHuman = false;
      controls.enabled = true;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
      renderer.domElement.style.cursor = hoveringHuman ? 'grab' : 'default';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

    const onControlsChange = () => {
      syncLabels();
    };
    controls.addEventListener('change', onControlsChange);

    // ResizeObserver for crisp responsive sizing
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(120, Math.round(entry.contentRect.width));
        const h = Math.max(120, Math.round(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        syncLabels();
      }
    });
    ro.observe(mount);

    // Continuous paced render loop (updates animated LED texture + OrbitControls damping)
    let disposed = false;
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      if (disposed) return;
      const elapsed = clock.getElapsedTime();

      if (!videoReady && ledCtx) {
        const s = stateRef.current;
        const badge =
          s.shape === '360'
            ? `360° • Ø ${(s.width / Math.PI).toFixed(1)}m × ${s.height}m`
            : `${s.width}m × ${s.height}m`;
        drawProceduralLedFrame(ledCtx, ledCanvas.width, ledCanvas.height, elapsed, badge);
        canvasTexture.needsUpdate = true;
      }

      controls.update();
      syncLabels();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      ro.disconnect();
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);

      videoEl.removeEventListener('playing', onVideoPlayable);
      videoEl.removeEventListener('canplay', onVideoPlayable);
      videoEl.pause();
      videoEl.src = '';
      videoEl.load();

      canvasTexture.dispose();
      videoTexture?.dispose();
      envTex.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      sceneHandlesRef.current = null;
    };
  }, [videoUrl]);

  // Sync geometry immediately on any dimension/curvature/shape change
  useEffect(() => {
    sceneHandlesRef.current?.rebuildGeometry();
  }, [safeW, safeH, shape, safeCurveLeft, safeCurveRight, is360Interior]);

  // Reframe camera cleanly only when switching main shape mode
  useEffect(() => {
    sceneHandlesRef.current?.resetCamera();
  }, [shape]);

  // Sync light/dark theme toggle
  useEffect(() => {
    sceneHandlesRef.current?.updateTheme();
  }, [isDarkMode]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className={`relative h-[225px] w-full overflow-hidden rounded-xl border transition-colors duration-300 select-none ${
        isDarkMode ? 'border-white/12 bg-[#0b0f19]' : 'border-slate-200 bg-[#f8fafc]'
      }`}
    >
      {/* Dedicated WebGL Mount Container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* 3D Projected Dimension Labels (Zero-re-render DOM refs) */}
      <div
        ref={widthLabelRef}
        className={`pointer-events-none absolute left-0 top-0 z-10 rounded-md border px-1.5 py-0.5 text-[9.5px] font-mono font-bold whitespace-nowrap shadow-md ${
          isDarkMode
            ? 'border-white/15 bg-[#090d16]/90 text-white'
            : 'border-slate-300 bg-white/95 text-slate-900'
        }`}
        style={{ opacity: 0 }}
      />
      <div
        ref={heightLabelRef}
        className={`pointer-events-none absolute left-0 top-0 z-10 rounded-md border px-1.5 py-0.5 text-[9.5px] font-mono font-bold whitespace-nowrap shadow-md ${
          isDarkMode
            ? 'border-white/15 bg-[#090d16]/90 text-white'
            : 'border-slate-300 bg-white/95 text-slate-900'
        }`}
        style={{ opacity: 0 }}
      />
      <div
        ref={humanLabelRef}
        className={`pointer-events-none absolute left-0 top-0 z-10 rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap shadow-md ${
          isDarkMode
            ? 'border-white/15 bg-[#090d16]/90 text-[#c6ff00]'
            : 'border-slate-300 bg-white/95 text-slate-800'
        }`}
        style={{ opacity: 0 }}
      />

      {/* Top-Left "SIMULATEUR 3D" HUD Badge */}
      <div className="pointer-events-none absolute left-2.5 top-2.5 z-20 flex flex-col gap-0.5">
        <span
          className={`text-[8.5px] font-black uppercase tracking-[0.26em] ${
            isDarkMode ? 'text-[#c6ff00]' : 'text-slate-600'
          }`}
        >
          {lang === 'fr' ? 'Simulateur 3D' : '3D Simulator'}
        </span>
        <span
          className={`h-0.5 w-10 rounded-full ${
            isDarkMode ? 'bg-[#c6ff00]/45' : 'bg-slate-300'
          }`}
        />
      </div>

      {/* Top-Right Controls: Dark/Light Studio + Reset View + Mouse Help */}
      <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => sceneHandlesRef.current?.resetCamera()}
          aria-label={lang === 'fr' ? 'Recentrer la vue 3D' : 'Reset 3D camera'}
          title={lang === 'fr' ? 'Recentrer' : 'Reset view'}
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
            isDarkMode
              ? 'border-white/15 bg-[#0f172a]/90 text-slate-300 hover:text-white'
              : 'border-slate-200 bg-white/95 text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsDarkMode((d) => !d)}
          aria-label={lang === 'fr' ? 'Mode jour / nuit' : 'Toggle studio lighting'}
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
            isDarkMode
              ? 'border-white/15 bg-[#0f172a]/90 text-[#38BDF8]'
              : 'border-slate-200 bg-white/95 text-amber-500'
          }`}
        >
          {isDarkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => setShowControlsHelp((v) => !v)}
          aria-label={lang === 'fr' ? 'Aide contrôles 3D' : '3D controls help'}
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
            showControlsHelp
              ? 'border-[#c6ff00] bg-[#c6ff00] text-black'
              : isDarkMode
                ? 'border-white/15 bg-[#0f172a]/90 text-slate-300 hover:text-white'
                : 'border-slate-200 bg-white/95 text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom Compact G/D Curvature Slider Pill inside 3D stage (saves vertical chat space) */}
      {shape === 'curved' && !showControlsHelp && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute bottom-2 inset-x-2.5 z-20 mx-auto flex max-w-[330px] items-center gap-2 rounded-full border px-3 py-1 shadow-lg ${
            isDarkMode
              ? 'border-white/15 bg-[#1E232D]/95 text-white'
              : 'border-slate-300 bg-white/95 text-slate-900'
          }`}
        >
          <div className="flex flex-1 items-center gap-1.5 min-w-0">
            <span className="text-[10.5px] font-bold shrink-0">
              {lang === 'fr' ? 'G' : 'L'}
            </span>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={safeCurveLeft}
              onChange={(e) => onCurveLeftChange?.(parseInt(e.target.value, 10))}
              aria-label={lang === 'fr' ? 'Inclinaison Gauche' : 'Left Incline'}
              className={`h-1 w-full min-w-0 accent-[#F59E0B] rounded-full cursor-pointer ${
                isDarkMode ? 'bg-white/20' : 'bg-slate-300'
              }`}
            />
            <span className="text-[10px] font-mono font-bold text-[#F59E0B] tabular-nums w-7 text-right shrink-0">
              {safeCurveLeft > 0 ? `+${safeCurveLeft}` : safeCurveLeft}°
            </span>
          </div>

          <span
            aria-hidden="true"
            className={`h-3.5 w-px shrink-0 ${isDarkMode ? 'bg-white/15' : 'bg-slate-300'}`}
          />

          <div className="flex flex-1 items-center gap-1.5 min-w-0">
            <span className="text-[10.5px] font-bold shrink-0">
              {lang === 'fr' ? 'D' : 'R'}
            </span>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={safeCurveRight}
              onChange={(e) => onCurveRightChange?.(parseInt(e.target.value, 10))}
              aria-label={lang === 'fr' ? 'Inclinaison Droite' : 'Right Incline'}
              className={`h-1 w-full min-w-0 accent-[#F59E0B] rounded-full cursor-pointer ${
                isDarkMode ? 'bg-white/20' : 'bg-slate-300'
              }`}
            />
            <span className="text-[10px] font-mono font-bold text-[#F59E0B] tabular-nums w-7 text-right shrink-0">
              {safeCurveRight > 0 ? `+${safeCurveRight}` : safeCurveRight}°
            </span>
          </div>
        </div>
      )}

      {shape === '360' && !showControlsHelp && (
        <div
          className={`absolute bottom-2 left-2.5 z-20 flex items-center gap-1 rounded-lg border p-0.5 text-[9.5px] font-semibold ${
            isDarkMode
              ? 'border-white/12 bg-[#090d16]/90 text-slate-200'
              : 'border-slate-200 bg-white/95 text-slate-700'
          }`}
        >
          <button
            type="button"
            onClick={() => setIs360Interior(false)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
              !is360Interior ? 'bg-[#38BDF8] text-[#090d16] font-bold' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Circle className="h-2.5 w-2.5" />
            {lang === 'fr' ? 'Extérieur' : 'Exterior'}
          </button>
          <button
            type="button"
            onClick={() => setIs360Interior(true)}
            className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
              is360Interior ? 'bg-[#38BDF8] text-[#090d16] font-bold' : 'opacity-70 hover:opacity-100'
            }`}
          >
            {lang === 'fr' ? 'Intérieur' : 'Interior'}
          </button>
        </div>
      )}

      {/* Compact Bottom Mouse Legend Bar when Help is toggled */}
      {showControlsHelp && (
        <div
          className={`absolute bottom-2 inset-x-2.5 z-20 flex items-center justify-around gap-2 rounded-xl border px-2.5 py-1.5 text-[9.5px] font-bold shadow-lg ${
            isDarkMode
              ? 'border-white/15 bg-[#090d16]/95 text-white'
              : 'border-slate-200 bg-white/95 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <MouseDiagram highlight="left" isDark={isDarkMode} />
            <span>{lang === 'fr' ? 'Pivoter' : 'Rotate'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MouseDiagram highlight="right" isDark={isDarkMode} />
            <span>{lang === 'fr' ? 'Déplacer' : 'Pan'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MouseDiagram highlight="wheel" isDark={isDarkMode} />
            <span>Zoom</span>
          </div>
        </div>
      )}

      {/* Subtle 360 diameter caption on bottom-right */}
      {shape === '360' && !showControlsHelp && (
        <div
          className={`pointer-events-none absolute bottom-2 right-2.5 z-20 rounded-md border px-1.5 py-0.5 text-[9.5px] font-mono ${
            isDarkMode
              ? 'border-white/12 bg-[#090d16]/85 text-[#93C5FD]'
              : 'border-slate-200 bg-white/90 text-slate-700'
          }`}
        >
          Ø {diameter360} m
        </div>
      )}
    </div>
  );
}

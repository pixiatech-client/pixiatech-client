import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ChevronDown, ChevronUp, Film, Layers, Maximize2, RotateCcw } from 'lucide-react';
import {
  ASSEMBLY_LAYERS,
  BACKGROUND_PHASES,
  CABINET_DIMENSIONS,
  computeWallMetrics,
  getHorizontalCenterOffset,
  HORIZONTAL_PANEL_COUNTS,
  INSTALLATION_MODES,
  type AssemblyLayerId,
  type BackgroundPhaseId,
  type CameraPresetId,
  type ChassisFinishId,
  type DisplayPatternId,
  type HorizontalPanelCount,
  type InstallationModeId,
  type PitchTierId,
} from '../data/panelSpecs';
import {
  BOTTOM_BEAM_H,
  buildCabinetAssembly,
  CAB_H,
  CAB_W,
  LEG_HEIGHT,
  SUSPENDED_CLEARANCE,
  WALL_CLEARANCE,
  type CabinetAssembly,
} from '../three/cabinetBuilder';
import {
  createContactShadowTexture,
  createPolishedConcreteMaps,
  createStudioFloorAlphaTexture,
  createStudioSoftboxTexture,
} from '../three/proceduralTextures';

interface PhotonicsCanvas3DProps {
  installationMode: InstallationModeId;
  onInstallationModeChange: (mode: InstallationModeId) => void;
  panelCount: HorizontalPanelCount;
  onPanelCountChange: (count: HorizontalPanelCount) => void;
  explodeFactor: number;
  onExplodeChange: (val: number) => void;
  finishId: ChassisFinishId;
  onFinishChange: (id: ChassisFinishId) => void;
  patternId: DisplayPatternId;
  onPatternChange: (id: DisplayPatternId) => void;
  pitchId: PitchTierId;
  activeLayer: AssemblyLayerId | null;
  onActiveLayerChange: (layer: AssemblyLayerId | null) => void;
  selectedModuleIdx: number | null;
  onSelectModule: (idx: number | null) => void;
  showWireframe: boolean;
  onToggleWireframe: () => void;
  showStand: boolean;
  onToggleStand: () => void;
  cameraPreset: CameraPresetId;
  onCameraPresetChange: (preset: CameraPresetId) => void;
  backgroundPhase: BackgroundPhaseId;
  onBackgroundPhaseChange: (phase: BackgroundPhaseId) => void;
}

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  perspective: { pos: [4.8, 0.9, 8.2], target: [0, -0.35, 0], label: '3/4' },
  front: { pos: [0, 0.0, 8.6], target: [0, -0.25, 0], label: 'Face' },
  profile: { pos: [7.6, 0.3, -2.0], target: [0, -0.25, 0], label: 'Profil' },
  rear: { pos: [4.2, 0.7, -7.8], target: [0, -0.25, 0], label: 'Dos' },
};

const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _camCurOffset = new THREE.Vector3();
const _camGoalOffset = new THREE.Vector3();
const _camCurSph = new THREE.Spherical();
const _camGoalSph = new THREE.Spherical();
const _pointer = new THREE.Vector2();
const _colorOn = new THREE.Color('#ffffff');
const _colorOff = new THREE.Color('#14171E');

const CONCRETE_BLUR_REFLECTOR_SHADER = {
  name: 'ConcreteBlurReflectorShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    tFloorAlpha: { value: null },
    uOpacity: { value: 0.44 },
    uBlurRadius: { value: 0.0014 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec2 vFloorUv;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vUv = textureMatrix * vec4( position, 1.0 );
      vFloorUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform sampler2D tFloorAlpha;
    uniform float uOpacity;
    uniform float uBlurRadius;
    varying vec4 vUv;
    varying vec2 vFloorUv;
    #include <logdepthbuf_pars_fragment>

    void main() {
      #include <logdepthbuf_fragment>

      vec2 projUv = vUv.xy / max(vUv.w, 0.0001);
      float radialDist = length(vFloorUv - vec2(0.5)) * 2.0;
      float r = uBlurRadius * (0.5 + radialDist * 1.1);

      vec4 sum = texture2D(tDiffuse, projUv) * 0.30;
      sum += texture2D(tDiffuse, projUv + vec2( r,  0.0)) * 0.10;
      sum += texture2D(tDiffuse, projUv + vec2(-r,  0.0)) * 0.10;
      sum += texture2D(tDiffuse, projUv + vec2( 0.0,  r)) * 0.10;
      sum += texture2D(tDiffuse, projUv + vec2( 0.0, -r)) * 0.10;
      sum += texture2D(tDiffuse, projUv + vec2( r * 0.7,  r * 0.7)) * 0.075;
      sum += texture2D(tDiffuse, projUv + vec2(-r * 0.7,  r * 0.7)) * 0.075;
      sum += texture2D(tDiffuse, projUv + vec2( r * 0.7, -r * 0.7)) * 0.075;
      sum += texture2D(tDiffuse, projUv + vec2(-r * 0.7, -r * 0.7)) * 0.075;

      float radialAlpha = texture2D(tFloorAlpha, vFloorUv).r;
      float distFade = pow(clamp(radialAlpha, 0.0, 1.0), 1.45);
      float reflAlpha = clamp(sum.a * uOpacity * distFade, 0.0, 0.58);

      gl_FragColor = vec4(sum.rgb * color, reflAlpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const PhotonicsCanvas3D: React.FC<PhotonicsCanvas3DProps> = ({
  installationMode,
  onInstallationModeChange,
  panelCount,
  onPanelCountChange,
  explodeFactor,
  onExplodeChange,
  finishId,
  patternId,
  onPatternChange,
  pitchId,
  activeLayer,
  onActiveLayerChange,
  selectedModuleIdx,
  onSelectModule,
  showWireframe,
  onToggleWireframe,
  showStand,
  onToggleStand,
  cameraPreset,
  onCameraPresetChange,
  backgroundPhase,
  onBackgroundPhaseChange,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);
  const customVideoUrlRef = useRef<string | null>(null);
  const [hasCustomVideo, setHasCustomVideo] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(true);
  const [mobileExtrasOpen, setMobileExtrasOpen] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [hoveredModuleIdx, setHoveredModuleIdx] = useState<number | null>(null);

  const stateRef = useRef({
    installationMode,
    panelCount,
    explodeFactor,
    finishId,
    patternId,
    pitchId,
    activeLayer,
    selectedModuleIdx,
    hoveredModuleIdx,
    showWireframe,
    showStand,
    cameraPreset,
    backgroundPhase,
    cameraTransitionActive: false,
  });

  stateRef.current.installationMode = installationMode;
  stateRef.current.panelCount = panelCount;
  stateRef.current.explodeFactor = explodeFactor;
  stateRef.current.finishId = finishId;
  stateRef.current.patternId = patternId;
  stateRef.current.pitchId = pitchId;
  stateRef.current.activeLayer = activeLayer;
  stateRef.current.selectedModuleIdx = selectedModuleIdx;
  stateRef.current.hoveredModuleIdx = hoveredModuleIdx;
  stateRef.current.showWireframe = showWireframe;
  stateRef.current.showStand = showStand;
  stateRef.current.cameraPreset = cameraPreset;
  stateRef.current.backgroundPhase = backgroundPhase;

  const callbacksRef = useRef({
    onSelectModule,
    onActiveLayerChange,
    setHoveredModuleIdx,
  });
  callbacksRef.current = {
    onSelectModule,
    onActiveLayerChange,
    setHoveredModuleIdx,
  };

  const sceneRefs = useRef<{
    assembly: CabinetAssembly | null;
    floorSpot: THREE.SpotLight | null;
    requestRender: (() => void) | null;
    triggerCameraPreset: ((preset: CameraPresetId) => void) | null;
  }>({
    assembly: null,
    floorSpot: null,
    requestRender: null,
    triggerCameraPreset: null,
  });

  const handleUploadCustomVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (customVideoUrlRef.current) {
      URL.revokeObjectURL(customVideoUrlRef.current);
      customVideoUrlRef.current = null;
    }
    if (customVideoRef.current) {
      customVideoRef.current.pause();
      customVideoRef.current.src = '';
    }

    const url = URL.createObjectURL(file);
    customVideoUrlRef.current = url;

    const vid = document.createElement('video');
    vid.src = url;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.onloadeddata = () => {
      vid.play().catch(() => {});
      sceneRefs.current.requestRender?.();
    };
    vid.load();
    customVideoRef.current = vid;
    setHasCustomVideo(true);
    onPatternChange('video');
  };

  useEffect(() => {
    return () => {
      if (customVideoRef.current) {
        customVideoRef.current.pause();
        customVideoRef.current.src = '';
        customVideoRef.current = null;
      }
      if (customVideoUrlRef.current) {
        URL.revokeObjectURL(customVideoUrlRef.current);
        customVideoUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = mount.clientWidth || 720;
    const height = mount.clientHeight || 620;
    const aspect = width / height;
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-label', 'Simulateur 3D interactif du caisson PIXIATECH');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;

    const envTex = createStudioSoftboxTexture(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(aspect < 1.28 ? 42 : 35, aspect, 0.35, 90);
    camera.position.set(...CAMERA_PRESETS.perspective.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.0;
    controls.maxDistance = 42.0;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(...CAMERA_PRESETS.perspective.target);

    const hemiLight = new THREE.HemisphereLight('#DCE8FF', '#141210', 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF6EA', 2.45);
    keyLight.position.set(4.5, 6.2, 6.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 32;
      const d = 8.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rearKeyLight = new THREE.DirectionalLight('#F8FAFC', 2.9);
    rearKeyLight.position.set(3.8, 3.6, -5.8);
    scene.add(rearKeyLight);

    const coolRim = new THREE.DirectionalLight('#93C5FD', 1.75);
    coolRim.position.set(-4.8, 2.4, -3.5);
    scene.add(coolRim);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight('#FFFFFF', 4.0, 6.5, 2.8);
      softbox.position.set(0, 5.2, 4.2);
      softbox.lookAt(0, 0, 0);
      scene.add(softbox);
    }

    const initialSpotColor = BACKGROUND_PHASES[stateRef.current.backgroundPhase].spotHex;
    const floorSpot = new THREE.SpotLight(initialSpotColor, 6.5, 28, Math.PI / 2.5, 0.96, 1.3);
    floorSpot.position.set(0, 5.8, 2.8);
    floorSpot.target.position.set(0, -2.31, 0.15);
    scene.add(floorSpot);
    scene.add(floorSpot.target);
    sceneRefs.current.floorSpot = floorSpot;

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const floorAlphaTex = createStudioFloorAlphaTexture();
    const concreteMaps = createPolishedConcreteMaps(maxAniso);
    const concreteFloorGeo = new THREE.CircleGeometry(16.0, 64);
    concreteFloorGeo.rotateX(-Math.PI / 2);
    const concreteFloorMat = new THREE.MeshStandardMaterial({
      color: '#111620',
      map: concreteMaps.map,
      roughness: 0.72,
      metalness: 0.08,
      transparent: true,
      alphaMap: floorAlphaTex,
      depthWrite: false,
      envMapIntensity: 0.12,
    });
    const concreteFloor = new THREE.Mesh(concreteFloorGeo, concreteFloorMat);
    concreteFloor.position.y = -2.319;
    concreteFloor.receiveShadow = !isSoftwareGl;
    scene.add(concreteFloor);

    const reflectorGeo = new THREE.CircleGeometry(16.0, 64);
    const concreteReflector = new Reflector(reflectorGeo, {
      textureWidth: isSoftwareGl ? 256 : 1024,
      textureHeight: isSoftwareGl ? 256 : 1024,
      clipBias: 0.002,
      color: 0xeaf0f8,
      multisample: isSoftwareGl ? 0 : 4,
      shader: CONCRETE_BLUR_REFLECTOR_SHADER,
    });
    concreteReflector.rotation.x = -Math.PI / 2;
    const reflectorMat = concreteReflector.material as THREE.ShaderMaterial;
    reflectorMat.transparent = true;
    reflectorMat.depthWrite = false;
    reflectorMat.uniforms['tFloorAlpha'].value = floorAlphaTex;
    reflectorMat.uniforms['uOpacity'].value = 0.44;
    reflectorMat.uniforms['uBlurRadius'].value = 0.0018;
    concreteReflector.position.y = -2.315;
    concreteReflector.renderOrder = 2;
    scene.add(concreteReflector);

    const shadowTex = createContactShadowTexture();
    const contactGeo = new THREE.PlaneGeometry(3.4, 1.8);
    contactGeo.rotateX(-Math.PI / 2);
    const contactMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.36,
    });
    const contactShadow = new THREE.Mesh(contactGeo, contactMat);
    contactShadow.position.y = -2.314;
    contactShadow.renderOrder = 1;
    scene.add(contactShadow);

    const baseReflectorBeforeRender = concreteReflector.onBeforeRender.bind(concreteReflector);
    concreteReflector.onBeforeRender = (ren, scn, cam, geo, mat, grp) => {
      concreteFloor.visible = false;
      contactShadow.visible = false;
      baseReflectorBeforeRender(ren, scn, cam, geo, mat, grp);
      concreteFloor.visible = true;
      contactShadow.visible = true;
    };

    const assembly = buildCabinetAssembly(
      maxAniso,
      stateRef.current.finishId,
      stateRef.current.patternId,
      stateRef.current.pitchId,
      stateRef.current.panelCount,
      () => requestRender(),
    );
    assembly.updateInstallationMode(
      stateRef.current.installationMode,
      stateRef.current.panelCount,
      stateRef.current.showStand,
    );
    scene.add(assembly.root);
    sceneRefs.current.assembly = assembly;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    controls.update();
    renderer.render(scene, camera);

    const getFloorClearance = (mode: InstallationModeId, standVisible: boolean): number => {
      if (mode === 'wall') return WALL_CLEARANCE;
      if (mode === 'suspended') return SUSPENDED_CLEARANCE;
      return standVisible ? LEG_HEIGHT : 0.04;
    };

    let currentWidth = width;
    let currentHeight = height;
    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();
    const startTime = lastTime;

    let currentExplode = stateRef.current.explodeFactor;
    let currentSurfaceBlend = stateRef.current.panelCount === 1 ? 0 : 1;
    let currentRootX = getHorizontalCenterOffset(stateRef.current.panelCount, CAB_W);
    const initClearance = getFloorClearance(
      stateRef.current.installationMode,
      stateRef.current.showStand,
    );
    let currentFloorWorldY = -CAB_H * 0.5 - BOTTOM_BEAM_H - initClearance;
    const currentModuleExtract = [0, 0, 0, 0];

    let idleTimerId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          cb();
        }
      };
      timerId = window.setTimeout(poll, 5);
    }

    let lastVideoRenderAt = 0;

    function requestRender(urgent = false) {
      if (disposed) return;
      if (urgent) {
        clearTimeout(idleTimerId);
        renderDirty = true;
        if (renderBusy) return;
      } else if (renderBusy) {
        renderDirty = true;
        return;
      }
      clearTimeout(idleTimerId);
      renderBusy = true;
      rafId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;

        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, isSoftwareGl ? 0.5 : 0.05);
        lastTime = now;

        const activeMode = stateRef.current.installationMode;
        const activeCount = stateRef.current.panelCount;
        const targetExplode = stateRef.current.explodeFactor;
        const targetSurface = activeCount === 1 ? 0 : 1;
        const targetRootX = getHorizontalCenterOffset(activeCount, CAB_W);
        const floorClearance = getFloorClearance(activeMode, stateRef.current.showStand);
        const targetFloorWorldY = -CAB_H * 0.5 - BOTTOM_BEAM_H - floorClearance;

        if (isSoftwareGl) {
          currentExplode = targetExplode;
          currentSurfaceBlend = targetSurface;
          currentRootX = targetRootX;
          currentFloorWorldY = targetFloorWorldY;
        } else {
          const lambda = 9;
          currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, lambda, dt);
          currentSurfaceBlend = THREE.MathUtils.damp(currentSurfaceBlend, targetSurface, lambda, dt);
          currentRootX = THREE.MathUtils.damp(currentRootX, targetRootX, lambda, dt);
          currentFloorWorldY = THREE.MathUtils.damp(currentFloorWorldY, targetFloorWorldY, lambda, dt);

          if (Math.abs(currentExplode - targetExplode) < 0.002) currentExplode = targetExplode;
          if (Math.abs(currentSurfaceBlend - targetSurface) < 0.002) {
            currentSurfaceBlend = targetSurface;
          }
          if (Math.abs(currentRootX - targetRootX) < 0.002) currentRootX = targetRootX;
          if (Math.abs(currentFloorWorldY - targetFloorWorldY) < 0.002) {
            currentFloorWorldY = targetFloorWorldY;
          }
        }

        assembly.root.position.set(currentRootX, 0, 0);

        assembly.mountLayer.visible =
          activeMode !== 'standing' || stateRef.current.showStand;
        assembly.mountLayer.position.z = -currentExplode * 0.72;
        assembly.chassisLayer.position.z = -currentExplode * 0.14;
        assembly.modulesLayer.position.z = currentExplode * 0.36;
        assembly.emittersLayer.position.z = currentExplode * 0.82;
        assembly.wireframeOverlayGroup.position.z = assembly.chassisLayer.position.z;

        const pcbVisible = currentExplode > 0.015;
        assembly.modulesLayer.traverse((child) => {
          if (child.name === 'internal-pcb') {
            child.visible = pcbVisible;
          }
        });

        const basePatternIntensity =
          stateRef.current.patternId === 'off'
            ? 0.24
            : stateRef.current.patternId === 'calibration'
              ? 0.98
              : 0.96;

        let anyModuleAnimating = false;
        assembly.modules.forEach((mod, idx) => {
          const targetExt =
            stateRef.current.selectedModuleIdx === idx && activeCount === 1 ? 1 : 0;
          if (isSoftwareGl) {
            currentModuleExtract[idx] = targetExt;
          } else {
            currentModuleExtract[idx] = THREE.MathUtils.damp(
              currentModuleExtract[idx],
              targetExt,
              9,
              dt,
            );
            if (Math.abs(currentModuleExtract[idx] - targetExt) < 0.002) {
              currentModuleExtract[idx] = targetExt;
            } else {
              anyModuleAnimating = true;
            }
          }

          const ext = currentModuleExtract[idx];
          const zSlide = ext * 0.52;

          mod.tileGroup.position.set(0, mod.centerY, -0.004 + zSlide);
          mod.emitterGroup.position.set(0, mod.centerY, 0.008 + zSlide);

          const contactFactor = THREE.MathUtils.clamp(1 - (ext - 0.05) / 0.12, 0, 1);

          mod.emitterMat.emissiveIntensity = contactFactor * basePatternIntensity;
          mod.emitterMat.color.copy(_colorOff).lerp(_colorOn, contactFactor);
        });

        const isSlotActive = (col: number): boolean => {
          if (col === 1) return activeCount >= 2;
          if (col === -1) return activeCount >= 3;
          if (col === 2) return activeCount === 4;
          return false;
        };

        assembly.surroundCabinets.forEach((sc) => {
          if (currentSurfaceBlend < 0.01 || !isSlotActive(sc.gridCol)) {
            sc.group.visible = false;
          } else {
            sc.group.visible = true;
            const spread = 1 + (1 - currentSurfaceBlend) * 0.38;
            const zOut = (1 - currentSurfaceBlend) * -0.45;
            sc.group.position.set(sc.targetPos.x * spread, 0, zOut);
            sc.group.rotation.y = 0;

            const hasLeftNeighbor =
              sc.gridCol === 1 || sc.gridCol === 2;
            sc.jumperGroup.visible = currentSurfaceBlend > 0.45 && hasLeftNeighbor;
            sc.topBridgeGroup.visible = currentSurfaceBlend > 0.45 && hasLeftNeighbor;
          }
        });

        // Update animated holographic video sequence (or uploaded .mp4 frame)
        const isVideoPlaying = stateRef.current.patternId === 'video';
        if (isVideoPlaying && (!isSoftwareGl || now - lastVideoRenderAt >= 260)) {
          lastVideoRenderAt = now;
          assembly.updateVideoFrame(
            (now - startTime) / 1000,
            activeCount,
            customVideoRef.current,
          );
        }

        // Position standing A-frame brackets directly on studio floor
        const floorLocalY = currentFloorWorldY;
        assembly.trussStands.forEach((stand) => {
          stand.group.position.set(stand.col * CAB_W, floorLocalY, 0);
          stand.group.rotation.y = 0;
        });

        const widthScale = activeCount === 1 ? 1 : activeCount === 2 ? 1.65 : activeCount === 3 ? 2.35 : 2.95;
        contactShadow.scale.set(widthScale, 1, 1);
        contactShadow.material.opacity = activeMode === 'suspended' ? 0.22 : 0.36;
        concreteFloor.position.y = currentFloorWorldY - 0.004;
        concreteReflector.position.y = currentFloorWorldY;
        contactShadow.position.y = currentFloorWorldY - 0.001;
        floorSpot.target.position.y = currentFloorWorldY + 0.02;

        let camNeedsMore = false;
        if (stateRef.current.cameraTransitionActive) {
          const preset = CAMERA_PRESETS[stateRef.current.cameraPreset];
          const distScale =
            activeCount === 1
              ? activeMode === 'suspended'
                ? 1.15
                : 1.0
              : activeCount === 2
                ? 1.48
                : activeCount === 3
                  ? 1.98
                  : 2.48;
          const heightScale =
            activeCount === 1 ? 1.0 : activeCount === 2 ? 1.12 : 1.25;
          const targetYOffset = activeMode === 'suspended' ? 0.14 : -0.25;

          _camGoalPos.set(
            preset.pos[0] * distScale,
            preset.pos[1] * heightScale + (activeMode === 'suspended' ? 0.32 : 0),
            preset.pos[2] * distScale,
          );
          _camGoalTarget.set(
            preset.target[0],
            activeCount === 1 && activeMode === 'standing' ? preset.target[1] : targetYOffset,
            preset.target[2],
          );

          if (isSoftwareGl) {
            camera.position.copy(_camGoalPos);
            controls.target.copy(_camGoalTarget);
            stateRef.current.cameraTransitionActive = false;
          } else {
            const alpha = 1 - Math.exp(-9.5 * dt);
            controls.target.lerp(_camGoalTarget, alpha);

            _camCurOffset.copy(camera.position).sub(controls.target);
            _camGoalOffset.copy(_camGoalPos).sub(_camGoalTarget);
            _camCurSph.setFromVector3(_camCurOffset);
            _camGoalSph.setFromVector3(_camGoalOffset);

            let dTheta = _camGoalSph.theta - _camCurSph.theta;
            while (dTheta > Math.PI) dTheta -= Math.PI * 2;
            while (dTheta < -Math.PI) dTheta += Math.PI * 2;

            _camCurSph.radius = THREE.MathUtils.lerp(_camCurSph.radius, _camGoalSph.radius, alpha);
            _camCurSph.phi = THREE.MathUtils.lerp(_camCurSph.phi, _camGoalSph.phi, alpha);
            _camCurSph.theta = _camCurSph.theta + dTheta * alpha;

            _camCurOffset.setFromSpherical(_camCurSph);
            camera.position.copy(controls.target).add(_camCurOffset);

            if (
              camera.position.distanceTo(_camGoalPos) < 0.03 &&
              controls.target.distanceTo(_camGoalTarget) < 0.02
            ) {
              camera.position.copy(_camGoalPos);
              controls.target.copy(_camGoalTarget);
              stateRef.current.cameraTransitionActive = false;
            } else {
              camNeedsMore = true;
            }
          }
        }

        const controlsMoved = controls.update();
        renderer.render(scene, camera);

        const nonVideoAnimating =
          Math.abs(currentExplode - targetExplode) > 0.002 ||
          Math.abs(currentSurfaceBlend - targetSurface) > 0.002 ||
          Math.abs(currentRootX - targetRootX) > 0.002 ||
          Math.abs(currentFloorWorldY - targetFloorWorldY) > 0.002 ||
          anyModuleAnimating ||
          camNeedsMore ||
          (controls.enableDamping && controlsMoved);

        const done = () => {
          renderBusy = false;
          if (renderDirty || nonVideoAnimating || isVideoPlaying) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done, renderDirty || nonVideoAnimating ? 25 : 420);
        } else {
          done();
        }
      });
    }

    sceneRefs.current.requestRender = () => requestRender(true);
    sceneRefs.current.triggerCameraPreset = () => {
      stateRef.current.cameraTransitionActive = true;
      requestRender(true);
    };

    const onControlsStart = () => {
      stateRef.current.cameraTransitionActive = false;
    };
    const onControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const hitTargets = assembly.modules.map((m) => m.hitProxy);
    let lastMoveCheck = 0;

    const updatePointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveCheck < 50) return;
      lastMoveCheck = now;

      updatePointer(ev);
      raycaster.setFromCamera(_pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      const idx = hits.length > 0 ? (hits[0].object.userData.moduleIndex as number) : null;

      if (idx !== stateRef.current.hoveredModuleIdx) {
        callbacksRef.current.setHoveredModuleIdx(idx);
        renderer.domElement.style.cursor = idx !== null ? 'pointer' : 'grab';
      }
    };

    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - pointerDownPos.x, ev.clientY - pointerDownPos.y);
      if (dist > 6) return;

      updatePointer(ev);
      raycaster.setFromCamera(_pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.moduleIndex as number;
        const nextIdx = stateRef.current.selectedModuleIdx === idx ? null : idx;
        callbacksRef.current.onSelectModule(nextIdx);
        callbacksRef.current.onActiveLayerChange(nextIdx !== null ? 'module' : null);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!mount || disposed) return;
      const w = mount.clientWidth || 720;
      const h = mount.clientHeight || 620;
      if (w === currentWidth && h === currentHeight) return;
      currentWidth = w;
      currentHeight = h;
      const asp = w / h;
      camera.aspect = asp;
      camera.fov = asp < 1.28 ? 42 : 35;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      controls.update();
      renderer.render(scene, camera);
      if (stateRef.current.cameraTransitionActive) {
        requestRender();
      }
    };
    window.addEventListener('resize', onResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(mount);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      assembly.dispose();
      concreteFloorGeo.dispose();
      concreteFloorMat.dispose();
      concreteMaps.map.dispose();
      concreteMaps.bumpMap.dispose();
      concreteMaps.roughnessMap.dispose();
      reflectorGeo.dispose();
      concreteReflector.dispose();
      floorAlphaTex.dispose();
      contactGeo.dispose();
      contactMat.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    sceneRefs.current.assembly?.updateFinish(finishId);
    sceneRefs.current.requestRender?.();
  }, [finishId]);

  useEffect(() => {
    sceneRefs.current.assembly?.updatePattern(patternId, pitchId, panelCount);
    sceneRefs.current.requestRender?.();
  }, [patternId, pitchId, panelCount]);

  useEffect(() => {
    sceneRefs.current.assembly?.updateInstallationMode(installationMode, panelCount, showStand);
    sceneRefs.current.requestRender?.();
  }, [installationMode, panelCount, showStand]);

  useEffect(() => {
    sceneRefs.current.assembly?.updateSelection(
      activeLayer,
      selectedModuleIdx,
      hoveredModuleIdx,
      showWireframe,
    );
    sceneRefs.current.requestRender?.();
  }, [activeLayer, selectedModuleIdx, hoveredModuleIdx, showWireframe]);

  useEffect(() => {
    sceneRefs.current.requestRender?.();
  }, [explodeFactor, selectedModuleIdx, panelCount, installationMode, showStand]);

  useEffect(() => {
    sceneRefs.current.triggerCameraPreset?.(cameraPreset);
  }, [cameraPreset, panelCount, installationMode]);

  useEffect(() => {
    if (sceneRefs.current.floorSpot) {
      sceneRefs.current.floorSpot.color.set(BACKGROUND_PHASES[backgroundPhase].spotHex);
      sceneRefs.current.requestRender?.();
    }
  }, [backgroundPhase]);

  const activeLayerObj = ASSEMBLY_LAYERS.find((l) => l.id === activeLayer);
  const modeSpec = INSTALLATION_MODES[installationMode];
  const metrics = computeWallMetrics(pitchId, panelCount, installationMode);

  return (
    <div
      id="atelier-3d"
      data-testid="photonics-3d-stage"
      data-install-mode={installationMode}
      data-panel-count={panelCount}
      data-pattern={patternId}
      data-explode={Math.round(explodeFactor * 100)}
      className={`relative h-full ${
        dockCollapsed
          ? 'min-h-[300px]'
          : mobileExtrasOpen
            ? 'min-h-[470px]'
            : 'min-h-[410px]'
      } sm:min-h-[380px] lg:min-h-[540px] w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-black/20`}
    >
      {/* Dedicated Empty WebGL Mount */}
      <div ref={canvasMountRef} className="absolute inset-0 h-full w-full" />

      {webglError && (
        <div className="glass-mirror absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center">
          <p className="font-display text-lg font-medium text-white">
            Simulateur 3D PIXIATECH
          </p>
          <p className="mt-2 max-w-md text-sm text-[#9CA3AF]">
            L’accélération WebGL n’est pas disponible sur ce navigateur.
          </p>
        </div>
      )}

      {/* Top Bar: Flat Readout + Background Colors 1, 2, 3 */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 z-10 flex items-start justify-between gap-2.5">
        <div className="glass-mirror-dock rounded-lg border border-white/[0.12] px-2.5 py-1.5 sm:px-3.5 sm:py-2">
          <p className="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#F59E0B]">
            {panelCount > 1
              ? `${modeSpec.label} · ${panelCount} panneaux (${metrics.totalWidthMm.toLocaleString('fr-FR')} × ${CABINET_DIMENSIONS.heightMm} mm)`
              : selectedModuleIdx !== null
                ? `Module M${selectedModuleIdx + 1} extrait · LED coupée`
                : `O-Raster Poster · ${modeSpec.label}`}
          </p>
          <p className="hidden sm:block mt-0.5 text-xs sm:text-sm font-medium text-[#F4F5F7]">
            {cameraPreset === 'rear'
              ? `Dos Plug-and-Play · ${modeSpec.mountSummary}`
              : selectedModuleIdx !== null
                ? `M${selectedModuleIdx + 1} déconnecté du bus (500 × 1000 mm · 0,50 kg)`
                : activeLayerObj
                  ? `${activeLayerObj.index}. ${activeLayerObj.name}`
                  : `${metrics.totalWidthMm.toLocaleString('fr-FR')} × ${modeSpec.totalHeightMm} × 55 mm · ${metrics.totalWeightKg} kg · > 92 %`}
          </p>
        </div>

        <div
          role="group"
          aria-label="Couleurs de l’arrière-plan"
          className="glass-mirror-dock pointer-events-auto flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] px-2 py-1.5"
        >
          {(Object.keys(BACKGROUND_PHASES) as BackgroundPhaseId[]).map((phaseKey, idx) => {
            const spec = BACKGROUND_PHASES[phaseKey];
            const isSelected = backgroundPhase === phaseKey;
            const numLabel = String(idx + 1);
            return (
              <button
                key={phaseKey}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Fond ${numLabel} : ${spec.subtitle}`}
                onClick={() => onBackgroundPhaseChange(phaseKey)}
                className={`flex h-6 w-6 items-center justify-center rounded-full font-mono-tech text-[11px] font-semibold transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? 'border border-white text-[#050608]'
                    : 'border border-white/25 text-white/90 hover:border-white/70'
                }`}
                style={{
                  backgroundColor: isSelected ? spec.swatchHex : 'rgba(255,255,255,0.06)',
                }}
              >
                {numLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2.5 sm:bottom-3.5 z-10 flex flex-col items-center px-2.5 sm:px-3">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          aria-expanded={!dockCollapsed}
          aria-label={dockCollapsed ? 'Afficher les contrôles 3D' : 'Masquer les contrôles 3D'}
          className="glass-mirror-dock pointer-events-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] px-3.5 py-1 text-xs font-medium text-[#E5E7EB] hover:border-white/30 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Afficher les contrôles 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Masquer les contrôles</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="glass-mirror-dock pointer-events-auto w-full rounded-xl border border-white/[0.12] p-2 sm:p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
              {/* 3 Exclusive Installation Methods: SUR PIED | MURAL | SUSPENDU */}
              <div
                className="flex items-center gap-0.5 rounded-lg bg-black/40 p-1 border border-white/[0.1]"
                role="group"
                aria-label="Méthode d’installation"
              >
                {(Object.keys(INSTALLATION_MODES) as InstallationModeId[]).map((modeKey) => {
                  const spec = INSTALLATION_MODES[modeKey];
                  const active = installationMode === modeKey;
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => onInstallationModeChange(modeKey)}
                      aria-pressed={active}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-[0.03em] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#F59E0B] text-[#050608]'
                          : 'text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {spec.label}
                    </button>
                  );
                })}
              </div>

              {/* Horizontal Assembly Count (Single Row Only: 1x1, 2x1, 3x1, 4x1) */}
              <div
                className="flex items-center gap-0.5 rounded-lg bg-black/40 p-1 border border-white/[0.1]"
                role="group"
                aria-label="Assemblage horizontal des panneaux"
              >
                {HORIZONTAL_PANEL_COUNTS.map((count) => {
                  const active = panelCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onPanelCountChange(count)}
                      aria-pressed={active}
                      aria-label={`${count} panneau${count > 1 ? 'x' : ''} en largeur (${count * 1000} mm)`}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white/20 text-white font-semibold'
                          : 'text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {count}×1
                    </button>
                  );
                })}
              </div>

              {/* Exploded Slider */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="explode-slider"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D1D5DB] whitespace-nowrap shrink-0"
                >
                  <Layers className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
                  <span>Éclaté</span>
                </label>
                <input
                  id="explode-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(explodeFactor * 100)}
                  onChange={(e) => onExplodeChange(Number(e.target.value) / 100)}
                  className="krona-slider w-16 sm:w-20"
                />
                <span className="font-mono-tech w-8 text-right text-xs text-[#9CA3AF]">
                  {Math.round(explodeFactor * 100)}%
                </span>
              </div>

              {/* Camera Presets */}
              <div className="flex items-center gap-0.5 rounded-lg bg-black/40 p-1 border border-white/[0.1]">
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => onCameraPresetChange(presetKey)}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraPreset === presetKey
                        ? 'bg-white/15 text-white'
                        : 'text-[#D1D5DB] hover:text-white'
                    }`}
                  >
                    {CAMERA_PRESETS[presetKey].label}
                  </button>
                ))}
              </div>

              {/* Mobile accordion toggle */}
              <div className="flex w-full sm:w-auto items-center justify-between gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileExtrasOpen((v) => !v)}
                  aria-expanded={mobileExtrasOpen}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-black/40 px-2.5 py-1 text-[11px] font-medium text-[#D1D5DB] hover:text-white cursor-pointer"
                >
                  <span>{mobileExtrasOpen ? 'Masquer options' : 'Plus d’options'}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-3 w-3 transition-transform duration-150 ${
                      mobileExtrasOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExplodeChange(0);
                    onPanelCountChange(1);
                    onCameraPresetChange('perspective');
                    onSelectModule(null);
                    onActiveLayerChange(null);
                  }}
                  aria-label="Réinitialiser la vue 3D"
                  className="rounded-lg border border-white/[0.12] bg-black/40 p-1.5 text-[#D1D5DB] hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div
                className={`${
                  mobileExtrasOpen ? 'flex' : 'hidden'
                } sm:flex flex-wrap items-center gap-1.5 sm:gap-2`}
              >
                <select
                  aria-label="Contenu de l’écran LED"
                  value={patternId}
                  onChange={(e) => onPatternChange(e.target.value as DisplayPatternId)}
                  className="rounded-lg border border-white/[0.12] bg-black/50 px-2 py-1.5 text-xs font-medium text-[#E5E7EB] focus:outline-none focus:ring-1 focus:ring-[#F59E0B] cursor-pointer"
                >
                  <option value="video" className="bg-[#0B0D12]">
                    {hasCustomVideo ? 'Vidéo importée' : 'Vidéo Holo'}
                  </option>
                  <option value="fluid" className="bg-[#0B0D12]">Reflets noirs</option>
                  <option value="off" className="bg-[#0B0D12]">Noir absolu</option>
                  <option value="ambient" className="bg-[#0B0D12]">Halo ambré</option>
                  <option value="calibration" className="bg-[#0B0D12]">Grille optique</option>
                </select>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleUploadCustomVideo}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  aria-label="Charger un fichier vidéo sur l’écran perforé"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-black/40 px-2 py-1.5 text-xs font-medium text-[#D1D5DB] hover:border-white/30 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Film className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />
                  <span>Vidéo .mp4</span>
                </button>

                {installationMode === 'standing' && (
                  <button
                    type="button"
                    onClick={onToggleStand}
                    aria-pressed={showStand}
                    aria-label="Afficher ou masquer les pieds sur roulettes"
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      showStand
                        ? 'border-[#F59E0B] bg-[#F59E0B]/20 text-[#FCD34D]'
                        : 'border-white/[0.12] bg-black/40 text-[#D1D5DB] hover:text-white'
                    }`}
                  >
                    <span>Pieds</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggleWireframe}
                  aria-pressed={showWireframe}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    showWireframe
                      ? 'border-[#F59E0B] bg-[#F59E0B]/20 text-[#FCD34D]'
                      : 'border-white/[0.12] bg-black/40 text-[#D1D5DB] hover:text-white'
                  }`}
                >
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  <span>Tracé CAO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExplodeChange(0);
                    onPanelCountChange(1);
                    onCameraPresetChange('perspective');
                    onSelectModule(null);
                    onActiveLayerChange(null);
                  }}
                  aria-label="Réinitialiser la vue 3D"
                  className="hidden sm:inline-flex rounded-lg border border-white/[0.12] bg-black/40 p-1.5 text-[#D1D5DB] hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

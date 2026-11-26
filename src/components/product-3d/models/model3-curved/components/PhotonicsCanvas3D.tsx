'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ChevronDown, ChevronUp, Layers, Maximize2, RotateCcw } from 'lucide-react';
import {
  ASSEMBLY_LAYERS,
  BACKGROUND_PHASES,
  CHASSIS_FINISHES,
  CURVATURE_LIMIT_DEG,
  CURVATURE_SURFACE_MULTIPLIER,
  CURVATURE_VISUAL_MULTIPLIER,
  evaluatePanelCurve,
  type AssemblyLayerId,
  type BackgroundPhaseId,
  type CameraPresetId,
  type ChassisFinishId,
  type DisplayPatternId,
  type PitchTierId,
  type WallMode,
} from '../data/panelSpecs';
import { buildCabinetAssembly, CAB_H, CAB_W, type CabinetAssembly } from '../three/cabinetBuilder';
import {
  createContactShadowTexture,
  createStudioFloorAlphaTexture,
  createStudioSoftboxTexture,
} from '../three/proceduralTextures';

interface PhotonicsCanvas3DProps {
  wallMode: WallMode;
  onWallModeChange: (mode: WallMode) => void;
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
  cameraPreset: CameraPresetId;
  onCameraPresetChange: (preset: CameraPresetId) => void;
  backgroundPhase: BackgroundPhaseId;
  onBackgroundPhaseChange: (phase: BackgroundPhaseId) => void;
  curveLeftDeg: number;
  onCurveLeftChange: (deg: number) => void;
  curveRightDeg: number;
  onCurveRightChange: (deg: number) => void;
}

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  perspective: { pos: [2.75, 0.85, 3.85], target: [0, 0, 0], label: '3/4' },
  front: { pos: [0, 0, 4.45], target: [0, 0, 0], label: 'Face' },
  profile: { pos: [4.35, 0.18, 0.42], target: [0, 0, 0], label: 'Profil' },
  rear: { pos: [2.25, 0.58, -3.75], target: [0, 0, -0.05], label: 'Dos' },
};

const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _pointer = new THREE.Vector2();
const _colorOn = new THREE.Color('#ffffff');
const _colorOff = new THREE.Color('#14171E');

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
  wallMode,
  onWallModeChange,
  explodeFactor,
  onExplodeChange,
  finishId,
  onFinishChange,
  patternId,
  onPatternChange,
  pitchId,
  activeLayer,
  onActiveLayerChange,
  selectedModuleIdx,
  onSelectModule,
  showWireframe,
  onToggleWireframe,
  cameraPreset,
  onCameraPresetChange,
  backgroundPhase,
  onBackgroundPhaseChange,
  curveLeftDeg,
  onCurveLeftChange,
  curveRightDeg,
  onCurveRightChange,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(true);
  const [mobileExtrasOpen, setMobileExtrasOpen] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [hoveredModuleIdx, setHoveredModuleIdx] = useState<number | null>(null);

  const stateRef = useRef({
    wallMode,
    explodeFactor,
    finishId,
    patternId,
    pitchId,
    activeLayer,
    selectedModuleIdx,
    hoveredModuleIdx,
    showWireframe,
    cameraPreset,
    backgroundPhase,
    curveLeftDeg,
    curveRightDeg,
    cameraTransitionActive: false,
  });

  stateRef.current.wallMode = wallMode;
  stateRef.current.explodeFactor = explodeFactor;
  stateRef.current.finishId = finishId;
  stateRef.current.patternId = patternId;
  stateRef.current.pitchId = pitchId;
  stateRef.current.activeLayer = activeLayer;
  stateRef.current.selectedModuleIdx = selectedModuleIdx;
  stateRef.current.hoveredModuleIdx = hoveredModuleIdx;
  stateRef.current.showWireframe = showWireframe;
  stateRef.current.cameraPreset = cameraPreset;
  stateRef.current.backgroundPhase = backgroundPhase;
  stateRef.current.curveLeftDeg = curveLeftDeg;
  stateRef.current.curveRightDeg = curveRightDeg;

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
    triggerCameraPreset: ((preset: CameraPresetId, mode: WallMode) => void) | null;
  }>({
    assembly: null,
    floorSpot: null,
    requestRender: null,
    triggerCameraPreset: null,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
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

    // Custom studio photography softbox environment map
    const envTex = createStudioSoftboxTexture(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(aspect < 1.28 ? 42 : 35, aspect, 0.1, 80);
    camera.position.set(...CAMERA_PRESETS.perspective.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.9;
    controls.maxDistance = 14.0;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, 0, 0);

    // Studio photography 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight('#DCE8FF', '#141210', 0.68);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF6EA', 2.4);
    keyLight.position.set(4.0, 5.2, 5.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 20;
      const d = 5.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Rear-right studio rim light to sculpt the PIXIATECH rear ribs, fins & corner brackets
    const rearKeyLight = new THREE.DirectionalLight('#F8FAFC', 2.85);
    rearKeyLight.position.set(3.8, 3.2, -5.2);
    scene.add(rearKeyLight);

    // Cool lateral rim light
    const coolRim = new THREE.DirectionalLight('#93C5FD', 1.65);
    coolRim.position.set(-4.8, 2.2, -3.5);
    scene.add(coolRim);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight('#FFFFFF', 4.0, 6.0, 2.2);
      softbox.position.set(0, 4.2, 3.8);
      softbox.lookAt(0, 0, 0);
      scene.add(softbox);
    }

    // Studio photography overhead pool light onto the floor synced with background phase
    const initialSpotColor = BACKGROUND_PHASES[stateRef.current.backgroundPhase].spotHex;
    const floorSpot = new THREE.SpotLight(initialSpotColor, 18, 15, Math.PI / 3.1, 0.88, 1.25);
    floorSpot.position.set(0, 3.6, 2.2);
    floorSpot.target.position.set(0, -1.16, 0.15);
    scene.add(floorSpot);
    scene.add(floorSpot.target);
    sceneRefs.current.floorSpot = floorSpot;

    // Seamless radial-faded obsidian studio floor (catches soft light without hard horizon edge)
    const floorAlphaTex = createStudioFloorAlphaTexture();
    const studioFloorGeo = new THREE.CircleGeometry(13.5, 56);
    studioFloorGeo.rotateX(-Math.PI / 2);
    const studioFloorMat = new THREE.MeshStandardMaterial({
      color: '#141820',
      roughness: 0.46,
      metalness: 0.24,
      transparent: true,
      alphaMap: floorAlphaTex,
      depthWrite: false,
    });
    const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
    studioFloor.position.y = -1.18;
    studioFloor.receiveShadow = !isSoftwareGl;
    scene.add(studioFloor);

    const shadowTex = createContactShadowTexture();
    const contactGeo = new THREE.PlaneGeometry(4.6, 2.0);
    contactGeo.rotateX(-Math.PI / 2);
    const contactMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.82,
    });
    const contactShadow = new THREE.Mesh(contactGeo, contactMat);
    contactShadow.position.y = -1.165;
    scene.add(contactShadow);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const assembly = buildCabinetAssembly(
      maxAniso,
      stateRef.current.finishId,
      stateRef.current.patternId,
      stateRef.current.pitchId,
      stateRef.current.wallMode,
      () => requestRender(),
    );
    scene.add(assembly.root);
    sceneRefs.current.assembly = assembly;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    controls.update();
    renderer.render(scene, camera);

    let currentWidth = width;
    let currentHeight = height;
    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    let currentExplode = stateRef.current.explodeFactor;
    let currentSurfaceBlend = stateRef.current.wallMode === 'surface' ? 1 : 0;
    let currentCurveL = stateRef.current.curveLeftDeg;
    let currentCurveR = stateRef.current.curveRightDeg;
    const initCurveScale = THREE.MathUtils.lerp(
      CURVATURE_VISUAL_MULTIPLIER,
      CURVATURE_SURFACE_MULTIPLIER,
      currentSurfaceBlend,
    );
    let renderedEffL = 0;
    let renderedEffR = 0;
    const currentModuleExtract = [0, 0, 0, 0];

    if (Math.abs(currentCurveL) > 0.01 || Math.abs(currentCurveR) > 0.01) {
      assembly.updateCurvature(currentCurveL, currentCurveR, initCurveScale);
      renderedEffL = currentCurveL * initCurveScale;
      renderedEffR = currentCurveR * initCurveScale;
    }

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
          timerId = window.setTimeout(cb, 80);
        }
      };
      timerId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      rafId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;

        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, isSoftwareGl ? 0.25 : 0.05);
        lastTime = now;

        const targetExplode = stateRef.current.explodeFactor;
        const targetSurface = stateRef.current.wallMode === 'surface' ? 1 : 0;
        const targetCurveL = stateRef.current.curveLeftDeg;
        const targetCurveR = stateRef.current.curveRightDeg;

        const lambda = isSoftwareGl ? 14 : 9;
        currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, lambda, dt);
        currentSurfaceBlend = THREE.MathUtils.damp(currentSurfaceBlend, targetSurface, lambda, dt);
        currentCurveL = THREE.MathUtils.damp(currentCurveL, targetCurveL, lambda, dt);
        currentCurveR = THREE.MathUtils.damp(currentCurveR, targetCurveR, lambda, dt);

        if (Math.abs(currentExplode - targetExplode) < 0.002) currentExplode = targetExplode;
        if (Math.abs(currentSurfaceBlend - targetSurface) < 0.002) currentSurfaceBlend = targetSurface;
        if (Math.abs(currentCurveL - targetCurveL) < 0.05) currentCurveL = targetCurveL;
        if (Math.abs(currentCurveR - targetCurveR) < 0.05) currentCurveR = targetCurveR;

        const curveScale = THREE.MathUtils.lerp(
          CURVATURE_VISUAL_MULTIPLIER,
          CURVATURE_SURFACE_MULTIPLIER,
          currentSurfaceBlend,
        );
        const effCurveL = currentCurveL * curveScale;
        const effCurveR = currentCurveR * curveScale;

        if (
          Math.abs(effCurveL - renderedEffL) > 0.01 ||
          Math.abs(effCurveR - renderedEffR) > 0.01
        ) {
          assembly.updateCurvature(currentCurveL, currentCurveR, curveScale);
          renderedEffL = effCurveL;
          renderedEffR = effCurveR;
        }

        assembly.mountLayer.visible =
          currentExplode > 0.02 || stateRef.current.activeLayer === 'mount';
        assembly.mountLayer.position.z = -currentExplode * 0.72;
        assembly.chassisLayer.position.z = -currentExplode * 0.14;
        assembly.modulesLayer.position.z = currentExplode * 0.36;
        assembly.emittersLayer.position.z = currentExplode * 0.82;
        assembly.wireframeOverlayGroup.position.z = assembly.chassisLayer.position.z;

        // Per-module magnetic extraction + automatic LED power cut upon pogo-pin disconnect
        const basePatternIntensity =
          stateRef.current.patternId === 'off'
            ? 0.0
            : stateRef.current.patternId === 'calibration'
              ? 0.88
              : 0.82;

        let anyModuleAnimating = false;
        assembly.modules.forEach((mod, idx) => {
          const targetExt =
            stateRef.current.selectedModuleIdx === idx && stateRef.current.wallMode === 'object'
              ? 1
              : 0;
          currentModuleExtract[idx] = THREE.MathUtils.damp(
            currentModuleExtract[idx],
            targetExt,
            lambda,
            dt,
          );
          if (Math.abs(currentModuleExtract[idx] - targetExt) < 0.002) {
            currentModuleExtract[idx] = targetExt;
          } else {
            anyModuleAnimating = true;
          }

          const ext = currentModuleExtract[idx];
          const zOffset = ext * 0.78;
          const modCurve = evaluatePanelCurve(
            mod.centerX,
            0.044,
            CAB_W / 2,
            currentCurveL,
            currentCurveR,
            curveScale,
          );
          const xSlide = Math.sin(modCurve.angleY) * zOffset;
          const zSlide = Math.cos(modCurve.angleY) * zOffset;

          mod.tileGroup.position.set(xSlide, mod.centerY, 0.022 + zSlide);
          mod.emitterGroup.position.set(xSlide, mod.centerY, 0.044 + zSlide);

          // Pogo-pin contact breaks immediately at ~6% extraction -> LED shuts off
          const contactFactor = THREE.MathUtils.clamp(1 - (ext - 0.05) / 0.12, 0, 1);
          const powerLevel = stateRef.current.patternId === 'off' ? 0 : contactFactor;

          mod.emitterMat.emissiveIntensity = powerLevel * basePatternIntensity;
          mod.emitterMat.color.copy(_colorOff).lerp(_colorOn, powerLevel);
        });

        assembly.root.position.y = -currentSurfaceBlend * (CAB_H * 0.5);
        const leftEdge = evaluatePanelCurve(
          -CAB_W / 2,
          0,
          CAB_W / 2,
          currentCurveL,
          currentCurveR,
          curveScale,
        );
        const rightEdge = evaluatePanelCurve(
          CAB_W / 2,
          0,
          CAB_W / 2,
          currentCurveL,
          currentCurveR,
          curveScale,
        );

        assembly.surroundCabinets.forEach((sc) => {
          if (currentSurfaceBlend < 0.01) {
            sc.group.visible = false;
          } else {
            sc.group.visible = true;
            const spread = 1 + (1 - currentSurfaceBlend) * 0.45;
            if (sc.gridCol === 0) {
              const halfW = CAB_W / 2;
              const hingeX = leftEdge.x - Math.cos(leftEdge.angleY) * halfW;
              const hingeZ = leftEdge.z + Math.sin(leftEdge.angleY) * halfW;
              sc.group.position.set(
                hingeX * spread,
                sc.targetPos.y * spread,
                hingeZ + (1 - currentSurfaceBlend) * -0.5,
              );
              sc.group.rotation.y = leftEdge.angleY * currentSurfaceBlend;
            } else if (sc.gridCol === 2) {
              const halfW = CAB_W / 2;
              const hingeX = rightEdge.x + Math.cos(rightEdge.angleY) * halfW;
              const hingeZ = rightEdge.z - Math.sin(rightEdge.angleY) * halfW;
              sc.group.position.set(
                hingeX * spread,
                sc.targetPos.y * spread,
                hingeZ + (1 - currentSurfaceBlend) * -0.5,
              );
              sc.group.rotation.y = rightEdge.angleY * currentSurfaceBlend;
            } else {
              sc.group.position.set(
                sc.targetPos.x * spread,
                sc.targetPos.y * spread,
                (1 - currentSurfaceBlend) * -0.5,
              );
              sc.group.rotation.y = 0;
            }
          }
        });

        contactShadow.scale.set(1 + currentSurfaceBlend * 1.4, 1, 1);
        studioFloor.position.y = -1.18 - currentSurfaceBlend * (CAB_H * 0.5);
        contactShadow.position.y = -1.165 - currentSurfaceBlend * (CAB_H * 0.5);

        let camNeedsMore = false;
        if (stateRef.current.cameraTransitionActive) {
          const preset = CAMERA_PRESETS[stateRef.current.cameraPreset];
          const isSurface = stateRef.current.wallMode === 'surface';
          const distScale = isSurface ? 2.25 : 1.0;
          _camGoalPos.set(
            preset.pos[0] * distScale,
            preset.pos[1] * (isSurface ? 1.25 : 1.0),
            preset.pos[2] * distScale,
          );
          _camGoalTarget.set(
            preset.target[0],
            isSurface ? -0.15 : preset.target[1],
            preset.target[2],
          );

          camera.position.lerp(_camGoalPos, 1 - Math.exp(-8 * dt));
          controls.target.lerp(_camGoalTarget, 1 - Math.exp(-8 * dt));

          if (
            camera.position.distanceTo(_camGoalPos) < 0.015 &&
            controls.target.distanceTo(_camGoalTarget) < 0.015
          ) {
            camera.position.copy(_camGoalPos);
            controls.target.copy(_camGoalTarget);
            stateRef.current.cameraTransitionActive = false;
          } else {
            camNeedsMore = true;
          }
        }

        const controlsMoved = controls.update();
        renderer.render(scene, camera);

        const stillAnimating =
          Math.abs(currentExplode - targetExplode) > 0.002 ||
          Math.abs(currentSurfaceBlend - targetSurface) > 0.002 ||
          Math.abs(currentCurveL - targetCurveL) > 0.05 ||
          Math.abs(currentCurveR - targetCurveR) > 0.05 ||
          anyModuleAnimating ||
          camNeedsMore ||
          (controls.enableDamping && controlsMoved);

        const done = () => {
          renderBusy = false;
          if (renderDirty || stillAnimating) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    sceneRefs.current.requestRender = requestRender;
    sceneRefs.current.triggerCameraPreset = (_preset, _mode) => {
      stateRef.current.cameraTransitionActive = true;
      requestRender();
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
      studioFloorGeo.dispose();
      studioFloorMat.dispose();
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
    sceneRefs.current.assembly?.updatePattern(patternId, pitchId, wallMode);
    sceneRefs.current.requestRender?.();
  }, [patternId, pitchId, wallMode]);

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
  }, [explodeFactor, selectedModuleIdx, curveLeftDeg, curveRightDeg]);

  useEffect(() => {
    sceneRefs.current.triggerCameraPreset?.(cameraPreset, wallMode);
  }, [cameraPreset, wallMode]);

  useEffect(() => {
    if (sceneRefs.current.floorSpot) {
      sceneRefs.current.floorSpot.color.set(BACKGROUND_PHASES[backgroundPhase].spotHex);
      sceneRefs.current.requestRender?.();
    }
  }, [backgroundPhase]);

  const activeLayerObj = ASSEMBLY_LAYERS.find((l) => l.id === activeLayer);
  const formatDeg = (deg: number) => (deg > 0 ? `+${deg}°` : `${deg}°`);
  const hasCurve = curveLeftDeg !== 0 || curveRightDeg !== 0;

  return (
    <div
      id="atelier-3d"
      data-testid="photonics-3d-stage"
      data-wall-mode={wallMode}
      data-explode={Math.round(explodeFactor * 100)}
      data-curve-left={curveLeftDeg}
      data-curve-right={curveRightDeg}
      className={`relative h-full ${
        dockCollapsed
          ? 'min-h-[300px]'
          : mobileExtrasOpen
            ? 'min-h-[470px]'
            : 'min-h-[410px]'
      } sm:min-h-[380px] lg:min-h-[580px] w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-black/20`}
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

      {/* Top Bar: Flat Readout + Flat Circles 1, 2, 3 for Background Colors */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 z-10 flex items-start justify-between gap-2.5">
        <div className="glass-mirror-dock rounded-lg border border-white/[0.12] px-2.5 py-1.5 sm:px-3.5 sm:py-2">
          <p className="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#F59E0B]">
            {wallMode === 'surface'
              ? 'Paroi déployée · 3 × 2'
              : selectedModuleIdx !== null
                ? `Module M${selectedModuleIdx + 1} extrait · LED coupée`
                : hasCurve
                  ? `Courbure flexible · G ${formatDeg(curveLeftDeg)} / D ${formatDeg(curveRightDeg)}`
                  : 'Dalle intégrale · Active'}
          </p>
          <p className="hidden sm:block mt-0.5 text-xs sm:text-sm font-medium text-[#F4F5F7]">
            {cameraPreset === 'rear'
              ? 'Dos usiné monobloc · Moyeu PIXIATECH'
              : selectedModuleIdx !== null
                ? `M${selectedModuleIdx + 1} déconnecté du bus (300 × 168,8 mm)`
                : activeLayerObj
                  ? `${activeLayerObj.index}. ${activeLayerObj.name} (${activeLayerObj.thicknessMm})`
                  : 'Châssis 600 × 337,5 × 29,7 mm'}
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

      {/* Collapsible Flat Transparent Bottom Control Dock (Hidden by default until clicked) */}
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
              {/* Object vs Surface Mode */}
              <div className="flex items-center gap-1 rounded-lg bg-black/30 p-1 border border-white/[0.1]">
                <button
                  type="button"
                  onClick={() => onWallModeChange('object')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    wallMode === 'object'
                      ? 'bg-[#F59E0B] text-[#050608] font-semibold'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  Objet (1×1)
                </button>
                <button
                  type="button"
                  onClick={() => onWallModeChange('surface')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    wallMode === 'surface'
                      ? 'bg-[#F59E0B] text-[#050608] font-semibold'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  Paroi (3×2)
                </button>
              </div>

              {/* Exploded Slider */}
              <div className="flex items-center gap-2.5">
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
                  className="krona-slider w-20 sm:w-24"
                />
                <span className="font-mono-tech w-8 text-right text-xs text-[#9CA3AF]">
                  {Math.round(explodeFactor * 100)}%
                </span>
              </div>

              {/* Camera Presets including Rear ("Dos") */}
              <div className="flex items-center gap-1 rounded-lg bg-black/30 p-1 border border-white/[0.1]">
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => onCameraPresetChange(presetKey)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraPreset === presetKey
                        ? 'bg-white/15 text-white'
                        : 'text-[#D1D5DB] hover:text-white'
                    }`}
                  >
                    {CAMERA_PRESETS[presetKey].label}
                  </button>
                ))}
              </div>

              {/* Secondary Options: Accordion on mobile (< sm), always visible on sm+ */}
              <div className="flex w-full sm:w-auto items-center justify-between gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileExtrasOpen((v) => !v)}
                  aria-expanded={mobileExtrasOpen}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-black/30 px-2.5 py-1 text-[11px] font-medium text-[#D1D5DB] hover:text-white cursor-pointer"
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
                    onWallModeChange('object');
                    onCameraPresetChange('perspective');
                    onSelectModule(null);
                    onActiveLayerChange(null);
                    onCurveLeftChange(0);
                    onCurveRightChange(0);
                  }}
                  aria-label="Réinitialiser la vue 3D"
                  className="rounded-lg border border-white/[0.12] bg-black/30 p-1.5 text-[#D1D5DB] hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div
                className={`${
                  mobileExtrasOpen ? 'flex' : 'hidden'
                } sm:flex flex-wrap items-center gap-1.5 sm:gap-2`}
              >
                <div
                  className="flex items-center gap-1.5 rounded-lg bg-black/30 px-2 py-1 border border-white/[0.1]"
                  role="group"
                  aria-label="Finition du châssis"
                >
                  {(Object.keys(CHASSIS_FINISHES) as ChassisFinishId[]).map((fKey) => {
                    const spec = CHASSIS_FINISHES[fKey];
                    const active = finishId === fKey;
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => onFinishChange(fKey)}
                        aria-label={`Finition ${spec.label}`}
                        className={`h-4 w-4 rounded-full border transition-transform duration-150 cursor-pointer ${
                          active
                            ? 'scale-115 border-[#F59E0B] ring-1 ring-[#F59E0B]'
                            : 'border-white/30 hover:scale-105'
                        }`}
                        style={{ backgroundColor: spec.trimHex }}
                      />
                    );
                  })}
                </div>

                <select
                  aria-label="Motif lumineux de la dalle"
                  value={patternId}
                  onChange={(e) => onPatternChange(e.target.value as DisplayPatternId)}
                  className="rounded-lg border border-white/[0.12] bg-black/35 px-2 py-1.5 text-xs font-medium text-[#E5E7EB] focus:outline-none focus:ring-1 focus:ring-[#F59E0B] cursor-pointer"
                >
                  <option value="fluid" className="bg-[#0B0D12]">Ondes fluides</option>
                  <option value="ambient" className="bg-[#0B0D12]">Signal ambiant</option>
                  <option value="calibration" className="bg-[#0B0D12]">Grille optique</option>
                  <option value="off" className="bg-[#0B0D12]">Noir absolu</option>
                </select>

                <button
                  type="button"
                  onClick={onToggleWireframe}
                  aria-pressed={showWireframe}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    showWireframe
                      ? 'border-[#F59E0B] bg-[#F59E0B]/20 text-[#FCD34D]'
                      : 'border-white/[0.12] bg-black/30 text-[#D1D5DB] hover:text-white'
                  }`}
                >
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  <span>Tracé CAO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExplodeChange(0);
                    onWallModeChange('object');
                    onCameraPresetChange('perspective');
                    onSelectModule(null);
                    onActiveLayerChange(null);
                    onCurveLeftChange(0);
                    onCurveRightChange(0);
                  }}
                  aria-label="Réinitialiser la vue 3D"
                  className="hidden sm:inline-flex rounded-lg border border-white/[0.12] bg-black/30 p-1.5 text-[#D1D5DB] hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Left & Right Flexible Curvature Controls (-30° .. +30°) placed in bottom-right dock slot */}
              <div
                className="flex w-full sm:w-auto sm:ml-auto items-center justify-between sm:justify-start gap-2 rounded-lg border border-white/[0.1] bg-black/30 px-2 py-1.5"
                role="group"
                aria-label="Courbure flexible gauche et droite (-30° à +30°)"
              >
                <div className="flex items-center gap-1">
                  <label
                    htmlFor="curve-left-slider"
                    className="font-mono-tech text-[11px] font-medium text-[#D1D5DB] whitespace-nowrap"
                  >
                    G
                  </label>
                  <input
                    id="curve-left-slider"
                    type="range"
                    min={-CURVATURE_LIMIT_DEG}
                    max={CURVATURE_LIMIT_DEG}
                    step={1}
                    value={curveLeftDeg}
                    onChange={(e) => onCurveLeftChange(Number(e.target.value))}
                    aria-label="Courbure gauche (-30° arrière à +30° avant)"
                    className="krona-slider w-16 sm:w-14 xl:w-16"
                  />
                  <span className="font-mono-tech w-8 text-right text-[11px] text-[#F59E0B] tabular-nums">
                    {formatDeg(curveLeftDeg)}
                  </span>
                </div>

                <span className="h-3.5 w-px bg-white/15 shrink-0" aria-hidden="true" />

                <div className="flex items-center gap-1">
                  <label
                    htmlFor="curve-right-slider"
                    className="font-mono-tech text-[11px] font-medium text-[#D1D5DB] whitespace-nowrap"
                  >
                    D
                  </label>
                  <input
                    id="curve-right-slider"
                    type="range"
                    min={-CURVATURE_LIMIT_DEG}
                    max={CURVATURE_LIMIT_DEG}
                    step={1}
                    value={curveRightDeg}
                    onChange={(e) => onCurveRightChange(Number(e.target.value))}
                    aria-label="Courbure droite (-30° arrière à +30° avant)"
                    className="krona-slider w-16 sm:w-14 xl:w-16"
                  />
                  <span className="font-mono-tech w-8 text-right text-[11px] text-[#F59E0B] tabular-nums">
                    {formatDeg(curveRightDeg)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

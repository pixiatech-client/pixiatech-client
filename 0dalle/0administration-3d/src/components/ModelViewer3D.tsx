import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RotateCcw } from 'lucide-react';
import { buildAllPixiaLedModels } from '../three/ledModels';
import { createProceduralTextures } from '../three/proceduralTextures';
import type { PresentationModelId, PresentationModelSpec } from '../types/models';

interface ModelViewer3DProps {
  activeModel: PresentationModelSpec | null;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
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

function getCameraPresetForModel(modelId: PresentationModelId | null): {
  pos: [number, number, number];
  target: [number, number, number];
} {
  switch (modelId) {
    case 'smd-50x100':
      return { pos: [2.55, 2.05, 3.85], target: [0, 1.24, 0] };
    case 'dalle-sample':
      return { pos: [1.85, 1.38, 2.55], target: [0, 0.68, 0] };
    case 'holographique':
    case 'transparent':
      return { pos: [2.12, 1.52, 3.12], target: [0, 0.94, 0] };
    case 'smd-50x50':
    default:
      return { pos: [2.05, 1.44, 2.95], target: [0, 0.86, 0] };
  }
}

export function ModelViewer3D({ activeModel }: ModelViewer3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const activeModelIdRef = useRef<PresentationModelId | null>(activeModel?.id ?? null);
  const applyModelSelectionRef = useRef<((id: PresentationModelId | null, resetCam?: boolean) => void) | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const nextId = activeModel?.id ?? null;
    activeModelIdRef.current = nextId;
    applyModelSelectionRef.current?.(nextId, true);
  }, [activeModel?.id]);

  useEffect(() => {
    const mountEl = containerRef.current;
    if (!mountEl) return;

    const isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(mountEl.clientWidth, 280);
    const height = Math.max(mountEl.clientHeight, 240);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090f);
    scene.fog = new THREE.FogExp2(0x07090f, 0.125);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
    const initialPreset = getCameraPresetForModel(activeModelIdRef.current);
    camera.position.set(...initialPreset.pos);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.setAttribute('data-testid', 'pixiatech-3d-canvas');
    mountEl.appendChild(canvas);

    // Procedural studio IBL environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Warm/cool 3-point studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    keyLight.position.set(3.4, 4.8, 3.8);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 14;
      keyLight.shadow.camera.left = -2.6;
      keyLight.shadow.camera.right = 2.6;
      keyLight.shadow.camera.top = 3.2;
      keyLight.shadow.camera.bottom = -1.2;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.1);
    rimLight.position.set(-3.5, 2.8, -3.2);
    scene.add(rimLight);

    // Procedural textures & studio floor grounding
    const textures = createProceduralTextures(renderer.capabilities.getMaxAnisotropy());

    const floorGeo = new THREE.CircleGeometry(16, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1420,
      roughness: 0.36,
      metalness: 0.48,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // Soft radial contact shadow plane directly beneath the cabinet (disjoint Y to avoid Z-fighting)
    const contactGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const contactMat = new THREE.MeshBasicMaterial({
      map: textures.contactShadowTexture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const contactMesh = new THREE.Mesh(contactGeo, contactMat);
    contactMesh.rotation.x = -Math.PI / 2;
    contactMesh.position.y = 0.008;
    scene.add(contactMesh);

    // Build all 5 composite multi-part LED models once
    const modelCollection = buildAllPixiaLedModels(textures, isSoftwareGl);
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    (Object.keys(modelCollection.groups) as PresentationModelId[]).forEach((id) => {
      const grp = modelCollection.groups[id];
      grp.visible = id === activeModelIdRef.current;
      stageGroup.add(grp);
    });

    // OrbitControls (damping disabled on software WebGL per threejs skill)
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...initialPreset.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 1.65;
    controls.maxDistance = 5.4;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.update();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Coalesced on-demand rendering + software WebGL pacing
    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let transitionActive = false;

    const camGoalPos = new THREE.Vector3(...initialPreset.pos);
    const camGoalTarget = new THREE.Vector3(...initialPreset.target);
    let modelYawOffset = -0.28;
    let modelGoalYaw = -0.28;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
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

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;

        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (transitionActive) {
          if (isSoftwareGl) {
            camera.position.copy(camGoalPos);
            controls.target.copy(camGoalTarget);
            modelYawOffset = modelGoalYaw;
            transitionActive = false;
          } else {
            const alpha = 1 - Math.exp(-10 * dt);
            camera.position.lerp(camGoalPos, alpha);
            controls.target.lerp(camGoalTarget, alpha);
            modelYawOffset = THREE.MathUtils.lerp(modelYawOffset, modelGoalYaw, alpha);

            const posDist = camera.position.distanceTo(camGoalPos);
            const tgtDist = controls.target.distanceTo(camGoalTarget);
            const yawDist = Math.abs(modelYawOffset - modelGoalYaw);
            if (posDist < 0.005 && tgtDist < 0.005 && yawDist < 0.003) {
              camera.position.copy(camGoalPos);
              controls.target.copy(camGoalTarget);
              modelYawOffset = modelGoalYaw;
              transitionActive = false;
            }
          }
        }

        stageGroup.rotation.y = modelYawOffset;
        const dampedMoving = controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (!disposed && (renderDirty || transitionActive || (!isSoftwareGl && dampedMoving))) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    applyModelSelectionRef.current = (id: PresentationModelId | null, resetCam = true) => {
      (Object.keys(modelCollection.groups) as PresentationModelId[]).forEach((key) => {
        modelCollection.groups[key].visible = key === id;
      });
      contactMesh.visible = id !== null;

      if (resetCam) {
        const preset = getCameraPresetForModel(id);
        camGoalPos.set(...preset.pos);
        camGoalTarget.set(...preset.target);
        modelYawOffset = isSoftwareGl ? -0.28 : -0.48;
        modelGoalYaw = -0.28;
        transitionActive = true;
      }
      requestRender();
    };

    resetViewRef.current = () => {
      const preset = getCameraPresetForModel(activeModelIdRef.current);
      camGoalPos.set(...preset.pos);
      camGoalTarget.set(...preset.target);
      modelGoalYaw = -0.28;
      transitionActive = true;
      requestRender();
    };

    const onControlsStart = () => {
      // Cancel automated camera transition so manual orbit never fights the user
      transitionActive = false;
    };
    const onControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextW = Math.max(Math.floor(entry.contentRect.width), 200);
        const nextH = Math.max(Math.floor(entry.contentRect.height), 200);
        camera.aspect = nextW / nextH;
        camera.updateProjectionMatrix();
        renderer.setSize(nextW, nextH, false);
        requestRender();
      }
    });
    resizeObserver.observe(mountEl);

    // Initial render
    stageGroup.rotation.y = modelYawOffset;
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);

      modelCollection.dispose();
      textures.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      contactGeo.dispose();
      contactMat.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (canvas.parentElement === mountEl) {
        mountEl.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden bg-[#07090F] border border-white/[0.06]"
      data-testid="viewer-stage"
      data-active-model={activeModel?.id ?? 'none'}
    >
      {/* Dedicated empty mount container for WebGLRenderer */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label={
          activeModel
            ? `Visualiseur 3D interactif du modèle ${activeModel.name}`
            : 'Visualiseur 3D en veille'
        }
      />

      {/* Standby state when all switches are OFF */}
      {!activeModel && !contextLost && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center bg-[#07090F]/90 pointer-events-none"
          data-testid="viewer-standby"
        >
          <p className="font-display text-sm font-semibold text-slate-200">
            Aucun modèle actif
          </p>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
            Activez l’un des cinq modèles dans le panneau de commandes pour afficher son rendu 3D.
          </p>
        </div>
      )}

      {/* WebGL fallback state */}
      {contextLost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center bg-[#07090F]">
          <p className="font-display text-sm font-semibold text-slate-200">
            Rendu 3D temporairement indisponible
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Le contexte graphique WebGL a été interrompu.
          </p>
        </div>
      )}

      {/* Non-intrusive compact reset button in bottom-right corner */}
      {activeModel && !contextLost && (
        <div className="absolute right-3 bottom-3 pointer-events-none">
          <button
            type="button"
            onClick={() => resetViewRef.current?.()}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-slate-200 bg-[#0B0E15]/95 hover:bg-[#141925] border border-white/[0.08] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
            aria-label="Réinitialiser la vue 3D"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" aria-hidden="true" />
            <span>Recentrer</span>
          </button>
        </div>
      )}
    </div>
  );
}

'use client';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  createArchitecturalFloorTextures,
  createLedMatrixTexture,
} from './proceduralTextures';
import type { ComponentPartId } from '../data/kineticData';

export type MotionPattern = 'wave' | 'sculpture' | 'pulse' | 'interactive' | 'video_depth';
export type VisualTheme =
  | 'amber'
  | 'liquid_gold'
  | 'cryo'
  | 'monolith'
  | 'video'
  | 'show_prism'
  | 'show_organic';
export type CameraPreset = 'cinema' | 'grazing' | 'mechanical' | 'front';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

export interface KineticSceneConfig {
  cols: number;
  rows: number;
  pattern: MotionPattern;
  theme: VisualTheme;
  maxStrokeMm: number;
  speedFactor: number;
  showActuators: boolean;
  isPlaying: boolean;
  ledsEnabled: boolean;
  studioLightsEnabled: boolean;
  initialCamera?: CameraState;
}

export interface KineticSceneCallbacks {
  onTelemetry?: (avgDepthMm: number) => void;
  onCameraChange?: (state: CameraState) => void;
  onContextLost?: () => void;
}

const KINETIC_SIGNAL_GLSL = `
  uniform float uTime;
  uniform int uTheme;
  uniform int uHasVideo;
  uniform int uLedsEnabled;
  uniform sampler2D uVideoMap;

  vec3 computeKineticSignal(vec2 uv, float depth, float t, int themeId) {
    if (uHasVideo == 1 && themeId == 4) {
      vec3 vid = texture2D(uVideoMap, uv).rgb;
      float boost = 0.72 + depth * 0.78;
      return vid * boost;
    }

    float w1 = sin(uv.x * 6.2831 - t * 1.15 + uv.y * 2.4);
    float w2 = cos(uv.y * 4.5 + t * 0.85 - uv.x * 3.1);
    float ridge = smoothstep(-0.3, 0.95, w1 * 0.55 + w2 * 0.45);
    float boost = 0.35 + depth * 1.25;

    if (themeId == 5) {
      float p1 = sin(uv.x * 4.2 + t * 0.9 + sin(uv.y * 3.1 - t * 0.6));
      float p2 = cos(uv.y * 5.0 - t * 1.1 + cos(uv.x * 2.8 + t * 0.5));
      float blend = clamp(0.5 + 0.5 * (p1 * 0.55 + p2 * 0.45), 0.0, 1.0);
      vec3 indigo = vec3(0.08, 0.05, 0.24);
      vec3 magenta = vec3(0.95, 0.22, 0.58);
      vec3 amberPeak = vec3(1.42, 0.72, 0.22);
      vec3 col = mix(indigo, magenta, smoothstep(0.15, 0.75, blend));
      col = mix(col, amberPeak, smoothstep(0.62, 1.0, blend * 0.7 + depth * 0.4));
      return col * (0.45 + depth * 1.1);
    } else if (themeId == 6) {
      float f1 = sin((uv.x + uv.y) * 5.2 - t * 1.05);
      float f2 = cos(length(uv - vec2(0.5 + sin(t * 0.4) * 0.2, 0.5)) * 8.5 - t * 1.35);
      float ribbon = smoothstep(-0.4, 0.85, f1 * 0.5 + f2 * 0.5);
      vec3 abyss = vec3(0.02, 0.07, 0.16);
      vec3 teal = vec3(0.08, 0.76, 0.82);
      vec3 mintGlow = vec3(0.72, 1.28, 1.18);
      vec3 col = mix(abyss, teal, ribbon);
      col = mix(col, mintGlow, smoothstep(0.6, 1.0, ribbon * 0.75 + depth * 0.35));
      return col * (0.42 + depth * 1.12);
    } else if (themeId == 0) {
      vec3 darkAmber = vec3(0.08, 0.025, 0.008);
      vec3 midCopper = vec3(0.92, 0.38, 0.08);
      vec3 hotPeak = vec3(1.55, 0.98, 0.52);
      vec3 col = mix(darkAmber, midCopper, ridge);
      col = mix(col, hotPeak, smoothstep(0.55, 1.0, depth * 0.8 + ridge * 0.35));
      return col * boost;
    } else if (themeId == 1) {
      float caustics = sin(uv.x * 11.0 + sin(uv.y * 7.0 + t)) * 0.5 + 0.5;
      vec3 bronze = vec3(0.14, 0.09, 0.04);
      vec3 gold = vec3(1.15, 0.82, 0.36);
      vec3 spec = vec3(1.65, 1.42, 0.96);
      vec3 col = mix(bronze, gold, caustics * 0.7 + ridge * 0.3);
      col = mix(col, spec, smoothstep(0.65, 1.0, depth));
      return col * boost;
    } else if (themeId == 2) {
      float flow = sin(length(uv - 0.5) * 9.0 - t * 1.6) * 0.5 + 0.5;
      vec3 deepSlate = vec3(0.02, 0.06, 0.14);
      vec3 cyan = vec3(0.16, 0.78, 1.15);
      vec3 whiteHot = vec3(0.92, 1.25, 1.48);
      vec3 col = mix(deepSlate, cyan, flow * 0.75 + ridge * 0.25);
      col = mix(col, whiteHot, smoothstep(0.6, 1.0, depth * 0.75 + flow * 0.35));
      return col * boost;
    } else {
      float band = smoothstep(0.15, 0.85, ridge);
      vec3 charcoal = vec3(0.09, 0.10, 0.12);
      vec3 titanium = vec3(1.08, 1.12, 1.18);
      vec3 col = mix(charcoal, titanium, band * 0.65 + depth * 0.5);
      return col * boost;
    }
  }
`;

// Pre-allocated math helpers outside render loop (Zero GC)
const _objPos = new THREE.Vector3();
const _objQuat = new THREE.Quaternion();
const _objScale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();
const _hitPoint = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
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

export class KineticWallScene {
  private container: HTMLElement;
  private callbacks: KineticSceneCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;

  private wallGroup: THREE.Group;
  private proxyPlane: THREE.Mesh;
  private focusMarkerMesh: THREE.LineSegments;
  private focusedComponent: ComponentPartId | null = null;
  private focusTargetSample = { x: 0, y: 0, z: 0.25 };
  private cabinetBodyMesh: THREE.InstancedMesh | null = null;
  private heatsinkMesh: THREE.InstancedMesh | null = null;
  private ledFaceMesh: THREE.InstancedMesh | null = null;
  private railLeftMesh: THREE.InstancedMesh | null = null;
  private railRightMesh: THREE.InstancedMesh | null = null;
  private actuatorRodMesh: THREE.InstancedMesh | null = null;
  private collarMesh: THREE.InstancedMesh | null = null;
  private railMaterial: THREE.MeshPhysicalMaterial | null = null;
  private rodMaterial: THREE.MeshStandardMaterial | null = null;

  private ledMaterial: THREE.MeshStandardMaterial;
  private placeholderVideoTex: THREE.DataTexture;
  private activeVideoTex: THREE.VideoTexture | null = null;
  private activeVideoEl: HTMLVideoElement | null = null;
  private sampleCanvas: HTMLCanvasElement;
  private sampleCtx: CanvasRenderingContext2D | null;
  private videoLuminanceGrid: Float32Array = new Float32Array(24 * 16);
  private videoAvgColor = new THREE.Color('#E87A24');
  private videoSampleTimer = 0;

  private ledUniforms = {
    uTime: { value: 0 },
    uTheme: { value: 0 },
    uHasVideo: { value: 0 },
    uLedsEnabled: { value: 1 },
    uVideoMap: { value: null as unknown as THREE.Texture },
    uWallWidth: { value: 5.2 },
    uWallHeight: { value: 3.12 },
  };

  private dynamicGlowLight: THREE.PointLight;
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private plinthMesh!: THREE.Mesh;
  private floorReflectionMesh!: THREE.Mesh;
  private envRT: THREE.WebGLRenderTarget;
  private ledTexture: THREE.CanvasTexture;
  private floorMaps: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture };
  private disposables: Array<{ dispose: () => void }> = [];

  private config: KineticSceneConfig;
  private currentDepths: Float32Array = new Float32Array(0);
  private pointerHover = { u: 0.5, v: 0.5, active: false };

  private cameraAnim = {
    active: false,
    targetPos: new THREE.Vector3(4.85, 3.44, 11.65),
    targetLook: new THREE.Vector3(-0.55, 2.76, 0.0),
  };

  private camTrackPos = new THREE.Vector3();
  private camTrackTarget = new THREE.Vector3();
  private camDirty = false;
  private camSettleElapsed = 0;
  private camEmitElapsed = 0;

  private frameId = 0;
  private isLoopTimer = false;
  private disposed = false;
  private lastNow = performance.now();
  private simTime = 0;
  private telemetryElapsed = 0;

  // Physical dimensions in meters (1 unit = 1 meter, matching 500x500 mm cabinets!)
  private readonly cabSize = 0.492;
  private readonly cabPitch = 0.506;
  private readonly cabDepth = 0.105;
  private wallCenterY = 1.92;

  constructor(
    container: HTMLElement,
    initialConfig: KineticSceneConfig,
    callbacks: KineticSceneCallbacks = {}
  ) {
    this.container = container;
    this.config = { ...initialConfig };
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#07080B');
    this.scene.fog = new THREE.FogExp2('#07080B', 0.042);

    const initWallW = this.config.cols * this.cabPitch;
    const initWallH = this.config.rows * this.cabPitch;
    this.wallCenterY = Math.max(1.92, initWallH * 0.5 + 0.34);
    const initScale = Math.max(1, initWallW / 5.0);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    if (this.config.initialCamera) {
      this.camera.position.set(...this.config.initialCamera.position);
    } else {
      this.camera.position.set(
        2.4 * initScale,
        Math.max(2.4, this.wallCenterY * 1.02),
        5.75 * initScale
      );
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    if (this.config.initialCamera) {
      this.controls.target.set(...this.config.initialCamera.target);
    } else {
      this.controls.target.set(
        -0.27 * initScale,
        this.wallCenterY * 0.82,
        0.0
      );
    }
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.055;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 22.0;
    this.controls.maxPolarAngle = Math.PI * 0.51;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.minAzimuthAngle = -Math.PI * 0.48;
    this.controls.maxAzimuthAngle = Math.PI * 0.48;
    this.controls.update();
    this.camTrackPos.copy(this.camera.position);
    this.camTrackTarget.copy(this.controls.target);
    this.controls.addEventListener('start', this.cancelCameraAnimation);
    this.controls.addEventListener('end', this.emitCameraState);

    // Studio IBL environment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRT = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Lighting Rig
    this.setupLighting();
    this.dynamicGlowLight = new THREE.PointLight('#E87A24', 1.15, 8.5, 1.8);
    this.dynamicGlowLight.position.set(0, this.wallCenterY, 1.65);
    this.scene.add(this.dynamicGlowLight);

    // Architectural Gallery Floor & Plinth
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.floorMaps = createArchitecturalFloorTextures(maxAniso);
    this.ledTexture = createLedMatrixTexture(maxAniso);

    this.setupGalleryEnvironment();

    // Wall group + invisible raycast proxy plane
    this.wallGroup = new THREE.Group();
    this.wallGroup.position.set(0, this.wallCenterY, 0);
    this.scene.add(this.wallGroup);

    const proxyGeo = new THREE.PlaneGeometry(10, 6);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    this.proxyPlane = new THREE.Mesh(proxyGeo, proxyMat);
    this.proxyPlane.position.set(0, 0, 0.15);
    this.wallGroup.add(this.proxyPlane);
    this.disposables.push(proxyGeo, proxyMat);

    // 3D orange callout wireframe highlighting the inspected mechanical organ
    const markerBox = new THREE.BoxGeometry(1, 1, 1);
    const markerEdges = new THREE.EdgesGeometry(markerBox);
    markerBox.dispose();
    const markerMat = new THREE.LineBasicMaterial({
      color: '#E87A24',
      transparent: true,
      opacity: 0.95,
    });
    this.focusMarkerMesh = new THREE.LineSegments(markerEdges, markerMat);
    this.focusMarkerMesh.visible = false;
    this.wallGroup.add(this.focusMarkerMesh);
    this.disposables.push(markerEdges, markerMat);

    // 1x1 black placeholder texture so uVideoMap is always safely bound
    this.placeholderVideoTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.placeholderVideoTex.needsUpdate = true;
    this.ledUniforms.uVideoMap.value = this.placeholderVideoTex;
    this.disposables.push(this.placeholderVideoTex);

    // Offscreen low-res canvas for real-time video luminance -> 3D depth relief & bounce light
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = 24;
    this.sampleCanvas.height = 16;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });

    // Extended PBR Material for the continuous HDR LED Matrix Face
    this.ledMaterial = this.createLedMatrixMaterial();
    this.disposables.push(this.ledMaterial);

    this.rebuildMatrix(this.config.cols, this.config.rows);

    // Post-processing UnrealBloomPass on GPU (high threshold so metallic rails never bloom)
    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.15,
        0.42,
        1.05
      );
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('resize', this.handleResize);

    this.lastNow = performance.now();
    this.tick();
  }

  private setupLighting() {
    // Crisp cool-blue & neutral architectural hemisphere fill
    this.hemiLight = new THREE.HemisphereLight('#B4CEFF', '#0C0E14', 0.42);
    this.scene.add(this.hemiLight);

    // Crisp studio white directional key light casting clean inter-cabinet shadows
    this.keyLight = new THREE.DirectionalLight('#F8FAFC', 1.45);
    this.keyLight.position.set(6.0, 8.0, 6.8);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 28;
    this.keyLight.shadow.camera.left = -5.5;
    this.keyLight.shadow.camera.right = 5.5;
    this.keyLight.shadow.camera.top = 5.5;
    this.keyLight.shadow.camera.bottom = -5.5;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    // Cool architectural blue rim backlight separating steel linear rails & truss
    this.rimLight = new THREE.DirectionalLight('#6BA6FF', 0.72);
    this.rimLight.position.set(-5.5, 4.6, -4.2);
    this.scene.add(this.rimLight);

    // Clean cool-white fill light on anodized cabinet bevels
    this.fillLight = new THREE.DirectionalLight('#DCE8FA', 0.44);
    this.fillLight.position.set(-4.5, 3.0, 5.2);
    this.scene.add(this.fillLight);
  }

  private setupGalleryEnvironment() {
    // Subtle satin basalt architectural floor (gentle reflections, zero blinding glare)
    const floorGeo = new THREE.PlaneGeometry(48, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.floorMaps.map,
      roughnessMap: this.floorMaps.roughnessMap,
      roughness: 0.72,
      metalness: 0.08,
      envMapIntensity: 0.16,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.disposables.push(floorGeo, floorMat);

    // Satin anodized steel floor plinth under the kinetic wall frame
    const plinthGeo = new THREE.BoxGeometry(7.2, 0.08, 1.15);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: '#13161D',
      metalness: 0.55,
      roughness: 0.62,
      envMapIntensity: 0.35,
    });
    this.plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    this.plinthMesh.position.set(0, 0.04, -0.35);
    this.plinthMesh.receiveShadow = true;
    this.plinthMesh.castShadow = true;
    this.scene.add(this.plinthMesh);
    this.disposables.push(plinthGeo, plinthMat);

    // Soft-blurred, vertically inverted screen reflection projected across the floor
    const reflGeo = new THREE.PlaneGeometry(1, 1);
    const reflMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.ledUniforms.uTime,
        uTheme: this.ledUniforms.uTheme,
        uHasVideo: this.ledUniforms.uHasVideo,
        uLedsEnabled: this.ledUniforms.uLedsEnabled,
        uVideoMap: this.ledUniforms.uVideoMap,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        ${KINETIC_SIGNAL_GLSL}

        float computeFloorDepth(vec2 uv, float t) {
          float dist = length(uv - vec2(0.5));
          return clamp(0.5 + 0.45 * sin(dist * 7.5 - t * 1.05), 0.1, 0.95);
        }

        void main() {
          if (uLedsEnabled == 0) {
            gl_FragColor = vec4(0.0);
            return;
          }

          // Plane rotated -PI/2 around X: vUv.y = 1.0 is at the wall plinth, 0.0 is toward viewer
          float distFromWall = 1.0 - vUv.y;
          vec2 mirrorUv = vec2(vUv.x, clamp(distFromWall, 0.0, 1.0));

          // 9-tap soft box/Gaussian diffusion ("flou léger") of the inverted screen image
          vec2 blur = vec2(0.042, 0.064);
          vec3 sum = vec3(0.0);
          vec2 uv0 = clamp(mirrorUv + vec2(-blur.x, -blur.y), 0.0, 1.0);
          vec2 uv1 = clamp(mirrorUv + vec2(0.0, -blur.y), 0.0, 1.0);
          vec2 uv2 = clamp(mirrorUv + vec2(blur.x, -blur.y), 0.0, 1.0);
          vec2 uv3 = clamp(mirrorUv + vec2(-blur.x, 0.0), 0.0, 1.0);
          vec2 uv4 = mirrorUv;
          vec2 uv5 = clamp(mirrorUv + vec2(blur.x, 0.0), 0.0, 1.0);
          vec2 uv6 = clamp(mirrorUv + vec2(-blur.x, blur.y), 0.0, 1.0);
          vec2 uv7 = clamp(mirrorUv + vec2(0.0, blur.y), 0.0, 1.0);
          vec2 uv8 = clamp(mirrorUv + vec2(blur.x, blur.y), 0.0, 1.0);

          sum += computeKineticSignal(uv0, computeFloorDepth(uv0, uTime), uTime, uTheme) * 0.075;
          sum += computeKineticSignal(uv1, computeFloorDepth(uv1, uTime), uTime, uTheme) * 0.125;
          sum += computeKineticSignal(uv2, computeFloorDepth(uv2, uTime), uTime, uTheme) * 0.075;
          sum += computeKineticSignal(uv3, computeFloorDepth(uv3, uTime), uTime, uTheme) * 0.125;
          sum += computeKineticSignal(uv4, computeFloorDepth(uv4, uTime), uTime, uTheme) * 0.20;
          sum += computeKineticSignal(uv5, computeFloorDepth(uv5, uTime), uTime, uTheme) * 0.125;
          sum += computeKineticSignal(uv6, computeFloorDepth(uv6, uTime), uTime, uTheme) * 0.075;
          sum += computeKineticSignal(uv7, computeFloorDepth(uv7, uTime), uTime, uTheme) * 0.125;
          sum += computeKineticSignal(uv8, computeFloorDepth(uv8, uTime), uTime, uTheme) * 0.075;

          // Visible inverted floor reflection with smooth gradient decay away from the plinth
          float fadeZ = pow(1.0 - distFromWall, 1.25) * smoothstep(0.0, 0.045, distFromWall);
          float fadeX = smoothstep(0.0, 0.10, vUv.x) * smoothstep(1.0, 0.90, vUv.x);
          float opacity = fadeZ * fadeX * 0.68;

          gl_FragColor = vec4(sum * 1.45 * opacity, opacity);
        }
      `,
    });
    this.floorReflectionMesh = new THREE.Mesh(reflGeo, reflMat);
    this.floorReflectionMesh.rotation.x = -Math.PI / 2;
    this.floorReflectionMesh.position.set(0, 0.01, 2.4);
    this.scene.add(this.floorReflectionMesh);
    this.disposables.push(reflGeo, reflMat);
  }

  private createLedMatrixMaterial(): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: '#111216',
      map: this.ledTexture,
      roughness: 0.42,
      metalness: 0.14,
      emissive: '#FFFFFF',
      emissiveIntensity: 1.0,
      envMapIntensity: 0.75,
    });

    mat.customProgramCacheKey = () => 'tessera-mk250-led-face-v4';

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.ledUniforms.uTime;
      shader.uniforms.uTheme = this.ledUniforms.uTheme;
      shader.uniforms.uHasVideo = this.ledUniforms.uHasVideo;
      shader.uniforms.uLedsEnabled = this.ledUniforms.uLedsEnabled;
      shader.uniforms.uVideoMap = this.ledUniforms.uVideoMap;
      shader.uniforms.uWallWidth = this.ledUniforms.uWallWidth;
      shader.uniforms.uWallHeight = this.ledUniforms.uWallHeight;

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec2 vWallUv;
          varying vec2 vTileUv;
          varying float vProtrusion;
          uniform float uWallWidth;
          uniform float uWallHeight;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vTileUv = uv;
          #ifdef USE_INSTANCING
            vec4 instPos = instanceMatrix * vec4(position, 1.0);
            vWallUv = vec2(
              clamp((instPos.x / uWallWidth) + 0.5, 0.0, 1.0),
              clamp((instPos.y / uWallHeight) + 0.5, 0.0, 1.0)
            );
            vProtrusion = clamp(instanceMatrix[3].z / 0.58, 0.0, 1.0);
          #else
            vWallUv = uv;
            vProtrusion = 0.5;
          #endif`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec2 vWallUv;
          varying vec2 vTileUv;
          varying float vProtrusion;
          ${KINETIC_SIGNAL_GLSL}`
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          vec3 ledSignal = computeKineticSignal(vWallUv, vProtrusion, uTime, uTheme);
          float pixelMask = smoothstep(0.18, 0.85, diffuseColor.g);
          totalEmissiveRadiance = (uLedsEnabled == 1) ? ledSignal * (0.28 + pixelMask * 1.15) : vec3(0.0);`
        );
    };

    return mat;
  }

  private clearWallMeshes() {
    const meshes = [
      this.cabinetBodyMesh,
      this.heatsinkMesh,
      this.ledFaceMesh,
      this.railLeftMesh,
      this.railRightMesh,
      this.actuatorRodMesh,
      this.collarMesh,
    ];
    for (const m of meshes) {
      if (m) {
        this.wallGroup.remove(m);
        m.geometry.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else if (m.material !== this.ledMaterial) {
          m.material.dispose();
        }
      }
    }
    this.railMaterial = null;
    this.rodMaterial = null;
    // Clear static structural truss children except proxyPlane and focusMarkerMesh
    for (let i = this.wallGroup.children.length - 1; i >= 0; i--) {
      const child = this.wallGroup.children[i];
      if (child !== this.proxyPlane && child !== this.focusMarkerMesh) {
        this.wallGroup.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
  }

  public rebuildMatrix(cols: number, rows: number) {
    this.clearWallMeshes();
    this.config.cols = cols;
    this.config.rows = rows;

    const count = cols * rows;
    this.currentDepths = new Float32Array(count);
    this.currentDepths.fill(0.25);

    const wallW = cols * this.cabPitch;
    const wallH = rows * this.cabPitch;
    this.wallCenterY = Math.max(1.92, wallH * 0.5 + 0.34);
    this.wallGroup.position.set(0, this.wallCenterY, 0);
    this.dynamicGlowLight.position.set(0, this.wallCenterY, 1.65);

    if (this.plinthMesh) {
      this.plinthMesh.scale.x = Math.max(1, (wallW + 1.4) / 7.2);
    }
    if (this.floorReflectionMesh) {
      const reflDepth = Math.max(4.6, wallH * 1.05);
      this.floorReflectionMesh.scale.set(wallW * 1.08, reflDepth, 1);
      this.floorReflectionMesh.position.set(0, 0.01, reflDepth * 0.5 + 0.24);
    }
    if (this.keyLight) {
      const bound = Math.max(5.5, Math.max(wallW, wallH) * 0.72);
      this.keyLight.shadow.camera.left = -bound;
      this.keyLight.shadow.camera.right = bound;
      this.keyLight.shadow.camera.top = bound;
      this.keyLight.shadow.camera.bottom = -bound;
      this.keyLight.shadow.camera.updateProjectionMatrix();
    }

    this.ledUniforms.uWallWidth.value = wallW;
    this.ledUniforms.uWallHeight.value = wallH;

    // Resize raycast proxy plane
    this.proxyPlane.scale.set(wallW / 10, wallH / 6, 1);

    // 1. Structural Back Truss Frame (Vertical + Horizontal Anodized Steel Beams)
    const trussMat = new THREE.MeshStandardMaterial({
      color: '#191D26',
      metalness: 0.88,
      roughness: 0.34,
    });
    const railBackZ = -0.34;

    const vBeamGeo = new THREE.BoxGeometry(0.055, wallH + 0.35, 0.08);
    for (let c = 0; c <= cols; c += Math.max(1, Math.floor(cols / 4))) {
      const x = (c - cols / 2) * this.cabPitch;
      const beam = new THREE.Mesh(vBeamGeo, trussMat);
      beam.position.set(x, -0.08, railBackZ);
      beam.castShadow = true;
      beam.receiveShadow = true;
      this.wallGroup.add(beam);
    }
    // Ensure right edge upright beam
    const rightBeam = new THREE.Mesh(vBeamGeo, trussMat);
    rightBeam.position.set((cols / 2) * this.cabPitch, -0.08, railBackZ);
    rightBeam.castShadow = true;
    this.wallGroup.add(rightBeam);

    // Floor-anchoring vertical stanchions down to plinth
    const stanchionGeo = new THREE.BoxGeometry(0.08, this.wallCenterY - wallH * 0.5 + 0.1, 0.12);
    const stanchionY = -(wallH * 0.5) - (this.wallCenterY - wallH * 0.5) * 0.5;
    for (const sx of [-wallW * 0.42, 0, wallW * 0.42]) {
      const stanchion = new THREE.Mesh(stanchionGeo, trussMat);
      stanchion.position.set(sx, stanchionY, railBackZ);
      stanchion.castShadow = true;
      stanchion.receiveShadow = true;
      this.wallGroup.add(stanchion);
    }

    const hBeamGeo = new THREE.BoxGeometry(wallW + 0.24, 0.05, 0.06);
    for (let r = 0; r < rows; r++) {
      const y = (r - (rows - 1) / 2) * this.cabPitch;
      const hBeam = new THREE.Mesh(hBeamGeo, trussMat);
      hBeam.position.set(0, y, railBackZ + 0.04);
      hBeam.receiveShadow = true;
      this.wallGroup.add(hBeam);
    }

    // 2. Beveled Die-Cast Aluminum Cabinet Body (ExtrudeGeometry with real chamfers!)
    const half = this.cabSize * 0.5;
    const bevel = 0.012;
    const inner = half - bevel;
    const shape = new THREE.Shape();
    shape.moveTo(-inner, -half);
    shape.lineTo(inner, -half);
    shape.lineTo(half, -inner);
    shape.lineTo(half, inner);
    shape.lineTo(inner, half);
    shape.lineTo(-inner, half);
    shape.lineTo(-half, inner);
    shape.lineTo(-half, -inner);
    shape.closePath();

    const cabGeo = new THREE.ExtrudeGeometry(shape, {
      depth: this.cabDepth,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.006,
      bevelSegments: 2,
    });
    // Shift so front bezel ends at z = 0 in local space
    cabGeo.translate(0, 0, -this.cabDepth - 0.008);

    const cabMat = new THREE.MeshStandardMaterial({
      color: '#1C2029',
      metalness: 0.86,
      roughness: 0.3,
      envMapIntensity: 1.15,
    });
    this.cabinetBodyMesh = new THREE.InstancedMesh(cabGeo, cabMat, count);
    this.cabinetBodyMesh.castShadow = !this.isSoftwareGl;
    this.cabinetBodyMesh.receiveShadow = !this.isSoftwareGl;
    this.cabinetBodyMesh.frustumCulled = false;
    this.wallGroup.add(this.cabinetBodyMesh);

    // 3. Rear Passive Heatsink Rib Block (CryoCathode Aluminum Cooling Fin Block)
    const heatGeo = new THREE.BoxGeometry(this.cabSize * 0.72, this.cabSize * 0.72, 0.036);
    const heatMat = new THREE.MeshStandardMaterial({
      color: '#2B303D',
      metalness: 0.92,
      roughness: 0.22,
    });
    this.heatsinkMesh = new THREE.InstancedMesh(heatGeo, heatMat, count);
    this.heatsinkMesh.frustumCulled = false;
    this.wallGroup.add(this.heatsinkMesh);

    // 4. Front Continuous HDR LED Matrix Face
    const ledGeo = new THREE.PlaneGeometry(this.cabSize * 0.955, this.cabSize * 0.955);
    this.ledFaceMesh = new THREE.InstancedMesh(ledGeo, this.ledMaterial, count);
    this.ledFaceMesh.receiveShadow = !this.isSoftwareGl;
    this.ledFaceMesh.frustumCulled = false;
    this.wallGroup.add(this.ledFaceMesh);

    // 5. Twin Brushed Stainless Linear Guide Rails (luminous when studio lights are ON, unlit satin when OFF)
    const railGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.68, 12);
    railGeo.rotateX(Math.PI / 2);
    const railMat = new THREE.MeshPhysicalMaterial({
      color: this.config.studioLightsEnabled ? '#DCE6F5' : '#6E7685',
      metalness: 0.72,
      roughness: 0.28,
      envMapIntensity: this.config.studioLightsEnabled ? 0.65 : 0.25,
      anisotropy: 0.55,
      emissive: new THREE.Color('#D8E8FF'),
      emissiveIntensity: this.config.studioLightsEnabled ? 1.55 : 0.0,
    });
    this.railMaterial = railMat;
    this.railLeftMesh = new THREE.InstancedMesh(railGeo, railMat, count);
    this.railRightMesh = new THREE.InstancedMesh(railGeo, railMat, count);
    this.railLeftMesh.castShadow = !this.isSoftwareGl;
    this.railRightMesh.castShadow = !this.isSoftwareGl;
    this.railLeftMesh.frustumCulled = false;
    this.railRightMesh.frustumCulled = false;
    this.wallGroup.add(this.railLeftMesh, this.railRightMesh);

    // 6. Central Copper-Brass Ball-Screw Actuator Shaft & Linear Bearing Collar
    const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.68, 14);
    rodGeo.rotateX(Math.PI / 2);
    const rodMat = new THREE.MeshStandardMaterial({
      color: '#DF7A27',
      metalness: 0.85,
      roughness: 0.22,
      emissive: new THREE.Color('#E87A24'),
      emissiveIntensity: this.config.studioLightsEnabled ? 0.55 : 0.0,
    });
    this.rodMaterial = rodMat;
    this.actuatorRodMesh = new THREE.InstancedMesh(rodGeo, rodMat, count);
    this.actuatorRodMesh.frustumCulled = false;
    this.wallGroup.add(this.actuatorRodMesh);

    const collarGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.055, 16);
    collarGeo.rotateX(Math.PI / 2);
    const collarMat = new THREE.MeshStandardMaterial({
      color: '#0E1015',
      metalness: 0.75,
      roughness: 0.35,
    });
    this.collarMesh = new THREE.InstancedMesh(collarGeo, collarMat, count);
    this.collarMesh.frustumCulled = false;
    this.wallGroup.add(this.collarMesh);

    this.updateInstanceMatrices(0);
    this.cabinetBodyMesh.computeBoundingSphere();
    this.ledFaceMesh.computeBoundingSphere();
  }

  public updateConfig(next: Partial<KineticSceneConfig>) {
    const prevCols = this.config.cols;
    const prevRows = this.config.rows;
    Object.assign(this.config, next);

    if (
      (next.cols !== undefined && next.cols !== prevCols) ||
      (next.rows !== undefined && next.rows !== prevRows)
    ) {
      this.rebuildMatrix(this.config.cols, this.config.rows);
      // Smoothly frame the newly resized wall
      const wallW = this.config.cols * this.cabPitch;
      const distScale = Math.max(1, wallW / 5.0);
      this.cameraAnim.targetPos.set(
        2.4 * distScale,
        Math.max(2.4, this.wallCenterY * 1.02),
        5.75 * distScale
      );
      this.cameraAnim.targetLook.set(-0.27 * distScale, this.wallCenterY * 0.82, 0.0);
      this.cameraAnim.active = true;
    }

    const themeIndexMap: Record<VisualTheme, number> = {
      amber: 0,
      liquid_gold: 1,
      cryo: 2,
      monolith: 3,
      video: 4,
      show_prism: 5,
      show_organic: 6,
    };
    this.ledUniforms.uTheme.value = themeIndexMap[this.config.theme];

    // Update dynamic bounce point light color to match LED theme
    if (this.config.theme === 'amber') {
      this.dynamicGlowLight.color.set('#E87A24');
    } else if (this.config.theme === 'liquid_gold') {
      this.dynamicGlowLight.color.set('#F5C451');
    } else if (this.config.theme === 'cryo') {
      this.dynamicGlowLight.color.set('#38BDF8');
    } else if (this.config.theme === 'monolith') {
      this.dynamicGlowLight.color.set('#E4E4E7');
    } else if (this.config.theme === 'show_prism') {
      this.dynamicGlowLight.color.set('#C084FC');
    } else if (this.config.theme === 'show_organic') {
      this.dynamicGlowLight.color.set('#38BDF8');
    } else {
      this.dynamicGlowLight.color.copy(this.videoAvgColor);
    }

    const show = this.config.showActuators;
    if (this.railLeftMesh) this.railLeftMesh.visible = show;
    if (this.railRightMesh) this.railRightMesh.visible = show;
    if (this.actuatorRodMesh) this.actuatorRodMesh.visible = show;
    if (this.collarMesh) this.collarMesh.visible = show;

    // LED screen power & studio glare/lighting switches
    this.ledUniforms.uLedsEnabled.value = this.config.ledsEnabled ? 1 : 0;

    if (this.config.studioLightsEnabled) {
      this.keyLight.intensity = 1.45;
      this.rimLight.intensity = 0.72;
      this.fillLight.intensity = 0.44;
      this.hemiLight.intensity = 0.42;
      this.scene.environmentIntensity = 1.0;
      this.dynamicGlowLight.intensity = this.config.ledsEnabled ? 1.05 : 0;
      if (this.railMaterial) {
        this.railMaterial.color.set('#DCE6F5');
        this.railMaterial.envMapIntensity = 0.65;
        this.railMaterial.emissiveIntensity = 1.55;
      }
      if (this.rodMaterial) {
        this.rodMaterial.emissiveIntensity = 0.55;
      }
      if (this.bloomPass) {
        this.bloomPass.strength =
          this.config.ledsEnabled || this.config.showActuators ? 0.18 : 0;
      }
    } else {
      // Soft matte inspection mode (glissières & studio lights switched off)
      this.keyLight.intensity = 0.8;
      this.rimLight.intensity = 0.18;
      this.fillLight.intensity = 0.38;
      this.hemiLight.intensity = 0.55;
      this.scene.environmentIntensity = 0.32;
      this.dynamicGlowLight.intensity = 0;
      if (this.railMaterial) {
        this.railMaterial.color.set('#6E7685');
        this.railMaterial.envMapIntensity = 0.25;
        this.railMaterial.emissiveIntensity = 0;
      }
      if (this.rodMaterial) {
        this.rodMaterial.emissiveIntensity = 0;
      }
      if (this.bloomPass) {
        this.bloomPass.strength = 0;
      }
    }
  }

  public setVideoElement(videoEl: HTMLVideoElement | null) {
    if (this.activeVideoTex) {
      this.activeVideoTex.dispose();
      this.activeVideoTex = null;
    }
    this.activeVideoEl = videoEl;

    if (videoEl) {
      const vTex = new THREE.VideoTexture(videoEl);
      vTex.colorSpace = THREE.SRGBColorSpace;
      vTex.minFilter = THREE.LinearFilter;
      vTex.magFilter = THREE.LinearFilter;
      vTex.generateMipmaps = false;
      this.activeVideoTex = vTex;
      this.ledUniforms.uVideoMap.value = vTex;
      this.ledUniforms.uHasVideo.value = 1;
    } else {
      this.ledUniforms.uVideoMap.value = this.placeholderVideoTex;
      this.ledUniforms.uHasVideo.value = 0;
    }
  }

  private sampleVideoFrame() {
    if (
      !this.activeVideoEl ||
      !this.sampleCtx ||
      this.activeVideoEl.readyState < 2 ||
      this.activeVideoEl.videoWidth === 0
    ) {
      return;
    }

    const w = this.sampleCanvas.width;
    const h = this.sampleCanvas.height;
    try {
      this.sampleCtx.drawImage(this.activeVideoEl, 0, 0, w, h);
      const data = this.sampleCtx.getImageData(0, 0, w, h).data;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      const totalPx = w * h;

      for (let i = 0; i < totalPx; i++) {
        const p = i * 4;
        const r = data[p] / 255;
        const g = data[p + 1] / 255;
        const b = data[p + 2] / 255;
        sumR += r;
        sumG += g;
        sumB += b;
        // Perceptual luminance drives physical Z-depth protrusion in video_depth mode
        this.videoLuminanceGrid[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }

      this.videoAvgColor.setRGB(
        Math.min(1, (sumR / totalPx) * 1.45),
        Math.min(1, (sumG / totalPx) * 1.45),
        Math.min(1, (sumB / totalPx) * 1.45)
      );
      if (this.config.theme === 'video') {
        this.dynamicGlowLight.color.copy(this.videoAvgColor);
      }
    } catch {
      // Cross-origin frame read protection fallback: keep current luminance array
    }
  }

  public setCameraPreset(preset: CameraPreset) {
    this.focusedComponent = null;
    this.focusMarkerMesh.visible = false;

    const wallW = this.config.cols * this.cabPitch;
    const distScale = Math.max(1, wallW / 5.0);

    if (preset === 'cinema') {
      this.cameraAnim.targetPos.set(
        2.4 * distScale,
        Math.max(2.4, this.wallCenterY * 1.02),
        5.75 * distScale
      );
      this.cameraAnim.targetLook.set(-0.27 * distScale, this.wallCenterY * 0.82, 0.0);
    } else if (preset === 'grazing') {
      this.cameraAnim.targetPos.set(5.45 * distScale, 1.95, 2.15 * distScale);
      this.cameraAnim.targetLook.set(0, this.wallCenterY, 0.22);
    } else if (preset === 'mechanical') {
      this.cameraAnim.targetPos.set(-4.6 * distScale, 2.55, -2.4 * distScale);
      this.cameraAnim.targetLook.set(0, this.wallCenterY, -0.1);
    } else {
      this.cameraAnim.targetPos.set(0, this.wallCenterY, 6.2 * distScale);
      this.cameraAnim.targetLook.set(0, this.wallCenterY, 0.1);
    }
    this.cameraAnim.active = true;
  }

  public focusComponent(part: ComponentPartId | null) {
    this.focusedComponent = part;
    if (!part) {
      this.focusMarkerMesh.visible = false;
      this.setCameraPreset('cinema');
      return;
    }

    // Target the exposed right-edge mid-height cabinet so side/rear mechanisms are unobstructed
    const { x, y, z } = this.focusTargetSample;
    const worldY = this.wallCenterY + y;

    if (part === 'motion_unit') {
      this.cameraAnim.targetPos.set(x + 1.15, worldY + 0.32, z + 0.72);
      this.cameraAnim.targetLook.set(x - 0.05, worldY, z - 0.12);
    } else if (part === 'linear_rail') {
      this.cameraAnim.targetPos.set(x + 1.38, worldY + 0.14, z - 0.22);
      this.cameraAnim.targetLook.set(x, worldY, z - 0.22);
    } else if (part === 'motion_controller') {
      this.cameraAnim.targetPos.set(x + 0.92, worldY + 0.24, z - 1.15);
      this.cameraAnim.targetLook.set(x, worldY, z - 0.14);
    } else if (part === 'quick_lock') {
      const topY = this.wallCenterY + ((this.config.rows - 1) / 2) * this.cabPitch;
      this.cameraAnim.targetPos.set(x + 0.85, topY + 0.88, 0.92);
      this.cameraAnim.targetLook.set(x - 0.22, topY + 0.18, -0.05);
    } else {
      // die_cast_cabinet
      this.cameraAnim.targetPos.set(x + 0.95, worldY + 0.22, z + 1.28);
      this.cameraAnim.targetLook.set(x - 0.08, worldY, z * 0.6);
    }

    this.focusMarkerMesh.visible = true;
    this.cameraAnim.active = true;
  }

  private cancelCameraAnimation = () => {
    this.cameraAnim.active = false;
  };

  private handlePointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_pointerNdc, this.camera);
    const hits = _raycaster.intersectObject(this.proxyPlane, false);
    if (hits.length > 0 && hits[0].uv) {
      this.pointerHover.u = hits[0].uv.x;
      this.pointerHover.v = hits[0].uv.y;
      this.pointerHover.active = true;
    } else {
      this.pointerHover.active = false;
    }
  };

  private handlePointerLeave = () => {
    this.pointerHover.active = false;
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLost?.();
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  };

  private updateInstanceMatrices(dt: number) {
    if (
      !this.cabinetBodyMesh ||
      !this.heatsinkMesh ||
      !this.ledFaceMesh ||
      !this.railLeftMesh ||
      !this.railRightMesh ||
      !this.actuatorRodMesh ||
      !this.collarMesh
    ) {
      return;
    }

    const { cols, rows, pattern, maxStrokeMm } = this.config;
    // Scale 250mm physical stroke to dramatic, visibly readable 3D world extrusion (0.58m max)
    const maxStrokeWorld = (maxStrokeMm / 250) * 0.58;
    const dampingRate = Math.min(1, 1 - Math.exp(-8.5 * Math.max(0.001, dt)));

    let sumDepth = 0;
    let idx = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = cols > 1 ? c / (cols - 1) : 0.5;
        const v = rows > 1 ? r / (rows - 1) : 0.5;

        let targetRatio = 0.5;

        if (pattern === 'wave') {
          const w1 = Math.sin(u * Math.PI * 2.1 - this.simTime * 1.75 + v * 1.35);
          const w2 = Math.cos(v * Math.PI * 1.6 + this.simTime * 1.1);
          targetRatio = 0.5 + 0.46 * (w1 * 0.65 + w2 * 0.35);
        } else if (pattern === 'sculpture') {
          const dx = u - 0.5;
          const dy = v - 0.5;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const terrace = Math.sin(dist * 7.5 - this.simTime * 1.05) * 0.5 + 0.5;
          targetRatio = Math.round(terrace * 4) / 4;
        } else if (pattern === 'pulse') {
          const beat = Math.pow(Math.max(0, Math.sin(this.simTime * 2.5)), 3);
          const ring = Math.cos(
            (Math.abs(u - 0.5) + Math.abs(v - 0.5)) * 5.2 - this.simTime * 2.5
          );
          targetRatio = Math.min(1, Math.max(0.05, 0.14 + beat * 0.56 + ring * 0.3));
        } else if (pattern === 'video_depth') {
          if (this.activeVideoEl && this.activeVideoEl.readyState >= 2) {
            const sx = Math.min(23, Math.floor(u * 23.99));
            // Flip V since Canvas Y=0 is top while Three.js row=0 is bottom
            const sy = Math.min(15, Math.floor((1 - v) * 15.99));
            const lum = this.videoLuminanceGrid[sy * 24 + sx] ?? 0.5;
            targetRatio = 0.08 + lum * 0.92;
          } else if (this.config.theme === 'show_prism') {
            const p1 = Math.sin(u * 4.2 + this.simTime * 0.9 + Math.sin(v * 3.1 - this.simTime * 0.6));
            const p2 = Math.cos(v * 5.0 - this.simTime * 1.1 + Math.cos(u * 2.8 + this.simTime * 0.5));
            targetRatio = 0.15 + 0.85 * Math.max(0, Math.min(1, 0.5 + 0.5 * (p1 * 0.55 + p2 * 0.45)));
          } else if (this.config.theme === 'show_organic') {
            const f1 = Math.sin((u + v) * 5.2 - this.simTime * 1.05);
            const dx = u - (0.5 + Math.sin(this.simTime * 0.4) * 0.2);
            const dy = v - 0.5;
            const f2 = Math.cos(Math.sqrt(dx * dx + dy * dy) * 8.5 - this.simTime * 1.35);
            targetRatio = 0.14 + 0.86 * (0.5 + 0.5 * (f1 * 0.5 + f2 * 0.5));
          } else {
            const w1 = Math.sin(u * 6.2831 - this.simTime * 1.15 + v * 2.4);
            const w2 = Math.cos(v * 4.5 + this.simTime * 0.85 - u * 3.1);
            targetRatio = 0.15 + 0.82 * (0.5 + 0.5 * (w1 * 0.55 + w2 * 0.45));
          }
        } else {
          const px = this.pointerHover.active
            ? this.pointerHover.u
            : 0.5 + Math.cos(this.simTime * 0.9) * 0.28;
          const py = this.pointerHover.active
            ? this.pointerHover.v
            : 0.5 + Math.sin(this.simTime * 1.1) * 0.22;
          const dx = u - px;
          const dy = v - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          targetRatio = Math.exp(-dist * dist * 11.0);
        }

        targetRatio = Math.max(0.02, Math.min(1.0, targetRatio));
        const cur = this.currentDepths[idx];
        const nextVal = cur + (targetRatio - cur) * dampingRate;
        this.currentDepths[idx] = nextVal;
        sumDepth += nextVal;

        const x = (c - (cols - 1) / 2) * this.cabPitch;
        const y = (r - (rows - 1) / 2) * this.cabPitch;
        const z = nextVal * maxStrokeWorld;

        // Cabinet Body + LED Face move forward along +Z
        _objPos.set(x, y, z);
        _objQuat.identity();
        _objScale.set(1, 1, 1);
        _mat4.compose(_objPos, _objQuat, _objScale);
        this.cabinetBodyMesh.setMatrixAt(idx, _mat4);

        // Front LED face sits 0.002m in front of cabinet bezel
        _objPos.set(x, y, z + 0.002);
        _mat4.compose(_objPos, _objQuat, _objScale);
        this.ledFaceMesh.setMatrixAt(idx, _mat4);

        // Rear heatsink sits behind cabinet
        _objPos.set(x, y, z - this.cabDepth - 0.024);
        _mat4.compose(_objPos, _objQuat, _objScale);
        this.heatsinkMesh.setMatrixAt(idx, _mat4);

        // Linear bearing collar rides right behind heatsink
        _objPos.set(x, y, z - this.cabDepth - 0.055);
        _mat4.compose(_objPos, _objQuat, _objScale);
        this.collarMesh.setMatrixAt(idx, _mat4);

        // Twin stainless rails & ball-screw rod bridge fixed truss (-0.34) to cabinet rear
        const railCenterZ = -0.34 + (z - this.cabDepth + 0.34) * 0.5;
        const railLenScale = Math.max(0.15, (z - this.cabDepth + 0.34) / 0.68);
        _objScale.set(1, 1, railLenScale);

        _objPos.set(x - 0.13, y + 0.11, railCenterZ);
        _mat4.compose(_objPos, _objQuat, _objScale);
        this.railLeftMesh.setMatrixAt(idx, _mat4);

        _objPos.set(x + 0.13, y - 0.11, railCenterZ);
        _mat4.compose(_objPos, _objQuat, _objScale);
        this.railRightMesh.setMatrixAt(idx, _mat4);

        _objPos.set(x, y, railCenterZ);
        _mat4.compose(_objPos, _objQuat, _objScale);
        this.actuatorRodMesh.setMatrixAt(idx, _mat4);

        const targetRow = Math.floor(rows * 0.52);
        if (c === cols - 1 && r === targetRow) {
          this.focusTargetSample.x = x;
          this.focusTargetSample.y = y;
          this.focusTargetSample.z = z;

          if (this.focusedComponent && this.focusMarkerMesh.visible) {
            if (this.focusedComponent === 'motion_unit') {
              this.focusMarkerMesh.position.set(x, y, railCenterZ + 0.08);
              this.focusMarkerMesh.scale.set(0.28, 0.28, Math.max(0.24, railLenScale * 0.56));
            } else if (this.focusedComponent === 'linear_rail') {
              this.focusMarkerMesh.position.set(x, y, railCenterZ);
              this.focusMarkerMesh.scale.set(0.34, 0.3, Math.max(0.26, railLenScale * 0.68));
            } else if (this.focusedComponent === 'motion_controller') {
              this.focusMarkerMesh.position.set(x, y, z - this.cabDepth - 0.036);
              this.focusMarkerMesh.scale.set(0.38, 0.38, 0.09);
            } else if (this.focusedComponent === 'quick_lock') {
              const topY = ((rows - 1) / 2) * this.cabPitch;
              this.focusMarkerMesh.position.set(x, topY + this.cabSize * 0.5, z - this.cabDepth * 0.5);
              this.focusMarkerMesh.scale.set(0.51, 0.06, 0.14);
            } else {
              this.focusMarkerMesh.position.set(x, y, z - this.cabDepth * 0.5);
              this.focusMarkerMesh.scale.set(0.515, 0.515, 0.13);
            }
          }
        }

        idx++;
      }
    }

    this.cabinetBodyMesh.instanceMatrix.needsUpdate = true;
    this.ledFaceMesh.instanceMatrix.needsUpdate = true;
    this.heatsinkMesh.instanceMatrix.needsUpdate = true;
    this.collarMesh.instanceMatrix.needsUpdate = true;
    this.railLeftMesh.instanceMatrix.needsUpdate = true;
    this.railRightMesh.instanceMatrix.needsUpdate = true;
    this.actuatorRodMesh.instanceMatrix.needsUpdate = true;

    if (this.telemetryElapsed > 0.15 && idx > 0) {
      this.telemetryElapsed = 0;
      const meanMm = Math.round((sumDepth / idx) * maxStrokeMm);
      this.callbacks.onTelemetry?.(meanMm);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.isLoopTimer = true;
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.isLoopTimer = true;
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.isLoopTimer = true;
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastNow) / 1000);
    this.lastNow = now;

    if (this.config.isPlaying) {
      this.simTime += dt * this.config.speedFactor;
      this.ledUniforms.uTime.value = this.simTime;
    }

    this.telemetryElapsed += dt;
    this.videoSampleTimer += dt;
    if (this.activeVideoEl && this.videoSampleTimer > 0.04) {
      this.videoSampleTimer = 0;
      this.sampleVideoFrame();
    }

    this.updateInstanceMatrices(dt);

    // Smoothly damp camera preset transitions
    if (this.cameraAnim.active) {
      _desiredCamPos.copy(this.cameraAnim.targetPos);
      _desiredTarget.copy(this.cameraAnim.targetLook);

      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        _desiredCamPos.x,
        5.5,
        dt
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        _desiredCamPos.y,
        5.5,
        dt
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        _desiredCamPos.z,
        5.5,
        dt
      );

      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        _desiredTarget.x,
        5.5,
        dt
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        _desiredTarget.y,
        5.5,
        dt
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        _desiredTarget.z,
        5.5,
        dt
      );

      if (
        _hitPoint.copy(this.camera.position).distanceTo(_desiredCamPos) < 0.02
      ) {
        this.cameraAnim.active = false;
        this.emitCameraState();
      }
    }

    this.controls.update();

    // Reliably persist user camera orbit/zoom even during OrbitControls damping & wheel scroll
    if (!this.cameraAnim.active) {
      const moved =
        this.camera.position.distanceToSquared(this.camTrackPos) +
        this.controls.target.distanceToSquared(this.camTrackTarget);
      if (moved > 0.00002) {
        this.camTrackPos.copy(this.camera.position);
        this.camTrackTarget.copy(this.controls.target);
        this.camDirty = true;
        this.camSettleElapsed = 0;
        this.camEmitElapsed += dt;
        if (this.camEmitElapsed > 0.18) {
          this.camEmitElapsed = 0;
          this.emitCameraState();
        }
      } else if (this.camDirty) {
        this.camSettleElapsed += dt;
        if (this.camSettleElapsed > 0.12) {
          this.camDirty = false;
          this.camEmitElapsed = 0;
          this.emitCameraState();
        }
      }
    } else {
      this.camTrackPos.copy(this.camera.position);
      this.camTrackTarget.copy(this.controls.target);
    }

    if (this.isSoftwareGl || !this.composer) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.isLoopTimer = false;
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private emitCameraState = () => {
    this.callbacks.onCameraChange?.({
      position: [
        Number(this.camera.position.x.toFixed(3)),
        Number(this.camera.position.y.toFixed(3)),
        Number(this.camera.position.z.toFixed(3)),
      ],
      target: [
        Number(this.controls.target.x.toFixed(3)),
        Number(this.controls.target.y.toFixed(3)),
        Number(this.controls.target.z.toFixed(3)),
      ],
    });
  };

  public dispose() {
    this.disposed = true;
    if (this.isLoopTimer) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }

    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.removeEventListener('pointerleave', this.handlePointerLeave);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.controls.removeEventListener('start', this.cancelCameraAnimation);
    this.controls.removeEventListener('end', this.emitCameraState);

    this.clearWallMeshes();
    this.controls.dispose();
    this.composer?.dispose();
    this.envRT.dispose();
    this.ledTexture.dispose();
    this.activeVideoTex?.dispose();
    this.floorMaps.map.dispose();
    this.floorMaps.roughnessMap.dispose();

    for (const d of this.disposables) {
      d.dispose();
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

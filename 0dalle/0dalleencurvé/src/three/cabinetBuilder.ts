import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CHASSIS_FINISHES,
  CURVATURE_VISUAL_MULTIPLIER,
  evaluatePanelCurve,
  evaluateWingCurve,
  type AssemblyLayerId,
  type ChassisFinishId,
  type DisplayPatternId,
  type PitchTierId,
  type WallMode,
} from '../data/panelSpecs';
import {
  createBeadBlastedCastMap,
  createBrushedMetalMaps,
  createMasterEmitterCanvas,
  createPcbBackplaneTexture,
  createPixiatechMedallionTexture,
  createRearWavyRibMaps,
  createRotaryTabGreenTexture,
  createSlicedEmitterTexture,
} from './proceduralTextures';

// Scale: 1 Three.js unit = 200 mm
// Cabinet = 600 x 337.5 x 29.7 mm => 3.00 x 1.6875 x 0.1485 units
export const CAB_W = 3.0;
export const CAB_H = 1.6875;
export const CAB_D = 0.1485;
export const MOD_W = CAB_W / 2;
export const MOD_H = CAB_H / 2;

export interface ModuleUnitRef {
  id: number; // 0..3
  label: string;
  centerX: number;
  centerY: number;
  tileGroup: THREE.Group;
  emitterGroup: THREE.Group;
  emitterMesh: THREE.Mesh;
  emitterMat: THREE.MeshPhysicalMaterial;
  highlightEdges: THREE.LineSegments;
  highlightMat: THREE.LineBasicMaterial;
  hitProxy: THREE.Mesh;
}

export interface CabinetAssembly {
  root: THREE.Group;
  mountLayer: THREE.Group;
  chassisLayer: THREE.Group;
  modulesLayer: THREE.Group;
  emittersLayer: THREE.Group;
  wireframeOverlayGroup: THREE.Group;
  surroundGroup: THREE.Group;
  surroundCabinets: {
    group: THREE.Group;
    gridCol: number;
    gridRow: number;
    targetPos: THREE.Vector3;
    emitterMat: THREE.MeshPhysicalMaterial;
  }[];
  modules: ModuleUnitRef[];
  chassisMaterial: THREE.MeshPhysicalMaterial;
  trimMaterial: THREE.MeshStandardMaterial;
  machinedSteelMaterial: THREE.MeshStandardMaterial;
  goldPinMaterial: THREE.MeshStandardMaterial;
  mountSteelMaterial: THREE.MeshStandardMaterial;
  cadLineMaterial: THREE.LineBasicMaterial;
  updateFinish: (finishId: ChassisFinishId) => void;
  updatePattern: (pattern: DisplayPatternId, pitch: PitchTierId, wallMode: WallMode) => void;
  updateCurvature: (
    curveLeftDeg: number,
    curveRightDeg: number,
    multiplier?: number,
  ) => void;
  updateSelection: (
    activeLayer: AssemblyLayerId | null,
    selectedModuleIdx: number | null,
    hoveredModuleIdx: number | null,
    showWireframe: boolean,
  ) => void;
  dispose: () => void;
}

type BendScope = 'center' | 'left-wing' | 'right-wing';

interface BendGeometryTarget {
  geo: THREE.BufferGeometry;
  basePos: Float32Array;
  baseNorm: Float32Array | null;
  zOffset: number;
  recomputeBounds: boolean;
  scope: BendScope;
}

interface RigidBendTarget {
  obj: THREE.Object3D;
  baseX: number;
  baseY: number;
  baseZ: number;
  parentZOffset: number;
  baseRotY: number;
  scope: BendScope;
}

export function buildCabinetAssembly(
  maxAnisotropy: number,
  initialFinish: ChassisFinishId,
  initialPattern: DisplayPatternId,
  initialPitch: PitchTierId,
  initialWallMode: WallMode,
  onTextureLoaded?: () => void,
): CabinetAssembly {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const bendTargets: BendGeometryTarget[] = [];
  const rigidTargets: RigidBendTarget[] = [];

  const registerBendGeometry = (
    geo: THREE.BufferGeometry,
    zOffset = 0,
    recomputeBounds = false,
    scope: BendScope = 'center',
  ) => {
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
    bendTargets.push({
      geo,
      basePos: new Float32Array(posAttr.array as Float32Array),
      baseNorm: normAttr ? new Float32Array(normAttr.array as Float32Array) : null,
      zOffset,
      recomputeBounds,
      scope,
    });
  };

  const registerRigidTarget = (
    obj: THREE.Object3D,
    baseX: number,
    baseY: number,
    baseZ: number,
    parentZOffset = 0,
    baseRotY = 0,
    scope: BendScope = 'center',
  ) => {
    rigidTargets.push({ obj, baseX, baseY, baseZ, parentZOffset, baseRotY, scope });
  };

  const { bumpMap, roughnessMap } = createBrushedMetalMaps(maxAnisotropy);
  const castBumpMap = track(createBeadBlastedCastMap(maxAnisotropy));
  const rearRibMaps = createRearWavyRibMaps(maxAnisotropy);
  const rotaryGreenTex = track(createRotaryTabGreenTexture(maxAnisotropy));
  track(bumpMap);
  track(roughnessMap);
  track(rearRibMaps.bumpMap);
  track(rearRibMaps.roughnessMap);

  const pcbTex = track(createPcbBackplaneTexture(maxAnisotropy));
  const medallionTex = track(createPixiatechMedallionTexture(maxAnisotropy, onTextureLoaded));
  const finish = CHASSIS_FINISHES[initialFinish];

  const chassisMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(finish.chassisHex),
      roughness: finish.roughness,
      metalness: finish.metalness,
      bumpMap,
      bumpScale: 0.004,
      roughnessMap,
      anisotropy: 0.55,
      clearcoat: 0.16,
      clearcoatRoughness: 0.32,
      envMapIntensity: 1.55,
    }),
  );

  const rearBackplateMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#161920'),
      roughness: 0.64,
      metalness: 0.18,
      bumpMap: rearRibMaps.bumpMap,
      bumpScale: 0.036,
      roughnessMap: rearRibMaps.roughnessMap,
      envMapIntensity: 1.15,
    }),
  );

  const trimMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(finish.trimHex),
      roughness: 0.25,
      metalness: 0.9,
      bumpMap,
      bumpScale: 0.003,
      envMapIntensity: 1.6,
    }),
  );

  const darkRecessMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#14171D'),
      roughness: 0.48,
      metalness: 0.65,
      bumpMap: castBumpMap,
      bumpScale: 0.003,
    }),
  );

  const greenGripMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#27E351'),
      roughness: 0.36,
      metalness: 0.08,
      clearcoat: 0.28,
      clearcoatRoughness: 0.25,
    }),
  );

  const rotaryGreenTabMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: rotaryGreenTex,
      roughness: 0.4,
      metalness: 0.18,
    }),
  );

  const yellowGuideMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FACC15'),
      roughness: 0.28,
      metalness: 0.45,
    }),
  );

  const machinedSteelMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#B8C0CC'),
      roughness: 0.22,
      metalness: 0.94,
      bumpMap,
      bumpScale: 0.002,
    }),
  );

  const goldPinMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#E3A84B'),
      roughness: 0.18,
      metalness: 0.95,
    }),
  );

  const pcbMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: pcbTex,
      roughness: 0.52,
      metalness: 0.25,
    }),
  );

  const mountSteelMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#232730'),
      roughness: 0.34,
      metalness: 0.88,
      bumpMap,
      bumpScale: 0.003,
    }),
  );

  const medallionMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: medallionTex,
      roughness: 0.22,
      metalness: 0.45,
      clearcoat: 0.88,
      clearcoatRoughness: 0.1,
    }),
  );

  const cadLineMaterial = track(
    new THREE.LineBasicMaterial({
      color: new THREE.Color('#F59E0B'),
      transparent: true,
      opacity: 0.0,
    }),
  );

  const root = new THREE.Group();
  root.name = 'pixiatech-cabinet-assembly';

  const mountLayer = new THREE.Group();
  mountLayer.name = 'layer-mount';
  const chassisLayer = new THREE.Group();
  chassisLayer.name = 'layer-chassis';
  const modulesLayer = new THREE.Group();
  modulesLayer.name = 'layer-modules';
  const emittersLayer = new THREE.Group();
  emittersLayer.name = 'layer-emitters';
  const wireframeOverlayGroup = new THREE.Group();
  wireframeOverlayGroup.name = 'cad-wireframe-overlay';

  root.add(mountLayer, chassisLayer, modulesLayer, emittersLayer, wireframeOverlayGroup);

  // ---------------------------------------------------------------------------
  // 1. MOUNT LAYER: Architectural Wall Subframe Rails + Laser Datum Collars
  // ---------------------------------------------------------------------------
  const railGeo = track(new THREE.BoxGeometry(0.065, CAB_H * 0.84, 0.02));
  [-1.02, 1.02].forEach((rx) => {
    const rail = new THREE.Mesh(railGeo, mountSteelMaterial);
    rail.position.set(rx, 0, -0.025);
    rail.castShadow = true;
    rail.receiveShadow = true;
    mountLayer.add(rail);
    registerRigidTarget(rail, rx, 0, -0.025);
  });

  const crossRailGeo = track(new THREE.BoxGeometry(CAB_W * 0.84, 0.045, 0.016, 48, 1, 1));
  [-0.48, 0.48].forEach((ry) => {
    const barGeo = track(crossRailGeo.clone());
    barGeo.translate(0, ry, -0.022);
    const bar = new THREE.Mesh(barGeo, mountSteelMaterial);
    bar.castShadow = true;
    mountLayer.add(bar);
    registerBendGeometry(barGeo, 0);
  });

  const datumGeo = track(new THREE.CylinderGeometry(0.036, 0.042, 0.028, 24));
  datumGeo.rotateX(Math.PI / 2);
  [
    [-1.02, 0.48],
    [1.02, 0.48],
    [-1.02, -0.48],
    [1.02, -0.48],
  ].forEach(([dx, dy]) => {
    const collar = new THREE.Mesh(datumGeo, machinedSteelMaterial);
    collar.position.set(dx, dy, -0.016);
    mountLayer.add(collar);
    registerRigidTarget(collar, dx, dy, -0.016);
  });

  // ---------------------------------------------------------------------------
  // 2. CHASSIS LAYER: Sculpted Satin-Alloy Die-Cast Frame + Matte Wavy Shell
  //    + Ergonomic Green Grips + Rotary Quick-Locks + Central PIXIATECH Spine
  // ---------------------------------------------------------------------------
  const frameOuterW = CAB_W + 0.016;
  const frameOuterH = CAB_H + 0.016;
  const frameRim = 0.098;
  const frameDepth = 0.092;
  const frameZCenter = -0.014;
  const stileGapHalfY = 0.36;
  const stileSegmentH = (frameOuterH - 2 * frameRim) / 2 - stileGapHalfY;

  const topRailGeo = new THREE.BoxGeometry(frameOuterW, frameRim, frameDepth, 48, 2, 2);
  topRailGeo.translate(0, frameOuterH / 2 - frameRim / 2, frameZCenter);
  const bottomRailGeo = new THREE.BoxGeometry(frameOuterW, frameRim, frameDepth, 48, 2, 2);
  bottomRailGeo.translate(0, -frameOuterH / 2 + frameRim / 2, frameZCenter);

  // Build horizontal rails into bendable perimeter frame + rigid left/right stiles around handle pockets
  const heroRailsGeo = mergeGeometries([topRailGeo, bottomRailGeo], false);
  topRailGeo.dispose();
  bottomRailGeo.dispose();
  if (!heroRailsGeo) {
    throw new Error('Impossible de fusionner les longerons du châssis.');
  }
  const outerFrameGeo = track(heroRailsGeo);
  registerBendGeometry(outerFrameGeo, 0);

  const heroRailsMesh = new THREE.Mesh(outerFrameGeo, chassisMaterial);
  heroRailsMesh.castShadow = true;
  heroRailsMesh.receiveShadow = true;
  chassisLayer.add(heroRailsMesh);

  // Recessed Matte-Black Wavy-Ribbed Inner Shell
  const backWebGeo = track(new THREE.BoxGeometry(CAB_W - 0.16, CAB_H - 0.14, 0.022, 48, 8, 1));
  backWebGeo.translate(0, 0, -0.028);
  registerBendGeometry(backWebGeo, 0);

  const heroBackWebMesh = new THREE.Mesh(backWebGeo, rearBackplateMaterial);
  heroBackWebMesh.castShadow = true;
  heroBackWebMesh.receiveShadow = true;
  chassisLayer.add(heroBackWebMesh);

  // Sculpted Shared Hardware Geometries (used on both Hero & Surround Cabinets)
  const sideStileSegGeo = track(new THREE.BoxGeometry(frameRim, stileSegmentH, frameDepth, 2, 2, 2));
  const sidePocketBackGeo = track(new THREE.BoxGeometry(frameRim * 0.72, stileGapHalfY * 2 + 0.04, 0.044));
  const sideHandleBridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.36, -0.03),
    new THREE.Vector3(0, -0.24, -0.105),
    new THREE.Vector3(0, 0.24, -0.105),
    new THREE.Vector3(0, 0.36, -0.03),
  ]);
  const sideHandleBridgeGeo = track(new THREE.TubeGeometry(sideHandleBridgeCurve, 24, 0.032, 12, false));
  const sideGripSleeveGeo = track(new THREE.CapsuleGeometry(0.036, 0.29, 8, 16));

  const topHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 0, -0.03),
    new THREE.Vector3(-0.26, 0.115, -0.055),
    new THREE.Vector3(0.26, 0.115, -0.055),
    new THREE.Vector3(0.34, 0, -0.03),
  ]);
  const topHandleGeo = track(new THREE.TubeGeometry(topHandleCurve, 28, 0.022, 12, false));
  const topHandleMountGeo = track(new THREE.CylinderGeometry(0.032, 0.038, 0.045, 16));

  // Corner chamfered curve-lock blocks, side toggle latches & yellow alignment pins
  const cornerBlockGeo = track(new THREE.BoxGeometry(0.16, 0.11, 0.052));
  const sideLatchBodyGeo = track(new THREE.BoxGeometry(0.11, 0.11, 0.048));
  const sideLatchHookGeo = track(new THREE.BoxGeometry(0.065, 0.022, 0.018));
  const yellowPinGeo = track(new THREE.CylinderGeometry(0.02, 0.02, 0.016, 16));
  yellowPinGeo.rotateZ(Math.PI / 2);

  // Horizontal articulated tension bars (hero bendable + surround static)
  const wingArmLen = 1.12;
  const baseTensionArmGeo = track(new THREE.CylinderGeometry(0.026, 0.03, wingArmLen, 16, 20));
  baseTensionArmGeo.rotateZ(Math.PI / 2);
  const armCollarGeo = track(new THREE.CylinderGeometry(0.035, 0.035, 0.022, 16));
  armCollarGeo.rotateZ(Math.PI / 2);

  // Rotary Quick-Lock Assemblies with Green Striped Trigger Tabs
  const rotaryBarrelGeo = track(new THREE.CylinderGeometry(0.044, 0.048, 0.042, 20));
  rotaryBarrelGeo.rotateX(Math.PI / 2);
  const rotaryShaftGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 0.052, 14));
  rotaryShaftGeo.rotateX(Math.PI / 2);
  const rotaryArmGeo = track(new THREE.BoxGeometry(0.125, 0.036, 0.022));
  const rotaryTabGeo = track(new THREE.BoxGeometry(0.088, 0.078, 0.018));

  // Upper & lower secondary curve-lock latches
  const curveCamBodyGeo = track(new THREE.BoxGeometry(0.075, 0.075, 0.038));
  const curveCamTabGeo = track(new THREE.BoxGeometry(0.055, 0.065, 0.016));
  const lowerClipGeo = track(new THREE.BoxGeometry(0.055, 0.036, 0.026));

  // Central Sculpted Power/Controller Spine Housing (x = 0)
  const spineShape = new THREE.Shape();
  const sw = 0.22;
  const sh = 0.67;
  const sc = 0.075;
  spineShape.moveTo(-sw + sc, -sh);
  spineShape.lineTo(sw - sc, -sh);
  spineShape.lineTo(sw, -sh + sc * 1.4);
  spineShape.lineTo(sw, sh - sc * 1.4);
  spineShape.lineTo(sw - sc, sh);
  spineShape.lineTo(-sw + sc, sh);
  spineShape.lineTo(-sw, sh - sc * 1.4);
  spineShape.lineTo(-sw, -sh + sc * 1.4);
  spineShape.closePath();

  const centralSpineGeo = track(
    new THREE.ExtrudeGeometry(spineShape, {
      depth: 0.125,
      bevelEnabled: true,
      bevelThickness: 0.024,
      bevelSize: 0.024,
      bevelSegments: 3,
    }),
  );
  centralSpineGeo.rotateY(Math.PI);
  centralSpineGeo.translate(0, 0, -0.024);

  const louverWellGeo = track(new THREE.BoxGeometry(0.24, 0.34, 0.012));
  const louverFinGeo = track(new THREE.BoxGeometry(0.01, 0.32, 0.016));
  const spineCenterPlateGeo = track(new THREE.BoxGeometry(0.28, 0.36, 0.014));
  const spineAccentBarGeo = track(new THREE.BoxGeometry(0.135, 0.022, 0.012));
  const spineHingeGeo = track(new THREE.BoxGeometry(0.055, 0.085, 0.068));
  const spineSideSlotGeo = track(new THREE.BoxGeometry(0.024, 0.22, 0.05));
  const spineButtonGeo = track(new THREE.CylinderGeometry(0.024, 0.026, 0.016, 18));
  spineButtonGeo.rotateX(Math.PI / 2);

  const hubCollarGeo = track(new THREE.CylinderGeometry(0.148, 0.158, 0.018, 40));
  hubCollarGeo.rotateX(Math.PI / 2);
  const medallionGeo = track(new THREE.CircleGeometry(0.138, 48));
  medallionGeo.rotateY(Math.PI);

  const buildCentralSpineGroup = (): THREE.Group => {
    const spineGroup = new THREE.Group();

    const body = new THREE.Mesh(centralSpineGeo, chassisMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    spineGroup.add(body);

    const centerPlate = new THREE.Mesh(spineCenterPlateGeo, trimMaterial);
    centerPlate.position.set(0, 0, -0.172);
    spineGroup.add(centerPlate);

    for (const ly of [0.38, -0.38]) {
      const well = new THREE.Mesh(louverWellGeo, darkRecessMaterial);
      well.position.set(0, ly, -0.174);
      spineGroup.add(well);

      for (let f = -4; f <= 4; f++) {
        const fin = new THREE.Mesh(louverFinGeo, trimMaterial);
        fin.position.set(f * 0.022, ly, -0.181);
        spineGroup.add(fin);
      }
    }

    for (const ay of [0.165, -0.165]) {
      const bar = new THREE.Mesh(spineAccentBarGeo, greenGripMaterial);
      bar.position.set(0, ay, -0.181);
      spineGroup.add(bar);
    }

    for (const hx of [-0.24, 0.24]) {
      for (const hy of [0.34, -0.34]) {
        const hinge = new THREE.Mesh(spineHingeGeo, darkRecessMaterial);
        hinge.position.set(hx, hy, -0.095);
        spineGroup.add(hinge);
      }
    }

    const sideSlot = new THREE.Mesh(spineSideSlotGeo, darkRecessMaterial);
    sideSlot.position.set(-0.238, 0, -0.105);
    spineGroup.add(sideSlot);

    const statusBtn = new THREE.Mesh(spineButtonGeo, greenGripMaterial);
    statusBtn.position.set(0.08, -0.585, -0.178);
    spineGroup.add(statusBtn);

    const collar = new THREE.Mesh(hubCollarGeo, darkRecessMaterial);
    collar.position.set(0, 0, -0.182);
    spineGroup.add(collar);

    const medallion = new THREE.Mesh(medallionGeo, medallionMaterial);
    medallion.position.set(0, 0, -0.192);
    spineGroup.add(medallion);

    return spineGroup;
  };

  const buildRotaryLockGroup = (dirX: number, dirY: number): THREE.Group => {
    const g = new THREE.Group();
    const barrel = new THREE.Mesh(rotaryBarrelGeo, trimMaterial);
    g.add(barrel);
    const shaft = new THREE.Mesh(rotaryShaftGeo, machinedSteelMaterial);
    shaft.position.set(0, 0, -0.015);
    g.add(shaft);
    const arm = new THREE.Mesh(rotaryArmGeo, trimMaterial);
    arm.position.set(-dirX * 0.05, -dirY * 0.012, -0.028);
    arm.rotation.z = dirX * dirY * 0.25;
    g.add(arm);
    const tab = new THREE.Mesh(rotaryTabGeo, rotaryGreenTabMaterial);
    tab.position.set(-dirX * 0.1, -dirY * 0.032, -0.032);
    tab.rotation.z = dirX * dirY * 0.25;
    g.add(tab);
    return g;
  };

  const populateSculptedHardware = (
    targetGroup: THREE.Group,
    trackRigid: boolean,
    rigidScope: BendScope = 'center',
  ) => {
    const addObj = (obj: THREE.Object3D, bx: number, by: number, bz: number, rotY = 0) => {
      obj.position.set(bx, by, bz);
      obj.rotation.y = rotY;
      targetGroup.add(obj);
      if (trackRigid) {
        registerRigidTarget(obj, bx, by, bz, 0, rotY, rigidScope);
      }
    };

    // Left & Right Sculpted Side Stiles + Pocket + Ergonomic Green Grip Handles
    for (const sxSign of [-1, 1]) {
      const stileX = sxSign * (frameOuterW / 2 - frameRim / 2);
      const segY = stileGapHalfY + stileSegmentH / 2;

      for (const sySign of [-1, 1]) {
        const seg = new THREE.Mesh(sideStileSegGeo, chassisMaterial);
        seg.castShadow = true;
        seg.receiveShadow = true;
        addObj(seg, stileX, sySign * segY, frameZCenter);
      }

      const pocket = new THREE.Mesh(sidePocketBackGeo, darkRecessMaterial);
      addObj(pocket, stileX + sxSign * 0.012, 0, -0.005);

      const bridge = new THREE.Mesh(sideHandleBridgeGeo, chassisMaterial);
      bridge.castShadow = true;
      addObj(bridge, stileX - sxSign * 0.01, 0, 0);

      const grip = new THREE.Mesh(sideGripSleeveGeo, greenGripMaterial);
      addObj(grip, stileX - sxSign * 0.01, 0, -0.105);

      // Corner chamfered lock blocks
      for (const cySign of [-1, 1]) {
        const cBlock = new THREE.Mesh(cornerBlockGeo, darkRecessMaterial);
        cBlock.rotation.z = sxSign * cySign * 0.65;
        addObj(cBlock, sxSign * (CAB_W / 2 - 0.11), cySign * (CAB_H / 2 - 0.075), -0.068);
      }

      // Side quick-lock toggle latches (as seen on right rail of reference)
      for (const ly of [-0.42, 0.42]) {
        const latch = new THREE.Mesh(sideLatchBodyGeo, trimMaterial);
        addObj(latch, sxSign * (CAB_W / 2 - 0.03), ly, -0.072);
        const hook = new THREE.Mesh(sideLatchHookGeo, darkRecessMaterial);
        addObj(hook, sxSign * (CAB_W / 2 - 0.03), ly - 0.04, -0.095);
      }

      // Yellow edge alignment pins
      for (const py of [-0.63, 0.63]) {
        const yPin = new THREE.Mesh(yellowPinGeo, yellowGuideMaterial);
        addObj(yPin, sxSign * (CAB_W / 2 + 0.009), py, -0.015);
      }

      // Horizontal tension arm machined chevron collars
      for (const cx of [1.14, 1.2, 1.26]) {
        const collar = new THREE.Mesh(armCollarGeo, darkRecessMaterial);
        addObj(collar, sxSign * cx, 0, -0.062);
      }
    }

    // Top Bridge Handle at x = 0
    const topBridge = new THREE.Mesh(topHandleGeo, darkRecessMaterial);
    addObj(topBridge, 0, CAB_H / 2 - 0.005, -0.045);
    for (const mx of [-0.34, 0.34]) {
      const mnt = new THREE.Mesh(topHandleMountGeo, chassisMaterial);
      addObj(mnt, mx, CAB_H / 2 - 0.01, -0.065);
    }

    // 4 Corner-Inset Rotary Quick-Locks with Green Striped Tabs
    for (const lxSign of [-1, 1]) {
      for (const lySign of [-1, 1]) {
        const lockG = buildRotaryLockGroup(lxSign, lySign);
        addObj(lockG, lxSign * 1.12, lySign * 0.56, -0.056);
      }
    }

    // 2 Upper Curve-Lock Levers & 2 Lower Green Alignment Clips
    for (const cxSign of [-1, 1]) {
      const camG = new THREE.Group();
      const camBody = new THREE.Mesh(curveCamBodyGeo, trimMaterial);
      camG.add(camBody);
      const camTab = new THREE.Mesh(curveCamTabGeo, rotaryGreenTabMaterial);
      camTab.position.set(0, -0.045, -0.02);
      camG.add(camTab);
      addObj(camG, cxSign * 0.72, CAB_H / 2 - 0.13, -0.065);

      const lowerClip = new THREE.Mesh(lowerClipGeo, greenGripMaterial);
      addObj(lowerClip, cxSign * 0.72, -CAB_H / 2 + 0.09, -0.068);
    }

    // Central Sculpted Spine + PIXIATECH Logo
    addObj(buildCentralSpineGroup(), 0, 0, 0);
  };

  // Populate Hero Rear Sculpted Hardware + Bendable Tension Cross-Bars
  populateSculptedHardware(chassisLayer, true);

  const heroArmGeos: THREE.BufferGeometry[] = [];
  for (const armSign of [-1, 1]) {
    const armGeo = track(baseTensionArmGeo.clone());
    armGeo.translate(armSign * 0.8, 0, -0.062);
    registerBendGeometry(armGeo, 0);
    heroArmGeos.push(armGeo);
    const armMesh = new THREE.Mesh(armGeo, trimMaterial);
    armMesh.castShadow = true;
    chassisLayer.add(armMesh);
  }

  // Internal cross-ribs separating the 4 module bays on the front side (primary cabinet)
  const vRibGeo = track(new THREE.BoxGeometry(0.048, CAB_H - 0.12, 0.032));
  const vRib = new THREE.Mesh(vRibGeo, trimMaterial);
  vRib.position.set(0, 0, -0.006);
  chassisLayer.add(vRib);

  const hRibGeo = track(new THREE.BoxGeometry(CAB_W - 0.12, 0.048, 0.032, 48, 1, 1));
  hRibGeo.translate(0, 0, -0.006);
  const hRib = new THREE.Mesh(hRibGeo, trimMaterial);
  chassisLayer.add(hRib);
  registerBendGeometry(hRibGeo, 0);

  // Exposed interior bay hardware (visible when a module slides forward)
  const baseBayBackGeo = track(new THREE.BoxGeometry(MOD_W - 0.12, MOD_H - 0.12, 0.006, 24, 2, 1));
  const bayContactBlockGeo = track(new THREE.BoxGeometry(0.18, 0.068, 0.014));
  const bayReceiverPinGeo = track(new THREE.CylinderGeometry(0.014, 0.014, 0.016, 14));
  bayReceiverPinGeo.rotateX(Math.PI / 2);
  const bayMagnetSeatGeo = track(new THREE.CylinderGeometry(0.028, 0.03, 0.014, 16));
  bayMagnetSeatGeo.rotateX(Math.PI / 2);

  const bayCenters: [number, number][] = [
    [-MOD_W / 2, MOD_H / 2],
    [MOD_W / 2, MOD_H / 2],
    [-MOD_W / 2, -MOD_H / 2],
    [MOD_W / 2, -MOD_H / 2],
  ];

  bayCenters.forEach(([bx, by]) => {
    const bayBackGeo = track(baseBayBackGeo.clone());
    bayBackGeo.translate(bx, by, -0.018);
    const bayBack = new THREE.Mesh(bayBackGeo, pcbMaterial);
    chassisLayer.add(bayBack);
    registerBendGeometry(bayBackGeo, 0);

    const block = new THREE.Mesh(bayContactBlockGeo, trimMaterial);
    block.position.set(bx, by, -0.012);
    chassisLayer.add(block);
    registerRigidTarget(block, bx, by, -0.012);

    [
      [-0.44, 0.2],
      [0.44, 0.2],
      [-0.44, -0.2],
      [0.44, -0.2],
    ].forEach(([px, py]) => {
      const rxPin = new THREE.Mesh(bayReceiverPinGeo, goldPinMaterial);
      rxPin.position.set(bx + px, by + py, -0.011);
      chassisLayer.add(rxPin);
      registerRigidTarget(rxPin, bx + px, by + py, -0.011);
    });

    [
      [-0.58, 0.3],
      [0.58, 0.3],
      [-0.58, -0.3],
      [0.58, -0.3],
    ].forEach(([mx, my]) => {
      const seat = new THREE.Mesh(bayMagnetSeatGeo, machinedSteelMaterial);
      seat.position.set(bx + mx, by + my, -0.011);
      chassisLayer.add(seat);
      registerRigidTarget(seat, bx + mx, by + my, -0.011);
    });
  });

  const chassisEdges = track(new THREE.EdgesGeometry(outerFrameGeo, 20));
  registerBendGeometry(chassisEdges, 0);
  const chassisWire = new THREE.LineSegments(chassisEdges, cadLineMaterial);
  wireframeOverlayGroup.add(chassisWire);

  // ---------------------------------------------------------------------------
  // 3. MODULES & EMITTERS LAYERS: 4 Flexible Magnetic Optical Modules (300 x 168.75 mm)
  // ---------------------------------------------------------------------------
  const masterCanvas = createMasterEmitterCanvas(initialPattern, initialPitch);
  const modules: ModuleUnitRef[] = [];
  const baseTrayGeo = track(new THREE.BoxGeometry(MOD_W - 0.012, MOD_H - 0.012, 0.026, 28, 2, 1));
  const basePcbGeo = track(new THREE.BoxGeometry(MOD_W - 0.06, MOD_H - 0.06, 0.008, 24, 2, 1));
  const pinGeo = track(new THREE.CylinderGeometry(0.01, 0.01, 0.018, 12));
  pinGeo.rotateX(Math.PI / 2);
  const magnetGeo = track(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 16));
  magnetGeo.rotateX(Math.PI / 2);
  const baseEmitterGeo = track(new THREE.BoxGeometry(MOD_W, MOD_H, 0.014, 32, 2, 1));
  const baseHitProxyGeo = track(new THREE.BoxGeometry(MOD_W - 0.004, MOD_H - 0.004, 0.08, 16, 2, 1));
  const hitProxyMat = track(new THREE.MeshBasicMaterial({ visible: false }));

  const quadPositions: [number, number, number, number][] = [
    [-MOD_W / 2, MOD_H / 2, 0, 1], // M1 Top-Left
    [MOD_W / 2, MOD_H / 2, 1, 1], // M2 Top-Right
    [-MOD_W / 2, -MOD_H / 2, 0, 0], // M3 Bottom-Left
    [MOD_W / 2, -MOD_H / 2, 1, 0], // M4 Bottom-Right
  ];

  const getModuleUVRect = (modCol: number, modRowFromBottom: number, mode: WallMode) => {
    if (mode === 'object') {
      return {
        uOffset: modCol * 0.5,
        vOffset: modRowFromBottom * 0.5,
        uSpan: 0.5,
        vSpan: 0.5,
      };
    }
    return {
      uOffset: 1 / 3 + modCol * (1 / 6),
      vOffset: modRowFromBottom * 0.25,
      uSpan: 1 / 6,
      vSpan: 0.25,
    };
  };

  quadPositions.forEach(([qx, qy, modCol, modRowFromBottom], idx) => {
    const tileGroup = new THREE.Group();
    tileGroup.position.set(0, qy, 0.022);

    const trayGeo = track(baseTrayGeo.clone());
    trayGeo.translate(qx, 0, 0);
    registerBendGeometry(trayGeo, 0.022);
    const tray = new THREE.Mesh(trayGeo, trimMaterial);
    tray.castShadow = true;
    tray.receiveShadow = true;
    tileGroup.add(tray);

    const pcbGeo = track(basePcbGeo.clone());
    pcbGeo.translate(qx, 0, -0.015);
    registerBendGeometry(pcbGeo, 0.022);
    const pcb = new THREE.Mesh(pcbGeo, pcbMaterial);
    tileGroup.add(pcb);

    [
      [-0.44, 0.2],
      [0.44, 0.2],
      [-0.44, -0.2],
      [0.44, -0.2],
    ].forEach(([px, py]) => {
      const pin = new THREE.Mesh(pinGeo, goldPinMaterial);
      pin.position.set(qx + px, py, -0.021);
      tileGroup.add(pin);
      registerRigidTarget(pin, qx + px, py, -0.021, 0.022);
    });

    [
      [-0.58, 0.3],
      [0.58, 0.3],
      [-0.58, -0.3],
      [0.58, -0.3],
    ].forEach(([mx, my]) => {
      const mag = new THREE.Mesh(magnetGeo, machinedSteelMaterial);
      mag.position.set(qx + mx, my, -0.018);
      tileGroup.add(mag);
      registerRigidTarget(mag, qx + mx, my, -0.018, 0.022);
    });

    modulesLayer.add(tileGroup);

    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(0, qy, 0.044);

    const uv = getModuleUVRect(modCol, modRowFromBottom, initialWallMode);
    const emitterTex = track(
      createSlicedEmitterTexture(
        masterCanvas,
        uv.uOffset,
        uv.vOffset,
        uv.uSpan,
        uv.vSpan,
        maxAnisotropy,
      ),
    );
    const emitterMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: emitterTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: emitterTex,
        emissiveIntensity: initialPattern === 'off' ? 0.0 : 0.82,
        roughness: 0.2,
        metalness: 0.06,
        clearcoat: 0.92,
        clearcoatRoughness: 0.12,
      }),
    );

    const emitterGeo = track(baseEmitterGeo.clone());
    emitterGeo.translate(qx, 0, 0);
    registerBendGeometry(emitterGeo, 0.044);
    const emitterMesh = new THREE.Mesh(emitterGeo, emitterMat);
    emitterMesh.castShadow = true;
    emitterMesh.receiveShadow = true;
    emitterGroup.add(emitterMesh);

    const highlightMat = track(
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#F59E0B'),
        transparent: true,
        opacity: 0.0,
      }),
    );
    const emitterEdgesGeo = track(new THREE.EdgesGeometry(emitterGeo, 15));
    emitterEdgesGeo.scale(1.002, 1.002, 1.04);
    registerBendGeometry(emitterEdgesGeo, 0.044);
    const highlightEdges = new THREE.LineSegments(emitterEdgesGeo, highlightMat);
    highlightEdges.visible = false;
    emitterGroup.add(highlightEdges);

    const hitProxyGeo = track(baseHitProxyGeo.clone());
    hitProxyGeo.translate(qx, 0, 0);
    registerBendGeometry(hitProxyGeo, 0.044, true);
    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.userData = { moduleIndex: idx };
    hitProxy.layers.set(1);
    emitterGroup.add(hitProxy);

    emittersLayer.add(emitterGroup);

    modules.push({
      id: idx,
      label: `Module M${idx + 1} · 300 × 168,8 mm`,
      centerX: qx,
      centerY: qy,
      tileGroup,
      emitterGroup,
      emitterMesh,
      emitterMat,
      highlightEdges,
      highlightMat,
      hitProxy,
    });
  });

  // ---------------------------------------------------------------------------
  // 4. SURFACE ARRAY MODE (3x2 Architectural Wall = 5 Bendable Rear-Sculpted Cabinets)
  // ---------------------------------------------------------------------------
  const surroundGroup = new THREE.Group();
  surroundGroup.name = 'surface-array-surround';
  root.add(surroundGroup);

  const buildSubdividedRailsGeo = () => {
    const tRail = new THREE.BoxGeometry(frameOuterW, frameRim, frameDepth, 48, 2, 2);
    tRail.translate(0, frameOuterH / 2 - frameRim / 2, frameZCenter);
    const bRail = new THREE.BoxGeometry(frameOuterW, frameRim, frameDepth, 48, 2, 2);
    bRail.translate(0, -frameOuterH / 2 + frameRim / 2, frameZCenter);
    const merged = mergeGeometries([tRail, bRail], false);
    tRail.dispose();
    bRail.dispose();
    if (!merged) {
      throw new Error('Impossible de fusionner les longerons du châssis latéral.');
    }
    return track(merged);
  };

  interface WingGeoSet {
    railsGeo: THREE.BufferGeometry;
    backWebGeo: THREE.BufferGeometry;
    armGeos: THREE.BufferGeometry[];
    trayGeo: THREE.BufferGeometry;
    faceGeo: THREE.BufferGeometry;
  }

  const createWingGeoSet = (scope: 'left-wing' | 'right-wing'): WingGeoSet => {
    const railsGeo = buildSubdividedRailsGeo();
    registerBendGeometry(railsGeo, 0, false, scope);

    const wingBackGeo = track(
      new THREE.BoxGeometry(CAB_W - 0.16, CAB_H - 0.14, 0.022, 48, 8, 1),
    );
    wingBackGeo.translate(0, 0, -0.028);
    registerBendGeometry(wingBackGeo, 0, false, scope);

    const armGeos: THREE.BufferGeometry[] = [];
    for (const armSign of [-1, 1]) {
      const aGeo = track(baseTensionArmGeo.clone());
      aGeo.translate(armSign * 0.8, 0, -0.062);
      registerBendGeometry(aGeo, 0, false, scope);
      armGeos.push(aGeo);
    }

    const trayGeo = track(
      new THREE.BoxGeometry(CAB_W - 0.006, CAB_H - 0.006, 0.026, 48, 2, 1),
    );
    registerBendGeometry(trayGeo, 0.022, false, scope);

    const faceGeo = track(new THREE.BoxGeometry(CAB_W, CAB_H, 0.014, 48, 2, 1));
    registerBendGeometry(faceGeo, 0.044, false, scope);

    return { railsGeo, backWebGeo: wingBackGeo, armGeos, trayGeo, faceGeo };
  };

  const centerTopTrayGeo = track(
    new THREE.BoxGeometry(CAB_W - 0.006, CAB_H - 0.006, 0.026, 48, 2, 1),
  );
  registerBendGeometry(centerTopTrayGeo, 0.022, false, 'center');

  const centerTopFaceGeo = track(new THREE.BoxGeometry(CAB_W, CAB_H, 0.014, 48, 2, 1));
  registerBendGeometry(centerTopFaceGeo, 0.044, false, 'center');

  const centerTopGeoSet: WingGeoSet = {
    railsGeo: outerFrameGeo,
    backWebGeo,
    armGeos: heroArmGeos,
    trayGeo: centerTopTrayGeo,
    faceGeo: centerTopFaceGeo,
  };

  const leftWingGeoSet = createWingGeoSet('left-wing');
  const rightWingGeoSet = createWingGeoSet('right-wing');

  const populateSurroundRearChassis = (
    targetGroup: THREE.Group,
    geoSet: WingGeoSet,
    scope: BendScope,
  ) => {
    const railsMesh = new THREE.Mesh(geoSet.railsGeo, chassisMaterial);
    railsMesh.castShadow = true;
    railsMesh.receiveShadow = true;
    targetGroup.add(railsMesh);

    const backWebMesh = new THREE.Mesh(geoSet.backWebGeo, rearBackplateMaterial);
    backWebMesh.castShadow = true;
    backWebMesh.receiveShadow = true;
    targetGroup.add(backWebMesh);

    populateSculptedHardware(targetGroup, true, scope);

    for (const armGeo of geoSet.armGeos) {
      const arm = new THREE.Mesh(armGeo, trimMaterial);
      arm.castShadow = true;
      targetGroup.add(arm);
    }
  };

  const gridConfigs: [number, number, number, number][] = [
    [-CAB_W, 0, 0, 0],
    [CAB_W, 0, 2, 0],
    [-CAB_W, CAB_H, 0, 1],
    [0, CAB_H, 1, 1],
    [CAB_W, CAB_H, 2, 1],
  ];

  const surroundCabinets = gridConfigs.map(([ox, oy, gridCol, gridRow]) => {
    const scope: BendScope =
      gridCol === 0 ? 'left-wing' : gridCol === 2 ? 'right-wing' : 'center';
    const geoSet =
      scope === 'left-wing'
        ? leftWingGeoSet
        : scope === 'right-wing'
          ? rightWingGeoSet
          : centerTopGeoSet;

    const g = new THREE.Group();
    g.position.set(ox * 1.45, oy * 1.45, -0.4);
    g.visible = false;

    populateSurroundRearChassis(g, geoSet, scope);

    const trayBack = new THREE.Mesh(geoSet.trayGeo, trimMaterial);
    trayBack.position.set(0, 0, 0.022);
    g.add(trayBack);

    const sEmitterTex = track(
      createSlicedEmitterTexture(
        masterCanvas,
        gridCol / 3,
        gridRow * 0.5,
        1 / 3,
        0.5,
        maxAnisotropy,
      ),
    );
    const sEmitterMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: sEmitterTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: sEmitterTex,
        emissiveIntensity: initialPattern === 'off' ? 0.0 : 0.82,
        roughness: 0.2,
        metalness: 0.06,
        clearcoat: 0.92,
        clearcoatRoughness: 0.12,
      }),
    );

    const face = new THREE.Mesh(geoSet.faceGeo, sEmitterMat);
    face.position.set(0, 0, 0.044);
    g.add(face);

    surroundGroup.add(g);
    return {
      group: g,
      gridCol,
      gridRow,
      targetPos: new THREE.Vector3(ox, oy, 0),
      emitterMat: sEmitterMat,
    };
  });

  const updateCurvature = (
    curveLeftDeg: number,
    curveRightDeg: number,
    multiplier: number = CURVATURE_VISUAL_MULTIPLIER,
  ) => {
    const halfW = CAB_W / 2;

    for (let tIdx = 0; tIdx < bendTargets.length; tIdx++) {
      const t = bendTargets[tIdx];
      const posAttr = t.geo.getAttribute('position') as THREE.BufferAttribute;
      const normAttr = t.geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
      const basePos = t.basePos;
      const baseNorm = t.baseNorm;
      const zOff = t.zOffset;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const bx = basePos[i3];
        const by = basePos[i3 + 1];
        const bz = basePos[i3 + 2] + zOff;

        const curved =
          t.scope === 'left-wing'
            ? evaluateWingCurve('left', bx, bz, halfW, curveLeftDeg, multiplier)
            : t.scope === 'right-wing'
              ? evaluateWingCurve('right', bx, bz, halfW, curveRightDeg, multiplier)
              : evaluatePanelCurve(bx, bz, halfW, curveLeftDeg, curveRightDeg, multiplier);

        posAttr.setXYZ(i, curved.x, by, curved.z - zOff);

        if (normAttr && baseNorm) {
          const nx = baseNorm[i3];
          const ny = baseNorm[i3 + 1];
          const nz = baseNorm[i3 + 2];
          const sinY = Math.sin(curved.angleY);
          const cosY = Math.cos(curved.angleY);
          normAttr.setXYZ(i, nx * cosY + nz * sinY, ny, -nx * sinY + nz * cosY);
        }
      }

      posAttr.needsUpdate = true;
      if (normAttr) normAttr.needsUpdate = true;
      if (t.recomputeBounds) {
        t.geo.computeBoundingBox();
        t.geo.computeBoundingSphere();
      }
    }

    for (let rIdx = 0; rIdx < rigidTargets.length; rIdx++) {
      const rt = rigidTargets[rIdx];
      const bz = rt.baseZ + rt.parentZOffset;
      const curved =
        rt.scope === 'left-wing'
          ? evaluateWingCurve('left', rt.baseX, bz, halfW, curveLeftDeg, multiplier)
          : rt.scope === 'right-wing'
            ? evaluateWingCurve('right', rt.baseX, bz, halfW, curveRightDeg, multiplier)
            : evaluatePanelCurve(rt.baseX, bz, halfW, curveLeftDeg, curveRightDeg, multiplier);
      rt.obj.position.set(curved.x, rt.baseY, curved.z - rt.parentZOffset);
      rt.obj.rotation.y = rt.baseRotY + curved.angleY;
    }
  };

  const updateFinish = (finishId: ChassisFinishId) => {
    const spec = CHASSIS_FINISHES[finishId];
    chassisMaterial.color.set(spec.chassisHex);
    chassisMaterial.roughness = spec.roughness;
    chassisMaterial.metalness = spec.metalness;
    trimMaterial.color.set(spec.trimHex);
  };

  const updatePattern = (pattern: DisplayPatternId, pitch: PitchTierId, mode: WallMode) => {
    const intensity = pattern === 'off' ? 0.0 : pattern === 'calibration' ? 0.88 : 0.82;
    const nextMaster = createMasterEmitterCanvas(pattern, pitch);

    modules.forEach((m, idx) => {
      const [, , modCol, modRowFromBottom] = quadPositions[idx];
      const uv = getModuleUVRect(modCol, modRowFromBottom, mode);
      const oldMap = m.emitterMat.map;
      const nextTex = track(
        createSlicedEmitterTexture(
          nextMaster,
          uv.uOffset,
          uv.vOffset,
          uv.uSpan,
          uv.vSpan,
          maxAnisotropy,
        ),
      );
      m.emitterMat.map = nextTex;
      m.emitterMat.emissiveMap = nextTex;
      m.emitterMat.needsUpdate = true;
      if (oldMap) oldMap.dispose();
    });

    surroundCabinets.forEach((sc) => {
      const oldMap = sc.emitterMat.map;
      const nextTex = track(
        createSlicedEmitterTexture(
          nextMaster,
          sc.gridCol / 3,
          sc.gridRow * 0.5,
          1 / 3,
          0.5,
          maxAnisotropy,
        ),
      );
      sc.emitterMat.map = nextTex;
      sc.emitterMat.emissiveMap = nextTex;
      sc.emitterMat.emissiveIntensity = intensity;
      sc.emitterMat.needsUpdate = true;
      if (oldMap) oldMap.dispose();
    });
  };

  const updateSelection = (
    activeLayer: AssemblyLayerId | null,
    selectedModuleIdx: number | null,
    hoveredModuleIdx: number | null,
    showWireframe: boolean,
  ) => {
    cadLineMaterial.opacity = showWireframe ? 0.65 : 0.0;

    modules.forEach((m, idx) => {
      const isSelected = selectedModuleIdx === idx;
      const isHovered = hoveredModuleIdx === idx;
      const isLayerHighlight = activeLayer === 'emitter' || activeLayer === 'module';

      if (isSelected || isHovered) {
        m.highlightEdges.visible = true;
        m.highlightMat.color.set('#F59E0B');
        m.highlightMat.opacity = 0.95;
      } else if (isLayerHighlight && selectedModuleIdx === null) {
        m.highlightEdges.visible = true;
        m.highlightMat.color.set('#F59E0B');
        m.highlightMat.opacity = 0.25;
      } else if (showWireframe) {
        m.highlightEdges.visible = true;
        m.highlightMat.color.set('#94A3B8');
        m.highlightMat.opacity = 0.45;
      } else {
        m.highlightEdges.visible = false;
        m.highlightMat.opacity = 0.0;
      }
    });

    if (activeLayer === 'chassis') {
      chassisMaterial.emissive.set('#D97706');
      chassisMaterial.emissiveIntensity = 0.08;
    } else {
      chassisMaterial.emissive.set('#000000');
      chassisMaterial.emissiveIntensity = 0.0;
    }

    if (activeLayer === 'mount') {
      mountSteelMaterial.emissive.set('#D97706');
      mountSteelMaterial.emissiveIntensity = 0.14;
    } else {
      mountSteelMaterial.emissive.set('#000000');
      mountSteelMaterial.emissiveIntensity = 0.0;
    }
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return {
    root,
    mountLayer,
    chassisLayer,
    modulesLayer,
    emittersLayer,
    wireframeOverlayGroup,
    surroundGroup,
    surroundCabinets,
    modules,
    chassisMaterial,
    trimMaterial,
    machinedSteelMaterial,
    goldPinMaterial,
    mountSteelMaterial,
    cadLineMaterial,
    updateFinish,
    updatePattern,
    updateCurvature,
    updateSelection,
    dispose,
  };
}

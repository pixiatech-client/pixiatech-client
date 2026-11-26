'use client';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CHASSIS_FINISHES,
  CURVATURE_VISUAL_MULTIPLIER,
  evaluateCurvedRailSlide,
  evaluatePanelCurve,
  evaluateWingCurve,
  WALL_LAYOUT_SPECS,
  type AssemblyLayerId,
  type ChassisFinishId,
  type DisplayPatternId,
  type PitchTierId,
  type WallLayoutId,
} from '../data/panelSpecs';
import {
  createBeadBlastedCastMap,
  createBrushedMetalMaps,
  createMasterEmitterCanvas,
  createOutdoorRearRibMaps,
  createPcbBackplaneTexture,
  createPixiatechMedallionTexture,
  createSlicedEmitterTexture,
} from './proceduralTextures';

// Scale: 1 Three.js unit = 200 mm
// Outdoor Square Cabinet = 500 x 500 x 76 mm => 2.50 x 2.50 x 0.38 units
export const CAB_W = 2.5;
export const CAB_H = 2.5;
export const CAB_D = 0.38;
export const MOD_W = CAB_W / 2; // 1.25 (250 mm)
export const MOD_H = CAB_H / 2; // 1.25 (250 mm)

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

export interface SurroundCabinetRef {
  group: THREE.Group;
  gridCol: number; // 0 (left), 1 (center), 2 (right)
  gridRow: number; // -1 (bottom), 0 (middle), +1 (top)
  targetPos: THREE.Vector3;
  emitterMat: THREE.MeshPhysicalMaterial;
  jumperGroup: THREE.Group;
  topBridgeGroup: THREE.Group;
}

export interface CabinetAssembly {
  root: THREE.Group;
  mountLayer: THREE.Group;
  chassisLayer: THREE.Group;
  modulesLayer: THREE.Group;
  emittersLayer: THREE.Group;
  wireframeOverlayGroup: THREE.Group;
  surroundGroup: THREE.Group;
  surroundCabinets: SurroundCabinetRef[];
  trussStands: { col: number; group: THREE.Group; rowVariants: Record<1 | 2 | 3, THREE.Group> }[];
  modules: ModuleUnitRef[];
  chassisMaterial: THREE.MeshPhysicalMaterial;
  trimMaterial: THREE.MeshStandardMaterial;
  machinedSteelMaterial: THREE.MeshStandardMaterial;
  goldPinMaterial: THREE.MeshStandardMaterial;
  mountSteelMaterial: THREE.MeshStandardMaterial;
  cadLineMaterial: THREE.LineBasicMaterial;
  updateFinish: (finishId: ChassisFinishId) => void;
  updatePattern: (pattern: DisplayPatternId, pitch: PitchTierId, layout: WallLayoutId) => void;
  updateCurvature: (
    curveLeftDeg: number,
    curveRightDeg: number,
    multiplier?: number,
    layout?: WallLayoutId,
    orientAngleRad?: number,
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
  rotateWithOrient: boolean;
}

interface RigidBendTarget {
  obj: THREE.Object3D;
  baseX: number;
  baseY: number;
  baseZ: number;
  parentZOffset: number;
  baseRotY: number;
  baseRotZ: number;
  scope: BendScope;
  rotateWithOrient: boolean;
  slideSide?: 'left' | 'right';
  slideRole?: 'carriage' | 'paddle';
}

export function buildCabinetAssembly(
  maxAnisotropy: number,
  initialFinish: ChassisFinishId,
  initialPattern: DisplayPatternId,
  initialPitch: PitchTierId,
  initialLayout: WallLayoutId,
  onTextureLoaded?: () => void,
): CabinetAssembly {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const bendTargets: BendGeometryTarget[] = [];
  const rigidTargets: RigidBendTarget[] = [];
  const medallionMeshes: THREE.Mesh[] = [];

  const registerBendGeometry = (
    geo: THREE.BufferGeometry,
    zOffset = 0,
    recomputeBounds = false,
    scope: BendScope = 'center',
    rotateWithOrient = true,
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
      rotateWithOrient,
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
    rotateWithOrient = true,
    slideSide?: 'left' | 'right',
    slideRole?: 'carriage' | 'paddle',
  ) => {
    rigidTargets.push({
      obj,
      baseX,
      baseY,
      baseZ,
      parentZOffset,
      baseRotY,
      baseRotZ: obj.rotation.z,
      scope,
      rotateWithOrient,
      slideSide,
      slideRole,
    });
  };

  const { bumpMap, roughnessMap } = createBrushedMetalMaps(maxAnisotropy);
  const castBumpMap = track(createBeadBlastedCastMap(maxAnisotropy));
  const outdoorRibMaps = createOutdoorRearRibMaps(maxAnisotropy);
  track(bumpMap);
  track(roughnessMap);
  track(outdoorRibMaps.bumpMap);
  track(outdoorRibMaps.roughnessMap);

  const pcbTex = track(createPcbBackplaneTexture(maxAnisotropy));
  const medallionTex = track(createPixiatechMedallionTexture(maxAnisotropy, onTextureLoaded));
  const finish = CHASSIS_FINISHES[initialFinish];

  // Sleek glossy Noir absolu die-cast chassis with crisp specular highlights
  const chassisMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#07080B'),
      roughness: 0.34,
      metalness: 0.48,
      bumpMap: castBumpMap,
      bumpScale: 0.003,
      roughnessMap,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.75,
    }),
  );

  // Glossy Noir absolu outdoor module rear shroud catching soft reflections on ribbed structure
  const outdoorShroudMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#13161E'),
      roughness: 0.28,
      metalness: 0.34,
      bumpMap: outdoorRibMaps.bumpMap,
      bumpScale: 0.07,
      roughnessMap: outdoorRibMaps.roughnessMap,
      clearcoat: 0.92,
      clearcoatRoughness: 0.14,
      envMapIntensity: 2.2,
    }),
  );

  // Surround module rear shroud (2x2 module tiling across 1 cabinet)
  const surroundShroudBump = track(outdoorRibMaps.bumpMap.clone());
  surroundShroudBump.repeat.set(2, 2);
  surroundShroudBump.needsUpdate = true;
  const surroundShroudRough = track(outdoorRibMaps.roughnessMap.clone());
  surroundShroudRough.repeat.set(2, 2);
  surroundShroudRough.needsUpdate = true;
  const surroundShroudMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#13161E'),
      roughness: 0.28,
      metalness: 0.34,
      bumpMap: surroundShroudBump,
      bumpScale: 0.07,
      roughnessMap: surroundShroudRough,
      clearcoat: 0.92,
      clearcoatRoughness: 0.14,
      envMapIntensity: 2.2,
    }),
  );

  const trimMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#12141A'),
      roughness: 0.32,
      metalness: 0.62,
      bumpMap: castBumpMap,
      bumpScale: 0.003,
      envMapIntensity: 1.45,
    }),
  );

  const darkRecessMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#040507'),
      roughness: 0.48,
      metalness: 0.28,
      bumpMap: castBumpMap,
      bumpScale: 0.003,
    }),
  );

  const machinedSteelMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3E4450'),
      roughness: 0.22,
      metalness: 0.9,
      bumpMap,
      bumpScale: 0.002,
      envMapIntensity: 1.5,
    }),
  );

  const cornerArcSilverMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2D323D'),
      roughness: 0.28,
      metalness: 0.82,
    }),
  );

  const ip65BlueCollarMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0F1218'),
      roughness: 0.26,
      metalness: 0.35,
    }),
  );

  const rubberCableMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0A0B0E'),
      roughness: 0.68,
      metalness: 0.08,
    }),
  );

  const redCasterMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#14171E'),
      roughness: 0.35,
      metalness: 0.35,
    }),
  );

  const goldPinMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#6E5A3A'),
      roughness: 0.2,
      metalness: 0.92,
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
      color: new THREE.Color('#14171D'),
      roughness: 0.48,
      metalness: 0.68,
      bumpMap: castBumpMap,
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
  root.name = 'pixiatech-outdoor-cabinet-assembly';

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
  // 1. MOUNT LAYER: Rear Ballast Ground Truss Towers (1-row, 2-row, 3-row proportional heights)
  // ---------------------------------------------------------------------------
  const buildTrussFinGeo = (finHeight: number, baseDepthX: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(-baseDepthX, 0);
    shape.lineTo(0.02, 0);
    shape.lineTo(0.02, finHeight);
    shape.lineTo(-0.08, finHeight);
    shape.quadraticCurveTo(-baseDepthX * 0.62, finHeight * 0.56, -baseDepthX, 0.36);
    shape.closePath();

    const holeCount = finHeight > 5.2 ? 7 : finHeight > 3.2 ? 5 : 4;
    for (let h = 0; h < holeCount; h++) {
      const frac = 0.16 + (h / Math.max(1, holeCount - 1)) * 0.68;
      const hy = finHeight * frac;
      const backX = -baseDepthX * (1 - Math.pow(frac, 1.3) * 0.72);
      const hx = (backX + 0.02) * 0.5 - 0.02;
      const hr = Math.max(0.036, 0.072 * (1 - frac * 0.45));
      const hole = new THREE.Path();
      hole.absarc(hx, hy, hr, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    const geo = track(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.045,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.008,
        bevelSegments: 2,
      }),
    );
    geo.rotateY(-Math.PI / 2);
    return geo;
  };

  const trussFinGeos: Record<1 | 2 | 3, THREE.BufferGeometry> = {
    1: buildTrussFinGeo(2.32, 0.34),
    2: buildTrussFinGeo(4.45, 0.46),
    3: buildTrussFinGeo(6.65, 0.54),
  };

  const trussBasePlateGeo = track(new THREE.BoxGeometry(0.94, 0.045, 1.04));
  const casterWheelGeo = track(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 16));
  casterWheelGeo.rotateZ(Math.PI / 2);
  const casterHubGeo = track(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 14));
  casterHubGeo.rotateZ(Math.PI / 2);
  const trussClampBracketGeo = track(new THREE.BoxGeometry(0.08, 0.12, 0.24));
  const trussCrossTieGeo = track(new THREE.BoxGeometry(0.76, 0.05, 0.05));

  const trussStands: { col: number; group: THREE.Group; rowVariants: Record<1 | 2 | 3, THREE.Group> }[] = [];
  [-1, 0, 1].forEach((col) => {
    const standGroup = new THREE.Group();

    const basePlate = new THREE.Mesh(trussBasePlateGeo, mountSteelMaterial);
    basePlate.position.set(0, 0.09, -0.64);
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    standGroup.add(basePlate);

    // 4 industrial caster wheels on floor base
    for (const wx of [-0.38, 0.38]) {
      for (const wz of [-0.24, -1.04]) {
        const wheel = new THREE.Mesh(casterWheelGeo, darkRecessMaterial);
        wheel.position.set(wx, 0.055, wz);
        standGroup.add(wheel);
        const hub = new THREE.Mesh(casterHubGeo, redCasterMaterial);
        hub.position.set(wx, 0.055, wz);
        standGroup.add(hub);
      }
    }

    const rowVariants = {} as Record<1 | 2 | 3, THREE.Group>;
    ([1, 2, 3] as const).forEach((rowCount) => {
      const variantGroup = new THREE.Group();
      const finHeight = rowCount === 1 ? 2.32 : rowCount === 2 ? 4.45 : 6.65;

      // Dual parallel vertical truss fins flanking cleanly outside the central IP65 spine
      for (const fx of [-0.36, 0.36]) {
        const fin = new THREE.Mesh(trussFinGeos[rowCount], mountSteelMaterial);
        fin.position.set(fx + 0.022, 0.11, -0.34);
        fin.castShadow = true;
        fin.receiveShadow = true;
        variantGroup.add(fin);
      }

      // Cross-ties linking the twin vertical truss plates behind the central spine
      for (let r = 0; r < rowCount; r++) {
        const tieY = r * CAB_H + 1.25;
        if (tieY <= finHeight - 0.18) {
          const tie = new THREE.Mesh(trussCrossTieGeo, mountSteelMaterial);
          tie.position.set(0, tieY, -0.5);
          variantGroup.add(tie);
        }
      }

      // Steel clamping brackets linking each truss fin forward to each cabinet row's rear rails
      for (let r = 0; r < rowCount; r++) {
        for (const offset of [0.35, 2.08]) {
          const cy = r * CAB_H + offset;
          if (cy <= finHeight - 0.06) {
            for (const fx of [-0.36, 0.36]) {
              const bracket = new THREE.Mesh(trussClampBracketGeo, machinedSteelMaterial);
              bracket.position.set(fx, cy, -0.22);
              variantGroup.add(bracket);
            }
          }
        }
      }

      variantGroup.visible = rowCount === 1;
      standGroup.add(variantGroup);
      rowVariants[rowCount] = variantGroup;
    });

    standGroup.visible = col === 0;
    mountLayer.add(standGroup);
    trussStands.push({ col, group: standGroup, rowVariants });
  });

  // ---------------------------------------------------------------------------
  // 2. CHASSIS LAYER: Open Skeleton Die-Cast Frame (Raw Matte Black) (Photos 1 & 2)
  // ---------------------------------------------------------------------------
  const frameOuterW = CAB_W + 0.012;
  const frameOuterH = CAB_H + 0.012;
  const frameRim = 0.14;
  const frameDepth = 0.14;
  const frameZCenter = -0.045;
  const stileGapHalfY = 0.42;
  const stileSegmentH = (frameOuterH - 2 * frameRim) / 2 - stileGapHalfY;

  const buildSubdividedRailsGeo = () => {
    const tRail = new THREE.BoxGeometry(frameOuterW - 0.34, frameRim, frameDepth, 48, 2, 2);
    tRail.translate(0, frameOuterH / 2 - frameRim / 2, frameZCenter);
    const bRail = new THREE.BoxGeometry(frameOuterW - 0.34, frameRim, frameDepth, 48, 2, 2);
    bRail.translate(0, -frameOuterH / 2 + frameRim / 2, frameZCenter);
    const merged = mergeGeometries([tRail, bRail], false);
    tRail.dispose();
    bRail.dispose();
    if (!merged) {
      throw new Error('Impossible de fusionner les longerons du châssis outdoor.');
    }
    return track(merged);
  };

  const outerFrameGeo = buildSubdividedRailsGeo();
  registerBendGeometry(outerFrameGeo, 0, false, 'center', true);

  const heroRailsMesh = new THREE.Mesh(outerFrameGeo, chassisMaterial);
  heroRailsMesh.castShadow = true;
  heroRailsMesh.receiveShadow = true;
  chassisLayer.add(heroRailsMesh);

  // Shared Sculpted Hardware Geometries for Raw-Black Outdoor Cabinet (Photo 1 & 2)
  const sideStileSegGeo = track(new THREE.BoxGeometry(frameRim, stileSegmentH, frameDepth, 2, 2, 2));
  const sidePocketHandleBarGeo = track(new THREE.BoxGeometry(0.055, 0.72, 0.045));
  const sideHandleArmGeo = track(new THREE.BoxGeometry(0.055, 0.055, 0.14));

  // Heavy Sculpted Corner Bumpers w/ Thin Silver Corner Arc Trim (Photo 1 signature)
  const cornerBumperGeo = track(new THREE.BoxGeometry(0.28, 0.28, 0.175));
  const cornerArcGeo = track(new THREE.TorusGeometry(0.155, 0.008, 8, 20, Math.PI * 0.48));
  const cornerPadGeo = track(new THREE.BoxGeometry(0.2, 0.06, 0.12));

  // Left & Right Vertical H-Yoke Articulation Brackets + Sliver Slotted Slide Tracks
  const hYokeVerticalGeo = track(new THREE.BoxGeometry(0.11, 1.92, 0.068));
  const hYokeArmGeo = track(new THREE.BoxGeometry(0.42, 0.1, 0.065));
  const hYokeBridgeGeo = track(new THREE.BoxGeometry(0.09, 0.72, 0.095));
  const silverSlideBarGeo = track(new THREE.BoxGeometry(0.36, 0.068, 0.022));

  // Upper Corner Steel Locking Shafts & Ergonomic Trigger Paddles (Photo 1)
  const lockRodGeo = track(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 12));
  const lockHousingGeo = track(new THREE.BoxGeometry(0.14, 0.12, 0.08));
  const lockPaddleGeo = track(new THREE.BoxGeometry(0.13, 0.075, 0.032));
  const sideClampBodyGeo = track(new THREE.BoxGeometry(0.12, 0.12, 0.085));
  const sideSpringPinGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 12));
  sideSpringPinGeo.rotateZ(Math.PI / 2);

  // Top Folding Rubberized Carry Bar (Photo 1 & 4)
  const topHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.26, 0, -0.04),
    new THREE.Vector3(-0.22, 0.082, -0.08),
    new THREE.Vector3(0.22, 0.082, -0.08),
    new THREE.Vector3(0.26, 0, -0.04),
  ]);
  const topHandleBarGeo = track(new THREE.TubeGeometry(topHandleCurve, 24, 0.021, 10, false));
  const topHandleClampGeo = track(new THREE.BoxGeometry(0.085, 0.065, 0.09));

  // Central Pill-Shaped IP65 Power & Data Spine Housing (Photo 1)
  const pillW = 0.26;
  const pillH = 0.84;
  const pillShape = new THREE.Shape();
  pillShape.absarc(0, pillH - pillW, pillW, 0, Math.PI, false);
  pillShape.absarc(0, -(pillH - pillW), pillW, Math.PI, Math.PI * 2, false);
  pillShape.closePath();

  const centralSpineGeo = track(
    new THREE.ExtrudeGeometry(pillShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.038,
      bevelSegments: 4,
    }),
  );
  centralSpineGeo.rotateY(Math.PI);
  centralSpineGeo.translate(0, 0, -0.04);

  // Recessed Oval Louver Ring & Vertical Cooling Fins inside Central Pill Box
  const ovalW = 0.14;
  const ovalH = 0.56;
  const ovalShape = new THREE.Shape();
  ovalShape.absarc(0, ovalH - ovalW, ovalW, 0, Math.PI, false);
  ovalShape.absarc(0, -(ovalH - ovalW), ovalW, Math.PI, Math.PI * 2, false);
  ovalShape.closePath();
  const louverWellGeo = track(
    new THREE.ExtrudeGeometry(ovalShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    }),
  );
  louverWellGeo.rotateY(Math.PI);
  louverWellGeo.translate(0, 0, -0.255);

  const louverFinGeo = track(new THREE.BoxGeometry(0.012, 0.92, 0.018));
  const hubCollarGeo = track(new THREE.CylinderGeometry(0.135, 0.146, 0.022, 36));
  hubCollarGeo.rotateX(Math.PI / 2);
  const medallionGeo = track(new THREE.CircleGeometry(0.125, 48));
  medallionGeo.rotateY(Math.PI);

  // Angled IP65 Waterproof Power & Data Connectors (4 corners of spine)
  const ip65SocketGeo = track(new THREE.CylinderGeometry(0.048, 0.054, 0.11, 16));
  const ip65BlueRingGeo = track(new THREE.CylinderGeometry(0.052, 0.052, 0.028, 16));
  const spineTestBtnGeo = track(new THREE.CylinderGeometry(0.036, 0.04, 0.022, 20));
  spineTestBtnGeo.rotateX(Math.PI / 2);
  const spineBottomFootGeo = track(new THREE.BoxGeometry(0.46, 0.16, 0.16));

  const buildCentralSpineGroup = (): THREE.Group => {
    const spineGroup = new THREE.Group();

    const body = new THREE.Mesh(centralSpineGeo, chassisMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    spineGroup.add(body);

    const louverWell = new THREE.Mesh(louverWellGeo, darkRecessMaterial);
    spineGroup.add(louverWell);

    for (let f = -4; f <= 4; f++) {
      const fin = new THREE.Mesh(louverFinGeo, trimMaterial);
      fin.position.set(f * 0.025, 0, -0.275);
      spineGroup.add(fin);
    }

    // 4 Angled IP65 Neutrik Power/Data Ports w/ Blue Collar Rings
    for (const pxSign of [-1, 1]) {
      for (const pySign of [-1, 1]) {
        const portG = new THREE.Group();
        portG.position.set(pxSign * 0.26, pySign * 0.64, -0.15);
        portG.rotation.z = pxSign * pySign * -0.58;
        portG.rotation.x = pySign * 0.24;

        const sock = new THREE.Mesh(ip65SocketGeo, darkRecessMaterial);
        portG.add(sock);
        const blueRing = new THREE.Mesh(ip65BlueRingGeo, ip65BlueCollarMaterial);
        blueRing.position.set(0, pySign * 0.03, 0);
        portG.add(blueRing);
        spineGroup.add(portG);
      }
    }

    // Bottom Steel Push-Test Button & Base Foot (Photo 1)
    const testBtn = new THREE.Mesh(spineTestBtnGeo, machinedSteelMaterial);
    testBtn.position.set(0, -0.78, -0.268);
    spineGroup.add(testBtn);

    const baseFoot = new THREE.Mesh(spineBottomFootGeo, darkRecessMaterial);
    baseFoot.position.set(0, -1.08, -0.12);
    spineGroup.add(baseFoot);

    // Circular PIXIATECH Medallion (counter-rotated dynamically when cabinet pivots!)
    const collar = new THREE.Mesh(hubCollarGeo, darkRecessMaterial);
    collar.position.set(0, 0, -0.28);
    spineGroup.add(collar);

    const medallion = new THREE.Mesh(medallionGeo, medallionMaterial);
    medallion.position.set(0, 0, -0.294);
    spineGroup.add(medallion);
    medallionMeshes.push(medallion);

    return spineGroup;
  };

  const populateSculptedHardware = (
    targetGroup: THREE.Group,
    trackRigid: boolean,
    rigidScope: BendScope = 'center',
  ) => {
    const addObj = (
      obj: THREE.Object3D,
      bx: number,
      by: number,
      bz: number,
      rotY = 0,
      rotZ = 0,
      slideSide?: 'left' | 'right',
      slideRole?: 'carriage' | 'paddle',
    ) => {
      obj.position.set(bx, by, bz);
      obj.rotation.y = rotY;
      obj.rotation.z = rotZ;
      targetGroup.add(obj);
      if (trackRigid) {
        registerRigidTarget(obj, bx, by, bz, 0, rotY, rigidScope, true, slideSide, slideRole);
      }
    };

    // Left & Right Sculpted Stile Segments + Side Handle Bars + Side Quick Clamps
    for (const sxSign of [-1, 1]) {
      const sideKey: 'left' | 'right' = sxSign < 0 ? 'left' : 'right';
      const stileX = sxSign * (frameOuterW / 2 - frameRim / 2);
      const segY = stileGapHalfY + stileSegmentH / 2;

      for (const sySign of [-1, 1]) {
        const seg = new THREE.Mesh(sideStileSegGeo, chassisMaterial);
        seg.castShadow = true;
        seg.receiveShadow = true;
        addObj(seg, stileX, sySign * segY, frameZCenter);
      }

      // Open Side Carry Handle Bar (Photo 2)
      const hBar = new THREE.Mesh(sidePocketHandleBarGeo, darkRecessMaterial);
      addObj(hBar, stileX + sxSign * 0.02, 0, -0.13);
      for (const aySign of [-1, 1]) {
        const hArm = new THREE.Mesh(sideHandleArmGeo, chassisMaterial);
        addObj(hArm, stileX + sxSign * 0.01, aySign * 0.34, -0.075);
      }

      // Sculpted Corner Bumper Castings + Thin Smoked Corner Arcs (Photo 1)
      for (const cySign of [-1, 1]) {
        const cornerX = sxSign * (CAB_W / 2 - 0.13);
        const cornerY = cySign * (CAB_H / 2 - 0.13);
        const cBumper = new THREE.Mesh(cornerBumperGeo, chassisMaterial);
        cBumper.castShadow = true;
        addObj(cBumper, cornerX, cornerY, -0.068);

        const arc = new THREE.Mesh(cornerArcGeo, cornerArcSilverMaterial);
        let arcRotZ = 0;
        if (sxSign === 1 && cySign === 1) arcRotZ = 0;
        else if (sxSign === -1 && cySign === 1) arcRotZ = Math.PI * 0.5;
        else if (sxSign === -1 && cySign === -1) arcRotZ = Math.PI;
        else arcRotZ = -Math.PI * 0.5;
        addObj(arc, cornerX - sxSign * 0.04, cornerY - cySign * 0.04, -0.162, 0, arcRotZ);

        // Top/Bottom corner bumper alignment pads
        const pad = new THREE.Mesh(cornerPadGeo, darkRecessMaterial);
        addObj(pad, sxSign * 0.68, cySign * (CAB_H / 2 - 0.04), -0.095);
      }

      // Vertical H-Yoke Articulation Carriage (slides along fixed horizontal slideBar during curvature)
      const yokeX = sxSign * 0.72;
      const yokeV = new THREE.Mesh(hYokeVerticalGeo, chassisMaterial);
      yokeV.castShadow = true;
      addObj(yokeV, yokeX, 0, -0.125, 0, 0, sideKey, 'carriage');

      const yokeBridge = new THREE.Mesh(hYokeBridgeGeo, trimMaterial);
      addObj(yokeBridge, yokeX + sxSign * 0.12, 0, -0.165, 0, 0, sideKey, 'carriage');

      for (const hySign of [-1, 1]) {
        const arm = new THREE.Mesh(hYokeArmGeo, chassisMaterial);
        addObj(arm, sxSign * 0.94, hySign * 0.36, -0.135, 0, 0, sideKey, 'carriage');

        // Stationary slotted slide track anchored to chassis
        const slideBar = new THREE.Mesh(silverSlideBarGeo, machinedSteelMaterial);
        addObj(slideBar, sxSign * 0.45, hySign * 0.36, -0.125);
      }

      // Upper Vertical Steel Locking Rod + Rotating Curve-Lock Paddle (slides + pivots on curve)
      const rod = new THREE.Mesh(lockRodGeo, machinedSteelMaterial);
      addObj(rod, sxSign * 0.72, 1.0, -0.145, 0, 0, sideKey, 'carriage');
      const lHousing = new THREE.Mesh(lockHousingGeo, trimMaterial);
      addObj(lHousing, sxSign * 0.72, 1.13, -0.125, 0, 0, sideKey, 'carriage');
      const lPaddle = new THREE.Mesh(lockPaddleGeo, darkRecessMaterial);
      addObj(lPaddle, sxSign * 0.81, 0.89, -0.165, 0, 0, sideKey, 'paddle');

      // Side Quick-Lock Clamps w/ Steel Spring Pins
      for (const lySign of [-1, 1]) {
        const sBody = new THREE.Mesh(sideClampBodyGeo, trimMaterial);
        addObj(sBody, sxSign * (CAB_W / 2 - 0.04), lySign * 0.68, -0.11, 0, 0, sideKey, 'carriage');
        const sPin = new THREE.Mesh(sideSpringPinGeo, machinedSteelMaterial);
        addObj(sPin, sxSign * (CAB_W / 2 - 0.12), lySign * 0.68, -0.12, 0, 0, sideKey, 'carriage');
        const sPaddle = new THREE.Mesh(lockPaddleGeo, darkRecessMaterial);
        addObj(
          sPaddle,
          sxSign * (CAB_W / 2 - 0.24),
          lySign * 0.62,
          -0.155,
          0,
          sxSign * 0.35,
          sideKey,
          'paddle',
        );
      }
    }

    // Top Folding Matte-Black Grip Bar at x = 0 (Photo 1)
    const topBar = new THREE.Mesh(topHandleBarGeo, darkRecessMaterial);
    addObj(topBar, 0, CAB_H / 2 - 0.022, -0.055);
    for (const mx of [-0.26, 0.26]) {
      const mnt = new THREE.Mesh(topHandleClampGeo, machinedSteelMaterial);
      addObj(mnt, mx, CAB_H / 2 - 0.022, -0.082);
    }

    // Central Pill Power Box + PIXIATECH Medallion
    addObj(buildCentralSpineGroup(), 0, 0, 0);
  };

  // Populate Hero Open-Frame Rear Hardware
  populateSculptedHardware(chassisLayer, true, 'center');

  // Thin Internal Cross-Ribs Separating the 4 Open Module Bays (Photo 2 — hollow inside!)
  // Subdivided 48 segments along Y too so 90-deg Pivoter-H curvature stays flush behind LED face
  const vRibGeo = track(new THREE.BoxGeometry(0.065, CAB_H - 0.24, 0.038, 2, 48, 1));
  vRibGeo.translate(0, 0, -0.032);
  registerBendGeometry(vRibGeo, 0, false, 'center', true);
  const vRib = new THREE.Mesh(vRibGeo, trimMaterial);
  chassisLayer.add(vRib);

  const hRibGeo = track(new THREE.BoxGeometry(CAB_W - 0.24, 0.065, 0.038, 48, 2, 1));
  hRibGeo.translate(0, 0, -0.032);
  registerBendGeometry(hRibGeo, 0, false, 'center', true);
  const hRib = new THREE.Mesh(hRibGeo, trimMaterial);
  chassisLayer.add(hRib);

  // Compact Pogo-Pin Receiver Seats on Cross-Ribs (NO solid backplate blocking the open bays!)
  const bayContactSeatGeo = track(new THREE.BoxGeometry(0.22, 0.09, 0.025));
  const bayReceiverPinGeo = track(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12));
  bayReceiverPinGeo.rotateX(Math.PI / 2);

  [
    [-MOD_W / 2, MOD_H - 0.14],
    [MOD_W / 2, MOD_H - 0.14],
    [-MOD_W / 2, -MOD_H + 0.14],
    [MOD_W / 2, -MOD_H + 0.14],
  ].forEach(([bx, by]) => {
    const seat = new THREE.Mesh(bayContactSeatGeo, darkRecessMaterial);
    chassisLayer.add(seat);
    registerRigidTarget(seat, bx, by, -0.012, 0, 0, 'center', true);

    for (const px of [-0.055, 0, 0.055]) {
      const rxPin = new THREE.Mesh(bayReceiverPinGeo, goldPinMaterial);
      chassisLayer.add(rxPin);
      registerRigidTarget(rxPin, bx + px, by, -0.002, 0, 0, 'center', true);
    }
  });

  const chassisEdges = track(new THREE.EdgesGeometry(outerFrameGeo, 20));
  registerBendGeometry(chassisEdges, 0, false, 'center', true);
  const chassisWire = new THREE.LineSegments(chassisEdges, cadLineMaterial);
  wireframeOverlayGroup.add(chassisWire);

  // ---------------------------------------------------------------------------
  // 3. MODULES & EMITTERS LAYERS: 4 Waterproof Square Outdoor Modules (250 x 250 mm)
  //    Module backs carry the vertical diagonal-ribbed black shrouds (Photo 1),
  //    so extracting a module reveals the open skeleton bay behind it (Photo 2)!
  // ---------------------------------------------------------------------------
  const masterCanvas = createMasterEmitterCanvas(initialPattern, initialPitch);
  const modules: ModuleUnitRef[] = [];
  const baseTrayGeo = track(new THREE.BoxGeometry(MOD_W - 0.014, MOD_H - 0.014, 0.052, 28, 2, 1));
  const basePcbGeo = track(new THREE.BoxGeometry(MOD_W - 0.08, MOD_H - 0.08, 0.012, 24, 2, 1));
  const pinGeo = track(new THREE.CylinderGeometry(0.011, 0.011, 0.022, 12));
  pinGeo.rotateX(Math.PI / 2);
  const magnetGeo = track(new THREE.CylinderGeometry(0.024, 0.024, 0.016, 16));
  magnetGeo.rotateX(Math.PI / 2);
  const baseEmitterGeo = track(new THREE.BoxGeometry(MOD_W, MOD_H, 0.018, 32, 2, 1));
  const baseHitProxyGeo = track(new THREE.BoxGeometry(MOD_W - 0.006, MOD_H - 0.006, 0.09, 16, 2, 1));
  const hitProxyMat = track(new THREE.MeshBasicMaterial({ visible: false }));

  const quadPositions: [number, number, number, number][] = [
    [-MOD_W / 2, MOD_H / 2, 0, 1], // M1 Top-Left
    [MOD_W / 2, MOD_H / 2, 1, 1], // M2 Top-Right
    [-MOD_W / 2, -MOD_H / 2, 0, 0], // M3 Bottom-Left
    [MOD_W / 2, -MOD_H / 2, 1, 0], // M4 Bottom-Right
  ];

  const getWallCellCoords = (gridCol: number, gridRow: number, layout: WallLayoutId) => {
    const spec = WALL_LAYOUT_SPECS[layout];
    if (layout === '1x1') {
      return { colIdx: 0, rowFromBottom: 0, cols: 1, rows: 1 };
    }
    if (layout === '3x2') {
      return { colIdx: gridCol, rowFromBottom: gridRow, cols: spec.cols, rows: spec.rows };
    }
    if (layout === '2x3') {
      return {
        colIdx: gridCol - 1, // col 1 -> left (0), col 2 -> right (1)
        rowFromBottom: gridRow + 1, // -1..1 -> 0..2
        cols: spec.cols,
        rows: spec.rows,
      };
    }
    // 3x3
    return {
      colIdx: gridCol,
      rowFromBottom: gridRow + 1,
      cols: spec.cols,
      rows: spec.rows,
    };
  };

  const getModuleUVRect = (modCol: number, modRowFromBottom: number, layout: WallLayoutId) => {
    const cell = getWallCellCoords(1, 0, layout);
    const cellSpanU = 1 / cell.cols;
    const cellSpanV = 1 / cell.rows;
    return {
      uOffset: cell.colIdx * cellSpanU + modCol * (cellSpanU * 0.5),
      vOffset: cell.rowFromBottom * cellSpanV + modRowFromBottom * (cellSpanV * 0.5),
      uSpan: cellSpanU * 0.5,
      vSpan: cellSpanV * 0.5,
    };
  };

  quadPositions.forEach(([qx, qy, modCol, modRowFromBottom], idx) => {
    const tileGroup = new THREE.Group();
    tileGroup.position.set(0, qy, 0.026);

    // Module rear waterproof shroud faces -Z (back of module) so closed rear view matches Photo 1
    const trayGeo = track(baseTrayGeo.clone());
    trayGeo.translate(qx, 0, -0.014);
    registerBendGeometry(trayGeo, 0.026, false, 'center', false);
    const tray = new THREE.Mesh(trayGeo, outdoorShroudMaterial);
    tray.castShadow = true;
    tray.receiveShadow = true;
    tileGroup.add(tray);

    // Internal PCB sits cleanly behind the front emitter (hidden behind shroud until exploded)
    const pcbGeo = track(basePcbGeo.clone());
    pcbGeo.translate(qx, 0, 0.008);
    registerBendGeometry(pcbGeo, 0.026, false, 'center', false);
    const pcb = new THREE.Mesh(pcbGeo, pcbMaterial);
    pcb.name = 'internal-pcb';
    tileGroup.add(pcb);

    [
      [-0.4, 0.36],
      [0.4, 0.36],
      [-0.4, -0.36],
      [0.4, -0.36],
    ].forEach(([px, py]) => {
      const pin = new THREE.Mesh(pinGeo, goldPinMaterial);
      tileGroup.add(pin);
      registerRigidTarget(pin, qx + px, py, -0.044, 0.026, 0, 'center', false);
    });

    [
      [-0.5, 0.5],
      [0.5, 0.5],
      [-0.5, -0.5],
      [0.5, -0.5],
    ].forEach(([mx, my]) => {
      const mag = new THREE.Mesh(magnetGeo, machinedSteelMaterial);
      tileGroup.add(mag);
      registerRigidTarget(mag, qx + mx, my, -0.042, 0.026, 0, 'center', false);
    });

    modulesLayer.add(tileGroup);

    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(0, qy, 0.056);

    const uv = getModuleUVRect(modCol, modRowFromBottom, initialLayout);
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
        emissiveIntensity: initialPattern === 'off' ? 0.24 : 0.82,
        roughness: 0.2,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.85,
      }),
    );

    const emitterGeo = track(baseEmitterGeo.clone());
    emitterGeo.translate(qx, 0, 0);
    registerBendGeometry(emitterGeo, 0.056, false, 'center', false);
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
    registerBendGeometry(emitterEdgesGeo, 0.056, false, 'center', false);
    const highlightEdges = new THREE.LineSegments(emitterEdgesGeo, highlightMat);
    highlightEdges.visible = false;
    emitterGroup.add(highlightEdges);

    const hitProxyGeo = track(baseHitProxyGeo.clone());
    hitProxyGeo.translate(qx, 0, 0);
    registerBendGeometry(hitProxyGeo, 0.056, true, 'center', false);
    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.userData = { moduleIndex: idx };
    hitProxy.layers.set(1);
    emitterGroup.add(hitProxy);

    emittersLayer.add(emitterGroup);

    modules.push({
      id: idx,
      label: `Module M${idx + 1} · 250 × 250 mm`,
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
  // 4. SURFACE ARRAY MODE (Supports 3x2, 2x3, and 3x3 Outdoor Curved Walls + Jumpers)
  // ---------------------------------------------------------------------------
  const surroundGroup = new THREE.Group();
  surroundGroup.name = 'surface-array-surround';
  root.add(surroundGroup);

  interface WingGeoSet {
    railsGeo: THREE.BufferGeometry;
    vRibGeo: THREE.BufferGeometry;
    hRibGeo: THREE.BufferGeometry;
    trayGeo: THREE.BufferGeometry;
    faceGeo: THREE.BufferGeometry;
  }

  const createWingGeoSet = (scope: BendScope): WingGeoSet => {
    const railsGeo = buildSubdividedRailsGeo();
    registerBendGeometry(railsGeo, 0, false, scope, true);

    const wingVRibGeo = track(new THREE.BoxGeometry(0.065, CAB_H - 0.24, 0.038, 2, 48, 1));
    wingVRibGeo.translate(0, 0, -0.032);
    registerBendGeometry(wingVRibGeo, 0, false, scope, true);

    const wingHRibGeo = track(new THREE.BoxGeometry(CAB_W - 0.24, 0.065, 0.038, 48, 2, 1));
    wingHRibGeo.translate(0, 0, -0.032);
    registerBendGeometry(wingHRibGeo, 0, false, scope, true);

    const trayGeo = track(new THREE.BoxGeometry(CAB_W - 0.014, CAB_H - 0.014, 0.052, 48, 2, 1));
    registerBendGeometry(trayGeo, 0.026, false, scope, false);

    const faceGeo = track(new THREE.BoxGeometry(CAB_W, CAB_H, 0.018, 48, 2, 1));
    registerBendGeometry(faceGeo, 0.056, false, scope, false);

    return { railsGeo, vRibGeo: wingVRibGeo, hRibGeo: wingHRibGeo, trayGeo, faceGeo };
  };

  const centerColTrayGeo = track(
    new THREE.BoxGeometry(CAB_W - 0.014, CAB_H - 0.014, 0.052, 48, 2, 1),
  );
  registerBendGeometry(centerColTrayGeo, 0.026, false, 'center', false);

  const centerColFaceGeo = track(new THREE.BoxGeometry(CAB_W, CAB_H, 0.018, 48, 2, 1));
  registerBendGeometry(centerColFaceGeo, 0.056, false, 'center', false);

  const centerColGeoSet: WingGeoSet = {
    railsGeo: outerFrameGeo,
    vRibGeo,
    hRibGeo,
    trayGeo: centerColTrayGeo,
    faceGeo: centerColFaceGeo,
  };

  const leftWingGeoSet = createWingGeoSet('left-wing');
  const rightWingGeoSet = createWingGeoSet('right-wing');

  // Waterproof IP65 Jumper Cable & Top Seam Lock Plate (Photo 4 detail)
  const jumperCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.28, 0.56, -0.24),
    new THREE.Vector3(-0.75, 0.15, -0.34),
    new THREE.Vector3(-1.35, -0.18, -0.32),
  ]);
  const jumperCableGeo = track(new THREE.TubeGeometry(jumperCableCurve, 18, 0.026, 8, false));
  const jumperPlugGeo = track(new THREE.CylinderGeometry(0.042, 0.042, 0.12, 12));
  const topCurveBridgePlateGeo = track(new THREE.BoxGeometry(0.32, 0.045, 0.16));

  const populateSurroundRearChassis = (
    targetGroup: THREE.Group,
    geoSet: WingGeoSet,
    scope: BendScope,
  ) => {
    const railsMesh = new THREE.Mesh(geoSet.railsGeo, chassisMaterial);
    railsMesh.castShadow = true;
    railsMesh.receiveShadow = true;
    targetGroup.add(railsMesh);

    const vMesh = new THREE.Mesh(geoSet.vRibGeo, trimMaterial);
    targetGroup.add(vMesh);
    const hMesh = new THREE.Mesh(geoSet.hRibGeo, trimMaterial);
    targetGroup.add(hMesh);

    populateSculptedHardware(targetGroup, true, scope);
  };

  // All 8 surround slots covering max 3x3 grid (col 1, row 0 is hero)
  const gridConfigs: [number, number, number, number][] = [
    [-CAB_W, 0, 0, 0],
    [CAB_W, 0, 2, 0],
    [-CAB_W, CAB_H, 0, 1],
    [0, CAB_H, 1, 1],
    [CAB_W, CAB_H, 2, 1],
    [-CAB_W, -CAB_H, 0, -1],
    [0, -CAB_H, 1, -1],
    [CAB_W, -CAB_H, 2, -1],
  ];

  const surroundCabinets: SurroundCabinetRef[] = gridConfigs.map(([ox, oy, gridCol, gridRow]) => {
    const scope: BendScope =
      gridCol === 0 ? 'left-wing' : gridCol === 2 ? 'right-wing' : 'center';
    const geoSet =
      scope === 'left-wing'
        ? leftWingGeoSet
        : scope === 'right-wing'
          ? rightWingGeoSet
          : centerColGeoSet;

    const g = new THREE.Group();
    g.position.set(ox * 1.45, oy * 1.45, -0.4);
    g.visible = false;

    populateSurroundRearChassis(g, geoSet, scope);

    // Rear diagonal-ribbed module back shroud (moves with cabinet, never blocks hero bays)
    const trayBack = new THREE.Mesh(geoSet.trayGeo, surroundShroudMaterial);
    trayBack.position.set(0, 0, 0.012);
    trayBack.castShadow = true;
    trayBack.receiveShadow = true;
    g.add(trayBack);

    const cell = getWallCellCoords(gridCol, gridRow, initialLayout);
    const sEmitterTex = track(
      createSlicedEmitterTexture(
        masterCanvas,
        Math.max(0, Math.min(1 - 1 / cell.cols, cell.colIdx / cell.cols)),
        Math.max(0, Math.min(1 - 1 / cell.rows, cell.rowFromBottom / cell.rows)),
        1 / cell.cols,
        1 / cell.rows,
        maxAnisotropy,
      ),
    );
    const sEmitterMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: sEmitterTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: sEmitterTex,
        emissiveIntensity: initialPattern === 'off' ? 0.24 : 0.82,
        roughness: 0.2,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.85,
      }),
    );

    const face = new THREE.Mesh(geoSet.faceGeo, sEmitterMat);
    face.position.set(0, 0, 0.056);
    face.castShadow = true;
    face.receiveShadow = true;
    g.add(face);

    // Inter-cabinet IP65 Jumper Cable & Top Seam Curve-Lock Plate (Photo 4)
    const jumperGroup = new THREE.Group();
    const cable = new THREE.Mesh(jumperCableGeo, rubberCableMaterial);
    jumperGroup.add(cable);
    const plug = new THREE.Mesh(jumperPlugGeo, ip65BlueCollarMaterial);
    plug.position.set(-0.28, 0.56, -0.24);
    plug.rotation.z = 0.65;
    jumperGroup.add(plug);
    g.add(jumperGroup);

    const topBridgeGroup = new THREE.Group();
    const bridgePlate = new THREE.Mesh(topCurveBridgePlateGeo, machinedSteelMaterial);
    bridgePlate.position.set(-CAB_W / 2, CAB_H / 2 - 0.02, -0.1);
    topBridgeGroup.add(bridgePlate);
    g.add(topBridgeGroup);

    surroundGroup.add(g);
    return {
      group: g,
      gridCol,
      gridRow,
      targetPos: new THREE.Vector3(ox, oy, 0),
      emitterMat: sEmitterMat,
      jumperGroup,
      topBridgeGroup,
    };
  });

  const updateCurvature = (
    curveLeftDeg: number,
    curveRightDeg: number,
    multiplier: number = CURVATURE_VISUAL_MULTIPLIER,
    layout: WallLayoutId = '1x1',
    orientAngleRad = 0,
  ) => {
    const halfW = CAB_W / 2;
    const isTwoCol = layout === '2x3';
    const cosO = Math.cos(orientAngleRad);
    const sinO = Math.sin(orientAngleRad);

    for (let tIdx = 0; tIdx < bendTargets.length; tIdx++) {
      const t = bendTargets[tIdx];
      const posAttr = t.geo.getAttribute('position') as THREE.BufferAttribute;
      const normAttr = t.geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
      const basePos = t.basePos;
      const baseNorm = t.baseNorm;
      const zOff = t.zOffset;
      const count = posAttr.count;
      const applyOrient = t.rotateWithOrient && Math.abs(orientAngleRad) > 1e-4;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const bx0 = basePos[i3];
        const by0 = basePos[i3 + 1];
        const bz = basePos[i3 + 2] + zOff;

        const bx = applyOrient ? bx0 * cosO - by0 * sinO : bx0;
        const by = applyOrient ? bx0 * sinO + by0 * cosO : by0;

        let curved;
        if (isTwoCol) {
          // In 2x3 mode, center column becomes left-half hinged at x = +halfW, right column hinges at x = -halfW
          curved =
            t.scope === 'right-wing'
              ? evaluateWingCurve('right', bx, bz, halfW, curveRightDeg, multiplier)
              : evaluateWingCurve('left', bx, bz, halfW, curveLeftDeg, multiplier);
        } else {
          curved =
            t.scope === 'left-wing'
              ? evaluateWingCurve('left', bx, bz, halfW, curveLeftDeg, multiplier)
              : t.scope === 'right-wing'
                ? evaluateWingCurve('right', bx, bz, halfW, curveRightDeg, multiplier)
                : evaluatePanelCurve(bx, bz, halfW, curveLeftDeg, curveRightDeg, multiplier);
        }

        posAttr.setXYZ(i, curved.x, by, curved.z - zOff);

        if (normAttr && baseNorm) {
          const nx0 = baseNorm[i3];
          const ny0 = baseNorm[i3 + 1];
          const nz = baseNorm[i3 + 2];
          const nx = applyOrient ? nx0 * cosO - ny0 * sinO : nx0;
          const ny = applyOrient ? nx0 * sinO + ny0 * cosO : ny0;
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

    const slideNormL = evaluateCurvedRailSlide(curveLeftDeg);
    const slideNormR = evaluateCurvedRailSlide(curveRightDeg);

    for (let rIdx = 0; rIdx < rigidTargets.length; rIdx++) {
      const rt = rigidTargets[rIdx];
      const bz = rt.baseZ + rt.parentZOffset;
      let slideDeltaX = 0;
      let paddleAngle = 0;
      if (rt.slideSide) {
        const slideNorm = rt.slideSide === 'left' ? slideNormL : slideNormR;
        slideDeltaX = slideNorm * (rt.slideSide === 'left' ? 0.14 : -0.14);
        if (rt.slideRole === 'paddle') {
          paddleAngle = slideNorm * 0.55;
        }
      }

      const rawX = rt.baseX + slideDeltaX;
      const applyOrient = rt.rotateWithOrient && Math.abs(orientAngleRad) > 1e-4;
      const bx = applyOrient ? rawX * cosO - rt.baseY * sinO : rawX;
      const by = applyOrient ? rawX * sinO + rt.baseY * cosO : rt.baseY;

      let curved;
      if (isTwoCol) {
        curved =
          rt.scope === 'right-wing'
            ? evaluateWingCurve('right', bx, bz, halfW, curveRightDeg, multiplier)
            : evaluateWingCurve('left', bx, bz, halfW, curveLeftDeg, multiplier);
      } else {
        curved =
          rt.scope === 'left-wing'
            ? evaluateWingCurve('left', bx, bz, halfW, curveLeftDeg, multiplier)
            : rt.scope === 'right-wing'
              ? evaluateWingCurve('right', bx, bz, halfW, curveRightDeg, multiplier)
              : evaluatePanelCurve(bx, bz, halfW, curveLeftDeg, curveRightDeg, multiplier);
      }

      rt.obj.rotation.order = 'YXZ';
      rt.obj.position.set(curved.x, by, curved.z - rt.parentZOffset);
      rt.obj.rotation.y = rt.baseRotY + curved.angleY;
      rt.obj.rotation.z = rt.baseRotZ + paddleAngle + (rt.rotateWithOrient ? orientAngleRad : 0);
    }

    // Counter-rotate the circular PIXIATECH medallion so the brand logo always stays upright/oriented
    for (let mIdx = 0; mIdx < medallionMeshes.length; mIdx++) {
      medallionMeshes[mIdx].rotation.z = -orientAngleRad;
    }
  };

  const updateFinish = (finishId: ChassisFinishId) => {
    const spec = CHASSIS_FINISHES[finishId];
    chassisMaterial.color.set(spec.chassisHex);
    chassisMaterial.roughness = spec.roughness;
    chassisMaterial.metalness = spec.metalness;
    trimMaterial.color.set(spec.trimHex);
  };

  const updatePattern = (pattern: DisplayPatternId, pitch: PitchTierId, layout: WallLayoutId) => {
    const intensity = pattern === 'off' ? 0.24 : pattern === 'calibration' ? 0.88 : 0.82;
    const nextMaster = createMasterEmitterCanvas(pattern, pitch);

    modules.forEach((m, idx) => {
      const [, , modCol, modRowFromBottom] = quadPositions[idx];
      const uv = getModuleUVRect(modCol, modRowFromBottom, layout);
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
      const cell = getWallCellCoords(sc.gridCol, sc.gridRow, layout);
      const oldMap = sc.emitterMat.map;
      const nextTex = track(
        createSlicedEmitterTexture(
          nextMaster,
          Math.max(0, Math.min(1 - 1 / cell.cols, cell.colIdx / cell.cols)),
          Math.max(0, Math.min(1 - 1 / cell.rows, cell.rowFromBottom / cell.rows)),
          1 / cell.cols,
          1 / cell.rows,
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
      chassisMaterial.emissive.set('#1E2430');
      chassisMaterial.emissiveIntensity = 0.1;
    } else {
      chassisMaterial.emissive.set('#000000');
      chassisMaterial.emissiveIntensity = 0.0;
    }

    if (activeLayer === 'mount') {
      mountSteelMaterial.emissive.set('#111827');
      mountSteelMaterial.emissiveIntensity = 0.08;
    } else {
      mountSteelMaterial.emissive.set('#000000');
      mountSteelMaterial.emissiveIntensity = 0.0;
    }
  };

  const dispose = () => {
    disposables.forEach((d) => {
      try {
        d.dispose();
      } catch {
        // Ignore duplicate disposal
      }
    });
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
    trussStands,
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

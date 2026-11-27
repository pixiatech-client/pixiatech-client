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
  createPixiatechMedallionTexture,
  createSlicedEmitterTexture,
  createTransparentLouverAlphaMap,
  createTransparentModulePolymerMaps,
} from './proceduralTextures';

// Scale: 1 Three.js unit = ~277.8 mm
// OneDisplay O-Crystal Pro Outdoor Transparent Cabinet = 1000 x 500 x 65 mm => 3.60 x 1.80 x 0.24 units
export const CAB_W = 3.6;
export const CAB_H = 1.8;
export const CAB_D = 0.24;
export const MOD_W = CAB_W / 2; // 1.80 (500 mm)
export const MOD_H = CAB_H / 2; // 0.90 (250 mm)

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
  track(bumpMap);
  track(roughnessMap);

  const LOUVER_ROWS_PER_MODULE = 15;
  const moduleLouverAlpha = track(
    createTransparentLouverAlphaMap(LOUVER_ROWS_PER_MODULE, 1, 1, maxAnisotropy),
  );
  const cabinetLouverAlpha = track(
    createTransparentLouverAlphaMap(LOUVER_ROWS_PER_MODULE, 2, 2, maxAnisotropy),
  );
  const modulePolymerMaps = createTransparentModulePolymerMaps(
    LOUVER_ROWS_PER_MODULE,
    1,
    1,
    maxAnisotropy,
  );
  track(modulePolymerMaps.map);
  track(modulePolymerMaps.bumpMap);
  track(modulePolymerMaps.roughnessMap);

  const surroundPolymerMaps = createTransparentModulePolymerMaps(
    LOUVER_ROWS_PER_MODULE,
    2,
    2,
    maxAnisotropy,
  );
  track(surroundPolymerMaps.map);
  track(surroundPolymerMaps.bumpMap);
  track(surroundPolymerMaps.roughnessMap);

  const medallionTex = track(createPixiatechMedallionTexture(maxAnisotropy, onTextureLoaded));

  // Matte-anodized die-cast aluminum chassis (O-Crystal Pro black aluminum frame)
  const chassisMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#090A0E'),
      roughness: 0.34,
      metalness: 0.52,
      bumpMap: castBumpMap,
      bumpScale: 0.0025,
      roughnessMap,
      clearcoat: 0.55,
      clearcoatRoughness: 0.24,
      envMapIntensity: 1.7,
    }),
  );

  // Transparent louvered module polymer & emerald-green PCB carrier (500 x 250 mm)
  const outdoorShroudMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: modulePolymerMaps.map,
      bumpMap: modulePolymerMaps.bumpMap,
      bumpScale: 0.025,
      roughnessMap: modulePolymerMaps.roughnessMap,
      alphaMap: moduleLouverAlpha,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.36,
      metalness: 0.24,
      clearcoat: 0.65,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.75,
    }),
  );

  // Surround transparent module polymer & emerald PCB (2x2 tiled across 1000 x 500 mm)
  const surroundShroudMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: surroundPolymerMaps.map,
      bumpMap: surroundPolymerMaps.bumpMap,
      bumpScale: 0.025,
      roughnessMap: surroundPolymerMaps.roughnessMap,
      alphaMap: cabinetLouverAlpha,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.36,
      metalness: 0.24,
      clearcoat: 0.65,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.75,
    }),
  );

  const trimMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#14171F'),
      roughness: 0.36,
      metalness: 0.62,
      bumpMap: castBumpMap,
      bumpScale: 0.002,
      envMapIntensity: 1.45,
    }),
  );

  const darkRecessMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#050608'),
      roughness: 0.52,
      metalness: 0.28,
      bumpMap: castBumpMap,
      bumpScale: 0.002,
    }),
  );

  // Bright brushed aluminum corner plates, spring pins & knurled aviation collars (O-Crystal Pro photo)
  const brushedSilverMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C8CDD6'),
      roughness: 0.24,
      metalness: 0.88,
      bumpMap,
      bumpScale: 0.0015,
      envMapIntensity: 1.65,
    }),
  );

  const machinedSteelMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5A6270'),
      roughness: 0.26,
      metalness: 0.88,
      bumpMap,
      bumpScale: 0.0015,
      envMapIntensity: 1.5,
    }),
  );

  // Bright RED anodized Arc Lock release triggers & handle safety accents (O-Crystal Pro signature detail)
  const arcRedAccentMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#DC2626'),
      emissive: new THREE.Color('#3B0707'),
      emissiveIntensity: 0.45,
      roughness: 0.28,
      metalness: 0.48,
      clearcoat: 0.72,
      clearcoatRoughness: 0.16,
    }),
  );

  // Glowing green Signal Light status indicator (#5 in structural drawing)
  const signalGreenLedMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#22C55E'),
      emissive: new THREE.Color('#22C55E'),
      emissiveIntensity: 1.9,
      roughness: 0.18,
      metalness: 0.1,
    }),
  );

  const rubberCableMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0B0C10'),
      roughness: 0.7,
      metalness: 0.08,
    }),
  );

  const goldPinMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4A14A'),
      roughness: 0.22,
      metalness: 0.92,
    }),
  );

  // Perforated emerald-green PCB layer inside module (stays louvered & see-through at any explode %)
  const pcbMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: modulePolymerMaps.map,
      alphaMap: moduleLouverAlpha,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.44,
      metalness: 0.28,
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
  root.name = 'pixiatech-ocrystal-transparent-assembly';

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
    shape.lineTo(-0.075, finHeight);
    shape.quadraticCurveTo(-baseDepthX * 0.62, finHeight * 0.56, -baseDepthX, 0.34);
    shape.closePath();

    const holeCount = finHeight > 4.4 ? 7 : finHeight > 2.8 ? 5 : 4;
    for (let h = 0; h < holeCount; h++) {
      const frac = 0.16 + (h / Math.max(1, holeCount - 1)) * 0.68;
      const hy = finHeight * frac;
      const backX = -baseDepthX * (1 - Math.pow(frac, 1.3) * 0.72);
      const hx = (backX + 0.02) * 0.5 - 0.02;
      const hr = Math.max(0.032, 0.068 * (1 - frac * 0.45));
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
    1: buildTrussFinGeo(1.66, 0.34),
    2: buildTrussFinGeo(3.46, 0.44),
    3: buildTrussFinGeo(5.26, 0.52),
  };

  const trussBasePlateGeo = track(new THREE.BoxGeometry(1.12, 0.045, 1.02));
  const casterWheelGeo = track(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 16));
  casterWheelGeo.rotateZ(Math.PI / 2);
  const casterHubGeo = track(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 14));
  casterHubGeo.rotateZ(Math.PI / 2);
  const trussClampBracketGeo = track(new THREE.BoxGeometry(0.075, 0.11, 0.22));
  const trussCrossTieGeo = track(new THREE.BoxGeometry(0.92, 0.045, 0.045));

  const trussStands: { col: number; group: THREE.Group; rowVariants: Record<1 | 2 | 3, THREE.Group> }[] = [];
  [-1, 0, 1].forEach((col) => {
    const standGroup = new THREE.Group();

    const basePlate = new THREE.Mesh(trussBasePlateGeo, mountSteelMaterial);
    basePlate.position.set(0, 0.09, -0.62);
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    standGroup.add(basePlate);

    for (const wx of [-0.46, 0.46]) {
      for (const wz of [-0.22, -1.02]) {
        const wheel = new THREE.Mesh(casterWheelGeo, darkRecessMaterial);
        wheel.position.set(wx, 0.055, wz);
        standGroup.add(wheel);
        const hub = new THREE.Mesh(casterHubGeo, arcRedAccentMaterial);
        hub.position.set(wx, 0.055, wz);
        standGroup.add(hub);
      }
    }

    const rowVariants = {} as Record<1 | 2 | 3, THREE.Group>;
    ([1, 2, 3] as const).forEach((rowCount) => {
      const variantGroup = new THREE.Group();
      const finHeight = rowCount === 1 ? 1.66 : rowCount === 2 ? 3.46 : 5.26;

      // Dual vertical truss fins placed wide outside the central Power Supply Box & medallion
      for (const fx of [-0.46, 0.46]) {
        const fin = new THREE.Mesh(trussFinGeos[rowCount], mountSteelMaterial);
        fin.position.set(fx + 0.022, 0.11, -0.32);
        fin.castShadow = true;
        fin.receiveShadow = true;
        variantGroup.add(fin);
      }

      for (let r = 0; r < rowCount; r++) {
        const tieY = r * CAB_H + 0.34;
        if (tieY <= finHeight - 0.14) {
          const tie = new THREE.Mesh(trussCrossTieGeo, mountSteelMaterial);
          tie.position.set(0, tieY, -0.6);
          variantGroup.add(tie);
        }
      }

      for (let r = 0; r < rowCount; r++) {
        for (const offset of [0.32, 1.48]) {
          const cy = r * CAB_H + offset;
          if (cy <= finHeight - 0.04) {
            for (const fx of [-0.46, 0.46]) {
              const bracket = new THREE.Mesh(trussClampBracketGeo, machinedSteelMaterial);
              bracket.position.set(fx, cy, -0.2);
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
  // 2. CHASSIS LAYER: OneDisplay O-Crystal Pro Die-Cast Aluminum Frame (1000 x 500 x 65 mm)
  // ---------------------------------------------------------------------------
  const frameOuterW = CAB_W + 0.012;
  const frameOuterH = CAB_H + 0.012;
  const frameRim = 0.088;
  const frameDepth = 0.108;
  const frameZCenter = -0.036;
  const stileGapHalfY = 0.25;
  const stileSegmentH = (frameOuterH - 2 * frameRim) / 2 - stileGapHalfY;

  const buildSubdividedRailsGeo = () => {
    const tRail = new THREE.BoxGeometry(frameOuterW - 0.18, frameRim, frameDepth, 56, 2, 2);
    tRail.translate(0, frameOuterH / 2 - frameRim / 2, frameZCenter);
    const bRail = new THREE.BoxGeometry(frameOuterW - 0.18, frameRim, frameDepth, 56, 2, 2);
    bRail.translate(0, -frameOuterH / 2 + frameRim / 2, frameZCenter);
    const merged = mergeGeometries([tRail, bRail], false);
    tRail.dispose();
    bRail.dispose();
    if (!merged) {
      throw new Error('Impossible de fusionner les longerons du châssis O-Crystal Pro.');
    }
    return track(merged);
  };

  const outerFrameGeo = buildSubdividedRailsGeo();
  registerBendGeometry(outerFrameGeo, 0, false, 'center', true);

  const heroRailsMesh = new THREE.Mesh(outerFrameGeo, chassisMaterial);
  heroRailsMesh.castShadow = true;
  heroRailsMesh.receiveShadow = true;
  chassisLayer.add(heroRailsMesh);

  // Shared O-Crystal Pro Hardware Geometries (Reference Items #1 through #10)
  const sideStileSegGeo = track(new THREE.BoxGeometry(frameRim, stileSegmentH, frameDepth, 2, 2, 2));
  const sidePocketHandleBarGeo = track(new THREE.BoxGeometry(0.044, 0.44, 0.038));
  const sideHandleArmGeo = track(new THREE.BoxGeometry(0.055, 0.045, 0.11));
  const sideHandleRedCapGeo = track(new THREE.BoxGeometry(0.032, 0.048, 0.028));

  // Corner bumper housings & signature brushed SILVER L-alignment corner plates (ref-hero.png)
  const cornerBumperGeo = track(new THREE.BoxGeometry(0.16, 0.16, 0.12));
  const cornerSilverVGeo = track(new THREE.BoxGeometry(0.068, 0.155, 0.018));
  const cornerSilverHGeo = track(new THREE.BoxGeometry(0.145, 0.046, 0.018));
  const cornerSilverPinGeo = track(new THREE.CylinderGeometry(0.016, 0.016, 0.038, 12));
  const cornerBoltGeo = track(new THREE.CylinderGeometry(0.011, 0.011, 0.022, 10));
  cornerBoltGeo.rotateX(Math.PI / 2);

  // #1 Main Lock & #2 Mate Lock: full-height intermediate vertical mullion bars at x = +-0.90
  const interMullionGeo = track(new THREE.BoxGeometry(0.056, CAB_H - 0.12, 0.058));
  const lockTopBlockGeo = track(new THREE.BoxGeometry(0.11, 0.088, 0.075));
  const lockSilverPinGeo = track(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 12));
  const hangingCylinderGripGeo = track(new THREE.CylinderGeometry(0.026, 0.026, 0.25, 14));
  const hangingGripArmGeo = track(new THREE.BoxGeometry(0.085, 0.038, 0.038));

  // #3 Edge Lock (Left -X) & #10 Arc Lock (Right +X with RED anodized trigger)
  const edgeLockHousingGeo = track(new THREE.BoxGeometry(0.11, 0.11, 0.09));
  const edgeLockSpringPinGeo = track(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 12));
  edgeLockSpringPinGeo.rotateZ(Math.PI / 2);
  const edgeLockCamLeverGeo = track(new THREE.BoxGeometry(0.12, 0.055, 0.028));

  const arcLockBodyGeo = track(new THREE.BoxGeometry(0.115, 0.12, 0.095));
  const arcLockSilverPlateGeo = track(new THREE.BoxGeometry(0.095, 0.082, 0.018));
  const arcLockRedTriggerGeo = track(new THREE.BoxGeometry(0.052, 0.044, 0.028));

  // #4 Top Carry Handle
  const topHandleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.23, 0, -0.025),
    new THREE.Vector3(-0.19, 0.075, -0.05),
    new THREE.Vector3(0.19, 0.075, -0.05),
    new THREE.Vector3(0.23, 0, -0.025),
  ]);
  const topHandleBarGeo = track(new THREE.TubeGeometry(topHandleCurve, 22, 0.019, 10, false));
  const topHandleClampGeo = track(new THREE.BoxGeometry(0.072, 0.052, 0.078));

  // #9 Central Power Supply Box (slim chamfered vertical heatsink column at x = 0)
  const spineBodyGeo = track(new THREE.BoxGeometry(0.255, 1.54, 0.135));
  const spineBevelCapGeo = track(new THREE.BoxGeometry(0.21, 1.48, 0.032));
  const spineHeatFinGeo = track(new THREE.BoxGeometry(0.215, 0.012, 0.024));
  const airPlugHousingGeo = track(new THREE.BoxGeometry(0.17, 0.115, 0.045)); // #6 Air-plug
  const signalLedBezelGeo = track(new THREE.CylinderGeometry(0.026, 0.03, 0.022, 18)); // #5 Signal Light collar
  signalLedBezelGeo.rotateX(Math.PI / 2);
  const signalLedLensGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 0.026, 16)); // #5 Green LED
  signalLedLensGeo.rotateX(Math.PI / 2);
  const hubCollarGeo = track(new THREE.CylinderGeometry(0.092, 0.102, 0.02, 32));
  hubCollarGeo.rotateX(Math.PI / 2);
  const medallionGeo = track(new THREE.CircleGeometry(0.084, 40));
  medallionGeo.rotateY(Math.PI);

  // #8 Signal and Power Input (twin stacked knurled metallic aviation connectors at bottom)
  const aviationFlangeGeo = track(new THREE.CylinderGeometry(0.054, 0.058, 0.036, 20));
  aviationFlangeGeo.rotateX(Math.PI / 2);
  const aviationNutGeo = track(new THREE.CylinderGeometry(0.042, 0.042, 0.048, 16));
  aviationNutGeo.rotateX(Math.PI / 2);
  const aviationCoreGeo = track(new THREE.CylinderGeometry(0.026, 0.026, 0.056, 14));
  aviationCoreGeo.rotateX(Math.PI / 2);
  const powerTailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, -0.78, -0.14),
    new THREE.Vector3(0.03, -0.94, -0.13),
    new THREE.Vector3(0.04, -1.08, -0.1),
  ]);
  const powerTailGeo = track(new THREE.TubeGeometry(powerTailCurve, 14, 0.018, 8, false));

  const buildCentralPowerSupplyBox = (): THREE.Group => {
    const spineGroup = new THREE.Group();

    const body = new THREE.Mesh(spineBodyGeo, chassisMaterial);
    body.position.set(0, 0, -0.105);
    body.castShadow = true;
    body.receiveShadow = true;
    spineGroup.add(body);

    const frontFace = new THREE.Mesh(spineBevelCapGeo, trimMaterial);
    frontFace.position.set(0, 0, -0.175);
    spineGroup.add(frontFace);

    // Fine horizontal heatsink ribs across upper and lower spine
    for (let i = 0; i < 16; i++) {
      const fy = -0.32 + i * 0.032;
      if (Math.abs(fy - 0.06) > 0.13) {
        const fin = new THREE.Mesh(spineHeatFinGeo, darkRecessMaterial);
        fin.position.set(0, fy, -0.188);
        spineGroup.add(fin);
      }
    }

    // #6 Signal and Power Air-plug (top square push-latch housing)
    const airPlug = new THREE.Mesh(airPlugHousingGeo, darkRecessMaterial);
    airPlug.position.set(0, 0.61, -0.188);
    spineGroup.add(airPlug);

    // #5 Signal Light (bright green status indicator LED + brushed collar)
    const ledBezel = new THREE.Mesh(signalLedBezelGeo, brushedSilverMaterial);
    ledBezel.position.set(0, 0.45, -0.194);
    spineGroup.add(ledBezel);
    const ledLens = new THREE.Mesh(signalLedLensGeo, signalGreenLedMaterial);
    ledLens.position.set(0, 0.45, -0.198);
    spineGroup.add(ledLens);

    // Circular PIXIATECH Medallion cleanly centered in middle of Power Supply Box
    const collar = new THREE.Mesh(hubCollarGeo, darkRecessMaterial);
    collar.position.set(0, 0.08, -0.194);
    spineGroup.add(collar);
    const medallion = new THREE.Mesh(medallionGeo, medallionMaterial);
    medallion.position.set(0, 0.08, -0.206);
    spineGroup.add(medallion);
    medallionMeshes.push(medallion);

    // #8 Signal and Power Input (twin vertical knurled metallic aviation connectors)
    for (const sockY of [-0.46, -0.63]) {
      const flange = new THREE.Mesh(aviationFlangeGeo, darkRecessMaterial);
      flange.position.set(0, sockY, -0.188);
      spineGroup.add(flange);
      const nut = new THREE.Mesh(aviationNutGeo, brushedSilverMaterial);
      nut.position.set(0, sockY, -0.202);
      spineGroup.add(nut);
      const core = new THREE.Mesh(aviationCoreGeo, machinedSteelMaterial);
      core.position.set(0, sockY, -0.208);
      spineGroup.add(core);
    }

    // Hanging braided bottom input cable tail
    const tail = new THREE.Mesh(powerTailGeo, rubberCableMaterial);
    spineGroup.add(tail);

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

    // Left & Right Outer Stiles + Side Carry Handles (with subtle RED lock caps)
    for (const sxSign of [-1, 1]) {
      const stileX = sxSign * (frameOuterW / 2 - frameRim / 2);
      const segY = stileGapHalfY + stileSegmentH / 2;

      for (const sySign of [-1, 1]) {
        const seg = new THREE.Mesh(sideStileSegGeo, chassisMaterial);
        seg.castShadow = true;
        seg.receiveShadow = true;
        addObj(seg, stileX, sySign * segY, frameZCenter);
      }

      // Open Side Ergonomic Carry Grip + subtle RED safety cap highlight
      const hBar = new THREE.Mesh(sidePocketHandleBarGeo, darkRecessMaterial);
      addObj(hBar, stileX + sxSign * 0.015, 0, -0.095);
      const hRedCap = new THREE.Mesh(sideHandleRedCapGeo, arcRedAccentMaterial);
      addObj(hRedCap, stileX + sxSign * 0.018, 0.13, -0.102);
      for (const aySign of [-1, 1]) {
        const hArm = new THREE.Mesh(sideHandleArmGeo, chassisMaterial);
        addObj(hArm, stileX + sxSign * 0.008, aySign * 0.21, -0.058);
      }

      // 4 Corner Housings + Crisp Brushed SILVER L-Shaped Corner Alignment Plates (ref-hero.png)
      for (const cySign of [-1, 1]) {
        const cornerX = sxSign * (CAB_W / 2 - 0.08);
        const cornerY = cySign * (CAB_H / 2 - 0.08);
        const cBumper = new THREE.Mesh(cornerBumperGeo, chassisMaterial);
        cBumper.castShadow = true;
        addObj(cBumper, cornerX, cornerY, -0.048);

        const silverV = new THREE.Mesh(cornerSilverVGeo, brushedSilverMaterial);
        addObj(silverV, sxSign * (CAB_W / 2 - 0.18), cySign * (CAB_H / 2 - 0.11), -0.088);

        const silverH = new THREE.Mesh(cornerSilverHGeo, brushedSilverMaterial);
        addObj(silverH, sxSign * (CAB_W / 2 - 0.14), cySign * (CAB_H / 2 - 0.055), -0.088);

        const silverPin = new THREE.Mesh(cornerSilverPinGeo, brushedSilverMaterial);
        addObj(silverPin, sxSign * (CAB_W / 2 - 0.18), cySign * (CAB_H / 2 - 0.025), -0.088);

        const bolt = new THREE.Mesh(cornerBoltGeo, darkRecessMaterial);
        addObj(bolt, sxSign * (CAB_W / 2 - 0.18), cySign * (CAB_H / 2 - 0.13), -0.098);
      }
    }

    // #1 Main Lock (+0.90) & #2 Mate Lock (-0.90): Intermediate Vertical Mullions + Top Hanging Handles
    for (const mxSign of [-1, 1]) {
      const mx = mxSign * (CAB_W * 0.25);
      const sideKey: 'left' | 'right' = mxSign < 0 ? 'left' : 'right';

      const mullion = new THREE.Mesh(interMullionGeo, chassisMaterial);
      mullion.castShadow = true;
      addObj(mullion, mx, 0, -0.068, 0, 0, sideKey, 'carriage');

      const lockBlock = new THREE.Mesh(lockTopBlockGeo, trimMaterial);
      addObj(lockBlock, mx, CAB_H / 2 - 0.065, -0.095, 0, 0, sideKey, 'carriage');

      const lockPin = new THREE.Mesh(lockSilverPinGeo, brushedSilverMaterial);
      addObj(lockPin, mx, CAB_H / 2 - 0.02, -0.095, 0, 0, sideKey, 'carriage');

      // Characteristic hanging vertical cylindrical black lock handle (ref-hero.png)
      const hArm = new THREE.Mesh(hangingGripArmGeo, trimMaterial);
      addObj(hArm, mx - mxSign * 0.045, CAB_H / 2 - 0.15, -0.115, 0, 0, sideKey, 'carriage');
      const hCylinder = new THREE.Mesh(hangingCylinderGripGeo, darkRecessMaterial);
      addObj(hCylinder, mx - mxSign * 0.08, CAB_H / 2 - 0.26, -0.125, 0, 0, sideKey, 'paddle');
    }

    // #3 Edge Lock (Left side -X): Spring-Pin Clamps & Matte Black Cam Levers
    for (const lySign of [-1, 1]) {
      const ly = lySign * 0.45;
      const eHousing = new THREE.Mesh(edgeLockHousingGeo, trimMaterial);
      addObj(eHousing, -CAB_W / 2 - 0.02, ly, -0.085, 0, 0, 'left', 'carriage');
      const ePin = new THREE.Mesh(edgeLockSpringPinGeo, brushedSilverMaterial);
      addObj(ePin, -CAB_W / 2 + 0.08, ly, -0.09, 0, 0, 'left', 'carriage');
      const eLever = new THREE.Mesh(edgeLockCamLeverGeo, darkRecessMaterial);
      addObj(eLever, -CAB_W / 2 + 0.17, ly - lySign * 0.045, -0.125, 0, -0.32, 'left', 'paddle');
    }

    // #10 Arc Lock (Right side +X): Curved-Angle Lock Blocks + Compact Recessed RED Release Triggers
    for (const aySign of [-1, 1]) {
      const ay = aySign * 0.45;
      const aBody = new THREE.Mesh(arcLockBodyGeo, chassisMaterial);
      aBody.castShadow = true;
      addObj(aBody, CAB_W / 2 + 0.015, ay, -0.086, 0, 0, 'right', 'carriage');

      const aPlate = new THREE.Mesh(arcLockSilverPlateGeo, brushedSilverMaterial);
      addObj(aPlate, CAB_W / 2 - 0.04, ay, -0.125, 0, 0, 'right', 'carriage');

      // Compact inset RED anodized Arc Lock trigger (ref-product-mid.png #10 & ref-scroll-lock.png)
      const aRedTrigger = new THREE.Mesh(arcLockRedTriggerGeo, arcRedAccentMaterial);
      addObj(aRedTrigger, CAB_W / 2 + 0.02, ay, -0.132, 0, aySign * 0.12, 'right', 'paddle');
    }

    // #4 Top Folding Matte-Black Carry Bar at x = 0
    const topBar = new THREE.Mesh(topHandleBarGeo, darkRecessMaterial);
    addObj(topBar, 0, CAB_H / 2 - 0.015, -0.048);
    for (const mx of [-0.23, 0.23]) {
      const mnt = new THREE.Mesh(topHandleClampGeo, machinedSteelMaterial);
      addObj(mnt, mx, CAB_H / 2 - 0.015, -0.072);
    }

    // #9 Central Power Supply Box w/ #5 Green Signal Light, #6 Air-plug, #8 Dual Aviation Sockets & PIXIATECH Logo
    addObj(buildCentralPowerSupplyBox(), 0, 0, 0);
  };

  populateSculptedHardware(chassisLayer, true, 'center');

  // Ultra-slim internal cross-ribs behind modules so open transparency remains unobstructed
  const vRibGeo = track(new THREE.BoxGeometry(0.04, CAB_H - 0.16, 0.026, 2, 36, 1));
  vRibGeo.translate(0, 0, -0.022);
  registerBendGeometry(vRibGeo, 0, false, 'center', true);
  const vRib = new THREE.Mesh(vRibGeo, trimMaterial);
  chassisLayer.add(vRib);

  const hRibGeo = track(new THREE.BoxGeometry(CAB_W - 0.16, 0.036, 0.026, 48, 2, 1));
  hRibGeo.translate(0, 0, -0.022);
  registerBendGeometry(hRibGeo, 0, false, 'center', true);
  const hRib = new THREE.Mesh(hRibGeo, trimMaterial);
  chassisLayer.add(hRib);

  const chassisEdges = track(new THREE.EdgesGeometry(outerFrameGeo, 20));
  registerBendGeometry(chassisEdges, 0, false, 'center', true);
  const chassisWire = new THREE.LineSegments(chassisEdges, cadLineMaterial);
  wireframeOverlayGroup.add(chassisWire);

  // ---------------------------------------------------------------------------
  // 3. MODULES & EMITTERS LAYERS: 4 Louvered Transparent Modules (500 x 250 mm)
  // ---------------------------------------------------------------------------
  const masterCanvas = createMasterEmitterCanvas(initialPattern, initialPitch);
  const modules: ModuleUnitRef[] = [];
  const baseTrayGeo = track(new THREE.BoxGeometry(MOD_W - 0.012, MOD_H - 0.012, 0.022, 28, 2, 1));
  const basePcbGeo = track(new THREE.BoxGeometry(MOD_W - 0.04, MOD_H - 0.04, 0.008, 24, 2, 1));
  const baseEmitterGeo = track(new THREE.BoxGeometry(MOD_W, MOD_H, 0.01, 32, 2, 1));
  const baseHitProxyGeo = track(new THREE.BoxGeometry(MOD_W - 0.006, MOD_H - 0.006, 0.08, 16, 2, 1));
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
        colIdx: gridCol - 1,
        rowFromBottom: gridRow + 1,
        cols: spec.cols,
        rows: spec.rows,
      };
    }
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
    tileGroup.position.set(0, qy, 0.018);

    const trayGeo = track(baseTrayGeo.clone());
    trayGeo.translate(qx, 0, -0.008);
    registerBendGeometry(trayGeo, 0.018, false, 'center', false);
    const tray = new THREE.Mesh(trayGeo, outdoorShroudMaterial);
    tray.castShadow = true;
    tray.receiveShadow = true;
    tileGroup.add(tray);

    // Internal louvered PCB trace frame (hidden when seated flush, stays louvered when exploded)
    const pcbGeo = track(basePcbGeo.clone());
    pcbGeo.translate(qx, 0, 0.006);
    registerBendGeometry(pcbGeo, 0.018, false, 'center', false);
    const pcb = new THREE.Mesh(pcbGeo, pcbMaterial);
    pcb.name = 'internal-pcb';
    tileGroup.add(pcb);

    modulesLayer.add(tileGroup);

    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(0, qy, 0.042);

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
        alphaMap: moduleLouverAlpha,
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        roughness: 0.22,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.85,
      }),
    );

    const emitterGeo = track(baseEmitterGeo.clone());
    emitterGeo.translate(qx, 0, 0);
    registerBendGeometry(emitterGeo, 0.042, false, 'center', false);
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
    registerBendGeometry(emitterEdgesGeo, 0.042, false, 'center', false);
    const highlightEdges = new THREE.LineSegments(emitterEdgesGeo, highlightMat);
    highlightEdges.visible = false;
    emitterGroup.add(highlightEdges);

    const hitProxyGeo = track(baseHitProxyGeo.clone());
    hitProxyGeo.translate(qx, 0, 0);
    registerBendGeometry(hitProxyGeo, 0.042, true, 'center', false);
    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.userData = { moduleIndex: idx };
    hitProxy.layers.set(1);
    emitterGroup.add(hitProxy);

    emittersLayer.add(emitterGroup);

    modules.push({
      id: idx,
      label: `Module M${idx + 1} · 500 × 250 mm`,
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
  // 4. SURFACE ARRAY MODE (3x2, 2x3, 3x3 Curved Transparent Walls + Jumpers)
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

    const wingVRibGeo = track(new THREE.BoxGeometry(0.04, CAB_H - 0.16, 0.026, 2, 36, 1));
    wingVRibGeo.translate(0, 0, -0.022);
    registerBendGeometry(wingVRibGeo, 0, false, scope, true);

    const wingHRibGeo = track(new THREE.BoxGeometry(CAB_W - 0.16, 0.036, 0.026, 48, 2, 1));
    wingHRibGeo.translate(0, 0, -0.022);
    registerBendGeometry(wingHRibGeo, 0, false, scope, true);

    const trayGeo = track(new THREE.BoxGeometry(CAB_W - 0.012, CAB_H - 0.012, 0.022, 48, 2, 1));
    registerBendGeometry(trayGeo, 0.018, false, scope, false);

    const faceGeo = track(new THREE.BoxGeometry(CAB_W, CAB_H, 0.01, 48, 2, 1));
    registerBendGeometry(faceGeo, 0.042, false, scope, false);

    return { railsGeo, vRibGeo: wingVRibGeo, hRibGeo: wingHRibGeo, trayGeo, faceGeo };
  };

  const centerColTrayGeo = track(
    new THREE.BoxGeometry(CAB_W - 0.012, CAB_H - 0.012, 0.022, 48, 2, 1),
  );
  registerBendGeometry(centerColTrayGeo, 0.018, false, 'center', false);

  const centerColFaceGeo = track(new THREE.BoxGeometry(CAB_W, CAB_H, 0.01, 48, 2, 1));
  registerBendGeometry(centerColFaceGeo, 0.042, false, 'center', false);

  const centerColGeoSet: WingGeoSet = {
    railsGeo: outerFrameGeo,
    vRibGeo,
    hRibGeo,
    trayGeo: centerColTrayGeo,
    faceGeo: centerColFaceGeo,
  };

  const leftWingGeoSet = createWingGeoSet('left-wing');
  const rightWingGeoSet = createWingGeoSet('right-wing');

  const jumperCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.42, -0.2),
    new THREE.Vector3(-0.92, 0.12, -0.28),
    new THREE.Vector3(-1.82, -0.14, -0.25),
  ]);
  const jumperCableGeo = track(new THREE.TubeGeometry(jumperCableCurve, 18, 0.02, 8, false));
  const jumperPlugGeo = track(new THREE.CylinderGeometry(0.036, 0.036, 0.09, 12));
  const topCurveBridgePlateGeo = track(new THREE.BoxGeometry(0.28, 0.04, 0.12));

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

    const trayBack = new THREE.Mesh(geoSet.trayGeo, surroundShroudMaterial);
    trayBack.position.set(0, 0, 0.01);
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
        alphaMap: cabinetLouverAlpha,
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        roughness: 0.22,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.85,
      }),
    );

    const face = new THREE.Mesh(geoSet.faceGeo, sEmitterMat);
    face.position.set(0, 0, 0.042);
    face.castShadow = true;
    face.receiveShadow = true;
    g.add(face);

    const jumperGroup = new THREE.Group();
    const cable = new THREE.Mesh(jumperCableGeo, rubberCableMaterial);
    jumperGroup.add(cable);
    const plug = new THREE.Mesh(jumperPlugGeo, trimMaterial);
    plug.position.set(-0.22, 0.42, -0.2);
    plug.rotation.z = 0.65;
    jumperGroup.add(plug);
    g.add(jumperGroup);

    const topBridgeGroup = new THREE.Group();
    const bridgePlate = new THREE.Mesh(topCurveBridgePlateGeo, brushedSilverMaterial);
    bridgePlate.position.set(-CAB_W / 2, CAB_H / 2 - 0.02, -0.08);
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
        slideDeltaX = slideNorm * (rt.slideSide === 'left' ? 0.1 : -0.1);
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
      m.emitterMat.emissiveIntensity = intensity;
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

  // Apply initial chassis finish if specified
  updateFinish(initialFinish);

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

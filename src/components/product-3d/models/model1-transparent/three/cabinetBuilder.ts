import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  CHASSIS_FINISHES,
  getHorizontalSlotIndex,
  type AssemblyLayerId,
  type ChassisFinishId,
  type DisplayPatternId,
  type HorizontalPanelCount,
  type InstallationModeId,
  type PitchTierId,
} from '../data/panelSpecs';
import {
  createArchitecturalWallMaps,
  createBeadBlastedCastMap,
  createBrushedMetalMaps,
  createHolographicEmitterAlphaMap,
  createHolographicMeshAlphaMap,
  createHolographicMeshMaps,
  createIndicatorGlowTexture,
  createMasterEmitterCanvas,
  createPixiatechBarLogoTexture,
  createPosterHousingRibMaps,
  createSlicedEmitterTexture,
  drawHolographicVideoFrame,
} from './proceduralTextures';

// Scale: 1 Three.js unit = ~555.5 mm
// OneDisplay O-Raster Holographic Invisible LED Poster = 1000 x 2000 x 55 mm => 1.80 x 3.60 x 0.10 units
export const CAB_W = 1.8;
export const CAB_H = 3.6;
export const CAB_D = 0.1;
export const TOP_BEAM_H = 0.175;
export const BOTTOM_BEAM_H = 0.155;
export const LEG_HEIGHT = 0.36; // ~200 mm floor clearance for 2400 mm total standing height
export const WALL_CLEARANCE = 0.52;
export const SUSPENDED_CLEARANCE = 0.64;
export const MOD_W = CAB_W / 2; // 0.90 (500 mm)
export const MOD_H = CAB_H / 2; // 1.80 (1000 mm)

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
  gridCol: number; // -1 (left), 1 (right-1), 2 (right-2)
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
  trussStands: { col: number; group: THREE.Group }[];
  wallMountGroup: THREE.Group;
  wallBackdrop: THREE.Mesh;
  wallPlinth: THREE.Mesh;
  wallTopCap: THREE.Mesh;
  wallColumnRigs: { col: number; group: THREE.Group; seamTie: THREE.Group }[];
  suspendedMountGroup: THREE.Group;
  ceilingRailMesh: THREE.Mesh;
  ceilingEndCaps: [THREE.Mesh, THREE.Mesh];
  ceilingDropRods: THREE.Group;
  suspendedColumnRigs: { col: number; group: THREE.Group; seamBridge: THREE.Group }[];
  modules: ModuleUnitRef[];
  chassisMaterial: THREE.MeshPhysicalMaterial;
  trimMaterial: THREE.MeshStandardMaterial;
  machinedSteelMaterial: THREE.MeshStandardMaterial;
  goldPinMaterial: THREE.MeshStandardMaterial;
  mountSteelMaterial: THREE.MeshStandardMaterial;
  cadLineMaterial: THREE.LineBasicMaterial;
  updateFinish: (finishId: ChassisFinishId) => void;
  updatePattern: (
    pattern: DisplayPatternId,
    pitch: PitchTierId,
    panelCount: HorizontalPanelCount,
  ) => void;
  updateVideoFrame: (
    timeSec: number,
    panelCount: HorizontalPanelCount,
    customVideoEl?: HTMLVideoElement | null,
  ) => void;
  updateInstallationMode: (
    mode: InstallationModeId,
    panelCount: HorizontalPanelCount,
    showStand: boolean,
  ) => void;
  updateSelection: (
    activeLayer: AssemblyLayerId | null,
    selectedModuleIdx: number | null,
    hoveredModuleIdx: number | null,
    showWireframe: boolean,
  ) => void;
  dispose: () => void;
}

export function buildCabinetAssembly(
  maxAnisotropy: number,
  initialFinish: ChassisFinishId,
  initialPattern: DisplayPatternId,
  initialPitch: PitchTierId,
  initialPanelCount: HorizontalPanelCount,
  onTextureLoaded?: () => void,
): CabinetAssembly {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const { bumpMap, roughnessMap } = createBrushedMetalMaps(maxAnisotropy);
  const castBumpMap = track(createBeadBlastedCastMap(maxAnisotropy));
  const housingRibMaps = createPosterHousingRibMaps(maxAnisotropy);
  const wallMaps = createArchitecturalWallMaps(maxAnisotropy);
  track(bumpMap);
  track(roughnessMap);
  track(housingRibMaps.bumpMap);
  track(housingRibMaps.roughnessMap);
  track(wallMaps.map);
  track(wallMaps.bumpMap);

  // Circular perforated holographic micro-mesh (24x24 holes per 500x500 tile -> 1x2 repeat per 500x1000 module)
  const MESH_CELLS_PER_TILE = 24;
  const moduleMeshAlpha = track(
    createHolographicMeshAlphaMap(MESH_CELLS_PER_TILE, 1, 2, maxAnisotropy),
  );
  const cabinetMeshAlpha = track(
    createHolographicMeshAlphaMap(MESH_CELLS_PER_TILE, 2, 4, maxAnisotropy),
  );
  const moduleEmitterAlpha = track(
    createHolographicEmitterAlphaMap(MESH_CELLS_PER_TILE, 1, 2, maxAnisotropy),
  );
  const cabinetEmitterAlpha = track(
    createHolographicEmitterAlphaMap(MESH_CELLS_PER_TILE, 2, 4, maxAnisotropy),
  );

  const moduleFilmMaps = createHolographicMeshMaps(MESH_CELLS_PER_TILE, 1, 2, maxAnisotropy);
  track(moduleFilmMaps.map);
  track(moduleFilmMaps.bumpMap);
  track(moduleFilmMaps.roughnessMap);

  const surroundFilmMaps = createHolographicMeshMaps(MESH_CELLS_PER_TILE, 2, 4, maxAnisotropy);
  track(surroundFilmMaps.map);
  track(surroundFilmMaps.bumpMap);
  track(surroundFilmMaps.roughnessMap);

  const barLogoTex = track(createPixiatechBarLogoTexture(maxAnisotropy, onTextureLoaded));

  const chassisMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#090A0E'),
      roughness: 0.32,
      metalness: 0.58,
      bumpMap: housingRibMaps.bumpMap,
      bumpScale: 0.016,
      roughnessMap: housingRibMaps.roughnessMap,
      clearcoat: 0.5,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.8,
    }),
  );

  const trimMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#101218'),
      roughness: 0.32,
      metalness: 0.68,
      bumpMap: castBumpMap,
      bumpScale: 0.0018,
      envMapIntensity: 1.55,
    }),
  );

  const darkRecessMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#050608'),
      roughness: 0.54,
      metalness: 0.28,
      bumpMap: castBumpMap,
      bumpScale: 0.0015,
    }),
  );

  const brushedSilverMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C8CDD6'),
      roughness: 0.22,
      metalness: 0.9,
      bumpMap,
      bumpScale: 0.0015,
      envMapIntensity: 1.7,
    }),
  );

  const machinedSteelMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#646D7C'),
      roughness: 0.26,
      metalness: 0.88,
      bumpMap,
      bumpScale: 0.0015,
      envMapIntensity: 1.5,
    }),
  );

  const statusCyanLedMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#38BDF8'),
      emissive: new THREE.Color('#22C55E'),
      emissiveIntensity: 1.85,
      roughness: 0.16,
      metalness: 0.12,
    }),
  );

  const greenGlowTex = track(createIndicatorGlowTexture('167, 243, 208', '34, 197, 94'));
  const redGlowTex = track(createIndicatorGlowTexture('254, 202, 202', '239, 68, 68'));

  const greenLedButtonMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#4ADE80'),
      emissive: new THREE.Color('#22C55E'),
      emissiveIntensity: 2.8,
      roughness: 0.14,
      metalness: 0.05,
      toneMapped: false,
    }),
  );

  const redLedButtonMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F87171'),
      emissive: new THREE.Color('#EF4444'),
      emissiveIntensity: 2.6,
      roughness: 0.14,
      metalness: 0.05,
      toneMapped: false,
    }),
  );

  const greenLedCoreMaterial = track(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#DCFCE7'),
      transparent: true,
      opacity: 0.72,
      toneMapped: false,
    }),
  );

  const redLedCoreMaterial = track(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FEE2E2'),
      transparent: true,
      opacity: 0.72,
      toneMapped: false,
    }),
  );

  const makeGlowHaloMaterial = (map: THREE.Texture, opacity: number) =>
    track(
      new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );

  const greenBeamGlowMat = makeGlowHaloMaterial(greenGlowTex, 0.42);
  const greenPlateGlowMat = makeGlowHaloMaterial(greenGlowTex, 0.78);
  const greenBloomGlowMat = makeGlowHaloMaterial(greenGlowTex, 0.68);

  const redBeamGlowMat = makeGlowHaloMaterial(redGlowTex, 0.42);
  const redPlateGlowMat = makeGlowHaloMaterial(redGlowTex, 0.78);
  const redBloomGlowMat = makeGlowHaloMaterial(redGlowTex, 0.68);

  const rubberCableMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#090A0D'),
      roughness: 0.68,
      metalness: 0.1,
    }),
  );

  const goldPinMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4A14A'),
      roughness: 0.22,
      metalness: 0.92,
    }),
  );

  const filmBackingMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: moduleFilmMaps.map,
      bumpMap: moduleFilmMaps.bumpMap,
      bumpScale: 0.012,
      roughnessMap: moduleFilmMaps.roughnessMap,
      alphaMap: moduleMeshAlpha,
      alphaTest: 0.44,
      side: THREE.DoubleSide,
      roughness: 0.32,
      metalness: 0.28,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.6,
    }),
  );

  const surroundBackingMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: surroundFilmMaps.map,
      bumpMap: surroundFilmMaps.bumpMap,
      bumpScale: 0.012,
      roughnessMap: surroundFilmMaps.roughnessMap,
      alphaMap: cabinetMeshAlpha,
      alphaTest: 0.44,
      side: THREE.DoubleSide,
      roughness: 0.32,
      metalness: 0.28,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.6,
    }),
  );

  const pcbMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: moduleFilmMaps.map,
      alphaMap: moduleMeshAlpha,
      alphaTest: 0.44,
      side: THREE.DoubleSide,
      roughness: 0.42,
      metalness: 0.35,
    }),
  );

  const mountSteelMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#13161C'),
      roughness: 0.38,
      metalness: 0.76,
      bumpMap: castBumpMap,
      bumpScale: 0.002,
      envMapIntensity: 1.45,
    }),
  );

  const architecturalWallMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: wallMaps.map,
      bumpMap: wallMaps.bumpMap,
      bumpScale: 0.008,
      roughness: 0.86,
      metalness: 0.06,
      envMapIntensity: 0.45,
    }),
  );

  const barLogoMaterial = track(
    new THREE.MeshBasicMaterial({
      map: barLogoTex,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
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
  root.name = 'pixiatech-oraster-holographic-poster';

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

  const beamWidth = CAB_W + 0.04;
  const beamDepth = 0.168;
  const topBeamCenterY = CAB_H / 2 + TOP_BEAM_H / 2;
  const bottomBeamCenterY = -CAB_H / 2 - BOTTOM_BEAM_H / 2;
  const topBeamTopY = topBeamCenterY + TOP_BEAM_H / 2;
  const bottomBeamBottomY = bottomBeamCenterY - BOTTOM_BEAM_H / 2;

  const HORIZONTAL_COLS = [-1, 0, 1, 2] as const;

  // ---------------------------------------------------------------------------
  // 1A. MOUNT MODE 1: SUR PIED — Twin Angled A-Frame Floor Caster Brackets (unchanged!)
  // ---------------------------------------------------------------------------
  const legClampUGeo = track(new THREE.BoxGeometry(0.115, 0.165, 0.215));
  const legClampBoltGeo = track(new THREE.CylinderGeometry(0.014, 0.014, 0.228, 12));
  legClampBoltGeo.rotateX(Math.PI / 2);

  const buildDiagonalStrutGeo = (zSign: 1 | -1) => {
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(0, LEG_HEIGHT + 0.02, zSign * 0.07),
      new THREE.Vector3(0, 0.082, zSign * 0.42),
    );
    return track(new THREE.TubeGeometry(curve, 4, 0.024, 8, false));
  };
  const strutFrontGeo = buildDiagonalStrutGeo(1);
  const strutRearGeo = buildDiagonalStrutGeo(-1);
  const legCrossBraceGeo = track(new THREE.BoxGeometry(0.042, 0.022, 0.48));
  const casterForkGeo = track(new THREE.BoxGeometry(0.05, 0.036, 0.068));
  const casterWheelGeo = track(new THREE.CylinderGeometry(0.038, 0.038, 0.036, 16));
  casterWheelGeo.rotateZ(Math.PI / 2);
  const casterAxleGeo = track(new THREE.CylinderGeometry(0.015, 0.015, 0.044, 12));
  casterAxleGeo.rotateZ(Math.PI / 2);

  const trussStands: { col: number; group: THREE.Group }[] = [];
  HORIZONTAL_COLS.forEach((col) => {
    const standGroup = new THREE.Group();

    for (const lx of [-0.58, 0.58]) {
      const bracketGroup = new THREE.Group();
      bracketGroup.position.set(lx, 0, 0);

      const clampU = new THREE.Mesh(legClampUGeo, trimMaterial);
      clampU.position.set(0, LEG_HEIGHT + BOTTOM_BEAM_H * 0.48, 0);
      clampU.castShadow = true;
      bracketGroup.add(clampU);

      const clampBolt = new THREE.Mesh(legClampBoltGeo, brushedSilverMaterial);
      clampBolt.position.set(0, LEG_HEIGHT + BOTTOM_BEAM_H * 0.48, 0);
      bracketGroup.add(clampBolt);

      const fStrut = new THREE.Mesh(strutFrontGeo, mountSteelMaterial);
      fStrut.castShadow = true;
      bracketGroup.add(fStrut);

      const rStrut = new THREE.Mesh(strutRearGeo, mountSteelMaterial);
      rStrut.castShadow = true;
      bracketGroup.add(rStrut);

      const midBrace = new THREE.Mesh(legCrossBraceGeo, mountSteelMaterial);
      midBrace.position.set(0, 0.16, 0);
      bracketGroup.add(midBrace);

      for (const wz of [-0.42, 0.42]) {
        const fork = new THREE.Mesh(casterForkGeo, trimMaterial);
        fork.position.set(0, 0.068, wz);
        bracketGroup.add(fork);

        const wheel = new THREE.Mesh(casterWheelGeo, darkRecessMaterial);
        wheel.position.set(0, 0.038, wz);
        wheel.castShadow = true;
        bracketGroup.add(wheel);

        const axle = new THREE.Mesh(casterAxleGeo, brushedSilverMaterial);
        axle.position.set(0, 0.038, wz);
        bracketGroup.add(axle);
      }

      standGroup.add(bracketGroup);
    }

    standGroup.visible = col === 0;
    mountLayer.add(standGroup);
    trussStands.push({ col, group: standGroup });
  });

  // ---------------------------------------------------------------------------
  // 1B. MOUNT MODE 2: MURAL — Architectural Wall Backdrop + Heavy-Duty Cantilever Brackets
  // ---------------------------------------------------------------------------
  const wallMountGroup = new THREE.Group();
  wallMountGroup.name = 'mount-wall-group';
  wallMountGroup.visible = false;
  mountLayer.add(wallMountGroup);

  const wallH = CAB_H + TOP_BEAM_H + BOTTOM_BEAM_H + 1.45; // 5.38 units (~2.98 m wall height)
  const wallFloorY = bottomBeamBottomY - WALL_CLEARANCE; // -2.475 -> sits flush on floor
  const wallCenterY = wallFloorY + wallH * 0.5;
  const wallFrontZ = -0.22;
  const wallDepth = 0.12;

  const wallBackdropGeo = track(new THREE.BoxGeometry(1, wallH, wallDepth));
  const wallBackdrop = new THREE.Mesh(wallBackdropGeo, architecturalWallMaterial);
  wallBackdrop.position.set(0, wallCenterY, wallFrontZ - wallDepth * 0.5);
  wallBackdrop.receiveShadow = true;
  wallMountGroup.add(wallBackdrop);

  const wallPlinthGeo = track(new THREE.BoxGeometry(1, 0.14, 0.035));
  const wallPlinth = new THREE.Mesh(wallPlinthGeo, trimMaterial);
  wallPlinth.position.set(0, wallFloorY + 0.07, wallFrontZ + 0.015);
  wallMountGroup.add(wallPlinth);

  const wallTopCapGeo = track(new THREE.BoxGeometry(1, 0.06, wallDepth + 0.03));
  const wallTopCap = new THREE.Mesh(wallTopCapGeo, trimMaterial);
  wallTopCap.position.set(0, wallFloorY + wallH + 0.02, wallFrontZ - wallDepth * 0.5 + 0.01);
  wallMountGroup.add(wallTopCap);

  const wallRailGeo = track(new THREE.BoxGeometry(0.068, CAB_H + TOP_BEAM_H + BOTTOM_BEAM_H + 0.14, 0.032));
  const wallFlangeGeo = track(new THREE.BoxGeometry(0.135, 0.11, 0.018));
  const wallBoltGeo = track(new THREE.CylinderGeometry(0.012, 0.012, 0.032, 6));
  wallBoltGeo.rotateX(Math.PI / 2);
  const wallArmGeo = track(new THREE.BoxGeometry(0.056, 0.095, 0.13));
  const wallBeamClampGeo = track(new THREE.BoxGeometry(0.11, 0.135, 0.048));
  const wallCrossCleatGeo = track(new THREE.BoxGeometry(1.24, 0.055, 0.026));
  const wallSeamSpliceGeo = track(new THREE.BoxGeometry(0.24, 0.11, 0.032));

  const wallColumnRigs: { col: number; group: THREE.Group; seamTie: THREE.Group }[] = [];
  HORIZONTAL_COLS.forEach((col) => {
    const colGroup = new THREE.Group();
    colGroup.position.set(col * CAB_W, 0, 0);

    // Horizontal French-cleat wall mounting bars linking twin vertical rails
    for (const cy of [topBeamCenterY, bottomBeamCenterY]) {
      const cleat = new THREE.Mesh(wallCrossCleatGeo, mountSteelMaterial);
      cleat.position.set(0, cy, wallFrontZ + 0.014);
      colGroup.add(cleat);
    }

    for (const lx of [-0.58, 0.58]) {
      // Vertical anodized wall extrusion rail anchored flat to the wall
      const rail = new THREE.Mesh(wallRailGeo, mountSteelMaterial);
      rail.position.set(lx, 0.01, wallFrontZ + 0.024);
      rail.castShadow = true;
      colGroup.add(rail);

      // Anchor flanges & hex lag bolts along the vertical wall rail
      for (const fy of [topBeamCenterY + 0.02, 0.55, -0.55, bottomBeamCenterY - 0.02]) {
        const flange = new THREE.Mesh(wallFlangeGeo, trimMaterial);
        flange.position.set(lx, fy, wallFrontZ + 0.01);
        colGroup.add(flange);

        for (const bx of [-0.042, 0.042]) {
          const bolt = new THREE.Mesh(wallBoltGeo, brushedSilverMaterial);
          bolt.position.set(lx + bx, fy, wallFrontZ + 0.022);
          colGroup.add(bolt);
        }
      }

      // Cantilevered stand-off brackets gripping top & bottom controller beams
      for (const by of [topBeamCenterY, bottomBeamCenterY]) {
        const arm = new THREE.Mesh(wallArmGeo, trimMaterial);
        arm.position.set(lx, by, -0.145);
        arm.castShadow = true;
        colGroup.add(arm);

        const clamp = new THREE.Mesh(wallBeamClampGeo, machinedSteelMaterial);
        clamp.position.set(lx, by, -0.092);
        colGroup.add(clamp);

        const lockPin = new THREE.Mesh(legClampBoltGeo, brushedSilverMaterial);
        lockPin.position.set(lx, by, -0.095);
        lockPin.scale.set(0.8, 0.8, 0.45);
        colGroup.add(lockPin);
      }
    }

    // Inter-panel horizontal rear seam alignment plates
    const seamTie = new THREE.Group();
    for (const sy of [topBeamCenterY, bottomBeamCenterY]) {
      const splice = new THREE.Mesh(wallSeamSpliceGeo, brushedSilverMaterial);
      splice.position.set(-CAB_W * 0.5, sy, -0.098);
      seamTie.add(splice);
    }
    seamTie.visible = false;
    colGroup.add(seamTie);

    colGroup.visible = col === 0;
    wallMountGroup.add(colGroup);
    wallColumnRigs.push({ col, group: colGroup, seamTie });
  });

  // ---------------------------------------------------------------------------
  // 1C. MOUNT MODE 3: SUSPENDU — Overhead Ceiling Rigging Rail + Braided Steel Cables
  // ---------------------------------------------------------------------------
  const suspendedMountGroup = new THREE.Group();
  suspendedMountGroup.name = 'mount-suspended-group';
  suspendedMountGroup.visible = false;
  mountLayer.add(suspendedMountGroup);

  const ceilingRailY = topBeamTopY + 1.08;
  const cableSpanH = ceilingRailY - (topBeamTopY + 0.065);
  const ceilingRailGeo = track(new THREE.BoxGeometry(1, 0.11, 0.14));
  const ceilingRailMesh = new THREE.Mesh(ceilingRailGeo, trimMaterial);
  ceilingRailMesh.position.set(0, ceilingRailY, 0);
  ceilingRailMesh.castShadow = true;
  suspendedMountGroup.add(ceilingRailMesh);

  const ceilingEndCapGeo = track(new THREE.BoxGeometry(0.036, 0.125, 0.155));
  const capLeft = new THREE.Mesh(ceilingEndCapGeo, machinedSteelMaterial);
  const capRight = new THREE.Mesh(ceilingEndCapGeo, machinedSteelMaterial);
  capLeft.position.set(-1, ceilingRailY, 0);
  capRight.position.set(1, ceilingRailY, 0);
  suspendedMountGroup.add(capLeft, capRight);
  const ceilingEndCaps: [THREE.Mesh, THREE.Mesh] = [capLeft, capRight];

  const ceilingDropRods = new THREE.Group();
  const ceilingRodGeo = track(new THREE.CylinderGeometry(0.022, 0.022, 0.9, 12));
  const ceilingFlangeGeo = track(new THREE.CylinderGeometry(0.065, 0.072, 0.035, 16));
  [-1, 0, 1].forEach((idx) => {
    const rod = new THREE.Mesh(ceilingRodGeo, mountSteelMaterial);
    rod.position.set(idx * 1.4, ceilingRailY + 0.5, 0);
    ceilingDropRods.add(rod);

    const flange = new THREE.Mesh(ceilingFlangeGeo, brushedSilverMaterial);
    flange.position.set(idx * 1.4, ceilingRailY + 0.07, 0);
    ceilingDropRods.add(flange);
  });
  suspendedMountGroup.add(ceilingDropRods);

  const shackleGeo = track(new THREE.TorusGeometry(0.026, 0.0085, 10, 18));
  const turnbuckleGeo = track(new THREE.CylinderGeometry(0.018, 0.018, 0.095, 12));
  const cableGeo = track(new THREE.CylinderGeometry(0.008, 0.008, cableSpanH, 10));
  const topGripperGeo = track(new THREE.CylinderGeometry(0.026, 0.032, 0.075, 14));
  const powerPodGeo = track(new THREE.BoxGeometry(0.13, 0.07, 0.1));
  const powerDropCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.045, topBeamTopY + 0.34, -0.065),
    new THREE.Vector3(0.03, topBeamTopY + 0.68, -0.045),
    new THREE.Vector3(0, ceilingRailY - 0.05, 0),
  ]);
  const powerDropGeo = track(new THREE.TubeGeometry(powerDropCurve, 12, 0.013, 10, false));
  const suspSeamBarGeo = track(new THREE.BoxGeometry(0.26, 0.042, 0.09));

  const suspendedColumnRigs: { col: number; group: THREE.Group; seamBridge: THREE.Group }[] = [];
  HORIZONTAL_COLS.forEach((col) => {
    const colGroup = new THREE.Group();
    colGroup.position.set(col * CAB_W, 0, 0);

    for (const sxSign of [-1, 1]) {
      const pinX = sxSign * (CAB_W / 2 - 0.14);

      const shackle = new THREE.Mesh(shackleGeo, brushedSilverMaterial);
      shackle.position.set(pinX, topBeamTopY + 0.072, 0);
      colGroup.add(shackle);

      const turnbuckle = new THREE.Mesh(turnbuckleGeo, machinedSteelMaterial);
      turnbuckle.position.set(pinX, topBeamTopY + 0.135, 0);
      colGroup.add(turnbuckle);

      const cable = new THREE.Mesh(cableGeo, brushedSilverMaterial);
      cable.position.set(pinX, topBeamTopY + 0.065 + cableSpanH * 0.5, 0);
      cable.castShadow = true;
      colGroup.add(cable);

      const gripper = new THREE.Mesh(topGripperGeo, trimMaterial);
      gripper.position.set(pinX, ceilingRailY - 0.06, 0);
      colGroup.add(gripper);
    }

    // Overhead power cable continuing from C13 cord up into ceiling junction box
    const pPod = new THREE.Mesh(powerPodGeo, darkRecessMaterial);
    pPod.position.set(0, ceilingRailY - 0.04, 0);
    colGroup.add(pPod);

    const pDrop = new THREE.Mesh(powerDropGeo, rubberCableMaterial);
    colGroup.add(pDrop);

    const seamBridge = new THREE.Group();
    const topBar = new THREE.Mesh(suspSeamBarGeo, brushedSilverMaterial);
    topBar.position.set(-CAB_W * 0.5, topBeamTopY + 0.02, 0);
    const botBar = new THREE.Mesh(suspSeamBarGeo, brushedSilverMaterial);
    botBar.position.set(-CAB_W * 0.5, bottomBeamBottomY - 0.02, 0);
    seamBridge.add(topBar, botBar);
    seamBridge.visible = false;
    colGroup.add(seamBridge);

    colGroup.visible = col === 0;
    suspendedMountGroup.add(colGroup);
    suspendedColumnRigs.push({ col, group: colGroup, seamBridge });
  });

  // ---------------------------------------------------------------------------
  // 2. CHASSIS LAYER: O-Raster Hollow Ultra-Narrow Frame & Top/Bottom Power Beams
  // ---------------------------------------------------------------------------
  const buildSubdividedBeamsGeo = () => {
    const tBeam = new THREE.BoxGeometry(beamWidth, TOP_BEAM_H, beamDepth, 12, 2, 2);
    tBeam.translate(0, topBeamCenterY, 0);
    const bBeam = new THREE.BoxGeometry(beamWidth, BOTTOM_BEAM_H, beamDepth, 12, 2, 2);
    bBeam.translate(0, bottomBeamCenterY, 0);
    const merged = mergeGeometries([tBeam, bBeam], false);
    tBeam.dispose();
    bBeam.dispose();
    if (!merged) {
      throw new Error('Impossible de fusionner les bandeaux aluminium du poster O-Raster.');
    }
    return track(merged);
  };

  const outerBeamsGeo = buildSubdividedBeamsGeo();
  const heroBeamsMesh = new THREE.Mesh(outerBeamsGeo, chassisMaterial);
  heroBeamsMesh.castShadow = true;
  heroBeamsMesh.receiveShadow = true;
  chassisLayer.add(heroBeamsMesh);

  const sideRailW = 0.038;
  const sideRailD = 0.074;
  const sideRailGeo = track(new THREE.BoxGeometry(sideRailW, CAB_H + 0.01, sideRailD, 2, 4, 1));
  const sideSilverBeadGeo = track(new THREE.BoxGeometry(0.008, CAB_H, 0.052));
  const topEndCapGeo = track(new THREE.BoxGeometry(0.042, TOP_BEAM_H + 0.008, beamDepth + 0.008));
  const bottomEndCapGeo = track(new THREE.BoxGeometry(0.042, BOTTOM_BEAM_H + 0.008, beamDepth + 0.008));

  const suspPinBaseGeo = track(new THREE.CylinderGeometry(0.018, 0.022, 0.018, 14));
  const suspPinPostGeo = track(new THREE.CylinderGeometry(0.012, 0.012, 0.075, 14));
  const suspPinCollarGeo = track(new THREE.CylinderGeometry(0.015, 0.015, 0.016, 14));

  const c13SocketPlateGeo = track(new THREE.BoxGeometry(0.115, 0.022, 0.076));
  const c13PlugBootGeo = track(new THREE.BoxGeometry(0.088, 0.078, 0.058));
  const c13StrainReliefGeo = track(new THREE.CylinderGeometry(0.016, 0.022, 0.045, 12));
  const powerCordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.11, 0),
    new THREE.Vector3(0.012, 0.22, -0.02),
    new THREE.Vector3(0.045, 0.34, -0.065),
  ]);
  const powerCordGeo = track(new THREE.TubeGeometry(powerCordCurve, 12, 0.014, 10, false));

  const switchBezelGeo = track(new THREE.CylinderGeometry(0.028, 0.032, 0.022, 18));
  const switchCapGeo = track(new THREE.CylinderGeometry(0.021, 0.021, 0.032, 18));
  const statusLedGeo = track(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 12));

  const rearIoPlateGeo = track(new THREE.BoxGeometry(0.32, 0.075, 0.018));
  const portJackGeo = track(new THREE.BoxGeometry(0.046, 0.034, 0.014));
  const ledButtonBezelGeo = track(new THREE.BoxGeometry(0.052, 0.038, 0.008));
  const ledButtonCapGeo = track(new THREE.BoxGeometry(0.044, 0.03, 0.016));
  const ledCorePlaneGeo = track(new THREE.PlaneGeometry(0.032, 0.02));
  const ledBeamGlowGeo = track(new THREE.PlaneGeometry(0.155, 0.125));
  const ledPlateGlowGeo = track(new THREE.PlaneGeometry(0.115, 0.088));
  const ledBloomGlowGeo = track(new THREE.PlaneGeometry(0.086, 0.068));
  const wifiStubGeo = track(new THREE.CylinderGeometry(0.008, 0.01, 0.09, 10));

  const barLogoPlateGeo = track(new THREE.PlaneGeometry(0.58, 0.11));

  const populatePosterFrameHardware = (targetGroup: THREE.Group) => {
    const addObj = (obj: THREE.Object3D, bx: number, by: number, bz: number, rotY = 0) => {
      obj.position.set(bx, by, bz);
      obj.rotation.y = rotY;
      targetGroup.add(obj);
    };

    for (const sxSign of [-1, 1]) {
      const railX = sxSign * (CAB_W / 2 + sideRailW / 2 - 0.002);
      const rail = new THREE.Mesh(sideRailGeo, trimMaterial);
      rail.castShadow = true;
      rail.receiveShadow = true;
      addObj(rail, railX, 0, 0);

      const innerBead = new THREE.Mesh(sideSilverBeadGeo, brushedSilverMaterial);
      addObj(innerBead, sxSign * (CAB_W / 2 + 0.002), 0, 0);

      const capX = sxSign * (beamWidth / 2 + 0.012);
      const tCap = new THREE.Mesh(topEndCapGeo, trimMaterial);
      tCap.castShadow = true;
      addObj(tCap, capX, topBeamCenterY, 0);

      const bCap = new THREE.Mesh(bottomEndCapGeo, trimMaterial);
      bCap.castShadow = true;
      addObj(bCap, capX, bottomBeamCenterY, 0);

      const pinX = sxSign * (CAB_W / 2 - 0.14);
      const pBase = new THREE.Mesh(suspPinBaseGeo, brushedSilverMaterial);
      addObj(pBase, pinX, topBeamTopY + 0.009, 0);
      const pPost = new THREE.Mesh(suspPinPostGeo, brushedSilverMaterial);
      addObj(pPost, pinX, topBeamTopY + 0.046, 0);
      const pCollar = new THREE.Mesh(suspPinCollarGeo, darkRecessMaterial);
      addObj(pCollar, pinX, topBeamTopY + 0.068, 0);
    }

    const sockPlate = new THREE.Mesh(c13SocketPlateGeo, darkRecessMaterial);
    addObj(sockPlate, 0, topBeamTopY + 0.009, 0);
    const plugBoot = new THREE.Mesh(c13PlugBootGeo, rubberCableMaterial);
    addObj(plugBoot, 0, topBeamTopY + 0.056, 0);
    const strainRelief = new THREE.Mesh(c13StrainReliefGeo, rubberCableMaterial);
    addObj(strainRelief, 0, topBeamTopY + 0.11, 0);
    const cordMesh = new THREE.Mesh(powerCordGeo, rubberCableMaterial);
    addObj(cordMesh, 0, topBeamTopY + 0.01, 0);

    const swBezel = new THREE.Mesh(switchBezelGeo, trimMaterial);
    addObj(swBezel, 0.16, topBeamTopY + 0.01, 0);
    const swCap = new THREE.Mesh(switchCapGeo, darkRecessMaterial);
    addObj(swCap, 0.16, topBeamTopY + 0.018, 0);
    const statusLed = new THREE.Mesh(statusLedGeo, statusCyanLedMaterial);
    addObj(statusLed, 0.24, topBeamTopY + 0.004, 0.025);

    const ioPlate = new THREE.Mesh(rearIoPlateGeo, darkRecessMaterial);
    addObj(ioPlate, -0.34, topBeamCenterY, -beamDepth / 2 - 0.004);

    const addIlluminatedButton = (
      px: number,
      capMat: THREE.Material,
      coreMat: THREE.Material,
      beamGlowMat: THREE.Material,
      plateGlowMat: THREE.Material,
      bloomGlowMat: THREE.Material,
    ) => {
      const bezel = new THREE.Mesh(ledButtonBezelGeo, trimMaterial);
      addObj(bezel, px, topBeamCenterY, -beamDepth / 2 - 0.011);

      const cap = new THREE.Mesh(ledButtonCapGeo, capMat);
      addObj(cap, px, topBeamCenterY, -beamDepth / 2 - 0.013);

      const core = new THREE.Mesh(ledCorePlaneGeo, coreMat);
      addObj(core, px, topBeamCenterY, -beamDepth / 2 - 0.0214, Math.PI);

      const beamGlow = new THREE.Mesh(ledBeamGlowGeo, beamGlowMat);
      addObj(beamGlow, px, topBeamCenterY, -beamDepth / 2 - 0.0012, Math.PI);

      const plateGlow = new THREE.Mesh(ledPlateGlowGeo, plateGlowMat);
      addObj(plateGlow, px, topBeamCenterY, -beamDepth / 2 - 0.0136, Math.PI);

      const bloomGlow = new THREE.Mesh(ledBloomGlowGeo, bloomGlowMat);
      addObj(bloomGlow, px, topBeamCenterY, -beamDepth / 2 - 0.0222, Math.PI);
    };

    // Left button in rear view (-0.25): lit green button emitting green light
    addIlluminatedButton(
      -0.25,
      greenLedButtonMaterial,
      greenLedCoreMaterial,
      greenBeamGlowMat,
      greenPlateGlowMat,
      greenBloomGlowMat,
    );
    // Middle button in rear view (-0.33): lit red button emitting red light
    addIlluminatedButton(
      -0.33,
      redLedButtonMaterial,
      redLedCoreMaterial,
      redBeamGlowMat,
      redPlateGlowMat,
      redBloomGlowMat,
    );
    // Right port in rear view (-0.41, next to Wi-Fi stub): kept untouched
    const silverPortJack = new THREE.Mesh(portJackGeo, brushedSilverMaterial);
    addObj(silverPortJack, -0.41, topBeamCenterY, -beamDepth / 2 - 0.01);

    const wifiAnt = new THREE.Mesh(wifiStubGeo, rubberCableMaterial);
    addObj(wifiAnt, -0.46, topBeamCenterY + 0.045, -beamDepth / 2 - 0.018);

    const bottomFrontLogo = new THREE.Mesh(barLogoPlateGeo, barLogoMaterial);
    addObj(bottomFrontLogo, 0, bottomBeamCenterY, beamDepth / 2 + 0.002);

    const bottomRearLogo = new THREE.Mesh(barLogoPlateGeo, barLogoMaterial);
    addObj(bottomRearLogo, 0, bottomBeamCenterY, -beamDepth / 2 - 0.002, Math.PI);

    const topFrontLogo = new THREE.Mesh(barLogoPlateGeo, barLogoMaterial);
    addObj(topFrontLogo, 0, topBeamCenterY, beamDepth / 2 + 0.002);
  };

  populatePosterFrameHardware(chassisLayer);

  const chassisEdges = track(new THREE.EdgesGeometry(outerBeamsGeo, 20));
  const chassisWire = new THREE.LineSegments(chassisEdges, cadLineMaterial);
  wireframeOverlayGroup.add(chassisWire);

  // ---------------------------------------------------------------------------
  // 3. MODULES & EMITTERS LAYERS: 4 Ultra-Thin 1.8 mm Holographic Perforated Film Tiles
  // ---------------------------------------------------------------------------
  let masterCanvas = createMasterEmitterCanvas(initialPattern, initialPitch, initialPanelCount);
  const modules: ModuleUnitRef[] = [];
  const baseTrayGeo = track(new THREE.BoxGeometry(MOD_W - 0.006, MOD_H - 0.006, 0.007, 4, 2, 1));
  const basePcbGeo = track(new THREE.BoxGeometry(MOD_W - 0.02, MOD_H - 0.02, 0.004, 4, 2, 1));
  const baseEmitterGeo = track(new THREE.PlaneGeometry(MOD_W, MOD_H));
  const baseHitProxyGeo = track(new THREE.BoxGeometry(MOD_W - 0.004, MOD_H - 0.004, 0.06, 2, 2, 1));
  const hitProxyMat = track(new THREE.MeshBasicMaterial({ visible: false }));

  const quadPositions: [number, number, number, number][] = [
    [-MOD_W / 2, MOD_H / 2, 0, 1], // M1 Top-Left
    [MOD_W / 2, MOD_H / 2, 1, 1], // M2 Top-Right
    [-MOD_W / 2, -MOD_H / 2, 0, 0], // M3 Bottom-Left
    [MOD_W / 2, -MOD_H / 2, 1, 0], // M4 Bottom-Right
  ];

  const getModuleUVRect = (
    modCol: number,
    modRowFromBottom: number,
    panelCount: HorizontalPanelCount,
  ) => {
    const colIdx = getHorizontalSlotIndex(0, panelCount);
    const cellSpanU = 1 / panelCount;
    return {
      uOffset: colIdx * cellSpanU + modCol * (cellSpanU * 0.5),
      vOffset: modRowFromBottom * 0.5,
      uSpan: cellSpanU * 0.5,
      vSpan: 0.5,
    };
  };

  quadPositions.forEach(([qx, qy, modCol, modRowFromBottom], idx) => {
    const tileGroup = new THREE.Group();
    tileGroup.position.set(0, qy, -0.004);

    const trayGeo = track(baseTrayGeo.clone());
    trayGeo.translate(qx, 0, -0.004);
    const tray = new THREE.Mesh(trayGeo, filmBackingMaterial);
    tray.castShadow = false;
    tray.receiveShadow = true;
    tileGroup.add(tray);

    const pcbGeo = track(basePcbGeo.clone());
    pcbGeo.translate(qx, 0, 0.004);
    const pcb = new THREE.Mesh(pcbGeo, pcbMaterial);
    pcb.name = 'internal-pcb';
    tileGroup.add(pcb);

    modulesLayer.add(tileGroup);

    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(0, qy, 0.008);

    const uv = getModuleUVRect(modCol, modRowFromBottom, initialPanelCount);
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
    const isInitialOff = initialPattern === 'off';
    const emitterMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: emitterTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: emitterTex,
        emissiveIntensity: isInitialOff ? 0.24 : 1.18,
        alphaMap: isInitialOff ? moduleMeshAlpha : moduleEmitterAlpha,
        transparent: !isInitialOff,
        opacity: isInitialOff ? 1.0 : 0.96,
        alphaTest: isInitialOff ? 0.44 : 0.02,
        side: THREE.DoubleSide,
        roughness: 0.22,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.45,
      }),
    );

    const emitterGeo = track(baseEmitterGeo.clone());
    emitterGeo.translate(qx, 0, 0);
    const emitterMesh = new THREE.Mesh(emitterGeo, emitterMat);
    emitterMesh.castShadow = false;
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
    const highlightEdges = new THREE.LineSegments(emitterEdgesGeo, highlightMat);
    highlightEdges.visible = false;
    emitterGroup.add(highlightEdges);

    const hitProxyGeo = track(baseHitProxyGeo.clone());
    hitProxyGeo.translate(qx, 0, 0);
    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.userData = { moduleIndex: idx };
    hitProxy.layers.set(1);
    emitterGroup.add(hitProxy);

    emittersLayer.add(emitterGroup);

    modules.push({
      id: idx,
      label: `Module M${idx + 1} · 500 × 1000 mm`,
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
  // 4. HORIZONTAL ROW ASSEMBLY (2x1, 3x1, 4x1 — side-by-side ONLY, zero vertical stacking)
  // ---------------------------------------------------------------------------
  const surroundGroup = new THREE.Group();
  surroundGroup.name = 'horizontal-array-surround';
  root.add(surroundGroup);

  const neighborTrayGeo = track(new THREE.BoxGeometry(CAB_W - 0.008, CAB_H - 0.008, 0.007, 4, 2, 1));
  const neighborFaceGeo = track(new THREE.PlaneGeometry(CAB_W, CAB_H));

  const jumperCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.26, topBeamCenterY - 0.02, -0.1),
    new THREE.Vector3(-0.9, topBeamCenterY + 0.04, -0.14),
    new THREE.Vector3(-1.54, topBeamCenterY - 0.02, -0.1),
  ]);
  const jumperCableGeo = track(new THREE.TubeGeometry(jumperCableCurve, 12, 0.015, 8, false));
  const jumperPlugGeo = track(new THREE.BoxGeometry(0.055, 0.042, 0.042));
  const topCurveBridgePlateGeo = track(new THREE.BoxGeometry(0.22, 0.032, 0.095));

  const neighborCols = [-1, 1, 2] as const;

  const surroundCabinets: SurroundCabinetRef[] = neighborCols.map((gridCol) => {
    const ox = gridCol * CAB_W;
    const g = new THREE.Group();
    g.position.set(ox * 1.35, 0, -0.4);
    g.visible = false;

    const beamsMesh = new THREE.Mesh(outerBeamsGeo, chassisMaterial);
    beamsMesh.castShadow = true;
    beamsMesh.receiveShadow = true;
    g.add(beamsMesh);

    populatePosterFrameHardware(g);

    const trayBack = new THREE.Mesh(neighborTrayGeo, surroundBackingMaterial);
    trayBack.position.set(0, 0, -0.004);
    trayBack.receiveShadow = true;
    g.add(trayBack);

    const slotIdx = Math.max(0, Math.min(initialPanelCount - 1, getHorizontalSlotIndex(gridCol, initialPanelCount)));
    const sEmitterTex = track(
      createSlicedEmitterTexture(
        masterCanvas,
        slotIdx / initialPanelCount,
        0,
        1 / initialPanelCount,
        1,
        maxAnisotropy,
      ),
    );
    const isInitialOffS = initialPattern === 'off';
    const sEmitterMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: sEmitterTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: sEmitterTex,
        emissiveIntensity: isInitialOffS ? 0.24 : 1.18,
        alphaMap: isInitialOffS ? cabinetMeshAlpha : cabinetEmitterAlpha,
        transparent: !isInitialOffS,
        opacity: isInitialOffS ? 1.0 : 0.96,
        alphaTest: isInitialOffS ? 0.44 : 0.02,
        side: THREE.DoubleSide,
        roughness: 0.22,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.45,
      }),
    );

    const face = new THREE.Mesh(neighborFaceGeo, sEmitterMat);
    face.position.set(0, 0, 0.008);
    face.receiveShadow = true;
    g.add(face);

    const jumperGroup = new THREE.Group();
    const cable = new THREE.Mesh(jumperCableGeo, rubberCableMaterial);
    jumperGroup.add(cable);
    const plug = new THREE.Mesh(jumperPlugGeo, trimMaterial);
    plug.position.set(-0.26, topBeamCenterY - 0.02, -0.1);
    jumperGroup.add(plug);
    g.add(jumperGroup);

    const topBridgeGroup = new THREE.Group();
    const bridgePlate = new THREE.Mesh(topCurveBridgePlateGeo, brushedSilverMaterial);
    bridgePlate.position.set(-CAB_W / 2, topBeamTopY + 0.014, 0);
    topBridgeGroup.add(bridgePlate);
    g.add(topBridgeGroup);

    surroundGroup.add(g);
    return {
      group: g,
      gridCol,
      targetPos: new THREE.Vector3(ox, 0, 0),
      emitterMat: sEmitterMat,
      jumperGroup,
      topBridgeGroup,
    };
  });

  const updateFinish = (finishId: ChassisFinishId) => {
    const spec = CHASSIS_FINISHES[finishId];
    chassisMaterial.color.set(spec.chassisHex);
    chassisMaterial.roughness = spec.roughness;
    chassisMaterial.metalness = spec.metalness;
    trimMaterial.color.set(spec.trimHex);
  };

  const applySlicedCanvasTextures = (
    panelCount: HorizontalPanelCount,
    intensity: number,
    isOff: boolean,
  ) => {
    modules.forEach((m, idx) => {
      const [, , modCol, modRowFromBottom] = quadPositions[idx];
      const uv = getModuleUVRect(modCol, modRowFromBottom, panelCount);
      const oldMap = m.emitterMat.map;
      const nextTex = track(
        createSlicedEmitterTexture(
          masterCanvas,
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
      m.emitterMat.alphaMap = isOff ? moduleMeshAlpha : moduleEmitterAlpha;
      m.emitterMat.transparent = !isOff;
      m.emitterMat.opacity = isOff ? 1.0 : 0.96;
      m.emitterMat.alphaTest = isOff ? 0.44 : 0.02;
      m.emitterMat.needsUpdate = true;
      if (oldMap) oldMap.dispose();
    });

    surroundCabinets.forEach((sc) => {
      const slotIdx = Math.max(
        0,
        Math.min(panelCount - 1, getHorizontalSlotIndex(sc.gridCol, panelCount)),
      );
      const oldMap = sc.emitterMat.map;
      const nextTex = track(
        createSlicedEmitterTexture(
          masterCanvas,
          slotIdx / panelCount,
          0,
          1 / panelCount,
          1,
          maxAnisotropy,
        ),
      );
      sc.emitterMat.map = nextTex;
      sc.emitterMat.emissiveMap = nextTex;
      sc.emitterMat.emissiveIntensity = intensity;
      sc.emitterMat.alphaMap = isOff ? cabinetMeshAlpha : cabinetEmitterAlpha;
      sc.emitterMat.transparent = !isOff;
      sc.emitterMat.opacity = isOff ? 1.0 : 0.96;
      sc.emitterMat.alphaTest = isOff ? 0.44 : 0.02;
      sc.emitterMat.needsUpdate = true;
      if (oldMap) oldMap.dispose();
    });
  };

  const updatePattern = (
    pattern: DisplayPatternId,
    pitch: PitchTierId,
    panelCount: HorizontalPanelCount,
  ) => {
    const isOff = pattern === 'off';
    const intensity = isOff ? 0.24 : pattern === 'calibration' ? 1.15 : 1.18;
    masterCanvas = createMasterEmitterCanvas(pattern, pitch, panelCount);
    applySlicedCanvasTextures(panelCount, intensity, isOff);
  };

  const updateVideoFrame = (
    timeSec: number,
    panelCount: HorizontalPanelCount,
    customVideoEl?: HTMLVideoElement | null,
  ) => {
    const ctx = masterCanvas.getContext('2d');
    if (!ctx) return;

    if (
      customVideoEl &&
      customVideoEl.readyState >= 2 &&
      customVideoEl.videoWidth > 0 &&
      customVideoEl.videoHeight > 0
    ) {
      // Draw imported .mp4 cleanly (cover crop matching horizontal panel aspect)
      const cw = masterCanvas.width;
      const ch = masterCanvas.height;
      const vw = customVideoEl.videoWidth;
      const vh = customVideoEl.videoHeight;
      const targetAspect = (panelCount * CAB_W) / CAB_H;
      const videoAspect = vw / vh;

      let sx = 0;
      let sy = 0;
      let sw = vw;
      let sh = vh;
      if (videoAspect > targetAspect) {
        sw = vh * targetAspect;
        sx = (vw - sw) * 0.5;
      } else {
        sh = vw / targetAspect;
        sy = (vh - sh) * 0.5;
      }
      ctx.drawImage(customVideoEl, sx, sy, sw, sh, 0, 0, cw, ch);
    } else {
      drawHolographicVideoFrame(ctx, masterCanvas.width, masterCanvas.height, timeSec, panelCount);
    }

    modules.forEach((m) => {
      if (m.emitterMat.map) {
        m.emitterMat.map.needsUpdate = true;
      }
    });
    surroundCabinets.forEach((sc) => {
      if (sc.group.visible && sc.emitterMat.map) {
        sc.emitterMat.map.needsUpdate = true;
      }
    });
  };

  const updateInstallationMode = (
    mode: InstallationModeId,
    panelCount: HorizontalPanelCount,
    showStand: boolean,
  ) => {
    const isSlotActive = (col: number): boolean => {
      if (col === 0) return true;
      if (col === 1) return panelCount >= 2;
      if (col === -1) return panelCount >= 3;
      if (col === 2) return panelCount === 4;
      return false;
    };

    const rowCenterX = panelCount === 2 || panelCount === 4 ? CAB_W * 0.5 : 0;
    const totalRowW = panelCount * CAB_W;

    // 1. SUR PIED (standing): preserved 100% intact
    trussStands.forEach((stand) => {
      stand.group.visible = mode === 'standing' && showStand && isSlotActive(stand.col);
    });

    // 2. MURAL (wall)
    wallMountGroup.visible = mode === 'wall';
    if (mode === 'wall') {
      const wallSpanW = totalRowW + 2.5;
      wallBackdrop.scale.set(wallSpanW, 1, 1);
      wallBackdrop.position.x = rowCenterX;
      wallPlinth.scale.set(wallSpanW, 1, 1);
      wallPlinth.position.x = rowCenterX;
      wallTopCap.scale.set(wallSpanW, 1, 1);
      wallTopCap.position.x = rowCenterX;
      wallMaps.map.repeat.set(Math.max(1, wallSpanW * 0.3), 1);
      wallMaps.bumpMap.repeat.set(Math.max(1, wallSpanW * 0.3), 1);

      wallColumnRigs.forEach((rig) => {
        const active = isSlotActive(rig.col);
        rig.group.visible = active;
        const hasLeft =
          rig.col === 1 || rig.col === 2 || (rig.col === 0 && panelCount >= 3);
        rig.seamTie.visible = active && hasLeft;
      });
    }

    // 3. SUSPENDU (suspended)
    suspendedMountGroup.visible = mode === 'suspended';
    if (mode === 'suspended') {
      const railSpanW = totalRowW + 0.72;
      ceilingRailMesh.scale.set(railSpanW, 1, 1);
      ceilingRailMesh.position.x = rowCenterX;
      ceilingEndCaps[0].position.x = rowCenterX - railSpanW * 0.5 - 0.018;
      ceilingEndCaps[1].position.x = rowCenterX + railSpanW * 0.5 + 0.018;
      ceilingDropRods.position.x = rowCenterX;
      ceilingDropRods.scale.set(Math.max(0.85, panelCount * 0.45), 1, 1);

      suspendedColumnRigs.forEach((rig) => {
        const active = isSlotActive(rig.col);
        rig.group.visible = active;
        const hasLeft =
          rig.col === 1 || rig.col === 2 || (rig.col === 0 && panelCount >= 3);
        rig.seamBridge.visible = active && hasLeft;
      });
    }
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
      mountSteelMaterial.emissiveIntensity = 0.1;
    } else {
      mountSteelMaterial.emissive.set('#000000');
      mountSteelMaterial.emissiveIntensity = 0.0;
    }
  };

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
    wallMountGroup,
    wallBackdrop,
    wallPlinth,
    wallTopCap,
    wallColumnRigs,
    suspendedMountGroup,
    ceilingRailMesh,
    ceilingEndCaps,
    ceilingDropRods,
    suspendedColumnRigs,
    modules,
    chassisMaterial,
    trimMaterial,
    machinedSteelMaterial,
    goldPinMaterial,
    mountSteelMaterial,
    cadLineMaterial,
    updateFinish,
    updatePattern,
    updateVideoFrame,
    updateInstallationMode,
    updateSelection,
    dispose,
  };
}

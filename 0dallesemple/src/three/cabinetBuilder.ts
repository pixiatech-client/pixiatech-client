import * as THREE from 'three';
import {
  CHASSIS_FINISHES,
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
  updateSelection: (
    activeLayer: AssemblyLayerId | null,
    selectedModuleIdx: number | null,
    hoveredModuleIdx: number | null,
    showWireframe: boolean,
  ) => void;
  dispose: () => void;
}

function createRoundedFrameShape(w: number, h: number, r: number, holeInset: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  if (holeInset > 0) {
    const iw = hw - holeInset;
    const ih = hh - holeInset;
    const hole = new THREE.Path();
    hole.moveTo(-iw, -ih);
    hole.lineTo(-iw, ih);
    hole.lineTo(iw, ih);
    hole.lineTo(iw, -ih);
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
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

  const { bumpMap, roughnessMap } = createBrushedMetalMaps(maxAnisotropy);
  const castBumpMap = track(createBeadBlastedCastMap(maxAnisotropy));
  track(bumpMap);
  track(roughnessMap);

  const pcbTex = track(createPcbBackplaneTexture(maxAnisotropy));
  const medallionTex = track(createPixiatechMedallionTexture(maxAnisotropy, onTextureLoaded));
  const finish = CHASSIS_FINISHES[initialFinish];

  const chassisMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(finish.chassisHex),
      roughness: finish.roughness,
      metalness: finish.metalness,
      bumpMap: castBumpMap,
      bumpScale: 0.005,
      roughnessMap,
      anisotropy: 0.5,
      clearcoat: 0.14,
      clearcoatRoughness: 0.38,
      envMapIntensity: 1.5,
    }),
  );

  const trimMaterial = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(finish.trimHex),
      roughness: 0.28,
      metalness: 0.88,
      bumpMap,
      bumpScale: 0.003,
      envMapIntensity: 1.55,
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
      roughness: 0.24,
      metalness: 0.55,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
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
  });

  const crossRailGeo = track(new THREE.BoxGeometry(CAB_W * 0.84, 0.045, 0.016));
  [-0.48, 0.48].forEach((ry) => {
    const bar = new THREE.Mesh(crossRailGeo, mountSteelMaterial);
    bar.position.set(0, ry, -0.022);
    bar.castShadow = true;
    mountLayer.add(bar);
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
  });

  // ---------------------------------------------------------------------------
  // 2. CHASSIS LAYER: Shared Full-Relief PIXIATECH Die-Cast Shell + Bay Docks
  // ---------------------------------------------------------------------------
  const outerFrameShape = createRoundedFrameShape(CAB_W, CAB_H, 0.016, 0.095);
  const outerFrameGeo = track(
    new THREE.ExtrudeGeometry(outerFrameShape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
    }),
  );
  outerFrameGeo.translate(0, 0, -0.048);

  const backWebGeo = track(new THREE.BoxGeometry(CAB_W - 0.09, CAB_H - 0.09, 0.022));
  const diagLen = Math.hypot(CAB_W * 0.44, CAB_H * 0.42);
  const diagRibGeo = track(new THREE.BoxGeometry(diagLen, 0.056, 0.024));

  const hubPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.36, 0.0),
    new THREE.Vector2(0.36, 0.018),
    new THREE.Vector2(0.32, 0.032),
    new THREE.Vector2(0.26, 0.032),
    new THREE.Vector2(0.25, 0.016),
    new THREE.Vector2(0.0, 0.016),
  ];
  const hubGeo = track(new THREE.LatheGeometry(hubPoints, 48));
  hubGeo.rotateX(-Math.PI / 2);

  const medallionGeo = track(new THREE.CircleGeometry(0.265, 48));
  medallionGeo.rotateY(Math.PI);

  const finGeo = track(new THREE.BoxGeometry(0.015, 0.27, 0.024));
  const finMatrices: THREE.Matrix4[] = [];
  const finDummy = new THREE.Object3D();

  for (const side of [-1, 1]) {
    for (let i = -7; i <= 7; i++) {
      if (Math.abs(i) < 1) continue;
      const x = i * 0.088;
      const y = side * (0.56 - Math.abs(i) * 0.022);
      finDummy.position.set(x, y, -0.044);
      finDummy.rotation.set(0, 0, (i > 0 ? 1 : -1) * side * 0.48);
      finDummy.scale.set(1, 0.72 + (1 - Math.abs(i) / 8) * 0.5, 1);
      finDummy.updateMatrix();
      finMatrices.push(finDummy.matrix.clone());
    }
  }
  for (const side of [-1, 1]) {
    for (let i = -4; i <= 4; i++) {
      const x = side * 1.12;
      const y = i * 0.11;
      finDummy.position.set(x, y, -0.044);
      finDummy.rotation.set(0, 0, side * 0.52);
      finDummy.scale.set(1, 0.9, 1);
      finDummy.updateMatrix();
      finMatrices.push(finDummy.matrix.clone());
    }
  }

  const bracketGeo = track(new THREE.BoxGeometry(0.11, 0.075, 0.022));
  const screwGeo = track(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12));
  screwGeo.rotateX(Math.PI / 2);
  const portHousingGeo = track(new THREE.BoxGeometry(0.024, 0.24, 0.044));
  const dowelPinGeo = track(new THREE.CylinderGeometry(0.011, 0.011, 0.014, 12));

  // Reusable builder: applies identical relief, bevels, trusses, louvers, corner hardware & logo
  const populateFullRearChassis = (targetGroup: THREE.Group) => {
    const outerFrameMesh = new THREE.Mesh(outerFrameGeo, chassisMaterial);
    outerFrameMesh.castShadow = true;
    outerFrameMesh.receiveShadow = true;
    targetGroup.add(outerFrameMesh);

    const backWebMesh = new THREE.Mesh(backWebGeo, chassisMaterial);
    backWebMesh.position.set(0, 0, -0.032);
    backWebMesh.castShadow = true;
    backWebMesh.receiveShadow = true;
    targetGroup.add(backWebMesh);

    [
      [-0.64, 0.35, -0.52],
      [0.64, 0.35, 0.52],
      [-0.64, -0.35, 0.52],
      [0.64, -0.35, -0.52],
    ].forEach(([dx, dy, angle]) => {
      const rib = new THREE.Mesh(diagRibGeo, trimMaterial);
      rib.position.set(dx, dy, -0.045);
      rib.rotation.z = angle;
      rib.castShadow = true;
      targetGroup.add(rib);
    });

    const hubMesh = new THREE.Mesh(hubGeo, trimMaterial);
    hubMesh.position.set(0, 0, -0.043);
    hubMesh.castShadow = true;
    targetGroup.add(hubMesh);

    const medallionMesh = new THREE.Mesh(medallionGeo, medallionMaterial);
    medallionMesh.position.set(0, 0, -0.062);
    targetGroup.add(medallionMesh);

    const finInstanced = new THREE.InstancedMesh(finGeo, trimMaterial, finMatrices.length);
    finMatrices.forEach((mat, idx) => finInstanced.setMatrixAt(idx, mat));
    finInstanced.instanceMatrix.needsUpdate = true;
    finInstanced.computeBoundingSphere();
    targetGroup.add(finInstanced);

    [
      [-CAB_W / 2 + 0.08, CAB_H / 2 - 0.06],
      [CAB_W / 2 - 0.08, CAB_H / 2 - 0.06],
      [-CAB_W / 2 + 0.08, -CAB_H / 2 + 0.06],
      [CAB_W / 2 - 0.08, -CAB_H / 2 + 0.06],
    ].forEach(([bx, by]) => {
      const bracket = new THREE.Mesh(bracketGeo, machinedSteelMaterial);
      bracket.position.set(bx, by, -0.05);
      targetGroup.add(bracket);

      const screw = new THREE.Mesh(screwGeo, trimMaterial);
      screw.position.set(bx, by, -0.062);
      targetGroup.add(screw);
    });

    [-CAB_W / 2 + 0.008, CAB_W / 2 - 0.008].forEach((sx) => {
      const portHousing = new THREE.Mesh(portHousingGeo, machinedSteelMaterial);
      portHousing.position.set(sx, 0, -0.018);
      targetGroup.add(portHousing);
    });

    [-0.9, 0.9].forEach((px) => {
      const pin = new THREE.Mesh(dowelPinGeo, machinedSteelMaterial);
      pin.position.set(px, CAB_H / 2 - 0.004, -0.016);
      targetGroup.add(pin);
    });
  };

  populateFullRearChassis(chassisLayer);

  // Internal cross-ribs separating the 4 module bays on the front side (primary cabinet)
  const vRibGeo = track(new THREE.BoxGeometry(0.048, CAB_H - 0.12, 0.032));
  const vRib = new THREE.Mesh(vRibGeo, trimMaterial);
  vRib.position.set(0, 0, -0.006);
  chassisLayer.add(vRib);

  const hRibGeo = track(new THREE.BoxGeometry(CAB_W - 0.12, 0.048, 0.032));
  const hRib = new THREE.Mesh(hRibGeo, trimMaterial);
  hRib.position.set(0, 0, -0.006);
  chassisLayer.add(hRib);

  // Exposed interior bay hardware (visible when a module slides forward!)
  const bayBackGeo = track(new THREE.BoxGeometry(MOD_W - 0.12, MOD_H - 0.12, 0.006));
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
    const bayBack = new THREE.Mesh(bayBackGeo, pcbMaterial);
    bayBack.position.set(bx, by, -0.018);
    chassisLayer.add(bayBack);

    const block = new THREE.Mesh(bayContactBlockGeo, trimMaterial);
    block.position.set(bx, by, -0.012);
    chassisLayer.add(block);

    [
      [-0.44, 0.2],
      [0.44, 0.2],
      [-0.44, -0.2],
      [0.44, -0.2],
    ].forEach(([px, py]) => {
      const rxPin = new THREE.Mesh(bayReceiverPinGeo, goldPinMaterial);
      rxPin.position.set(bx + px, by + py, -0.011);
      chassisLayer.add(rxPin);
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
    });
  });

  const chassisEdges = track(new THREE.EdgesGeometry(outerFrameGeo, 20));
  const chassisWire = new THREE.LineSegments(chassisEdges, cadLineMaterial);
  wireframeOverlayGroup.add(chassisWire);

  // ---------------------------------------------------------------------------
  // 3. MODULES & EMITTERS LAYERS: 4 Magnetic Optical Modules (300 x 168.75 mm)
  // ---------------------------------------------------------------------------
  const masterCanvas = createMasterEmitterCanvas(initialPattern, initialPitch);
  const modules: ModuleUnitRef[] = [];
  const trayGeo = track(new THREE.BoxGeometry(MOD_W - 0.012, MOD_H - 0.012, 0.026));
  const pcbGeo = track(new THREE.BoxGeometry(MOD_W - 0.06, MOD_H - 0.06, 0.008));
  const pinGeo = track(new THREE.CylinderGeometry(0.01, 0.01, 0.018, 12));
  pinGeo.rotateX(Math.PI / 2);
  const magnetGeo = track(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 16));
  magnetGeo.rotateX(Math.PI / 2);
  const emitterGeo = track(new THREE.BoxGeometry(MOD_W, MOD_H, 0.014));
  const emitterEdgesGeo = track(new THREE.EdgesGeometry(emitterGeo, 15));
  const hitProxyGeo = track(new THREE.BoxGeometry(MOD_W - 0.004, MOD_H - 0.004, 0.08));
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
    tileGroup.position.set(qx, qy, 0.022);

    const tray = new THREE.Mesh(trayGeo, trimMaterial);
    tray.castShadow = true;
    tray.receiveShadow = true;
    tileGroup.add(tray);

    const pcb = new THREE.Mesh(pcbGeo, pcbMaterial);
    pcb.position.set(0, 0, -0.015);
    tileGroup.add(pcb);

    [
      [-0.44, 0.2],
      [0.44, 0.2],
      [-0.44, -0.2],
      [0.44, -0.2],
    ].forEach(([px, py]) => {
      const pin = new THREE.Mesh(pinGeo, goldPinMaterial);
      pin.position.set(px, py, -0.021);
      tileGroup.add(pin);
    });

    [
      [-0.58, 0.3],
      [0.58, 0.3],
      [-0.58, -0.3],
      [0.58, -0.3],
    ].forEach(([mx, my]) => {
      const mag = new THREE.Mesh(magnetGeo, machinedSteelMaterial);
      mag.position.set(mx, my, -0.018);
      tileGroup.add(mag);
    });

    modulesLayer.add(tileGroup);

    const emitterGroup = new THREE.Group();
    emitterGroup.position.set(qx, qy, 0.044);

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
    const highlightEdges = new THREE.LineSegments(emitterEdgesGeo, highlightMat);
    highlightEdges.scale.set(1.002, 1.002, 1.04);
    highlightEdges.visible = false;
    emitterGroup.add(highlightEdges);

    const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
    hitProxy.userData = { moduleIndex: idx };
    hitProxy.layers.set(1);
    emitterGroup.add(hitProxy);

    emittersLayer.add(emitterGroup);

    modules.push({
      id: idx,
      label: `Module M${idx + 1} · 300 × 168,8 mm`,
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
  // 4. SURFACE ARRAY MODE (3x2 Architectural Wall = 5 Identical Full-Relief Cabinets)
  // ---------------------------------------------------------------------------
  const surroundGroup = new THREE.Group();
  surroundGroup.name = 'surface-array-surround';
  root.add(surroundGroup);

  const gridConfigs: [number, number, number, number][] = [
    [-CAB_W, 0, 0, 0],
    [CAB_W, 0, 2, 0],
    [-CAB_W, CAB_H, 0, 1],
    [0, CAB_H, 1, 1],
    [CAB_W, CAB_H, 2, 1],
  ];

  const surroundTrayGeo = track(new THREE.BoxGeometry(CAB_W - 0.006, CAB_H - 0.006, 0.026));
  const surroundFaceGeo = track(new THREE.BoxGeometry(CAB_W, CAB_H, 0.014));

  const surroundCabinets = gridConfigs.map(([ox, oy, gridCol, gridRow]) => {
    const g = new THREE.Group();
    g.position.set(ox * 1.45, oy * 1.45, -0.4);
    g.visible = false;

    // Duplicate the complete sculpted 3D die-cast rear chassis, ribs, fins, brackets & hub
    populateFullRearChassis(g);

    const trayBack = new THREE.Mesh(surroundTrayGeo, trimMaterial);
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

    const face = new THREE.Mesh(surroundFaceGeo, sEmitterMat);
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
    updateSelection,
    dispose,
  };
}

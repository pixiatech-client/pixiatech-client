import * as THREE from 'three';
import type { PresentationModelId } from '../types/models';
import type { ProceduralTextureSet } from './proceduralTextures';

export interface ModelCollectionResult {
  groups: Record<PresentationModelId, THREE.Group>;
  dispose: () => void;
}

/**
 * Builds all 5 composite multi-part PIXIATECH LED display models once at scene mount.
 * Each model pivots at bottom-center (y = 0) so it sits flush on the studio stage floor.
 */
export function buildAllPixiaLedModels(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): ModelCollectionResult {
  const disposableGeometries: THREE.BufferGeometry[] = [];
  const disposableMaterials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposableGeometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposableMaterials.push(m);
    return m;
  };

  // Shared calibrated PBR materials (varied roughness/metalness across adjacent parts)
  const darkChassisMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x161a22,
      roughness: 0.42,
      metalness: 0.82,
      roughnessMap: textures.brushedMetalRoughness,
    }),
  );

  const matteBackplateMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0f1218,
      roughness: 0.78,
      metalness: 0.18,
    }),
  );

  const brushedSteelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x4b5563,
      roughness: 0.28,
      metalness: 0.9,
      anisotropy: 0.7,
      clearcoat: 0.25,
    }),
  );

  const brassAccentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd99b38,
      roughness: 0.26,
      metalness: 0.9,
    }),
  );

  const rubberBumperMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0b0d12,
      roughness: 0.88,
      metalness: 0.05,
    }),
  );

  const opticalGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.08,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.84,
      transparent: true,
      opacity: isSoftwareGl ? 0.24 : 0.92,
      ior: 1.52,
      thickness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      depthWrite: false,
    }),
  );

  const makeBox = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    castShadow = true,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.castShadow = !isSoftwareGl && castShadow;
    mesh.receiveShadow = !isSoftwareGl;
    return mesh;
  };

  const makeTopCarryHandle = (width: number, yPos: number): THREE.Mesh => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-width * 0.5, yPos, 0),
      new THREE.Vector3(-width * 0.35, yPos + 0.075, 0),
      new THREE.Vector3(width * 0.35, yPos + 0.075, 0),
      new THREE.Vector3(width * 0.5, yPos, 0),
    ]);
    const geo = trackGeo(new THREE.TubeGeometry(curve, 18, 0.011, 10, false));
    const mesh = new THREE.Mesh(geo, brushedSteelMat);
    mesh.castShadow = !isSoftwareGl;
    return mesh;
  };

  const addGroundFootBrackets = (
    group: THREE.Group,
    spreadX: number,
    depthZ: number,
  ): void => {
    for (const side of [-1, 1]) {
      const foot = makeBox(0.11, 0.045, depthZ, darkChassisMat);
      foot.position.set(side * spreadX, 0.0225, 0);
      group.add(foot);

      const pad = makeBox(0.12, 0.014, depthZ + 0.02, rubberBumperMat);
      pad.position.set(side * spreadX, 0.007, 0);
      group.add(pad);
    }
  };

  // =========================================================================
  // 1. DALLE SMD 50x50 (Square 1:1 indoor/rental cabinet — matches image 2)
  // =========================================================================
  const smd50x50 = new THREE.Group();
  {
    const W = 1.65;
    const H = 1.65;
    const D = 0.14;
    const baseY = 0.06;

    // 1. Floor brackets
    addGroundFootBrackets(smd50x50, 0.52, 0.36);

    // 2. Main perimeter aluminum chassis
    const frame = makeBox(W, H, D, darkChassisMat);
    frame.position.set(0, baseY + H / 2, 0);
    smd50x50.add(frame);

    // 3. Front SMD LED active face
    const screenMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.smdWaveTexture,
        emissive: 0xffffff,
        emissiveMap: textures.smdWaveTexture,
        emissiveIntensity: 0.42,
        roughness: 0.28,
        metalness: 0.12,
      }),
    );
    const screen = makeBox(W - 0.055, H - 0.055, 0.02, screenMat, false);
    screen.position.set(0, baseY + H / 2, D / 2 + 0.006);
    smd50x50.add(screen);

    // 4. Top carry handle (matching reference silhouette)
    smd50x50.add(makeTopCarryHandle(0.32, baseY + H));

    // 5. Rear power/data hub box + connector ports
    const rearHub = makeBox(0.58, 0.72, 0.07, matteBackplateMat);
    rearHub.position.set(0, baseY + H * 0.48, -D / 2 - 0.035);
    smd50x50.add(rearHub);

    for (const py of [-0.15, 0.15]) {
      const port = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.034, 0.034, 0.03, 14)),
        brassAccentMat,
      );
      port.rotation.x = Math.PI / 2;
      port.position.set(0.14, baseY + H * 0.48 + py, -D / 2 - 0.075);
      smd50x50.add(port);
    }

    // 6. Side quick-lock cam latches
    for (const side of [-1, 1]) {
      const latch = makeBox(0.035, 0.22, 0.075, brushedSteelMat);
      latch.position.set(side * (W / 2 + 0.015), baseY + H * 0.5, -0.01);
      smd50x50.add(latch);
    }

    // 7. Corner protective bumpers
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const corner = makeBox(0.08, 0.08, D + 0.018, rubberBumperMat);
        corner.position.set(
          sx * (W / 2 - 0.02),
          baseY + H / 2 + sy * (H / 2 - 0.02),
          0,
        );
        smd50x50.add(corner);
      }
    }
  }

  // =========================================================================
  // 2. DALLE SMD 50x100 (Tall 1:2 rental stage cabinet)
  // =========================================================================
  const smd50x100 = new THREE.Group();
  {
    const W = 1.24;
    const H = 2.42;
    const D = 0.14;
    const baseY = 0.06;

    // 1. Heavy-duty base & rear diagonal support struts
    addGroundFootBrackets(smd50x100, 0.44, 0.56);
    for (const side of [-1, 1]) {
      const strut = makeBox(0.045, 0.64, 0.045, brushedSteelMat);
      strut.position.set(side * 0.44, 0.28, -0.18);
      strut.rotation.x = 0.45;
      smd50x100.add(strut);
    }

    // 2. Tall aluminum chassis
    const frame = makeBox(W, H, D, darkChassisMat);
    frame.position.set(0, baseY + H / 2, 0);
    smd50x100.add(frame);

    // 3. Tall 1:2 LED display face
    const screenMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.tallWaveTexture,
        emissive: 0xffffff,
        emissiveMap: textures.tallWaveTexture,
        emissiveIntensity: 0.42,
        roughness: 0.28,
        metalness: 0.12,
      }),
    );
    const screen = makeBox(W - 0.055, H - 0.055, 0.02, screenMat, false);
    screen.position.set(0, baseY + H / 2, D / 2 + 0.006);
    smd50x100.add(screen);

    // 4. Dual top rigging handles
    smd50x100.add(makeTopCarryHandle(0.24, baseY + H));

    // 5. Rear structural spine + horizontal rib
    const spine = makeBox(0.44, H - 0.28, 0.065, matteBackplateMat);
    spine.position.set(0, baseY + H / 2, -D / 2 - 0.03);
    smd50x100.add(spine);

    const midRib = makeBox(W - 0.08, 0.08, 0.075, brushedSteelMat);
    midRib.position.set(0, baseY + H / 2, -D / 2 - 0.03);
    smd50x100.add(midRib);

    // 6. Dual upper & lower side cam-locks
    for (const side of [-1, 1]) {
      for (const yRatio of [0.28, 0.72]) {
        const latch = makeBox(0.036, 0.2, 0.075, brushedSteelMat);
        latch.position.set(side * (W / 2 + 0.015), baseY + H * yRatio, -0.01);
        smd50x100.add(latch);
      }
    }
  }

  // =========================================================================
  // 3. HOLOGRAPHIQUE (Translucent optical LED film display on slim plinth)
  // =========================================================================
  const holographique = new THREE.Group();
  {
    const W = 1.72;
    const H = 1.72;
    const baseY = 0.14;

    // 1. Sleek brushed pedestal base
    const plinthBase = makeBox(1.22, 0.045, 0.44, darkChassisMat);
    plinthBase.position.set(0, 0.0225, 0);
    holographique.add(plinthBase);

    // 2. Slim bottom controller driver bar
    const driverBar = makeBox(W + 0.04, 0.11, 0.12, brushedSteelMat);
    driverBar.position.set(0, baseY - 0.035, 0);
    holographique.add(driverBar);

    // 3. Minimalist slim outer perimeter frame (left, right, top)
    const sideWidth = 0.042;
    const leftRail = makeBox(sideWidth, H, 0.055, darkChassisMat);
    leftRail.position.set(-W / 2 + sideWidth / 2, baseY + H / 2, 0);
    holographique.add(leftRail);

    const rightRail = makeBox(sideWidth, H, 0.055, darkChassisMat);
    rightRail.position.set(W / 2 - sideWidth / 2, baseY + H / 2, 0);
    holographique.add(rightRail);

    const topRail = makeBox(W, sideWidth, 0.055, darkChassisMat);
    topRail.position.set(0, baseY + H - sideWidth / 2, 0);
    holographique.add(topRail);

    // 4. Optical glass substrate pane
    const glassPane = makeBox(W - 0.09, H - 0.09, 0.018, opticalGlassMat, false);
    glassPane.position.set(0, baseY + H / 2, 0);
    glassPane.renderOrder = 2;
    holographique.add(glassPane);

    // 5. Holographic translucent LED film layer
    const holoFilmMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.holographicTexture,
        emissive: 0x38bdf8,
        emissiveMap: textures.holographicTexture,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.86,
        side: THREE.DoubleSide,
        roughness: 0.15,
        metalness: 0.1,
        depthWrite: false,
      }),
    );
    const holoPlane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(W - 0.11, H - 0.11)),
      holoFilmMat,
    );
    holoPlane.position.set(0, baseY + H / 2, 0.012);
    holoPlane.renderOrder = 3;
    holographique.add(holoPlane);

    // 6. Gold status power bus accent strip on driver bar
    const busAccent = makeBox(0.54, 0.016, 0.012, brassAccentMat, false);
    busAccent.position.set(0, baseY - 0.035, 0.062);
    holographique.add(busAccent);
  }

  // =========================================================================
  // 4. DALLE SAMPLE (Compact angled showroom demonstration unit)
  // =========================================================================
  const dalleSample = new THREE.Group();
  {
    const W = 1.18;
    const H = 1.18;
    const D = 0.11;

    // 1. Machined presentation base plate
    const standBase = makeBox(1.06, 0.04, 0.54, darkChassisMat);
    standBase.position.set(0, 0.02, 0);
    dalleSample.add(standBase);

    // 2. Angled easel arms
    for (const side of [-1, 1]) {
      const arm = makeBox(0.055, 0.72, 0.06, brushedSteelMat);
      arm.position.set(side * 0.36, 0.38, -0.06);
      arm.rotation.x = -0.22;
      dalleSample.add(arm);
    }

    // 3. Tilted sample module assembly
    const tiltedUnit = new THREE.Group();
    tiltedUnit.position.set(0, 0.76, 0.04);
    tiltedUnit.rotation.x = -0.2;

    const body = makeBox(W, H, D, darkChassisMat);
    tiltedUnit.add(body);

    const sampleFaceMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.sampleCutawayTexture,
        emissive: 0xffffff,
        emissiveMap: textures.sampleCutawayTexture,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.15,
      }),
    );
    const face = makeBox(W - 0.06, H - 0.06, 0.018, sampleFaceMat, false);
    face.position.set(0, 0, D / 2 + 0.006);
    tiltedUnit.add(face);

    // 4. Four brushed brass magnetic corner locator pins
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const pin = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.032, 12)),
          brassAccentMat,
        );
        pin.rotation.x = Math.PI / 2;
        pin.position.set(sx * (W / 2 - 0.07), sy * (H / 2 - 0.07), -D / 2 - 0.015);
        tiltedUnit.add(pin);
      }
    }

    // 5. Rear exposed PCB / driver plate
    const pcbPlate = makeBox(0.66, 0.66, 0.025, matteBackplateMat);
    pcbPlate.position.set(0, 0, -D / 2 - 0.014);
    tiltedUnit.add(pcbPlate);

    dalleSample.add(tiltedUnit);
  }

  // =========================================================================
  // 5. TRANSPARENT (Architectural glass-facade LED louver curtain panel)
  // =========================================================================
  const transparent = new THREE.Group();
  {
    const W = 1.76;
    const H = 1.76;
    const D = 0.095;
    const baseY = 0.06;

    // 1. Minimalist architectural mounting shoes
    addGroundFootBrackets(transparent, 0.62, 0.34);

    // 2. Perimeter structural aluminum frame (4 separate members for open center)
    const railThick = 0.055;
    const topBar = makeBox(W, railThick, D, darkChassisMat);
    topBar.position.set(0, baseY + H - railThick / 2, 0);
    transparent.add(topBar);

    const botBar = makeBox(W, railThick * 1.3, D, darkChassisMat);
    botBar.position.set(0, baseY + (railThick * 1.3) / 2, 0);
    transparent.add(botBar);

    const leftStile = makeBox(railThick, H, D, darkChassisMat);
    leftStile.position.set(-W / 2 + railThick / 2, baseY + H / 2, 0);
    transparent.add(leftStile);

    const rightStile = makeBox(railThick, H, D, darkChassisMat);
    rightStile.position.set(W / 2 - railThick / 2, baseY + H / 2, 0);
    transparent.add(rightStile);

    // 3. Instanced horizontal micro-LED light blades (open transparent gaps between blades!)
    const bladeCount = 15;
    const bladeGeo = trackGeo(new THREE.BoxGeometry(W - railThick * 2 - 0.02, 0.026, 0.034));
    const bladeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.louverStripTexture,
        emissive: 0x93c5fd,
        emissiveMap: textures.louverStripTexture,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.55,
      }),
    );
    const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeCount);
    const dummy = new THREE.Object3D();
    const usableH = H - railThick * 2.8;
    for (let i = 0; i < bladeCount; i++) {
      const y = baseY + railThick * 1.45 + ((i + 0.5) / bladeCount) * usableH;
      dummy.position.set(0, y, 0.008);
      dummy.updateMatrix();
      blades.setMatrixAt(i, dummy.matrix);
    }
    blades.instanceMatrix.needsUpdate = true;
    blades.computeBoundingSphere();
    transparent.add(blades);

    // 4. Three vertical tension/data micro-rods
    for (const rx of [-0.46, 0, 0.46]) {
      const rod = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.01, 0.01, H - railThick * 2, 10)),
        brushedSteelMat,
      );
      rod.position.set(rx, baseY + H / 2, -0.014);
      transparent.add(rod);
    }

    // 5. Side power junction box with brass contact pins
    const jBox = makeBox(0.05, 0.34, 0.08, matteBackplateMat);
    jBox.position.set(W / 2 + 0.025, baseY + H * 0.3, 0);
    transparent.add(jBox);
  }

  return {
    groups: {
      holographique,
      'smd-50x50': smd50x50,
      'smd-50x100': smd50x100,
      'dalle-sample': dalleSample,
      transparent,
    },
    dispose: () => {
      for (const g of disposableGeometries) g.dispose();
      for (const m of disposableMaterials) m.dispose();
    },
  };
}

import * as THREE from 'three';
import type { DisplayPatternId, PitchTierId } from '../data/panelSpecs';

/**
 * Builds a high-contrast studio photography softbox environment scene
 * baked via PMREMGenerator for authentic brushed-metal, anodized, and
 * optical clearcoat reflections without runtime performance overhead.
 */
export function createStudioSoftboxTexture(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#040507');

  const panelGeo = new THREE.PlaneGeometry(1, 1);

  // Main overhead diffused softbox (gives sleek elongated highlight across top bevel & glass)
  const topBox = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 4.35, 4.1), side: THREE.DoubleSide }),
  );
  topBox.scale.set(14, 5, 1);
  topBox.position.set(0, 7.5, 4.0);
  topBox.lookAt(0, 0, 0);
  envScene.add(topBox);

  // Cool architectural key strip on left
  const leftStrip = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 3.0, 4.0), side: THREE.DoubleSide }),
  );
  leftStrip.scale.set(2.5, 10, 1);
  leftStrip.position.set(-8, 1.5, 2.5);
  leftStrip.lookAt(0, 0, 0);
  envScene.add(leftStrip);

  // Warm rim strip on rear-right (catches rear cooling fins & corner locks)
  const rearWarmStrip = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 3.2, 2.3), side: THREE.DoubleSide }),
  );
  rearWarmStrip.scale.set(3.0, 9, 1);
  rearWarmStrip.position.set(7.5, 2.0, -5.5);
  rearWarmStrip.lookAt(0, 0, 0);
  envScene.add(rearWarmStrip);

  // Rear cool fill strip (reveals rear diagonal ribs & PIXIATECH medallion)
  const rearCoolStrip = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.6, 4.4), side: THREE.DoubleSide }),
  );
  rearCoolStrip.scale.set(8, 3.5, 1);
  rearCoolStrip.position.set(-3.5, 4.5, -7.5);
  rearCoolStrip.lookAt(0, 0, 0);
  envScene.add(rearCoolStrip);

  // Subtle floor bounce
  const floorBounce = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.28, 0.3, 0.35), side: THREE.DoubleSide }),
  );
  floorBounce.scale.set(16, 16, 1);
  floorBounce.position.set(0, -6, 0);
  floorBounce.lookAt(0, 0, 0);
  envScene.add(floorBounce);

  const envTex = pmrem.fromScene(envScene, 0.032).texture;
  panelGeo.dispose();
  envScene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      ((obj as THREE.Mesh).material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();
  return envTex;
}

export function createBrushedMetalMaps(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const streak = 118 + Math.floor(Math.sin(y * 1.9) * 10 + Math.cos(y * 0.51) * 8);
    bCtx.fillStyle = `rgb(${streak}, ${streak}, ${streak})`;
    bCtx.fillRect(0, y, size, 1);
  }
  for (let i = 0; i < 800; i++) {
    const x = (i * 83) % size;
    const y = (i * 149) % size;
    const w = 18 + (i % 70);
    const v = i % 2 === 0 ? 148 : 104;
    bCtx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.16)`;
    bCtx.fillRect(x, y, w, 1);
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.anisotropy = maxAnisotropy;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.drawImage(bumpCanvas, 0, 0);
  const grad = rCtx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.12,
    size / 2,
    size / 2,
    size * 0.72,
  );
  grad.addColorStop(0, 'rgba(175,175,175,0.22)');
  grad.addColorStop(1, 'rgba(105,105,105,0.26)');
  rCtx.fillStyle = grad;
  rCtx.fillRect(0, 0, size, size);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);
  roughnessMap.anisotropy = maxAnisotropy;

  return { bumpMap, roughnessMap };
}

export function createBeadBlastedCastMap(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Deterministic micro-grain for die-cast magnesium-aluminum pockets
  let seed = 1337;
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const val = 112 + (seed % 34);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates bump + roughness maps for the recessed matte-black geometric wavy-ribbed
 * rear inner shell matching the molded structural channels of the reference module.
 */
export function createRearWavyRibMaps(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const w = 1024;
  const h = 512;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext('2d')!;

  // Matte recessed floor
  bCtx.fillStyle = '#525252';
  bCtx.fillRect(0, 0, w, h);
  rCtx.fillStyle = '#D4D4D4';
  rCtx.fillRect(0, 0, w, h);

  // Subtle molded grain
  let seed = 4242;
  const grainImg = bCtx.getImageData(0, 0, w, h);
  const gData = grainImg.data;
  for (let i = 0; i < gData.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const delta = (seed % 14) - 7;
    const v = Math.max(0, Math.min(255, gData[i] + delta));
    gData[i] = v;
    gData[i + 1] = v;
    gData[i + 2] = v;
  }
  bCtx.putImageData(grainImg, 0, 0);

  // Draw sinuous vertical structural ribs across left and right bays
  const drawWavyRibs = (ctx: CanvasRenderingContext2D, stroke: string, widthPx: number) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = widthPx;
    ctx.lineCap = 'round';
    const numCols = 14;
    for (let c = 0; c <= numCols; c++) {
      const baseX = (c / numCols) * w;
      const distCenter = Math.abs(baseX - w / 2) / (w / 2);
      const amp = 14 + (1 - distCenter) * 18;
      const dir = c % 2 === 0 ? 1 : -1;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 8) {
        const ny = (y / h) * Math.PI * 2;
        const x = baseX + Math.sin(ny * 1.5 + c * 0.45) * amp * dir;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Concentric diamond/chevron reinforcement contours on each half-bay
    for (const centerFrac of [0.23, 0.77]) {
      const cx = w * centerFrac;
      const cy = h * 0.5;
      for (const scale of [0.42, 0.72, 1.0]) {
        const rx = w * 0.14 * scale;
        const ry = h * 0.36 * scale;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry);
        ctx.bezierCurveTo(cx + rx * 0.65, cy - ry * 0.35, cx + rx * 0.65, cy + ry * 0.35, cx, cy + ry);
        ctx.bezierCurveTo(cx - rx * 0.65, cy + ry * 0.35, cx - rx * 0.65, cy - ry * 0.35, cx, cy - ry);
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  drawWavyRibs(bCtx, '#D8D8D8', 7);
  drawWavyRibs(bCtx, '#F0F0F0', 3);
  drawWavyRibs(rCtx, '#8A8A8A', 7);

  // Subtle recessed molded mounting bosses
  for (const bxFrac of [0.16, 0.34, 0.66, 0.84]) {
    for (const byFrac of [0.26, 0.74]) {
      const x = w * bxFrac;
      const y = h * byFrac;
      bCtx.fillStyle = '#E6E6E6';
      bCtx.beginPath();
      bCtx.arc(x, y, 8, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.fillStyle = '#2A2A2A';
      bCtx.beginPath();
      bCtx.arc(x, y, 3.5, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = maxAnisotropy;

  return { bumpMap, roughnessMap };
}

/**
 * Generates bump + roughness maps for the matte raw-black outdoor module rear shrouds
 * matching the vertical segmented diagonal-ribbed channels of Photo 1.
 */
export function createOutdoorRearRibMaps(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  bCtx.fillStyle = '#4A4A4A';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#D6D6D6';
  rCtx.fillRect(0, 0, size, size);

  // 4 vertical slat ribs across each module back shroud
  const cols = 4;
  const colW = size / cols;
  for (let c = 0; c < cols; c++) {
    const x0 = c * colW;
    // Deep vertical channel seam between slats
    bCtx.fillStyle = '#202020';
    bCtx.fillRect(x0, 0, 8, size);
    bCtx.fillRect(x0 + colW - 8, 0, 8, size);

    // Raised slat plateau
    bCtx.fillStyle = '#7C7C7C';
    bCtx.fillRect(x0 + 12, 6, colW - 24, size - 12);
    rCtx.fillStyle = '#B8B8B8';
    rCtx.fillRect(x0 + 12, 6, colW - 24, size - 12);

    // Fine 45-degree diagonal micro-ribs inside each vertical slat (Photo 1 signature)
    bCtx.save();
    bCtx.beginPath();
    bCtx.rect(x0 + 14, 10, colW - 28, size - 20);
    bCtx.clip();

    const dir = c % 2 === 0 ? 1 : -1;
    bCtx.strokeStyle = '#CFCFCF';
    bCtx.lineWidth = 4;
    for (let y = -size; y < size * 2; y += 13) {
      bCtx.beginPath();
      bCtx.moveTo(x0, y);
      bCtx.lineTo(x0 + colW, y + colW * 0.75 * dir);
      bCtx.stroke();
    }
    bCtx.restore();

    // Horizontal recessed cross-slots
    for (const yFrac of [0.22, 0.5, 0.78]) {
      const y = size * yFrac;
      bCtx.fillStyle = '#2A2A2A';
      bCtx.fillRect(x0 + 10, y - 4, colW - 20, 8);
    }
  }

  // Upward alignment arrows embossed into bottom slats
  for (const ax of [size * 0.28, size * 0.72]) {
    const ay = size * 0.84;
    bCtx.fillStyle = '#E0E0E0';
    bCtx.beginPath();
    bCtx.moveTo(ax, ay - 22);
    bCtx.lineTo(ax + 10, ay - 6);
    bCtx.lineTo(ax + 4, ay - 6);
    bCtx.lineTo(ax + 4, ay + 16);
    bCtx.lineTo(ax - 4, ay + 16);
    bCtx.lineTo(ax - 4, ay - 6);
    bCtx.lineTo(ax - 10, ay - 6);
    bCtx.closePath();
    bCtx.fill();
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { bumpMap, roughnessMap };
}

/**
 * Generates the emerald-green striped tactile grip texture for the 4 rotary quick-locks.
 */
export function createRotaryTabGreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 128;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3A404A';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#2DF053';
  for (let i = 10; i < w - 10; i += 18) {
    ctx.fillRect(i, 12, 10, h - 24);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Generates a crisp alpha cutout mask for the O-Crystal Pro louvered LED display
 * & open-frame polymer modules: white = opaque horizontal LED louvers & vertical PCB mullions,
 * pure black = ~60% open transparent air gaps.
 */
export function createTransparentLouverAlphaMap(
  rowsPerModule: number,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Transparent air background (pure black)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  // Horizontal opaque LED/polymer louvers (white)
  const rowPitch = h / rowsPerModule;
  const barThickness = Math.max(4, Math.round(rowPitch * 0.42));
  ctx.fillStyle = '#FFFFFF';
  for (let r = 0; r < rowsPerModule; r++) {
    const y = Math.round(r * rowPitch + (rowPitch - barThickness) * 0.5);
    ctx.fillRect(0, y, w, barThickness);
  }

  // Slim vertical structural polymer ribs & PCB bus spine (white) matching O-Crystal Pro module grid
  const ribPositions = [0.0, 0.25, 0.5, 0.75, 1.0];
  ribPositions.forEach((frac, idx) => {
    const rw = idx === 0 || idx === ribPositions.length - 1 ? 14 : 10;
    const rx = Math.max(0, Math.min(w - rw, Math.round(frac * w - rw * 0.5)));
    ctx.fillRect(rx, 0, rw, h);
  });

  // Top & bottom thin module housing rim
  ctx.fillRect(0, 0, w, 10);
  ctx.fillRect(0, h - 10, w, 10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates diffuse, bump, and roughness maps for the O-Crystal Pro 500x250 mm module:
 * matte-black polymer louver housings + vertical emerald-green PCB bus traces + SMD diode pads.
 */
export function createTransparentModulePolymerMaps(
  rowsPerModule: number,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 512;

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = w;
  mapCanvas.height = h;
  const cCtx = mapCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext('2d')!;

  // Matte black polymer louver body
  cCtx.fillStyle = '#0D1015';
  cCtx.fillRect(0, 0, w, h);
  bCtx.fillStyle = '#5C5C5C';
  bCtx.fillRect(0, 0, w, h);
  rCtx.fillStyle = '#B8B8B8';
  rCtx.fillRect(0, 0, w, h);

  const rowPitch = h / rowsPerModule;
  const barThickness = Math.max(4, Math.round(rowPitch * 0.42));

  // Horizontal polymer-encapsulated ribs & micro SMD pads
  for (let r = 0; r < rowsPerModule; r++) {
    const y = Math.round(r * rowPitch + (rowPitch - barThickness) * 0.5);
    cCtx.fillStyle = '#151922';
    cCtx.fillRect(0, y, w, barThickness);
    bCtx.fillStyle = '#C8C8C8';
    bCtx.fillRect(0, y + 1, w, Math.max(2, barThickness - 2));
    rCtx.fillStyle = '#6A6A6A';
    rCtx.fillRect(0, y, w, barThickness);

    // Tiny micro-IC / diode solder points along slats
    cCtx.fillStyle = '#252C38';
    for (let x = 12; x < w - 12; x += 18) {
      cCtx.fillRect(x, y + Math.floor(barThickness * 0.25), 5, Math.max(2, Math.floor(barThickness * 0.5)));
    }
  }

  // Vertical dark emerald-green PCB bus strips matching O-Crystal Pro Module Design photo
  const pcbFracs = [0.25, 0.5, 0.75];
  pcbFracs.forEach((frac) => {
    const px = Math.round(frac * w - 5);
    cCtx.fillStyle = '#073A28';
    cCtx.fillRect(px, 0, 10, h);
    // Subtle copper trace pinstripe + micro vias
    cCtx.fillStyle = '#11724E';
    cCtx.fillRect(px + 2, 0, 2, h);
    cCtx.fillRect(px + 6, 0, 2, h);
    cCtx.fillStyle = '#A67F3C';
    for (let vy = 10; vy < h; vy += 24) {
      cCtx.fillRect(px + 4, vy, 2, 2);
    }

    bCtx.fillStyle = '#E8E8E8';
    bCtx.fillRect(px, 0, 10, h);
    rCtx.fillStyle = '#4A4A4A';
    rCtx.fillRect(px, 0, 10, h);
  });

  // Outer perimeter polymer flange
  cCtx.fillStyle = '#090B0F';
  cCtx.fillRect(0, 0, w, 10);
  cCtx.fillRect(0, h - 10, w, 10);
  cCtx.fillRect(0, 0, 10, h);
  cCtx.fillRect(w - 10, 0, 10, h);

  const setup = (canvas: HTMLCanvasElement, isColor: boolean) => {
    const tex = new THREE.CanvasTexture(canvas);
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    map: setup(mapCanvas, true),
    bumpMap: setup(bumpCanvas, false),
    roughnessMap: setup(roughCanvas, false),
  };
}

/**
 * Generates the signature O-Raster perforated micro-mesh alpha cutout mask (holo-img-2.png):
 * circular open holes (#000000) arranged on a crisp orthogonal grid through a razor-thin
 * black micro-lattice (#FFFFFF), delivering >90% visual transparency without moiré.
 */
export function createHolographicMeshAlphaMap(
  cellsPerTile: number,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Solid micro-lattice carrier (#FFFFFF)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  const pitch = size / cellsPerTile;
  const holeRadius = pitch * 0.41;

  // Punched circular optical apertures (#000000 -> transparent via alphaTest)
  ctx.fillStyle = '#000000';
  for (let r = 0; r < cellsPerTile; r++) {
    for (let c = 0; c < cellsPerTile; c++) {
      const cx = (c + 0.5) * pitch;
      const cy = (r + 0.5) * pitch;
      ctx.beginPath();
      ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates diffuse, bump, and roughness maps for the 1.8 mm O-Raster holographic
 * film mesh module (dark anodized perforated grid + micro-diode / trace nodes at intersections).
 */
export function createHolographicMeshMaps(
  cellsPerTile: number,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 1024;

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = size;
  mapCanvas.height = size;
  const cCtx = mapCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  cCtx.fillStyle = '#101319';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#B8B8B8';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#626262';
  rCtx.fillRect(0, 0, size, size);

  const pitch = size / cellsPerTile;

  // Fine conductive horizontal & vertical trace filaments between holes
  cCtx.fillStyle = '#1D2430';
  bCtx.fillStyle = '#E0E0E0';
  for (let i = 0; i <= cellsPerTile; i++) {
    const p = i * pitch;
    cCtx.fillRect(0, p - 2, size, 4);
    cCtx.fillRect(p - 2, 0, 4, size);
    bCtx.fillRect(0, p - 1.5, size, 3);
    bCtx.fillRect(p - 1.5, 0, 3, size);
  }

  // Micro LED / driver nodes at grid intersections (holo-img-2.png & holo-img-6.png)
  for (let r = 0; r <= cellsPerTile; r++) {
    for (let c = 0; c <= cellsPerTile; c++) {
      const ix = c * pitch;
      const iy = r * pitch;
      cCtx.fillStyle = '#2B3546';
      cCtx.fillRect(ix - 3.5, iy - 3.5, 7, 7);
      cCtx.fillStyle = '#9E8550';
      cCtx.fillRect(ix - 1.5, iy - 1.5, 3, 3);
      rCtx.fillStyle = '#363636';
      rCtx.fillRect(ix - 3, iy - 3, 6, 6);
    }
  }

  const setup = (canvas: HTMLCanvasElement, isColor: boolean) => {
    const tex = new THREE.CanvasTexture(canvas);
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    map: setup(mapCanvas, true),
    bumpMap: setup(bumpCanvas, false),
    roughnessMap: setup(roughCanvas, false),
  };
}

/**
 * Generates crisp horizontal extruded aluminum groove bump & roughness maps
 * for the matte-black top & bottom O-Raster power/controller beams (holo-mid1.png).
 */
export function createPosterHousingRibMaps(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext('2d')!;

  bCtx.fillStyle = '#707070';
  bCtx.fillRect(0, 0, w, h);
  rCtx.fillStyle = '#525252';
  rCtx.fillRect(0, 0, w, h);

  // Fine crisp horizontal ribbed grooves across the extruded beam face (holo-mid1.png)
  for (let y = 18; y < h - 18; y += 6) {
    bCtx.fillStyle = '#D8D8D8';
    bCtx.fillRect(0, y, w, 2);
    bCtx.fillStyle = '#323232';
    bCtx.fillRect(0, y + 2, w, 2);

    rCtx.fillStyle = '#404040';
    rCtx.fillRect(0, y, w, 2);
    rCtx.fillStyle = '#888888';
    rCtx.fillRect(0, y + 2, w, 2);
  }

  const setup = (canvas: HTMLCanvasElement) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(2, 1);
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    bumpMap: setup(bumpCanvas),
    roughnessMap: setup(roughCanvas),
  };
}

/**
 * Crisp horizontal official PIXIATECH circular emblem (/assets/aistudio/favicon_f9979c15.png)
 * paired with the brushed-silver PIXIATECH wordmark for the O-Raster controller beams.
 */
export function createPixiatechBarLogoTexture(
  maxAnisotropy: number,
  onLoad?: () => void,
): THREE.CanvasTexture {
  const w = 768;
  const h = 144;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const badgeR = 52;
  const cx = 172;
  const cy = h / 2;
  const textX = cx + badgeR + 24;

  const drawWordmark = () => {
    ctx.fillStyle = '#E2E8F0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '600 50px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('PIXIATECH', textX, cy + 2);
  };

  const drawFallbackBadge = () => {
    ctx.clearRect(0, 0, w, h);
    const ring = ctx.createLinearGradient(cx - badgeR, cy, cx + badgeR, cy);
    ring.addColorStop(0, '#A855F7');
    ring.addColorStop(1, '#38BDF8');
    ctx.fillStyle = '#090B11';
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ring;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR - 7, 0, Math.PI * 2);
    ctx.stroke();
    drawWordmark();
  };

  drawFallbackBadge();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.clip();

    // Scale 1.09x to crop the outer white drop-shadow margin cleanly
    const drawSize = badgeR * 2 * 1.09;
    ctx.drawImage(img, cx - drawSize / 2, cy - drawSize / 2, drawSize, drawSize);
    ctx.restore();

    drawWordmark();
    tex.needsUpdate = true;
    onLoad?.();
  };
  img.src = '/assets/aistudio/favicon_f9979c15.png';

  return tex;
}

/**
 * Loads the authentic PIXIATECH circular logo (/assets/aistudio/favicon_f9979c15.png)
 * cropped cleanly inside its dark outer bezel to remove corner white padding.
 */
export function createPixiatechMedallionTexture(
  maxAnisotropy: number,
  onLoad?: () => void,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  const drawFallback = () => {
    ctx.fillStyle = '#0D0F14';
    ctx.fillRect(0, 0, size, size);

    const iridRing = ctx.createConicGradient(Math.PI * 0.15, cx, cy);
    iridRing.addColorStop(0.0, '#3B82F6');
    iridRing.addColorStop(0.25, '#22D3EE');
    iridRing.addColorStop(0.55, '#A855F7');
    iridRing.addColorStop(0.85, '#6366F1');
    iridRing.addColorStop(1.0, '#3B82F6');

    ctx.strokeStyle = iridRing;
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0A0B10';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.31, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 56px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('PIXIA', cx, cy - 28);
    ctx.fillText('TECH', cx, cy + 32);
  };

  drawFallback();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0D0F14';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.495, 0, Math.PI * 2);
    ctx.clip();

    // Scale 1.09x to crop out the outer white drop-shadow margin cleanly
    const drawScale = 1.09;
    const drawSize = size * drawScale;
    const offset = (size - drawSize) / 2;
    ctx.drawImage(img, offset, offset, drawSize, drawSize);
    ctx.restore();

    tex.needsUpdate = true;
    onLoad?.();
  };
  img.src = '/assets/aistudio/favicon_f9979c15.png';

  return tex;
}

export function createPcbBackplaneTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 288;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0e13';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(65, 98, 118, 0.16)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(220, 160, 74, 0.45)';
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 4; row++) {
    const baseY = 44 + row * 64;
    ctx.beginPath();
    ctx.moveTo(32, baseY);
    ctx.lineTo(140, baseY);
    ctx.lineTo(164, baseY + 14);
    ctx.lineTo(348, baseY + 14);
    ctx.lineTo(372, baseY);
    ctx.lineTo(480, baseY);
    ctx.stroke();
  }

  for (let cx = 0; cx < 4; cx++) {
    for (let cy = 0; cy < 2; cy++) {
      const px = 86 + cx * 102;
      const py = 74 + cy * 112;
      ctx.fillStyle = '#141820';
      ctx.fillRect(px, py, 36, 26);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.strokeRect(px, py, 36, 26);
      ctx.fillStyle = '#d4a14a';
      for (let p = 0; p < 6; p++) {
        ctx.fillRect(px + 4 + p * 5, py - 2, 2, 2);
        ctx.fillRect(px + 4 + p * 5, py + 26, 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Renders an animated frame of the holographic showcase sequence (matching the
 * floating figure, swirling neon-green energy vortex, and orbiting gaming/audio
 * devices from the reference video) into a 2D canvas. Scales cleanly across 1..4
 * horizontal panels without stretching while preserving crisp LED subpixel contrast
 * across the perforated circular holes.
 */
export function drawHolographicVideoFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSec: number,
  panelCount: number = 1,
): void {
  const t = timeSec;
  const cx = w * 0.5;
  const cy = h * 0.52;
  // Keep vertical proportions anchored to height so 2..4 wide panels expand the
  // horizontal holographic stage without stretching the floating subject.
  const unit = Math.min(h * 0.5, w * 0.92);

  // 1. Vibrant electric-cyan holographic gradient backdrop
  const bg = ctx.createRadialGradient(cx, cy * 0.9, unit * 0.08, cx, cy, Math.max(w, h) * 0.78);
  bg.addColorStop(0, '#09B8FF');
  bg.addColorStop(0.45, '#008EE6');
  bg.addColorStop(0.82, '#0056A3');
  bg.addColorStop(1, '#022347');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle vertical luminous cyan caustic shafts
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const sx = w * (0.2 + i * 0.3) + Math.sin(t * 0.8 + i * 2.1) * unit * 0.14;
    const shaft = ctx.createLinearGradient(sx - unit * 0.25, 0, sx + unit * 0.25, h);
    shaft.addColorStop(0, 'rgba(125, 249, 255, 0)');
    shaft.addColorStop(0.5, 'rgba(125, 249, 255, 0.16)');
    shaft.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = shaft;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  // Helper to draw glowing neon-green liquid swirl arc
  const drawRibbonArc = (isFrontPass: boolean) => {
    ctx.save();
    ctx.lineCap = 'round';
    const spreadX = panelCount > 1 ? unit * (0.68 + (panelCount - 1) * 0.34) : unit * 0.62;
    const steps = 44;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const angle = p * Math.PI * 3.1 - t * 1.45;
      const depth = Math.sin(angle);
      const wantFront = depth >= 0;
      if (wantFront !== isFrontPass) {
        started = false;
        continue;
      }
      const rx = cx + Math.cos(angle) * spreadX * (0.58 + 0.32 * Math.sin(p * Math.PI));
      const ry = h * 0.12 + p * h * 0.78 + Math.cos(angle * 2) * unit * 0.04;
      if (!started) {
        ctx.moveTo(rx, ry);
        started = true;
      } else {
        ctx.lineTo(rx, ry);
      }
    }
    ctx.strokeStyle = 'rgba(132, 255, 46, 0.28)';
    ctx.lineWidth = unit * 0.17;
    ctx.stroke();

    ctx.strokeStyle = '#38E51B';
    ctx.lineWidth = unit * 0.105;
    ctx.stroke();

    ctx.strokeStyle = '#B8FF59';
    ctx.lineWidth = unit * 0.04;
    ctx.stroke();
    ctx.restore();
  };

  // Back pass of green energy spiral
  drawRibbonArc(false);

  // 2. Floating curly-haired figure (frames 00:00 .. 00:04)
  const bobY = Math.sin(t * 2.1) * unit * 0.032;
  const tilt = Math.sin(t * 1.25) * 0.06;
  const armWaveL = Math.sin(t * 2.4) * 0.34;
  const armWaveR = Math.cos(t * 2.1) * 0.38;

  ctx.save();
  ctx.translate(cx, cy + bobY);
  ctx.rotate(tilt);

  // Soft cyan aura behind figure
  const aura = ctx.createRadialGradient(0, -unit * 0.1, unit * 0.04, 0, -unit * 0.05, unit * 0.56);
  aura.addColorStop(0, 'rgba(186, 246, 255, 0.38)');
  aura.addColorStop(1, 'rgba(0, 142, 230, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -unit * 0.05, unit * 0.56, 0, Math.PI * 2);
  ctx.fill();

  // Legs (ripped denim jeans + sneakers)
  const drawLeg = (side: -1 | 1, kneeBendY: number, legSwingX: number) => {
    ctx.save();
    // Thigh -> knee -> shin
    ctx.strokeStyle = '#5399CE';
    ctx.lineWidth = unit * 0.115;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(side * unit * 0.085, unit * 0.06);
    ctx.lineTo(side * unit * 0.13 + legSwingX * 0.5, unit * 0.29 + kneeBendY);
    ctx.lineTo(side * unit * 0.09 + legSwingX, unit * 0.51 + kneeBendY * 0.5);
    ctx.stroke();

    // Denim highlight & distressed rip patch
    ctx.fillStyle = '#E2EEF8';
    ctx.fillRect(
      side * unit * 0.08 + legSwingX * 0.35,
      unit * 0.25 + kneeBendY * 0.7,
      unit * 0.06,
      unit * 0.028,
    );

    // Sneaker (white sole + coral-orange / denim upper)
    const sx = side * unit * 0.09 + legSwingX;
    const sy = unit * 0.54 + kneeBendY * 0.5;
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(sx + side * unit * 0.02, sy + unit * 0.025, unit * 0.068, unit * 0.028, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.ellipse(sx + side * unit * 0.012, sy, unit * 0.058, unit * 0.032, side * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawLeg(-1, Math.sin(t * 2.1) * unit * 0.03, -unit * 0.02);
  drawLeg(1, Math.cos(t * 2.1) * unit * 0.03, unit * 0.025);

  // Arms in olive-green knit sweater sleeves
  const drawArm = (side: -1 | 1, wave: number) => {
    ctx.save();
    ctx.translate(side * unit * 0.16, -unit * 0.18);
    ctx.rotate(side * (-0.55 + wave));
    ctx.strokeStyle = '#6D7F22';
    ctx.lineWidth = unit * 0.092;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * unit * 0.14, -unit * 0.04, side * unit * 0.28, -unit * 0.16);
    ctx.stroke();
    // Hand
    ctx.fillStyle = '#D99B72';
    ctx.beginPath();
    ctx.arc(side * unit * 0.3, -unit * 0.18, unit * 0.042, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawArm(-1, armWaveL);
  drawArm(1, armWaveR);

  // Olive-green textured knit sweater torso
  const torsoGrad = ctx.createLinearGradient(-unit * 0.16, -unit * 0.24, unit * 0.16, unit * 0.12);
  torsoGrad.addColorStop(0, '#859A2B');
  torsoGrad.addColorStop(0.55, '#66781E');
  torsoGrad.addColorStop(1, '#4C5B14');
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.roundRect(-unit * 0.17, -unit * 0.23, unit * 0.34, unit * 0.33, unit * 0.09);
  ctx.fill();

  // Curly hair volume halo
  ctx.fillStyle = '#3B2314';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const hr = unit * (0.145 + (i % 2) * 0.025);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * hr, -unit * 0.38 + Math.sin(a) * hr * 0.92, unit * 0.068, 0, Math.PI * 2);
    ctx.fill();
  }

  // Face
  ctx.fillStyle = '#D99B72';
  ctx.beginPath();
  ctx.ellipse(0, -unit * 0.36, unit * 0.095, unit * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glasses + joyful smile
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = unit * 0.011;
  ctx.beginPath();
  ctx.arc(-unit * 0.036, -unit * 0.365, unit * 0.028, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(unit * 0.036, -unit * 0.365, unit * 0.028, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = unit * 0.012;
  ctx.beginPath();
  ctx.arc(0, -unit * 0.325, unit * 0.032, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // Signature turquoise over-ear headphones
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = unit * 0.03;
  ctx.beginPath();
  ctx.arc(0, -unit * 0.38, unit * 0.145, Math.PI * 1.08, Math.PI * -0.08);
  ctx.stroke();
  ctx.fillStyle = '#22D3EE';
  ctx.beginPath();
  ctx.ellipse(-unit * 0.14, -unit * 0.36, unit * 0.032, unit * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(unit * 0.14, -unit * 0.36, unit * 0.032, unit * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Front pass of neon-green energy swirl
  drawRibbonArc(true);

  // 3. Orbiting floating gaming & audio gear (gamepads, speakers, headphones, discs)
  const drawGamepad = (gx: number, gy: number, rot: number, bodyHex: string, scale = 1) => {
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.fillStyle = bodyHex;
    ctx.beginPath();
    ctx.roundRect(-unit * 0.11, -unit * 0.055, unit * 0.22, unit * 0.11, unit * 0.048);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-unit * 0.05, 0, unit * 0.022, 0, Math.PI * 2);
    ctx.arc(unit * 0.05, 0, unit * 0.022, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A3FF12';
    ctx.beginPath();
    ctx.arc(unit * 0.065, -unit * 0.015, unit * 0.01, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawSpeaker = (sx: number, sy: number, rot: number) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.roundRect(-unit * 0.1, -unit * 0.06, unit * 0.2, unit * 0.12, unit * 0.028);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-unit * 0.042, 0, unit * 0.034, 0, Math.PI * 2);
    ctx.arc(unit * 0.042, 0, unit * 0.034, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(-unit * 0.042, 0, unit * 0.012, 0, Math.PI * 2);
    ctx.arc(unit * 0.042, 0, unit * 0.012, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const spreadFactor = 1 + (panelCount - 1) * 0.45;
  drawGamepad(
    cx + Math.cos(t * 1.4) * unit * 0.34 * spreadFactor,
    cy + unit * 0.14 + Math.sin(t * 1.8) * unit * 0.07,
    Math.sin(t * 1.1) * 0.25,
    '#7DFF1F',
    0.95,
  );
  drawGamepad(
    cx - Math.cos(t * 1.2 + 0.8) * unit * 0.36 * spreadFactor,
    cy - unit * 0.06 + Math.sin(t * 1.5 + 1.2) * unit * 0.09,
    -0.2 + Math.cos(t) * 0.2,
    '#1D4ED8',
    0.88,
  );
  drawSpeaker(
    cx - unit * 0.26 * spreadFactor + Math.sin(t * 0.9) * unit * 0.06,
    cy - unit * 0.48 + Math.cos(t * 1.3) * unit * 0.05,
    -0.18 + Math.sin(t * 0.8) * 0.12,
  );

  // Floating glowing cyan headphones & neon discs
  const drawDisc = (dx: number, dy: number, r: number, col: string) => {
    ctx.save();
    ctx.fillStyle = 'rgba(132, 255, 46, 0.25)';
    ctx.beginPath();
    ctx.arc(dx, dy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawDisc(
    cx + unit * 0.32 * spreadFactor,
    cy - unit * 0.42 + Math.sin(t * 2.0) * unit * 0.05,
    unit * 0.045,
    '#84FF2E',
  );
  if (panelCount >= 2) {
    drawSpeaker(
      cx + unit * 0.62 * spreadFactor,
      cy + unit * 0.22 + Math.sin(t * 1.6) * unit * 0.06,
      0.22,
    );
    drawGamepad(
      cx - unit * 0.64 * spreadFactor,
      cy + unit * 0.26 + Math.cos(t * 1.4) * unit * 0.07,
      0.18,
      '#84FF2E',
      0.9,
    );
  }

  // Subtle LED subpixel scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let x = 0; x < w; x += 6) {
    ctx.fillRect(x, 0, 1, h);
  }
}

export function createMasterEmitterCanvas(
  pattern: DisplayPatternId,
  pitch: PitchTierId,
  panelCount: number = 1,
): HTMLCanvasElement {
  const w = pattern === 'video' ? Math.min(1024, Math.max(384, panelCount * 320)) : 1024;
  const h = pattern === 'video' ? 512 : 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (pattern === 'video') {
    drawHolographicVideoFrame(ctx, w, h, 0.4, panelCount);
    return canvas;
  }

  ctx.fillStyle = '#06080B';
  ctx.fillRect(0, 0, w, h);

  if (pattern === 'fluid') {
    // Reflets noirs — luminous noir/silver & warm gold-ice holographic wave folds
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#090C12');
    base.addColorStop(0.45, '#131A26');
    base.addColorStop(0.82, '#1C2433');
    base.addColorStop(1, '#080B10');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 46;
    ctx.shadowOffsetY = 16;
    const rib1 = ctx.createLinearGradient(w * 0.08, h * 0.1, w * 0.78, h * 0.9);
    rib1.addColorStop(0, '#0D131D');
    rib1.addColorStop(0.36, '#2A384D');
    rib1.addColorStop(0.62, '#5C6F8C');
    rib1.addColorStop(1, '#0B1018');
    ctx.fillStyle = rib1;
    ctx.beginPath();
    ctx.moveTo(-60, h * 0.72);
    ctx.bezierCurveTo(w * 0.22, h * 0.12, w * 0.48, h * 0.85, w * 0.85, -40);
    ctx.lineTo(w * 1.05, h * 0.12);
    ctx.bezierCurveTo(w * 0.65, h * 1.05, w * 0.34, h * 0.42, w * 0.12, h * 1.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 10;
    const rib2 = ctx.createLinearGradient(w * 0.2, h * 0.85, w * 0.9, h * 0.15);
    rib2.addColorStop(0, '#0D1119');
    rib2.addColorStop(0.38, '#323E52');
    rib2.addColorStop(0.62, '#C8914B');
    rib2.addColorStop(0.82, '#2B3547');
    rib2.addColorStop(1, '#090C11');
    ctx.fillStyle = rib2;
    ctx.beginPath();
    ctx.moveTo(w * 0.16, h * 1.05);
    ctx.bezierCurveTo(w * 0.34, h * 0.35, w * 0.66, h * 0.64, w * 1.08, h * 0.08);
    ctx.lineTo(w * 1.12, h * 0.42);
    ctx.bezierCurveTo(w * 0.72, h * 0.88, w * 0.46, h * 0.62, w * 0.36, h * 1.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const rib3 = ctx.createRadialGradient(w * 0.52, h * 0.46, 16, w * 0.52, h * 0.46, w * 0.48);
    rib3.addColorStop(0, 'rgba(241, 245, 249, 0.32)');
    rib3.addColorStop(0.5, 'rgba(148, 163, 184, 0.12)');
    rib3.addColorStop(1, 'rgba(4, 6, 10, 0.0)');
    ctx.fillStyle = rib3;
    ctx.fillRect(0, 0, w, h);
  } else if (pattern === 'ambient') {
    const grad = ctx.createLinearGradient(0, h * 0.92, w, h * 0.08);
    grad.addColorStop(0, '#07090D');
    grad.addColorStop(0.36, '#1E2736');
    grad.addColorStop(0.68, '#B8762E');
    grad.addColorStop(1, '#080B10');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.54, h * 0.48, 24, w * 0.54, h * 0.48, w * 0.46);
    glow.addColorStop(0, 'rgba(251, 211, 141, 0.42)');
    glow.addColorStop(0.55, 'rgba(148, 163, 184, 0.14)');
    glow.addColorStop(1, 'rgba(5, 6, 8, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  } else if (pattern === 'calibration') {
    ctx.fillStyle = '#07090D';
    ctx.fillRect(0, 0, w, h);
    const step = pitch === 'p09' ? 32 : pitch === 'p12' ? 40 : 56;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 160, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Noir absolu with subtle glossy studio diagonal sheen
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#07090D');
    grad.addColorStop(0.42, '#10151E');
    grad.addColorStop(0.56, '#1E2634');
    grad.addColorStop(1, '#07090D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Ultra-subtle micro-LED subpixel sheen
  const diodeStep = pitch === 'p09' ? 4 : pitch === 'p12' ? 6 : 8;
  ctx.fillStyle = pattern === 'off' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.1)';
  for (let x = 0; x < w; x += diodeStep) {
    ctx.fillRect(x, 0, 1, h);
  }

  return canvas;
}

/**
 * Generates architectural slate concrete wall diffuse & bump maps for MURAL mode
 * so the transparent perforated holographic screen shows realistic wall texture
 * directly behind its circular apertures.
 */
export function createArchitecturalWallMaps(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 1024;
  const h = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#282E3A');
  grad.addColorStop(0.45, '#1D222C');
  grad.addColorStop(1, '#12151C');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Architectural concrete panel reveal joints
  cCtx.strokeStyle = 'rgba(8, 10, 14, 0.55)';
  cCtx.lineWidth = 3;
  bCtx.strokeStyle = '#383838';
  bCtx.lineWidth = 4;
  for (const frac of [0.25, 0.5, 0.75]) {
    const x = Math.round(w * frac);
    cCtx.beginPath();
    cCtx.moveTo(x, 0);
    cCtx.lineTo(x, h);
    cCtx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.lineTo(x, h);
    bCtx.stroke();
  }
  for (const frac of [0.33, 0.66]) {
    const y = Math.round(h * frac);
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.lineTo(w, y);
    cCtx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(w, y);
    bCtx.stroke();
  }

  // Subtle tactile concrete mineral grain
  let seed = 9187;
  const cImg = cCtx.getImageData(0, 0, w, h);
  const bImg = bCtx.getImageData(0, 0, w, h);
  const cd = cImg.data;
  const bd = bImg.data;
  for (let i = 0; i < cd.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const n = (seed % 9) - 4;
    cd[i] = Math.max(0, Math.min(255, cd[i] + n));
    cd[i + 1] = Math.max(0, Math.min(255, cd[i + 1] + n));
    cd[i + 2] = Math.max(0, Math.min(255, cd[i + 2] + n));
    bd[i] = Math.max(0, Math.min(255, bd[i] + n * 2));
    bd[i + 1] = bd[i];
    bd[i + 2] = bd[i];
  }
  cCtx.putImageData(cImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createSlicedEmitterTexture(
  masterCanvas: HTMLCanvasElement,
  uOffset: number,
  vOffset: number,
  uSpan: number,
  vSpan: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(masterCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(uSpan, vSpan);
  texture.offset.set(uOffset, vOffset);
  texture.needsUpdate = true;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.48,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.84)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.36)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStudioFloorAlphaTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.04,
    size / 2,
    size / 2,
    size * 0.46,
  );
  grad.addColorStop(0, 'rgb(255, 255, 255)');
  grad.addColorStop(0.28, 'rgb(185, 185, 185)');
  grad.addColorStop(0.56, 'rgb(65, 65, 65)');
  grad.addColorStop(0.82, 'rgb(12, 12, 12)');
  grad.addColorStop(1, 'rgb(0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Generates seamless dark obsidian studio mirror maps (no visible tile seams or blotches)
 * for crisp-to-soft planar mirror reflections beneath the LED cabinet.
 */
export function createPolishedConcreteMaps(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  const baseGrad = cCtx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.04,
    size / 2,
    size / 2,
    size * 0.5,
  );
  baseGrad.addColorStop(0, '#12161E');
  baseGrad.addColorStop(0.55, '#090C11');
  baseGrad.addColorStop(1, '#040508');
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#2A2A2A';
  rCtx.fillRect(0, 0, size, size);

  // Ultra-fine seamless satin grain (zero tile joints, zero blotches)
  let seed = 8713;
  const bImg = bCtx.getImageData(0, 0, size, size);
  const cImg = cCtx.getImageData(0, 0, size, size);
  const bd = bImg.data;
  const cd = cImg.data;
  for (let i = 0; i < bd.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const n = (seed % 7) - 3;
    const bv = Math.max(0, Math.min(255, bd[i] + n));
    bd[i] = bv;
    bd[i + 1] = bv;
    bd[i + 2] = bv;

    const cn = Math.round(n * 0.45);
    cd[i] = Math.max(0, Math.min(255, cd[i] + cn));
    cd[i + 1] = Math.max(0, Math.min(255, cd[i + 1] + cn));
    cd[i + 2] = Math.max(0, Math.min(255, cd[i + 2] + cn));
  }
  bCtx.putImageData(bImg, 0, 0);
  cCtx.putImageData(cImg, 0, 0);

  const setup = (canvas: HTMLCanvasElement, isColor: boolean) => {
    const t = new THREE.CanvasTexture(canvas);
    if (isColor) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = maxAnisotropy;
    return t;
  };

  return {
    map: setup(colorCanvas, true),
    bumpMap: setup(bumpCanvas, false),
    roughnessMap: setup(roughCanvas, false),
  };
}

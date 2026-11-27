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
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 2.4, 3.1), side: THREE.DoubleSide }),
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
 * Loads the authentic PIXIATECH circular logo (/product-3d/assets/aistudio/favicon_f9979c15.png)
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
  img.src = '/product-3d/assets/aistudio/favicon_f9979c15.png';

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
 * High-resolution 16:9 master optical canvas (1280x720) with silky photographic
 * gradients & sculptural 3D ribbon folds inspired by Image 1.
 */
export function createMasterEmitterCanvas(
  pattern: DisplayPatternId,
  pitch: PitchTierId,
): HTMLCanvasElement {
  const w = 1280;
  const h = 720;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#06090e';
  ctx.fillRect(0, 0, w, h);

  if (pattern === 'fluid') {
    // Deep oceanic-cyan atmospheric base (Image 1 aesthetic)
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#07223F');
    base.addColorStop(0.45, '#0F5C8E');
    base.addColorStop(0.85, '#38A3C7');
    base.addColorStop(1, '#123A5A');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Sculpted fluid ribbon 1: Deep cobalt to glacier cyan fold
    ctx.save();
    ctx.shadowColor = 'rgba(2, 12, 28, 0.55)';
    ctx.shadowBlur = 46;
    ctx.shadowOffsetY = 18;
    const rib1 = ctx.createLinearGradient(w * 0.08, h * 0.1, w * 0.78, h * 0.9);
    rib1.addColorStop(0, '#0B2E59');
    rib1.addColorStop(0.32, '#2B8CBE');
    rib1.addColorStop(0.62, '#A5E3F5');
    rib1.addColorStop(1, '#0E4E78');
    ctx.fillStyle = rib1;
    ctx.beginPath();
    ctx.moveTo(-60, h * 0.72);
    ctx.bezierCurveTo(w * 0.22, h * 0.12, w * 0.48, h * 0.85, w * 0.85, -40);
    ctx.lineTo(w * 1.05, h * 0.12);
    ctx.bezierCurveTo(w * 0.65, h * 1.05, w * 0.34, h * 0.42, w * 0.12, h * 1.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Sculpted fluid ribbon 2: Warm pearl-ivory & amber gold crest
    ctx.save();
    ctx.shadowColor = 'rgba(4, 18, 36, 0.45)';
    ctx.shadowBlur = 38;
    ctx.shadowOffsetY = 12;
    const rib2 = ctx.createLinearGradient(w * 0.2, h * 0.85, w * 0.9, h * 0.15);
    rib2.addColorStop(0, '#1B6B93');
    rib2.addColorStop(0.36, '#E2F1F8');
    rib2.addColorStop(0.62, '#F8B968');
    rib2.addColorStop(0.84, '#E26D25');
    rib2.addColorStop(1, '#0F3659');
    ctx.fillStyle = rib2;
    ctx.beginPath();
    ctx.moveTo(w * 0.16, h * 1.05);
    ctx.bezierCurveTo(w * 0.34, h * 0.35, w * 0.66, h * 0.64, w * 1.08, h * 0.08);
    ctx.lineTo(w * 1.12, h * 0.42);
    ctx.bezierCurveTo(w * 0.72, h * 0.88, w * 0.46, h * 0.62, w * 0.36, h * 1.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Soft translucent silk highlight ribbon 3
    const rib3 = ctx.createRadialGradient(w * 0.52, h * 0.45, 16, w * 0.52, h * 0.45, w * 0.48);
    rib3.addColorStop(0, 'rgba(255, 248, 235, 0.46)');
    rib3.addColorStop(0.45, 'rgba(125, 211, 252, 0.18)');
    rib3.addColorStop(1, 'rgba(6, 12, 22, 0.0)');
    ctx.fillStyle = rib3;
    ctx.fillRect(0, 0, w, h);
  } else if (pattern === 'ambient') {
    const grad = ctx.createLinearGradient(0, h * 0.92, w, h * 0.08);
    grad.addColorStop(0, '#071422');
    grad.addColorStop(0.35, '#0F4C6E');
    grad.addColorStop(0.66, '#D97706');
    grad.addColorStop(1, '#0B1018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.62, h * 0.44, 24, w * 0.62, h * 0.44, w * 0.45);
    glow.addColorStop(0, 'rgba(255, 214, 165, 0.42)');
    glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.14)');
    glow.addColorStop(1, 'rgba(6, 8, 11, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  } else if (pattern === 'calibration') {
    ctx.fillStyle = '#090C11';
    ctx.fillRect(0, 0, w, h);
    const step = pitch === 'p09' ? 32 : pitch === 'p12' ? 40 : 56;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.lineWidth = 1;
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
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.58)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 150, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090B0F');
    grad.addColorStop(0.5, '#11141B');
    grad.addColorStop(1, '#07090C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Ultra-subtle micro-LED subpixel sheen (barely perceptible, no coarse grid artifact)
  const diodeStep = pitch === 'p09' ? 4 : pitch === 'p12' ? 6 : 8;
  ctx.fillStyle = pattern === 'off' ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.08)';
  for (let x = 0; x < w; x += diodeStep) {
    ctx.fillRect(x, 0, 1, h);
  }

  return canvas;
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
    size * 0.06,
    size / 2,
    size / 2,
    size * 0.49,
  );
  grad.addColorStop(0, 'rgb(255, 255, 255)');
  grad.addColorStop(0.38, 'rgb(195, 195, 195)');
  grad.addColorStop(0.7, 'rgb(70, 70, 70)');
  grad.addColorStop(0.92, 'rgb(10, 10, 10)');
  grad.addColorStop(1, 'rgb(0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

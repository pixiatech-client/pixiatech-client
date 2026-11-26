'use client';
import * as THREE from 'three';

/**
 * Generates an ultra-crisp procedural micro-LED pixel pitch + 2x2 sub-module seam texture
 * so close-up camera angles reveal physical SMD/COB matrix structure and OptiShield surface grain.
 */
export function createLedMatrixTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base dark OptiShield optical matte matrix
  ctx.fillStyle = '#0D0E12';
  ctx.fillRect(0, 0, size, size);

  // Subtle LED pitch micro-grid (32x32 visible clusters per cabinet for clean moiré-free closeups)
  const cells = 32;
  const step = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const cx = x * step + step * 0.5;
      const cy = y * step + step * 0.5;
      const r = step * 0.36;

      ctx.fillStyle = '#D8DCE3';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle 2x2 internal seam lines representing the 4-in-1 module subdivision
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, 0);
  ctx.lineTo(size * 0.5, size);
  ctx.moveTo(0, size * 0.5);
  ctx.lineTo(size, size * 0.5);
  ctx.stroke();

  // Outer perimeter bevel shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a procedural honed basalt architectural floor roughness/bump texture
 * so the gallery floor reflects the glowing kinetic wall naturally.
 */
export function createArchitecturalFloorTextures(maxAnisotropy: number): {
  roughnessMap: THREE.CanvasTexture;
  map: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  // Dark honed stone base
  cCtx.fillStyle = '#0D0F13';
  cCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#3A3A3A'; // Low roughness (~0.23) for subtle architectural reflection
  rCtx.fillRect(0, 0, size, size);

  // Subtle stone mineral grain
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 1 + Math.random() * 3;
    const h = 1 + Math.random() * 3;
    const shade = Math.random() > 0.5 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.06)';
    cCtx.fillStyle = shade;
    cCtx.fillRect(x, y, w, h);

    const rShade = Math.floor(42 + Math.random() * 44);
    rCtx.fillStyle = `rgb(${rShade},${rShade},${rShade})`;
    rCtx.fillRect(x, y, w, h);
  }

  // Architectural basalt slab joints (2x2 slabs per tile)
  cCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  cCtx.lineWidth = 2;
  cCtx.beginPath();
  cCtx.moveTo(size * 0.5, 0);
  cCtx.lineTo(size * 0.5, size);
  cCtx.moveTo(0, size * 0.5);
  cCtx.lineTo(size, size * 0.5);
  cCtx.stroke();

  rCtx.strokeStyle = '#999999';
  rCtx.lineWidth = 3;
  rCtx.beginPath();
  rCtx.moveTo(size * 0.5, 0);
  rCtx.lineTo(size * 0.5, size);
  rCtx.moveTo(0, size * 0.5);
  rCtx.lineTo(size, size * 0.5);
  rCtx.stroke();

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);
  map.anisotropy = Math.min(8, maxAnisotropy);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(8, 8);
  roughnessMap.anisotropy = Math.min(8, maxAnisotropy);

  return { map, roughnessMap };
}

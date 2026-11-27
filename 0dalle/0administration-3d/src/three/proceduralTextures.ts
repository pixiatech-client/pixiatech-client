import * as THREE from 'three';

export interface ProceduralTextureSet {
  smdWaveTexture: THREE.CanvasTexture;
  tallWaveTexture: THREE.CanvasTexture;
  holographicTexture: THREE.CanvasTexture;
  sampleCutawayTexture: THREE.CanvasTexture;
  louverStripTexture: THREE.CanvasTexture;
  brushedMetalRoughness: THREE.CanvasTexture;
  contactShadowTexture: THREE.CanvasTexture;
  dispose: () => void;
}

function drawPixiaWaveArtwork(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  variant: 'square' | 'tall' | 'holo' | 'sample',
): void {
  // Deep obsidian/navy base
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (variant === 'holo') {
    bgGrad.addColorStop(0, 'rgba(8, 16, 30, 0.16)');
    bgGrad.addColorStop(0.5, 'rgba(15, 32, 56, 0.22)');
    bgGrad.addColorStop(1, 'rgba(8, 16, 30, 0.14)');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    bgGrad.addColorStop(0, '#070B12');
    bgGrad.addColorStop(0.55, '#0F1826');
    bgGrad.addColorStop(1, '#090D15');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Layered flowing architectural waves (slate-blue & signature warm amber-gold)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, height * 0.34);
  ctx.bezierCurveTo(
    width * 0.28,
    height * 0.12,
    width * 0.62,
    height * 0.62,
    width,
    height * 0.26,
  );
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  const waveBlue = ctx.createLinearGradient(0, height * 0.2, width, height * 0.9);
  if (variant === 'holo') {
    waveBlue.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
    waveBlue.addColorStop(0.55, 'rgba(99, 102, 241, 0.30)');
    waveBlue.addColorStop(1, 'rgba(15, 23, 42, 0.12)');
  } else {
    waveBlue.addColorStop(0, '#1D2B42');
    waveBlue.addColorStop(0.45, '#2C3F5E');
    waveBlue.addColorStop(1, '#0B121E');
  }
  ctx.fillStyle = waveBlue;
  ctx.fill();
  ctx.restore();

  // Secondary overlapping dark slate curve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, height * 0.68);
  ctx.bezierCurveTo(
    width * 0.34,
    height * 0.48,
    width * 0.56,
    height * 0.24,
    width,
    height * 0.44,
  );
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  const waveDark = ctx.createLinearGradient(0, height * 0.35, width, height);
  if (variant === 'holo') {
    waveDark.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
    waveDark.addColorStop(1, 'rgba(2, 6, 23, 0.10)');
  } else {
    waveDark.addColorStop(0, '#162235');
    waveDark.addColorStop(0.6, '#0E1522');
    waveDark.addColorStop(1, '#070A10');
  }
  ctx.fillStyle = waveDark;
  ctx.fill();
  ctx.restore();

  // Signature warm amber-gold luminous ribbon highlight
  ctx.save();
  const goldGlow = ctx.createRadialGradient(
    width * 0.68,
    height * 0.54,
    width * 0.02,
    width * 0.68,
    height * 0.54,
    width * 0.42,
  );
  if (variant === 'holo') {
    goldGlow.addColorStop(0, 'rgba(251, 191, 36, 0.85)');
    goldGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.45)');
    goldGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  } else {
    goldGlow.addColorStop(0, 'rgba(245, 185, 86, 0.92)');
    goldGlow.addColorStop(0.35, 'rgba(217, 138, 43, 0.55)');
    goldGlow.addColorStop(0.75, 'rgba(130, 82, 34, 0.15)');
    goldGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  }

  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.bezierCurveTo(
    width * 0.36,
    height * 0.86,
    width * 0.58,
    height * 0.42,
    width,
    height * 0.38,
  );
  ctx.lineTo(width, height * 0.66);
  ctx.bezierCurveTo(
    width * 0.62,
    height * 0.70,
    width * 0.38,
    height * 0.95,
    0,
    height * 0.86,
  );
  ctx.closePath();
  ctx.fillStyle = goldGlow;
  ctx.fill();
  ctx.restore();

  // Subtle top-right cool metallic sheen
  const topSheen = ctx.createLinearGradient(width * 0.2, 0, width, height * 0.5);
  topSheen.addColorStop(0, 'rgba(148, 163, 184, 0)');
  topSheen.addColorStop(0.5, variant === 'holo' ? 'rgba(125, 211, 252, 0.26)' : 'rgba(148, 163, 184, 0.14)');
  topSheen.addColorStop(1, 'rgba(148, 163, 184, 0)');
  ctx.fillStyle = topSheen;
  ctx.fillRect(0, 0, width, height);

  // Subtle SMD micro-LED pixel grid lines
  ctx.strokeStyle = variant === 'holo' ? 'rgba(186, 230, 253, 0.14)' : 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 1;
  const step = variant === 'holo' ? 12 : 8;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // If sample model, render an exposed technical PCB / pixel pitch corner cutaway
  if (variant === 'sample') {
    const cutX = width * 0.62;
    const cutY = height * 0.64;
    ctx.fillStyle = '#0B1A15';
    ctx.fillRect(cutX, cutY, width - cutX, height - cutY);

    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(cutX + 1.5, cutY + 1.5, width - cutX - 3, height - cutY - 3);

    // Copper PCB traces & SMD diode pads
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1.5;
    for (let gx = cutX + 14; gx < width - 10; gx += 18) {
      ctx.beginPath();
      ctx.moveTo(gx, cutY + 10);
      ctx.lineTo(gx, height - 10);
      ctx.stroke();
    }
    for (let gy = cutY + 14; gy < height - 10; gy += 18) {
      ctx.beginPath();
      ctx.moveTo(cutX + 10, gy);
      ctx.lineTo(width - 10, gy);
      ctx.stroke();
    }
    ctx.fillStyle = '#FBBF24';
    for (let gx = cutX + 14; gx < width - 10; gx += 18) {
      for (let gy = cutY + 14; gy < height - 10; gy += 18) {
        ctx.fillRect(gx - 2, gy - 2, 4, 4);
      }
    }
  }
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const anisotropy = Math.max(1, Math.min(maxAnisotropy, 8));

  // 1. Standard 50x50 SMD wave artwork
  const smdCanvas = document.createElement('canvas');
  smdCanvas.width = 512;
  smdCanvas.height = 512;
  const smdCtx = smdCanvas.getContext('2d')!;
  drawPixiaWaveArtwork(smdCtx, 512, 512, 'square');
  const smdWaveTexture = new THREE.CanvasTexture(smdCanvas);
  smdWaveTexture.colorSpace = THREE.SRGBColorSpace;
  smdWaveTexture.anisotropy = anisotropy;

  // 2. Tall 50x100 SMD wave artwork
  const tallCanvas = document.createElement('canvas');
  tallCanvas.width = 512;
  tallCanvas.height = 1024;
  const tallCtx = tallCanvas.getContext('2d')!;
  drawPixiaWaveArtwork(tallCtx, 512, 1024, 'tall');
  const tallWaveTexture = new THREE.CanvasTexture(tallCanvas);
  tallWaveTexture.colorSpace = THREE.SRGBColorSpace;
  tallWaveTexture.anisotropy = anisotropy;

  // 3. Holographic translucent artwork
  const holoCanvas = document.createElement('canvas');
  holoCanvas.width = 512;
  holoCanvas.height = 512;
  const holoCtx = holoCanvas.getContext('2d')!;
  drawPixiaWaveArtwork(holoCtx, 512, 512, 'holo');
  const holographicTexture = new THREE.CanvasTexture(holoCanvas);
  holographicTexture.colorSpace = THREE.SRGBColorSpace;
  holographicTexture.anisotropy = anisotropy;

  // 4. Sample cutaway artwork
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 512;
  sampleCanvas.height = 512;
  const sampleCtx = sampleCanvas.getContext('2d')!;
  drawPixiaWaveArtwork(sampleCtx, 512, 512, 'sample');
  const sampleCutawayTexture = new THREE.CanvasTexture(sampleCanvas);
  sampleCutawayTexture.colorSpace = THREE.SRGBColorSpace;
  sampleCutawayTexture.anisotropy = anisotropy;

  // 5. Transparent louver LED bar strip texture
  const stripCanvas = document.createElement('canvas');
  stripCanvas.width = 512;
  stripCanvas.height = 64;
  const stripCtx = stripCanvas.getContext('2d')!;
  const stripGrad = stripCtx.createLinearGradient(0, 0, 512, 0);
  stripGrad.addColorStop(0, '#0F172A');
  stripGrad.addColorStop(0.35, '#1E3A5F');
  stripGrad.addColorStop(0.68, '#F59E0B');
  stripGrad.addColorStop(1, '#1E293B');
  stripCtx.fillStyle = stripGrad;
  stripCtx.fillRect(0, 0, 512, 64);
  stripCtx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let x = 8; x < 512; x += 12) {
    stripCtx.fillRect(x, 26, 4, 12);
  }
  const louverStripTexture = new THREE.CanvasTexture(stripCanvas);
  louverStripTexture.colorSpace = THREE.SRGBColorSpace;
  louverStripTexture.anisotropy = anisotropy;

  // 6. Brushed metal roughness map (grayscale, linear space)
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 256;
  metalCanvas.height = 256;
  const metalCtx = metalCanvas.getContext('2d')!;
  metalCtx.fillStyle = '#585858';
  metalCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const shade = 70 + ((y * 19) % 42);
    metalCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    metalCtx.fillRect(0, y, 256, 1);
  }
  const brushedMetalRoughness = new THREE.CanvasTexture(metalCanvas);
  brushedMetalRoughness.wrapS = THREE.RepeatWrapping;
  brushedMetalRoughness.wrapT = THREE.RepeatWrapping;
  brushedMetalRoughness.repeat.set(2, 2);

  // 7. Radial soft contact shadow for studio floor grounding
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const shadowCtx = shadowCanvas.getContext('2d')!;
  const shadowGrad = shadowCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.32)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shadowCtx.fillStyle = shadowGrad;
  shadowCtx.fillRect(0, 0, 256, 256);
  const contactShadowTexture = new THREE.CanvasTexture(shadowCanvas);

  return {
    smdWaveTexture,
    tallWaveTexture,
    holographicTexture,
    sampleCutawayTexture,
    louverStripTexture,
    brushedMetalRoughness,
    contactShadowTexture,
    dispose: () => {
      smdWaveTexture.dispose();
      tallWaveTexture.dispose();
      holographicTexture.dispose();
      sampleCutawayTexture.dispose();
      louverStripTexture.dispose();
      brushedMetalRoughness.dispose();
      contactShadowTexture.dispose();
    },
  };
}

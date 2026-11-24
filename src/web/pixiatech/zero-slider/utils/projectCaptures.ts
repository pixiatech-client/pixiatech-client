import type { FeaturedProject } from '../data/projects';

const captureCache = new Map<string, string[]>();

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  zoom = 1,
  panX = 0.5,
  panY = 0.5
) {
  const imgAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
  const dstAspect = dw / Math.max(1, dh);
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgAspect > dstAspect) {
    sw = img.naturalHeight * dstAspect;
  } else {
    sh = img.naturalWidth / dstAspect;
  }

  sw /= zoom;
  sh /= zoom;
  const sx = Math.max(0, Math.min(img.naturalWidth - sw, (img.naturalWidth - sw) * panX));
  const sy = Math.max(0, Math.min(img.naturalHeight - sh, (img.naturalHeight - sh) * panY));
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRectClip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
}

export async function generateProjectCaptures(project: FeaturedProject): Promise<string[]> {
  const cached = captureCache.get(project.slug);
  if (cached) return cached;

  const img = await loadImg(project.heroImage);
  const W = 1400;
  const H = 840;

  const makeCanvas = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return { c, ctx: c.getContext('2d')! };
  };

  // Capture 2: Editorial Interface & Market Showcase Frame
  const { c: c2, ctx: ctx2 } = makeCanvas();
  ctx2.fillStyle = '#0c0c0e';
  ctx2.fillRect(0, 0, W, H);
  ctx2.save();
  roundRectClip(ctx2, 44, 44, W - 88, H - 88, 22);
  drawCover(ctx2, img, 44, 44, W - 88, H - 88, 1.06, 0.5, 0.45);
  const grad2 = ctx2.createLinearGradient(0, 44, 0, H - 44);
  grad2.addColorStop(0, 'rgba(0,0,0,0.48)');
  grad2.addColorStop(0.5, 'rgba(0,0,0,0.14)');
  grad2.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx2.fillStyle = grad2;
  ctx2.fillRect(44, 44, W - 88, H - 88);

  ctx2.fillStyle = 'rgba(255,255,255,0.88)';
  ctx2.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx2.fillText(project.title.toUpperCase(), 88, 102);
  ctx2.fillStyle = 'rgba(255,255,255,0.68)';
  ctx2.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx2.fillText('PIXIATECH   /   MARCHÉS   /   SOLUTIONS LED', W - 410, 100);

  ctx2.fillStyle = '#ffffff';
  ctx2.font = 'italic 400 84px "Cormorant Garamond", Georgia, serif';
  ctx2.fillText(project.title, 88, H - 150);

  ctx2.fillStyle = 'rgba(255,255,255,0.78)';
  ctx2.font = '400 20px "Plus Jakarta Sans", sans-serif';
  ctx2.fillText(project.gallery[1]?.caption || project.description, 88, H - 96);
  ctx2.restore();

  // Capture 3: Macro Architectural / Detail Split
  const { c: c3, ctx: ctx3 } = makeCanvas();
  ctx3.fillStyle = '#f2efe9';
  ctx3.fillRect(0, 0, W, H);
  ctx3.fillStyle = '#141414';
  ctx3.font = 'italic 400 58px "Cormorant Garamond", Georgia, serif';
  ctx3.fillText('Conçu pour chaque', 72, 160);
  ctx3.fillText('environnement', 72, 228);
  ctx3.fillStyle = 'rgba(20,20,20,0.68)';
  ctx3.font = '400 22px "Plus Jakarta Sans", sans-serif';
  const words = project.description.split(' ');
  let line = '';
  let y = 310;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx3.measureText(test).width > 430) {
      ctx3.fillText(line, 72, y);
      line = w;
      y += 34;
    } else {
      line = test;
    }
  }
  if (line) ctx3.fillText(line, 72, y);

  ctx3.fillStyle = project.cardAccentHex;
  ctx3.beginPath();
  ctx3.arc(96, H - 110, 24, 0, Math.PI * 2);
  ctx3.fill();
  ctx3.fillStyle = '#141414';
  ctx3.beginPath();
  ctx3.arc(154, H - 110, 24, 0, Math.PI * 2);
  ctx3.fill();
  ctx3.fillStyle = 'rgba(20,20,20,0.58)';
  ctx3.font = '500 16px "Plus Jakarta Sans", sans-serif';
  ctx3.fillText(project.gallery[2]?.caption || 'AFFICHAGE LED SUR MESURE', 196, H - 104);

  ctx3.save();
  roundRectClip(ctx3, 560, 56, W - 616, H - 112, 20);
  drawCover(ctx3, img, 560, 56, W - 616, H - 112, 1.45, 0.35, 0.45);
  ctx3.restore();

  // Capture 4: Multi-Viewport Desktop + Mobile Device Composition
  const { c: c4, ctx: ctx4 } = makeCanvas();
  const bgGrad4 = ctx4.createLinearGradient(0, 0, W, H);
  bgGrad4.addColorStop(0, '#101012');
  bgGrad4.addColorStop(1, '#1c1c20');
  ctx4.fillStyle = bgGrad4;
  ctx4.fillRect(0, 0, W, H);

  ctx4.save();
  roundRectClip(ctx4, 68, 92, 860, 560, 18);
  drawCover(ctx4, img, 68, 92, 860, 560, 1.18, 0.65, 0.5);
  ctx4.fillStyle = 'rgba(0,0,0,0.24)';
  ctx4.fillRect(68, 92, 860, 560);
  ctx4.fillStyle = '#ffffff';
  ctx4.font = '500 28px "Plus Jakarta Sans", sans-serif';
  ctx4.fillText(`${project.title} — Pixiatech`, 104, 610);
  ctx4.restore();

  ctx4.fillStyle = '#070708';
  ctx4.beginPath();
  ctx4.roundRect(984, 72, 344, 696, 36);
  ctx4.fill();
  ctx4.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx4.lineWidth = 2;
  ctx4.stroke();

  ctx4.save();
  roundRectClip(ctx4, 1002, 92, 308, 656, 24);
  drawCover(ctx4, img, 1002, 92, 308, 656, 1.35, 0.52, 0.48);
  const mGrad = ctx4.createLinearGradient(0, 400, 0, 748);
  mGrad.addColorStop(0, 'rgba(0,0,0,0)');
  mGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx4.fillStyle = mGrad;
  ctx4.fillRect(1002, 92, 308, 656);
  ctx4.fillStyle = '#ffffff';
  ctx4.font = 'italic 400 32px "Cormorant Garamond", Georgia, serif';
  ctx4.fillText(project.title, 1024, 678);
  ctx4.fillStyle = 'rgba(255,255,255,0.68)';
  ctx4.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx4.fillText('PIXIATECH / TECHNOLOGIE LED', 1024, 710);
  ctx4.restore();

  ctx4.fillStyle = 'rgba(255,255,255,0.55)';
  ctx4.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx4.fillText(
    project.gallery[3]?.caption?.toUpperCase() || 'AFFICHAGE SUR MESURE  ·  GRAND FORMAT',
    68,
    724
  );

  const urls = [
    project.heroImage,
    c2.toDataURL('image/jpeg', 0.9),
    c3.toDataURL('image/jpeg', 0.9),
    c4.toDataURL('image/jpeg', 0.9),
  ];

  captureCache.set(project.slug, urls);
  return urls;
}

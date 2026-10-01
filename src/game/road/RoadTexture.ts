import * as THREE from 'three';

let cachedRoadTexture: THREE.CanvasTexture | null = null;

export function getRoadTexture(): THREE.CanvasTexture {
  if (cachedRoadTexture) return cachedRoadTexture;

  const width = 2048;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Base High-Definition Stone Mastic Asphalt
  ctx.fillStyle = '#1c1e22';
  ctx.fillRect(0, 0, width, height);

  // Procedural aggregate noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Mineral aggregate speckles
    const n = Math.random();
    let grain = (n - 0.5) * 22;
    if (n > 0.985) grain += 40; // light stone speck
    if (n < 0.015) grain -= 25; // dark bitumen pit

    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain * 0.95));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain * 0.9));
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Realistic Tire Wear Paths (two lanes, each lane has 2 wheel wear tracks)
  // Left lane wheel tracks: ~22% and ~38% across width
  // Right lane wheel tracks: ~62% and ~78% across width
  const wearTracks = [
    width * 0.22,
    width * 0.38,
    width * 0.62,
    width * 0.78,
  ];

  ctx.fillStyle = 'rgba(12, 13, 15, 0.45)';
  wearTracks.forEach((trackX) => {
    const trackWidth = width * 0.07;
    const grad = ctx.createLinearGradient(trackX - trackWidth * 0.5, 0, trackX + trackWidth * 0.5, 0);
    grad.addColorStop(0, 'rgba(15, 17, 20, 0)');
    grad.addColorStop(0.5, 'rgba(10, 11, 13, 0.35)');
    grad.addColorStop(1, 'rgba(15, 17, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(trackX - trackWidth * 0.5, 0, trackWidth, height);
  });

  // 3. Realistic Gravel / Shoulder Strips (left 11% and right 11%)
  const shoulderW = width * 0.11;
  const gradL = ctx.createLinearGradient(0, 0, shoulderW, 0);
  gradL.addColorStop(0, '#574d3f');
  gradL.addColorStop(0.4, '#483f34');
  gradL.addColorStop(0.8, '#322c24');
  gradL.addColorStop(1, '#1c1e22');
  ctx.fillStyle = gradL;
  ctx.fillRect(0, 0, shoulderW, height);

  const gradR = ctx.createLinearGradient(width - shoulderW, 0, width, 0);
  gradR.addColorStop(0, '#1c1e22');
  gradR.addColorStop(0.2, '#322c24');
  gradR.addColorStop(0.6, '#483f34');
  gradR.addColorStop(1, '#574d3f');
  ctx.fillStyle = gradR;
  ctx.fillRect(width - shoulderW, 0, shoulderW, height);

  // 4. Red & White Rumble Strip Curbing on Outer Shoulders
  const curbW = 28;
  const curbPeriod = 96;
  for (let y = 0; y < height; y += curbPeriod) {
    const isRed = Math.floor(y / (curbPeriod * 0.5)) % 2 === 0;
    ctx.fillStyle = isRed ? '#dc2626' : '#f8fafc';
    ctx.fillRect(shoulderW - curbW, y, curbW, curbPeriod * 0.5);
    ctx.fillRect(width - shoulderW, y, curbW, curbPeriod * 0.5);
  }

  // 5. Solid White Highway Outer Edge Lines (Retroreflective with subtle road wear)
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  ctx.shadowBlur = 4;
  const leftEdgeX = shoulderW + 12;
  const rightEdgeX = width - shoulderW - 32;
  const lineWidth = 20;

  ctx.fillRect(leftEdgeX, 0, lineWidth, height);
  ctx.fillRect(rightEdgeX, 0, lineWidth, height);
  ctx.shadowBlur = 0;

  // 6. Dashed Center Line (Warm Highway Yellow with Retroreflective Beads)
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = 'rgba(254, 240, 138, 0.5)';
  ctx.shadowBlur = 6;
  const centerX = width / 2 - 10;
  const dashLength = 260;
  const gapLength = 260;
  const period = dashLength + gapLength;

  for (let y = 0; y < height; y += period) {
    ctx.fillRect(centerX, y, 20, dashLength);
  }
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16; // Maximum sharp texture filtering at glancing angles
  texture.generateMipmaps = true;

  cachedRoadTexture = texture;
  return cachedRoadTexture;
}

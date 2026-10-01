import * as THREE from 'three';

export class DigitalClusterDisplay {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;
  private width = 1024;
  private height = 512;
  private updateTimer = 0;
  private lastDrawnSpeed = -1;
  private lastDrawnRpm = -1;
  private lastDrawnGear = -1;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d')!;

    this.render(0, 1000, 1, false);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
  }

  public update(speedKmh: number, rpm: number, gear: number, isBraking: boolean, dt: number) {
    this.updateTimer += dt;
    // Update display at ~30 FPS to ensure smooth fluid needle/gauge animation with zero lag
    if (this.updateTimer >= 0.033) {
      this.updateTimer = 0;
      const speedRound = Math.round(Math.abs(speedKmh));
      const rpmRound = Math.round(rpm / 50) * 50;

      if (
        speedRound !== this.lastDrawnSpeed ||
        Math.abs(rpmRound - this.lastDrawnRpm) > 40 ||
        gear !== this.lastDrawnGear ||
        isBraking
      ) {
        this.lastDrawnSpeed = speedRound;
        this.lastDrawnRpm = rpmRound;
        this.lastDrawnGear = gear;
        this.render(speedRound, rpm, gear, isBraking);
        this.texture.needsUpdate = true;
      }
    }
  }

  private render(speed: number, rpm: number, gear: number, isBraking: boolean) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. OLED Deep Dark Tech Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    // Subtle carbon fiber weave pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let y = 0; y < h; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : 8); x < w; x += 16) {
        ctx.fillRect(x, y, 8, 8);
      }
    }

    // Outer cybernetic bezel glow
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    const centerY = h * 0.54;
    const radius = 175;

    // ==========================================
    // 2. LEFT DIAL: DYNAMIC TACHOMETER (RPM x1000)
    // ==========================================
    const leftX = w * 0.24;

    // Gauge track backplate
    ctx.beginPath();
    ctx.arc(leftX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Redline zone (6500 to 8000 RPM)
    ctx.beginPath();
    ctx.arc(leftX, centerY, radius, Math.PI * 1.88, Math.PI * 2.25);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 18;
    ctx.stroke();

    // Active RPM sweep arc
    const clampedRpm = Math.max(900, Math.min(8000, rpm));
    const rpmFrac = (clampedRpm - 900) / (7200 - 900);
    const rpmAngle = Math.PI * 0.75 + rpmFrac * (Math.PI * 1.5);

    const rpmGrad = ctx.createLinearGradient(leftX - radius, centerY, leftX + radius, centerY);
    rpmGrad.addColorStop(0, '#38bdf8');
    rpmGrad.addColorStop(0.65, '#06b6d4');
    rpmGrad.addColorStop(0.85, '#f59e0b');
    rpmGrad.addColorStop(1.0, '#ef4444');

    ctx.beginPath();
    ctx.arc(leftX, centerY, radius, Math.PI * 0.75, rpmAngle);
    ctx.strokeStyle = rpmGrad;
    ctx.lineWidth = 18;
    ctx.stroke();

    // Digital RPM Readout
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Outfit", sans-serif, monospace';
    ctx.textAlign = 'center';
    const rpmNum = (clampedRpm / 1000).toFixed(1);
    ctx.fillText(rpmNum, leftX, centerY - 6);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('RPM x 1000', leftX, centerY + 28);

    // ==========================================
    // 3. CENTER CLUSTER: DIGITAL SPEEDOMETER & GEAR
    // ==========================================
    const midX = w * 0.5;

    // Glowing speed digits
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 115px "Outfit", sans-serif, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${speed}`, midX, centerY + 18);

    // KM/H unit badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('KM / H', midX, centerY + 62);

    // Dynamic Gear Indicator Badge
    const gearBoxW = 90;
    const gearBoxH = 46;
    const gearBoxY = centerY + 82;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(midX - gearBoxW / 2, gearBoxY, gearBoxW, gearBoxH);
    ctx.strokeStyle = isBraking ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(midX - gearBoxW / 2, gearBoxY, gearBoxW, gearBoxH);

    ctx.fillStyle = isBraking ? '#ef4444' : '#ffffff';
    ctx.font = 'bold 30px "Outfit", sans-serif';
    const gearText = speed === 0 ? 'P' : `D ${gear}`;
    ctx.fillText(gearText, midX, gearBoxY + 34);

    // ==========================================
    // 4. RIGHT DIAL: POWER / BRAKE & EFFICIENCY
    // ==========================================
    const rightX = w * 0.76;

    // Gauge track backplate
    ctx.beginPath();
    ctx.arc(rightX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Active power arc (responsive to speed and throttle)
    const powerFrac = Math.min(1.0, speed / 180);
    const powerAngle = Math.PI * 0.75 + powerFrac * (Math.PI * 1.5);

    ctx.beginPath();
    ctx.arc(rightX, centerY, radius, Math.PI * 0.75, powerAngle);
    ctx.strokeStyle = isBraking ? '#ef4444' : '#10b981';
    ctx.lineWidth = 18;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Outfit", sans-serif, monospace';
    ctx.fillText(`${Math.round(powerFrac * 100)}%`, rightX, centerY - 6);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(isBraking ? 'BRAKING' : 'POWER', rightX, centerY + 28);

    // ==========================================
    // 5. TOP STATUS BAR (Clock, Drive Mode, ESP)
    // ==========================================
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ SCENIC DRIVE • LANE ASSIST ON', 36, 46);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('SPORT PLUS • TRACTION ACTIVE', w - 36, 46);

    // Subtle bottom divider
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h - 35);
    ctx.lineTo(w * 0.8, h - 35);
    ctx.stroke();
  }

  public dispose() {
    this.texture.dispose();
  }
}

let cachedNavTexture: THREE.CanvasTexture | null = null;

export function getNavScreenTexture(): THREE.CanvasTexture {
  if (cachedNavTexture) return cachedNavTexture;

  const width = 800;
  const height = 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Dark navigation map theme
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Topographic grid lines
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
  ctx.lineWidth = 2;
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Glowing winding route line
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height);
  ctx.bezierCurveTo(width * 0.42, height * 0.65, width * 0.62, height * 0.35, width * 0.5, 0);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Car position GPS marker
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.72, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Top header bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, 0, width, 55);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('COASTAL HIGHWAY 1', 25, 36);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('ENDLESS HORIZON', width - 25, 36);

  // Bottom music media bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, height - 60, width, 60);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('▶ RADIO: SCENIC AMBIENT CHILLWAVE', 25, height - 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedNavTexture = texture;
  return cachedNavTexture;
}

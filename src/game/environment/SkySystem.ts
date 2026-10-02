import * as THREE from 'three';
import { TimeOfDay } from '../../types/game';

interface SkyPalette {
  topColor: string;
  horizonColor: string;
  bottomColor: string;
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  sunElevation: number; // in radians
  fogColor: string;
}

const PALETTES: Record<TimeOfDay, SkyPalette> = {
  DAWN: {
    topColor: '#4a8cb8', // soft morning atmospheric blue
    horizonColor: '#fcd5b8', // gentle sunrise apricot mist
    bottomColor: '#e8eff5',
    sunColor: '#fff2d6', // soft warm dawn sunlight
    sunIntensity: 2.5,
    ambientColor: '#f5e6d3',
    ambientIntensity: 1.25,
    sunElevation: 0.28,
    fogColor: '#faeade',
  },
  DAY: {
    topColor: '#3a7ca5', // authentic atmospheric Rayleigh scattering sky blue
    horizonColor: '#cde1ed', // soft natural horizon haze
    bottomColor: '#e2ecf2',
    sunColor: '#fff9ee', // warm natural daylight (~5500K)
    sunIntensity: 2.85,
    ambientColor: '#eef5fb',
    ambientIntensity: 1.4,
    sunElevation: 1.15,
    fogColor: '#d9e9f2',
  },
  SUNSET: {
    topColor: '#444a78', // dusty twilight indigo
    horizonColor: '#f59e0b', // warm glowing golden hour horizon
    bottomColor: '#fef3c7',
    sunColor: '#fbbf24', // soft golden sunset orb
    sunIntensity: 2.4,
    ambientColor: '#fed7aa',
    ambientIntensity: 1.2,
    sunElevation: 0.22,
    fogColor: '#fde2c7',
  },
  NIGHT: {
    topColor: '#0f172a', // midnight navy with gentle starlight
    horizonColor: '#1e293b',
    bottomColor: '#0f172a',
    sunColor: '#cbd5e1', // soft silver moonlight
    sunIntensity: 1.6,
    ambientColor: '#94a3b8',
    ambientIntensity: 1.05,
    sunElevation: 0.95,
    fogColor: '#182334',
  },
};

export class SkySystem {
  public group: THREE.Group;
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  private skyMesh: THREE.Mesh;
  private starsPoints: THREE.Points;
  private skyShaderMat: THREE.ShaderMaterial;
  private currentTime: TimeOfDay = 'DAY';
  private timeCycleProgress: number = 0.25; // 0=dawn, 0.25=day, 0.5=sunset, 0.75=night
  private isDynamic: boolean = false;
  private elapsedSeconds = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    // Directional Sun / Moon
    this.sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 350;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0003;
    this.group.add(this.sunLight);

    // Ambient and Hemisphere Lighting for luminous clarity & soft shadows
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    this.group.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xa1a1aa, 0.85);
    this.group.add(this.hemiLight);

    // Advanced Atmospheric Scattering & Sun Glare Shader
    const skyGeo = new THREE.SphereGeometry(1400, 36, 28);
    this.skyShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(PALETTES.DAY.topColor) },
        horizonColor: { value: new THREE.Color(PALETTES.DAY.horizonColor) },
        bottomColor: { value: new THREE.Color(PALETTES.DAY.bottomColor) },
        sunPosition: { value: new THREE.Vector3(0, 1, 0) },
        sunColor: { value: new THREE.Color(PALETTES.DAY.sunColor) },
        time: { value: 0 },
        offset: { value: 40.0 },
        exponent: { value: 0.5 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        uniform vec3 sunPosition;
        uniform vec3 sunColor;
        uniform float time;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        // Simple 3D hash noise for clouds
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                     mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }

        void main() {
          vec3 dir = normalize(vWorldPosition + vec3(0.0, offset, 0.0));
          float h = dir.y;

          // Atmospheric horizon gradient
          vec3 skyBase;
          if (h > 0.0) {
            skyBase = mix(horizonColor, topColor, max(pow(h, exponent), 0.0));
          } else {
            skyBase = mix(horizonColor, bottomColor, max(pow(-h, exponent), 0.0));
          }

          // Sun Disk and Corona Mie Glare
          vec3 sunDir = normalize(sunPosition);
          float sunDot = max(0.0, dot(normalize(vWorldPosition), sunDir));

          // Sharp Sun Disk
          float sunDisk = smoothstep(0.9992, 0.9998, sunDot);
          // Soft atmospheric corona glow
          float sunCorona = pow(sunDot, 12.0) * 0.45 + pow(sunDot, 64.0) * 0.8;

          vec3 finalColor = skyBase + sunColor * (sunDisk * 2.5 + sunCorona);

          // Gentle drifting atmospheric clouds
          if (h > 0.08) {
            vec2 cloudUV = dir.xz / (dir.y + 0.12) * 0.8 + vec2(time * 0.006, time * 0.003);
            float c1 = noise(cloudUV * 4.0);
            float c2 = noise(cloudUV * 8.0);
            float cloudMask = smoothstep(0.52, 0.72, c1 * 0.7 + c2 * 0.3) * smoothstep(0.08, 0.25, h);
            vec3 cloudColor = mix(horizonColor * 1.2, vec3(1.0), 0.7) + sunColor * sunCorona * 0.5;
            finalColor = mix(finalColor, cloudColor, cloudMask * 0.55);
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.skyMesh = new THREE.Mesh(skyGeo, this.skyShaderMat);
    this.group.add(this.skyMesh);

    // Stars at night
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1250;
      const sinPhi = Math.sin(phi);
      starPositions[i * 3] = r * sinPhi * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 60; // upper hemisphere
      starPositions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.8,
      transparent: true,
      opacity: 0,
    });
    this.starsPoints = new THREE.Points(starGeo, starMat);
    this.group.add(this.starsPoints);

    scene.add(this.group);
  }

  public setTimeSetting(timeSetting: 'DYNAMIC' | TimeOfDay) {
    this.isDynamic = false;
    const finalTime: TimeOfDay = (timeSetting === 'DYNAMIC' || !timeSetting) ? 'DAY' : timeSetting;
    this.currentTime = finalTime;
    const progressMap: Record<TimeOfDay, number> = {
      DAWN: 0.05,
      DAY: 0.25,
      SUNSET: 0.5,
      NIGHT: 0.75,
    };
    this.timeCycleProgress = progressMap[finalTime] ?? 0.25;
    this.applyPalette(PALETTES[finalTime], 1.0);
  }

  public update(dt: number, playerPos: THREE.Vector3, scene: THREE.Scene) {
    this.elapsedSeconds += dt;
    this.skyShaderMat.uniforms.time.value = this.elapsedSeconds;

    // Keep sky centered around player
    this.group.position.copy(playerPos);

    if (this.isDynamic) {
      // Dynamic cycle: 1 full day/night cycle every ~300 seconds (5 min)
      this.timeCycleProgress = (this.timeCycleProgress + dt / 300) % 1.0;

      let pA: SkyPalette;
      let pB: SkyPalette;
      let alpha: number;

      if (this.timeCycleProgress < 0.25) {
        // Dawn -> Day
        this.currentTime = this.timeCycleProgress < 0.12 ? 'DAWN' : 'DAY';
        pA = PALETTES.DAWN;
        pB = PALETTES.DAY;
        alpha = this.timeCycleProgress / 0.25;
      } else if (this.timeCycleProgress < 0.5) {
        // Day -> Sunset
        this.currentTime = this.timeCycleProgress < 0.4 ? 'DAY' : 'SUNSET';
        pA = PALETTES.DAY;
        pB = PALETTES.SUNSET;
        alpha = (this.timeCycleProgress - 0.25) / 0.25;
      } else if (this.timeCycleProgress < 0.75) {
        // Sunset -> Night
        this.currentTime = this.timeCycleProgress < 0.6 ? 'SUNSET' : 'NIGHT';
        pA = PALETTES.SUNSET;
        pB = PALETTES.NIGHT;
        alpha = (this.timeCycleProgress - 0.5) / 0.25;
      } else {
        // Night -> Dawn
        this.currentTime = this.timeCycleProgress < 0.9 ? 'NIGHT' : 'DAWN';
        pA = PALETTES.NIGHT;
        pB = PALETTES.DAWN;
        alpha = (this.timeCycleProgress - 0.75) / 0.25;
      }

      this.interpolatePalettes(pA, pB, alpha, scene);
    }

    // Position sun light and uniform relative to player
    const palette = PALETTES[this.currentTime];
    const sunAngle = this.timeCycleProgress * Math.PI * 2;
    const sunPos = new THREE.Vector3(
      Math.cos(sunAngle) * 200,
      Math.max(25, Math.sin(palette.sunElevation) * 220),
      Math.sin(sunAngle) * 200
    );

    this.skyShaderMat.uniforms.sunPosition.value.copy(sunPos);

    this.sunLight.position.set(
      playerPos.x + sunPos.x,
      playerPos.y + sunPos.y,
      playerPos.z + sunPos.z
    );
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();
  }

  private interpolatePalettes(pA: SkyPalette, pB: SkyPalette, alpha: number, scene: THREE.Scene) {
    const topA = new THREE.Color(pA.topColor);
    const topB = new THREE.Color(pB.topColor);
    const top = topA.lerp(topB, alpha);

    const horA = new THREE.Color(pA.horizonColor);
    const horB = new THREE.Color(pB.horizonColor);
    const hor = horA.lerp(horB, alpha);

    const botA = new THREE.Color(pA.bottomColor);
    const botB = new THREE.Color(pB.bottomColor);
    const bot = botA.lerp(botB, alpha);

    this.skyShaderMat.uniforms.topColor.value.copy(top);
    this.skyShaderMat.uniforms.horizonColor.value.copy(hor);
    this.skyShaderMat.uniforms.bottomColor.value.copy(bot);

    // Sun light & color
    const sunColA = new THREE.Color(pA.sunColor);
    const sunColB = new THREE.Color(pB.sunColor);
    const sunCol = sunColA.lerp(sunColB, alpha);
    this.sunLight.color.copy(sunCol);
    this.skyShaderMat.uniforms.sunColor.value.copy(sunCol);
    this.sunLight.intensity = THREE.MathUtils.lerp(pA.sunIntensity, pB.sunIntensity, alpha);

    // Ambient light
    const ambColA = new THREE.Color(pA.ambientColor);
    const ambColB = new THREE.Color(pB.ambientColor);
    this.ambientLight.color.copy(ambColA.lerp(ambColB, alpha));
    this.ambientLight.intensity = THREE.MathUtils.lerp(pA.ambientIntensity, pB.ambientIntensity, alpha);

    // Scene fog color
    if (scene.fog instanceof THREE.FogExp2) {
      const fogColA = new THREE.Color(pA.fogColor);
      const fogColB = new THREE.Color(pB.fogColor);
      scene.fog.color.copy(fogColA.lerp(fogColB, alpha));
    }

    // Stars visibility at night
    const starOpacity = this.currentTime === 'NIGHT' ? 0.95 : (this.currentTime === 'SUNSET' ? 0.2 : 0.0);
    (this.starsPoints.material as THREE.PointsMaterial).opacity = starOpacity;
  }

  private applyPalette(p: SkyPalette, _alpha: number) {
    this.skyShaderMat.uniforms.topColor.value.set(p.topColor);
    this.skyShaderMat.uniforms.horizonColor.value.set(p.horizonColor);
    this.skyShaderMat.uniforms.bottomColor.value.set(p.bottomColor);
    this.skyShaderMat.uniforms.sunColor.value.set(p.sunColor);
    this.sunLight.color.set(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;
    this.ambientLight.color.set(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;
    (this.starsPoints.material as THREE.PointsMaterial).opacity = this.currentTime === 'NIGHT' ? 0.95 : 0.0;
  }

  public getCurrentTime(): TimeOfDay {
    return this.currentTime;
  }

  public isNight(): boolean {
    return this.currentTime === 'NIGHT' || this.currentTime === 'SUNSET';
  }
}

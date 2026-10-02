import * as THREE from 'three';
import { WeatherType } from '../../types/game';

export class WeatherSystem {
  public group: THREE.Group;
  private rainParticles: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private rainCount = 2500;
  private currentWeather: WeatherType = 'CLEAR';
  private targetWeather: WeatherType = 'CLEAR';
  private isDynamic: boolean = true;
  private weatherTimer = 0;
  private fogDensity = 0.0008;
  private targetFogDensity = 0.0008;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Initialize bright, airy, long-distance scene fog
    scene.fog = new THREE.FogExp2(0xe0f2fe, this.fogDensity);

    this.initRain();
  }

  private initRain() {
    this.rainPositions = new Float32Array(this.rainCount * 3);
    const boxSize = 80;

    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * boxSize;
      this.rainPositions[i * 3 + 1] = Math.random() * 40;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * boxSize;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 0.35,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.group.add(this.rainParticles);
  }

  public setWeatherSetting(setting: 'DYNAMIC' | WeatherType) {
    this.isDynamic = false;
    const finalWeather: WeatherType = setting === 'DYNAMIC' ? 'CLEAR' : setting;
    this.targetWeather = finalWeather;
    this.currentWeather = finalWeather;
  }

  public update(dt: number, playerPos: THREE.Vector3, scene: THREE.Scene) {
    // Keep weather particles centered around player
    this.group.position.set(playerPos.x, playerPos.y, playerPos.z);

    // Weather is strictly locked to the selected condition - no automatic changing while driving forward

    // Fog Density target - light and clear for maximum visibility
    if (this.currentWeather === 'FOG') {
      this.targetFogDensity = 0.0024;
    } else if (this.currentWeather === 'RAIN') {
      this.targetFogDensity = 0.0015;
    } else if (this.currentWeather === 'CLOUDY') {
      this.targetFogDensity = 0.0011;
    } else {
      this.targetFogDensity = 0.00075;
    }

    this.fogDensity = THREE.MathUtils.lerp(this.fogDensity, this.targetFogDensity, dt * 0.5);
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = this.fogDensity;
    }

    // Rain particles update
    if (this.rainParticles && this.rainPositions) {
      const isRaining = this.currentWeather === 'RAIN';
      const rainMat = this.rainParticles.material as THREE.PointsMaterial;
      const targetOpacity = isRaining ? 0.75 : 0.0;
      rainMat.opacity = THREE.MathUtils.lerp(rainMat.opacity, targetOpacity, dt * 2.0);

      if (rainMat.opacity > 0.01) {
        const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
        const fallSpeed = 38 * dt;

        for (let i = 0; i < this.rainCount; i++) {
          positions[i * 3 + 1] -= fallSpeed;
          // Loop back up
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 40;
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
          }
        }
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  public getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }
}

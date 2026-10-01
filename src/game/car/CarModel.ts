import * as THREE from 'three';
import { CarConfig } from '../../types/game';
import { DigitalClusterDisplay, getNavScreenTexture } from './CockpitTextures';
import { CarPhysics } from './CarPhysics';

export class CarModel {
  public group: THREE.Group;
  public wheels: THREE.Mesh[] = [];
  public frontWheels: THREE.Mesh[] = [];
  public headlights: THREE.SpotLight[] = [];
  public headlightMesh: THREE.Mesh | null = null;
  public taillightMesh: THREE.Mesh | null = null;
  public bodyMesh: THREE.Group;
  public steeringWheelGroup: THREE.Group | null = null;
  public steeringWheelRotator: THREE.Group | null = null;
  public clusterDisplay: DigitalClusterDisplay;

  // Dedicated Cockpit camera anchor points
  public cockpitCameraMount: THREE.Object3D;
  public cockpitCameraTarget: THREE.Object3D;

  private headlightMat: THREE.MeshStandardMaterial;
  private taillightMat: THREE.MeshStandardMaterial;

  constructor(config: CarConfig) {
    this.clusterDisplay = new DigitalClusterDisplay();
    this.group = new THREE.Group();
    this.bodyMesh = new THREE.Group();
    this.group.add(this.bodyMesh);

    // Camera anchor mounts attached directly inside bodyMesh
    this.cockpitCameraMount = new THREE.Object3D();
    this.cockpitCameraTarget = new THREE.Object3D();
    this.bodyMesh.add(this.cockpitCameraMount);
    this.bodyMesh.add(this.cockpitCameraTarget);

    // Common materials with realistic automotive PBR properties
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.bodyColor),
      metalness: 0.85,
      roughness: 0.16,
    });
    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.8,
      roughness: 0.25,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.08,
    });
    const interiorLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.6,
      metalness: 0.15,
    });
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.1,
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      metalness: 0.1,
      roughness: 0.02,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 1.0,
      roughness: 0.05,
      metalness: 0.5,
    });

    this.taillightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });

    this.buildBody(config, bodyMat, darkTrimMat, chromeMat, windowMat, interiorLeatherMat, seatMat);
    this.buildWheels(config);
    this.buildLighting(config);
  }

  private buildBody(
    config: CarConfig,
    bodyMat: THREE.Material,
    trimMat: THREE.Material,
    chromeMat: THREE.Material,
    windowMat: THREE.Material,
    interiorMat: THREE.Material,
    seatMat: THREE.Material
  ) {
    const l = config.length;
    const w = config.width;
    const h = config.height;

    // 1. Lower Chassis / Floor
    const floorGeo = new THREE.BoxGeometry(w * 0.95, h * 0.22, l);
    const floor = new THREE.Mesh(floorGeo, bodyMat);
    floor.position.y = config.wheelRadius + h * 0.12;
    floor.castShadow = true;
    floor.receiveShadow = true;
    this.bodyMesh.add(floor);

    // 2. Front Hood / Nose (visible from inside cockpit!)
    const hoodL = l * 0.32;
    const hoodGeo = new THREE.BoxGeometry(w * 0.92, h * 0.22, hoodL);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, config.wheelRadius + h * 0.28, l * 0.34);
    hood.rotation.x = 0.04;
    hood.castShadow = true;
    this.bodyMesh.add(hood);

    // Center hood power bulge / crease line
    const bulgeGeo = new THREE.BoxGeometry(w * 0.35, 0.04, hoodL * 0.85);
    const bulge = new THREE.Mesh(bulgeGeo, bodyMat);
    bulge.position.set(0, config.wheelRadius + h * 0.4, l * 0.34);
    this.bodyMesh.add(bulge);

    // Windshield wipers resting at bottom of windshield
    const wiperGeo = new THREE.BoxGeometry(0.5, 0.02, 0.02);
    const wiperL = new THREE.Mesh(wiperGeo, trimMat);
    wiperL.position.set(0.32, config.wheelRadius + h * 0.42, l * 0.18);
    wiperL.rotation.y = 0.15;
    this.bodyMesh.add(wiperL);

    const wiperR = new THREE.Mesh(wiperGeo, trimMat);
    wiperR.position.set(-0.25, config.wheelRadius + h * 0.42, l * 0.18);
    wiperR.rotation.y = 0.15;
    this.bodyMesh.add(wiperR);

    // 3. Cabin Dimensions
    const cabinL = config.id === 'compact' ? l * 0.52 : (config.id === 'sedan' ? l * 0.56 : l * 0.46);
    const cabinH = h * 0.48;
    const cabinW = w * 0.84;
    const cabinOffsetZ = config.id === 'compact' ? -l * 0.05 : (config.id === 'sport' ? -l * 0.1 : 0);
    const cabinBaseY = config.wheelRadius + h * 0.22;

    // 4. Roof Panel
    const roofGeo = new THREE.BoxGeometry(cabinW * 0.9, 0.06, cabinL * 0.75);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, cabinBaseY + cabinH, cabinOffsetZ - cabinL * 0.05);
    roof.castShadow = true;
    this.bodyMesh.add(roof);

    // 5. A-Pillars (Windshield frame)
    const pillarGeo = new THREE.BoxGeometry(0.08, cabinH * 1.05, 0.08);
    const pillarL = new THREE.Mesh(pillarGeo, bodyMat);
    pillarL.position.set(-cabinW * 0.45, cabinBaseY + cabinH * 0.5, cabinOffsetZ + cabinL * 0.35);
    pillarL.rotation.x = -0.35;
    pillarL.rotation.z = -0.05;
    this.bodyMesh.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, bodyMat);
    pillarR.position.set(cabinW * 0.45, cabinBaseY + cabinH * 0.5, cabinOffsetZ + cabinL * 0.35);
    pillarR.rotation.x = -0.35;
    pillarR.rotation.z = 0.05;
    this.bodyMesh.add(pillarR);

    // Sun Visors on ceiling
    const visorGeo = new THREE.BoxGeometry(0.38, 0.02, 0.14);
    const visorL = new THREE.Mesh(visorGeo, interiorMat);
    visorL.position.set(0.35, cabinBaseY + cabinH - 0.05, cabinOffsetZ + cabinL * 0.22);
    this.bodyMesh.add(visorL);

    const visorR = new THREE.Mesh(visorGeo, interiorMat);
    visorR.position.set(-0.35, cabinBaseY + cabinH - 0.05, cabinOffsetZ + cabinL * 0.22);
    this.bodyMesh.add(visorR);

    // 6. Windshield (Crystal clear with double-sided rendering)
    const frontWindshieldGeo = new THREE.PlaneGeometry(cabinW * 0.88, cabinH * 0.92);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, windowMat);
    frontWindshield.position.set(0, cabinBaseY + cabinH * 0.52, cabinOffsetZ + cabinL * 0.36);
    frontWindshield.rotation.x = -0.35;
    this.bodyMesh.add(frontWindshield);

    // 7. Side Doors / Lower Sides
    const doorGeo = new THREE.BoxGeometry(0.08, cabinH * 0.45, cabinL * 0.95);
    const doorL = new THREE.Mesh(doorGeo, bodyMat);
    doorL.position.set(-cabinW * 0.48, cabinBaseY + cabinH * 0.22, cabinOffsetZ);
    this.bodyMesh.add(doorL);

    const doorR = new THREE.Mesh(doorGeo, bodyMat);
    doorR.position.set(cabinW * 0.48, cabinBaseY + cabinH * 0.22, cabinOffsetZ);
    this.bodyMesh.add(doorR);

    // ==========================================
    // ADVANCED REALISTIC INTERIOR COCKPIT SYSTEM
    // ==========================================
    // In our coordinate system looking towards +Z:
    // Left on screen is POSITIVE X (+0.35m)!
    // Driver sits at: DRIVER_X = 0.35 (in line with steering wheel and gauge cluster!)
    const DRIVER_X = 0.35;
    const PASSENGER_X = -0.35;

    const dashZ = cabinOffsetZ + cabinL * 0.28;
    const dashY = cabinBaseY + cabinH * 0.36;

    // 1. Sculpted Dashboard Main Body
    const dashGeo = new THREE.BoxGeometry(cabinW * 0.92, 0.28, 0.55);
    const dashboard = new THREE.Mesh(dashGeo, interiorMat);
    dashboard.position.set(0, dashY, dashZ);
    this.bodyMesh.add(dashboard);

    // Brushed metal trim line across dashboard
    const trimStripGeo = new THREE.BoxGeometry(cabinW * 0.90, 0.03, 0.04);
    const trimStrip = new THREE.Mesh(trimStripGeo, chromeMat);
    trimStrip.position.set(0, dashY - 0.05, dashZ - 0.28);
    this.bodyMesh.add(trimStrip);

    // Left and Right Air Conditioning Vents with Chrome Louvers
    const sideVentGeo = new THREE.BoxGeometry(0.09, 0.06, 0.03);
    const ventL = new THREE.Mesh(sideVentGeo, chromeMat);
    ventL.position.set(cabinW * 0.40, dashY + 0.06, dashZ - 0.27);
    this.bodyMesh.add(ventL);

    const ventR = new THREE.Mesh(sideVentGeo, chromeMat);
    ventR.position.set(-cabinW * 0.40, dashY + 0.06, dashZ - 0.27);
    this.bodyMesh.add(ventR);

    // Center Dual Air Vents
    const centerVentGeo = new THREE.BoxGeometry(0.14, 0.05, 0.03);
    const centerVent = new THREE.Mesh(centerVentGeo, chromeMat);
    centerVent.position.set(0.04, dashY + 0.17, dashZ - 0.26);
    this.bodyMesh.add(centerVent);

    // 2. Instrument Binnacle (Sculpted hood over digital cluster)
    const binnacleGeo = new THREE.BoxGeometry(0.44, 0.16, 0.26);
    const binnacle = new THREE.Mesh(binnacleGeo, interiorMat);
    binnacle.position.set(DRIVER_X, dashY + 0.15, dashZ - 0.13);
    binnacle.rotation.x = -0.12;
    this.bodyMesh.add(binnacle);

    // High-Resolution OLED Digital Gauge Cluster Screen
    // Rotated 180 deg around Y so the front face faces the driver!
    const clusterGeo = new THREE.PlaneGeometry(0.38, 0.19);
    clusterGeo.rotateY(Math.PI);
    const clusterMat = new THREE.MeshStandardMaterial({
      map: this.clusterDisplay.texture,
      emissive: 0xffffff,
      emissiveMap: this.clusterDisplay.texture,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    const cluster = new THREE.Mesh(clusterGeo, clusterMat);
    cluster.position.set(DRIVER_X, dashY + 0.13, dashZ - 0.23);
    cluster.rotation.x = 0.20; // Positive rotation tilts top back, facing UP towards driver eyes
    this.bodyMesh.add(cluster);

    // 3. Center Console & Infotainment GPS Touchscreen
    const navGeo = new THREE.PlaneGeometry(0.34, 0.20);
    navGeo.rotateY(Math.PI);
    const navMat = new THREE.MeshStandardMaterial({
      map: getNavScreenTexture(),
      emissive: 0xffffff,
      emissiveMap: getNavScreenTexture(),
      emissiveIntensity: 1.2,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    const navScreen = new THREE.Mesh(navGeo, navMat);
    navScreen.position.set(0.04, dashY + 0.06, dashZ - 0.25);
    navScreen.rotation.x = 0.16;
    navScreen.rotation.y = 0.10; // Angled slightly towards the driver
    this.bodyMesh.add(navScreen);

    // Start/Stop Engine Push-button with glowing red ring
    const startBtnGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
    startBtnGeo.rotateX(Math.PI / 2);
    const startBtnMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
    });
    const startBtn = new THREE.Mesh(startBtnGeo, startBtnMat);
    startBtn.position.set(0.22, dashY - 0.04, dashZ - 0.27);
    this.bodyMesh.add(startBtn);

    // 4. Center Transmission Tunnel & Gear Shifter
    const tunnelGeo = new THREE.BoxGeometry(0.24, 0.25, 0.75);
    const tunnel = new THREE.Mesh(tunnelGeo, interiorMat);
    tunnel.position.set(0, cabinBaseY + 0.12, dashZ - 0.48);
    this.bodyMesh.add(tunnel);

    // Gear Shifter Boot & Polished Chrome Knob
    const shiftBootGeo = new THREE.ConeGeometry(0.06, 0.08, 8);
    const shiftBoot = new THREE.Mesh(shiftBootGeo, interiorMat);
    shiftBoot.position.set(0, cabinBaseY + 0.26, dashZ - 0.40);
    this.bodyMesh.add(shiftBoot);

    const shiftKnobGeo = new THREE.SphereGeometry(0.032, 12, 12);
    const shiftKnob = new THREE.Mesh(shiftKnobGeo, chromeMat);
    shiftKnob.position.set(0, cabinBaseY + 0.32, dashZ - 0.40);
    this.bodyMesh.add(shiftKnob);

    // Twin Cup Holders
    const cupHolderGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.06, 12);
    const cup1 = new THREE.Mesh(cupHolderGeo, trimMat);
    cup1.position.set(0, cabinBaseY + 0.22, dashZ - 0.58);
    this.bodyMesh.add(cup1);
    const cup2 = new THREE.Mesh(cupHolderGeo, trimMat);
    cup2.position.set(0, cabinBaseY + 0.22, dashZ - 0.68);
    this.bodyMesh.add(cup2);

    // ========================================================
    // 5. ADVANCED GT SPORTS STEERING WHEEL ASSEMBLY
    // ========================================================
    const steeringGroup = new THREE.Group();
    const wheelZ = dashZ - 0.38;
    const wheelY = dashY + 0.07;
    steeringGroup.position.set(DRIVER_X, wheelY, wheelZ);
    steeringGroup.rotation.x = 0.26; // Tilted naturally towards driver hands!

    // Fixed Steering Column (Does not rotate with steering)
    const colGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.22, 12);
    colGeo.rotateX(Math.PI / 2);
    const col = new THREE.Mesh(colGeo, trimMat);
    col.position.z = 0.11;
    steeringGroup.add(col);

    // Column Control Stalks (Turn signals on left, wipers on right)
    const stalkGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6);
    stalkGeo.rotateZ(Math.PI / 2);
    const stalkL = new THREE.Mesh(stalkGeo, trimMat);
    stalkL.position.set(-0.11, 0.02, 0.08);
    steeringGroup.add(stalkL);
    const stalkR = new THREE.Mesh(stalkGeo, trimMat);
    stalkR.position.set(0.11, 0.02, 0.08);
    steeringGroup.add(stalkR);

    // Dedicated Rotating Wheel Group (Rotates dynamically with steering input)
    this.steeringWheelRotator = new THREE.Group();

    // Contoured Sports Torus Rim (thick grip)
    const wheelRimGeo = new THREE.TorusGeometry(0.20, 0.026, 16, 36);
    const wheelRim = new THREE.Mesh(wheelRimGeo, interiorMat);
    this.steeringWheelRotator.add(wheelRim);

    // Ergonomic Thumb-Rest Grip Bulges at 9 & 3 o'clock
    const gripGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.08, 12);
    const gripL = new THREE.Mesh(gripGeo, interiorMat);
    gripL.position.set(-0.20, 0.02, 0);
    this.steeringWheelRotator.add(gripL);
    const gripR = new THREE.Mesh(gripGeo, interiorMat);
    gripR.position.set(0.20, 0.02, 0);
    this.steeringWheelRotator.add(gripR);

    // 12 o'clock Racing Alignment Stripe in Vibrant Red!
    const stripeGeo = new THREE.BoxGeometry(0.045, 0.055, 0.035);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.20, 0.012);
    this.steeringWheelRotator.add(stripe);

    // Center Hub Boss with Brand Logo
    const hubGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.04, 18);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, trimMat);
    this.steeringWheelRotator.add(hub);

    const logoGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.046, 16);
    logoGeo.rotateX(Math.PI / 2);
    const logoMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.1,
    });
    const logo = new THREE.Mesh(logoGeo, logoMat);
    this.steeringWheelRotator.add(logo);

    // 3 Brushed Metal Spokes
    const spokeLGeo = new THREE.BoxGeometry(0.12, 0.035, 0.016);
    const spokeL = new THREE.Mesh(spokeLGeo, chromeMat);
    spokeL.position.set(-0.11, 0, 0.005);
    this.steeringWheelRotator.add(spokeL);

    // Tactile multi-function buttons on left spoke
    const buttonGeo = new THREE.BoxGeometry(0.02, 0.018, 0.01);
    const btn1 = new THREE.Mesh(buttonGeo, trimMat);
    btn1.position.set(-0.11, 0.01, 0.016);
    this.steeringWheelRotator.add(btn1);

    const spokeR = new THREE.Mesh(spokeLGeo, chromeMat);
    spokeR.position.set(0.11, 0, 0.005);
    this.steeringWheelRotator.add(spokeR);

    // Tactile cruise buttons on right spoke
    const btn2 = new THREE.Mesh(buttonGeo, trimMat);
    btn2.position.set(0.11, 0.01, 0.016);
    this.steeringWheelRotator.add(btn2);

    const spokeBGeo = new THREE.BoxGeometry(0.035, 0.12, 0.016);
    const spokeB = new THREE.Mesh(spokeBGeo, chromeMat);
    spokeB.position.set(0, -0.11, 0.005);
    this.steeringWheelRotator.add(spokeB);

    // Dual Brushed Metal Paddle Shifters behind the wheel (+ on right, - on left)
    const paddleGeo = new THREE.BoxGeometry(0.035, 0.15, 0.012);
    const paddleL = new THREE.Mesh(paddleGeo, chromeMat);
    paddleL.position.set(-0.17, 0.04, 0.035);
    this.steeringWheelRotator.add(paddleL);

    const paddleR = new THREE.Mesh(paddleGeo, chromeMat);
    paddleR.position.set(0.17, 0.04, 0.035);
    this.steeringWheelRotator.add(paddleR);

    steeringGroup.add(this.steeringWheelRotator);
    this.bodyMesh.add(steeringGroup);
    this.steeringWheelGroup = steeringGroup;

    // 6. DRIVER & PASSENGER SPORT BUCKET SEATS
    const seatW = 0.38;
    const seatBaseGeo = new THREE.BoxGeometry(seatW, 0.16, 0.52);
    const seatBackGeo = new THREE.BoxGeometry(seatW, 0.52, 0.14);
    const headrestGeo = new THREE.BoxGeometry(0.22, 0.16, 0.12);

    // Driver Seat (Positioned at DRIVER_X)
    const seatZ = dashZ - 0.72;
    const seatBaseL = new THREE.Mesh(seatBaseGeo, seatMat);
    seatBaseL.position.set(DRIVER_X, cabinBaseY + 0.1, seatZ);
    this.bodyMesh.add(seatBaseL);

    const seatBackL = new THREE.Mesh(seatBackGeo, seatMat);
    seatBackL.position.set(DRIVER_X, cabinBaseY + 0.36, seatZ - 0.24);
    seatBackL.rotation.x = 0.14;
    this.bodyMesh.add(seatBackL);

    const headrestL = new THREE.Mesh(headrestGeo, seatMat);
    headrestL.position.set(DRIVER_X, cabinBaseY + 0.65, seatZ - 0.28);
    this.bodyMesh.add(headrestL);

    // Passenger Seat (Positioned at PASSENGER_X)
    const seatBaseR = new THREE.Mesh(seatBaseGeo, seatMat);
    seatBaseR.position.set(PASSENGER_X, cabinBaseY + 0.1, seatZ);
    this.bodyMesh.add(seatBaseR);

    const seatBackR = new THREE.Mesh(seatBackGeo, seatMat);
    seatBackR.position.set(PASSENGER_X, cabinBaseY + 0.36, seatZ - 0.24);
    seatBackR.rotation.x = 0.14;
    this.bodyMesh.add(seatBackR);

    const headrestR = new THREE.Mesh(headrestGeo, seatMat);
    headrestR.position.set(PASSENGER_X, cabinBaseY + 0.65, seatZ - 0.28);
    this.bodyMesh.add(headrestR);

    // 7. Interior Rearview Mirror with Reflective Mirror Glass
    const mirrorHousingGeo = new THREE.BoxGeometry(0.26, 0.08, 0.04);
    const mirrorHousing = new THREE.Mesh(mirrorHousingGeo, trimMat);
    const mirrorZ = cabinOffsetZ + cabinL * 0.22;
    const mirrorY = cabinBaseY + cabinH - 0.08;
    mirrorHousing.position.set(0, mirrorY, mirrorZ);
    mirrorHousing.rotation.x = 0.14;
    this.bodyMesh.add(mirrorHousing);

    const mirrorGlassGeo = new THREE.PlaneGeometry(0.24, 0.065);
    mirrorGlassGeo.rotateY(Math.PI);
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.05,
      side: THREE.DoubleSide,
    });
    const mirrorGlass = new THREE.Mesh(mirrorGlassGeo, mirrorGlassMat);
    mirrorGlass.position.set(0, mirrorY, mirrorZ - 0.025);
    mirrorGlass.rotation.x = 0.14;
    this.bodyMesh.add(mirrorGlass);

    // Side Mirrors: Driver Side on Left (+w * 0.48), Passenger on Right (-w * 0.48)
    const sideMirrorGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
    const sideMirrorL = new THREE.Mesh(sideMirrorGeo, trimMat);
    sideMirrorL.position.set(w * 0.48, config.wheelRadius + h * 0.45, cabinOffsetZ + cabinL * 0.38);
    this.bodyMesh.add(sideMirrorL);

    // Driver side mirror reflective glass (facing driver)
    const sideGlassGeo = new THREE.PlaneGeometry(0.15, 0.09);
    sideGlassGeo.rotateY(Math.PI);
    const sideGlassL = new THREE.Mesh(sideGlassGeo, mirrorGlassMat);
    sideGlassL.position.set(w * 0.47, config.wheelRadius + h * 0.45, cabinOffsetZ + cabinL * 0.38 - 0.10);
    sideGlassL.rotation.y = 0.22;
    this.bodyMesh.add(sideGlassL);

    const sideMirrorR = new THREE.Mesh(sideMirrorGeo, trimMat);
    sideMirrorR.position.set(-w * 0.48, config.wheelRadius + h * 0.45, cabinOffsetZ + cabinL * 0.38);
    this.bodyMesh.add(sideMirrorR);

    // Front Bumper & Grille
    const grilleGeo = new THREE.BoxGeometry(w * 0.65, h * 0.18, 0.15);
    const grille = new THREE.Mesh(grilleGeo, trimMat);
    grille.position.set(0, config.wheelRadius + h * 0.15, l * 0.505);
    this.bodyMesh.add(grille);

    // Sport car spoiler
    if (config.id === 'sport') {
      const spoilerGeo = new THREE.BoxGeometry(w * 0.85, 0.06, 0.28);
      const spoiler = new THREE.Mesh(spoilerGeo, trimMat);
      spoiler.position.set(0, config.wheelRadius + h * 0.65, -l * 0.46);
      this.bodyMesh.add(spoiler);

      const standGeo = new THREE.BoxGeometry(0.06, 0.25, 0.1);
      const standL = new THREE.Mesh(standGeo, trimMat);
      standL.position.set(-w * 0.3, config.wheelRadius + h * 0.5, -l * 0.46);
      const standR = new THREE.Mesh(standGeo, trimMat);
      standR.position.set(w * 0.3, config.wheelRadius + h * 0.5, -l * 0.46);
      this.bodyMesh.add(standL);
      this.bodyMesh.add(standR);
    }

    // ========================================================
    // PRECISE FIRST-PERSON DRIVER EYEPOINT ANCHOR CALIBRATION
    // ========================================================
    // Mount position: Exactly at driver eye level behind the steering wheel
    // Eye is centered at DRIVER_X, height at driver eye level, distance looking straight down the road!
    const eyeY = cabinBaseY + 0.54;
    const eyeZ = wheelZ - 0.45; // 45cm behind steering wheel (perfect gaming driver perspective)

    this.cockpitCameraMount.position.set(DRIVER_X, eyeY, eyeZ);
    // Target is straight down the road ahead outside the windshield, slightly angled to horizon
    this.cockpitCameraTarget.position.set(DRIVER_X, eyeY - 0.05, eyeZ + 25.0);
  }

  private buildWheels(config: CarConfig) {
    const r = config.wheelRadius;
    const w = 0.28;
    const tireGeo = new THREE.CylinderGeometry(r, r, w, 16);
    tireGeo.rotateZ(Math.PI / 2);

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.95,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.wheelColor),
      metalness: 0.92,
      roughness: 0.18,
    });

    const halfW = config.width * 0.46;
    const frontZ = config.length * 0.32;
    const rearZ = -config.length * 0.32;

    const wheelOffsets = [
      { x: -halfW, y: r, z: frontZ, isFront: true },
      { x: halfW, y: r, z: frontZ, isFront: true },
      { x: -halfW, y: r, z: rearZ, isFront: false },
      { x: halfW, y: r, z: rearZ, isFront: false },
    ];

    wheelOffsets.forEach((off) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(off.x, off.y, off.z);

      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Hubcap / Rim
      const rimGeo = new THREE.CylinderGeometry(r * 0.65, r * 0.65, w + 0.01, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      this.group.add(wheelGroup);
      this.wheels.push(tire);
      if (off.isFront) {
        this.frontWheels.push(wheelGroup as unknown as THREE.Mesh);
      }
    });
  }

  private buildLighting(config: CarConfig) {
    const l = config.length;
    const w = config.width;
    const r = config.wheelRadius;
    const h = config.height;

    // Dual front headlights
    const lightGeo = new THREE.BoxGeometry(0.25, 0.12, 0.08);
    const leftHead = new THREE.Mesh(lightGeo, this.headlightMat);
    leftHead.position.set(-w * 0.34, r + h * 0.28, l * 0.505);
    const rightHead = new THREE.Mesh(lightGeo, this.headlightMat);
    rightHead.position.set(w * 0.34, r + h * 0.28, l * 0.505);
    this.bodyMesh.add(leftHead);
    this.bodyMesh.add(rightHead);

    // Spotlights for nighttime driving
    const spotL = new THREE.SpotLight(0xfffae5, 0, 85, Math.PI / 5, 0.4, 1.2);
    spotL.position.set(-w * 0.34, r + h * 0.28, l * 0.52);
    spotL.target.position.set(-w * 0.34, 0, l * 0.52 + 35);
    this.group.add(spotL);
    this.group.add(spotL.target);

    const spotR = new THREE.SpotLight(0xfffae5, 0, 85, Math.PI / 5, 0.4, 1.2);
    spotR.position.set(w * 0.34, r + h * 0.28, l * 0.52);
    spotR.target.position.set(w * 0.34, 0, l * 0.52 + 35);
    this.group.add(spotR);
    this.group.add(spotR.target);

    this.headlights.push(spotL, spotR);

    // Rear taillights
    const tailGeo = new THREE.BoxGeometry(0.3, 0.1, 0.08);
    const leftTail = new THREE.Mesh(tailGeo, this.taillightMat);
    leftTail.position.set(-w * 0.34, r + h * 0.28, -l * 0.505);
    const rightTail = new THREE.Mesh(tailGeo, this.taillightMat);
    rightTail.position.set(w * 0.34, r + h * 0.28, -l * 0.505);
    this.bodyMesh.add(leftTail);
    this.bodyMesh.add(rightTail);
  }

  public updateVisuals(
    wheelAngle: number,
    steerAngle: number,
    bodyRoll: number,
    bodyPitch: number,
    isBraking: boolean,
    isNight: boolean,
    dt?: number,
    physics?: CarPhysics
  ) {
    // 1. Wheel spin
    for (const wheel of this.wheels) {
      wheel.rotation.x = wheelAngle;
    }

    // 2. Front wheel steering
    for (const frontGroup of this.frontWheels) {
      frontGroup.rotation.y = steerAngle;
    }

    // 3. Functional Interior Steering Wheel rotation!
    // In our coordinate system looking toward +Z, turning left moves wheel top towards +X (counter-clockwise)
    if (this.steeringWheelRotator) {
      this.steeringWheelRotator.rotation.z = -steerAngle * 3.5;
    }

    // 4. Body roll & pitch
    this.bodyMesh.rotation.z = bodyRoll;
    this.bodyMesh.rotation.x = bodyPitch;

    // 5. Dynamic Digital Cluster updates (speedometer, tachometer, gear, power)
    if (physics && dt !== undefined) {
      this.clusterDisplay.update(
        physics.speedKmh,
        physics.rpm,
        physics.currentGear,
        isBraking,
        dt
      );
    }

    // 6. Headlights state
    const headIntensity = isNight ? 2.2 : 0.0;
    for (const spot of this.headlights) {
      spot.intensity = headIntensity;
    }
    this.headlightMat.emissiveIntensity = isNight ? 1.5 : 0.2;

    // 7. Taillight / Braking glow
    if (isBraking) {
      this.taillightMat.emissiveIntensity = 2.8;
    } else {
      this.taillightMat.emissiveIntensity = isNight ? 0.8 : 0.2;
    }
  }

  public dispose() {
    this.clusterDisplay.dispose();
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
      }
    });
  }
}

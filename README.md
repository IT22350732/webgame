# ROADSCAPE — Endless Scenic Driving Game

> **Owner & Creator:** Imeth Mendis  
> **Copyright:** © 2026 Imeth Mendis. All Rights Reserved.

---

**ROADSCAPE** is an endless 3D procedural driving experience built with **React 19**, **Three.js**, **TypeScript**, **Vite**, and the **Web Audio API**.

Cruise endlessly through rolling country meadows, alpine pine woodlands, misty mountain passes, coastal highways, and badlands under dynamic weather systems and real-time day/night cycles.

---

## 🌟 Key Features

- **Endless Procedural Road & Terrain**: Infinite ribbon highway streaming procedural 3D terrain, elevation changes, banking curves, tunnels, bridges, and foliage assets.
- **Dynamic Atmosphere**: Seamless day, sunset, night, and dawn transitions paired with clear, overcast, rain, and fog weather.
- **Physical Vehicle Simulation**: Ray-frame physics with speed-sensitive steering, tire friction, body roll, pitch, suspension damping, and 5-speed transmission simulation.
- **Dynamic AI Traffic**: Realistic traffic vehicles navigating lanes with collision physics and trauma camera shake.
- **Procedural Audio Synthesizer**: Pure Web Audio synthesis engine generating real-time mechanical engine firing frequencies, tire friction, wind rush, and rain ambiance with zero external audio assets.
- **Garage Vehicle Selection**: Choose between the GT Sport Coupe, Classic Muscle Car, and Highway Cruiser.
- **Multiple Camera Angles**: Third-person chase, close chase, interior cockpit view, and cinematic orbit.
- **Mobile Responsive & Gyro Tilt Controls**: Full mobile optimization with phone tilt (gyroscope) steering, live artificial horizon tilt gauge, haptic feedback, safe-area insets, and touch cockpit pedals.

---

## 📱 Controls

### Mobile (Smartphones & Tablets)
- **Steering**: Tilt your phone left or right like a steering wheel (DeviceOrientation / Gyroscope).
- **Cockpit Pedals**: Right thumb accelerates (`GAS`); Left thumb brakes and reverses (`BRAKE`).
- **Drift / Handbrake**: Tap the `DRIFT` button for instant handbrake slides.
- **Recenter**: Tap `RECENTER` on the HUD to zero your phone angle to your natural holding posture.
- **Mode Toggle**: Switch between **Phone Tilt (Gyro)** and **Touch Buttons** anytime via HUD or Settings.

### Desktop Keyboard
- **Accelerate**: `W` or `Arrow Up`
- **Brake / Reverse**: `S` or `Arrow Down`
- **Steer Left / Right**: `A` / `D` or `Arrow Left` / `Arrow Right`
- **Handbrake**: `Space`
- **Cycle Cameras**: `C`
- **Reset to Road**: `R`
- **Pause Menu**: `ESC`
- **Debug Telemetry**: `F3`

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## ⚖️ Ownership & License

**ROADSCAPE** is conceived, designed, and developed by **Imeth Mendis**.

© 2026 **Imeth Mendis**. All Rights Reserved.

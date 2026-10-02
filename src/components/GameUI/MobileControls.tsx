import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Smartphone,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { CarInputs } from '../../game/car/CarPhysics';
import { tiltManager } from '../../utils/tiltManager';
import { useSettingsStore } from '../../store/settingsStore';
import { triggerHaptic } from '../../utils/haptics';
import { TiltIndicator } from './TiltIndicator';

interface MobileControlsProps {
  onInputsChange: (inputs: CarInputs) => void;
  onResetCar?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInputsChange,
  onResetCar,
}) => {
  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 1024
    );
  });
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(0);
  const [touchSteer, setTouchSteer] = useState(0);
  const [handbrake, setHandbrake] = useState(false);

  const controlScheme = useSettingsStore((s) => s.settings.controlScheme);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const autoAccelerate = useSettingsStore((s) => s.settings.autoAccelerate);

  const isTilt = controlScheme === 'TILT';
  const animFrameRef = useRef<number | null>(null);

  // Manage Tilt sensors when in TILT mode
  useEffect(() => {
    if (isTilt) {
      tiltManager.startListening();
    } else {
      tiltManager.stopListening();
    }

    return () => {
      tiltManager.stopListening();
    };
  }, [isTilt]);

  // High-frequency input dispatch loop for smooth car physics
  useEffect(() => {
    let active = true;

    const dispatchLoop = () => {
      if (!active) return;

      let effectiveSteer = touchSteer;
      if (isTilt) {
        effectiveSteer = tiltManager.getSteer();
      }

      // Auto-accelerate feature: constant throttle unless braking
      const effectiveThrottle = autoAccelerate ? (brake > 0 ? 0 : 0.85) : throttle;

      onInputsChange({
        throttle: effectiveThrottle,
        brake,
        steer: effectiveSteer,
        handbrake,
      });

      animFrameRef.current = requestAnimationFrame(dispatchLoop);
    };

    animFrameRef.current = requestAnimationFrame(dispatchLoop);

    return () => {
      active = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isTilt, touchSteer, throttle, brake, handbrake, autoAccelerate, onInputsChange]);

  const toggleControlScheme = useCallback(async () => {
    triggerHaptic(18);
    const nextScheme = isTilt ? 'TOUCH' : 'TILT';
    updateSetting('controlScheme', nextScheme);

    if (nextScheme === 'TILT') {
      const perm = tiltManager.getPermissionState();
      if (perm === 'prompt') {
        await tiltManager.requestPermission();
      }
      tiltManager.calibrate();
    }
  }, [isTilt, updateSetting]);

  const handleRequestMotionPermission = async () => {
    triggerHaptic(20);
    await tiltManager.requestPermission();
    tiltManager.calibrate();
  };

  if (!isTouchDevice) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'max(16px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Center Controls Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'auto',
          alignSelf: 'center',
        }}
      >
        {/* Toggle between Tilt (Gyro) & Touch Buttons */}
        <button
          onClick={toggleControlScheme}
          onTouchEnd={(e) => { e.preventDefault(); toggleControlScheme(); }}
          className="glass-btn"
          style={{
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            borderRadius: '20px',
            background: isTilt ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.1)',
            borderColor: isTilt ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
            boxShadow: isTilt ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
            color: '#ffffff',
          }}
        >
          {isTilt ? <Smartphone size={14} color="#38bdf8" /> : <SlidersHorizontal size={14} color="#f59e0b" />}
          <span>{isTilt ? 'GYRO STEER: ON' : 'TOUCH BUTTONS'}</span>
        </button>

        {/* Quick Reset Car on mobile */}
        {onResetCar && (
          <button
            onClick={() => { triggerHaptic(15); onResetCar(); }}
            onTouchEnd={(e) => { e.preventDefault(); triggerHaptic(15); onResetCar(); }}
            className="glass-btn"
            title="Reset to road center"
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              borderRadius: '20px',
              color: '#cbd5e1',
            }}
          >
            <RotateCcw size={12} color="#38bdf8" />
            <span>RESET</span>
          </button>
        )}
      </div>

      {/* Center Status: Tilt Indicator / Spirit Level */}
      {isTilt && (
        <div
          style={{
            alignSelf: 'center',
            marginBottom: '6px',
            pointerEvents: 'auto',
          }}
        >
          <TiltIndicator
            onRequestPermission={handleRequestMotionPermission}
            permissionState={tiltManager.getPermissionState()}
          />
        </div>
      )}

      {/* Bottom Main Cockpit Pedals & Steer Area */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          width: '100%',
        }}
      >
        {/* LEFT CLUSTER: Steering (if touch mode) or Brake/Handbrake (if tilt mode) */}
        {isTilt ? (
          /* In Tilt Mode: Left Thumb Controls Brake & Handbrake */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              pointerEvents: 'auto',
            }}
          >
            {/* Drift / Handbrake button */}
            <button
              onTouchStart={(e) => { e.preventDefault(); triggerHaptic(20); setHandbrake(true); }}
              onTouchEnd={(e) => { e.preventDefault(); setHandbrake(false); }}
              onMouseDown={() => { triggerHaptic(20); setHandbrake(true); }}
              onMouseUp={() => setHandbrake(false)}
              className="glass-btn"
              style={{
                width: '64px',
                height: '46px',
                borderRadius: '14px',
                padding: 0,
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                background: handbrake ? 'rgba(245, 158, 11, 0.45)' : 'rgba(15, 23, 42, 0.65)',
                borderColor: handbrake ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: handbrake ? '0 0 18px rgba(245, 158, 11, 0.5)' : 'none',
              }}
            >
              <Flame size={14} color="#f59e0b" />
              <span>DRIFT</span>
            </button>

            {/* Brake / Reverse Pedal */}
            <button
              onTouchStart={(e) => { e.preventDefault(); triggerHaptic(12); setBrake(1.0); }}
              onTouchEnd={(e) => { e.preventDefault(); setBrake(0); }}
              onMouseDown={() => { triggerHaptic(12); setBrake(1.0); }}
              onMouseUp={() => setBrake(0)}
              className="glass-btn"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '24px',
                padding: 0,
                flexDirection: 'column',
                gap: '4px',
                background: brake > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                borderColor: brake > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: brake > 0 ? '0 0 24px rgba(239, 68, 68, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
                transform: brake > 0 ? 'scale(0.95)' : 'none',
                transition: 'all 0.1s ease',
              }}
            >
              <ChevronDown size={32} color={brake > 0 ? '#ef4444' : '#f87171'} />
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#cbd5e1' }}>
                BRAKE
              </span>
            </button>
          </div>
        ) : (
          /* In Touch Mode: Left Thumb Controls Left & Right Steer Buttons */
          <div
            style={{
              display: 'flex',
              gap: '12px',
              pointerEvents: 'auto',
            }}
          >
            <button
              onTouchStart={(e) => { e.preventDefault(); triggerHaptic(12); setTouchSteer(1.0); }}
              onTouchEnd={(e) => { e.preventDefault(); setTouchSteer(0); }}
              onMouseDown={() => { triggerHaptic(12); setTouchSteer(1.0); }}
              onMouseUp={() => setTouchSteer(0)}
              className="glass-btn"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '22px',
                padding: 0,
                background: touchSteer > 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                borderColor: touchSteer > 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: touchSteer > 0 ? '0 0 20px rgba(56, 189, 248, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
                transform: touchSteer > 0 ? 'scale(0.94)' : 'none',
              }}
            >
              <ArrowLeft size={32} color={touchSteer > 0 ? '#38bdf8' : '#ffffff'} />
            </button>

            <button
              onTouchStart={(e) => { e.preventDefault(); triggerHaptic(12); setTouchSteer(-1.0); }}
              onTouchEnd={(e) => { e.preventDefault(); setTouchSteer(0); }}
              onMouseDown={() => { triggerHaptic(12); setTouchSteer(-1.0); }}
              onMouseUp={() => setTouchSteer(0)}
              className="glass-btn"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '22px',
                padding: 0,
                background: touchSteer < 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                borderColor: touchSteer < 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: touchSteer < 0 ? '0 0 20px rgba(56, 189, 248, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
                transform: touchSteer < 0 ? 'scale(0.94)' : 'none',
              }}
            >
              <ArrowRight size={32} color={touchSteer < 0 ? '#38bdf8' : '#ffffff'} />
            </button>
          </div>
        )}

        {/* RIGHT CLUSTER: Gas & Brake (in Touch mode) or Gas & Drift (in Tilt mode) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            pointerEvents: 'auto',
          }}
        >
          {/* If in touch mode, include brake next to gas */}
          {!isTilt && (
            <button
              onTouchStart={(e) => { e.preventDefault(); triggerHaptic(12); setBrake(1.0); }}
              onTouchEnd={(e) => { e.preventDefault(); setBrake(0); }}
              onMouseDown={() => { triggerHaptic(12); setBrake(1.0); }}
              onMouseUp={() => setBrake(0)}
              className="glass-btn"
              style={{
                width: '68px',
                height: '74px',
                borderRadius: '22px',
                padding: 0,
                flexDirection: 'column',
                gap: '2px',
                background: brake > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                borderColor: brake > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: brake > 0 ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
                transform: brake > 0 ? 'scale(0.95)' : 'none',
              }}
            >
              <ChevronDown size={28} color={brake > 0 ? '#ef4444' : '#f87171'} />
              <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1px', color: '#cbd5e1' }}>
                BRAKE
              </span>
            </button>
          )}

          {/* Gas / Accelerate Pedal */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerHaptic(14); setThrottle(1.0); }}
            onTouchEnd={(e) => { e.preventDefault(); setThrottle(0); }}
            onMouseDown={() => { triggerHaptic(14); setThrottle(1.0); }}
            onMouseUp={() => setThrottle(0)}
            className="glass-btn"
            style={{
              width: isTilt ? '92px' : '78px',
              height: isTilt ? '92px' : '82px',
              borderRadius: '26px',
              padding: 0,
              flexDirection: 'column',
              gap: '4px',
              background:
                throttle > 0 || autoAccelerate
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.8), rgba(56, 189, 248, 0.85))'
                  : 'rgba(15, 23, 42, 0.75)',
              borderColor: throttle > 0 || autoAccelerate ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
              boxShadow:
                throttle > 0 || autoAccelerate
                  ? '0 0 30px rgba(56, 189, 248, 0.6)'
                  : '0 8px 24px rgba(0, 0, 0, 0.4)',
              transform: throttle > 0 ? 'scale(0.95)' : 'none',
              transition: 'all 0.1s ease',
            }}
          >
            <ChevronUp size={isTilt ? 38 : 32} color={throttle > 0 || autoAccelerate ? '#030712' : '#38bdf8'} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '1.5px',
                color: throttle > 0 || autoAccelerate ? '#030712' : '#f8fafc',
              }}
            >
              {autoAccelerate ? 'CRUISE' : 'GAS'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

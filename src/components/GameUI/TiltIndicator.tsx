import React, { useEffect, useState } from 'react';
import { Crosshair, Smartphone } from 'lucide-react';
import { tiltManager, TiltState } from '../../utils/tiltManager';
import { triggerHaptic } from '../../utils/haptics';

interface TiltIndicatorProps {
  onCalibrate?: () => void;
  onRequestPermission?: () => void;
  permissionState?: string;
}

export const TiltIndicator: React.FC<TiltIndicatorProps> = ({
  onCalibrate,
  onRequestPermission,
  permissionState,
}) => {
  const [tiltState, setTiltState] = useState<TiltState>(() => tiltManager.getState());

  useEffect(() => {
    const unsub = tiltManager.subscribe((state) => {
      setTiltState(state);
    });
    return unsub;
  }, []);

  const handleCenter = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    tiltManager.calibrate();
    triggerHaptic(20);
    onCalibrate?.();
  };

  // Steer percentage -100% to +100%
  // In our game steer > 0 is LEFT, steer < 0 is RIGHT
  const steerPercent = Math.round(tiltState.steer * 100);
  const absSteer = Math.abs(steerPercent);
  const angleDeg = Math.round(tiltState.calibratedAngle);
  const isLeft = tiltState.steer > 0.02;
  const isDeadzone = Math.abs(tiltState.steer) <= 0.02;

  // Horizontal displacement for the indicator pill (-50px to +50px)
  const markerOffset = Math.max(-56, Math.min(56, -tiltState.steer * 56));

  if (permissionState === 'prompt') {
    return (
      <button
        onClick={onRequestPermission}
        onTouchEnd={onRequestPermission}
        className="glass-btn animate-fade-in"
        style={{
          pointerEvents: 'auto',
          padding: '8px 16px',
          borderRadius: '20px',
          background: 'rgba(56, 189, 248, 0.25)',
          borderColor: '#38bdf8',
          fontSize: '12px',
          gap: '8px',
          color: '#ffffff',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
        }}
      >
        <Smartphone size={16} color="#38bdf8" />
        <span>TAP TO ENABLE TILT SENSORS</span>
      </button>
    );
  }

  return (
    <div
      className="glass-panel"
      style={{
        pointerEvents: 'auto',
        padding: '6px 14px',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.75)',
        borderColor: isDeadzone ? 'rgba(255, 255, 255, 0.12)' : 'rgba(56, 189, 248, 0.4)',
        boxShadow: !isDeadzone ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Icon / Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Smartphone
          size={14}
          color={tiltState.isActive ? '#38bdf8' : '#94a3b8'}
          style={{
            transform: `rotate(${Math.max(-25, Math.min(25, -angleDeg))}deg)`,
            transition: 'transform 0.08s ease-out',
          }}
        />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: tiltState.isActive ? '#38bdf8' : '#94a3b8',
            textTransform: 'uppercase',
          }}
        >
          {isDeadzone
            ? 'CENTER'
            : isLeft
            ? `${Math.abs(angleDeg)}° L`
            : `${Math.abs(angleDeg)}° R`}
        </span>
      </div>

      {/* Visual Tilt Horizon Bar */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '18px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '9px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Deadzone center notch */}
        <div
          style={{
            position: 'absolute',
            width: '14px',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderLeft: '1px dashed rgba(255, 255, 255, 0.2)',
            borderRight: '1px dashed rgba(255, 255, 255, 0.2)',
          }}
        />

        {/* Center line marker */}
        <div
          style={{
            position: 'absolute',
            width: '2px',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '1px',
          }}
        />

        {/* Dynamic Glowing Reticle */}
        <div
          style={{
            position: 'absolute',
            transform: `translateX(${markerOffset}px)`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background:
              absSteer > 85
                ? '#f59e0b'
                : isDeadzone
                ? '#94a3b8'
                : '#38bdf8',
            boxShadow:
              !isDeadzone
                ? `0 0 10px ${absSteer > 85 ? '#f59e0b' : '#38bdf8'}`
                : 'none',
            transition: 'transform 0.04s linear, background-color 0.2s',
          }}
        />
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleCenter}
        onTouchEnd={handleCenter}
        title="Calibrate Phone Center (Tap to reset zero tilt)"
        className="glass-btn"
        style={{
          padding: '4px 8px',
          fontSize: '10px',
          fontWeight: 700,
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          gap: '4px',
          height: '24px',
        }}
      >
        <Crosshair size={12} color="#38bdf8" />
        <span>RECENTER</span>
      </button>
    </div>
  );
};

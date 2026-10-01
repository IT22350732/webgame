import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { CarInputs } from '../../game/car/CarPhysics';

interface MobileControlsProps {
  onInputsChange: (inputs: CarInputs) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onInputsChange }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [steer, setSteer] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(0);

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch || window.innerWidth < 1024);
  }, []);

  useEffect(() => {
    onInputsChange({
      throttle,
      brake,
      steer,
      handbrake: false,
    });
  }, [throttle, brake, steer, onInputsChange]);

  if (!isTouchDevice) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 20,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      padding: '24px 32px',
    }}>
      {/* Steering Controls (Left & Right) */}
      <div style={{
        display: 'flex',
        gap: '16px',
        pointerEvents: 'auto',
      }}>
        <button
          onTouchStart={(e) => { e.preventDefault(); setSteer(1.0); }}
          onTouchEnd={(e) => { e.preventDefault(); setSteer(0); }}
          onMouseDown={() => setSteer(1.0)}
          onMouseUp={() => setSteer(0)}
          className="glass-btn"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            padding: 0,
            background: steer > 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <ArrowLeft size={32} />
        </button>

        <button
          onTouchStart={(e) => { e.preventDefault(); setSteer(-1.0); }}
          onTouchEnd={(e) => { e.preventDefault(); setSteer(0); }}
          onMouseDown={() => setSteer(-1.0)}
          onMouseUp={() => setSteer(0)}
          className="glass-btn"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            padding: 0,
            background: steer < 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <ArrowRight size={32} />
        </button>
      </div>

      {/* Pedals (Brake & Accelerate) */}
      <div style={{
        display: 'flex',
        gap: '16px',
        pointerEvents: 'auto',
      }}>
        <button
          onTouchStart={(e) => { e.preventDefault(); setBrake(1.0); }}
          onTouchEnd={(e) => { e.preventDefault(); setBrake(0); }}
          onMouseDown={() => setBrake(1.0)}
          onMouseUp={() => setBrake(0)}
          className="glass-btn"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            padding: 0,
            background: brake > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)',
            borderColor: brake > 0 ? '#ef4444' : undefined,
          }}
        >
          <ChevronDown size={32} />
        </button>

        <button
          onTouchStart={(e) => { e.preventDefault(); setThrottle(1.0); }}
          onTouchEnd={(e) => { e.preventDefault(); setThrottle(0); }}
          onMouseDown={() => setThrottle(1.0)}
          onMouseUp={() => setThrottle(0)}
          className="glass-btn glass-btn-primary"
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            padding: 0,
            background: throttle > 0 ? 'linear-gradient(135deg, #38bdf8, #7dd3fc)' : undefined,
          }}
        >
          <ChevronUp size={40} />
        </button>
      </div>
    </div>
  );
};

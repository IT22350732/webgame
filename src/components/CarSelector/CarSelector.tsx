import React from 'react';
import { ArrowLeft, Check, Gauge, Zap, Crosshair } from 'lucide-react';
import { CAR_CONFIGS } from '../../game/car/carConfigs';
import { useGameStore } from '../../store/gameStore';
import { audioManager } from '../../game/audio/AudioManager';
import { triggerHaptic } from '../../utils/haptics';

interface CarSelectorProps {
  onBack: () => void;
  onCarChanged: (carId: string) => void;
}

export const CarSelector: React.FC<CarSelectorProps> = ({ onBack, onCarChanged }) => {
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const setSelectedCarId = useGameStore((s) => s.setSelectedCarId);

  const handleSelect = (carId: string) => {
    triggerHaptic(15);
    audioManager.playClick();
    setSelectedCarId(carId);
    onCarChanged(carId);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'max(20px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))',
        zIndex: 10,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 80%, rgba(3, 7, 18, 0.2) 0%, rgba(3, 7, 18, 0.8) 100%)',
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
          width: '100%',
        }}
      >
        <button
          onClick={() => { triggerHaptic(12); audioManager.playClick(); onBack(); }}
          className="glass-btn"
          style={{ padding: '10px 18px', fontSize: '13px' }}
        >
          <ArrowLeft size={16} />
          <span>BACK</span>
        </button>

        <div>
          <h1
            style={{
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#ffffff',
              margin: 0,
              textAlign: 'right',
            }}
          >
            GARAGE
          </h1>
          <p
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              letterSpacing: '1px',
              margin: 0,
              textAlign: 'right',
            }}
          >
            Owner: <strong style={{ color: '#38bdf8' }}>Imeth Mendis</strong> (All rights reserved)
          </p>
        </div>
      </div>

      {/* Bottom Vehicles Selector Cards (Horizontal swipe on mobile, clean grid on desktop) */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          maxWidth: '1150px',
          margin: '16px auto',
          width: '100%',
          pointerEvents: 'auto',
          overflowX: 'auto',
          paddingBottom: '8px',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
      >
        {CAR_CONFIGS.map((car, idx) => {
          const isSelected = selectedCarId === car.id;

          return (
            <div
              key={car.id}
              onClick={() => handleSelect(car.id)}
              className="glass-panel"
              style={{
                flex: '1 0 280px',
                minWidth: '260px',
                maxWidth: '360px',
                padding: 'clamp(16px, 3vw, 22px)',
                cursor: 'pointer',
                borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.7)',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'translateY(-4px)' : 'none',
                boxShadow: isSelected ? '0 12px 30px rgba(56, 189, 248, 0.3)' : undefined,
                scrollSnapAlign: 'start',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}
                  >
                    0{idx + 1} • {car.category}
                  </div>
                  <h3
                    style={{
                      fontSize: 'clamp(18px, 3.5vw, 22px)',
                      fontWeight: 800,
                      color: '#ffffff',
                      marginTop: '2px',
                    }}
                  >
                    {car.name}
                  </h3>
                </div>

                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <Check size={15} color="#030712" strokeWidth={3} />}
                </div>
              </div>

              <p
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  marginTop: '8px',
                  lineHeight: 1.45,
                  minHeight: '32px',
                }}
              >
                {car.description}
              </p>

              {/* Stats Bars */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Top Speed */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={12} color="#38bdf8" /> Top Speed
                    </span>
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{car.topSpeed} km/h</strong>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}>
                    <div style={{ width: `${(car.topSpeed / 200) * 100}%`, height: '100%', background: '#38bdf8', borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Acceleration */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} color="#f59e0b" /> Acceleration
                    </span>
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{Math.round(car.acceleration * 2.8)}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}>
                    <div style={{ width: `${(car.acceleration / 40) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Handling */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Crosshair size={12} color="#10b981" /> Handling
                    </span>
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{Math.round(car.handling * 100)}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}>
                    <div style={{ width: `${car.handling * 100}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

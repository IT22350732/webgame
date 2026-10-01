import React from 'react';
import { ArrowLeft, Check, Gauge, Zap, Crosshair } from 'lucide-react';
import { CAR_CONFIGS } from '../../game/car/carConfigs';
import { useGameStore } from '../../store/gameStore';
import { audioManager } from '../../game/audio/AudioManager';

interface CarSelectorProps {
  onBack: () => void;
  onCarChanged: (carId: string) => void;
}

export const CarSelector: React.FC<CarSelectorProps> = ({ onBack, onCarChanged }) => {
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const setSelectedCarId = useGameStore((s) => s.setSelectedCarId);

  const handleSelect = (carId: string) => {
    audioManager.playClick();
    setSelectedCarId(carId);
    onCarChanged(carId);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '40px 60px',
      zIndex: 10,
      pointerEvents: 'none',
      background: 'radial-gradient(circle at 50% 80%, rgba(3, 7, 18, 0.2) 0%, rgba(3, 7, 18, 0.75) 100%)',
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        <button
          onClick={() => { audioManager.playClick(); onBack(); }}
          className="glass-btn"
          style={{ padding: '12px 20px' }}
        >
          <ArrowLeft size={18} />
          <span>BACK</span>
        </button>

        <div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#ffffff',
            margin: 0,
            textAlign: 'right',
          }}>
            GARAGE
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#94a3b8',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            margin: 0,
            textAlign: 'right',
          }}>
            Choose your journey vehicle
          </p>
        </div>
      </div>

      {/* Bottom Vehicles Selector Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        pointerEvents: 'auto',
      }}>
        {CAR_CONFIGS.map((car, idx) => {
          const isSelected = selectedCarId === car.id;

          return (
            <div
              key={car.id}
              onClick={() => handleSelect(car.id)}
              className="glass-panel"
              style={{
                padding: '24px',
                cursor: 'pointer',
                borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.65)',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'translateY(-4px)' : 'none',
                boxShadow: isSelected ? '0 12px 30px rgba(56, 189, 248, 0.25)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}>
                    CAR 0{idx + 1} • {car.category}
                  </div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginTop: '4px',
                  }}>
                    {car.name}
                  </h3>
                </div>

                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isSelected && <Check size={16} color="#030712" strokeWidth={3} />}
                </div>
              </div>

              <p style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '10px',
                lineHeight: 1.5,
                minHeight: '36px',
              }}>
                {car.description}
              </p>

              {/* Stats Bars */}
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Top Speed */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={13} color="#38bdf8" /> Top Speed
                    </span>
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{car.topSpeed} km/h</strong>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}>
                    <div style={{ width: `${(car.topSpeed / 200) * 100}%`, height: '100%', background: '#38bdf8', borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Acceleration */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={13} color="#f59e0b" /> Acceleration
                    </span>
                    <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{Math.round(car.acceleration * 2.8)}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}>
                    <div style={{ width: `${(car.acceleration / 40) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Handling */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Crosshair size={13} color="#10b981" /> Handling
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

import React from 'react';
import {
  Sun,
  CloudRain,
  Cloud,
  Eye,
  Camera,
  Pause,
  RotateCcw,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { BIOMES } from '../../game/world/biomeConfigs';

interface GameHUDProps {
  onPause: () => void;
  onResetCar: () => void;
  onCycleCamera: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  onPause,
  onResetCar,
  onCycleCamera,
}) => {
  const distance = useGameStore((s) => s.distance);
  const speedKmh = useGameStore((s) => s.speedKmh);
  const currentBiome = useGameStore((s) => s.currentBiome);
  const currentWeather = useGameStore((s) => s.currentWeather);
  const currentTimeOfDay = useGameStore((s) => s.currentTimeOfDay);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const isOffroad = useGameStore((s) => s.isOffroad);

  const biomeConfig = BIOMES[currentBiome];
  const absSpeed = Math.round(Math.abs(speedKmh));
  const kmDriven = (distance / 1000).toFixed(1);

  // Weather Icon
  const renderWeatherIcon = () => {
    switch (currentWeather) {
      case 'RAIN':
        return <CloudRain size={16} color="#38bdf8" />;
      case 'CLOUDY':
        return <Cloud size={16} color="#cbd5e1" />;
      case 'FOG':
        return <Eye size={16} color="#94a3b8" />;
      default:
        return <Sun size={16} color="#f59e0b" />;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 32px',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'auto',
      }}>
        {/* Top Left: Biome & Environment info */}
        <div className="glass-panel" style={{
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          borderLeft: '4px solid #38bdf8',
        }}>
          <Compass size={20} color="#38bdf8" />
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#f8fafc',
            }}>
              {biomeConfig ? biomeConfig.name : currentBiome}
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '2px',
              textTransform: 'uppercase',
            }}>
              {renderWeatherIcon()}
              <span>{currentWeather}</span>
              <span>•</span>
              <span>{currentTimeOfDay}</span>
            </div>
          </div>
        </div>

        {/* Top Right: Distance & Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="glass-panel" style={{
            padding: '10px 22px',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Distance
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
              lineHeight: 1.1,
              marginTop: '2px',
            }}>
              {kmDriven} <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>km</span>
            </div>
          </div>

          <button
            onClick={onCycleCamera}
            className="glass-btn"
            title="Cycle Camera (C)"
            style={{ padding: '12px', borderRadius: '12px' }}
          >
            <Camera size={18} />
          </button>

          <button
            onClick={onPause}
            className="glass-btn"
            title="Pause Game (ESC)"
            style={{ padding: '12px', borderRadius: '12px' }}
          >
            <Pause size={18} />
          </button>
        </div>
      </div>

      {/* Center Notice: Offroad Warning */}
      {isOffroad && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            alignSelf: 'center',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            background: 'rgba(239, 68, 68, 0.25)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
          }}
        >
          <AlertTriangle size={20} color="#f87171" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fee2e2' }}>
            Off road terrain • Press <strong style={{ color: '#ffffff' }}>R</strong> to return to road
          </span>
          <button
            onClick={onResetCar}
            className="glass-btn"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <RotateCcw size={14} /> Return
          </button>
        </div>
      )}

      {/* Bottom Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        pointerEvents: 'auto',
      }}>
        {/* Bottom Left: Camera Mode & Reset */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="glass-panel" style={{
            padding: '8px 14px',
            fontSize: '12px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Camera size={14} color="#38bdf8" />
            <span>Mode: <strong style={{ color: '#ffffff' }}>{cameraMode === 'HOOD' ? 'INTERIOR COCKPIT' : cameraMode}</strong></span>
          </div>

          <button
            onClick={onResetCar}
            className="glass-btn"
            title="Reset Car (R)"
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Bottom Right: Digital Speedometer */}
        <div className="glass-panel" style={{
          padding: '16px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minWidth: '150px',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#94a3b8',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}>
            Speed
          </div>
          <div style={{
            fontSize: '44px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.0,
            color: '#f8fafc',
            marginTop: '2px',
          }}>
            {absSpeed}
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#38bdf8', marginLeft: '6px' }}>
              km/h
            </span>
          </div>

          {/* Speed meter bar */}
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            marginTop: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(100, (absSpeed / 180) * 100)}%`,
              height: '100%',
              background: absSpeed > 130 ? 'linear-gradient(90deg, #38bdf8, #ef4444)' : '#38bdf8',
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
  Maximize,
  Minimize,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { BIOMES } from '../../game/world/biomeConfigs';
import { triggerHaptic } from '../../utils/haptics';
import { useFullscreen } from '../../utils/fullscreen';

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

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const handleToggleFullscreen = async () => {
    triggerHaptic(15);
    await toggleFullscreen();
  };

  const biomeConfig = BIOMES[currentBiome];
  const absSpeed = Math.round(Math.abs(speedKmh));
  const kmDriven = (distance / 1000).toFixed(1);

  // Weather Icon
  const renderWeatherIcon = () => {
    switch (currentWeather) {
      case 'RAIN':
        return <CloudRain size={14} color="#38bdf8" />;
      case 'CLOUDY':
        return <Cloud size={14} color="#cbd5e1" />;
      case 'FOG':
        return <Eye size={14} color="#94a3b8" />;
      default:
        return <Sun size={14} color="#f59e0b" />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'max(14px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left))',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
          pointerEvents: 'auto',
          width: '100%',
        }}
      >
        {/* Top Left: Biome & Environment info */}
        <div
          className="glass-panel"
          style={{
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: '4px solid #38bdf8',
            maxWidth: '48%',
          }}
        >
          <Compass size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {biomeConfig ? biomeConfig.name : currentBiome}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '1px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {renderWeatherIcon()}
              <span>{currentWeather}</span>
              <span>•</span>
              <span>{currentTimeOfDay}</span>
            </div>
          </div>
        </div>

        {/* Top Right: Distance & Header Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div
            className="glass-panel"
            style={{
              padding: '6px 14px',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Distance
            </div>
            <div
              style={{
                fontSize: 'clamp(16px, 3.5vw, 20px)',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                lineHeight: 1.1,
              }}
            >
              {kmDriven} <span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8' }}>km</span>
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="glass-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{ padding: '8px', borderRadius: '10px', minWidth: '36px', height: '36px' }}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {/* Camera Cycle */}
          <button
            onClick={() => { triggerHaptic(12); onCycleCamera(); }}
            className="glass-btn"
            title="Cycle Camera (C)"
            style={{ padding: '8px', borderRadius: '10px', minWidth: '36px', height: '36px' }}
          >
            <Camera size={16} />
          </button>

          {/* Pause */}
          <button
            onClick={() => { triggerHaptic(12); onPause(); }}
            className="glass-btn"
            title="Pause Game (ESC)"
            style={{ padding: '8px', borderRadius: '10px', minWidth: '36px', height: '36px' }}
          >
            <Pause size={16} />
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
            gap: '10px',
            padding: '8px 16px',
            background: 'rgba(239, 68, 68, 0.28)',
            borderColor: 'rgba(239, 68, 68, 0.5)',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.35)',
            maxWidth: '92vw',
          }}
        >
          <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#fee2e2' }}>
            Off road terrain
          </span>
          <button
            onClick={() => { triggerHaptic(15); onResetCar(); }}
            className="glass-btn"
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
            }}
          >
            <RotateCcw size={12} /> Return
          </button>
        </div>
      )}

      {/* Bottom Bar: Camera Mode pill on Left & Speedometer on Right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          pointerEvents: 'auto',
          width: '100%',
        }}
      >
        {/* Bottom Left: Camera Mode */}
        <div
          className="glass-panel"
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '12px',
          }}
        >
          <Camera size={12} color="#38bdf8" />
          <span>
            <strong style={{ color: '#ffffff' }}>
              {cameraMode === 'HOOD' ? 'COCKPIT' : cameraMode}
            </strong>
          </span>
        </div>

        {/* Bottom Right: High-tech Speedometer */}
        <div
          className="glass-panel"
          style={{
            padding: '10px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            minWidth: '115px',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              fontSize: '9px',
              color: '#94a3b8',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}
          >
            Speed
          </div>
          <div
            style={{
              fontSize: 'clamp(28px, 6vw, 40px)',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.0,
              color: '#f8fafc',
              marginTop: '1px',
            }}
          >
            {absSpeed}
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#38bdf8', marginLeft: '4px' }}>
              km/h
            </span>
          </div>

          {/* Speed meter bar */}
          <div
            style={{
              width: '100%',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              marginTop: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, (absSpeed / 180) * 100)}%`,
                height: '100%',
                background: absSpeed > 130 ? 'linear-gradient(90deg, #38bdf8, #ef4444)' : '#38bdf8',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Play, Compass, Sliders, Info, Shuffle, Award, Route, Smartphone } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { audioManager } from '../../game/audio/AudioManager';
import { tiltManager } from '../../utils/tiltManager';
import { triggerHaptic } from '../../utils/haptics';

interface MainMenuProps {
  onStartDrive: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartDrive,
  onOpenGarage,
  onOpenSettings,
  onOpenAbout,
}) => {
  const seed = useGameStore((s) => s.seed);
  const setSeed = useGameStore((s) => s.setSeed);
  const bestDistance = useGameStore((s) => s.bestDistance);
  const totalDistance = useGameStore((s) => s.totalDistance);
  const controlScheme = useSettingsStore((s) => s.settings.controlScheme);

  const [seedInput, setSeedInput] = useState(seed.toString());

  const handleRandomizeSeed = () => {
    triggerHaptic(15);
    audioManager.playClick();
    const newSeed = Math.floor(Math.random() * 900000 + 100000);
    setSeed(newSeed);
    setSeedInput(newSeed.toString());
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setSeedInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSeed(parsed);
    }
  };

  const handleDriveClick = async () => {
    triggerHaptic(20);
    audioManager.init();
    audioManager.resume();
    audioManager.playClick();

    // Proactively request motion sensors on mobile touch
    if (controlScheme === 'TILT') {
      try {
        await tiltManager.requestPermission();
        tiltManager.calibrate();
      } catch {
        // Safe fallback
      }
    }

    onStartDrive();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'max(24px, env(safe-area-inset-top)) max(28px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(28px, env(safe-area-inset-left))',
        zIndex: 10,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 30%, rgba(3, 7, 18, 0.25) 0%, rgba(3, 7, 18, 0.8) 100%)',
        overflowY: 'auto',
      }}
    >
      {/* Top Header / Branding */}
      <div style={{ pointerEvents: 'auto' }}>
        <div style={{ display: 'inline-block' }}>
          <h1
            style={{
              fontSize: 'clamp(32px, 8vw, 56px)',
              fontWeight: 800,
              letterSpacing: 'clamp(3px, 1.2vw, 8px)',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #ffffff 40%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              lineHeight: 1.1,
              textShadow: '0 10px 30px rgba(56, 189, 248, 0.3)',
            }}
          >
            ROADSCAPE
          </h1>
          <p
            style={{
              fontSize: 'clamp(11px, 2.5vw, 16px)',
              fontWeight: 500,
              letterSpacing: 'clamp(2px, 0.8vw, 4px)',
              color: '#94a3b8',
              marginTop: '4px',
              textTransform: 'uppercase',
            }}
          >
            Endless Scenic Driving Experience
          </p>
        </div>
      </div>

      {/* Center Left: Action Menu */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '360px',
          width: '100%',
          marginTop: '16px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={handleDriveClick}
          className="glass-btn glass-btn-primary"
          style={{
            fontSize: 'clamp(18px, 4vw, 22px)',
            padding: '16px 32px',
            justifyContent: 'flex-start',
            gap: '16px',
            boxShadow: '0 8px 30px rgba(56, 189, 248, 0.45)',
          }}
        >
          <Play size={24} fill="currentColor" />
          <span>DRIVE</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { triggerHaptic(12); audioManager.playClick(); onOpenGarage(); }}
            className="glass-btn"
            style={{ flex: 1, justifyContent: 'center', padding: '12px 18px', fontSize: '13px' }}
          >
            <Compass size={18} color="#38bdf8" />
            <span>GARAGE</span>
          </button>

          <button
            onClick={() => { triggerHaptic(12); audioManager.playClick(); onOpenSettings(); }}
            className="glass-btn"
            style={{ flex: 1, justifyContent: 'center', padding: '12px 18px', fontSize: '13px' }}
          >
            <Sliders size={18} color="#38bdf8" />
            <span>SETTINGS</span>
          </button>
        </div>

        <button
          onClick={() => { triggerHaptic(12); audioManager.playClick(); onOpenAbout(); }}
          className="glass-btn"
          style={{ justifyContent: 'flex-start', padding: '12px 24px', fontSize: '13px' }}
        >
          <Info size={18} color="#38bdf8" />
          <span>ABOUT</span>
        </button>

        {/* World Seed Input Selector */}
        <div
          className="glass-panel"
          style={{
            padding: '10px 16px',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.65)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              World Seed
            </div>
            <input
              type="text"
              value={seedInput}
              onChange={handleSeedChange}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                fontWeight: 600,
                width: '100%',
                marginTop: '1px',
              }}
            />
          </div>
          <button
            onClick={handleRandomizeSeed}
            title="Randomize Seed"
            className="glass-btn"
            style={{ padding: '8px 10px', borderRadius: '8px' }}
          >
            <Shuffle size={14} />
          </button>
        </div>

        {/* Active Mobile Control Hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#94a3b8',
            marginTop: '2px',
          }}
        >
          <Smartphone size={13} color="#38bdf8" />
          <span>
            Mode: <strong style={{ color: '#ffffff' }}>{controlScheme === 'TILT' ? 'Phone Tilt (Gyro)' : 'Touch Buttons'}</strong>
          </span>
        </div>
      </div>

      {/* Bottom Bar: Stats & Controls hint */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={16} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Best Distance</div>
              <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {(bestDistance / 1000).toFixed(1)} km
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Route size={16} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Distance</div>
              <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {(totalDistance / 1000).toFixed(1)} km
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#64748b',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            WASD or Tilt Phone to Steer • Tap to Drive
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              letterSpacing: '0.5px',
            }}
          >
            © 2026 <strong style={{ color: '#f8fafc' }}>Imeth Mendis</strong> • All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  );
};

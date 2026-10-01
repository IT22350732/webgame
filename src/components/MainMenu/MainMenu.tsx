import React, { useState } from 'react';
import { Play, Compass, Sliders, Info, Shuffle, Award, Route } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { audioManager } from '../../game/audio/AudioManager';

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

  const [seedInput, setSeedInput] = useState(seed.toString());

  const handleRandomizeSeed = () => {
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

  const handleDriveClick = () => {
    audioManager.init();
    audioManager.resume();
    audioManager.playClick();
    onStartDrive();
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
      background: 'radial-gradient(circle at 50% 30%, rgba(3, 7, 18, 0.2) 0%, rgba(3, 7, 18, 0.75) 100%)',
    }}>
      {/* Top Header / Branding */}
      <div style={{ pointerEvents: 'auto' }}>
        <div style={{ display: 'inline-block' }}>
          <h1 style={{
            fontSize: '56px',
            fontWeight: 800,
            letterSpacing: '8px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #ffffff 40%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            lineHeight: 1.1,
            textShadow: '0 10px 30px rgba(56, 189, 248, 0.3)',
          }}>
            ROADSCAPE
          </h1>
          <p style={{
            fontSize: '18px',
            fontWeight: 400,
            letterSpacing: '4px',
            color: '#94a3b8',
            marginTop: '8px',
            textTransform: 'uppercase',
          }}>
            Drive. Explore. Relax.
          </p>
        </div>
      </div>

      {/* Center Left: Action Menu */}
      <div style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '360px',
      }}>
        <button
          onClick={handleDriveClick}
          className="glass-btn glass-btn-primary"
          style={{
            fontSize: '20px',
            padding: '18px 36px',
            justifyContent: 'flex-start',
            gap: '16px',
            boxShadow: '0 8px 30px rgba(56, 189, 248, 0.4)',
          }}
        >
          <Play size={24} fill="currentColor" />
          <span>DRIVE</span>
        </button>

        <button
          onClick={() => { audioManager.playClick(); onOpenGarage(); }}
          className="glass-btn"
          style={{ justifyContent: 'flex-start', padding: '14px 28px' }}
        >
          <Compass size={20} color="#38bdf8" />
          <span>GARAGE</span>
        </button>

        <button
          onClick={() => { audioManager.playClick(); onOpenSettings(); }}
          className="glass-btn"
          style={{ justifyContent: 'flex-start', padding: '14px 28px' }}
        >
          <Sliders size={20} color="#38bdf8" />
          <span>SETTINGS</span>
        </button>

        <button
          onClick={() => { audioManager.playClick(); onOpenAbout(); }}
          className="glass-btn"
          style={{ justifyContent: 'flex-start', padding: '14px 28px' }}
        >
          <Info size={20} color="#38bdf8" />
          <span>ABOUT</span>
        </button>

        {/* Seed Input Selector */}
        <div className="glass-panel" style={{
          padding: '14px 20px',
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.55)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                fontSize: '16px',
                fontWeight: 600,
                width: '100%',
                marginTop: '2px',
              }}
            />
          </div>
          <button
            onClick={handleRandomizeSeed}
            title="Randomize Seed"
            className="glass-btn"
            style={{ padding: '8px 12px', borderRadius: '8px' }}
          >
            <Shuffle size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Stats & Controls hint */}
      <div style={{
        pointerEvents: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={18} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Best Distance</div>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {(bestDistance / 1000).toFixed(1)} km
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Route size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Distance</div>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {(totalDistance / 1000).toFixed(1)} km
              </div>
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '13px',
          color: '#64748b',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          WASD to drive • C to switch camera • R to reset • ESC to pause
        </div>
      </div>
    </div>
  );
};

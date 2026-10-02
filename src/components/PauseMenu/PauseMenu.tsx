import React from 'react';
import { Play, RotateCcw, Sliders, Home } from 'lucide-react';
import { audioManager } from '../../game/audio/AudioManager';
import { triggerHaptic } from '../../utils/haptics';

interface PauseMenuProps {
  onResume: () => void;
  onRestartDrive: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestartDrive,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        padding: 'max(16px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          padding: 'clamp(24px, 5vw, 40px)',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontWeight: 800,
            letterSpacing: '4px',
            color: '#ffffff',
            marginBottom: '4px',
          }}
        >
          PAUSED
        </h2>

        <button
          onClick={() => { triggerHaptic(15); audioManager.playClick(); onResume(); }}
          className="glass-btn glass-btn-primary"
          style={{ padding: '16px', fontSize: '15px' }}
        >
          <Play size={18} fill="currentColor" />
          <span>RESUME DRIVE</span>
        </button>

        <button
          onClick={() => { triggerHaptic(15); audioManager.playClick(); onRestartDrive(); }}
          className="glass-btn"
          style={{ padding: '13px', fontSize: '14px' }}
        >
          <RotateCcw size={16} color="#38bdf8" />
          <span>RESTART DRIVE</span>
        </button>

        <button
          onClick={() => { triggerHaptic(15); audioManager.playClick(); onOpenSettings(); }}
          className="glass-btn"
          style={{ padding: '13px', fontSize: '14px' }}
        >
          <Sliders size={16} color="#38bdf8" />
          <span>SETTINGS</span>
        </button>

        <button
          onClick={() => { triggerHaptic(15); audioManager.playClick(); onMainMenu(); }}
          className="glass-btn"
          style={{ padding: '13px', fontSize: '14px' }}
        >
          <Home size={16} color="#38bdf8" />
          <span>MAIN MENU</span>
        </button>

        <div style={{ fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px', marginTop: '4px' }}>
          Owner: <strong style={{ color: '#38bdf8' }}>Imeth Mendis</strong> (All rights reserved)
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, RotateCcw, Sliders, Home } from 'lucide-react';
import { audioManager } from '../../game/audio/AudioManager';

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
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 40,
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 800,
          letterSpacing: '4px',
          color: '#ffffff',
          marginBottom: '8px',
        }}>
          PAUSED
        </h2>

        <button
          onClick={() => { audioManager.playClick(); onResume(); }}
          className="glass-btn glass-btn-primary"
          style={{ padding: '16px', fontSize: '16px' }}
        >
          <Play size={20} fill="currentColor" />
          <span>RESUME DRIVE</span>
        </button>

        <button
          onClick={() => { audioManager.playClick(); onRestartDrive(); }}
          className="glass-btn"
          style={{ padding: '14px' }}
        >
          <RotateCcw size={18} color="#38bdf8" />
          <span>RESTART DRIVE</span>
        </button>

        <button
          onClick={() => { audioManager.playClick(); onOpenSettings(); }}
          className="glass-btn"
          style={{ padding: '14px' }}
        >
          <Sliders size={18} color="#38bdf8" />
          <span>SETTINGS</span>
        </button>

        <button
          onClick={() => { audioManager.playClick(); onMainMenu(); }}
          className="glass-btn"
          style={{ padding: '14px' }}
        >
          <Home size={18} color="#38bdf8" />
          <span>MAIN MENU</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Play, RotateCcw, Sliders, Home, Maximize, Minimize, Share2, Link2, Check } from 'lucide-react';
import { audioManager } from '../../game/audio/AudioManager';
import { triggerHaptic } from '../../utils/haptics';
import { useFullscreen } from '../../utils/fullscreen';

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
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = async () => {
    triggerHaptic(15);
    audioManager.playClick();
    const gameUrl = typeof window !== 'undefined' ? (window.location.origin || window.location.href) : '';
    if (navigator.clipboard && gameUrl) {
      try {
        await navigator.clipboard.writeText(gameUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2200);
      } catch {
        // Fallback
      }
    }
    if (navigator.share && gameUrl) {
      try {
        await navigator.share({
          title: 'ROADSCAPE — by Imeth Mendis',
          text: 'Play ROADSCAPE — Endless 3D Scenic Driving Game with Phone Tilt Controls!',
          url: gameUrl,
        });
      } catch {
        // Dismiss
      }
    }
  };

  const handleToggleFullscreen = async () => {
    triggerHaptic(15);
    audioManager.playClick();
    await toggleFullscreen();
  };

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
          padding: 'clamp(20px, 4vw, 36px)',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        {/* Game Logo & Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <img
            src="/logo.png"
            alt="ROADSCAPE Logo"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(56, 189, 248, 0.7)',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            }}
          />
          <h2
            style={{
              fontSize: 'clamp(22px, 5vw, 26px)',
              fontWeight: 900,
              letterSpacing: '3px',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            <span style={{ color: '#ffffff' }}>ROAD</span>
            <span style={{ color: '#38bdf8' }}>SCAPE</span>
          </h2>
          <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>
            PAUSED
          </span>
        </div>

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
          onClick={handleToggleFullscreen}
          className="glass-btn"
          style={{ padding: '13px', fontSize: '14px' }}
        >
          {isFullscreen ? <Minimize size={16} color="#38bdf8" /> : <Maximize size={16} color="#38bdf8" />}
          <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN MODE'}</span>
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
          onClick={handleCopyUrl}
          className="glass-btn"
          style={{ padding: '13px', fontSize: '14px' }}
        >
          {copiedUrl ? <Check size={16} color="#22c55e" /> : <Share2 size={16} color="#38bdf8" />}
          <span>{copiedUrl ? 'COPIED GAME URL!' : 'SHARE GAME URL'}</span>
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

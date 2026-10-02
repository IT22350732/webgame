import React, { useState } from 'react';
import { Play, Compass, Sliders, Info, Shuffle, Award, Route, Smartphone, ShieldCheck, Maximize, Minimize, Share2, Link2, Check } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { audioManager } from '../../game/audio/AudioManager';
import { tiltManager } from '../../utils/tiltManager';
import { triggerHaptic } from '../../utils/haptics';
import { useFullscreen } from '../../utils/fullscreen';

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
        setTimeout(() => setCopiedUrl(false), 2500);
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
        background: 'radial-gradient(circle at 50% 30%, rgba(3, 7, 18, 0.05) 0%, rgba(3, 7, 18, 0.45) 100%)',
        overflowY: 'auto',
      }}
    >
      {/* Top Header / Branding & Quick Controls */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand Lockup: Logo Badge + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2.5vw, 20px)' }}>
          <img
            src="/logo.png"
            alt="ROADSCAPE Game Logo"
            style={{
              width: 'clamp(58px, 12vw, 84px)',
              height: 'clamp(58px, 12vw, 84px)',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2.5px solid rgba(56, 189, 248, 0.75)',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.5), 0 8px 24px rgba(0, 0, 0, 0.6)',
              flexShrink: 0,
            }}
          />

          <div>
            <h1
              style={{
                fontSize: 'clamp(32px, 7vw, 54px)',
                fontWeight: 900,
                letterSpacing: 'clamp(3px, 1.2vw, 7px)',
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: 1.05,
                filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))',
              }}
            >
              <span style={{ color: '#ffffff' }}>ROAD</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #38bdf8 20%, #0284c7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SCAPE
              </span>
            </h1>
            <p
              style={{
                fontSize: 'clamp(10px, 2vw, 13px)',
                fontWeight: 600,
                letterSpacing: 'clamp(2px, 0.6vw, 4px)',
                color: '#94a3b8',
                marginTop: '4px',
                textTransform: 'uppercase',
              }}
            >
              Endless Scenic Driving Experience
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
              {/* Prominent Owner Notice */}
              <div
                className="glass-panel"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  background: 'rgba(56, 189, 248, 0.16)',
                  borderColor: 'rgba(56, 189, 248, 0.45)',
                  boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
                }}
              >
                <ShieldCheck size={14} color="#38bdf8" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.4px' }}>
                  Owner: <strong style={{ color: '#38bdf8' }}>Imeth Mendis</strong> (All rights reserved)
                </span>
              </div>

              {/* Game URL Pill with Copy & Share */}
              <button
                onClick={handleCopyUrl}
                className="glass-btn"
                title="Copy / Share Game URL"
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  gap: '6px',
                  minHeight: '26px',
                  background: copiedUrl ? 'rgba(34, 197, 94, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                  borderColor: copiedUrl ? '#22c55e' : 'rgba(56, 189, 248, 0.3)',
                }}
              >
                {copiedUrl ? <Check size={13} color="#22c55e" /> : <Link2 size={13} color="#38bdf8" />}
                <span style={{ color: copiedUrl ? '#86efac' : '#cbd5e1' }}>
                  {copiedUrl ? 'Copied Game URL!' : 'Share Game URL'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Right Header Controls (Share & Fullscreen) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleCopyUrl}
            className="glass-btn"
            title="Share Game URL"
            style={{
              padding: '10px 14px',
              borderRadius: '14px',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {copiedUrl ? <Check size={15} color="#22c55e" /> : <Share2 size={15} color="#38bdf8" />}
            <span>{copiedUrl ? 'COPIED' : 'SHARE'}</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="glass-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{
              padding: '10px 16px',
              borderRadius: '14px',
              gap: '8px',
              fontSize: '12px',
              letterSpacing: '0.8px',
              fontWeight: 700,
              background: isFullscreen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              borderColor: isFullscreen ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
              boxShadow: isFullscreen ? '0 0 16px rgba(56, 189, 248, 0.3)' : undefined,
              flexShrink: 0,
            }}
          >
            {isFullscreen ? <Minimize size={16} color="#38bdf8" /> : <Maximize size={16} color="#38bdf8" />}
            <span>{isFullscreen ? 'FULLSCREEN ON' : 'FULLSCREEN'}</span>
          </button>
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleCopyUrl}
              title="Copy Game URL"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                color: '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                padding: 0,
              }}
            >
              <Link2 size={11} />
              <span>{copiedUrl ? 'URL Copied!' : 'Game URL'}</span>
            </button>
            <span style={{ color: '#475569' }}>•</span>
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
    </div>
  );
};

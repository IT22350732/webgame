import React, { useEffect, useState } from 'react';
import { RotateCw, X } from 'lucide-react';

export const OrientationHint: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (!isMobile) {
        setIsPortrait(false);
        return;
      }

      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || isDismissed) return null;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 45,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 18px',
        background: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(56, 189, 248, 0.5)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.25)',
        maxWidth: '92vw',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'spin 4s linear infinite',
        }}
      >
        <RotateCw size={18} color="#38bdf8" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
          Rotate Device to Landscape
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Tilt steering & wide vistas feel best in widescreen
        </div>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="glass-btn"
        style={{
          padding: '6px',
          minWidth: '28px',
          height: '28px',
          borderRadius: '50%',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

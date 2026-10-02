import React, { useState, useEffect } from 'react';
import { Share, X, Check } from 'lucide-react';
import { isIOS, isStandalone, subscribeFullscreen } from '../../utils/fullscreen';

export const IosFullscreenToast: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only relevant for iOS devices that are not already launched in standalone PWA mode
    if (!isIOS() || isStandalone()) return;

    // Show when fullscreen is toggled on iOS Safari, if not dismissed in this session
    const hasDismissedSession = sessionStorage.getItem('ios_fs_dismissed');

    const unsubscribe = subscribeFullscreen((active) => {
      if (active && !hasDismissedSession) {
        setShow(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('ios_fs_dismissed', '1');
  };

  if (!show) return null;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'fixed',
        bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        maxWidth: '420px',
        width: 'calc(100% - 32px)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.92)',
        borderColor: 'rgba(56, 189, 248, 0.45)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.25)',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Share size={18} color="#38bdf8" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
          Full Screen on iPhone Safari
        </div>
        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
          Tap Safari <strong style={{ color: '#38bdf8' }}>Share ⎋</strong> → <strong style={{ color: '#ffffff' }}>Add to Home Screen ⊞</strong> for 100% borderless display!
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="glass-btn"
        title="Dismiss"
        style={{
          padding: '6px 10px',
          fontSize: '11px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.25)',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          flexShrink: 0,
          gap: '4px',
        }}
      >
        <Check size={13} />
        <span>Got it</span>
      </button>

      <button
        onClick={handleDismiss}
        aria-label="Close"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
};

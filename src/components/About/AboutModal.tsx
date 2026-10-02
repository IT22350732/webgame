import React from 'react';
import { X, Sparkles, Keyboard, Smartphone, ShieldCheck } from 'lucide-react';
import { audioManager } from '../../game/audio/AudioManager';
import { triggerHaptic } from '../../utils/haptics';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 'max(14px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left))',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 'clamp(20px, 4vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
              ABOUT ROADSCAPE
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Endless Scenic Driving Experience
            </p>
          </div>
          <button
            onClick={() => { triggerHaptic(12); audioManager.playClick(); onClose(); }}
            className="glass-btn"
            style={{ padding: '8px', borderRadius: '50%', minWidth: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Ownership & Copyright Banner */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 4px 18px rgba(56, 189, 248, 0.18)',
          }}
        >
          <ShieldCheck size={24} color="#38bdf8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
              Owner & Creator: <span style={{ color: '#38bdf8' }}>Imeth Mendis</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              © 2026 Imeth Mendis. All rights reserved.
            </div>
          </div>
        </div>

        {/* Narrative / Features */}
        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
          <strong>ROADSCAPE</strong> is a relaxing, endless procedural driving game built for pure immersion.
          There are no timers, no aggressive finish lines, and no stress. Just an open scenic road stretching into the horizon across rolling meadows, pine woodlands, alpine ridges, ocean coastlines, and badlands.
        </p>

        {/* Mobile & Tilt Controls Reference */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={16} /> MOBILE & TILT (GYROSCOPE)
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
            • <strong>Steering:</strong> Tilt your phone left or right like a real steering wheel.<br />
            • <strong>Pedals:</strong> Right thumb accelerates; Left thumb brakes & reverses.<br />
            • <strong>Recenter:</strong> Tap the RECENTER button on the HUD to zero your phone angle.<br />
            • <strong>Mode Switch:</strong> Switch between Gyro Tilt and Touch Buttons anytime via HUD or Settings.
          </div>
        </div>

        {/* Keyboard Controls Reference */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Keyboard size={16} color="#38bdf8" /> DESKTOP KEYBOARD CONTROLS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
            <div><strong style={{ color: '#ffffff' }}>W / Up</strong>: Accelerate</div>
            <div><strong style={{ color: '#ffffff' }}>S / Down</strong>: Brake / Reverse</div>
            <div><strong style={{ color: '#ffffff' }}>A / D</strong>: Steer</div>
            <div><strong style={{ color: '#ffffff' }}>Space</strong>: Handbrake</div>
            <div><strong style={{ color: '#ffffff' }}>C</strong>: 4 Camera Views</div>
            <div><strong style={{ color: '#ffffff' }}>R</strong>: Reset to Road</div>
            <div><strong style={{ color: '#ffffff' }}>ESC</strong>: Pause Menu</div>
            <div><strong style={{ color: '#ffffff' }}>F3</strong>: Debug Telemetry</div>
          </div>
        </div>

        {/* Technologies note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
          <Sparkles size={14} color="#f59e0b" />
          <span>Built with React 19, TypeScript, Three.js, DeviceOrientation API, and Web Audio.</span>
        </div>

        <button
          onClick={() => { triggerHaptic(12); audioManager.playClick(); onClose(); }}
          className="glass-btn glass-btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '14px' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

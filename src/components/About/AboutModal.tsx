import React from 'react';
import { X, Heart, ShieldCheck, Sparkles, Keyboard } from 'lucide-react';
import { audioManager } from '../../game/audio/AudioManager';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '540px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
              ABOUT ROADSCAPE
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Endless Scenic Driving Experience
            </p>
          </div>
          <button
            onClick={() => { audioManager.playClick(); onClose(); }}
            className="glass-btn"
            style={{ padding: '8px', borderRadius: '50%', minWidth: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Narrative / Features */}
        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6 }}>
          <strong>ROADSCAPE</strong> is a relaxing, endless procedural driving game built for pure immersion.
          There are no timers, no aggressive finish lines, and no stress. Just an open scenic road stretching into the horizon across rolling meadows, pine woodlands, alpine ridges, ocean coastlines, and badlands.
        </p>

        {/* Controls Quick Reference */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Keyboard size={16} /> KEYBOARD CONTROLS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <div><strong style={{ color: '#ffffff' }}>W / Up</strong>: Accelerate</div>
            <div><strong style={{ color: '#ffffff' }}>S / Down</strong>: Brake / Reverse</div>
            <div><strong style={{ color: '#ffffff' }}>A / D / Left / Right</strong>: Steer</div>
            <div><strong style={{ color: '#ffffff' }}>Space</strong>: Handbrake</div>
            <div><strong style={{ color: '#ffffff' }}>C</strong>: Cycle 4 Camera Views</div>
            <div><strong style={{ color: '#ffffff' }}>R</strong>: Reset to Road</div>
            <div><strong style={{ color: '#ffffff' }}>ESC</strong>: Pause Menu</div>
            <div><strong style={{ color: '#ffffff' }}>F3</strong>: Debug Telemetry</div>
          </div>
        </div>

        {/* Technologies note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
          <Sparkles size={16} color="#f59e0b" />
          <span>Built with React 19, TypeScript, Three.js, and Web Audio API.</span>
        </div>

        <button
          onClick={() => { audioManager.playClick(); onClose(); }}
          className="glass-btn glass-btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

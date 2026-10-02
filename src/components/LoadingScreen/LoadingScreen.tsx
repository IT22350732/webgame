import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#030712',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      gap: '20px',
    }}>
      {/* Logo Badge */}
      <img
        src="/logo.png"
        alt="ROADSCAPE Logo"
        style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2.5px solid rgba(56, 189, 248, 0.8)',
          boxShadow: '0 0 35px rgba(56, 189, 248, 0.6), 0 8px 30px rgba(0, 0, 0, 0.8)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}
      />

      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 48px)',
          fontWeight: 900,
          letterSpacing: 'clamp(4px, 1.2vw, 8px)',
          margin: 0,
          lineHeight: 1.1,
        }}>
          <span style={{ color: '#ffffff' }}>ROAD</span>
          <span style={{ color: '#38bdf8' }}>SCAPE</span>
        </h1>
        <p style={{
          fontSize: '12px',
          color: '#94a3b8',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginTop: '6px',
        }}>
          Generating the road...
        </p>
      </div>

      {/* Spinner */}
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(56, 189, 248, 0.2)',
        borderTopColor: '#38bdf8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />

      <div style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.5px' }}>
        By <strong style={{ color: '#94a3b8' }}>Imeth Mendis</strong> • All Rights Reserved
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.4)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 28px rgba(56, 189, 248, 0.8)); }
        }
      `}</style>
    </div>
  );
};

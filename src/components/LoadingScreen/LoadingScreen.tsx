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
      <h1 style={{
        fontSize: '48px',
        fontWeight: 800,
        letterSpacing: '8px',
        color: '#ffffff',
        margin: 0,
      }}>
        ROADSCAPE
      </h1>
      <p style={{
        fontSize: '15px',
        color: '#94a3b8',
        letterSpacing: '3px',
        textTransform: 'uppercase',
      }}>
        Generating the road...
      </p>

      {/* Spinner */}
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(56, 189, 248, 0.2)',
        borderTopColor: '#38bdf8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

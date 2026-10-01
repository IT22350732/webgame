import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const DebugOverlay: React.FC = () => {
  const isDebugOpen = useGameStore((s) => s.isDebugOpen);
  const debugInfo = useGameStore((s) => s.debugInfo);

  if (!isDebugOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      zIndex: 100,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '8px',
      padding: '14px 18px',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      color: '#38bdf8',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minWidth: '220px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    }}>
      <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '4px', marginBottom: '2px' }}>
        ROADSCAPE TELEMETRY (F3)
      </div>
      <div>FPS: <strong style={{ color: debugInfo.fps >= 55 ? '#4ade80' : '#f87171' }}>{debugInfo.fps}</strong></div>
      <div>Draw Calls: <strong style={{ color: '#ffffff' }}>{debugInfo.drawCalls}</strong></div>
      <div>Triangles: <strong style={{ color: '#ffffff' }}>{debugInfo.triangles.toLocaleString()}</strong></div>
      <div>Speed: <strong style={{ color: '#ffffff' }}>{debugInfo.speedKmh} km/h</strong></div>
      <div>Position: <strong style={{ color: '#ffffff' }}>X:{debugInfo.position.x} Y:{debugInfo.position.y} Z:{debugInfo.position.z}</strong></div>
      <div>Biome: <strong style={{ color: '#f59e0b' }}>{debugInfo.biome}</strong></div>
      <div>Seed: <strong style={{ color: '#ffffff' }}>{debugInfo.seed}</strong></div>
      <div>Active Chunks: <strong style={{ color: '#ffffff' }}>{debugInfo.activeChunks}</strong></div>
      <div>Active Traffic: <strong style={{ color: '#ffffff' }}>{debugInfo.activeTraffic}</strong></div>
    </div>
  );
};

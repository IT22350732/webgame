import React from 'react';
import { X, Volume2, Monitor, Cloud, Compass, Navigation } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { audioManager } from '../../game/audio/AudioManager';
import {
  CameraMode,
  GraphicsQuality,
  TimeOfDay,
  TrafficSide,
  WeatherType,
} from '../../types/game';

interface SettingsModalProps {
  onClose: () => void;
  onApplySettings?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onApplySettings }) => {
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const handleVolumeChange = (type: 'master' | 'engine' | 'ambient', val: number) => {
    if (type === 'master') {
      updateSetting('masterVolume', val);
      audioManager.setVolumes(val, settings.engineVolume, settings.ambientVolume);
    } else if (type === 'engine') {
      updateSetting('engineVolume', val);
      audioManager.setVolumes(settings.masterVolume, val, settings.ambientVolume);
    } else {
      updateSetting('ambientVolume', val);
      audioManager.setVolumes(settings.masterVolume, settings.engineVolume, val);
    }
  };

  const handleClose = () => {
    audioManager.playClick();
    onApplySettings?.();
    onClose();
  };

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
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
              SETTINGS
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Customize graphics, simulation, and sound
            </p>
          </div>
          <button
            onClick={handleClose}
            className="glass-btn"
            style={{ padding: '8px', borderRadius: '50%', minWidth: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Traffic & Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={16} /> Road & Traffic
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Traffic Side */}
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Traffic Driving Side
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['LEFT', 'RIGHT'] as TrafficSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => { audioManager.playClick(); updateSetting('trafficSide', side); onApplySettings?.(); }}
                    className="glass-btn"
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '13px',
                      background: settings.trafficSide === side ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.trafficSide === side ? '#38bdf8' : undefined,
                    }}
                  >
                    {side === 'LEFT' ? 'Left-Hand (Default)' : 'Right-Hand'}
                  </button>
                ))}
              </div>
            </div>

            {/* Traffic Density */}
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Traffic Density
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['OFF', 'LOW', 'MEDIUM', 'HIGH'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => { audioManager.playClick(); updateSetting('trafficDensity', density); onApplySettings?.(); }}
                    className="glass-btn"
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      fontSize: '12px',
                      background: settings.trafficDensity === density ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.trafficDensity === density ? '#38bdf8' : undefined,
                    }}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Environment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={16} /> Environment & Atmosphere
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Weather */}
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Weather Condition
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(['DYNAMIC', 'CLEAR', 'RAIN', 'FOG'] as ('DYNAMIC' | WeatherType)[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => { audioManager.playClick(); updateSetting('weather', w); onApplySettings?.(); }}
                    className="glass-btn"
                    style={{
                      flex: '1 0 45%',
                      padding: '8px',
                      fontSize: '12px',
                      background: settings.weather === w ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.weather === w ? '#38bdf8' : undefined,
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Time of Day
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(['DYNAMIC', 'DAY', 'SUNSET', 'NIGHT'] as ('DYNAMIC' | TimeOfDay)[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { audioManager.playClick(); updateSetting('timeOfDay', t); onApplySettings?.(); }}
                    className="glass-btn"
                    style={{
                      flex: '1 0 45%',
                      padding: '8px',
                      fontSize: '12px',
                      background: settings.timeOfDay === t ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.timeOfDay === t ? '#38bdf8' : undefined,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Audio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={16} /> Audio Levels
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Master Volume</span>
                <span style={{ color: '#ffffff' }}>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Engine Sound</span>
                <span style={{ color: '#ffffff' }}>{Math.round(settings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.engineVolume}
                onChange={(e) => handleVolumeChange('engine', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Ambient (Wind & Rain)</span>
                <span style={{ color: '#ffffff' }}>{Math.round(settings.ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ambientVolume}
                onChange={(e) => handleVolumeChange('ambient', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Graphics & Camera */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={16} /> Graphics & Camera
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Graphics Quality
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => { audioManager.playClick(); updateSetting('graphicsQuality', q); }}
                    className="glass-btn"
                    style={{
                      flex: 1,
                      padding: '8px 2px',
                      fontSize: '11px',
                      background: settings.graphicsQuality === q ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.graphicsQuality === q ? '#38bdf8' : undefined,
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Default Camera View
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['CHASE', 'HOOD'] as CameraMode[]).map((cam) => (
                  <button
                    key={cam}
                    onClick={() => { audioManager.playClick(); updateSetting('defaultCamera', cam); }}
                    className="glass-btn"
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: '12px',
                      background: settings.defaultCamera === cam ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.defaultCamera === cam ? '#38bdf8' : undefined,
                    }}
                  >
                    {cam === 'CHASE' ? 'Third Person' : 'Interior Cockpit'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="glass-btn glass-btn-primary"
          style={{ width: '100%', padding: '14px', marginTop: '8px' }}
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};

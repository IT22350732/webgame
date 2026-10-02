import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Monitor,
  Cloud,
  Navigation,
  Smartphone,
  Crosshair,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { audioManager } from '../../game/audio/AudioManager';
import { tiltManager } from '../../utils/tiltManager';
import { triggerHaptic } from '../../utils/haptics';
import { useFullscreen } from '../../utils/fullscreen';
import {
  CameraMode,
  ControlScheme,
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

  const { isFullscreen, toggleFullscreen, isIOS } = useFullscreen();
  const [liveTiltAngle, setLiveTiltAngle] = useState(0);

  useEffect(() => {
    tiltManager.startListening();
    const unsub = tiltManager.subscribe((st) => {
      setLiveTiltAngle(Math.round(st.calibratedAngle));
    });
    return () => {
      unsub();
      // Keep listening if in game or tilt mode
      if (settings.controlScheme !== 'TILT') {
        tiltManager.stopListening();
      }
    };
  }, [settings.controlScheme]);

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

  const handleCalibrate = () => {
    triggerHaptic(20);
    tiltManager.calibrate();
  };

  const handleRequestMotion = async () => {
    triggerHaptic(20);
    await tiltManager.requestPermission();
    tiltManager.calibrate();
  };

  const handleClose = () => {
    triggerHaptic(15);
    audioManager.playClick();
    onApplySettings?.();
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 'max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 'clamp(20px, 4vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
              SETTINGS
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Customize driving controls, simulation, and visuals
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

        {/* Section 0: Mobile Controls & Tilt Steering */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Smartphone size={16} /> Mobile & Steering Controls
          </h4>

          {/* Scheme Select: Tilt vs Touch */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Steering Input Method
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['TILT', 'TOUCH'] as ControlScheme[]).map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => {
                    triggerHaptic(15);
                    audioManager.playClick();
                    updateSetting('controlScheme', scheme);
                    if (scheme === 'TILT') {
                      tiltManager.startListening();
                    }
                  }}
                  className="glass-btn"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background:
                      settings.controlScheme === scheme
                        ? 'rgba(56, 189, 248, 0.3)'
                        : undefined,
                    borderColor: settings.controlScheme === scheme ? '#38bdf8' : undefined,
                  }}
                >
                  {scheme === 'TILT' ? '📱 Phone Tilt (Gyro)' : '🕹️ Touch Buttons'}
                </button>
              ))}
            </div>
          </div>

          {/* Tilt Controls Fine-Tuning */}
          {settings.controlScheme === 'TILT' && (
            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Gyro Sensor Calibration & Live Angle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                    Current Tilt: <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{liveTiltAngle}°</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Hold phone in your natural posture and tap Recenter
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {tiltManager.getPermissionState() === 'prompt' && (
                    <button
                      onClick={handleRequestMotion}
                      className="glass-btn"
                      style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(56, 189, 248, 0.3)' }}
                    >
                      Authorize Sensors
                    </button>
                  )}
                  <button
                    onClick={handleCalibrate}
                    className="glass-btn"
                    style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}
                  >
                    <Crosshair size={14} color="#38bdf8" />
                    <span>Recenter Zero</span>
                  </button>
                </div>
              </div>

              {/* Sensitivity Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>Tilt Steering Sensitivity</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(settings.tiltSensitivity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.tiltSensitivity}
                  onChange={(e) => updateSetting('tiltSensitivity', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Deadzone Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>Center Deadzone (Prevents Wobble on Straights)</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {settings.tiltDeadzone}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="0.5"
                  value={settings.tiltDeadzone}
                  onChange={(e) => updateSetting('tiltDeadzone', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Toggle Options: Invert & Auto Cruise */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.tiltInvert}
                    onChange={(e) => updateSetting('tiltInvert', e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                  />
                  <span>Invert Tilt Steering</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoAccelerate}
                    onChange={(e) => updateSetting('autoAccelerate', e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                  />
                  <span>Auto-Accelerate (Cruising Mode)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.hapticFeedback}
                    onChange={(e) => updateSetting('hapticFeedback', e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                  />
                  <span>Haptic Vibration Feedback</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Traffic & Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={16} /> Road & Traffic
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                      padding: '10px 4px',
                      fontSize: '12px',
                      background: settings.trafficSide === side ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.trafficSide === side ? '#38bdf8' : undefined,
                    }}
                  >
                    {side === 'LEFT' ? 'Left-Hand' : 'Right-Hand'}
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
                      padding: '10px 2px',
                      fontSize: '11px',
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
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={16} /> Environment & Atmosphere
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                      fontSize: '11px',
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
                      fontSize: '11px',
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
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={16} /> Audio Levels
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
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
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={16} /> Graphics & Camera
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                      fontSize: '11px',
                      background: settings.defaultCamera === cam ? 'rgba(56, 189, 248, 0.3)' : undefined,
                      borderColor: settings.defaultCamera === cam ? '#38bdf8' : undefined,
                    }}
                  >
                    {cam === 'CHASE' ? 'Third Person' : 'Cockpit'}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Mode (Windowed vs Fullscreen) */}
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Screen Display Mode
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (isFullscreen) {
                      triggerHaptic(15);
                      audioManager.playClick();
                      await toggleFullscreen();
                    }
                  }}
                  className="glass-btn"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '11px',
                    gap: '6px',
                    background: !isFullscreen ? 'rgba(56, 189, 248, 0.3)' : undefined,
                    borderColor: !isFullscreen ? '#38bdf8' : undefined,
                  }}
                >
                  <Minimize size={13} />
                  <span>Windowed</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!isFullscreen) {
                      triggerHaptic(15);
                      audioManager.playClick();
                      await toggleFullscreen();
                    }
                  }}
                  className="glass-btn"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '11px',
                    gap: '6px',
                    background: isFullscreen ? 'rgba(56, 189, 248, 0.3)' : undefined,
                    borderColor: isFullscreen ? '#38bdf8' : undefined,
                  }}
                >
                  <Maximize size={13} />
                  <span>Fullscreen</span>
                </button>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                {isIOS ? 'Supports iPhone Safari (immersive mode & PWA)' : 'Border-free immersive driving view'}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="glass-btn glass-btn-primary"
          style={{ width: '100%', padding: '14px', marginTop: '6px' }}
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};

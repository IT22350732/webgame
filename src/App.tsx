import React, { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { MainMenu } from './components/MainMenu/MainMenu';
import { GameHUD } from './components/GameUI/GameHUD';
import { MobileControls } from './components/GameUI/MobileControls';
import { OrientationHint } from './components/GameUI/OrientationHint';
import { CarSelector } from './components/CarSelector/CarSelector';
import { SettingsModal } from './components/Settings/SettingsModal';
import { PauseMenu } from './components/PauseMenu/PauseMenu';
import { AboutModal } from './components/About/AboutModal';
import { DebugOverlay } from './components/DebugOverlay/DebugOverlay';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { IosFullscreenToast } from './components/GameUI/IosFullscreenToast';
import { CarInputs } from './game/car/CarPhysics';
import { toggleFullscreen } from './utils/fullscreen';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const toggleDebug = useGameStore((s) => s.toggleDebug);
  const cycleCameraMode = useGameStore((s) => s.cycleCameraMode);

  const [isWebGlSupported] = useState(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      return !!gl;
    } catch {
      return false;
    }
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Game Engine
  useEffect(() => {
    if (!isWebGlSupported) return;

    if (containerRef.current && !gameRef.current) {
      gameRef.current = new Game(containerRef.current);
    }

    // Key listeners (F3 for debug, F for fullscreen)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        toggleDebug();
      } else if (e.code === 'KeyF') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
  }, [toggleDebug, isWebGlSupported]);

  // Keep screen awake while driving (WakeLock API)
  useEffect(() => {
    let wakeLock: any = null;

    if (gameState === 'PLAYING' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock
        .request('screen')
        .then((lock: any) => {
          wakeLock = lock;
        })
        .catch(() => {});
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [gameState]);

  // Apply updated settings directly to runtime subsystems
  const applySettingsToEngine = () => {
    if (!gameRef.current) return;
    const settings = useSettingsStore.getState().settings;
    gameRef.current.trafficManager.setDensity(settings.trafficDensity);
    gameRef.current.trafficManager.setTrafficSide(settings.trafficSide);
    gameRef.current.skySystem.setTimeSetting(settings.timeOfDay);
    gameRef.current.weatherSystem.setWeatherSetting(settings.weather);
    gameRef.current.setEnvironment(settings.environment);
    if (gameRef.current.carController) {
      gameRef.current.carController.cameraFollow.setBaseFov(settings.fov);
    }
  };

  const handleStartDrive = () => {
    setIsLoading(true);
    setGameState('LOADING');

    setTimeout(() => {
      if (gameRef.current) {
        gameRef.current.restartDrive();
      }
      setIsLoading(false);
      setGameState('PLAYING');
    }, 600);
  };

  const handleCarChanged = (carId: string) => {
    if (gameRef.current) {
      gameRef.current.initPlayerCar(carId);
    }
  };

  const handleTouchInputs = (inputs: CarInputs) => {
    if (gameRef.current) {
      gameRef.current.setTouchInputs(inputs);
    }
  };

  const handleResetCar = () => {
    if (gameRef.current) {
      gameRef.current.resetCarToRoad();
    }
  };

  if (!isWebGlSupported) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#f87171',
          fontSize: '20px',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        Your browser does not support WebGL required for this game.
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* 3D Scene Container */}
      <div ref={containerRef} className="game-canvas-container" />

      {/* Loading Overlay */}
      {isLoading && <LoadingScreen />}

      {/* Mobile Orientation Hint */}
      <OrientationHint />

      {/* iPhone Safari Fullscreen Guide Toast */}
      <IosFullscreenToast />

      {/* F3 Telemetry Overlay */}
      <DebugOverlay />

      {/* Screen States */}
      {gameState === 'MAIN_MENU' && (
        <MainMenu
          onStartDrive={handleStartDrive}
          onOpenGarage={() => setGameState('GARAGE')}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenAbout={() => setShowAboutModal(true)}
        />
      )}

      {gameState === 'GARAGE' && (
        <CarSelector
          onBack={() => setGameState('MAIN_MENU')}
          onCarChanged={handleCarChanged}
        />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          <GameHUD
            onPause={() => setGameState('PAUSED')}
            onResetCar={handleResetCar}
            onCycleCamera={() => {
              if (gameRef.current?.carController) {
                cycleCameraMode();
                gameRef.current.carController.cameraFollow.setMode(
                  useGameStore.getState().cameraMode
                );
              }
            }}
          />
          {gameState === 'PLAYING' && (
            <MobileControls
              onInputsChange={handleTouchInputs}
              onResetCar={handleResetCar}
            />
          )}
        </>
      )}

      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={() => setGameState('PLAYING')}
          onRestartDrive={() => {
            if (gameRef.current) {
              gameRef.current.restartDrive();
            }
            setGameState('PLAYING');
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
          onMainMenu={() => setGameState('MAIN_MENU')}
        />
      )}

      {/* Global Modals */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onApplySettings={applySettingsToEngine}
        />
      )}

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}
    </div>
  );
};

export default App;

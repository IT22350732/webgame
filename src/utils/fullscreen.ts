/**
 * Robust Cross-Platform Fullscreen Management
 * Supporting:
 * - Desktop Web (Chrome, Edge, Firefox, Safari on macOS)
 * - Mobile Android (Chrome, Firefox, Samsung Browser, etc.)
 * - Apple iOS (iPhones & iPads on Safari / WebKit)
 * 
 * On iPhone / iOS Safari where element.requestFullscreen is not supported or restricted,
 * this seamlessly falls back to an optimized Viewport Immersive (pseudo-fullscreen) mode,
 * collapses Safari navigation bars via window scroll adjustments, and provides Apple PWA guidance.
 */
import { useState, useEffect } from 'react';

// Vendor prefix types
type DocumentWithFullscreen = Document & {
  webkitFullscreenElement?: Element | null;
  webkitCurrentFullScreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitCancelFullScreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type ElementWithFullscreen = HTMLElement & {
  webkitRequestFullscreen?: (options?: any) => Promise<void> | void;
  webkitRequestFullScreen?: (options?: any) => Promise<void> | void;
  mozRequestFullScreen?: (options?: any) => Promise<void> | void;
  msRequestFullscreen?: (options?: any) => Promise<void> | void;
};

// Device & Browser Detection
export const isIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isIPhone = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPhone|iPod/.test(navigator.userAgent);
};

export const isSafari = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (navigator as any).standalone === true
  );
};

export const isNativeFullscreenSupported = (): boolean => {
  if (typeof document === 'undefined') return false;
  const doc = document.documentElement as ElementWithFullscreen;
  return !!(
    doc.requestFullscreen ||
    doc.webkitRequestFullscreen ||
    doc.webkitRequestFullScreen ||
    doc.mozRequestFullScreen ||
    doc.msRequestFullscreen
  );
};

// State
let pseudoFullscreenActive = false;
const listeners = new Set<(fs: boolean) => void>();

export const getFullscreenElement = (): Element | null => {
  if (typeof document === 'undefined') return null;
  const doc = document as DocumentWithFullscreen;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.webkitCurrentFullScreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
};

export const isFullscreen = (): boolean => {
  return !!getFullscreenElement() || pseudoFullscreenActive || isStandalone();
};

const notifyListeners = () => {
  const current = isFullscreen();
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch (e) {
      console.error('Error in fullscreen listener:', e);
    }
  });
};

/**
 * Apply or remove viewport pseudo-fullscreen styles to html/body
 */
const applyPseudoFullscreen = (enable: boolean) => {
  pseudoFullscreenActive = enable;
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  if (enable) {
    root.classList.add('pseudo-fullscreen-active');
    body.classList.add('pseudo-fullscreen-active');
    // On iOS Safari, trigger a micro scroll to collapse address/action bar into minimal UI
    window.scrollTo(0, 1);
    setTimeout(() => {
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event('resize'));
    }, 80);
  } else {
    root.classList.remove('pseudo-fullscreen-active');
    body.classList.remove('pseudo-fullscreen-active');
    window.dispatchEvent(new Event('resize'));
  }

  notifyListeners();
};

/**
 * Enter fullscreen mode (cross-platform with iPhone/Safari fallback)
 */
export const enterFullscreen = async (): Promise<boolean> => {
  const el = (document.documentElement || document.body) as ElementWithFullscreen;

  // 1. Try Native HTML5 Fullscreen API first (Works on Desktop, Mac Safari, Android Chrome/Firefox, iPadOS)
  const reqFn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.webkitRequestFullScreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;

  if (reqFn) {
    try {
      const res = reqFn.call(el, { navigationUI: 'hide' });
      if (res instanceof Promise) {
        await res;
      }

      // Try locking screen orientation to landscape on mobile if supported
      try {
        if ('orientation' in screen && 'lock' in (screen as any).orientation) {
          await (screen as any).orientation.lock('landscape').catch(() => {});
        }
      } catch {
        // Safe to ignore orientation lock rejections
      }

      notifyListeners();
      return true;
    } catch (err) {
      console.warn('Native fullscreen request rejected or not permitted; using fallback:', err);
    }
  }

  // 2. Fallback to Viewport Immersive Fullscreen Mode (Essential for iPhone / iOS Safari)
  applyPseudoFullscreen(true);
  return true;
};

/**
 * Exit fullscreen mode
 */
export const exitFullscreen = async (): Promise<void> => {
  const doc = document as DocumentWithFullscreen;

  if (getFullscreenElement()) {
    const exitFn =
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.webkitCancelFullScreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen;

    if (exitFn) {
      try {
        const res = exitFn.call(doc);
        if (res instanceof Promise) {
          await res;
        }
      } catch (err) {
        console.warn('Native exit fullscreen error:', err);
      }
    }
  }

  if (pseudoFullscreenActive) {
    applyPseudoFullscreen(false);
  }

  // Release orientation lock if present
  try {
    if ('orientation' in screen && 'unlock' in (screen as any).orientation) {
      (screen as any).orientation.unlock();
    }
  } catch {
    // Ignore
  }

  notifyListeners();
};

/**
 * Toggle Fullscreen
 */
export const toggleFullscreen = async (): Promise<boolean> => {
  if (isFullscreen()) {
    await exitFullscreen();
    return false;
  } else {
    return await enterFullscreen();
  }
};

/**
 * Subscribe to fullscreen changes
 */
export const subscribeFullscreen = (callback: (isFullscreen: boolean) => void): (() => void) => {
  listeners.add(callback);
  // Send initial state
  callback(isFullscreen());

  return () => {
    listeners.delete(callback);
  };
};

// Global event bindings
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const handleNativeFsChange = () => {
    notifyListeners();
    // Dispatch resize so Three.js camera & canvas adapt immediately
    window.dispatchEvent(new Event('resize'));
  };

  document.addEventListener('fullscreenchange', handleNativeFsChange);
  document.addEventListener('webkitfullscreenchange', handleNativeFsChange);
  document.addEventListener('mozfullscreenchange', handleNativeFsChange);
  document.addEventListener('MSFullscreenChange', handleNativeFsChange);

  // Allow ESC key to exit pseudo fullscreen on desktop
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && pseudoFullscreenActive) {
      exitFullscreen();
    }
  });
}

/**
 * React Hook for Fullscreen State and Actions
 */
export const useFullscreen = () => {
  const [fs, setFs] = useState(() => isFullscreen());
  const [ios] = useState(() => isIOS());
  const [iphone] = useState(() => isIPhone());
  const [safari] = useState(() => isSafari());

  useEffect(() => {
    return subscribeFullscreen((nextFs) => {
      setFs(nextFs);
    });
  }, []);

  return {
    isFullscreen: fs,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    isIOS: ios,
    isIPhone: iphone,
    isSafari: safari,
    isNativeSupported: isNativeFullscreenSupported(),
  };
};


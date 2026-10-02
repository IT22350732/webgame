import { useSettingsStore } from '../store/settingsStore';

/**
 * Universal Mobile Haptics Helper with safe fallback
 */
export const triggerHaptic = (pattern: number | number[] = 12) => {
  try {
    const enabled = useSettingsStore.getState().settings.hapticFeedback;
    if (!enabled) return;

    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore devices that block vibration or don't support it
  }
};

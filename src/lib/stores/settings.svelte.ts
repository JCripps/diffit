import { invoke } from '@tauri-apps/api/core';

const STORAGE_KEY = 'diff-it-settings';
const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 32;
const FONT_SIZE_STEP = 2;

interface Settings {
  fontSize: number;
}

function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') {
    return { fontSize: DEFAULT_FONT_SIZE };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        fontSize: typeof parsed.fontSize === 'number'
          ? Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed.fontSize))
          : DEFAULT_FONT_SIZE
      };
    }
  } catch {
    // Ignore parsing errors
  }

  return { fontSize: DEFAULT_FONT_SIZE };
}

function calculateZoomPercentage(fontSize: number): number {
  return Math.round((fontSize / DEFAULT_FONT_SIZE) * 100);
}

function updateMenuZoomLabel(fontSize: number) {
  const percentage = calculateZoomPercentage(fontSize);
  invoke('update_zoom_label', { percentage }).catch(() => {
    // Ignore errors (e.g., during SSR or if menu not ready)
  });
}

function createSettingsStore() {
  const initial = loadSettings();
  let fontSize = $state(initial.fontSize);

  // Update menu on initial load
  if (typeof window !== 'undefined') {
    // Delay to ensure Tauri is ready
    setTimeout(() => updateMenuZoomLabel(initial.fontSize), 100);
  }

  function persist() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize }));
    }
    updateMenuZoomLabel(fontSize);
  }

  return {
    get fontSize() {
      return fontSize;
    },

    get zoomPercentage() {
      return calculateZoomPercentage(fontSize);
    },

    increaseFontSize() {
      if (fontSize < MAX_FONT_SIZE) {
        fontSize = Math.min(MAX_FONT_SIZE, fontSize + FONT_SIZE_STEP);
        persist();
      }
    },

    decreaseFontSize() {
      if (fontSize > MIN_FONT_SIZE) {
        fontSize = Math.max(MIN_FONT_SIZE, fontSize - FONT_SIZE_STEP);
        persist();
      }
    },

    resetFontSize() {
      fontSize = DEFAULT_FONT_SIZE;
      persist();
    }
  };
}

export const settings = createSettingsStore();

// storage.js — localStorage persistence

const KEYS = {
  records:  'sft:records',
  settings: 'sft:settings',
};

export function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.records) || '[]');
  } catch {
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(KEYS.records, JSON.stringify(records));
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.settings) || 'null');
  } catch {
    return null;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export function clearAll() {
  localStorage.removeItem(KEYS.records);
  localStorage.removeItem(KEYS.settings);
}

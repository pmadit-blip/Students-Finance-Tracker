// state.js — in-memory state + CRUD

import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';

const DEFAULT_SETTINGS = {
  budgetCap:  1000,
  rateEUR:    0.92,
  categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'],
};

let records  = [];
let settings = { ...DEFAULT_SETTINGS };

// ── Bootstrap ──────────────────────────────────────────────
export function init() {
  records  = loadRecords();
  const saved = loadSettings();
  if (saved) settings = { ...DEFAULT_SETTINGS, ...saved };
}

// ── ID generator ───────────────────────────────────────────
function nextId() {
  const max = records.reduce((m, r) => {
    const n = parseInt(r.id.replace('txn_', ''), 10);
    return n > m ? n : m;
  }, 0);
  return `txn_${String(max + 1).padStart(4, '0')}`;
}

// ── Records CRUD ───────────────────────────────────────────
export function getRecords() { return [...records]; }

export function addRecord(data) {
  const now = new Date().toISOString();
  const record = {
    id:          nextId(),
    description: data.description,
    amount:      parseFloat(data.amount),
    category:    data.category,
    date:        data.date,
    createdAt:   now,
    updatedAt:   now,
  };
  records.push(record);
  saveRecords(records);
  return record;
}

export function updateRecord(id, data) {
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  records[idx] = {
    ...records[idx],
    description: data.description,
    amount:      parseFloat(data.amount),
    category:    data.category,
    date:        data.date,
    updatedAt:   new Date().toISOString(),
  };
  saveRecords(records);
  return records[idx];
}

export function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords(records);
}

// ── Settings ───────────────────────────────────────────────
export function getSettings() { return { ...settings }; }

export function updateSettings(data) {
  settings = { ...settings, ...data };
  saveSettings(settings);
}

// ── Import / Export ────────────────────────────────────────
export function exportJSON() {
  return JSON.stringify(records, null, 2);
}

export function importJSON(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  if (!Array.isArray(parsed)) throw new Error('JSON must be an array of records.');

  const required = ['id', 'description', 'amount', 'category', 'date'];
  parsed.forEach((r, i) => {
    required.forEach(key => {
      if (r[key] === undefined) throw new Error(`Record ${i + 1} is missing field: "${key}".`);
    });
    if (typeof r.amount !== 'number') throw new Error(`Record ${i + 1}: "amount" must be a number.`);
  });

  records = parsed.map(r => ({
    ...r,
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || new Date().toISOString(),
  }));
  saveRecords(records);
  return records.length;
}

// ── Stats helpers ──────────────────────────────────────────
export function getStats() {
  const total = records.length;
  const sum   = records.reduce((s, r) => s + r.amount, 0);

  const catTotals = {};
  records.forEach(r => {
    catTotals[r.category] = (catTotals[r.category] || 0) + r.amount;
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const cap       = settings.budgetCap;
  const budgetLeft = cap - sum;

  // last 7 days
  const today = new Date();
  const days  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const trend = days.map(day => ({
    day,
    label: new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
    amount: records
      .filter(r => r.date === day)
      .reduce((s, r) => s + r.amount, 0),
  }));

  return { total, sum, topCat, budgetLeft, cap, trend };
}

// ui.js — DOM rendering and event handling

import {
  getRecords, addRecord, updateRecord, deleteRecord,
  getSettings, updateSettings, getStats, importJSON, exportJSON,
} from './state.js';
import { validateForm, validateBudgetCap, validateRate } from './validators.js';
import { compileRegex, highlight, matchesSearch } from './search.js';

// ── DOM refs ───────────────────────────────────────────────
const sections   = document.querySelectorAll('.page-section');
const navLinks   = document.querySelectorAll('.nav-link');
const navToggle  = document.querySelector('.nav-toggle');
const primaryNav = document.getElementById('primary-nav');
const statusMsg  = document.getElementById('status-msg');
const alertMsg   = document.getElementById('alert-msg');

// Dashboard
const statTotal      = document.getElementById('stat-total');
const statSum        = document.getElementById('stat-sum');
const statTopCat     = document.getElementById('stat-top-cat');
const statBudgetLeft = document.getElementById('stat-budget-left');
const budgetBarFill  = document.getElementById('budget-bar-fill');
const budgetBarPct   = document.getElementById('budget-bar-pct');
const budgetCapLabel = document.getElementById('budget-cap-label');
const budgetBarTrack = document.querySelector('.budget-bar-track');
const trendChart     = document.getElementById('trend-chart');

// Transactions
const searchInput    = document.getElementById('search-input');
const searchCase     = document.getElementById('search-case');
const searchError    = document.getElementById('search-error');
const filterCategory = document.getElementById('filter-category');
const sortSelect     = document.getElementById('sort-select');
const recordsContainer = document.getElementById('records-container');
const emptyState     = document.getElementById('empty-state');
const btnExport      = document.getElementById('btn-export');
const importFile     = document.getElementById('import-file');

// Form
const form        = document.getElementById('transaction-form');
const editIdInput = document.getElementById('edit-id');
const fDesc       = document.getElementById('f-description');
const fAmount     = document.getElementById('f-amount');
const fCategory   = document.getElementById('f-category');
const fDate       = document.getElementById('f-date');
const btnSubmit   = document.getElementById('btn-submit');
const btnCancel   = document.getElementById('btn-cancel');
const hAdd        = document.getElementById('h-add');

// Settings
const settingsForm  = document.getElementById('settings-form');
const sBudgetCap    = document.getElementById('s-budget-cap');
const sRateEUR      = document.getElementById('s-rate-eur');
const sCategories   = document.getElementById('s-categories');
const btnClearData  = document.getElementById('btn-clear-data');

// Footer
document.getElementById('footer-year').textContent = new Date().getFullYear();

// ── Navigation ─────────────────────────────────────────────
export function initNav() {
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showSection(link.dataset.section);
      if (primaryNav.classList.contains('open')) closeNav();
    });
  });

  navToggle.addEventListener('click', () => {
    const open = primaryNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  // close nav on outside click
  document.addEventListener('click', e => {
    if (!primaryNav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
  });

  // handle in-page anchor links (e.g. empty state "Add one!")
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-section]');
    if (a) { e.preventDefault(); showSection(a.dataset.section); }
  });
}

function closeNav() {
  primaryNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}

export function showSection(name) {
  sections.forEach(s => s.classList.toggle('active', s.id === `section-${name}`));
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === name));
  if (name === 'dashboard')    renderDashboard();
  if (name === 'transactions') renderTransactions();
  if (name === 'settings')     loadSettingsForm();
}

// ── ARIA announcements ─────────────────────────────────────
function announce(msg, urgent = false) {
  const el = urgent ? alertMsg : statusMsg;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

// ── Dashboard ──────────────────────────────────────────────
export function renderDashboard() {
  const { total, sum, topCat, budgetLeft, cap, trend } = getStats();
  const { rateEUR } = getSettings();

  statTotal.textContent     = total;
  statSum.textContent       = fmt(sum);
  statTopCat.textContent    = topCat;

  const left = budgetLeft;
  statBudgetLeft.textContent = fmt(Math.abs(left));
  statBudgetLeft.style.color = left < 0 ? 'var(--clr-danger)' : 'var(--clr-success)';

  const pct = Math.min((sum / cap) * 100, 100);
  budgetBarFill.style.width = `${pct}%`;
  budgetBarFill.classList.toggle('over', sum > cap);
  budgetBarPct.textContent  = `${Math.round((sum / cap) * 100)}%`;
  budgetCapLabel.textContent = fmt(cap);
  budgetBarTrack.setAttribute('aria-valuenow', Math.round(pct));

  if (sum > cap) {
    announce(`Warning: budget exceeded by ${fmt(Math.abs(left))}.`, true);
  } else if (sum > cap * 0.9) {
    announce(`Heads up: only ${fmt(left)} remaining in your budget.`);
  }

  renderTrend(trend);
}

function renderTrend(trend) {
  const maxAmt = Math.max(...trend.map(d => d.amount), 1);
  trendChart.innerHTML = trend.map(d => {
    const h = Math.round((d.amount / maxAmt) * 100);
    return `
      <div class="trend-bar-wrap">
        <div class="trend-bar" style="height:${h}%" data-amount="${fmt(d.amount)}"
             role="presentation" aria-hidden="true"></div>
        <span class="trend-label">${d.label}</span>
      </div>`;
  }).join('');
}

// ── Transactions ───────────────────────────────────────────
export function renderTransactions() {
  populateCategoryFilter();
  renderRecords();
}

function populateCategoryFilter() {
  const { categories } = getSettings();
  const current = filterCategory.value;
  filterCategory.innerHTML = '<option value="">All Categories</option>' +
    categories.map(c => `<option value="${c}"${c === current ? ' selected' : ''}>${c}</option>`).join('');
}

function getSortedFiltered() {
  const query    = searchInput.value.trim();
  const caseSens = searchCase.checked;
  const re       = compileRegex(query, caseSens);

  if (query && !re) {
    searchError.textContent = 'Invalid regex pattern.';
    searchError.hidden = false;
  } else {
    searchError.textContent = '';
    searchError.hidden = true;
  }

  const catFilter = filterCategory.value;
  const sortKey   = sortSelect.value;

  let list = getRecords().filter(r => {
    if (catFilter && r.category !== catFilter) return false;
    return matchesSearch(r, re);
  });

  list.sort((a, b) => {
    switch (sortKey) {
      case 'date-asc':   return a.date.localeCompare(b.date);
      case 'date-desc':  return b.date.localeCompare(a.date);
      case 'desc-asc':   return a.description.localeCompare(b.description);
      case 'desc-desc':  return b.description.localeCompare(a.description);
      case 'amount-asc': return a.amount - b.amount;
      case 'amount-desc':return b.amount - a.amount;
      default:           return 0;
    }
  });

  return { list, re };
}

function renderRecords() {
  const { list, re } = getSortedFiltered();
  const hasRecords = list.length > 0;

  // clear old content (keep empty-state node)
  const tableWrap = recordsContainer.querySelector('.table-wrap');
  const cardsWrap = recordsContainer.querySelector('.cards-wrap');
  if (tableWrap) tableWrap.remove();
  if (cardsWrap) cardsWrap.remove();

  emptyState.hidden = hasRecords;

  if (!hasRecords) return;

  recordsContainer.insertAdjacentHTML('beforeend', buildTable(list, re) + buildCards(list, re));
  attachRecordEvents();
}

function buildTable(list, re) {
  const rows = list.map(r => `
    <tr data-id="${r.id}">
      <td>${highlight(r.description, re)}</td>
      <td>${highlight(r.date, re)}</td>
      <td><span class="category-badge">${highlight(r.category, re)}</span></td>
      <td>${highlight(fmtAmount(r.amount), re)}</td>
      <td class="td-actions">
        <button class="btn btn-secondary btn-icon btn-edit" data-id="${r.id}" aria-label="Edit ${r.description}">Edit</button>
        <button class="btn btn-danger btn-icon btn-delete" data-id="${r.id}" aria-label="Delete ${r.description}">Delete</button>
      </td>
    </tr>`).join('');

  return `
    <div class="table-wrap">
      <table class="records-table" aria-label="Transactions">
        <thead>
          <tr>
            <th><button data-sort="desc-asc">Description</button></th>
            <th><button data-sort="date-desc">Date</button></th>
            <th>Category</th>
            <th><button data-sort="amount-desc">Amount</button></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildCards(list, re) {
  const cards = list.map(r => `
    <article class="record-card" data-id="${r.id}" aria-label="${r.description}">
      <div class="record-card-header">
        <span class="record-card-title">${highlight(r.description, re)}</span>
        <span class="record-card-amount">${fmtAmount(r.amount)}</span>
      </div>
      <div class="record-card-meta">
        <span>${highlight(r.date, re)}</span>
        <span class="category-badge">${highlight(r.category, re)}</span>
      </div>
      <div class="record-card-actions">
        <button class="btn btn-secondary btn-icon btn-edit" data-id="${r.id}" aria-label="Edit ${r.description}">Edit</button>
        <button class="btn btn-danger btn-icon btn-delete" data-id="${r.id}" aria-label="Delete ${r.description}">Delete</button>
      </div>
    </article>`).join('');

  return `<div class="cards-wrap">${cards}</div>`;
}

function attachRecordEvents() {
  // sort via table header buttons
  recordsContainer.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      sortSelect.value = btn.dataset.sort;
      renderRecords();
    });
  });

  // edit
  recordsContainer.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
  });

  // delete
  recordsContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
}

// ── Form ───────────────────────────────────────────────────
export function initForm() {
  form.addEventListener('submit', handleSubmit);
  btnCancel.addEventListener('click', resetForm);

  // live validation on blur
  [fDesc, fAmount, fCategory, fDate].forEach(el => {
    el.addEventListener('blur', () => validateField(el));
  });
}

function validateField(el) {
  const errors = validateForm({
    description: fDesc.value,
    amount:      fAmount.value,
    category:    fCategory.value,
    date:        fDate.value,
  });
  const key = { 'f-description': 'description', 'f-amount': 'amount',
                 'f-category': 'category', 'f-date': 'date' }[el.id];
  showFieldError(el, errors[key]);
}

function showFieldError(el, msg) {
  const errEl = document.getElementById(`err-${el.id.replace('f-', '')}`);
  if (!errEl) return;
  errEl.textContent = msg || '';
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

function handleSubmit(e) {
  e.preventDefault();
  const data = {
    description: fDesc.value,
    amount:      fAmount.value,
    category:    fCategory.value,
    date:        fDate.value,
  };
  const errors = validateForm(data);
  const hasErrors = Object.values(errors).some(Boolean);

  [fDesc, fAmount, fCategory, fDate].forEach(el => {
    const key = el.id.replace('f-', '');
    showFieldError(el, errors[key]);
  });

  if (hasErrors) {
    announce('Please fix the errors in the form.', true);
    return;
  }

  const id = editIdInput.value;
  if (id) {
    updateRecord(id, data);
    announce(`Transaction updated successfully.`);
  } else {
    addRecord(data);
    announce(`Transaction added successfully.`);
  }

  resetForm();
  renderDashboard();
}

function startEdit(id) {
  const rec = getRecords().find(r => r.id === id);
  if (!rec) return;

  editIdInput.value = rec.id;
  fDesc.value       = rec.description;
  fAmount.value     = String(rec.amount);
  fCategory.value   = rec.category;
  fDate.value       = rec.date;

  hAdd.textContent       = 'Edit Transaction';
  btnSubmit.textContent  = 'Save Changes';
  btnCancel.hidden       = false;

  showSection('add');
  fDesc.focus();
}

function resetForm() {
  form.reset();
  editIdInput.value      = '';
  hAdd.textContent       = 'Add Transaction';
  btnSubmit.textContent  = 'Add Transaction';
  btnCancel.hidden       = true;
  [fDesc, fAmount, fCategory, fDate].forEach(el => {
    el.setAttribute('aria-invalid', 'false');
    const errEl = document.getElementById(`err-${el.id.replace('f-', '')}`);
    if (errEl) errEl.textContent = '';
  });
}

// ── Delete confirm dialog ──────────────────────────────────
function confirmDelete(id) {
  const rec = getRecords().find(r => r.id === id);
  if (!rec) return;

  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'dlg-title');
  overlay.innerHTML = `
    <div class="dialog-box">
      <h2 id="dlg-title">Delete Transaction?</h2>
      <p>Are you sure you want to delete "<strong>${rec.description}</strong>"? This cannot be undone.</p>
      <div class="dialog-actions">
        <button class="btn btn-ghost" id="dlg-cancel">Cancel</button>
        <button class="btn btn-danger" id="dlg-confirm">Delete</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.getElementById('dlg-confirm').focus();

  document.getElementById('dlg-cancel').addEventListener('click', () => overlay.remove());
  document.getElementById('dlg-confirm').addEventListener('click', () => {
    deleteRecord(id);
    overlay.remove();
    renderTransactions();
    renderDashboard();
    announce(`Transaction "${rec.description}" deleted.`);
  });

  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.remove();
  });
}

// ── Search & filter events ─────────────────────────────────
export function initSearch() {
  searchInput.addEventListener('input', renderRecords);
  searchCase.addEventListener('change', renderRecords);
  filterCategory.addEventListener('change', renderRecords);
  sortSelect.addEventListener('change', renderRecords);
}

// ── Import / Export ────────────────────────────────────────
export function initIO() {
  btnExport.addEventListener('click', () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `finance-tracker-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    announce('Data exported successfully.');
  });

  importFile.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text  = await file.text();
      const count = importJSON(text);
      renderTransactions();
      renderDashboard();
      announce(`Imported ${count} records successfully.`);
    } catch (err) {
      announce(`Import failed: ${err.message}`, true);
    } finally {
      importFile.value = '';
    }
  });
}

// ── Settings ───────────────────────────────────────────────
export function initSettings() {
  settingsForm.addEventListener('submit', handleSettingsSave);
  btnClearData.addEventListener('click', confirmClearData);
}

function loadSettingsForm() {
  const s = getSettings();
  sBudgetCap.value  = String(s.budgetCap);
  sRateEUR.value    = String(s.rateEUR);
  sCategories.value = s.categories.join(',');
}

function handleSettingsSave(e) {
  e.preventDefault();

  const capErr  = validateBudgetCap(sBudgetCap.value);
  const rateErr = validateRate(sRateEUR.value);

  document.getElementById('err-budget-cap').textContent = capErr || '';
  document.getElementById('err-rate-eur').textContent   = rateErr || '';
  sBudgetCap.setAttribute('aria-invalid', capErr ? 'true' : 'false');
  sRateEUR.setAttribute('aria-invalid', rateErr ? 'true' : 'false');

  if (capErr || rateErr) {
    announce('Please fix settings errors.', true);
    return;
  }

  const rawCats = sCategories.value.split(',').map(c => c.trim()).filter(Boolean);
  const cats    = [...new Set(rawCats)];

  updateSettings({
    budgetCap:  parseFloat(sBudgetCap.value),
    rateEUR:    parseFloat(sRateEUR.value),
    categories: cats,
  });

  // sync category dropdowns
  populateCategoryFilter();
  syncFormCategories(cats);
  announce('Settings saved.');
}

function syncFormCategories(cats) {
  const current = fCategory.value;
  fCategory.innerHTML = '<option value="">— Select —</option>' +
    cats.map(c => `<option value="${c}"${c === current ? ' selected' : ''}>${c}</option>`).join('');
}

function confirmClearData() {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'dlg-clear-title');
  overlay.innerHTML = `
    <div class="dialog-box">
      <h2 id="dlg-clear-title">Clear All Data?</h2>
      <p>This will permanently delete all transactions and reset settings. This cannot be undone.</p>
      <div class="dialog-actions">
        <button class="btn btn-ghost" id="dlg-clear-cancel">Cancel</button>
        <button class="btn btn-danger" id="dlg-clear-confirm">Clear Everything</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.getElementById('dlg-clear-confirm').focus();

  document.getElementById('dlg-clear-cancel').addEventListener('click', () => overlay.remove());
  document.getElementById('dlg-clear-confirm').addEventListener('click', () => {
    import('./storage.js').then(({ clearAll }) => {
      clearAll();
      import('./state.js').then(({ init }) => {
        init();
        overlay.remove();
        renderDashboard();
        renderTransactions();
        loadSettingsForm();
        announce('All data cleared.', true);
      });
    });
  });

  overlay.addEventListener('keydown', e => { if (e.key === 'Escape') overlay.remove(); });
}

// ── Helpers ────────────────────────────────────────────────
function fmt(n)       { return `$${Number(n).toFixed(2)}`; }
function fmtAmount(n) { return `$${Number(n).toFixed(2)}`; }

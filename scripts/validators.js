// validators.js — all regex validation rules

// ── Patterns ───────────────────────────────────────────────

// Rule 1: no leading/trailing spaces, no double spaces
const RE_DESCRIPTION = /^\S(?:.*\S)?$/;

// Rule 2: positive number, up to 2 decimal places
const RE_AMOUNT = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

// Rule 3: YYYY-MM-DD
const RE_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Rule 4: letters, spaces, hyphens (category/tag)
const RE_CATEGORY = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// Rule 5 (advanced): lookahead — amount must not exceed 99999.99
// Ensures the integer part is at most 5 digits before the decimal
const RE_AMOUNT_RANGE = /^(?!0\d)\d{1,5}(\.\d{1,2})?$/;

// Rule 6 (advanced): back-reference — detect duplicate consecutive words
export const RE_DUPLICATE_WORD = /\b(\w+)\s+\1\b/i;

// ── Validators ─────────────────────────────────────────────

export function validateDescription(value) {
  if (!value || value.trim() === '') return 'Description is required.';
  if (!RE_DESCRIPTION.test(value))    return 'No leading/trailing spaces allowed.';
  if (RE_DUPLICATE_WORD.test(value))  return 'Duplicate consecutive words detected.';
  if (value.length > 120)             return 'Description must be 120 characters or fewer.';
  return null;
}

export function validateAmount(value) {
  if (!value || value.trim() === '') return 'Amount is required.';
  if (!RE_AMOUNT.test(value))        return 'Enter a valid amount (e.g. 12 or 12.50).';
  if (!RE_AMOUNT_RANGE.test(value))  return 'Amount must be between 0 and 99999.99.';
  return null;
}

export function validateDate(value) {
  if (!value) return 'Date is required.';
  if (!RE_DATE.test(value)) return 'Date must be in YYYY-MM-DD format.';
  return null;
}

export function validateCategory(value) {
  if (!value || value.trim() === '') return 'Category is required.';
  return null;
}

export function validateCategoryName(value) {
  if (!RE_CATEGORY.test(value)) return 'Only letters, spaces, and hyphens allowed.';
  return null;
}

export function validateBudgetCap(value) {
  if (!value || value.trim() === '') return 'Budget cap is required.';
  if (!RE_AMOUNT.test(value))        return 'Enter a valid number (e.g. 1000 or 1000.00).';
  return null;
}

export function validateRate(value) {
  if (!value || value.trim() === '') return 'Rate is required.';
  if (!RE_AMOUNT.test(value))        return 'Enter a valid rate (e.g. 0.92).';
  if (parseFloat(value) <= 0)        return 'Rate must be greater than 0.';
  return null;
}

// ── Validate full transaction form ─────────────────────────
export function validateForm({ description, amount, category, date }) {
  return {
    description: validateDescription(description),
    amount:      validateAmount(amount),
    category:    validateCategory(category),
    date:        validateDate(date),
  };
}

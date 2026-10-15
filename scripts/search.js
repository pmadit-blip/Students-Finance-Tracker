// search.js — safe regex compiler + highlight

/**
 * Safely compile a user-supplied regex string.
 * Returns null if input is empty or pattern is invalid.
 */
export function compileRegex(input, caseSensitive = false) {
  if (!input || input.trim() === '') return null;
  try {
    return new RegExp(input, caseSensitive ? 'g' : 'gi');
  } catch {
    return null;
  }
}

/**
 * Wrap regex matches in <mark> tags.
 * Escapes HTML in the text first to prevent XSS, then re-applies marks.
 */
export function highlight(text, re) {
  const escaped = escapeHtml(String(text));
  if (!re) return escaped;
  // reset lastIndex for global regexes
  re.lastIndex = 0;
  return escaped.replace(re, m => `<mark>${m}</mark>`);
}

/**
 * Test whether a record matches the regex against description, category, date.
 */
export function matchesSearch(record, re) {
  if (!re) return true;
  re.lastIndex = 0;
  return (
    re.test(record.description) ||
    re.test(record.category)    ||
    re.test(record.date)        ||
    re.test(String(record.amount))
  );
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

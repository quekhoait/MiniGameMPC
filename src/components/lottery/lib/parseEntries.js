// parseEntries.js - Robust parser for lottery list input
// Supports delimiter: '|', '\t', ',', auto-trimming and removing empty lines

export function parseEntries(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText.split(/\r?\n/);
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Detect delimiter
    let parts = [];
    if (rawLine.includes('|')) {
      parts = rawLine.split('|');
    } else if (rawLine.includes('\t')) {
      parts = rawLine.split('\t');
    } else if (rawLine.includes(',')) {
      parts = rawLine.split(',');
    } else {
      parts = [rawLine];
    }

    const title = (parts[0] || '').trim();
    const prize = (parts[1] || '').trim();
    const note = (parts.slice(2).join(' ') || '').trim();

    if (title) {
      result.push({
        id: `entry-${i + 1}-${Date.now().toString(36)}`,
        rawIndex: i + 1,
        title,
        prize: prize || 'Giải Thưởng',
        note,
        displayText: prize ? `${title} — ${prize}` : title
      });
    }
  }

  return result;
}

export function removeDuplicates(entries) {
  const seen = new Set();
  return entries.filter(e => {
    const key = `${e.title.toLowerCase()}||${e.prize.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}


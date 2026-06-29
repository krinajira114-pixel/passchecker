/* =========================================================
   generator.js — Password Generator
   Exports (globals):
     - generatePassword() → string
   Depends on: nothing (fully standalone)
   ========================================================= */


/* ── Generate a random password ─────────────────────────
   Reads options from the DOM checkboxes and length slider.
   Guarantees at least one character from every enabled pool,
   then Fisher-Yates shuffles the result.
   ──────────────────────────────────────────────────────── */
function generatePassword() {
  const len      = parseInt(document.getElementById('gen-length').value);
  const useUpper = document.getElementById('opt-upper').checked;
  const useLower = document.getElementById('opt-lower').checked;
  const useNums  = document.getElementById('opt-numbers').checked;
  const useSyms  = document.getElementById('opt-symbols').checked;

  // Build full charset + per-type pools
  const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  let charset = '';
  const pools = [];

  if (useUpper) { charset += UPPER;   pools.push(UPPER); }
  if (useLower) { charset += LOWER;   pools.push(LOWER); }
  if (useNums)  { charset += NUMBERS; pools.push(NUMBERS); }
  if (useSyms)  { charset += SYMBOLS; pools.push(SYMBOLS); }

  // Fallback if nothing is checked
  if (!charset) { charset = LOWER; pools.push(LOWER); }

  // Seed the array with one guaranteed character from each pool
  const arr = pools.map(pool => pool[Math.floor(Math.random() * pool.length)]);

  // Fill remaining slots from the combined charset
  while (arr.length < len) {
    arr.push(charset[Math.floor(Math.random() * charset.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, len).join('');
}

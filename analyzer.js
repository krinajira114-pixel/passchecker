/* =========================================================
   analyzer.js — Password Analysis Engine
   Exports (globals):
     - LEVELS         : strength level config array
     - analyzePassword(pwd)         → { checks, score, level, crackTime }
     - estimateCrackTime(pwd, checks) → string
     - buildRecommendations(pwd, checks, score, level) → string[]
   ========================================================= */


/* ── Strength level config ── */
const LEVELS = [
  { label: 'Very Weak', color: '#ef4444', pips: 1, pct: 10 },
  { label: 'Weak',      color: '#f97316', pips: 2, pct: 28 },
  { label: 'Fair',      color: '#eab308', pips: 3, pct: 50 },
  { label: 'Good',      color: '#3b82f6', pips: 4, pct: 72 },
  { label: 'Strong',    color: '#22c55e', pips: 5, pct: 96 },
];


/* ── Analyze a password ──────────────────────────────────
   Returns an object with:
     checks    – which rules pass (boolean flags)
     score     – 0-100 numeric score
     level     – index into LEVELS (0-4)
     crackTime – human-readable estimated crack time
   ──────────────────────────────────────────────────────── */
function analyzePassword(pwd) {
  const checks = {
    length:  pwd.length >= 8,
    upper:   /[A-Z]/.test(pwd),
    lower:   /[a-z]/.test(pwd),
    number:  /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };

  // Build score out of 100
  let score = 0;
  if (pwd.length >= 8)  score += 15;
  if (pwd.length >= 12) score += 10;
  if (pwd.length >= 16) score += 10;
  if (pwd.length >= 20) score += 5;
  if (checks.upper)     score += 15;
  if (checks.lower)     score += 15;
  if (checks.number)    score += 15;
  if (checks.special)   score += 15;

  // Penalise repeated characters
  const uniqueRatio = new Set(pwd.split('')).size / pwd.length;
  score = Math.round(score * (0.6 + 0.4 * uniqueRatio));
  score = Math.min(100, score);

  // Map score to level index (0–4)
  let level;
  if      (score < 20) level = 0;
  else if (score < 40) level = 1;
  else if (score < 60) level = 2;
  else if (score < 80) level = 3;
  else                 level = 4;

  const crackTime = estimateCrackTime(pwd, checks);

  return { checks, score, level, crackTime };
}


/* ── Estimate crack time ─────────────────────────────────
   Uses entropy (bits) and assumes a 10-billion-guess/sec
   GPU cluster (conservative modern attacker).
   ──────────────────────────────────────────────────────── */
function estimateCrackTime(pwd, checks) {
  if (pwd.length === 0) return '—';

  // Determine character-set size from what the password uses
  let charsetSize = 0;
  if (checks.lower)   charsetSize += 26;
  if (checks.upper)   charsetSize += 26;
  if (checks.number)  charsetSize += 10;
  if (checks.special) charsetSize += 32;
  if (charsetSize === 0) charsetSize = 26; // fallback

  const entropy           = pwd.length * Math.log2(charsetSize);
  const guessesPerSec     = 1e10; // 10 billion/sec
  const totalCombinations = Math.pow(2, entropy);
  const seconds           = totalCombinations / (2 * guessesPerSec);

  if (seconds < 1)        return 'Instant';
  if (seconds < 60)       return `${Math.round(seconds)}s`;
  if (seconds < 3600)     return `${Math.round(seconds / 60)} mins`;
  if (seconds < 86400)    return `${Math.round(seconds / 3600)} hrs`;
  if (seconds < 2592000)  return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3.15e9)   return `${Math.round(seconds / 31536000)} years`;
  if (seconds < 3.15e12)  return `${(seconds / 3.15e9).toFixed(1)}k yrs`;
  if (seconds < 3.15e15)  return `${(seconds / 3.15e12).toFixed(1)}M yrs`;
  return 'Centuries';
}


/* ── Build recommendation messages ──────────────────────
   Returns an array of plain-text advice strings.
   ──────────────────────────────────────────────────────── */
function buildRecommendations(pwd, checks, score, level) {
  const recs = [];

  if (pwd.length === 0) {
    recs.push('Enter a password above to see personalized security recommendations.');
    return recs;
  }

  // Length advice
  if (!checks.length)  recs.push('Use at least 8 characters — longer is much safer.');
  if (pwd.length < 12) recs.push('Aim for 12+ characters to dramatically increase crack time.');

  // Character-set advice
  if (!checks.upper)   recs.push('Add uppercase letters (A–Z) to expand the character set.');
  if (!checks.lower)   recs.push('Include lowercase letters (a–z) for more combinations.');
  if (!checks.number)  recs.push('Mix in numbers (0–9) to strengthen the password.');
  if (!checks.special) recs.push('Add special characters (!@#$%) for maximum strength.');

  // Repetition
  const uniqueRatio = new Set(pwd.split('')).size / pwd.length;
  if (uniqueRatio < 0.6) recs.push('Avoid repeating the same characters too often.');

  // Sequential patterns
  if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij/i.test(pwd)) {
    recs.push('Avoid sequential patterns like "123" or "abc" — easily guessed.');
  }

  // Runs of same character
  if (/(.)\1{2,}/.test(pwd)) {
    recs.push('Avoid runs of the same character (e.g. "aaa" or "111").');
  }

  // Common words
  if (/password|qwerty|letmein|admin|welcome|monkey|dragon/i.test(pwd)) {
    recs.push('This contains a commonly used word — pick something more unique.');
  }

  // Praise + storage tip for strong passwords
  if (score >= 80) recs.push('Excellent! Consider storing this in a reputable password manager.');

  // Default positive message
  if (recs.length === 0) recs.push('Good password! Keep unique passwords for every account.');

  return recs;
}

/* =========================================================
   app.js — Main Application Controller
   Responsibilities:
     - Particle background initialisation
     - DOM references
     - Event listeners (input, reset, toggle, generator, copy)
     - UI update functions (strength bar, checklist, recommendations)
     - Clipboard utility + toast notification
   Depends on: analyzer.js, generator.js (loaded before this file)
   ========================================================= */


/* ── Particle background ─────────────────────────────────
   Creates 40 coloured particles and appends them to
   #particles so the CSS float animation can run.
   ──────────────────────────────────────────────────────── */
(function initParticles() {
  const container = document.getElementById('particles');
  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#a78bfa'];

  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${Math.random() * 100}%;
      width:${Math.random() * 3 + 1}px;
      height:${Math.random() * 3 + 1}px;
      background:${COLORS[Math.floor(Math.random() * COLORS.length)]};
      animation-duration:${Math.random() * 12 + 8}s;
      animation-delay:${Math.random() * 10}s;
      opacity:0;
    `;
    container.appendChild(p);
  }
})();


/* ── DOM references ───────────────────────────────────── */
const passwordInput   = document.getElementById('password-input');
const toggleBtn       = document.getElementById('toggle-btn');
const barFill         = document.getElementById('bar-fill');
const strengthText    = document.getElementById('strength-text');
const statPercent     = document.getElementById('stat-percent');
const statScore       = document.getElementById('stat-score');
const statCrack       = document.getElementById('stat-crack');
const recommendations = document.getElementById('recommendations');
const genLengthSlider = document.getElementById('gen-length');
const lenDisplay      = document.getElementById('len-display');
const genDisplay      = document.getElementById('gen-password-display');
const resetBtn        = document.getElementById('reset-btn');
const genBtn          = document.getElementById('gen-btn');
const copyGenBtn      = document.getElementById('copy-gen-btn');
const toast           = document.getElementById('toast');


/* ── UI update: strength bar ─────────────────────────────
   Animates the fill bar, pip indicators, and stat values.
   Resets everything when pwd is empty.
   ──────────────────────────────────────────────────────── */
function updateStrengthBar(level, score, pwd) {
  const pips = document.querySelectorAll('.level-pip');

  if (pwd.length === 0) {
    barFill.style.width      = '0%';
    barFill.style.background = 'transparent';
    strengthText.textContent = '—';
    strengthText.style.color = 'var(--text-muted)';
    statPercent.textContent  = '0%';
    statScore.textContent    = '0/100';
    statPercent.style.color  = 'var(--text)';
    statScore.style.color    = 'var(--text)';
    statCrack.textContent    = '—';
    pips.forEach(p => p.style.background = 'rgba(255,255,255,0.06)');
    return;
  }

  const cfg = LEVELS[level];
  barFill.style.width      = cfg.pct + '%';
  barFill.style.background = `linear-gradient(90deg, ${cfg.color}cc, ${cfg.color})`;
  strengthText.textContent = cfg.label;
  strengthText.style.color = cfg.color;
  statPercent.textContent  = cfg.pct + '%';
  statScore.textContent    = score + '/100';
  statPercent.style.color  = cfg.color;
  statScore.style.color    = cfg.color;

  pips.forEach((p, i) => {
    p.style.background = i < cfg.pips ? cfg.color : 'rgba(255,255,255,0.06)';
  });
}


/* ── UI update: requirements checklist ───────────────────
   Toggles the .pass class and ✓/✕ icon for each rule.
   ──────────────────────────────────────────────────────── */
function updateChecklist(checks) {
  const itemMap = {
    length:  'check-length',
    upper:   'check-upper',
    lower:   'check-lower',
    number:  'check-number',
    special: 'check-special',
  };
  const iconMap = {
    length:  'icon-length',
    upper:   'icon-upper',
    lower:   'icon-lower',
    number:  'icon-number',
    special: 'icon-special',
  };

  for (const [key, id] of Object.entries(itemMap)) {
    const item = document.getElementById(id);
    const icon = document.getElementById(iconMap[key]);
    if (checks[key]) {
      item.classList.add('pass');
      icon.textContent = '✓';
    } else {
      item.classList.remove('pass');
      icon.textContent = '✕';
    }
  }
}


/* ── UI update: recommendations list ─────────────────────
   Clears and rebuilds the recommendation items from an
   array of advice strings.
   ──────────────────────────────────────────────────────── */
function updateRecommendations(recs) {
  recommendations.innerHTML = '';
  recs.forEach(rec => {
    const el = document.createElement('div');
    el.className = 'rec-item';
    el.innerHTML = `<span class="rec-icon">›</span> ${rec}`;
    recommendations.appendChild(el);
  });
}


/* ── Event: password input ───────────────────────────────
   Runs analysis on every keystroke and updates all UI.
   ──────────────────────────────────────────────────────── */
passwordInput.addEventListener('input', function () {
  const pwd = this.value;

  if (pwd.length === 0) {
    updateStrengthBar(0, 0, '');
    updateChecklist({ length: false, upper: false, lower: false, number: false, special: false });
    statCrack.textContent = '—';
    updateRecommendations(['Enter a password above to see personalized security recommendations.']);
    return;
  }

  const { checks, score, level, crackTime } = analyzePassword(pwd);
  updateStrengthBar(level, score, pwd);
  updateChecklist(checks);
  statCrack.textContent = crackTime;
  updateRecommendations(buildRecommendations(pwd, checks, score, level));
});


/* ── Event: show / hide password toggle ─────────────────── */
toggleBtn.addEventListener('click', function () {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type   = isHidden ? 'text' : 'password';
  toggleBtn.textContent = isHidden ? '🙈' : '👁';
});


/* ── Event: clear / reset button ─────────────────────────── */
resetBtn.addEventListener('click', function () {
  passwordInput.value = '';
  passwordInput.dispatchEvent(new Event('input'));
  passwordInput.focus();
});


/* ── Event: length slider (generator) ───────────────────── */
genLengthSlider.addEventListener('input', function () {
  lenDisplay.textContent = this.value;
});


/* ── Event: generate button ──────────────────────────────── */
genBtn.addEventListener('click', function () {
  const pwd = generatePassword(); // from generator.js
  genDisplay.textContent = pwd;
  genDisplay.classList.remove('empty');

  // Fade-in animation
  genDisplay.style.opacity = '0';
  requestAnimationFrame(() => {
    genDisplay.style.transition = 'opacity 0.25s';
    genDisplay.style.opacity    = '1';
  });
});


/* ── Event: copy generated password ─────────────────────── */
copyGenBtn.addEventListener('click', function () {
  const text = genDisplay.textContent;
  if (!text || genDisplay.classList.contains('empty')) return;
  copyToClipboard(text);
});


/* ── Utility: clipboard copy ─────────────────────────────
   Uses the modern Clipboard API where available, with a
   textarea fallback for older / insecure contexts.
   ──────────────────────────────────────────────────────── */
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(showToast);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); showToast(); } catch (e) { /* silent */ }
    document.body.removeChild(ta);
  }
}


/* ── Utility: toast notification ─────────────────────────
   Shows the "Copied!" toast for 2.2 seconds.
   ──────────────────────────────────────────────────────── */
function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// shake.js
(() => {
    const RED_TINT_DEFAULT = 'rgba(255, 64, 64, 0.14)';
    const DURATION_DEFAULT = '400ms';    // accepts 'ms' or 's'
    const INTENSITY_DEFAULT = '6px';    // horizontal shake distance

    let overlay, styleEl, tm;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const css = `
    :root{
      --shake-duration:${DURATION_DEFAULT};
      --shake-intensity:${INTENSITY_DEFAULT};
      --shake-tint:${RED_TINT_DEFAULT};
    }
    @keyframes tg-shake {
      0%,100% { transform: translate3d(0,0,0); }
      10% { transform: translateX(calc(-1 * var(--shake-intensity))); }
      20% { transform: translateX(var(--shake-intensity)); }
      30% { transform: translateX(calc(-1 * var(--shake-intensity))); }
      40% { transform: translateX(var(--shake-intensity)); }
      50% { transform: translateX(calc(-1 * var(--shake-intensity))); }
      60% { transform: translateX(var(--shake-intensity)); }
      70% { transform: translateX(calc(-1 * var(--shake-intensity))); }
      80% { transform: translateX(var(--shake-intensity)); }
      90% { transform: translateX(calc(-1 * var(--shake-intensity))); }
    }
    body.tg-shaking {
      animation: tg-shake var(--shake-duration) cubic-bezier(.36,.07,.19,.97) both;
      transform: translate3d(0,0,0);
      will-change: transform;
    }
    .tg-shake-overlay {
      position: fixed;
      inset: 0;
      background: var(--shake-tint);
      opacity: 0;
      pointer-events: none;
      z-index: 2147483647; /* on top */
      transition: opacity 120ms ease;
    }
  `;

    function ensureInjected() {
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.setAttribute('data-treeguessr-shake', '');
            styleEl.textContent = css;
            document.head.appendChild(styleEl);
        }
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'tg-shake-overlay';
            document.body.appendChild(overlay);
        }
    }

    function toMs(val, fallbackMs = 600) {
        if (!val) return fallbackMs;
        if (typeof val === 'number') return val;
        const s = String(val).trim();
        if (s.endsWith('ms')) return parseFloat(s);
        if (s.endsWith('s')) return parseFloat(s) * 1000;
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : fallbackMs;
    }

    function init() {
        ensureInjected();
        window.triggerShake = function triggerShake(opts = {}) {
            ensureInjected();
            // Allow customization per call
            if (opts.duration) document.documentElement.style.setProperty('--shake-duration',
                typeof opts.duration === 'number' ? `${opts.duration}ms` : String(opts.duration));
            if (opts.intensity) document.documentElement.style.setProperty('--shake-intensity',
                typeof opts.intensity === 'number' ? `${opts.intensity}px` : String(opts.intensity));
            if (opts.tint) document.documentElement.style.setProperty('--shake-tint', String(opts.tint));

            // If user prefers reduced motion: no shake, quick red flash only
            if (reduceMotion) {
                overlay.style.opacity = '1';
                clearTimeout(tm);
                tm = setTimeout(() => (overlay.style.opacity = '0'), 220);
                return;
            }

            const durMs = toMs(getComputedStyle(document.documentElement).getPropertyValue('--shake-duration'), 600);

            overlay.style.opacity = '1';
            document.body.classList.add('tg-shaking');

            clearTimeout(tm);
            tm = setTimeout(() => {
                document.body.classList.remove('tg-shaking');
                overlay.style.opacity = '0';
            }, durMs);
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

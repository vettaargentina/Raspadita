/* ============================================================
   card.js — Raspadita VETTA · Lógica del cartón
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     BASE64 UNICODE-SAFE
  ---------------------------------------------------------- */
  function b64Decode(str) {
    return decodeURIComponent(
      atob(str).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
  }

  /* ----------------------------------------------------------
     CONSTANTES
  ---------------------------------------------------------- */
  const LS_USED       = 'raspadita_used_v1';
  const LS_LOGO       = 'raspadita_logo_url';
  const VALIDITY_DAYS = 30;
  const CANVAS_RES    = 300; // resolución interna fija del canvas

  /* ----------------------------------------------------------
     DISPLAY ORDER
     Permutación visual aleatoria por sesión de navegador.
     Evita que al abrir el mismo cartón dos veces se pueda
     elegir la mejor posición conocida de la sesión anterior.
     sessionStorage se vacía al cerrar la pestaña/ventana.
  ---------------------------------------------------------- */
  function getDisplayOrder(cardId, count) {
    const key = `vetta_disp_${cardId}`;
    try {
      const s = sessionStorage.getItem(key);
      if (s) {
        const o = JSON.parse(s);
        if (Array.isArray(o) && o.length === count) return o;
      }
    } catch {}
    // Nueva permutación aleatoria para esta sesión
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    try { sessionStorage.setItem(key, JSON.stringify(order)); } catch {}
    return order;
  }

  /* ----------------------------------------------------------
     URL PARSING
  ---------------------------------------------------------- */
  function getCardData() {
    const params  = new URLSearchParams(window.location.search);
    const cardId  = params.get('card');
    const encoded = params.get('p');
    if (!cardId || !encoded) return null;
    try {
      const data = JSON.parse(b64Decode(encoded));
      if (!data.id || !Array.isArray(data.prizes) || data.prizes.length < 9) return null;
      return data;
    } catch { return null; }
  }

  /* ----------------------------------------------------------
     FIREBASE — registro global de cartones usados
     Si firebase-config.js no está cargado, cae a localStorage.
  ---------------------------------------------------------- */
  function getFirebaseDB() {
    // window.__firebaseDB es inicializado por index.html si
    // firebase-config.js existe y las SDKs se cargaron.
    return window.__firebaseDB || null;
  }

  async function isCardUsedGlobal(cardId) {
    const db = getFirebaseDB();
    if (db) {
      try {
        const snap = await db.ref(`used_cards/${cardId}`).once('value');
        return snap.exists();
      } catch (e) {
        console.warn('Firebase check failed, using localStorage:', e.message);
      }
    }
    // Fallback: localStorage
    try {
      return !!JSON.parse(localStorage.getItem(LS_USED) || '{}')[cardId];
    } catch { return false; }
  }

  async function markCardUsedGlobal(cardId, chosenIndex) {
    // Siempre marcar localmente
    try {
      const map = JSON.parse(localStorage.getItem(LS_USED) || '{}');
      map[cardId] = { chosenIndex, ts: Date.now() };
      localStorage.setItem(LS_USED, JSON.stringify(map));
    } catch {}

    // Marcar en Firebase si está disponible
    const db = getFirebaseDB();
    if (db) {
      try {
        await db.ref(`used_cards/${cardId}`).set({
          ts: Date.now(),
          chosenIndex,
        });
      } catch (e) {
        console.warn('Firebase write failed:', e.message);
      }
    }
  }

  /* ----------------------------------------------------------
     FECHAS
  ---------------------------------------------------------- */
  function addDays(ts, days) { return ts + days * 864e5; }

  function formatDate(ts) {
    const d  = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  /* ----------------------------------------------------------
     LOGO
  ---------------------------------------------------------- */
  function getLogoSrc() {
    return localStorage.getItem(LS_LOGO) || 'assets/logo.png';
  }

  /* ----------------------------------------------------------
     PANTALLAS ESPECIALES
  ---------------------------------------------------------- */
  function hideLoading() {
    const el = document.getElementById('loading-screen');
    if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }
  }

  function renderUsed(cardId) {
    hideLoading();
    document.getElementById('app').innerHTML = `
      <div class="used-screen">
        <div class="screen-icon">🔒</div>
        <div class="screen-title muted">CARTÓN USADO</div>
        <div class="screen-badge">N° ${esc(cardId)}</div>
        <p class="screen-subtitle">
          Este cartón ya fue utilizado.<br>
          Cada cartón tiene un solo intento.
        </p>
      </div>`;
  }

  function renderError(msg) {
    hideLoading();
    document.getElementById('app').innerHTML = `
      <div class="error-screen">
        <div class="screen-icon">❌</div>
        <div class="screen-title danger">Cartón inválido</div>
        <p class="screen-subtitle">${msg}</p>
      </div>`;
  }

  function renderExpired(cardId, expiryStr) {
    hideLoading();
    document.getElementById('app').innerHTML = `
      <div class="error-screen">
        <div class="screen-icon">⏰</div>
        <div class="screen-title danger">Cartón vencido</div>
        <div class="screen-badge">N° ${esc(cardId)}</div>
        <p class="screen-subtitle">Venció el ${expiryStr}. Validez: ${VALIDITY_DAYS} días.</p>
      </div>`;
  }

  /* ----------------------------------------------------------
     RENDERIZADO DEL CARTÓN
  ---------------------------------------------------------- */
  function renderCard(data) {
    const { id, prizes, issued } = data;
    const expiryTs  = addDays(issued, VALIDITY_DAYS);
    const issuedStr = formatDate(issued);
    const expiryStr = formatDate(expiryTs);

    if (Date.now() > expiryTs) { renderExpired(id, expiryStr); return; }

    // ── Permutación visual: premios en orden diferente cada sesión ──
    // Aunque el atacante vea qué posición tiene el gran premio en una
    // sesión, en la próxima sesión (incógnito) estará en otro lugar.
    const displayOrder  = getDisplayOrder(id, prizes.length);
    const displayPrizes = displayOrder.map(idx => prizes[idx]);

    const logoSrc = getLogoSrc();

    document.getElementById('app').innerHTML = `
      <div class="card-wrapper">
        <div class="card-header">
          <img id="card-logo-img" class="card-logo" src="${escAttr(logoSrc)}"
            alt="Raspadita VETTA"
            onerror="this.style.display='none';document.getElementById('card-logo-fb').style.display='flex'">
          <div id="card-logo-fb" class="card-logo-placeholder" style="display:none">🎰</div>
          <div class="card-brand">Raspadita VETTA</div>
          <div class="card-tagline">¡Premio garantizado!</div>
        </div>

        <div class="card-body">
          <div class="card-info-bar">
            <div class="card-number">N° ${esc(id)}</div>
            <div class="card-dates">
              <div class="card-date-row">📅 Emitido: <span>${issuedStr}</span></div>
              <div class="card-date-row">⏳ Vence: <span>${expiryStr}</span></div>
            </div>
          </div>

          <div class="card-instructions">
            <p>Raspá <strong>solo UN círculo</strong> con el dedo para descubrir tu premio</p>
          </div>

          <div class="scratch-grid" id="scratch-grid">
            ${displayPrizes.map((p, i) => `
              <div class="scratch-cell" id="cell-${i}" data-index="${i}">
                <div class="prize-reveal" id="reveal-${i}">
                  <span class="prize-icon">${esc(p.i || '🎁')}</span>
                  <span class="prize-name">${esc(p.n || 'Premio')}</span>
                </div>
                <canvas class="scratch-canvas" id="canvas-${i}"></canvas>
              </div>
            `).join('')}
          </div>

          <div class="card-footer">
            <p>
              <strong>⚠️ Premio válido únicamente realizando una compra.</strong><br>
              Tomá una captura de pantalla y presentásela al organizador.<br>
              Válido hasta el ${expiryStr} · N° ${esc(id)}
            </p>
          </div>
        </div>
      </div>`;

    hideLoading();
    // displayPrizes (con el orden visual de esta sesión) es lo que initScratch
    // usará para revelar el premio correcto al rascar.
    requestAnimationFrame(() => initScratch(displayPrizes, id, expiryStr));
  }

  /* ----------------------------------------------------------
     SCRATCH ENGINE
  ---------------------------------------------------------- */
  let state = {
    gameOver:    false,
    scratching:  false,
    activeIndex: null,
    chosenIndex: null,
  };

  function initScratch(prizes, cardId, expiryStr) {
    if (!document.getElementById('scratch-grid')) return;

    for (let i = 0; i < 9; i++) {
      const cell   = document.getElementById(`cell-${i}`);
      const canvas = document.getElementById(`canvas-${i}`);
      if (!cell || !canvas) continue;

      canvas.width  = CANVAS_RES;
      canvas.height = CANVAS_RES;
      const ctx = canvas.getContext('2d');
      paintMetallic(ctx, CANVAS_RES);

      // Touch
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (state.gameOver) return;
        if (state.chosenIndex !== null && state.chosenIndex !== i) return;
        const t = e.touches[0];
        const { x, y } = relPos(canvas, t.clientX, t.clientY);
        beginScratch(i, cardId);
        scratch(ctx, x, y);
      }, { passive: false });

      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!state.scratching || state.activeIndex !== i) return;
        const t = e.touches[0];
        const { x, y } = relPos(canvas, t.clientX, t.clientY);
        scratch(ctx, x, y);
        tryAutoReveal(i, ctx, canvas, prizes, cardId, expiryStr);
      }, { passive: false });

      canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        tryAutoReveal(i, ctx, canvas, prizes, cardId, expiryStr);
        state.scratching = false;
      });

      // Mouse
      canvas.addEventListener('mousedown', (e) => {
        if (state.gameOver) return;
        if (state.chosenIndex !== null && state.chosenIndex !== i) return;
        const { x, y } = relPos(canvas, e.clientX, e.clientY);
        beginScratch(i, cardId);
        scratch(ctx, x, y);
      });

      canvas.addEventListener('mousemove', (e) => {
        if (!state.scratching || state.activeIndex !== i) return;
        const { x, y } = relPos(canvas, e.clientX, e.clientY);
        scratch(ctx, x, y);
        tryAutoReveal(i, ctx, canvas, prizes, cardId, expiryStr);
      });

      canvas.addEventListener('mouseup', () => {
        tryAutoReveal(i, ctx, canvas, prizes, cardId, expiryStr);
        state.scratching = false;
      });
    }

    document.addEventListener('mouseup', () => { state.scratching = false; });
  }

  function beginScratch(index, cardId) {
    if (state.chosenIndex === null) {
      state.chosenIndex = index;
      // Marcar usado de forma global (Firebase si disponible, localStorage siempre)
      markCardUsedGlobal(cardId, index);
    }
    state.activeIndex = index;
    state.scratching  = true;
  }

  function relPos(canvas, clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width  / r.width),
      y: (clientY - r.top)  * (canvas.height / r.height),
    };
  }

  function paintMetallic(ctx, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0,    '#7A7A8A');
    g.addColorStop(0.18, '#CFCFDA');
    g.addColorStop(0.35, '#9090A0');
    g.addColorStop(0.52, '#E0E0EA');
    g.addColorStop(0.68, '#8A8A9A');
    g.addColorStop(0.84, '#D0D0DC');
    g.addColorStop(1,    '#808090');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // Destellos
    for (let k = 0; k < 4; k++) {
      const xp = size * (0.1 + k * 0.25);
      const sg = ctx.createLinearGradient(xp - 6, 0, xp + 6, size);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.22)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(xp - 6, 0, 12, size);
    }

    // Brillo superior
    const rg = ctx.createRadialGradient(size * .38, size * .28, 0, size * .5, size * .5, size * .72);
    rg.addColorStop(0, 'rgba(255,255,255,0.25)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, size, size);

    // Moneda
    ctx.globalAlpha = 0.55;
    ctx.font = `${Math.round(size * .34)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText('🪙', size / 2, size * .38);

    // Texto RASPA
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(20,20,30,0.52)';
    ctx.font = `900 ${Math.round(size * .155)}px Outfit, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('RASPA', size / 2, size * .7);
    ctx.restore();
  }

  function scratch(ctx, x, y) {
    const brush = CANVAS_RES * 0.17;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brush, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function scrapedPct(ctx, w, h) {
    const data = ctx.getImageData(0, 0, w, h).data;
    const cx = w / 2, cy = h / 2, r2 = (w / 2) ** 2;
    let total = 0, transparent = 0;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        if ((px - cx) ** 2 + (py - cy) ** 2 <= r2) {
          total++;
          if (data[(py * w + px) * 4 + 3] < 64) transparent++;
        }
      }
    }
    return total ? (transparent / total) * 100 : 0;
  }

  function tryAutoReveal(idx, ctx, canvas, prizes, cardId, expiryStr) {
    if (state.gameOver) return;
    if (scrapedPct(ctx, canvas.width, canvas.height) >= 42) {
      revealAll(idx, prizes, cardId, expiryStr);
    }
  }

  /* ----------------------------------------------------------
     REVEAL
  ---------------------------------------------------------- */
  function revealAll(chosenIdx, prizes, cardId, expiryStr) {
    if (state.gameOver) return;
    state.gameOver = true;

    const chosenCanvas = document.getElementById(`canvas-${chosenIdx}`);
    const chosenCtx    = chosenCanvas.getContext('2d');
    chosenCtx.clearRect(0, 0, chosenCanvas.width, chosenCanvas.height);
    chosenCanvas.classList.add('hidden');
    document.getElementById(`cell-${chosenIdx}`).classList.add('revealed', 'chosen');

    let delay = 350;
    for (let i = 0; i < 9; i++) {
      if (i === chosenIdx) continue;
      const idx = i;
      setTimeout(() => {
        const c = document.getElementById(`canvas-${idx}`);
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
        c.classList.add('hidden');
        document.getElementById(`cell-${idx}`).classList.add('revealed', 'dimmed');
      }, delay);
      delay += 110;
    }

    setTimeout(() => showPrizeModal(prizes[chosenIdx], cardId, expiryStr), 500);
  }

  /* ----------------------------------------------------------
     PRIZE MODAL
  ---------------------------------------------------------- */
  function showPrizeModal(prize, cardId, expiryStr) {
    const overlay = document.createElement('div');
    overlay.className = 'prize-modal-overlay';
    overlay.id        = 'prize-modal';
    overlay.innerHTML = `
      <div class="prize-modal" role="dialog" aria-modal="true">
        <div class="prize-modal-badge">⭐ ¡Premio desbloqueado!</div>
        <div class="prize-modal-icon">${esc(prize.i || '🎁')}</div>
        <div class="prize-modal-headline">¡GANASTE!</div>
        <div class="prize-modal-name">${esc(prize.n || 'Premio especial')}</div>
        <div class="prize-modal-value">${esc(prize.v || '')}</div>
        <div class="prize-modal-validity">⏳ Válido hasta ${esc(expiryStr)}</div>
        <div class="prize-modal-disclaimer">
          Premio válido <strong>únicamente con la compra de un producto.</strong><br>
          Cartón N° ${esc(cardId)}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <button class="btn-screenshot" id="btn-take-screenshot">
            📸 ¡Tomá una captura de pantalla!
          </button>
          <button class="btn-view-card" id="btn-close-modal">Ver todos mis premios</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    launchConfetti();

    document.getElementById('btn-take-screenshot').addEventListener('click', () => {
      overlay.remove(); showScreenshotHint();
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => {
      overlay.remove(); showScreenshotHint();
    });
  }

  function showScreenshotHint() {
    const wrapper = document.querySelector('.card-wrapper');
    if (!wrapper) return;
    const hint = document.createElement('div');
    hint.className = 'screenshot-hint';
    hint.innerHTML = `<p>📸 <span>¡Tomá una captura y enviásela al organizador para canjear tu premio!</span></p>`;
    wrapper.appendChild(hint);
  }

  /* ----------------------------------------------------------
     CONFETTI
  ---------------------------------------------------------- */
  function launchConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    const colors = ['#FFD700','#FF6B6B','#4ECDC4','#A78BFA','#FB923C','#34D399','#F472B6','#60A5FA'];
    for (let i = 0; i < 90; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        const sz = 6 + Math.random() * 9, dur = 2.2 + Math.random() * 2;
        el.style.cssText = `left:${Math.random()*100}vw;width:${sz}px;height:${sz}px;` +
          `background:${colors[Math.floor(Math.random()*colors.length)]};` +
          `border-radius:${Math.random()>.4?'50%':'2px'};animation-duration:${dur}s;`;
        container.appendChild(el);
        setTimeout(() => el.remove(), dur * 1000 + 100);
      }, i * 25);
    }
  }

  /* ----------------------------------------------------------
     ESCAPE HTML
  ---------------------------------------------------------- */
  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) { return esc(s); }

  /* ----------------------------------------------------------
     INIT — async para poder esperar la verificación Firebase
  ---------------------------------------------------------- */
  async function init() {
    const data = getCardData();

    // Pantalla de carga mínima de 600ms para UX
    await new Promise(r => setTimeout(r, 600));

    if (!data) {
      renderError('Link de cartón inválido o incompleto.<br>Pedí tu cartón al organizador del juego.');
      return;
    }

    // Verificar si ya fue usado (Firebase → localStorage)
    const used = await isCardUsedGlobal(data.id);
    if (used) {
      renderUsed(data.id);
      return;
    }

    renderCard(data);
  }

  window.addEventListener('orientationchange', () => {
    setTimeout(() => window.location.reload(), 350);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

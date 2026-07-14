/* ============================================================
   dashboard.js — Raspadita VETTA · Panel de administración
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     BASE64 UNICODE-SAFE
     btoa() falla con emojis (fuera de Latin-1).
     Usamos encodeURIComponent para convertir a bytes ASCII primero.
  ---------------------------------------------------------- */
  function b64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, hex) => String.fromCharCode(parseInt(hex, 16))));
  }

  /* ----------------------------------------------------------
     STORAGE KEYS
  ---------------------------------------------------------- */
  const LS_PRIZES = 'raspadita_prizes_v1';
  const LS_CARDS = 'raspadita_cards_v1';
  const LS_SETTINGS = 'raspadita_settings_v1';
  const LS_LOGO = 'raspadita_logo_url';

  /* ----------------------------------------------------------
     PREMIOS POR DEFECTO
  ---------------------------------------------------------- */
  const DEFAULT_PRIZES = [
    { id: 'dp1', n: 'Gran Premio', v: '$10.000 en efectivo', t: 'efectivo', i: '🏆' },
    { id: 'dp2', n: 'Segundo Premio', v: '$5.000 en efectivo', t: 'efectivo', i: '🥇' },
    { id: 'dp3', n: 'Tercer Premio', v: '$1.000 en efectivo', t: 'efectivo', i: '💰' },
    { id: 'dp4', n: 'Cuarto Premio', v: '$500 en efectivo', t: 'efectivo', i: '💵' },
    { id: 'dp5', n: '50% de descuento', v: '50% de descuento en tu próxima compra', t: 'descuento', i: '🎯' },
    { id: 'dp6', n: '25% de descuento', v: '25% de descuento en tu próxima compra', t: 'descuento', i: '🛍️' },
    { id: 'dp7', n: '15% de descuento', v: '15% de descuento en tu próxima compra', t: 'descuento', i: '🏷️' },
    { id: 'dp8', n: 'Premio Sorpresa', v: 'Un regalo especial de parte de VETTA', t: 'objeto', i: '🎀' },
    { id: 'dp9', n: 'Premio Básico', v: 'Un detalle especial de bienvenida', t: 'objeto', i: '⭐' },
  ];

  /* ----------------------------------------------------------
     EMOJIS RÁPIDOS
  ---------------------------------------------------------- */
  const QUICK_EMOJIS = [
    '🏆', '🥇', '🥈', '💰', '💵', '💎', '🎁', '🎀', '⭐', '🌟',
    '🎯', '🛍️', '🏷️', '🎪', '🎰', '🎊', '🎉', '🎂', '🥂', '🏅',
    '🌈', '🦋', '🎸', '🚀', '💡', '🔥', '❤️', '🍀', '🦄', '🐉',
  ];

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  let prizes = [];
  let cards = [];
  let settings = {};
  let editPrizeId = null;
  let selEmoji = '🎁';

  /* ----------------------------------------------------------
     STORAGE
  ---------------------------------------------------------- */
  function loadAll() {
    try { prizes = JSON.parse(localStorage.getItem(LS_PRIZES)) || cloneDefaults(); } catch { prizes = cloneDefaults(); }
    try { cards = JSON.parse(localStorage.getItem(LS_CARDS)) || []; } catch { cards = []; }
    try { settings = JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}; } catch { settings = {}; }
  }
  function cloneDefaults() { return DEFAULT_PRIZES.map(p => ({ ...p })); }
  function savePrizes() { localStorage.setItem(LS_PRIZES, JSON.stringify(prizes)); }
  function saveCards() { localStorage.setItem(LS_CARDS, JSON.stringify(cards)); }
  function saveSettings() { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }

  /* ----------------------------------------------------------
     TABS
  ---------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById(btn.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ----------------------------------------------------------
     UTILS
  ---------------------------------------------------------- */
  function uid(prefix = 'VET') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = prefix + '-';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getBaseUrl() {
    const base = (settings.baseUrl || '').trim().replace(/\/$/, '');
    if (base) return base;
    // Auto-detect: usar la ubicación actual, quitando dashboard.html
    const loc = window.location.href.replace(/dashboard\.html.*$/, '').replace(/\/$/, '');
    return loc;
  }

  function buildCardUrl(card) {
    const base = getBaseUrl();
    const cardUrl = base + '/index.html';
    const payload = b64Encode(JSON.stringify({ id: card.id, prizes: card.prizes, issued: card.issued }));
    // IMPORTANTE: encodeURIComponent en el payload para que los '+' de base64
    // no sean interpretados como espacios por URLSearchParams en el cartón.
    return `${cardUrl}?card=${encodeURIComponent(card.id)}&p=${encodeURIComponent(payload)}`;
  }

  /* Genera un link demo con el primer cartón disponible (o uno nuevo) */
  function openDemoCard() {
    if (prizes.length < 9) {
      toast('Necesitás al menos 9 premios para ver un demo', 'error');
      return;
    }
    const demoCard = {
      id: 'DEMO-000000',
      prizes: shuffle(prizes).slice(0, 9).map(p => ({ n: p.n, v: p.v, t: p.t, i: p.i })),
      issued: Date.now(),
    };
    window.open(buildCardUrl(demoCard), '_blank');
  }

  /* ----------------------------------------------------------
     TOAST
  ---------------------------------------------------------- */
  function toast(msg, type = 'success') {
    const el = document.getElementById('global-toast');
    if (!el) return;
    el.className = `toast ${type}`;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  }

  /* ----------------------------------------------------------
     PRIZES TAB
  ---------------------------------------------------------- */
  function renderPrizeList() {
    const list = document.getElementById('prize-list');
    const count = document.getElementById('prize-count');
    const tc = document.getElementById('tc-prizes');
    const warn = document.getElementById('prizes-warning');
    const genWarn = document.getElementById('gen-warning');

    if (count) count.textContent = prizes.length;
    if (tc) tc.textContent = prizes.length;
    if (warn) warn.style.display = prizes.length < 9 ? 'block' : 'none';
    if (genWarn) genWarn.style.display = prizes.length < 9 ? 'block' : 'none';

    if (!list) return;

    if (prizes.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎁</div>
          <div class="empty-state-text">No hay premios. ¡Agregá el primero!</div>
        </div>`;
      return;
    }

    list.innerHTML = prizes.map(p => `
      <div class="prize-item" id="pi-${p.id}">
        <div class="prize-item-icon">${esc(p.i)}</div>
        <div class="prize-item-info">
          <div class="prize-item-name">${esc(p.n)}</div>
          <div class="prize-item-value">${esc(p.v)}</div>
        </div>
        <span class="prize-type-badge type-${esc(p.t)}">${esc(p.t)}</span>
        <div class="prize-item-actions">
          <button class="btn btn-sm btn-secondary btn-icon" onclick="editPrize('${esc(p.id)}')" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger btn-icon"    onclick="deletePrize('${esc(p.id)}')" title="Eliminar">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  /* Prize form */
  function openPrizeForm(prize) {
    editPrizeId = prize ? prize.id : null;
    selEmoji = prize ? prize.i : '🎁';

    document.getElementById('prize-form-title').textContent = prize ? 'Editar Premio' : 'Nuevo Premio';
    document.getElementById('prize-name').value = prize ? prize.n : '';
    document.getElementById('prize-value').value = prize ? prize.v : '';
    document.getElementById('prize-type').value = prize ? prize.t : 'efectivo';

    renderEmojiGrid();
    updateCustomEmojiInput();
    document.getElementById('prize-form-overlay').style.display = 'flex';
    setTimeout(() => document.getElementById('prize-name').focus(), 100);
  }

  function closePrizeForm() {
    document.getElementById('prize-form-overlay').style.display = 'none';
    editPrizeId = null;
  }

  function savePrize() {
    const name = document.getElementById('prize-name').value.trim();
    const value = document.getElementById('prize-value').value.trim();
    const type = document.getElementById('prize-type').value;

    if (!name) { toast('El nombre no puede estar vacío', 'error'); return; }
    if (!value) { toast('Completá la descripción / valor del premio', 'error'); return; }

    if (editPrizeId) {
      const idx = prizes.findIndex(p => p.id === editPrizeId);
      if (idx !== -1) prizes[idx] = { ...prizes[idx], n: name, v: value, t: type, i: selEmoji };
    } else {
      prizes.push({ id: 'p' + Date.now(), n: name, v: value, t: type, i: selEmoji });
    }

    savePrizes();
    renderPrizeList();
    closePrizeForm();
    toast(editPrizeId ? 'Premio actualizado ✅' : 'Premio agregado ✅');
  }

  window.editPrize = function (id) {
    const p = prizes.find(x => x.id === id);
    if (p) openPrizeForm(p);
  };

  window.deletePrize = function (id) {
    if (!confirm('¿Eliminar este premio?')) return;
    prizes = prizes.filter(p => p.id !== id);
    savePrizes();
    renderPrizeList();
    toast('Premio eliminado');
  };

  function resetPrizes() {
    if (!confirm('¿Restaurar los premios por defecto? Se perderán los cambios.')) return;
    prizes = cloneDefaults();
    savePrizes();
    renderPrizeList();
    toast('Premios restaurados ✅');
  }

  /* Emoji grid */
  function renderEmojiGrid() {
    const grid = document.getElementById('emoji-grid');
    if (!grid) return;
    grid.innerHTML = QUICK_EMOJIS.map(e => `
      <button
        type="button"
        class="emoji-opt${e === selEmoji ? ' selected' : ''}"
        data-emoji="${e}"
        onclick="selectEmoji('${e}')"
        title="${e}"
      >${e}</button>
    `).join('');
  }

  window.selectEmoji = function (emoji) {
    selEmoji = emoji;
    renderEmojiGrid();
    updateCustomEmojiInput();
  };

  function updateCustomEmojiInput() {
    const inp = document.getElementById('custom-emoji');
    if (inp) inp.value = selEmoji;
  }

  /* ----------------------------------------------------------
     CARD GENERATOR
  ---------------------------------------------------------- */
  function generateCards() {
    if (prizes.length < 9) {
      toast(`Necesitás al menos 9 premios (tenés ${prizes.length})`, 'error');
      return;
    }

    const qty = parseInt(document.getElementById('generate-qty').value) || 1;
    if (qty < 1 || qty > 500) { toast('Cantidad entre 1 y 500', 'error'); return; }

    const existingIds = new Set(cards.map(c => c.id));
    const newCards = [];

    for (let i = 0; i < qty; i++) {
      let id;
      do { id = uid('VET'); } while (existingIds.has(id));
      existingIds.add(id);

      const shuffledPrizes = shuffle(prizes).slice(0, 9).map(p => ({
        n: p.n, v: p.v, t: p.t, i: p.i,
      }));

      newCards.push({ id, prizes: shuffledPrizes, issued: Date.now() });
    }

    cards.push(...newCards);
    saveCards();
    renderCardList();
    renderStats();

    if (qty === 1) {
      copyCardLink(newCards[0].id);
      toast('Cartón generado y link copiado ✅');
    } else {
      toast(`¡${qty} cartones generados! ✅`);
    }

    // Ir a la pestaña de cartones
    document.getElementById('tab-btn-cards').click();
  }

  /* ----------------------------------------------------------
     CARDS TAB
  ---------------------------------------------------------- */
  function renderCardList() {
    const list = document.getElementById('generated-list');
    const tc = document.getElementById('tc-cards');
    const total = document.getElementById('total-cards-label');

    if (tc) tc.textContent = cards.length;
    if (total) total.textContent = cards.length;
    if (!list) return;

    if (cards.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎴</div>
          <div class="empty-state-text">Todavía no generaste ningún cartón.</div>
        </div>`;
      return;
    }

    const sorted = [...cards].reverse();
    list.innerHTML = sorted.map(card => {
      const url = buildCardUrl(card);
      return `
        <div class="gen-item">
          <div class="gen-item-id">N° ${esc(card.id)}</div>
          <div class="gen-item-date">📅 ${formatDate(card.issued)}</div>
          <div class="gen-item-url" title="${esc(url)}">${esc(url)}</div>
          <div class="gen-item-actions">
            <button class="btn btn-sm btn-primary"     onclick="copyCardLink('${esc(card.id)}')">📋 Copiar</button>
            <button class="btn btn-sm btn-secondary"   onclick="openCard('${esc(card.id)}')">🔗</button>
            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteCard('${esc(card.id)}')">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  function copyCardLink(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const url = buildCardUrl(card);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => toast('¡Link copiado! 📋'))
        .catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('¡Link copiado! 📋'); }
    catch { toast('No se pudo copiar. Copiá el link manualmente.', 'error'); }
    ta.remove();
  }

  window.copyCardLink = copyCardLink;

  window.openCard = function (cardId) {
    const card = cards.find(c => c.id === cardId);
    if (card) window.open(buildCardUrl(card), '_blank');
  };

  window.deleteCard = function (cardId) {
    if (!confirm('¿Eliminar este cartón? El link dejará de funcionar.')) return;
    cards = cards.filter(c => c.id !== cardId);
    saveCards();
    renderCardList();
    renderStats();
    toast('Cartón eliminado');
  };

  function exportAllLinks() {
    if (cards.length === 0) { toast('No hay cartones generados', 'error'); return; }
    const text = cards.map(c => `${c.id}\t${buildCardUrl(c)}`).join('\n');
    fallbackCopy(text);
    toast(`${cards.length} links copiados 📋`);
  }

  function clearAllCards() {
    if (!confirm(`¿Eliminar los ${cards.length} cartones generados?\nEsta acción no se puede deshacer.`)) return;
    cards = [];
    saveCards();
    renderCardList();
    renderStats();
    toast('Todos los cartones eliminados');
  }

  /* ----------------------------------------------------------
     STATS
  ---------------------------------------------------------- */
  function renderStats() {
    const se = document.getElementById('stat-total');
    const sp = document.getElementById('stat-prizes');
    if (se) se.textContent = cards.length;
    if (sp) sp.textContent = prizes.length;
  }

  /* ----------------------------------------------------------
     SETTINGS TAB
  ---------------------------------------------------------- */
  function renderSettings() {
    const inp = document.getElementById('base-url-input');
    if (inp) inp.value = settings.baseUrl || '';

    const preview = document.getElementById('logo-preview');
    const stored = localStorage.getItem(LS_LOGO);
    if (preview && stored) {
      preview.src = stored;
      preview.style.display = 'block';
      document.getElementById('logo-drop-placeholder').style.display = 'none';
    }
  }

  function saveBaseUrl() {
    settings.baseUrl = (document.getElementById('base-url-input').value || '').trim();
    saveSettings();
    renderCardList(); // recalcular URLs
    toast('URL guardada ✅');
  }

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Seleccioná una imagen', 'error'); return; }

    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      localStorage.setItem(LS_LOGO, dataUrl);

      const preview = document.getElementById('logo-preview');
      if (preview) {
        preview.src = dataUrl; preview.style.display = 'block';
        document.getElementById('logo-drop-placeholder').style.display = 'none';
      }
      // Actualizar logo en nav
      const navImg = document.getElementById('nav-logo-img');
      if (navImg) { navImg.src = dataUrl; navImg.style.display = 'block'; }

      toast('Logo guardado ✅');
    };
    reader.readAsDataURL(file);
  }

  /* ----------------------------------------------------------
     ESCAPE HTML
  ---------------------------------------------------------- */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ----------------------------------------------------------
     CUSTOM EMOJI INPUT
  ---------------------------------------------------------- */
  function initCustomEmoji() {
    const inp = document.getElementById('custom-emoji');
    if (!inp) return;
    inp.addEventListener('input', () => {
      const val = [...inp.value].slice(-2).join('');
      if (val) { selEmoji = val; renderEmojiGrid(); }
    });
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init() {
    loadAll();
    initTabs();
    initCustomEmoji();

    renderPrizeList();
    renderCardList();
    renderStats();
    renderSettings();

    // Prize form buttons
    document.getElementById('btn-add-prize').addEventListener('click', () => openPrizeForm(null));
    document.getElementById('btn-save-prize').addEventListener('click', savePrize);
    document.getElementById('btn-cancel-prize').addEventListener('click', closePrizeForm);
    document.getElementById('btn-reset-prizes').addEventListener('click', resetPrizes);

    // Demo card button
    document.getElementById('btn-demo-card').addEventListener('click', openDemoCard);

    // Generator
    document.getElementById('btn-generate').addEventListener('click', generateCards);

    // Cards tab
    document.getElementById('btn-export-links').addEventListener('click', exportAllLinks);
    document.getElementById('btn-clear-cards').addEventListener('click', clearAllCards);

    // Settings
    document.getElementById('btn-save-url').addEventListener('click', saveBaseUrl);
    document.getElementById('logo-file').addEventListener('change', handleLogoUpload);
    document.getElementById('btn-clear-all').addEventListener('click', clearAllCards);
    document.getElementById('btn-reset-prizes-settings').addEventListener('click', resetPrizes);

    // Close form overlay clicking outside
    document.getElementById('prize-form-overlay').addEventListener('click', function (e) {
      if (e.target === this) closePrizeForm();
    });

    // Keyboard: ESC closes form
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePrizeForm();
      if (e.key === 'Enter' && document.getElementById('prize-form-overlay').style.display !== 'none') {
        e.preventDefault(); savePrize();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

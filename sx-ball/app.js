import { Game, BRICK_TYPES, POWERUPS, drawBoardPreview } from './game.js';
import { COLS, ROWS, LEVELS, COLORS } from './levels.js';
import { STRINGS } from './strings.js';
import { settings, persist, cloneGrid, compareScores, newId } from './storage.js';
import { icon } from './icons.js';

const byId = id => document.getElementById(id);
const canvas = byId('game-canvas');
const overlay = byId('board-overlay');
const guide = byId('guide');
const views = ['play', 'levels', 'editor', 'scores'];
const movement = new Map([
  ['ArrowLeft', -1], ['KeyA', -1], ['ArrowRight', 1], ['KeyD', 1],
]);
const pressed = new Set();
const navIcon = { play: 'play', levels: 'levels', editor: 'editor', scores: 'trophy' };
const finePointer = matchMedia('(pointer: fine)');
const brickById = new Map(BRICK_TYPES.map(brick => [brick.id, brick]));

let lang = detectLanguage();
let view = null;
let libraryTab = 'all';
let run = null;
let state = null;
let displayedPhase = null;
let displayedLevel = null;
let displayedLives = null;
let displayedOrder = '';
let latestScore = null;
let toastTimeout = null;
let editor = makeDraft();
let brush = { type: 'normal', color: 'rose' };
let stroke = null;

const game = new Game(canvas, { onUpdate: updateGame, onEnd: endRun, onPowerUp: showPower });
game.setMuted(settings.muted);
byId('globe').innerHTML = icon('globe');
renderLanguage();
renderRoute();
game.preview(firstLevel());

function detectLanguage() {
  if (settings.language !== 'auto') return settings.language;
  const preferences = navigator.languages?.length ? navigator.languages : [navigator.language];
  return preferences.map(item => item?.toLowerCase().split('-')[0]).find(item => ['pl', 'en'].includes(item)) || 'en';
}

function t(key, values = {}) {
  return (STRINGS[lang][key] ?? STRINGS.en[key] ?? key)
    .replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatScore(value) {
  return new Intl.NumberFormat(lang === 'pl' ? 'pl-PL' : 'en-US').format(value);
}

function levelName(level) {
  return typeof level?.name === 'string' ? level.name : level?.name?.[lang] ?? t('untitled');
}

function levelSubtitle(level) {
  if (typeof level?.name === 'string') return t('custom');
  if (level?.featuredBrick) return t('featuredBrick', { brick: t(`brick_${level.featuredBrick}`) });
  if (!level?.grid) return t('builtIn');
  const types = new Set(level.grid.flat().filter(Boolean).map(cell => cell.type));
  return t('brickMix', { n: types.size });
}

function allLevels() {
  return [...LEVELS, ...settings.custom];
}

function campaignLevels() {
  const byLevel = new Map(allLevels().map(level => [level.id, level]));
  return settings.order.map(id => byLevel.get(id)).filter(Boolean);
}

function firstLevel() {
  return campaignLevels()[0] || LEVELS[0];
}

function remember() {
  if (persist()) return true;
  showToast(t('storageUnavailable'), 'help');
  return false;
}

function text(id, value) {
  const element = byId(id);
  if (element.textContent !== value) element.textContent = value;
}

function buttonContent(symbol, label, size = 17) {
  return `${icon(symbol, size)}<span>${escape(label)}</span>`;
}

function labelIcon(button, symbol, label) {
  button.innerHTML = icon(symbol, 17);
  button.title = label;
  button.setAttribute('aria-label', label);
}

function renderLanguage() {
  document.documentElement.lang = lang;
  document.title = t('pageTitle');
  document.querySelector('meta[name="description"]').content = t('pageDescription');
  byId('navigation').setAttribute('aria-label', t('navLabel'));
  byId('language').value = settings.language;
  byId('language').setAttribute('aria-label', t('language'));
  byId('language').querySelector('[value="auto"]').textContent = t('auto');
  byId('language-control').title = t('language');
  for (const link of document.querySelectorAll('[data-nav]')) {
    const key = link.dataset.nav;
    link.innerHTML = buttonContent(navIcon[key], t(`nav${key[0].toUpperCase()}${key.slice(1)}`), 16);
  }
  text('play-title', t('arcade'));
  text('play-description', t('arcadeSubtitle'));
  text('field-label', t('playfield'));
  text('stats-heading', t('runStats'));
  text('score-label', t('score'));
  text('best-label', t('best'));
  text('lives-label', t('lives'));
  text('current-level-label', t('currentLevel'));
  text('controls-heading', t('controls'));
  byId('guide-button').innerHTML = buttonContent('help', t('howToPlay'));
  byId('campaign-button').innerHTML = buttonContent('play', t('startCampaign'));
  canvas.setAttribute('aria-label', t('canvasLabel'));
  byId('play-sidebar').setAttribute('aria-label', t('runStats'));
  renderSound();
  renderControls();
  renderGuide();
  displayedPhase = displayedLevel = displayedLives = null;
  if (state) updateGame(state);
  if (view && view !== 'play') renderView();
}

function renderSound() {
  labelIcon(byId('sound'), settings.muted ? 'mute' : 'sound', t(settings.muted ? 'unmute' : 'mute'));
}

function renderControls() {
  const command = keys => `<span class="keys">${keys.map(key => `<kbd>${escape(key)}</kbd>`).join('')}</span>`;
  const action = (label, controls) => `<div class="control-row"><span>${escape(label)}</span>${controls}</div>`;
  byId('controls-list').innerHTML = finePointer.matches
    ? action(t('move'), `<span class="keys">${command(['←', '→'])}<span class="pointer-key" title="${escape(t('mouse'))}">${icon('pointer', 15)}</span></span>`)
      + action(t('launchOrFire'), command(['Space']))
      + action(t('pauseControl'), command(['P', 'Esc']))
    : action(t('move'), `<span>${escape(t('touchMove'))}</span>`)
      + action(t('launchOrFire'), `<span>${escape(t('touchLaunch'))}</span>`);
}

function renderRoute(focus = false) {
  const candidate = location.hash.slice(1);
  const next = views.includes(candidate) ? candidate : 'play';
  if (view === next) return;
  if (view === 'play' && state?.phase === 'playing') game.togglePause();
  pressed.clear();
  game.setDirection(0);
  view = next;
  for (const id of views) byId(id).hidden = id !== view;
  for (const link of document.querySelectorAll('[data-nav]')) {
    if (link.dataset.nav === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  renderView();
  if (focus) {
    window.scrollTo(0, 0);
    const heading = byId(view).querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function go(next) {
  if (view !== next) {
    history.pushState(null, '', `#${next}`);
    renderRoute(true);
  } else {
    renderView();
  }
}

function renderView() {
  if (view === 'levels') renderLibrary();
  if (view === 'editor') renderEditor();
  if (view === 'scores') renderScores();
  if (view === 'play' && state) {
    displayedLevel = null;
    updateGame(state);
  }
}

function modeLabel(mode) {
  return t(mode === 'single' ? (run?.test ? 'testMode' : 'single') : 'campaign');
}

function updateGame(next) {
  state = next;
  if (!state) return;
  const { phase, score, lives, mode } = state;
  const currentLevel = state.level || firstLevel();
  const orderSize = phase === 'idle' ? campaignLevels().length : state.levelCount;
  const position = phase === 'idle' ? 1 : state.levelIndex + 1;
  text('current-score', formatScore(score || 0));
  text('best-score', formatScore(settings.scores[0]?.score || 0));
  text('field-mode', modeLabel(mode));
  byId('campaign-button').hidden = mode !== 'single';
  text('level-number', t('levelOf', { current: position, total: orderSize }));
  text('level-name', levelName(currentLevel));
  text('level-subtitle', levelSubtitle(currentLevel));
  if (displayedLives !== lives) {
    displayedLives = lives;
    const hearts = byId('hearts');
    const shown = lives ?? 3;
    hearts.innerHTML = Array.from({ length: Math.max(3, Math.min(shown, 7)) }, (_, i) => (
      `<span class="${i < shown ? 'has-life' : ''}">${icon('heart', 17)}</span>`
    )).join('') + (shown > 7 ? `<small>+${shown - 7}</small>` : '');
    hearts.setAttribute('aria-label', t(shown === 1 ? 'livesCountOne' : 'livesCount', { n: shown }));
  }
  if (displayedLevel !== currentLevel && view === 'play') {
    displayedLevel = currentLevel;
    drawBoardPreview(byId('level-preview'), currentLevel);
  }
  const completed = phase === 'won' || phase === 'levelComplete' ? position : position - 1;
  const order = `${position}:${orderSize}:${completed}`;
  if (displayedOrder !== order) {
    displayedOrder = order;
    const progress = byId('level-progress');
    progress.innerHTML = Array.from({ length: Math.min(orderSize, 40) }, (_, i) => (
      `<span class="${i < completed ? 'complete' : i === position - 1 ? 'current' : ''}"></span>`
    )).join('');
  }
  if (phase !== displayedPhase) {
    displayedPhase = phase;
    byId('phase-tag').dataset.phase = phase;
    text('phase-text', t(`status${phase[0].toUpperCase()}${phase.slice(1)}`));
    const canPause = ['playing', 'paused'].includes(phase);
    const pauseButton = byId('pause-button');
    labelIcon(pauseButton, phase === 'paused' ? 'play' : 'pause', t(phase === 'paused' ? 'resume' : 'pause'));
    pauseButton.disabled = !canPause;
    const restartButton = byId('restart-button');
    labelIcon(restartButton, 'restart', t('restart'));
    restartButton.disabled = phase === 'idle';
    renderOverlay();
  }
}

function renderOverlay() {
  const { phase, score } = state;
  overlay.dataset.phase = phase;
  overlay.hidden = phase === 'playing';
  if (phase === 'playing') {
    overlay.replaceChildren();
    return;
  }

  const action = (symbol, label) => `<button class="button button-primary board-action" data-action="board" type="button">${buttonContent(symbol, t(label), 17)}</button>`;
  const heading = key => `<h2>${escape(t(key))}</h2>`;
  if (phase === 'idle') {
    const shortcut = 'SX_START_KEY';
    const hint = escape(t('pressStart', { key: shortcut })).replace(shortcut, '<kbd>Space</kbd>');
    overlay.innerHTML = `<div class="start-content">
      ${action('play', 'startCampaign')}
      <p>${finePointer.matches ? hint : escape(t('clickStart'))}</p>
    </div>`;
  } else if (phase === 'ready') {
    overlay.innerHTML = `<div class="overlay-card ready-card">${heading('readyTitle')}${action('play', 'readyAction')}</div>`;
  } else if (phase === 'paused') {
    overlay.innerHTML = `<div class="overlay-card">${heading('pausedTitle')}${action('play', 'resume')}</div>`;
  } else if (phase === 'levelComplete') {
    overlay.innerHTML = `<div class="overlay-card"><div class="overlay-medal">${icon('check', 23)}</div>${heading('levelCleared')}${action('chevron', 'nextLevel')}</div>`;
  } else {
    const saved = latestScore && settings.scores.some(entry => entry.id === latestScore);
    overlay.innerHTML = `<div class="overlay-card">
      <div class="overlay-medal">${icon(phase === 'won' ? 'trophy' : 'game', 24)}</div>
      ${heading(phase === 'won' ? 'wonTitle' : 'lostTitle')}
      <strong class="result-score">${escape(t('finalScore', { score: formatScore(score) }))}</strong>
      ${run?.test || saved ? `<p>${escape(t(run?.test ? 'noScoreTest' : 'newHighScore'))}</p>` : ''}
      <div class="overlay-buttons">
        ${action('restart', 'playAgain')}
        <button type="button" class="button button-secondary" data-action="end-link">${buttonContent(run?.test ? 'editor' : 'trophy', t(run?.test ? 'navEditor' : 'navScores'), 16)}</button>
      </div>
    </div>`;
  }
}

function start(levels, mode, test = false) {
  if (!levels.length) return;
  latestScore = null;
  run = { levels, mode, test };
  go('play');
  game.start(levels, { mode });
  game.action();
  canvas.focus({ preventScroll: true });
}

function boardAction() {
  if (!state || state.phase === 'idle') {
    start(campaignLevels(), 'campaign');
    return;
  }
  if (['won', 'lost'].includes(state.phase)) {
    if (run) start(run.mode === 'campaign' ? campaignLevels() : run.levels, run.mode, run.test);
    return;
  }
  game.action();
  canvas.focus({ preventScroll: true });
}

function restartRun() {
  if (!run || !state) return;
  if (!['won', 'lost'].includes(state.phase)) {
    const wasPlaying = state.phase === 'playing';
    if (wasPlaying) game.togglePause();
    if (!confirm(t('restartConfirm'))) {
      if (wasPlaying) game.togglePause();
      return;
    }
  }
  start(run.levels, run.mode, run.test);
}

function endRun(result) {
  latestScore = null;
  if (result.score > 0 && !run?.test) {
    const entry = {
      id: newId(), name: settings.player, score: result.score, date: Date.now(),
      mode: result.mode, level: result.level?.id || firstLevel().id,
    };
    const scores = [...settings.scores, entry].sort(compareScores).slice(0, 10);
    if (scores.some(item => item.id === entry.id)) {
      latestScore = entry.id;
      settings.scores = scores;
      remember();
    }
  }
  updateGame(result);
  renderOverlay();
}

function showToast(message, symbol = 'check') {
  const notice = byId('power-toast');
  notice.innerHTML = buttonContent(symbol, message);
  notice.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    notice.hidden = true;
  }, 2600);
}

function showPower(id) {
  showToast(t(`power_${id}`), 'spark');
}

function header(title, subtitle, actions = '') {
  return `<div class="page-heading"><div><h1>${escape(t(title))}</h1><p>${escape(t(subtitle))}</p></div>
    ${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
}

function button(action, label, symbol, options = {}) {
  const { style = 'button-secondary', id, disabled = false } = options;
  return `<button type="button" class="button ${style}" data-action="${action}"${id == null ? '' : ` data-id="${escape(id)}"`}${disabled ? ' disabled' : ''}>${buttonContent(symbol, t(label))}</button>`;
}

function renderLibrary() {
  const levels = allLevels();
  const order = campaignLevels();
  const library = byId('levels');
  const isAll = libraryTab === 'all';
  const action = isAll
    ? button('create', 'createLevel', 'plus', { style: 'button-primary' })
    : button('start-campaign', 'startCampaign', 'play', { style: 'button-primary' });
  library.innerHTML = header('libraryTitle', 'librarySubtitle', action)
    + `<div class="view-switch" role="group" aria-label="${escape(t('libraryTitle'))}">
      <button type="button" data-action="tab-all" aria-pressed="${isAll}">${buttonContent('grid', t('allLevels'))}</button>
      <button type="button" data-action="tab-order" aria-pressed="${!isAll}">${buttonContent('list', t('campaignOrder'))}</button>
    </div>`
    + (isAll
      ? `<div class="level-grid">${levels.map(levelCard).join('')}</div>`
      : `<div class="order-layout">
        <section class="panel order-panel">
          <h2>${escape(t('campaignOrder'))}</h2><p>${escape(t('campaignOrderHelp'))}</p>
          <ol class="order-list">${order.map((level, index) => orderRow(level, index, order.length)).join('')}</ol>
        </section>
        <section class="panel order-panel">
          <h2>${escape(t('availableLevels'))}</h2>
          ${levels.some(level => !settings.order.includes(level.id))
            ? `<ul class="order-list">${levels.filter(level => !settings.order.includes(level.id)).map(level => orderRow(level)).join('')}</ul>`
            : `<p>${escape(t('noAvailableLevels'))}</p>`}
        </section>
      </div>`);
  const previews = library.querySelectorAll('canvas[data-preview]');
  const levelMap = new Map(levels.map(level => [level.id, level]));
  for (const preview of previews) drawBoardPreview(preview, levelMap.get(preview.dataset.preview));
}

function levelCard(level, index) {
  const custom = typeof level.name === 'string';
  const badge = custom ? t('custom') : t('levelLabel', { n: String(index + 1).padStart(2, '0') });
  return `<article class="panel level-card">
    <div class="level-art">
      <canvas width="392" height="188" data-preview="${escape(level.id)}" aria-hidden="true"></canvas>
      <span class="level-badge">${escape(badge)}</span>
    </div>
    <div class="level-card-body">
      <h2>${escape(levelName(level))}</h2><p>${escape(levelSubtitle(level))}</p>
      <div class="level-card-actions">
        ${button('play-level', 'playLevel', 'play', { id: level.id })}
        ${custom ? iconAction('edit', 'editLevel', 'editor', level.id) : ''}
      </div>
    </div>
  </article>`;
}

function iconAction(action, label, symbol, id, disabled = false) {
  return `<button class="icon-button" type="button" data-action="${action}" data-id="${escape(id)}"
    aria-label="${escape(t(label))}" title="${escape(t(label))}"${disabled ? ' disabled' : ''}>${icon(symbol, 17)}</button>`;
}

function orderRow(level, index, count) {
  const included = index !== undefined;
  return `<li class="order-row">
    ${included ? `<span class="order-number">${String(index + 1).padStart(2, '0')}</span>` : ''}
    <canvas width="96" height="60" data-preview="${escape(level.id)}" aria-hidden="true"></canvas>
    <div class="order-name"><strong>${escape(levelName(level))}</strong><span>${escape(levelSubtitle(level))}</span></div>
    <div class="order-actions">${included
      ? iconAction('order-up', 'moveUp', 'up', level.id, index === 0)
        + iconAction('order-down', 'moveDown', 'down', level.id, index === count - 1)
        + iconAction('order-remove', 'removeFromCampaign', 'close', level.id, count === 1)
      : iconAction('order-add', 'addToCampaign', 'plus', level.id)}</div>
  </li>`;
}

function changeOrder(action, id) {
  const index = settings.order.indexOf(id);
  if (action === 'order-add' && index < 0) {
    settings.order.push(id);
  } else if (action === 'order-remove' && index >= 0 && settings.order.length > 1) {
    settings.order.splice(index, 1);
  } else if (index >= 0) {
    const target = index + (action === 'order-up' ? -1 : 1);
    if (target < 0 || target >= settings.order.length) return;
    [settings.order[index], settings.order[target]] = [settings.order[target], settings.order[index]];
  }
  const saved = remember();
  if (state?.phase === 'idle') game.preview(firstLevel());
  renderLibrary();
  const actions = [...byId('levels').querySelectorAll('[data-id]')].filter(element => element.dataset.id === id);
  (actions.find(element => element.dataset.action === action && !element.disabled)
    || actions.find(element => !element.disabled))?.focus();
  if (saved) announce(t('orderChanged'));
}

function makeDraft(level) {
  return {
    id: level?.id || null,
    name: level?.name || '',
    grid: cloneGrid(level?.grid),
    include: level ? settings.order.includes(level.id) : false,
    history: [],
    activeCell: 0,
    error: null,
  };
}

function renderEditor() {
  const area = byId('editor');
  area.innerHTML = header(editor.id ? 'editTitle' : 'editorTitle', 'editorSubtitle',
    editor.id ? button('create', 'createLevel', 'plus') : '')
    + `<form id="level-form" class="editor-layout">
      <section class="panel editor-board-panel">
        <div class="editor-board-top"><span class="eyebrow">${escape(t('boardSize', { cols: COLS, rows: ROWS }))}</span>
          <div class="editor-board-actions">
            ${button('erase', 'erase', 'eraser')}
            ${button('undo', 'undo', 'undo', { disabled: !editor.history.length })}
            ${button('clear', 'clearBoard', 'trash')}
          </div>
        </div>
        <div class="editor-grid" id="editor-grid" role="group" aria-label="${escape(t('editorTitle'))}">
          ${editor.grid.flat().map((_, index) => `<button class="editor-cell" type="button" data-cell="${index}" tabindex="${index === editor.activeCell ? '0' : '-1'}"></button>`).join('')}
        </div>
        <div class="editor-board-bottom">
          <label class="check-label"><input type="checkbox" name="include" ${editor.include ? 'checked' : ''}>${escape(t('includeCampaign'))}</label>
          ${editor.id ? button('delete-level', 'deleteLevel', 'trash', { style: 'button-danger' }) : ''}
        </div>
      </section>
      <section class="panel editor-tools-panel">
        <label class="input-label">${escape(t('levelName'))}<input name="name" maxlength="40" placeholder="${escape(t('namePlaceholder'))}" value="${escape(editor.name)}" autocomplete="off"></label>
        <fieldset class="tile-field"><legend>${escape(t('brickType'))}</legend>
          <div class="type-tools">${BRICK_TYPES.map(brick => `<button type="button" data-action="brick-type" data-id="${brick.id}" aria-pressed="false" title="${escape(t(`brickDesc_${brick.id}`))}">
            ${brickChip({ type: brick.id, color: brick.color })}<span>${escape(t(`brick_${brick.id}`))}</span></button>`).join('')}
          </div>
        </fieldset>
        <fieldset class="tile-field"><legend>${escape(t('brickColor'))}</legend>
          <div class="color-tools">${Object.entries(COLORS).map(([id, color]) => `<button type="button" data-action="brick-color" data-id="${escape(id)}" style="--paint:${color.base}" aria-pressed="false" aria-label="${escape(t(`color_${id}`))}" title="${escape(t(`color_${id}`))}"></button>`).join('')}</div>
        </fieldset>
        <p class="form-error" id="editor-error" role="status">${editor.error ? escape(t(editor.error)) : ''}</p>
        <div class="editor-submit">
          <button type="submit" class="button button-primary">${buttonContent('save', t('saveLevel'))}</button>
          ${button('test-level', 'testLevel', 'play')}
        </div>
      </section>
    </form>`;
  renderCells();
  renderBrush();
  const grid = byId('editor-grid');
  grid.addEventListener('pointerdown', startPaint);
  grid.addEventListener('pointermove', dragPaint);
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    grid.addEventListener(event, endPaint);
  }
  grid.addEventListener('contextmenu', event => event.preventDefault());
}

function brickChip(cell) {
  if (!cell) return '';
  const type = cell.type || 'normal';
  const color = COLORS[cell.color] || COLORS.rose;
  const symbols = { explosive: '✦', hidden: '?', gold: '◆', cracked: '◇', gray: '•', silver: '••', steel: '•••' };
  return `<span class="brick-chip" aria-hidden="true" data-brick="${type}" style="--chip-top:${color.top};--chip-base:${color.base};--chip-shadow:${color.shadow}">${symbols[type] || ''}</span>`;
}

function renderCell(index) {
  const grid = byId('editor-grid');
  const cell = grid.children[index];
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const brick = editor.grid[row][col];
  cell.innerHTML = brickChip(brick);
  cell.setAttribute('aria-label', t(brick ? 'cellFilled' : 'cellEmpty', {
    row: row + 1, col: col + 1, brick: brick ? t(`brick_${brick.type}`) : '',
  }));
}

function renderCells() {
  for (let i = 0; i < COLS * ROWS; i++) renderCell(i);
  refreshUndo();
}

function renderBrush() {
  const form = byId('level-form');
  for (const button of form.querySelectorAll('[data-action="brick-type"], [data-action="brick-color"], [data-action="erase"]')) {
    const action = button.dataset.action;
    const selected = action === 'erase' ? brush.type === 'erase'
      : action === 'brick-color' ? brush.type === 'normal' && button.dataset.id === brush.color
      : button.dataset.id === brush.type;
    button.setAttribute('aria-pressed', selected);
  }
}

function refreshUndo() {
  byId('level-form').querySelector('[data-action="undo"]').disabled = !editor.history.length;
}

function snapshot() {
  return cloneGrid(editor.grid);
}

function pushUndo(previous) {
  editor.history.push(previous);
  if (editor.history.length > 35) editor.history.shift();
  refreshUndo();
}

function activateCell(index, focus = false) {
  const cells = byId('editor-grid').children;
  cells[editor.activeCell].tabIndex = -1;
  editor.activeCell = index;
  cells[index].tabIndex = 0;
  if (focus) cells[index].focus({ preventScroll: true });
}

function paint(index, erase = false) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const color = brush.type === 'normal' ? brush.color : brickById.get(brush.type)?.color;
  const next = erase || brush.type === 'erase' ? null : { type: brush.type, color };
  const before = editor.grid[row][col];
  if (before?.type === next?.type && before?.color === next?.color) return false;
  editor.grid[row][col] = next;
  renderCell(index);
  editorError(null);
  return true;
}

function startPaint(event) {
  const cell = event.target.closest('[data-cell]');
  if (!cell || stroke || ![0, 2].includes(event.button)) return;
  event.preventDefault();
  const index = Number(cell.dataset.cell);
  activateCell(index, true);
  const before = snapshot();
  const erase = event.button === 2;
  stroke = { pointer: event.pointerId, erase, before, changed: paint(index, erase), last: index };
  event.currentTarget.setPointerCapture(event.pointerId);
}

function dragPaint(event) {
  if (stroke?.pointer !== event.pointerId) return;
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell]');
  if (!cell || !event.currentTarget.contains(cell)) {
    stroke.last = null;
    return;
  }
  const next = Number(cell.dataset.cell);
  if (next === stroke.last) return;
  const start = stroke.last ?? next;
  const row = Math.floor(start / COLS);
  const col = start % COLS;
  const dy = Math.floor(next / COLS) - row;
  const dx = next % COLS - col;
  const steps = Math.max(1, Math.abs(dx), Math.abs(dy));
  for (let step = 1; step <= steps; step++) {
    const index = Math.round(row + dy * step / steps) * COLS + Math.round(col + dx * step / steps);
    if (paint(index, stroke.erase)) stroke.changed = true;
  }
  stroke.last = next;
}

function endPaint(event) {
  if (stroke?.pointer !== event.pointerId) return;
  if (stroke.changed) pushUndo(stroke.before);
  stroke = null;
}

function editorError(key) {
  editor.error = key;
  text('editor-error', key ? t(key) : '');
  const input = byId('level-form').elements.name;
  if (key === 'nameRequired') input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function validateLevel(isTest = false) {
  if (!isTest && !editor.name.trim()) {
    editorError('nameRequired');
    byId('level-form').elements.name.focus();
    return false;
  }
  if (!editor.grid.some(row => row.some(cell => cell && cell.type !== 'gold'))) {
    editorError('emptyBoard');
    return false;
  }
  return true;
}

function editorLevel() {
  return { id: editor.id || newId(), name: editor.name.trim() || t('untitled'), grid: snapshot() };
}

function saveLevel() {
  if (!validateLevel()) return;
  const level = editorLevel();
  const index = settings.custom.findIndex(item => item.id === level.id);
  if (index >= 0) settings.custom[index] = level;
  else settings.custom.push(level);
  if (editor.include && !settings.order.includes(level.id)) settings.order.push(level.id);
  if (!editor.include && settings.order.includes(level.id) && settings.order.length > 1) {
    settings.order = settings.order.filter(id => id !== level.id);
  }
  editor.id = level.id;
  editor.include = settings.order.includes(level.id);
  const saved = remember();
  if (state?.phase === 'idle') game.preview(firstLevel());
  renderEditor();
  if (saved) showToast(t('levelSaved'));
}

function deleteLevel() {
  if (!editor.id || !confirm(t('confirmDelete', { name: editor.name }))) return;
  settings.custom = settings.custom.filter(level => level.id !== editor.id);
  settings.order = settings.order.filter(id => id !== editor.id);
  if (!settings.order.length) settings.order = LEVELS.map(level => level.id);
  const saved = remember();
  if (state?.phase === 'idle') game.preview(firstLevel());
  editor = makeDraft();
  libraryTab = 'all';
  go('levels');
  if (saved) showToast(t('levelRemoved'));
}

function renderScores() {
  const latest = settings.scores.find(entry => entry.id === latestScore);
  byId('scores').innerHTML = header('scoresTitle', 'scoresSubtitle',
    `<span class="privacy-note">${icon('lock', 15)}${escape(t('localOnly'))}</span>`)
    + (latest ? `<form class="panel latest-score" id="name-form">
      <div class="latest-title"><span class="overlay-medal">${icon('trophy', 21)}</span><div>
        <strong>${escape(t('latestScore'))}</strong><span>${escape(t('finalScore', { score: formatScore(latest.score) }))}</span>
      </div></div>
      <label class="input-label"><span class="sr-only">${escape(t('enterName'))}</span><input name="player" maxlength="24" autocomplete="off" placeholder="${escape(t('enterName'))}" value="${escape(latest.name)}"></label>
      <button type="submit" class="button button-primary">${buttonContent('check', t('saveName'))}</button>
    </form>` : '')
    + (settings.scores.length ? `<div class="panel score-table-panel"><div class="table-scroll"><table>
      <caption class="sr-only">${escape(t('scoresTitle'))}</caption>
      <thead><tr>${['rank', 'player', 'run', 'date', 'score'].map(key => `<th scope="col">${escape(t(key))}</th>`).join('')}</tr></thead>
      <tbody>${settings.scores.map(scoreRow).join('')}</tbody>
    </table></div></div>` : `<section class="panel empty-scores">
      <div class="empty-trophy">${icon('trophy', 40)}</div>
      <h2>${escape(t('emptyScores'))}</h2><p>${escape(t('firstRun'))}</p>
      ${button('start-campaign', 'startCampaign', 'play', { style: 'button-primary' })}
    </section>`);
}

function scoreRow(entry, index) {
  const date = new Date(entry.date);
  const timestamp = new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(date);
  const level = allLevels().find(item => item.id === entry.level);
  const name = entry.name || t('player');
  return `<tr${entry.id === latestScore ? ' class="latest-row"' : ''}>
    <td><span class="rank rank-${index + 1}">${index === 0 ? icon('trophy', 15) : ''}${String(index + 1).padStart(2, '0')}</span></td>
    <td><strong>${escape(name)}</strong></td>
    <td><span>${escape(t(entry.mode === 'single' ? 'single' : 'campaign'))}</span>${level ? `<small>${escape(levelName(level))}</small>` : ''}</td>
    <td><time datetime="${date.toISOString()}">${escape(timestamp)}</time></td>
    <td><strong class="table-score">${escape(formatScore(entry.score))}</strong></td>
  </tr>`;
}

function renderGuide() {
  guide.setAttribute('aria-labelledby', 'guide-title');
  guide.innerHTML = `<div class="guide-head"><div><h2 id="guide-title">${escape(t('gameGuide'))}</h2></div>
    ${iconAction('close-guide', 'close', 'close', '')}</div>
    <div class="guide-body"><p>${escape(t('guideIntro'))}</p>
      <h3>${escape(t('brickGuide'))}</h3>
      <ul class="guide-grid">${BRICK_TYPES.map(brick => `<li>${brickChip({ type: brick.id, color: brick.color })}
        <div><strong>${escape(t(`brick_${brick.id}`))}</strong><p>${escape(t(`brickDesc_${brick.id}`))}</p></div></li>`).join('')}</ul>
      <h3>${escape(t('powerGuide'))}</h3><p>${escape(t('guidePowerIntro'))}</p>
      <ul class="guide-grid">${POWERUPS.map(power => `<li><span class="power-chip" data-kind="${power.kind}" aria-hidden="true">${escape(power.symbol)}</span>
        <div><strong>${escape(t(`power_${power.id}`))}</strong><p>${escape(t(`powerDesc_${power.id}`))}</p></div></li>`).join('')}</ul>
    </div>`;
}

function announce(message) {
  text('announcement', '');
  requestAnimationFrame(() => text('announcement', message));
}

const actions = {
  board: boardAction,
  pause: () => game.togglePause(),
  restart: restartRun,
  guide: () => {
    if (state?.phase === 'playing') game.togglePause();
    guide.showModal();
  },
  'close-guide': () => guide.close(),
  'end-link': () => go(run?.test ? 'editor' : 'scores'),
  'start-campaign': () => start(campaignLevels(), 'campaign'),
  create: () => {
    editor = makeDraft();
    go('editor');
    byId('level-form').elements.name.focus();
  },
  edit: id => {
    const level = settings.custom.find(item => item.id === id);
    if (!level) return;
    editor = makeDraft(level);
    go('editor');
  },
  'tab-all': () => {
    libraryTab = 'all';
    renderLibrary();
    byId('levels').querySelector('[data-action="tab-all"]').focus();
  },
  'tab-order': () => {
    libraryTab = 'order';
    renderLibrary();
    byId('levels').querySelector('[data-action="tab-order"]').focus();
  },
  'play-level': id => {
    const level = allLevels().find(item => item.id === id);
    if (level) start([level], 'single');
  },
  'delete-level': deleteLevel,
  'test-level': () => {
    if (validateLevel(true)) start([editorLevel()], 'single', true);
  },
  'brick-type': id => {
    brush.type = id;
    renderBrush();
  },
  'brick-color': id => {
    brush = { type: 'normal', color: id };
    renderBrush();
  },
  erase: () => {
    brush.type = brush.type === 'erase' ? 'normal' : 'erase';
    renderBrush();
  },
  undo: () => {
    if (!editor.history.length) return;
    editor.grid = editor.history.pop();
    renderCells();
    editorError(null);
  },
  clear: () => {
    if (!editor.grid.some(row => row.some(Boolean))) return;
    pushUndo(snapshot());
    editor.grid = cloneGrid();
    renderCells();
    editorError(null);
  },
};

document.addEventListener('click', event => {
  const route = event.target.closest('a[data-nav], a.brand');
  if (route && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    go(route.dataset.nav || 'play');
    return;
  }
  const control = event.target.closest('[data-action]');
  if (control && !control.disabled) {
    const { action, id } = control.dataset;
    if (action.startsWith('order-')) changeOrder(action, id);
    else actions[action]?.(id);
    if (view === 'play' && control.classList.contains('field-button') && !control.disabled) {
      canvas.focus({ preventScroll: true });
    }
    return;
  }
  const cell = event.target.closest('[data-cell]');
  if (cell && event.detail === 0) {
    const before = snapshot();
    if (paint(Number(cell.dataset.cell))) pushUndo(before);
  }
});

document.addEventListener('input', event => {
  if (event.target.form?.id !== 'level-form') return;
  if (event.target.name === 'name') {
    editor.name = event.target.value;
    if (editor.error === 'nameRequired') editorError(null);
  }
  if (event.target.name === 'include') editor.include = event.target.checked;
});

document.addEventListener('submit', event => {
  if (event.target.id === 'level-form') {
    event.preventDefault();
    saveLevel();
  }
  if (event.target.id === 'name-form') {
    event.preventDefault();
    const entry = settings.scores.find(item => item.id === latestScore);
    if (!entry) return;
    entry.name = event.target.elements.player.value.trim().slice(0, 24);
    settings.player = entry.name;
    if (remember()) showToast(t('nameSaved'));
    renderScores();
    byId('name-form').elements.player.focus();
  }
});

function syncMovement() {
  let direction = 0;
  for (const key of pressed) direction += movement.get(key);
  game.setDirection(Math.sign(direction));
}

function clearMovement(autoPause = false) {
  pressed.clear();
  syncMovement();
  if (autoPause && state?.phase === 'playing') game.togglePause();
}

document.addEventListener('keydown', event => {
  if (view === 'editor' && event.target.matches('[data-cell]')) {
    const { key } = event;
    const index = Number(event.target.dataset.cell);
    let target = index;
    if (key === 'ArrowLeft' && index % COLS > 0) target--;
    if (key === 'ArrowRight' && index % COLS < COLS - 1) target++;
    if (key === 'ArrowUp' && index >= COLS) target -= COLS;
    if (key === 'ArrowDown' && index < COLS * (ROWS - 1)) target += COLS;
    if (key.startsWith('Arrow')) {
      event.preventDefault();
      activateCell(target, true);
    }
  }
  if (view !== 'play' || guide.open || event.altKey || event.ctrlKey || event.metaKey
      || event.target.closest('button, select, a, input, textarea, [contenteditable="true"]')) return;
  if (movement.has(event.code)) {
    event.preventDefault();
    pressed.add(event.code);
    syncMovement();
  } else if (event.code === 'Space') {
    event.preventDefault();
    if (!event.repeat) boardAction();
  } else if (['KeyP', 'Escape'].includes(event.code) && !event.repeat) {
    event.preventDefault();
    game.togglePause();
  }
});

document.addEventListener('keyup', event => {
  if (pressed.delete(event.code)) syncMovement();
});
canvas.addEventListener('click', boardAction);
window.addEventListener('blur', () => clearMovement(true));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearMovement(true);
});
window.addEventListener('popstate', () => renderRoute(true));
window.addEventListener('hashchange', () => renderRoute(true));
window.addEventListener('languagechange', () => {
  const next = detectLanguage();
  if (lang === next) return;
  lang = next;
  renderLanguage();
});
byId('language').addEventListener('change', event => {
  settings.language = event.target.value;
  lang = detectLanguage();
  renderLanguage();
  remember();
});
byId('sound').addEventListener('click', () => {
  settings.muted = !settings.muted;
  game.setMuted(settings.muted);
  renderSound();
  remember();
});
finePointer.addEventListener('change', () => {
  renderControls();
  if (state?.phase === 'idle') renderOverlay();
});

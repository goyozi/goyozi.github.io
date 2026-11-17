import { COLS, ROWS, LEVELS, COLORS } from './levels.js';

const KEY = 'sx-ball.v1';
const validTypes = new Set(['normal', 'explosive', 'hidden', 'gold', 'cracked', 'gray', 'silver', 'steel']);
const defaultOrder = LEVELS.map(level => level.id);

function gridFrom(value) {
  return Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLS }, (_, col) => {
    const cell = value?.[row]?.[col];
    return cell && validTypes.has(cell.type) && Object.hasOwn(COLORS, cell.color)
      ? { type: cell.type, color: cell.color }
      : null;
  }));
}

function levelsFrom(value) {
  if (!Array.isArray(value)) return [];
  const ids = new Set(defaultOrder);
  return value.flatMap(level => {
    if (!level || typeof level.id !== 'string' || typeof level.name !== 'string') return [];
    const name = level.name.trim().slice(0, 40);
    const grid = gridFrom(level.grid);
    if (!name || ids.has(level.id) || !grid.some(row => row.some(cell => cell && cell.type !== 'gold'))) return [];
    ids.add(level.id);
    return [{ id: level.id, name, grid }];
  });
}

function scoresFrom(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(entry => entry && typeof entry.id === 'string'
      && typeof entry.name === 'string' && Number.isFinite(entry.score) && entry.score > 0
      && Number.isFinite(entry.date) && Math.abs(entry.date) <= 8.64e15
      && ['campaign', 'single'].includes(entry.mode) && typeof entry.level === 'string')
    .map(entry => ({ ...entry, name: entry.name.slice(0, 24) }))
    .sort(compareScores)
    .slice(0, 10);
}

function load() {
  let value;
  try {
    value = JSON.parse(localStorage.getItem(KEY));
  } catch {
    value = null;
  }
  const custom = levelsFrom(value?.custom);
  const validIds = new Set([...defaultOrder, ...custom.map(level => level.id)]);
  const order = Array.isArray(value?.order) ? [...new Set(value.order.filter(id => validIds.has(id)))] : [];
  return {
    custom,
    order: order.length ? order : [...defaultOrder],
    scores: scoresFrom(value?.scores),
    language: ['auto', 'en', 'pl'].includes(value?.language) ? value.language : 'auto',
    muted: value?.muted === true,
    player: typeof value?.player === 'string' ? value.player.slice(0, 24) : '',
  };
}

export const settings = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function compareScores(a, b) {
  return b.score - a.score || a.date - b.date;
}

export function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function cloneGrid(grid) {
  return gridFrom(grid);
}

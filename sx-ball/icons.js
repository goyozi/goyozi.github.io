const paths = {
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke-linejoin="round"/>',
  levels: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M4 9.5h16M4 14.5h16M10 4v5.5m4 0v5m-4 0V20"/>',
  editor: '<path d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m15 5 4 4m-9 5 1-4 7.3-7.3a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L14 13z"/>',
  trophy: '<path d="M8 21h8m-4-4v4M7 4h10v7a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/>',
  sound: '<path d="M11 5 6 9H3v6h3l5 4zM15 9a4 4 0 0 1 0 6m2.5-8.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4zm5 4 5 6m0-6-5 6"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="3.6" ry="8.5"/><path d="M3.5 12h17"/>',
  game: '<path d="M7 7h10c2 0 3 1.2 3.6 3.2l1.1 4.5c.5 2-1.6 3.5-3.2 2.4l-3-2.1h-7l-3 2.1c-1.6 1.1-3.7-.4-3.2-2.4l1.1-4.5C4 8.2 5 7 7 7zM7.5 9.5v4m-2-2h4m6 .5h.1m2.4-2h.1"/>',
  heart: '<path d="M20.8 4.9a5.1 5.1 0 0 0-7.2 0L12 6.5l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2l1.6 1.6 7.2 7.1 7.2-7.1 1.6-1.6a5.1 5.1 0 0 0 0-7.2z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9.2a3 3 0 1 1 4.8 2.4c-1.2.7-1.9 1.1-1.9 2.6m0 2.5h.01"/>',
  pause: '<path d="M9 5v14m6-14v14" stroke-width="2.6"/>',
  restart: '<path d="M4 11a8 8 0 1 1 2 6.2M4 5v6h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  up: '<path d="m6 14 6-6 6 6"/>',
  down: '<path d="m6 10 6 6 6-6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 3v6m4-6v6"/>',
  eraser: '<path d="m5 19-3-3L13 5a2 2 0 0 1 3 0l5 5-9 9zm2-8 7 7m-2 1h9"/>',
  undo: '<path d="M4 11h9a5 5 0 1 1 0 10M4 11l6-6M4 11l6 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  pointer: '<path d="m5 3 14 10-7 1-3 7z"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01m3.3 0h.01m3.3 0h.01m3.3 0h.01M7 14h.01m3 0h7"/>',
  spark: '<path d="M12 2c.5 6 3.5 9 10 10-6.5 1-9.5 4-10 10-.5-6-3.5-9-10-10 6.5-1 9.5-4 10-10z"/>',
  save: '<path d="M5 3h12l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7 3v6h9V3M7 21v-7h10v7"/>',
};

export function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}

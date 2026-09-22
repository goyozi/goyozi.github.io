/* js/config.js */
/* OX Ball — shared constants, brick & power-up definitions, small utilities. */
(function (OX) {
  'use strict';

  // All game coordinates are in logical units. The renderer scales them to device pixels.
  const C = {
    W: 960,                 // playfield width
    H: 720,                 // playfield height
    HUD: 48,                // status bar drawn above the playfield
    COLS: 24,
    ROWS: 24,
    BW: 40,                 // brick width
    BH: 20,                 // brick height
    GRID_TOP: 40,           // y of the first brick row (room for the ball to get behind the wall)
    PADDLE_TOP: 672,
    PADDLE_H: 16,
    PADDLE_SIZES: [44, 76, 112, 150, 192, 236],
    PADDLE_DEFAULT: 2,
    BALL_R: 8,
    BALL_R_SMALL: 5,
    MAX_BALLS: 24,
    MAX_BOUNCE: Math.PI / 3,        // widest angle off the paddle (from vertical)
    MIN_VERTICAL: 0.3,              // |dy| never drops below this, so the ball can't skim sideways forever
    SPEED_BASE: 380,                // starting speed on the first level (units/s)
    SPEED_PER_LEVEL: 7,             // each later level starts a little faster
    SPEED_LEVEL_CAP: 20,
    SPEED_RAMP: 3,                  // the ball slowly picks up speed while in play (units/s²)
    SPEED_MIN: 290,
    SPEED_MAX: 880,
    BULLET_SPEED: 860,
    GUN_COOLDOWN: 0.26,
    MAX_BULLETS: 10,
    CAPSULE_W: 42,
    CAPSULE_H: 18,
    CAPSULE_SPEED: 150,
    MAX_CAPSULES: 5,
    START_LIVES: 3,
    MAX_LIVES: 9,
    LONE_BRICK_WARN: 25,            // seconds a lone last brick may stay untouched before it starts to crackle…
    LONE_BRICK_STRIKE: 31,          // …and when lightning finally takes it out (as in the original)
    STUCK_LOOP_TIME: 45,            // no brick broken for this long → unbreakable bricks turn breakable
  };
  C.FIELD_BOTTOM = C.H;
  C.CANVAS_W = C.W;
  C.CANVAS_H = C.H + C.HUD;
  OX.C = C;

  // Plain bricks: one hit, any of these colours.
  OX.COLORS = {
    r: '#e8383d', o: '#f5842a', y: '#f7d038', l: '#a5d63f',
    g: '#34b25a', t: '#1fb5a8', c: '#3cc8f0', b: '#2f6fe0',
    n: '#4b4fc9', p: '#9150d8', m: '#ea4fa6', w: '#eef2f7',
    s: '#9aa6b8', k: '#4a5160', u: '#9a5b34', e: '#f3b989',
  };
  OX.COLOR_ORDER = 'roylgtcbnpmwskue'.split('');

  // Special bricks. Level files use one character per cell: a colour letter, one of these, or '.'.
  OX.SPECIAL = {
    '2': { type: 'multi', hits: 2 },
    '3': { type: 'multi', hits: 3 },
    'X': { type: 'explode' },
    'H': { type: 'hidden' },
    '#': { type: 'solid' },
  };
  OX.SPECIAL_ORDER = ['2', '3', 'X', 'H', '#'];
  OX.isValidCell = (ch) => ch === '.' || ch in OX.COLORS || ch in OX.SPECIAL;
  OX.isBreakableCell = (ch) => ch !== '.' && ch !== '#';

  // Base points (before the speed / Fireball / Shrink Ball multipliers).
  OX.POINTS = {
    normal: 50,
    multiHit: 25,
    multi: 80,
    explode: 60,
    hiddenReveal: 25,
    hidden: 100,
    solid: 250,
    capsule: 100,
    levelBonusBase: 500,
    levelBonusStep: 100,
    lifeBonus: 5000,
  };

  // The 18 power-ups of the original DX-Ball: ten good (blue), three neutral (grey), five bad (red).
  OX.POWERUPS = {
    expand:      { kind: 'good',    weight: 10 },
    split:       { kind: 'good',    weight: 9 },
    fireball:    { kind: 'good',    weight: 5 },
    thru:        { kind: 'good',    weight: 3 },
    grab:        { kind: 'good',    weight: 7 },
    guns:        { kind: 'good',    weight: 6 },
    setoff:      { kind: 'good',    weight: 4, needs: 'explode' },
    zap:         { kind: 'good',    weight: 4, needs: 'special' },
    warp:        { kind: 'good',    weight: 2 },
    life:        { kind: 'good',    weight: 2 },
    fast:        { kind: 'neutral', weight: 6 },
    slow:        { kind: 'neutral', weight: 6 },
    multiply:    { kind: 'neutral', weight: 3, needs: 'explode' },
    shrink:      { kind: 'bad',     weight: 7 },
    supershrink: { kind: 'bad',     weight: 3 },
    kill:        { kind: 'bad',     weight: 2 },
    fall:        { kind: 'bad',     weight: 3 },
    smallball:   { kind: 'bad',     weight: 4 },
  };
  OX.POWERUP_ORDER = ['expand', 'split', 'fireball', 'thru', 'grab', 'guns', 'setoff', 'zap', 'warp', 'life',
    'fast', 'slow', 'multiply', 'shrink', 'supershrink', 'kill', 'fall', 'smallball'];

  OX.BACKGROUNDS = ['nebula', 'hex', 'circuit', 'plate', 'waves', 'marble', 'stone'];

  // ---- small utilities ----
  const U = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    // Deterministic PRNG (mulberry32) so procedural art looks the same every time.
    rng(seed) {
      let s = seed >>> 0;
      return function () {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    hashString(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    },
    hexToRgb(hex) {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    rgbToHex(r, g, b) {
      const h = (v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
      return '#' + h(r) + h(g) + h(b);
    },
    // amt > 0 mixes towards white, amt < 0 towards black.
    shade(hex, amt) {
      const [r, g, b] = U.hexToRgb(hex);
      const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
      return U.rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
    },
    rgba(hex, a) {
      const [r, g, b] = U.hexToRgb(hex);
      return `rgba(${r},${g},${b},${a})`;
    },
    hsl: (h, s, l, a = 1) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`,
    uid(prefix) {
      return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },
    el(tag, attrs, ...children) {
      const node = document.createElement(tag);
      if (attrs) {
        for (const k in attrs) {
          const v = attrs[k];
          if (v == null || v === false) continue;
          if (k === 'class') node.className = v;
          else if (k === 'text') node.textContent = v;
          else if (k === 'html') node.innerHTML = v;
          else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
          else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
          else if (v === true) node.setAttribute(k, '');
          else node.setAttribute(k, v);
        }
      }
      for (const c of children.flat()) {
        if (c == null || c === false) continue;
        node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      }
      return node;
    },
    reducedMotion() {
      try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    },
  };
  OX.U = U;
})(window.OX = window.OX || {});

/* js/i18n.js */
/* OX Ball — translations (English, Polish), browser language detection, plural rules. */
(function (OX) {
  'use strict';

  const STRINGS = {
    en: {
      'app.tagline': 'Brick-breaking in the spirit of DX-Ball',
      'app.credit': 'A tribute to DX-Ball (1996) by Michael P. Welch.',

      'menu.play': 'Play',
      'menu.levelSelect': 'Choose Level',
      'menu.editor': 'Level Editor',
      'menu.playlist': 'Level Order',
      'menu.highscores': 'High Scores',
      'menu.help': 'How to Play',
      'menu.settings': 'Settings',
      'menu.fullscreen': 'Fullscreen',
      'menu.hint': 'Mouse or ← → to move · Click or Space to launch and fire · P to pause',
      'menu.levelsInGame': { one: '{n} level in the playthrough', other: '{n} levels in the playthrough' },
      'menu.topScore': 'Top score',

      'common.back': 'Back',
      'common.close': 'Close',
      'common.cancel': 'Cancel',
      'common.ok': 'OK',
      'common.delete': 'Delete',
      'common.play': 'Play',
      'common.edit': 'Edit',
      'common.builtin': 'Built-in',
      'common.custom': 'Custom',
      'common.levelN': 'Level {n}',
      'common.untitled': 'Untitled level',
      'common.player': 'Player',

      'hud.score': 'Score',
      'hud.level': 'Level',
      'hud.practice': 'Practice',
      'hud.test': 'Test play',
      'hud.lives': 'Lives',

      'game.launch': 'Click or press Space to launch',
      'game.launchTouch': 'Tap to launch',
      'game.levelComplete': 'Level complete!',
      'game.levelBonus': 'Level bonus +{n}',
      'game.levelWarp': 'Level warp!',
      'game.gameOver': 'Game over',
      'game.victory': 'All levels complete!',
      'game.lifeBonus': 'Lives bonus +{n}',
      'game.zapped': 'The unbreakable bricks gave way!',

      'pause.title': 'Paused',
      'pause.resume': 'Resume',
      'pause.restart': 'Restart level',
      'pause.quit': 'Quit to menu',
      'pause.quitConfirm': 'Quit this game? Your progress will be lost.',
      'pause.quitConfirmOk': 'Quit game',
      'pause.backToEditor': 'Back to editor',
      'pause.hint': 'Press P or Esc to resume',

      'over.title': 'Game over',
      'over.victory': 'Every level cleared!',
      'over.score': 'Final score',
      'over.reached': 'Reached level {n} of {total}',
      'over.newHigh': 'New high score — #{rank}!',
      'over.namePrompt': 'Your name',
      'over.save': 'Save score',
      'over.skip': 'Skip',
      'over.noRank': 'Not quite enough for the top 10 this time.',
      'over.playAgain': 'Play again',
      'over.menu': 'Main menu',

      'practice.complete': 'Level complete!',
      'practice.failed': 'Out of lives',
      'practice.score': 'Score',
      'practice.best': 'Best',
      'practice.newBest': 'New personal best!',
      'practice.retry': 'Play again',
      'practice.next': 'Next level',
      'practice.levels': 'Choose level',
      'practice.note': 'Practice runs don’t count towards the high score table.',
      'test.complete': 'Level cleared — it can be finished!',
      'test.failed': 'Out of lives',

      'scores.title': 'High Scores',
      'scores.name': 'Name',
      'scores.score': 'Score',
      'scores.level': 'Level',
      'scores.date': 'Date',
      'scores.empty': 'No scores yet. Play a game to claim the top spot!',
      'scores.clear': 'Clear high scores',
      'scores.clearConfirm': 'Delete all high scores? This can’t be undone.',
      'scores.cleared': 'High scores cleared',
      'scores.allClear': 'All clear',

      'select.title': 'Choose a Level',
      'select.subtitle': 'Practise any level on its own. Practice runs don’t count towards the high score table.',
      'select.inPlaylist': 'In the playthrough',
      'select.others': 'Not in the playthrough',
      'select.best': 'Best {score}',

      'playlist.title': 'Level Order',
      'playlist.subtitle': 'Choose which levels a new game goes through, and in what order.',
      'playlist.current': 'Playthrough',
      'playlist.available': 'Available levels',
      'playlist.add': 'Add',
      'playlist.addTitle': 'Add to the end of the playthrough',
      'playlist.remove': 'Remove from playthrough',
      'playlist.up': 'Move up',
      'playlist.down': 'Move down',
      'playlist.drag': 'Drag to reorder',
      'playlist.reset': 'Reset to default',
      'playlist.resetConfirm': 'Restore the default order of the built-in levels? Your own levels will leave the playthrough, but won’t be deleted.',
      'playlist.count': { one: '{n} level', other: '{n} levels' },
      'playlist.minOne': 'The playthrough needs at least one level.',
      'playlist.allAdded': 'Every level is already in the playthrough.',

      'editor.homeTitle': 'Level Editor',
      'editor.homeSubtitle': 'Build your own levels. They’re saved in this browser only.',
      'editor.new': 'New level',
      'editor.import': 'Import',
      'editor.exportAll': 'Export all',
      'editor.yourLevels': 'Your levels',
      'editor.noLevels': 'You haven’t made any levels yet. Start a new one, or copy a built-in level below and remix it.',
      'editor.remix': 'Remix a built-in level',
      'editor.remixHint': 'Makes an editable copy in your levels.',
      'editor.copyOf': '{name} (copy)',
      'editor.duplicate': 'Duplicate',
      'editor.export': 'Export',
      'editor.inPlaylist': 'In playthrough',
      'editor.deleteConfirm': 'Delete “{name}”? This can’t be undone.',
      'editor.bricks': { one: '{n} brick', other: '{n} bricks' },
      'editor.name': 'Level name',
      'editor.background': 'Background',
      'editor.hue': 'Tint',
      'editor.tools': 'Tools',
      'editor.tool.brush': 'Brush',
      'editor.tool.line': 'Line',
      'editor.tool.rect': 'Rectangle',
      'editor.tool.fill': 'Fill',
      'editor.tool.picker': 'Pick',
      'editor.tool.eraser': 'Eraser',
      'editor.mirror': 'Mirror',
      'editor.mirror.none': 'Off',
      'editor.mirror.h': 'Left–right',
      'editor.mirror.v': 'Top–bottom',
      'editor.mirror.both': 'Both',
      'editor.bricksPalette': 'Bricks',
      'editor.undo': 'Undo',
      'editor.redo': 'Redo',
      'editor.clear': 'Clear',
      'editor.clearConfirm': 'Remove every brick from this level?',
      'editor.shift': 'Move bricks',
      'editor.shiftUp': 'Move up',
      'editor.shiftDown': 'Move down',
      'editor.shiftLeft': 'Move left',
      'editor.shiftRight': 'Move right',
      'editor.flipH': 'Flip left–right',
      'editor.flipV': 'Flip top–bottom',
      'editor.grid': 'Grid lines',
      'editor.test': 'Test play',
      'editor.save': 'Save',
      'editor.saved': 'Saved',
      'editor.unsaved': 'You have unsaved changes. Leave without saving?',
      'editor.leave': 'Leave without saving',
      'editor.stats': '{total} bricks · {breakable} to break',
      'editor.warnEmpty': 'Add at least one breakable brick so the level can be finished.',
      'editor.help': 'Left-click paints, right-click erases. Keys: B brush, L line, R rectangle, F fill, I pick, E eraser, M mirror, G grid, Ctrl+Z undo.',
      'editor.addToPlaylist': 'Include in playthrough',
      'editor.level': 'Level',

      'export.title': 'Export level',
      'export.titleAll': 'Export levels',
      'export.text': 'Copy this code to back up or share your level. Paste it into Import to load it again.',
      'export.copy': 'Copy code',
      'export.copied': 'Copied!',
      'export.copyFailed': 'Couldn’t copy automatically — select the code and copy it by hand.',
      'import.title': 'Import levels',
      'import.text': 'Paste a level code exported from OX Ball.',
      'import.import': 'Import',
      'import.invalid': 'That code isn’t a valid OX Ball level. Check that you copied the whole code.',
      'import.done': { one: 'Imported {n} level.', other: 'Imported {n} levels.' },

      'help.title': 'How to Play',
      'help.goal': 'Break every brick to clear the level. Keep the ball in play with your paddle — when the last ball drops past it, you lose a life. Unbreakable bricks don’t need to be cleared.',
      'help.controls': 'Controls',
      'help.move': 'Move the paddle',
      'help.moveKeys': 'Mouse, touch, or ← → / A D',
      'help.launch': 'Launch the ball, fire guns, release a caught ball',
      'help.launchKeys': 'Click, tap, or Space',
      'help.pause': 'Pause',
      'help.pauseKeys': 'P or Esc',
      'help.mute': 'Sound on / off',
      'help.fullscreen': 'Fullscreen',
      'help.aim': 'Where the ball meets the paddle sets its angle: catch it with an edge to send it sideways.',
      'help.speed': 'The ball speeds up the longer it stays in play — and a faster ball scores more points per brick.',
      'help.lightning': 'If one last brick stays untouched for too long, lightning takes care of it.',
      'help.powerups': 'Power-ups',
      'help.powerupsText': 'Some bricks drop capsules — catch them with the paddle. Blue ones help, grey ones cut both ways, red ones hurt.',
      'help.good': 'Good',
      'help.neutral': 'Neutral',
      'help.bad': 'Bad',
      'help.bricks': 'Bricks',

      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.langAuto': 'Automatic (browser language)',
      'settings.sfx': 'Sound effects',
      'settings.music': 'Music',
      'settings.shake': 'Screen shake',
      'settings.particles': 'Particle effects',
      'settings.particlesLow': 'Reduced',
      'settings.particlesFull': 'Full',
      'settings.keySpeed': 'Keyboard paddle speed',
      'settings.fps': 'Show frame rate',
      'settings.data': 'Saved data',
      'settings.dataText': 'High scores, your levels, the level order and these settings are stored only in this browser. Nothing is sent anywhere.',
      'settings.reset': 'Delete all saved data',
      'settings.resetConfirm': 'Delete your high scores, custom levels, level order and settings from this browser? This can’t be undone.',
      'settings.resetDone': 'All saved data deleted.',
      'settings.storageOff': 'This browser is blocking storage, so scores and levels will only last until you close the page.',

      'bg.nebula': 'Nebula',
      'bg.hex': 'Honeycomb',
      'bg.circuit': 'Circuit',
      'bg.plate': 'Tread plate',
      'bg.waves': 'Waves',
      'bg.marble': 'Marble',
      'bg.stone': 'Stone',

      'pu.expand': 'Expand Paddle',
      'pu.expand.d': 'Makes your paddle wider.',
      'pu.split': 'Split Ball',
      'pu.split.d': 'Every ball splits into three.',
      'pu.fireball': 'Fireball',
      'pu.fireball.d': 'The ball explodes on impact, destroying any brick it hits and everything around it.',
      'pu.thru': 'Thru Brick',
      'pu.thru.d': 'The ball — and your guns — smash straight through any brick.',
      'pu.grab': 'Grab Paddle',
      'pu.grab.d': 'The ball sticks to the paddle. Click to release it where you aim.',
      'pu.guns': 'Shooting Paddle',
      'pu.guns.d': 'Mounts guns on your paddle. Click or hold Space to fire.',
      'pu.setoff': 'Set Off Exploding',
      'pu.setoff.d': 'Every exploding brick blows up at once.',
      'pu.zap': 'Zap Bricks',
      'pu.zap.d': 'Unbreakable bricks become breakable, invisible ones appear and tough ones weaken.',
      'pu.warp': 'Level Warp',
      'pu.warp.d': 'Jumps straight to the next level.',
      'pu.life': 'Extra Life',
      'pu.life.d': 'Gives you one more paddle.',
      'pu.fast': 'Fast Ball',
      'pu.fast.d': 'The ball jumps to top speed. Harder to catch, but bricks are worth more.',
      'pu.slow': 'Slow Ball',
      'pu.slow.d': 'The ball slows right down. Easy to catch, but bricks are worth less.',
      'pu.multiply': 'Multiply Exploding',
      'pu.multiply.d': 'Exploding bricks spread to the bricks next to them.',
      'pu.shrink': 'Shrink Paddle',
      'pu.shrink.d': 'Makes your paddle narrower.',
      'pu.supershrink': 'Super Shrink',
      'pu.supershrink.d': 'Shrinks your paddle to a tiny stub.',
      'pu.kill': 'Kill Paddle',
      'pu.kill.d': 'Destroys your paddle — you lose a life. Avoid it!',
      'pu.fall': 'Fall Bricks',
      'pu.fall.d': 'The bricks creep closer every time the ball hits your paddle.',
      'pu.smallball': 'Shrink Ball',
      'pu.smallball.d': 'The ball shrinks. Harder to follow, but bricks are worth 50% more.',

      'brick.normal': 'Brick',
      'brick.normal.d': 'Breaks with one hit. Comes in sixteen colours.',
      'brick.multi2': 'Tough brick',
      'brick.multi2.d': 'Takes two hits. Cracks show the damage.',
      'brick.multi3': 'Armoured brick',
      'brick.multi3.d': 'Takes three hits.',
      'brick.explode': 'Exploding brick',
      'brick.explode.d': 'Blows up and destroys every brick around it. Chain reactions!',
      'brick.hidden': 'Invisible brick',
      'brick.hidden.d': 'Can’t be seen until the ball hits it. One more hit breaks it.',
      'brick.solid': 'Unbreakable brick',
      'brick.solid.d': 'Shrugs off the ball and your guns. Explosions, Fireball, Thru Brick and Zap Bricks deal with it. Not needed to clear a level.',

      'toast.muted': 'Sound off',
      'toast.unmuted': 'Sound on',

      'color.r': 'red', 'color.o': 'orange', 'color.y': 'yellow', 'color.l': 'lime',
      'color.g': 'green', 'color.t': 'teal', 'color.c': 'sky blue', 'color.b': 'blue',
      'color.n': 'indigo', 'color.p': 'purple', 'color.m': 'pink', 'color.w': 'white',
      'color.s': 'silver', 'color.k': 'charcoal', 'color.u': 'brown', 'color.e': 'peach',

      'lang.en': 'English',
      'lang.pl': 'Polski',
    },

    pl: {
      'app.tagline': 'Rozbijanie cegieł w duchu DX-Ball',
      'app.credit': 'Hołd dla gry DX-Ball (1996) Michaela P. Welcha.',

      'menu.play': 'Graj',
      'menu.levelSelect': 'Wybierz poziom',
      'menu.editor': 'Edytor poziomów',
      'menu.playlist': 'Kolejność poziomów',
      'menu.highscores': 'Najlepsze wyniki',
      'menu.help': 'Jak grać',
      'menu.settings': 'Ustawienia',
      'menu.fullscreen': 'Pełny ekran',
      'menu.hint': 'Mysz lub ← → – ruch · Klik lub spacja – start i strzał · P – pauza',
      'menu.levelsInGame': { one: '{n} poziom w kolejce gry', few: '{n} poziomy w kolejce gry', many: '{n} poziomów w kolejce gry', other: '{n} poziomu w kolejce gry' },
      'menu.topScore': 'Rekord',

      'common.back': 'Wstecz',
      'common.close': 'Zamknij',
      'common.cancel': 'Anuluj',
      'common.ok': 'OK',
      'common.delete': 'Usuń',
      'common.play': 'Graj',
      'common.edit': 'Edytuj',
      'common.builtin': 'Wbudowany',
      'common.custom': 'Własny',
      'common.levelN': 'Poziom {n}',
      'common.untitled': 'Poziom bez nazwy',
      'common.player': 'Gracz',

      'hud.score': 'Wynik',
      'hud.level': 'Poziom',
      'hud.practice': 'Trening',
      'hud.test': 'Test',
      'hud.lives': 'Życia',

      'game.launch': 'Kliknij lub naciśnij spację, aby wystrzelić piłkę',
      'game.launchTouch': 'Dotknij, aby wystrzelić piłkę',
      'game.levelComplete': 'Poziom ukończony!',
      'game.levelBonus': 'Premia za poziom +{n}',
      'game.levelWarp': 'Przeskok poziomu!',
      'game.gameOver': 'Koniec gry',
      'game.victory': 'Wszystkie poziomy ukończone!',
      'game.lifeBonus': 'Premia za życia +{n}',
      'game.zapped': 'Niezniszczalne cegły puściły!',

      'pause.title': 'Pauza',
      'pause.resume': 'Wznów',
      'pause.restart': 'Zacznij poziom od nowa',
      'pause.quit': 'Wyjdź do menu',
      'pause.quitConfirm': 'Zakończyć tę grę? Postęp zostanie utracony.',
      'pause.quitConfirmOk': 'Zakończ grę',
      'pause.backToEditor': 'Wróć do edytora',
      'pause.hint': 'Naciśnij P lub Esc, aby wrócić do gry',

      'over.title': 'Koniec gry',
      'over.victory': 'Wszystkie poziomy zaliczone!',
      'over.score': 'Wynik końcowy',
      'over.reached': 'Osiągnięty poziom: {n} z {total}',
      'over.newHigh': 'Nowy rekord — miejsce {rank}!',
      'over.namePrompt': 'Twoje imię',
      'over.save': 'Zapisz wynik',
      'over.skip': 'Pomiń',
      'over.noRank': 'Tym razem zabrakło do pierwszej dziesiątki.',
      'over.playAgain': 'Zagraj ponownie',
      'over.menu': 'Menu główne',

      'practice.complete': 'Poziom ukończony!',
      'practice.failed': 'Skończyły się życia',
      'practice.score': 'Wynik',
      'practice.best': 'Rekord',
      'practice.newBest': 'Nowy rekord osobisty!',
      'practice.retry': 'Jeszcze raz',
      'practice.next': 'Następny poziom',
      'practice.levels': 'Wybór poziomu',
      'practice.note': 'Wyniki treningowe nie trafiają na listę najlepszych wyników.',
      'test.complete': 'Poziom zaliczony — da się go ukończyć!',
      'test.failed': 'Skończyły się życia',

      'scores.title': 'Najlepsze wyniki',
      'scores.name': 'Imię',
      'scores.score': 'Wynik',
      'scores.level': 'Poziom',
      'scores.date': 'Data',
      'scores.empty': 'Nikt jeszcze nie zagrał. Zagraj i zajmij pierwsze miejsce!',
      'scores.clear': 'Wyczyść wyniki',
      'scores.clearConfirm': 'Usunąć wszystkie najlepsze wyniki? Tego nie da się cofnąć.',
      'scores.cleared': 'Wyniki wyczyszczone',
      'scores.allClear': 'Komplet',

      'select.title': 'Wybierz poziom',
      'select.subtitle': 'Poćwicz dowolny poziom osobno. Wyniki treningowe nie trafiają na listę najlepszych wyników.',
      'select.inPlaylist': 'W kolejce gry',
      'select.others': 'Poza kolejką gry',
      'select.best': 'Rekord {score}',

      'playlist.title': 'Kolejność poziomów',
      'playlist.subtitle': 'Zdecyduj, przez które poziomy i w jakiej kolejności przechodzi nowa gra.',
      'playlist.current': 'Kolejka gry',
      'playlist.available': 'Dostępne poziomy',
      'playlist.add': 'Dodaj',
      'playlist.addTitle': 'Dodaj na koniec kolejki gry',
      'playlist.remove': 'Usuń z kolejki',
      'playlist.up': 'W górę',
      'playlist.down': 'W dół',
      'playlist.drag': 'Przeciągnij, aby zmienić kolejność',
      'playlist.reset': 'Przywróć domyślną',
      'playlist.resetConfirm': 'Przywrócić domyślną kolejność wbudowanych poziomów? Twoje poziomy znikną z kolejki, ale nie zostaną usunięte.',
      'playlist.count': { one: '{n} poziom', few: '{n} poziomy', many: '{n} poziomów', other: '{n} poziomu' },
      'playlist.minOne': 'Kolejka gry musi zawierać co najmniej jeden poziom.',
      'playlist.allAdded': 'Wszystkie poziomy są już w kolejce.',

      'editor.homeTitle': 'Edytor poziomów',
      'editor.homeSubtitle': 'Twórz własne poziomy. Zapisują się wyłącznie w tej przeglądarce.',
      'editor.new': 'Nowy poziom',
      'editor.import': 'Importuj',
      'editor.exportAll': 'Eksportuj wszystkie',
      'editor.yourLevels': 'Twoje poziomy',
      'editor.noLevels': 'Nie masz jeszcze własnych poziomów. Zacznij od zera albo skopiuj niżej któryś z wbudowanych i przerób go po swojemu.',
      'editor.remix': 'Przerób wbudowany poziom',
      'editor.remixHint': 'Tworzy kopię do edycji wśród Twoich poziomów.',
      'editor.copyOf': '{name} (kopia)',
      'editor.duplicate': 'Duplikuj',
      'editor.export': 'Eksportuj',
      'editor.inPlaylist': 'W kolejce gry',
      'editor.deleteConfirm': 'Usunąć „{name}”? Tego nie da się cofnąć.',
      'editor.bricks': { one: '{n} cegła', few: '{n} cegły', many: '{n} cegieł', other: '{n} cegły' },
      'editor.name': 'Nazwa poziomu',
      'editor.background': 'Tło',
      'editor.hue': 'Odcień',
      'editor.tools': 'Narzędzia',
      'editor.tool.brush': 'Pędzel',
      'editor.tool.line': 'Linia',
      'editor.tool.rect': 'Prostokąt',
      'editor.tool.fill': 'Wypełnienie',
      'editor.tool.picker': 'Pipeta',
      'editor.tool.eraser': 'Gumka',
      'editor.mirror': 'Lustro',
      'editor.mirror.none': 'Wył.',
      'editor.mirror.h': 'Lewo–prawo',
      'editor.mirror.v': 'Góra–dół',
      'editor.mirror.both': 'Oba',
      'editor.bricksPalette': 'Cegły',
      'editor.undo': 'Cofnij',
      'editor.redo': 'Ponów',
      'editor.clear': 'Wyczyść',
      'editor.clearConfirm': 'Usunąć wszystkie cegły z tego poziomu?',
      'editor.shift': 'Przesuń cegły',
      'editor.shiftUp': 'Przesuń w górę',
      'editor.shiftDown': 'Przesuń w dół',
      'editor.shiftLeft': 'Przesuń w lewo',
      'editor.shiftRight': 'Przesuń w prawo',
      'editor.flipH': 'Odbij w poziomie',
      'editor.flipV': 'Odbij w pionie',
      'editor.grid': 'Siatka',
      'editor.test': 'Testuj',
      'editor.save': 'Zapisz',
      'editor.saved': 'Zapisano',
      'editor.unsaved': 'Masz niezapisane zmiany. Wyjść bez zapisywania?',
      'editor.leave': 'Wyjdź bez zapisu',
      'editor.stats': 'Cegły: {total} · do zbicia: {breakable}',
      'editor.warnEmpty': 'Dodaj co najmniej jedną zniszczalną cegłę, aby dało się ukończyć poziom.',
      'editor.help': 'Lewy przycisk maluje, prawy wymazuje. Klawisze: B pędzel, L linia, R prostokąt, F wypełnienie, I pipeta, E gumka, M lustro, G siatka, Ctrl+Z cofnij.',
      'editor.addToPlaylist': 'Dodaj do kolejki gry',
      'editor.level': 'Poziom',

      'export.title': 'Eksport poziomu',
      'export.titleAll': 'Eksport poziomów',
      'export.text': 'Skopiuj ten kod, aby zrobić kopię zapasową albo podzielić się poziomem. Wklej go w oknie importu, aby go wczytać.',
      'export.copy': 'Kopiuj kod',
      'export.copied': 'Skopiowano!',
      'export.copyFailed': 'Nie udało się skopiować automatycznie — zaznacz kod i skopiuj go ręcznie.',
      'import.title': 'Import poziomów',
      'import.text': 'Wklej kod poziomu wyeksportowany z OX Ball.',
      'import.import': 'Importuj',
      'import.invalid': 'To nie jest prawidłowy kod poziomu OX Ball. Sprawdź, czy skopiowano cały kod.',
      'import.done': { one: 'Zaimportowano {n} poziom.', few: 'Zaimportowano {n} poziomy.', many: 'Zaimportowano {n} poziomów.', other: 'Zaimportowano {n} poziomu.' },

      'help.title': 'Jak grać',
      'help.goal': 'Zbij wszystkie cegły, aby ukończyć poziom. Odbijaj piłkę paletką — gdy ostatnia piłka wypadnie, tracisz życie. Niezniszczalnych cegieł nie trzeba zbijać.',
      'help.controls': 'Sterowanie',
      'help.move': 'Ruch paletki',
      'help.moveKeys': 'Mysz, dotyk lub ← → / A D',
      'help.launch': 'Wystrzał piłki, strzelanie, uwolnienie złapanej piłki',
      'help.launchKeys': 'Klik, dotknięcie lub spacja',
      'help.pause': 'Pauza',
      'help.pauseKeys': 'P lub Esc',
      'help.mute': 'Dźwięk wł./wył.',
      'help.fullscreen': 'Pełny ekran',
      'help.aim': 'Miejsce, w którym piłka trafi w paletkę, decyduje o kącie odbicia: odbij ją krawędzią, by posłać ją w bok.',
      'help.speed': 'Im dłużej piłka jest w grze, tym szybciej leci — a szybsza piłka daje więcej punktów za cegłę.',
      'help.lightning': 'Jeśli ostatnia cegła zbyt długo pozostaje nietknięta, zajmie się nią piorun.',
      'help.powerups': 'Bonusy',
      'help.powerupsText': 'Z niektórych cegieł wypadają kapsułki — łap je paletką. Niebieskie pomagają, szare działają w obie strony, czerwone szkodzą.',
      'help.good': 'Dobre',
      'help.neutral': 'Neutralne',
      'help.bad': 'Złe',
      'help.bricks': 'Cegły',

      'settings.title': 'Ustawienia',
      'settings.language': 'Język',
      'settings.langAuto': 'Automatycznie (język przeglądarki)',
      'settings.sfx': 'Efekty dźwiękowe',
      'settings.music': 'Muzyka',
      'settings.shake': 'Wstrząsy ekranu',
      'settings.particles': 'Efekty cząsteczkowe',
      'settings.particlesLow': 'Ograniczone',
      'settings.particlesFull': 'Pełne',
      'settings.keySpeed': 'Prędkość paletki (klawiatura)',
      'settings.fps': 'Pokaż liczbę klatek',
      'settings.data': 'Zapisane dane',
      'settings.dataText': 'Najlepsze wyniki, własne poziomy, kolejność poziomów i te ustawienia są przechowywane wyłącznie w tej przeglądarce. Nic nie jest nigdzie wysyłane.',
      'settings.reset': 'Usuń wszystkie zapisane dane',
      'settings.resetConfirm': 'Usunąć z tej przeglądarki najlepsze wyniki, własne poziomy, kolejność poziomów i ustawienia? Tego nie da się cofnąć.',
      'settings.resetDone': 'Wszystkie zapisane dane zostały usunięte.',
      'settings.storageOff': 'Ta przeglądarka blokuje zapis danych, więc wyniki i poziomy przetrwają tylko do zamknięcia strony.',

      'bg.nebula': 'Mgławica',
      'bg.hex': 'Plaster miodu',
      'bg.circuit': 'Obwód',
      'bg.plate': 'Blacha ryflowana',
      'bg.waves': 'Fale',
      'bg.marble': 'Marmur',
      'bg.stone': 'Kamień',

      'pu.expand': 'Większa paletka',
      'pu.expand.d': 'Poszerza paletkę.',
      'pu.split': 'Podział piłki',
      'pu.split.d': 'Każda piłka dzieli się na trzy.',
      'pu.fireball': 'Ognista kula',
      'pu.fireball.d': 'Piłka wybucha przy uderzeniu i niszczy trafioną cegłę razem ze wszystkim dookoła.',
      'pu.thru': 'Przebicie',
      'pu.thru.d': 'Piłka — i Twoje działka — przebijają się na wylot przez każdą cegłę.',
      'pu.grab': 'Lepka paletka',
      'pu.grab.d': 'Piłka przykleja się do paletki. Kliknij, aby ją wypuścić tam, gdzie celujesz.',
      'pu.guns': 'Paletka z działkami',
      'pu.guns.d': 'Montuje działka na paletce. Kliknij lub przytrzymaj spację, aby strzelać.',
      'pu.setoff': 'Detonacja',
      'pu.setoff.d': 'Wszystkie wybuchowe cegły eksplodują naraz.',
      'pu.zap': 'Elektrowstrząs',
      'pu.zap.d': 'Niezniszczalne cegły stają się zwykłymi, niewidzialne się pokazują, a wytrzymałe słabną.',
      'pu.warp': 'Przeskok poziomu',
      'pu.warp.d': 'Przenosi od razu do następnego poziomu.',
      'pu.life': 'Dodatkowe życie',
      'pu.life.d': 'Daje jedną paletkę więcej.',
      'pu.fast': 'Szybka piłka',
      'pu.fast.d': 'Piłka od razu osiąga maksymalną prędkość. Trudniej ją złapać, ale cegły są warte więcej.',
      'pu.slow': 'Wolna piłka',
      'pu.slow.d': 'Piłka mocno zwalnia. Łatwo ją złapać, ale cegły są warte mniej.',
      'pu.multiply': 'Mnożenie wybuchowych',
      'pu.multiply.d': 'Wybuchowe cegły rozprzestrzeniają się na sąsiednie cegły.',
      'pu.shrink': 'Mniejsza paletka',
      'pu.shrink.d': 'Zwęża paletkę.',
      'pu.supershrink': 'Mikropaletka',
      'pu.supershrink.d': 'Zmniejsza paletkę do malutkiego kikutka.',
      'pu.kill': 'Zniszczenie paletki',
      'pu.kill.d': 'Niszczy paletkę — tracisz życie. Unikaj!',
      'pu.fall': 'Spadające cegły',
      'pu.fall.d': 'Cegły obniżają się za każdym razem, gdy piłka odbije się od paletki.',
      'pu.smallball': 'Mała piłka',
      'pu.smallball.d': 'Piłka maleje. Trudniej ją śledzić, ale cegły są warte o 50% więcej.',

      'brick.normal': 'Cegła',
      'brick.normal.d': 'Pęka po jednym uderzeniu. Występuje w szesnastu kolorach.',
      'brick.multi2': 'Twarda cegła',
      'brick.multi2.d': 'Wymaga dwóch uderzeń. Pęknięcia pokazują uszkodzenia.',
      'brick.multi3': 'Pancerna cegła',
      'brick.multi3.d': 'Wymaga trzech uderzeń.',
      'brick.explode': 'Wybuchowa cegła',
      'brick.explode.d': 'Wybucha i niszczy wszystkie cegły dookoła. Reakcje łańcuchowe!',
      'brick.hidden': 'Niewidzialna cegła',
      'brick.hidden.d': 'Nie widać jej, dopóki piłka w nią nie trafi. Kolejne uderzenie ją niszczy.',
      'brick.solid': 'Niezniszczalna cegła',
      'brick.solid.d': 'Piłka i działka nic jej nie robią. Poradzą sobie z nią eksplozje, Ognista kula, Przebicie i Elektrowstrząs. Nie trzeba jej zbijać, by ukończyć poziom.',

      'toast.muted': 'Dźwięk wyłączony',
      'toast.unmuted': 'Dźwięk włączony',

      'color.r': 'czerwona', 'color.o': 'pomarańczowa', 'color.y': 'żółta', 'color.l': 'limonkowa',
      'color.g': 'zielona', 'color.t': 'morska', 'color.c': 'błękitna', 'color.b': 'niebieska',
      'color.n': 'indygo', 'color.p': 'fioletowa', 'color.m': 'różowa', 'color.w': 'biała',
      'color.s': 'srebrna', 'color.k': 'grafitowa', 'color.u': 'brązowa', 'color.e': 'brzoskwiniowa',

      'lang.en': 'English',
      'lang.pl': 'Polski',
    },
  };

  const SUPPORTED = ['en', 'pl'];
  let lang = 'en';
  const listeners = [];
  const pluralRules = {};
  const numberFormats = {};

  function detect() {
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (const p of prefs) {
      const base = String(p).toLowerCase().split('-')[0];
      if (SUPPORTED.includes(base)) return base;
    }
    return 'en';
  }

  function format(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
  }

  function lookup(key) {
    const d = STRINGS[lang];
    if (d && key in d) return d[key];
    if (key in STRINGS.en) return STRINGS.en[key];
    return key;
  }

  function t(key, params) {
    let v = lookup(key);
    if (typeof v === 'object') v = v.other;
    return format(v, params);
  }

  // Plural-aware lookup: entries are objects keyed by Intl.PluralRules categories (Polish needs one/few/many).
  function tn(key, n, params) {
    const v = lookup(key);
    const p = Object.assign({ n: num(n) }, params);
    if (typeof v !== 'object') return format(v, p);
    let rules = pluralRules[lang];
    if (!rules) {
      try { rules = pluralRules[lang] = new Intl.PluralRules(lang); } catch (e) { rules = null; }
    }
    const cat = rules ? rules.select(n) : (n === 1 ? 'one' : 'other');
    return format(v[cat] || v.other, p);
  }

  function num(n) {
    let f = numberFormats[lang];
    if (!f) {
      try { f = numberFormats[lang] = new Intl.NumberFormat(lang); } catch (e) { return String(n); }
    }
    return f.format(n);
  }

  function date(ts) {
    try { return new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(ts)); }
    catch (e) { return new Date(ts).toLocaleDateString(); }
  }

  function setLang(code) {
    const next = SUPPORTED.includes(code) ? code : 'en';
    const changed = next !== lang;
    lang = next;
    document.documentElement.lang = lang;
    applyDom(document);
    if (changed) listeners.forEach((fn) => fn(lang));
  }

  // Static markup opts in with data-i18n / data-i18n-title / data-i18n-aria / data-i18n-placeholder.
  function applyDom(root) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  }

  // A level name is either a plain string (custom levels) or {en, pl} (built-in levels).
  function levelName(level) {
    if (!level) return '';
    const n = level.name;
    if (n && typeof n === 'object') return n[lang] || n.en || '';
    return n || t('common.untitled');
  }

  OX.i18n = {
    SUPPORTED,
    detect,
    t, tn, num, date, levelName,
    setLang,
    applyDom,
    get lang() { return lang; },
    onChange(fn) { listeners.push(fn); },
  };
  OX.t = t;
})(window.OX = window.OX || {});

/* js/storage.js */
/* OX Ball — persistence. Everything lives in this browser's localStorage; nothing leaves the machine.
   If storage is blocked (private mode, sandboxing) we keep working from memory for the session. */
(function (OX) {
  'use strict';

  const PREFIX = 'oxball.';
  const memory = {};
  const failed = new Set();   // keys whose last write didn't reach localStorage; memory wins for those

  let available = false;
  try {
    const k = PREFIX + '__probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    available = true;
  } catch (e) { available = false; }

  function read(key, fallback) {
    if (failed.has(key) || !available) return key in memory ? clone(memory[key]) : fallback;
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return key in memory ? clone(memory[key]) : fallback;
    }
  }

  function write(key, value) {
    memory[key] = clone(value);
    if (!available) return false;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      failed.delete(key);
      return true;
    } catch (e) {
      failed.add(key);
      return false;
    }
  }

  function removeKey(key) {
    delete memory[key];
    failed.delete(key);
    if (!available) return;
    try { localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
  }

  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

  // ---------------- settings ----------------
  const DEFAULT_SETTINGS = {
    lang: 'auto',
    sfx: 0.8,
    music: 0.45,
    muted: false,
    shake: true,
    particles: 'full',
    keySpeed: 1,
    fps: false,
  };
  let settingsCache = null;
  const settings = {
    get() {
      if (!settingsCache) settingsCache = Object.assign({}, DEFAULT_SETTINGS, read('settings', {}));
      return settingsCache;
    },
    set(patch) {
      Object.assign(settings.get(), patch);
      write('settings', settingsCache);
      return settingsCache;
    },
  };

  // ---------------- high scores ----------------
  const MAX_SCORES = 10;
  const scores = {
    list() {
      const l = read('scores', []);
      return Array.isArray(l) ? l.filter((e) => e && typeof e.score === 'number').sort((a, b) => b.score - a.score).slice(0, MAX_SCORES) : [];
    },
    qualifies(score) {
      if (!(score > 0)) return false;
      const l = scores.list();
      return l.length < MAX_SCORES || score > l[l.length - 1].score;
    },
    // Returns the 1-based rank of the new entry, or 0 if it didn't make the table.
    add(entry) {
      const l = scores.list();
      const e = Object.assign({ date: Date.now() }, entry);
      e.id = OX.U.uid('s');
      l.push(e);
      l.sort((a, b) => b.score - a.score || a.date - b.date);
      const trimmed = l.slice(0, MAX_SCORES);
      write('scores', trimmed);
      const idx = trimmed.findIndex((x) => x.id === e.id);
      return idx < 0 ? 0 : idx + 1;
    },
    clear() { removeKey('scores'); },
  };

  // ---------------- custom levels ----------------
  const customLevels = {
    list() {
      const l = read('levels', []);
      return Array.isArray(l) ? l.filter((x) => x && typeof x.id === 'string' && Array.isArray(x.rows)) : [];
    },
    get(id) { return customLevels.list().find((l) => l.id === id) || null; },
    save(level) {
      const l = customLevels.list();
      const now = Date.now();
      const copy = {
        id: level.id || OX.U.uid('c'),
        name: String(level.name || '').slice(0, 48),
        bg: { style: level.bg && level.bg.style || 'nebula', hue: level.bg ? (level.bg.hue | 0) : 220 },
        rows: level.rows.slice(),
        created: level.created || now,
        updated: now,
      };
      const i = l.findIndex((x) => x.id === copy.id);
      if (i >= 0) { copy.created = l[i].created || now; l[i] = copy; } else l.push(copy);
      write('levels', l);
      return copy;
    },
    remove(id) {
      write('levels', customLevels.list().filter((x) => x.id !== id));
      const pl = read('playlist', null);
      if (Array.isArray(pl)) write('playlist', pl.filter((x) => x !== id));
      const best = read('best', {});
      if (best && best[id] != null) { delete best[id]; write('best', best); }
    },
  };

  // ---------------- playthrough order ----------------
  // Stored as a list of level ids; absent means "the built-in levels in their default order".
  const playlist = {
    raw() { const p = read('playlist', null); return Array.isArray(p) ? p : null; },
    set(ids) { write('playlist', ids.slice()); },
    reset() { removeKey('playlist'); },
  };

  // ---------------- per-level practice bests ----------------
  const best = {
    get(id) { const b = read('best', {}); return (b && b[id]) || 0; },
    submit(id, score) {
      const b = read('best', {}) || {};
      if (!(score > (b[id] || 0))) return false;
      b[id] = score;
      write('best', b);
      return true;
    },
  };

  const lastName = {
    get() { return read('name', ''); },
    set(n) { write('name', n); },
  };

  function wipe() {
    ['settings', 'scores', 'levels', 'playlist', 'best', 'name'].forEach(removeKey);
    settingsCache = null;
  }

  OX.store = { available, settings, scores, customLevels, playlist, best, lastName, wipe, DEFAULT_SETTINGS };
})(window.OX = window.OX || {});

/* js/levels-data.js */
/* OX Ball — the built-in levels. Each row is 24 cells; see OX.COLORS / OX.SPECIAL in config.js for the codes.
   Trailing empty rows are omitted (levels are always padded to 24 rows when loaded). */
(function (OX) {
  'use strict';

  OX.BUILTIN_LEVELS = [
    {
      id: 'b01', name: { en: "Rainbow", pl: "Tęcza" },
      bg: { style: 'nebula', hue: 215 },
      rows: [
        '........................',
        '........................',
        '........rrrrrrrr........',
        '......rroooooooorr......',
        '.....roooyyyyyyooor.....',
        '....rooyyggggggyyoor....',
        '...rooyggbbbbbbggyoor...',
        '..rooyggbbppppbbggyoor..',
        '..royggbpp....ppbggyor..',
        '.rroygbpp......ppbgyorr.',
        '.rwwggbp........pbggwwr.',
        '.wwwwww..........wwwwww.',
        'wwwwwwww........wwwwwwww',
        '.wwwwww..........wwwwww.',
      ],
    },
    {
      id: 'b02', name: { en: "Heart", pl: "Serce" },
      bg: { style: 'waves', hue: 330 },
      rows: [
        '........................',
        '........................',
        '.......rrr....rrr.......',
        '.....rmmrrr..rrrrrr.....',
        '....rmwrrrrrrrrrrrrr....',
        '...rmrrrrrrrrrrrrrrrr...',
        '...rmrrrrrrrrrrrrrrrr...',
        '...rrrrrrrrrrrrrrrrrr...',
        '....rrrrrrrrrrrrrrrr....',
        '....rrrrrrrrrrrrrrrr....',
        '.....rrrrrrrrrrrrrr.....',
        '......rrrrrrrrrrrr......',
        '.......rrrrrrrrrr.......',
        '........rrrrrrrr........',
        '.........rrrrrr.........',
        '..........rrrr..........',
        '...........rr...........',
      ],
    },
    {
      id: 'b03', name: { en: "Space Invader", pl: "Kosmiczny najeźdźca" },
      bg: { style: 'nebula', hue: 265 },
      rows: [
        '........................',
        '........l......l........',
        '........l......l........',
        '.........l....l.........',
        '.........l....l.........',
        '........llllllll........',
        '........llllllll........',
        '.......ll.llll.ll.......',
        '.......ll.llll.ll.......',
        '......llllllllllll......',
        '......llllllllllll......',
        '......l.llllllll.l......',
        '......l.llllllll.l......',
        '......l.l......l.l......',
        '......l.l......l.l......',
        '.........ll..ll.........',
        '.........ll..ll.........',
        '........................',
        '........................',
        '..2222....2222....2222..',
        '.222222..222222..222222.',
        '.22..22..22..22..22..22.',
      ],
    },
    {
      id: 'b04', name: { en: "Steamship", pl: "Parowiec" },
      bg: { style: 'waves', hue: 205 },
      rows: [
        '........................',
        '........................',
        '.....sss..sss...........',
        '.......sss..sss.........',
        '.........kk...kk........',
        '.........rr...rr........',
        '.........rr...rr........',
        '.........rr...rr........',
        '.......wcwcwcwcwcww.....',
        '....wcwwcwwcwwcwwcwww...',
        '..wwwwwwwwwwwwwwwwwwww..',
        '.2222222222222222222222.',
        '..22c22c22c22c22c22c222.',
        '...2222222222222222222..',
        '....rrrrrrrrrrrrrrrrr...',
        '..cc....cc....cc....cc..',
        'bb..bbbb..bbbb..bbbb..bb',
      ],
    },
    {
      id: 'b05', name: { en: "Fireworks", pl: "Fajerwerki" },
      bg: { style: 'nebula', hue: 250 },
      rows: [
        'w...m.....c.c.c.........',
        '....m......ccc.....y...w',
        '.m..m..mccccXcccc..y....',
        '..m.m.m....ccc..y..y..y.',
        '...mmm....c.c.c..y.y.y..',
        'mmmmXmmmmc..c..c..yyy...',
        '...mmm......c..yyyyXyyyy',
        '..m.m.m.....c.....yyy...',
        '.m..m..l.w.......y.y.y..',
        '....m..l......w.o..y..y.',
        '....l..l..l.....o..y....',
        '.....l.l.l...o..o..o....',
        '......lll.....o.o.o.....',
        '...llllXllll...ooo......',
        '......lll...ooooXoooo...',
        '.....l.l.l.....ooo......',
        '....l..l..l...o.o.o.....',
        '.......l.....o..o..o....',
        '.......l........o.......',
        '.w..............o.......',
        '...........w..........w.',
      ],
    },
    {
      id: 'b06', name: { en: "Crown Jewels", pl: "Klejnoty koronne" },
      bg: { style: 'plate', hue: 280 },
      rows: [
        '........................',
        '........................',
        '..#...#....##....#...#..',
        '..y...y....yy....y...y..',
        '..y..yyy..yyyy..yyy..y..',
        '..yy.yyy..yyyy..yyy.yy..',
        '..yyyyyyyyyyyyyyyyyyyy..',
        '..yyyyyyyyyyyyyyyyyyyy..',
        '..oooooooooooooooooooo..',
        '..#r#c#g#m#bb#m#g#c#r#..',
        '..oooooooooooooooooooo..',
        '........................',
        '.pppppppppppppppppppppp.',
        'pmppppppppppppppppppppmp',
        '.pppppppppppppppppppppp.',
        'y.y..................y.y',
      ],
    },
    {
      id: 'b07', name: { en: "Ghosts", pl: "Duchy" },
      bg: { style: 'stone', hue: 240 },
      rows: [
        '........................',
        '........................',
        '..rrrr............cccc..',
        '.rrrrrr..........cccccc.',
        'rrrrrrrr........cccccccc',
        'rwwrrwwr........cwwccwwc',
        'rwbrrwbr........cwbccwbc',
        'rrrrrrrr..HHHH..cccccccc',
        'rrrrrrrr.HHHHHH.cccccccc',
        'rrrrrrrrHHHHHHHHcccccccc',
        'rr.rr.rrHwwHHwwHcc.cc.cc',
        'r..rr..rHwbHHwbHc..cc..c',
        '........HHHHHHHH........',
        '........HHHHHHHH........',
        '........HHHHHHHH........',
        '........HH.HH.HH........',
        '..y..y..H..HH..H..y..y..',
        '........................',
        '........................',
        '...........yy...........',
      ],
    },
    {
      id: 'b08', name: { en: "Robot", pl: "Robot" },
      bg: { style: 'circuit', hue: 190 },
      rows: [
        '........................',
        '.........r....r.........',
        '.........s....s.........',
        '......333333333333......',
        '......2ssssssssss2......',
        '......2sccssssccs2......',
        '......2sccssssccs2......',
        '......2ssssssssss2......',
        '......2srrrrrrrrs2......',
        '......2ssssssssss2......',
        '......222222222222......',
        '.........kkkkkk.........',
        '...222222222222222222...',
        '..33wwwwwwwwwwwwwwww33..',
        '..33wgwywwwwwwwwywgw33..',
        '..33wwwwwwwwwwwwwwww33..',
        '..33wwwwwwwwwwwwwwww33..',
        '..rr3333333333333333rr..',
        '.......22......22.......',
        '.......22......22.......',
        '......333......333......',
      ],
    },
    {
      id: 'b09', name: { en: "Rocket", pl: "Rakieta" },
      bg: { style: 'nebula', hue: 300 },
      rows: [
        'H......................H',
        '...........rr...........',
        '...H......rrrr......H...',
        '...pppp...rrrr..........',
        '..pppppp.rrrrrr.........',
        '.eeeeeeeewwwwww.........',
        '..pppppp.w2222w.........',
        'H..pppp..w2cc2w........H',
        '.........w2cc2w.........',
        '.........w2222w.........',
        '...H.....wwwwww.....H...',
        '.........222222.....ww..',
        '.........wwwwww....wwsw.',
        '........rwwwwwwr...wsww.',
        '.......rrwwwwwwrr...ww..',
        '......rrrwwwwwwrrr......',
        '......##r222222r##......',
        '..H.......XXXX.......H..',
        '..........oXXo..........',
        '...........yy...........',
      ],
    },
    {
      id: 'b10', name: { en: "OX", pl: "OX" },
      bg: { style: 'hex', hue: 205 },
      rows: [
        '.....22......rr......mm.',
        '...22cc22.....rr....mm..',
        '..2cccccc2....rr....mm..',
        '..2cc..cc2.....rr..mm...',
        '.2cc....cc2.....rrmm....',
        '.2c..XX..c2.....rrmm....',
        '.cc..XX..cc......XX.....',
        '.cc.XXXX.cc......XXX....',
        '.cc..XX..cc.....XXXX....',
        '.2c..XX..c2....mm..rr...',
        '.2cc....cc2....mm..rr...',
        '..2cc..cc2....mm....rr..',
        '..2cccccc2...mm......rr.',
        '...22cc22....mm......rr.',
        '.....22.....mm........rr',
        '........................',
        '........................',
        '.###.###.###.###.###.##.',
        '........................',
        '.....HH...H..H...H......',
        '.....H.H.H.H.H...H......',
        '.....HH..HHH.H...H......',
        '.....H.H.H.H.H...H......',
        '.....HH..H.H.HHH.HHH....',
      ],
    },
    {
      id: 'b11', name: { en: "Koi", pl: "Karp koi" },
      bg: { style: 'waves', hue: 185 },
      rows: [
        '.......................H',
        '............oo.......H..',
        '.o.........ooo..........',
        '.oo........wwwww......H.',
        '.ooo....wwwwwwwrwww.....',
        '..ooo.wwwwwwwrrrrroow...',
        '...ooowwwrrwwrrrrrook...',
        '...ooowwrrrrwwwrwwwww...',
        '..ooo.wwrrrrwwwwwwwww...',
        '.ooo....wwwwwwwwwww.....',
        '.oo........wwwww........',
        '.o..............oo......',
        '.................o......',
        '..g....t.......g....t...',
        '..g....t.......g....t...',
        '...g....t.......g....t..',
        '...g....t.......g....t..',
        '..g....t.......g....t...',
        '..g....t.......g....t...',
      ],
    },
    {
      id: 'b12', name: { en: "Pyramid", pl: "Piramida" },
      bg: { style: 'marble', hue: 35 },
      rows: [
        'y.......y...............',
        '...XXX...........gg.gg..',
        '..XXXXX.........gggggggg',
        '.XXXXXXX........g..uu..g',
        '..XXXXX............u....',
        '...XXX.............u....',
        'y.......y..........u....',
        '....y......##.....uu....',
        '..........yyyy..........',
        '.........oooooo.........',
        '........yyyyyyyy........',
        '.......oooooooooo.......',
        '......yyyyyyyyyyyy......',
        '.....oooooooooooooo.....',
        '....yyyyyyyyyyyyyyyy....',
        '...oooooooooooooooooo...',
        '..yyyyyyyyykkyyyyyyyyy..',
        '.ooooooooookkoooooooooo.',
        'yyyyyyyyyyykkyyyyyyyyyyy',
        'oeeoeeoeeoeeoeeoeeoeeoee',
      ],
    },
    {
      id: 'b13', name: { en: "Snowflake", pl: "Płatek śniegu" },
      bg: { style: 'hex', hue: 195 },
      rows: [
        '.........cw..wc.........',
        '.........cw..wc.........',
        '.......wwcc..ccww.......',
        '..........c..c..........',
        '......w...c..c...w......',
        '......w...c..c...w......',
        '....w..w...cc...w..w....',
        '.....w.w...22...w.w.....',
        '.....w.w...22...w.w.....',
        '...wwcccccc22ccccccww...',
        '.....w.w...22...w.w.....',
        '.....w.w...22...w.w.....',
        '....w..w...cc...w..w....',
        '.H..H.w...c..c...w.HHHH.',
        '.H..H.w...c..c...w.HHHH.',
        '..HH......c..c......HH..',
        '..HH...wwcc..ccww...HH..',
        '..HH.....cw..wc...HHHHHH',
        'HHHHHHH..cw..wc...HHHHHH',
        '..HH.....cw..wc.....HH..',
        '..HH...wc..ww..cw...HH..',
        '..HH....cw.ww.wc...HHHH.',
        '.H..H...cw....wc...HHHH.',
        '.H..H..www....www.......',
      ],
    },
    {
      id: 'b14', name: { en: "Jolly Roger", pl: "Wesoły Roger" },
      bg: { style: 'stone', hue: 0 },
      rows: [
        '........................',
        '........wwwwwwww........',
        '......wwwwwwwwwwww......',
        '.....wwwwwwwwwwwwww.....',
        '.....wwwwwwwwwwwwww.....',
        '.....wwwwwwwwwwwwww.....',
        '.....wXXXwwwwwwXXXw.....',
        '.....wXXXwwwwwwXXXw.....',
        '.....wXXXwwwwwwXXXw.....',
        '.....wwwwwwwwwwwwww.....',
        '.ww...wwwwwkkwwwww...ww.',
        'w.33...wwwkkkkwww....33w',
        '.w3333.w#w#ww#w#w.3333w.',
        '....333w#w#ww#w#w333....',
        '.......3wwwwwwww33......',
        '.........333333.........',
        '........33333333........',
        '......3333....33333.....',
        '.w.33333.........3333.w.',
        'w.333..............3333w',
        '.ww..................ww.',
      ],
    },
    {
      id: 'b15', name: { en: "Butterfly", pl: "Motyl" },
      bg: { style: 'nebula', hue: 150 },
      rows: [
        '........k......k........',
        '.kwkkkk..k....k..kkkkwk.',
        '.koooookk.k..k.kkoooook.',
        'wooooooookk22kkoooooooow',
        '.kooXoookok22kokoooXook.',
        '.koooookook22kookoooook.',
        '.wkoookoook22koookoookw.',
        '...koooookk22kkoooook...',
        '....kkkkkkk22kkkkkkk....',
        '...........22...........',
        '.....kkkkkk22kkkkkk.....',
        '....kyyyyyk22kyyyyyk....',
        '...kyyyykyk22kykyyyyk...',
        '...kyyXkyyk22kyykXyyk...',
        '....kyyyyyk22kyyyyyk....',
        '....wkyyyk.22.kyyykw....',
        '......kkk......kkk......',
        '.......w........w.......',
        '.......................H',
        'H.......................',
        '............H...........',
        '...H................H...',
      ],
    },
    {
      id: 'b16', name: { en: "Bullseye", pl: "Tarcza" },
      bg: { style: 'plate', hue: 355 },
      rows: [
        '..........2222..........',
        '........22rrrr22........',
        '........2rrrrrr2........',
        '.......2rr#..#rr2.......',
        '.......2r##..##r2.......',
        '......2r##wwww##r2......',
        '......2r#wwrrww#r2......',
        '......2r#wrrrrw#r2......',
        '......rr#wr33rw#rr......',
        '......rr.wr33rw.rr......',
        '......rr.wr33rw.rr......',
        '......rr#wr33rw#rr......',
        '......2r#wrrrrw#r2......',
        '......2r#wwrrww#r2......',
        '......2r##wwww##r2......',
        '.......2r##..##r2.......',
        '.......2rr#..#rr2.......',
        '........2rrrrrr2........',
        '........22rrrr22........',
        '..........2222..........',
      ],
    },
    {
      id: 'b17', name: { en: "Labyrinth", pl: "Labirynt" },
      bg: { style: 'circuit', hue: 150 },
      rows: [
        '........................',
        '.#22#22#22#..#22#22#22#.',
        '.2rr.oo.yy.Hl.gg.tt.cc2.',
        '.2rr.oo.yy.ll.gg.tt.cc2.',
        '.#..#..#22#22#22#22#..#.',
        '.2oo2Hy2ll.gg2tt.cc.bb2.',
        '.2oo2yy2ll.gg2tt.cc.bX2.',
        '.#..#..#..#..#..#22#22#.',
        '.2ll2gg2tt2cc2bb.Hn.pp2.',
        '.2lX2gg2tt2cc2bb.nn.pp2.',
        '.#..#22#..#..#22#22#22#.',
        '.2gg2tt.cc2bb.nn.pp.mm2.',
        '.2gg2tt.cc2bX.nn.pp.mm2.',
        '.#..#..#22#22#22#22#..#.',
        '.2cc.bb.nn2pp.mm.rr.oo2.',
        '.2cc.bb.nn2pp.mm.rr.oo2.',
        '.#..#22#22#..#22#22#..#.',
      ],
    },
    {
      id: 'b18', name: { en: "Volcano", pl: "Wulkan" },
      bg: { style: 'stone', hue: 15 },
      rows: [
        'ss.....X........X.....ss',
        'ss....................ss',
        '.........r.oo.r.........',
        '....X..o..oyyo..o..X....',
        '........r.oyyo.r........',
        '..X......oyyyyo......X..',
        '..........oyyo..........',
        '...........oo...........',
        '..........XXXX..........',
        '..........XooX..........',
        '.........X2oo2X.........',
        '........2X2222X2........',
        '.......2X222222X2.......',
        '......2X22222222X2......',
        '.....22X22222222X22.....',
        '....22X2222222222X22....',
        '...22X222222222222222...',
        '..222X2222222222222222..',
        '.3333333333333333333333.',
        '.3333333333333333333333.',
      ],
    },
    {
      id: 'b19', name: { en: "Night Owl", pl: "Nocny puszczyk" },
      bg: { style: 'marble', hue: 230 },
      rows: [
        '...................yyy..',
        '.H...u............yyyyy.',
        '.....uu..........yyyyyyy',
        '.....uuuuuuuuuuuuuyyyyy.',
        '.....ueeeeeeeeeeeeuyyy..',
        '...Hueewwweeeewwweeu....',
        '....uewyyyweewyyyweu....',
        '....uewykyweewykyweu....',
        '....uewyyyweewyyyweu..H.',
        'H...ueewwweeeewwweeu....',
        '....u2eeeeeooeeeee2u....',
        '....u22ueeeooeeeu22u....',
        '....u22eueueeueue22u....',
        '....u22ueueeeeueu22uH...',
        '..H.u22eueueeueue22u....',
        '.....u2ueueeeeueu2u.....',
        '......uuuuuuuuuuuu......',
        '.......o..o..o..o.......',
        '...##u####u####u####u...',
      ],
    },
    {
      id: 'b20', name: { en: "Fortress", pl: "Twierdza" },
      bg: { style: 'stone', hue: 220 },
      rows: [
        '.H......H..krr........H.',
        '.rr..H.....kr...H.H..rr.',
        '.kr........k.........rk.',
        '.k....#.#.#.#.#.#.....k.',
        '#.#...333333333333...#.#',
        '333...33yy3333yy33...333',
        '3y3...333333333333...3y3',
        '333...222222222222...333',
        '222#.#22222yy22222.#.222',
        '222sks222222222222ksk222',
        '222ksk222222222222sks222',
        '2y2sksksksksksksksksk2y2',
        '222ksyskskskskskskyks222',
        '222sksksk######sksksk222',
        '222ksksks#X..X#ksksks222',
        '2y2skskyk#.XX.#sysksk2y2',
        '222ksksks#....#ksksks222',
      ],
    },
  ];
})(window.OX = window.OX || {});

/* js/levels.js */
/* OX Ball — level library: built-in + custom levels, the playthrough order, parsing and share codes. */
(function (OX) {
  'use strict';
  const C = OX.C;
  const EMPTY_ROW = '.'.repeat(C.COLS);

  // Always 24 rows of 24 valid cells; anything unknown becomes empty.
  function normalizeRows(rows) {
    const out = [];
    for (let r = 0; r < C.ROWS; r++) {
      const s = rows && typeof rows[r] === 'string' ? rows[r] : '';
      let fixed = '';
      for (let c = 0; c < C.COLS; c++) {
        const ch = s[c] || '.';
        fixed += OX.isValidCell(ch) ? ch : '.';
      }
      out.push(fixed);
    }
    return out;
  }

  function stats(rows) {
    let total = 0, breakable = 0;
    const counts = {};
    for (const row of rows) {
      for (const ch of row) {
        if (ch === '.') continue;
        total++;
        if (ch !== '#') breakable++;
        counts[ch] = (counts[ch] || 0) + 1;
      }
    }
    return { total, breakable, counts };
  }

  // One brick object per filled cell. Plain bricks carry their colour; specials carry their mechanics.
  function makeBrick(ch) {
    if (ch === '.' || !ch) return null;
    if (ch in OX.COLORS) return { code: ch, type: 'normal', color: ch, hits: 1, maxHits: 1, flash: 0 };
    const sp = OX.SPECIAL[ch];
    if (!sp) return null;
    switch (sp.type) {
      case 'multi': return { code: ch, type: 'multi', hits: sp.hits, maxHits: sp.hits, flash: 0 };
      case 'explode': return { code: ch, type: 'explode', hits: 1, maxHits: 1, flash: 0, phase: Math.random() * 6.28 };
      case 'hidden': return { code: ch, type: 'hidden', hits: 1, maxHits: 1, revealed: false, flash: 0, reveal: 0 };
      case 'solid': return { code: ch, type: 'solid', hits: Infinity, maxHits: Infinity, flash: 0, phase: Math.random() };
    }
    return null;
  }

  function buildBricks(rows) {
    const norm = normalizeRows(rows);
    const grid = [];
    for (let r = 0; r < C.ROWS; r++) {
      const line = [];
      for (let c = 0; c < C.COLS; c++) line.push(makeBrick(norm[r][c]));
      grid.push(line);
    }
    return grid;
  }

  const builtin = OX.BUILTIN_LEVELS.map((l) => Object.freeze({
    id: l.id, name: l.name, bg: l.bg, rows: normalizeRows(l.rows), builtin: true,
  }));

  function sanitizeBg(bg) {
    const style = bg && OX.BACKGROUNDS.includes(bg.style) ? bg.style : 'nebula';
    const hue = bg && Number.isFinite(+bg.hue) ? ((Math.round(+bg.hue) % 360) + 360) % 360 : 220;
    return { style, hue };
  }

  function custom() {
    return OX.store.customLevels.list().map((l) => ({
      id: l.id, name: l.name, bg: sanitizeBg(l.bg), rows: normalizeRows(l.rows), builtin: false,
      created: l.created, updated: l.updated,
    }));
  }

  function all() { return builtin.concat(custom()); }
  function byId(id) { return all().find((l) => l.id === id) || null; }
  function defaultPlaylistIds() { return builtin.map((l) => l.id); }

  function playlistIds() {
    const raw = OX.store.playlist.raw();
    const ids = raw || defaultPlaylistIds();
    const valid = new Set(all().map((l) => l.id));
    const out = [];
    for (const id of ids) if (valid.has(id) && !out.includes(id)) out.push(id);
    return out.length ? out : defaultPlaylistIds();
  }

  function playlist() {
    const map = new Map(all().map((l) => [l.id, l]));
    return playlistIds().map((id) => map.get(id)).filter(Boolean);
  }

  function setPlaylist(ids) {
    const def = defaultPlaylistIds();
    if (ids.length === def.length && ids.every((id, i) => id === def[i])) OX.store.playlist.reset();
    else OX.store.playlist.set(ids);
  }
  function inPlaylist(id) { return playlistIds().includes(id); }
  function addToPlaylist(id) { const ids = playlistIds(); if (!ids.includes(id)) { ids.push(id); setPlaylist(ids); } }
  function removeFromPlaylist(id) {
    const ids = playlistIds().filter((x) => x !== id);
    if (ids.length) setPlaylist(ids);
    return ids.length > 0;
  }

  function blank() {
    return { id: null, name: '', bg: { style: 'nebula', hue: 220 }, rows: Array.from({ length: C.ROWS }, () => EMPTY_ROW), builtin: false };
  }

  // ---------------- share codes ----------------
  const PREFIX = 'OXBALL1:';

  function toBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function fromBase64(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function trimRows(rows) {
    const out = rows.slice();
    while (out.length && out[out.length - 1] === EMPTY_ROW) out.pop();
    return out;
  }

  function encode(levels) {
    const payload = {
      v: 1,
      levels: levels.map((l) => ({ name: OX.i18n.levelName(l), bg: sanitizeBg(l.bg), rows: trimRows(l.rows) })),
    };
    return PREFIX + toBase64(JSON.stringify(payload));
  }

  // Accepts a share code (whitespace is ignored) or the raw JSON behind it. Throws on anything else.
  function decode(text) {
    let s = String(text || '').trim();
    let data;
    if (s.startsWith('{') || s.startsWith('[')) {
      data = JSON.parse(s);
    } else {
      s = s.replace(/\s+/g, '');
      if (s.toUpperCase().startsWith(PREFIX)) s = s.slice(PREFIX.length);
      data = JSON.parse(fromBase64(s));
    }
    const list = Array.isArray(data) ? data : Array.isArray(data.levels) ? data.levels : [data];
    const out = [];
    for (const l of list) {
      if (!l || !Array.isArray(l.rows)) continue;
      const rows = normalizeRows(l.rows);
      if (!stats(rows).total) continue;
      const name = typeof l.name === 'string' ? l.name : (l.name && (l.name.en || l.name.pl)) || '';
      out.push({ name: name.slice(0, 48), bg: sanitizeBg(l.bg), rows });
    }
    if (!out.length) throw new Error('empty');
    return out;
  }

  OX.levels = {
    EMPTY_ROW,
    normalizeRows, stats, buildBricks, makeBrick, sanitizeBg,
    builtin, custom, all, byId, blank,
    defaultPlaylistIds, playlistIds, playlist, setPlaylist, inPlaylist, addToPlaylist, removeFromPlaylist,
    encode, decode,
  };
})(window.OX = window.OX || {});

/* js/gfx.js */
/* OX Ball — rendering helpers. Sprites are drawn once per device scale into offscreen canvases so the
   game stays crisp on a 4K screen and cheap on a laptop. Everything is drawn in logical units. */
(function (OX) {
  'use strict';
  const C = OX.C, U = OX.U;

  const FONT_DISPLAY = '"Oxanium", "Segoe UI", "Trebuchet MS", system-ui, sans-serif';
  const FONT_BODY = '"Barlow", "Segoe UI", system-ui, sans-serif';

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------------------------------------------------------------- sprite cache
  const cache = new Map();
  function sprite(key, scale, w, h, draw) {
    const k = key + '|' + scale.toFixed(3);
    let c = cache.get(k);
    if (!c) {
      if (cache.size > 2000) cache.clear();
      c = makeCanvas(w * scale, h * scale);
      const ctx = c.getContext('2d');
      ctx.scale(c.width / w, c.height / h);
      draw(ctx, w, h);
      cache.set(k, c);
    }
    return c;
  }

  // ---------------------------------------------------------------- bricks
  const INSET = 0.9;

  function glossyBrick(ctx, w, h, base) {
    const x = INSET, y = INSET, bw = w - INSET * 2, bh = h - INSET * 2, r = 3;
    let g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, U.shade(base, 0.34));
    g.addColorStop(0.45, U.shade(base, 0.05));
    g.addColorStop(0.6, base);
    g.addColorStop(1, U.shade(base, -0.36));
    rr(ctx, x, y, bw, bh, r);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    rr(ctx, x, y, bw, bh, r);
    ctx.clip();
    g = ctx.createLinearGradient(x, 0, x + bw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.12)');
    g.addColorStop(0.16, 'rgba(255,255,255,0)');
    g.addColorStop(0.84, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, bw, bh);
    g = ctx.createLinearGradient(0, y, 0, y + bh * 0.55);
    g.addColorStop(0, 'rgba(255,255,255,0.58)');
    g.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = g;
    rr(ctx, x + 1.8, y + 1.3, bw - 3.6, bh * 0.44, 2);
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.moveTo(x + r, y + bh - 0.8); ctx.lineTo(x + bw - r, y + bh - 0.8); ctx.stroke();
    rr(ctx, x, y, bw, bh, r);
    ctx.strokeStyle = U.rgba(U.shade(base, -0.62), 0.95);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(x + 5.5, y + 3.6, 2.2, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  }

  const STEEL = { 3: '#56647e', 2: '#7f8ea9', 1: '#aebbd0' };
  const CRACKS = [
    [[14, 1], [16.5, 5.5], [14.5, 9.5], [18.5, 13.5], [17, 19]],
    [[30, 1.5], [27, 7], [31, 11.5], [28, 18.5]],
    [[27, 7], [22.5, 9.5], [21, 13]],
  ];
  function steelBrick(ctx, w, h, hitsLeft, cracks) {
    const base = STEEL[Math.max(1, Math.min(3, hitsLeft))];
    const x = INSET, y = INSET, bw = w - INSET * 2, bh = h - INSET * 2, r = 2;
    let g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, U.shade(base, 0.45));
    g.addColorStop(0.3, U.shade(base, 0.08));
    g.addColorStop(0.55, U.shade(base, -0.12));
    g.addColorStop(0.62, U.shade(base, 0.12));
    g.addColorStop(1, U.shade(base, -0.42));
    rr(ctx, x, y, bw, bh, r);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    rr(ctx, x, y, bw, bh, r);
    ctx.clip();
    const rnd = U.rng(hitsLeft * 97 + cracks * 13);
    for (let yy = y + 1; yy < y + bh; yy += 1.3) {
      ctx.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + bw, yy + (rnd() - 0.5) * 0.4); ctx.stroke();
    }
    ctx.restore();
    // bevel
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.moveTo(x + 1, y + bh - 1.5); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x + bw - 1.5, y + 1); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.moveTo(x + bw - 1, y + 1.5); ctx.lineTo(x + bw - 1, y + bh - 1); ctx.lineTo(x + 1.5, y + bh - 1); ctx.stroke();
    // rivets
    for (const [rx, ry] of [[x + 3.6, y + 3.6], [x + bw - 3.6, y + 3.6], [x + 3.6, y + bh - 3.6], [x + bw - 3.6, y + bh - 3.6]]) {
      const rg = ctx.createRadialGradient(rx - 0.5, ry - 0.5, 0.1, rx, ry, 1.7);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(0.4, U.shade(base, 0.3));
      rg.addColorStop(1, U.shade(base, -0.55));
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(rx, ry, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < cracks && i < 2; i++) {
      const lines = i === 0 ? [CRACKS[0]] : [CRACKS[1], CRACKS[2]];
      for (const pts of lines) {
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px + 0.6, py + 0.5) : ctx.moveTo(px + 0.6, py + 0.5))); ctx.stroke();
        ctx.strokeStyle = 'rgba(18,22,32,0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
      }
    }
    rr(ctx, x, y, bw, bh, r);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(16,20,30,0.95)';
    ctx.stroke();
  }

  function explodeBrick(ctx, w, h) {
    const x = INSET, y = INSET, bw = w - INSET * 2, bh = h - INSET * 2, r = 3;
    let g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, '#ffc15a');
    g.addColorStop(0.35, '#ff7a26');
    g.addColorStop(0.7, '#d93a12');
    g.addColorStop(1, '#8c1c07');
    rr(ctx, x, y, bw, bh, r);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    rr(ctx, x, y, bw, bh, r);
    ctx.clip();
    // hazard chevrons along the ends
    ctx.fillStyle = 'rgba(60,8,0,0.45)';
    for (const side of [0, 1]) {
      for (let k = 0; k < 2; k++) {
        const sx = side ? x + bw - 5 - k * 4.2 : x + 1 + k * 4.2;
        ctx.beginPath();
        ctx.moveTo(sx, y); ctx.lineTo(sx + 2, y); ctx.lineTo(sx + 4, y + bh / 2); ctx.lineTo(sx + 2, y + bh); ctx.lineTo(sx, y + bh); ctx.lineTo(sx + 2, y + bh / 2);
        ctx.closePath(); ctx.fill();
      }
    }
    const cg = ctx.createRadialGradient(w / 2, h / 2, 0.3, w / 2, h / 2, 8.5);
    cg.addColorStop(0, 'rgba(255,255,235,1)');
    cg.addColorStop(0.35, 'rgba(255,220,90,0.95)');
    cg.addColorStop(1, 'rgba(255,120,20,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(x, y, bw, bh);
    g = ctx.createLinearGradient(0, y, 0, y + bh * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    rr(ctx, x + 1.5, y + 1.2, bw - 3, bh * 0.42, 2);
    ctx.fill();
    ctx.restore();
    star(ctx, w / 2, h / 2, 4.6, 1.2, '#fffef0');
    rr(ctx, x, y, bw, bh, r);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = '#5a1004';
    ctx.stroke();
  }

  function star(ctx, cx, cy, R, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rad = i % 2 ? r : R;
      const px = cx + Math.cos(a) * rad * (i % 2 ? 1 : 1.35), py = cy + Math.sin(a) * rad * 0.9;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function hiddenBrick(ctx, w, h) {
    const x = INSET, y = INSET, bw = w - INSET * 2, bh = h - INSET * 2, r = 3;
    const g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, 'rgba(255,190,235,0.65)');
    g.addColorStop(0.5, 'rgba(240,120,210,0.42)');
    g.addColorStop(1, 'rgba(170,70,180,0.5)');
    rr(ctx, x, y, bw, bh, r);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    rr(ctx, x, y, bw, bh, r);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 14, y); ctx.lineTo(x + 7, y + bh); ctx.lineTo(x + 1, y + bh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(x + 17, y); ctx.lineTo(x + 19.5, y); ctx.lineTo(x + 12.5, y + bh); ctx.lineTo(x + 10, y + bh); ctx.closePath(); ctx.fill();
    ctx.restore();
    rr(ctx, x + 0.5, y + 0.5, bw - 1, bh - 1, r);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,215,245,0.95)';
    ctx.stroke();
    star(ctx, x + bw - 6, y + 5, 2.6, 0.7, 'rgba(255,255,255,0.95)');
  }

  function goldBrick(ctx, w, h) {
    const x = INSET, y = INSET, bw = w - INSET * 2, bh = h - INSET * 2, r = 2;
    let g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, '#fff5c8');
    g.addColorStop(0.25, '#ffd964');
    g.addColorStop(0.55, '#e3a62b');
    g.addColorStop(0.8, '#b97a13');
    g.addColorStop(1, '#7a4c07');
    rr(ctx, x, y, bw, bh, r);
    ctx.fillStyle = g;
    ctx.fill();
    // embossed inner plate
    g = ctx.createLinearGradient(0, y + 3, 0, y + bh - 3);
    g.addColorStop(0, '#d49a24');
    g.addColorStop(0.5, '#f2c450');
    g.addColorStop(1, '#fbe08a');
    rr(ctx, x + 3.4, y + 3.4, bw - 6.8, bh - 6.8, 1.5);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(110,66,4,0.7)';
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,255,240,0.8)';
    ctx.beginPath(); ctx.moveTo(x + 1, y + bh - 1.5); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x + bw - 1.5, y + 1); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,45,0,0.6)';
    ctx.beginPath(); ctx.moveTo(x + bw - 1, y + 1.5); ctx.lineTo(x + bw - 1, y + bh - 1); ctx.lineTo(x + 1.5, y + bh - 1); ctx.stroke();
    for (const bx of [x + 7, x + bw - 7]) {
      const rg = ctx.createRadialGradient(bx - 0.6, h / 2 - 0.6, 0.2, bx, h / 2, 2.2);
      rg.addColorStop(0, '#fffbe6');
      rg.addColorStop(0.5, '#e0a93a');
      rg.addColorStop(1, '#7a4c07');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(bx, h / 2, 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(90,50,0,0.8)';
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(bx - 1.3, h / 2 + 1.1); ctx.lineTo(bx + 1.3, h / 2 - 1.1); ctx.stroke();
    }
    rr(ctx, x, y, bw, bh, r);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = '#4e3003';
    ctx.stroke();
  }

  // A diagonal glint that sweeps across unbreakable bricks now and then.
  function sheenBrick(ctx, w, h, frame) {
    const x = INSET, y = INSET, bw = w - INSET * 2, bh = h - INSET * 2;
    ctx.save();
    rr(ctx, x, y, bw, bh, 2);
    ctx.clip();
    const cx = -14 + frame * 9;
    const g = ctx.createLinearGradient(cx - 7, 0, cx + 7, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,250,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx - 3, y); ctx.lineTo(cx + 9, y); ctx.lineTo(cx + 3, y + bh); ctx.lineTo(cx - 9, y + bh); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function glowBrick(ctx, w, h, color) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    g.addColorStop(0, U.rgba(color, 0.9));
    g.addColorStop(0.45, U.rgba(color, 0.35));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Sprite for a level cell code, optionally with runtime state (multi-hit damage, revealed hidden brick).
  function brickSprite(code, scale, hitsLeft) {
    const W = C.BW, H = C.BH;
    if (code in OX.COLORS) return sprite('b' + code, scale, W, H, (ctx, w, h) => glossyBrick(ctx, w, h, OX.COLORS[code]));
    if (code === '2' || code === '3') {
      const max = +code;
      const left = hitsLeft == null ? max : hitsLeft;
      return sprite('m' + max + left, scale, W, H, (ctx, w, h) => steelBrick(ctx, w, h, left, max - left));
    }
    if (code === 'X') return sprite('x', scale, W, H, explodeBrick);
    if (code === 'H') return sprite('h', scale, W, H, hiddenBrick);
    if (code === '#') return sprite('g', scale, W, H, goldBrick);
    return null;
  }

  function sheenSprite(frame, scale) {
    return sprite('sheen' + frame, scale, C.BW, C.BH, (ctx, w, h) => sheenBrick(ctx, w, h, frame));
  }
  function glowSprite(color, scale, w, h) {
    return sprite('glow' + color + w + 'x' + h, scale, w, h, (ctx, ww, hh) => glowBrick(ctx, ww, hh, color));
  }

  // White silhouette used to flash a brick when it's hit.
  function flashSprite(scale) {
    return sprite('flash', scale, C.BW, C.BH, (ctx, w, h) => {
      rr(ctx, INSET, INSET, w - INSET * 2, h - INSET * 2, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
  }

  // Editor-only outline for an invisible brick that hasn't been revealed.
  function ghostOutlineSprite(scale) {
    return sprite('ghost', scale, C.BW, C.BH, (ctx, w, h) => {
      rr(ctx, INSET + 0.8, INSET + 0.8, w - INSET * 2 - 1.6, h - INSET * 2 - 1.6, 3);
      ctx.setLineDash([2.5, 2]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,170,230,0.9)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,150,220,0.12)';
      ctx.fill();
    });
  }

  // ---------------------------------------------------------------- balls
  const BALL_STOPS = {
    normal: ['#ffffff', '#eef4ff', '#a9bad6', '#5d6d8a', '#394358'],
    fire: ['#fffbe6', '#ffe27a', '#ff9a2a', '#d6400f', '#7c1704'],
    thru: ['#ffffff', '#f0e6ff', '#b894ff', '#7040d8', '#3a1e78'],
    both: ['#ffffff', '#ffe0f4', '#ff7ac8', '#c8267c', '#5c0a36'],
  };
  function ballSprite(kind, radius, scale) {
    const size = radius * 2 + 2;
    return sprite('ball' + kind + radius, scale, size, size, (ctx, w) => {
      const c = w / 2;
      const st = BALL_STOPS[kind] || BALL_STOPS.normal;
      const g = ctx.createRadialGradient(c - radius * 0.38, c - radius * 0.42, radius * 0.05, c, c, radius);
      g.addColorStop(0, st[0]);
      g.addColorStop(0.22, st[1]);
      g.addColorStop(0.62, st[2]);
      g.addColorStop(0.9, st[3]);
      g.addColorStop(1, st[4]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(c, c, radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(c, c, radius * 0.82, Math.PI * 0.15, Math.PI * 0.62); ctx.stroke();
    });
  }
  function softGlowSprite(color, radius, scale) {
    const size = radius * 2;
    return sprite('sg' + color + radius, scale, size, size, (ctx, w) => {
      const c = w / 2;
      const g = ctx.createRadialGradient(c, c, 0, c, c, radius);
      g.addColorStop(0, U.rgba(color, 0.55));
      g.addColorStop(0.35, U.rgba(color, 0.22));
      g.addColorStop(1, U.rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    });
  }

  // ---------------------------------------------------------------- power-up capsules
  const KIND = {
    good: { base: '#2d78f0', light: '#a8d0ff', dark: '#0f2f7a', glow: '#4a9dff' },
    neutral: { base: '#98a3b5', light: '#f1f4f9', dark: '#444d5d', glow: '#c9d3e3' },
    bad: { base: '#e5393b', light: '#ffc0bb', dark: '#6e0d0f', glow: '#ff5a50' },
  };

  function icon(ctx, type, cx, cy, s) {
    const u = s / 2;
    const P = (x, y) => [cx + x * u, cy + y * u];
    const poly = (pts) => { ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); };
    const circle = (x, y, r) => { const [px, py] = P(x, y); ctx.beginPath(); ctx.arc(px, py, r * u, 0, Math.PI * 2); ctx.fill(); };
    const rect = (x0, y0, x1, y1) => { const [ax, ay] = P(x0, y0); const [bx, by] = P(x1, y1); ctx.fillRect(ax, ay, bx - ax, by - ay); };
    const line = (pts, lw) => { ctx.lineWidth = lw * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
    switch (type) {
      case 'expand':
        rect(-0.42, -0.2, 0.42, 0.2);
        poly([[-1.05, 0], [-0.5, -0.55], [-0.5, 0.55]]);
        poly([[1.05, 0], [0.5, -0.55], [0.5, 0.55]]);
        break;
      case 'shrink':
        rect(-0.22, -0.2, 0.22, 0.2);
        poly([[-0.35, 0], [-0.95, -0.55], [-0.95, 0.55]]);
        poly([[0.35, 0], [0.95, -0.55], [0.95, 0.55]]);
        break;
      case 'supershrink':
        rect(-0.1, -0.16, 0.1, 0.16);
        poly([[-0.25, 0], [-0.62, -0.45], [-0.62, 0.45]]);
        poly([[-0.72, 0], [-1.09, -0.45], [-1.09, 0.45]]);
        poly([[0.25, 0], [0.62, -0.45], [0.62, 0.45]]);
        poly([[0.72, 0], [1.09, -0.45], [1.09, 0.45]]);
        break;
      case 'split':
        circle(0, -0.46, 0.34); circle(-0.56, 0.42, 0.34); circle(0.56, 0.42, 0.34);
        break;
      case 'fireball': {
        const flame = (k, dy) => {
          ctx.beginPath();
          const [ax, ay] = P(0, -1.0 * k + dy);
          ctx.moveTo(ax, ay);
          ctx.bezierCurveTo(...P(0.25 * k, -0.45 * k + dy), ...P(0.75 * k, -0.1 * k + dy), ...P(0.62 * k, 0.4 * k + dy));
          ctx.bezierCurveTo(...P(0.5 * k, 0.85 * k + dy), ...P(-0.5 * k, 0.85 * k + dy), ...P(-0.62 * k, 0.4 * k + dy));
          ctx.bezierCurveTo(...P(-0.72 * k, 0 + dy), ...P(-0.3 * k, -0.3 * k + dy), ...P(0, -1.0 * k + dy));
          ctx.fill();
        };
        flame(1, 0.05);
        const keep = ctx.fillStyle;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        flame(0.5, 0.35);
        ctx.fillStyle = keep;
        break;
      }
      case 'thru': {
        ctx.lineWidth = 0.18 * u;
        const [ax, ay] = P(-0.8, -0.12); const [bx, by] = P(0.8, 0.42);
        ctx.strokeRect(ax, ay, bx - ax, by - ay);
        line([[0, 0.95], [0, -0.55]], 0.26);
        poly([[0, -1.05], [-0.38, -0.45], [0.38, -0.45]]);
        break;
      }
      case 'grab': {
        ctx.lineWidth = 0.34 * u;
        ctx.lineCap = 'butt';
        const [px, py] = P(0, 0.05);
        ctx.beginPath();
        ctx.moveTo(...P(-0.55, -0.75));
        ctx.lineTo(...P(-0.55, 0.05));
        ctx.arc(px, py, 0.55 * u, Math.PI, 0, true);
        ctx.lineTo(...P(0.55, -0.75));
        ctx.stroke();
        const keep = ctx.fillStyle;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        rect(-0.72, -0.95, -0.38, -0.6); rect(0.38, -0.95, 0.72, -0.6);
        ctx.fillStyle = keep;
        break;
      }
      case 'guns':
        for (const sx of [-0.45, 0.45]) {
          rect(sx - 0.14, -0.35, sx + 0.14, 0.85);
          poly([[sx - 0.14, -0.35], [sx + 0.14, -0.35], [sx, -0.95]]);
        }
        break;
      case 'setoff':
        circle(-0.12, 0.22, 0.62);
        rect(0.18, -0.55, 0.42, -0.3);
        line([[0.3, -0.55], [0.5, -0.8]], 0.12);
        star(ctx, ...P(0.66, -0.86), 0.36 * u, 0.1 * u, ctx.fillStyle);
        break;
      case 'multiply':
        circle(-0.35, 0.25, 0.52);
        rect(-0.1, -0.42, 0.1, -0.22);
        rect(0.45, -0.75, 0.62, -0.05);
        rect(0.18, -0.48, 0.89, -0.32);
        break;
      case 'zap':
        poly([[0.18, -1.05], [-0.6, 0.12], [-0.06, 0.12], [-0.28, 1.05], [0.6, -0.18], [0.06, -0.18]]);
        break;
      case 'warp':
        poly([[-0.95, -0.7], [-0.45, -0.7], [0.05, 0], [-0.45, 0.7], [-0.95, 0.7], [-0.45, 0]]);
        poly([[-0.1, -0.7], [0.4, -0.7], [0.9, 0], [0.4, 0.7], [-0.1, 0.7], [0.4, 0]]);
        break;
      case 'life': {
        ctx.beginPath();
        ctx.moveTo(...P(0, 0.9));
        ctx.bezierCurveTo(...P(-1.1, 0.1), ...P(-0.75, -0.95), ...P(0, -0.45));
        ctx.bezierCurveTo(...P(0.75, -0.95), ...P(1.1, 0.1), ...P(0, 0.9));
        ctx.fill();
        break;
      }
      case 'fast':
        circle(0.42, 0, 0.42);
        line([[-1.0, -0.4], [-0.25, -0.4]], 0.16);
        line([[-1.1, 0], [-0.15, 0]], 0.16);
        line([[-1.0, 0.4], [-0.25, 0.4]], 0.16);
        break;
      case 'slow':
        poly([[-0.55, -0.85], [0.55, -0.85], [0.08, -0.05], [-0.08, -0.05]]);
        poly([[-0.08, 0.05], [0.08, 0.05], [0.55, 0.85], [-0.55, 0.85]]);
        rect(-0.7, -1.02, 0.7, -0.85); rect(-0.7, 0.85, 0.7, 1.02);
        break;
      case 'kill': {
        circle(0, -0.2, 0.68);
        rect(-0.36, 0.2, 0.36, 0.78);
        const keep = ctx.fillStyle;
        ctx.fillStyle = 'rgba(40,0,0,0.75)';
        circle(-0.27, -0.2, 0.2); circle(0.27, -0.2, 0.2);
        rect(-0.06, 0.45, 0.06, 0.78);
        ctx.fillStyle = keep;
        break;
      }
      case 'fall':
        rect(-0.85, -1.0, 0.85, -0.42);
        rect(-0.13, -0.3, 0.13, 0.45);
        poly([[0, 1.02], [-0.45, 0.35], [0.45, 0.35]]);
        break;
      case 'smallball':
        circle(0, 0, 0.26);
        poly([[0, -0.45], [-0.25, -0.95], [0.25, -0.95]]);
        poly([[0, 0.45], [-0.25, 0.95], [0.25, 0.95]]);
        poly([[-0.5, 0], [-1.05, -0.28], [-1.05, 0.28]]);
        poly([[0.5, 0], [1.05, -0.28], [1.05, 0.28]]);
        break;
    }
  }

  function capsuleSprite(type, scale) {
    const w = C.CAPSULE_W, h = C.CAPSULE_H;
    return sprite('cap' + type, scale, w, h, (ctx) => {
      const k = KIND[OX.POWERUPS[type].kind];
      const x = 0.8, y = 0.8, bw = w - 1.6, bh = h - 1.6, r = bh / 2;
      let g = ctx.createLinearGradient(0, y, 0, y + bh);
      g.addColorStop(0, k.light);
      g.addColorStop(0.42, k.base);
      g.addColorStop(1, k.dark);
      rr(ctx, x, y, bw, bh, r);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      rr(ctx, x, y, bw, bh, r);
      ctx.clip();
      g = ctx.createLinearGradient(x, 0, x + bw, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.35)');
      g.addColorStop(0.2, 'rgba(0,0,0,0)');
      g.addColorStop(0.8, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, bh);
      g = ctx.createLinearGradient(0, y, 0, y + bh * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0.05)');
      ctx.fillStyle = g;
      rr(ctx, x + 4, y + 1.1, bw - 8, bh * 0.42, bh * 0.2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      icon(ctx, type, w / 2 + 0.4, h / 2 + 0.9, h * 0.66);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      icon(ctx, type, w / 2, h / 2 + 0.3, h * 0.66);
      rr(ctx, x, y, bw, bh, r);
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = U.rgba(k.dark, 0.95);
      ctx.stroke();
    });
  }

  // ---------------------------------------------------------------- paddle
  function drawPaddle(ctx, x, y, w, h, o) {
    o = o || {};
    const left = x - w / 2, r = h / 2;
    // soft shadow on the playfield
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(x, y + h + 6, w * 0.46, 3.5, 0, 0, Math.PI * 2); ctx.fill();

    if (o.guns) {
      for (const gx of [left + Math.min(10, w * 0.18), left + w - Math.min(10, w * 0.18)]) {
        const g = ctx.createLinearGradient(gx - 3, 0, gx + 3, 0);
        g.addColorStop(0, '#5b6576'); g.addColorStop(0.45, '#eef3fa'); g.addColorStop(1, '#4a5363');
        ctx.fillStyle = g;
        rr(ctx, gx - 2.6, y - 8 + (o.recoil || 0), 5.2, 10, 1.2);
        ctx.fill();
        ctx.fillStyle = '#2a303b';
        ctx.fillRect(gx - 1.2, y - 8 + (o.recoil || 0), 2.4, 1.6);
      }
    }

    let g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#f7fbff');
    g.addColorStop(0.24, '#c6d0de');
    g.addColorStop(0.5, '#838fa3');
    g.addColorStop(0.62, '#5b6678');
    g.addColorStop(0.86, '#a3aec0');
    g.addColorStop(1, '#dde4ee');
    rr(ctx, left, y, w, h, r);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    rr(ctx, left, y, w, h, r);
    ctx.clip();
    const capW = Math.min(15, w * 0.2);
    g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffc2b4');
    g.addColorStop(0.3, '#ff5a3c');
    g.addColorStop(0.65, '#c42812');
    g.addColorStop(1, '#6e1206');
    ctx.fillStyle = g;
    ctx.fillRect(left, y, capW, h);
    ctx.fillRect(left + w - capW, y, capW, h);
    ctx.fillStyle = 'rgba(20,24,34,0.55)';
    ctx.fillRect(left + capW - 0.6, y, 1.2, h);
    ctx.fillRect(left + w - capW - 0.6, y, 1.2, h);
    const stripW = w - capW * 2 - 8;
    if (stripW > 2) {
      g = ctx.createLinearGradient(0, y + h * 0.4, 0, y + h * 0.62);
      g.addColorStop(0, '#d9f6ff');
      g.addColorStop(1, '#38bfff');
      ctx.fillStyle = g;
      rr(ctx, left + capW + 4, y + h * 0.42, stripW, h * 0.18, 1);
      ctx.fill();
    }
    g = ctx.createLinearGradient(0, y, 0, y + h * 0.45);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(left, y, w, h * 0.45);
    if (o.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, o.flash)})`;
      ctx.fillRect(left, y, w, h);
    }
    ctx.restore();

    rr(ctx, left, y, w, h, r);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(18,22,32,0.9)';
    ctx.stroke();

    if (o.grab) {
      const pulse = 0.55 + 0.25 * Math.sin((o.t || 0) * 5);
      g = ctx.createLinearGradient(0, y - 3, 0, y + 3);
      g.addColorStop(0, `rgba(170,255,190,${pulse})`);
      g.addColorStop(1, 'rgba(60,220,120,0.15)');
      ctx.fillStyle = g;
      rr(ctx, left + 5, y - 2.5, w - 10, 4.5, 2.2);
      ctx.fill();
      ctx.fillStyle = `rgba(120,255,160,${pulse * 0.8})`;
      for (let dx = left + 12; dx < left + w - 10; dx += 14) {
        ctx.beginPath(); ctx.ellipse(dx, y + 2.4, 1.3, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Mini paddle for the lives counter.
  function lifeIcon(scale) {
    return sprite('life', scale, 26, 10, (ctx) => drawPaddle(ctx, 13, 1, 24, 7, {}));
  }

  // ---------------------------------------------------------------- backgrounds
  function base(ctx, hue, l1, l2, s = 42) {
    const g = ctx.createLinearGradient(0, 0, 0, C.H);
    g.addColorStop(0, U.hsl(hue, s, l1));
    g.addColorStop(1, U.hsl(hue + 18, s + 6, l2));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.W, C.H);
  }
  function vignette(ctx, a) {
    const g = ctx.createRadialGradient(C.W / 2, C.H * 0.42, C.H * 0.2, C.W / 2, C.H * 0.5, C.W * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  const BG = {
    nebula(ctx, hue, rnd) {
      base(ctx, hue, 10, 3.5);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) {
        const x = rnd() * C.W, y = rnd() * C.H * 0.9, r = 130 + rnd() * 320;
        const h2 = hue + (rnd() - 0.5) * 100;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, U.hsl(h2, 85, 48, 0.13));
        g.addColorStop(0.5, U.hsl(h2, 75, 32, 0.07));
        g.addColorStop(1, U.hsl(h2, 70, 20, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, C.W, C.H);
      }
      for (let i = 0; i < 280; i++) {
        const x = rnd() * C.W, y = rnd() * C.H, s = Math.pow(rnd(), 3) * 1.5 + 0.35;
        ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.65})`;
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 12; i++) {
        const x = rnd() * C.W, y = rnd() * C.H, s = 3 + rnd() * 5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.4);
        g.addColorStop(0, 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(160,190,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
        ctx.strokeStyle = 'rgba(220,235,255,0.5)';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x - s * 2.2, y); ctx.lineTo(x + s * 2.2, y); ctx.moveTo(x, y - s * 2.2); ctx.lineTo(x, y + s * 2.2); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      vignette(ctx, 0.55);
    },

    hex(ctx, hue, rnd) {
      base(ctx, hue, 8, 4, 30);
      const R = 25, hw = Math.sqrt(3) * R;
      for (let row = -1, y = -R; y < C.H + R; row++, y += R * 1.5) {
        for (let x = (row & 1 ? hw / 2 : 0) - hw; x < C.W + hw; x += hw) {
          const pts = [];
          for (let k = 0; k < 6; k++) {
            const a = Math.PI / 6 + (k * Math.PI) / 3;
            pts.push([x + Math.cos(a) * (R - 1.6), y + Math.sin(a) * (R - 1.6)]);
          }
          ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
          const lit = rnd() < 0.05;
          const g = ctx.createLinearGradient(x, y - R, x, y + R);
          g.addColorStop(0, U.hsl(hue, lit ? 60 : 28, lit ? 20 : 12 + rnd() * 2.5));
          g.addColorStop(1, U.hsl(hue + 10, lit ? 60 : 30, lit ? 12 : 7 + rnd() * 2));
          ctx.fillStyle = g;
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = U.hsl(hue, 40, 26, 0.35);
          ctx.beginPath(); ctx.moveTo(...pts[3]); ctx.lineTo(...pts[4]); ctx.lineTo(...pts[5]); ctx.stroke();
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.stroke();
        }
      }
      vignette(ctx, 0.6);
    },

    circuit(ctx, hue, rnd) {
      base(ctx, hue, 7, 3, 45);
      ctx.strokeStyle = U.hsl(hue, 50, 40, 0.06);
      ctx.lineWidth = 1;
      for (let x = 0; x <= C.W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.H); ctx.stroke(); }
      for (let y = 0; y <= C.H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.W, y); ctx.stroke(); }
      const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
      const traces = [];
      for (let i = 0; i < 80; i++) {
        let x = Math.round(rnd() * 40) * 24, y = Math.round(rnd() * 30) * 24;
        let d = Math.floor(rnd() * 8);
        const pts = [[x, y]];
        const n = 2 + Math.floor(rnd() * 6);
        for (let k = 0; k < n; k++) {
          const len = (1 + Math.floor(rnd() * 3)) * 24;
          x += dirs[d][0] * len; y += dirs[d][1] * len;
          pts.push([x, y]);
          if (rnd() < 0.6) d = (d + (rnd() < 0.5 ? 1 : 7)) % 8;
        }
        traces.push(pts);
      }
      for (const pts of traces) {
        const glow = rnd() < 0.18;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = U.hsl(hue, 60, glow ? 45 : 30, glow ? 0.7 : 0.45);
        ctx.lineWidth = 2;
        ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
        if (glow) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = U.hsl(hue, 90, 55, 0.12);
          ctx.lineWidth = 7;
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        for (const [px, py] of [pts[0], pts[pts.length - 1]]) {
          ctx.fillStyle = U.hsl(hue, 40, 8);
          ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = U.hsl(hue, 60, glow ? 50 : 34, 0.8);
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
      for (let i = 0; i < 6; i++) {
        const w = 48 + Math.floor(rnd() * 3) * 24, h = 24 + Math.floor(rnd() * 2) * 24;
        const x = Math.round(rnd() * 34) * 24 + 12, y = Math.round(rnd() * 26) * 24 + 12;
        ctx.fillStyle = U.hsl(hue, 20, 6, 0.9);
        rr(ctx, x, y, w, h, 3); ctx.fill();
        ctx.strokeStyle = U.hsl(hue, 40, 30, 0.6);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = U.hsl(hue, 30, 35, 0.5);
        for (let px = x + 8; px < x + w - 4; px += 8) { ctx.fillRect(px, y - 4, 3, 4); ctx.fillRect(px, y + h, 3, 4); }
      }
      vignette(ctx, 0.6);
    },

    plate(ctx, hue, rnd) {
      const g = ctx.createLinearGradient(0, 0, C.W, C.H);
      g.addColorStop(0, U.hsl(hue, 12, 17));
      g.addColorStop(1, U.hsl(hue, 14, 8));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, C.W, C.H);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(rnd() * C.W, rnd() * C.H, 1 + rnd() * 2, 1);
      }
      const S = 30;
      for (let j = 0; j * S < C.H + S; j++) {
        for (let i = 0; i * S < C.W + S; i++) {
          const cx = i * S + (j & 1 ? S / 2 : 0), cy = j * S;
          const a = ((i + j) & 1 ? 1 : -1) * Math.PI / 4;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(a);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          rr(ctx, -10 + 1.2, -2.6 + 1.2, 20, 5.2, 2.6); ctx.fill();
          const lg = ctx.createLinearGradient(0, -2.6, 0, 2.6);
          lg.addColorStop(0, U.hsl(hue, 12, 34));
          lg.addColorStop(1, U.hsl(hue, 12, 18));
          ctx.fillStyle = lg;
          rr(ctx, -10, -2.6, 20, 5.2, 2.6); ctx.fill();
          ctx.restore();
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, C.W, C.H);
      vignette(ctx, 0.65);
    },

    waves(ctx, hue) {
      base(ctx, hue, 11, 4, 50);
      for (let k = 0; k < 14; k++) {
        const y0 = k * 58 - 30, amp = 12 + k * 1.2, f = 0.0062 + k * 0.00035, ph = k * 1.37;
        const yAt = (x) => y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 1.7) * amp * 0.35;
        ctx.beginPath();
        ctx.moveTo(0, C.H);
        for (let x = 0; x <= C.W; x += 8) ctx.lineTo(x, yAt(x));
        ctx.lineTo(C.W, C.H);
        ctx.closePath();
        ctx.fillStyle = U.hsl(hue + k * 3, 55, 6 + k * 0.85, 0.5);
        ctx.fill();
        ctx.beginPath();
        for (let x = 0; x <= C.W; x += 8) (x ? ctx.lineTo(x, yAt(x)) : ctx.moveTo(x, yAt(x)));
        ctx.strokeStyle = U.hsl(hue, 80, 65, 0.08);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      vignette(ctx, 0.55);
    },

    marble(ctx, hue, rnd) {
      const lw = 240, lh = 180;
      const small = makeCanvas(lw, lh);
      const sctx = small.getContext('2d');
      const img = sctx.createImageData(lw, lh);
      const N = 64;
      const lattice = new Float32Array(N * N);
      for (let i = 0; i < lattice.length; i++) lattice[i] = rnd();
      const noise = (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
        const at = (a, b) => lattice[((b & (N - 1)) * N) + (a & (N - 1))];
        const v0 = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
        const v1 = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
        return v0 + (v1 - v0) * sy;
      };
      const [r0, g0, b0] = hslToRgb(hue, 30, 9);
      const [r1, g1, b1] = hslToRgb(hue + 25, 45, 30);
      for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
          let f = 0, amp = 1, freq = 0.03, tot = 0;
          for (let o = 0; o < 5; o++) { f += noise(x * freq, y * freq) * amp; tot += amp; amp *= 0.5; freq *= 2; }
          f /= tot;
          const v = Math.sin(x * 0.035 + y * 0.022 + f * 9);
          const vein = Math.pow(1 - Math.abs(v), 7);
          const t = Math.min(1, f * 0.5 + vein * 0.75);
          const i = (y * lw + x) * 4;
          img.data[i] = r0 + (r1 - r0) * t;
          img.data[i + 1] = g0 + (g1 - g0) * t;
          img.data[i + 2] = b0 + (b1 - b0) * t;
          img.data[i + 3] = 255;
        }
      }
      sctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(small, 0, 0, C.W, C.H);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, C.W, C.H);
      vignette(ctx, 0.6);
    },

    stone(ctx, hue, rnd) {
      base(ctx, hue, 5, 3, 15);
      let y = -6;
      while (y < C.H) {
        const rh = 34 + rnd() * 22;
        let x = -rnd() * 60;
        while (x < C.W) {
          const w = 50 + rnd() * 80;
          const l = 11 + rnd() * 6;
          const g = ctx.createLinearGradient(x, y, x + w * 0.3, y + rh);
          g.addColorStop(0, U.hsl(hue, 10 + rnd() * 6, l + 4));
          g.addColorStop(1, U.hsl(hue, 12, l - 3));
          ctx.fillStyle = g;
          rr(ctx, x + 2, y + 2, w - 4, rh - 4, 6);
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.beginPath(); ctx.moveTo(x + 4, y + rh - 6); ctx.lineTo(x + 4, y + 4); ctx.lineTo(x + w - 6, y + 4); ctx.stroke();
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath(); ctx.moveTo(x + w - 3, y + 5); ctx.lineTo(x + w - 3, y + rh - 3); ctx.lineTo(x + 5, y + rh - 3); ctx.stroke();
          for (let k = 0; k < 10; k++) {
            ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.12)';
            ctx.fillRect(x + 4 + rnd() * (w - 8), y + 4 + rnd() * (rh - 8), 1.5, 1.5);
          }
          x += w;
        }
        y += rh;
      }
      vignette(ctx, 0.62);
    },
  };

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }

  const bgCache = new Map();
  function background(style, hue, scale) {
    const key = style + ':' + hue + ':' + scale.toFixed(3);
    let c = bgCache.get(key);
    if (c) return c;
    if (bgCache.size > 12) bgCache.clear();
    c = makeCanvas(C.W * scale, C.H * scale);
    const ctx = c.getContext('2d');
    ctx.scale(c.width / C.W, c.height / C.H);
    const fn = BG[style] || BG.nebula;
    fn(ctx, hue, U.rng(U.hashString(style) ^ (hue * 7919)));
    bgCache.set(key, c);
    return c;
  }

  // ---------------------------------------------------------------- thumbnails
  function thumbnail(level, cssW, dpr) {
    const cssH = Math.round(cssW * C.H / C.W);
    const c = makeCanvas(cssW * dpr, cssH * dpr);
    const ctx = c.getContext('2d');
    const s = c.width / C.W;
    const bg = background(level.bg.style, level.bg.hue, Math.max(0.2, s));
    ctx.drawImage(bg, 0, 0, c.width, c.height);
    ctx.scale(s, s);
    const rows = level.rows;
    for (let r = 0; r < C.ROWS; r++) {
      for (let col = 0; col < C.COLS; col++) {
        const ch = rows[r][col];
        if (ch === '.') continue;
        const x = col * C.BW, y = C.GRID_TOP + r * C.BH;
        const spr = ch === 'H' ? ghostOutlineSprite(s) : brickSprite(ch, s);
        if (spr) ctx.drawImage(spr, x, y, C.BW, C.BH);
      }
    }
    const pw = C.PADDLE_SIZES[C.PADDLE_DEFAULT];
    drawPaddle(ctx, C.W / 2, C.PADDLE_TOP, pw, C.PADDLE_H, {});
    return c;
  }

  // Standalone capsule / brick previews for the help screen and the editor palette.
  function previewCanvas(drawFn, logicalW, logicalH, cssW, dpr) {
    const cssH = cssW * logicalH / logicalW;
    const c = makeCanvas(cssW * dpr, cssH * dpr);
    c.style.width = cssW + 'px';
    c.style.height = cssH + 'px';
    const ctx = c.getContext('2d');
    const s = c.width / logicalW;
    ctx.scale(s, s);
    drawFn(ctx, s);
    return c;
  }

  OX.gfx = {
    FONT_DISPLAY, FONT_BODY, KIND,
    makeCanvas, rr, star,
    brickSprite, sheenSprite, glowSprite, flashSprite, ghostOutlineSprite,
    ballSprite, softGlowSprite, capsuleSprite, lifeIcon,
    drawPaddle, background, thumbnail, previewCanvas,
    clearCache() { cache.clear(); bgCache.clear(); },
  };
})(window.OX = window.OX || {});

/* js/fx.js */
/* OX Ball — particles and one-shot effects (shards, explosions, sparks, lightning, floating text). */
(function (OX) {
  'use strict';
  const U = OX.U, C = OX.C;
  const TAU = Math.PI * 2;

  class FX {
    constructor() {
      this.parts = [];
      this.bolts = [];
      this.texts = [];
      this.shake = 0;
      this.setQuality('full');
    }

    setQuality(q) {
      this.low = q === 'low';
      this.max = this.low ? 450 : 1600;
    }

    clear() { this.parts.length = 0; this.bolts.length = 0; this.texts.length = 0; this.shake = 0; }

    push(p) {
      if (this.parts.length < this.max) this.parts.push(p);
    }

    n(count) { return this.low ? Math.max(1, Math.round(count * 0.4)) : count; }

    // --- emitters -------------------------------------------------------------
    brickBreak(x, y, color, strength = 1) {
      const base = color || '#cccccc';
      for (let i = 0, k = this.n(12 * strength); i < k; i++) {
        this.push({
          t: 'shard', x: x + U.rand(-C.BW / 2, C.BW / 2), y: y + U.rand(-C.BH / 2, C.BH / 2),
          vx: U.rand(-170, 170), vy: U.rand(-240, 30), g: 950, drag: 0.4,
          rot: U.rand(0, TAU), vr: U.rand(-14, 14),
          w: U.rand(3, 7), h: U.rand(1.6, 3.6),
          color: U.shade(base, U.rand(-0.25, 0.3)), life: U.rand(0.55, 1.05), age: 0,
        });
      }
      for (let i = 0, k = this.n(5 * strength); i < k; i++) {
        this.push({
          t: 'spark', x, y, vx: U.rand(-260, 260), vy: U.rand(-260, 120), g: 300, drag: 2.2,
          r: U.rand(1, 2), color: '#ffffff', life: U.rand(0.2, 0.45), age: 0,
        });
      }
    }

    hitSpark(x, y, color, count = 6) {
      for (let i = 0, k = this.n(count); i < k; i++) {
        this.push({
          t: 'spark', x, y, vx: U.rand(-200, 200), vy: U.rand(-200, 200), g: 0, drag: 4,
          r: U.rand(0.8, 1.8), color: color || '#fff6d0', life: U.rand(0.15, 0.35), age: 0,
        });
      }
    }

    explosion(x, y, size = 1) {
      this.push({ t: 'flash', x, y, r: 75 * size, color: '#ffd89a', life: 0.28, age: 0 });
      this.push({ t: 'ring', x, y, r0: 10, r1: 95 * size, w: 5, color: '#ffb35c', life: 0.38, age: 0 });
      for (let i = 0, k = this.n(26 * size); i < k; i++) {
        const a = U.rand(0, TAU), sp = U.rand(80, 420) * size;
        this.push({
          t: 'ember', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 120, drag: 3,
          r: U.rand(1.4, 3.4), color: U.pick(['#fff3b0', '#ffc34d', '#ff8a2a', '#ff5a1f']), life: U.rand(0.35, 0.8), age: 0,
        });
      }
      for (let i = 0, k = this.n(7 * size); i < k; i++) {
        this.push({
          t: 'smoke', x: x + U.rand(-14, 14), y: y + U.rand(-8, 8), vx: U.rand(-30, 30), vy: U.rand(-60, -10), g: 0, drag: 1,
          r: U.rand(8, 16) * size, grow: 34, color: '#3a3533', alpha: 0.4, life: U.rand(0.6, 1.1), age: 0,
        });
      }
      this.kick(5 * size);
    }

    sparkle(x, y, color, count = 16, speed = 220) {
      for (let i = 0, k = this.n(count); i < k; i++) {
        const a = U.rand(0, TAU), sp = U.rand(speed * 0.3, speed);
        this.push({
          t: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 60, drag: 2.5,
          r: U.rand(1, 2.4), color, life: U.rand(0.35, 0.8), age: 0,
        });
      }
    }

    ring(x, y, color, r1 = 60, life = 0.4, w = 3) {
      this.push({ t: 'ring', x, y, r0: 4, r1, w, color, life, age: 0 });
    }

    ember(x, y, vx, vy, color, r = 2.2, life = 0.4) {
      this.push({ t: 'ember', x, y, vx, vy, g: -60, drag: 2, r, color, life, age: 0 });
    }

    trail(x, y, r, color, life = 0.22) {
      this.push({ t: 'dot', x, y, vx: 0, vy: 0, g: 0, drag: 0, r, color, life, age: 0 });
    }

    paddleExplosion(x, y, w) {
      for (let i = 0, k = this.n(40); i < k; i++) {
        this.push({
          t: 'shard', x: x + U.rand(-w / 2, w / 2), y: y + U.rand(0, C.PADDLE_H),
          vx: U.rand(-260, 260), vy: U.rand(-420, -60), g: 900, drag: 0.3,
          rot: U.rand(0, TAU), vr: U.rand(-16, 16), w: U.rand(3, 8), h: U.rand(2, 4),
          color: U.pick(['#dfe6ef', '#9aa6b8', '#ff5a3c', '#c42812', '#7fe3ff']), life: U.rand(0.7, 1.4), age: 0,
        });
      }
      this.explosion(x, y + 6, 1.3);
    }

    lightning(x1, y1, x2, y2, color = '#cfe6ff', life = 0.35) {
      const pts = [[x1, y1], [x2, y2]];
      let disp = Math.hypot(x2 - x1, y2 - y1) * 0.22;
      for (let pass = 0; pass < 5; pass++) {
        const next = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
          next.push([(ax + bx) / 2 + U.rand(-disp, disp), (ay + by) / 2 + U.rand(-disp, disp) * 0.35]);
          next.push(pts[i + 1]);
        }
        pts.length = 0;
        pts.push(...next);
        disp *= 0.55;
      }
      this.bolts.push({ pts, color, life, age: 0 });
    }

    text(x, y, str, color = '#ffffff', size = 20, life = 1.3) {
      this.texts.push({ x, y, str, color, size, life, age: 0 });
      if (this.texts.length > 6) this.texts.shift();
    }

    fireworks(x, y) {
      const color = U.pick(['#ff5a8a', '#5ad1ff', '#ffe066', '#8cff7a', '#c38bff', '#ff9b4a']);
      this.push({ t: 'flash', x, y, r: 40, color, life: 0.25, age: 0 });
      for (let i = 0, k = this.n(40); i < k; i++) {
        const a = (i / k) * TAU + U.rand(-0.05, 0.05), sp = U.rand(160, 320);
        this.push({
          t: 'ember', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 160, drag: 1.6,
          r: U.rand(1.4, 2.6), color, life: U.rand(0.8, 1.4), age: 0,
        });
      }
    }

    kick(amount) { this.shake = Math.min(14, this.shake + amount); }

    // --- simulation -------------------------------------------------------------
    update(dt) {
      const ps = this.parts;
      let j = 0;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.age += dt;
        if (p.age >= p.life) continue;
        if (p.vx !== undefined) {
          const d = p.drag ? Math.max(0, 1 - p.drag * dt) : 1;
          p.vx *= d; p.vy = p.vy * d + (p.g || 0) * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
        }
        if (p.vr) p.rot += p.vr * dt;
        if (p.grow) p.r += p.grow * dt;
        ps[j++] = p;
      }
      ps.length = j;
      for (let i = this.bolts.length - 1; i >= 0; i--) {
        const b = this.bolts[i];
        b.age += dt;
        if (b.age >= b.life) this.bolts.splice(i, 1);
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.age += dt;
        t.y -= 34 * dt;
        if (t.age >= t.life) this.texts.splice(i, 1);
      }
      this.shake = Math.max(0, this.shake - dt * 30);
    }

    // --- drawing (ctx is in playfield coordinates) --------------------------------
    render(ctx) {
      const ps = this.parts;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const k = 1 - p.age / p.life;
        if (p.t === 'shard') {
          ctx.globalAlpha = Math.min(1, k * 1.6);
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        } else if (p.t === 'smoke') {
          ctx.globalAlpha = p.alpha * k;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const k = 1 - p.age / p.life;
        switch (p.t) {
          case 'spark':
          case 'ember':
          case 'dot':
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (p.t === 'dot' ? k : 0.6 + k * 0.4), 0, TAU); ctx.fill();
            break;
          case 'flash': {
            ctx.globalAlpha = k * k;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, U.rgba(p.color, 0.9));
            g.addColorStop(1, U.rgba(p.color, 0));
            ctx.fillStyle = g;
            ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
            break;
          }
          case 'ring': {
            const e = 1 - Math.pow(k, 2.2);
            ctx.globalAlpha = k;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.w * k + 0.5;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * e, 0, TAU); ctx.stroke();
            break;
          }
        }
      }
      for (const b of this.bolts) {
        const k = 1 - b.age / b.life;
        const flicker = 0.55 + Math.random() * 0.45;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (const [w, a] of [[9, 0.12], [4, 0.35], [1.6, 1]]) {
          ctx.globalAlpha = a * k * flicker;
          ctx.strokeStyle = w < 2 ? '#ffffff' : b.color;
          ctx.lineWidth = w;
          ctx.beginPath();
          b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const t of this.texts) {
        const k = 1 - t.age / t.life;
        ctx.globalAlpha = Math.min(1, k * 2.2);
        ctx.font = `700 ${t.size}px ${OX.gfx.FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.strokeText(t.str, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    }
  }

  OX.FX = FX;
})(window.OX = window.OX || {});

/* js/audio.js */
/* OX Ball — sound. Everything is synthesised with the Web Audio API: no sound files to load. */
(function (OX) {
  'use strict';

  let ac = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let sfxVol = 0.8, musicVol = 0.45, muted = false;
  const last = {};

  function ensure() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch (e) { return null; }
    master = ac.createGain();
    master.gain.value = muted ? 0 : 1;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 5;
    comp.attack.value = 0.003; comp.release.value = 0.2;
    master.connect(comp);
    comp.connect(ac.destination);
    sfxBus = ac.createGain();
    sfxBus.gain.value = sfxVol;
    sfxBus.connect(master);
    musicBus = ac.createGain();
    musicBus.gain.value = musicVol * 0.55;
    musicBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }

  // Browsers only allow audio after a user gesture; main.js calls this on the first click / key press.
  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone(o, bus) {
    const t0 = (o.at != null ? o.at : ac.currentTime) + (o.t || 0);
    const osc = ac.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t0 + (o.slide || o.dur));
    if (o.detune) osc.detune.value = o.detune;
    const g = ac.createGain();
    const a = o.a || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol), t0 + a);
    if (o.hold) g.gain.setValueAtTime(Math.max(0.0002, o.vol), t0 + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    let node = osc;
    if (o.filter) {
      const f = ac.createBiquadFilter();
      f.type = o.filter.type || 'lowpass';
      f.frequency.setValueAtTime(o.filter.f, t0);
      if (o.filter.f2) f.frequency.exponentialRampToValueAtTime(o.filter.f2, t0 + o.dur);
      f.Q.value = o.filter.q || 0.7;
      node.connect(f);
      node = f;
    }
    if (o.vib) {
      const lfo = ac.createOscillator();
      const lg = ac.createGain();
      lfo.frequency.value = o.vib.rate;
      lg.gain.value = o.vib.depth;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + o.dur + 0.05);
    }
    node.connect(g);
    g.connect(bus || sfxBus);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
  }

  function noise(o, bus) {
    const t0 = (o.at != null ? o.at : ac.currentTime) + (o.t || 0);
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.f, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    f.Q.value = o.q || 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol), t0 + (o.a || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus || sfxBus);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + o.dur + 0.05);
  }

  const PENTA = [0, 2, 4, 7, 9];

  const SFX = {
    paddle(pos = 0) {
      tone({ type: 'triangle', f: 300 + pos * 50, f2: 230, dur: 0.12, vol: 0.32 });
      tone({ type: 'sine', f: 150, dur: 0.1, vol: 0.22 });
    },
    wall() { tone({ type: 'sine', f: 540, f2: 470, dur: 0.05, vol: 0.09 }); },
    brick(step = 0) {
      const s = Math.min(step, 14);
      const semi = PENTA[s % 5] + 12 * Math.floor(s / 5);
      const f = 620 * Math.pow(2, semi / 12);
      tone({ type: 'square', f, dur: 0.08, vol: 0.07, filter: { f: 3200 } });
      tone({ type: 'sine', f: f * 2, dur: 0.16, vol: 0.1 });
    },
    multi() {
      tone({ type: 'triangle', f: 1180, dur: 0.12, vol: 0.16 });
      tone({ type: 'sine', f: 1745, dur: 0.2, vol: 0.1 });
      tone({ type: 'square', f: 300, dur: 0.05, vol: 0.05, filter: { f: 1400 } });
    },
    solid() {
      tone({ type: 'triangle', f: 200, f2: 150, dur: 0.12, vol: 0.28 });
      tone({ type: 'sine', f: 2350, dur: 0.07, vol: 0.05 });
      noise({ type: 'highpass', f: 3500, dur: 0.04, vol: 0.1 });
    },
    explode(size = 1) {
      noise({ type: 'lowpass', f: 2600, f2: 110, dur: 0.6, vol: 0.45 * Math.min(1.4, size) });
      tone({ type: 'sine', f: 125, f2: 36, dur: 0.5, vol: 0.5 });
    },
    reveal() {
      [880, 1320, 1760].forEach((f, i) => tone({ type: 'sine', f, t: i * 0.045, dur: 0.24, vol: 0.09 }));
    },
    good() {
      [72, 76, 79, 84].forEach((m, i) => tone({ type: 'triangle', f: midi(m), t: i * 0.055, dur: 0.18, vol: 0.2 }));
      tone({ type: 'sine', f: midi(96), t: 0.22, dur: 0.3, vol: 0.06 });
    },
    neutral() {
      tone({ type: 'triangle', f: midi(76), dur: 0.14, vol: 0.18 });
      tone({ type: 'triangle', f: midi(71), t: 0.09, dur: 0.2, vol: 0.18 });
    },
    // The original blared a warning when you caught a bad capsule — so do we.
    bad() {
      for (let i = 0; i < 4; i++) {
        tone({ type: 'square', f: i % 2 ? 247 : 330, t: i * 0.09, dur: 0.1, vol: 0.14, filter: { f: 2200 }, vib: { rate: 30, depth: 12 } });
      }
      tone({ type: 'sawtooth', f: 110, t: 0, dur: 0.38, vol: 0.12, filter: { f: 900 } });
    },
    laser() {
      tone({ type: 'square', f: 1700, f2: 420, dur: 0.1, vol: 0.06, filter: { f: 4500 } });
    },
    launch() { tone({ type: 'sine', f: 380, f2: 820, dur: 0.14, vol: 0.12 }); },
    grab() { tone({ type: 'sine', f: 240, f2: 180, dur: 0.08, vol: 0.2 }); },
    lifeLost() {
      tone({ type: 'sawtooth', f: 460, f2: 90, dur: 0.8, vol: 0.18, filter: { f: 1800, f2: 300 } });
      noise({ type: 'lowpass', f: 1800, f2: 100, dur: 0.7, vol: 0.3 });
      tone({ type: 'sine', f: 90, f2: 30, dur: 0.6, vol: 0.4 });
    },
    extraLife() {
      [72, 76, 79, 84, 88, 91].forEach((m, i) => tone({ type: 'square', f: midi(m), t: i * 0.07, dur: 0.12, vol: 0.07, filter: { f: 3000 } }));
    },
    levelComplete() {
      [67, 72, 76, 79].forEach((m, i) => tone({ type: 'triangle', f: midi(m), t: i * 0.1, dur: 0.22, vol: 0.2 }));
      [72, 76, 79, 84].forEach((m) => tone({ type: 'sawtooth', f: midi(m), t: 0.42, dur: 0.9, a: 0.02, vol: 0.05, filter: { f: 2400 } }));
    },
    warp() {
      tone({ type: 'sine', f: 180, f2: 2400, dur: 0.7, vol: 0.2, slide: 0.65 });
      noise({ type: 'bandpass', f: 400, f2: 6000, dur: 0.7, vol: 0.2, q: 2 });
    },
    zap() {
      for (let i = 0; i < 12; i++) {
        noise({ type: 'bandpass', f: 1500 + Math.random() * 4000, dur: 0.04 + Math.random() * 0.05, vol: 0.18, q: 6, t: i * 0.035 });
      }
      tone({ type: 'sawtooth', f: 60, dur: 0.45, vol: 0.12, filter: { f: 600 } });
    },
    crackle(level = 0.5) {
      noise({ type: 'bandpass', f: 1800 + Math.random() * 4500, dur: 0.03 + Math.random() * 0.04, vol: 0.04 + 0.18 * level, q: 5 });
    },
    lightning() {
      noise({ type: 'highpass', f: 900, dur: 0.3, vol: 0.55 });
      tone({ type: 'sine', f: 95, f2: 30, dur: 0.6, vol: 0.5 });
    },
    grow() { tone({ type: 'sine', f: 320, f2: 720, dur: 0.18, vol: 0.12 }); },
    shrink() { tone({ type: 'sine', f: 720, f2: 300, dur: 0.18, vol: 0.12 }); },
    gameOver() {
      [67, 63, 60, 55].forEach((m, i) => tone({ type: 'triangle', f: midi(m), t: i * 0.28, dur: 0.5, vol: 0.2 }));
    },
    victory() {
      const seq = [72, 76, 79, 84, 79, 84, 88];
      seq.forEach((m, i) => tone({ type: 'square', f: midi(m), t: i * 0.12, dur: 0.2, vol: 0.08, filter: { f: 3200 } }));
      [72, 76, 79, 84].forEach((m) => tone({ type: 'sawtooth', f: midi(m), t: 0.85, dur: 1.4, a: 0.03, vol: 0.05, filter: { f: 2600 } }));
    },
    click() { tone({ type: 'sine', f: 880, dur: 0.05, vol: 0.07 }); },
  };

  const MIN_GAP = { brick: 0.028, multi: 0.03, solid: 0.04, wall: 0.04, explode: 0.07, crackle: 0.02, laser: 0.05, paddle: 0.03 };

  function play(name, ...args) {
    if (muted || !ac || ac.state !== 'running' || sfxVol <= 0) return;
    const fn = SFX[name];
    if (!fn) return;
    const now = ac.currentTime;
    const gap = MIN_GAP[name] || 0.015;
    if (last[name] && now - last[name] < gap) return;
    last[name] = now;
    try { fn(...args); } catch (e) { /* never let audio break the game */ }
  }

  // ---------------------------------------------------------------- music
  // A small four-chord loop (Am – F – C – G): a calm version for the menus and a full one in game.
  const CHORDS = [
    { bass: 45, tones: [57, 60, 64] },
    { bass: 41, tones: [53, 57, 60] },
    { bass: 48, tones: [55, 60, 64] },
    { bass: 43, tones: [55, 59, 62] },
  ];
  const ARPS = [
    [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3],
    [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 2, 1, 2, 3],
    [3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 3, 2, 1],
  ];
  const BASS = [1, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 0];
  const music = { mode: null, timer: null, next: 0, step: 0, bar: 0 };

  function scheduleStep(at, step, bar) {
    const full = music.mode === 'game';
    const chord = CHORDS[bar % 4];
    const arp = ARPS[Math.floor(bar / 8) % ARPS.length];
    const stepDur = full ? 60 / 124 / 4 : 60 / 96 / 4;
    const notes = chord.tones.concat([chord.tones[0] + 12]);
    // arpeggio
    if (full || step % 2 === 0) {
      const n = notes[arp[step]] + 12;
      tone({ at, type: 'square', f: midi(n), dur: stepDur * (full ? 0.9 : 1.8), vol: full ? 0.035 : 0.028, filter: { f: full ? 2600 : 1600 } }, musicBus);
    }
    // bass
    if (BASS[step] && (full || step % 8 === 0)) {
      const m = chord.bass + (BASS[step] === 2 ? 12 : 0);
      tone({ at, type: 'triangle', f: midi(m), dur: stepDur * 1.8, vol: full ? 0.22 : 0.14, filter: { f: 900 } }, musicBus);
    }
    // pad
    if (step === 0) {
      for (const n of chord.tones) {
        tone({ at, type: 'sawtooth', f: midi(n), dur: stepDur * 16, a: 0.25, hold: stepDur * 11, vol: 0.022, filter: { f: 1100 }, detune: (n % 3 - 1) * 7 }, musicBus);
      }
    }
    if (!full) return;
    // drums
    if (step === 0 || step === 8 || (step === 10 && bar % 2)) {
      tone({ at, type: 'sine', f: 150, f2: 42, dur: 0.22, slide: 0.12, vol: 0.5 }, musicBus);
    }
    if (step === 4 || step === 12) {
      noise({ at, type: 'bandpass', f: 1800, dur: 0.13, vol: 0.16, q: 0.9 }, musicBus);
      tone({ at, type: 'triangle', f: 220, f2: 160, dur: 0.08, vol: 0.08 }, musicBus);
    }
    if (step % 2 === 0) noise({ at, type: 'highpass', f: 7000, dur: step === 14 ? 0.12 : 0.03, vol: step % 4 === 2 ? 0.06 : 0.035 }, musicBus);
  }

  function pump() {
    if (!ac || !music.mode) return;
    const full = music.mode === 'game';
    const stepDur = full ? 60 / 124 / 4 : 60 / 96 / 4;
    if (music.next < ac.currentTime) music.next = ac.currentTime + 0.05;
    while (music.next < ac.currentTime + 0.15) {
      if (ac.state === 'running' && musicVol > 0 && !muted) scheduleStep(music.next, music.step, music.bar);
      music.next += stepDur;
      music.step = (music.step + 1) % 16;
      if (music.step === 0) music.bar++;
    }
  }

  function startMusic(mode) {
    if (music.mode === mode) return;
    music.mode = mode;
    music.step = 0;
    music.bar = 0;
    if (ac) music.next = ac.currentTime + 0.1;
    if (!music.timer) music.timer = setInterval(pump, 30);
  }
  function stopMusic() {
    music.mode = null;
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
  }

  function apply() {
    if (!ac) return;
    master.gain.setTargetAtTime(muted ? 0 : 1, ac.currentTime, 0.02);
    sfxBus.gain.setTargetAtTime(sfxVol, ac.currentTime, 0.02);
    musicBus.gain.setTargetAtTime(musicVol * 0.55, ac.currentTime, 0.05);
  }

  OX.audio = {
    unlock,
    play,
    startMusic,
    stopMusic,
    get muted() { return muted; },
    setMuted(m) { muted = !!m; apply(); },
    setVolumes(sfx, mus) { sfxVol = sfx; musicVol = mus; apply(); },
  };
})(window.OX = window.OX || {});

/* js/game.js */
/* OX Ball — the game engine: physics, bricks, power-ups, lives, scoring, level flow and drawing the playfield.
   Modes: 'campaign' (the playthrough, counts for high scores), 'practice' (one level from the level picker),
   'test' (one level from the editor) and 'demo' (the attract-mode game behind the main menu). */
(function (OX) {
  'use strict';
  const C = OX.C, U = OX.U, P = OX.POINTS;

  const BRICK_FX_COLOR = { multi: '#8fa0bc', explode: '#ff7a26', hidden: '#ff9ad8', solid: '#f2c14e' };
  const DROP_CHANCE = { normal: 0.11, multi: 0.2, explode: 0.08, hidden: 0.22, solid: 0.3 };
  const EFFECT_ICONS = [['fireball', 'fireball'], ['thru', 'thru'], ['grab', 'grab'], ['guns', 'guns'], ['smallBall', 'smallball'], ['falling', 'fall']];

  class Game {
    constructor(opts) {
      this.mode = opts.mode;
      this.levels = opts.levels;
      this.onEvent = opts.onEvent || (() => {});
      this.demo = this.mode === 'demo';
      this.silent = !!opts.silent || this.demo;
      this.autopilot = !!opts.autopilot;          // used by the automated tests: perfect AI paddle
      this.fx = new OX.FX();
      this.fx.setQuality(OX.store.settings.get().particles);
      this.score = 0;
      this.lives = C.START_LIVES;
      this.time = 0;
      this.paused = false;
      this.input = { targetX: C.W / 2, mode: 'mouse', left: false, right: false, fire: false, touch: false };
      this.paddle = { x: C.W / 2, w: C.PADDLE_SIZES[C.PADDLE_DEFAULT], size: C.PADDLE_DEFAULT, vx: 0, flash: 0, recoil: 0, keyVel: 0, visible: true };
      this.gunCooldown = 0;
      this.scoreText = '';
      this.scoreShown = -1;
      this.startLevel(opts.startIndex || 0);
    }

    // ------------------------------------------------------------------ helpers
    sound(name, ...args) { if (!this.silent) OX.audio.play(name, ...args); }
    get top() { return C.GRID_TOP + this.gridY; }
    brickCenter(row, col) { return [col * C.BW + C.BW / 2, this.top + row * C.BH + C.BH / 2]; }
    brickAt(row, col) { return row >= 0 && row < C.ROWS && col >= 0 && col < C.COLS ? this.bricks[row][col] : null; }
    levelSpeed() { return C.SPEED_BASE + C.SPEED_PER_LEVEL * Math.min(this.index, C.SPEED_LEVEL_CAP); }
    ballRadius() { return this.eff.smallBall ? C.BALL_R_SMALL : C.BALL_R; }

    multiplier() {
      let m = U.clamp(this.speed / C.SPEED_BASE, 0.7, 2.4);
      if (this.eff.smallBall) m *= 1.5;
      if (this.eff.fireball) m *= 1.25;
      return m;
    }
    addPoints(base) {
      if (this.demo) return 0;
      const pts = Math.max(5, Math.round((base * this.multiplier()) / 5) * 5);
      this.score += pts;
      return pts;
    }

    // ------------------------------------------------------------------ level flow
    startLevel(i) {
      this.index = i;
      this.level = this.levels[i];
      this.bricks = OX.levels.buildBricks(this.level.rows);
      this.breakable = 0;
      for (const row of this.bricks) for (const b of row) if (b && b.type !== 'solid') this.breakable++;
      this.startBreakable = this.breakable;
      this.gridY = 0;
      this.capsules = [];
      this.bullets = [];
      this.pending = [];
      this.fx.clear();
      this.sinceBreak = 0;
      this.loneTime = 0;
      this.loneSpark = 0;
      this.levelStartScore = this.score;
      this.intro = this.demo ? 0 : 2.8;
      this.combo = 0;
      this.resetLife();
      this.setState('serve');
      this.onEvent('level', { index: i });
    }

    resetLife() {
      this.eff = { fireball: false, thru: false, grab: false, guns: false, smallBall: false, falling: false };
      this.paddle.size = C.PADDLE_DEFAULT;
      this.paddle.visible = true;
      this.speed = this.levelSpeed();
      this.balls = [this.newBall(this.paddle.x, true)];
      this.capsules = [];
      this.bullets = [];
    }

    newBall(x, stuck) {
      const r = this.ballRadius();
      return { x, y: C.PADDLE_TOP - r, dx: 0, dy: -1, r, stuck, offset: 0, trail: [], dead: false };
    }

    setState(s) { this.state = s; this.stateTime = 0; }

    levelCleared() {
      if (this.state !== 'play' && this.state !== 'serve') return;
      this.setState('cleared');
      this.bonus = this.demo ? 0 : P.levelBonusBase + P.levelBonusStep * (this.index + 1);
      this.score += this.bonus;
      this.sound('levelComplete');
      for (const b of this.balls) this.fx.sparkle(b.x, b.y, '#bfe6ff', 18, 200);
      this.balls = [];
      this.capsules = [];
      this.bullets = [];
      this.pending = [];
      // leftover unbreakable bricks shatter as the level ends
      for (let r = 0; r < C.ROWS; r++) {
        for (let c = 0; c < C.COLS; c++) {
          const b = this.bricks[r][c];
          if (!b) continue;
          const [x, y] = this.brickCenter(r, c);
          this.fx.brickBreak(x, y, BRICK_FX_COLOR.solid, 0.6);
          this.bricks[r][c] = null;
        }
      }
    }

    advance() {
      if (this.demo) {
        let next = this.index;
        if (this.levels.length > 1) while (next === this.index) next = Math.floor(Math.random() * this.levels.length);
        this.startLevel(next);
        return;
      }
      if (this.mode !== 'campaign') {
        this.setState('done');
        this.onEvent('practiceComplete', { score: this.score });
        return;
      }
      if (this.index + 1 < this.levels.length) {
        this.startLevel(this.index + 1);
      } else {
        this.setState('victory');
        this.lifeBonus = this.lives * P.lifeBonus;
        this.score += this.lifeBonus;
        this.sound('victory');
        this.balls = [];
      }
    }

    loseLife() {
      if (this.state !== 'play' && this.state !== 'serve') return;
      this.setState('dying');
      const p = this.paddle;
      this.fx.paddleExplosion(p.x, C.PADDLE_TOP, p.w);
      this.sound('lifeLost');
      this.paddle.visible = false;
      this.balls = [];
      this.capsules = [];
      this.bullets = [];
    }

    // ------------------------------------------------------------------ input
    setPointerX(x, touch) {
      this.input.targetX = x;
      this.input.mode = 'mouse';
      this.input.touch = !!touch;
    }
    setKeys(left, right) {
      this.input.left = left;
      this.input.right = right;
      if (left || right) this.input.mode = 'keys';
    }
    setFire(held) { this.input.fire = held; }

    action() {
      if (this.paused) return;
      if (this.state === 'serve') {
        if (this.breakable <= 0) return;
        this.launchStuck();
        this.setState('play');
        this.intro = Math.min(this.intro, 0.6);
        return;
      }
      if (this.state !== 'play') return;
      if (this.balls.some((b) => b.stuck)) this.launchStuck();
      else if (this.eff.guns) this.fire();
    }

    launchStuck() {
      const p = this.paddle;
      let any = false;
      for (const b of this.balls) {
        if (!b.stuck) continue;
        any = true;
        b.stuck = false;
        let off = b.offset / (p.w / 2);
        if (Math.abs(off) < 0.08) off = (Math.sign(p.vx) || (Math.random() < 0.5 ? -1 : 1)) * U.rand(0.25, 0.45);
        const ang = U.clamp(off, -1, 1) * C.MAX_BOUNCE * 0.85;
        b.dx = Math.sin(ang);
        b.dy = -Math.cos(ang);
      }
      if (any) this.sound('launch');
    }

    fire() {
      if (this.gunCooldown > 0 || this.bullets.length >= C.MAX_BULLETS) return;
      this.gunCooldown = C.GUN_COOLDOWN;
      const p = this.paddle;
      const off = Math.min(10, p.w * 0.18);
      for (const gx of [p.x - p.w / 2 + off, p.x + p.w / 2 - off]) {
        this.bullets.push({ x: gx, y: C.PADDLE_TOP - 8, thru: this.eff.thru });
      }
      p.recoil = 2.5;
      this.sound('laser');
    }

    // ------------------------------------------------------------------ main update
    update(dt) {
      if (this.paused) return;
      dt = Math.min(dt, 1 / 30);
      this.time += dt;
      this.stateTime += dt;
      if (this.intro > 0) this.intro = Math.max(0, this.intro - dt);
      this.updatePaddle(dt);
      switch (this.state) {
        case 'serve':
          if (this.breakable <= 0) { this.levelCleared(); break; }
          if ((this.demo || this.autopilot) && this.stateTime > (this.autopilot ? 0.05 : 0.9)) this.action();
          this.updateBricks(dt);
          break;
        case 'play':
          this.updatePlay(dt);
          break;
        case 'dying':
          this.updateBricks(dt);
          if (this.stateTime > 1.5) {
            if (this.demo) { this.resetLife(); this.setState('serve'); break; }
            this.lives--;
            if (this.lives <= 0) {
              this.setState('over');
              this.sound('gameOver');
            } else {
              this.resetLife();
              this.setState('serve');
            }
          }
          break;
        case 'cleared':
          if (this.stateTime > 2.3) this.advance();
          break;
        case 'warping':
          if (this.stateTime > 1.1) this.advance();
          break;
        case 'over':
          if (this.stateTime > 2.2 && !this.overSent) {
            this.overSent = true;
            this.onEvent(this.mode === 'campaign' ? 'gameover' : 'practiceFailed', { score: this.score });
          }
          break;
        case 'victory':
          if (Math.random() < dt * 5) this.fx.fireworks(U.rand(120, C.W - 120), U.rand(80, 380));
          if (this.stateTime > 4.5 && !this.overSent) {
            this.overSent = true;
            this.onEvent('victory', { score: this.score });
          }
          break;
      }
      this.fx.update(dt);
    }

    updatePaddle(dt) {
      const p = this.paddle;
      const targetW = C.PADDLE_SIZES[p.size];
      p.w += (targetW - p.w) * Math.min(1, dt * 12);
      p.flash = Math.max(0, p.flash - dt * 4);
      p.recoil = Math.max(0, p.recoil - dt * 18);
      const prevX = p.x;
      let tx;
      if (this.demo || this.autopilot) {
        tx = this.aiTarget();
        const maxStep = (this.autopilot ? 4000 : 1150) * dt;
        tx = p.x + U.clamp(tx - p.x, -maxStep, maxStep);
      } else if (this.input.mode === 'keys') {
        const dir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
        const maxV = 860 * (OX.store.settings.get().keySpeed || 1);
        if (!dir || Math.sign(p.keyVel) !== dir) p.keyVel = 0;
        if (dir) p.keyVel = dir * Math.min(maxV, Math.abs(p.keyVel) + 5200 * dt);
        tx = p.x + p.keyVel * dt;
        this.input.targetX = tx;
      } else {
        tx = this.input.targetX;
      }
      p.x = U.clamp(tx, p.w / 2, C.W - p.w / 2);
      p.vx = (p.x - prevX) / Math.max(dt, 1e-4);
      for (const b of this.balls) {
        if (!b.stuck) continue;
        b.offset = U.clamp(b.offset, -p.w / 2 + 4, p.w / 2 - 4);
        b.x = U.clamp(p.x + b.offset, b.r, C.W - b.r);
        b.y = C.PADDLE_TOP - b.r;
      }
    }

    updatePlay(dt) {
      this.speed = Math.min(C.SPEED_MAX, this.speed + C.SPEED_RAMP * dt);
      this.gunCooldown = Math.max(0, this.gunCooldown - dt);
      const anyStuck = this.balls.some((b) => b.stuck);
      if (this.eff.guns && this.input.fire && !anyStuck) this.fire();
      this.stuckTime = anyStuck ? (this.stuckTime || 0) + dt : 0;
      if ((this.demo || this.autopilot) && anyStuck && this.stuckTime > (this.autopilot ? 0.05 : 0.35)) this.launchStuck();
      if (this.autopilot && this.eff.guns) this.fire();

      const steps = Math.max(1, Math.ceil((this.speed * dt) / 3));
      const h = dt / steps;
      for (let s = 0; s < steps && this.state === 'play'; s++) {
        for (const b of this.balls) if (!b.dead) this.stepBall(b, h);
      }
      if (this.state !== 'play') return;

      for (const b of this.balls) {
        if (b.stuck || b.dead) continue;
        b.trail.push(b.x, b.y);
        if (b.trail.length > 16) b.trail.splice(0, 2);
        if (this.eff.fireball && (!this.fx.low || Math.random() < 0.4)) {
          this.fx.ember(b.x + U.rand(-3, 3), b.y + U.rand(-3, 3), -b.dx * 60 + U.rand(-30, 30), -b.dy * 60 + U.rand(-30, 30),
            U.pick(['#ffd35a', '#ff8a1f', '#ff5a1f']), U.rand(1.6, 3.2), U.rand(0.2, 0.4));
        }
      }
      const alive = this.balls.filter((b) => !b.dead);
      if (alive.length !== this.balls.length) this.balls = alive;
      if (!this.balls.length) { this.loseLife(); return; }

      this.updateCapsules(dt);
      if (this.state !== 'play') return;
      this.updateBullets(dt);
      this.updatePending(dt);
      this.updateBricks(dt);
      this.updateStall(dt);
    }

    // ------------------------------------------------------------------ ball physics
    stepBall(b, h) {
      if (b.stuck) return;
      const v = this.speed * h;
      b.x += b.dx * v;
      b.y += b.dy * v;
      if (b.x < b.r) { b.x = b.r; if (b.dx < 0) { b.dx = -b.dx; this.onWall(b); } }
      else if (b.x > C.W - b.r) { b.x = C.W - b.r; if (b.dx > 0) { b.dx = -b.dx; this.onWall(b); } }
      if (b.y < b.r) { b.y = b.r; if (b.dy < 0) { b.dy = -b.dy; this.onWall(b); } }
      this.collideBricks(b);
      if (this.state !== 'play') return;
      if (b.dy > 0) this.collidePaddle(b);
      if (b.y - b.r > C.H) b.dead = true;
    }

    onWall(b) {
      if (this.sinceBreak > 12) this.jitter(b, 0.07);
      this.fixAngle(b);
      this.sound('wall');
    }

    jitter(b, amount) {
      const a = U.rand(-amount, amount);
      const cs = Math.cos(a), sn = Math.sin(a);
      const dx = b.dx * cs - b.dy * sn, dy = b.dx * sn + b.dy * cs;
      b.dx = dx; b.dy = dy;
    }

    // Keep the ball from skimming almost horizontally (or bouncing dead straight up and down).
    fixAngle(b) {
      const len = Math.hypot(b.dx, b.dy) || 1;
      b.dx /= len; b.dy /= len;
      if (Math.abs(b.dy) < C.MIN_VERTICAL) {
        const sy = b.dy < 0 ? -1 : 1;
        b.dy = sy * C.MIN_VERTICAL;
        b.dx = (b.dx < 0 ? -1 : 1) * Math.sqrt(1 - C.MIN_VERTICAL * C.MIN_VERTICAL);
      }
      if (Math.abs(b.dx) < 0.04) {
        b.dx = (b.dx < 0 ? -1 : 1) * 0.08;
        b.dy = (b.dy < 0 ? -1 : 1) * Math.sqrt(1 - 0.0064);
      }
    }

    // Circle vs. brick grid. Faces shared with a neighbouring brick are ignored, so the ball never
    // catches on the seam between two bricks.
    contact(b, row, col) {
      const bx = col * C.BW, by = this.top + row * C.BH;
      const r = b.r;
      const cx = U.clamp(b.x, bx, bx + C.BW), cy = U.clamp(b.y, by, by + C.BH);
      let nx = b.x - cx, ny = b.y - cy;
      const d2 = nx * nx + ny * ny;
      if (d2 >= r * r) return null;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        nx /= d; ny /= d;
        let depth = r - d;
        const outX = b.x < bx || b.x > bx + C.BW, outY = b.y < by || b.y > by + C.BH;
        if (outX && outY) {
          const sx = b.x < bx ? -1 : 1, sy = b.y < by ? -1 : 1;
          const side = !!this.brickAt(row, col + sx), vert = !!this.brickAt(row + sy, col);
          if (side && !vert) { nx = 0; ny = sy; depth = r - Math.abs(b.y - cy); }
          else if (vert && !side) { nx = sx; ny = 0; depth = r - Math.abs(b.x - cx); }
        }
        return { nx, ny, depth };
      }
      // centre inside the brick (rare with small sub-steps): leave through the nearest open face
      const cand = [];
      if (!this.brickAt(row, col - 1)) cand.push([b.x - bx, -1, 0]);
      if (!this.brickAt(row, col + 1)) cand.push([bx + C.BW - b.x, 1, 0]);
      if (!this.brickAt(row - 1, col)) cand.push([b.y - by, 0, -1]);
      if (!this.brickAt(row + 1, col)) cand.push([by + C.BH - b.y, 0, 1]);
      if (!cand.length) return { nx: -b.dx, ny: -b.dy, depth: r };
      cand.sort((a, z) => a[0] - z[0]);
      return { nx: cand[0][1], ny: cand[0][2], depth: cand[0][0] + r };
    }

    collideBricks(b) {
      const top = this.top, r = b.r;
      const r0 = Math.max(0, Math.floor((b.y - r - top) / C.BH));
      const r1 = Math.min(C.ROWS - 1, Math.floor((b.y + r - top) / C.BH));
      if (r1 < r0) return;
      const c0 = Math.max(0, Math.floor((b.x - r) / C.BW));
      const c1 = Math.min(C.COLS - 1, Math.floor((b.x + r) / C.BW));
      let hits = null;
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          if (!this.bricks[row][col]) continue;
          const k = this.contact(b, row, col);
          if (k) (hits || (hits = [])).push({ row, col, nx: k.nx, ny: k.ny, depth: k.depth });
        }
      }
      if (!hits) return;

      if (this.eff.thru) {
        for (const k of hits) this.hitBrick(k.row, k.col, 'thru');
        return;
      }
      hits.sort((a, z) => z.depth - a.depth);
      const d0x = b.dx, d0y = b.dy;
      const used = [];
      let bounced = false;
      for (let i = 0; i < hits.length; i++) {
        const k = hits[i];
        if (!this.bricks[k.row][k.col]) continue;
        const cur = i === 0 ? k : this.contact(b, k.row, k.col);
        const movingIn = d0x * k.nx + d0y * k.ny < 0;
        if (cur) {
          b.x += cur.nx * (cur.depth + 0.01);
          b.y += cur.ny * (cur.depth + 0.01);
          const dot = b.dx * cur.nx + b.dy * cur.ny;
          if (dot < 0 && !used.some((n) => n[0] * cur.nx + n[1] * cur.ny > 0.9)) {
            b.dx -= 2 * dot * cur.nx;
            b.dy -= 2 * dot * cur.ny;
            used.push([cur.nx, cur.ny]);
            bounced = true;
          }
        }
        if (movingIn) this.hitBrick(k.row, k.col, this.eff.fireball ? 'fireball' : 'ball');
        if (this.state !== 'play') return;
      }
      if (bounced) {
        if (this.sinceBreak > 12) this.jitter(b, 0.05);
        this.fixAngle(b);
      }
    }

    collidePaddle(b) {
      const p = this.paddle;
      if (!p.visible) return;
      const top = C.PADDLE_TOP, ph = C.PADDLE_H, half = p.w / 2;
      if (b.y + b.r < top || b.y > top + ph * 0.6) return;
      if (b.x < p.x - half - b.r || b.x > p.x + half + b.r) return;
      const ex = U.clamp(b.x, p.x - half + ph / 2, p.x + half - ph / 2);
      if (Math.hypot(b.x - ex, b.y - (top + ph / 2)) > b.r + ph / 2) return;
      const off = U.clamp((b.x - p.x) / (half + b.r * 0.5), -1, 1);
      let ang = off * C.MAX_BOUNCE;
      // never perfectly vertical: a ball bouncing straight up and down an empty column would loop forever
      if (Math.abs(ang) < 0.05) ang = (ang < 0 || (ang === 0 && Math.random() < 0.5) ? -1 : 1) * 0.05;
      b.dx = Math.sin(ang);
      b.dy = -Math.cos(ang);
      b.y = top - b.r;
      this.combo = 0;
      p.flash = 0.35;
      if (this.demo || this.autopilot) this.aiBall = null;   // aim the next return differently
      if (this.eff.grab) {
        b.stuck = true;
        b.offset = U.clamp(b.x - p.x, -half + 4, half - 4);
        this.sound('grab');
      } else {
        this.sound('paddle', off);
      }
      if (this.eff.falling) this.dropBricks();
    }

    dropBricks() {
      let maxRow = -1;
      for (let r = C.ROWS - 1; r >= 0 && maxRow < 0; r--) if (this.bricks[r].some(Boolean)) maxRow = r;
      if (maxRow < 0) return;
      const bottom = this.top + (maxRow + 1) * C.BH;
      const room = C.PADDLE_TOP - 70 - bottom;
      if (room <= 0) return;
      this.gridY += Math.min(C.BH / 2, room);
    }

    // ------------------------------------------------------------------ bricks
    hitBrick(row, col, cause) {
      const br = this.bricks[row][col];
      if (!br) return;
      if (br.type !== 'solid') { this.sinceBreak = 0; this.loneTime = 0; }
      if (cause === 'fireball') {
        this.destroyBrick(row, col, 'fireball');
        this.pending.push({ row, col, t: 0, blast: true, size: 0.9 });
        return;
      }
      if (cause === 'thru' || cause === 'explosion' || cause === 'lightning') {
        this.destroyBrick(row, col, cause);
        return;
      }
      const [x, y] = this.brickCenter(row, col);
      switch (br.type) {
        case 'normal':
        case 'explode':
          this.destroyBrick(row, col, cause);
          break;
        case 'multi':
          br.hits--;
          if (br.hits <= 0) this.destroyBrick(row, col, cause);
          else {
            br.flash = 1;
            this.addPoints(P.multiHit);
            this.sound('multi');
            this.fx.hitSpark(x, y, '#dfe8ff', 7);
          }
          break;
        case 'hidden':
          if (!br.revealed) {
            br.revealed = true;
            br.flash = 1;
            this.addPoints(P.hiddenReveal);
            this.sound('reveal');
            this.fx.sparkle(x, y, '#ffb3e6', 12, 160);
          } else this.destroyBrick(row, col, cause);
          break;
        case 'solid':
          br.flash = 1;
          this.sound('solid');
          this.fx.hitSpark(x, y, '#ffe9a0', 6);
          break;
      }
    }

    destroyBrick(row, col, cause) {
      const br = this.bricks[row][col];
      if (!br) return;
      this.bricks[row][col] = null;
      const [x, y] = this.brickCenter(row, col);
      const pts = { normal: P.normal, multi: P.multi, explode: P.explode, hidden: P.hidden, solid: P.solid }[br.type];
      this.addPoints(pts);
      if (br.type !== 'solid') this.breakable--;
      this.sinceBreak = 0;
      const color = br.type === 'normal' ? OX.COLORS[br.color] : BRICK_FX_COLOR[br.type];
      this.fx.brickBreak(x, y, color, cause === 'explosion' ? 0.6 : 1);
      if (cause !== 'explosion') {
        this.sound('brick', this.combo);
        this.combo++;
      }
      if (br.type === 'explode') this.pending.push({ row, col, t: 0.07, blast: true, size: 1 });
      this.maybeDrop(row, col, br, cause);
      if (this.breakable <= 0 && (this.state === 'play' || this.state === 'serve')) this.levelCleared();
    }

    // Pending blasts: exploding bricks go off a beat after they break, so chain reactions ripple outward.
    updatePending(dt) {
      if (!this.pending.length) return;
      const ready = [];
      for (const e of this.pending) { e.t -= dt; if (e.t <= 0) ready.push(e); }
      if (!ready.length) return;
      this.pending = this.pending.filter((e) => e.t > 0);
      for (const e of ready) {
        if (this.state !== 'play') return;
        if (e.detonate) {
          const br = this.bricks[e.row][e.col];
          if (br && br.type === 'explode') this.destroyBrick(e.row, e.col, 'explosion');
          continue;
        }
        const [x, y] = this.brickCenter(e.row, e.col);
        this.fx.explosion(x, y, e.size);
        this.sound('explode', e.size);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            if (this.brickAt(e.row + dr, e.col + dc)) this.destroyBrick(e.row + dr, e.col + dc, 'explosion');
            if (this.state !== 'play') return;
          }
        }
      }
    }

    updateBricks(dt) {
      for (const row of this.bricks) {
        for (const b of row) if (b && b.flash > 0) b.flash = Math.max(0, b.flash - dt * 4);
      }
    }

    // Two safety nets from the original DX-Ball: lightning takes out a lone last brick that has been
    // ignored for too long, and unbreakable bricks give way if the ball gets stuck in a loop.
    updateStall(dt) {
      this.sinceBreak += dt;
      if (this.breakable === 1) {
        this.loneTime += dt;
        if (this.loneTime > C.LONE_BRICK_WARN) {
          const pos = this.findBrick((b) => b.type !== 'solid');
          if (!pos) return;
          const [x, y] = this.brickCenter(pos[0], pos[1]);
          const k = (this.loneTime - C.LONE_BRICK_WARN) / (C.LONE_BRICK_STRIKE - C.LONE_BRICK_WARN);
          this.loneSpark -= dt;
          if (this.loneSpark <= 0) {
            this.loneSpark = 0.18 - 0.12 * k;
            const a = U.rand(0, Math.PI * 2);
            this.fx.lightning(x, y, x + Math.cos(a) * U.rand(20, 40), y + Math.sin(a) * U.rand(12, 30), '#9fd0ff', 0.15);
            this.sound('crackle', k);
          }
          if (this.loneTime >= C.LONE_BRICK_STRIKE) {
            this.fx.lightning(x + U.rand(-60, 60), 0, x, y, '#cfe6ff', 0.5);
            this.fx.lightning(x + U.rand(-90, 90), 0, x, y, '#9fd0ff', 0.4);
            this.fx.kick(8);
            this.sound('lightning');
            this.loneTime = 0;
            this.destroyBrick(pos[0], pos[1], 'lightning');
          }
        }
      } else {
        this.loneTime = 0;
      }
      if (this.sinceBreak > C.STUCK_LOOP_TIME) {
        this.sinceBreak = 0;
        if (this.zapBricks(true)) {
          this.fx.text(C.W / 2, C.H * 0.55, OX.t('game.zapped'), '#9fd0ff', 22, 2.4);
        }
      }
    }

    findBrick(pred) {
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
        const b = this.bricks[r][c];
        if (b && pred(b)) return [r, c];
      }
      return null;
    }

    zapBricks(onlySolid) {
      const targets = [];
      for (let r = 0; r < C.ROWS; r++) {
        for (let c = 0; c < C.COLS; c++) {
          const b = this.bricks[r][c];
          if (!b) continue;
          if (b.type === 'solid') {
            const nb = OX.levels.makeBrick('y');
            nb.flash = 1;
            this.bricks[r][c] = nb;
            this.breakable++;
            targets.push([r, c]);
          } else if (!onlySolid && b.type === 'hidden' && !b.revealed) {
            b.revealed = true; b.flash = 1; targets.push([r, c]);
          } else if (!onlySolid && b.type === 'multi' && b.hits > 1) {
            b.hits = 1; b.flash = 1; targets.push([r, c]);
          }
        }
      }
      if (!targets.length) return false;
      for (let i = 0; i < targets.length && i < 14; i++) {
        const [r, c] = targets[Math.floor(i * targets.length / Math.min(14, targets.length))];
        const [x, y] = this.brickCenter(r, c);
        this.fx.lightning(x + U.rand(-80, 80), 0, x, y, '#a8d4ff', 0.45);
      }
      this.fx.kick(4);
      this.sound('zap');
      return true;
    }

    // ------------------------------------------------------------------ power-ups
    maybeDrop(row, col, br, cause) {
      if (cause === 'lightning' || this.state !== 'play') return;
      if (this.capsules.length >= C.MAX_CAPSULES) return;
      let chance = DROP_CHANCE[br.type] || 0.1;
      if (cause === 'explosion') chance *= 0.35;
      if (Math.random() > chance) return;
      const type = this.pickPowerup();
      if (!type) return;
      const [x, y] = this.brickCenter(row, col);
      this.capsules.push({ type, x, y, vy: C.CAPSULE_SPEED + Math.min(this.index, 20) * 2, t: Math.random() * 6 });
    }

    pickPowerup() {
      let hasExplode = false, hasSpecial = false;
      for (const row of this.bricks) {
        for (const b of row) {
          if (!b) continue;
          if (b.type === 'explode') hasExplode = true;
          if (b.type === 'solid' || (b.type === 'hidden' && !b.revealed) || (b.type === 'multi' && b.hits > 1)) hasSpecial = true;
        }
      }
      const pool = [];
      let total = 0;
      for (const id of OX.POWERUP_ORDER) {
        const def = OX.POWERUPS[id];
        if (def.needs === 'explode' && !hasExplode) continue;
        if (def.needs === 'special' && !hasSpecial) continue;
        if (id === 'split' && this.balls.length >= C.MAX_BALLS) continue;
        if (id === 'life' && this.lives >= C.MAX_LIVES) continue;
        // Level Warp only turns up in the second half of a level, so it skips the tail, not the picture
        if (id === 'warp' && this.breakable > this.startBreakable * 0.5) continue;
        if (this.demo && id === 'kill') continue;
        pool.push([id, def.weight]);
        total += def.weight;
      }
      let x = Math.random() * total;
      for (const [id, w] of pool) { if ((x -= w) <= 0) return id; }
      return pool.length ? pool[pool.length - 1][0] : null;
    }

    updateCapsules(dt) {
      const p = this.paddle;
      const hw = C.CAPSULE_W / 2, hh = C.CAPSULE_H / 2;
      for (let i = this.capsules.length - 1; i >= 0; i--) {
        const cap = this.capsules[i];
        cap.y += cap.vy * dt;
        cap.t += dt;
        if (p.visible && cap.y + hh >= C.PADDLE_TOP && cap.y - hh <= C.PADDLE_TOP + C.PADDLE_H &&
            Math.abs(cap.x - p.x) <= p.w / 2 + hw - 4) {
          this.capsules.splice(i, 1);
          this.collect(cap);
          if (this.state !== 'play') return;
        } else if (cap.y - hh > C.H) {
          this.capsules.splice(i, 1);
        }
      }
    }

    collect(cap) {
      const def = OX.POWERUPS[cap.type];
      const p = this.paddle;
      if (!this.demo) this.score += P.capsule;
      const color = OX.gfx.KIND[def.kind].light;
      this.fx.text(U.clamp(p.x, 110, C.W - 110), C.PADDLE_TOP - 26, OX.t('pu.' + cap.type), color, 19, 1.4);
      this.fx.sparkle(cap.x, C.PADDLE_TOP, OX.gfx.KIND[def.kind].glow, 14, 180);
      this.sound(def.kind);
      this.apply(cap.type);
      this.onEvent('powerup', { type: cap.type });
    }

    apply(type) {
      const p = this.paddle, e = this.eff;
      switch (type) {
        case 'expand': p.size = Math.min(C.PADDLE_SIZES.length - 1, p.size + 1); this.sound('grow'); break;
        case 'shrink': p.size = Math.max(1, p.size - 1); this.sound('shrink'); break;
        case 'supershrink': p.size = 0; this.sound('shrink'); break;
        case 'split': this.split(); break;
        case 'fireball': e.fireball = true; break;
        case 'thru': e.thru = true; break;
        case 'grab': e.grab = true; break;
        case 'guns': e.guns = true; break;
        case 'setoff': {
          let i = 0;
          for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
            const b = this.bricks[r][c];
            if (b && b.type === 'explode') this.pending.push({ row: r, col: c, t: 0.05 + (i++ % 8) * 0.04 + Math.random() * 0.1, detonate: true });
          }
          break;
        }
        case 'multiply': {
          const conv = [];
          for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
            const b = this.bricks[r][c];
            if (!b || b.type !== 'explode') continue;
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const n = this.brickAt(r + dr, c + dc);
              if (n && (n.type === 'normal' || n.type === 'multi')) conv.push([r + dr, c + dc]);
            }
          }
          for (const [r, c] of conv) {
            const nb = OX.levels.makeBrick('X');
            nb.flash = 1;
            this.bricks[r][c] = nb;
            const [x, y] = this.brickCenter(r, c);
            this.fx.hitSpark(x, y, '#ffb35c', 6);
          }
          break;
        }
        case 'zap': this.zapBricks(false); break;
        case 'warp':
          this.sound('warp');
          this.setState('warping');
          this.capsules = [];
          this.bullets = [];
          this.pending = [];
          for (const b of this.balls) this.fx.sparkle(b.x, b.y, '#c9b3ff', 16, 240);
          this.balls = [];
          break;
        case 'life':
          this.lives = Math.min(C.MAX_LIVES, this.lives + 1);
          this.sound('extraLife');
          break;
        case 'kill':
          this.loseLife();
          break;
        case 'fast': this.speed = C.SPEED_MAX; break;
        case 'slow': this.speed = C.SPEED_MIN; break;
        case 'fall': e.falling = true; break;
        case 'smallball':
          e.smallBall = true;
          for (const b of this.balls) {
            b.r = C.BALL_R_SMALL;
            if (b.stuck) b.y = C.PADDLE_TOP - b.r;
          }
          break;
      }
    }

    split() {
      const add = [];
      for (const b of this.balls) {
        for (const da of [-0.42, 0.42]) {
          if (this.balls.length + add.length >= C.MAX_BALLS) break;
          const nb = { x: b.x, y: b.y, dx: b.dx, dy: b.dy, r: b.r, stuck: b.stuck, offset: b.offset, trail: [], dead: false };
          if (b.stuck) {
            nb.offset = b.offset + (da < 0 ? -16 : 16);
          } else {
            const cs = Math.cos(da), sn = Math.sin(da);
            nb.dx = b.dx * cs - b.dy * sn;
            nb.dy = b.dx * sn + b.dy * cs;
            this.fixAngle(nb);
          }
          add.push(nb);
        }
      }
      this.balls.push(...add);
    }

    updateBullets(dt) {
      const top = this.top;
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bl = this.bullets[i];
        const y0 = bl.y;
        bl.y -= C.BULLET_SPEED * dt;
        let gone = bl.y < -12;
        const col = Math.floor(bl.x / C.BW);
        if (!gone && col >= 0 && col < C.COLS) {
          // sweep every row the bullet's tip passed this frame, nearest first
          const rowFrom = Math.floor((y0 - top) / C.BH), rowTo = Math.floor((bl.y - top) / C.BH);
          for (let row = rowFrom; row >= rowTo; row--) {
            if (!this.brickAt(row, col)) continue;
            if (bl.thru) {
              this.hitBrick(row, col, 'thru');
            } else {
              this.fx.hitSpark(bl.x, top + (row + 1) * C.BH, '#fff2b0', 5);
              this.hitBrick(row, col, 'bullet');
              gone = true;
            }
            if (this.state !== 'play') return;
            if (gone) break;
          }
        }
        if (gone) this.bullets.splice(i, 1);
      }
    }

    // ------------------------------------------------------------------ AI (demo mode & tests)
    aiTarget() {
      const p = this.paddle;
      let best = null, bestT = Infinity;
      for (const b of this.balls) {
        if (b.stuck || b.dy <= 0) continue;
        const t = (C.PADDLE_TOP - b.r - b.y) / (b.dy * this.speed);
        if (t < bestT) { bestT = t; best = b; }
      }
      if (best) {
        let x = best.x + best.dx * this.speed * Math.max(0, bestT);
        const lo = best.r, hi = C.W - best.r, span = hi - lo;
        const m = (((x - lo) % (2 * span)) + 2 * span) % (2 * span);
        x = lo + (m > span ? 2 * span - m : m);
        if (best !== this.aiBall) {
          this.aiBall = best;
          this.aiOffset = U.rand(-0.6, 0.6) * p.w / 2;
        }
        return x - this.aiOffset;
      }
      const cap = this.capsules.find((c) => OX.POWERUPS[c.type].kind !== 'bad');
      if (cap) return cap.x;
      const free = this.balls.find((b) => !b.stuck);
      return free ? free.x : p.x;
    }

    // ------------------------------------------------------------------ drawing
    render(ctx, s, opts = {}) {
      const settings = OX.store.settings.get();
      ctx.setTransform(s, 0, 0, s, 0, 0);
      if (!opts.noHud) this.drawHud(ctx, s);
      ctx.save();
      ctx.translate(0, opts.noHud ? 0 : C.HUD);
      ctx.beginPath();
      ctx.rect(0, 0, C.W, C.H);
      ctx.clip();
      ctx.drawImage(OX.gfx.background(this.level.bg.style, this.level.bg.hue, s), 0, 0, C.W, C.H);
      if (settings.shake && this.fx.shake > 0 && !U.reducedMotion()) {
        ctx.translate(U.rand(-1, 1) * this.fx.shake * 0.6, U.rand(-1, 1) * this.fx.shake * 0.6);
      }
      if (this.state === 'warping') {
        // the whole wall rushes upwards and fades as we warp to the next level
        const k = this.stateTime;
        ctx.save();
        ctx.translate(0, -k * k * 700);
        this.drawBricks(ctx, s, Math.max(0, 1 - k));
        ctx.restore();
      } else {
        this.drawBricks(ctx, s);
      }
      this.drawCapsules(ctx, s);
      this.drawBullets(ctx, s);
      if (this.paddle.visible && this.state !== 'victory' && this.state !== 'done') {
        OX.gfx.drawPaddle(ctx, this.paddle.x, C.PADDLE_TOP, this.paddle.w, C.PADDLE_H, {
          guns: this.eff.guns, grab: this.eff.grab, flash: this.paddle.flash, t: this.time, recoil: this.paddle.recoil,
        });
      }
      this.drawBalls(ctx, s);
      this.fx.render(ctx);
      if (!opts.noText) this.drawMessages(ctx);
      ctx.restore();
    }

    drawBricks(ctx, s, alpha = 1) {
      const top = this.top;
      const t = this.time;
      let glowList = null;
      ctx.globalAlpha = alpha;
      for (let r = 0; r < C.ROWS; r++) {
        const y = top + r * C.BH;
        for (let c = 0; c < C.COLS; c++) {
          const b = this.bricks[r][c];
          if (!b) continue;
          const x = c * C.BW;
          let spr;
          switch (b.type) {
            case 'normal': spr = OX.gfx.brickSprite(b.color, s); break;
            case 'multi': spr = OX.gfx.brickSprite(b.code, s, b.hits); break;
            case 'explode': spr = OX.gfx.brickSprite('X', s); (glowList || (glowList = [])).push(b, x, y); break;
            case 'hidden': if (!b.revealed) continue; spr = OX.gfx.brickSprite('H', s); break;
            case 'solid': spr = OX.gfx.brickSprite('#', s); break;
          }
          ctx.drawImage(spr, x, y, C.BW, C.BH);
          if (b.type === 'solid') {
            const cyc = (t * 0.45 + b.phase + c * 0.035 + r * 0.02) % 3;
            if (cyc < 0.6) ctx.drawImage(OX.gfx.sheenSprite(Math.floor(cyc / 0.6 * 7), s), x, y, C.BW, C.BH);
          }
          if (b.flash > 0) {
            ctx.globalAlpha = alpha * b.flash * 0.85;
            ctx.drawImage(OX.gfx.flashSprite(s), x, y, C.BW, C.BH);
            ctx.globalAlpha = alpha;
          }
        }
      }
      if (glowList) {
        ctx.globalCompositeOperation = 'lighter';
        const g = OX.gfx.glowSprite('#ff8a2a', s, 64, 40);
        for (let i = 0; i < glowList.length; i += 3) {
          const b = glowList[i];
          ctx.globalAlpha = alpha * (0.16 + 0.14 * Math.sin(t * 5 + b.phase));
          ctx.drawImage(g, glowList[i + 1] - 12, glowList[i + 2] - 10, 64, 40);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    }

    drawCapsules(ctx, s) {
      if (!this.capsules.length) return;
      const w = C.CAPSULE_W, h = C.CAPSULE_H;
      ctx.globalCompositeOperation = 'lighter';
      for (const cap of this.capsules) {
        const k = OX.gfx.KIND[OX.POWERUPS[cap.type].kind];
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(cap.t * 6);
        ctx.drawImage(OX.gfx.softGlowSprite(k.glow, 34, s), cap.x - 34, cap.y - 34, 68, 68);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      for (const cap of this.capsules) {
        ctx.drawImage(OX.gfx.capsuleSprite(cap.type, s), cap.x - w / 2, cap.y - h / 2, w, h);
      }
    }

    drawBullets(ctx, s) {
      if (!this.bullets.length) return;
      ctx.globalCompositeOperation = 'lighter';
      for (const b of this.bullets) {
        const color = b.thru ? '#c9a2ff' : '#ffcf6a';
        ctx.drawImage(OX.gfx.softGlowSprite(color, 14, s), b.x - 14, b.y - 14, 28, 28);
        ctx.fillStyle = b.thru ? '#f1e6ff' : '#fff6d8';
        OX.gfx.rr(ctx, b.x - 1.8, b.y - 7, 3.6, 12, 1.8);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    drawBalls(ctx, s) {
      const e = this.eff;
      const kind = e.fireball && e.thru ? 'both' : e.fireball ? 'fire' : e.thru ? 'thru' : 'normal';
      const glowColor = { normal: '#9fd8ff', fire: '#ff8a2a', thru: '#b48cff', both: '#ff6ac0' }[kind];
      ctx.globalCompositeOperation = 'lighter';
      for (const b of this.balls) {
        const tr = b.trail;
        const n = tr.length / 2;
        for (let i = 0; i < n; i++) {
          const k = (i + 1) / (n + 1);
          ctx.globalAlpha = k * 0.35;
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.arc(tr[i * 2], tr[i * 2 + 1], b.r * (0.35 + k * 0.55), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.9;
        const gr = b.r * 3.4;
        ctx.drawImage(OX.gfx.softGlowSprite(glowColor, Math.round(gr), s), b.x - gr, b.y - gr, gr * 2, gr * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      for (const b of this.balls) {
        const spr = OX.gfx.ballSprite(kind, b.r, s);
        const size = b.r * 2 + 2;
        ctx.drawImage(spr, b.x - size / 2, b.y - size / 2, size, size);
      }
    }

    text(ctx, str, x, y, size, color, weight = 700, font = OX.gfx.FONT_DISPLAY, glow) {
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      if (glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = size * 0.6;
      }
      ctx.lineWidth = Math.max(3, size * 0.16);
      ctx.strokeStyle = 'rgba(4,6,14,0.8)';
      ctx.strokeText(str, x, y);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    }

    drawMessages(ctx) {
      const cx = C.W / 2;
      const T = OX.t;
      if (this.intro > 0 && !this.demo) {
        const a = Math.min(1, this.intro / 0.5, (2.8 - this.intro) / 0.35);
        ctx.globalAlpha = Math.max(0, a);
        const label = this.mode === 'campaign'
          ? T('common.levelN', { n: this.index + 1 }) + ' / ' + this.levels.length
          : this.mode === 'test' ? T('hud.test') : T('hud.practice');
        this.text(ctx, label.toUpperCase(), cx, C.H * 0.6 - 30, 18, '#9fd0ff', 600, OX.gfx.FONT_DISPLAY);
        this.text(ctx, OX.i18n.levelName(this.level), cx, C.H * 0.6 + 6, 40, '#ffffff', 800, OX.gfx.FONT_DISPLAY, 'rgba(90,170,255,0.8)');
        ctx.globalAlpha = 1;
      }
      if (this.state === 'serve' && !this.demo && this.breakable > 0) {
        const a = 0.55 + 0.45 * Math.sin(this.time * 4);
        ctx.globalAlpha = a;
        this.text(ctx, T(this.input.touch ? 'game.launchTouch' : 'game.launch'), cx, C.PADDLE_TOP - 70, 17, '#e6efff', 600, OX.gfx.FONT_BODY);
        ctx.globalAlpha = 1;
      }
      if (this.state === 'cleared' && !this.demo) {
        const k = Math.min(1, this.stateTime / 0.3);
        ctx.globalAlpha = k;
        this.text(ctx, T('game.levelComplete'), cx, C.H * 0.45, 46 + (1 - k) * 20, '#ffffff', 800, OX.gfx.FONT_DISPLAY, 'rgba(120,200,255,0.9)');
        if (this.bonus) this.text(ctx, T('game.levelBonus', { n: OX.i18n.num(this.bonus) }), cx, C.H * 0.45 + 46, 20, '#ffe38a', 700);
        ctx.globalAlpha = 1;
      }
      if (this.state === 'warping' && !this.demo) {
        this.text(ctx, T('game.levelWarp'), cx, C.H * 0.45, 44, '#e1d2ff', 800, OX.gfx.FONT_DISPLAY, 'rgba(170,130,255,0.9)');
      }
      if (this.state === 'over' && !this.overSent) {
        const k = Math.min(1, this.stateTime / 0.6);
        ctx.globalAlpha = k;
        this.text(ctx, T('game.gameOver').toUpperCase(), cx, C.H * 0.45, 58, '#ff8f7a', 800, OX.gfx.FONT_DISPLAY, 'rgba(255,80,60,0.8)');
        ctx.globalAlpha = 1;
      }
      if (this.state === 'victory' && !this.overSent) {
        const k = Math.min(1, this.stateTime / 0.6);
        ctx.globalAlpha = k;
        this.text(ctx, T('game.victory'), cx, C.H * 0.42, 46, '#ffffff', 800, OX.gfx.FONT_DISPLAY, 'rgba(255,210,90,0.9)');
        this.text(ctx, T('game.lifeBonus', { n: OX.i18n.num(this.lifeBonus || 0) }), cx, C.H * 0.42 + 50, 22, '#ffe38a', 700);
        ctx.globalAlpha = 1;
      }
    }

    drawHud(ctx, s) {
      const H = C.HUD, W = C.W;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#141b2e');
      g.addColorStop(1, '#0a0f1d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const lg = ctx.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, 'rgba(95,212,255,0)');
      lg.addColorStop(0.5, 'rgba(95,212,255,0.55)');
      lg.addColorStop(1, 'rgba(95,212,255,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, H - 1.5, W, 1.5);

      const T = OX.t;
      ctx.textBaseline = 'middle';
      if (this.demo) {
        ctx.textAlign = 'center';
        ctx.font = `700 17px ${OX.gfx.FONT_DISPLAY}`;
        ctx.fillStyle = '#9fb0d6';
        ctx.fillText(OX.i18n.levelName(this.level), W / 2, H / 2);
        return;
      }
      // score (left)
      const scoreKey = this.score + OX.i18n.lang;
      if (this.scoreShown !== scoreKey) { this.scoreShown = scoreKey; this.scoreText = OX.i18n.num(this.score); }
      ctx.textAlign = 'left';
      ctx.font = `600 10.5px ${OX.gfx.FONT_BODY}`;
      ctx.fillStyle = '#7f8db0';
      ctx.fillText(T('hud.score').toUpperCase(), 16, 14);
      ctx.font = `700 22px ${OX.gfx.FONT_DISPLAY}`;
      ctx.fillStyle = '#f2f6ff';
      ctx.fillText(this.scoreText, 16, 32);
      const sw = ctx.measureText(this.scoreText).width;
      const m = this.multiplier();
      ctx.font = `600 12px ${OX.gfx.FONT_DISPLAY}`;
      ctx.fillStyle = m >= 1.5 ? '#ffd36a' : m < 0.95 ? '#8fa0bf' : '#9fd0ff';
      ctx.fillText('×' + m.toFixed(1), 24 + sw, 33);

      // level
      ctx.textAlign = 'center';
      const label = this.mode === 'campaign' ? T('hud.level').toUpperCase() + ' ' + (this.index + 1) + '/' + this.levels.length
        : (this.mode === 'test' ? T('hud.test') : T('hud.practice')).toUpperCase();
      ctx.font = `600 10.5px ${OX.gfx.FONT_BODY}`;
      ctx.fillStyle = '#7f8db0';
      ctx.fillText(label, W / 2, 14);
      ctx.font = `700 17px ${OX.gfx.FONT_DISPLAY}`;
      ctx.fillStyle = '#dfe8ff';
      let name = OX.i18n.levelName(this.level);
      if (ctx.measureText(name).width > 290) {
        while (name.length > 3 && ctx.measureText(name + '…').width > 290) name = name.slice(0, -1);
        name += '…';
      }
      ctx.fillText(name, W / 2, 32);

      // lives (right): up to four paddles, then a count
      ctx.textAlign = 'right';
      ctx.font = `600 10.5px ${OX.gfx.FONT_BODY}`;
      ctx.fillStyle = '#7f8db0';
      ctx.fillText(T('hud.lives').toUpperCase(), W - 16, 14);
      const icon = OX.gfx.lifeIcon(s);
      let x = W - 16;
      let shown = this.lives;
      if (this.lives > 4) {
        ctx.font = `700 15px ${OX.gfx.FONT_DISPLAY}`;
        ctx.fillStyle = '#f2f6ff';
        ctx.fillText('×' + this.lives, x, 32);
        x -= ctx.measureText('×' + this.lives).width + 5;
        shown = 1;
      }
      for (let i = 0; i < shown; i++) {
        x -= 26;
        ctx.drawImage(icon, x, 27, 26, 10);
        x -= 3;
      }
      // active power-ups, between the level name and the lives
      let ex = 648;
      for (const [key, pu] of EFFECT_ICONS) {
        if (!this.eff[key]) continue;
        ctx.drawImage(OX.gfx.capsuleSprite(pu, s), ex, 18, 26, 11.2);
        ex += 29;
      }
    }
  }

  OX.Game = Game;
})(window.OX = window.OX || {});

/* js/ui.js */
/* OX Ball — menus, screens and overlays (DOM). The playfield itself is drawn on the canvas by game.js. */
(function (OX) {
  'use strict';
  const U = OX.U, C = OX.C;
  const el = U.el;
  const t = (k, p) => OX.t(k, p);
  const dpr = () => Math.min(window.devicePixelRatio || 1, 3);

  const ui = {
    root: null,
    current: null,
    stack: [],
  };

  // ---------------------------------------------------------------- plumbing
  ui.init = function (root) {
    ui.root = root;
    document.addEventListener('keydown', (e) => {
      if (ui.modalOpen()) return;
      const cur = ui.current;
      if (!cur) return;
      if (cur.onKey && cur.onKey(e)) { e.preventDefault(); return; }
      if (e.key === 'Escape' && cur.back) { e.preventDefault(); cur.back(); return; }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && cur.nav) {
        const items = [...cur.node.querySelectorAll(cur.nav)].filter((n) => !n.disabled && n.offsetParent);
        const i = items.indexOf(document.activeElement);
        if (items.length) {
          e.preventDefault();
          const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
          items[i < 0 ? 0 : next].focus();
        }
      }
    });
    OX.i18n.onChange(() => ui.refresh());
  };

  ui.show = function (name, params = {}) {
    if (ui.current && ui.current.cleanup) ui.current.cleanup();
    ui.root.textContent = '';
    ui.current = null;
    document.body.dataset.screen = name || 'none';
    if (OX.app && OX.app.onScreenChange) OX.app.onScreenChange(name || null);
    if (!name) return;
    const built = SCREENS[name](params);
    built.name = name;
    built.params = params;
    ui.current = built;
    ui.root.appendChild(built.node);
    const focus = built.focus || built.node.querySelector('[autofocus]') || built.node.querySelector('button, input, select, textarea');
    if (focus && !params.noFocus) setTimeout(() => focus.focus({ preventScroll: true }), 0);
  };

  ui.hide = function () { ui.show(null); };

  ui.refresh = function () {
    if (!ui.current) return;
    const { name, params } = ui.current;
    const scroll = ui.root.querySelector('.screen__body');
    const top = scroll ? scroll.scrollTop : 0;
    if (ui.current.keepOnRefresh) { ui.current.keepOnRefresh(); return; }
    ui.show(name, Object.assign({}, params, { noFocus: true }));
    const again = ui.root.querySelector('.screen__body');
    if (again) again.scrollTop = top;
  };

  ui.is = (name) => !!ui.current && ui.current.name === name;

  // ---------------------------------------------------------------- modal, confirm, toast
  let modalLayer = null;
  ui.modalOpen = () => !!modalLayer;

  ui.modal = function (content, { onClose, labelledBy, wide } = {}) {
    ui.closeModal();
    const prevFocus = document.activeElement;
    const box = el('div', { class: 'modal' + (wide ? ' modal--wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': labelledBy || null }, content);
    modalLayer = el('div', { class: 'modal-layer' }, box);
    const close = (result) => {
      if (!modalLayer) return;
      modalLayer.remove();
      modalLayer = null;
      document.removeEventListener('keydown', onKey, true);
      if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
      if (onClose) onClose(result);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
      if (e.key === 'Tab') {
        const f = [...box.querySelectorAll('button, input, select, textarea, [tabindex]')].filter((n) => !n.disabled);
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    modalLayer.addEventListener('pointerdown', (e) => { if (e.target === modalLayer) close(false); });
    document.body.appendChild(modalLayer);
    const f = box.querySelector('[autofocus]') || box.querySelector('button, input, textarea');
    if (f) setTimeout(() => f.focus(), 0);
    ui._closeModal = close;
    return { close, box };
  };
  ui.closeModal = function () { if (modalLayer && ui._closeModal) ui._closeModal(false); };

  ui.confirm = function ({ message, ok, cancel, danger }) {
    return new Promise((resolve) => {
      let m;
      const okBtn = el('button', { class: 'btn ' + (danger ? 'btn--danger' : 'btn--primary'), onclick: () => m.close(true) }, ok || t('common.ok'));
      const content = el('div', { class: 'confirm' },
        el('p', { class: 'confirm__msg', id: 'confirm-msg' }, message),
        el('div', { class: 'row row--end' },
          el('button', { class: 'btn btn--ghost', onclick: () => m.close(false), autofocus: true }, cancel || t('common.cancel')),
          okBtn));
      m = ui.modal(content, { labelledBy: 'confirm-msg', onClose: (r) => resolve(!!r) });
    });
  };

  let toastTimer = null;
  ui.toast = function (msg) {
    const node = document.getElementById('toast');
    if (!node) return;
    node.textContent = msg;
    node.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('is-on'), 2600);
  };

  async function copyText(text, textarea) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        textarea.focus();
        textarea.select();
        return document.execCommand('copy');
      } catch (e2) { return false; }
    }
  }

  ui.exportDialog = function (levels) {
    const code = OX.levels.encode(levels);
    const ta = el('textarea', { class: 'code', id: 'export-code', readonly: true, rows: 6, spellcheck: 'false' });
    ta.value = code;
    const status = el('p', { class: 'hint', role: 'status' });
    const title = levels.length === 1 ? t('export.title') : t('export.titleAll');
    ui.modal(el('div', { class: 'dialog' },
      el('h2', { class: 'dialog__title', id: 'export-title' }, title),
      el('p', { class: 'dialog__text' }, t('export.text')),
      ta, status,
      el('div', { class: 'row row--end' },
        el('button', { class: 'btn btn--ghost', onclick: () => ui.closeModal() }, t('common.close')),
        el('button', {
          class: 'btn btn--primary', autofocus: true,
          onclick: async () => { status.textContent = (await copyText(code, ta)) ? t('export.copied') : t('export.copyFailed'); },
        }, t('export.copy')))), { labelledBy: 'export-title', wide: true });
    ta.addEventListener('focus', () => ta.select());
  };

  ui.importDialog = function (onDone) {
    const ta = el('textarea', { class: 'code', id: 'import-code', rows: 6, spellcheck: 'false', autofocus: true });
    const status = el('p', { class: 'hint hint--error', role: 'alert' });
    const doImport = () => {
      let list;
      try { list = OX.levels.decode(ta.value); } catch (e) { status.textContent = t('import.invalid'); return; }
      for (const l of list) OX.store.customLevels.save({ name: l.name, bg: l.bg, rows: l.rows });
      ui.closeModal();
      ui.toast(OX.i18n.tn('import.done', list.length));
      if (onDone) onDone();
    };
    ui.modal(el('div', { class: 'dialog' },
      el('h2', { class: 'dialog__title', id: 'import-title' }, t('import.title')),
      el('label', { class: 'dialog__text', for: 'import-code' }, t('import.text')),
      ta, status,
      el('div', { class: 'row row--end' },
        el('button', { class: 'btn btn--ghost', onclick: () => ui.closeModal() }, t('common.cancel')),
        el('button', { class: 'btn btn--primary', onclick: doImport }, t('import.import')))), { labelledBy: 'import-title', wide: true });
  };

  // ---------------------------------------------------------------- shared pieces
  const thumbCache = new Map();
  ui.thumb = function (level, cssW) {
    const key = level.id + '|' + cssW + '|' + dpr() + '|' + level.bg.style + level.bg.hue + '|' + level.rows.join('');
    let src = thumbCache.get(key);
    if (!src) {
      if (thumbCache.size > 120) thumbCache.clear();
      src = OX.gfx.thumbnail(level, cssW, dpr());
      thumbCache.set(key, src);
    }
    const c = OX.gfx.makeCanvas(src.width, src.height);
    c.getContext('2d').drawImage(src, 0, 0);
    c.className = 'thumb';
    c.setAttribute('aria-hidden', 'true');
    return c;
  };

  function badge(level) {
    return el('span', { class: 'badge ' + (level.builtin ? 'badge--builtin' : 'badge--custom') }, level.builtin ? t('common.builtin') : t('common.custom'));
  }

  function shell({ title, sub, back, actions, body, cls }) {
    const node = el('section', { class: 'screen ' + (cls || ''), 'aria-labelledby': 'screen-title' },
      el('header', { class: 'screen__head' },
        el('button', { class: 'btn btn--ghost btn--back', onclick: back }, el('span', { 'aria-hidden': 'true' }, '←'), ' ', t('common.back')),
        el('div', { class: 'screen__titles' },
          el('h1', { class: 'screen__title', id: 'screen-title' }, title),
          sub ? el('p', { class: 'screen__sub' }, sub) : null),
        el('div', { class: 'screen__actions' }, actions || [])),
      el('div', { class: 'screen__body' }, el('div', { class: 'screen__inner' }, body)));
    return node;
  }

  const toMenu = () => ui.show('menu');

  function langSwitch() {
    const cur = OX.i18n.lang;
    return el('div', { class: 'seg', role: 'group', 'aria-label': t('settings.language') },
      ...OX.i18n.SUPPORTED.map((code) => el('button', {
        class: 'seg__btn' + (code === cur ? ' is-on' : ''),
        'aria-pressed': code === cur ? 'true' : 'false',
        lang: code,
        title: t('lang.' + code),
        onclick: () => { OX.app.setLanguage(code); },
      }, code.toUpperCase())));
  }

  // ---------------------------------------------------------------- main menu
  function buildMenu() {
    const items = [
      ['menu.play', () => OX.app.startCampaign(), true],
      ['menu.levelSelect', () => ui.show('select')],
      ['menu.editor', () => ui.show('editorHome')],
      ['menu.playlist', () => ui.show('playlist')],
      ['menu.highscores', () => ui.show('scores')],
      ['menu.help', () => ui.show('help')],
      ['menu.settings', () => ui.show('settings')],
    ];
    const buttons = items.map(([key, fn, primary]) => el('button', { class: 'menu__item' + (primary ? ' menu__item--primary' : ''), onclick: fn }, t(key)));
    const top = OX.store.scores.list()[0];
    const count = OX.levels.playlistIds().length;
    const node = el('section', { class: 'screen screen--menu', 'aria-label': 'OX Ball' },
      el('div', { class: 'menu__corner' },
        langSwitch(),
        document.fullscreenEnabled ? el('button', { class: 'icon-btn', title: t('menu.fullscreen') + ' (F)', 'aria-label': t('menu.fullscreen'), onclick: () => OX.app.toggleFullscreen() },
          el('span', { 'aria-hidden': 'true', class: 'icon-fs' })) : null),
      el('div', { class: 'menu' },
        el('h1', { class: 'logo' }, el('span', { class: 'logo__ox' }, 'OX'), el('span', { class: 'logo__ball' }, 'BALL')),
        el('p', { class: 'menu__tagline' }, t('app.tagline')),
        el('nav', { class: 'menu__list' }, buttons),
        el('p', { class: 'menu__meta' },
          OX.i18n.tn('menu.levelsInGame', count),
          top ? el('span', { class: 'menu__top' }, ' · ', t('menu.topScore') + ': ', el('b', null, OX.i18n.num(top.score)), ' — ', top.name) : null)),
      el('footer', { class: 'menu__foot' },
        el('p', { class: 'menu__hint' }, t('menu.hint')),
        el('p', { class: 'menu__credit' }, t('app.credit'))));
    return { node, focus: buttons[0], nav: '.menu__item' };
  }

  // ---------------------------------------------------------------- level select
  function levelCard(level, opts) {
    const best = OX.store.best.get(level.id);
    return el('button', { class: 'card', onclick: opts.onclick, 'aria-label': (opts.number ? '#' + opts.number + ' ' : '') + OX.i18n.levelName(level) },
      el('div', { class: 'card__thumb' }, ui.thumb(level, 208), opts.number ? el('span', { class: 'card__num' }, opts.number) : null),
      el('div', { class: 'card__body' },
        el('span', { class: 'card__name' }, OX.i18n.levelName(level)),
        el('span', { class: 'card__meta' }, badge(level), best ? el('span', { class: 'card__best' }, t('select.best', { score: OX.i18n.num(best) })) : null)));
  }

  function buildSelect() {
    const inList = OX.levels.playlist();
    const ids = new Set(inList.map((l) => l.id));
    const others = OX.levels.all().filter((l) => !ids.has(l.id));
    const order = inList.concat(others);
    const play = (level) => OX.app.startPractice(level.id, order.map((l) => l.id));
    const body = [
      el('h2', { class: 'section-title' }, t('select.inPlaylist')),
      el('div', { class: 'cards' }, inList.map((l, i) => levelCard(l, { number: i + 1, onclick: () => play(l) }))),
    ];
    if (others.length) {
      body.push(el('h2', { class: 'section-title' }, t('select.others')));
      body.push(el('div', { class: 'cards' }, others.map((l) => levelCard(l, { onclick: () => play(l) }))));
    }
    const node = shell({ title: t('select.title'), sub: t('select.subtitle'), back: toMenu, body });
    return { node, back: toMenu, focus: node.querySelector('.card') };
  }

  // ---------------------------------------------------------------- playthrough order
  function buildPlaylist(params) {
    let ids = OX.levels.playlistIds();
    const byId = new Map(OX.levels.all().map((l) => [l.id, l]));
    const list = el('ol', { class: 'plist', 'aria-label': t('playlist.current') });
    const avail = el('ul', { class: 'plist plist--avail', 'aria-label': t('playlist.available') });
    const count = el('span', { class: 'col__count' });
    const save = () => { OX.levels.setPlaylist(ids); };

    const render = (focusId, focusSel) => {
      list.textContent = '';
      avail.textContent = '';
      count.textContent = OX.i18n.tn('playlist.count', ids.length);
      ids.forEach((id, i) => {
        const lv = byId.get(id);
        const row = el('li', { class: 'prow', 'data-id': id },
          el('span', { class: 'prow__handle', title: t('playlist.drag'), 'aria-hidden': 'true' }),
          el('span', { class: 'prow__num' }, String(i + 1)),
          ui.thumb(lv, 72),
          el('span', { class: 'prow__name' }, OX.i18n.levelName(lv), badge(lv)),
          el('span', { class: 'prow__btns' },
            el('button', { class: 'icon-btn', 'data-act': 'up', title: t('playlist.up'), 'aria-label': t('playlist.up') + ': ' + OX.i18n.levelName(lv), disabled: i === 0, onclick: () => move(id, -1) }, '↑'),
            el('button', { class: 'icon-btn', 'data-act': 'down', title: t('playlist.down'), 'aria-label': t('playlist.down') + ': ' + OX.i18n.levelName(lv), disabled: i === ids.length - 1, onclick: () => move(id, 1) }, '↓'),
            el('button', { class: 'icon-btn icon-btn--danger', 'data-act': 'remove', title: t('playlist.remove'), 'aria-label': t('playlist.remove') + ': ' + OX.i18n.levelName(lv), onclick: () => remove(id) }, '✕')));
        list.appendChild(row);
      });
      const rest = OX.levels.all().filter((l) => !ids.includes(l.id));
      if (!rest.length) avail.appendChild(el('li', { class: 'empty' }, t('playlist.allAdded')));
      for (const lv of rest) {
        avail.appendChild(el('li', { class: 'prow prow--avail', 'data-id': lv.id },
          ui.thumb(lv, 72),
          el('span', { class: 'prow__name' }, OX.i18n.levelName(lv), badge(lv)),
          el('button', { class: 'btn btn--small', 'data-act': 'add', title: t('playlist.addTitle'), onclick: () => add(lv.id) }, '+ ' + t('playlist.add'))));
      }
      if (focusId) {
        const target = node.querySelector(`[data-id="${focusId}"] [data-act="${focusSel}"]`) || node.querySelector(`[data-id="${focusId}"] button:not([disabled])`);
        if (target) target.focus({ preventScroll: false });
      }
    };
    const move = (id, d) => {
      const i = ids.indexOf(id), j = i + d;
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      save(); render(id, d < 0 ? 'up' : 'down');
    };
    const remove = (id) => {
      if (ids.length <= 1) { ui.toast(t('playlist.minOne')); return; }
      ids = ids.filter((x) => x !== id);
      save(); render();
    };
    const add = (id) => { ids.push(id); save(); render(id, 'remove'); };

    // drag to reorder (mouse and touch)
    let drag = null;
    list.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest('.prow__handle');
      if (!handle) return;
      const row = handle.closest('.prow');
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      drag = { row, id: row.dataset.id, pointer: e.pointerId, handle };
      row.classList.add('is-dragging');
    });
    list.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pointer) return;
      const rows = [...list.children].filter((r) => r !== drag.row);
      let placed = false;
      for (const r of rows) {
        const box = r.getBoundingClientRect();
        if (e.clientY < box.top + box.height / 2) { list.insertBefore(drag.row, r); placed = true; break; }
      }
      if (!placed) list.appendChild(drag.row);
    });
    const endDrag = (e) => {
      if (!drag || (e && e.pointerId !== drag.pointer)) return;
      drag.row.classList.remove('is-dragging');
      ids = [...list.children].map((r) => r.dataset.id);
      drag = null;
      save(); render();
    };
    list.addEventListener('pointerup', endDrag);
    list.addEventListener('pointercancel', endDrag);

    const reset = async () => {
      if (await ui.confirm({ message: t('playlist.resetConfirm'), ok: t('playlist.reset') })) {
        OX.store.playlist.reset();
        ids = OX.levels.playlistIds();
        render();
      }
    };
    const node = shell({
      title: t('playlist.title'), sub: t('playlist.subtitle'), back: toMenu,
      actions: [el('button', { class: 'btn btn--ghost', onclick: reset }, t('playlist.reset'))],
      body: [el('div', { class: 'columns' },
        el('div', { class: 'col' }, el('h2', { class: 'section-title' }, t('playlist.current'), ' ', count), list),
        el('div', { class: 'col' }, el('h2', { class: 'section-title' }, t('playlist.available')), avail))],
    });
    render();
    return { node, back: toMenu };
  }

  // ---------------------------------------------------------------- editor home
  function buildEditorHome() {
    const refresh = () => ui.show('editorHome', { noFocus: true });
    const mine = OX.levels.custom().sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const newLevel = () => ui.show('editor', { level: null });
    const actions = [
      el('button', { class: 'btn btn--primary', onclick: newLevel }, '+ ' + t('editor.new')),
      el('button', { class: 'btn btn--ghost', onclick: () => ui.importDialog(refresh) }, t('editor.import')),
      mine.length ? el('button', { class: 'btn btn--ghost', onclick: () => ui.exportDialog(mine) }, t('editor.exportAll')) : null,
    ];
    const body = [el('h2', { class: 'section-title' }, t('editor.yourLevels'))];
    if (!mine.length) {
      body.push(el('p', { class: 'empty' }, t('editor.noLevels')));
    } else {
      const grid = el('div', { class: 'cards cards--mine' });
      for (const lv of mine) {
        const st = OX.levels.stats(lv.rows);
        const inPl = OX.levels.inPlaylist(lv.id);
        const cbId = 'pl-' + lv.id;
        grid.appendChild(el('article', { class: 'card card--static' },
          el('button', { class: 'card__thumb card__thumb--btn', 'aria-label': t('common.edit') + ': ' + OX.i18n.levelName(lv), onclick: () => ui.show('editor', { level: lv }) }, ui.thumb(lv, 208)),
          el('div', { class: 'card__body' },
            el('span', { class: 'card__name' }, OX.i18n.levelName(lv)),
            el('span', { class: 'card__meta' }, OX.i18n.tn('editor.bricks', st.total), lv.updated ? ' · ' + OX.i18n.date(lv.updated) : ''),
            el('label', { class: 'check', for: cbId },
              el('input', {
                type: 'checkbox', id: cbId, checked: inPl,
                onchange: (e) => {
                  if (e.target.checked) OX.levels.addToPlaylist(lv.id);
                  else if (!OX.levels.removeFromPlaylist(lv.id)) { e.target.checked = true; ui.toast(t('playlist.minOne')); }
                },
              }),
              el('span', null, t('editor.inPlaylist'))),
            el('div', { class: 'card__actions' },
              el('button', { class: 'btn btn--small btn--primary', onclick: () => ui.show('editor', { level: lv }) }, t('common.edit')),
              el('button', { class: 'btn btn--small', onclick: () => OX.app.startPractice(lv.id, [lv.id]) }, t('common.play')),
              el('button', {
                class: 'btn btn--small', onclick: () => {
                  OX.store.customLevels.save({ name: t('editor.copyOf', { name: OX.i18n.levelName(lv) }).slice(0, 48), bg: lv.bg, rows: lv.rows });
                  refresh();
                },
              }, t('editor.duplicate')),
              el('button', { class: 'btn btn--small', onclick: () => ui.exportDialog([lv]) }, t('editor.export')),
              el('button', {
                class: 'btn btn--small btn--danger-ghost', onclick: async () => {
                  if (await ui.confirm({ message: t('editor.deleteConfirm', { name: OX.i18n.levelName(lv) }), ok: t('common.delete'), danger: true })) {
                    OX.store.customLevels.remove(lv.id);
                    refresh();
                  }
                },
              }, t('common.delete'))))));
      }
      body.push(grid);
    }
    body.push(el('h2', { class: 'section-title' }, t('editor.remix')));
    body.push(el('p', { class: 'hint' }, t('editor.remixHint')));
    body.push(el('div', { class: 'cards cards--small' }, OX.levels.builtin.map((lv) => el('button', {
      class: 'card card--small', onclick: () => {
        const copy = OX.store.customLevels.save({ name: t('editor.copyOf', { name: OX.i18n.levelName(lv) }).slice(0, 48), bg: lv.bg, rows: lv.rows });
        ui.show('editor', { level: OX.levels.byId(copy.id) });
      },
    }, el('div', { class: 'card__thumb' }, ui.thumb(lv, 150)), el('span', { class: 'card__name' }, OX.i18n.levelName(lv))))));
    const node = shell({ title: t('editor.homeTitle'), sub: t('editor.homeSubtitle'), back: toMenu, actions, body });
    return { node, back: toMenu };
  }

  // ---------------------------------------------------------------- high scores
  function buildScores(params) {
    const list = OX.store.scores.list();
    let body;
    if (!list.length) {
      body = [el('p', { class: 'empty empty--big' }, t('scores.empty'))];
    } else {
      body = [el('div', { class: 'table-wrap' }, el('table', { class: 'scores' },
        el('thead', null, el('tr', null,
          el('th', { scope: 'col', class: 'num' }, '#'),
          el('th', { scope: 'col' }, t('scores.name')),
          el('th', { scope: 'col', class: 'num' }, t('scores.score')),
          el('th', { scope: 'col' }, t('scores.level')),
          el('th', { scope: 'col' }, t('scores.date')))),
        el('tbody', null, list.map((s, i) => el('tr', { class: (params.highlight === i + 1 ? 'is-new' : '') + (i < 3 ? ' top' + (i + 1) : '') },
          el('td', { class: 'num rank' }, String(i + 1)),
          el('td', { class: 'name' }, s.name),
          el('td', { class: 'num score' }, OX.i18n.num(s.score)),
          el('td', null, s.completed ? el('span', { class: 'badge badge--gold' }, t('scores.allClear')) : (s.level + (s.total ? ' / ' + s.total : ''))),
          el('td', { class: 'date' }, OX.i18n.date(s.date)))))))];
    }
    const clear = async () => {
      if (await ui.confirm({ message: t('scores.clearConfirm'), ok: t('scores.clear'), danger: true })) {
        OX.store.scores.clear();
        ui.toast(t('scores.cleared'));
        ui.show('scores');
      }
    };
    const node = shell({
      title: t('scores.title'), back: toMenu, body, cls: 'screen--narrow',
      actions: list.length ? [el('button', { class: 'btn btn--ghost btn--danger-ghost', onclick: clear }, t('scores.clear'))] : [],
    });
    return { node, back: toMenu };
  }

  // ---------------------------------------------------------------- help
  function capsuleCanvas(type, cssW) {
    return OX.gfx.previewCanvas((ctx, s) => ctx.drawImage(OX.gfx.capsuleSprite(type, s), 0, 0, C.CAPSULE_W, C.CAPSULE_H), C.CAPSULE_W, C.CAPSULE_H, cssW, dpr());
  }
  function brickCanvas(code, cssW, hits) {
    return OX.gfx.previewCanvas((ctx, s) => ctx.drawImage(OX.gfx.brickSprite(code, s, hits), 0, 0, C.BW, C.BH), C.BW, C.BH, cssW, dpr());
  }
  ui.brickCanvas = brickCanvas;

  function buildHelp() {
    const kinds = ['good', 'neutral', 'bad'];
    const pu = kinds.map((kind) => el('div', { class: 'pu-group pu-group--' + kind },
      el('h3', { class: 'pu-group__title' }, t('help.' + kind)),
      el('ul', { class: 'pu-list' }, OX.POWERUP_ORDER.filter((id) => OX.POWERUPS[id].kind === kind).map((id) => el('li', { class: 'pu' },
        capsuleCanvas(id, 58),
        el('div', null, el('b', null, t('pu.' + id)), el('p', null, t('pu.' + id + '.d'))))))));
    const bricks = [
      ['r', 'normal'], ['2', 'multi2'], ['3', 'multi3'], ['X', 'explode'], ['H', 'hidden'], ['#', 'solid'],
    ].map(([code, key]) => el('li', { class: 'pu' },
      code === 'r'
        ? el('span', { class: 'brick-stack' }, brickCanvas('r', 44), brickCanvas('c', 44), brickCanvas('y', 44))
        : brickCanvas(code, 58),
      el('div', null, el('b', null, t('brick.' + key)), el('p', null, t('brick.' + key + '.d')))));
    const keys = [
      ['help.move', 'help.moveKeys'], ['help.launch', 'help.launchKeys'], ['help.pause', 'help.pauseKeys'], ['help.mute', null, 'M'], ['help.fullscreen', null, 'F'],
    ];
    const body = [
      el('p', { class: 'lead' }, t('help.goal')),
      el('div', { class: 'help-grid' },
        el('div', null,
          el('h2', { class: 'section-title' }, t('help.controls')),
          el('dl', { class: 'keys' }, keys.flatMap(([a, k, raw]) => [el('dt', null, t(a)), el('dd', null, raw || t(k))])),
          el('ul', { class: 'tips' }, el('li', null, t('help.aim')), el('li', null, t('help.speed')), el('li', null, t('help.lightning')))),
        el('div', null,
          el('h2', { class: 'section-title' }, t('help.bricks')),
          el('ul', { class: 'pu-list' }, bricks))),
      el('h2', { class: 'section-title' }, t('help.powerups')),
      el('p', { class: 'hint' }, t('help.powerupsText')),
      el('div', { class: 'pu-groups' }, pu),
    ];
    const node = shell({ title: t('help.title'), back: toMenu, body });
    return { node, back: toMenu };
  }

  // ---------------------------------------------------------------- settings
  function slider(id, label, value, min, max, step, onInput, fmt) {
    const out = el('output', { class: 'field__val', for: id }, fmt(value));
    const input = el('input', { type: 'range', id, min, max, step, value, oninput: (e) => { out.textContent = fmt(+e.target.value); onInput(+e.target.value); } });
    return el('div', { class: 'field' }, el('label', { class: 'field__label', for: id }, label), input, out);
  }
  function toggle(id, label, checked, onChange) {
    return el('div', { class: 'field field--toggle' },
      el('label', { class: 'field__label', for: id }, label),
      el('input', { type: 'checkbox', class: 'switch', id, checked, onchange: (e) => onChange(e.target.checked) }));
  }
  const pct = (v) => Math.round(v * 100) + '%';

  function soundFields(prefix) {
    const s = OX.store.settings.get();
    return [
      slider(prefix + 'sfx', t('settings.sfx'), s.sfx, 0, 1, 0.05, (v) => OX.app.setSetting({ sfx: v }), pct),
      slider(prefix + 'music', t('settings.music'), s.music, 0, 1, 0.05, (v) => OX.app.setSetting({ music: v }), pct),
    ];
  }

  function buildSettings() {
    const s = OX.store.settings.get();
    const langSel = el('select', { id: 'set-lang', onchange: (e) => OX.app.setLanguage(e.target.value) },
      el('option', { value: 'auto', selected: s.lang === 'auto' }, t('settings.langAuto')),
      ...OX.i18n.SUPPORTED.map((c) => el('option', { value: c, lang: c, selected: s.lang === c }, t('lang.' + c))));
    const particles = el('select', { id: 'set-particles', onchange: (e) => OX.app.setSetting({ particles: e.target.value }) },
      el('option', { value: 'full', selected: s.particles !== 'low' }, t('settings.particlesFull')),
      el('option', { value: 'low', selected: s.particles === 'low' }, t('settings.particlesLow')));
    const wipe = async () => {
      if (await ui.confirm({ message: t('settings.resetConfirm'), ok: t('settings.reset'), danger: true })) {
        OX.store.wipe();
        OX.app.applySettings();
        ui.toast(t('settings.resetDone'));
        ui.show('settings');
      }
    };
    const body = [
      el('div', { class: 'form' },
        el('div', { class: 'field' }, el('label', { class: 'field__label', for: 'set-lang' }, t('settings.language')), langSel),
        ...soundFields('set-'),
        toggle('set-shake', t('settings.shake'), s.shake, (v) => OX.app.setSetting({ shake: v })),
        el('div', { class: 'field' }, el('label', { class: 'field__label', for: 'set-particles' }, t('settings.particles')), particles),
        slider('set-keys', t('settings.keySpeed'), s.keySpeed, 0.5, 2, 0.1, (v) => OX.app.setSetting({ keySpeed: v }), (v) => '×' + v.toFixed(1)),
        toggle('set-fps', t('settings.fps'), s.fps, (v) => OX.app.setSetting({ fps: v }))),
      el('h2', { class: 'section-title' }, t('settings.data')),
      el('p', { class: 'hint' }, t('settings.dataText')),
      OX.store.available ? null : el('p', { class: 'hint hint--error' }, t('settings.storageOff')),
      el('button', { class: 'btn btn--danger', onclick: wipe }, t('settings.reset')),
    ];
    const node = shell({ title: t('settings.title'), back: toMenu, body, cls: 'screen--narrow' });
    return { node, back: toMenu };
  }

  // ---------------------------------------------------------------- in-game overlays
  function panel(cls, ...children) {
    return el('section', { class: 'screen screen--overlay' }, el('div', { class: 'panel ' + (cls || ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'panel-title' }, ...children));
  }

  function buildPause({ mode }) {
    const resume = () => OX.app.resume();
    const btns = [el('button', { class: 'btn btn--primary btn--wide', onclick: resume, autofocus: true }, t('pause.resume'))];
    if (mode !== 'campaign') btns.push(el('button', { class: 'btn btn--wide', onclick: () => OX.app.restartLevel() }, t('pause.restart')));
    if (mode === 'test') btns.push(el('button', { class: 'btn btn--wide', onclick: () => OX.app.backToEditor() }, t('pause.backToEditor')));
    if (mode !== 'test') {
      btns.push(el('button', {
        class: 'btn btn--wide btn--ghost', onclick: async () => {
          if (mode !== 'campaign' || await ui.confirm({ message: t('pause.quitConfirm'), ok: t('pause.quitConfirmOk'), danger: true })) OX.app.quitGame();
        },
      }, t('pause.quit')));
    }
    const node = panel('panel--pause',
      el('h1', { class: 'panel__title', id: 'panel-title' }, t('pause.title')),
      el('p', { class: 'hint' }, t('pause.hint')),
      el('div', { class: 'stack' }, btns),
      el('div', { class: 'form form--compact' }, soundFields('pause-')));
    return {
      node, nav: '.btn',
      onKey: (e) => {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { e.preventDefault(); resume(); return true; }
        return false;
      },
    };
  }

  function buildGameOver(p) {
    const { score, victory, levelNumber, total } = p;
    const qualifies = OX.store.scores.qualifies(score);
    const rankIfSaved = OX.store.scores.list().filter((s) => s.score >= score).length + 1;
    const children = [
      el('h1', { class: 'panel__title' + (victory ? ' panel__title--gold' : ''), id: 'panel-title' }, victory ? t('over.victory') : t('over.title')),
      el('p', { class: 'panel__label' }, t('over.score')),
      el('p', { class: 'panel__score' }, OX.i18n.num(score)),
      el('p', { class: 'hint' }, t('over.reached', { n: levelNumber, total })),
    ];
    const again = () => OX.app.startCampaign();
    if (qualifies) {
      const input = el('input', { type: 'text', id: 'hs-name', maxlength: 16, autocomplete: 'nickname', value: OX.store.lastName.get() || '', placeholder: t('common.player'), autofocus: true });
      const form = el('form', {
        class: 'hs-form', onsubmit: (e) => {
          e.preventDefault();
          const name = input.value.trim().slice(0, 16) || t('common.player');
          OX.store.lastName.set(name);
          const rank = OX.store.scores.add({ name, score, level: levelNumber, total, completed: !!victory });
          ui.show('scores', { highlight: rank });
        },
      },
      el('p', { class: 'panel__new' }, t('over.newHigh', { rank: rankIfSaved })),
      el('label', { class: 'field__label', for: 'hs-name' }, t('over.namePrompt')),
      input,
      el('div', { class: 'row row--center' },
        el('button', { type: 'button', class: 'btn btn--ghost', onclick: toMenu }, t('over.skip')),
        el('button', { type: 'submit', class: 'btn btn--primary' }, t('over.save'))));
      children.push(form);
      setTimeout(() => input.select(), 30);
    } else {
      children.push(el('p', { class: 'hint' }, t('over.noRank')));
      children.push(el('div', { class: 'row row--center' },
        el('button', { class: 'btn btn--ghost', onclick: toMenu }, t('over.menu')),
        el('button', { class: 'btn btn--primary', onclick: again, autofocus: true }, t('over.playAgain'))));
    }
    return { node: panel('panel--over', ...children), keepOnRefresh: () => {} };
  }

  function buildPracticeEnd(p) {
    const { complete, score, levelId, mode, nextId, newBest } = p;
    const level = OX.levels.byId(levelId) || OX.app.testLevel;
    const children = [];
    if (mode === 'test') {
      children.push(el('h1', { class: 'panel__title', id: 'panel-title' }, t(complete ? 'test.complete' : 'test.failed')));
      children.push(el('p', { class: 'panel__label' }, t('practice.score')), el('p', { class: 'panel__score' }, OX.i18n.num(score)));
      children.push(el('div', { class: 'row row--center' },
        el('button', { class: 'btn btn--ghost', onclick: () => OX.app.restartLevel() }, t('practice.retry')),
        el('button', { class: 'btn btn--primary', onclick: () => OX.app.backToEditor(), autofocus: true }, t('pause.backToEditor'))));
    } else {
      const best = OX.store.best.get(levelId);
      children.push(el('p', { class: 'panel__label' }, level ? OX.i18n.levelName(level) : ''));
      children.push(el('h1', { class: 'panel__title', id: 'panel-title' }, t(complete ? 'practice.complete' : 'practice.failed')));
      children.push(el('p', { class: 'panel__label' }, t('practice.score')), el('p', { class: 'panel__score' }, OX.i18n.num(score)));
      if (newBest) children.push(el('p', { class: 'panel__new' }, t('practice.newBest')));
      else if (best) children.push(el('p', { class: 'hint' }, t('practice.best') + ': ' + OX.i18n.num(best)));
      children.push(el('p', { class: 'hint' }, t('practice.note')));
      const row = el('div', { class: 'row row--center' },
        el('button', { class: 'btn btn--ghost', onclick: () => ui.show('select') }, t('practice.levels')),
        el('button', { class: 'btn' + (complete && nextId ? '' : ' btn--primary'), onclick: () => OX.app.restartLevel(), autofocus: !(complete && nextId) }, t('practice.retry')));
      if (complete && nextId) row.appendChild(el('button', { class: 'btn btn--primary', onclick: () => OX.app.startPractice(nextId, p.order), autofocus: true }, t('practice.next')));
      children.push(row);
    }
    return { node: panel('panel--over', ...children), nav: '.btn', keepOnRefresh: () => {} };
  }

  const SCREENS = {
    menu: buildMenu,
    select: buildSelect,
    playlist: buildPlaylist,
    editorHome: buildEditorHome,
    editor: (p) => OX.editor.build(p),
    scores: buildScores,
    help: buildHelp,
    settings: buildSettings,
    pause: buildPause,
    gameover: buildGameOver,
    practiceEnd: buildPracticeEnd,
  };

  OX.ui = ui;
})(window.OX = window.OX || {});

/* js/editor.js */
/* OX Ball — level editor. Paint bricks on the 24×24 grid with mirroring, undo/redo, test play and save. */
(function (OX) {
  'use strict';
  const C = OX.C, U = OX.U, el = U.el;
  const t = (k, p) => OX.t(k, p);

  const TOOLS = ['brush', 'line', 'rect', 'fill', 'picker', 'eraser'];
  const TOOL_KEYS = { b: 'brush', l: 'line', r: 'rect', f: 'fill', i: 'picker', e: 'eraser' };
  const MIRRORS = ['none', 'h', 'v', 'both'];

  const ICONS = {
    brush: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
    line: '<path d="M5 19L19 5"/><circle cx="5" cy="19" r="1.6"/><circle cx="19" cy="5" r="1.6"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
    fill: '<path d="M11 3L3 11l7 7 8-8z"/><path d="M19 14s2 2.3 2 3.5a2 2 0 0 1-4 0c0-1.2 2-3.5 2-3.5z"/>',
    picker: '<path d="M15 4l5 5-3 3-5-5z"/><path d="M12 7l-7 7v5h5l7-7"/>',
    eraser: '<path d="M15 4l6 6-9 9H7l-4-4z"/><path d="M8 11l6 6"/>',
    undo: '<path d="M9 6L4 11l5 5"/><path d="M4 11h10a6 6 0 0 1 0 12h-3"/>',
    redo: '<path d="M15 6l5 5-5 5"/><path d="M20 11H10a6 6 0 0 0 0 12h3"/>',
    flipH: '<path d="M12 3v18"/><path d="M8 7l-5 5 5 5z"/><path d="M16 7l5 5-5 5z"/>',
    flipV: '<path d="M3 12h18"/><path d="M7 8l5-5 5 5z"/><path d="M7 16l5 5 5-5z"/>',
    grid: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
    clear: '<path d="M5 7h14"/><path d="M9 7V4h6v3"/><path d="M7 7l1 13h8l1-13"/>',
    play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h8V3"/><path d="M8 21v-7h8v7"/>',
  };
  function icon(name) {
    const span = el('span', { class: 'ico', 'aria-hidden': 'true' });
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    return span;
  }

  let S = null;   // editor state survives a test play

  function createState(level) {
    const rows = level ? OX.levels.normalizeRows(level.rows) : OX.levels.blank().rows;
    return {
      id: level ? level.id : null,
      name: level ? OX.i18n.levelName(level) : '',
      bg: level ? { style: level.bg.style, hue: level.bg.hue } : { style: 'nebula', hue: 220 },
      grid: rows.map((r) => r.split('')),
      undo: [],
      redo: [],
      tool: 'brush',
      brush: 'r',
      mirror: 'none',
      showGrid: true,
      dirty: false,
      addToPlaylist: level ? OX.levels.inPlaylist(level.id) : false,
    };
  }

  const snapshot = () => S.grid.map((r) => r.join('')).join('\n');
  const restore = (snap) => { S.grid = snap.split('\n').map((r) => r.split('')); };
  const rowsOf = () => S.grid.map((r) => r.join(''));

  function levelForPlay() {
    return { id: S.id || 'editor-test', name: S.name.trim() || t('common.untitled'), bg: { style: S.bg.style, hue: S.bg.hue }, rows: rowsOf(), builtin: false };
  }

  // ------------------------------------------------------------------ build the screen
  function build(params) {
    if (!(params.resume && S)) S = createState(params.level || null);

    const canvas = el('canvas', { class: 'ed-canvas', 'aria-label': t('editor.level') });
    const stageBox = el('div', { class: 'ed-stage' }, canvas);
    const ctx = canvas.getContext('2d');
    let hover = null;          // {c, r}
    let drag = null;           // current pointer stroke
    let raf = 0;

    const requestRender = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };

    // --- geometry
    function fit() {
      const box = stageBox.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const aspect = C.W / C.H;
      let w = box.width, h = w / aspect;
      if (h > box.height) { h = box.height; w = h * aspect; }
      const d = Math.min(window.devicePixelRatio || 1, 3);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      requestRender();
    }
    const ro = new ResizeObserver(fit);
    ro.observe(stageBox);

    function cellFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * C.W;
      const y = (e.clientY - rect.top) / rect.height * C.H;
      const c = Math.floor(x / C.BW), r = Math.floor((y - C.GRID_TOP) / C.BH);
      if (c < 0 || c >= C.COLS || r < 0 || r >= C.ROWS) return null;
      return { c, r };
    }

    function mirrored(c, r) {
      const out = [[c, r]];
      const m = S.mirror;
      if (m === 'h' || m === 'both') out.push([C.COLS - 1 - c, r]);
      if (m === 'v' || m === 'both') out.push([c, C.ROWS - 1 - r]);
      if (m === 'both') out.push([C.COLS - 1 - c, C.ROWS - 1 - r]);
      return out;
    }

    function setCell(c, r, ch) {
      let changed = false;
      for (const [cc, rr] of mirrored(c, r)) {
        if (S.grid[rr][cc] !== ch) { S.grid[rr][cc] = ch; changed = true; }
      }
      return changed;
    }

    function lineCells(a, b) {
      const cells = [];
      let x0 = a.c, y0 = a.r;
      const x1 = b.c, y1 = b.r;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        cells.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return cells;
    }
    function rectCells(a, b) {
      const cells = [];
      for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) {
        for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) cells.push([c, r]);
      }
      return cells;
    }
    function floodFill(c, r, ch) {
      let changed = false;
      for (const [sc, sr] of mirrored(c, r)) {
        const from = S.grid[sr][sc];
        if (from === ch) continue;
        const stack = [[sc, sr]];
        while (stack.length) {
          const [x, y] = stack.pop();
          if (x < 0 || y < 0 || x >= C.COLS || y >= C.ROWS || S.grid[y][x] !== from) continue;
          S.grid[y][x] = ch;
          changed = true;
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
      }
      return changed;
    }

    function commit(before) {
      if (snapshot() === before) return false;
      S.undo.push(before);
      if (S.undo.length > 150) S.undo.shift();
      S.redo.length = 0;
      markDirty();
      return true;
    }
    function markDirty() {
      S.dirty = true;
      updateStats();
      requestRender();
    }
    function undo() {
      if (!S.undo.length) return;
      S.redo.push(snapshot());
      restore(S.undo.pop());
      markDirty();
    }
    function redo() {
      if (!S.redo.length) return;
      S.undo.push(snapshot());
      restore(S.redo.pop());
      markDirty();
    }
    function edit(fn) {
      const before = snapshot();
      fn();
      commit(before);
    }

    // --- pointer
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerdown', (e) => {
      const cell = cellFromEvent(e);
      if (!cell) return;
      e.preventDefault();
      // preventDefault keeps focus where it was; release the name field so tool shortcuts work again
      if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
      canvas.setPointerCapture(e.pointerId);
      const erase = e.button === 2 || S.tool === 'eraser';
      const ch = erase ? '.' : S.brush;
      const tool = S.tool === 'eraser' ? 'brush' : S.tool;
      if (tool === 'picker') {
        const got = S.grid[cell.r][cell.c];
        if (got !== '.') { S.brush = got; setTool('brush'); refreshPalette(); }
        return;
      }
      drag = { id: e.pointerId, tool, ch, start: cell, last: cell, before: snapshot() };
      if (tool === 'brush') setCell(cell.c, cell.r, ch);
      if (tool === 'fill') { floodFill(cell.c, cell.r, ch); commit(drag.before); drag = null; }
      requestRender();
    });
    canvas.addEventListener('pointermove', (e) => {
      const cell = cellFromEvent(e);
      const same = hover && cell && hover.c === cell.c && hover.r === cell.r;
      hover = cell;
      if (drag && e.pointerId === drag.id && cell) {
        if (drag.tool === 'brush' && (cell.c !== drag.last.c || cell.r !== drag.last.r)) {
          for (const [c, r] of lineCells(drag.last, cell)) setCell(c, r, drag.ch);
        }
        drag.last = cell;
      }
      if (!same) requestRender();
    });
    const endStroke = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.tool === 'line' || drag.tool === 'rect') {
        const cells = drag.tool === 'line' ? lineCells(drag.start, drag.last) : rectCells(drag.start, drag.last);
        for (const [c, r] of cells) setCell(c, r, drag.ch);
      }
      commit(drag.before);
      drag = null;
      requestRender();
    };
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);
    canvas.addEventListener('pointerleave', () => { if (!drag) { hover = null; requestRender(); } });

    // --- drawing
    function render() {
      if (!canvas.width) return;
      const s = canvas.width / C.W;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(OX.gfx.background(S.bg.style, S.bg.hue, s), 0, 0, canvas.width, canvas.height);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.fillStyle = 'rgba(4,8,18,0.22)';
      ctx.fillRect(0, C.GRID_TOP, C.W, C.ROWS * C.BH);

      let preview = null;
      if (drag && (drag.tool === 'line' || drag.tool === 'rect')) {
        preview = new Map();
        const cells = drag.tool === 'line' ? lineCells(drag.start, drag.last) : rectCells(drag.start, drag.last);
        for (const [c, r] of cells) for (const [cc, rr] of mirrored(c, r)) preview.set(rr * C.COLS + cc, drag.ch);
      }
      for (let r = 0; r < C.ROWS; r++) {
        for (let c = 0; c < C.COLS; c++) {
          let ch = S.grid[r][c];
          const pv = preview ? preview.get(r * C.COLS + c) : undefined;
          if (pv !== undefined) ch = pv;
          if (ch === '.') continue;
          const x = c * C.BW, y = C.GRID_TOP + r * C.BH;
          if (pv !== undefined) ctx.globalAlpha = 0.7;
          if (ch === 'H') {
            ctx.globalAlpha *= 0.55;
            ctx.drawImage(OX.gfx.brickSprite('H', s), x, y, C.BW, C.BH);
            ctx.globalAlpha = pv !== undefined ? 0.7 : 1;
            ctx.drawImage(OX.gfx.ghostOutlineSprite(s), x, y, C.BW, C.BH);
          } else {
            ctx.drawImage(OX.gfx.brickSprite(ch, s), x, y, C.BW, C.BH);
          }
          ctx.globalAlpha = 1;
        }
      }
      if (S.showGrid) {
        ctx.strokeStyle = 'rgba(160,190,255,0.10)';
        ctx.lineWidth = 1 / s;
        ctx.beginPath();
        for (let c = 0; c <= C.COLS; c++) { ctx.moveTo(c * C.BW, C.GRID_TOP); ctx.lineTo(c * C.BW, C.GRID_TOP + C.ROWS * C.BH); }
        for (let r = 0; r <= C.ROWS; r++) { ctx.moveTo(0, C.GRID_TOP + r * C.BH); ctx.lineTo(C.W, C.GRID_TOP + r * C.BH); }
        ctx.stroke();
      }
      if (S.mirror !== 'none') {
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = 'rgba(95,212,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (S.mirror === 'h' || S.mirror === 'both') { ctx.moveTo(C.W / 2, C.GRID_TOP - 6); ctx.lineTo(C.W / 2, C.GRID_TOP + C.ROWS * C.BH + 6); }
        if (S.mirror === 'v' || S.mirror === 'both') { ctx.moveTo(-2, C.GRID_TOP + C.ROWS * C.BH / 2); ctx.lineTo(C.W + 2, C.GRID_TOP + C.ROWS * C.BH / 2); }
        ctx.stroke();
        ctx.restore();
      }
      if (hover && !drag) {
        ctx.lineWidth = 2;
        for (const [c, r] of mirrored(hover.c, hover.r)) {
          ctx.strokeStyle = S.tool === 'eraser' ? 'rgba(255,120,120,0.95)' : 'rgba(255,255,255,0.9)';
          ctx.strokeRect(c * C.BW + 1, C.GRID_TOP + r * C.BH + 1, C.BW - 2, C.BH - 2);
        }
      }
      ctx.globalAlpha = 0.35;
      OX.gfx.drawPaddle(ctx, C.W / 2, C.PADDLE_TOP, C.PADDLE_SIZES[C.PADDLE_DEFAULT], C.PADDLE_H, {});
      ctx.globalAlpha = 1;
    }

    // --- side panel
    const toolBtns = {};
    const toolRow = el('div', { class: 'ed-tools', role: 'group', 'aria-label': t('editor.tools') },
      TOOLS.map((tool) => (toolBtns[tool] = el('button', {
        class: 'tool', 'aria-pressed': 'false', title: t('editor.tool.' + tool) + ' (' + Object.keys(TOOL_KEYS).find((k) => TOOL_KEYS[k] === tool).toUpperCase() + ')',
        onclick: () => setTool(tool),
      }, icon(tool), el('span', null, t('editor.tool.' + tool))))));
    function setTool(tool) {
      S.tool = tool;
      for (const k in toolBtns) {
        toolBtns[k].classList.toggle('is-on', k === tool);
        toolBtns[k].setAttribute('aria-pressed', k === tool ? 'true' : 'false');
      }
      canvas.dataset.tool = tool;
      requestRender();
    }

    const mirrorBtns = {};
    const mirrorRow = el('div', { class: 'seg seg--full', role: 'group', 'aria-label': t('editor.mirror') },
      MIRRORS.map((m) => (mirrorBtns[m] = el('button', { class: 'seg__btn', onclick: () => setMirror(m) }, t('editor.mirror.' + m)))));
    function setMirror(m) {
      S.mirror = m;
      for (const k in mirrorBtns) {
        mirrorBtns[k].classList.toggle('is-on', k === m);
        mirrorBtns[k].setAttribute('aria-pressed', k === m ? 'true' : 'false');
      }
      requestRender();
    }

    const palBtns = {};
    const swatch = (code, label) => (palBtns[code] = el('button', {
      class: 'swatch', title: label, 'aria-label': label, 'aria-pressed': 'false',
      onclick: () => { S.brush = code; if (S.tool === 'eraser' || S.tool === 'picker') setTool('brush'); refreshPalette(); },
    }, OX.ui.brickCanvas(code, 40)));
    const palette = el('div', { class: 'ed-palette' },
      el('div', { class: 'swatches' }, OX.COLOR_ORDER.map((code) => swatch(code, t('brick.normal') + ' — ' + t('color.' + code)))),
      el('div', { class: 'swatches swatches--special' }, [
        swatch('2', t('brick.multi2')), swatch('3', t('brick.multi3')), swatch('X', t('brick.explode')),
        swatch('H', t('brick.hidden')), swatch('#', t('brick.solid')),
      ]));
    const brushName = el('p', { class: 'ed-brush-name' });
    function refreshPalette() {
      for (const k in palBtns) {
        palBtns[k].classList.toggle('is-on', k === S.brush);
        palBtns[k].setAttribute('aria-pressed', k === S.brush ? 'true' : 'false');
      }
      const code = S.brush;
      brushName.textContent = code in OX.COLORS ? t('brick.normal') + ' — ' + t('color.' + code)
        : t('brick.' + { '2': 'multi2', '3': 'multi3', X: 'explode', H: 'hidden', '#': 'solid' }[code]);
    }

    const styleSel = el('select', {
      id: 'ed-bg', onchange: (e) => { S.bg.style = e.target.value; markDirty(); },
    }, OX.BACKGROUNDS.map((b) => el('option', { value: b, selected: S.bg.style === b }, t('bg.' + b))));
    const hueSwatch = el('span', { class: 'hue-swatch' });
    const setHueSwatch = () => { hueSwatch.style.background = U.hsl(S.bg.hue, 55, 38); };
    const hueInput = el('input', {
      type: 'range', id: 'ed-hue', min: 0, max: 359, step: 1, value: S.bg.hue,
      oninput: (e) => { S.bg.hue = +e.target.value; setHueSwatch(); S.dirty = true; requestRender(); },
    });
    setHueSwatch();

    const stats = el('p', { class: 'ed-stats', role: 'status' });
    const warn = el('p', { class: 'hint hint--error' });
    function updateStats() {
      const st = OX.levels.stats(rowsOf());
      stats.textContent = t('editor.stats', { total: st.total, breakable: st.breakable });
      warn.textContent = st.breakable ? '' : t('editor.warnEmpty');
      saveState.textContent = S.dirty ? '•' : '';
    }

    const shiftBy = (dx, dy) => edit(() => {
      const g = Array.from({ length: C.ROWS }, () => Array(C.COLS).fill('.'));
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
        const nr = r + dy, nc = c + dx;
        if (nr >= 0 && nr < C.ROWS && nc >= 0 && nc < C.COLS) g[nr][nc] = S.grid[r][c];
      }
      S.grid = g;
    });
    const flipH = () => edit(() => { S.grid = S.grid.map((row) => row.slice().reverse()); });
    const flipV = () => edit(() => {
      let lo = C.ROWS, hi = -1;
      S.grid.forEach((row, r) => { if (row.some((ch) => ch !== '.')) { lo = Math.min(lo, r); hi = Math.max(hi, r); } });
      if (hi < 0) return;
      const part = S.grid.slice(lo, hi + 1).reverse();
      S.grid.splice(lo, part.length, ...part);
    });
    const clearAll = async () => {
      if (await OX.ui.confirm({ message: t('editor.clearConfirm'), ok: t('editor.clear'), danger: true })) {
        edit(() => { S.grid = Array.from({ length: C.ROWS }, () => Array(C.COLS).fill('.')); });
      }
    };
    const toggleGrid = () => { S.showGrid = !S.showGrid; gridBtn.setAttribute('aria-pressed', S.showGrid ? 'true' : 'false'); gridBtn.classList.toggle('is-on', S.showGrid); requestRender(); };

    const small = (ic, label, fn, extra) => el('button', Object.assign({ class: 'icon-btn icon-btn--tool', title: label, 'aria-label': label, onclick: fn }, extra || {}), icon(ic));
    const gridBtn = small('grid', t('editor.grid'), toggleGrid, { 'aria-pressed': S.showGrid ? 'true' : 'false' });
    gridBtn.classList.toggle('is-on', S.showGrid);
    const editRow = el('div', { class: 'ed-row' },
      small('undo', t('editor.undo') + ' (Ctrl+Z)', undo),
      small('redo', t('editor.redo') + ' (Ctrl+Y)', redo),
      small('flipH', t('editor.flipH'), flipH),
      small('flipV', t('editor.flipV'), flipV),
      gridBtn,
      small('clear', t('editor.clear'), clearAll));
    const arrow = (txt, label, dx, dy) => el('button', { class: 'icon-btn', title: label + ' (Shift+' + txt + ')', 'aria-label': label, onclick: () => shiftBy(dx, dy) }, txt);
    const shiftRow = el('div', { class: 'ed-row ed-row--shift' },
      el('span', { class: 'field__label' }, t('editor.shift')),
      arrow('←', t('editor.shiftLeft'), -1, 0), arrow('↑', t('editor.shiftUp'), 0, -1), arrow('↓', t('editor.shiftDown'), 0, 1), arrow('→', t('editor.shiftRight'), 1, 0));

    const plId = 'ed-playlist';
    const playlistBox = el('label', { class: 'check', for: plId },
      el('input', {
        type: 'checkbox', id: plId, checked: S.addToPlaylist,
        onchange: (e) => {
          S.addToPlaylist = e.target.checked;
          if (!S.id) return;
          if (e.target.checked) OX.levels.addToPlaylist(S.id);
          else if (!OX.levels.removeFromPlaylist(S.id)) { e.target.checked = true; S.addToPlaylist = true; OX.ui.toast(t('playlist.minOne')); }
        },
      }),
      el('span', null, t('editor.addToPlaylist')));

    // --- top bar
    const nameInput = el('input', {
      type: 'text', id: 'ed-name', class: 'ed-name', maxlength: 48, value: S.name, placeholder: t('common.untitled'), 'aria-label': t('editor.name'),
      oninput: (e) => { S.name = e.target.value; S.dirty = true; updateStats(); },
    });
    const saveState = el('span', { class: 'ed-dirty', 'aria-hidden': 'true' });
    function save() {
      const saved = OX.store.customLevels.save({ id: S.id, name: S.name.trim() || t('common.untitled'), bg: S.bg, rows: rowsOf() });
      S.id = saved.id;
      S.name = saved.name;
      nameInput.value = saved.name;
      if (S.addToPlaylist) OX.levels.addToPlaylist(saved.id);
      S.dirty = false;
      updateStats();
      OX.ui.toast(t('editor.saved'));
    }
    async function leave() {
      if (S.dirty && !(await OX.ui.confirm({ message: t('editor.unsaved'), ok: t('editor.leave'), danger: true }))) return;
      S = null;
      OX.ui.show('editorHome');
    }
    const test = () => OX.app.startTest(levelForPlay());

    const bar = el('header', { class: 'ed-bar' },
      el('button', { class: 'btn btn--ghost btn--back', onclick: leave }, el('span', { 'aria-hidden': 'true' }, '←'), ' ', t('common.back')),
      el('div', { class: 'ed-bar__name' }, el('label', { class: 'field__label', for: 'ed-name' }, t('editor.name')), nameInput, saveState),
      el('div', { class: 'ed-bar__actions' },
        el('button', { class: 'btn', onclick: test, title: t('editor.test') }, icon('play'), ' ', t('editor.test')),
        el('button', { class: 'btn btn--primary', onclick: save, title: t('editor.save') + ' (Ctrl+S)' }, icon('save'), ' ', t('editor.save'))));

    const side = el('aside', { class: 'ed-side' },
      el('section', { class: 'ed-sec' }, el('h2', { class: 'ed-sec__title' }, t('editor.tools')), toolRow,
        el('div', { class: 'ed-sub' }, el('span', { class: 'field__label' }, t('editor.mirror')), mirrorRow)),
      el('section', { class: 'ed-sec' }, el('h2', { class: 'ed-sec__title' }, t('editor.bricksPalette')), palette, brushName),
      el('section', { class: 'ed-sec' }, editRow, shiftRow),
      el('section', { class: 'ed-sec' },
        el('div', { class: 'field' }, el('label', { class: 'field__label', for: 'ed-bg' }, t('editor.background')), styleSel),
        el('div', { class: 'field' }, el('label', { class: 'field__label', for: 'ed-hue' }, t('editor.hue')), hueInput, hueSwatch)),
      el('section', { class: 'ed-sec' }, playlistBox, stats, warn, el('p', { class: 'hint ed-help' }, t('editor.help'))));

    const node = el('section', { class: 'screen screen--editor', 'aria-label': t('editor.homeTitle') },
      bar, el('div', { class: 'ed-main' }, stageBox, side));

    setTool(S.tool);
    setMirror(S.mirror);
    refreshPalette();
    updateStats();

    const onBeforeUnload = (e) => { if (S && S.dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onBeforeUnload);

    function onKey(e) {
      const typing = e.target && (e.target.tagName === 'INPUT' && e.target.type === 'text' || e.target.tagName === 'TEXTAREA');
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return true; }
      if (mod && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return true; }
      if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); save(); return true; }
      if (e.key === 'Escape') { e.preventDefault(); leave(); return true; }
      if (typing || mod || e.altKey) return false;
      if (e.shiftKey && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        shiftBy(d[0], d[1]);
        return true;
      }
      const k = e.key.toLowerCase();
      if (TOOL_KEYS[k]) { setTool(TOOL_KEYS[k]); return true; }
      if (k === 'm') { setMirror(MIRRORS[(MIRRORS.indexOf(S.mirror) + 1) % MIRRORS.length]); return true; }
      if (k === 'g') { toggleGrid(); return true; }
      return false;
    }

    return {
      node,
      back: leave,
      onKey,
      focus: nameInput.value ? toolBtns[S.tool] : nameInput,
      cleanup() {
        ro.disconnect();
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('beforeunload', onBeforeUnload);
      },
    };
  }

  OX.editor = {
    build,
    get state() { return S; },
    discard() { S = null; },
  };
})(window.OX = window.OX || {});

/* js/main.js */
/* OX Ball — boot, canvas sizing, the frame loop, input, and switching between menus and games. */
(function (OX) {
  'use strict';
  const C = OX.C;

  const app = {
    game: null,       // the player's game, while one is running (or just ended behind an overlay)
    demo: null,       // attract-mode game playing behind the menus
    mode: null,
    practice: null,   // { levelId, order } for practice runs
    testLevel: null,  // the level being test-played from the editor
    scale: 1,
  };
  OX.app = app;

  let canvas, ctx, stage;
  let last = 0;
  let pausedFrameDrawn = false;
  let demoHeld = false;
  const fpsState = { acc: 0, frames: 0, value: 0 };
  const keys = { left: false, right: false };

  // ------------------------------------------------------------------ settings
  app.applySettings = function () {
    const s = OX.store.settings.get();
    OX.i18n.setLang(s.lang === 'auto' ? OX.i18n.detect() : s.lang);
    OX.audio.setVolumes(s.sfx, s.music);
    OX.audio.setMuted(s.muted);
    for (const g of [app.game, app.demo]) if (g) g.fx.setQuality(s.particles);
  };
  app.setSetting = function (patch) {
    OX.store.settings.set(patch);
    app.applySettings();
  };
  app.setLanguage = function (code) {
    OX.store.settings.set({ lang: code });
    OX.i18n.setLang(code === 'auto' ? OX.i18n.detect() : code);
  };
  app.toggleMute = function () {
    const muted = !OX.store.settings.get().muted;
    app.setSetting({ muted });
    OX.ui.toast(OX.t(muted ? 'toast.muted' : 'toast.unmuted'));
  };
  app.toggleFullscreen = function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* not allowed here */ }
  };

  // ------------------------------------------------------------------ canvas sizing
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const margin = Math.round(Math.max(6, Math.min(vw, vh) * 0.012));
    const aw = Math.max(200, vw - margin * 2), ah = Math.max(160, vh - margin * 2);
    const aspect = C.CANVAS_W / C.CANVAS_H;
    let w = aw, h = aw / aspect;
    if (h > ah) { h = ah; w = ah * aspect; }
    w = Math.floor(w);
    h = Math.floor(w / aspect);
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const d = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(w * d);
    canvas.height = Math.round(h * d);
    app.scale = canvas.width / C.CANVAS_W;
    pausedFrameDrawn = false;
    demoHeld = false;
  }

  function watchPixelRatio() {
    try {
      const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener('change', () => { layout(); watchPixelRatio(); }, { once: true });
    } catch (e) { /* older browsers: resize events still cover most cases */ }
  }

  // ------------------------------------------------------------------ frame loop
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const screen = document.body.dataset.screen;
    if (screen === 'editor') return;
    const g = app.game || app.demo;
    if (!g) return;
    if (!app.game && screen !== 'menu') {
      // behind the other menus the demo is barely visible: hold it still and save the battery
      if (demoHeld) return;
      demoHeld = true;
    } else {
      demoHeld = false;
    }
    if (app.game) {
      if (app.game.paused) {
        if (pausedFrameDrawn) return;
        pausedFrameDrawn = true;
      } else {
        pausedFrameDrawn = false;
        app.game.update(dt);
      }
    } else {
      app.demo.update(dt);
    }
    g.render(ctx, app.scale);
    drawFps(dt);
  }

  function drawFps(dt) {
    if (!OX.store.settings.get().fps) return;
    fpsState.acc += dt;
    fpsState.frames++;
    if (fpsState.acc >= 0.5) { fpsState.value = Math.round(fpsState.frames / fpsState.acc); fpsState.acc = 0; fpsState.frames = 0; }
    ctx.setTransform(app.scale, 0, 0, app.scale, 0, 0);
    ctx.font = `600 11px ${OX.gfx.FONT_DISPLAY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(4, C.HUD + 4, 58, 16);
    ctx.fillStyle = '#9fe6a0';
    ctx.fillText(fpsState.value + ' FPS', 8, C.HUD + 6);
  }

  // ------------------------------------------------------------------ game flow
  function startGame(opts) {
    OX.ui.closeModal();
    app.mode = opts.mode;
    keys.left = keys.right = false;
    let game = null;   // the constructor already emits a 'level' event, before this is assigned
    game = new OX.Game(Object.assign({}, opts, { onEvent: (type, data) => { if (game) onGameEvent(game, type, data); } }));
    app.game = game;
    if (app.lastPointerX != null) game.paddle.x = Math.max(game.paddle.w / 2, Math.min(C.W - game.paddle.w / 2, app.lastPointerX));
    game.input.targetX = game.paddle.x;
    OX.ui.hide();
    document.body.classList.add('is-playing');
    OX.audio.startMusic('game');
  }

  app.startCampaign = function () {
    startGame({ mode: 'campaign', levels: OX.levels.playlist(), startIndex: 0 });
  };
  app.startPractice = function (levelId, order) {
    const level = OX.levels.byId(levelId);
    if (!level) return;
    app.practice = { levelId, order: order && order.length ? order : [levelId] };
    startGame({ mode: 'practice', levels: [level] });
  };
  app.startTest = function (level) {
    app.testLevel = level;
    startGame({ mode: 'test', levels: [level] });
  };
  app.restartLevel = function () {
    if (app.mode === 'practice' && app.practice) app.startPractice(app.practice.levelId, app.practice.order);
    else if (app.mode === 'test' && app.testLevel) app.startTest(app.testLevel);
  };
  app.backToEditor = function () {
    endGame();
    OX.ui.show('editor', { resume: true });
  };
  app.quitGame = function () {
    endGame();
    OX.ui.show('menu');
  };

  function endGame() {
    app.game = null;
    document.body.classList.remove('is-playing');
    OX.audio.startMusic('menu');
  }

  // Leaving the game's own overlays for any other screen drops the finished game and brings the demo back.
  app.onScreenChange = function (name) {
    const gameScreens = [null, 'pause', 'gameover', 'practiceEnd'];
    if (app.game && !gameScreens.includes(name)) endGame();
  };

  function onGameEvent(game, type) {
    if (game !== app.game) return;
    if (type === 'gameover' || type === 'victory') {
      document.body.classList.remove('is-playing');
      OX.audio.startMusic('menu');
      OX.ui.show('gameover', {
        score: game.score,
        victory: type === 'victory',
        levelNumber: type === 'victory' ? game.levels.length : game.index + 1,
        total: game.levels.length,
      });
    } else if (type === 'practiceComplete' || type === 'practiceFailed') {
      document.body.classList.remove('is-playing');
      const complete = type === 'practiceComplete';
      let newBest = false, nextId = null, order = null;
      if (app.mode === 'practice' && app.practice) {
        if (complete) newBest = OX.store.best.submit(app.practice.levelId, game.score);
        order = app.practice.order;
        const i = order.indexOf(app.practice.levelId);
        nextId = i >= 0 && i + 1 < order.length ? order[i + 1] : null;
      }
      OX.ui.show('practiceEnd', {
        complete, score: game.score, mode: app.mode, newBest, nextId, order,
        levelId: app.mode === 'practice' && app.practice ? app.practice.levelId : null,
      });
    }
  }

  function pause() {
    const g = app.game;
    if (!g || g.paused || ['over', 'victory', 'done'].includes(g.state)) return;
    g.paused = true;
    g.setFire(false);
    keys.left = keys.right = false;
    g.setKeys(false, false);
    document.body.classList.remove('is-playing');
    OX.ui.show('pause', { mode: app.mode });
  }
  app.pause = pause;
  app.resume = function () {
    const g = app.game;
    if (!g) return;
    OX.ui.hide();
    g.paused = false;
    last = 0;
    document.body.classList.add('is-playing');
  };

  function startDemo() {
    const levels = OX.levels.builtin.slice();
    app.demo = new OX.Game({ mode: 'demo', levels, startIndex: Math.floor(Math.random() * levels.length) });
  }

  // ------------------------------------------------------------------ input
  const pointerToField = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) / rect.width * C.W;
  };
  const isTyping = (e) => {
    const n = e.target;
    return n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SELECT' || n.isContentEditable);
  };
  const playing = () => app.game && !app.game.paused && !OX.ui.current;

  function bindInput() {
    window.addEventListener('pointermove', (e) => {
      app.lastPointerX = pointerToField(e.clientX);
      if (playing()) app.game.setPointerX(app.lastPointerX, e.pointerType === 'touch');
    }, { passive: true });
    stage.addEventListener('pointerdown', (e) => {
      if (!playing()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      app.game.setPointerX(pointerToField(e.clientX), e.pointerType === 'touch');
      app.game.action();
      app.game.setFire(true);
    });
    window.addEventListener('pointerup', () => { if (app.game) app.game.setFire(false); });
    window.addEventListener('pointerdown', () => OX.audio.unlock(), true);
    stage.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => { if (playing()) pause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing()) pause(); });
  }

  function onKeyDown(e) {
    OX.audio.unlock();
    // keys the menus already handled (e.g. P/Esc closing the pause menu) must not reach the game too
    if (e.defaultPrevented || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (OX.ui.is('editor') || OX.ui.modalOpen()) return;
    const k = e.key;
    if (k === 'm' || k === 'M') { app.toggleMute(); return; }
    if (k === 'f' || k === 'F') { app.toggleFullscreen(); return; }
    if (!playing()) return;
    const g = app.game;
    switch (k) {
      case 'ArrowLeft': case 'a': case 'A': keys.left = true; break;
      case 'ArrowRight': case 'd': case 'D': keys.right = true; break;
      case ' ': case 'Enter': case 'ArrowUp': case 'w': case 'W':
        if (!e.repeat) g.action();
        g.setFire(true);
        break;
      case 'p': case 'P': case 'Escape': pause(); break;
      default: return;
    }
    e.preventDefault();
    g.setKeys(keys.left, keys.right);
  }

  function onKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': keys.left = false; break;
      case 'ArrowRight': case 'd': case 'D': keys.right = false; break;
      case ' ': case 'Enter': case 'ArrowUp': case 'w': case 'W':
        if (app.game) app.game.setFire(false);
        break;
      default: return;
    }
    if (app.game) app.game.setKeys(keys.left, keys.right);
  }

  // ------------------------------------------------------------------ boot
  function boot() {
    stage = document.getElementById('stage');
    canvas = document.getElementById('screen');
    ctx = canvas.getContext('2d');
    app.applySettings();
    OX.ui.init(document.getElementById('ui'));
    layout();
    window.addEventListener('resize', layout);
    watchPixelRatio();
    bindInput();
    startDemo();
    OX.ui.show('menu');
    OX.audio.startMusic('menu');
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('700 20px Oxanium'),
        document.fonts.load('600 20px Barlow'),
      ]).catch(() => {});
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.OX = window.OX || {});

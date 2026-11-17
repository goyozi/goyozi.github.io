export const COLS = 14;
export const ROWS = 13;

const featuredBricks = ["normal", "explosive", "gray", "hidden", "gold", "silver", "cracked", "steel"];

export const COLORS = {
  rose: { top: "#ff9ab9", base: "#f34b80", shadow: "#b5225e", glow: "#ff6698" },
  orange: { top: "#ffc28e", base: "#ff8d55", shadow: "#be522f", glow: "#ff9a67" },
  lemon: { top: "#fff09e", base: "#ffd25a", shadow: "#b68329", glow: "#ffe281" },
  green: { top: "#a6fac0", base: "#62dd92", shadow: "#2c935b", glow: "#79f2a7" },
  cyan: { top: "#9cf6ff", base: "#4bd9ec", shadow: "#267f9c", glow: "#6aeaff" },
  blue: { top: "#a6bcff", base: "#678ef4", shadow: "#384faa", glow: "#81a1ff" },
  purple: { top: "#dab4ff", base: "#a976f1", shadow: "#673bac", glow: "#c292ff" },
  white: { top: "#f1f6ff", base: "#afc4e0", shadow: "#647c9c", glow: "#d3e5fc" },
};

const tiles = {
  r: { type: "normal", color: "rose" },
  o: { type: "normal", color: "orange" },
  y: { type: "normal", color: "lemon" },
  g: { type: "normal", color: "green" },
  c: { type: "normal", color: "cyan" },
  b: { type: "normal", color: "blue" },
  p: { type: "normal", color: "purple" },
  w: { type: "normal", color: "white" },
  x: { type: "explosive", color: "orange" },
  h: { type: "hidden", color: "purple" },
  $: { type: "gold", color: "lemon" },
  "!": { type: "cracked", color: "lemon" },
  a: { type: "gray", color: "white" },
  s: { type: "silver", color: "white" },
  t: { type: "steel", color: "white" },
};

function board(id, en, pl, pattern) {
  const grid = pattern.trim().split(/\s+/).map(row => [...row].map(symbol => {
    const tile = tiles[symbol];
    return tile ? { ...tile } : null;
  }));
  while (grid.length < ROWS) grid.push(Array(COLS).fill(null));
  return { id, name: { en, pl }, grid };
}

export const LEVELS = [
  board("prism-heart", "Prism Heart", "Pryzmatyczne serce", `
    ..rrr....rrr..
    .rrrro..orrrr.
    .rwrroooorrwr.
    .oooyyyyyyooo.
    ..oyyyggyyyo..
    ...gggccggg...
    ....cccccc....
    .....bbbb.....
    ......pp......
  `),
  board("rings-of-saturn", "Rings of Saturn", "Pierścienie Saturna", `
    .....cccc.....
    ....ccbbcc....
    ...ccbbppcc...
    ...cbbppppc...
    ..ocbbppppco..
    .yxyyboobyyxy.
    yy...yyyy...yy
    .oyy.bppb.yyo.
    ..oooyyyyooo..
    ....cbbbbc....
    .....cccc.....
  `),
  board("moon-moth", "Moon Moth", "Księżycowa ćma", `
    ..pp......pp..
    .pbp..cc..pbp.
    .pbbp.cc.pbbp.
    .pbbppwwppbbp.
    .bpobpwwpbopb.
    ..bopbaabpob..
    ...pbbaabbp...
    ..pppbaabppp..
    ..pbbpwwpbbp..
    ...bbpccpbb...
    ....bbccbb....
    .....bccb.....
  `),
  board("afterimage", "Afterimage", "Powidok", `
    ......cc......
    ....cccccc....
    ...ccwwwwcc...
    ..ccwwwwwwcc..
    ..ccwwwwwwbc..
    ..ccppwwppbc..
    ..ccbbwwbbbc..
    ..bcbwhhwbbb..
    ..bbbwhhwbbb..
    ..bbhhhhhhbb..
    ..bhhb..bhhb..
    ...hh....hh...
    ....h....h....
  `),
  board("gilded-temple", "Gilded Temple", "Złota świątynia", `
    ......yy......
    .....yyyy.....
    ....yorroy....
    ...yoorrooy...
    ..yoorrrrooy..
    .yayyyyyyyyay.
    ..$oo$..$oo$..
    ..$or$..$ro$..
    ..$rr$..$rr$..
    ..$rr$..$rr$..
    ..oooo..oooo..
    .ryyyr..ryyyr.
    rroyor..royorr
  `),
  board("neon-bloom", "Neon Bloom", "Neonowy kwiat", `
    .....r..r.....
    ....rpsspr....
    ...rppprppr...
    .r..rpprpr..r.
    .rprrpysprrpr.
    ..rpoywyyopr..
    ...oyxwwxyo...
    ..rpoyywyopr..
    .rprrpsyprrpr.
    .r..rprppr..r.
    ...rppprppr...
    ....rpsspr....
    .....r..r.....
  `),
  board("atlas-circuit", "Atlas Circuit", "Obwód Atlasa", `
    cc...cccc...cc
    cgg..cbbc..ggc
    .cgg.cbbc.ggc.
    ..cg!cbbc!gc..
    ...g!a!!a!g...
    ....agggga....
    ccggagwwgaggcc
    b.b!agwwga!b.b
    ccggaggggaggcc
    ...g!a!!a!g...
    ..cg!cbbc!gc..
    .cgg.cbbc.ggc.
    cc...cccc...cc
  `),
  board("low-tide", "Low Tide", "Odpływ", `
    .....cccc.....
    ...ccwccwcc...
    ..cccccbbbcc..
    .cccttbbtbbcc.
    .cbbpbwwbpbbc.
    ..bbppwwppbb..
    .bppppccppppb.
    bbpbbpccpbbpbb
    ..p..h..h..p..
    ..pp.h..h.pp..
    ...p.h..h.p...
    .ppp.hh.hh.ppp
    .p....h.h....p
  `),
  board("hourglass", "Hourglass", "Klepsydra", `
    .sssoooooosss.
    .$aoyyyyyyoa$.
    ..$oyyyyyyo$..
    ...$oyyyyo$...
    ....$oooo$....
    .yo..$t!$..oy.
    oyxo.$!t$.oxyo
    .yo.$ooyo$.oy.
    ...$ooyyoo$...
    ..$oyyyyyyo$..
    .$aooxxxoooa$.
    .sssoooooosss.
  `),
  board("solar-phoenix", "Solar Phoenix", "Słoneczny feniks", `
    y............y
    ooy........yoo
    rooo..yo..ooor
    rroooywwyooorr
    rrroosyysoorrr
    .rroxo!!oxorr.
    ..prsryyrsrp..
    ...pprssrpp...
    ....prssrp....
    ...pprssrpp...
    ..p..rxxr..p..
    ..p...rr...p..
    ...p..rr..p...
  `),
  board("event-horizon", "Event Horizon", "Horyzont zdarzeń", `
    ....bhhhhb....
    ..bpcrrrrcpb..
    .bpcryssyrcpb.
    bpcry$yy$yrcpb
    bcry$oo!o$yrcb
    hcrsyo..oysrch
    hcrtto..ottrch
    hcrsyo..oysrch
    bcry$o!oo$yrcb
    bpcry$yy$yrcpb
    .bpcryssyrcpb.
    ..bpcrrrrcpb..
    ....bhhhhb....
  `),
  board("final-signal", "Final Signal", "Ostatni sygnał", `
    ttpc..ss..cptt
    tscc..ww..ccst
    psc..wccw..csp
    cs..wcggcw..sc
    c..wcgyygcw..c
    ..wcg!yy!gcw..
    sttgy!xx!ygtts
    ..wcg!yy!gcw..
    c..wcgyygcw..c
    cs..wcggcw..sc
    psc..wccw..csp
    tscc..ww..ccst
    ttpc..ss..cptt
  `),
].map((level, index) => ({
  ...level,
  difficulty: index + 1,
  featuredBrick: featuredBricks[index],
}));

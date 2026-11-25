// Rasa Rush — Dapur Kilat: all tuning in one place.
// Canvas is 1280x800. The kitchen floor sits under the HUD and the order
// board; ingredient bins line the left wall, the board, stove and trash line
// the right wall, the assembly counter sits mid-floor on the rug and the
// serving window at the bottom. Every number the game balances on lives here, so a tweak never
// means hunting through the draw code.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// Top strip: score bar, then the order board.
export const HUD_H = 92;
export const BOARD_Y = 100;
export const BOARD_H = 104;
export const FLOOR_Y = 212;

// Player. Radius 33 so the chef still reads when the frame is shrunk
// to a contact sheet.
export const PLAYER_R = 33;
export const PLAYER_SPEED = 265; // px per second
export const HANDS_MAX = 3; // items carried at once (a plate counts as the hands)

// A shift lasts 3 minutes; the rush builds across it.
export const SHIFT_SECONDS = 180;
export const MAX_MISSED = 3; // missed orders end the shift early
export const MAX_ORDERS = 4;

// Order pacing: first order comes fast so the board is never empty, then the
// gap shrinks as the shift goes on.
export const ORDER_FIRST_DELAY = 2.0;
export const ORDER_GAP_START = 15;
export const ORDER_GAP_END = 8;
export const ORDER_TIME_START = 55; // seconds an order lives
export const ORDER_TIME_END = 38;

// Work timers (seconds).
export const CHOP_SECONDS = 1.2;
export const COOK_SECONDS = 4.0;
export const BURN_AFTER = 9.0; // grace after cooked before it burns — long
// enough for a two-pan workflow across the kitchen, short enough that
// forgotten food still burns

// Money: base price per dish plus a tip that shrinks as the order ages.
export const TIP_MAX = 0.5; // +50% when served instantly

// Ingredients: what the cutting board and the stove can do to each one.
// chop: raw -> chopped on the board. cook: raw/chopped -> cooked on a burner.
// Sambal is used as-is; sayur never sees the stove.
export const INGREDIENTS = {
  nasi: { name: 'Nasi', emoji: '🍚', chop: false, cook: true },
  mie: { name: 'Mie', emoji: '🍜', chop: false, cook: true },
  ayam: { name: 'Ayam', emoji: '🍗', chop: true, cook: true },
  telur: { name: 'Telur', emoji: '🥚', chop: false, cook: true },
  sayur: { name: 'Sayur', emoji: '🥬', chop: true, cook: false },
  sambal: { name: 'Sambal', emoji: '🌶️', chop: false, cook: false },
};

export const STATE_LABEL = { raw: 'mentah', chopped: 'potong', cooked: 'masak', burnt: 'gosong' };
export const STATE_COLOR = { raw: '#9ca3af', chopped: '#f59e0b', cooked: '#ef4444', burnt: '#111827' };

// Recipes: three components each, every one a different route through the
// kitchen so no two dishes feel the same to cook.
export const RECIPES = [
  {
    id: 'nasgor',
    name: 'Nasi Goreng',
    emoji: '🍛',
    price: 24,
    needs: [
      { kind: 'nasi', state: 'cooked' },
      { kind: 'telur', state: 'cooked' },
      { kind: 'sambal', state: 'raw' },
    ],
  },
  {
    id: 'mieayam',
    name: 'Mie Ayam',
    emoji: '🍜',
    price: 22,
    needs: [
      { kind: 'mie', state: 'cooked' },
      { kind: 'ayam', state: 'chopped' },
      { kind: 'sayur', state: 'chopped' },
    ],
  },
  {
    id: 'soto',
    name: 'Soto Ayam',
    emoji: '🍲',
    price: 26,
    needs: [
      { kind: 'ayam', state: 'cooked' },
      { kind: 'nasi', state: 'cooked' },
      { kind: 'sayur', state: 'chopped' },
    ],
  },
  {
    id: 'gado',
    name: 'Gado-Gado',
    emoji: '🥗',
    price: 20,
    needs: [
      { kind: 'sayur', state: 'chopped' },
      { kind: 'telur', state: 'cooked' },
      { kind: 'sambal', state: 'raw' },
    ],
  },
];

// Stations: rectangles on the floor. The kitchen logic and the renderer both
// read these, so the map and the picture can never drift apart.
export const STATIONS = {
  bins: [
    { kind: 'nasi', label: 'Nasi', x: 24, y: 232, w: 150, h: 80 },
    { kind: 'mie', label: 'Mie', x: 24, y: 322, w: 150, h: 80 },
    { kind: 'ayam', label: 'Ayam', x: 24, y: 412, w: 150, h: 80 },
    { kind: 'telur', label: 'Telur', x: 24, y: 502, w: 150, h: 80 },
    { kind: 'sayur', label: 'Sayur', x: 24, y: 592, w: 150, h: 80 },
    { kind: 'sambal', label: 'Sambal', x: 24, y: 682, w: 150, h: 80 },
  ],
  board: { id: 'board', label: 'Talenan', x: 1106, y: 232, w: 150, h: 90 },
  stove: { id: 'stove', label: 'Kompor', x: 1106, y: 342, w: 150, h: 170 },
  trash: { id: 'trash', label: 'Sampah', x: 1106, y: 532, w: 150, h: 90 },
  assembly: { id: 'assembly', label: 'Meja Rakit', x: 520, y: 560, w: 440, h: 104 },
  serve: { id: 'serve', label: 'Jendela Saji', x: 900, y: 668, w: 356, h: 104 },
};

// The two burners sit inside the stove rectangle.
export const BURNERS = [
  { x: 1145, y: 400, r: 36 },
  { x: 1215, y: 462, r: 36 },
];

// Palette: a warm warung — cream tiles, teal walls, wood counters.
export const COLORS = {
  wall: '#0f766e',
  wallDark: '#115e59',
  floorA: '#f7e8c9',
  floorB: '#f0dcae',
  wood: '#b45309',
  woodDark: '#92400e',
  steel: '#94a3b8',
  steelDark: '#64748b',
  hud: '#1f2937',
  hudLight: '#374151',
  paper: '#fffbeb',
  ink: '#1f2937',
  muted: '#6b7280',
  gold: '#f59e0b',
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
};

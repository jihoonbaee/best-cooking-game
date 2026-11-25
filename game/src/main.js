// Rasa Rush — Dapur Kilat: the game loop and the state machine.
// Title -> playing -> over, with pause. The loop is a fixed request-
// animation-frame step clamped to 50 ms so a slow frame never teleports
// the chef. `?shot=` stages a fixed mid-play scene for screenshots —
// the same code, the same kitchen, just a set table: cover, chopping,
// serving and rush hour. The running game is exposed as window.RASA so
// a play-test can drive it and read it back.

import { CANVAS_W, CANVAS_H, SHIFT_SECONDS, MAX_MISSED, ORDER_TIME_START, RECIPES, STATIONS } from './config.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { Kitchen } from './kitchen.js';
import { OrderBoard, mulberry32 } from './orders.js';
import { Renderer } from './render.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sfx = new Sfx();
    this.input = new Input(canvas);
    this.state = 'title'; // title | playing | paused | over
    this.now = 0;
    this.elapsed = 0;
    this.shiftLeft = SHIFT_SECONDS;
    this.progress = 0;
    this.rush = false;
    this.rushAnnounced = false;
    this.lastAlarm = 0;
    this.kitchen = new Kitchen(this.sfx);
    this.board = new OrderBoard(mulberry32(seed));
    // A staged scene is a frozen moment of play: the timers, the chopping
    // and the burners hold still, so every screenshot of it is identical.
    this.frozen = !!shot && shot !== 'start';
    if (shot) this.stageShot(shot);
  }

  reset() {
    this.elapsed = 0;
    this.shiftLeft = SHIFT_SECONDS;
    this.progress = 0;
    this.rush = false;
    this.rushAnnounced = false;
    this.kitchen.reset();
    this.board = new OrderBoard(mulberry32(seed));
    this.state = 'playing';
  }

  // --- staged scenes for screenshots -------------------------------------
  // Each one builds a real game state through the same objects the player
  // uses: real orders, a real plate, a real burner. Nothing is faked for
  // the camera — the scene is a moment of play, frozen where it reads best.

  stageShot(name) {
    this.state = 'playing';
    this.elapsed = name === 'rush' ? 150 : name === 'serve' ? 95 : 62;
    this.shiftLeft = SHIFT_SECONDS - this.elapsed;
    this.progress = this.elapsed / SHIFT_SECONDS;
    this.rush = this.progress >= 0.7;
    const k = this.kitchen;
    const b = this.board;
    // Orders are spawned with fixed recipes so every shot shows the same
    // board; lifetimes are set so the bars read at different lengths.
    const order = (recipeId, frac) => {
      const recipe = this.recipeById(recipeId);
      const life = ORDER_TIME_START;
      return { id: 100 + b.orders.length, recipe, timeLeft: life * frac, timeMax: life };
    };
    if (name === 'start') {
      this.state = 'title';
      return;
    }
    if (name === 'play') {
      // Mid-chop: three orders up, the chef at the board with a half-built
      // plate, one burner cooking.
      b.orders = [order('nasgor', 0.8), order('mieayam', 0.55), order('soto', 0.3)];
      b.spawnIn = 6;
      k.player.x = 1064;
      k.player.y = 300;
      k.hands = [{ kind: 'sayur', state: 'raw' }];
      k.chopping = { item: { kind: 'ayam', state: 'raw' }, t: 0.7 };
      k.plate = [
        { kind: 'nasi', state: 'cooked' },
        { kind: 'telur', state: 'cooked' },
      ];
      k.burners[0] = { item: { kind: 'mie', state: 'raw' }, t: 2.4, state: 'cooking' };
      b.served = 3;
      b.earned = 78;
      b.combo = 2;
      return;
    }
    if (name === 'serve') {
      // Plate complete in hand, matching order on the board, chef at the
      // serving window.
      b.orders = [order('nasgor', 0.65), order('gado', 0.4)];
      b.spawnIn = 9;
      k.player.x = 1030;
      k.player.y = 640;
      k.player.face = 1;
      k.plate = [
        { kind: 'nasi', state: 'cooked' },
        { kind: 'telur', state: 'cooked' },
        { kind: 'sambal', state: 'raw' },
      ];
      k.carryingPlate = true;
      k.burners[1] = { item: { kind: 'ayam', state: 'raw' }, t: 3.1, state: 'cooking' };
      b.served = 5;
      b.earned = 132;
      b.combo = 3;
      return;
    }
    if (name === 'cook') {
      // Both burners going, a fresh plate started, chef at the stove —
      // the cooking half of the loop.
      b.orders = [order('soto', 0.75), order('mieayam', 0.5), order('gado', 0.85)];
      b.spawnIn = 5;
      k.player.x = 1050;
      k.player.y = 470;
      k.hands = [{ kind: 'sayur', state: 'chopped' }];
      k.plate = [{ kind: 'ayam', state: 'cooked' }];
      k.burners[0] = { item: { kind: 'nasi', state: 'raw' }, t: 2.9, state: 'cooking' };
      k.burners[1] = { item: { kind: 'telur', state: 'cooked' }, t: 1.5, state: 'cooked' };
      b.served = 4;
      b.earned = 104;
      b.combo = 2;
      return;
    }
    if (name === 'rush') {
      // Four orders, one almost out of time, a burner about to burn, late
      // shift — the rush hour banner is on.
      b.orders = [order('mieayam', 0.18), order('nasgor', 0.45), order('soto', 0.7), order('gado', 0.9)];
      b.spawnIn = 3;
      k.player.x = 1050;
      k.player.y = 430;
      k.hands = [
        { kind: 'ayam', state: 'chopped' },
        { kind: 'sayur', state: 'chopped' },
      ];
      k.plate = [{ kind: 'mie', state: 'cooked' }];
      k.burners[0] = { item: { kind: 'nasi', state: 'cooked' }, t: 5.2, state: 'cooked' };
      k.burners[1] = { item: { kind: 'telur', state: 'raw' }, t: 1.1, state: 'cooking' };
      b.served = 9;
      b.earned = 231;
      b.missed = 1;
      b.combo = 4;
      return;
    }
    // Unknown scene name: fall back to a plain mid-play table.
    b.orders = [order('nasgor', 0.7), order('mieayam', 0.5)];
  }

  recipeById(id) {
    // Local lookup so scenes never depend on the board's random pick.
    return RECIPES.find((r) => r.id === id);
  }

  // --- frame ------------------------------------------------------------------

  frame(t) {
    const dt = Math.min(0.05, (t - this.now) / 1000 || 0.016);
    this.now = t;
    const input = this.input;

    if (this.state === 'title') {
      if (input.wasPressed('enter', ' ') || input.takeClick()) {
        this.sfx.unlock();
        this.reset();
      }
      this.renderer.draw(this, t);
      input.endFrame();
      return;
    }
    if (this.state === 'over') {
      if (input.wasPressed('r', 'enter')) this.reset();
      this.renderer.draw(this, t);
      input.endFrame();
      return;
    }
    if (input.wasPressed('p')) {
      this.state = this.state === 'paused' ? 'playing' : 'paused';
    }
    if (input.wasPressed('m')) {
      this.sfx.unlock();
      this.kitchen.say(this.sfx.toggleMute() ? 'Suara mati' : 'Suara hidup');
    }
    if (this.state === 'paused') {
      this.renderer.draw(this, t);
      input.endFrame();
      return;
    }
    if (this.frozen) {
      // Staged screenshot scene: draw the frozen table, take nothing.
      this.renderer.draw(this, t);
      input.endFrame();
      return;
    }

    // Playing.
    this.elapsed += dt;
    this.shiftLeft = Math.max(0, SHIFT_SECONDS - this.elapsed);
    this.progress = Math.min(1, this.elapsed / SHIFT_SECONDS);
    if (this.progress >= 0.7 && !this.rushAnnounced) {
      this.rush = true;
      this.rushAnnounced = true;
      this.sfx.rush();
      this.kitchen.say('⚠️ RUSH HOUR — pesanan datang cepat!');
    }

    // Mouse: a click on a station in reach uses it, anywhere else walks.
    const click = input.takeClick();
    if (click) {
      this.sfx.unlock();
      const k = this.kitchen;
      k.nearest = k.nearestStation();
      const hit = this.stationAt(click.x, click.y);
      if (hit && k.nearest === hit) {
        const ev = k.interact(this.board);
        this.handleEvent(ev);
      } else {
        this.input.moveTarget = { x: click.x, y: click.y, done: false };
      }
    }
    if (input.wasPressed('e', ' ')) {
      this.sfx.unlock();
      const ev = this.kitchen.interact(this.board);
      this.handleEvent(ev);
    }

    const vec = input.moveVector();
    if (vec.x !== 0 || vec.y !== 0) this.input.moveTarget = null;
    this.kitchen.move(dt, vec, this.input.moveTarget);
    if (this.input.moveTarget && this.input.moveTarget.done) this.input.moveTarget = null;

    this.kitchen.update(dt, this.board);
    this.board.update(
      dt,
      this.progress,
      (o) => {
        this.kitchen.say(`Pesanan ${o.recipe.name} gagal!`);
        this.sfx.wrong();
      },
      () => this.sfx.orderIn(),
    );

    // Low-time alarm on the most urgent order, at most once a second.
    const urgent = this.board.orders.find((o) => o.timeLeft <= 10);
    if (urgent && t - this.lastAlarm > 1000) {
      this.lastAlarm = t;
      this.sfx.alarm();
    }

    if (this.board.missed >= MAX_MISSED || this.shiftLeft <= 0) {
      this.state = 'over';
      this.sfx.over();
    }

    this.renderer.draw(this, t);
    input.endFrame();
  }

  stationAt(x, y) {
    const inside = (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    for (const b of STATIONS.bins) if (inside(b)) return `bin:${b.kind}`;
    if (inside(STATIONS.board)) return 'board';
    if (inside(STATIONS.stove)) return 'stove';
    if (inside(STATIONS.trash)) return 'trash';
    if (inside(STATIONS.assembly)) return 'assembly';
    if (inside(STATIONS.serve)) return 'serve';
    return null;
  }

  handleEvent(ev) {
    if (!ev) return;
    if (ev.type === 'served') {
      this.kitchen.say(`Disajikan! +Rp${ev.pay} — ${ev.order.recipe.name}`);
    }
  }
}

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const game = new Game(canvas);
window.RASA = game; // play-tests drive and read the game through this
const loop = (t) => {
  game.frame(t);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

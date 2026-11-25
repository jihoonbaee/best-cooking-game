// Rasa Rush — Dapur Kilat: the kitchen itself.
// The chef, the stations, the hands, the plate and the burners. Every
// interaction the player can do lives in interact(): take an ingredient,
// chop it, cook it, build the plate, serve it, or throw it away. Movement
// is free 2D with circle-vs-rectangle collision against the station
// counters, so the chef walks around the kitchen instead of through it.

import {
  CANVAS_W, CANVAS_H, PLAYER_R, PLAYER_SPEED, HANDS_MAX, CHOP_SECONDS,
  COOK_SECONDS, BURN_AFTER, STATIONS, BURNERS, INGREDIENTS, FLOOR_Y,
} from './config.js';

const INTERACT_RANGE = 78; // px from the player to a station's edge

function distToRect(px, py, r) {
  const cx = Math.max(r.x, Math.min(px, r.x + r.w));
  const cy = Math.max(r.y, Math.min(py, r.y + r.h));
  return Math.hypot(px - cx, py - cy);
}

export class Kitchen {
  constructor(sfx) {
    this.sfx = sfx;
    this.reset();
  }

  reset() {
    this.player = { x: 640, y: 470, face: 1, moving: false };
    this.hands = []; // items: {kind, state}
    this.plate = []; // items on the assembly counter's plate
    this.carryingPlate = false;
    this.burners = BURNERS.map(() => ({ item: null, t: 0, state: 'empty' }));
    this.chopping = null; // {item, t} — the item being chopped, back in hand when done
    this.message = '';
    this.messageT = 0;
    this.nearest = null; // station id under the prompt, recomputed each frame
  }

  carryingCount() {
    return this.carryingPlate ? HANDS_MAX : this.hands.length;
  }

  canTake() {
    return !this.carryingPlate && this.hands.length < HANDS_MAX;
  }

  say(text, seconds = 1.6) {
    this.message = text;
    this.messageT = seconds;
  }

  // --- movement ---------------------------------------------------------

  move(dt, vec, target) {
    const p = this.player;
    let vx = vec.x;
    let vy = vec.y;
    if ((vx === 0 && vy === 0) && target) {
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 10) {
        vx = dx / d;
        vy = dy / d;
      } else {
        target.done = true;
      }
    }
    p.moving = vx !== 0 || vy !== 0;
    if (p.moving) p.face = vx < 0 ? -1 : vx > 0 ? 1 : p.face;
    p.x += vx * PLAYER_SPEED * dt;
    p.y += vy * PLAYER_SPEED * dt;
    // Stay on the floor, then slide out of the counters.
    p.x = Math.max(200 + PLAYER_R, Math.min(1080 - PLAYER_R, p.x));
    p.y = Math.max(FLOOR_Y + 18 + PLAYER_R, Math.min(CANVAS_H - 8 - PLAYER_R, p.y));
    for (const r of this.obstacles()) this.pushOut(p, r);
  }

  obstacles() {
    return [
      ...STATIONS.bins,
      STATIONS.board,
      STATIONS.stove,
      STATIONS.trash,
      STATIONS.assembly,
      STATIONS.serve,
    ];
  }

  pushOut(p, r) {
    const cx = Math.max(r.x, Math.min(p.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(p.y, r.y + r.h));
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    if (d >= PLAYER_R || d === 0) return;
    p.x = cx + (dx / d) * PLAYER_R;
    p.y = cy + (dy / d) * PLAYER_R;
  }

  // --- stations ---------------------------------------------------------

  nearestStation() {
    const p = this.player;
    let best = null;
    let bestD = INTERACT_RANGE;
    const check = (id, rect) => {
      const d = distToRect(p.x, p.y, rect);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    };
    for (const b of STATIONS.bins) check(`bin:${b.kind}`, b);
    check('board', STATIONS.board);
    check('stove', STATIONS.stove);
    check('trash', STATIONS.trash);
    check('assembly', STATIONS.assembly);
    check('serve', STATIONS.serve);
    return best;
  }

  // What the prompt line under the kitchen should say near this station.
  promptFor(station) {
    if (!station) return '';
    if (station.startsWith('bin:')) {
      return this.canTake() ? 'E — Ambil bahan' : 'Tangan penuh!';
    }
    if (station === 'board') {
      const item = this.hands[this.hands.length - 1];
      if (this.chopping) return 'Memotong…';
      if (item && INGREDIENTS[item.kind].chop && item.state === 'raw') return 'E — Potong';
      return 'Butuh bahan mentah yang bisa dipotong';
    }
    if (station === 'stove') {
      const free = this.burners.some((b) => b.state === 'empty');
      const ready = this.burners.some((b) => b.state === 'cooked' || b.state === 'burnt');
      const cookable = this.hands.some((i) => INGREDIENTS[i.kind].cook && i.state !== 'cooked' && i.state !== 'burnt');
      if (ready) return 'E — Angkat dari kompor';
      if (free && cookable) return 'E — Masak di kompor';
      return 'Kompor penuh / tidak ada yang bisa dimasak';
    }
    if (station === 'trash') return this.hands.length ? 'E — Buang bahan' : 'Tidak ada yang dibuang';
    if (station === 'assembly') {
      if (this.carryingPlate) return 'E — Taruh piring';
      if (this.plate.length > 0 && this.hands.length === 0) return 'E — Angkat piring';
      if (this.hands.length > 0) return 'E — Tambah ke piring';
      return 'Rakit hidangan di sini';
    }
    if (station === 'serve') {
      return this.carryingPlate ? 'E — Sajikan!' : 'Bawa piring yang sudah lengkap';
    }
    return '';
  }

  // --- the one interaction ----------------------------------------------

  // Returns an event the game can react to: {type:'served', order, pay} or
  // {type:'wrong-plate'} or null.
  interact(board) {
    const station = this.nearest;
    if (!station) return null;
    if (station.startsWith('bin:')) {
      const kind = station.slice(4);
      if (!this.canTake()) {
        this.say('Tangan penuh! (maks 3)');
        return null;
      }
      this.hands.push({ kind, state: 'raw' });
      this.sfx.pickup();
      return null;
    }
    if (station === 'board') {
      if (this.chopping) return null;
      const item = this.hands[this.hands.length - 1];
      if (item && INGREDIENTS[item.kind].chop && item.state === 'raw') {
        this.chopping = { item, t: 0 };
        this.hands.pop();
        this.sfx.chop();
        return null;
      }
      this.say('Talenan: butuh bahan mentah (ayam / sayur)');
      this.sfx.wrong();
      return null;
    }
    if (station === 'stove') {
      // Pick up a finished burner first — a burnt pan needs rescuing too.
      const doneIdx = this.burners.findIndex((b) => b.state === 'cooked' || b.state === 'burnt');
      if (doneIdx !== -1) {
        if (!this.canTake()) {
          this.say('Tangan penuh!');
          return null;
        }
        const b = this.burners[doneIdx];
        this.hands.push(b.item);
        this.burners[doneIdx] = { item: null, t: 0, state: 'empty' };
        this.sfx.pickup();
        return null;
      }
      const freeIdx = this.burners.findIndex((b) => b.state === 'empty');
      if (freeIdx === -1) {
        this.say('Kompor penuh!');
        return null;
      }
      const idx = this.hands.findIndex((i) => INGREDIENTS[i.kind].cook && i.state !== 'cooked' && i.state !== 'burnt');
      if (idx === -1) {
        this.say('Tidak ada bahan yang bisa dimasak');
        this.sfx.wrong();
        return null;
      }
      const item = this.hands.splice(idx, 1)[0];
      this.burners[freeIdx] = { item, t: 0, state: 'cooking' };
      this.sfx.cookStart();
      return null;
    }
    if (station === 'trash') {
      if (!this.hands.length) return null;
      const gone = this.hands.pop();
      this.say(`Buang ${INGREDIENTS[gone.kind].name}`);
      this.sfx.drop();
      return null;
    }
    if (station === 'assembly') {
      if (this.carryingPlate) {
        this.carryingPlate = false;
        this.sfx.drop();
        return null;
      }
      if (this.hands.length === 0) {
        if (this.plate.length > 0) {
          this.carryingPlate = true;
          this.sfx.pickup();
        }
        return null;
      }
      const item = this.hands[this.hands.length - 1];
      const key = `${item.kind}:${item.state}`;
      if (this.plate.some((p) => `${p.kind}:${p.state}` === key)) {
        this.say('Sudah ada di piring');
        return null;
      }
      this.plate.push(this.hands.pop());
      this.sfx.plate();
      return null;
    }
    if (station === 'serve') {
      if (!this.carryingPlate) {
        this.say('Bawa dulu piring yang sudah lengkap');
        return null;
      }
      const order = board.findMatch(this.plate);
      if (!order) {
        this.say('Piring ini tidak cocok dengan pesanan!');
        this.sfx.wrong();
        return { type: 'wrong-plate' };
      }
      const pay = board.serve(order);
      this.plate = [];
      this.carryingPlate = false;
      this.sfx.serve();
      return { type: 'served', order, pay };
    }
    return null;
  }

  // --- per-frame ----------------------------------------------------------

  update(dt, board) {
    if (this.messageT > 0) this.messageT -= dt;
    if (this.chopping) {
      this.chopping.t += dt;
      if (this.chopping.t >= CHOP_SECONDS) {
        const item = this.chopping.item;
        item.state = 'chopped';
        this.hands.push(item);
        this.chopping = null;
        this.sfx.chopDone();
        this.say(`${INGREDIENTS[item.kind].name} sudah dipotong`);
      }
    }
    for (const b of this.burners) {
      if (b.state === 'cooking') {
        b.t += dt;
        if (b.t >= COOK_SECONDS) {
          b.state = 'cooked';
          b.item.state = 'cooked';
          b.t = 0;
          this.sfx.cookDone();
        }
      } else if (b.state === 'cooked') {
        b.t += dt;
        if (b.t >= BURN_AFTER) {
          b.state = 'burnt';
          b.item.state = 'burnt';
          this.sfx.burnt();
          this.say('Gosong! Buang ke tempat sampah');
        }
      }
    }
    this.nearest = this.nearestStation();
  }
}

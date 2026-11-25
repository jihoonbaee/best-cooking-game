// Rasa Rush — Dapur Kilat: the order board.
// Orders arrive on a shrinking timer, live for a shrinking lifetime, and
// pay a base price plus a tip that shrinks as they age. A plate matches an
// order when it holds exactly the recipe's components — same kinds, same
// states, nothing extra. This file owns the board only: the kitchen owns the
// plate, the game owns the shift clock.

import {
  RECIPES, MAX_ORDERS, ORDER_FIRST_DELAY, ORDER_GAP_START, ORDER_GAP_END,
  ORDER_TIME_START, ORDER_TIME_END, TIP_MAX,
} from './config.js';

let nextOrderId = 1;

// A seeded RNG so staged screenshot scenes are the same every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class OrderBoard {
  constructor(rng) {
    this.rng = rng || Math.random;
    this.orders = []; // {id, recipe, timeLeft, timeMax}
    this.spawnIn = ORDER_FIRST_DELAY;
    this.served = 0;
    this.missed = 0;
    this.earned = 0;
    this.bestCombo = 0;
    this.combo = 0;
  }

  // How far into the shift we are, 0..1 — drives the rush.
  progress(elapsed, shiftSeconds) {
    return Math.min(1, elapsed / shiftSeconds);
  }

  gapAt(progress) {
    return ORDER_GAP_START + (ORDER_GAP_END - ORDER_GAP_START) * progress;
  }

  lifetimeAt(progress) {
    return ORDER_TIME_START + (ORDER_TIME_END - ORDER_TIME_START) * progress;
  }

  pickRecipe() {
    const idx = Math.floor(this.rng() * RECIPES.length);
    return RECIPES[idx];
  }

  spawn(progress) {
    if (this.orders.length >= MAX_ORDERS) return null;
    const recipe = this.pickRecipe();
    const life = this.lifetimeAt(progress);
    const order = { id: nextOrderId++, recipe, timeLeft: life, timeMax: life };
    this.orders.push(order);
    return order;
  }

  // Returns 'expired' when an order just ran out (the caller counts it).
  update(dt, progress, onExpire, onSpawn) {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const made = this.spawn(progress);
      if (made && onSpawn) onSpawn(made);
      this.spawnIn = this.gapAt(progress) * (0.85 + this.rng() * 0.3);
    }
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) {
        this.orders.splice(i, 1);
        this.missed++;
        this.combo = 0;
        if (onExpire) onExpire(o);
      }
    }
  }

  // Does this plate hold exactly the recipe's components?
  static plateMatches(plate, recipe) {
    if (plate.length !== recipe.needs.length) return false;
    const remaining = recipe.needs.map((n) => `${n.kind}:${n.state}`);
    for (const item of plate) {
      const key = `${item.kind}:${item.state}`;
      const i = remaining.indexOf(key);
      if (i === -1) return false;
      remaining.splice(i, 1);
    }
    return remaining.length === 0;
  }

  // The first active order this plate can serve, or null.
  findMatch(plate) {
    for (const o of this.orders) {
      if (OrderBoard.plateMatches(plate, o.recipe)) return o;
    }
    return null;
  }

  // Serve it: money, tip by time left, combo bonus. Returns the payout.
  serve(order) {
    const idx = this.orders.indexOf(order);
    if (idx === -1) return 0;
    this.orders.splice(idx, 1);
    const freshness = Math.max(0, order.timeLeft / order.timeMax);
    const tip = Math.round(order.recipe.price * TIP_MAX * freshness);
    const comboBonus = this.combo >= 2 ? 3 : 0;
    const pay = order.recipe.price + tip + comboBonus;
    this.earned += pay;
    this.served++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    return pay;
  }
}

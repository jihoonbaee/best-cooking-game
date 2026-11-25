// Rasa Rush — Dapur Kilat: everything the player sees.
// All art is drawn here with canvas primitives — rounded counters, tile
// floors, emoji food, a chef built from circles and arcs. No images, no
// fonts from the network, nothing the screenshots cannot show exactly as
// the game looks when played.

import {
  CANVAS_W, CANVAS_H, HUD_H, BOARD_Y, BOARD_H, FLOOR_Y, STATIONS, BURNERS,
  INGREDIENTS, STATE_LABEL, STATE_COLOR, COLORS, PLAYER_R, MAX_MISSED,
  COOK_SECONDS, BURN_AFTER, CHOP_SECONDS,
} from './config.js';
import { OrderBoard } from './orders.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function chip(ctx, x, y, w, h, bg, border) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = bg;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function diamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

export class Renderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
  }

  // --- the room -----------------------------------------------------------

  drawRoom() {
    const ctx = this.ctx;
    // Wall and floor.
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);
    ctx.fillStyle = COLORS.wallDark;
    ctx.fillRect(0, FLOOR_Y - 10, CANVAS_W, 10);
    // Warung tile floor: cream tiles over a grout bed, a deterministic
    // shade variation so the floor reads as laid tiles, and a darker
    // border course around the edge.
    ctx.fillStyle = '#d9c08a';
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
    for (let ty = 0, y = FLOOR_Y; y < CANVAS_H; y += 52, ty++) {
      for (let tx = 0, x = 0; x < CANVAS_W; x += 52, tx++) {
        const edge = tx === 0 || x + 52 >= CANVAS_W || y + 52 >= CANVAS_H;
        const alt = (tx * 7 + ty * 13) % 5 === 0;
        ctx.fillStyle = edge ? '#e3cd9c' : alt ? COLORS.floorB : COLORS.floorA;
        ctx.fillRect(x + 1, y + 1, 50, 50);
      }
    }
    // Central rug: the assembly table stands on it, so the middle of the
    // frame reads as a worked floor instead of empty tiles.
    roundRect(ctx, 440, 500, 600, 200, 14);
    ctx.fillStyle = '#9a3412';
    ctx.fill();
    roundRect(ctx, 452, 512, 576, 176, 10);
    ctx.fillStyle = '#c2410c';
    ctx.fill();
    roundRect(ctx, 464, 524, 552, 152, 8);
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    // Diamond motif on the rug's visible strips, clear of the table
    // (table: x 520-960, y 560-664).
    ctx.fillStyle = '#fde68a';
    for (const dx of [480, 610, 740, 870, 1000]) {
      diamond(ctx, dx, 530, 9);
      diamond(ctx, dx, 682, 9);
    }
    diamond(ctx, 480, 600, 9);
    diamond(ctx, 1000, 600, 9);
    // Standing menu board: the old wall menu and clock lived under the HUD
    // (y 0-92), so they move here, where the camera can see them. The
    // clock is fixed at 10:10 so staged screenshots stay deterministic.
    // Top-left of the floor, clear of the rush banner's centred text.
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(312, 300);
    ctx.lineTo(304, 318);
    ctx.moveTo(388, 300);
    ctx.lineTo(396, 318);
    ctx.stroke();
    roundRect(ctx, 300, 226, 100, 78, 6);
    ctx.fillStyle = '#78350f';
    ctx.fill();
    roundRect(ctx, 306, 232, 88, 66, 4);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
    text(ctx, 'MENU', 350, 246, 13, '#fde68a', 'bold', 'center');
    text(ctx, 'HARI INI', 350, 262, 13, '#fde68a', 'bold', 'center');
    ctx.beginPath();
    ctx.arc(350, 284, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(350, 284);
    ctx.lineTo(350 - 4, 284 - 5);
    ctx.moveTo(350, 284);
    ctx.lineTo(350 + 5, 284 - 4);
    ctx.stroke();
    // Potted plant in the bottom-left corner, clear of the bins.
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.ellipse(245, 700, 16, 22, -0.4, 0, Math.PI * 2);
    ctx.ellipse(245, 698, 16, 22, 0.4, 0, Math.PI * 2);
    ctx.ellipse(245, 696, 14, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    roundRect(ctx, 228, 712, 34, 30, 6);
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // --- HUD ------------------------------------------------------------------

  drawHud(game) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.hud;
    ctx.fillRect(0, 0, CANVAS_W, HUD_H);
    text(ctx, '🍳 RASA RUSH', 24, 30, 30, '#fbbf24');
    text(ctx, 'Dapur Kilat', 24, 62, 14, '#d1d5db', 'normal');
    const left = Math.max(0, Math.ceil(game.shiftLeft));
    const mm = Math.floor(left / 60);
    const ss = String(left % 60).padStart(2, '0');
    const urgent = left <= 30;
    text(ctx, `⏱ ${mm}:${ss}`, 330, 46, 30, urgent ? '#f87171' : '#fff', 'bold', 'center');
    text(ctx, 'SHIFT', 330, 76, 11, '#9ca3af', 'normal', 'center');
    text(ctx, `💰 Rp${game.board.earned.toLocaleString('id-ID')}`, 520, 46, 26, '#4ade80');
    text(ctx, `✅ ${game.board.served} disajikan  •  ❌ ${game.board.missed}/${MAX_MISSED} gagal`, 520, 74, 13, '#d1d5db', 'normal');
    if (game.board.combo >= 2) {
      text(ctx, `🔥 Kombo x${game.board.combo}`, 740, 46, 22, '#fb923c');
    }
    text(ctx, game.rush ? '⚠️ RUSH HOUR!' : `Rush ${Math.round(game.progress * 100)}%`, 1010, 46, 20, game.rush ? '#f87171' : '#fbbf24', 'bold', 'center');
    // Rush meter, centred under its label (the keys hint lives under the
    // canvas in the page, not in the HUD, so nothing crowds this corner).
    ctx.fillStyle = COLORS.hudLight;
    roundRect(ctx, 945, 68, 130, 10, 5);
    ctx.fill();
    ctx.fillStyle = game.rush ? '#ef4444' : '#f59e0b';
    roundRect(ctx, 945, 68, 130 * game.progress, 10, 5);
    ctx.fill();
  }

  // --- order board ----------------------------------------------------------

  drawBoard(board, kitchen) {
    const ctx = this.ctx;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, BOARD_Y, CANVAS_W, BOARD_H);
    text(ctx, '📋 PESANAN', 24, BOARD_Y + 22, 15, '#fbbf24');
    text(ctx, 'sajikan sebelum habis', 24, BOARD_Y + 44, 11, '#9ca3af', 'normal');
    const slotW = 268;
    const slotH = 84;
    for (let i = 0; i < 4; i++) {
      const x = 180 + i * (slotW + 10);
      const y = BOARD_Y + 10;
      const order = board.orders[i];
      if (!order) {
        roundRect(ctx, x, y, slotW, slotH, 10);
        ctx.fillStyle = '#1f2937';
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, '— kosong —', x + slotW / 2, y + slotH / 2, 13, '#6b7280', 'normal', 'center');
        continue;
      }
      const urgent = order.timeLeft <= 10;
      const bg = urgent ? '#7f1d1d' : '#fef3c7';
      roundRect(ctx, x, y, slotW, slotH, 10);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = urgent ? '#ef4444' : '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();
      const ink = urgent ? '#fff' : COLORS.ink;
      const sub = urgent ? '#fecaca' : COLORS.muted;
      text(ctx, order.recipe.emoji, x + 26, y + 26, 26, ink, 'normal', 'center');
      text(ctx, order.recipe.name, x + 48, y + 20, 15, ink);
      text(ctx, `Rp${order.recipe.price}`, x + slotW - 10, y + 20, 13, urgent ? '#fca5a5' : '#b45309', 'bold', 'right');
      // Countdown sits in the header's second line, clear of the chips.
      text(ctx, `${Math.ceil(order.timeLeft)} dtk`, x + slotW - 10, y + 38, 12, sub, 'bold', 'right');
      // Component chips: emoji + state word; a filled chip means the plate
      // already carries that component.
      order.recipe.needs.forEach((need, j) => {
        const cx = x + 10 + j * 84;
        const cy = y + 46;
        const have = kitchen.plate.some((p) => p.kind === need.kind && p.state === need.state);
        chip(ctx, cx, cy, 78, 30, have ? '#bbf7d0' : '#fff', have ? '#16a34a' : '#d1d5db');
        text(ctx, INGREDIENTS[need.kind].emoji, cx + 14, cy + 15, 15, '#000', 'normal', 'center');
        text(ctx, STATE_LABEL[need.state], cx + 44, cy + 15, 11, have ? '#166534' : COLORS.ink, 'bold', 'center');
      });
      // Countdown bar.
      const frac = Math.max(0, order.timeLeft / order.timeMax);
      ctx.fillStyle = urgent ? '#450a0a' : '#e5e7eb';
      roundRect(ctx, x + 10, y + slotH - 12, slotW - 20, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#16a34a' : frac > 0.25 ? '#f59e0b' : '#ef4444';
      roundRect(ctx, x + 10, y + slotH - 12, (slotW - 20) * frac, 7, 3.5);
      ctx.fill();
    }
  }

  // --- stations ---------------------------------------------------------------

  drawBins() {
    const ctx = this.ctx;
    for (const b of STATIONS.bins) {
      roundRect(ctx, b.x, b.y, b.w, b.h, 10);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = COLORS.wood;
      ctx.lineWidth = 3;
      ctx.stroke();
      text(ctx, INGREDIENTS[b.kind].emoji, b.x + 30, b.y + b.h / 2, 30, '#000', 'normal', 'center');
      text(ctx, b.label, b.x + 56, b.y + 28, 16, COLORS.ink);
      const ing = INGREDIENTS[b.kind];
      const hint = ing.chop ? 'potong' : ing.cook ? 'masak' : 'langsung';
      text(ctx, hint, b.x + 56, b.y + 52, 11, COLORS.muted, 'normal');
    }
    text(ctx, '🥬 BAHAN', 24, 222, 13, '#fff');
  }

  drawBoardStation(kitchen, now) {
    const ctx = this.ctx;
    const s = STATIONS.board;
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = '#d6a05c';
    ctx.fill();
    ctx.strokeStyle = COLORS.woodDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, '🔪 TALENAN', s.x + s.w / 2, s.y + 18, 14, '#78350f', 'bold', 'center');
    if (kitchen.chopping) {
      const item = kitchen.chopping.item;
      const frac = kitchen.chopping.t / CHOP_SECONDS;
      const bob = Math.sin(now / 60) * 4;
      text(ctx, INGREDIENTS[item.kind].emoji, s.x + 55, s.y + 55 + bob, 30, '#000', 'normal', 'center');
      text(ctx, '🔪', s.x + 105, s.y + 50 - bob, 26, '#000', 'normal', 'center');
      ctx.fillStyle = '#e5e7eb';
      roundRect(ctx, s.x + 14, s.y + s.h - 14, s.w - 28, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      roundRect(ctx, s.x + 14, s.y + s.h - 14, (s.w - 28) * frac, 8, 4);
      ctx.fill();
    } else {
      text(ctx, '🍗 🥬', s.x + s.w / 2, s.y + 55, 26, '#000', 'normal', 'center');
    }
  }

  drawStove(kitchen) {
    const ctx = this.ctx;
    const s = STATIONS.stove;
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = '#374151';
    ctx.fill();
    ctx.strokeStyle = COLORS.steelDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, '🔥 KOMPOR', s.x + s.w / 2, s.y + 18, 14, '#fbbf24', 'bold', 'center');
    kitchen.burners.forEach((b, i) => {
      const pos = BURNERS[i];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
      ctx.fillStyle = b.state === 'empty' ? '#1f2937' : b.state === 'burnt' ? '#111827' : '#4b5563';
      ctx.fill();
      ctx.strokeStyle = b.state === 'burnt' ? '#ef4444' : '#9ca3af';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (b.state === 'cooking') {
        const frac = b.t / COOK_SECONDS;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 5;
        ctx.stroke();
        text(ctx, INGREDIENTS[b.item.kind].emoji, pos.x, pos.y, 26, '#000', 'normal', 'center');
      } else if (b.state === 'cooked') {
        const frac = b.t / BURN_AFTER;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 5;
        ctx.stroke();
        text(ctx, INGREDIENTS[b.item.kind].emoji, pos.x, pos.y, 26, '#000', 'normal', 'center');
        text(ctx, '✓', pos.x + 26, pos.y - 24, 16, '#4ade80', 'bold', 'center');
      } else if (b.state === 'burnt') {
        text(ctx, INGREDIENTS[b.item.kind].emoji, pos.x, pos.y, 26, '#000', 'normal', 'center');
        text(ctx, '💨', pos.x, pos.y - 30, 18, '#000', 'normal', 'center');
        text(ctx, 'GOSONG', pos.x, pos.y + 30, 10, '#f87171', 'bold', 'center');
      } else {
        text(ctx, '＋', pos.x, pos.y, 22, '#6b7280', 'normal', 'center');
      }
    });
  }

  drawTrash() {
    const ctx = this.ctx;
    const s = STATIONS.trash;
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = '#4b5563';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, '🗑️ SAMPAH', s.x + s.w / 2, s.y + 22, 14, '#e5e7eb', 'bold', 'center');
    text(ctx, 'buang bahan', s.x + s.w / 2, s.y + 52, 12, '#9ca3af', 'normal', 'center');
    text(ctx, 'gosong di sini', s.x + s.w / 2, s.y + 70, 12, '#9ca3af', 'normal', 'center');
  }

  drawAssembly(kitchen, board) {
    const ctx = this.ctx;
    const s = STATIONS.assembly;
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = '#e7c48f';
    ctx.fill();
    ctx.strokeStyle = COLORS.woodDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, '🍽️ MEJA RAKIT', s.x + 16, s.y + 20, 14, '#78350f', 'bold');
    // The plate.
    const px = s.x + s.w / 2;
    const py = s.y + 52;
    ctx.beginPath();
    ctx.ellipse(px, py, 120, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (kitchen.plate.length === 0) {
      text(ctx, 'piring kosong — tambah bahan (E)', px, py, 13, '#9ca3af', 'normal', 'center');
    } else {
      kitchen.plate.forEach((item, i) => {
        const ix = px - (kitchen.plate.length - 1) * 34 + i * 68;
        text(ctx, INGREDIENTS[item.kind].emoji, ix, py - 2, 30, '#000', 'normal', 'center');
        ctx.fillStyle = STATE_COLOR[item.state];
        ctx.beginPath();
        ctx.arc(ix + 16, py - 16, 7, 0, Math.PI * 2);
        ctx.fill();
      });
      const match = board.findMatch(kitchen.plate);
      const complete = match !== null;
      text(
        ctx,
        complete ? `✅ SIAP SAJI — ${match.recipe.name}` : `${kitchen.plate.length}/3 bahan`,
        px,
        s.y + s.h - 12,
        13,
        complete ? '#166534' : COLORS.muted,
        'bold',
        'center',
      );
    }
  }

  drawServe(kitchen, board) {
    const ctx = this.ctx;
    const s = STATIONS.serve;
    const ready = kitchen.carryingPlate && board.findMatch(kitchen.plate);
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = ready ? '#fde68a' : '#fef3c7';
    ctx.fill();
    ctx.strokeStyle = ready ? '#f59e0b' : COLORS.woodDark;
    ctx.lineWidth = ready ? 4 : 3;
    ctx.stroke();
    text(ctx, '🔔 JENDELA SAJI', s.x + s.w / 2, s.y + 22, 15, '#78350f', 'bold', 'center');
    text(
      ctx,
      ready ? '✅ Piring cocok — sajikan! (E)' : kitchen.carryingPlate ? '⚠️ Piring ini tidak cocok' : 'antar piring lengkap ke sini',
      s.x + s.w / 2,
      s.y + 52,
      13,
      ready ? '#166534' : COLORS.muted,
      'bold',
      'center',
    );
    text(ctx, '🛎️', s.x + s.w / 2, s.y + 78, 22, '#000', 'normal', 'center');
  }

  // --- the chef -----------------------------------------------------------------

  drawPlayer(kitchen, now) {
    const ctx = this.ctx;
    const p = kitchen.player;
    const bob = kitchen.player.moving ? Math.sin(now / 90) * 2 : 0;
    // Shadow.
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + PLAYER_R - 2, 22, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();
    // Body: apron + head + toque. The head and toque scale with the body
    // so the chef keeps its proportions at the larger radius.
    ctx.beginPath();
    ctx.arc(p.x, p.y + 6 + bob, PLAYER_R - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y - 18 + bob, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#fcd9b8';
    ctx.fill();
    // Toque.
    ctx.beginPath();
    ctx.arc(p.x - 9, p.y - 29 + bob, 9, 0, Math.PI * 2);
    ctx.arc(p.x + 9, p.y - 29 + bob, 9, 0, Math.PI * 2);
    ctx.arc(p.x, p.y - 33 + bob, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Eyes look where the chef faces.
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(p.x + p.face * 5 - 4, p.y - 19 + bob, 2, 0, Math.PI * 2);
    ctx.arc(p.x + p.face * 5 + 4, p.y - 19 + bob, 2, 0, Math.PI * 2);
    ctx.fill();
    // Carried items float above the head; a plate rides in front.
    if (kitchen.carryingPlate) {
      ctx.beginPath();
      ctx.ellipse(p.x + p.face * 26, p.y + 2 + bob, 26, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.stroke();
      kitchen.plate.forEach((item, i) => {
        text(ctx, INGREDIENTS[item.kind].emoji, p.x + p.face * 26 - 16 + i * 16, p.y - 2 + bob, 15, '#000', 'normal', 'center');
      });
    } else {
      kitchen.hands.forEach((item, i) => {
        const ix = p.x - (kitchen.hands.length - 1) * 16 + i * 32;
        ctx.beginPath();
        ctx.arc(ix, p.y - 46 + bob, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.stroke();
        text(ctx, INGREDIENTS[item.kind].emoji, ix, p.y - 45 + bob, 17, '#000', 'normal', 'center');
        ctx.fillStyle = STATE_COLOR[item.state];
        ctx.beginPath();
        ctx.arc(ix + 10, p.y - 58 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // --- prompt, toast, banners ---------------------------------------------------

  drawPrompt(kitchen) {
    const ctx = this.ctx;
    const prompt = kitchen.promptFor(kitchen.nearest);
    if (!prompt) return;
    const w = ctx.measureText(prompt).width + 120;
    const x = (CANVAS_W - Math.max(260, w)) / 2;
    const y = CANVAS_H - 34;
    roundRect(ctx, x, y, Math.max(260, w), 26, 13);
    ctx.fillStyle = 'rgba(17,24,39,0.85)';
    ctx.fill();
    text(ctx, `▶ ${prompt}`, CANVAS_W / 2, y + 13, 14, '#fde68a', 'bold', 'center');
  }

  drawToast(kitchen) {
    if (kitchen.messageT <= 0 || !kitchen.message) return;
    const ctx = this.ctx;
    ctx.font = 'bold 16px system-ui, sans-serif';
    const w = ctx.measureText(kitchen.message).width + 36;
    roundRect(ctx, (CANVAS_W - w) / 2, 216, w, 34, 17);
    ctx.fillStyle = 'rgba(17,24,39,0.88)';
    ctx.fill();
    text(ctx, kitchen.message, CANVAS_W / 2, 233, 16, '#fff', 'bold', 'center');
  }

  drawRushBanner(game) {
    if (!game.rush || game.state !== 'playing') return;
    const ctx = this.ctx;
    const pulse = 0.75 + 0.25 * Math.sin(game.now / 200);
    ctx.globalAlpha = pulse;
    text(ctx, '⚠️ RUSH HOUR — PESANAN DATANG CEPAT! ⚠️', CANVAS_W / 2, 284, 22, '#ef4444', 'bold', 'center');
    ctx.globalAlpha = 1;
  }

  // --- screens --------------------------------------------------------------------

  drawTitle() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15,23,42,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, '🍳', CANVAS_W / 2, 150, 90, '#fff', 'normal', 'center');
    text(ctx, 'RASA RUSH', CANVAS_W / 2, 240, 64, '#fbbf24', 'bold', 'center');
    text(ctx, '— Dapur Kilat —', CANVAS_W / 2, 292, 26, '#fde68a', 'normal', 'center');
    text(ctx, 'Kamu koki di sebuah warung yang lagi ramai. Pesanan masuk terus —', CANVAS_W / 2, 350, 18, '#e5e7eb', 'normal', 'center');
    text(ctx, 'ambil bahan, potong, masak, rakit, lalu sajikan sebelum waktunya habis.', CANVAS_W / 2, 378, 18, '#e5e7eb', 'normal', 'center');
    const lines = [
      ['🚶', 'WASD / panah — jalan • klik lantai — jalan ke sana'],
      ['🖐️', 'E / Spasi — pakai stasiun terdekat (ambil, potong, masak, rakit, sajikan)'],
      ['🍚', 'Bahan kiri: ambil mentah • 🔪 Talenan: potong ayam & sayur'],
      ['🔥', 'Kompor: masak 4 detik — jangan sampai gosong!'],
      ['🍽️', 'Meja Rakit: susun 3 bahan jadi satu piring • 🔔 Jendela Saji: antar'],
      ['💰', 'Tip makin besar kalau sajikan cepat • 3 pesanan gagal = shift berakhir'],
    ];
    lines.forEach((l, i) => {
      text(ctx, `${l[0]}  ${l[1]}`, CANVAS_W / 2, 430 + i * 30, 16, '#d1d5db', 'normal', 'center');
    });
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
    ctx.globalAlpha = pulse;
    text(ctx, '▶ Tekan ENTER atau klik untuk mulai ◀', CANVAS_W / 2, 640, 22, '#4ade80', 'bold', 'center');
    ctx.globalAlpha = 1;
    text(ctx, 'Shift 3 menit • M = suara • P = jeda', CANVAS_W / 2, 680, 14, '#9ca3af', 'normal', 'center');
  }

  drawPaused() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, '⏸ JEDA', CANVAS_W / 2, 360, 48, '#fff', 'bold', 'center');
    text(ctx, 'Tekan P untuk lanjut', CANVAS_W / 2, 420, 18, '#d1d5db', 'normal', 'center');
  }

  drawGameOver(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15,23,42,0.86)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const title = game.board.missed >= MAX_MISSED ? '😵 SHIFT BERANTAKAN' : '🎉 SHIFT SELESAI!';
    text(ctx, title, CANVAS_W / 2, 220, 44, '#fbbf24', 'bold', 'center');
    text(ctx, `Kamu menyajikan ${game.board.served} pesanan dan gagal ${game.board.missed}.`, CANVAS_W / 2, 290, 20, '#e5e7eb', 'normal', 'center');
    text(ctx, `💰 Rp${game.board.earned.toLocaleString('id-ID')}`, CANVAS_W / 2, 350, 40, '#4ade80', 'bold', 'center');
    text(ctx, `Kombo terbaik: x${game.board.bestCombo}`, CANVAS_W / 2, 410, 18, '#fde68a', 'normal', 'center');
    const verdict =
      game.board.served >= 12 ? 'Koki bintang lima! Warung ini aman di tanganmu. ⭐⭐⭐⭐⭐'
      : game.board.served >= 7 ? 'Dapur yang rapi — pelanggan pulang senang. ⭐⭐⭐⭐'
      : game.board.served >= 4 ? 'Lumayan! Besok coba kejar kombo. ⭐⭐⭐'
      : 'Shift pertama memang berat — coba lagi, chef! ⭐⭐';
    text(ctx, verdict, CANVAS_W / 2, 450, 18, '#d1d5db', 'normal', 'center');
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
    ctx.globalAlpha = pulse;
    text(ctx, '▶ Tekan R untuk main lagi ◀', CANVAS_W / 2, 540, 22, '#4ade80', 'bold', 'center');
    ctx.globalAlpha = 1;
  }

  // --- one frame ------------------------------------------------------------------

  draw(game, now) {
    this.drawRoom();
    this.drawBoard(game.board, game.kitchen);
    this.drawBins();
    this.drawBoardStation(game.kitchen, now);
    this.drawStove(game.kitchen);
    this.drawTrash();
    this.drawAssembly(game.kitchen, game.board);
    this.drawServe(game.kitchen, game.board);
    this.drawPlayer(game.kitchen, now);
    this.drawHud(game);
    this.drawPrompt(game.kitchen);
    this.drawToast(game.kitchen);
    this.drawRushBanner(game);
    if (game.state === 'title') this.drawTitle();
    if (game.state === 'paused') this.drawPaused();
    if (game.state === 'over') this.drawGameOver(game);
  }
}

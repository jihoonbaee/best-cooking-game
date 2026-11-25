// Rasa Rush — Dapur Kilat: keyboard + mouse, nothing else.
// WASD / arrows move the chef. E or Space uses the nearest station.
// Clicking the floor sets a walk target; clicking a station in reach uses
// it. Enter starts, R restarts, P pauses, M mutes. The game reads this
// object once a frame, so keys never get stuck between frames.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered: true only on the frame a key went down
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.moveTarget = null; // {x, y} in canvas coordinates, or null

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.moveTarget = null;
    });

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse.down = true;
      this.mouse.clicked = true;
    });
    window.addEventListener('pointerup', () => {
      this.mouse.down = false;
    });
  }

  // Movement vector from held keys, normalized; {x, y} in [-1, 1].
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  // True once, on the frame the key was pressed; consumed by endFrame().
  wasPressed(...names) {
    return names.some((n) => this.pressed.has(n));
  }

  // The click the game should act on this frame, or null. Reading it clears
  // it, so one click never fires twice.
  takeClick() {
    if (!this.mouse.clicked) return null;
    this.mouse.clicked = false;
    return { x: this.mouse.x, y: this.mouse.y };
  }

  endFrame() {
    this.pressed.clear();
  }
}

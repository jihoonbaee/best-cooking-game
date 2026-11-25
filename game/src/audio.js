// Rasa Rush — Dapur Kilat: every sound is synthesized with WebAudio.
// No audio files, no network, nothing to load. The context is created on
// the first user gesture (browsers block audio before that), and M mutes.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Call from a click / keypress so the browser lets audio start.
  unlock() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // One short tone: a frequency that slides to another over `dur` seconds.
  tone(freq, to, dur, type = 'sine', gain = 0.12) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // A short burst of filtered noise — the chop, the sizzle, the trash thud.
  noise(dur, freq = 1200, gain = 0.1) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.ctx.destination);
    src.start(t0);
  }

  pickup() { this.tone(520, 780, 0.09, 'sine', 0.1); }
  drop() { this.tone(420, 300, 0.08, 'sine', 0.08); }
  chop() { this.noise(0.07, 2400, 0.14); }
  chopDone() { this.tone(660, 990, 0.12, 'triangle', 0.12); }
  cookStart() { this.noise(0.25, 900, 0.06); }
  cookDone() { this.tone(880, 880, 0.1, 'sine', 0.1); this.tone(1320, 1320, 0.12, 'sine', 0.08); }
  burnt() { this.tone(220, 110, 0.35, 'sawtooth', 0.1); }
  plate() { this.tone(740, 740, 0.08, 'triangle', 0.1); }
  serve() {
    this.tone(523, 523, 0.1, 'triangle', 0.12);
    setTimeout(() => this.tone(659, 659, 0.1, 'triangle', 0.12), 90);
    setTimeout(() => this.tone(784, 784, 0.18, 'triangle', 0.12), 180);
  }
  wrong() { this.tone(200, 160, 0.18, 'square', 0.07); }
  orderIn() { this.tone(392, 587, 0.12, 'sine', 0.09); }
  alarm() { this.tone(980, 980, 0.09, 'square', 0.06); }
  rush() { this.tone(330, 660, 0.3, 'sawtooth', 0.08); }
  over() {
    this.tone(392, 392, 0.16, 'triangle', 0.12);
    setTimeout(() => this.tone(330, 330, 0.16, 'triangle', 0.12), 160);
    setTimeout(() => this.tone(262, 262, 0.3, 'triangle', 0.12), 320);
  }
}

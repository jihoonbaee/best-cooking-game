// Rasa Rush — Dapur Kilat: the hand-in program (Node 22, standard library
// only). The game is plain static files in game/ — index.html plus its ES
// modules, no library and no network request — and this program hands them
// in: it copies game/ from beside this file into /output, decodes the
// screenshots into /output/screenshots/, and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library.
// Screenshots are real renders of the game's own code, taken in a desktop
// browser; the first by name is the cover. They are stored in the
// repository as base64 text (screenshots/*.jpg.b64) because the channel
// used to push the repository carries text only, and this program decodes
// each one back to a JPEG when it runs.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
// The screenshots live in the repository as base64 text (see the header
// note). Decode each *.jpg.b64 into /output/screenshots/ under its
// original name, before the dossier is built from them.
mkdirSync(join(out, 'screenshots'), { recursive: true });
const shotNames = readdirSync(join(here, 'screenshots'))
  .filter((n) => n.endsWith('.jpg.b64'))
  .sort();
if (shotNames.length === 0) throw new Error('no screenshots/*.jpg.b64 found');
for (const n of shotNames) {
  const b64 = readFileSync(join(here, 'screenshots', n), 'utf8').trim();
  writeFileSync(join(out, 'screenshots', n.slice(0, -4)), Buffer.from(b64, 'base64'));
}

// The gate's own caps (from the competition's rules): the dossier text is
// capped at 160 KiB; the rest refuse an entry the scorer would refuse —
// more than 4 screenshots or one over 256 KiB, more than 993 files in
// game/ or 48 MiB of game files in all, or a path under game/ over 1000
// bytes. game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json, so leave them room.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

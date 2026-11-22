// Generates a new Secret Santa draw and writes it to ../assignments.js
// Usage: node scripts/draw.mjs
// Running it again creates a brand-new draw AND a new round id, which
// automatically resets who has already looked.

import { writeFileSync } from "node:fs";
import { randomInt, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const PARTICIPANTS = ["Jan", "Charlotte", "Sienna", "Richard", "Rik", "Linda"];

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Keep shuffling until nobody draws themselves (a "derangement").
let receivers;
do {
  receivers = shuffle(PARTICIPANTS);
} while (receivers.some((r, i) => r === PARTICIPANTS[i]));

const pairs = Object.fromEntries(PARTICIPANTS.map((g, i) => [g, receivers[i]]));
const data = { round: randomBytes(6).toString("hex"), pairs };

// Light obfuscation so nobody spoils it by glancing at the source.
const encoded = Buffer.from(JSON.stringify(data)).toString("base64").split("").reverse().join("");

const out = fileURLToPath(new URL("../assignments.js", import.meta.url));
writeFileSync(
  out,
  `// Gemaakt door scripts/draw.mjs — niet spieken! 🎅\nwindow.SANTA_DATA = "${encoded}";\n`
);
console.log(`Nieuwe trekking opgeslagen (ronde ${data.round}). De lootjes blijven geheim.`);

/**
 * Every visual constant in this app is derived from one 64-character string.
 * The derivation lives here rather than in a comment so it stays checkable:
 * change SEED and the whole app re-skins itself.
 */
export const SEED =
  '1pMv6F0A48Y23KlL0TPuUGTSb1FBKrO2NUzi2bSVTwQeHeUHnDVoHI3PKR3uJiQV';

/** FNV-1a, 32-bit unsigned. Stable across runs, unlike a plain char sum. */
const fnv = text => {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

/** Map a slice of the seed onto an inclusive integer range. */
const pick = (slice, low, high) => low + (fnv(slice) % (high - low + 1));

/**
 * Four 16-character quarters, one per screen. Each quarter seeds a different
 * axis of the design, so the whole string participates rather than just a
 * hash of it.
 */
export const QUARTERS = [
  SEED.slice(0, 16),
  SEED.slice(16, 32),
  SEED.slice(32, 48),
  SEED.slice(48, 64),
];

const [COLOR, CAST, GEOMETRY, TYPE] = QUARTERS;

export const derived = {
  // Quarter 1 and 2 — hue.
  inkHue: pick(COLOR, 0, 359), // 217, a cold blue-slate
  liveHue: (pick(COLOR, 0, 359) + pick(CAST, 90, 200)) % 360, // 37, amber
  paperHue: pick(CAST, 0, 359), // 282, a faint violet cast

  // Quarter 3 — geometry.
  radius: pick(GEOMETRY, 0, 6), // 0, every corner square
  hairline: [0.5, 1, 1.5, 2][fnv(GEOMETRY) % 4], // 1pt drafted rules
  unit: pick(GEOMETRY, 6, 14), // 13pt spacing pitch

  // Quarter 4 — type.
  scale: [1.125, 1.2, 1.25, 1.333][fnv(TYPE) % 4], // 1.333, a perfect fourth
  tracking: pick(TYPE, 0, 20) / 100, // 0.18 on mono micro-labels
};

/**
 * The masthead ruling: one tick per seed character, tall where that character
 * is a digit. 13 of the 64 are, which is what gives the rule its cadence.
 */
export const TICKS = [...SEED].map(char => /[0-9]/.test(char));

/** Which 16-tick quarter a screen owns, for the masthead position indicator. */
export const quarterRange = index => [index * 16, index * 16 + 16];

import { derived } from './seed';

/** HSL -> hex, so the palette is computed from the seed hues at runtime. */
const hsl = (h, s, l) => {
  const sat = s / 100;
  const lum = l / 100;
  const k = n => (n + h / 30) % 12;
  const a = sat * Math.min(lum, 1 - lum);
  const channel = n =>
    lum - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = value =>
    Math.round(255 * value)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(channel(0))}${hex(channel(8))}${hex(channel(4))}`;
};

const { inkHue, liveHue, paperHue, unit, scale } = derived;

export const colors = {
  // Paper carries the violet cast; the field marks the measured area.
  paper: hsl(paperHue, 14, 96), // #f5f3f6
  field: hsl(paperHue, 11, 92), // #ebe8ed

  // Drafted rules, light to heavy.
  ruleFaint: hsl(inkHue, 13, 86), // #d7dae0
  rule: hsl(inkHue, 15, 74), // #b3bac7

  // Ink. 5.1:1 and 14.3:1 on paper.
  inkMuted: hsl(inkHue, 14, 42), // #5c687a
  ink: hsl(inkHue, 36, 15), // #182334

  // Amber means one thing only: the element being measured right now.
  live: hsl(liveHue, 93, 50), // #f69b09
  liveInk: hsl(liveHue, 88, 31), // #955f09, 4.9:1 on paper

  scrim: 'rgba(24, 35, 52, 0.62)',
};

/** 13pt pitch, from the seed's geometry quarter. */
export const space = {
  hair: Math.round(unit / 4), // 3
  tight: Math.round(unit / 2), // 7
  unit, // 13
  step: Math.round(unit * 1.5), // 20
  wide: unit * 2, // 26
  gulf: unit * 3, // 39
};

/** A perfect fourth off a 13pt base: 10 / 13 / 17 / 23 / 31. */
const step = n => Math.round(13 * scale ** n);
export const type = {
  micro: step(-1), // 10
  base: step(0), // 13
  mid: step(1), // 17
  large: step(2), // 23
  display: step(3), // 31
};

export const font = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

export const { radius, hairline, tracking } = derived;

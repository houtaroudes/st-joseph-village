/* Colours for the generated village.

   Dusk and night are one table rather than two scenes: each entry drives the
   sky, the fog, the exposure, every light and every material that differs, so
   the mood switch becomes a colour change on a live scene instead of a rebuild.
   The accent stays vermilion in both. */

export const PALETTE = {
  grass: 0x74855c,
  grassDark: 0x55663f,
  asphalt: 0x424852,
  concrete: 0xbdb8ad,
  wall: 0xe8e2d4,
  wallWarm: 0xdccfb8,
  roof: 0x8a5638,
  roofDark: 0x6b4232,
  wood: 0x6a4a33,
  foliage: 0x4b6b45,
  foliageLight: 0x5f7d4a,
  chapel: 0xe4dbc9,
  chapelRoof: 0x7d4436,
  gold: 0xc9a227,
  window: 0xffcf87,
};

export const MOODS = {
  dusk: {
    sky: [[0, "#2A1208"], [0.34, "#5E2412"], [0.64, "#B8501E"], [1, "#F0924A"]],
    fog: 0x6a2c14,
    exposure: 1.44,
    ambient: { c: 0xffd4b4, i: 0.72 },
    hemi: { sky: 0x9a8a90, ground: 0x615840, i: 0.95 },
    sun: { c: 0xffc48c, i: 2.45 },
    fill: { c: 0x8fa4d0, i: 0.55 },
    spot: { c: 0xff9a55, i: 78 },
    ground: 0x6e8250,
    road: 0x5a544e,
    wall: [0xf6e9d4, 0xecdec6, 0xe2dacb],
    roof: [0xa8603c, 0x7e4830, 0x776c56],
    leaf: 0x4c6438,
    leaf2: 0x5c7844,
    window: 0xffc478,
    lamp: 0xffd79c,
    door: 0xb4612f,
    plate: 0xffb268,
    glass: 0xa8c6de,
  },
  night: {
    sky: [[0, "#0A0816"], [0.42, "#141024"], [0.74, "#2A1420"], [1, "#5A2A16"]],
    fog: 0x1c1224,
    exposure: 1.72,
    ambient: { c: 0x6a7aa8, i: 0.5 },
    hemi: { sky: 0x32405e, ground: 0x22241e, i: 0.62 },
    sun: { c: 0xa8b8e0, i: 1.45 },
    fill: { c: 0x5566a0, i: 0.36 },
    spot: { c: 0xffb070, i: 130 },
    ground: 0x2c3a28,
    road: 0x2e2c2a,
    wall: [0xd0c1ac, 0xc2b19c, 0xb8b0a2],
    roof: [0x64321f, 0x52281a, 0x4e4a42],
    leaf: 0x22301f,
    leaf2: 0x2c3c26,
    window: 0xffe0a8,
    lamp: 0xfff0cc,
    door: 0x8a4a28,
    plate: 0xffd9a0,
    glass: 0x6f8bac,
  },
};

/** The mood table for a key, falling back to dusk for anything unknown. */
export const moodOf = (key) => MOODS[key] ?? MOODS.dusk;

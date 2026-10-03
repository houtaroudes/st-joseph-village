import * as THREE from "three";

/* The village layout, generated.

   Nothing here is hand-placed. A seeded PRNG walks the avenue and decides which
   house model sits on each lot; the trees then fill whatever is left over. The
   seed is fixed, so every reload produces the same village.

   This module returns plain data rather than scene objects: a row per house,
   matrices for the instanced openings and trims, lamp and tree transforms, and
   a displaced ground mesh. Turning that data into meshes is the renderer's job. */

const mulberry32 = (seed) => {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const CROSS_STREETS = [-30, -70, -106];
export const AVENUE_END = -150;
export const AVENUE_START = 30;
export const PLAZA = new THREE.Vector3(0, 0, -120);

/* ---- The village, by model ------------------------------------------
   The five house models from src/data/village.js, built for real: each has its
   own footprint, storey count, roof silhouette and amount of glazing, so the
   walkthrough passes the range a buyer can actually choose from. Invented, like
   everything else here - this is a concept village and not any real
   subdivision.

   `units` is how many attached bays the frontage is divided into (the townhouse
   is a row of three), and `glass` how many glazed openings the ground floor
   wears. Roofs are deliberately different per model: the townhouse is a flat
   parapet, because a row of pitched roofs on one building reads as one big
   house rather than three units. */
export const BUILDS = [
  { key: "Aralia", units: 3, w: 10.8, d: 7.2, h: 6.0, roof: "flat", glass: 1 },
  { key: "Ilang-Ilang", units: 1, w: 7.2, d: 7.6, h: 4.0, roof: "hip", glass: 1 },
  { key: "Sampaguita", units: 1, w: 8.4, d: 8.6, h: 6.4, roof: "gable", glass: 2 },
  { key: "Narra", units: 1, w: 10.0, d: 8.6, h: 6.9, roof: "gable", glass: 2, bay: true },
  { key: "Molave", units: 1, w: 11.2, d: 9.0, h: 7.3, roof: "hip", glass: 3, lanai: true, foyer: true },
];

/* How the five are mixed along the avenue: band 0 is the gate, band 3 is the
   chapel plaza. The townhouse is the entry model so it lines the gateway, and
   the premium corners are saved for the ridge. */
const MODEL_MIX = [
  [0.55, 0.3, 0.15, 0.0, 0.0],
  [0.1, 0.45, 0.32, 0.13, 0.0],
  [0.0, 0.12, 0.4, 0.33, 0.15],
  [0.0, 0.0, 0.15, 0.38, 0.47],
];

/* The two halls beside the plaza. Kept here so the tree scatter can avoid
   their footprints exactly as it avoids the houses. */
export const ANNEXES = [
  { x: -40, z: PLAZA.z + 6, w: 26, d: 15, h: 6.4, roofMat: "hallA" },
  { x: 40, z: PLAZA.z + 6, w: 30, d: 18, h: 7.6, roofMat: "hallB" },
];

const weightedIndex = (weights, r) => {
  let acc = 0;
  for (let i = 0; i < weights.length; i += 1) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
};

/* ---- Ground: flat plateau, rising into ridges away from it ---- */
export function buildGround() {
  const geo = new THREE.PlaneGeometry(760, 760, 96, 96);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const fx = Math.max(0, Math.abs(x) - 74);
    const fz = Math.max(0, Math.max(z - 48, -172 - z));
    const rise = Math.min((fx * fx + fz * fz) * 0.0022, 34);
    const ripple = Math.sin(x * 0.09) * Math.cos(z * 0.07) * 0.7;
    pos.setY(i, rise + ripple);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ---- The layout itself ----------------------------------------------- */
export function buildVillage() {
  const random = mulberry32(20260927);
  const Y_AXIS = new THREE.Vector3(0, 1, 0);

  const houses = [];
  const trimSlots = [];
  const windowSlots = [];
  const glassSlots = [];
  const doorSlots = [];
  const houseSpots = [];

  /* Compose a local offset and scale into a rotated house's world frame. */
  const local = (x, z, rotY, lx, ly, lz, sx, sy, sz) =>
    new THREE.Matrix4().compose(
      new THREE.Vector3(lx, 0, lz).applyAxisAngle(Y_AXIS, rotY).add(new THREE.Vector3(x, ly, z)),
      new THREE.Quaternion().setFromAxisAngle(Y_AXIS, rotY),
      new THREE.Vector3(sx, sy, sz)
    );

  const addHouse = (x, z, rotY, build, wallIdx, roofIdx) => {
    const { units, w, d, h, roof, glass } = build;
    const storeys = h > 5.2 ? 2 : 1;
    const floorH = h / storeys;
    const front = d / 2;

    houses.push({ x, z, rotY, build, wallIdx, roofIdx });

    // Plinth: a low skirt so the house sits on the lot instead of in it.
    trimSlots.push(local(x, z, rotY, 0, 0.16, 0, w + 0.55, 0.32, d + 0.55));
    // Eave band just under the roof, slightly proud of the walls.
    trimSlots.push(local(x, z, rotY, 0, h + 0.34, 0, w + 0.7, 0.3, d + 0.7));

    if (roof === "flat") {
      // Parapet, not a pitch - the townhouse row keeps one clean roofline.
      trimSlots.push(local(x, z, rotY, 0, h + 0.62, 0, w + 0.45, 0.55, d + 0.45));
    }

    // Molave's covered lanai: a slab on two posts across the frontage.
    if (build.lanai) {
      trimSlots.push(local(x, z, rotY, w * 0.2, 3.2, front + 1.6, w * 0.46, 0.3, 2.8));
      [-1, 1].forEach((s) =>
        trimSlots.push(local(x, z, rotY, w * 0.2 + s * w * 0.2, 1.6, front + 2.7, 0.3, 3.2, 0.3))
      );
    }

    houseSpots.push({ x, z, r: Math.max(w, d) * 0.9 });

    /* Openings, one bay per attached unit: a canopy and step over the door, a
       band of glazing beside it, and lit windows above on the second storey. */
    const bw = w / units;
    // Party walls, so an attached row reads as separate homes.
    for (let u = 1; u < units; u += 1) {
      trimSlots.push(local(x, z, rotY, -w / 2 + bw * u, h / 2 + 0.3, 0, 0.24, h + 0.45, d + 0.45));
    }
    for (let u = 0; u < units; u += 1) {
      const cx = -w / 2 + bw * (u + 0.5);
      const doorX = cx + bw * 0.38;

      doorSlots.push(local(x, z, rotY, doorX, 1.45, front + 0.05, 1.0, 2.3, 0.16));
      trimSlots.push(local(x, z, rotY, doorX, 2.72, front + 0.4, 1.75, 0.18, 1.15));
      // Concrete path from the door out toward the street.
      trimSlots.push(local(x, z, rotY, doorX, 0.1, front + 2.3, 1.6, 0.14, 4.4));

      for (let g = 0; g < glass; g += 1) {
        const gx = cx - bw * 0.1 + (g - (glass - 1) / 2) * (bw * 0.28);
        glassSlots.push(
          local(x, z, rotY, gx, 0.3 + floorH * 0.58, front + 0.06, bw * 0.26, floorH * 0.6, 1)
        );
      }

      if (storeys > 1) {
        [-0.19, 0.19].forEach((o) => {
          windowSlots.push(
            local(x, z, rotY, cx + bw * o, 0.3 + floorH * 1.52, front + 0.06, bw * 0.3, floorH * 0.44, 1)
          );
        });
      }
    }
  };

  const nearestStreetFacing = (x, z) => {
    // Face the avenue if it is closer than any cross street, else face that street.
    const toAvenue = Math.abs(x);
    let best = { dist: toAvenue, rot: x > 0 ? -Math.PI / 2 : Math.PI / 2 };
    CROSS_STREETS.forEach((cz) => {
      const dist = Math.abs(z - cz);
      if (dist < best.dist) {
        best = { dist, rot: z > cz ? 0 : Math.PI };
      }
    });
    return best.rot;
  };

  const bands = [
    [26, CROSS_STREETS[0]],
    [CROSS_STREETS[0], CROSS_STREETS[1]],
    [CROSS_STREETS[1], CROSS_STREETS[2]],
    [CROSS_STREETS[2], AVENUE_END],
  ];
  const COLUMNS = [13.5, 27, 40, 53, 66];

  bands.forEach(([zTop, zBottom], band) => {
    COLUMNS.forEach((col) => {
      const step = 9.6;
      for (let z = zTop - 8; z > zBottom + 5; z -= step) {
        if (random() < 0.1) continue; // gaps where a lot is still bare
        const x = col;
        // Weighted along the avenue, then nudged by how far out the column
        // sits: the outer columns back onto the ridge and take the next model
        // up, the innermost takes the next one down.
        let pick = weightedIndex(MODEL_MIX[band], random());
        if (col >= 53) pick = Math.min(BUILDS.length - 1, pick + 1);
        else if (col <= 13.5) pick = Math.max(0, pick - 1);
        const build = BUILDS[pick];
        const wallIdx = Math.floor(random() * 3);
        const roofIdx = Math.floor(random() * 3);
        [-1, 1].forEach((side) => {
          addHouse(
            x * side + (random() - 0.5) * 0.6,
            z + (random() - 0.5) * 0.9,
            nearestStreetFacing(x, z),
            build,
            wallIdx,
            roofIdx
          );
        });
      }
    });
  });

  /* The halls count as occupied ground too, so no tree grows inside one. */
  ANNEXES.forEach((a) => houseSpots.push({ x: a.x, z: a.z, r: Math.max(a.w, a.d) * 0.7 }));

  /* ---- Street lamps ------------------------------------------------- */
  const lamps = [];
  for (let z = 24; z > AVENUE_END; z -= 17) {
    lamps.push([-6.2, z], [6.2, z]);
  }

  /* ---- Trees, scattered around the built area ----------------------- */
  const treePositions = [];
  for (let i = 0; i < 900 && treePositions.length < 260; i += 1) {
    const x = (random() - 0.5) * 176;
    const z = 40 - random() * 210;
    if (Math.abs(x) < 7.5) continue; // avenue
    if (CROSS_STREETS.some((cz) => Math.abs(z - cz) < 5.5)) continue; // cross streets
    if (x * x + (z - PLAZA.z) * (z - PLAZA.z) < 24 * 24) continue; // plaza
    if (houseSpots.some((h) => (h.x - x) ** 2 + (h.z - z) ** 2 < (h.r + 3.4) ** 2)) continue;
    treePositions.push([x, z, 0.8 + random() * 0.7]);
  }

  const trunks = [];
  const leavesA = [];
  const leavesB = [];
  treePositions.forEach(([x, z, s], i) => {
    trunks.push(
      new THREE.Matrix4().makeTranslation(x, 1.3 * s, z).multiply(new THREE.Matrix4().makeScale(s, s, s))
    );
    const leaf = new THREE.Matrix4()
      .makeTranslation(x, (1.6 + 2.3) * s, z)
      .multiply(new THREE.Matrix4().makeScale(s, s, s));
    // Two leaf materials, split so a stand of trees is not one flat colour.
    if (i % 3 === 0) leavesA.push(leaf);
    else leavesB.push(leaf);
  });

  return { houses, trimSlots, windowSlots, glassSlots, doorSlots, houseSpots, lamps, trunks, leavesA, leavesB };
}

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ============================================================
   The village, generated.

   There is not a single image, video or audio file in this scene. The
   ground, the avenue, the houses, the chapel, the gate arch and the trees
   are all built from geometry and light at mount time; scroll progress
   walks a camera path through the result.

   That is deliberate. A real subdivision page is built out of renders and
   drone footage, and this build has none of those — so instead of faking
   them with stock photography of somewhere else, the world is generated.
   Nothing here misrepresents a real place, and there is nothing to license.

   Props:
     progressRef — ref holding 0..1 scroll progress for the sticky story
     quality     — "high" | "low"; low drops the pixel ratio and the
                   continuous loop, so the scene redraws only when the
                   scroll moves it (phones, small viewports)
     onFail      — called if WebGL is unavailable, so the parent can show
                   the static poster instead
   ============================================================ */

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/* Deterministic layout — the same village every reload. */
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTE = {
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

const CROSS_STREETS = [-30, -70, -106];
const AVENUE_END = -150;
const PLAZA = new THREE.Vector3(0, 0, -120);

/* Dusk and night. One table drives sky, fog, exposure, every light and
   every material that differs, so the mood switch is a colour change
   rather than a second scene. The accent stays vermilion in both. */
const MOODS = {
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

/* ---- The village, by model ------------------------------------------
   The five house models from src/data/village.js, built for real: each
   has its own footprint, storey count, roof silhouette and amount of
   glazing, so the walkthrough passes the range a buyer can actually
   choose from. Invented, like everything else here — this is a concept
   village and not any real subdivision.

   `units` is how many attached bays the frontage is divided into (the
   townhouse is a row of three), and `glass` how many glazed openings the
   ground floor wears. Roofs are deliberately different per model: the
   townhouse is a flat parapet, because a row of pitched roofs on one
   building reads as one big house rather than three units. */
const BUILDS = [
  { key: "Aralia", units: 3, w: 10.8, d: 7.2, h: 6.0, roof: "flat", glass: 1 },
  { key: "Ilang-Ilang", units: 1, w: 7.2, d: 7.6, h: 4.0, roof: "hip", glass: 1 },
  { key: "Sampaguita", units: 1, w: 8.4, d: 8.6, h: 6.4, roof: "gable", glass: 2 },
  { key: "Narra", units: 1, w: 10.0, d: 8.6, h: 6.9, roof: "gable", glass: 2, bay: true },
  { key: "Molave", units: 1, w: 11.2, d: 9.0, h: 7.3, roof: "hip", glass: 3, lanai: true, foyer: true },
];

/* How the five are mixed along the avenue: band 0 is the gate, band 3 is
   the chapel plaza. The townhouse is the entry model so it lines the
   gateway, and the premium corners are saved for the ridge. */
const MODEL_MIX = [
  [0.55, 0.3, 0.15, 0.0, 0.0],
  [0.1, 0.45, 0.32, 0.13, 0.0],
  [0.0, 0.12, 0.4, 0.33, 0.15],
  [0.0, 0.0, 0.15, 0.38, 0.47],
];

const weightedIndex = (weights, r) => {
  let acc = 0;
  for (let i = 0; i < weights.length; i += 1) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
};

export default function VillageScene({ progressRef, quality = "high", mood = "dusk", onFail }) {
  const hostRef = useRef(null);
  /* The scene is rebuilt only when quality or failure changes. The mood is
     applied to the live scene through this handle so flipping dusk/night
     does not tear down and rebuild the whole world. */
  const apiRef = useRef(null);
  const moodRef = useRef(mood);
  // Synced outside render; declared before the scene effect so the build
  // reads the current mood on mount.
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: quality === "high",
        powerPreference: "high-performance",
        alpha: false,
      });
    } catch {
      onFail?.();
      return undefined;
    }
    if (!renderer || !renderer.getContext()) {
      onFail?.();
      return undefined;
    }

    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };

    /* Two different things: a low-power tier (phones, small viewports,
       coarse pointers) still has to follow the scroll, while a
       reduced-motion preference asks for no camera movement at all.
       Conflating them froze the cinematic scroll on every phone. */
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lowPower = quality === "low" || prefersReduced;
    const continuous = !lowPower;
    const coarse =
      typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.2 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.44;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    /* ---- Scene, sky, atmosphere ---------------------------------- */
    const scene = new THREE.Scene();
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 2;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext("2d");
    const skyTexture = track(new THREE.CanvasTexture(skyCanvas));
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    const paintSky = (stops) => {
      const g = skyCtx.createLinearGradient(0, 0, 0, 512);
      stops.forEach(([at, hex]) => g.addColorStop(at, hex));
      skyCtx.fillStyle = g;
      skyCtx.fillRect(0, 0, 2, 512);
      skyTexture.needsUpdate = true;
    };
    scene.background = skyTexture;
    scene.fog = new THREE.Fog(0x6a2c14, 150, 600);
    paintSky(MOODS.dusk.sky);

    const camera = new THREE.PerspectiveCamera(
      44,
      1,
      0.5,
      1200
    );

    /* ---- Light: a low ember sun behind the ridge, plus a pointer light -- */
    const ambient = new THREE.AmbientLight(0xffd4b4, 0.72);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0x9a8a90, 0x615840, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffc48c, 2.45);
    sun.position.set(-110, 42, 74);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fa4d0, 0.55);
    fill.position.set(80, 30, -90);
    scene.add(fill);
    /* A warm ember that rides just ahead of the camera and tracks the
       cursor, so moving the pointer lights the village up rather than just
       nudging the camera. This is the pointer half of the behaviour
       contract — the rest of the scene reacts, not only the view. */
    /* Wider, softer falloff than a physical lamp (decay 1.15) so the light
       reaches the road and the nearest facades instead of a hot spot in the
       middle of the avenue. It is on for every device, coarse pointers
       included — on touch it centres itself ahead of the camera. */
    const spot = new THREE.PointLight(0xff9a55, 0, 170, 1.2);
    spot.position.set(0, 20, 0);
    scene.add(spot);

    /* ---- Ground: flat plateau, rising into ridges away from it ---- */
    const groundGeo = track(new THREE.PlaneGeometry(760, 760, 96, 96));
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const fx = Math.max(0, Math.abs(x) - 74);
      const fz = Math.max(0, Math.max(z - 48, -172 - z));
      const rise = Math.min((fx * fx + fz * fz) * 0.0022, 34);
      const ripple = Math.sin(x * 0.09) * Math.cos(z * 0.07) * 0.7;
      pos.setY(i, rise + ripple);
    }
    groundGeo.computeVertexNormals();
    const groundMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.grass, roughness: 1, metalness: 0 }));
    scene.add(new THREE.Mesh(groundGeo, groundMat));

    /* ---- Roads ---------------------------------------------------- */
    const roadMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.asphalt, roughness: 0.95 }));
    const curbMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.concrete, roughness: 0.85 }));

    const addRoad = (w, d, x, z) => {
      const geo = track(new THREE.PlaneGeometry(w, d));
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(x, 0.03, z);
      scene.add(mesh);
    };
    addRoad(9, Math.abs(AVENUE_END - 30), 0, (30 + AVENUE_END) / 2);
    CROSS_STREETS.forEach((z) => addRoad(112, 7, 0, z));

    const addCurb = (x, z, len) => {
      const geo = track(new THREE.BoxGeometry(0.45, 0.3, len));
      const mesh = new THREE.Mesh(geo, curbMat);
      mesh.position.set(x, 0.15, z);
      scene.add(mesh);
    };
    const avenueLen = Math.abs(AVENUE_END - 30);
    addCurb(-4.7, (30 + AVENUE_END) / 2, avenueLen);
    addCurb(4.7, (30 + AVENUE_END) / 2, avenueLen);

    // Plaza in front of the chapel
    const plazaGeo = track(new THREE.CircleGeometry(21, 48));
    plazaGeo.rotateX(-Math.PI / 2);
    const plazaMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.concrete, roughness: 0.9 }));
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(PLAZA.x, 0.035, PLAZA.z);
    scene.add(plaza);

    /* ---- Buildings ------------------------------------------------
       A house is now a plinth, walls, an overhanging eave and a gable or
       hip roof, with the windows and doors drawn as instanced meshes. That
       is a lot more architecture than a box with a pyramid on it, but as
       every repeated part is instanced the extra detail costs no extra
       draw calls — only the walls and the roof stay one mesh per house. */
    const wallMats = [
      track(new THREE.MeshStandardMaterial({ color: PALETTE.wall, roughness: 0.85 })),
      track(new THREE.MeshStandardMaterial({ color: PALETTE.wallWarm, roughness: 0.85 })),
      track(new THREE.MeshStandardMaterial({ color: 0xd6d2c4, roughness: 0.85 })),
    ];
    const roofMats = [
      track(new THREE.MeshStandardMaterial({ color: PALETTE.roof, roughness: 0.8 })),
      track(new THREE.MeshStandardMaterial({ color: PALETTE.roofDark, roughness: 0.8 })),
      track(new THREE.MeshStandardMaterial({ color: 0x7d6a52, roughness: 0.8 })),
    ];
    const trimMat = track(new THREE.MeshStandardMaterial({ color: 0xe8dfcc, roughness: 0.9 }));
    /* Doors read as timber, not as lamps: a warm solid with a faint
       emissive lift, so a facade is not a row of glowing slabs. */
    const doorMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xb4612f,
        roughness: 0.7,
        emissive: 0x3a1405,
        emissiveIntensity: 1,
      })
    );

    const bodyGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const roofGeo = track(new THREE.ConeGeometry(1, 1, 4)); // hip roof / tower spire
    const windowGeo = track(new THREE.PlaneGeometry(1, 1));
    const windowMat = track(
      new THREE.MeshBasicMaterial({ color: PALETTE.window, toneMapped: false })
    );
    /* Glazing is the opposite of the lit windows: a cool, low-roughness
       surface that catches the sun and the pointer light rather than
       glowing on its own, so the facades read as glass, not lamps. */
    const glassMat = track(
      new THREE.MeshStandardMaterial({ color: 0xa8c6de, roughness: 0.14, metalness: 0.32 })
    );

    /* A gable roof: a triangular prism, ridge running along +Z, unit base
       and unit height, so it can be scaled to any roof span. */
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-0.5, 0);
    gableShape.lineTo(0.5, 0);
    gableShape.lineTo(0, 1);
    gableShape.closePath();
    const gableGeo = track(new THREE.ExtrudeGeometry(gableShape, { depth: 1, bevelEnabled: false }));
    gableGeo.translate(0, 0, -0.5);
    gableGeo.computeVertexNormals();

    const windowSlots = [];
    const glassSlots = [];
    const doorSlots = [];
    const trimSlots = [];
    const houseSpots = [];
    const random = mulberry32(20260927);
    const Y_AXIS = new THREE.Vector3(0, 1, 0);

    /* Compose a local offset and scale into a rotated house's world frame. */
    const local = (x, z, rotY, lx, ly, lz, sx, sy, sz) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(lx, 0, lz).applyAxisAngle(Y_AXIS, rotY).add(new THREE.Vector3(x, ly, z)),
        new THREE.Quaternion().setFromAxisAngle(Y_AXIS, rotY),
        new THREE.Vector3(sx, sy, sz)
      );

    const addHouse = (x, z, rotY, build, wallIdx, roofIdx) => {
      const { units, w, d, h, roof, glass, bay, lanai, foyer } = build;
      const storeys = h > 5.2 ? 2 : 1;
      const floorH = h / storeys;
      const front = d / 2;

      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotY;

      // Plinth: a low skirt so the house sits on the lot instead of in it.
      trimSlots.push(local(x, z, rotY, 0, 0.16, 0, w + 0.55, 0.32, d + 0.55));

      const body = new THREE.Mesh(bodyGeo, wallMats[wallIdx]);
      body.scale.set(w, h, d);
      body.position.y = h / 2 + 0.3;
      group.add(body);

      // Molave's two-storey foyer, raised clear of the main roofline.
      if (foyer) {
        const fh = h + 1.3;
        const f = new THREE.Mesh(bodyGeo, wallMats[(wallIdx + 2) % wallMats.length]);
        f.scale.set(w * 0.32, fh, d * 0.28);
        f.position.set(-w * 0.34, fh / 2 + 0.3, d * 0.34);
        group.add(f);
      }

      // Narra's ground-floor bay window, pushed proud of the facade.
      if (bay) {
        const b = new THREE.Mesh(bodyGeo, wallMats[(wallIdx + 1) % wallMats.length]);
        b.scale.set(w * 0.32, floorH * 0.86, 1.3);
        b.position.set(w * 0.27, 0.3 + floorH * 0.5, front + 0.6);
        group.add(b);
      }

      // Eave band just under the roof, slightly proud of the walls.
      trimSlots.push(local(x, z, rotY, 0, h + 0.34, 0, w + 0.7, 0.3, d + 0.7));

      if (roof === "flat") {
        // Parapet, not a pitch — the townhouse row keeps one clean roofline.
        trimSlots.push(local(x, z, rotY, 0, h + 0.62, 0, w + 0.45, 0.55, d + 0.45));
      } else if (roof === "gable") {
        // Ridge along the depth, so the gable end addresses the street.
        const roofMesh = new THREE.Mesh(gableGeo, roofMats[roofIdx]);
        roofMesh.scale.set(w + 1.1, Math.min(w, d) * 0.4, d + 1.1);
        roofMesh.position.y = h + 0.49;
        group.add(roofMesh);
      } else {
        const roofMesh = new THREE.Mesh(roofGeo, roofMats[roofIdx]);
        const span = Math.max(w, d) * 1.06;
        roofMesh.scale.set(span, Math.min(w, d) * 0.32, span);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = h + 0.49 + Math.min(w, d) * 0.16;
        group.add(roofMesh);
      }

      // Molave's covered lanai: a slab on two posts across the frontage.
      if (lanai) {
        trimSlots.push(local(x, z, rotY, w * 0.2, 3.2, front + 1.6, w * 0.46, 0.3, 2.8));
        [-1, 1].forEach((s) =>
          trimSlots.push(local(x, z, rotY, w * 0.2 + s * w * 0.2, 1.6, front + 2.7, 0.3, 3.2, 0.3))
        );
      }

      scene.add(group);
      houseSpots.push({ x, z, r: Math.max(w, d) * 0.9 });

      /* Openings, one bay per attached unit: a canopy and step over the
         door, a band of glazing beside it, and lit windows above on the
         second storey. */
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
          // sits — the outer columns back onto the ridge and take the next
          // model up, the innermost takes the next one down.
          let pick = weightedIndex(MODEL_MIX[band], random());
          if (col >= 53) pick = Math.min(BUILDS.length - 1, pick + 1);
          else if (col <= 13.5) pick = Math.max(0, pick - 1);
          const build = BUILDS[pick];
          const wallIdx = Math.floor(random() * wallMats.length);
          const roofIdx = Math.floor(random() * roofMats.length);
          [-1, 1].forEach((side) => {
            addHouse(
              x * side + (random() - 0.5) * 0.6,
              z + (random() - 0.5) * 0.9,
              nearestStreetFacing(x, z),
              build, wallIdx, roofIdx
            );
          });
        }
      });
    });

    const windows = new THREE.InstancedMesh(windowGeo, windowMat, windowSlots.length);
    windowSlots.forEach((m, i) => windows.setMatrixAt(i, m));
    windows.instanceMatrix.needsUpdate = true;
    scene.add(windows);

    const glazing = new THREE.InstancedMesh(windowGeo, glassMat, glassSlots.length);
    glassSlots.forEach((m, i) => glazing.setMatrixAt(i, m));
    glazing.instanceMatrix.needsUpdate = true;
    scene.add(glazing);

    const doors = new THREE.InstancedMesh(bodyGeo, doorMat, doorSlots.length);
    doorSlots.forEach((m, i) => doors.setMatrixAt(i, m));
    doors.instanceMatrix.needsUpdate = true;
    scene.add(doors);

    const trims = new THREE.InstancedMesh(bodyGeo, trimMat, trimSlots.length);
    trimSlots.forEach((m, i) => trims.setMatrixAt(i, m));
    trims.instanceMatrix.needsUpdate = true;
    scene.add(trims);

    /* ---- Chapel — the emotional centre of the plan ---------------- */
    const chapel = new THREE.Group();
    chapel.position.set(PLAZA.x, 0, PLAZA.z + 4);
    const chapelW = 15;
    const chapelD = 24;
    const chapelH = 8.5;

    const chapelBody = new THREE.Mesh(bodyGeo, track(new THREE.MeshStandardMaterial({ color: PALETTE.chapel, roughness: 0.8 })));
    chapelBody.scale.set(chapelW, chapelH, chapelD);
    chapelBody.position.y = chapelH / 2;
    chapel.add(chapelBody);

    // A nave wants a gable, not a pyramid: ridge running the long way (Z).
    const chapelRoofMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.chapelRoof, roughness: 0.75 }));
    const chapelRoof = new THREE.Mesh(gableGeo, chapelRoofMat);
    chapelRoof.scale.set(chapelW * 1.08, 6, chapelD * 1.04);
    chapelRoof.position.y = chapelH;
    chapel.add(chapelRoof);

    // Bell tower at the front (+Z) face
    const towerH = 20;
    const tower = new THREE.Mesh(bodyGeo, chapelBody.material);
    tower.scale.set(5, towerH, 5);
    tower.position.set(0, towerH / 2, chapelD / 2 - 1);
    chapel.add(tower);

    const spire = new THREE.Mesh(roofGeo, chapelRoof.material);
    spire.scale.set(5.4, 6, 5.4);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(0, towerH + 3, chapelD / 2 - 1);
    chapel.add(spire);

    const goldMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.35, metalness: 0.6 }));
    const crossV = new THREE.Mesh(track(new THREE.BoxGeometry(0.4, 3.6, 0.4)), goldMat);
    crossV.position.set(0, towerH + 7.8, chapelD / 2 - 1);
    chapel.add(crossV);
    const crossH = new THREE.Mesh(track(new THREE.BoxGeometry(2, 0.4, 0.4)), goldMat);
    crossH.position.set(0, towerH + 8.4, chapelD / 2 - 1);
    chapel.add(crossH);

    // Arched doorway glow
    const door = new THREE.Mesh(track(new THREE.PlaneGeometry(4.2, 6)), doorMat);
    door.position.set(0, 3, chapelD / 2 + 0.06);
    chapel.add(door);
    scene.add(chapel);

    /* ---- Clubhouse + covered court beside the plaza ---------------- */
    const annexes = [
      { x: -40, z: PLAZA.z + 6, w: 26, d: 15, h: 6.4, roof: PALETTE.roofDark },
      { x: 40, z: PLAZA.z + 6, w: 30, d: 18, h: 7.6, roof: 0x5c6b74 },
    ];
    annexes.forEach((a) => {
      const g = new THREE.Group();
      g.position.set(a.x, 0, a.z);
      const b = new THREE.Mesh(bodyGeo, wallMats[0]);
      b.scale.set(a.w, a.h, a.d);
      b.position.y = a.h / 2;
      g.add(b);
      /* Gable ridge along the longer side. The prism's ridge runs local +Z,
         so a wide hall needs a quarter turn for the ridge to face the right way. */
      const ridgeAlongX = a.w >= a.d;
      const across = Math.min(a.w, a.d) * 1.14;
      const ridge = Math.max(a.w, a.d) * 0.99;
      const r = new THREE.Mesh(gableGeo, track(new THREE.MeshStandardMaterial({ color: a.roof, roughness: 0.8 })));
      r.scale.set(across, a.h * 0.5, ridge);
      if (ridgeAlongX) r.rotation.y = Math.PI / 2;
      r.position.y = a.h;
      g.add(r);
      scene.add(g);
      houseSpots.push({ x: a.x, z: a.z, r: Math.max(a.w, a.d) * 0.7 });
    });

    /* ---- Gate arch at the entrance --------------------------------- */
    const gate = new THREE.Group();
    gate.position.set(0, 0, 30);
    const stoneMat = track(new THREE.MeshStandardMaterial({ color: 0xd9cfba, roughness: 0.9 }));
    [-8, 8].forEach((x) => {
      const pillar = new THREE.Mesh(bodyGeo, stoneMat);
      pillar.scale.set(2.2, 9, 2.6);
      pillar.position.set(x, 4.5, 0);
      gate.add(pillar);
      const cap = new THREE.Mesh(bodyGeo, goldMat);
      cap.scale.set(2.6, 0.35, 3);
      cap.position.set(x, 9.2, 0);
      gate.add(cap);
    });
    const beam = new THREE.Mesh(bodyGeo, stoneMat);
    beam.scale.set(18.2, 2.1, 2.4);
    beam.position.set(0, 10.2, 0);
    gate.add(beam);

    // Name plate, drawn to a canvas at runtime — no image asset.
    const plate = document.createElement("canvas");
    plate.width = 1024;
    plate.height = 180;
    const pctx = plate.getContext("2d");
    pctx.clearRect(0, 0, plate.width, plate.height);
    // Drawn in white and tinted per mood through the material, so switching
    // dusk/night does not mean re-rasterising the plate.
    pctx.fillStyle = "#ffffff";
    pctx.textAlign = "center";
    pctx.textBaseline = "middle";
    pctx.font = "600 74px 'Space Grotesk', system-ui, sans-serif";
    pctx.fillText("ST. JOSEPH VILLAGE", plate.width / 2, plate.height / 2 - 6);
    pctx.font = "500 26px 'Plus Jakarta Sans', system-ui, sans-serif";
    pctx.fillStyle = "rgba(255,255,255,0.75)";
    pctx.fillText("SAN PEDRO  ·  LAGUNA", plate.width / 2, plate.height - 26);
    const plateTexture = track(new THREE.CanvasTexture(plate));
    plateTexture.colorSpace = THREE.SRGBColorSpace;
    const plateMat = track(new THREE.MeshBasicMaterial({ map: plateTexture, transparent: true, toneMapped: false }));
    const plateMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(16, 2.8)), plateMat);
    plateMesh.position.set(0, 10.2, 1.28);
    gate.add(plateMesh);

    const guard = new THREE.Mesh(bodyGeo, wallMats[1]);
    guard.scale.set(6, 4.2, 5);
    guard.position.set(13.5, 2.1, 0.5);
    gate.add(guard);
    scene.add(gate);

    /* ---- Street lamps, instanced ---------------------------------- */
    const lampPositions = [];
    for (let z = 24; z > AVENUE_END; z -= 17) {
      lampPositions.push([-6.2, z], [6.2, z]);
    }
    const poleGeo = track(new THREE.CylinderGeometry(0.14, 0.18, 5.6, 6));
    const poleMat = track(new THREE.MeshStandardMaterial({ color: 0x4a4f56, roughness: 0.7, metalness: 0.3 }));
    const globGeo = track(new THREE.SphereGeometry(0.42, 10, 8));
    const globMat = track(new THREE.MeshBasicMaterial({ color: 0xffe0a8, toneMapped: false }));
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampPositions.length);
    const globes = new THREE.InstancedMesh(globGeo, globMat, lampPositions.length);
    lampPositions.forEach(([x, z], i) => {
      poles.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 2.8, z));
      globes.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 5.75, z));
    });
    poles.instanceMatrix.needsUpdate = true;
    globes.instanceMatrix.needsUpdate = true;
    scene.add(poles, globes);

    /* ---- Trees, instanced, scattered around the built area -------- */
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
    const trunkGeo = track(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 5));
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.wood, roughness: 1 }));
    const leafGeo = track(new THREE.ConeGeometry(1.7, 4.6, 7));
    const leafMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.foliage, roughness: 1, flatShading: true }));
    const leafMat2 = track(new THREE.MeshStandardMaterial({ color: PALETTE.foliageLight, roughness: 1, flatShading: true }));
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
    const leavesA = new THREE.InstancedMesh(leafGeo, leafMat, treePositions.length);
    const leavesB = new THREE.InstancedMesh(leafGeo, leafMat2, treePositions.length);
    let aCount = 0;
    let bCount = 0;
    treePositions.forEach(([x, z, s], i) => {
      trunks.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 1.3 * s, z).multiply(new THREE.Matrix4().makeScale(s, s, s)));
      const leaves = new THREE.Matrix4()
        .makeTranslation(x, (1.6 + 2.3) * s, z)
        .multiply(new THREE.Matrix4().makeScale(s, s, s));
      if (i % 3 === 0 && bCount < treePositions.length) {
        leavesA.setMatrixAt(aCount++, leaves);
      } else if (bCount < treePositions.length) {
        leavesB.setMatrixAt(bCount++, leaves);
      }
    });
    leavesA.count = aCount;
    leavesB.count = bCount;
    trunks.instanceMatrix.needsUpdate = true;
    leavesA.instanceMatrix.needsUpdate = true;
    leavesB.instanceMatrix.needsUpdate = true;
    scene.add(trunks, leavesA, leavesB);

    /* ---- Camera path --------------------------------------------- */
    const camPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(46, 11, 96),
      new THREE.Vector3(22, 7, 66),
      new THREE.Vector3(3.2, 3.4, 42),
      new THREE.Vector3(0, 3.0, 17),
      new THREE.Vector3(0, 5.5, -14),
      new THREE.Vector3(0, 15, -50),
      new THREE.Vector3(0, 27, -94),
      new THREE.Vector3(0, 36, -144),
    ]);
    const targetPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 7, 36),
      new THREE.Vector3(0, 6, 20),
      new THREE.Vector3(0, 4.2, 2),
      new THREE.Vector3(0, 3.6, -18),
      new THREE.Vector3(0, 3.2, -54),
      new THREE.Vector3(0, 4.5, -94),
      new THREE.Vector3(0, 6.5, -118),
      new THREE.Vector3(0, 9, -152),
    ]);

    const camPos = new THREE.Vector3();
    const camTarget = new THREE.Vector3();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    /* ---- Sizing ---------------------------------------------------- */
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ---- Mood ------------------------------------------------------- */
    let currentMood = MOODS[moodRef.current] ? moodRef.current : "dusk";
    const applyMood = (key) => {
      const m = MOODS[key] || MOODS.dusk;
      currentMood = key;
      paintSky(m.sky);
      scene.fog.color.setHex(m.fog);
      renderer.toneMappingExposure = m.exposure;
      ambient.color.setHex(m.ambient.c);
      ambient.intensity = m.ambient.i;
      hemi.color.setHex(m.hemi.sky);
      hemi.groundColor.setHex(m.hemi.ground);
      hemi.intensity = m.hemi.i;
      sun.color.setHex(m.sun.c);
      sun.intensity = m.sun.i;
      fill.color.setHex(m.fill.c);
      fill.intensity = m.fill.i;
      spot.color.setHex(m.spot.c);
      spot.intensity = m.spot.i;
      groundMat.color.setHex(m.ground);
      roadMat.color.setHex(m.road);
      m.wall.forEach((c, i) => wallMats[i]?.color.setHex(c));
      m.roof.forEach((c, i) => roofMats[i]?.color.setHex(c));
      leafMat.color.setHex(m.leaf);
      leafMat2.color.setHex(m.leaf2);
      windowMat.color.setHex(m.window);
      glassMat.color.setHex(m.glass);
      globMat.color.setHex(m.lamp);
      doorMat.color.setHex(m.door);
      plateMat.color.setHex(m.plate);
    };
    apiRef.current = {
      setMood: (key) => {
        applyMood(key);
        /* Repaint immediately. In low-power mode the loop only redraws when
           the scroll or the pointer moves, so without this the flip would sit
           invisible until you scrolled. `draw` is declared later in this
           effect but is only ever called from React effects, after mount. */
        draw(clamp(progressRef?.current ?? 0), 0);
      },
    };
    applyMood(currentMood);

    /* ---- Render loop ----------------------------------------------
       Three modes, depending on the device and the user's preference:
         reduced motion — one composed still, the camera never moves
         low power      — draw only when the scroll progress changed
         full           — continuous loop with drift and pointer parallax
    ---------------------------------------------------------------- */
    let raf = 0;
    let running = true;
    let visible = true;
    let elapsed = 0;
    let last = performance.now();
    let lastT = -1;
    let lastPX = 0;
    let lastPY = 0;

    const applyCamera = (t, time) => {
      camPath.getPointAt(t, camPos);
      targetPath.getPointAt(t, camTarget);
      if (continuous) {
        camPos.y += Math.sin(time * 0.22) * 0.35;
        camPos.x += Math.sin(time * 0.16) * 1.1;
        if (!coarse) {
          pointer.x += (pointer.tx - pointer.x) * 0.05;
          pointer.y += (pointer.ty - pointer.y) * 0.05;
          camPos.x += pointer.x * 5.5;
          camPos.y += pointer.y * 2.6;
        }
      }
      // The ember rides just ahead of the camera and tracks the cursor,
      // drifting gently so it reads as a living light rather than a fixed lamp.
      spot.position.set(
        camPos.x + pointer.tx * 34,
        15.5 + Math.sin(time * 0.5) * 1.6,
        camPos.z - 30
      );
      camera.position.copy(camPos);
      camera.lookAt(camTarget);
      // A whisper of roll keeps the flight from feeling mechanical.
      camera.rotateZ(Math.sin(t * Math.PI * 2) * 0.012);
    };

    const draw = (t, time) => {
      applyCamera(t, time);
      renderer.render(scene, camera);
    };

    const frame = () => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      elapsed += (now - last) / 1000;
      last = now;
      if (!visible) return;
      draw(clamp(progressRef?.current ?? 0), elapsed);
    };

    const onDemand = () => {
      raf = requestAnimationFrame(onDemand);
      if (!visible) return;
      const t = clamp(progressRef?.current ?? 0);
      const scrolled = Math.abs(t - lastT) >= 0.0006;
      const moved = Math.abs(pointer.tx - lastPX) >= 0.01 || Math.abs(pointer.ty - lastPY) >= 0.01;
      if (!scrolled && !moved) return;
      lastT = t;
      lastPX = pointer.tx;
      lastPY = pointer.ty;
      draw(t, 0);
    };

    // The pointer is tracked in every non-reduced mode: on desktop it drives
    // parallax, on touch it still moves the ember light across the village.
    if (!prefersReduced) {
      const onPointer = (e) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      host.__cleanupPointer = () => window.removeEventListener("pointermove", onPointer);
    }

    if (prefersReduced) {
      // A composed still of the village, partway down the avenue.
      draw(0.62, 0);
    } else if (continuous) {
      raf = requestAnimationFrame(frame);
    } else {
      draw(clamp(progressRef?.current ?? 0), 0);
      raf = requestAnimationFrame(onDemand);
    }

    // Stop drawing when the canvas leaves the viewport or the tab is hidden.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(host);
    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running && continuous) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ---- Teardown: everything released ----------------------------- */
    return () => {
      cancelAnimationFrame(raf);
      running = false;
      apiRef.current = null;
      host.__cleanupPointer?.();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((obj) => {
        if (obj.isMesh || obj.isInstancedMesh) {
          obj.geometry?.dispose?.();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m?.dispose?.());
        }
      });
      skyTexture.dispose();
      plateTexture.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [progressRef, quality, onFail, moodRef, apiRef]);

  /* Re-tint the live scene instead of rebuilding it. */
  useEffect(() => {
    apiRef.current?.setMood?.(mood);
  }, [mood, apiRef]);

  return <div ref={hostRef} className="village-canvas" aria-hidden="true" />;
}

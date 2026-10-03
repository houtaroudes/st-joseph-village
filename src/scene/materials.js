import * as THREE from "three";
import { PALETTE } from "./moods";

/* Every surface in the village, created once and shared. The houses and the
   repeated street furniture are drawn through a handful of instanced meshes, so
   the material count stays flat no matter how many homes the layout makes. */

/** The gate's name plate, drawn to a canvas at runtime: no image asset. It is
    drawn in white and tinted per mood through the material colour, so switching
    dusk/night never re-rasterises it. */
function createPlateTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 74px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("ST. JOSEPH VILLAGE", canvas.width / 2, canvas.height / 2 - 6);
  ctx.font = "500 26px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("SAN PEDRO  ·  LAGUNA", canvas.width / 2, canvas.height - 26);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMaterials() {
  const standard = (color, extra) => new THREE.MeshStandardMaterial({ color, ...extra });

  const mats = {
    ground: standard(PALETTE.grass, { roughness: 1, metalness: 0 }),
    road: standard(PALETTE.asphalt, { roughness: 0.95 }),
    curb: standard(PALETTE.concrete, { roughness: 0.85 }),
    plaza: standard(PALETTE.concrete, { roughness: 0.9 }),

    walls: [
      standard(PALETTE.wall, { roughness: 0.85 }),
      standard(PALETTE.wallWarm, { roughness: 0.85 }),
      standard(0xd6d2c4, { roughness: 0.85 }),
    ],
    roofs: [
      standard(PALETTE.roof, { roughness: 0.8 }),
      standard(PALETTE.roofDark, { roughness: 0.8 }),
      standard(0x7d6a52, { roughness: 0.8 }),
    ],
    trim: standard(0xe8dfcc, { roughness: 0.9 }),

    /* Doors read as timber, not as lamps: a warm solid with a faint emissive
       lift, so a facade is not a row of glowing slabs. */
    door: standard(0xb4612f, { roughness: 0.7, emissive: 0x3a1405, emissiveIntensity: 1 }),

    /* Lit windows are the one unlit surface: they should read as light, so
       they ignore tone mapping rather than catching it. */
    window: new THREE.MeshBasicMaterial({ color: PALETTE.window, toneMapped: false }),

    /* Glazing is the opposite: a cool, low-roughness surface that catches the
       sun and the pointer light instead of glowing on its own. */
    glass: standard(0xa8c6de, { roughness: 0.14, metalness: 0.32 }),

    trunk: standard(PALETTE.wood, { roughness: 1 }),
    leaf: standard(PALETTE.foliage, { roughness: 1, flatShading: true }),
    leaf2: standard(PALETTE.foliageLight, { roughness: 1, flatShading: true }),

    pole: standard(0x4a4f56, { roughness: 0.7, metalness: 0.3 }),
    globe: new THREE.MeshBasicMaterial({ color: 0xffe0a8, toneMapped: false }),

    chapel: standard(PALETTE.chapel, { roughness: 0.8 }),
    chapelRoof: standard(PALETTE.chapelRoof, { roughness: 0.75 }),
    gold: standard(PALETTE.gold, { roughness: 0.35, metalness: 0.6 }),
    stone: standard(0xd9cfba, { roughness: 0.9 }),

    /* The two halls keep their own roof colours, which no mood touches. */
    hallA: standard(PALETTE.roofDark, { roughness: 0.8 }),
    hallB: standard(0x5c6b74, { roughness: 0.8 }),

    plate: new THREE.MeshBasicMaterial({ map: createPlateTexture(), transparent: true, toneMapped: false }),
  };

  return mats;
}

/* Push a mood over the live materials. This is the whole of the dusk/night
   switch on the world itself: no material is recreated and no mesh rebuilt. */
export function applyMood(mats, m) {
  mats.ground.color.setHex(m.ground);
  mats.road.color.setHex(m.road);
  m.wall.forEach((c, i) => mats.walls[i]?.color.setHex(c));
  m.roof.forEach((c, i) => mats.roofs[i]?.color.setHex(c));
  mats.leaf.color.setHex(m.leaf);
  mats.leaf2.color.setHex(m.leaf2);
  mats.window.color.setHex(m.window);
  mats.glass.color.setHex(m.glass);
  mats.globe.color.setHex(m.lamp);
  mats.door.color.setHex(m.door);
  mats.plate.color.setHex(m.plate);
}

export function disposeMaterials(mats) {
  mats.plate.map?.dispose();
  Object.values(mats).forEach((value) => {
    if (Array.isArray(value)) value.forEach((mat) => mat.dispose());
    else value.dispose?.();
  });
}

/** The full shape of a gable roof: a triangular prism, ridge along +Z, unit
    base and unit height, so it can be scaled to any roof span. */
export function createGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const gable = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  gable.translate(0, 0, -0.5);
  gable.computeVertexNormals();

  return {
    body: new THREE.BoxGeometry(1, 1, 1),
    hip: new THREE.ConeGeometry(1, 1, 4),
    opening: new THREE.PlaneGeometry(1, 1),
    gable,
    pole: new THREE.CylinderGeometry(0.14, 0.18, 5.6, 6),
    globe: new THREE.SphereGeometry(0.42, 10, 8),
    trunk: new THREE.CylinderGeometry(0.2, 0.3, 2.6, 5),
    leaf: new THREE.ConeGeometry(1.7, 4.6, 7),
  };
}

export function disposeGeometry(geo) {
  Object.values(geo).forEach((item) => item.dispose());
}

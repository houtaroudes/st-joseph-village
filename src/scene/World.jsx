import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { moodOf } from "./moods";
import {
  applyMood,
  createGeometry,
  createMaterials,
  disposeGeometry,
  disposeMaterials,
} from "./materials";
import {
  ANNEXES,
  AVENUE_END,
  AVENUE_START,
  CROSS_STREETS,
  PLAZA,
  buildGround,
  buildVillage,
} from "./plan";

/* The world, as a tree of components.

   Everything below is built from geometry and light at mount time: no images,
   no models, no audio. Every repeated part (openings, trims, poles, trees) goes
   through one instanced mesh, so the extra architectural detail costs no extra
   draw calls. */

const AVENUE_LEN = Math.abs(AVENUE_END - AVENUE_START);
const AVENUE_MID = (AVENUE_START + AVENUE_END) / 2;

/** Every material in the village, created once and re-tinted when the mood
    changes rather than rebuilt. */
function useMaterials(mood) {
  const mats = useMemo(() => createMaterials(), []);
  useLayoutEffect(() => {
    applyMood(mats, moodOf(mood));
  }, [mats, mood]);
  useEffect(() => () => disposeMaterials(mats), [mats]);
  return mats;
}

function useGeometry() {
  const geometry = useMemo(() => createGeometry(), []);
  useEffect(() => () => disposeGeometry(geometry), [geometry]);
  return geometry;
}

/* ---- Sky and atmosphere ----------------------------------------------
   The gradient is drawn to a 2px-wide canvas and stretched, which is cheaper
   than a shader and still gives the sky a real horizon. Fog matches the mood so
   the ridges dissolve into the same colour the sky ends on. */
function Sky({ mood }) {
  const scene = useThree((state) => state.scene);
  const { texture, paint } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const paintStops = (stops) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      stops.forEach(([at, hex]) => gradient.addColorStop(at, hex));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2, 512);
      tex.needsUpdate = true;
    };
    return { texture: tex, paint: paintStops };
  }, []);

  useLayoutEffect(() => {
    paint(moodOf(mood).sky);
  }, [mood, paint]);

  useEffect(() => {
    scene.background = texture;
    return () => {
      scene.background = null;
      texture.dispose();
    };
  }, [scene, texture]);

  return <fog attach="fog" args={[moodOf(mood).fog, 150, 600]} />;
}

/* ---- Light: a low ember sun behind the ridge, plus a cool fill ------------
   Every colour and intensity here comes from the mood table, so flipping
   dusk/night is a prop change on four lights rather than a rebuild. */
function Lights({ mood }) {
  const m = moodOf(mood);
  return (
    <>
      <ambientLight color={m.ambient.c} intensity={m.ambient.i} />
      <hemisphereLight color={m.hemi.sky} groundColor={m.hemi.ground} intensity={m.hemi.i} />
      <directionalLight color={m.sun.c} intensity={m.sun.i} position={[-110, 42, 74]} />
      <directionalLight color={m.fill.c} intensity={m.fill.i} position={[80, 30, -90]} />
    </>
  );
}

/** Exposure is the one renderer setting the mood owns. */
function Exposure({ mood }) {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    gl.toneMappingExposure = moodOf(mood).exposure;
  }, [gl, mood]);
  return null;
}

/** One instanced mesh, fed a list of matrices. The count is written after the
    matrices so a shorter list can never render stale instances. */
function Instanced({ geometry, material, matrices }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.count = matrices.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere?.();
  }, [matrices]);
  return <instancedMesh ref={ref} args={[geometry, material, Math.max(matrices.length, 1)]} />;
}

function Ground({ mats, geometry }) {
  return <mesh geometry={geometry} material={mats.ground} />;
}

function Roads({ mats }) {
  return (
    <group>
      <mesh material={mats.road} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, AVENUE_MID]}>
        <planeGeometry args={[9, AVENUE_LEN]} />
      </mesh>
      {CROSS_STREETS.map((z) => (
        <mesh key={z} material={mats.road} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, z]}>
          <planeGeometry args={[112, 7]} />
        </mesh>
      ))}
      {[-4.7, 4.7].map((x) => (
        <mesh key={x} material={mats.curb} position={[x, 0.15, AVENUE_MID]}>
          <boxGeometry args={[0.45, 0.3, AVENUE_LEN]} />
        </mesh>
      ))}
      {/* Plaza in front of the chapel */}
      <mesh material={mats.plaza} rotation={[-Math.PI / 2, 0, 0]} position={[PLAZA.x, 0.035, PLAZA.z]}>
        <circleGeometry args={[21, 48]} />
      </mesh>
    </group>
  );
}

/* A house is a plinth and an eave band drawn as instanced trims, a scaled box
   for the walls, and a gable, a hip or a flat parapet for the roof. */
function House({ x, z, rotY, build, wallIdx, roofIdx, mats, geo }) {
  const { w, d, h, roof } = build;
  const storeys = h > 5.2 ? 2 : 1;
  const floorH = h / storeys;
  const front = d / 2;

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh
        geometry={geo.body}
        material={mats.walls[wallIdx]}
        scale={[w, h, d]}
        position={[0, h / 2 + 0.3, 0]}
      />
      {/* Molave's two-storey foyer, raised clear of the main roofline. */}
      {build.foyer && (
        <mesh
          geometry={geo.body}
          material={mats.walls[(wallIdx + 2) % 3]}
          scale={[w * 0.32, h + 1.3, d * 0.28]}
          position={[-w * 0.34, (h + 1.3) / 2 + 0.3, d * 0.34]}
        />
      )}
      {/* Narra's ground-floor bay window, pushed proud of the facade. */}
      {build.bay && (
        <mesh
          geometry={geo.body}
          material={mats.walls[(wallIdx + 1) % 3]}
          scale={[w * 0.32, floorH * 0.86, 1.3]}
          position={[w * 0.27, 0.3 + floorH * 0.5, front + 0.6]}
        />
      )}
      {roof === "gable" && (
        <mesh
          geometry={geo.gable}
          material={mats.roofs[roofIdx]}
          scale={[w + 1.1, Math.min(w, d) * 0.4, d + 1.1]}
          position={[0, h + 0.49, 0]}
        />
      )}
      {roof === "hip" && (
        <mesh
          geometry={geo.hip}
          material={mats.roofs[roofIdx]}
          scale={[Math.max(w, d) * 1.06, Math.min(w, d) * 0.32, Math.max(w, d) * 1.06]}
          rotation={[0, Math.PI / 4, 0]}
          position={[0, h + 0.49 + Math.min(w, d) * 0.16, 0]}
        />
      )}
    </group>
  );
}

function Houses({ mats, geo, village }) {
  return (
    <>
      {village.houses.map((house, i) => (
        <House key={`${house.build.key}-${i}`} {...house} mats={mats} geo={geo} />
      ))}
      <Instanced geometry={geo.opening} material={mats.window} matrices={village.windowSlots} />
      <Instanced geometry={geo.opening} material={mats.glass} matrices={village.glassSlots} />
      <Instanced geometry={geo.body} material={mats.door} matrices={village.doorSlots} />
      <Instanced geometry={geo.body} material={mats.trim} matrices={village.trimSlots} />
    </>
  );
}

/* ---- Chapel: the emotional centre of the plan ------------------------ */
function Chapel({ mats, geo }) {
  const w = 15;
  const d = 24;
  const h = 8.5;
  const towerH = 20;
  const towerZ = d / 2 - 1;

  return (
    <group position={[PLAZA.x, 0, PLAZA.z + 4]}>
      <mesh geometry={geo.body} material={mats.chapel} scale={[w, h, d]} position={[0, h / 2, 0]} />
      {/* A nave wants a gable, not a pyramid: ridge running the long way (Z). */}
      <mesh
        geometry={geo.gable}
        material={mats.chapelRoof}
        scale={[w * 1.08, 6, d * 1.04]}
        position={[0, h, 0]}
      />
      <mesh geometry={geo.body} material={mats.chapel} scale={[5, towerH, 5]} position={[0, towerH / 2, towerZ]} />
      <mesh
        geometry={geo.hip}
        material={mats.chapelRoof}
        scale={[5.4, 6, 5.4]}
        rotation={[0, Math.PI / 4, 0]}
        position={[0, towerH + 3, towerZ]}
      />
      <mesh geometry={geo.body} material={mats.gold} scale={[0.4, 3.6, 0.4]} position={[0, towerH + 7.8, towerZ]} />
      <mesh geometry={geo.body} material={mats.gold} scale={[2, 0.4, 0.4]} position={[0, towerH + 8.4, towerZ]} />
      {/* Arched doorway glow */}
      <mesh material={mats.door} position={[0, 3, d / 2 + 0.06]}>
        <planeGeometry args={[4.2, 6]} />
      </mesh>
    </group>
  );
}

/* ---- Clubhouse and covered court beside the plaza -------------------- */
function Halls({ mats, geo }) {
  return (
    <group>
      {ANNEXES.map((a) => (
        <group key={a.x} position={[a.x, 0, a.z]}>
          <mesh geometry={geo.body} material={mats.walls[0]} scale={[a.w, a.h, a.d]} position={[0, a.h / 2, 0]} />
          {/* The prism's ridge runs local +Z, so a wide hall needs a quarter
              turn for the ridge to face the right way. */}
          <mesh
            geometry={geo.gable}
            material={mats[a.roofMat]}
            scale={[Math.min(a.w, a.d) * 1.14, a.h * 0.5, Math.max(a.w, a.d) * 0.99]}
            rotation={[0, a.w >= a.d ? Math.PI / 2 : 0, 0]}
            position={[0, a.h, 0]}
          />
        </group>
      ))}
    </group>
  );
}

/* ---- Gate arch at the entrance --------------------------------------- */
function Gate({ mats, geo }) {
  return (
    <group position={[0, 0, AVENUE_START]}>
      {[-8, 8].map((x) => (
        <group key={x}>
          <mesh geometry={geo.body} material={mats.stone} scale={[2.2, 9, 2.6]} position={[x, 4.5, 0]} />
          <mesh geometry={geo.body} material={mats.gold} scale={[2.6, 0.35, 3]} position={[x, 9.2, 0]} />
        </group>
      ))}
      <mesh geometry={geo.body} material={mats.stone} scale={[18.2, 2.1, 2.4]} position={[0, 10.2, 0]} />
      <mesh material={mats.plate} position={[0, 10.2, 1.28]}>
        <planeGeometry args={[16, 2.8]} />
      </mesh>
      <mesh geometry={geo.body} material={mats.walls[1]} scale={[6, 4.2, 5]} position={[13.5, 2.1, 0.5]} />
    </group>
  );
}

function Lamps({ mats, geo, lamps }) {
  const poles = useMemo(() => lamps.map(([x, z]) => new THREE.Matrix4().makeTranslation(x, 2.8, z)), [lamps]);
  const globes = useMemo(() => lamps.map(([x, z]) => new THREE.Matrix4().makeTranslation(x, 5.75, z)), [lamps]);
  return (
    <>
      <Instanced geometry={geo.pole} material={mats.pole} matrices={poles} />
      <Instanced geometry={geo.globe} material={mats.globe} matrices={globes} />
    </>
  );
}

function Trees({ mats, geo, village }) {
  return (
    <>
      <Instanced geometry={geo.trunk} material={mats.trunk} matrices={village.trunks} />
      <Instanced geometry={geo.leaf} material={mats.leaf} matrices={village.leavesA} />
      <Instanced geometry={geo.leaf} material={mats.leaf2} matrices={village.leavesB} />
    </>
  );
}

export default function World({ mood }) {
  const mats = useMaterials(mood);
  const geo = useGeometry();
  const ground = useMemo(() => buildGround(), []);
  const village = useMemo(() => buildVillage(), []);
  useEffect(() => () => ground.dispose(), [ground]);

  return (
    <>
      <Sky mood={mood} />
      <Exposure mood={mood} />
      <Lights mood={mood} />
      <Ground mats={mats} geometry={ground} />
      <Roads mats={mats} />
      <Houses mats={mats} geo={geo} village={village} />
      <Chapel mats={mats} geo={geo} />
      <Halls mats={mats} geo={geo} />
      <Gate mats={mats} geo={geo} />
      <Lamps mats={mats} geo={geo} lamps={village.lamps} />
      <Trees mats={mats} geo={geo} village={village} />
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import World from "../scene/World";
import CameraRig from "../scene/CameraRig";

/* The village as a react-three-fiber canvas.

   The scene graph lives in src/scene/World, built from components rather than
   assembled by hand, and the flight through it lives in src/scene/CameraRig.
   This file owns the canvas itself and the render-loop tiers:

     reduced motion - one composed still, the camera never moves
     low power      - a frame only when the scroll or the pointer changed
     full           - a continuous loop with drift and pointer parallax

   The tiers map onto the canvas frameloop: everything except the full loop runs
   on demand, so a phone draws nothing until the page asks it to.

   Props:
     progressRef - ref holding 0..1 scroll progress for the sticky story
     quality     - "high" | "low"; low caps the pixel ratio and drops the loop
     mood        - "dusk" | "night", applied to the live scene without a rebuild
     onFail      - called when WebGL is unavailable, so the parent can show the
                   static poster instead
*/

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/** Nothing renders on demand until something asks for a frame, so nudge out the
    first one once the scene is mounted. */
function InvalidateOnce() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

/** The low-power half of the loop: watch the scroll progress and the pointer on
    the animation frame, and ask for a draw only when one of them actually
    moved. A frame costs nothing when the page is still. */
function ScrollDriver({ progressRef, enabled }) {
  const invalidate = useThree((state) => state.invalidate);
  const pointer = useThree((state) => state.pointer);

  useEffect(() => {
    if (!enabled) return undefined;
    let raf = 0;
    let lastT = -1;
    let lastPX = 0;
    let lastPY = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clamp(progressRef?.current ?? 0);
      const moved = Math.abs(pointer.x - lastPX) >= 0.01 || Math.abs(pointer.y - lastPY) >= 0.01;
      if (Math.abs(t - lastT) < 0.0006 && !moved) return;
      lastT = t;
      lastPX = pointer.x;
      lastPY = pointer.y;
      invalidate();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, invalidate, pointer, progressRef]);

  return null;
}

export default function VillageScene({ progressRef, quality = "high", mood = "dusk", onFail }) {
  const hostRef = useRef(null);
  const [supported] = useState(webglAvailable);
  // Derived once at mount: both are properties of the device, not of anything
  // that changes later.
  const [prefersReduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  const [coarse] = useState(() => window.matchMedia?.("(pointer: coarse)").matches ?? false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  /* Two different things: a low-power tier still has to follow the scroll, while
     a reduced-motion preference asks for no camera movement at all. Conflating
     them froze the cinematic scroll on every phone. */
  const reduced = prefersReduced;
  const continuous = !prefersReduced && quality !== "low";
  const visible = onScreen && tabVisible;

  useEffect(() => {
    if (!supported) onFail?.();
  }, [supported, onFail]);

  // Stop drawing when the canvas leaves the viewport or the tab is hidden.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(host);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!supported) return <div ref={hostRef} className="village-canvas" aria-hidden="true" />;

  return (
    <div ref={hostRef} className="village-canvas" aria-hidden="true">
      <Canvas
        frameloop={continuous && visible ? "always" : "demand"}
        dpr={Math.min(window.devicePixelRatio || 1, reduced || quality === "low" ? 1.2 : 1.75)}
        gl={{ antialias: quality === "high", powerPreference: "high-performance", alpha: false }}
        camera={{ fov: 44, near: 0.5, far: 1200, position: [0, 3, 17] }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <World mood={mood} />
        <CameraRig
          progressRef={progressRef}
          mood={mood}
          continuous={continuous}
          coarse={coarse}
          reduced={reduced}
        />
        <ScrollDriver progressRef={progressRef} enabled={!continuous && !reduced && visible} />
        <InvalidateOnce />
      </Canvas>
    </div>
  );
}

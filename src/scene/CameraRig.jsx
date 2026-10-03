import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { moodOf } from "./moods";

/* The flight through the village.

   Scroll progress picks a point on a Catmull-Rom path, and the target path is
   walked in step so the camera always has something to look at. The ember light
   rides just ahead of the camera and tracks the cursor, so moving the pointer
   lights the village up rather than only nudging the view. */

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

const CAMERA_PATH = [
  new THREE.Vector3(46, 11, 96),
  new THREE.Vector3(22, 7, 66),
  new THREE.Vector3(3.2, 3.4, 42),
  new THREE.Vector3(0, 3.0, 17),
  new THREE.Vector3(0, 5.5, -14),
  new THREE.Vector3(0, 15, -50),
  new THREE.Vector3(0, 27, -94),
  new THREE.Vector3(0, 36, -144),
];

const TARGET_PATH = [
  new THREE.Vector3(0, 7, 36),
  new THREE.Vector3(0, 6, 20),
  new THREE.Vector3(0, 4.2, 2),
  new THREE.Vector3(0, 3.6, -18),
  new THREE.Vector3(0, 3.2, -54),
  new THREE.Vector3(0, 4.5, -94),
  new THREE.Vector3(0, 6.5, -118),
  new THREE.Vector3(0, 9, -152),
];

export default function CameraRig({ progressRef, mood, continuous, coarse, reduced }) {
  const camera = useThree((state) => state.camera);
  const ember = useRef(null);
  const smooth = useRef({ x: 0, y: 0 });
  const paths = useMemo(
    () => ({
      camera: new THREE.CatmullRomCurve3(CAMERA_PATH),
      target: new THREE.CatmullRomCurve3(TARGET_PATH),
    }),
    []
  );
  const position = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const spot = moodOf(mood).spot;

  useFrame((state) => {
    // Reduced motion asks for no camera movement at all, so it holds a composed
    // still of the avenue instead of following the scroll.
    const t = reduced ? 0.62 : clamp(progressRef?.current ?? 0);
    const time = state.clock.elapsedTime;

    paths.camera.getPointAt(t, position);
    paths.target.getPointAt(t, look);

    if (continuous) {
      position.y += Math.sin(time * 0.22) * 0.35;
      position.x += Math.sin(time * 0.16) * 1.1;
      if (!coarse) {
        smooth.current.x += (state.pointer.x - smooth.current.x) * 0.05;
        smooth.current.y += (state.pointer.y - smooth.current.y) * 0.05;
        position.x += smooth.current.x * 5.5;
        position.y += smooth.current.y * 2.6;
      }
    }

    camera.position.copy(position);
    camera.lookAt(look);
    // A whisper of roll keeps the flight from feeling mechanical.
    camera.rotateZ(Math.sin(t * Math.PI * 2) * 0.012);

    if (ember.current) {
      ember.current.position.set(
        position.x + state.pointer.x * 34,
        15.5 + Math.sin(time * 0.5) * 1.6,
        position.z - 30
      );
    }
  });

  return (
    <pointLight
      ref={ember}
      color={spot.c}
      intensity={spot.i}
      distance={170}
      decay={1.2}
      position={[0, 20, 0]}
    />
  );
}

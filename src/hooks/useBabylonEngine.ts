import { useEffect, useRef, useState } from "react";
import { Engine, Scene, ArcRotateCamera, Vector3, Color4, Color3 } from "@babylonjs/core";

/**
 * useBabylonEngine
 *
 * ELI5: Think of this like a chef running a kitchen.
 *   - The "Engine" is the kitchen itself (talks to the GPU).
 *   - The "Scene" is the dining room (holds all 3D objects).
 *   - The render loop is the chef cooking a new frame 60 times per second.
 *   - The ResizeObserver is the chef adjusting the plating when the table changes size.
 *   - The cleanup function turns off the kitchen when you leave.
 *
 * @param canvasRef  - A React ref pointing to the <canvas> element to draw on.
 * @returns          - { scene } — the live Babylon.js Scene (null until canvas mounts).
 */
export function useBabylonEngine(
  canvasRef: React.RefObject<HTMLCanvasElement>
): { scene: Scene | null } {
  // scene is stored as state so React re-renders when it becomes available
  const [scene, setScene] = useState<Scene | null>(null);

  // We keep a ref to the engine so we can dispose it in the cleanup function
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    // Safety check — if the canvas isn't mounted yet, do nothing
    if (!canvas) return;

    // ── Step 1: Create the Engine ────────────────────────────────────────────
    // Engine is the GPU driver. It takes the <canvas> element and an
    // antialiasing flag (true = smoother edges).
    // preserveDrawingBuffer: true is required for GLB export to work later.
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true, // needed for HighlightLayer in Phase 6
    });
    engineRef.current = engine;

    // ── Step 2: Create the Scene ─────────────────────────────────────────────
    // The Scene is the container for everything: meshes, lights, cameras.
    // Think of it as the 3D world itself.
    const newScene = new Scene(engine);
    
    // Clear color to a nice dark grey
    newScene.clearColor = new Color4(0.12, 0.12, 0.12, 1);

    // ── Step 2a: Add a Camera ────────────────────────────────────────────────
    // ArcRotateCamera is a "turntable" camera. It orbits around a specific
    // target point.
    // Parameters: name, alpha (rotation around Y), beta (up/down angle), radius (distance), target, scene
    const camera = new ArcRotateCamera(
      "MainCamera",
      Math.PI / 4, // 45 degrees
      Math.PI / 3, // slightly looking down
      10, // distance from center
      Vector3.Zero(), // looking at center of the world (0,0,0)
      newScene
    );
    
    // Attach the camera to the canvas so mouse/touch events move it
    camera.attachControl(canvas, true);
    
    // Limits — don't let the user zoom in too close or go under the floor
    camera.minZ = 0.1;
    camera.wheelPrecision = 50; // makes scroll wheel zooming smoother

    // ── Step 2b: Add Environment Lighting ────────────────────────────────────
    // A 3D model looks flat and ugly without lights. The easiest way to get
    // realistic PBR (Physically Based Rendering) lighting is a default environment.
    newScene.createDefaultEnvironment({
      createSkybox: true,
      skyboxSize: 1000,
      skyboxColor: new Color3(0.15, 0.15, 0.15),
      createGround: true,
      groundSize: 1000,
      groundColor: new Color3(0.2, 0.2, 0.2),
      enableGroundShadow: true,
    });

    // Store the scene in state so other components can use it
    setScene(newScene);

    // ── Step 3: Start the Render Loop ────────────────────────────────────────
    // Tells Babylon to call scene.render() as fast as possible (up to 60fps).
    // Without this, nothing would ever appear on screen.
    engine.runRenderLoop(() => {
      newScene.render();
    });

    // ── Step 4: Watch for Window Resize ──────────────────────────────────────
    // When the browser window (or panel) resizes, the canvas pixel dimensions
    // change. engine.resize() recalculates everything to stay crisp.
    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(canvas);

    // ── Step 5: Cleanup ───────────────────────────────────────────────────────
    // React calls this function when the component unmounts (app closes or
    // Viewer is removed). We MUST dispose the engine and scene to free GPU
    // memory — otherwise we'd have a memory leak.
    return () => {
      resizeObserver.disconnect();
      newScene.dispose();
      engine.dispose();
      engineRef.current = null;
    };

    // canvasRef is a stable React ref object — safe to ignore exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { scene };
}

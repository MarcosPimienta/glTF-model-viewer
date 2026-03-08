import { useRef, useEffect } from "react";
import type { Scene } from "@babylonjs/core";
import { useBabylonEngine } from "../hooks/useBabylonEngine";
import { useModelLoader } from "../hooks/useModelLoader";
import "./styles/Viewer.css";

interface ViewerProps {
  /**
   * Called once when the Babylon.js Scene is ready.
   * App.tsx stores this scene and passes it to other components
   * (HierarchyPanel, StatusBar, etc.) in later phases.
   *
   * ELI5: Like shouting "kitchen is open!" so every waiter knows
   * they can start taking orders.
   */
  onSceneReady?: (scene: Scene) => void;
}

export default function Viewer({ onSceneReady }: ViewerProps) {
  // canvasRef is our direct line to the <canvas> DOM element.
  // Think of it as a sticky note with the canvas's address written on it.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hand the canvas to the engine hook — it creates Engine + Scene
  // and starts the render loop automatically.
  const { scene } = useBabylonEngine(canvasRef);

  // Initialize our model loader hook
  const { loadModel, loadingState } = useModelLoader(scene);

  // When the scene first becomes available, notify the parent (App.tsx).
  // useEffect only fires when `scene` changes (null → Scene object).
  useEffect(() => {
    if (scene && onSceneReady) {
      onSceneReady(scene);
    }
  }, [scene, onSceneReady]);

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadModel(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="viewer"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* The canvas is what Babylon.js actually draws on.
          tabIndex={0} makes it focusable so keyboard shortcuts work. */}
      <canvas
        ref={canvasRef}
        className="viewer__canvas"
        tabIndex={0}
      />

      {/* Loading overlay — hidden by default, activated in Phase 3 */}
      <div className={`viewer__loading-overlay ${!loadingState.isLoading ? "viewer__loading-overlay--hidden" : ""}`}>
        <span className="viewer__loading-label">
          {loadingState.fileName ? `Loading ${loadingState.fileName}…` : "Loading model…"}
        </span>
        <div className="viewer__progress-track">
          <div 
            className="viewer__progress-bar" 
            style={{ width: `${Math.max(0, Math.min(100, loadingState.progress))}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

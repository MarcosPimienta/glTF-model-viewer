import { useEffect, useState } from "react";
import type { Scene } from "@babylonjs/core";
import { SceneInstrumentation } from "@babylonjs/core";
import "./styles/StatusBar.css";

interface StatusBarProps {
  scene: Scene | null;
  filename?: string | null;
}

interface SceneMetrics {
  fps: string;
  triangles: string;
  drawCalls: string;
  meshes: string;
  occluded: string;
  instances: string;
}

export default function StatusBar({ scene, filename }: StatusBarProps) {
  const [metrics, setMetrics] = useState<SceneMetrics>({
    fps: "--",
    triangles: "--",
    drawCalls: "--",
    meshes: "-- / --", // Visible / Total
    occluded: "--",
    instances: "--",
  });

  useEffect(() => {
    if (!scene) return;

    const engine = scene.getEngine();
    
    // Set up Babylon instrumentation to track metrics
    const instrumentation = new SceneInstrumentation(scene);
    
    // Enable the counts we want
    instrumentation.captureActiveMeshesEvaluationTime = true;
    // (Note: Draw calls are accessible directly from performance monitor,
    // but instrumentation gives us precise step times. We'll use the scene's direct counts)

    const updateMetrics = () => {
      // FPS from engine
      const fps = engine.getFps().toFixed(0);

      // Active triangles (faces)
      const triangles = scene.getActiveIndices() / 3;
      
      // Draw calls (Engine)
      // Different Babylon.js engine versions expose this differently.
      // We'll safely cast to any to access inner properties if the standard ones don't exist yet in the type definition.
      const rawEngine = engine as any;
      const getDrawCalls = () => {
        if (typeof rawEngine.getDrawCalls === 'function') {
          return rawEngine.getDrawCalls();
        }
        if (rawEngine._drawCalls !== undefined) {
          return rawEngine._drawCalls;
        }
        return "--";
      };

      const drawCallsCount = getDrawCalls();
      
      // Meshes: Active / Total
      const activeMeshes = scene.getActiveMeshes().length;
      const totalMeshes = scene.meshes.length;
      
      // We will handle occlusion and actual instances deeply later when working
      // on optimization. For now, we will query standard counts.
      
      // Note: Babylon.js provides various ways to track these; 
      // these are the most direct lightweight methods for our Status Bar.

      setMetrics({
        fps,
        triangles: triangles.toLocaleString(),
        drawCalls: drawCallsCount.toString(),
        meshes: `${activeMeshes} / ${totalMeshes}`,
        occluded: "--", // Placeholder for Phase 10a
        instances: "--", // Placeholder for Phase 10c
      });
    };

    // Register a before render observer to update metrics
    // We throttle this to not overwhelm React state updates (e.g., every 10 frames or 500ms)
    // For simplicity, we can just use setInterval if we don't need strictly per-frame sync for the UI
    const intervalId = setInterval(updateMetrics, 500);

    return () => {
      clearInterval(intervalId);
      instrumentation.dispose();
    };
  }, [scene]);

  return (
    <footer className="status-bar">
      <div className="status-bar__stat">
        <span className="status-bar__stat-label">FPS:</span>
        <span className="status-bar__stat-value">{metrics.fps}</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Triangles:</span>
        <span className="status-bar__stat-value">{metrics.triangles}</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Draw Calls:</span>
        <span className="status-bar__stat-value">{metrics.drawCalls}</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Meshes:</span>
        <span className="status-bar__stat-value">{metrics.meshes}</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Occluded:</span>
        <span className="status-bar__stat-value">{metrics.occluded}</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Instances:</span>
        <span className="status-bar__stat-value">{metrics.instances}</span>
      </div>

      <div className="status-bar__spacer" />

      {/* Filename — right-aligned */}
      <span className="status-bar__filename">
        {filename ? filename : "No file loaded"}
      </span>
    </footer>
  );
}

import { useState, useCallback } from "react";
import type { Scene } from "@babylonjs/core";
import Toolbar from "./components/Toolbar";
import Viewer from "./components/Viewer";
import HierarchyPanel from "./components/HierarchyPanel";
import PropertiesPanel from "./components/PropertiesPanel";
import StatusBar from "./components/StatusBar";

// We need the loader hook at the top level so Toolbar can trigger it
import { useModelLoader } from "./hooks/useModelLoader";

/*
  Layout (matches spec §4):
  ┌─────────────────────────────────────┐
  │              Toolbar                │  var(--toolbar-height) = 48px
  ├──────────┬───────────────┬──────────┤
  │ Hierarchy│    Viewer     │Properties│
  │  220px   │   flex: 1    │  260px   │
  ├──────────┴───────────────┴──────────┤
  │              StatusBar              │  var(--statusbar-height) = 32px
  └─────────────────────────────────────┘
*/

export default function App() {
  // The Babylon.js Scene is stored here so ALL components can share it.
  // ELI5: This is the "town square" — once the scene is ready, everyone
  // in the app (toolbar, panels, status bar) can come here to get it.
  const [scene, setScene] = useState<Scene | null>(null);

  // Initialize our model loader hook at the app level too, 
  // so the toolbar can use the same loader logic as the Viewer
  const { loadModel } = useModelLoader(scene);

  // useCallback keeps this function stable across re-renders,
  // so Viewer doesn't fire onSceneReady on every render.
  const handleSceneReady = useCallback((readyScene: Scene) => {
    setScene(readyScene);
  }, []);

  // Expose loadModel to Toolbar
  const handleLoadFile = useCallback((file: File) => {
    loadModel(file);
  }, [loadModel]);

  return (
    <>
      {/* Top toolbar — fixed height */}
      <Toolbar onLoadFile={handleLoadFile} />

      {/* Main content row — fills all remaining vertical space */}
      <div className="app__content">
        <HierarchyPanel />
        {/* Viewer also handles its own drag-and-drop loading */}
        <Viewer onSceneReady={handleSceneReady} />
        <PropertiesPanel />
      </div>

      {/* Bottom status bar — fixed height */}
      {/* scene prop will be connected in Phase 4 */}
      <StatusBar />
    </>
  );
}

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

  // Tiny memory (state) to remember the name of the file we loaded
  const [activeModelName, setActiveModelName] = useState<string | null>(null);

  // Initialize our model loader hook at the app level too, 
  // so the toolbar can use the same loader logic as the Viewer
  const { loadModel } = useModelLoader(scene);

  // useCallback keeps this function stable across re-renders,
  // so Viewer doesn't fire onSceneReady on every render.
  const handleSceneReady = useCallback((readyScene: Scene) => {
    setScene(readyScene);
  }, []);

  // Expose loadModel to Toolbar and Viewer drops
  // We wrap it to also save the filename when a load starts
  const handleLoadFile = useCallback((file: File) => {
    setActiveModelName(file.name);
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
        {/* We pass handleLoadFile so dropping in the viewer also updates the App filename state */}
        <Viewer onSceneReady={handleSceneReady} onFileDrop={handleLoadFile} />
        <PropertiesPanel />
      </div>

      {/* Bottom status bar — fixed height */}
      {/* Handing the "walkie-talkie" to the Status Bar so it can talk to the 3D world */}
      {/* And passing it the active model name like a name tag */}
      <StatusBar scene={scene} filename={activeModelName} />
    </>
  );
}

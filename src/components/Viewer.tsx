import { useRef, useEffect } from "react";
import { Scene, PointerEventTypes, HighlightLayer, Color3, AbstractMesh } from "@babylonjs/core";
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

  /**
   * Called when a file is dropped into the Viewer.
   * Allows App.tsx to track the filename.
   */
  onFileDrop?: (file: File) => void;

  // Phase 6: Selection Props
  selectedNodeId?: string | number | null;
  onSelectNode?: (id: string | number | null) => void;
}

export default function Viewer({ 
  onSceneReady, 
  onFileDrop,
  selectedNodeId,
  onSelectNode
}: ViewerProps) {
  // canvasRef is our direct line to the <canvas> DOM element.
  // Think of it as a sticky note with the canvas's address written on it.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hand the canvas to the engine hook — it creates Engine + Scene
  // and starts the render loop automatically.
  const { scene } = useBabylonEngine(canvasRef);

  // Initialize our model loader hook
  const { loadModel, loadingState } = useModelLoader(scene);

  // Reference to the highlight layer so we can add/remove meshes from it
  const highlightLayerRef = useRef<HighlightLayer | null>(null);

  // When the scene first becomes available, notify the parent (App.tsx).
  // useEffect only fires when `scene` changes (null → Scene object).
  useEffect(() => {
    if (!scene) return;

    if (onSceneReady) {
      onSceneReady(scene);
    }

    // Phase 6: Create the Highlight layer for selected objects
    highlightLayerRef.current = new HighlightLayer("hl1", scene);

    // Phase 6b: Listen for clicks on 3D meshes
    const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        // Did we click on a mesh?
        if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
          const pickedMesh = pointerInfo.pickInfo.pickedMesh;
          
          let idToSelect: string | number = pickedMesh.uniqueId;
          const isIfcScene = scene.meshes.some((m: any) => m.ifcManager);

          // Is it an IFC mesh? If so, its name IS its expressID.
          // Otherwise, fallback to the Babylon uniqueId.
          if (isIfcScene && !isNaN(Number(pickedMesh.name)) && pickedMesh.name.trim() !== "") {
            idToSelect = Number(pickedMesh.name);
          } else {
            idToSelect = pickedMesh.uniqueId;
          }
          
          if (onSelectNode) {
            onSelectNode(idToSelect);
          }
        } else {
          // If we clicked empty space, deselect
          if (onSelectNode) {
             onSelectNode(null);
          }
        }
      }
    });

    return () => {
      scene.onPointerObservable.remove(pointerObserver);
      if (highlightLayerRef.current) {
        highlightLayerRef.current.dispose();
      }
    };
  }, [scene, onSceneReady, onSelectNode]);

  // Phase 6c: Apply visual highlight when selectedNodeId changes
  useEffect(() => {
    if (!scene || !highlightLayerRef.current) return;

    const hl = highlightLayerRef.current;
    
    // Clear all existing highlights first
    hl.removeAllMeshes();

    if (selectedNodeId !== null) {
      // Find the mesh that matches the selected ID
      // If it's a number, it's likely an IFC expressID (which is stored as the mesh Name)
      // or it's a generic uniqueId.
      let targetMesh: AbstractMesh | undefined;
      
      if (typeof selectedNodeId === 'number') {
        // Try precise match for IFC
         targetMesh = scene.meshes.find(m => m.name === selectedNodeId.toString() || m.uniqueId === selectedNodeId);
      } else {
         targetMesh = scene.meshes.find(m => m.uniqueId === Number(selectedNodeId) || m.name === selectedNodeId);
      }

      if (targetMesh) {
        // Add a nice blue highlight!
        hl.addMesh(targetMesh as any, Color3.FromHexString("#4A9EFF"));
      }
    }

  }, [scene, selectedNodeId]);

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      loadModel(file);
      if (onFileDrop) {
        onFileDrop(file);
      }
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

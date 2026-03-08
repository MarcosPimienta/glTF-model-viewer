import { useRef } from "react";
import "./styles/Toolbar.css";
import type { OptimizationState } from "../types/index";
import type { Scene } from "@babylonjs/core";
import { exportSceneAsGLB } from "../utils/exportScene";

interface ToolbarProps {
  onLoadFile?:         (file: File) => void;
  onLoadDemoScene?:    () => void;
  scene?:              Scene | null;
  activeModelName?:    string | null;
  optState?:           OptimizationState;
  onToggleOcclusion?:  () => void;
  onToggleLOD?:        () => void;
  onToggleInstancing?: () => void;
  onToggleMerging?:    () => void;
}

export default function Toolbar({
  onLoadFile,
  onLoadDemoScene,
  scene,
  activeModelName,
  optState,
  onToggleOcclusion,
  onToggleLOD,
  onToggleInstancing,
  onToggleMerging,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onLoadFile) onLoadFile(file);
    if (event.target) event.target.value = "";
  };

  // Helper: returns active class string when flag is true
  const optClass = (flag?: boolean) =>
    ["toolbar__button", flag ? "toolbar__button--active" : ""].join(" ").trim();

  return (
    <header className="toolbar">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".gltf,.glb,.ifc,.rvt"
        onChange={handleFileChange}
      />

      {/* File actions */}
      <div className="toolbar__group">
        <button
          className="toolbar__button"
          title="Load a .gltf, .glb, or .ifc file"
          onClick={handleLoadClick}
        >
          📂 Load glTF
        </button>
        <button className="toolbar__button" title="Load built-in demo scene"  onClick={onLoadDemoScene}>
          🧊 Demo Scene
        </button>
      </div>

      <div className="toolbar__separator" />

      {/* Gizmo mode */}
      <div className="toolbar__group">
        <span className="toolbar__group-label">Gizmo</span>
        <button className="toolbar__button" title="Translate (T)">↔ Translate</button>
        <button className="toolbar__button" title="Rotate (R)">↻ Rotate</button>
        <button className="toolbar__button" title="Scale (S)">⤢ Scale</button>
      </div>

      <div className="toolbar__separator" />

      {/* Optimizations */}
      <div className="toolbar__group">
        <span className="toolbar__group-label">Opts</span>

        <button
          className={optClass(optState?.occlusionCulling)}
          title="Toggle occlusion culling — hides meshes behind solid objects"
          onClick={onToggleOcclusion}
        >
          👁 Occlusion
        </button>

        <button
          className={optClass(optState?.lodEnabled)}
          title="Toggle LOD — simplifies distant meshes (auto-disables Merge)"
          onClick={onToggleLOD}
        >
          📐 LOD
        </button>

        <button
          className={optClass(optState?.instancingEnabled)}
          title="Toggle instanced rendering — batches duplicate geometry"
          onClick={onToggleInstancing}
        >
          ✳ Instancing
        </button>

        <button
          className={optClass(optState?.mergingEnabled)}
          title="Merge static meshes by material — reduces draw calls (auto-disables LOD)"
          onClick={onToggleMerging}
        >
          🔗 Merge
        </button>
      </div>

      <div className="toolbar__spacer" />

      {/* Export */}
      <button
        className="toolbar__button"
        title="Export current scene as .glb"
        disabled={!scene}
        onClick={() => {
          if (scene) {
            const name = activeModelName
              ? activeModelName.replace(/\.[^.]+$/, "")  // strip extension
              : "scene";
            exportSceneAsGLB(scene, name);
          }
        }}
      >
        ⬇ Export GLB
      </button>
    </header>
  );
}

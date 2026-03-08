import { useRef } from "react";
import "./styles/Toolbar.css";

interface ToolbarProps {
  onLoadFile?: (file: File) => void;
}

export default function Toolbar({ onLoadFile }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onLoadFile) {
      onLoadFile(file);
    }
    // Reset input so the same file can be selected again if needed
    if (event.target) {
        event.target.value = '';
    }
  };

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
          title="Load a .gltf or .glb file"
          onClick={handleLoadClick}
        >
          📂 Load glTF
        </button>
        <button className="toolbar__button" title="Load built-in demo scene">
          🧊 Demo Scene
        </button>
      </div>

      <div className="toolbar__separator" />

      {/* Gizmo mode */}
      <div className="toolbar__group">
        <span className="toolbar__group-label">Gizmo</span>
        <button className="toolbar__button" title="Translate (T)">
          ↔ Translate
        </button>
        <button className="toolbar__button" title="Rotate (R)">
          ↻ Rotate
        </button>
        <button className="toolbar__button" title="Scale (S)">
          ⤢ Scale
        </button>
      </div>

      <div className="toolbar__separator" />

      {/* Optimizations */}
      <div className="toolbar__group">
        <span className="toolbar__group-label">Opts</span>
        <button className="toolbar__button" title="Toggle occlusion culling">
          Occlusion
        </button>
        <button className="toolbar__button" title="Toggle LOD">
          LOD
        </button>
        <button className="toolbar__button" title="Toggle instancing">
          Instancing
        </button>
        <button className="toolbar__button" title="Merge static meshes">
          Merge
        </button>
      </div>

      <div className="toolbar__spacer" />

      {/* Export */}
      <button className="toolbar__button" title="Export scene as GLB">
        ⬇ Export GLB
      </button>
    </header>
  );
}

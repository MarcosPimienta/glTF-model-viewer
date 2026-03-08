import { useEffect, useState, useMemo } from "react";
import type { Scene, AbstractMesh } from "@babylonjs/core";
import "./styles/HierarchyPanel.css";

interface HierarchyPanelProps {
  scene: Scene | null;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 100;

export default function HierarchyPanel({ scene, isLoading }: HierarchyPanelProps) {
  // State to store ALL valid meshes in the scene
  const [allMeshes, setAllMeshes] = useState<AbstractMesh[]>([]);
  
  // State for pagination (how many items to show right now)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // State for the search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Listen for changes in the 3D world, but ONLY when loading is finished
  useEffect(() => {
    if (!scene) return;
    if (isLoading) return; // Don't block the WASM parser!

    // Function to grab every single mesh and flatten them into a list
    const updateHierarchy = () => {
      // scene.meshes gets everything, not just roots. 
      const validMeshes = scene.meshes.filter((mesh) => {
        // Exclude internal Babylon objects and skyboxes if any
        if (mesh.name === "Default light") return false;
        if (mesh.name === "Default camera") return false;
        
        // We probably only care about meshes that actually have geometry 
        // (totalVertices > 0) to keep the list clean, but for IFC often everything is a mesh.
        // For now, let's include everything with a valid name.
        if (mesh.name.includes("skyBox")) return false;
        
        return true;
      });
      
      setAllMeshes([...validMeshes]);
      setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on new load
    };

    // Grab the finished hierarchy once loading stops
    updateHierarchy();
  }, [scene, isLoading]);

  // Handle the search filter efficiently
  const filteredMeshes = useMemo(() => {
    if (!searchQuery) return allMeshes;
    
    const lowerQuery = searchQuery.toLowerCase();
    return allMeshes.filter(mesh => 
      (mesh.name || "Unnamed").toLowerCase().includes(lowerQuery)
    );
  }, [allMeshes, searchQuery]);

  // Determine which meshes to actually render right now
  const visibleMeshes = filteredMeshes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMeshes.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <aside className="hierarchy-panel">
      {/* Panel header */}
      <div className="hierarchy-panel__header">
        <span className="hierarchy-panel__title">Hierarchy ({filteredMeshes.length})</span>
      </div>

      {/* Basic Search Input */}
      <div className="hierarchy-panel__search-container" style={{ padding: "8px", borderBottom: "1px solid var(--border-color)" }}>
        <input 
          type="text" 
          className="hierarchy-panel__search-input"
          placeholder="Filter parts..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading || allMeshes.length === 0}
          style={{ width: "100%", padding: "4px 8px", background: "var(--bg-panel)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "4px" }}
        />
      </div>

      {/* Scrollable list body */}
      <div className="hierarchy-panel__body">
        {/* State messages */}
        {isLoading ? (
          <p className="hierarchy-panel__empty">Loading model...</p>
        ) : allMeshes.length === 0 ? (
          <p className="hierarchy-panel__empty">No scene loaded</p>
        ) : (
          <div className="hierarchy-panel__list">
            {/* The Flat List Elements */}
            {visibleMeshes.map((mesh) => (
              <div key={mesh.uniqueId} className="hierarchy-panel__node" style={{ paddingLeft: "8px" }}>
                <span className="hierarchy-panel__icon">⬡</span>
                <span className="hierarchy-panel__label">{mesh.name || "Unnamed Mesh"}</span>
                <button className="hierarchy-panel__eye">👁</button>
              </div>
            ))}
            
            {/* Pagination Button */}
            {hasMore && (
              <button 
                className="hierarchy-panel__load-more"
                onClick={handleLoadMore}
                style={{ width: "100%", padding: "8px", background: "var(--bg-toolbar)", color: "var(--accent-color)", border: "none", cursor: "pointer", borderTop: "1px solid var(--border-color)" }}
              >
                Load More ({filteredMeshes.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

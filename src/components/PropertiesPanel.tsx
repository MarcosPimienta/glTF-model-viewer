import { useState, useEffect } from "react";
import type { Scene, Node } from "@babylonjs/core";
// @ts-ignore - web-ifc-babylon has incomplete types
import type { IFCModel } from "web-ifc-babylon";
import "./styles/PropertiesPanel.css";

interface PropertiesPanelProps {
  scene: Scene | null;
  selectedNodeId: string | number | null;
}

interface NodeProperties {
  name: string;
  id: string | number;
  type: string;
}

export default function PropertiesPanel({ scene, selectedNodeId }: PropertiesPanelProps) {
  const [nodeData, setNodeData] = useState<NodeProperties | null>(null);

  useEffect(() => {
    if (!scene || selectedNodeId === null) {
      setNodeData(null);
      return;
    }

    // 1. Check if we have an IFC model in the scene
    const ifcModelMesh = scene.meshes.find(m => (m as any).ifcManager) as any;
    const ifcModel = ifcModelMesh as IFCModel | undefined;

    // 2. Are we looking for an IFC node? Support string IDs for logic separation, but IFC usually uses numbers
    const isIfcNode = ifcModel && typeof selectedNodeId === "number";

    if (isIfcNode) {
      // It's an IFC node! We need to query its info from the IFC Manager
      try {
        // We get properties asynchronously (some models might take a moment if large, but usually fast enough)
        // For simplicity in this synchronous effect, we'll fetch the basic spatial node structure
        // we already know about. A more advanced implementaton would use ifcManager.getItemProperties
        
        // For Phase 7, we'll try to find its type from the items properties if loaded
        ifcModel.ifcManager.getItemProperties(ifcModel.modelID, selectedNodeId as number)
          .then((props: any) => {
            if (props) {
               setNodeData({
                name: props.Name?.value || `IFC Node ${selectedNodeId}`,
                id: selectedNodeId,
                type: props.type || "IFC Element" // web-ifc often exposes .type string or number
              });
            } else {
               // Fallback if properties not available yet
               setNodeData({
                  name: `IFC Node`,
                  id: selectedNodeId,
                  type: "IFC Element"
               });
            }
          })
          .catch((err: any) => {
            console.error("Failed to get IFC properties", err);
            setNodeData({
              name: `IFC Element`,
              id: selectedNodeId,
              type: "IFC Element"
            });
          });
      } catch (e) {
          setNodeData(null);
      }

    } else {
      // It's a standard Babylon Node
      // `selectedNodeId` from viewer clicks is often a mesh uniqueId
      // First try finding by uniqueId (number)
      let foundNode: Node | null = null;
      
      if (typeof selectedNodeId === "number") {
         foundNode = scene.getNodeById(selectedNodeId.toString());
         if (!foundNode) {
            // Some meshes might only have uniqueId, not id matching it
            const mesh = scene.getMeshByUniqueId(selectedNodeId);
            if (mesh) foundNode = mesh;
         }
      }
      
      // Fallback: try finding by ID string (often used in glTF parsing)
      if (!foundNode) {
        foundNode = scene.getNodeByID(selectedNodeId.toString());
      }
      
      // Final Fallback: try finding by Name (just in case)
      if (!foundNode && typeof selectedNodeId === "string") {
        foundNode = scene.getNodeByName(selectedNodeId);
      }

      if (foundNode) {
        setNodeData({
          name: foundNode.name,
          id: foundNode.id || foundNode.uniqueId,
          type: foundNode.getClassName()
        });
      } else {
        setNodeData(null);
      }
    }
    
  }, [scene, selectedNodeId]);
  return (
    <aside className="properties-panel">
      {/* Panel header */}
      <div className="properties-panel__header">
        <span className="properties-panel__title">Properties</span>
      </div>

      {/* Scrollable body */}
      <div className="properties-panel__body">
        {!nodeData ? (
          /* Empty state — shown when nothing is selected */
          <p className="properties-panel__empty">Nothing selected</p>
        ) : (
          /* Basic Info section — rendered when a mesh is selected */
          <div className="properties-panel__section properties-panel__basic-info">
            <div className="properties-panel__section-title">General</div>
            
            <div className="properties-panel__field">
              <span className="properties-panel__label">Name</span>
              <span className="properties-panel__value" title={nodeData.name}>
                {nodeData.name}
              </span>
            </div>

            <div className="properties-panel__field">
              <span className="properties-panel__label">ID</span>
              <span className="properties-panel__value" title={nodeData.id.toString()}>
                {nodeData.id}
              </span>
            </div>

            <div className="properties-panel__field">
              <span className="properties-panel__label">Type</span>
              <span className="properties-panel__value">
                {nodeData.type}
              </span>
            </div>
          </div>
        )}

        {/* Transform section — rendered when a mesh is selected (Phase 8)
        <div className="properties-panel__section">
          <div className="properties-panel__section-title">Transform</div>

          <div className="properties-panel__field">
            <span className="properties-panel__label">Position</span>
            <div className="properties-panel__xyz">
              <input className="properties-panel__input" type="number" defaultValue={0} />
              <input className="properties-panel__input" type="number" defaultValue={0} />
              <input className="properties-panel__input" type="number" defaultValue={0} />
            </div>
          </div>

          <div className="properties-panel__field">
            <span className="properties-panel__label">Rotation</span>
            <div className="properties-panel__xyz">
              <input className="properties-panel__input" type="number" defaultValue={0} />
              <input className="properties-panel__input" type="number" defaultValue={0} />
              <input className="properties-panel__input" type="number" defaultValue={0} />
            </div>
          </div>

          <div className="properties-panel__field">
            <span className="properties-panel__label">Scale</span>
            <div className="properties-panel__xyz">
              <input className="properties-panel__input" type="number" defaultValue={1} />
              <input className="properties-panel__input" type="number" defaultValue={1} />
              <input className="properties-panel__input" type="number" defaultValue={1} />
            </div>
          </div>
        </div>
        */}

        {/* Material section — rendered when selected mesh has a PBR material (Phase 9)
        <div className="properties-panel__section">
          <div className="properties-panel__section-title">Material</div>

          <div className="properties-panel__field">
            <span className="properties-panel__label">Color</span>
            <input className="properties-panel__color" type="color" defaultValue="#ffffff" />
          </div>

          <div className="properties-panel__field">
            <span className="properties-panel__label">Opacity</span>
            <input className="properties-panel__slider" type="range" min={0} max={1} step={0.01} defaultValue={1} />
          </div>

          <div className="properties-panel__field">
            <span className="properties-panel__label">Metallic</span>
            <input className="properties-panel__slider" type="range" min={0} max={1} step={0.01} defaultValue={0} />
          </div>

          <div className="properties-panel__field">
            <span className="properties-panel__label">Roughness</span>
            <input className="properties-panel__slider" type="range" min={0} max={1} step={0.01} defaultValue={0.5} />
          </div>
        </div>
        */}
      </div>
    </aside>
  );
}

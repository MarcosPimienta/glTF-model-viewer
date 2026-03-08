import { useEffect, useState, useMemo } from "react";
import type { Scene, Node, AbstractMesh } from "@babylonjs/core";
import "./styles/HierarchyPanel.css";

interface HierarchyPanelProps {
  scene: Scene | null;
  isLoading: boolean;
}

// The new data structure that powers the Virtual Tree
interface TreeNode {
  id: number | string; // Express ID for IFC, uniqueId for Babylon Nodes
  name: string;
  depth: number;
  isExpanded: boolean;
  isVisible: boolean; // is my parent expanded?
  hasChildren: boolean;
  childrenIds: (number | string)[]; // Keep track of children to make toggle logic easier
  nodeRef?: Node; // Optional reference to the actual Babylon mesh, if it has one
}

const ITEMS_PER_PAGE = 100;

export default function HierarchyPanel({ scene, isLoading }: HierarchyPanelProps) {
  // Store the massive flat array that behaves like a tree
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  
  // State for pagination (how many items to show right now)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // State for the search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Build the Virtual Tree when the scene finishes loading!
  useEffect(() => {
    if (!scene || isLoading) return;

    // Check if any mesh has an ifcManager (it's an IFC model!)
    let ifcModel: any = null;
    for (const mesh of scene.meshes) {
      if ((mesh as any).ifcManager) {
        ifcModel = mesh;
        break;
      }
    }

    // Helper function to build the tree from the IFC Spatial Structure
    const buildIfcTree = async () => {
      const manager = ifcModel.ifcManager;
      const modelID = ifcModel.modelID;

      // This is the magic fetch! It gets Project -> Site -> Building -> Structure -> Element
      const spatialStructure = await manager.getSpatialStructure(modelID, true); // true = include properties

      const flatArray: TreeNode[] = [];

      // Recursive flattener specifically for the web-ifc spatial structure format
      const flattenIfcNode = (ifcNode: any, depth = 0, isParentVisible = true) => {
        // web-ifc structure uses 'expressID', 'children', and 'type' (which maps to the string)
        const expressID = ifcNode.expressID;
        const children = ifcNode.children || [];
        const hasChildren = children.length > 0;
        
        // Try to get a human readable name from the IFC properties
        let name = "Unknown IFC Node";
        if (ifcNode.Name && ifcNode.Name.value) {
            name = ifcNode.Name.value;
        } else if (ifcNode.type) {
             name = ifcNode.type; // Fallback to IFC class e.g. "IFCBUILDINGSTOREY"
        }

        // Try to find the corresponding Babylon mesh if we want to visually toggle it later
        // IFC meshes in Babylon are named using their expressID strictly as strings
        const meshRef = scene.meshes.find(m => m.name === expressID.toString());

        const isVisible = depth === 0 && isParentVisible;

        flatArray.push({
          id: expressID,
          name: name,
          depth,
          isExpanded: false,
          isVisible,
          hasChildren,
          childrenIds: children.map((c: any) => c.expressID),
          nodeRef: meshRef
        });

        // Recursively add children
        children.forEach((childNode: any) => {
          flattenIfcNode(childNode, depth + 1, false);
        });
      };

      flattenIfcNode(spatialStructure);
      setTreeNodes(flatArray);
      setVisibleCount(ITEMS_PER_PAGE);
    };

    // Helper function to build the tree from standard Babylon Nodes (glTF, glb)
    const buildBabylonTree = () => {
      const flattenTree = (nodes: Node[], depth = 0, isParentVisible = true): TreeNode[] => {
        let flatArray: TreeNode[] = [];

        nodes.forEach((node) => {
          // Exclude system objects
          if (node.name === "Default light" || node.name === "Default camera") return;

          const children = node.getChildren();
          const hasChildren = children.length > 0;
          const isVisible = depth === 0 && isParentVisible;

          flatArray.push({
            id: node.uniqueId,
            name: node.name || "Unnamed Node",
            depth,
            isExpanded: false, 
            isVisible,
            hasChildren,
            childrenIds: children.map(c => c.uniqueId),
            nodeRef: node
          });

          if (hasChildren) {
            flatArray = flatArray.concat(flattenTree(children, depth + 1, false)); 
          }
        });

        return flatArray;
      };

      const newTree = flattenTree(scene.rootNodes);
      setTreeNodes(newTree);
      setVisibleCount(ITEMS_PER_PAGE);
    };

    // Decide which tree builder to use
    if (ifcModel) {
      buildIfcTree();
    } else {
      buildBabylonTree();
    }

  }, [scene, isLoading]);

  // Handle expanding/collapsing a node
  const toggleNode = (nodeId: number | string) => {
    setTreeNodes((prevTree) => {
      const targetIndex = prevTree.findIndex(item => item.id === nodeId);
      if (targetIndex === -1) return prevTree;

      const targetItem = prevTree[targetIndex];
      const newExpandedState = !targetItem.isExpanded;
      const targetDepth = targetItem.depth;

      const nextTree = [...prevTree];
      nextTree[targetIndex] = { ...targetItem, isExpanded: newExpandedState };

      // Walk forward in the array, updating visibility
      let i = targetIndex + 1;
      while (i < nextTree.length && nextTree[i].depth > targetDepth) {
        let child = { ...nextTree[i] };
        
        if (newExpandedState) {
           if (child.depth === targetDepth + 1) {
              child.isVisible = true;
           } else {
             let parentExpanded = true;
             for (let p = i - 1; p > targetIndex; p--) {
               if (nextTree[p].depth === child.depth - 1) {
                 parentExpanded = nextTree[p].isExpanded;
                 break;
               }
             }
             child.isVisible = parentExpanded && nextTree[targetIndex].isExpanded;
           }
        } else {
          child.isVisible = false;
        }

        nextTree[i] = child;
        i++;
      }

      return nextTree;
    });
  };

  // 1. Filter out the hidden nodes (so it behaves like a tree)
  const onlyVisibleNodes = useMemo(() => {
    return treeNodes.filter(item => item.isVisible);
  }, [treeNodes]);

  // 2. Apply the search query
  const searchableNodes = useMemo(() => {
    if (!searchQuery) return onlyVisibleNodes;
    
    // When searching, we ignore tree relationships and just filter by name
    const lowerQuery = searchQuery.toLowerCase();
    return treeNodes.filter(item => 
      item.name.toLowerCase().includes(lowerQuery)
    );
  }, [onlyVisibleNodes, treeNodes, searchQuery]);

  // 3. Paginate!
  const finallyVisibleNodes = searchableNodes.slice(0, visibleCount);
  const hasMore = visibleCount < searchableNodes.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <aside className="hierarchy-panel">
      <div className="hierarchy-panel__header">
        <span className="hierarchy-panel__title">Hierarchy ({searchableNodes.length})</span>
      </div>

      <div className="hierarchy-panel__search-container" style={{ padding: "8px", borderBottom: "1px solid var(--border-color)" }}>
        <input 
          type="text" 
          className="hierarchy-panel__search-input"
          placeholder="Filter parts..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading || treeNodes.length === 0}
          style={{ width: "100%", padding: "4px 8px", background: "var(--bg-panel)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "4px" }}
        />
      </div>

      <div className="hierarchy-panel__body">
        {isLoading ? (
          <p className="hierarchy-panel__empty">Loading model...</p>
        ) : treeNodes.length === 0 ? (
          <p className="hierarchy-panel__empty">No scene loaded</p>
        ) : (
          <div className="hierarchy-panel__list">
            {finallyVisibleNodes.map((item) => (
              <div 
                key={item.id} 
                className="hierarchy-panel__node" 
                onClick={() => toggleNode(item.id)}
                // THIS is the magic! Fake the tree padding based on depth!
                // But if we are searching, flatten it out so it's easier to read.
                style={{ 
                  paddingLeft: searchQuery ? "8px" : `${item.depth * 16 + 8}px`,
                  cursor: item.hasChildren ? "pointer" : "default" 
                }}
              >
                {/* Expand / Collapse Caret */}
                {/* Hide the caret completely if we are filtering via search */}
                {!searchQuery && (
                  <span className={`hierarchy-panel__caret ${item.hasChildren ? "" : "hierarchy-panel__caret--leaf"}`}>
                    {item.hasChildren ? (item.isExpanded ? "▼" : "▶") : ""}
                  </span>
                )}
                
                <span className="hierarchy-panel__icon">⬡</span>
                <span className="hierarchy-panel__label">{item.name}</span>
                
                {/* Only show the eye icon if this node is tied to an actual 3D mesh */}
                {item.nodeRef && (
                    <button 
                    className="hierarchy-panel__eye"
                    onClick={(e) => {
                        e.stopPropagation(); // prevent expanding/collapsing when clicking the eye
                        // Note: actual hide/show logic will go here in Phase 6
                    }}
                    >
                    👁
                    </button>
                )}
              </div>
            ))}
            
            {hasMore && (
              <button 
                className="hierarchy-panel__load-more"
                onClick={handleLoadMore}
                style={{ width: "100%", padding: "8px", background: "var(--bg-toolbar)", color: "var(--accent-color)", border: "none", cursor: "pointer", borderTop: "1px solid var(--border-color)" }}
              >
                Load More ({searchableNodes.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

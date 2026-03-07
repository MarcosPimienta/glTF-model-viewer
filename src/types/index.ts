import type { AbstractMesh, Scene, Node } from "@babylonjs/core";

// Suppress unused import warning — Scene is available for future hooks
export type { Scene };

// ---------------------------------------------------------------------------
// Scene statistics displayed in the Status Bar
// ---------------------------------------------------------------------------
export interface SceneStats {
  fps: number;
  totalMeshes: number;
  activeMeshes: number;
  totalVertices: number;
  totalTriangles: number;
  drawCalls: number;
  occludedMeshes: number;
  instanceCount: number;
  currentLODLevel: string;
}

// ---------------------------------------------------------------------------
// Information about the currently selected mesh (Properties Panel)
// ---------------------------------------------------------------------------
export interface SelectedMeshInfo {
  mesh: AbstractMesh;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  vertexCount: number;
  faceCount: number;
  boundingBox: { width: number; height: number; depth: number };
  materialName: string | null;
  albedoColor: { r: number; g: number; b: number };
  alpha: number;
  metallic: number;
  roughness: number;
}

// ---------------------------------------------------------------------------
// A node in the Hierarchy Panel scene tree
// ---------------------------------------------------------------------------
export interface HierarchyNode {
  id: string;
  name: string;
  type: "mesh" | "transformNode" | "light" | "camera";
  node: Node;
  children: HierarchyNode[];
  isVisible: boolean;
  isExpanded: boolean;
}

// ---------------------------------------------------------------------------
// Active transform gizmo mode
// ---------------------------------------------------------------------------
export type GizmoMode = "position" | "rotation" | "scale" | "none";

// ---------------------------------------------------------------------------
// Toggleable optimization flags
// ---------------------------------------------------------------------------
export interface OptimizationState {
  /** Always on — controls stats visibility only */
  frustumCulling: boolean;
  occlusionCulling: boolean;
  lodEnabled: boolean;
  instancingEnabled: boolean;
  mergingEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Model loading progress state
// ---------------------------------------------------------------------------
export interface LoadingState {
  isLoading: boolean;
  /** 0–100 */
  progress: number;
  fileName: string | null;
}

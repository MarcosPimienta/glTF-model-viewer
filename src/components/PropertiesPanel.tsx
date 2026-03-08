import { useState, useEffect, useCallback } from "react";
import type { Scene, AbstractMesh, Node } from "@babylonjs/core";
// @ts-ignore - web-ifc-babylon has incomplete types
import type { IFCModel } from "web-ifc-babylon";
import "./styles/PropertiesPanel.css";

// ─── Helper ──────────────────────────────────────────────────────────────────

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface NodeProperties {
  name: string;
  id: string | number;
  type: string;
  isMesh: boolean;   // only meshes have a modifiable transform
}

interface TransformState {
  position: Vec3;
  rotation: Vec3;  // stored in DEGREES for display
  scale: Vec3;
}

interface PropertiesPanelProps {
  scene: Scene | null;
  selectedNodeId: string | number | null;
}

// ─── Sub-component: XYZ row ───────────────────────────────────────────────────

interface XyzRowProps {
  label: string;
  value: Vec3;
  step?: number;
  onChange: (axis: "x" | "y" | "z", value: number) => void;
}

function XyzRow({ label, value, step = 0.01, onChange }: XyzRowProps) {
  return (
    <div className="properties-panel__field properties-panel__field--column">
      <span className="properties-panel__label">{label}</span>
      <div className="properties-panel__xyz">
        <div className="properties-panel__xyz-field">
          <span className="properties-panel__axis properties-panel__axis--x">X</span>
          <input
            className="properties-panel__input"
            type="number"
            step={step}
            value={fmt(value.x)}
            onChange={e => onChange("x", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="properties-panel__xyz-field">
          <span className="properties-panel__axis properties-panel__axis--y">Y</span>
          <input
            className="properties-panel__input"
            type="number"
            step={step}
            value={fmt(value.y)}
            onChange={e => onChange("y", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="properties-panel__xyz-field">
          <span className="properties-panel__axis properties-panel__axis--z">Z</span>
          <input
            className="properties-panel__input"
            type="number"
            step={step}
            value={fmt(value.z)}
            onChange={e => onChange("z", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Helper: resolve node from scene ─────────────────────────────────────────

function resolveNode(scene: Scene, selectedNodeId: string | number): Node | null {
  let node: Node | null = null;
  if (typeof selectedNodeId === "number") {
    node = scene.getNodeById(selectedNodeId.toString());
    if (!node) {
      const mesh = scene.getMeshByUniqueId(selectedNodeId);
      if (mesh) node = mesh;
    }
  }
  if (!node) node = scene.getNodeByID(selectedNodeId.toString());
  if (!node && typeof selectedNodeId === "string") node = scene.getNodeByName(selectedNodeId);
  return node;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PropertiesPanel({ scene, selectedNodeId }: PropertiesPanelProps) {
  const [nodeData, setNodeData]       = useState<NodeProperties | null>(null);
  const [transform, setTransform]     = useState<TransformState | null>(null);

  // ── Effect: resolve node and read its current transform ──────────────────
  useEffect(() => {
    if (!scene || selectedNodeId === null) {
      setNodeData(null);
      setTransform(null);
      return;
    }

    // Check if we have an IFC model
    const ifcModelMesh = scene.meshes.find(m => (m as any).ifcManager) as any;
    const ifcModel = ifcModelMesh as IFCModel | undefined;
    const isIfcNode = ifcModel && typeof selectedNodeId === "number";

    if (isIfcNode) {
      ifcModel.ifcManager
        .getItemProperties(ifcModel.modelID, selectedNodeId as number)
        .then((props: any) => {
          setNodeData({
            name: props?.Name?.value || `IFC Node ${selectedNodeId}`,
            id: selectedNodeId,
            type: props?.type || "IFC Element",
            isMesh: false,
          });
          // IFC nodes don't have a standard Babylon transform we can trivially edit
          setTransform(null);
        })
        .catch(() => {
          setNodeData({ name: "IFC Element", id: selectedNodeId, type: "IFC Element", isMesh: false });
          setTransform(null);
        });
      return;
    }

    // Standard Babylon node
    const node = resolveNode(scene, selectedNodeId);
    if (!node) {
      setNodeData(null);
      setTransform(null);
      return;
    }

    setNodeData({
      name: node.name,
      id: node.id || node.uniqueId,
      type: node.getClassName(),
      isMesh: node.getClassName() === "Mesh" || node.getClassName() === "TransformNode",
    });

    // Read transform from node (cast to AbstractMesh for position/rotation/scaling)
    const m = node as AbstractMesh;
    if (m.position && m.rotation && m.scaling) {
      setTransform({
        position: { x: m.position.x, y: m.position.y, z: m.position.z },
        rotation: {
          x: m.rotation.x * RAD_TO_DEG,
          y: m.rotation.y * RAD_TO_DEG,
          z: m.rotation.z * RAD_TO_DEG,
        },
        scale: { x: m.scaling.x, y: m.scaling.y, z: m.scaling.z },
      });
    } else {
      setTransform(null);
    }
  }, [scene, selectedNodeId]);

  // ── Handlers: write input changes back to the live 3D mesh ───────────────
  const handlePosition = useCallback((axis: "x" | "y" | "z", val: number) => {
    if (!scene || selectedNodeId === null) return;
    const node = resolveNode(scene, selectedNodeId) as AbstractMesh | null;
    if (!node?.position) return;
    node.position[axis] = val;
    setTransform(prev => prev ? { ...prev, position: { ...prev.position, [axis]: val } } : null);
  }, [scene, selectedNodeId]);

  const handleRotation = useCallback((axis: "x" | "y" | "z", val: number) => {
    if (!scene || selectedNodeId === null) return;
    const node = resolveNode(scene, selectedNodeId) as AbstractMesh | null;
    if (!node?.rotation) return;
    node.rotation[axis] = val * DEG_TO_RAD;
    setTransform(prev => prev ? { ...prev, rotation: { ...prev.rotation, [axis]: val } } : null);
  }, [scene, selectedNodeId]);

  const handleScale = useCallback((axis: "x" | "y" | "z", val: number) => {
    if (!scene || selectedNodeId === null) return;
    const node = resolveNode(scene, selectedNodeId) as AbstractMesh | null;
    if (!node?.scaling) return;
    node.scaling[axis] = val;
    setTransform(prev => prev ? { ...prev, scale: { ...prev.scale, [axis]: val } } : null);
  }, [scene, selectedNodeId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <aside className="properties-panel">
      {/* Panel header */}
      <div className="properties-panel__header">
        <span className="properties-panel__title">Properties</span>
      </div>

      {/* Scrollable body */}
      <div className="properties-panel__body">
        {!nodeData ? (
          /* Empty state */
          <p className="properties-panel__empty">Nothing selected</p>
        ) : (
          <>
            {/* ── General Info ─────────────────────────────────────── */}
            <div className="properties-panel__section">
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
                <span className="properties-panel__value">{nodeData.type}</span>
              </div>
            </div>

            {/* ── Transform ────────────────────────────────────────── */}
            {transform && (
              <div className="properties-panel__section">
                <div className="properties-panel__section-title">Transform</div>

                <XyzRow label="Position" value={transform.position} step={0.1} onChange={handlePosition} />
                <XyzRow label="Rotation" value={transform.rotation} step={1}   onChange={handleRotation} />
                <XyzRow label="Scale"    value={transform.scale}    step={0.01} onChange={handleScale}   />
              </div>
            )}

            {/* Material section — Phase 9
            <div className="properties-panel__section">
              ...
            </div>
            */}
          </>
        )}
      </div>
    </aside>
  );
}

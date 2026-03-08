import "./styles/HierarchyPanel.css";

export default function HierarchyPanel() {
  return (
    <aside className="hierarchy-panel">
      {/* Panel header */}
      <div className="hierarchy-panel__header">
        <span className="hierarchy-panel__title">Hierarchy</span>
      </div>

      {/* Scrollable tree body */}
      <div className="hierarchy-panel__body">
        {/* Empty state — shown before any model is loaded */}
        <p className="hierarchy-panel__empty">No scene loaded</p>

        {/* Tree nodes will be rendered here in Phase 5
            Example structure:
            <div className="hierarchy-panel__node">
              <span className="hierarchy-panel__caret hierarchy-panel__caret--leaf">▶</span>
              <span className="hierarchy-panel__icon">⬡</span>
              <span className="hierarchy-panel__label">Mesh_01</span>
              <button className="hierarchy-panel__eye">👁</button>
            </div>
        */}
      </div>
    </aside>
  );
}

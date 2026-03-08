import "./styles/PropertiesPanel.css";

export default function PropertiesPanel() {
  return (
    <aside className="properties-panel">
      {/* Panel header */}
      <div className="properties-panel__header">
        <span className="properties-panel__title">Properties</span>
      </div>

      {/* Scrollable body */}
      <div className="properties-panel__body">
        {/* Empty state — shown when nothing is selected */}
        <p className="properties-panel__empty">Nothing selected</p>

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

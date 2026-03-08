import "./styles/StatusBar.css";

export default function StatusBar() {
  return (
    <footer className="status-bar">
      <div className="status-bar__stat">
        <span className="status-bar__stat-label">FPS:</span>
        <span className="status-bar__stat-value">--</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Triangles:</span>
        <span className="status-bar__stat-value">--</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Draw Calls:</span>
        <span className="status-bar__stat-value">--</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Meshes:</span>
        <span className="status-bar__stat-value">-- / --</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Occluded:</span>
        <span className="status-bar__stat-value">--</span>
      </div>

      <div className="status-bar__separator" />

      <div className="status-bar__stat">
        <span className="status-bar__stat-label">Instances:</span>
        <span className="status-bar__stat-value">--</span>
      </div>

      <div className="status-bar__spacer" />

      {/* Filename — right-aligned */}
      <span className="status-bar__filename">No file loaded</span>
    </footer>
  );
}

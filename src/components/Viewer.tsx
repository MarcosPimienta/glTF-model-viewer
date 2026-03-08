import "./styles/Viewer.css";

export default function Viewer() {
  return (
    <div className="viewer">
      {/* Babylon.js canvas — engine will be attached here in Phase 2 */}
      <canvas className="viewer__canvas" />

      {/* Loading overlay — hidden by default, shown during model load */}
      <div className="viewer__loading-overlay viewer__loading-overlay--hidden">
        <span className="viewer__loading-label">Loading model…</span>
        <div className="viewer__progress-track">
          <div className="viewer__progress-bar" style={{ width: "0%" }} />
        </div>
      </div>
    </div>
  );
}

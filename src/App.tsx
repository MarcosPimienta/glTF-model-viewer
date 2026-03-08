import Toolbar from "./components/Toolbar";
import Viewer from "./components/Viewer";
import HierarchyPanel from "./components/HierarchyPanel";
import PropertiesPanel from "./components/PropertiesPanel";
import StatusBar from "./components/StatusBar";

/*
  Layout (matches spec §4):
  ┌─────────────────────────────────────┐
  │              Toolbar                │  var(--toolbar-height) = 48px
  ├──────────┬───────────────┬──────────┤
  │ Hierarchy│    Viewer     │Properties│
  │  220px   │   flex: 1    │  260px   │
  ├──────────┴───────────────┴──────────┤
  │              StatusBar              │  var(--statusbar-height) = 32px
  └─────────────────────────────────────┘
*/

export default function App() {
  return (
    <>
      {/* Top toolbar — fixed height */}
      <Toolbar />

      {/* Main content row — fills all remaining vertical space */}
      <div className="app__content">
        <HierarchyPanel />
        <Viewer />
        <PropertiesPanel />
      </div>

      {/* Bottom status bar — fixed height */}
      <StatusBar />
    </>
  );
}

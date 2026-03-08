# glTF Model Viewer

A web-based 3D model viewer built with **Babylon.js 7**, **React 18**, and **TypeScript**. Load glTF/GLB/IFC files, inspect and edit meshes in real time, apply GPU-level performance optimizations, and export your edits back to GLB — all in the browser with no backend required.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Setup & Installation](#setup--installation)
5. [Running the App](#running-the-app)
6. [Supported File Formats](#supported-file-formats)
7. [User Guide](#user-guide)
   - [Loading a Model](#loading-a-model)
   - [Navigating the 3D Viewport](#navigating-the-3d-viewport)
   - [Scene Hierarchy Panel](#scene-hierarchy-panel)
   - [Properties Panel](#properties-panel)
   - [Performance Optimizations](#performance-optimizations)
   - [Demo Scene](#demo-scene)
   - [Exporting to GLB](#exporting-to-glb)
8. [Project Structure](#project-structure)
9. [Architecture Overview](#architecture-overview)
10. [Key Design Decisions](#key-design-decisions)
11. [Building for Production](#building-for-production)
12. [Known Limitations](#known-limitations)

---

## Features

| Feature                   | Description                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| 📂 **File Loading**       | Drag-and-drop or toolbar button for `.gltf`, `.glb`, `.ifc`                                  |
| 🌳 **Hierarchy Panel**    | Collapsible scene-graph tree with visibility toggle per node                                 |
| 🎯 **Two-Way Selection**  | Click mesh in viewport or hierarchy — both stay in sync; selected mesh gets a highlight glow |
| ↔ **Transform Editing**   | Edit position, rotation (degrees), and scale per axis directly in the Properties Panel       |
| 🎨 **Material Editing**   | Live-edit albedo color, opacity, metallic, and roughness on any PBR mesh                     |
| 👁 **Occlusion Culling**  | Optimistic occlusion — GPU skips meshes hidden behind solid geometry                         |
| 📐 **LOD Generation**     | Auto-generates 50% and 25% simplified mesh levels at distance thresholds                     |
| ✳ **Instanced Rendering** | Detects duplicate geometry and converts to GPU instances, reducing draw calls                |
| 🔗 **Mesh Merging**       | Merges static same-material meshes into single draw calls                                    |
| 🧊 **Demo Scene**         | Procedural 10×5×10 grid of 500 PBR meshes for stress-testing optimizations                   |
| ⬇ **GLB Export**          | Exports the current scene (with all edits) as a `.glb` file                                  |
| 📊 **Live Status Bar**    | Real-time FPS, triangle count, draw calls, active/total meshes, occlusion count              |

---

## Tech Stack

| Layer        | Technology                                    | Version          |
| ------------ | --------------------------------------------- | ---------------- |
| 3D Engine    | [@babylonjs/core](https://doc.babylonjs.com/) | ^7.0.0           |
| 3D Loaders   | @babylonjs/loaders                            | ^7.0.0           |
| GLB Export   | @babylonjs/serializers                        | ^7.0.0           |
| IFC Loader   | web-ifc-babylon + web-ifc                     | ^0.2.2 / ^0.0.41 |
| UI Framework | React                                         | ^18.3.0          |
| Language     | TypeScript (strict)                           | ^5.5.0           |
| Bundler      | Vite                                          | ^5.4.0           |
| Styling      | Plain CSS (BEM methodology)                   | —                |

---

## Prerequisites

- **Node.js** ≥ 18.x ([nodejs.org](https://nodejs.org))
- **npm** ≥ 9.x (bundled with Node)
- A modern browser with **WebGL 2** support (Chrome 80+, Firefox 75+, Edge 80+)

> [!NOTE]
> IFC file loading requires WebAssembly support, which is present in all modern browsers.

---

## Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/MarcosPimienta/glTF-model-viewer.git
cd glTF-model-viewer

# 2. Install dependencies
npm install
```

That's it — no environment variables or additional build tools required.

---

## Running the App

```bash
npm run dev
```

Vite will start a local dev server. Open your browser to:

```
http://localhost:5173
```

The page hot-reloads on every file save.

---

## Supported File Formats

| Extension | Format                              | Notes                                                                                                                                               |
| --------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.glb`    | **GL Transmission Format (Binary)** | Fully supported. Recommended for best performance.                                                                                                  |
| `.gltf`   | **GL Transmission Format (JSON)**   | Fully supported. May reference external `.bin` / texture files.                                                                                     |
| `.ifc`    | **Industry Foundation Classes**     | Loaded via WebAssembly (`web-ifc`). Geometry and materials load; IFC metadata (space relationships, classifications) is not editable in the viewer. |
| `.rvt`    | **Revit**                           | ❌ Not supported in the browser. Export to IFC or GLB from Revit first.                                                                             |

> [!TIP]
> You can **convert IFC → GLB** for free inside the viewer: load your `.ifc` file, then click **⬇ Export GLB** to download the geometry as a universally-compatible GLB. Note that IFC semantic metadata will not be preserved in the conversion.

---

## User Guide

### Loading a Model

**Option A — Drag and Drop**
Drag any `.gltf`, `.glb`, or `.ifc` file from your file explorer and drop it anywhere on the 3D viewport. A progress bar will appear while loading.

**Option B — Toolbar Button**
Click **📂 Load glTF** in the top toolbar to open a file picker dialog. The same formats are accepted.

> [!NOTE]
> Loading a new file clears the current scene, resets selection, and deactivates any active optimizations.

---

### Navigating the 3D Viewport

The viewport uses an **ArcRotate (orbital) camera**:

| Action     | Control                                    |
| ---------- | ------------------------------------------ |
| Orbit      | Left-click + drag                          |
| Pan        | Right-click + drag, or Middle-click + drag |
| Zoom       | Scroll wheel                               |
| Reset view | Double-click on an empty area              |

---

### Scene Hierarchy Panel

The left panel shows the full **scene graph** after a model is loaded.

| Element        | Description                                                                         |
| -------------- | ----------------------------------------------------------------------------------- |
| ▶ Arrow        | Expand / collapse a node's children                                                 |
| 👁 Eye icon    | Toggle visibility of that node (calls `node.setEnabled()`)                          |
| Node row click | Selects the node — highlights it in the viewport and populates the Properties Panel |

The hierarchy and the 3D viewport stay in **two-way sync**: clicking a mesh in the viewport scrolls and highlights the corresponding row in the hierarchy, and vice versa.

---

### Properties Panel

The right panel shows information and controls for the **currently selected node**.

#### General Section

Displays read-only info: node `Name`, `ID`, and Babylon.js class `Type`.

#### Transform Section

Editable **Position**, **Rotation**, and **Scale** for mesh nodes.

| Field    | Axes      | Notes                                                           |
| -------- | --------- | --------------------------------------------------------------- |
| Position | X / Y / Z | World-space units                                               |
| Rotation | X / Y / Z | Displayed in **degrees** (converted to/from radians internally) |
| Scale    | X / Y / Z | Multiplicative — `1.0` = original size                          |

Changes take effect **immediately** in the 3D viewport as you type.

#### Material Section

Appears for mesh nodes with a **PBR material** (PBRMaterial or PBRMetallicRoughnessMaterial).

| Control   | Range        | Description                                     |
| --------- | ------------ | ----------------------------------------------- |
| Albedo    | Color picker | Base / diffuse color of the surface             |
| Opacity   | 0.0 – 1.0    | `0` = fully transparent, `1` = fully opaque     |
| Metallic  | 0.0 – 1.0    | `0` = dielectric (plastic/fabric), `1` = metal  |
| Roughness | 0.0 – 1.0    | `0` = mirror-like specular, `1` = fully diffuse |

> [!IMPORTANT]
> The first time you edit a material, it is **automatically cloned**. This means your edits only affect the selected mesh — other meshes sharing the same original material are left unchanged.

---

### Performance Optimizations

The **Opts** group in the toolbar gives you four toggleable GPU/CPU optimizations. Each button lights up when active. Open the **Status Bar** at the bottom to see the measurable impact in real time.

#### 👁 Occlusion Culling

**What it does:** Sets every mesh to `OCCLUSION_TYPE_OPTIMISTIC`. The GPU submits occlusion queries each frame; meshes determined to be behind solid geometry are skipped in the next frame.

**When to use:** Scenes with many overlapping objects (buildings, rooms, dense forests).

**Status Bar metric to watch:** `Occluded` count increases as you zoom into enclosed spaces.

#### 📐 LOD (Level of Detail)

**What it does:** For every mesh with more than 5,000 vertices, two simplified clones are generated:

- At distance × 2 from the camera → 50% of original triangles
- At distance × 4 → 25% of original triangles

Babylon's `SimplificationQueue` (QUADRATIC decimation) handles the mesh reduction in a background worker so the UI doesn't freeze.

**When to use:** Large outdoor scenes, complex mechanical assemblies, any scene where you zoom in and out frequently.

**Status Bar metric to watch:** `Triangles` count drops as you zoom out.

> [!WARNING]
> LOD and Merge are **mutually exclusive**. Enabling LOD will automatically turn off Merge, and vice versa.

#### ✳ Instanced Rendering

**What it does:** Scans the scene for meshes that share identical geometry AND material. Duplicate meshes are replaced with GPU instances (`createInstance()`), which are rendered in a single draw call.

**When to use:** Scenes with many copies of the same object (trees, chairs, bolts, windows).

**Status Bar metric to watch:** `Instances` count increases; `Draw Calls` decreases.

#### 🔗 Merge (Draw Call Batching)

**What it does:** Groups non-skinned, non-animated meshes that share the same material and merges them into a single mesh using `Mesh.MergeMeshes()`. The originals are hidden and cached so the optimization can be reversed.

**When to use:** Static scenes with many small meshes of the same material.

**Status Bar metric to watch:** `Draw Calls` drops significantly.

> [!WARNING]
> LOD and Merge are **mutually exclusive** — see LOD note above.

**Toggling off** any optimization fully restores the scene to its pre-optimization state. All created instances, LOD meshes, and merged meshes are disposed cleanly.

---

### Demo Scene

Click **🧊 Demo Scene** in the toolbar to replace the current scene with a built-in procedural stress test:

- **10 × 5 × 10 grid = 500 meshes**
- Shape types: boxes, spheres, and cylinders (cycling by column)
- 5 PBR materials with evenly spread hues, varying metallic and roughness values per row
- All meshes are created as **GPU instances** of 3 source meshes from the start

Use this to experiment with all four optimization toggles and see the Stats Bar numbers move without needing an external file.

---

### Exporting to GLB

Click **⬇ Export GLB** in the toolbar (disabled until a scene is loaded).

- Downloads a `.glb` file named after the original loaded file (e.g. loading `robot.glb` exports `robot.glb`)
- All edits are baked into the export: material changes, transform changes, etc.
- Works on both user-loaded files **and** the Demo Scene
- Works on IFC-loaded geometry (geometry only — no IFC metadata)

Uses `GLTF2Export.GLBAsync` from `@babylonjs/serializers`.

---

## Project Structure

```
glTF-model-viewer/
├── index.html                    # Vite entry HTML
├── package.json
├── tsconfig.json                 # Strict TypeScript config
├── vite.config.ts                # Vite + React plugin
│
└── src/
    ├── main.tsx                  # React root (renders <App />)
    ├── App.tsx                   # Root component — composes layout, owns shared state
    ├── App.css                   # Global CSS variables (design tokens), reset, layout
    │
    ├── types/
    │   └── index.ts              # Shared TypeScript interfaces (SceneStats, OptimizationState, etc.)
    │
    ├── hooks/
    │   ├── useBabylonEngine.ts   # Babylon Engine + Scene + Camera + Environment setup
    │   ├── useModelLoader.ts     # SceneLoader wrapper, loading state, drag-and-drop logic
    │   └── useOptimizations.ts  # All 4 optimization toggles + clean-up refs
    │
    ├── utils/
    │   ├── exportScene.ts        # GLTF2Export.GLBAsync wrapper → browser download
    │   └── demoScene.ts          # Procedural 10×5×10 PBR grid generator
    │
    └── components/
        ├── Toolbar.tsx           # Top bar: file load, gizmo stubs, opt toggles, export
        ├── Viewer.tsx            # <canvas> + Babylon scene, drag-and-drop, highlight layer
        ├── HierarchyPanel.tsx    # Left scene-tree, expand/collapse, visibility, selection
        ├── PropertiesPanel.tsx   # Right panel: general info, transform, material editor
        ├── StatusBar.tsx         # Bottom bar: live FPS, triangles, draw calls, etc.
        │
        └── styles/
            ├── Toolbar.css
            ├── Viewer.css
            ├── HierarchyPanel.css
            ├── PropertiesPanel.css
            └── StatusBar.css
```

---

## Architecture Overview

```
App.tsx  (shared state: scene, selectedNodeId, activeModelName, optState)
│
├── scene ──────────────────────── created by useBabylonEngine (inside Viewer)
│                                   and bubbled up via onSceneReady callback
│
├── useModelLoader(scene) ────────── loadModel(file), loadingState
│
├── useOptimizations(scene) ──────── optState, toggle*()
│
├── <Toolbar>         ← onLoadFile, onLoadDemoScene, scene, optState, toggle*
├── <HierarchyPanel>  ← scene, selectedNodeId, onSelectNode, isLoading
├── <Viewer>          ← onSceneReady, onFileDrop, selectedNodeId, onSelectNode
├── <PropertiesPanel> ← scene, selectedNodeId
└── <StatusBar>       ← scene, filename
```

**Data flow principles:**

- The Babylon.js `Scene` object is the single source of truth for 3D state. It is created inside `<Viewer>` and lifted to `App` via the `onSceneReady` callback.
- `selectedNodeId` (a Babylon `uniqueId` or IFC `expressID`) lives in `App` and flows down to both `<Viewer>` and `<HierarchyPanel>`, keeping them in sync.
- All optimization state is managed in `useOptimizations`; refs inside that hook track created resources (LOD meshes, instances, merged meshes) for lossless toggle-off.

---

## Key Design Decisions

**Why BEM CSS instead of a utility framework?**
Zero runtime overhead, no build-time purging needed, and the design tokens in `App.css` `:root` give full global consistency without any framework lock-in.

**Why lift `scene` to `App` state?**
`scene` is needed by the Properties Panel, Status Bar, Optimizations hook, and Export function — all siblings of `<Viewer>`. Lifting it once avoids prop drilling through a context provider for a small app.

**Material cloning before first edit**
When you edit a PBR material property, the material is cloned on the first change and reassigned to that mesh only. This prevents edits from propagating to other meshes that share the same source material — a common bug in 3D editors.

**LOD ↔ Merge mutual exclusivity**
Both features restructure the mesh geometry in the scene. Allowing them simultaneously would require complex ordering logic and difficult cleanup. Automatically disabling one when the other is enabled keeps the UX predictable.

**IFC via WebAssembly**
`web-ifc` runs the full IFC geometry kernel in a `.wasm` module in the browser — no server required. The `.wasm` files are served from the `public/` directory.

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. The build runs `tsc` (type-check) then Vite's optimized bundler.

To preview the production build locally:

```bash
npm run preview
```

> [!IMPORTANT]
> When deploying, ensure your web server serves `.wasm` files with the `application/wasm` MIME type — some hosts (e.g. older Apache configs) don't do this by default, which will break IFC loading.

---

## Known Limitations

- **`.rvt` (Revit)** files cannot be loaded. Export to IFC or GLB from Revit first.
- **IFC metadata** (classifications, properties, spatial structure) is not surfaced in the UI — only geometry and materials are accessible.
- **LOD simplification** runs asynchronously via Babylon's `SimplificationQueue`. On very large models (millions of vertices), it may take several seconds to complete in the background after clicking the toggle.
- **Merge optimization** skips skinned (rigged) and animated meshes to avoid breaking animations.
- **Gizmo controls** (Translate / Rotate / Scale toolbar buttons) are UI stubs — transform editing via the Properties Panel inputs is fully functional.

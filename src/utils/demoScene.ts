import {
  Scene,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Vector3,
} from "@babylonjs/core";

/**
 * Clears the current scene (except cameras, lights, environment) and
 * generates a 10×5×10 grid of procedural PBR meshes (500 total) as a
 * stress-test for the optimization features.
 *
 * Shape variety: cubes, spheres, cylinders — chosen by column index.
 * Material variety: random hue, metallic, roughness per row.
 */
export function loadDemoScene(scene: Scene): void {
  // ── Dispose existing user-loaded meshes ───────────────────────────────────
  const toDispose = scene.meshes.filter(
    m =>
      !m.name.startsWith("__") &&
      !m.name.startsWith("BackgroundSkybox") &&
      !m.name.startsWith("BackgroundPlane") &&
      m.name !== "environmentHelper"
  );
  toDispose.forEach(m => m.dispose());

  // ── Grid parameters ───────────────────────────────────────────────────────
  const COLS   = 10;   // X
  const ROWS   = 5;    // Y
  const DEPTHS = 10;   // Z
  const SPACING = 2.2; // units between mesh centres

  // Offset so the grid is centred at the origin
  const offsetX = ((COLS  - 1) * SPACING) / 2;
  const offsetY = 0;
  const offsetZ = ((DEPTHS - 1) * SPACING) / 2;

  // Reusable source meshes (one per shape type) — will be instanced
  const shapeSources: Mesh[] = [
    MeshBuilder.CreateBox("src_box", { size: 1 }, scene),
    MeshBuilder.CreateSphere("src_sphere", { diameter: 1, segments: 8 }, scene),
    MeshBuilder.CreateCylinder("src_cylinder", { height: 1, diameter: 0.9, tessellation: 12 }, scene),
  ];

  // Hide sources (instances will inherit visibility)
  shapeSources.forEach(m => { m.isVisible = false; });

  // Pre-build one PBR material per ROW (5 materials)
  const rowMaterials: PBRMaterial[] = Array.from({ length: ROWS }, (_, row) => {
    const mat = new PBRMaterial(`demo_mat_row${row}`, scene);
    // Evenly spread hues across the spectrum
    const hue = (row / ROWS) * 360;
    mat.albedoColor = hslToColor3(hue, 0.75, 0.55);
    mat.metallic    = row % 2 === 0 ? 0.8 : 0.1;
    mat.roughness   = 0.1 + (row / ROWS) * 0.8;
    return mat;
  });

  // ── Generate instances ─────────────────────────────────────────────────────
  let count = 0;
  for (let xi = 0; xi < COLS; xi++) {
    for (let yi = 0; yi < ROWS; yi++) {
      for (let zi = 0; zi < DEPTHS; zi++) {
        const shapeIdx  = (xi + zi) % shapeSources.length;
        const source    = shapeSources[shapeIdx];
        const inst      = source.createInstance(`demo_${count++}`);

        inst.position = new Vector3(
          xi * SPACING - offsetX,
          yi * SPACING + offsetY,
          zi * SPACING - offsetZ
        );

        inst.material = rowMaterials[yi];
      }
    }
  }

  console.log(`[demoScene] Generated ${count} instances across a ${COLS}×${ROWS}×${DEPTHS} grid.`);
}

// ─── Utility: HSL (0-360, 0-1, 0-1) → Babylon Color3 ────────────────────────

function hslToColor3(h: number, s: number, l: number): Color3 {
  h = h / 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return new Color3(r, g, b);
}


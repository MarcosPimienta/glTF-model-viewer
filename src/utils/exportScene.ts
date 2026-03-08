import { GLTF2Export } from "@babylonjs/serializers/glTF";
import type { Scene } from "@babylonjs/core";

/**
 * Exports the current Babylon.js scene as a .glb file and triggers
 * a browser download. Falls back gracefully if serializers aren't available.
 *
 * @param scene   - The live Babylon.js scene to export.
 * @param filename - Desired download filename (without extension). Defaults to "scene".
 */
export async function exportSceneAsGLB(
  scene: Scene,
  filename: string = "scene"
): Promise<void> {
  try {
    const glb = await GLTF2Export.GLBAsync(scene, filename, {
      // Include all meshes (even those currently invisible / LOD'd)
      shouldExportNode: () => true,
    });

    // GLTF2Export writes to a map of filename → Blob
    glb.downloadFiles();
  } catch (err) {
    console.error("[exportSceneAsGLB] Export failed:", err);
    alert("GLB export failed. See the browser console for details.");
  }
}

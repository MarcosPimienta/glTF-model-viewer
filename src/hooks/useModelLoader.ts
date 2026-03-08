import { useState, useCallback } from "react";
import { Scene, SceneLoader } from "@babylonjs/core";
import "@babylonjs/loaders"; // registers GLTF/GLB loaders

// We need to import the IFC loader plugin side-effect
// Note: In Babylon 7, the IFC loader relies on web-ifc being available.
import "web-ifc-babylon/loaders/IFC";

// Re-use our LoadingState interface
import type { LoadingState } from "../types";

export function useModelLoader(scene: Scene | null) {
  // We start in an inactive state
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    fileName: null,
  });

  const loadModel = useCallback(
    async (file: File) => {
      // 1. Safety check
      if (!scene) {
        console.warn("Cannot load model: Scene is not ready.");
        return;
      }

      // 2. Reject RVT files immediately with a helpful alert
      if (file.name.toLowerCase().endsWith(".rvt")) {
        alert(
          "Revit (.rvt) files cannot be loaded directly in the browser because they are closed/proprietary formats.\n\n" +
            "Please export your model from Revit as an IFC or GLB file first, then load that here."
        );
        return;
      }

      // 3. Prevent loading multiple models at the same exact time
      if (loadingState.isLoading) {
        console.warn("A model is already loading.");
        return;
      }

      // 4. Update state to show the progress UI
      setLoadingState({
        isLoading: true,
        progress: 0,
        fileName: file.name,
      });

      try {
        // 5. Tell Babylon's SceneLoader to load this specific File.
        // We use SceneLoader.AppendAsync so it adds to our existing scene.
        // 
        // Arguments: 
        // rootUrl (file object for local files), 
        // scene to append to, 
        // onProgress callback
        
        await SceneLoader.AppendAsync(
          // For local files dragged/dropped in the browser, Babylon accepts a File object directly
          // We pass empty string for rootUrl, and the File directly as the fileName
          "file:", 
          file as any, // Babylon types sometimes want string, but File works under the hood
          scene,
          (event) => {
            // Calculate percentage if we know the total file size
            if (event.lengthComputable) {
              const percentage = (event.loaded / event.total) * 100;
              setLoadingState((prev) => ({
                ...prev,
                progress: percentage,
              }));
            }
          }
        );

        // 6. Camera auto-framing
        // Once loaded, we want the camera to look at the new model so they don't get lost
        const camera = scene.activeCamera as any; // Cast to bypass strict type if needed, or use ArcRotateCamera
        if (camera && camera.setTarget) {
          // Frame the whole scene bounding box
          camera.setTarget(scene.meshes[0] || camera.target);
          
          // A safer auto-framing method is zooming on meshes:
          if (scene.meshes.length > 0) {
              // We'll refine this in Polish phase, for now just point at center
              camera.setTarget(scene.meshes[scene.meshes.length-1]);
          }
        }

      } catch (error) {
        console.error("Error loading model:", error);
        alert(`Failed to load ${file.name}. Check the console for details.`);
      } finally {
        // 7. Always turn off the loading overlay when done (or if failed)
        setLoadingState({
          isLoading: false,
          progress: 100,
          fileName: null,
        });
      }
    },
    [scene, loadingState.isLoading]
  );

  return { loadModel, loadingState };
}

import { useState, useRef, useCallback } from "react";
import {
  AbstractMesh,
  Mesh,
  Scene,
  SimplificationSettings,
  SimplificationType,
} from "@babylonjs/core";
import type { OptimizationState } from "../types/index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseOptimizationsReturn {
  optState: OptimizationState;
  toggleOcclusion:  () => void;
  toggleLOD:        () => void;
  toggleInstancing: () => void;
  toggleMerging:    () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_STATE: OptimizationState = {
  frustumCulling:    true,
  occlusionCulling:  false,
  lodEnabled:        false,
  instancingEnabled: false,
  mergingEnabled:    false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOptimizations(scene: Scene | null): UseOptimizationsReturn {
  const [optState, setOptState] = useState<OptimizationState>(DEFAULT_STATE);

  // ── Refs to track created resources for clean-up ─────────────────────────
  /** LOD: map from source mesh → array of [lodMesh, distance] tuples */
  const lodMapRef = useRef<Map<Mesh, Mesh[]>>(new Map());

  /** Instancing: instancedMeshes we created + originals we hid */
  const instancedMeshesRef = useRef<Mesh[]>([]);
  const hiddenOriginalsRef = useRef<AbstractMesh[]>([]);

  /** Merge: merged result meshes + original meshes we hid */
  const mergedMeshesRef = useRef<Mesh[]>([]);
  const premergeHiddenRef = useRef<AbstractMesh[]>([]);

  // ── Helper: get candidate meshes (skip internals) ─────────────────────────
  function getCandidates(s: Scene): Mesh[] {
    return s.meshes.filter(
      (m): m is Mesh =>
        m instanceof Mesh &&
        !m.name.startsWith("__") &&        // Babylon internals
        m.getTotalVertices() > 0 &&
        m.isEnabled()
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10a — Occlusion Culling
  // ─────────────────────────────────────────────────────────────────────────
  const toggleOcclusion = useCallback(() => {
    if (!scene) return;
    setOptState(prev => {
      const enabling = !prev.occlusionCulling;
      scene.meshes.forEach(m => {
        m.occlusionType = enabling
          ? AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC
          : AbstractMesh.OCCLUSION_TYPE_NONE;
      });
      return { ...prev, occlusionCulling: enabling };
    });
  }, [scene]);

  // ─────────────────────────────────────────────────────────────────────────
  // 10b — LOD Generation
  // ─────────────────────────────────────────────────────────────────────────
  const toggleLOD = useCallback(() => {
    if (!scene) return;
    setOptState(prev => {
      const enabling = !prev.lodEnabled;

      if (enabling) {
        // Auto-disable Merge first (mutually exclusive)
        if (prev.mergingEnabled) {
          _disableMerging(scene);
        }

        const candidates = getCandidates(scene).filter(
          m => m.getTotalVertices() > 5000
        );

        candidates.forEach(mesh => {
          const radius =
            mesh.getBoundingInfo().boundingSphere.radiusWorld || 10;
          const dist50 = radius * 2;
          const dist25 = radius * 4;

          // 50% LOD
          const lod50 = mesh.clone(mesh.name + "_lod50", null) as Mesh;
          lod50.setEnabled(false);
          mesh.addLODLevel(dist50, lod50);
          lod50.simplify(
            [new SimplificationSettings(0.5, dist50)],
            false,
            SimplificationType.QUADRATIC
          );

          // 25% LOD
          const lod25 = mesh.clone(mesh.name + "_lod25", null) as Mesh;
          lod25.setEnabled(false);
          mesh.addLODLevel(dist25, lod25);
          lod25.simplify(
            [new SimplificationSettings(0.25, dist25)],
            false,
            SimplificationType.QUADRATIC
          );

          lodMapRef.current.set(mesh, [lod50, lod25]);
        });

        return { ...prev, lodEnabled: true, mergingEnabled: false };
      } else {
        _disableLOD(scene);
        return { ...prev, lodEnabled: false };
      }
    });
  }, [scene]);

  function _disableLOD(_scene: Scene) {
    lodMapRef.current.forEach((lodMeshes, srcMesh) => {
      lodMeshes.forEach(lod => {
        srcMesh.removeLODLevel(lod);
        lod.dispose();
      });
    });
    lodMapRef.current.clear();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10c — Instanced Rendering
  // ─────────────────────────────────────────────────────────────────────────
  const toggleInstancing = useCallback(() => {
    if (!scene) return;
    setOptState(prev => {
      const enabling = !prev.instancingEnabled;

      if (enabling) {
        const candidates = getCandidates(scene);

        // Group by geometry + material id
        const groups = new Map<string, Mesh[]>();
        candidates.forEach(mesh => {
          const geoId = mesh.geometry?.id ?? "no-geo";
          const matId = mesh.material?.uniqueId?.toString() ?? "no-mat";
          const key = `${geoId}::${matId}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(mesh);
        });

        groups.forEach(group => {
          if (group.length < 2) return;
          const [source, ...duplicates] = group;
          duplicates.forEach(dup => {
            const inst = source.createInstance(dup.name + "_inst");
            inst.position.copyFrom(dup.position);
            inst.rotation.copyFrom(dup.rotation);
            inst.scaling.copyFrom(dup.scaling);
            dup.setEnabled(false);
            hiddenOriginalsRef.current.push(dup);
            instancedMeshesRef.current.push(inst as unknown as Mesh);
          });
        });
      } else {
        // Restore originals, dispose instances
        instancedMeshesRef.current.forEach(inst => inst.dispose());
        instancedMeshesRef.current = [];
        hiddenOriginalsRef.current.forEach(m => m.setEnabled(true));
        hiddenOriginalsRef.current = [];
      }

      return { ...prev, instancingEnabled: enabling };
    });
  }, [scene]);

  // ─────────────────────────────────────────────────────────────────────────
  // 10d — Mesh Merging
  // ─────────────────────────────────────────────────────────────────────────
  const toggleMerging = useCallback(() => {
    if (!scene) return;
    setOptState(prev => {
      const enabling = !prev.mergingEnabled;

      if (enabling) {
        // Auto-disable LOD first (mutually exclusive)
        if (prev.lodEnabled) {
          _disableLOD(scene);
        }

        const candidates = getCandidates(scene).filter(
          // Skip skinned / animated meshes
          m => !m.skeleton && m.animations.length === 0
        );

        // Group by material unique id
        const groups = new Map<string, Mesh[]>();
        candidates.forEach(mesh => {
          const matId = mesh.material?.uniqueId?.toString() ?? "no-mat";
          if (!groups.has(matId)) groups.set(matId, []);
          groups.get(matId)!.push(mesh);
        });

        groups.forEach(group => {
          if (group.length < 2) return;
          const merged = Mesh.MergeMeshes(group, false, true, undefined, false, true);
          if (merged) {
            merged.name = "merged_" + (group[0].material?.name ?? "group");
            mergedMeshesRef.current.push(merged);
            // Hide originals
            group.forEach(m => {
              m.setEnabled(false);
              premergeHiddenRef.current.push(m);
            });
          }
        });

        return { ...prev, mergingEnabled: true, lodEnabled: false };
      } else {
        _disableMerging(scene);
        return { ...prev, mergingEnabled: false };
      }
    });
  }, [scene]);

  function _disableMerging(_scene: Scene) {
    mergedMeshesRef.current.forEach(m => m.dispose());
    mergedMeshesRef.current = [];
    premergeHiddenRef.current.forEach(m => m.setEnabled(true));
    premergeHiddenRef.current = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  return {
    optState,
    toggleOcclusion,
    toggleLOD,
    toggleInstancing,
    toggleMerging,
  };
}

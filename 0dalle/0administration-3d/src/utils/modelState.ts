import {
  DEFAULT_ACTIVE_MODEL_ID,
  PRESENTATION_MODELS,
  type ModelActivationMap,
  type PresentationModelId,
  type PresentationModelSpec,
} from '../types/models';

export const MODEL_STATE_STORAGE_KEY = 'pixiatech.admin.presentation3d.state.v1';

export function createInitialModelState(
  activeId: PresentationModelId | null = DEFAULT_ACTIVE_MODEL_ID,
): ModelActivationMap {
  return {
    holographique: activeId === 'holographique',
    'smd-50x50': activeId === 'smd-50x50',
    'smd-50x100': activeId === 'smd-50x100',
    'dalle-sample': activeId === 'dalle-sample',
    transparent: activeId === 'transparent',
  };
}

/**
 * Toggles a specific model switch.
 * - Turning an OFF model ON activates it and switches the others OFF (single active presentation model).
 * - Turning the currently ON model OFF leaves all models OFF (standby state).
 */
export function toggleModelById(
  currentState: ModelActivationMap,
  targetId: PresentationModelId,
): ModelActivationMap {
  const isCurrentlyOn = Boolean(currentState[targetId]);
  if (isCurrentlyOn) {
    return createInitialModelState(null);
  }
  return createInitialModelState(targetId);
}

export function getActiveModel(
  state: ModelActivationMap,
): PresentationModelSpec | null {
  for (const model of PRESENTATION_MODELS) {
    if (state[model.id]) {
      return model;
    }
  }
  return null;
}

export function countActiveModels(state: ModelActivationMap): number {
  let count = 0;
  for (const model of PRESENTATION_MODELS) {
    if (state[model.id]) count += 1;
  }
  return count;
}

export function serializeModelState(state: ModelActivationMap): string {
  return JSON.stringify(state);
}

export function deserializeModelState(raw: string | null): ModelActivationMap {
  if (!raw) {
    return createInitialModelState(DEFAULT_ACTIVE_MODEL_ID);
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createInitialModelState(DEFAULT_ACTIVE_MODEL_ID);
    }
    const record = parsed as Record<string, unknown>;
    const validIds = PRESENTATION_MODELS.map((m) => m.id);
    let selectedId: PresentationModelId | null = null;
    for (const id of validIds) {
      if (record[id] === true) {
        selectedId = id;
        break;
      }
    }
    // Verify the stored object actually had boolean keys for the known schema
    const hasSchemaKey = validIds.some((id) => typeof record[id] === 'boolean');
    if (!hasSchemaKey) {
      return createInitialModelState(DEFAULT_ACTIVE_MODEL_ID);
    }
    return createInitialModelState(selectedId);
  } catch {
    return createInitialModelState(DEFAULT_ACTIVE_MODEL_ID);
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESENTATION_MODELS } from '../types/models';
import {
  countActiveModels,
  createInitialModelState,
  deserializeModelState,
  getActiveModel,
  serializeModelState,
  toggleModelById,
} from './modelState';

test('catalog contains the exact five required PIXIATECH models', () => {
  assert.equal(PRESENTATION_MODELS.length, 5);
  assert.deepEqual(
    PRESENTATION_MODELS.map((m) => m.name),
    [
      'Holographique',
      'Dalle SMD 50x50',
      'Dalle SMD 50x100',
      'Dalle Sample',
      'Transparent',
    ],
  );
});

test('initial state activates Dalle SMD 50x50 by default', () => {
  const state = createInitialModelState();
  assert.equal(state['smd-50x50'], true);
  assert.equal(countActiveModels(state), 1);
  assert.equal(getActiveModel(state)?.name, 'Dalle SMD 50x50');
});

test('toggling an inactive model activates it and deactivates the previous model', () => {
  const initial = createInitialModelState();
  const next = toggleModelById(initial, 'holographique');

  assert.equal(next.holographique, true);
  assert.equal(next['smd-50x50'], false);
  assert.equal(countActiveModels(next), 1);
  assert.equal(getActiveModel(next)?.id, 'holographique');
});

test('toggling the currently active model turns it OFF (standby state)', () => {
  const initial = createInitialModelState('transparent');
  const next = toggleModelById(initial, 'transparent');

  assert.equal(next.transparent, false);
  assert.equal(countActiveModels(next), 0);
  assert.equal(getActiveModel(next), null);
});

test('every one of the five models can be individually activated', () => {
  let state = createInitialModelState(null);
  for (const model of PRESENTATION_MODELS) {
    state = toggleModelById(state, model.id);
    assert.equal(state[model.id], true);
    assert.equal(countActiveModels(state), 1);
    assert.equal(getActiveModel(state)?.id, model.id);
  }
});

test('serialization round-trips active and all-OFF states accurately', () => {
  const active = createInitialModelState('dalle-sample');
  const roundTripped = deserializeModelState(serializeModelState(active));
  assert.deepEqual(roundTripped, active);

  const allOff = createInitialModelState(null);
  const roundTrippedOff = deserializeModelState(serializeModelState(allOff));
  assert.deepEqual(roundTrippedOff, allOff);
});

test('deserialization recovers safely from invalid or empty payloads', () => {
  const fromNull = deserializeModelState(null);
  assert.equal(getActiveModel(fromNull)?.id, 'smd-50x50');

  const fromInvalidJson = deserializeModelState('{broken-json');
  assert.equal(getActiveModel(fromInvalidJson)?.id, 'smd-50x50');

  const fromUnrelatedObject = deserializeModelState('{"foo":true}');
  assert.equal(getActiveModel(fromUnrelatedObject)?.id, 'smd-50x50');
});

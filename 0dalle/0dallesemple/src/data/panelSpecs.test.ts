import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKGROUND_PHASES, computeWallMetrics } from './panelSpecs';

test('computeWallMetrics calculates single 600x337.5mm cabinet metrics accurately', () => {
  const m = computeWallMetrics('p12', 1, 1);
  assert.equal(m.cabinetCount, 1);
  assert.equal(m.moduleCount, 4);
  assert.equal(m.totalWidthMm, 600);
  assert.equal(m.totalHeightMm, 337.5);
  assert.equal(m.areaSqm, 0.2);
  assert.equal(m.totalResX, 480);
  assert.equal(m.totalResY, 270);
  assert.equal(m.totalWeightKg, 4.9);
});

test('computeWallMetrics scales 3x2 architectural surface accurately', () => {
  const m = computeWallMetrics('p09', 3, 2);
  assert.equal(m.cabinetCount, 6);
  assert.equal(m.moduleCount, 24);
  assert.equal(m.totalWidthMm, 1800);
  assert.equal(m.totalHeightMm, 675);
  assert.equal(m.areaSqm, 1.22);
  assert.equal(m.totalResX, 1920);
  assert.equal(m.totalResY, 720);
  assert.equal(m.totalWeightKg, 29.4);
});

test('BACKGROUND_PHASES defines Phase 1, Phase 2, and Phase 3 color atmospheres', () => {
  const keys = Object.keys(BACKGROUND_PHASES);
  assert.deepEqual(keys, ['phase1', 'phase2', 'phase3']);
  assert.equal(BACKGROUND_PHASES.phase1.label, 'Phase 1');
  assert.equal(BACKGROUND_PHASES.phase2.label, 'Phase 2');
  assert.equal(BACKGROUND_PHASES.phase3.label, 'Phase 3');
});

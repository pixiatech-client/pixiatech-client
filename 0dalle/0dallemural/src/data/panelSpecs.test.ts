import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKGROUND_PHASES,
  clampHorizontalPanelCount,
  computeWallMetrics,
  getActiveHorizontalCols,
  getHorizontalCenterOffset,
  getHorizontalSlotIndex,
  HORIZONTAL_PANEL_COUNTS,
  INSTALLATION_MODES,
} from './panelSpecs';

test('INSTALLATION_MODES exposes standing (SUR PIED), wall (MURAL), and suspended (SUSPENDU)', () => {
  assert.deepEqual(Object.keys(INSTALLATION_MODES), ['standing', 'wall', 'suspended']);
  assert.equal(INSTALLATION_MODES.standing.label, 'SUR PIED');
  assert.equal(INSTALLATION_MODES.wall.label, 'MURAL');
  assert.equal(INSTALLATION_MODES.suspended.label, 'SUSPENDU');
  assert.deepEqual(HORIZONTAL_PANEL_COUNTS, [1, 2, 3, 4]);
});

test('computeWallMetrics enforces single-row horizontal scaling without vertical stacking', () => {
  const m1 = computeWallMetrics('p12', 1, 'standing');
  assert.equal(m1.cols, 1);
  assert.equal(m1.rows, 1);
  assert.equal(m1.cabinetCount, 1);
  assert.equal(m1.moduleCount, 4);
  assert.equal(m1.totalWidthMm, 1000);
  assert.equal(m1.totalHeightMm, 2000);
  assert.equal(m1.areaSqm, 2);
  assert.equal(m1.totalResX, 256);
  assert.equal(m1.totalResY, 512);
  assert.equal(m1.totalWeightKg, 25.9);

  const m3Wall = computeWallMetrics('p12', 3, 'wall');
  assert.equal(m3Wall.cols, 3);
  assert.equal(m3Wall.rows, 1);
  assert.equal(m3Wall.cabinetCount, 3);
  assert.equal(m3Wall.moduleCount, 12);
  assert.equal(m3Wall.totalWidthMm, 3000);
  assert.equal(m3Wall.totalHeightMm, 2000);
  assert.equal(m3Wall.areaSqm, 6);
  assert.equal(m3Wall.totalResX, 768);
  assert.equal(m3Wall.totalResY, 512);
  assert.equal(m3Wall.totalWeightKg, 54.4);

  const m4Susp = computeWallMetrics('p12', 4, 'suspended');
  assert.equal(m4Susp.cols, 4);
  assert.equal(m4Susp.rows, 1);
  assert.equal(m4Susp.totalWidthMm, 4000);
  assert.equal(m4Susp.totalHeightMm, 2000);
  assert.equal(m4Susp.totalWeightKg, 69.3);
});

test('horizontal assembly slot indices and centering stay symmetrical for 1 to 4 panels', () => {
  assert.equal(clampHorizontalPanelCount(0), 1);
  assert.equal(clampHorizontalPanelCount(99), 4);
  assert.deepEqual(getActiveHorizontalCols(1), [0]);
  assert.deepEqual(getActiveHorizontalCols(2), [0, 1]);
  assert.deepEqual(getActiveHorizontalCols(3), [-1, 0, 1]);
  assert.deepEqual(getActiveHorizontalCols(4), [-1, 0, 1, 2]);

  assert.equal(getHorizontalSlotIndex(-1, 4), 0);
  assert.equal(getHorizontalSlotIndex(0, 4), 1);
  assert.equal(getHorizontalSlotIndex(1, 4), 2);
  assert.equal(getHorizontalSlotIndex(2, 4), 3);

  assert.equal(getHorizontalCenterOffset(1, 1.8), 0);
  assert.equal(getHorizontalCenterOffset(2, 1.8), -0.9);
  assert.equal(getHorizontalCenterOffset(3, 1.8), 0);
  assert.equal(getHorizontalCenterOffset(4, 1.8), -0.9);
});

test('BACKGROUND_PHASES defines Phase 1, Phase 2, and Phase 3 color atmospheres', () => {
  const keys = Object.keys(BACKGROUND_PHASES);
  assert.deepEqual(keys, ['phase1', 'phase2', 'phase3']);
  assert.equal(BACKGROUND_PHASES.phase1.label, 'Phase 1');
  assert.equal(BACKGROUND_PHASES.phase2.label, 'Phase 2');
  assert.equal(BACKGROUND_PHASES.phase3.label, 'Phase 3');
  assert.equal(BACKGROUND_PHASES.phase3.swatchHex, '#10B981');
});

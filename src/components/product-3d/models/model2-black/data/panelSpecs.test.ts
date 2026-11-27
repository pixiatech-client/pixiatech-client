import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKGROUND_PHASES,
  clampCurvatureDeg,
  computeWallMetrics,
  CURVATURE_LIMIT_DEG,
  CURVATURE_SURFACE_MULTIPLIER,
  CURVATURE_VISUAL_MULTIPLIER,
  evaluateCurvedRailSlide,
  evaluatePanelCurve,
  evaluateWingCurve,
  toInternalCurvatureDeg,
  WALL_LAYOUT_SPECS,
} from './panelSpecs';

test('computeWallMetrics calculates single 500x500mm outdoor square cabinet metrics accurately', () => {
  const m = computeWallMetrics('p12', 1, 1);
  assert.equal(m.cabinetCount, 1);
  assert.equal(m.moduleCount, 4);
  assert.equal(m.totalWidthMm, 500);
  assert.equal(m.totalHeightMm, 500);
  assert.equal(m.areaSqm, 0.25);
  assert.equal(m.totalResX, 192);
  assert.equal(m.totalResY, 192);
  assert.equal(m.totalWeightKg, 7.4);
});

test('computeWallMetrics scales 3x2, 2x3, and 3x3 outdoor wall layouts accurately', () => {
  const m32 = computeWallMetrics('p09', WALL_LAYOUT_SPECS['3x2'].cols, WALL_LAYOUT_SPECS['3x2'].rows);
  assert.equal(m32.cabinetCount, 6);
  assert.equal(m32.totalWidthMm, 1500);
  assert.equal(m32.totalHeightMm, 1000);
  assert.equal(m32.areaSqm, 1.5);

  const m23 = computeWallMetrics('p09', WALL_LAYOUT_SPECS['2x3'].cols, WALL_LAYOUT_SPECS['2x3'].rows);
  assert.equal(m23.cabinetCount, 6);
  assert.equal(m23.totalWidthMm, 1000);
  assert.equal(m23.totalHeightMm, 1500);

  const m33 = computeWallMetrics('p09', WALL_LAYOUT_SPECS['3x3'].cols, WALL_LAYOUT_SPECS['3x3'].rows);
  assert.equal(m33.cabinetCount, 9);
  assert.equal(m33.moduleCount, 36);
  assert.equal(m33.totalWidthMm, 1500);
  assert.equal(m33.totalHeightMm, 1500);
  assert.equal(m33.areaSqm, 2.25);
});

test('BACKGROUND_PHASES defines Phase 1, Phase 2, and Phase 3 color atmospheres', () => {
  const keys = Object.keys(BACKGROUND_PHASES);
  assert.deepEqual(keys, ['phase1', 'phase2', 'phase3']);
  assert.equal(BACKGROUND_PHASES.phase1.label, 'Phase 1');
  assert.equal(BACKGROUND_PHASES.phase2.label, 'Phase 2');
  assert.equal(BACKGROUND_PHASES.phase3.label, 'Phase 3');
  assert.equal(BACKGROUND_PHASES.phase3.swatchHex, '#10B981');
  assert.equal(evaluateCurvedRailSlide(30), 1);
  assert.equal(evaluateCurvedRailSlide(-30), -1);
  assert.equal(evaluateCurvedRailSlide(0), 0);
  assert.equal(evaluateCurvedRailSlide(60), 1);
});

test('clampCurvatureDeg and toInternalCurvatureDeg apply 2x in 1x1 and 1x in 3x2', () => {
  assert.equal(CURVATURE_LIMIT_DEG, 30);
  assert.equal(clampCurvatureDeg(-45), -30);
  assert.equal(clampCurvatureDeg(45), 30);
  assert.equal(clampCurvatureDeg(15), 15);
  assert.equal(clampCurvatureDeg(Number.NaN), 0);
  assert.equal(toInternalCurvatureDeg(30, CURVATURE_VISUAL_MULTIPLIER), 60);
  assert.equal(toInternalCurvatureDeg(-30, CURVATURE_VISUAL_MULTIPLIER), -60);
  assert.equal(toInternalCurvatureDeg(30, CURVATURE_SURFACE_MULTIPLIER), 30);
  assert.equal(toInternalCurvatureDeg(-30, CURVATURE_SURFACE_MULTIPLIER), -30);
});

test('evaluatePanelCurve preserves flat coordinates at 0 deg and applies 2x internal arc at +-30 deg UI', () => {
  const flat = evaluatePanelCurve(-1.2, 0.05, 1.5, 0, 0);
  assert.equal(flat.x, -1.2);
  assert.equal(flat.z, 0.05);
  assert.equal(flat.angleY, 0);

  // Left wing +30 deg UI bends internally by +60 deg (PI/3) forward (+Z)
  const leftFwd = evaluatePanelCurve(-1.5, 0, 1.5, 30, 0);
  assert.ok(leftFwd.z > 0.7);
  assert.ok(leftFwd.x < 0 && leftFwd.x > -1.5);
  assert.ok(Math.abs(leftFwd.angleY - Math.PI / 3) < 1e-6);

  // Right wing -30 deg UI bends internally by -60 deg (-PI/3 -> angleY = +PI/3) backward (-Z)
  const rightBack = evaluatePanelCurve(1.5, 0, 1.5, 30, -30);
  assert.ok(rightBack.z < -0.7);
  assert.ok(rightBack.x > 0 && rightBack.x < 1.5);
  assert.ok(Math.abs(rightBack.angleY - Math.PI / 3) < 1e-6);

  // Centerline x=0 stays C1 continuous regardless of asymmetric wings
  const centerLeft = evaluatePanelCurve(-1e-6, 0.02, 1.5, 30, -30);
  const centerRight = evaluatePanelCurve(1e-6, 0.02, 1.5, 30, -30);
  assert.ok(Math.abs(centerLeft.x - centerRight.x) < 1e-4);
  assert.ok(Math.abs(centerLeft.z - centerRight.z) < 1e-4);
});

test('evaluateWingCurve hinges smoothly at inner seam and bends wings with 1x surface degrees', () => {
  const halfW = 1.5;
  // Left wing hinges at x = +halfW with zero local offset/angle
  const leftSeam = evaluateWingCurve('left', halfW, 0.044, halfW, 30, CURVATURE_SURFACE_MULTIPLIER);
  assert.ok(Math.abs(leftSeam.x - halfW) < 1e-6);
  assert.ok(Math.abs(leftSeam.z - 0.044) < 1e-6);
  assert.ok(Math.abs(leftSeam.angleY) < 1e-6);

  // Left wing outer tip reaches +60 deg relative to inner seam (90 deg total with +30 deg center)
  const leftTip = evaluateWingCurve('left', -halfW, 0, halfW, 30, CURVATURE_SURFACE_MULTIPLIER);
  assert.ok(Math.abs(leftTip.angleY - Math.PI / 3) < 1e-6);
  assert.ok(leftTip.z > 0.7);

  // Right wing hinges at x = -halfW and outer tip bends -60 deg relative to inner seam when D = +30
  const rightSeam = evaluateWingCurve('right', -halfW, 0.044, halfW, 30, CURVATURE_SURFACE_MULTIPLIER);
  assert.ok(Math.abs(rightSeam.x - (-halfW)) < 1e-6);
  assert.ok(Math.abs(rightSeam.z - 0.044) < 1e-6);
  assert.ok(Math.abs(rightSeam.angleY) < 1e-6);

  const rightTip = evaluateWingCurve('right', halfW, 0, halfW, 30, CURVATURE_SURFACE_MULTIPLIER);
  assert.ok(Math.abs(rightTip.angleY + Math.PI / 3) < 1e-6);
  assert.ok(rightTip.z > 0.7);
});

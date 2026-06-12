function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDimension(value) {
  const activeUnit = window.GeneratorRuntimeUnit || "in";
  const unit = unitOptions[activeUnit] || unitOptions.in;
  return `${(value * unit.factorFromInch).toFixed(unit.decimals)} ${unit.label}`;
}

window.GeneratorLegacy = {
  setUnit(unit) {
    window.GeneratorRuntimeUnit = unitOptions[unit] ? unit : "in";
  },
  clamp,
  formatDimension,
  unitOptions,
  threadOptions,
  hubPositionOptions,
  sprocketChainPresets,
  gearToothOptions,
  gearDiametralPitchOptions,
  gearPressureAngleOptions,
  ignitorStyleOptions,
  pulleyDefaults,
  pulleyControlGroups,
  vBeltPulleyDefaults,
  vBeltPulleyControlGroups,
  sprocketDefaults,
  sprocketControlGroups,
  straightCutGearDefaults,
  straightCutGearControlGroups,
  bevelGearDefaults,
  bevelGearControlGroups,
  shaftSpacerDefaults,
  shaftSpacerControlGroups,
  lineshaftHangerDefaults,
  lineshaftHangerControlGroups,
  headGasketDefaults,
  headGasketControlGroups,
  ignitorGasketDefaults,
  ignitorGasketControlGroups,
  dripOilerGasketDefaults,
  dripOilerGasketControlGroups,
  validatePulley,
  validateVBeltPulley,
  validateSprocket,
  validateStraightCutGear,
  validateBevelGear,
  validateShaftSpacer,
  validateLineshaftHanger,
  validateHeadGasket,
  validateIgnitorGasket,
  validateDripOilerGasket,
  generatePulleyMesh,
  generateVBeltPulleyMesh,
  generateSprocketMesh,
  generateStraightCutGearMesh,
  generateBevelGearMesh,
  generateShaftSpacerMesh,
  generateLineshaftHangerMesh,
  generateHeadGasketDxf,
  generateIgnitorGasketDxf,
  generateDripOilerGasketDxf,
  pulleyMetricRows,
  vBeltPulleyMetricRows,
  sprocketMetricRows,
  straightCutGearMetricRows,
  bevelGearMetricRows,
  shaftSpacerMetricRows,
  lineshaftHangerMetricRows,
  headGasketMetricRows,
  ignitorGasketMetricRows,
  dripOilerGasketMetricRows,
  getIgnitorOpeningExtents,
  meshToAsciiStl,
  dxfToString,
};

window.GeneratorRuntimeUnit = "in";

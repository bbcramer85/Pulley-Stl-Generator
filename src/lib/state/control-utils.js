const integerFields = new Set([
  "spokeCount",
  "sprocketToothCount",
  "gasketBoltCount",
  "gasketSlotCount",
]);

export function isLengthField(field) {
  return field?.unit === undefined;
}

export function roundForUnit(value, field, unit, engine) {
  if (!isLengthField(field)) return value;
  return Number(value.toFixed(unit === "in" ? 4 : 3));
}

export function formatControlValue(value, field, unit, engine) {
  if (field.type === "toggle" || field.type === "select") return String(value);
  if (integerFields.has(field.key)) return String(Math.round(value));
  if (field.unit === "deg") return String(Math.round(value));
  const factor = isLengthField(field) ? engine.unitOptions[unit].factorFromInch : 1;
  return String(roundForUnit(value * factor, field, unit, engine));
}

export function parseControlValue(value, field, unit, engine, fallback) {
  if (field.type === "toggle") return Boolean(value);
  if (field.type === "select") return value;
  const parsed = Number.parseFloat(value);
  const nextValue = Number.isFinite(parsed) ? parsed : fallback;
  if (integerFields.has(field.key)) return Math.max(0, Math.round(nextValue));
  if (field.unit === "deg" || field.unit === "") return nextValue;
  const factor = isLengthField(field) ? engine.unitOptions[unit].factorFromInch : 1;
  return nextValue / factor;
}

export function fieldUnitLabel(field, unit, engine) {
  return field.unit ?? engine.unitOptions[unit].label;
}

export function inputBounds(field, unit, engine) {
  const factor = isLengthField(field) ? engine.unitOptions[unit].factorFromInch : 1;
  return {
    min: String(roundForUnit(field.min * factor, field, unit, engine)),
    max: String(roundForUnit(field.max * factor, field, unit, engine)),
    step: String(isLengthField(field) ? roundForUnit(field.step * factor, field, unit, engine) : field.step),
  };
}

export function getSelectOptionLabel(field, optionValue, engine) {
  if (Object.prototype.hasOwnProperty.call(field.optionLabels || {}, optionValue)) {
    return field.optionLabels[optionValue];
  }
  if (field.key === "setScrewThread") return engine.threadOptions[optionValue]?.label || optionValue;
  if (field.key === "hubPosition") return engine.hubPositionOptions[optionValue]?.label || optionValue;
  if (field.key === "sprocketChainKey") return engine.sprocketChainPresets[optionValue]?.label || optionValue;
  if (field.key === "ignitorStyle") return engine.ignitorStyleOptions[optionValue]?.label || optionValue;
  if (field.key === "gearToothCount" || field.key === "bevelToothCount" || field.key === "bevelMatingToothCount") {
    return engine.gearToothOptions[optionValue]?.label || optionValue;
  }
  if (field.key === "gearDiametralPitch" || field.key === "bevelDiametralPitch") {
    return engine.gearDiametralPitchOptions[optionValue]?.label || optionValue;
  }
  if (field.key === "gearPressureAngle" || field.key === "bevelPressureAngle") {
    return engine.gearPressureAngleOptions[optionValue]?.label || optionValue;
  }
  return optionValue;
}

export function isFieldActive(field, params) {
  const matches = (condition) => params[condition.key] === condition.value;
  return (!field.showWhen || matches(field.showWhen)) && (!field.showWhenAll || field.showWhenAll.every(matches));
}

export function normalizeParams(projectKey, params, unit, deletedFeatures) {
  const normalized = { ...params };
  if ("spokeCount" in normalized) normalized.spokeCount = Math.max(0, Math.round(normalized.spokeCount));
  if ("sprocketToothCount" in normalized) normalized.sprocketToothCount = Math.max(0, Math.round(normalized.sprocketToothCount));
  if ("gearToothCount" in normalized) normalized.gearToothCount = String(Math.max(0, Math.round(Number(normalized.gearToothCount))));
  if ("gasketBoltCount" in normalized) normalized.gasketBoltCount = Math.max(0, Math.round(normalized.gasketBoltCount));
  if ("gasketSlotCount" in normalized) normalized.gasketSlotCount = Math.max(0, Math.round(normalized.gasketSlotCount));
  if (projectKey === "headGasket") {
    normalized.deletedBoltIndices = [...deletedFeatures.deletedBoltIndices];
    normalized.deletedSlotIndices = [...deletedFeatures.deletedSlotIndices];
  }
  normalized.unit = unit;
  normalized.unitFactor = 1;
  return normalized;
}

export function applyLinkedPreset(fieldKey, fieldValue, params, engine) {
  if (fieldKey.startsWith("reducer")) {
    return applySpeedReductionLinks(fieldKey, params);
  }

  if (fieldKey === "sprocketChainKey") {
    const preset = engine.sprocketChainPresets[fieldValue];
    if (!preset) return params;
    return {
      ...params,
      sprocketPitch: preset.pitch,
      sprocketRollerDiameter: preset.rollerDiameter,
      sprocketFaceWidth: preset.faceWidth,
      sprocketToothHeight: preset.toothHeight,
      sprocketRootClearance: preset.rootClearance,
    };
  }
  if (fieldKey === "gearDiametralPitch") {
    const dp = Number(fieldValue);
    if (!Number.isFinite(dp) || dp <= 0) return params;
    return {
      ...params,
      gearAddendum: 1 / dp,
      gearDedendum: 1.25 / dp,
    };
  }
  if (fieldKey === "bevelDiametralPitch") {
    const dp = Number(fieldValue);
    if (!Number.isFinite(dp) || dp <= 0) return params;
    return {
      ...params,
      bevelAddendum: 1 / dp,
      bevelDedendum: 1.25 / dp,
    };
  }
  return params;
}

function applySpeedReductionLinks(fieldKey, params) {
  const nextParams = { ...params };
  const stage1AutoFields = new Set([
    "reducerPulley1Diameter",
    "reducerPulley2Diameter",
    "reducerShaft1Height",
    "reducerShaft2Height",
    "reducerStage1Auto",
  ]);
  const stage2AutoFields = new Set([
    "reducerPulley2Diameter",
    "reducerPulley3Diameter",
    "reducerShaft2Height",
    "reducerShaft3Height",
    "reducerStage2Auto",
  ]);

  if (fieldKey === "reducerManualCenterDistance") nextParams.reducerStage1Auto = false;
  if (fieldKey === "reducerManualCenterDistance2") nextParams.reducerStage2Auto = false;

  if (nextParams.reducerStage1Auto !== false && stage1AutoFields.has(fieldKey)) {
    nextParams.reducerManualCenterDistance = reducerAutoHorizontalOffset(
      nextParams.reducerPulley1Diameter,
      nextParams.reducerPulley2Diameter,
      nextParams.reducerShaft1Height,
      nextParams.reducerShaft2Height,
    );
  }

  if (nextParams.reducerStage2Auto !== false && stage2AutoFields.has(fieldKey)) {
    nextParams.reducerManualCenterDistance2 = reducerAutoHorizontalOffset(
      nextParams.reducerPulley2Diameter,
      nextParams.reducerPulley3Diameter,
      nextParams.reducerShaft2Height,
      nextParams.reducerShaft3Height,
    );
  }

  return nextParams;
}

function reducerTouchingCenterDistance(firstDiameter, secondDiameter) {
  return (Math.max(0.001, firstDiameter) + Math.max(0.001, secondDiameter)) / 2;
}

function reducerAutoHorizontalOffset(firstDiameter, secondDiameter, firstHeight, secondHeight) {
  const centerDistance = reducerTouchingCenterDistance(firstDiameter, secondDiameter);
  const dy = (Number(secondHeight) || 0) - (Number(firstHeight) || 0);
  const squaredHorizontal = centerDistance * centerDistance - dy * dy;
  return squaredHorizontal > 0 ? Math.sqrt(squaredHorizontal) : 0;
}

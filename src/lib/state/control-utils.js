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
  return !field.showWhen || params[field.showWhen.key] === field.showWhen.value;
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

function pulleyMetricRows(d) {
  return [
    ["Shaft", formatDimension(d.boreDiameter)],
    ["Hub OD", formatDimension(d.hubDiameter)],
    ["Rim thick.", formatDimension(d.rimThickness)],
    ["Rim ID", formatDimension(d.rimInnerDiameter)],
    ["Spoke H", formatDimension(d.spokeHeight)],
    ...(d.setScrew ? [["Set screw", d.setScrew]] : []),
    ["Triangles", d.triangleCount.toLocaleString()],
  ];
}

function shaftSpacerMetricRows(d) {
  return [
    ["Style", d.openSlot ? "Open C" : "Closed"],
    ["Bore", formatDimension(d.boreDiameter)],
    ["OD", formatDimension(d.outerDiameter)],
    ["Length", formatDimension(d.length)],
    ["Key W", formatDimension(d.keySlotWidth)],
    ["Key D", d.openSlot ? "Open" : formatDimension(d.keySlotDepth)],
    ["Triangles", d.triangleCount.toLocaleString()],
  ];
}

function vBeltPulleyMetricRows(d) {
  return [
    ["OD", formatDimension(d.outerDiameter)],
    ["Bore", formatDimension(d.boreDiameter)],
    ["Groove W", formatDimension(d.grooveTopWidth)],
    ["Groove D", formatDimension(d.grooveDepth)],
    ["Angle", `${d.grooveAngle.toFixed(1)} deg`],
    ["Root flat", formatDimension(d.grooveRootWidth)],
    ["Hub OD", formatDimension(d.hubDiameter)],
    ...(d.setScrew ? [["Set screw", d.setScrew]] : []),
    ["Triangles", d.triangleCount.toLocaleString()],
  ];
}

function validatePulley(raw) {
  const warnings = [];
  const p = { ...raw };

  p.diameter = Math.max(0.001, p.diameter);
  p.overallWidth = Math.max(0.001, p.overallWidth);
  p.shaftDiameter = Math.max(0.001, p.shaftDiameter);
  p.hubThickness = Math.max(0.001, p.hubThickness);
  p.hubWidth = Math.max(0.001, p.hubWidth);
  p.rimThickness = Math.max(0, p.rimThickness);
  p.keySlotWidth = Math.max(0, p.keySlotWidth);
  p.setScrewEnabled = Boolean(p.setScrewEnabled);
  p.setScrewThread = threadOptions[p.setScrewThread] ? p.setScrewThread : pulleyDefaults.setScrewThread;
  p.setScrewBossHeight = Math.max(0.001, p.setScrewBossHeight);
  p.setScrewBossWidth = Math.max(0.001, p.setScrewBossWidth);
  p.setScrewBossOffset = Number.isFinite(p.setScrewBossOffset) ? p.setScrewBossOffset : pulleyDefaults.setScrewBossOffset;
  p.setScrewAngle = Number.isFinite(p.setScrewAngle) ? p.setScrewAngle : pulleyDefaults.setScrewAngle;
  p.setScrewIntersectAngle = Number.isFinite(p.setScrewIntersectAngle)
    ? clamp(p.setScrewIntersectAngle, -75, 75)
    : pulleyDefaults.setScrewIntersectAngle;
  p.crown = Math.max(0, p.crown);
  p.rimRadius = Math.max(0, p.rimRadius);
  p.hubRadius = Math.max(0, p.hubRadius);
  p.shaftRadius = Math.max(0, p.shaftRadius);
  p.spokeRadius = Math.max(0, p.spokeRadius);
  p.spokeWidth = Math.max(0.001, p.spokeWidth);
  p.spokeHeight = Math.max(0.001, p.spokeHeight);
  p.spokeInnerWidth = Math.max(0.001, p.spokeInnerWidth);
  p.spokeOuterWidth = Math.max(0.001, p.spokeOuterWidth);

  const baseR = p.diameter / 2;
  const shaftR = p.shaftDiameter / 2;
  const hubR = shaftR + p.hubThickness;
  const minimumSpokeGap = Math.max(p.diameter * 0.025, p.shaftDiameter * 0.12);
  if (p.rimThickness >= baseR - hubR - minimumSpokeGap) {
    warnings.push("Rim thickness leaves no room between the hub and rim.");
  }

  if (hubR * 2 >= p.diameter - p.rimThickness * 2 - minimumSpokeGap * 2) {
    warnings.push("Hub diameter is too close to the inside of the rim.");
  }

  if (p.shaftDiameter >= p.diameter - p.rimThickness * 2) {
    warnings.push("Shaft diameter is larger than the open area inside the rim.");
  }

  if (p.keySlotWidth > 0 && p.shaftDiameter <= p.keySlotWidth * 1.25) {
    warnings.push("Key slot is too wide for the shaft diameter.");
  }

  if (p.keySlotWidth > 0 && p.keySlotWidth / 2 >= p.hubThickness * 0.85) {
    warnings.push("Key slot depth is too close to the outside of the hub.");
  }

  if (p.setScrewEnabled) {
    const setScrew = getSetScrewSpec(p);
    const bossRadius = computeSetScrewBossRadius(setScrew, p);
    if (bossRadius * 2 >= p.hubWidth * 0.96) {
      warnings.push("Selected set screw is too large for the hub width.");
    }

    if (p.setScrewBossHeight < setScrew.major * 0.9) {
      warnings.push("Recommended change: set screw boss height is shorter than the selected thread size.");
    }

    if (p.setScrewBossWidth < setScrew.major * 1.15) {
      warnings.push("Set screw boss width is too small for the selected thread.");
    }

    if (Math.abs(p.setScrewBossOffset) + bossRadius >= p.hubWidth / 2) {
      warnings.push("Set screw boss offset places the boss outside the hub width.");
    }
  }

  const rimInnerR = computeRimInnerRadius(p, hubR, baseR);
  const spokeRootR = computeSpokeInnerRadius(p, hubR, shaftR);
  const spokeSpan = Math.max(0.001, rimInnerR * 1.06 - spokeRootR);
  const spokePitchWidth = p.spokeCount > 0 ? (Math.PI * 2 * ((spokeRootR + rimInnerR * 1.06) / 2)) / p.spokeCount : Infinity;
  const maxSpokeWidth = Math.min(spokeSpan * 0.62, spokePitchWidth * 0.72);
  if (p.spokeCount > 0 && Math.max(p.spokeWidth, p.spokeInnerWidth, p.spokeOuterWidth) > maxSpokeWidth) {
    warnings.push("Spoke width is too large for the available opening.");
  }

  return { params: p, warnings };
}

function validateVBeltPulley(raw) {
  const warnings = [];
  const p = { ...raw };

  p.vOuterDiameter = Math.max(0.001, p.vOuterDiameter);
  p.vOverallWidth = Math.max(0.001, p.vOverallWidth);
  p.vGrooveTopWidth = Math.max(0.001, p.vGrooveTopWidth);
  p.vGrooveDepth = Math.max(0.001, p.vGrooveDepth);
  p.vGrooveAngle = Number.isFinite(p.vGrooveAngle) ? clamp(p.vGrooveAngle, 12, 80) : vBeltPulleyDefaults.vGrooveAngle;
  p.vRimThickness = Math.max(0.001, p.vRimThickness);
  p.shaftDiameter = Math.max(0.001, p.shaftDiameter);
  p.hubThickness = Math.max(0.001, p.hubThickness);
  p.hubWidth = Math.max(0.001, p.hubWidth);
  p.hubPosition = hubPositionOptions[p.hubPosition] ? p.hubPosition : vBeltPulleyDefaults.hubPosition;
  p.keySlotWidth = Math.max(0, p.keySlotWidth);
  p.keySlotDepth = Math.max(0, p.keySlotDepth);
  p.setScrewEnabled = Boolean(p.setScrewEnabled);
  p.setScrewThread = threadOptions[p.setScrewThread] ? p.setScrewThread : vBeltPulleyDefaults.setScrewThread;
  p.setScrewBossHeight = Math.max(0.001, p.setScrewBossHeight);
  p.setScrewBossWidth = Math.max(0.001, p.setScrewBossWidth);
  p.setScrewBossOffset = Number.isFinite(p.setScrewBossOffset) ? p.setScrewBossOffset : vBeltPulleyDefaults.setScrewBossOffset;
  p.setScrewAngle = Number.isFinite(p.setScrewAngle) ? p.setScrewAngle : vBeltPulleyDefaults.setScrewAngle;
  p.setScrewIntersectAngle = Number.isFinite(p.setScrewIntersectAngle)
    ? clamp(p.setScrewIntersectAngle, -75, 75)
    : vBeltPulleyDefaults.setScrewIntersectAngle;
  p.rimRadius = Math.max(0, p.rimRadius);
  p.hubRadius = Math.max(0, p.hubRadius);
  p.shaftRadius = Math.max(0, p.shaftRadius);
  p.spokeRadius = Math.max(0, p.spokeRadius);
  p.spokeCount = Math.max(0, Math.round(p.spokeCount));
  p.spokeWidth = Math.max(0.001, p.spokeWidth);
  p.spokeHeight = Math.max(0.001, p.spokeHeight);
  p.spokeInnerWidth = Math.max(0.001, p.spokeInnerWidth);
  p.spokeOuterWidth = Math.max(0.001, p.spokeOuterWidth);
  p.spokeStyle = p.spokeStyle === "curved" ? "curved" : "straight";
  p.curvedAngle = Number.isFinite(p.curvedAngle) ? clamp(p.curvedAngle, -85, 85) : 0;

  p.diameter = p.vOuterDiameter;
  p.overallWidth = p.vOverallWidth;
  p.rimThickness = p.vRimThickness;
  p.crown = 0;

  const outerR = p.vOuterDiameter / 2;
  const boreR = p.shaftDiameter / 2;
  const hubR = boreR + p.hubThickness;
  const groove = computeVBeltGrooveGeometry(p, outerR);
  const rimInnerR = computeVBeltRimInnerRadius(p, hubR, groove.rootR);
  const minimumSpokeGap = Math.max(p.vOuterDiameter * 0.025, p.shaftDiameter * 0.12);

  if (p.vGrooveTopWidth >= p.vOverallWidth) {
    warnings.push("Recommended change: groove top width is wider than the pulley face, so the shoulder land is removed.");
  }

  if (groove.rootWidth <= 0.000001) {
    warnings.push("Recommended change: groove angle, width, and depth create a sharp groove root.");
  }

  if (p.vGrooveDepth >= outerR - hubR - minimumSpokeGap) {
    warnings.push("Groove depth leaves no room between the hub and rim.");
  }

  if (p.vRimThickness >= groove.rootR - hubR - minimumSpokeGap) {
    warnings.push("Rim wall thickness leaves no room between the hub and rim.");
  }

  if (hubR * 2 >= rimInnerR * 2 - minimumSpokeGap * 2) {
    warnings.push("Hub diameter is too close to the inside of the rim.");
  }

  if (p.shaftDiameter >= rimInnerR * 2) {
    warnings.push("Shaft diameter is larger than the open area inside the rim.");
  }

  if (p.keySlotWidth > 0 && p.shaftDiameter <= p.keySlotWidth * 1.25) {
    warnings.push("Key slot is too wide for the shaft diameter.");
  }

  if (p.keySlotDepth > 0 && p.keySlotDepth >= p.hubThickness * 0.85) {
    warnings.push("Key slot depth is too close to the outside of the hub.");
  }

  if (p.setScrewEnabled) {
    const setScrew = getSetScrewSpec(p);
    const bossRadius = computeSetScrewBossRadius(setScrew, p);
    if (bossRadius * 2 >= p.hubWidth * 0.96) {
      warnings.push("Selected set screw is too large for the hub width.");
    }

    if (p.setScrewBossHeight < setScrew.major * 0.9) {
      warnings.push("Recommended change: set screw boss height is shorter than the selected thread size.");
    }

    if (p.setScrewBossWidth < setScrew.major * 1.15) {
      warnings.push("Set screw boss width is too small for the selected thread.");
    }

    if (Math.abs(p.setScrewBossOffset) + bossRadius >= p.hubWidth / 2) {
      warnings.push("Set screw boss offset places the boss outside the hub width.");
    }
  }

  const spokeRootR = computeSpokeInnerRadius(p, hubR, boreR);
  const spokeSpan = Math.max(0.001, rimInnerR * 1.06 - spokeRootR);
  const spokePitchWidth = p.spokeCount > 0 ? (Math.PI * 2 * ((spokeRootR + rimInnerR * 1.06) / 2)) / p.spokeCount : Infinity;
  const maxSpokeWidth = Math.min(spokeSpan * 0.62, spokePitchWidth * 0.72);
  if (p.spokeCount > 0 && Math.max(p.spokeWidth, p.spokeInnerWidth, p.spokeOuterWidth) > maxSpokeWidth) {
    warnings.push("Spoke width is too large for the available opening.");
  }

  return { params: p, warnings };
}

function validateShaftSpacer(raw) {
  const warnings = [];
  const p = { ...raw };

  p.spacerOuterDiameter = Math.max(0.001, p.spacerOuterDiameter);
  p.spacerBore = Math.max(0.001, p.spacerBore);
  p.spacerLength = Math.max(0.001, p.spacerLength);
  p.spacerKeySlotWidth = Math.max(0, p.spacerKeySlotWidth);
  p.spacerKeySlotDepth = Math.max(0, p.spacerKeySlotDepth);
  p.spacerOpenSlot = Boolean(p.spacerOpenSlot);

  const outerR = p.spacerOuterDiameter / 2;
  const boreR = p.spacerBore / 2;
  const wall = outerR - boreR;

  if (p.spacerBore >= p.spacerOuterDiameter) {
    warnings.push("Bore must be smaller than the outer diameter.");
  }

  if (p.spacerKeySlotWidth > 0 && p.spacerKeySlotWidth >= p.spacerBore * 0.96) {
    warnings.push("Key slot width is too large for the bore.");
  }

  if (p.spacerOpenSlot && p.spacerKeySlotWidth <= 0) {
    warnings.push("Open C slot needs a key slot width greater than zero.");
  }

  if (!p.spacerOpenSlot && p.spacerKeySlotDepth > 0 && p.spacerKeySlotDepth >= wall * 0.92) {
    warnings.push("Key slot depth is too deep for the spacer wall.");
  }

  return { params: p, warnings };
}


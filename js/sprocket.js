function sprocketMetricRows(d) {
  return [
    ["Chain", d.chainLabel],
    ["Teeth", d.toothCount],
    ["Pitch", formatDimension(d.pitch)],
    ["Pitch dia.", formatDimension(d.pitchDiameter)],
    ["Outside dia.", formatDimension(d.outsideDiameter)],
    ["Bore", formatDimension(d.boreDiameter)],
    ["Hub OD", formatDimension(d.hubDiameter)],
    ...(d.setScrew ? [["Set screw", d.setScrew]] : []),
    ["Triangles", d.triangleCount.toLocaleString()],
  ];
}

function validateSprocket(raw) {
  const warnings = [];
  const p = { ...raw };
  const preset = sprocketChainPresets[p.sprocketChainKey] || sprocketChainPresets[sprocketDefaults.sprocketChainKey];

  p.sprocketChainKey = preset ? p.sprocketChainKey : sprocketDefaults.sprocketChainKey;
  p.sprocketToothCount = Math.max(6, Math.round(p.sprocketToothCount));
  p.sprocketPitch = Math.max(0.001, p.sprocketPitch);
  p.sprocketRollerDiameter = Math.max(0.001, p.sprocketRollerDiameter);
  p.sprocketFaceWidth = Math.max(0.001, p.sprocketFaceWidth);
  p.sprocketToothHeight = Math.max(0.001, p.sprocketToothHeight);
  p.sprocketRootClearance = Math.max(0, p.sprocketRootClearance);
  p.shaftDiameter = Math.max(0.001, p.shaftDiameter);
  p.hubThickness = Math.max(0.001, p.hubThickness);
  p.hubWidth = Math.max(0.001, p.hubWidth);
  p.hubPosition = hubPositionOptions[p.hubPosition] ? p.hubPosition : sprocketDefaults.hubPosition;
  p.keySlotWidth = Math.max(0, p.keySlotWidth);
  p.keySlotDepth = Math.max(0, p.keySlotDepth);
  p.setScrewEnabled = Boolean(p.setScrewEnabled);
  p.setScrewThread = threadOptions[p.setScrewThread] ? p.setScrewThread : sprocketDefaults.setScrewThread;
  p.setScrewBossHeight = Math.max(0.001, p.setScrewBossHeight);
  p.setScrewBossWidth = Math.max(0.001, p.setScrewBossWidth);
  p.setScrewBossOffset = Number.isFinite(p.setScrewBossOffset) ? p.setScrewBossOffset : sprocketDefaults.setScrewBossOffset;
  p.setScrewAngle = Number.isFinite(p.setScrewAngle) ? p.setScrewAngle : sprocketDefaults.setScrewAngle;
  p.setScrewIntersectAngle = Number.isFinite(p.setScrewIntersectAngle)
    ? clamp(p.setScrewIntersectAngle, -75, 75)
    : sprocketDefaults.setScrewIntersectAngle;
  p.hubRadius = Math.max(0, p.hubRadius);
  p.shaftRadius = Math.max(0, p.shaftRadius);

  p.diameter = sprocketOutsideDiameter(p);
  p.overallWidth = p.sprocketFaceWidth;

  const boreR = p.shaftDiameter / 2;
  const hubR = boreR + p.hubThickness;
  const pitchR = sprocketPitchRadius(p.sprocketPitch, p.sprocketToothCount);
  const rootR = sprocketRootRadius(p, pitchR);
  const minimumWeb = Math.max(p.sprocketPitch * 0.16, p.shaftDiameter * 0.1);

  if (p.sprocketRollerDiameter >= p.sprocketPitch * 0.92) {
    warnings.push("Roller diameter is too large for the selected pitch.");
  }

  if (rootR <= hubR + minimumWeb) {
    warnings.push("Hub diameter is too close to the sprocket tooth root.");
  }

  if (p.shaftDiameter >= rootR * 2) {
    warnings.push("Shaft diameter is larger than the sprocket body.");
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

  return { params: p, warnings };
}

function generateSprocketMesh(params) {
  const mesh = new MeshBuilder();
  const sides = Math.max(96, params.sprocketToothCount * 18);
  const boreR = params.shaftDiameter / 2;
  const hubR = boreR + params.hubThickness;
  const pitchR = sprocketPitchRadius(params.sprocketPitch, params.sprocketToothCount);
  const rootR = sprocketRootRadius(params, pitchR);
  const tipR = pitchR + params.sprocketToothHeight;
  const setScrewCut = params.setScrewEnabled ? computeSetScrewCut(params) : null;

  addSprocketPlate(mesh, params, boreR, rootR, tipR, sides);
  addKeyedHub(
    mesh,
    hubR,
    boreR,
    params.keySlotWidth,
    params.hubWidth,
    Math.max(128, sides),
    clampHubRadius(params.hubRadius, params, hubR, boreR),
    clampShaftRadius(params.shaftRadius, params, hubR, boreR),
    setScrewCut,
    params.keySlotDepth,
    computeHubZOffset(params, params.sprocketFaceWidth)
  );

  if (params.setScrewEnabled) {
    addSetScrewFeature(mesh, params, hubR, boreR);
  }

  const repairCaps = closeBoundaryLoops(mesh, setScrewCut);
  const preset = sprocketChainPresets[params.sprocketChainKey] || sprocketChainPresets[sprocketDefaults.sprocketChainKey];

  return {
    triangles: mesh.triangles,
    derived: {
      chainLabel: preset.label,
      toothCount: params.sprocketToothCount,
      pitch: params.sprocketPitch,
      pitchDiameter: pitchR * 2,
      outsideDiameter: tipR * 2,
      rootDiameter: rootR * 2,
      boreDiameter: boreR * 2,
      hubDiameter: hubR * 2,
      setScrew: params.setScrewEnabled ? params.setScrewThread : "",
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
  };
}

function sprocketPitchRadius(pitch, toothCount) {
  return pitch / (2 * Math.sin(Math.PI / Math.max(3, toothCount)));
}

function sprocketOutsideDiameter(params) {
  return (sprocketPitchRadius(params.sprocketPitch, params.sprocketToothCount) + params.sprocketToothHeight) * 2;
}

function sprocketRootRadius(params, pitchR) {
  return Math.max(0.001, pitchR - params.sprocketRollerDiameter / 2 - params.sprocketRootClearance);
}

function addSprocketPlate(mesh, params, boreR, rootR, tipR, sides) {
  const z0 = -params.sprocketFaceWidth / 2;
  const z1 = params.sprocketFaceWidth / 2;
  const angles = buildSprocketAngles(params, sides);
  const outerPath = angles.map((theta) => pointFromAngle(sprocketOuterRadiusAtAngle(theta, params, rootR, tipR), theta));
  const innerPath = angles.map((theta) => pointFromAngle(keyedHoleRadiusAtAngle(theta, boreR, params.keySlotWidth, params.keySlotDepth), theta));

  addPathSide(mesh, outerPath, z0, z1, false);
  addPathSide(mesh, innerPath, z0, z1, true);
  addPathRingCap(mesh, innerPath, outerPath, z0, -1);
  addPathRingCap(mesh, innerPath, outerPath, z1, 1);
}

function buildSprocketAngles(params, sides) {
  const toothCount = Math.max(6, params.sprocketToothCount);
  const period = (Math.PI * 2) / toothCount;
  const angles = new Set();
  const add = (theta) => angles.add(Math.round(normalizeAngle(theta) * 1000000) / 1000000);

  for (let i = 0; i < sides; i += 1) {
    add((i / sides) * Math.PI * 2);
  }

  for (let tooth = 0; tooth < toothCount; tooth += 1) {
    const center = tooth * period;
    [-0.5, -0.38, -0.16, 0, 0.16, 0.38, 0.5].forEach((offset) => add(center + offset * period));
  }

  addKeywayCriticalAngles(params.shaftDiameter / 2, params.keySlotWidth, params.keySlotDepth).forEach(add);

  return [...angles].sort((a, b) => a - b);
}

function addKeywayCriticalAngles(boreR, keyWidth, keyDepth) {
  if (keyWidth <= 0 || keyDepth <= 0) return [];
  const halfKey = Math.min(keyWidth / 2, boreR * 0.96);
  const sideY = Math.sqrt(Math.max(0, boreR * boreR - halfKey * halfKey));
  const topY = boreR + keyDepth;
  return [
    Math.atan2(sideY, halfKey),
    Math.atan2(topY, halfKey),
    Math.atan2(topY, -halfKey),
    Math.atan2(sideY, -halfKey),
  ];
}

function sprocketOuterRadiusAtAngle(theta, params, rootR, tipR) {
  const period = (Math.PI * 2) / Math.max(6, params.sprocketToothCount);
  const nearestTooth = Math.round(theta / period) * period;
  const local = Math.abs(angleDelta(theta, nearestTooth)) / (period / 2);
  const rootBand = clamp(params.sprocketRollerDiameter / Math.max(params.sprocketPitch * 2.8, 0.001), 0.16, 0.34);
  const tipBand = 0.16;

  if (local <= tipBand) return tipR;
  if (local >= 1 - rootBand) return rootR;

  const t = (local - tipBand) / Math.max(0.001, 1 - rootBand - tipBand);
  return lerp(tipR, rootR, t * t * (3 - 2 * t));
}

function keyedHoleRadiusAtAngle(theta, boreR, keyWidth, keyDepth) {
  if (keyWidth <= 0 || keyDepth <= 0) return boreR;

  const halfKey = Math.min(keyWidth / 2, boreR * 0.96);
  const sideY = Math.sqrt(Math.max(0, boreR * boreR - halfKey * halfKey));
  const topY = boreR + keyDepth;
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  if (s <= 0.000001) return boreR;

  const entry = sideY / s;
  const exitTop = topY / s;
  const exitSide = Math.abs(c) > 0.000001 ? halfKey / Math.abs(c) : Infinity;
  const exit = Math.min(exitTop, exitSide);
  return exit >= entry - 0.000001 ? Math.max(boreR, exit) : boreR;
}

function addPathSide(mesh, path, z0, z1, inward = false) {
  for (let i = 0; i < path.length; i += 1) {
    const next = (i + 1) % path.length;
    const p00 = pointWithZ(path[i], z0);
    const p10 = pointWithZ(path[next], z0);
    const p11 = pointWithZ(path[next], z1);
    const p01 = pointWithZ(path[i], z1);

    if (inward) {
      mesh.addQuad(p00, p01, p11, p10);
    } else {
      mesh.addQuad(p00, p10, p11, p01);
    }
  }
}

function addPathRingCap(mesh, innerPath, outerPath, z, normalSign) {
  for (let i = 0; i < outerPath.length; i += 1) {
    const next = (i + 1) % outerPath.length;
    const inner0 = pointWithZ(innerPath[i], z);
    const inner1 = pointWithZ(innerPath[next], z);
    const outer0 = pointWithZ(outerPath[i], z);
    const outer1 = pointWithZ(outerPath[next], z);

    if (normalSign > 0) {
      mesh.addQuad(inner0, outer0, outer1, inner1);
    } else {
      mesh.addQuad(inner0, inner1, outer1, outer0);
    }
  }
}

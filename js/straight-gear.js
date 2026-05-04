function straightCutGearMetricRows(d) {
  return [
    ["Teeth", d.toothCount],
    ["DP", d.diametralPitch],
    ["Pitch dia.", formatDimension(d.pitchDiameter)],
    ["Outside dia.", formatDimension(d.outsideDiameter)],
    ["Root dia.", formatDimension(d.rootDiameter)],
    ["Face", formatDimension(d.faceWidth)],
    ["Bore", formatDimension(d.boreDiameter)],
    ["Hub OD", formatDimension(d.hubDiameter)],
    ...(d.setScrew ? [["Set screw", d.setScrew]] : []),
    ["Triangles", d.triangleCount.toLocaleString()],
  ];
}

function validateStraightCutGear(raw) {
  const warnings = [];
  const p = { ...raw };

  p.gearToothCount = gearToothOptions[p.gearToothCount] ? Number(p.gearToothCount) : Number(straightCutGearDefaults.gearToothCount);
  p.gearDiametralPitch = gearDiametralPitchOptions[p.gearDiametralPitch]
    ? Number(p.gearDiametralPitch)
    : Number(straightCutGearDefaults.gearDiametralPitch);
  p.gearPressureAngle = gearPressureAngleOptions[p.gearPressureAngle]
    ? Number(p.gearPressureAngle)
    : Number(straightCutGearDefaults.gearPressureAngle);
  p.gearFaceWidth = Math.max(0.001, p.gearFaceWidth);
  p.gearAddendum = Math.max(0.001, p.gearAddendum);
  p.gearDedendum = Math.max(0.001, p.gearDedendum);
  p.gearRimThickness = Math.max(0.001, p.gearRimThickness);
  p.shaftDiameter = Math.max(0.001, p.shaftDiameter);
  p.hubThickness = Math.max(0.001, p.hubThickness);
  p.hubWidth = Math.max(0.001, p.hubWidth);
  p.hubPosition = hubPositionOptions[p.hubPosition] ? p.hubPosition : straightCutGearDefaults.hubPosition;
  p.keySlotWidth = Math.max(0, p.keySlotWidth);
  p.keySlotDepth = Math.max(0, p.keySlotDepth);
  p.setScrewEnabled = Boolean(p.setScrewEnabled);
  p.setScrewThread = threadOptions[p.setScrewThread] ? p.setScrewThread : straightCutGearDefaults.setScrewThread;
  p.setScrewBossHeight = Math.max(0.001, p.setScrewBossHeight);
  p.setScrewBossWidth = Math.max(0.001, p.setScrewBossWidth);
  p.setScrewBossOffset = Number.isFinite(p.setScrewBossOffset) ? p.setScrewBossOffset : straightCutGearDefaults.setScrewBossOffset;
  p.setScrewAngle = Number.isFinite(p.setScrewAngle) ? p.setScrewAngle : straightCutGearDefaults.setScrewAngle;
  p.setScrewIntersectAngle = Number.isFinite(p.setScrewIntersectAngle)
    ? clamp(p.setScrewIntersectAngle, -75, 75)
    : straightCutGearDefaults.setScrewIntersectAngle;
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

  const gear = computeGearGeometry(p);
  p.diameter = gear.tipR * 2;
  p.overallWidth = p.gearFaceWidth;

  const boreR = p.shaftDiameter / 2;
  const hubR = boreR + p.hubThickness;
  const rimInnerR = computeGearRimInnerRadius(p, hubR, gear.rootR);
  const minimumGap = Math.max(p.diameter * 0.018, p.shaftDiameter * 0.1);

  if (gear.rootR <= hubR + minimumGap) {
    warnings.push("Hub diameter is too close to the gear tooth root.");
  }

  if (p.gearRimThickness >= gear.rootR - hubR - minimumGap) {
    warnings.push("Rim thickness leaves no room between the hub and gear rim.");
  }

  if (p.shaftDiameter >= rimInnerR * 2) {
    warnings.push("Shaft diameter is larger than the open area inside the gear.");
  }

  if (p.gearDedendum >= gear.pitchR * 0.55) {
    warnings.push("Dedendum is too deep for this tooth count and pitch.");
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

function generateStraightCutGearMesh(params) {
  const mesh = new MeshBuilder();
  const gear = computeGearGeometry(params);
  const sides = Math.max(192, params.gearToothCount * 20);
  const boreR = params.shaftDiameter / 2;
  const hubR = boreR + params.hubThickness;
  const rimInnerR = computeGearRimInnerRadius(params, hubR, gear.rootR);
  const spokeHeight = computeSpokeHeight(params);
  const setScrewCut = params.setScrewEnabled ? computeSetScrewCut(params) : null;

  addGearRim(mesh, params, gear, rimInnerR, sides);
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
    computeHubZOffset(params, params.gearFaceWidth)
  );

  if (params.setScrewEnabled) {
    addSetScrewFeature(mesh, params, hubR, boreR);
  }

  if (params.spokeCount === 0) {
    addAnnularCylinder(mesh, computeSpokeInnerRadius(params, hubR, boreR), rimInnerR * 1.04, spokeHeight, sides, params.spokeRadius);
  } else {
    addSpokes(mesh, params, hubR, boreR, rimInnerR, spokeHeight, clampSpokeRadius(params.spokeRadius, params), setScrewCut);
  }

  const repairCaps = closeBoundaryLoops(mesh, setScrewCut);

  return {
    triangles: mesh.triangles,
    derived: {
      toothCount: params.gearToothCount,
      diametralPitch: params.gearDiametralPitch,
      pitchDiameter: gear.pitchR * 2,
      outsideDiameter: gear.tipR * 2,
      rootDiameter: gear.rootR * 2,
      faceWidth: params.gearFaceWidth,
      boreDiameter: boreR * 2,
      hubDiameter: hubR * 2,
      setScrew: params.setScrewEnabled ? params.setScrewThread : "",
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
  };
}

function computeGearGeometry(params) {
  const toothCount = Math.max(6, Number(params.gearToothCount));
  const diametralPitch = Math.max(0.001, Number(params.gearDiametralPitch));
  const pitchR = toothCount / (2 * diametralPitch);
  const tipR = pitchR + params.gearAddendum;
  const rootR = Math.max(0.001, pitchR - params.gearDedendum);
  const pressureAngle = (Number(params.gearPressureAngle) * Math.PI) / 180;

  return {
    pitchR,
    tipR,
    rootR,
    baseR: pitchR * Math.cos(pressureAngle),
    pressureAngle,
  };
}

function computeGearRimInnerRadius(params, hubR, rootR) {
  const minimumGap = Math.max(params.diameter * 0.018, params.shaftDiameter * 0.1);
  const requestedInnerR = rootR - params.gearRimThickness;
  const minimumRimWall = Math.max(params.diameter * 0.004, 0.001);
  return clamp(requestedInnerR, hubR + minimumGap, rootR - minimumRimWall);
}

function addGearRim(mesh, params, gear, innerR, sides) {
  const z0 = -params.gearFaceWidth / 2;
  const z1 = params.gearFaceWidth / 2;
  const angles = buildGearAngles(params, sides);
  const outerPath = angles.map((theta) => pointFromAngle(gearOuterRadiusAtAngle(theta, params, gear), theta));
  const innerPath = angles.map((theta) => pointFromAngle(innerR, theta));

  addPathSide(mesh, outerPath, z0, z1, false);
  addPathSide(mesh, innerPath, z0, z1, true);
  addPathRingCap(mesh, innerPath, outerPath, z0, -1);
  addPathRingCap(mesh, innerPath, outerPath, z1, 1);
}

function buildGearAngles(params, sides) {
  const toothCount = Math.max(6, Number(params.gearToothCount));
  const period = (Math.PI * 2) / toothCount;
  const angles = new Set();
  const add = (theta) => angles.add(Math.round(normalizeAngle(theta) * 1000000) / 1000000);

  for (let i = 0; i < sides; i += 1) {
    add((i / sides) * Math.PI * 2);
  }

  for (let tooth = 0; tooth < toothCount; tooth += 1) {
    const center = tooth * period;
    [-0.5, -0.4, -0.28, -0.18, -0.08, 0, 0.08, 0.18, 0.28, 0.4, 0.5].forEach((offset) => {
      add(center + offset * period);
    });
  }

  return [...angles].sort((a, b) => a - b);
}

function gearOuterRadiusAtAngle(theta, params, gear) {
  const toothCount = Math.max(6, Number(params.gearToothCount));
  const period = (Math.PI * 2) / toothCount;
  const nearestTooth = Math.round(theta / period) * period;
  const local = Math.abs(angleDelta(theta, nearestTooth)) / (period / 2);
  const pressure = Number(params.gearPressureAngle);
  const topBand = clamp(0.18 - (pressure - 20) * 0.004, 0.11, 0.24);
  const rootBand = clamp(0.2 + (pressure - 20) * 0.003, 0.16, 0.28);

  if (local <= topBand) return gear.tipR;
  if (local >= 1 - rootBand) return gear.rootR;

  const t = (local - topBand) / Math.max(0.001, 1 - rootBand - topBand);
  const flank = t * t * (3 - 2 * t);
  const involuteBias = Math.sin(flank * Math.PI) * Math.max(0, gear.pitchR - gear.baseR) * 0.18;
  return lerp(gear.tipR, gear.rootR, flank) + involuteBias;
}

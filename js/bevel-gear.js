function bevelGearMetricRows(d) {
  return [
    ["Teeth", d.toothCount],
    ["Mate", d.matingToothCount],
    ["DP", d.diametralPitch],
    ["Cone", `${d.pitchConeAngle.toFixed(1)} deg`],
    ["Back pitch dia.", formatDimension(d.backPitchDiameter)],
    ["Back OD", formatDimension(d.backOutsideDiameter)],
    ["Small OD", formatDimension(d.smallOutsideDiameter)],
    ["Face", formatDimension(d.faceWidth)],
    ["Bore", formatDimension(d.boreDiameter)],
    ["Hub OD", formatDimension(d.hubDiameter)],
    ...(d.setScrew ? [["Set screw", d.setScrew]] : []),
    ["Triangles", d.triangleCount.toLocaleString()],
  ];
}

function validateBevelGear(raw) {
  const warnings = [];
  const p = { ...raw };

  p.bevelToothCount = gearToothOptions[p.bevelToothCount] ? Number(p.bevelToothCount) : Number(bevelGearDefaults.bevelToothCount);
  p.bevelMatingToothCount = gearToothOptions[p.bevelMatingToothCount]
    ? Number(p.bevelMatingToothCount)
    : Number(bevelGearDefaults.bevelMatingToothCount);
  p.bevelDiametralPitch = gearDiametralPitchOptions[p.bevelDiametralPitch]
    ? Number(p.bevelDiametralPitch)
    : Number(bevelGearDefaults.bevelDiametralPitch);
  p.bevelPressureAngle = gearPressureAngleOptions[p.bevelPressureAngle]
    ? Number(p.bevelPressureAngle)
    : Number(bevelGearDefaults.bevelPressureAngle);
  p.bevelFaceWidth = Math.max(0.001, p.bevelFaceWidth);
  p.bevelAddendum = Math.max(0.001, p.bevelAddendum);
  p.bevelDedendum = Math.max(0.001, p.bevelDedendum);
  p.shaftDiameter = Math.max(0.001, p.shaftDiameter);
  p.hubThickness = Math.max(0.001, p.hubThickness);
  p.hubWidth = Math.max(0.001, p.hubWidth);
  p.hubPosition = hubPositionOptions[p.hubPosition] ? p.hubPosition : bevelGearDefaults.hubPosition;
  p.keySlotWidth = Math.max(0, p.keySlotWidth);
  p.keySlotDepth = Math.max(0, p.keySlotDepth);
  p.setScrewEnabled = Boolean(p.setScrewEnabled);
  p.setScrewThread = threadOptions[p.setScrewThread] ? p.setScrewThread : bevelGearDefaults.setScrewThread;
  p.setScrewBossHeight = Math.max(0.001, p.setScrewBossHeight);
  p.setScrewBossWidth = Math.max(0.001, p.setScrewBossWidth);
  p.setScrewBossOffset = Number.isFinite(p.setScrewBossOffset) ? p.setScrewBossOffset : bevelGearDefaults.setScrewBossOffset;
  p.setScrewAngle = Number.isFinite(p.setScrewAngle) ? p.setScrewAngle : bevelGearDefaults.setScrewAngle;
  p.setScrewIntersectAngle = Number.isFinite(p.setScrewIntersectAngle)
    ? clamp(p.setScrewIntersectAngle, -75, 75)
    : bevelGearDefaults.setScrewIntersectAngle;
  p.hubRadius = Math.max(0, p.hubRadius);
  p.shaftRadius = Math.max(0, p.shaftRadius);

  let bevel = computeBevelGearGeometry(p);
  if (p.bevelFaceWidth > bevel.maxFaceWidth) {
    warnings.push("Recommended change: face width was shortened to keep the small end printable.");
    p.bevelFaceWidth = bevel.maxFaceWidth;
    bevel = computeBevelGearGeometry(p);
  }

  p.diameter = bevel.backTipR * 2;
  p.overallWidth = p.bevelFaceWidth;

  const boreR = p.shaftDiameter / 2;
  const hubR = boreR + p.hubThickness;
  const minimumWall = Math.max(p.shaftDiameter * 0.1, bevel.backPitchR * 0.035);
  const smallRootR = bevelRootRadiusAt(bevel, 1);

  if (smallRootR <= boreR + getKeySlotDepth(p) + minimumWall) {
    warnings.push("Shaft and keyway are too large for the small end of the bevel gear.");
  }

  if (bevel.backRootR <= hubR + minimumWall) {
    warnings.push("Hub diameter is too close to the bevel gear tooth root.");
  }

  if (p.bevelDedendum >= bevel.backPitchR * 0.55) {
    warnings.push("Dedendum is too deep for this bevel gear.");
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

function generateBevelGearMesh(params) {
  const mesh = new MeshBuilder();
  const bevel = computeBevelGearGeometry(params);
  const sides = Math.max(192, params.bevelToothCount * 20);
  const boreR = params.shaftDiameter / 2;
  const hubR = boreR + params.hubThickness;
  const setScrewCut = params.setScrewEnabled ? computeSetScrewCut(params) : null;

  addBevelGearBody(mesh, params, bevel, boreR, sides);
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
    computeHubZOffset(params, params.bevelFaceWidth)
  );

  if (params.setScrewEnabled) {
    addSetScrewFeature(mesh, params, hubR, boreR);
  }

  const repairCaps = closeBoundaryLoops(mesh, setScrewCut);

  return {
    triangles: mesh.triangles,
    derived: {
      toothCount: params.bevelToothCount,
      matingToothCount: params.bevelMatingToothCount,
      diametralPitch: params.bevelDiametralPitch,
      pitchConeAngle: (bevel.pitchConeAngle * 180) / Math.PI,
      backPitchDiameter: bevel.backPitchR * 2,
      backOutsideDiameter: bevel.backTipR * 2,
      smallOutsideDiameter: bevelTipRadiusAt(bevel, 1) * 2,
      faceWidth: params.bevelFaceWidth,
      boreDiameter: boreR * 2,
      hubDiameter: hubR * 2,
      setScrew: params.setScrewEnabled ? params.setScrewThread : "",
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
  };
}

function computeBevelGearGeometry(params) {
  const toothCount = Math.max(6, Number(params.bevelToothCount));
  const matingToothCount = Math.max(6, Number(params.bevelMatingToothCount));
  const diametralPitch = Math.max(0.001, Number(params.bevelDiametralPitch));
  const backPitchR = toothCount / (2 * diametralPitch);
  const pitchConeAngle = clamp(Math.atan(toothCount / matingToothCount), Math.PI / 10, Math.PI * 0.42);
  const apexDistance = backPitchR / Math.tan(pitchConeAngle);
  const maxFaceWidth = Math.max(0.001, apexDistance * 0.72);
  const faceWidth = Math.min(params.bevelFaceWidth, maxFaceWidth);
  const pressureAngle = (Number(params.bevelPressureAngle) * Math.PI) / 180;

  return {
    backPitchR,
    backTipR: backPitchR + params.bevelAddendum,
    backRootR: Math.max(0.001, backPitchR - params.bevelDedendum),
    baseR: backPitchR * Math.cos(pressureAngle),
    pitchConeAngle,
    apexDistance,
    maxFaceWidth,
    faceWidth,
    pressureAngle,
  };
}

function addBevelGearBody(mesh, params, bevel, boreR, sides) {
  const z0 = -params.bevelFaceWidth / 2;
  const z1 = params.bevelFaceWidth / 2;
  const axialSlices = Math.max(12, Math.min(32, Math.ceil(params.bevelFaceWidth / Math.max(params.bevelAddendum * 0.38, 0.018))));
  const angles = buildBevelGearAngles(params, sides);
  const outerSlices = [];
  const innerSlices = [];

  for (let j = 0; j <= axialSlices; j += 1) {
    const t = j / axialSlices;
    const z = z0 + params.bevelFaceWidth * t;
    outerSlices.push(angles.map((theta) => polarPoint(bevelOuterRadiusAtAngle(theta, params, bevel, t), theta, z)));
    innerSlices.push(angles.map((theta) => polarPoint(keyedHoleRadiusAtAngle(theta, boreR, params.keySlotWidth, params.keySlotDepth), theta, z)));
  }

  connectBevelSlices(mesh, outerSlices, false);
  connectBevelSlices(mesh, innerSlices, true);
  addBevelRingCap(mesh, innerSlices[0], outerSlices[0], -1);
  addBevelRingCap(mesh, innerSlices[innerSlices.length - 1], outerSlices[outerSlices.length - 1], 1);
}

function connectBevelSlices(mesh, slices, inward) {
  for (let j = 0; j < slices.length - 1; j += 1) {
    const current = slices[j];
    const nextSlice = slices[j + 1];
    for (let i = 0; i < current.length; i += 1) {
      const next = (i + 1) % current.length;
      if (inward) {
        mesh.addQuad(current[i], nextSlice[i], nextSlice[next], current[next]);
      } else {
        mesh.addQuad(current[i], current[next], nextSlice[next], nextSlice[i]);
      }
    }
  }
}

function addBevelRingCap(mesh, innerPath, outerPath, normalSign) {
  for (let i = 0; i < outerPath.length; i += 1) {
    const next = (i + 1) % outerPath.length;
    if (normalSign > 0) {
      mesh.addQuad(innerPath[i], outerPath[i], outerPath[next], innerPath[next]);
    } else {
      mesh.addQuad(innerPath[i], innerPath[next], outerPath[next], outerPath[i]);
    }
  }
}

function buildBevelGearAngles(params, sides) {
  const toothCount = Math.max(6, Number(params.bevelToothCount));
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

  addKeywayCriticalAngles(params.shaftDiameter / 2, params.keySlotWidth, params.keySlotDepth).forEach(add);

  return [...angles].sort((a, b) => a - b);
}

function bevelOuterRadiusAtAngle(theta, params, bevel, t) {
  const toothCount = Math.max(6, Number(params.bevelToothCount));
  const period = (Math.PI * 2) / toothCount;
  const nearestTooth = Math.round(theta / period) * period;
  const local = Math.abs(angleDelta(theta, nearestTooth)) / (period / 2);
  const pressure = Number(params.bevelPressureAngle);
  const topBand = clamp(0.17 - (pressure - 20) * 0.003, 0.11, 0.23);
  const rootBand = clamp(0.22 + (pressure - 20) * 0.0025, 0.17, 0.3);
  const rootR = bevelRootRadiusAt(bevel, t);
  const tipR = bevelTipRadiusAt(bevel, t);

  if (local <= topBand) return tipR;
  if (local >= 1 - rootBand) return rootR;

  const u = (local - topBand) / Math.max(0.001, 1 - rootBand - topBand);
  const flank = u * u * (3 - 2 * u);
  const involuteBias = Math.sin(flank * Math.PI) * Math.max(0, bevel.backPitchR - bevel.baseR) * bevelScaleAt(bevel, t) * 0.12;
  return lerp(tipR, rootR, flank) + involuteBias;
}

function bevelScaleAt(bevel, t) {
  return Math.max(0.08, 1 - (bevel.faceWidth * t) / Math.max(bevel.apexDistance, 0.001));
}

function bevelTipRadiusAt(bevel, t) {
  return bevel.backTipR * bevelScaleAt(bevel, t);
}

function bevelRootRadiusAt(bevel, t) {
  return bevel.backRootR * bevelScaleAt(bevel, t);
}

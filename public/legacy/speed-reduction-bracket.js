function speedReductionBracketMetricRows(d) {
  const rows = [
    ["Shafts", d.shaftCount],
    ["Stage 1", formatDimension(d.stageDistances[0])],
    ["Bore", formatDimension(d.boreDiameter)],
    ["Housing OD", formatDimension(d.housingOuterDiameter)],
    ["Foot span", formatDimension(d.footSpacing)],
  ];

  if (d.stageDistances.length > 1) rows.splice(2, 0, ["Stage 2", formatDimension(d.stageDistances[1])]);
  rows.push(["Supports", d.supportStyle]);
  rows.push(["Top bar", d.topSupportEnabled ? "On" : "Off"]);
  if (d.supportStyle === "Curved") {
    rows.push(["Post curves", d.supportCurves.map(formatDimension).join(" / ")]);
    if (d.topSupportEnabled) rows.push(["Rail curves", d.topSupportCurves.map(formatDimension).join(" / ")]);
  }
  if (d.rightAngleOutput) rows.push(["Output", "90 degree"]);
  rows.push(["Triangles", d.triangleCount.toLocaleString()]);
  return rows;
}

function validateSpeedReductionBracket(raw) {
  const warnings = [];
  const p = { ...raw };

  p.reducerShaftCount = String(p.reducerShaftCount) === "3" ? "3" : "2";
  p.reducerSupportStyle = p.reducerSupportStyle === "curved" ? "curved" : "straight";
  p.reducerSupportCurve = reducerClampSignedCurve(p.reducerSupportCurve, 0);
  p.reducerSupportCurve1 = reducerClampSignedCurve(p.reducerSupportCurve1, p.reducerSupportCurve);
  p.reducerSupportCurve2 = reducerClampSignedCurve(p.reducerSupportCurve2, -p.reducerSupportCurve);
  p.reducerSupportCurve3 = reducerClampSignedCurve(p.reducerSupportCurve3, 0);
  p.reducerTopSupportCurve1 = reducerClampSignedCurve(p.reducerTopSupportCurve1, 0);
  p.reducerTopSupportCurve2 = reducerClampSignedCurve(p.reducerTopSupportCurve2, 0);
  p.reducerStage1Auto = p.reducerStage1Auto !== false;
  p.reducerStage2Auto = p.reducerStage2Auto !== false;
  p.reducerTopSupportEnabled = p.reducerTopSupportEnabled !== false;
  p.reducerRightAngleOutput = Boolean(p.reducerRightAngleOutput);
  p.reducerBoreDiameter = Math.max(0.001, p.reducerBoreDiameter);
  p.reducerHousingOuterDiameter = Math.max(0.001, p.reducerHousingOuterDiameter);
  p.reducerHousingWidth = Math.max(0.001, p.reducerHousingWidth);
  p.reducerPulley1Diameter = Math.max(0.001, p.reducerPulley1Diameter);
  p.reducerPulley2Diameter = Math.max(0.001, p.reducerPulley2Diameter);
  p.reducerPulley3Diameter = Math.max(0.001, p.reducerPulley3Diameter);
  p.reducerShaft1Height = Math.max(0.001, reducerNumberOr(p.reducerShaft1Height, p.reducerLowShaftHeight || 1.35));
  p.reducerShaft2Height = Math.max(
    0.001,
    reducerNumberOr(p.reducerShaft2Height, p.reducerShaft1Height + reducerNumberOr(p.reducerStageRise, 0.9))
  );
  p.reducerShaft3Height = Math.max(0.001, reducerNumberOr(p.reducerShaft3Height, p.reducerShaft1Height));
  p.reducerManualCenterDistance = reducerClampStageOffset(
    p.reducerManualCenterDistance,
    reducerAutoHorizontalOffset(p.reducerPulley1Diameter, p.reducerPulley2Diameter, p.reducerShaft1Height, p.reducerShaft2Height)
  );
  p.reducerManualCenterDistance2 = reducerClampStageOffset(
    p.reducerManualCenterDistance2,
    reducerAutoHorizontalOffset(p.reducerPulley2Diameter, p.reducerPulley3Diameter, p.reducerShaft2Height, p.reducerShaft3Height)
  );
  p.reducerFrameDepth = Math.max(0.001, p.reducerFrameDepth);
  p.reducerArmThickness = Math.max(0.001, p.reducerArmThickness);
  p.reducerPostWidth = Math.max(0.001, p.reducerPostWidth);
  p.reducerBaseMargin = Math.max(0, p.reducerBaseMargin);
  p.reducerFootPadDiameter = Math.max(0.001, p.reducerFootPadDiameter);
  p.reducerBoltHoleDiameter = Math.max(0.001, p.reducerBoltHoleDiameter);
  p.reducerBaseDepth = Math.max(0.001, p.reducerBaseDepth);
  p.reducerBaseThickness = Math.max(0.001, p.reducerBaseThickness);

  const boreR = p.reducerBoreDiameter / 2;
  const housingR = p.reducerHousingOuterDiameter / 2;
  const footPadR = p.reducerFootPadDiameter / 2;
  const boltR = p.reducerBoltHoleDiameter / 2;

  if (p.reducerBoreDiameter >= p.reducerHousingOuterDiameter) {
    warnings.push("Bushing hole must be smaller than the housing outside diameter.");
  }

  if (housingR - boreR < Math.max(0.04, p.reducerHousingOuterDiameter * 0.09)) {
    warnings.push("Recommended change: housing wall is thin for a printed shaft carrier.");
  }

  const shaftHeights = [p.reducerShaft1Height, p.reducerShaft2Height, p.reducerShaft3Height].slice(
    0,
    Number(p.reducerShaftCount)
  );
  if (shaftHeights.some((height) => height <= housingR * 0.85)) {
    warnings.push("One shaft height is too short for the base and bearing housing.");
  }

  if (p.reducerBoltHoleDiameter >= p.reducerFootPadDiameter * 0.72) {
    warnings.push("Mounting bolt hole is too large for the foot pad.");
  }

  if (boltR + Math.max(0.04, p.reducerArmThickness * 0.2) >= footPadR) {
    warnings.push("Mounting bolt hole leaves too little material in the foot pad.");
  }

  if (p.reducerFrameDepth > p.reducerBaseDepth * 1.35) {
    warnings.push("Recommended change: frame depth is wider than the mounting feet.");
  }

  const geometry = computeSpeedReductionGeometry(p);
  const guideDiameters = [
    p.reducerPulley1Diameter,
    p.reducerPulley2Diameter,
    p.reducerPulley3Diameter,
  ];
  const guideDropsBelowBase = geometry.positions.some((shaft, index) => {
    const heightAboveBaseTop = shaft.y - p.reducerBaseThickness;
    return heightAboveBaseTop < guideDiameters[index] / 2 - 0.000001;
  });

  if (guideDropsBelowBase) {
    warnings.push("Recommended change: raise shaft heights so the guide circles clear the base.");
  }

  const tangentDistances = [
    reducerTouchingCenterDistance(p.reducerPulley1Diameter, p.reducerPulley2Diameter),
    reducerTouchingCenterDistance(p.reducerPulley2Diameter, p.reducerPulley3Diameter),
  ];
  const guideOverlap = geometry.stageDistances.some((distance, index) => {
    if (index >= Number(p.reducerShaftCount) - 1) return false;
    return distance < tangentDistances[index] - 0.000001;
  });

  if (guideOverlap) {
    warnings.push("Recommended change: one stage center distance is smaller than the tangent guide circles.");
  }

  if (geometry.spacingAdjusted) {
    warnings.push("Recommended change: shaft centers are very close, so housings may overlap.");
  }

  return { params: p, warnings };
}

function reducerClampSignedCurve(value, fallback) {
  const numeric = Number(value);
  const nextValue = Number.isFinite(numeric) ? numeric : fallback;
  return Math.min(4, Math.max(-4, nextValue));
}

function reducerTouchingCenterDistance(firstDiameter, secondDiameter) {
  return (Math.max(0.001, firstDiameter) + Math.max(0.001, secondDiameter)) / 2;
}

function reducerAutoHorizontalOffset(firstDiameter, secondDiameter, firstHeight, secondHeight) {
  const centerDistance = reducerTouchingCenterDistance(firstDiameter, secondDiameter);
  const dy = secondHeight - firstHeight;
  const squaredHorizontal = centerDistance * centerDistance - dy * dy;
  return squaredHorizontal > 0 ? Math.sqrt(squaredHorizontal) : 0;
}

function reducerNumberOr(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function reducerClampStageOffset(value, fallback) {
  return Math.min(48, Math.max(-48, reducerNumberOr(value, fallback)));
}

function reducerSupportCurveList(params, count) {
  if (params.reducerSupportStyle !== "curved") return Array.from({ length: count }, () => 0);
  return [
    params.reducerSupportCurve1 || 0,
    params.reducerSupportCurve2 || 0,
    params.reducerSupportCurve3 || 0,
  ].slice(0, count);
}

function reducerTopSupportCurveList(params, count) {
  if (params.reducerSupportStyle !== "curved") return Array.from({ length: count }, () => 0);
  return [
    params.reducerTopSupportCurve1 || 0,
    params.reducerTopSupportCurve2 || 0,
  ].slice(0, count);
}

function reducerSupportCurveForShaft(params, index) {
  return reducerSupportCurveList(params, index + 1)[index] || 0;
}

function reducerTopSupportCurveForStage(params, index) {
  return reducerTopSupportCurveList(params, index + 1)[index] || 0;
}

function generateSpeedReductionBracketMesh(params) {
  const mesh = new MeshBuilder();
  const sides = 96;
  const overlap = Math.max(0.015, params.reducerHousingOuterDiameter * 0.012);
  const geometry = computeSpeedReductionGeometry(params);
  const boreR = params.reducerBoreDiameter / 2;
  const housingR = params.reducerHousingOuterDiameter / 2;
  const housingZ0 = -params.reducerHousingWidth / 2;
  const housingZ1 = params.reducerHousingWidth / 2;
  const frameZ0 = -params.reducerFrameDepth / 2;
  const frameZ1 = params.reducerFrameDepth / 2;
  const baseY0 = 0;
  const baseY1 = params.reducerBaseThickness;
  const boltR = params.reducerBoltHoleDiameter / 2;
  const footPadR = params.reducerFootPadDiameter / 2;
  const minimumBaseHalfDepth = boltR + Math.max(0.02, footPadR * 0.08);
  const baseHalfDepth = Math.min(footPadR, Math.max(minimumBaseHalfDepth, params.reducerBaseDepth / 2));

  addLineshaftCapsuleBase(mesh, geometry.footX, boltR, baseHalfDepth, baseY0, baseY1, sides);

  geometry.positions.forEach((shaft, index) => {
    if (params.reducerRightAngleOutput && index === geometry.positions.length - 1) return;
    addLineshaftAnnularCylinderZ(mesh, shaft.x, shaft.y, boreR, housingR, housingZ0, housingZ1, sides);
  });

  if (params.reducerRightAngleOutput) {
    const output = geometry.positions[geometry.positions.length - 1];
    const crossWidth = Math.max(params.reducerHousingWidth, params.reducerFrameDepth) * 1.15;
    addReducerAnnularCylinderX(
      mesh,
      output.x,
      output.y,
      0,
      boreR,
      housingR * 0.95,
      output.x - crossWidth / 2,
      output.x + crossWidth / 2,
      sides
    );
  }

  geometry.positions.forEach((shaft, index) => {
    addReducerShaftSupport(
      mesh,
      shaft,
      params,
      boreR,
      housingR,
      baseY1 - overlap,
      frameZ0,
      frameZ1,
      overlap,
      reducerSupportCurveForShaft(params, index)
    );
  });

  if (params.reducerTopSupportEnabled) {
    for (let i = 0; i < geometry.positions.length - 1; i += 1) {
      addReducerTopSupport(
        mesh,
        geometry.positions[i],
        geometry.positions[i + 1],
        housingR,
        params,
        reducerTopSupportCurveForStage(params, i),
        frameZ0,
        frameZ1
      );
    }
  }

  const repairCaps = closeBoundaryLoops(mesh);

  return {
    triangles: mesh.triangles,
    derived: {
      shaftCount: Number(params.reducerShaftCount),
      stageDistances: geometry.stageDistances,
      boreDiameter: params.reducerBoreDiameter,
      housingOuterDiameter: params.reducerHousingOuterDiameter,
      footSpacing: geometry.footX * 2,
      supportStyle: params.reducerSupportStyle === "curved" ? "Curved" : "Straight",
      topSupportEnabled: params.reducerTopSupportEnabled,
      supportCurves: reducerSupportCurveList(params, geometry.positions.length),
      topSupportCurves: reducerTopSupportCurveList(params, geometry.positions.length - 1),
      rightAngleOutput: params.reducerRightAngleOutput,
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
    previewGuides: buildSpeedReductionConstructionGuides(params, geometry),
  };
}

function computeSpeedReductionGeometry(params) {
  const shaftCount = Number(params.reducerShaftCount) === 3 ? 3 : 2;
  const diameters = [
    params.reducerPulley1Diameter,
    params.reducerPulley2Diameter,
    params.reducerPulley3Diameter,
  ];
  const shaftHeights = [
    params.reducerShaft1Height,
    params.reducerShaft2Height,
    params.reducerShaft3Height,
  ];
  const minimumStageDistance = params.reducerHousingOuterDiameter * 0.72;
  const stageHorizontalOffsets = [
    reducerNumberOr(params.reducerManualCenterDistance, reducerTouchingCenterDistance(diameters[0], diameters[1])),
    reducerNumberOr(params.reducerManualCenterDistance2, reducerTouchingCenterDistance(diameters[1], diameters[2])),
  ];
  const positions = [{ x: 0, y: params.reducerBaseThickness + shaftHeights[0] }];
  const stageDistances = [];
  let spacingAdjusted = false;

  for (let index = 0; index < shaftCount - 1; index += 1) {
    const previous = positions[index];
    const nextY = params.reducerBaseThickness + shaftHeights[index + 1];
    const dy = nextY - previous.y;
    const dx = stageHorizontalOffsets[index];
    const stageDistance = Math.hypot(dx, dy);
    if (stageDistance < minimumStageDistance) spacingAdjusted = true;

    const next = {
      x: previous.x + dx,
      y: nextY,
    };
    positions.push(next);
    stageDistances.push(stageDistance);
  }

  const minX = Math.min(...positions.map((point) => point.x));
  const maxX = Math.max(...positions.map((point) => point.x));
  const centerX = (minX + maxX) / 2;
  positions.forEach((point) => {
    point.x -= centerX;
  });

  const centeredMinX = Math.min(...positions.map((point) => point.x));
  const centeredMaxX = Math.max(...positions.map((point) => point.x));
  const footPadR = params.reducerFootPadDiameter / 2;
  const footX = Math.max(
    Math.abs(centeredMinX),
    Math.abs(centeredMaxX),
    params.reducerHousingOuterDiameter / 2
  ) + params.reducerBaseMargin + footPadR * 0.45;

  return {
    positions,
    footX,
    stageDistances,
    spacingAdjusted,
  };
}

function addReducerShaftSupport(mesh, shaft, params, boreR, housingR, baseY, z0, z1, overlap, curveAmount) {
  const topY = shaft.y - boreR - Math.max(overlap, params.reducerHousingOuterDiameter * 0.012);
  if (topY <= baseY + 0.001) return;

  addReducerCastPost(
    mesh,
    shaft.x,
    baseY,
    topY,
    params,
    housingR,
    z0,
    z1,
    curveAmount
  );
}

function addReducerCastPost(mesh, cx, y0, y1, params, housingR, z0, z1, curveAmount = 0) {
  const height = Math.max(0.000001, y1 - y0);
  const waistWidth = Math.max(params.reducerPostWidth, params.reducerArmThickness * 1.25);
  const bottomWidth = Math.max(waistWidth * 1.62, params.reducerArmThickness * 2.8);
  const topWidth = Math.max(waistWidth * 1.38, housingR * 0.74);
  const rightSide = [];
  const steps = 18;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = y0 + height * t;
    const centerX = cx + curveAmount * Math.sin(Math.PI * t);
    let halfWidth;

    if (t < 0.28) {
      halfWidth = reducerLerp(bottomWidth, waistWidth, reducerSmoothStep(t / 0.28)) / 2;
    } else if (t > 0.7) {
      halfWidth = reducerLerp(waistWidth, topWidth, reducerSmoothStep((t - 0.7) / 0.3)) / 2;
    } else {
      halfWidth = waistWidth / 2;
    }

    rightSide.push([centerX + halfWidth, y]);
  }

  addExtrudedPolygon(
    mesh,
    [
      ...rightSide,
      ...rightSide
        .map((point, index) => {
          const t = index / Math.max(1, rightSide.length - 1);
          const centerX = cx + curveAmount * Math.sin(Math.PI * t);
          return [centerX - (point[0] - centerX), point[1]];
        })
        .reverse(),
    ],
    z0,
    z1
  );
}

function addReducerTopSupport(mesh, a, b, housingR, params, curveAmount, z0, z1) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(0.000001, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const thickness = Math.max(params.reducerArmThickness * 1.7, params.reducerPostWidth * 0.68);
  const endInset = Math.min(housingR * 0.72, length * 0.28);
  const start = [a.x + ux * endInset, a.y + uy * endInset];
  const end = [b.x - ux * endInset, b.y - uy * endInset];

  if (params.reducerSupportStyle === "curved" && Math.abs(curveAmount) > 0.000001) {
    addReducerCurvedBeam(mesh, start, end, thickness, curveAmount, z0, z1);
    return;
  }

  addReducerBeam(mesh, start, end, thickness, z0, z1);
}

function addReducerBeam(mesh, start, end, thickness, z0, z1) {
  const path = lineshaftThickSegmentPath(start, end, thickness);
  addExtrudedPolygon(mesh, path, z0, z1);
}

function addReducerCurvedBeam(mesh, start, end, thickness, bend, z0, z1) {
  const segments = 18;
  const left = [];
  const right = [];
  const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.max(0.000001, Math.hypot(dx, dy));
  const normal = [-dy / length, dx / length];
  const control = [midpoint[0] + normal[0] * bend, midpoint[1] + normal[1] * bend];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = reducerQuadraticPoint(start, control, end, t);
    const tangent = reducerQuadraticTangent(start, control, end, t);
    const tangentLength = Math.max(0.000001, Math.hypot(tangent[0], tangent[1]));
    const nx = (-tangent[1] / tangentLength) * thickness * 0.5;
    const ny = (tangent[0] / tangentLength) * thickness * 0.5;
    left.push([point[0] + nx, point[1] + ny]);
    right.push([point[0] - nx, point[1] - ny]);
  }

  addExtrudedPolygon(mesh, [...left, ...right.reverse()], z0, z1);
}

function buildSpeedReductionConstructionGuides(params, geometry) {
  const shaftCount = Number(params.reducerShaftCount) === 3 ? 3 : 2;
  const diameters = [
    params.reducerPulley1Diameter,
    params.reducerPulley2Diameter,
    params.reducerPulley3Diameter,
  ];
  const z = Math.max(params.reducerHousingWidth, params.reducerFrameDepth) / 2 + 0.035;

  return geometry.positions.slice(0, shaftCount).map((shaft, index) => ({
    type: "circle",
    center: [shaft.x, shaft.y, z],
    radius: diameters[index] / 2,
    segments: 112,
  }));
}

function addReducerAnnularCylinderX(mesh, cx, cy, cz, innerR, outerR, x0, x1, sides) {
  for (let i = 0; i < sides; i += 1) {
    const t0 = (i / sides) * Math.PI * 2;
    const t1 = ((i + 1) / sides) * Math.PI * 2;
    const outer0 = reducerPointX(cx, cy, cz, outerR, t0, x0);
    const outer1 = reducerPointX(cx, cy, cz, outerR, t1, x0);
    const outer2 = reducerPointX(cx, cy, cz, outerR, t1, x1);
    const outer3 = reducerPointX(cx, cy, cz, outerR, t0, x1);
    const inner0 = reducerPointX(cx, cy, cz, innerR, t0, x0);
    const inner1 = reducerPointX(cx, cy, cz, innerR, t1, x0);
    const inner2 = reducerPointX(cx, cy, cz, innerR, t1, x1);
    const inner3 = reducerPointX(cx, cy, cz, innerR, t0, x1);

    mesh.addQuad(outer0, outer3, outer2, outer1);
    mesh.addQuad(inner0, inner1, inner2, inner3);
    mesh.addQuad(inner0, outer0, outer1, inner1);
    mesh.addQuad(inner3, inner2, outer2, outer3);
  }
}

function reducerQuadraticPoint(a, b, c, t) {
  const oneMinusT = 1 - t;
  return [
    oneMinusT * oneMinusT * a[0] + 2 * oneMinusT * t * b[0] + t * t * c[0],
    oneMinusT * oneMinusT * a[1] + 2 * oneMinusT * t * b[1] + t * t * c[1],
  ];
}

function reducerQuadraticTangent(a, b, c, t) {
  return [
    2 * (1 - t) * (b[0] - a[0]) + 2 * t * (c[0] - b[0]),
    2 * (1 - t) * (b[1] - a[1]) + 2 * t * (c[1] - b[1]),
  ];
}

function reducerSmoothStep(t) {
  const clamped = clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function reducerLerp(a, b, t) {
  return a + (b - a) * t;
}

function reducerPointX(cx, cy, cz, radius, theta, x) {
  return [x, cy + Math.cos(theta) * radius, cz + Math.sin(theta) * radius];
}

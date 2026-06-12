function lineshaftHangerMetricRows(d) {
  return [
    ["Bore", formatDimension(d.boreDiameter)],
    ["Housing OD", formatDimension(d.housingOuterDiameter)],
    ["Housing W", formatDimension(d.housingWidth)],
    ["Center H", formatDimension(d.centerHeight)],
    ["Frame", d.frameStyle],
    ["Foot span", formatDimension(d.footSpacing)],
    ["Bolt holes", formatDimension(d.boltHoleDiameter)],
    ["Triangles", d.triangleCount.toLocaleString()],
  ];
}

function validateLineshaftHanger(raw) {
  const warnings = [];
  const p = { ...raw };

  p.hangerFrameStyle = p.hangerFrameStyle === "centerPost" ? "centerPost" : "aFrame";
  p.hangerBoreDiameter = Math.max(0.001, p.hangerBoreDiameter);
  p.hangerHousingOuterDiameter = Math.max(0.001, p.hangerHousingOuterDiameter);
  p.hangerHousingWidth = Math.max(0.001, p.hangerHousingWidth);
  p.hangerCenterHeight = Math.max(0.001, p.hangerCenterHeight);
  p.hangerFrameDepth = Math.max(0.001, p.hangerFrameDepth);
  p.hangerLegThickness = Math.max(0.001, p.hangerLegThickness);
  p.hangerLegFootInset = Math.max(0, p.hangerLegFootInset);
  p.hangerFootSpacing = Math.max(0.001, p.hangerFootSpacing);
  p.hangerFootPadDiameter = Math.max(0.001, p.hangerFootPadDiameter);
  p.hangerBoltHoleDiameter = Math.max(0.001, p.hangerBoltHoleDiameter);
  p.hangerBaseDepth = Math.max(0.001, p.hangerBaseDepth);
  p.hangerBaseThickness = Math.max(0.001, p.hangerBaseThickness);

  const boreR = p.hangerBoreDiameter / 2;
  const housingR = p.hangerHousingOuterDiameter / 2;
  const footPadR = p.hangerFootPadDiameter / 2;
  const boltR = p.hangerBoltHoleDiameter / 2;
  const housingWall = housingR - boreR;

  if (p.hangerBoreDiameter >= p.hangerHousingOuterDiameter) {
    warnings.push("Bushing hole must be smaller than the housing outside diameter.");
  }

  if (housingWall < Math.max(0.04, p.hangerHousingOuterDiameter * 0.09)) {
    warnings.push("Recommended change: housing wall is thin for a printed bushing carrier.");
  }

  if (p.hangerCenterHeight <= housingR + p.hangerBaseThickness + p.hangerLegThickness * 0.35) {
    warnings.push("Center height is too low for the legs and housing.");
  }

  if (p.hangerFootSpacing <= p.hangerHousingOuterDiameter * 0.95) {
    warnings.push("Foot spacing is too narrow for the housing.");
  }

  if (p.hangerBoltHoleDiameter >= p.hangerFootPadDiameter * 0.72) {
    warnings.push("Mounting bolt hole is too large for the foot pad.");
  }

  if (boltR + Math.max(0.04, p.hangerLegThickness * 0.2) >= footPadR) {
    warnings.push("Mounting bolt hole leaves too little material in the foot pad.");
  }

  if (p.hangerFrameDepth > p.hangerBaseDepth * 1.25) {
    warnings.push("Recommended change: frame depth is wider than the mounting feet.");
  }

  if (p.hangerBaseDepth / 2 <= boltR + Math.max(0.02, footPadR * 0.08)) {
    warnings.push("Base slab depth is too narrow for the mounting bolt holes.");
  }

  if (p.hangerFrameStyle === "aFrame") {
    const minimumInset = boltR + p.hangerLegThickness * 0.65 + Math.max(0.02, p.hangerFootPadDiameter * 0.04);
    const maximumInset = p.hangerFootSpacing / 2 - housingR * 0.35;
    if (p.hangerLegFootInset < minimumInset) {
      warnings.push("A-frame foot inset is too small and may cover the mounting holes.");
    }
    if (p.hangerLegFootInset >= maximumInset) {
      warnings.push("A-frame foot inset places the legs too close to the center post area.");
    }
  }

  return { params: p, warnings };
}

function generateLineshaftHangerMesh(params) {
  const mesh = new MeshBuilder();
  const sides = 96;
  const overlap = Math.max(0.015, params.hangerHousingOuterDiameter * 0.012);
  const boreR = params.hangerBoreDiameter / 2;
  const housingR = params.hangerHousingOuterDiameter / 2;
  const housingZ0 = -params.hangerHousingWidth / 2;
  const housingZ1 = params.hangerHousingWidth / 2;
  const frameZ0 = -params.hangerFrameDepth / 2;
  const frameZ1 = params.hangerFrameDepth / 2;
  const baseY0 = 0;
  const baseY1 = params.hangerBaseThickness;
  const centerY = params.hangerCenterHeight;
  const footX = params.hangerFootSpacing / 2;
  const footPadR = params.hangerFootPadDiameter / 2;
  const boltR = params.hangerBoltHoleDiameter / 2;
  const minimumBaseHalfDepth = boltR + Math.max(0.02, footPadR * 0.08);
  const baseHalfDepth = Math.min(footPadR, Math.max(minimumBaseHalfDepth, params.hangerBaseDepth / 2));

  addLineshaftAnnularCylinderZ(mesh, 0, centerY, boreR, housingR, housingZ0, housingZ1, sides);

  addLineshaftCapsuleBase(mesh, footX, boltR, baseHalfDepth, baseY0, baseY1, sides);

  if (params.hangerFrameStyle === "centerPost") {
    addLineshaftCenterPost(mesh, params, boreR, housingR, centerY, baseY1, frameZ0, frameZ1, overlap);
  } else {
    addLineshaftLeg(mesh, -1, params, housingR, footX, centerY, baseY1, frameZ0, frameZ1, overlap);
    addLineshaftLeg(mesh, 1, params, housingR, footX, centerY, baseY1, frameZ0, frameZ1, overlap);

    addLineshaftCuboid(
      mesh,
      -housingR * 0.82,
      housingR * 0.82,
      centerY - housingR - params.hangerLegThickness * 0.22,
      centerY - housingR + params.hangerLegThickness * 0.58,
      frameZ0,
      frameZ1
    );
  }

  const repairCaps = closeBoundaryLoops(mesh);

  return {
    triangles: mesh.triangles,
    derived: {
      boreDiameter: params.hangerBoreDiameter,
      housingOuterDiameter: params.hangerHousingOuterDiameter,
      housingWidth: params.hangerHousingWidth,
      centerHeight: params.hangerCenterHeight,
      frameStyle: params.hangerFrameStyle === "centerPost" ? "Center post" : "A frame",
      footSpacing: params.hangerFootSpacing,
      boltHoleDiameter: params.hangerBoltHoleDiameter,
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
  };
}

function addLineshaftLeg(mesh, sign, params, housingR, footX, centerY, baseY, z0, z1, overlap) {
  const lower = [sign * (footX - params.hangerLegFootInset), baseY - overlap];
  const upper = [sign * housingR * 0.68, centerY - housingR * 0.18];
  const path = lineshaftThickSegmentPath(lower, upper, params.hangerLegThickness);
  addExtrudedPolygon(mesh, path, z0, z1);
}

function addLineshaftCenterPost(mesh, params, boreR, housingR, centerY, baseY, z0, z1, overlap) {
  const postHalfWidth = Math.max(params.hangerLegThickness * 0.65, housingR * 0.22);
  const baseBlendHalfWidth = postHalfWidth + params.hangerLegThickness * 0.75;
  const housingBlendHalfWidth = Math.min(housingR * 0.68, postHalfWidth + params.hangerLegThickness * 1.15);
  const bottomY = baseY - overlap;
  const baseBlendTopY = baseY + params.hangerLegThickness * 0.68;
  const housingBlendBottomY = centerY - housingR + params.hangerLegThickness * 0.12;
  const topY = centerY - boreR - Math.max(0.03, params.hangerHousingOuterDiameter * 0.012);
  const rightSide = buildLineshaftCenterPostSide([
    {
      fromY: bottomY,
      toY: baseBlendTopY,
      fromHalfWidth: baseBlendHalfWidth,
      toHalfWidth: postHalfWidth,
      steps: 10,
    },
    {
      fromY: baseBlendTopY,
      toY: housingBlendBottomY,
      fromHalfWidth: postHalfWidth,
      toHalfWidth: postHalfWidth,
      steps: 1,
    },
    {
      fromY: housingBlendBottomY,
      toY: topY,
      fromHalfWidth: postHalfWidth,
      toHalfWidth: housingBlendHalfWidth,
      steps: 16,
    },
  ]);

  addExtrudedPolygon(
    mesh,
    [
      ...rightSide.map((point) => [point[0], point[1]]),
      ...rightSide.map((point) => [-point[0], point[1]]).reverse(),
    ],
    z0,
    z1
  );
}

function lineshaftSmoothStep(t) {
  return t * t * (3 - 2 * t);
}

function buildLineshaftCenterPostSide(segments) {
  const path = [];

  segments.forEach((segment, segmentIndex) => {
    const steps = Math.max(1, segment.steps);
    for (let i = segmentIndex === 0 ? 0 : 1; i <= steps; i += 1) {
      const t = i / steps;
      const eased = lineshaftSmoothStep(t);
      const y = segment.fromY + (segment.toY - segment.fromY) * t;
      const halfWidth = segment.fromHalfWidth + (segment.toHalfWidth - segment.fromHalfWidth) * eased;
      path.push([halfWidth, y]);
    }
  });

  return path;
}

function lineshaftThickSegmentPath(start, end, thickness) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.max(0.000001, Math.hypot(dx, dy));
  const nx = (-dy / length) * thickness * 0.5;
  const ny = (dx / length) * thickness * 0.5;

  return [
    [start[0] + nx, start[1] + ny],
    [end[0] + nx, end[1] + ny],
    [end[0] - nx, end[1] - ny],
    [start[0] - nx, start[1] - ny],
  ];
}

function addLineshaftCapsuleBase(mesh, footX, innerR, outerR, y0, y1, sides) {
  addLineshaftCapsuleBaseHalf(mesh, -footX, 0, innerR, outerR, y0, y1, sides);
  addLineshaftCapsuleBaseHalf(mesh, footX, 0, innerR, outerR, y0, y1, sides);
}

function addLineshaftCapsuleBaseHalf(mesh, cx, seamX, innerR, outerR, y0, y1, sides) {
  const angles = buildLineshaftCapsuleHalfAngles(cx, seamX, outerR, sides);

  for (let i = 0; i < angles.length; i += 1) {
    const t0 = angles[i];
    const t1 = angles[(i + 1) % angles.length];
    const boundary0 = lineshaftCapsuleHalfBoundary(cx, seamX, outerR, t0);
    const boundary1 = lineshaftCapsuleHalfBoundary(cx, seamX, outerR, t1);
    const midTheta = lineshaftMidAngle(t0, t1);
    const midBoundary = lineshaftCapsuleHalfBoundary(cx, seamX, outerR, midTheta);

    const outer0 = [boundary0.x, y0, boundary0.z];
    const outer1 = [boundary1.x, y0, boundary1.z];
    const outer2 = [boundary1.x, y1, boundary1.z];
    const outer3 = [boundary0.x, y1, boundary0.z];
    const inner0 = lineshaftPointY(cx, 0, innerR, t0, y0);
    const inner1 = lineshaftPointY(cx, 0, innerR, t1, y0);
    const inner2 = lineshaftPointY(cx, 0, innerR, t1, y1);
    const inner3 = lineshaftPointY(cx, 0, innerR, t0, y1);

    mesh.addQuad(outer0, outer1, inner1, inner0);
    mesh.addQuad(outer3, inner3, inner2, outer2);
    mesh.addQuad(inner0, inner1, inner2, inner3);

    if (midBoundary.type !== "seam") {
      mesh.addQuad(outer0, outer3, outer2, outer1);
    }
  }
}

function buildLineshaftCapsuleHalfAngles(cx, seamX, outerR, sides) {
  const angles = [];
  const seamSamples = Math.max(18, Math.floor(sides * 0.28));
  const outsideSamples = Math.max(64, sides);

  for (let i = 0; i <= seamSamples; i += 1) {
    const z = -outerR + (outerR * 2 * i) / seamSamples;
    angles.push(lineshaftNormalizeAngle(Math.atan2(z, seamX - cx)));
  }

  for (let i = 0; i < outsideSamples; i += 1) {
    const theta = (i / outsideSamples) * Math.PI * 2;
    if (lineshaftCapsuleHalfBoundary(cx, seamX, outerR, theta).type !== "seam") {
      angles.push(theta);
    }
  }

  return lineshaftUniqueSortedAngles(angles);
}

function lineshaftCapsuleHalfBoundary(cx, seamX, outerR, theta) {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const dxToSeam = seamX - cx;
  const pointsTowardSeam = dxToSeam * cosTheta > 0;

  if (!pointsTowardSeam) {
    return {
      x: cx + cosTheta * outerR,
      z: sinTheta * outerR,
      type: "round",
    };
  }

  const seamDistance = Math.abs(dxToSeam / cosTheta);
  const flatDistance = Math.abs(sinTheta) > 0.0000001 ? outerR / Math.abs(sinTheta) : Infinity;

  if (seamDistance <= flatDistance + 0.0000001) {
    return {
      x: seamX,
      z: sinTheta * seamDistance,
      type: "seam",
    };
  }

  return {
    x: cx + cosTheta * flatDistance,
    z: sinTheta > 0 ? outerR : -outerR,
    type: sinTheta > 0 ? "top" : "bottom",
  };
}

function lineshaftMidAngle(t0, t1) {
  let next = t1;
  if (next <= t0) next += Math.PI * 2;
  return lineshaftNormalizeAngle((t0 + next) / 2);
}

function lineshaftNormalizeAngle(theta) {
  const full = Math.PI * 2;
  let normalized = theta % full;
  if (normalized < 0) normalized += full;
  return Math.abs(normalized - full) < 0.0000001 ? 0 : normalized;
}

function lineshaftUniqueSortedAngles(angles) {
  const sorted = angles
    .map(lineshaftNormalizeAngle)
    .sort((a, b) => a - b)
    .filter((angle, index, list) => index === 0 || Math.abs(angle - list[index - 1]) > 0.000001);

  if (sorted.length > 1 && Math.abs(sorted[0] + Math.PI * 2 - sorted[sorted.length - 1]) <= 0.000001) {
    sorted.pop();
  }

  return sorted;
}

function addLineshaftCuboid(mesh, x0, x1, y0, y1, z0, z1) {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const minZ = Math.min(z0, z1);
  const maxZ = Math.max(z0, z1);

  const p000 = [minX, minY, minZ];
  const p100 = [maxX, minY, minZ];
  const p110 = [maxX, maxY, minZ];
  const p010 = [minX, maxY, minZ];
  const p001 = [minX, minY, maxZ];
  const p101 = [maxX, minY, maxZ];
  const p111 = [maxX, maxY, maxZ];
  const p011 = [minX, maxY, maxZ];

  mesh.addQuad(p000, p010, p110, p100);
  mesh.addQuad(p001, p101, p111, p011);
  mesh.addQuad(p000, p100, p101, p001);
  mesh.addQuad(p010, p011, p111, p110);
  mesh.addQuad(p000, p001, p011, p010);
  mesh.addQuad(p100, p110, p111, p101);
}

function addLineshaftAnnularCylinderZ(mesh, cx, cy, innerR, outerR, z0, z1, sides) {
  for (let i = 0; i < sides; i += 1) {
    const t0 = (i / sides) * Math.PI * 2;
    const t1 = ((i + 1) / sides) * Math.PI * 2;
    const outer0 = lineshaftPointZ(cx, cy, outerR, t0, z0);
    const outer1 = lineshaftPointZ(cx, cy, outerR, t1, z0);
    const outer2 = lineshaftPointZ(cx, cy, outerR, t1, z1);
    const outer3 = lineshaftPointZ(cx, cy, outerR, t0, z1);
    const inner0 = lineshaftPointZ(cx, cy, innerR, t0, z0);
    const inner1 = lineshaftPointZ(cx, cy, innerR, t1, z0);
    const inner2 = lineshaftPointZ(cx, cy, innerR, t1, z1);
    const inner3 = lineshaftPointZ(cx, cy, innerR, t0, z1);

    mesh.addQuad(outer0, outer1, outer2, outer3);
    mesh.addQuad(inner0, inner3, inner2, inner1);
    mesh.addQuad(inner0, inner1, outer1, outer0);
    mesh.addQuad(inner3, outer3, outer2, inner2);
  }
}

function addLineshaftFootPad(mesh, cx, cz, innerR, outerR, y0, y1, sides) {
  for (let i = 0; i < sides; i += 1) {
    const t0 = (i / sides) * Math.PI * 2;
    const t1 = ((i + 1) / sides) * Math.PI * 2;
    const outer0 = lineshaftPointY(cx, cz, outerR, t0, y0);
    const outer1 = lineshaftPointY(cx, cz, outerR, t1, y0);
    const outer2 = lineshaftPointY(cx, cz, outerR, t1, y1);
    const outer3 = lineshaftPointY(cx, cz, outerR, t0, y1);
    const inner0 = lineshaftPointY(cx, cz, innerR, t0, y0);
    const inner1 = lineshaftPointY(cx, cz, innerR, t1, y0);
    const inner2 = lineshaftPointY(cx, cz, innerR, t1, y1);
    const inner3 = lineshaftPointY(cx, cz, innerR, t0, y1);

    mesh.addQuad(outer0, outer3, outer2, outer1);
    mesh.addQuad(inner0, inner1, inner2, inner3);
    mesh.addQuad(outer0, outer1, inner1, inner0);
    mesh.addQuad(outer3, inner3, inner2, outer2);
  }
}

function lineshaftPointZ(cx, cy, radius, theta, z) {
  return [cx + Math.cos(theta) * radius, cy + Math.sin(theta) * radius, z];
}

function lineshaftPointY(cx, cz, radius, theta, y) {
  return [cx + Math.cos(theta) * radius, y, cz + Math.sin(theta) * radius];
}

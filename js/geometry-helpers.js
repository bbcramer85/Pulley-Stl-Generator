function getSetScrewSpec(params) {
  const option = threadOptions[params.setScrewThread] || threadOptions[pulleyDefaults.setScrewThread];
  const factor = params.unitFactor || 1;
  return {
    label: option.label,
    major: option.major * factor,
    minor: option.minor * factor,
    pitch: option.pitch * factor,
  };
}

function computeSetScrewBossRadius(spec, params) {
  const requestedRadius = params.setScrewBossWidth / 2;
  const minimumRadius = spec.major / 2 + Math.max(spec.major * 0.18, spec.pitch * 0.8);
  return Math.max(requestedRadius, minimumRadius);
}

function computeSetScrewCut(params) {
  const spec = getSetScrewSpec(params);
  const hubZOffset = computeHubZOffset(params);
  const boreR = params.shaftDiameter / 2;
  const hubR = boreR + params.hubThickness;
  const basis = setScrewAxisBasis(
    (params.setScrewAngle * Math.PI) / 180,
    (params.setScrewIntersectAngle * Math.PI) / 180,
    boreR,
    hubZOffset + params.setScrewBossOffset
  );
  const bossRadius = computeSetScrewBossRadius(spec, params);
  const hubSurfaceDist = axisDistanceForRadius(basis, hubR);
  const bossEnd = axisDistanceForRadialBossHeight(basis, hubR, bossRadius, params.setScrewBossHeight);
  const threadStart = axisDistanceForSectionOutsideRadius(basis, boreR + 0.0005, spec.major / 2);

  return {
    ...basis,
    radius: spec.major * 0.58,
    startDist: -spec.pitch * 0.25,
    endDist: Math.max(hubSurfaceDist, bossEnd) + spec.pitch * 0.5,
    threadStartDist: threadStart,
    threadEndDist: bossEnd,
    threadMajorRadius: spec.major / 2,
    threadMinorRadius: spec.minor / 2,
    threadPitch: spec.pitch,
  };
}

function maxAxisSectionRadius(basis, dist, crossRadius, sides = 48) {
  let maxRadius = 0;
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    const point = axisPoint(basis, dist, Math.cos(a) * crossRadius, Math.sin(a) * crossRadius);
    maxRadius = Math.max(maxRadius, Math.hypot(point[0], point[1]));
  }
  return maxRadius;
}

function minAxisSectionRadius(basis, dist, crossRadius, sides = 48) {
  let minRadius = Infinity;
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    const point = axisPoint(basis, dist, Math.cos(a) * crossRadius, Math.sin(a) * crossRadius);
    minRadius = Math.min(minRadius, Math.hypot(point[0], point[1]));
  }
  return minRadius;
}

function axisDistanceForSectionOutsideRadius(basis, radius, crossRadius) {
  const radialAxisScale = Math.max(0.05, Math.hypot(basis.u[0], basis.u[1]));
  let low = 0;
  let high = (crossRadius * 2 + radius * 0.08) / radialAxisScale;

  while (minAxisSectionRadius(basis, high, crossRadius) < radius) {
    high *= 1.5;
  }

  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    if (minAxisSectionRadius(basis, mid, crossRadius) < radius) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return high;
}

function axisDistanceForRadialBossHeight(basis, hubR, bossRadius, bossHeight) {
  const targetRadius = hubR + Math.max(0.001, bossHeight);
  const hubSurfaceDist = axisDistanceForRadius(basis, hubR);
  const radialAxisScale = Math.max(0.05, Math.hypot(basis.u[0], basis.u[1]));
  let low = 0;
  let high = hubSurfaceDist + (Math.max(0.001, bossHeight) + bossRadius * 2) / radialAxisScale;

  while (maxAxisSectionRadius(basis, high, bossRadius) < targetRadius) {
    high *= 1.5;
  }

  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    if (maxAxisSectionRadius(basis, mid, bossRadius) < targetRadius) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return high;
}

function computeSpokeInnerRadius(params, hubR, boreR) {
  const spokeRootOverlap = Math.max(
    params.hubThickness * 0.65,
    Math.min(params.spokeInnerWidth, params.hubThickness * 1.4) * 0.55
  );
  const boreClearance = Math.min(params.hubThickness * 0.22, params.shaftDiameter * 0.08);
  return Math.max(boreR + boreClearance, hubR - spokeRootOverlap);
}

function computeRimInnerRadius(params, hubR, baseR) {
  const minimumGap = Math.max(params.diameter * 0.025, params.shaftDiameter * 0.12);
  const requestedInnerR = baseR - params.rimThickness;
  const minimumRimWall = Math.max(params.diameter * 0.005, 0.001);
  return clamp(requestedInnerR, hubR + minimumGap, baseR - minimumRimWall);
}

function clampRimRadius(radius, params, rimInnerR, baseR) {
  const openingClearance = rimInnerR - (params.shaftDiameter / 2 + params.hubThickness);
  const limit = Math.min(params.overallWidth / 2, params.rimThickness * 0.45, openingClearance * 0.35, baseR * 0.25);
  return clamp(radius, 0, Math.max(0, limit));
}

function clampHubRadius(radius, params, hubR, boreR) {
  const limit = Math.min(params.hubWidth / 2, (hubR - boreR) * 0.42);
  return clamp(radius, 0, Math.max(0, limit));
}

function clampShaftRadius(radius, params, hubR, boreR) {
  const keyDepth = getKeySlotDepth(params);
  const limit = Math.min(params.hubWidth / 2, (hubR - boreR - keyDepth) * 0.35, boreR * 0.45);
  return clamp(radius, 0, Math.max(0, limit));
}

function clampSpokeRadius(radius, params) {
  const minWidth = Math.min(params.spokeWidth, params.spokeInnerWidth, params.spokeOuterWidth);
  const limit = Math.min(minWidth, params.spokeHeight) * 0.42;
  return clamp(radius, 0, Math.max(0, limit));
}

function computeSpokeHeight(params) {
  return Math.max(0.001, Math.min(params.spokeHeight, params.overallWidth, params.hubWidth));
}

function computeHubZOffset(params, faceWidth = params.overallWidth || params.hubWidth) {
  if (params.hubPosition === "backFlush") return (params.hubWidth - faceWidth) / 2;
  if (params.hubPosition === "frontFlush") return (faceWidth - params.hubWidth) / 2;
  return 0;
}

function getKeySlotDepth(params) {
  if ("keySlotDepth" in params) return Math.max(0, params.keySlotDepth);
  return Math.max(0, params.keySlotWidth / 2);
}

function buildRimProfile(params, baseR) {
  const halfW = params.overallWidth / 2;
  const crown = params.crown;
  const profile = [];

  for (let i = 0; i <= 32; i += 1) {
    const t = i / 32;
    const z = -halfW + params.overallWidth * t;
    const u = z / halfW;
    profile.push({ z, r: baseR + crown * Math.max(0, 1 - u * u) });
  }

  return profile;
}

function computeVBeltGrooveGeometry(params, outerR) {
  const halfW = params.vOverallWidth / 2;
  const topWidth = clamp(params.vGrooveTopWidth, 0.001, params.vOverallWidth);
  const halfTop = Math.min(topWidth / 2, halfW);
  const depth = clamp(params.vGrooveDepth, 0.001, Math.max(0.001, outerR * 0.92));
  const angle = clamp(params.vGrooveAngle, 12, 80);
  const angleRad = (angle * Math.PI) / 180;
  const requestedRootHalf = halfTop - depth * Math.tan(angleRad / 2);
  const rootHalf = Math.max(0, requestedRootHalf);
  const rootR = Math.max(0.001, outerR - depth);
  const effectiveAngle = depth > 0 ? (Math.atan2(halfTop - rootHalf, depth) * 360) / Math.PI : angle;

  return {
    topWidth: halfTop * 2,
    depth,
    rootWidth: rootHalf * 2,
    rootR,
    effectiveAngle,
  };
}

function buildVBeltRimProfile(params, outerR, groove) {
  const halfW = params.vOverallWidth / 2;
  const halfTop = groove.topWidth / 2;
  const rootHalf = groove.rootWidth / 2;
  const profile = [];
  const push = (r, z) => {
    const previous = profile[profile.length - 1];
    if (previous && Math.abs(previous.r - r) < 0.0000001 && Math.abs(previous.z - z) < 0.0000001) return;
    profile.push({ r, z });
  };

  push(outerR, -halfW);
  push(outerR, -halfTop);

  if (rootHalf > 0.000001) {
    push(groove.rootR, -rootHalf);
    push(groove.rootR, rootHalf);
  } else {
    push(groove.rootR, 0);
  }

  push(outerR, halfTop);
  push(outerR, halfW);

  return profile;
}

function computeVBeltRimInnerRadius(params, hubR, grooveRootR) {
  const minimumGap = Math.max(params.vOuterDiameter * 0.025, params.shaftDiameter * 0.12);
  const requestedInnerR = grooveRootR - params.vRimThickness;
  const minimumRimWall = Math.max(params.vOuterDiameter * 0.005, 0.001);
  return clamp(requestedInnerR, hubR + minimumGap, grooveRootR - minimumRimWall);
}

function clampVBeltRimRadius(radius, params, rimInnerR, grooveRootR) {
  const openingClearance = rimInnerR - (params.shaftDiameter / 2 + params.hubThickness);
  const rimWall = grooveRootR - rimInnerR;
  const limit = Math.min(params.vOverallWidth / 2, rimWall * 0.45, openingClearance * 0.35, grooveRootR * 0.25);
  return clamp(radius, 0, Math.max(0, limit));
}


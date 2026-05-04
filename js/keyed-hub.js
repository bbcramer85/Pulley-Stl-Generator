function addKeyedHub(mesh, outerR, boreR, keySlotWidth, width, sides, hubRadius, shaftRadius, setScrewCut = null, keySlotDepth = keySlotWidth / 2) {
  const hubZOffset = arguments.length >= 11 ? arguments[10] : 0;
  const z0 = hubZOffset - width / 2;
  const z1 = hubZOffset + width / 2;
  const keyDepth = Math.max(0, keySlotDepth);
  const keyedPath = buildKeyedHolePath(boreR, keySlotWidth, keyDepth, sides);
  const outerEdgeRadius = clamp(hubRadius, 0, Math.max(0, Math.min((outerR - boreR - keyDepth) * 0.42, width * 0.45)));
  const shaftEdgeRadius = clamp(shaftRadius, 0, Math.max(0, Math.min((outerR - boreR - keyDepth) * 0.35, width * 0.45)));
  const capPath = buildKeyedHolePath(boreR + shaftEdgeRadius, keySlotWidth, keyDepth, sides);
  const capAngles = capPath.map(pointAngle);
  const outerSideZ0 = z0 + outerEdgeRadius;
  const outerSideZ1 = z1 - outerEdgeRadius;
  const shaftSideZ0 = z0 + shaftEdgeRadius;
  const shaftSideZ1 = z1 - shaftEdgeRadius;

  addCylinderSideWithAnglesAndRadialCut(mesh, outerR, outerSideZ0, outerSideZ1, capAngles, false, setScrewCut);
  if (outerEdgeRadius > 0.000001) {
    addRevolvedSurfaceWithAngles(mesh, quarterProfile(outerR, z0, outerEdgeRadius, "outerLower"), capAngles, false);
    addRevolvedSurfaceWithAngles(mesh, quarterProfile(outerR, z1, outerEdgeRadius, "outerUpper"), capAngles, false);
  }

  addKeyedPathSideWithRadialCut(
    mesh,
    keyedPath,
    shaftSideZ0,
    shaftSideZ1,
    setScrewCut
  );

  if (shaftEdgeRadius > 0.000001) {
    addKeyedHoleFillet(mesh, boreR, keySlotWidth, keyDepth, z0, shaftEdgeRadius, sides, "lower");
    addKeyedHoleFillet(mesh, boreR, keySlotWidth, keyDepth, z1, shaftEdgeRadius, sides, "upper");
  }

  addKeyedCap(mesh, outerR - outerEdgeRadius, capPath, z0, -1);
  addKeyedCap(mesh, outerR - outerEdgeRadius, capPath, z1, 1);
}

function addKeyedCap(mesh, outerR, path, z, normalSign) {
  for (let i = 0; i < path.length; i += 1) {
    const next = (i + 1) % path.length;
    const p0 = path[i];
    const p1 = path[next];
    const t0 = pointAngle(p0);
    const t1 = pointAngle(p1);
    const inner0 = pointWithZ(p0, z);
    const inner1 = pointWithZ(p1, z);
    const outer0 = polarPoint(outerR, t0, z);
    const outer1 = polarPoint(outerR, t1, z);

    if (normalSign > 0) {
      mesh.addQuad(inner0, outer0, outer1, inner1);
    } else {
      mesh.addQuad(inner0, inner1, outer1, outer0);
    }
  }
}

function buildKeyedHolePath(boreR, keyWidth, keyDepth, sides) {
  if (keyWidth <= 0 || keyDepth <= 0) {
    return buildCirclePath(boreR, sides);
  }

  const safeHalfKey = Math.min(keyWidth / 2, boreR * 0.96);
  const sideY = Math.sqrt(Math.max(0, boreR * boreR - safeHalfKey * safeHalfKey));
  const topY = boreR + keyDepth;
  const thetaRight = Math.atan2(sideY, safeHalfKey);
  const thetaLeft = Math.atan2(sideY, -safeHalfKey);
  const rightArcSegments = Math.max(6, Math.floor(sides * 0.12));
  const bottomArcSegments = Math.max(24, sides - rightArcSegments - 3);
  const path = [];

  for (let i = 0; i <= rightArcSegments; i += 1) {
    const theta = (thetaRight * i) / rightArcSegments;
    path.push(pointFromAngle(boreR, theta));
  }

  path.push([safeHalfKey, topY]);
  path.push([-safeHalfKey, topY]);
  path.push([-safeHalfKey, sideY]);

  for (let i = 1; i < bottomArcSegments; i += 1) {
    const theta = thetaLeft + ((Math.PI * 2 - thetaLeft) * i) / bottomArcSegments;
    path.push(pointFromAngle(boreR, theta));
  }

  return path;
}

function buildOpenShaftSpacerPath(outerR, boreR, slotWidth, sides) {
  const safeHalfSlot = Math.min(slotWidth / 2, boreR * 0.96, outerR * 0.96);
  const innerY = Math.sqrt(Math.max(0, boreR * boreR - safeHalfSlot * safeHalfSlot));
  const outerY = Math.sqrt(Math.max(0, outerR * outerR - safeHalfSlot * safeHalfSlot));
  const outerRight = Math.atan2(outerY, safeHalfSlot);
  const outerLeft = Math.atan2(outerY, -safeHalfSlot);
  const innerLeft = Math.atan2(innerY, -safeHalfSlot);
  const innerRight = Math.atan2(innerY, safeHalfSlot);
  const outerSegments = Math.max(36, Math.floor(sides * 0.72));
  const innerSegments = Math.max(28, Math.floor(sides * 0.62));
  const path = [];

  for (let i = 0; i <= outerSegments; i += 1) {
    const t = i / outerSegments;
    const theta = outerRight - (Math.PI * 2 - (outerLeft - outerRight)) * t;
    path.push(pointFromAngle(outerR, theta));
  }

  path.push([-safeHalfSlot, innerY]);

  for (let i = 1; i <= innerSegments; i += 1) {
    const t = i / innerSegments;
    const theta = innerLeft + (Math.PI * 2 - (innerLeft - innerRight)) * t;
    path.push(pointFromAngle(boreR, theta));
  }

  return ensureCounterClockwise(path);
}

function ensureCounterClockwise(path) {
  return polygonArea(path) >= 0 ? path : [...path].reverse();
}

function polygonArea(path) {
  let area = 0;
  for (let i = 0; i < path.length; i += 1) {
    const next = (i + 1) % path.length;
    area += path[i][0] * path[next][1] - path[next][0] * path[i][1];
  }
  return area / 2;
}

function addExtrudedPolygon(mesh, path, z0, z1) {
  const ccwPath = ensureCounterClockwise(path);
  for (let i = 0; i < ccwPath.length; i += 1) {
    const next = (i + 1) % ccwPath.length;
    const p0 = pointWithZ(ccwPath[i], z0);
    const p1 = pointWithZ(ccwPath[next], z0);
    const p2 = pointWithZ(ccwPath[next], z1);
    const p3 = pointWithZ(ccwPath[i], z1);
    mesh.addQuad(p0, p1, p2, p3);
  }

  triangulatePolygon(ccwPath).forEach((triangle) => {
    const a = pointWithZ(ccwPath[triangle[0]], z1);
    const b = pointWithZ(ccwPath[triangle[1]], z1);
    const c = pointWithZ(ccwPath[triangle[2]], z1);
    mesh.addTriangle(a, b, c);
    mesh.addTriangle(pointWithZ(ccwPath[triangle[2]], z0), pointWithZ(ccwPath[triangle[1]], z0), pointWithZ(ccwPath[triangle[0]], z0));
  });
}

function triangulatePolygon(path) {
  const vertices = path.map((_, index) => index);
  const triangles = [];
  let guard = 0;

  while (vertices.length > 3 && guard < path.length * path.length) {
    let clipped = false;
    for (let i = 0; i < vertices.length; i += 1) {
      const prev = vertices[(i - 1 + vertices.length) % vertices.length];
      const current = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      if (!isEar(path, prev, current, next, vertices)) continue;

      triangles.push([prev, current, next]);
      vertices.splice(i, 1);
      clipped = true;
      break;
    }

    if (!clipped) break;
    guard += 1;
  }

  if (vertices.length === 3) {
    triangles.push([vertices[0], vertices[1], vertices[2]]);
  }

  return triangles;
}

function isEar(path, prev, current, next, vertices) {
  const a = path[prev];
  const b = path[current];
  const c = path[next];
  if (cross2d(a, b, c) <= 0.0000001) return false;

  return !vertices.some((index) => {
    if (index === prev || index === current || index === next) return false;
    return pointInTriangle(path[index], a, b, c);
  });
}

function cross2d(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function pointInTriangle(point, a, b, c) {
  const area = Math.abs(cross2d(a, b, c));
  const area1 = Math.abs(cross2d(point, a, b));
  const area2 = Math.abs(cross2d(point, b, c));
  const area3 = Math.abs(cross2d(point, c, a));
  return Math.abs(area - (area1 + area2 + area3)) < 0.000001;
}

function buildCirclePath(radius, sides) {
  const path = [];
  for (let i = 0; i < sides; i += 1) {
    path.push(pointFromAngle(radius, (i / sides) * Math.PI * 2));
  }
  return path;
}

function addKeyedPathSide(mesh, path, z0, z1) {
  for (let i = 0; i < path.length; i += 1) {
    const next = (i + 1) % path.length;
    mesh.addQuad(
      pointWithZ(path[i], z0),
      pointWithZ(path[i], z1),
      pointWithZ(path[next], z1),
      pointWithZ(path[next], z0)
    );
  }
}

function addKeyedPathSideWithRadialCut(mesh, path, z0, z1, cut) {
  if (!cut) {
    addKeyedPathSide(mesh, path, z0, z1);
    return;
  }

  const zSegments = 36;
  for (let j = 0; j < zSegments; j += 1) {
    const za = z0 + ((z1 - z0) * j) / zSegments;
    const zb = z0 + ((z1 - z0) * (j + 1)) / zSegments;
    const zMid = (za + zb) / 2;

    for (let i = 0; i < path.length; i += 1) {
      const next = (i + 1) % path.length;
      const p0 = path[i];
      const p1 = path[next];
      const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      if (axisCutContainsPoint([mid[0], mid[1], zMid], cut)) continue;

      mesh.addQuad(
        pointWithZ(p0, za),
        pointWithZ(p0, zb),
        pointWithZ(p1, zb),
        pointWithZ(p1, za)
      );
    }
  }
}

function pointFromAngle(radius, theta) {
  return [Math.cos(theta) * radius, Math.sin(theta) * radius];
}

function pointWithZ(point, z) {
  return [point[0], point[1], z];
}

function pointAngle(point) {
  const angle = Math.atan2(point[1], point[0]);
  return angle < 0 ? angle + Math.PI * 2 : angle;
}

function addKeyedHoleFillet(mesh, boreR, keyWidth, keyDepth, z, edgeRadius, sides, position) {
  const segments = 5;

  for (let q = 0; q < segments; q += 1) {
    const a0 = (q / segments) * Math.PI * 0.5;
    const a1 = ((q + 1) / segments) * Math.PI * 0.5;

    const ring0 = keyedFilletRing(boreR, keyWidth, keyDepth, z, edgeRadius, a0, position);
    const ring1 = keyedFilletRing(boreR, keyWidth, keyDepth, z, edgeRadius, a1, position);

    const path0 = buildKeyedHolePath(ring0.boreR, keyWidth, ring0.keyDepth, sides);
    const path1 = buildKeyedHolePath(ring1.boreR, keyWidth, ring1.keyDepth, sides);

    for (let i = 0; i < path0.length; i += 1) {
      const next = (i + 1) % path0.length;
      mesh.addQuad(
        pointWithZ(path0[i], ring0.z),
        pointWithZ(path1[i], ring1.z),
        pointWithZ(path1[next], ring1.z),
        pointWithZ(path0[next], ring0.z)
      );
    }
  }
}

function keyedFilletRing(boreR, keyWidth, keyDepth, z, edgeRadius, angle, position) {
  if (position === "lower") {
    return {
      boreR: boreR + edgeRadius - edgeRadius * Math.sin(angle),
      keyDepth,
      z: z + edgeRadius - edgeRadius * Math.cos(angle),
    };
  }

  return {
    boreR: boreR + edgeRadius - edgeRadius * Math.cos(angle),
    keyDepth,
    z: z - edgeRadius + edgeRadius * Math.sin(angle),
  };
}


function addSetScrewFeature(mesh, params, hubR, boreR) {
  const spec = getSetScrewSpec(params);
  const hubZOffset = computeHubZOffset(params);
  const basis = setScrewAxisBasis(
    (params.setScrewAngle * Math.PI) / 180,
    (params.setScrewIntersectAngle * Math.PI) / 180,
    boreR,
    hubZOffset + params.setScrewBossOffset
  );
  const bossRadius = computeSetScrewBossRadius(spec, params);
  const hubSurfaceDist = axisDistanceForRadius(basis, hubR);
  const bossEnd = axisDistanceForRadialBossHeight(basis, hubR, bossRadius, params.setScrewBossHeight);
  const bossAxisExtension = Math.max(0.001, bossEnd - hubSurfaceDist);
  const rootTargetR = Math.min(
    hubR - params.hubThickness * 0.08,
    boreR + Math.max(params.hubThickness * 0.24, bossRadius * 0.72)
  );
  const innerRootDist = axisDistanceForRadius(basis, rootTargetR);
  const rootOverlap = Math.max(params.hubThickness * 1.15, bossRadius * 2.45, bossAxisExtension * 1.25);
  const bossClearDist = axisDistanceForSectionOutsideRadius(basis, boreR + 0.0005, bossRadius);
  const bossStart = Math.min(
    hubSurfaceDist - 0.001,
    Math.max(bossClearDist, Math.min(innerRootDist, hubSurfaceDist - rootOverlap))
  );
  const threadStart = axisDistanceForSectionOutsideRadius(basis, boreR + 0.0005, spec.major / 2);
  const threadEnd = bossEnd;
  const sideSegments = 34;
  const saddleDist = Math.min(
    bossEnd - 0.001,
    hubSurfaceDist + Math.max(bossAxisExtension * 0.35, bossRadius * 0.14)
  );

  addAxisCylinderSide(mesh, basis, bossStart, bossEnd, bossRadius, sideSegments, false);
  addSetScrewBossSaddle(mesh, basis, hubR, bossRadius, saddleDist, sideSegments);
  addThreadedAxisAnnularCap(mesh, basis, bossStart, bossRadius, spec, sideSegments, -1, threadEnd);
  addThreadedAxisAnnularCap(mesh, basis, bossEnd, bossRadius, spec, sideSegments, 1, threadEnd);
  addThreadedRadialHole(mesh, basis, threadStart, threadEnd, spec, sideSegments);
}

function addThreadedAxisAnnularCap(mesh, basis, dist, outerR, spec, sides, normalSign, threadAnchorDist) {
  const majorR = spec.major / 2;
  const minorR = spec.minor / 2;

  for (let i = 0; i < sides; i += 1) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const innerR0 = threadRadiusAt(dist, threadAnchorDist, a0, spec.pitch, majorR, minorR);
    const innerR1 = threadRadiusAt(dist, threadAnchorDist, a1, spec.pitch, majorR, minorR);
    const inner0 = axisPoint(basis, dist, Math.cos(a0) * innerR0, Math.sin(a0) * innerR0);
    const inner1 = axisPoint(basis, dist, Math.cos(a1) * innerR1, Math.sin(a1) * innerR1);
    const outer0 = axisPoint(basis, dist, Math.cos(a0) * outerR, Math.sin(a0) * outerR);
    const outer1 = axisPoint(basis, dist, Math.cos(a1) * outerR, Math.sin(a1) * outerR);

    if (normalSign > 0) {
      mesh.addQuad(inner0, inner1, outer1, outer0);
    } else {
      mesh.addQuad(inner0, outer0, outer1, inner1);
    }
  }
}

function addSetScrewBossSaddle(mesh, basis, hubR, bossRadius, dist, sides) {
  const ring = [];
  const feet = [];

  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    const point = axisPoint(basis, dist, Math.cos(a) * bossRadius, Math.sin(a) * bossRadius);
    const pointR = Math.hypot(point[0], point[1]) || 1;
    ring.push(point);
    feet.push([(point[0] / pointR) * hubR, (point[1] / pointR) * hubR, point[2]]);
  }

  for (let i = 0; i < sides; i += 1) {
    const next = (i + 1) % sides;
    const pointR0 = Math.hypot(ring[i][0], ring[i][1]);
    const pointR1 = Math.hypot(ring[next][0], ring[next][1]);
    if (pointR0 <= hubR + 0.0001 && pointR1 <= hubR + 0.0001) continue;
    mesh.addQuad(feet[i], ring[i], ring[next], feet[next]);
  }
}

function setScrewAxisBasis(positionAngle, intersectAngle, boreR, offsetZ) {
  const radial = [Math.cos(positionAngle), Math.sin(positionAngle), 0];
  const tangent = [-Math.sin(positionAngle), Math.cos(positionAngle), 0];
  const u = [
    radial[0] * Math.cos(intersectAngle),
    radial[1] * Math.cos(intersectAngle),
    Math.sin(intersectAngle),
  ];
  const uLength = Math.hypot(u[0], u[1], u[2]) || 1;
  u[0] /= uLength;
  u[1] /= uLength;
  u[2] /= uLength;
  const w = cross(u, tangent);
  const wLength = Math.hypot(w[0], w[1], w[2]) || 1;

  return {
    origin: [radial[0] * boreR, radial[1] * boreR, offsetZ],
    u,
    v: tangent,
    w: [w[0] / wLength, w[1] / wLength, w[2] / wLength],
  };
}

function axisPoint(basis, dist, crossA, crossB) {
  return [
    basis.origin[0] + basis.u[0] * dist + basis.v[0] * crossA + basis.w[0] * crossB,
    basis.origin[1] + basis.u[1] * dist + basis.v[1] * crossA + basis.w[1] * crossB,
    basis.origin[2] + basis.u[2] * dist + basis.v[2] * crossA + basis.w[2] * crossB,
  ];
}

function axisDistanceForRadius(basis, radius) {
  const ox = basis.origin[0];
  const oy = basis.origin[1];
  const ux = basis.u[0];
  const uy = basis.u[1];
  const a = ux * ux + uy * uy;
  const b = 2 * (ox * ux + oy * uy);
  const c = ox * ox + oy * oy - radius * radius;
  const discriminant = b * b - 4 * c;
  if (discriminant < 0 || a < 0.000001) return 0;

  const root = Math.sqrt(discriminant);
  return Math.max(0, (-b + root) / (2 * a), (-b - root) / (2 * a));
}

function addAxisCylinderSide(mesh, basis, startDist, endDist, radius, sides, inward = false) {
  for (let i = 0; i < sides; i += 1) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const p00 = axisPoint(basis, startDist, Math.cos(a0) * radius, Math.sin(a0) * radius);
    const p10 = axisPoint(basis, startDist, Math.cos(a1) * radius, Math.sin(a1) * radius);
    const p11 = axisPoint(basis, endDist, Math.cos(a1) * radius, Math.sin(a1) * radius);
    const p01 = axisPoint(basis, endDist, Math.cos(a0) * radius, Math.sin(a0) * radius);

    if (inward) {
      mesh.addQuad(p00, p01, p11, p10);
    } else {
      mesh.addQuad(p00, p10, p11, p01);
    }
  }
}

function addAxisAnnularCap(mesh, basis, dist, innerR, outerR, sides, normalSign) {
  for (let i = 0; i < sides; i += 1) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const inner0 = axisPoint(basis, dist, Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    const inner1 = axisPoint(basis, dist, Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    const outer0 = axisPoint(basis, dist, Math.cos(a0) * outerR, Math.sin(a0) * outerR);
    const outer1 = axisPoint(basis, dist, Math.cos(a1) * outerR, Math.sin(a1) * outerR);

    if (normalSign > 0) {
      mesh.addQuad(inner0, inner1, outer1, outer0);
    } else {
      mesh.addQuad(inner0, outer0, outer1, inner1);
    }
  }
}

function addThreadedRadialHole(mesh, basis, startDist, endDist, spec, sides) {
  const length = Math.max(spec.pitch, endDist - startDist);
  const axialSegments = Math.max(32, Math.ceil((length / spec.pitch) * 14));
  const majorR = spec.major / 2;
  const minorR = spec.minor / 2;

  for (let j = 0; j < axialSegments; j += 1) {
    const t0 = j / axialSegments;
    const t1 = (j + 1) / axialSegments;
    const d0 = endDist - length * t0;
    const d1 = endDist - length * t1;

    for (let i = 0; i < sides; i += 1) {
      const a0 = (i / sides) * Math.PI * 2;
      const a1 = ((i + 1) / sides) * Math.PI * 2;
      const r00 = threadRadiusAt(d0, endDist, a0, spec.pitch, majorR, minorR);
      const r10 = threadRadiusAt(d0, endDist, a1, spec.pitch, majorR, minorR);
      const r11 = threadRadiusAt(d1, endDist, a1, spec.pitch, majorR, minorR);
      const r01 = threadRadiusAt(d1, endDist, a0, spec.pitch, majorR, minorR);

      mesh.addQuad(
        axisPoint(basis, d0, Math.cos(a0) * r00, Math.sin(a0) * r00),
        axisPoint(basis, d1, Math.cos(a0) * r01, Math.sin(a0) * r01),
        axisPoint(basis, d1, Math.cos(a1) * r11, Math.sin(a1) * r11),
        axisPoint(basis, d0, Math.cos(a1) * r10, Math.sin(a1) * r10)
      );
    }
  }
}

function threadRadiusAt(dist, threadStart, angle, pitch, majorR, minorR) {
  const phase = ((threadStart - dist) / pitch + angle / (Math.PI * 2)) % 1;
  const wrapped = phase < 0 ? phase + 1 : phase;
  const triangular = 1 - Math.abs(wrapped * 2 - 1);
  return minorR + (majorR - minorR) * triangular;
}


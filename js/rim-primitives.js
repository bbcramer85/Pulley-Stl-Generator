function addRim(mesh, profile, innerR, sides, radius) {
  const first = profile[0];
  const last = profile[profile.length - 1];
  const width = last.z - first.z;
  const capOuterR = Math.min(first.r, last.r);
  const edgeRadius = clamp(radius, 0, Math.max(0, Math.min(innerR * 0.45, (capOuterR - innerR) * 0.45, width * 0.45)));

  for (let j = 0; j < profile.length - 1; j += 1) {
    const a = profile[j];
    const b = profile[j + 1];

    for (let i = 0; i < sides; i += 1) {
      const t0 = (i / sides) * Math.PI * 2;
      const t1 = ((i + 1) / sides) * Math.PI * 2;
      mesh.addQuad(
        polarPoint(a.r, t0, a.z),
        polarPoint(a.r, t1, a.z),
        polarPoint(b.r, t1, b.z),
        polarPoint(b.r, t0, b.z)
      );
    }
  }

  if (edgeRadius <= 0.000001) {
    addCylinderSide(mesh, innerR, first.z, last.z, sides, true);
    addAnnularCap(mesh, innerR, first.r, first.z, sides, -1);
    addAnnularCap(mesh, innerR, last.r, last.z, sides, 1);
    return;
  }

  addCylinderSide(mesh, innerR, first.z + edgeRadius, last.z - edgeRadius, sides, true);
  addAnnularCap(mesh, innerR + edgeRadius, first.r, first.z, sides, -1);
  addAnnularCap(mesh, innerR + edgeRadius, last.r, last.z, sides, 1);

  addRevolvedSurface(
    mesh,
    quarterProfile(innerR, first.z, edgeRadius, "innerLowerRoundover"),
    sides,
    true
  );
  addRevolvedSurface(
    mesh,
    quarterProfile(innerR, last.z, edgeRadius, "innerUpperRoundover"),
    sides,
    true
  );
}

function addCylinderSide(mesh, radius, z0, z1, sides, inward = false) {
  for (let i = 0; i < sides; i += 1) {
    const t0 = (i / sides) * Math.PI * 2;
    const t1 = ((i + 1) / sides) * Math.PI * 2;
    const p00 = polarPoint(radius, t0, z0);
    const p10 = polarPoint(radius, t1, z0);
    const p11 = polarPoint(radius, t1, z1);
    const p01 = polarPoint(radius, t0, z1);

    if (inward) {
      mesh.addQuad(p00, p01, p11, p10);
    } else {
      mesh.addQuad(p00, p10, p11, p01);
    }
  }
}

function addCylinderSideWithRadialCut(mesh, radius, z0, z1, sides, inward, cut) {
  if (!cut) {
    addCylinderSide(mesh, radius, z0, z1, sides, inward);
    return;
  }

  const zSegments = 36;
  for (let j = 0; j < zSegments; j += 1) {
    const za = z0 + ((z1 - z0) * j) / zSegments;
    const zb = z0 + ((z1 - z0) * (j + 1)) / zSegments;
    const zMid = (za + zb) / 2;

    for (let i = 0; i < sides; i += 1) {
      const t0 = (i / sides) * Math.PI * 2;
      const t1 = ((i + 1) / sides) * Math.PI * 2;
      const tMid = normalizeAngle((t0 + t1) / 2);
      if (axisCutContainsPoint(polarPoint(radius, tMid, zMid), cut)) continue;

      const p00 = polarPoint(radius, t0, za);
      const p10 = polarPoint(radius, t1, za);
      const p11 = polarPoint(radius, t1, zb);
      const p01 = polarPoint(radius, t0, zb);

      if (inward) {
        mesh.addQuad(p00, p01, p11, p10);
      } else {
        mesh.addQuad(p00, p10, p11, p01);
      }
    }
  }
}

function addCylinderSideWithAnglesAndRadialCut(mesh, radius, z0, z1, angles, inward, cut) {
  if (!cut) {
    addCylinderSideWithAngles(mesh, radius, z0, z1, angles, inward);
    return;
  }

  const zSegments = 36;
  for (let j = 0; j < zSegments; j += 1) {
    const za = z0 + ((z1 - z0) * j) / zSegments;
    const zb = z0 + ((z1 - z0) * (j + 1)) / zSegments;
    const zMid = (za + zb) / 2;

    for (let i = 0; i < angles.length; i += 1) {
      const next = (i + 1) % angles.length;
      const t0 = angles[i];
      const t1 = angles[next];
      const tMid = midpointAngle(t0, t1);
      if (axisCutContainsPoint(polarPoint(radius, tMid, zMid), cut)) continue;

      const p00 = polarPoint(radius, t0, za);
      const p10 = polarPoint(radius, t1, za);
      const p11 = polarPoint(radius, t1, zb);
      const p01 = polarPoint(radius, t0, zb);

      if (inward) {
        mesh.addQuad(p00, p01, p11, p10);
      } else {
        mesh.addQuad(p00, p10, p11, p01);
      }
    }
  }
}

function addCylinderSideWithAngles(mesh, radius, z0, z1, angles, inward = false) {
  for (let i = 0; i < angles.length; i += 1) {
    const next = (i + 1) % angles.length;
    const t0 = angles[i];
    const t1 = angles[next];
    const p00 = polarPoint(radius, t0, z0);
    const p10 = polarPoint(radius, t1, z0);
    const p11 = polarPoint(radius, t1, z1);
    const p01 = polarPoint(radius, t0, z1);

    if (inward) {
      mesh.addQuad(p00, p01, p11, p10);
    } else {
      mesh.addQuad(p00, p10, p11, p01);
    }
  }
}

function normalizeAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function angleDelta(a, b) {
  let delta = normalizeAngle(a) - normalizeAngle(b);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function midpointAngle(a, b) {
  const delta = angleDelta(b, a);
  return normalizeAngle(a + delta / 2);
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function distancePointToAxis(point, basis) {
  const projected = axisProjection(point, basis);
  const closest = [
    basis.origin[0] + basis.u[0] * projected,
    basis.origin[1] + basis.u[1] * projected,
    basis.origin[2] + basis.u[2] * projected,
  ];
  return Math.hypot(point[0] - closest[0], point[1] - closest[1], point[2] - closest[2]);
}

function axisProjection(point, basis) {
  return dot(vecSub(point, basis.origin), basis.u);
}

function axisCutContainsPoint(point, cut, padding = 0) {
  if (!cut) return false;
  const projected = axisProjection(point, cut);
  const startDist = cut.startDist ?? -Infinity;
  const endDist = cut.endDist ?? Infinity;
  if (projected < startDist || projected > endDist) return false;
  return distancePointToAxis(point, cut) < cut.radius + padding;
}

function faceHitsAxisCut(points, cut) {
  if (!cut) return false;
  const center = points
    .reduce(
      (total, point) => [total[0] + point[0], total[1] + point[1], total[2] + point[2]],
      [0, 0, 0]
    )
    .map((value) => value / points.length);
  if (axisCutContainsPoint(center, cut)) return true;

  return points.some((point, index) => {
    if (axisCutContainsPoint(point, cut)) return true;
    const next = points[(index + 1) % points.length];
    return axisCutContainsPoint(
      [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2, (point[2] + next[2]) / 2],
      cut
    );
  });
}

function addRevolvedSurface(mesh, profile, sides, inward = false) {
  for (let j = 0; j < profile.length - 1; j += 1) {
    const a = profile[j];
    const b = profile[j + 1];

    for (let i = 0; i < sides; i += 1) {
      const t0 = (i / sides) * Math.PI * 2;
      const t1 = ((i + 1) / sides) * Math.PI * 2;
      const p00 = polarPoint(a.r, t0, a.z);
      const p10 = polarPoint(a.r, t1, a.z);
      const p11 = polarPoint(b.r, t1, b.z);
      const p01 = polarPoint(b.r, t0, b.z);

      if (inward) {
        mesh.addQuad(p00, p01, p11, p10);
      } else {
        mesh.addQuad(p00, p10, p11, p01);
      }
    }
  }
}

function addRevolvedSurfaceWithAngles(mesh, profile, angles, inward = false) {
  for (let j = 0; j < profile.length - 1; j += 1) {
    const a = profile[j];
    const b = profile[j + 1];

    for (let i = 0; i < angles.length; i += 1) {
      const next = (i + 1) % angles.length;
      const t0 = angles[i];
      const t1 = angles[next];
      const p00 = polarPoint(a.r, t0, a.z);
      const p10 = polarPoint(a.r, t1, a.z);
      const p11 = polarPoint(b.r, t1, b.z);
      const p01 = polarPoint(b.r, t0, b.z);

      if (inward) {
        mesh.addQuad(p00, p01, p11, p10);
      } else {
        mesh.addQuad(p00, p10, p11, p01);
      }
    }
  }
}

function quarterProfile(radius, z, edgeRadius, type) {
  const segments = 5;
  const points = [];

  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 0.5;
    if (type === "innerLower") {
      points.push({ r: radius + edgeRadius * Math.cos(a), z: z + edgeRadius * Math.sin(a) });
    } else if (type === "innerUpper") {
      points.push({ r: radius + edgeRadius * Math.sin(a), z: z - edgeRadius * Math.cos(a) });
    } else if (type === "innerLowerRoundover") {
      points.push({ r: radius + edgeRadius - edgeRadius * Math.sin(a), z: z + edgeRadius - edgeRadius * Math.cos(a) });
    } else if (type === "innerUpperRoundover") {
      points.push({ r: radius + edgeRadius - edgeRadius * Math.cos(a), z: z - edgeRadius + edgeRadius * Math.sin(a) });
    } else if (type === "innerLowerOpposite") {
      points.push({ r: radius - edgeRadius + edgeRadius * Math.sin(a), z: z + edgeRadius - edgeRadius * Math.cos(a) });
    } else if (type === "innerUpperOpposite") {
      points.push({ r: radius - edgeRadius + edgeRadius * Math.cos(a), z: z - edgeRadius + edgeRadius * Math.sin(a) });
    } else if (type === "outerLower") {
      points.push({ r: radius - edgeRadius + edgeRadius * Math.sin(a), z: z + edgeRadius - edgeRadius * Math.cos(a) });
    } else if (type === "outerUpper") {
      points.push({ r: radius - edgeRadius + edgeRadius * Math.cos(a), z: z - edgeRadius + edgeRadius * Math.sin(a) });
    }
  }

  return points;
}

function addAnnularCap(mesh, innerR, outerR, z, sides, normalSign) {
  for (let i = 0; i < sides; i += 1) {
    const t0 = (i / sides) * Math.PI * 2;
    const t1 = ((i + 1) / sides) * Math.PI * 2;
    const inner0 = polarPoint(innerR, t0, z);
    const inner1 = polarPoint(innerR, t1, z);
    const outer0 = polarPoint(outerR, t0, z);
    const outer1 = polarPoint(outerR, t1, z);

    if (normalSign > 0) {
      mesh.addQuad(inner0, outer0, outer1, inner1);
    } else {
      mesh.addQuad(inner0, inner1, outer1, outer0);
    }
  }
}

function addAnnularCylinder(mesh, innerR, outerR, width, sides, radius = 0) {
  const z0 = -width / 2;
  const z1 = width / 2;
  const edgeRadius = clamp(radius, 0, Math.max(0, Math.min((outerR - innerR) * 0.35, width * 0.35)));

  if (edgeRadius <= 0.000001) {
    addCylinderSide(mesh, outerR, z0, z1, sides, false);
    addCylinderSide(mesh, innerR, z0, z1, sides, true);
    addAnnularCap(mesh, innerR, outerR, z0, sides, -1);
    addAnnularCap(mesh, innerR, outerR, z1, sides, 1);
    return;
  }

  addCylinderSide(mesh, outerR, z0 + edgeRadius, z1 - edgeRadius, sides, false);
  addCylinderSide(mesh, innerR, z0 + edgeRadius, z1 - edgeRadius, sides, true);
  addAnnularCap(mesh, innerR + edgeRadius, outerR - edgeRadius, z0, sides, -1);
  addAnnularCap(mesh, innerR + edgeRadius, outerR - edgeRadius, z1, sides, 1);
  addRevolvedSurface(mesh, quarterProfile(outerR, z0, edgeRadius, "outerLower"), sides, false);
  addRevolvedSurface(mesh, quarterProfile(outerR, z1, edgeRadius, "outerUpper"), sides, false);
  addRevolvedSurface(mesh, quarterProfile(innerR, z0, edgeRadius, "innerLower"), sides, true);
  addRevolvedSurface(mesh, quarterProfile(innerR, z1, edgeRadius, "innerUpper"), sides, true);
}


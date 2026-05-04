class MeshBuilder {
  constructor() {
    this.triangles = [];
  }

  addTriangle(a, b, c) {
    if (!isFinitePoint(a) || !isFinitePoint(b) || !isFinitePoint(c)) return;
    const normal = triangleNormal(a, b, c);
    if (!Number.isFinite(normal.length) || normal.length < 0.000001) return;
    this.triangles.push({ a, b, c, normal: normal.unit });
  }

  addQuad(a, b, c, d) {
    this.addTriangle(a, b, c);
    this.addTriangle(a, c, d);
  }
}

function isFinitePoint(point) {
  return Array.isArray(point) && point.length >= 3 && point.every(Number.isFinite);
}

function closeBoundaryLoops(mesh, protectedCut = null) {
  const quantize = (point) => point.map((value) => Math.round(value * 100000)).join(",");
  const points = new Map();
  const edges = new Map();
  const addBoundaryEdge = (a, b) => {
    const qa = quantize(a);
    const qb = quantize(b);
    points.set(qa, a);
    points.set(qb, b);
    const key = qa < qb ? `${qa}|${qb}` : `${qb}|${qa}`;
    const edge = edges.get(key) || { count: 0, a: qa, b: qb };
    edge.count += 1;
    edges.set(key, edge);
  };

  mesh.triangles.forEach((tri) => {
    addBoundaryEdge(tri.a, tri.b);
    addBoundaryEdge(tri.b, tri.c);
    addBoundaryEdge(tri.c, tri.a);
  });

  const adjacency = new Map();
  edges.forEach((edge) => {
    if (edge.count !== 1) return;
    if (!adjacency.has(edge.a)) adjacency.set(edge.a, []);
    if (!adjacency.has(edge.b)) adjacency.set(edge.b, []);
    adjacency.get(edge.a).push(edge.b);
    adjacency.get(edge.b).push(edge.a);
  });

  let capCount = 0;
  const protectedLoops = [];
  const used = new Set();
  adjacency.forEach((_, start) => {
    if (used.has(start)) return;

    const loop = orderBoundaryLoop(start, adjacency, used);
    if (loop.length < 3) return;

    const loopPoints = loop.map((key) => points.get(key));
    if (isProtectedSetScrewOpening(loopPoints, protectedCut)) {
      protectedLoops.push(loopPoints);
      return;
    }

    const center = loopPoints.reduce(
      (total, key) => {
        const point = key;
        return [total[0] + point[0], total[1] + point[1], total[2] + point[2]];
      },
      [0, 0, 0]
    ).map((value) => value / loop.length);

    const normal = boundaryLoopNormal(loopPoints);
    const outwardTest = dot(normal, center);

    for (let i = 0; i < loop.length; i += 1) {
      const current = points.get(loop[i]);
      const next = points.get(loop[(i + 1) % loop.length]);
      if (outwardTest >= 0) {
        mesh.addTriangle(center, current, next);
      } else {
        mesh.addTriangle(center, next, current);
      }
      capCount += 1;
    }
  });

  capCount += stitchProtectedSetScrewOpenings(mesh, protectedLoops, protectedCut);

  return capCount;
}

function isProtectedSetScrewOpening(points, cut) {
  if (!cut || !cut.threadMajorRadius || points.length < 12) return false;

  let projectionSum = 0;
  let distanceSum = 0;
  let minProjection = Infinity;
  let maxProjection = -Infinity;

  points.forEach((point) => {
    const projection = axisProjection(point, cut);
    projectionSum += projection;
    distanceSum += distancePointToAxis(point, cut);
    minProjection = Math.min(minProjection, projection);
    maxProjection = Math.max(maxProjection, projection);
  });

  const averageProjection = projectionSum / points.length;
  const averageDistance = distanceSum / points.length;
  const projectionSpan = maxProjection - minProjection;
  const nearThreadWall =
    averageDistance >= cut.threadMinorRadius * 0.82 &&
    averageDistance <= cut.threadMajorRadius * 1.32;
  const nearThreadMouth =
    Math.abs(averageProjection - cut.threadStartDist) <= cut.threadPitch * 1.6 ||
    Math.abs(averageProjection - cut.threadEndDist) <= cut.threadPitch * 1.6;

  return nearThreadWall && nearThreadMouth && projectionSpan <= cut.threadPitch * 3.2;
}

function stitchProtectedSetScrewOpenings(mesh, loops, cut) {
  if (!cut || loops.length < 2) return 0;

  const sortedLoops = loops
    .map((points) => ({
      points: sortLoopAroundAxis(points, cut),
      projection:
        points.reduce((total, point) => total + axisProjection(point, cut), 0) / points.length,
    }))
    .sort((a, b) => a.projection - b.projection);

  const start = sortedLoops[0].points;
  const end = sortedLoops[sortedLoops.length - 1].points;
  const count = Math.min(start.length, end.length);
  if (count < 3) return 0;

  for (let i = 0; i < count; i += 1) {
    const next = (i + 1) % count;
    mesh.addQuad(start[i], end[i], end[next], start[next]);
  }

  return count * 2;
}

function sortLoopAroundAxis(points, basis) {
  return [...points].sort((a, b) => axisCrossSectionAngle(a, basis) - axisCrossSectionAngle(b, basis));
}

function axisCrossSectionAngle(point, basis) {
  const projected = axisProjection(point, basis);
  const closest = [
    basis.origin[0] + basis.u[0] * projected,
    basis.origin[1] + basis.u[1] * projected,
    basis.origin[2] + basis.u[2] * projected,
  ];
  const offset = vecSub(point, closest);
  return Math.atan2(dot(offset, basis.w), dot(offset, basis.v));
}

function orderBoundaryLoop(start, adjacency, used) {
  const loop = [];
  let previous = null;
  let current = start;

  for (let guard = 0; guard < adjacency.size + 4; guard += 1) {
    loop.push(current);
    used.add(current);
    const neighbors = adjacency.get(current) || [];
    const next = neighbors.find((candidate) => candidate !== previous) || neighbors[0];
    if (!next || next === start) break;
    previous = current;
    current = next;
    if (used.has(current)) break;
  }

  return loop;
}

function boundaryLoopNormal(points) {
  const normal = [0, 0, 0];
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    normal[0] += (current[1] - next[1]) * (current[2] + next[2]);
    normal[1] += (current[2] - next[2]) * (current[0] + next[0]);
    normal[2] += (current[0] - next[0]) * (current[1] + next[1]);
  }
  return normal;
}

function vecSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function triangleNormal(a, b, c) {
  const n = cross(vecSub(b, a), vecSub(c, a));
  const length = Math.hypot(n[0], n[1], n[2]);
  return {
    length,
    unit: length > 0 ? [n[0] / length, n[1] / length, n[2] / length] : [0, 0, 1],
  };
}

function polarPoint(radius, theta, z) {
  return [Math.cos(theta) * radius, Math.sin(theta) * radius, z];
}


function addSpokes(mesh, params, hubR, boreR, rimInnerR, width, radius, cut = null) {
  const count = Math.max(1, params.spokeCount);
  const attachment = computeSpokeAttachmentRadii(params, hubR, boreR, rimInnerR);
  const innerR = attachment.innerR;
  const outerR = attachment.outerR;
  const span = Math.max(outerR - innerR, params.diameter * 0.001);
  const midR = (innerR + outerR) / 2;
  const pitchWidth = (Math.PI * 2 * midR) / count;
  const minSpokeWidth = Math.min(span * 0.02, pitchWidth * 0.08);
  const maxSpokeWidth = Math.min(pitchWidth * 0.72, span * 0.62);
  const widths = {
    inner: clamp(params.spokeInnerWidth, minSpokeWidth, maxSpokeWidth),
    middle: clamp(params.spokeWidth, minSpokeWidth, maxSpokeWidth),
    outer: clamp(params.spokeOuterWidth, minSpokeWidth, maxSpokeWidth),
  };
  const curve = params.spokeStyle === "curved" ? (params.curvedAngle * Math.PI) / 180 : 0;
  const samples = params.spokeStyle === "curved" ? computeCurvedSpokeSamples(params, count, innerR, outerR) : 2;
  const edgeRadius = clamp(radius, 0, Math.max(0, Math.min(widths.inner, widths.middle, widths.outer, width) * 0.42));

  for (let i = 0; i < count; i += 1) {
    const baseAngle = (i / count) * Math.PI * 2;
    addSpoke(mesh, baseAngle, curve, innerR, outerR, widths, width, samples, edgeRadius, cut);
  }
}

function computeSpokeAttachmentRadii(params, hubR, boreR, rimInnerR) {
  const baseInnerR = computeSpokeInnerRadius(params, hubR, boreR);
  const baseOuterR = rimInnerR * 1.06;

  if (params.spokeStyle !== "curved") {
    return { innerR: baseInnerR, outerR: baseOuterR };
  }

  const rimWall = Math.max(
    params.rimThickness || 0,
    params.vRimThickness || 0,
    params.gearRimThickness || 0,
    rimInnerR * 0.04
  );
  const boreClearance = Math.min(params.hubThickness * 0.22, params.shaftDiameter * 0.08);
  const innerOverlap = Math.max(
    params.hubThickness * 0.85,
    params.spokeInnerWidth * 0.72,
    params.diameter * 0.012
  );
  const outerOverlap = clamp(
    Math.max(rimWall * 0.7, params.spokeOuterWidth * 0.52, params.diameter * 0.012),
    rimWall * 0.52,
    rimWall * 0.84
  );

  return {
    innerR: Math.max(boreR + boreClearance, Math.min(baseInnerR, hubR - innerOverlap)),
    outerR: Math.max(baseOuterR, rimInnerR + outerOverlap),
  };
}

function computeCurvedSpokeSamples(params, count, innerR, outerR) {
  const curveRadians = Math.abs(params.curvedAngle || 0) * (Math.PI / 180);
  const curveStrength = clamp(curveRadians / (Math.PI / 4), 0.65, 1.55);
  const spanStrength = clamp((outerR - innerR) / Math.max(params.diameter * 0.25, 0.001), 0.75, 1.25);
  const countRelief = clamp(6 / Math.max(1, count), 0.65, 1);
  return Math.round(clamp(48 * curveStrength * spanStrength * countRelief, 30, 64));
}

function addSpoke(mesh, baseAngle, curve, innerR, outerR, spokeWidths, height, samples, radius, cut = null) {
  const centers = [];
  for (let i = 0; i <= samples; i += 1) {
    const s = i / samples;
    const eased = s * s * (3 - 2 * s);
    const r = innerR + (outerR - innerR) * s;
    const theta = baseAngle + curve * eased;
    centers.push([Math.cos(theta) * r, Math.sin(theta) * r]);
  }

  const stations = centers.map((center, i) => {
    const s = i / Math.max(1, centers.length - 1);
    const stationWidth = spokeWidthAt(spokeWidths, s);
    const crossSection = roundedRectangleProfile(stationWidth, height, radius);
    const prev = centers[Math.max(0, i - 1)];
    const next = centers[Math.min(centers.length - 1, i + 1)];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;

    return crossSection.map((point) => [
      center[0] + nx * point.offset,
      center[1] + ny * point.offset,
      point.z,
    ]);
  });
  const sectionPointCount = stations[0].length;

  for (let i = 0; i < stations.length - 1; i += 1) {
    for (let j = 0; j < sectionPointCount; j += 1) {
      const nextJ = (j + 1) % sectionPointCount;
      const quad = [stations[i][j], stations[i + 1][j], stations[i + 1][nextJ], stations[i][nextJ]];
      if (!faceHitsAxisCut(quad, cut)) {
        mesh.addQuad(quad[0], quad[1], quad[2], quad[3]);
      }
    }
  }

  addSpokeEndCap(mesh, centers[0], stations[0], -1, cut);
  addSpokeEndCap(mesh, centers[centers.length - 1], stations[stations.length - 1], 1, cut);
}

function spokeWidthAt(widths, t) {
  if (t <= 0.5) {
    return lerp(widths.inner, widths.middle, t * 2);
  }

  return lerp(widths.middle, widths.outer, (t - 0.5) * 2);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function roundedRectangleProfile(width, depth, radius) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const r = clamp(radius, 0, Math.max(0, Math.min(halfW, halfD) * 0.9));

  if (r <= 0.000001) {
    return [
      { offset: -halfW, z: -halfD },
      { offset: halfW, z: -halfD },
      { offset: halfW, z: halfD },
      { offset: -halfW, z: halfD },
    ];
  }

  const points = [];
  const addArc = (cx, cz, start, end) => {
    const segments = 4;
    for (let i = 0; i <= segments; i += 1) {
      if (points.length > 0 && i === 0) continue;
      const a = start + ((end - start) * i) / segments;
      points.push({ offset: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r });
    }
  };

  points.push({ offset: -halfW + r, z: -halfD });
  points.push({ offset: halfW - r, z: -halfD });
  addArc(halfW - r, -halfD + r, -Math.PI / 2, 0);
  points.push({ offset: halfW, z: halfD - r });
  addArc(halfW - r, halfD - r, 0, Math.PI / 2);
  points.push({ offset: -halfW + r, z: halfD });
  addArc(-halfW + r, halfD - r, Math.PI / 2, Math.PI);
  points.push({ offset: -halfW, z: -halfD + r });
  addArc(-halfW + r, -halfD + r, Math.PI, Math.PI * 1.5);

  return points;
}

function addSpokeEndCap(mesh, center, perimeter, side, cut = null) {
  const capCenter = [center[0], center[1], 0];
  for (let j = 0; j < perimeter.length; j += 1) {
    const nextJ = (j + 1) % perimeter.length;
    const triangle = [capCenter, perimeter[j], perimeter[nextJ]];
    if (faceHitsAxisCut(triangle, cut)) continue;
    if (side < 0) {
      mesh.addTriangle(capCenter, perimeter[j], perimeter[nextJ]);
    } else {
      mesh.addTriangle(capCenter, perimeter[nextJ], perimeter[j]);
    }
  }
}


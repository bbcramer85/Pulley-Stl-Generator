function ignitorGasketMetricRows(d) {
  return [
    ["File", "DXF"],
    ["Opening", d.openingLabel],
    ["OD W", formatDimension(d.outerWidth)],
    ["OD H", formatDimension(d.outerHeight)],
    ["Bolt offset", formatDimension(d.boltOffset)],
    ["Entities", d.entityCount.toLocaleString()],
  ];
}

function validateIgnitorGasket(raw) {
  const warnings = [];
  const p = { ...raw };

  p.ignitorStyle = ignitorStyleOptions[p.ignitorStyle] ? p.ignitorStyle : ignitorGasketDefaults.ignitorStyle;
  p.ignitorCenterCircleDiameter = Math.max(0.001, p.ignitorCenterCircleDiameter);
  p.ignitorCenterSquareWidth = Math.max(0.001, p.ignitorCenterSquareWidth);
  p.ignitorCenterSquareHeight = Math.max(0.001, p.ignitorCenterSquareHeight);
  p.ignitorCenterSquareRadius = Math.max(0, p.ignitorCenterSquareRadius);
  p.ignitorRoundBodyMargin = Math.max(0.001, p.ignitorRoundBodyMargin);
  p.ignitorRoundBoltPadRadius = Math.max(0.001, p.ignitorRoundBoltPadRadius);
  p.ignitorOuterSideMargin = Math.max(0.001, p.ignitorOuterSideMargin);
  p.ignitorOuterTopMargin = Math.max(0.001, p.ignitorOuterTopMargin);
  p.ignitorOuterBottomMargin = Math.max(0.001, p.ignitorOuterBottomMargin);
  p.ignitorOuterCornerRadius = Math.max(0, p.ignitorOuterCornerRadius);
  p.ignitorBoltHoleDiameter = Math.max(0.001, p.ignitorBoltHoleDiameter);
  p.ignitorBoltOffset = Math.max(0, p.ignitorBoltOffset);
  p.ignitorBoltVerticalOffset = Number.isFinite(p.ignitorBoltVerticalOffset) ? p.ignitorBoltVerticalOffset : 0;

  const opening = getIgnitorOpeningExtents(p);
  const outline = getIgnitorOutlineExtents(p, opening);
  const circleOuterR = getIgnitorSquareOuterRadius(p, opening);
  const roundOutline = getIgnitorRoundOutline(p, opening);
  const boltR = p.ignitorBoltHoleDiameter / 2;
  const boltX = opening.halfWidth + p.ignitorBoltOffset;
  const boltY = p.ignitorBoltVerticalOffset;

  if (p.ignitorStyle === "square") {
    const boltCenterDistance = Math.hypot(boltX, boltY);
    const openingCornerDistance = Math.hypot(p.ignitorCenterSquareWidth / 2, p.ignitorCenterSquareHeight / 2);
    if (boltCenterDistance + boltR >= circleOuterR) {
      warnings.push("Bolt holes extend outside the round gasket outside diameter.");
    }
    if (openingCornerDistance >= circleOuterR) {
      warnings.push("Square opening extends outside the round gasket outside diameter.");
    }
  } else {
    if (roundOutline.earR <= boltR) {
      warnings.push("Side margin is too small for the selected bolt hole and offset.");
    }
    if (roundOutline.centerR <= opening.halfTop || roundOutline.centerR <= opening.halfBottom) {
      warnings.push("Top or bottom margin is too small for the round center opening.");
    }
  }

  if (p.ignitorBoltOffset <= boltR) {
    warnings.push("Bolt holes intersect the center opening.");
  }

  return { params: p, warnings };
}

function generateIgnitorGasketDxf(params) {
  const entities = [];
  const cutLayer = "CUT";
  const opening = getIgnitorOpeningExtents(params);
  const outline = getIgnitorOutlineExtents(params, opening);

  if (params.ignitorStyle === "square") {
    entities.push(ignitorCircleEntity(0, 0, getIgnitorSquareOuterRadius(params, opening), cutLayer));
  } else {
    addIgnitorRoundCenterOutline(entities, params, opening, outline, cutLayer);
  }

  if (params.ignitorStyle === "round") {
    entities.push(ignitorCircleEntity(0, 0, params.ignitorCenterCircleDiameter / 2, cutLayer));
  } else {
    const centerRadius = clampIgnitorRadius(
      params.ignitorCenterSquareRadius,
      params.ignitorCenterSquareWidth,
      params.ignitorCenterSquareHeight
    );
    addIgnitorRoundedRectEntities(
      entities,
      -params.ignitorCenterSquareWidth / 2,
      params.ignitorCenterSquareWidth / 2,
      -params.ignitorCenterSquareHeight / 2,
      params.ignitorCenterSquareHeight / 2,
      centerRadius,
      cutLayer
    );
  }

  addIgnitorBoltHoles(entities, params, opening, cutLayer);

  return {
    kind: "dxf",
    entities,
    bounds: ignitorDxfEntityBounds(entities),
    derived: {
      style: ignitorStyleOptions[params.ignitorStyle]?.label || params.ignitorStyle,
      openingLabel:
        params.ignitorStyle === "round"
          ? `Dia ${formatDimension(params.ignitorCenterCircleDiameter)}`
          : `${formatDimension(params.ignitorCenterSquareWidth)} x ${formatDimension(params.ignitorCenterSquareHeight)}`,
      outerWidth: getIgnitorOuterWidth(params, opening, outline),
      outerHeight: getIgnitorOuterHeight(params, opening, outline),
      boltOffset: params.ignitorBoltOffset,
      entityCount: entities.length,
    },
  };
}

function getIgnitorOpeningExtents(params) {
  if (params.ignitorStyle === "round") {
    const radius = params.ignitorCenterCircleDiameter / 2;
    return { halfWidth: radius, halfTop: radius, halfBottom: radius };
  }

  return {
    halfWidth: params.ignitorCenterSquareWidth / 2,
    halfTop: params.ignitorCenterSquareHeight / 2,
    halfBottom: params.ignitorCenterSquareHeight / 2,
  };
}

function getIgnitorOutlineExtents(params, opening) {
  return {
    left: -(opening.halfWidth + params.ignitorOuterSideMargin),
    right: opening.halfWidth + params.ignitorOuterSideMargin,
    bottom: -(opening.halfBottom + params.ignitorOuterBottomMargin),
    top: opening.halfTop + params.ignitorOuterTopMargin,
  };
}

function getIgnitorRoundOutline(params, opening) {
  const boltR = params.ignitorBoltHoleDiameter / 2;
  const centerR = opening.halfTop + params.ignitorRoundBodyMargin;
  const boltX = opening.halfWidth + params.ignitorBoltOffset;
  const boltY = params.ignitorBoltVerticalOffset;
  const earR = Math.max(boltR + 0.001, params.ignitorRoundBoltPadRadius);
  return { centerR, boltX, boltY, earR };
}

function getIgnitorSquareOuterRadius(params, opening) {
  return Math.max(
    opening.halfWidth + params.ignitorOuterSideMargin,
    opening.halfTop + params.ignitorOuterTopMargin,
    opening.halfBottom + params.ignitorOuterBottomMargin
  );
}

function getIgnitorOuterWidth(params, opening, outline) {
  if (params.ignitorStyle === "square") return getIgnitorSquareOuterRadius(params, opening) * 2;
  const round = getIgnitorRoundOutline(params, opening);
  return Math.max(round.centerR, Math.abs(round.boltX) + round.earR) * 2;
}

function getIgnitorOuterHeight(params, opening, outline) {
  if (params.ignitorStyle === "square") return getIgnitorSquareOuterRadius(params, opening) * 2;
  const round = getIgnitorRoundOutline(params, opening);
  return Math.max(round.centerR, Math.abs(round.boltY) + round.earR) * 2;
}

function addIgnitorBoltHoles(entities, params, opening, layer) {
  const radius = params.ignitorBoltHoleDiameter / 2;
  const x = opening.halfWidth + params.ignitorBoltOffset;
  const y = params.ignitorBoltVerticalOffset;
  entities.push(ignitorCircleEntity(-x, y, radius, layer));
  entities.push(ignitorCircleEntity(x, y, radius, layer));
}

function addIgnitorRoundCenterOutline(entities, params, opening, outline, layer) {
  const round = getIgnitorRoundOutline(params, opening);
  const right = getExternalCircleTangents(0, 0, round.centerR, round.boltX, round.boltY, round.earR);
  const left = getExternalCircleTangents(0, 0, round.centerR, -round.boltX, round.boltY, round.earR);

  if (!right || !left) {
    const fallbackRadius = clampIgnitorRadius(
      params.ignitorOuterCornerRadius,
      outline.right - outline.left,
      outline.top - outline.bottom
    );
    addIgnitorRoundedRectEntities(entities, outline.left, outline.right, outline.bottom, outline.top, fallbackRadius, layer);
    return;
  }

  const rightTop = right[0].center.y >= right[1].center.y ? right[0] : right[1];
  const rightBottom = right[0].center.y >= right[1].center.y ? right[1] : right[0];
  const leftTop = left[0].center.y >= left[1].center.y ? left[0] : left[1];
  const leftBottom = left[0].center.y >= left[1].center.y ? left[1] : left[0];

  entities.push(ignitorArcEntity(0, 0, round.centerR, ignitorPointAngle(rightTop.center), ignitorPointAngle(leftTop.center), layer));
  entities.push(ignitorLineEntity(leftTop.center.x, leftTop.center.y, leftTop.ear.x, leftTop.ear.y, layer));
  entities.push(ignitorArcEntity(-round.boltX, round.boltY, round.earR, ignitorPointAngle(leftTop.ear, -round.boltX, round.boltY), ignitorPointAngle(leftBottom.ear, -round.boltX, round.boltY), layer));
  entities.push(ignitorLineEntity(leftBottom.ear.x, leftBottom.ear.y, leftBottom.center.x, leftBottom.center.y, layer));
  entities.push(ignitorArcEntity(0, 0, round.centerR, ignitorPointAngle(leftBottom.center), ignitorPointAngle(rightBottom.center), layer));
  entities.push(ignitorLineEntity(rightBottom.center.x, rightBottom.center.y, rightBottom.ear.x, rightBottom.ear.y, layer));
  entities.push(ignitorArcEntity(round.boltX, round.boltY, round.earR, ignitorPointAngle(rightBottom.ear, round.boltX, round.boltY), ignitorPointAngle(rightTop.ear, round.boltX, round.boltY), layer));
  entities.push(ignitorLineEntity(rightTop.ear.x, rightTop.ear.y, rightTop.center.x, rightTop.center.y, layer));
}

function getExternalCircleTangents(x0, y0, r0, x1, y1, r1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dSq = dx * dx + dy * dy;
  if (dSq <= 0.000001) return null;

  const d = Math.sqrt(dSq);
  const c = (r0 - r1) / d;
  if (Math.abs(c) >= 1) return null;

  const h = Math.sqrt(Math.max(0, 1 - c * c));
  return [-1, 1].map((side) => {
    const nx = (dx * c - side * dy * h) / d;
    const ny = (dy * c + side * dx * h) / d;

    return {
      center: { x: x0 + nx * r0, y: y0 + ny * r0 },
      ear: { x: x1 + nx * r1, y: y1 + ny * r1 },
    };
  });
}

function ignitorPointAngle(point, cx = 0, cy = 0) {
  return (Math.atan2(point.y - cy, point.x - cx) * 180) / Math.PI;
}

function addIgnitorRoundedRectEntities(entities, left, right, bottom, top, radius, layer) {
  const r = clampIgnitorRadius(radius, right - left, top - bottom);

  if (r <= 0.000001) {
    entities.push(ignitorLineEntity(left, bottom, right, bottom, layer));
    entities.push(ignitorLineEntity(right, bottom, right, top, layer));
    entities.push(ignitorLineEntity(right, top, left, top, layer));
    entities.push(ignitorLineEntity(left, top, left, bottom, layer));
    return;
  }

  entities.push(ignitorLineEntity(left + r, bottom, right - r, bottom, layer));
  entities.push(ignitorArcEntity(right - r, bottom + r, r, 270, 360, layer));
  entities.push(ignitorLineEntity(right, bottom + r, right, top - r, layer));
  entities.push(ignitorArcEntity(right - r, top - r, r, 0, 90, layer));
  entities.push(ignitorLineEntity(right - r, top, left + r, top, layer));
  entities.push(ignitorArcEntity(left + r, top - r, r, 90, 180, layer));
  entities.push(ignitorLineEntity(left, top - r, left, bottom + r, layer));
  entities.push(ignitorArcEntity(left + r, bottom + r, r, 180, 270, layer));
}

function clampIgnitorRadius(radius, width, height) {
  return Math.max(0, Math.min(radius, width / 2, height / 2));
}

function ignitorCircleEntity(x, y, radius, layer) {
  return { type: "circle", x, y, radius, layer };
}

function ignitorLineEntity(x1, y1, x2, y2, layer) {
  return { type: "line", x1, y1, x2, y2, layer };
}

function ignitorArcEntity(x, y, radius, startAngle, endAngle, layer) {
  return { type: "arc", x, y, radius, startAngle: normalizeIgnitorDxfAngle(startAngle), endAngle: normalizeIgnitorDxfAngle(endAngle), layer };
}

function normalizeIgnitorDxfAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function ignitorDxfEntityBounds(entities) {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const include = (x, y) => {
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  };

  entities.forEach((entity) => {
    if (entity.type === "circle" || entity.type === "arc") {
      include(entity.x - entity.radius, entity.y - entity.radius);
      include(entity.x + entity.radius, entity.y + entity.radius);
    } else if (entity.type === "line") {
      include(entity.x1, entity.y1);
      include(entity.x2, entity.y2);
    }
  });

  if (!Number.isFinite(bounds.minX)) {
    return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  }

  return bounds;
}

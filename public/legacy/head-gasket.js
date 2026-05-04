function headGasketMetricRows(d) {
  return [
    ["File", "DXF"],
    ["OD", formatDimension(d.outerDiameter)],
    ["Bore", formatDimension(d.boreDiameter)],
    ["Bolt holes", d.deletedBoltCount > 0 ? `${d.boltCount} / ${d.boltPatternCount}` : d.boltCount],
    ["Bolt offset", formatDimension(d.boltCircleOffset)],
    ["Bolt circle", formatDimension(d.boltCircleDiameter)],
    ["Slots", d.deletedSlotCount > 0 ? `${d.slotCount} / ${d.slotPatternCount}` : d.slotCount],
    ["Slot offset", formatDimension(d.slotCircleOffset)],
    ["Entities", d.entityCount.toLocaleString()],
  ];
}

function validateHeadGasket(raw) {
  const warnings = [];
  const p = { ...raw };

  p.gasketOuterDiameter = Math.max(0.001, p.gasketOuterDiameter);
  p.gasketBoreDiameter = Math.max(0.001, p.gasketBoreDiameter);
  p.gasketBoltCount = Math.max(0, Math.round(p.gasketBoltCount));
  p.gasketBoltCircleOffset = Math.max(0, p.gasketBoltCircleOffset);
  p.gasketBoltHoleDiameter = Math.max(0.001, p.gasketBoltHoleDiameter);
  p.gasketBoltStartAngle = Number.isFinite(p.gasketBoltStartAngle) ? p.gasketBoltStartAngle : headGasketDefaults.gasketBoltStartAngle;
  p.gasketSlotCount = Math.max(0, Math.round(p.gasketSlotCount));
  p.gasketSlotCircleOffset = Math.max(0, p.gasketSlotCircleOffset);
  p.gasketSlotLength = Math.max(0.001, p.gasketSlotLength);
  p.gasketSlotWidth = Math.max(0.001, p.gasketSlotWidth);
  p.gasketSlotStartAngle = Number.isFinite(p.gasketSlotStartAngle) ? p.gasketSlotStartAngle : headGasketDefaults.gasketSlotStartAngle;
  p.deletedBoltIndices = normalizeDeletedIndices(p.deletedBoltIndices, p.gasketBoltCount);
  p.deletedSlotIndices = normalizeDeletedIndices(p.deletedSlotIndices, p.gasketSlotCount);

  const outerR = p.gasketOuterDiameter / 2;
  const boreR = p.gasketBoreDiameter / 2;
  const boltCircleR = boreR + p.gasketBoltCircleOffset;
  const boltR = p.gasketBoltHoleDiameter / 2;
  const slotCircleR = boreR + p.gasketSlotCircleOffset;
  const slotR = p.gasketSlotWidth / 2;
  const slotOuterR = slotCircleR + slotR;
  const slotInnerR = slotCircleR - slotR;
  const slotSpan = p.gasketSlotLength / Math.max(slotCircleR, 0.001);

  if (p.gasketBoreDiameter >= p.gasketOuterDiameter) {
    warnings.push("Bore diameter must be smaller than the outer diameter.");
  }

  if (p.gasketBoltCount > 0 && boltCircleR + boltR >= outerR) {
    warnings.push("Bolt holes extend outside the gasket outer diameter.");
  }

  if (p.gasketBoltCount > 0 && boltCircleR - boltR <= boreR) {
    warnings.push("Bolt holes intersect the bore opening.");
  }

  if (p.gasketSlotCount > 0 && slotOuterR >= outerR) {
    warnings.push("Slots extend outside the gasket outer diameter.");
  }

  if (p.gasketSlotCount > 0 && slotInnerR <= boreR) {
    warnings.push("Slots intersect the bore opening.");
  }

  if (p.gasketSlotCount > 0 && slotSpan >= Math.PI * 1.65) {
    warnings.push("Slot arc length is too long for the selected slot circle.");
  }

  return { params: p, warnings };
}

function generateHeadGasketDxf(params) {
  const entities = [];
  const hitTargets = [];
  const cutLayer = "CUT";
  const outerR = params.gasketOuterDiameter / 2;
  const boreR = params.gasketBoreDiameter / 2;

  entities.push(circleEntity(0, 0, outerR, cutLayer));
  entities.push(circleEntity(0, 0, boreR, cutLayer));

  addGasketBoltHoles(entities, hitTargets, params, cutLayer);
  addGasketSlots(entities, hitTargets, params, cutLayer);

  const activeBoltCount = params.gasketBoltCount - params.deletedBoltIndices.length;
  const activeSlotCount = params.gasketSlotCount - params.deletedSlotIndices.length;

  return {
    kind: "dxf",
    entities,
    hitTargets,
    bounds: dxfEntityBounds(entities),
    derived: {
      outerDiameter: params.gasketOuterDiameter,
      boreDiameter: params.gasketBoreDiameter,
      boltCount: activeBoltCount,
      boltPatternCount: params.gasketBoltCount,
      deletedBoltCount: params.deletedBoltIndices.length,
      boltCircleOffset: params.gasketBoltCircleOffset,
      boltCircleDiameter: (boreR + params.gasketBoltCircleOffset) * 2,
      slotCount: activeSlotCount,
      slotPatternCount: params.gasketSlotCount,
      deletedSlotCount: params.deletedSlotIndices.length,
      slotCircleOffset: params.gasketSlotCircleOffset,
      slotCircleDiameter: (boreR + params.gasketSlotCircleOffset) * 2,
      entityCount: entities.length,
    },
  };
}

function addGasketBoltHoles(entities, hitTargets, params, layer) {
  const count = params.gasketBoltCount;
  if (count <= 0) return;

  const boreR = params.gasketBoreDiameter / 2;
  const centerR = boreR + params.gasketBoltCircleOffset;
  const holeR = params.gasketBoltHoleDiameter / 2;
  const spacing = 360 / count;
  const deleted = new Set(params.deletedBoltIndices);
  for (let i = 0; i < count; i += 1) {
    if (deleted.has(i)) continue;
    const theta = ((params.gasketBoltStartAngle + spacing * i) * Math.PI) / 180;
    const x = Math.cos(theta) * centerR;
    const y = Math.sin(theta) * centerR;
    entities.push(circleEntity(x, y, holeR, layer));
    hitTargets.push({ type: "bolt", index: i, x, y, radius: holeR });
  }
}

function addGasketSlots(entities, hitTargets, params, layer) {
  const count = params.gasketSlotCount;
  if (count <= 0) return;

  const spacing = 360 / count;
  const boreR = params.gasketBoreDiameter / 2;
  const centerRadius = boreR + params.gasketSlotCircleOffset;
  const deleted = new Set(params.deletedSlotIndices);
  for (let i = 0; i < count; i += 1) {
    if (deleted.has(i)) continue;
    const theta = ((params.gasketSlotStartAngle + spacing * i) * Math.PI) / 180;
    addCurvedSlotEntities(entities, theta, centerRadius, params.gasketSlotLength, params.gasketSlotWidth, layer);
    hitTargets.push({
      type: "slot",
      index: i,
      centerAngle: theta,
      centerRadius,
      arcLength: params.gasketSlotLength,
      width: params.gasketSlotWidth,
    });
  }
}

function addCurvedSlotEntities(entities, centerAngle, centerRadius, arcLength, width, layer) {
  const capR = width / 2;
  const innerR = centerRadius - capR;
  const outerR = centerRadius + capR;
  if (centerRadius <= capR || arcLength <= 0.000001) {
    entities.push(circleEntity(Math.cos(centerAngle) * centerRadius, Math.sin(centerAngle) * centerRadius, capR, layer));
    return;
  }

  const span = arcLength / centerRadius;
  const start = centerAngle - span / 2;
  const end = centerAngle + span / 2;
  const startDeg = (start * 180) / Math.PI;
  const endDeg = (end * 180) / Math.PI;
  const startCenter = [Math.cos(start) * centerRadius, Math.sin(start) * centerRadius];
  const endCenter = [Math.cos(end) * centerRadius, Math.sin(end) * centerRadius];

  entities.push(arcEntity(0, 0, outerR, startDeg, endDeg, layer));
  entities.push(arcEntity(endCenter[0], endCenter[1], capR, endDeg, endDeg + 180, layer));
  entities.push(arcEntity(0, 0, innerR, startDeg, endDeg, layer));
  entities.push(arcEntity(startCenter[0], startCenter[1], capR, startDeg + 180, startDeg, layer));
}

function circleEntity(x, y, radius, layer) {
  return { type: "circle", x, y, radius, layer };
}

function arcEntity(x, y, radius, startAngle, endAngle, layer) {
  return { type: "arc", x, y, radius, startAngle: normalizeDxfAngle(startAngle), endAngle: normalizeDxfAngle(endAngle), layer };
}

function normalizeDeletedIndices(indices, count) {
  if (!Array.isArray(indices)) return [];
  return [...new Set(indices.map((value) => Math.round(Number(value))).filter((value) => Number.isFinite(value) && value >= 0 && value < count))].sort(
    (a, b) => a - b
  );
}

function normalizeDxfAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function dxfEntityBounds(entities) {
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

function dxfToString(model, name, unit) {
  const unitCode = unit === "in" ? 1 : unit === "mm" ? 4 : 0;
  const lines = [
    "0", "SECTION",
    "2", "HEADER",
    "9", "$ACADVER",
    "1", "AC1009",
    "9", "$INSUNITS",
    "70", String(unitCode),
    "0", "ENDSEC",
    "0", "SECTION",
    "2", "ENTITIES",
  ];

  model.entities.forEach((entity) => {
    if (entity.type === "circle") {
      lines.push("0", "CIRCLE", "8", entity.layer || "CUT", "10", dxfNumber(entity.x), "20", dxfNumber(entity.y), "30", "0", "40", dxfNumber(entity.radius));
    } else if (entity.type === "line") {
      lines.push(
        "0", "LINE", "8", entity.layer || "CUT",
        "10", dxfNumber(entity.x1), "20", dxfNumber(entity.y1), "30", "0",
        "11", dxfNumber(entity.x2), "21", dxfNumber(entity.y2), "31", "0"
      );
    } else if (entity.type === "arc") {
      lines.push(
        "0", "ARC", "8", entity.layer || "CUT",
        "10", dxfNumber(entity.x), "20", dxfNumber(entity.y), "30", "0",
        "40", dxfNumber(entity.radius),
        "50", dxfNumber(entity.startAngle),
        "51", dxfNumber(entity.endAngle)
      );
    }
  });

  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\n");
}

function dxfNumber(value) {
  const text = Number(value).toFixed(6).replace(/\.?0+$/, "");
  return text === "" || text === "-0" ? "0" : text;
}

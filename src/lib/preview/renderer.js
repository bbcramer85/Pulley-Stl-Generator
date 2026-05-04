import { legacy } from "../legacy.js";

let activeDimensionLabelBoxes = [];

export function renderPreview(canvas, mesh, view, context) {
  if (!canvas || !mesh) return;
  if (mesh.kind === "dxf") {
    renderDxfPreview(canvas, mesh, view, context);
    return;
  }
  const ctx = canvas.getContext("2d");
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

export function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width * dpr));
  const height = Math.max(260, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function renderDxfPreview(canvas, mesh, view, context) {
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const { scale, offsetX, offsetY } = getDxfPreviewTransform(canvas, mesh, view);
  const toScreen = (x, y) => [x * scale + offsetX, -y * scale + offsetY];
  drawDxfAxes(ctx, toScreen, scale);

  ctx.lineWidth = Math.max(1.2, window.devicePixelRatio * 1.3);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  mesh.entities.forEach((entity) => {
    ctx.strokeStyle = entity.layer === "CENTER" ? "rgba(183, 121, 31, 0.9)" : "#0c5f58";
    ctx.setLineDash(entity.layer === "CENTER" ? [8, 7] : []);
    ctx.beginPath();
    if (entity.type === "circle") {
      const center = toScreen(entity.x, entity.y);
      ctx.arc(center[0], center[1], entity.radius * scale, 0, Math.PI * 2);
    } else if (entity.type === "line") {
      const a = toScreen(entity.x1, entity.y1);
      const b = toScreen(entity.x2, entity.y2);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    } else if (entity.type === "arc") {
      drawDxfArc(ctx, entity, toScreen);
    }
    ctx.stroke();
  });
  ctx.setLineDash([]);

  activeDimensionLabelBoxes = [];
  if (view.showDxfDimensions) {
    drawDxfDimensions(ctx, canvas, mesh, context, toScreen);
  }
}

export function getDxfPreviewTransform(canvas, mesh, view) {
  const { width, height } = canvas;
  const bounds = mesh.bounds;
  const paddingRatio = mesh.kind === "dxf" ? 0.16 : 0.08;
  const padding = Math.max(0.15, Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * paddingRatio);
  const minX = bounds.minX - padding;
  const maxX = bounds.maxX + padding;
  const minY = bounds.minY - padding;
  const maxY = bounds.maxY + padding;
  const modelW = Math.max(0.001, maxX - minX);
  const modelH = Math.max(0.001, maxY - minY);
  const scale = Math.min((width * 0.82) / modelW, (height * 0.82) / modelH) * view.zoom;
  const offsetX = width / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = height / 2 + ((minY + maxY) / 2) * scale;
  return { scale, offsetX, offsetY };
}

function drawDxfArc(ctx, entity, toScreen) {
  let start = entity.startAngle;
  let end = entity.endAngle;
  if (end <= start) end += 360;
  const segments = Math.max(12, Math.ceil((end - start) / 8));
  for (let i = 0; i <= segments; i += 1) {
    const angle = ((start + ((end - start) * i) / segments) * Math.PI) / 180;
    const point = toScreen(entity.x + Math.cos(angle) * entity.radius, entity.y + Math.sin(angle) * entity.radius);
    if (i === 0) ctx.moveTo(point[0], point[1]);
    else ctx.lineTo(point[0], point[1]);
  }
}

function drawDxfAxes(ctx, toScreen, scale) {
  const axis = Math.max(0.08, 28 / Math.max(scale, 1));
  const origin = toScreen(0, 0);
  const xEnd = toScreen(axis, 0);
  const yEnd = toScreen(0, axis);
  ctx.save();
  ctx.strokeStyle = "rgba(23, 32, 31, 0.28)";
  ctx.lineWidth = Math.max(0.8, window.devicePixelRatio * 0.8);
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(origin[0] - 5, origin[1]);
  ctx.lineTo(xEnd[0], xEnd[1]);
  ctx.moveTo(origin[0], origin[1] + 5);
  ctx.lineTo(yEnd[0], yEnd[1]);
  ctx.stroke();
  ctx.restore();
}

function drawDxfDimensions(ctx, canvas, mesh, context, toScreen) {
  const specs = getDxfDimensionSpecs(mesh, context);
  if (specs.length === 0) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.strokeStyle = "rgba(183, 121, 31, 0.95)";
  ctx.fillStyle = "#7a4b10";
  ctx.lineWidth = Math.max(1, 1.1 * dpr);
  ctx.setLineDash([]);
  ctx.font = `${Math.max(11, 11.5 * dpr)}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  specs.forEach((spec) => {
    if (spec.type === "h") drawHorizontalDimension(ctx, toScreen, spec, dpr);
    else if (spec.type === "v") drawVerticalDimension(ctx, toScreen, spec, dpr);
    else if (spec.type === "radial") drawRadialDimension(ctx, toScreen, spec, dpr);
    else if (spec.type === "line") {
      const a = toScreen(spec.x1, spec.y1);
      const b = toScreen(spec.x2, spec.y2);
      drawDimensionSegment(ctx, canvas, a, b, spec.label, spec.labelDx ?? 0, spec.labelDy ?? 0, dpr);
    } else if (spec.type === "leader") {
      drawDimensionLeader(ctx, canvas, toScreen, spec, dpr);
    }
  });
  ctx.restore();
}

function getDxfDimensionSpecs(mesh, context) {
  if (!mesh || mesh.kind !== "dxf") return [];
  if (context.projectKey === "headGasket") return getHeadGasketDimensionSpecs(mesh, context);
  if (context.projectKey === "ignitorGasket") return getIgnitorGasketDimensionSpecs(mesh, context);
  if (context.projectKey === "dripOilerGasket") return getDripOilerDimensionSpecs(context.params, context.formatDimension);
  return [];
}

function getHeadGasketDimensionSpecs(mesh, context) {
  const d = context.derived;
  const specs = [];
  const outerR = d.outerDiameter / 2;
  const boreR = d.boreDiameter / 2;
  const pad = Math.max(d.outerDiameter * 0.1, 0.18);
  specs.push({ type: "h", x1: -outerR, x2: outerR, yObject: -outerR, yDim: -outerR - pad, label: `OD ${context.formatDimension(d.outerDiameter)}` });
  specs.push({ type: "line", x1: -boreR, y1: 0, x2: boreR, y2: 0, label: `Bore ${context.formatDimension(d.boreDiameter)}`, labelDy: -14 });

  const bolts = mesh.hitTargets?.filter((target) => target.type === "bolt") || [];
  const slots = mesh.hitTargets?.filter((target) => target.type === "slot") || [];
  if (bolts.length > 0) {
    const bolt = bolts.reduce((best, target) => (target.x > best.x ? target : best), bolts[0]);
    const angle = Math.atan2(bolt.y, bolt.x);
    specs.push({ type: "radial", r1: boreR, r2: Math.hypot(bolt.x, bolt.y), angle, label: `Bolt offset ${context.formatDimension(d.boltCircleOffset)}` });
    specs.push({
      type: "leader",
      x1: bolt.x + bolt.radius * 0.7,
      y1: bolt.y + bolt.radius * 0.7,
      x2: bolt.x + bolt.radius + pad * 0.45,
      y2: bolt.y + bolt.radius + pad * 0.25,
      label: `Hole ${context.formatDimension(context.params.gasketBoltHoleDiameter)}`,
    });
  }
  if (slots.length > 0) {
    const slot = slots.reduce((best, target) => {
      const targetY = Math.sin(target.centerAngle) * target.centerRadius;
      const bestY = Math.sin(best.centerAngle) * best.centerRadius;
      return targetY < bestY ? target : best;
    }, slots[0]);
    specs.push({ type: "radial", r1: boreR, r2: slot.centerRadius, angle: slot.centerAngle, label: `Slot offset ${context.formatDimension(d.slotCircleOffset)}`, labelDy: 14 });
    specs.push({
      type: "radial",
      r1: slot.centerRadius - slot.width / 2,
      r2: slot.centerRadius + slot.width / 2,
      angle: slot.centerAngle,
      label: `Slot W ${context.formatDimension(slot.width)}`,
      labelDx: 16,
      labelDy: 10,
    });
    specs.push({
      type: "leader",
      x1: Math.cos(slot.centerAngle) * slot.centerRadius,
      y1: Math.sin(slot.centerAngle) * slot.centerRadius,
      x2: Math.cos(slot.centerAngle) * (slot.centerRadius + slot.width * 1.9),
      y2: Math.sin(slot.centerAngle) * (slot.centerRadius + slot.width * 1.9),
      label: `Slot arc ${context.formatDimension(context.params.gasketSlotLength)}`,
    });
  }
  return specs;
}

function getIgnitorGasketDimensionSpecs(mesh, context) {
  const engine = legacy();
  const specs = [];
  const params = context.params;
  const bounds = mesh.bounds;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const pad = Math.max(Math.max(width, height) * 0.11, 0.12);
  const opening = engine.getIgnitorOpeningExtents(params);
  const boltX = opening.halfWidth + params.ignitorBoltOffset;
  const boltY = params.ignitorBoltVerticalOffset;
  const boltR = params.ignitorBoltHoleDiameter / 2;
  specs.push({ type: "h", x1: bounds.minX, x2: bounds.maxX, yObject: bounds.minY, yDim: bounds.minY - pad, label: `OD W ${context.formatDimension(width)}` });
  specs.push({ type: "v", y1: bounds.minY, y2: bounds.maxY, xObject: bounds.maxX, xDim: bounds.maxX + pad, label: `OD H ${context.formatDimension(height)}` });
  if (params.ignitorStyle === "round") {
    const circleR = params.ignitorCenterCircleDiameter / 2;
    specs.push({ type: "line", x1: -circleR, y1: 0, x2: circleR, y2: 0, label: `Opening ${context.formatDimension(params.ignitorCenterCircleDiameter)}`, labelDy: -13 });
    specs.push({ type: "radial", r1: circleR, r2: circleR + params.ignitorRoundBodyMargin, angle: Math.PI / 2, label: `Body ${context.formatDimension(params.ignitorRoundBodyMargin)}` });
    specs.push({ type: "leader", x1: boltX + boltR * 0.7, y1: boltY + boltR * 0.7, x2: boltX + boltR + pad * 0.45, y2: boltY + boltR + pad * 0.35, label: `Hole ${context.formatDimension(params.ignitorBoltHoleDiameter)}` });
    specs.push({ type: "line", x1: opening.halfWidth, y1: boltY - boltR - pad * 0.2, x2: boltX, y2: boltY - boltR - pad * 0.2, label: `Hole offset ${context.formatDimension(params.ignitorBoltOffset)}`, labelDy: 13 });
    specs.push({ type: "line", x1: boltX, y1: boltY + boltR + pad * 0.2, x2: boltX + params.ignitorRoundBoltPadRadius, y2: boltY + boltR + pad * 0.2, label: `Pad R ${context.formatDimension(params.ignitorRoundBoltPadRadius)}`, labelDy: -12 });
  } else {
    const halfW = params.ignitorCenterSquareWidth / 2;
    const halfH = params.ignitorCenterSquareHeight / 2;
    specs.push({ type: "h", x1: -halfW, x2: halfW, yObject: -halfH, yDim: -halfH - pad * 0.35, label: `Opening W ${context.formatDimension(params.ignitorCenterSquareWidth)}` });
    specs.push({ type: "v", y1: -halfH, y2: halfH, xObject: -halfW, xDim: -halfW - pad * 0.45, label: `Opening H ${context.formatDimension(params.ignitorCenterSquareHeight)}`, labelDx: -24 });
    specs.push({ type: "leader", x1: boltX + boltR * 0.7, y1: boltY + boltR * 0.7, x2: boltX + boltR + pad * 0.45, y2: boltY + boltR + pad * 0.35, label: `Hole ${context.formatDimension(params.ignitorBoltHoleDiameter)}` });
    specs.push({ type: "line", x1: opening.halfWidth, y1: boltY - boltR - pad * 0.2, x2: boltX, y2: boltY - boltR - pad * 0.2, label: `Hole offset ${context.formatDimension(params.ignitorBoltOffset)}`, labelDy: 13 });
  }
  return specs;
}

function getDripOilerDimensionSpecs(params, formatDimension) {
  const outerR = params.dripOilerOuterDiameter / 2;
  const innerR = params.dripOilerInnerDiameter / 2;
  const pad = Math.max(params.dripOilerOuterDiameter * 0.18, 0.14);
  return [
    { type: "h", x1: -outerR, x2: outerR, yObject: -outerR, yDim: -outerR - pad, label: `OD ${formatDimension(params.dripOilerOuterDiameter)}` },
    { type: "line", x1: -innerR, y1: 0, x2: innerR, y2: 0, label: `ID ${formatDimension(params.dripOilerInnerDiameter)}`, labelDy: -13 },
    { type: "radial", r1: innerR, r2: outerR, angle: Math.PI / 4, label: `Width ${formatDimension((params.dripOilerOuterDiameter - params.dripOilerInnerDiameter) / 2)}` },
  ];
}

function drawHorizontalDimension(ctx, toScreen, spec, dpr) {
  const objectA = toScreen(spec.x1, spec.yObject);
  const objectB = toScreen(spec.x2, spec.yObject);
  const dimA = toScreen(spec.x1, spec.yDim);
  const dimB = toScreen(spec.x2, spec.yDim);
  drawExtensionLine(ctx, objectA, dimA, dpr);
  drawExtensionLine(ctx, objectB, dimB, dpr);
  drawDimensionSegment(ctx, ctx.canvas, dimA, dimB, spec.label, spec.labelDx ?? 0, spec.labelDy ?? -12, dpr);
}

function drawVerticalDimension(ctx, toScreen, spec, dpr) {
  const objectA = toScreen(spec.xObject, spec.y1);
  const objectB = toScreen(spec.xObject, spec.y2);
  const dimA = toScreen(spec.xDim, spec.y1);
  const dimB = toScreen(spec.xDim, spec.y2);
  drawExtensionLine(ctx, objectA, dimA, dpr);
  drawExtensionLine(ctx, objectB, dimB, dpr);
  drawDimensionSegment(ctx, ctx.canvas, dimA, dimB, spec.label, spec.labelDx ?? 18, spec.labelDy ?? 0, dpr);
}

function drawRadialDimension(ctx, toScreen, spec, dpr) {
  const a = toScreen(Math.cos(spec.angle) * spec.r1, Math.sin(spec.angle) * spec.r1);
  const b = toScreen(Math.cos(spec.angle) * spec.r2, Math.sin(spec.angle) * spec.r2);
  drawDimensionSegment(ctx, ctx.canvas, a, b, spec.label, spec.labelDx ?? 14, spec.labelDy ?? -10, dpr);
}

function drawDimensionLeader(ctx, canvas, toScreen, spec, dpr) {
  const a = toScreen(spec.x1, spec.y1);
  const b = toScreen(spec.x2, spec.y2);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  drawExtensionLine(ctx, a, b, dpr);
  drawDimensionLabel(ctx, canvas, spec.label, b[0] + (spec.labelDx ?? (dx < 0 ? -24 : 24)) * dpr, b[1] + (spec.labelDy ?? (dy > 0 ? 10 : -10)) * dpr, dpr);
}

function drawExtensionLine(ctx, a, b, dpr) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
  const r = 2.5 * dpr;
  ctx.beginPath();
  ctx.arc(b[0], b[1], r, 0, Math.PI * 2);
  ctx.fill();
}

function drawDimensionSegment(ctx, canvas, a, b, label, labelDx, labelDy, dpr) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length > 0.0001) {
    const nx = (-dy / length) * 6 * dpr;
    const ny = (dx / length) * 6 * dpr;
    drawDimensionTick(ctx, a[0], a[1], nx, ny);
    drawDimensionTick(ctx, b[0], b[1], nx, ny);
  }
  drawDimensionLabel(ctx, canvas, label, (a[0] + b[0]) / 2 + labelDx * dpr, (a[1] + b[1]) / 2 + labelDy * dpr, dpr);
}

function drawDimensionTick(ctx, x, y, nx, ny) {
  ctx.beginPath();
  ctx.moveTo(x - nx, y - ny);
  ctx.lineTo(x + nx, y + ny);
  ctx.stroke();
}

function drawDimensionLabel(ctx, canvas, label, x, y, dpr) {
  const originalX = x;
  const originalY = y;
  const paddingX = 5 * dpr;
  const metricsText = ctx.measureText(label);
  const width = metricsText.width + paddingX * 2;
  const height = 17 * dpr;
  const labelPosition = findDimensionLabelPosition(canvas, x, y, width, height, dpr);
  x = labelPosition.x;
  y = labelPosition.y;
  if (Math.hypot(x - originalX, y - originalY) > 12 * dpr) {
    ctx.save();
    ctx.strokeStyle = "rgba(183, 121, 31, 0.4)";
    ctx.lineWidth = Math.max(0.75, 0.75 * dpr);
    ctx.beginPath();
    ctx.moveTo(originalX, originalY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 240, 0.94)";
  ctx.strokeStyle = "rgba(183, 121, 31, 0.55)";
  ctx.lineWidth = Math.max(0.8, 0.8 * dpr);
  ctx.beginPath();
  ctx.rect(x - width / 2, y - height / 2, width, height);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7a4b10";
  ctx.fillText(label, x, y);
  ctx.restore();
  activeDimensionLabelBoxes.push(labelPosition.box);
}

function findDimensionLabelPosition(canvas, x, y, width, height, dpr) {
  const xStep = Math.max(22 * dpr, Math.min(width * 0.42, 54 * dpr));
  const yStep = height + 5 * dpr;
  const attempts = getDimensionLabelCandidateOffsets(xStep, yStep);
  let fallback = null;
  for (const attempt of attempts) {
    const candidateX = x + attempt.x;
    const candidateY = y + attempt.y;
    const box = getDimensionLabelBox(candidateX, candidateY, width, height, dpr);
    const overlapArea = activeDimensionLabelBoxes.reduce((total, existing) => total + dimensionBoxOverlapArea(box, existing), 0);
    const overlapCount = activeDimensionLabelBoxes.filter((existing) => dimensionBoxesOverlap(box, existing)).length;
    const overflow = getDimensionLabelOverflow(canvas, box);
    const distance = Math.hypot(attempt.x, attempt.y);
    const score = overlapCount * 100000 + overlapArea * 20 + overflow * 80 + distance * 0.25;
    if (!fallback || score < fallback.score) fallback = { x: candidateX, y: candidateY, box, score };
    if (overlapCount === 0 && overlapArea === 0 && overflow === 0) return fallback;
  }
  return fallback || { x, y, box: getDimensionLabelBox(x, y, width, height, dpr) };
}

function getDimensionLabelCandidateOffsets(xStep, yStep) {
  const offsets = [{ x: 0, y: 0 }];
  [
    [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]],
    [[0, -2], [2, 0], [0, 2], [-2, 0], [2, -1], [2, 1], [-2, 1], [-2, -1], [1, -2], [1, 2], [-1, 2], [-1, -2]],
    [[0, -3], [3, 0], [0, 3], [-3, 0], [2, -2], [2, 2], [-2, 2], [-2, -2]],
  ].forEach((ring) => {
    ring.forEach(([x, y]) => offsets.push({ x: x * xStep, y: y * yStep }));
  });
  return offsets;
}

function getDimensionLabelBox(x, y, width, height, dpr) {
  const margin = 2 * dpr;
  return { minX: x - width / 2 - margin, minY: y - height / 2 - margin, maxX: x + width / 2 + margin, maxY: y + height / 2 + margin };
}

function dimensionBoxesOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

function dimensionBoxOverlapArea(a, b) {
  const width = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const height = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  return width * height;
}

function getDimensionLabelOverflow(canvas, box) {
  const gutter = 6 * (window.devicePixelRatio || 1);
  return Math.max(0, gutter - box.minX) + Math.max(0, gutter - box.minY) + Math.max(0, box.maxX - (canvas.width - gutter)) + Math.max(0, box.maxY - (canvas.height - gutter));
}

export function canvasEventToDxfPoint(canvas, mesh, view, event) {
  if (!mesh || mesh.kind !== "dxf") return null;
  resizeCanvas(canvas);
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const { scale, offsetX, offsetY } = getDxfPreviewTransform(canvas, mesh, view);
  const screenX = (event.clientX - rect.left) * (canvas.width / rect.width);
  const screenY = (event.clientY - rect.top) * (canvas.height / rect.height);
  return {
    x: (screenX - offsetX) / scale,
    y: -(screenY - offsetY) / scale,
    tolerance: Math.max(0.015, 9 / Math.max(scale, 1)),
  };
}

export function findHeadGasketHitTarget(mesh, point) {
  if (!mesh?.hitTargets) return null;
  let best = null;
  mesh.hitTargets.forEach((target) => {
    const distance = distanceToGasketTarget(target, point);
    if (distance <= point.tolerance && (!best || distance < best.distance)) best = { target, distance };
  });
  return best?.target || null;
}

function distanceToGasketTarget(target, point) {
  if (target.type === "bolt") return Math.max(0, Math.hypot(point.x - target.x, point.y - target.y) - target.radius);
  if (target.type === "slot") {
    const capR = target.width / 2;
    const angle = Math.atan2(point.y, point.x);
    const radius = Math.hypot(point.x, point.y);
    const span = target.arcLength / Math.max(target.centerRadius, 0.001);
    const angleDelta = Math.abs(shortestAngleDelta(angle, target.centerAngle));
    if (angleDelta <= span / 2) return Math.max(0, Math.abs(radius - target.centerRadius) - capR);
    const start = target.centerAngle - span / 2;
    const end = target.centerAngle + span / 2;
    const startDistance = Math.hypot(point.x - Math.cos(start) * target.centerRadius, point.y - Math.sin(start) * target.centerRadius);
    const endDistance = Math.hypot(point.x - Math.cos(end) * target.centerRadius, point.y - Math.sin(end) * target.centerRadius);
    return Math.max(0, Math.min(startDistance, endDistance) - capR);
  }
  return Infinity;
}

function shortestAngleDelta(a, b) {
  let delta = a - b;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function dripOilerGasketMetricRows(d) {
  return [
    ["File", "DXF"],
    ["OD", formatDimension(d.outerDiameter)],
    ["ID", formatDimension(d.innerDiameter)],
    ["Width", formatDimension(d.ringWidth)],
    ["Entities", d.entityCount.toLocaleString()],
  ];
}

function validateDripOilerGasket(raw) {
  const warnings = [];
  const p = { ...raw };

  p.dripOilerOuterDiameter = Math.max(0.001, p.dripOilerOuterDiameter);
  p.dripOilerInnerDiameter = Math.max(0.001, p.dripOilerInnerDiameter);

  if (p.dripOilerInnerDiameter >= p.dripOilerOuterDiameter) {
    warnings.push("ID must be smaller than OD.");
  }

  return { params: p, warnings };
}

function generateDripOilerGasketDxf(params) {
  const outerRadius = params.dripOilerOuterDiameter / 2;
  const innerRadius = params.dripOilerInnerDiameter / 2;
  const entities = [
    dripOilerCircleEntity(0, 0, outerRadius, "CUT"),
    dripOilerCircleEntity(0, 0, innerRadius, "CUT"),
  ];

  return {
    kind: "dxf",
    entities,
    bounds: dripOilerDxfEntityBounds(entities),
    derived: {
      outerDiameter: params.dripOilerOuterDiameter,
      innerDiameter: params.dripOilerInnerDiameter,
      ringWidth: (params.dripOilerOuterDiameter - params.dripOilerInnerDiameter) / 2,
      entityCount: entities.length,
    },
  };
}

function dripOilerCircleEntity(x, y, radius, layer) {
  return { type: "circle", x, y, radius, layer };
}

function dripOilerDxfEntityBounds(entities) {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  entities.forEach((entity) => {
    bounds.minX = Math.min(bounds.minX, entity.x - entity.radius);
    bounds.minY = Math.min(bounds.minY, entity.y - entity.radius);
    bounds.maxX = Math.max(bounds.maxX, entity.x + entity.radius);
    bounds.maxY = Math.max(bounds.maxY, entity.y + entity.radius);
  });
  return bounds;
}

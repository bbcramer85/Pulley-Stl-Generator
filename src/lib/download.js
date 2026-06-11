import { createOnePieceStlMesh } from "./manifold-union.js";

export function isBlockingWarning(message) {
  return !message.startsWith("Recommended change:");
}

export function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 300);
}

export async function downloadModel({ engine, project, params, mesh, unit }) {
  const unitOption = engine.unitOptions[unit] || engine.unitOptions.in;
  const displayFactor = unitOption.factorFromInch || 1;
  const fileDimensionValue = params[project.fileDimensionKey];
  const fileDimension =
    typeof fileDimensionValue === "number"
      ? Number((fileDimensionValue * displayFactor).toFixed(unitOption.decimals))
      : fileDimensionValue ?? project.label;
  const cleanDimension = String(fileDimension).replace(/[^0-9.]+/g, "-");

  if (project.exportType === "dxf") {
    const fileName = `${project.filePrefix}-${cleanDimension}${unit}.dxf`;
    const exportMesh = unit === "mm" ? scaleDxfMesh(mesh, displayFactor) : mesh;
    const blob = new Blob([engine.dxfToString(exportMesh, project.stlName, unit)], {
      type: "application/dxf;charset=utf-8",
    });
    triggerDownload(blob, fileName);
    return;
  }

  const fileName = `${project.filePrefix}-${cleanDimension}${unit}.stl`;
  const stlScale = 25.4;
  const exportResult = project.onePieceStl ? await createOnePieceStlMesh(mesh, { scale: stlScale }) : null;
  const exportMesh = exportResult?.mesh || mesh;
  const exportScale = exportResult ? 1 : stlScale;
  const blob = new Blob([engine.meshToAsciiStl(exportMesh, project.stlName, exportScale)], {
    type: "model/stl;charset=utf-8",
  });
  triggerDownload(blob, fileName);
  return exportResult;
}

function scaleDxfMesh(mesh, factor) {
  const scaleEntity = (entity) => {
    if (entity.type === "circle" || entity.type === "arc") {
      return {
        ...entity,
        x: entity.x * factor,
        y: entity.y * factor,
        radius: entity.radius * factor,
      };
    }
    if (entity.type === "line") {
      return {
        ...entity,
        x1: entity.x1 * factor,
        y1: entity.y1 * factor,
        x2: entity.x2 * factor,
        y2: entity.y2 * factor,
      };
    }
    return entity;
  };

  return {
    ...mesh,
    entities: mesh.entities.map(scaleEntity),
    bounds: mesh.bounds
      ? {
          minX: mesh.bounds.minX * factor,
          minY: mesh.bounds.minY * factor,
          maxX: mesh.bounds.maxX * factor,
          maxY: mesh.bounds.maxY * factor,
        }
      : mesh.bounds,
  };
}

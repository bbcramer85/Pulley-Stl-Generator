function scalePoint(point, scale) {
  return [point[0] * scale, point[1] * scale, point[2] * scale];
}

function meshToAsciiStl(mesh, name, scale = 1) {
  const lines = [`solid ${name}`];
  mesh.triangles.forEach((tri) => {
    if (!isFinitePoint(tri.a) || !isFinitePoint(tri.b) || !isFinitePoint(tri.c)) return;
    const a = scalePoint(tri.a, scale);
    const b = scalePoint(tri.b, scale);
    const c = scalePoint(tri.c, scale);
    const n = triangleNormal(a, b, c).unit;
    if (!isFinitePoint(a) || !isFinitePoint(b) || !isFinitePoint(c) || !isFinitePoint(n)) return;
    lines.push(`  facet normal ${n[0].toFixed(7)} ${n[1].toFixed(7)} ${n[2].toFixed(7)}`);
    lines.push("    outer loop");
    lines.push(`      vertex ${a[0].toFixed(5)} ${a[1].toFixed(5)} ${a[2].toFixed(5)}`);
    lines.push(`      vertex ${b[0].toFixed(5)} ${b[1].toFixed(5)} ${b[2].toFixed(5)}`);
    lines.push(`      vertex ${c[0].toFixed(5)} ${c[1].toFixed(5)} ${c[2].toFixed(5)}`);
    lines.push("    endloop");
    lines.push("  endfacet");
  });
  lines.push(`endsolid ${name}`);
  return lines.join("\n");
}


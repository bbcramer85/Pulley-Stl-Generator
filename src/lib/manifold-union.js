const STL_MM_SCALE = 25.4;
const VERTEX_EPSILON_MM = 1e-5;

let manifoldModulePromise;

export async function createOnePieceStlMesh(mesh, { scale = STL_MM_SCALE } = {}) {
  if (!mesh?.triangles?.length) {
    throw new Error("Unable to prepare this STL because no mesh triangles were generated.");
  }

  const components = splitTriangleComponents(mesh.triangles, scale);
  if (components.length <= 1) {
    const scaledMesh = scaleMesh(mesh, scale);
    const stats = analyzeMeshConnectivity(scaledMesh.triangles, 1);
    return {
      mesh: scaledMesh,
      sourceComponentCount: components.length,
      unionedComponentCount: stats.componentCount,
      unionedTriangleCount: mesh.triangles.length,
      openEdgeCount: stats.openEdgeCount,
      nonManifoldEdgeCount: stats.nonManifoldEdgeCount,
    };
  }

  const Module = await loadManifoldModule();
  const manifolds = [];
  let unioned = null;

  try {
    for (const component of components) {
      manifolds.push(Module.Manifold.ofMesh(componentToManifoldMesh(Module, component, scale)));
    }

    unioned = Module.Manifold.union(manifolds);
    const unionedMesh = manifoldMeshToAppMesh(unioned.getMesh());
    const unionedStats = analyzeMeshConnectivity(unionedMesh.triangles, 1);

    if (
      unionedStats.componentCount !== 1 ||
      unionedStats.openEdgeCount !== 0 ||
      unionedStats.nonManifoldEdgeCount !== 0
    ) {
      throw new Error(
        `Boolean union produced ${unionedStats.componentCount} components, ${unionedStats.openEdgeCount} open edges, and ${unionedStats.nonManifoldEdgeCount} non-manifold edges.`,
      );
    }

    return {
      mesh: unionedMesh,
      sourceComponentCount: components.length,
      unionedComponentCount: unionedStats.componentCount,
      unionedTriangleCount: unionedMesh.triangles.length,
      openEdgeCount: unionedStats.openEdgeCount,
      nonManifoldEdgeCount: unionedStats.nonManifoldEdgeCount,
    };
  } catch (error) {
    throw new Error(
      `Unable to create a one-piece STL for this model. ${error?.message || "The boolean union failed."}`,
    );
  } finally {
    if (unioned) unioned.delete();
    manifolds.forEach((manifold) => manifold.delete());
  }
}

async function loadManifoldModule() {
  if (!manifoldModulePromise) {
    const moduleUrl = publicAssetUrl("vendor/manifold/manifold.js");
    manifoldModulePromise = import(/* @vite-ignore */ moduleUrl).then(async ({ default: initManifold }) => {
      const Module = await initManifold({
        locateFile: (fileName) => publicAssetUrl(`vendor/manifold/${fileName}`),
      });
      Module.setup();
      return Module;
    });
  }

  return manifoldModulePromise;
}

function publicAssetUrl(assetPath) {
  const baseUrl = (import.meta.env?.BASE_URL || "/").replace(/\/?$/, "/");
  const relativePath = `${baseUrl}${assetPath.replace(/^\//, "")}`;
  return typeof document === "undefined" ? relativePath : new URL(relativePath, document.baseURI).href;
}

function splitTriangleComponents(triangles, scale) {
  const parent = triangles.map((_, index) => index);
  const edgeOwners = new Map();

  const find = (index) => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };

  const join = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  triangles.forEach((triangle, triangleIndex) => {
    if (!isFiniteTriangle(triangle)) return;
    const keys = [triangle.a, triangle.b, triangle.c].map((point) => quantizedPointKey(point, scale));
    const edges = [
      [keys[0], keys[1]],
      [keys[1], keys[2]],
      [keys[2], keys[0]],
    ];

    for (const edge of edges) {
      const edgeKey = edge[0] < edge[1] ? `${edge[0]}|${edge[1]}` : `${edge[1]}|${edge[0]}`;
      const owner = edgeOwners.get(edgeKey);
      if (owner === undefined) {
        edgeOwners.set(edgeKey, triangleIndex);
      } else {
        join(triangleIndex, owner);
      }
    }
  });

  const components = new Map();
  triangles.forEach((triangle, triangleIndex) => {
    if (!isFiniteTriangle(triangle)) return;
    const root = find(triangleIndex);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(triangle);
  });

  return [...components.values()].sort((left, right) => right.length - left.length);
}

function analyzeMeshConnectivity(triangles, scale) {
  const parent = triangles.map((_, index) => index);
  const edgeCounts = new Map();

  const find = (index) => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };

  const join = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  triangles.forEach((triangle, triangleIndex) => {
    if (!isFiniteTriangle(triangle)) return;
    const keys = [triangle.a, triangle.b, triangle.c].map((point) => quantizedPointKey(point, scale));
    const edges = [
      [keys[0], keys[1]],
      [keys[1], keys[2]],
      [keys[2], keys[0]],
    ];

    for (const edge of edges) {
      const edgeKey = edge[0] < edge[1] ? `${edge[0]}|${edge[1]}` : `${edge[1]}|${edge[0]}`;
      const record = edgeCounts.get(edgeKey) || { count: 0, firstTriangleIndex: triangleIndex };
      record.count += 1;
      if (record.count > 1) join(triangleIndex, record.firstTriangleIndex);
      edgeCounts.set(edgeKey, record);
    }
  });

  const componentRoots = new Set();
  triangles.forEach((triangle, triangleIndex) => {
    if (isFiniteTriangle(triangle)) componentRoots.add(find(triangleIndex));
  });

  let openEdgeCount = 0;
  let nonManifoldEdgeCount = 0;
  edgeCounts.forEach((record) => {
    if (record.count === 1) openEdgeCount += 1;
    if (record.count > 2) nonManifoldEdgeCount += 1;
  });

  return {
    componentCount: componentRoots.size,
    openEdgeCount,
    nonManifoldEdgeCount,
  };
}

function componentToManifoldMesh(Module, triangles, scale) {
  const vertProperties = [];
  const vertexIndexByKey = new Map();
  const triVerts = [];
  const shouldFlip = signedVolume(triangles, scale) < 0;

  const addVertex = (point) => {
    const quantized = quantizePoint(point, scale);
    const key = quantized.join(",");
    let index = vertexIndexByKey.get(key);

    if (index === undefined) {
      index = vertProperties.length / 3;
      vertexIndexByKey.set(key, index);
      vertProperties.push(
        quantized[0] * VERTEX_EPSILON_MM,
        quantized[1] * VERTEX_EPSILON_MM,
        quantized[2] * VERTEX_EPSILON_MM,
      );
    }

    return index;
  };

  for (const triangle of triangles) {
    const a = addVertex(triangle.a);
    const b = addVertex(triangle.b);
    const c = addVertex(triangle.c);
    if (a === b || b === c || c === a) continue;

    if (shouldFlip) {
      triVerts.push(a, c, b);
    } else {
      triVerts.push(a, b, c);
    }
  }

  if (!triVerts.length) {
    throw new Error("A mesh component contained no usable triangles.");
  }

  return new Module.Mesh({
    numProp: 3,
    vertProperties: new Float32Array(vertProperties),
    triVerts: new Uint32Array(triVerts),
  });
}

function manifoldMeshToAppMesh(mesh) {
  const vertices = mesh.vertProperties;
  const indices = mesh.triVerts;
  const triangles = [];

  const pointAt = (vertexIndex) => {
    const offset = vertexIndex * 3;
    return [vertices[offset], vertices[offset + 1], vertices[offset + 2]];
  };

  for (let index = 0; index < indices.length; index += 3) {
    triangles.push({
      a: pointAt(indices[index]),
      b: pointAt(indices[index + 1]),
      c: pointAt(indices[index + 2]),
    });
  }

  return { triangles };
}

function scaleMesh(mesh, scale) {
  return {
    ...mesh,
    triangles: mesh.triangles.map((triangle) => ({
      ...triangle,
      a: scalePoint(triangle.a, scale),
      b: scalePoint(triangle.b, scale),
      c: scalePoint(triangle.c, scale),
    })),
  };
}

function signedVolume(triangles, scale) {
  return triangles.reduce((sum, triangle) => {
    const a = scalePoint(triangle.a, scale);
    const b = scalePoint(triangle.b, scale);
    const c = scalePoint(triangle.c, scale);

    return (
      sum +
      (a[0] * (b[1] * c[2] - b[2] * c[1]) +
        a[1] * (b[2] * c[0] - b[0] * c[2]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
        6
    );
  }, 0);
}

function quantizedPointKey(point, scale) {
  return quantizePoint(point, scale).join(",");
}

function quantizePoint(point, scale) {
  return point.map((coordinate) => Math.round((coordinate * scale) / VERTEX_EPSILON_MM));
}

function scalePoint(point, scale) {
  return [point[0] * scale, point[1] * scale, point[2] * scale];
}

function isFiniteTriangle(triangle) {
  return isFinitePoint(triangle.a) && isFinitePoint(triangle.b) && isFinitePoint(triangle.c);
}

function isFinitePoint(point) {
  return Array.isArray(point) && point.length === 3 && point.every(Number.isFinite);
}

import * as THREE from "three";

const MAX_PIXEL_RATIO = 1.6;
const MODEL_PADDING = 1.18;

export class MeshPreviewRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.showOutline = options.showOutline ?? true;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10000, 10000);
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.meshObject = null;
    this.outlineObject = null;
    this.geometry = null;
    this.edgeGeometry = null;
    this.bounds = null;

    this.material = new THREE.MeshStandardMaterial({
      color: 0x8ec0a9,
      roughness: 0.72,
      metalness: 0.08,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    this.outlineMaterial = new THREE.LineBasicMaterial({
      color: 0x315f58,
      transparent: true,
      opacity: 0.42,
      depthTest: true,
    });

    this.scene.add(new THREE.HemisphereLight(0xf7fffb, 0x7d8a86, 1.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(-2.7, -3.2, 5.6);
    this.scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xf4d49a, 0.62);
    rimLight.position.set(3.4, 2.2, 2.7);
    this.scene.add(rimLight);
  }

  setOptions(options = {}) {
    const nextShowOutline = options.showOutline ?? true;
    if (nextShowOutline === this.showOutline) return;

    this.showOutline = nextShowOutline;
    if (this.geometry) {
      this.updateOutlineObject();
    }
  }

  setMesh(mesh) {
    if (this.mesh === mesh) return;
    this.mesh = mesh;
    this.disposeMeshObjects();

    if (!mesh?.triangles?.length) return;

    this.geometry = geometryFromMesh(mesh);
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();
    this.bounds = boundsFromBox(this.geometry.boundingBox);

    this.meshObject = new THREE.Mesh(this.geometry, this.material);
    this.group.add(this.meshObject);

    this.updateOutlineObject();
  }

  updateOutlineObject() {
    if (this.outlineObject) this.group.remove(this.outlineObject);
    this.edgeGeometry?.dispose();
    this.outlineObject = null;
    this.edgeGeometry = null;

    if (!this.showOutline || !this.geometry) return;

    this.edgeGeometry = new THREE.EdgesGeometry(this.geometry, 34);
    this.outlineObject = new THREE.LineSegments(this.edgeGeometry, this.outlineMaterial);
    this.group.add(this.outlineObject);
  }

  render(view) {
    if (!this.meshObject || !this.bounds) {
      this.renderer.clear();
      return;
    }

    this.resize();
    this.group.rotation.set(view.rotX, 0, view.rotZ);
    this.updateCamera(view.zoom);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const targetPixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    if (this.renderer.getPixelRatio() !== targetPixelRatio) {
      this.renderer.setPixelRatio(targetPixelRatio);
    }
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== width || size.y !== height) {
      this.renderer.setSize(width, height, false);
    }
  }

  updateCamera(zoom = 1) {
    const size = this.renderer.getSize(new THREE.Vector2());
    const aspect = size.x / Math.max(1, size.y);
    const radius = Math.max(1, this.bounds.radius * MODEL_PADDING);
    const vertical = radius / Math.max(0.2, zoom);
    const horizontal = vertical * aspect;

    this.camera.left = -horizontal;
    this.camera.right = horizontal;
    this.camera.top = vertical;
    this.camera.bottom = -vertical;
    this.camera.position.set(0, 0, radius * 3.2);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  disposeMeshObjects() {
    if (this.meshObject) this.group.remove(this.meshObject);
    if (this.outlineObject) this.group.remove(this.outlineObject);
    this.geometry?.dispose();
    this.edgeGeometry?.dispose();
    this.meshObject = null;
    this.outlineObject = null;
    this.geometry = null;
    this.edgeGeometry = null;
    this.bounds = null;
  }

  dispose() {
    this.disposeMeshObjects();
    this.material.dispose();
    this.outlineMaterial.dispose();
    this.renderer.dispose();
  }
}

function geometryFromMesh(mesh) {
  const positions = new Float32Array(mesh.triangles.length * 9);
  const normals = new Float32Array(mesh.triangles.length * 9);
  let offset = 0;

  mesh.triangles.forEach((triangle) => {
    [triangle.a, triangle.b, triangle.c].forEach((point) => {
      positions[offset] = point[0];
      positions[offset + 1] = point[1];
      positions[offset + 2] = point[2];
      normals[offset] = triangle.normal[0];
      normals[offset + 1] = triangle.normal[1];
      normals[offset + 2] = triangle.normal[2];
      offset += 3;
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.center();
  return geometry;
}

function boundsFromBox(box) {
  const size = new THREE.Vector3();
  box.getSize(size);
  return {
    radius: Math.max(size.x, size.y, size.z) / 2,
  };
}

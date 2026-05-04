<script>
  import { afterUpdate, onDestroy, onMount } from "svelte";
  import { canvasEventToDxfPoint, findHeadGasketHitTarget, renderPreview } from "../preview/renderer.js";
  import { MeshPreviewRenderer } from "../preview/webgl-renderer.js";

  export let mesh = null;
  export let view;
  export let context;
  export let projectKey;
  export let onViewChange = () => {};
  export let onZoomChange = () => {};
  export let onHeadGasketDelete = () => {};

  let canvas;
  let renderQueued = false;
  let dragging = false;
  let dragMoved = false;
  let lastX = 0;
  let lastY = 0;
  let localView = view;
  let lastParentView = view;
  let webglRenderer = null;
  let webglCanvas = null;

  $: previewMode = mesh?.kind === "dxf" ? "dxf" : "mesh";
  $: if (!dragging && view !== lastParentView) {
    localView = view;
    lastParentView = view;
  }

  function requestRender() {
    if (renderQueued || !canvas) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      drawPreview();
    });
  }

  function drawPreview() {
    if (!canvas) return;

    if (previewMode === "dxf") {
      disposeWebglRenderer();
      renderPreview(canvas, mesh, view, context);
      return;
    }

    if (!webglRenderer || webglCanvas !== canvas) {
      disposeWebglRenderer();
      webglRenderer = new MeshPreviewRenderer(canvas);
      webglCanvas = canvas;
    }

    webglRenderer.setMesh(mesh);
    webglRenderer.render(localView || view);
  }

  function disposeWebglRenderer() {
    webglRenderer?.dispose();
    webglRenderer = null;
    webglCanvas = null;
  }

  function handlePointerDown(event) {
    dragging = true;
    dragMoved = false;
    localView = view;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.hypot(dx, dy) > 3) dragMoved = true;
    lastX = event.clientX;
    lastY = event.clientY;

    if (previewMode !== "mesh") return;
    localView = {
      ...localView,
      rotZ: localView.rotZ + dx * 0.01,
      rotX: localView.rotX + dy * 0.008,
    };
    requestRender();
  }

  function handlePointerUp(event) {
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (previewMode === "mesh" && dragMoved) {
      onViewChange(localView);
    }
  }

  function handleClick(event) {
    if (dragMoved) {
      dragMoved = false;
      return;
    }
    if (projectKey !== "headGasket" || !mesh || mesh.kind !== "dxf") return;
    const point = canvasEventToDxfPoint(canvas, mesh, view, event);
    const target = point ? findHeadGasketHitTarget(mesh, point) : null;
    if (target) onHeadGasketDelete(target);
  }

  function handleWheel(event) {
    event.preventDefault();
    const nextZoom = Math.min(5.5, Math.max(0.35, view.zoom * Math.exp(-event.deltaY * 0.0012)));
    if (previewMode === "mesh") {
      localView = {
        ...localView,
        zoom: nextZoom,
      };
      requestRender();
    }
    onZoomChange(nextZoom);
  }

  onMount(() => {
    window.addEventListener("resize", requestRender);
    requestRender();
  });

  afterUpdate(requestRender);

  onDestroy(() => {
    window.removeEventListener("resize", requestRender);
    disposeWebglRenderer();
  });
</script>

{#key previewMode}
  <canvas
    id="previewCanvas"
    bind:this={canvas}
    aria-label="Model preview"
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={() => {
      dragging = false;
    }}
    on:click={handleClick}
    on:wheel={handleWheel}
  ></canvas>
{/key}

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
  let resizeObserver = null;

  $: previewMode = mesh?.kind === "dxf" ? "dxf" : "mesh";
  $: showMeshOutline = !["lineshaftHanger", "speedReductionBracket"].includes(projectKey);
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
      webglRenderer = new MeshPreviewRenderer(canvas, { showOutline: showMeshOutline });
      webglCanvas = canvas;
    }

    webglRenderer.setOptions({ showOutline: showMeshOutline });
    webglRenderer.setMesh(mesh);
    webglRenderer.render(localView || view);
  }

  function disposeWebglRenderer() {
    webglRenderer?.dispose();
    webglRenderer = null;
    webglCanvas = null;
  }

  function handlePointerDown(event) {
    dragMoved = false;
    if (previewMode !== "mesh") return;
    event.preventDefault();
    dragging = true;
    localView = view;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragging) return;
    event.preventDefault();
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.hypot(dx, dy) > 3) dragMoved = true;
    lastX = event.clientX;
    lastY = event.clientY;

    localView = {
      ...localView,
      rotZ: localView.rotZ + dx * 0.01,
      rotX: localView.rotX + dy * 0.008,
    };
    requestRender();
  }

  function handlePointerUp(event) {
    if (!dragging) return;
    event.preventDefault();
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (dragMoved) {
      onViewChange(localView);
    }
  }

  function handlePointerCancel(event) {
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    dragging = false;
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

  function isMobilePreviewLayout() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function handleWheel(event) {
    if (isMobilePreviewLayout()) return;
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
    if (window.ResizeObserver && canvas) {
      resizeObserver = new ResizeObserver(requestRender);
      resizeObserver.observe(canvas);
    }
    requestRender();
  });

  afterUpdate(requestRender);

  onDestroy(() => {
    window.removeEventListener("resize", requestRender);
    resizeObserver?.disconnect();
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
    on:pointercancel={handlePointerCancel}
    on:click={handleClick}
    on:wheel={handleWheel}
    class:mesh-preview={previewMode === "mesh"}
  ></canvas>
{/key}

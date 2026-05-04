<script>
  import { afterUpdate, onDestroy, onMount } from "svelte";
  import { canvasEventToDxfPoint, findHeadGasketHitTarget, renderPreview } from "../preview/renderer.js";

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

  function requestRender() {
    if (renderQueued || !canvas) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderPreview(canvas, mesh, view, context);
    });
  }

  function handlePointerDown(event) {
    dragging = true;
    dragMoved = false;
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
    onViewChange({
      ...view,
      rotZ: view.rotZ + dx * 0.01,
      rotX: view.rotX + dy * 0.008,
    });
  }

  function handlePointerUp(event) {
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
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
    onZoomChange(view.zoom * Math.exp(-event.deltaY * 0.0012));
  }

  onMount(() => {
    window.addEventListener("resize", requestRender);
    requestRender();
  });

  afterUpdate(requestRender);

  onDestroy(() => {
    window.removeEventListener("resize", requestRender);
  });
</script>

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

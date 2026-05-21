<script>
  import { onDestroy } from "svelte";
  import {
    fieldUnitLabel,
    formatControlValue,
    getSelectOptionLabel,
    inputBounds,
    parseControlValue,
  } from "../state/control-utils.js";

  export let field;
  export let value;
  export let unit;
  export let engine;
  export let active = true;
  export let onFieldChange = () => {};

  $: bounds = field?.type === "number" || !field?.type ? inputBounds(field, unit, engine) : null;
  $: displayValue = formatControlValue(value, field, unit, engine);
  $: unitLabel = fieldUnitLabel(field, unit, engine);
  let focusScrollCleanup = () => {};

  function handleInput(event) {
    const nextValue = parseControlValue(event.currentTarget.value, field, unit, engine, value);
    onFieldChange(field.key, nextValue);
  }

  function handleToggle(event) {
    const nextValue = parseControlValue(event.currentTarget.checked, field, unit, engine, value);
    onFieldChange(field.key, nextValue);
  }

  function handleSelect(event) {
    const nextValue = parseControlValue(event.currentTarget.value, field, unit, engine, value);
    onFieldChange(field.key, nextValue);
  }

  function keepFieldAboveKeyboard(target) {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    focusScrollCleanup();
    const fieldElement = target.closest(".field") || target;
    const viewport = window.visualViewport;
    let disposed = false;

    const scrollWhenReady = () => {
      if (disposed) return;
      window.requestAnimationFrame(() => {
        if (!disposed) scrollFieldIntoSafeArea(fieldElement);
      });
    };

    const timers = [80, 280, 650, 1000].map((delay) => window.setTimeout(scrollWhenReady, delay));
    const stopListeningTimer = window.setTimeout(() => {
      viewport?.removeEventListener("resize", scrollWhenReady);
      viewport?.removeEventListener("scroll", scrollWhenReady);
    }, 1200);

    viewport?.addEventListener("resize", scrollWhenReady);
    viewport?.addEventListener("scroll", scrollWhenReady);
    focusScrollCleanup = () => {
      disposed = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(stopListeningTimer);
      viewport?.removeEventListener("resize", scrollWhenReady);
      viewport?.removeEventListener("scroll", scrollWhenReady);
      focusScrollCleanup = () => {};
    };
    scrollWhenReady();
  }

  function scrollFieldIntoSafeArea(fieldElement) {
    if (!fieldElement?.isConnected) return;

    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
    const previewPanel = document.querySelector(".preview-panel");
    const previewRect = previewPanel?.getBoundingClientRect();
    const previewBottom =
      previewPanel && window.getComputedStyle(previewPanel).position === "sticky" && previewRect
        ? previewRect.bottom
        : viewportTop;

    const safeTop = Math.max(viewportTop + 12, previewBottom + 12);
    const safeBottom = viewportBottom - 18;
    const rect = fieldElement.getBoundingClientRect();

    if (safeBottom <= safeTop + 72) {
      fieldElement.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    let scrollDelta = 0;
    if (rect.bottom > safeBottom) {
      scrollDelta = rect.bottom - safeBottom;
    }
    if (rect.top - scrollDelta < safeTop) {
      scrollDelta = rect.top - safeTop;
    }

    if (Math.abs(scrollDelta) > 1) {
      window.scrollBy({ top: scrollDelta, behavior: "auto" });
    }
  }

  function handleFocus(event) {
    keepFieldAboveKeyboard(event.currentTarget);
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (!document.activeElement?.closest(".control-panel")) {
        focusScrollCleanup();
      }
    }, 0);
  }

  onDestroy(() => {
    focusScrollCleanup();
  });
</script>

<label
  class="field"
  class:field-select={field.type === "select"}
  class:field-inactive={!active}
  for={field.key}
  aria-disabled={!active}
>
  <span class="field-label">
    <span>{field.label}</span>
    <span class="hint">{field.hint}</span>
  </span>

  {#if field.type === "toggle"}
    <span class="checkbox-wrap">
      <input id={field.key} name={field.key} type="checkbox" checked={Boolean(value)} disabled={!active} on:change={handleToggle} />
      <span>Enable</span>
    </span>
  {:else if field.type === "select"}
    <span class="select-wrap">
      <select id={field.key} name={field.key} value={displayValue} disabled={!active} on:change={handleSelect}>
        {#each field.options as optionValue}
          <option value={optionValue}>{getSelectOptionLabel(field, optionValue, engine)}</option>
        {/each}
      </select>
    </span>
  {:else}
    <span class="number-wrap">
      <input
        id={field.key}
        name={field.key}
        type="number"
        inputmode="decimal"
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        value={displayValue}
        disabled={!active}
        on:focus={handleFocus}
        on:blur={handleBlur}
        on:input={handleInput}
      />
      {#if unitLabel}
        <span class="unit">{unitLabel}</span>
      {/if}
    </span>
  {/if}
</label>

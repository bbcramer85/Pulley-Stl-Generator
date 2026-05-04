<script>
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
        on:input={handleInput}
      />
      {#if unitLabel}
        <span class="unit">{unitLabel}</span>
      {/if}
    </span>
  {/if}
</label>

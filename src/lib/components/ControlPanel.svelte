<script>
  import AffiliateCards from "./AffiliateCards.svelte";
  import ControlField from "./ControlField.svelte";
  import CreatorCard from "./CreatorCard.svelte";
  import { isFieldActive } from "../state/control-utils.js";

  export let project;
  export let projectKey;
  export let params;
  export let unit;
  export let engine;
  export let showDxfDimensions = false;
  export let statusText = "Ready to export.";
  export let statusVariant = "";
  export let canDownload = false;
  export let onUnitChange = () => {};
  export let onFieldChange = () => {};
  export let onDxfDimensionsChange = () => {};
  export let onDownload = () => {};
  export let onReset = () => {};

  $: isDxf = project.exportType === "dxf";

  function dxfToggle(id) {
    return id;
  }
</script>

<aside class="control-panel">
  <CreatorCard />

  <div class="title-block">
    <h1>{project.label}</h1>
  </div>

  <form class="controls" on:submit|preventDefault>
    <fieldset>
      <legend>Units</legend>
      <div class="field">
        <span class="field-label">
          <span>Dimension units</span>
          <span class="hint">display units for editable dimensions</span>
        </span>
        <span class="segmented" role="radiogroup" aria-label="Dimension units">
          <input id="unitIn" name="unit" type="radio" value="in" checked={unit === "in"} on:change={() => onUnitChange("in")} />
          <label for="unitIn">Inch</label>
          <input id="unitMm" name="unit" type="radio" value="mm" checked={unit === "mm"} on:change={() => onUnitChange("mm")} />
          <label for="unitMm">Metric</label>
        </span>
      </div>

      {#if isDxf}
        <label class="field" for={dxfToggle("dxfDimensionsTop")}>
          <span class="field-label">
            <span>DXF dimensions</span>
            <span class="hint">show dimension callouts in preview</span>
          </span>
          <span class="checkbox-wrap">
            <input
              id="dxfDimensionsTop"
              name="dxfDimensionsTop"
              type="checkbox"
              checked={showDxfDimensions}
              on:change={(event) => onDxfDimensionsChange(event.currentTarget.checked)}
            />
            <span>Show</span>
          </span>
        </label>
      {/if}
    </fieldset>

    {#each project.controlGroups as group}
      <fieldset>
        <legend>{group.title}</legend>
        {#each group.fields as field}
          <ControlField
            {field}
            value={params[field.key]}
            {unit}
            {engine}
            active={isFieldActive(field, params)}
            {onFieldChange}
          />
        {/each}

        {#if group.title === "Spokes" && "spokeStyle" in params}
          <div class="field">
            <span class="field-label">
              <span>Spoke style</span>
              <span class="hint">straight or swept between hub and rim</span>
            </span>
            <span class="segmented" role="radiogroup" aria-label="Spoke style">
              <input
                id="styleStraight"
                name="spokeStyle"
                type="radio"
                value="straight"
                checked={params.spokeStyle === "straight"}
                on:change={() => onFieldChange("spokeStyle", "straight")}
              />
              <label for="styleStraight">Straight</label>
              <input
                id="styleCurved"
                name="spokeStyle"
                type="radio"
                value="curved"
                checked={params.spokeStyle === "curved"}
                on:change={() => onFieldChange("spokeStyle", "curved")}
              />
              <label for="styleCurved">Curved</label>
            </span>
          </div>
        {/if}
      </fieldset>
    {/each}

    {#if isDxf}
      <fieldset>
        <label class="field" for={dxfToggle("dxfDimensionsBottom")}>
          <span class="field-label">
            <span>DXF dimensions</span>
            <span class="hint">show dimension callouts in preview</span>
          </span>
          <span class="checkbox-wrap">
            <input
              id="dxfDimensionsBottom"
              name="dxfDimensionsBottom"
              type="checkbox"
              checked={showDxfDimensions}
              on:change={(event) => onDxfDimensionsChange(event.currentTarget.checked)}
            />
            <span>Show</span>
          </span>
        </label>
      </fieldset>
    {/if}
  </form>

  <AffiliateCards {projectKey} exportType={project.exportType || "stl"} />

  <div class="actions">
    <button class="primary-action" type="button" disabled={!canDownload} on:click={onDownload}>
      {project.downloadLabel || "Download STL"}
    </button>
    <button class="secondary-action" type="button" on:click={onReset}>Reset</button>
  </div>

  <p class={`status ${statusVariant}`.trim()}>{statusText}</p>
</aside>

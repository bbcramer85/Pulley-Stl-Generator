<script>
  import { projectOrder } from "../projects.js";

  export let projects;
  export let activeKey;
  export let projectKeys = projectOrder;
  export let onProjectChange = () => {};

  $: visibleProjectKeys = projectKeys?.length ? projectKeys : projectOrder;
</script>

<div class="project-switcher" aria-label="Generator projects">
  {#each visibleProjectKeys as key}
    {#if projects[key]}
      <button
        type="button"
        class="project-button"
        class:active={key === activeKey}
        aria-current={key === activeKey ? "page" : undefined}
        on:click={() => onProjectChange(key)}
      >
        {projects[key].label}
      </button>
    {/if}
  {/each}
</div>

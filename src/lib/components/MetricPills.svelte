<script>
  export let rows = [];
</script>

<div class="metrics" aria-label="Current model measurements">
  {#each rows as row}
    <span>{row[0]}: {row[1]}</span>
  {/each}
</div>

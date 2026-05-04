<script>
  import { affiliateCardsFor } from "../affiliates.js";

  export let projectKey;
  export let exportType = "stl";

  $: cards = affiliateCardsFor(projectKey, exportType);
</script>

{#each cards as card}
  <a class="affiliate-card" href={card.href} target="_blank" rel="noopener noreferrer" aria-label={card.aria}>
    <img src={card.image} alt={card.alt} />
    <span>{card.text}</span>
  </a>
{/each}

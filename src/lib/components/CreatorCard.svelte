<script>
  const desktopFacebookUrl = "https://www.facebook.com/CrankinCramers/";
  const mobileFacebookUrl = "https://m.facebook.com/CrankinCramers/";
  const androidFacebookUrl = `intent://www.facebook.com/CrankinCramers/#Intent;scheme=https;package=com.facebook.katana;S.browser_fallback_url=${encodeURIComponent(mobileFacebookUrl)};end`;
  const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
  const isNarrowViewport = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
  const isAndroidBrowser = /Android/i.test(userAgent);
  const isMobileBrowser = isNarrowViewport || /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  const facebookUrl = isAndroidBrowser ? androidFacebookUrl : isMobileBrowser ? mobileFacebookUrl : desktopFacebookUrl;
  const facebookTarget = isMobileBrowser ? "_self" : "_blank";

  function openFacebook(event) {
    if (!isMobileBrowser) return;
    event.preventDefault();
    window.location.href = facebookUrl;
  }
</script>

<a
  class="creator-card"
  href={facebookUrl}
  target={facebookTarget}
  rel="noopener noreferrer"
  aria-label="Open Crankin Cramer's on Facebook"
  on:click={openFacebook}
>
  <span class="creator-avatar">
    <img
      src="https://graph.facebook.com/CrankinCramers/picture?type=large"
      alt="Crankin Cramer's Facebook profile"
      on:error={(event) => {
        event.currentTarget.hidden = true;
      }}
    />
    <span class="creator-avatar-fallback">CC</span>
  </span>
  <span class="creator-copy">
    <span class="creator-kicker">Created by</span>
    <span class="creator-name">Crankin' Cramer's</span>
    <span class="creator-meta">19K followers on Facebook</span>
  </span>
</a>

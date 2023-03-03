<script lang="ts">
  // import base64url from 'base64url';
  import HealthCardScanner from "./HealthCardScanner.svelte";
  import { HealthCard, fromJws } from "./HealthCard";
  export let scanning = true;

  import base64url from "base64url";
  import { onMount } from "svelte";

  let postToOrigin: string | false = false;
  let postToWindow = window.opener;

  onMount(() => {

    const postToOriginCommand = window.location.hash.match(
      /#scan-and-post-to-(.+)/
    );
    if (postToOriginCommand) {
      postToOrigin = postToOriginCommand[1];
      if (postToWindow === null) {
        function handshake(e: MessageEvent) {
          if (e.origin === postToOrigin) {
            if (e.data === "handshake") {
              postToWindow = e.source
              console.log("GOT PTW", e.source)
              window.removeEventListener("message", handshake)
            }
          }
        }
        window.addEventListener("message", handshake)
        window.addEventListener("message",(e) => {console.log("E", e);})
      }
    }
  });

  function postAndClose(c: HealthCard) {
    // window.t = {postToWindow, postToOrigin, c}
    postToWindow.postMessage(c, postToOrigin);
    window.close();
  }

  let cards: HealthCard[] = [];
</script>

<main>
  {#if scanning}
    <HealthCardScanner
      on:scanned={async ({ detail: jws }) => {
        const card = await fromJws(jws);
        cards = [...cards, card];
        scanning = false;
      }}
      instructionClass="scanner-instruction"
      buttonClass="bottom-button"
      videoClass="scanner-video"
      on:scan-canceled={() => {
        scanning = false;
      }}
    />
  {:else}
    <h2 class="scanner-instruction">Scanned Health Cards</h2>
    <div class="scanner-video">
      {#each cards as card}
        <pre
          class="scanner-video">{JSON.stringify(card.validated, null, 2)}</pre>
        <hr />
      {/each}
    </div>
    {#if cards.length === 1 && postToOrigin !== false}
      <button class={"bottom-button"} on:click={() => postAndClose(cards[0])}
        >Send to <b>{postToOrigin}</b></button
      >
    {:else}
      <button class={"bottom-button"} on:click={() => (scanning = true)}
        >Scan</button
      >
    {/if}
  {/if}
</main>

<style>
  :global html,
  :global body,
  :global #svelte {
    height: 100%;
    margin: 0px;
    border: 0px;
    padding: 0px;
  }

  :global .scanner-video {
    grid-row: 2/3;
    grid-column: 2/3;

    text-align: left;
  }

  :global .bottom-button {
    grid-row: 3/4;
    grid-column: 2/3;
    margin-top: 1em;
    width: 100% !important;
    margin-bottom: 0.5em;
    border: 2px solid #ff3e00;
    border-radius: 2vmin;
  }

  main {
    text-align: center;
    display: grid;
    margin: 0px;
    box-sizing: border-box;
    grid-template-rows: 10vh auto 15vh;
    grid-template-columns: 2em auto 2em;
    height: 100%;
  }

  :global .scanner-instruction {
    color: #ff3e00;
    white-space: nowrap;
    text-transform: uppercase;
    font-size: 2vh;
    align-self: center;
    justify-self: center;
    overflow: hidden;
    margin: 0px;
    font-weight: 1000;
    width: 100%;
    line-height: 1.1;
    grid-row: 1 / 2;
    grid-column: 1/4;
    font-family: Arial, Helvetica, sans-serif;
  }
</style>

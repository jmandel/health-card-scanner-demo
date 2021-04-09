<script lang="ts">
  import QrScanner from 'qr-scanner';
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher();
  export let instructionClass;
  export let buttonClass;
  export let videoClass;

  let count = 0;
  let videoElement;

  let scannedPieces: (string | null)[] = new Array(1).fill(null);

  onMount(() => {
    let q = new QrScanner(
      videoElement,
      (v) => {
        let parts = v.match(/shc:\/((\d+)\/(\d+)\/)?(\d+)/);
        console.log('Parts', parts);
        let qrNumber = parseInt(parts[2]) || 1;
        let qrTotal = parseInt(parts[3]) || 1;
        let qrValue = parts[4]
          .match(/\d\d/g)
          .map((v) => String.fromCharCode(parseInt(v) + 45))
          .join('');
        if (qrTotal !== scannedPieces.length) {
          scannedPieces = new Array(qrTotal).fill(null);
        }
        scannedPieces[qrNumber - 1] = qrValue;
        if (scannedPieces.every((p) => !!p)) {
          let jws = scannedPieces.join('');
          dispatch('scanned', jws);
          q.stop();
        }
      },
      (e) => {
        dispatch('scanning-error', e);
      },
      (videoElement) => ({
        x: 0,
        y: 0,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight
      })
    );
    q.start();
    return () => {
      q.stop();
    };
  });

  const increment = (): void => {
    count += 1;
    dispatch('scan-canceled');
  };
</script>

<div class={instructionClass}>
  <div class={'checkboxes'}>
    {#if scannedPieces.length > 1}
      {#each scannedPieces as p, i}
        <input type="checkbox" checked={!!p} />
      {/each}
    {/if}
  </div>
  <h1 in:fade out:fade>Scan QR</h1>
</div>
<video class={videoClass} bind:this={videoElement}>
  <track kind="captions" />
</video>

<button class={buttonClass} on:click={increment}> Cancel </button>

<style>
  h1 {
    margin: 0px;
    padding: 0px;
  }
  button {
    margin-bottom: 0.5em;
    border-radius: 2em;
    border: 2px solid #ff3e00;
  }
</style>
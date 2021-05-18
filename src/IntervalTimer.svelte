<script>
  let currentTime = 0;
  let startTime = 0;
  let elapsedMilisecounds = 0;
  let elapsedSecounds = 0;
  let elapsedMinutes = 0;
  let elapsedHours = 0;
  let stopCounting = false;

  function start() {
    stopCounting = false;
    startTime = new Date().getTime();
    count();
  }

  function stop() {
    stopCounting = true;
  }

  function count() {
    currentTime = new Date().getTime();
    let elapsedTime = currentTime - startTime;
    elapsedHours = floor(elapsedTime / (60 * 60 * 1000));
    elapsedTime -= elapsedHours * (60 * 60 * 1000);
    elapsedMilisecounds = elapsedTime - floor(elapsedTime / 1000) * 1000;

    if (!stopCounting) {
      requestAnimationFrame(count);
    }
  }
</script>

<main>
  <dev>
    {elapsedHours} h {elapsedMinutes} min {elapsedSecounds} sec {elapsedMilisecounds}milisec
  </dev>
  <dev on:click={start}> Start</dev>
  <dev on:click={stop}> Stop</dev>
</main>

<style>
</style>

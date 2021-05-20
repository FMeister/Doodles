<script>
  import IntervalTimer from "./IntervalTimer.svelte";
  import RandomJenga from "./RandomJenga.svelte";

  let activatedButtons = {
    intervalTimer: "",
    sandSimulation: "",
    randomJenga: "",
  };
  let headlineString = "Select a Doodle:";

  function resetButtons() {
    console.log(activatedButtons);
    for (let button in activatedButtons) {
      activatedButtons[button] = "";
    }
  }

  function handleSandSimulationClick() {
    resetButtons();
    activatedButtons.sandSimulation = "active";
    headlineString = "Look at this Sand:";
  }

  function handleIntervalTimerClick() {
    resetButtons();
    activatedButtons.intervalTimer = "active";
    headlineString = "What a wonderful time:";
  }

  function handleRandomJengaClick() {
    resetButtons();
    activatedButtons.randomJenga = "active";
    headlineString = "...";
  }
</script>

<main>
  <dev class="pageOrganiser">
    <h1 class="headline">{headlineString}</h1>

    <dev class="buttonContainer">
      <dev
        class="doodleButton {activatedButtons.randomJenga}"
        on:click={handleRandomJengaClick}
      >
        Some pilled Blocks
      </dev>

      <dev
        class="doodleButton {activatedButtons.sandSimulation}"
        on:click={handleSandSimulationClick}
      >
        A tiny sand simulation
      </dev>

      <dev
        class="doodleButton {activatedButtons.intervalTimer}"
        on:click={handleIntervalTimerClick}
      >
        An interval timer
      </dev>
    </dev>

    <dev class="canvasContainer">
      <!-- <IntervalTimer /> -->
      <!-- <RandomJenga /> -->
      <dev />
    </dev>
  </dev>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #009dff;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  .pageOrganiser {
    display: grid;
    grid-template-rows: [headline] 1fr [doodleSelection] 1fr [doodleDisplay] auto;
    grid-gap: 4em;
    margin-top: 4em;
  }

  .headline {
    grid-row-start: headline;
    grid-row-end: headline;
    padding: 0px;
    margin: 0px;
    font-weight: lighter;
    font-size: 6rem;
  }

  .buttonContainer {
    grid-row-start: doodleSelection;
    grid-row-end: doodleSelection;
    display: flex;
  }

  .doodleButton {
    color: #3c86b3;
    font-size: 3em;
    font-weight: lighter;
    border-radius: 0.3em;
    border-color: #cfe3f0;
    border-style: solid;
    padding: 0.5em;
    margin: 0.5em;
    margin-bottom: auto;
    box-shadow: 4px 6px 0px 1px rgba(0, 0, 0, 0.13);
  }

  .doodleButton:hover,
  .doodleButton.active:hover {
    box-shadow: none;
    transition: box-shadow 0.1s;
    cursor: pointer;
  }

  .doodleButton.active {
    box-shadow: inset 4px 6px 0px 1px rgba(0, 0, 0, 0.13);
    background-color: #3c85b3a5;
    color: white;
  }

  .canvasContainer {
    grid-row-start: doodleDisplay;
    grid-row-end: doodleDisplay;
    margin-left: 5em;
    margin-right: 5em;
    box-shadow: 4px 6px 0px 1px rgba(0, 0, 0, 0.13);
    border-style: solid;
    border-radius: 1em;
    /* border-color: #0a507b6a; */
    border-color: rgb(243, 243, 243);
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

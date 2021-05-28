<script>
  import {
    Canvas,
    Scene,
    PerspectiveCamera,
    DirectionalLight,
    //BasicShadowMap,
    //PCFShadowMap,
    PCFSoftShadowMap,
    //VSMShadowMap,
    AmbientLight,
    BoxBufferGeometry,
    EdgesGeometry,
    LineSegments,
    LineBasicMaterial,
    PlaneBufferGeometry,
    Mesh,
    MeshStandardMaterial,
    WebGLRenderer,
    OrbitControls,
    DoubleSide,
    MathUtils,
    MeshDepthMaterial,
  } from "../public/build/svelthree";

  import Rand, { PRNG } from "rand-seed";
  let rngSeed = 1732874;

  let cubeGeometry = new BoxBufferGeometry(1, 1, 1);
  let cubeMaterial = new MeshStandardMaterial();

  let floorGeometry = new PlaneBufferGeometry(4, 4, 1);
  let floorMaterial = new MeshStandardMaterial();

  let vertNumber = 20;
  let horiNumber = 8;
  let cubePositions = [];
  let cubeScalings = [];
  let cubeOffset = (horiNumber - 1) / 2.0;
  let cubeHeight = 2;

  let dropPropability = 0.4;
  let propabilityModifier = 0.0;
  let levelDropCounter = 0;
  let minElementPerLevel = 0;

  recalcCubes();

  function recalcCubes() {
    let rng = new Rand("" + rngSeed);

    cubePositions = [];
    cubeScalings = [];

    for (let z = 0; z < vertNumber; z++) {
      propabilityModifier = 1 - Math.pow((2 * z) / vertNumber - 1, 2);
      levelDropCounter = 0;
      for (let x = 0; x < horiNumber; x++) {
        if (
          horiNumber - levelDropCounter > minElementPerLevel &&
          rng.next() < dropPropability * propabilityModifier
        ) {
          levelDropCounter += 1;
          continue;
        }

        let cubeStretch = 2 * Math.floor(3 * rng.next() * propabilityModifier);

        if (z % 2 == 0) {
          cubePositions.push([x - cubeOffset, z * cubeHeight, 0]);
          cubeScalings.push([1, cubeHeight, horiNumber + cubeStretch]);
        } else {
          cubePositions.push([0, z * cubeHeight, x - cubeOffset]);
          cubeScalings.push([horiNumber + cubeStretch, cubeHeight, 1]);
        }
      }
    }

    console.log(cubePositions);
  }
</script>

<main>
  <input
    type="number"
    bind:value={vertNumber}
    on:input={recalcCubes}
    min="0"
    max="40"
  />
  <input
    type="number"
    bind:value={horiNumber}
    on:input={recalcCubes}
    min="0"
    max="15"
  />
  <input
    type="number"
    bind:value={dropPropability}
    on:input={recalcCubes}
    min="0"
    max="1"
    step="0.01"
  />
  <input
    type="number"
    bind:value={cubeHeight}
    on:input={recalcCubes}
    min="1"
    max="6"
    step="1"
  />
  <input
    type="number"
    bind:value={rngSeed}
    on:input={recalcCubes}
    min="0"
    max="100000000"
    step="1"
  />
  <Canvas
    let:sti
    w={window.innerWidth * 0.9}
    h={window.innerHeight * 0.6}
    interactive
  >
    <Scene {sti} let:scene id="scene1" props={{ background: 0xedf2f7 }}>
      <PerspectiveCamera
        {scene}
        id="cam1"
        pos={[0, vertNumber, 30]}
        lookAt={[0, vertNumber, 20]}
      />
      <AmbientLight {scene} intensity={1.15} />

      <DirectionalLight
        {scene}
        pos={[2 * horiNumber, vertNumber * cubeHeight, 2 * horiNumber]}
        target={[0, 0, 0]}
        intensity={0.4}
      />

      <DirectionalLight
        {scene}
        pos={[-2 * horiNumber, vertNumber * cubeHeight, 2 * horiNumber]}
        target={[0, 0, 0]}
        intensity={0.4}
      />

      {#each Array(cubePositions.length) as _, i}
        <Mesh
          {scene}
          geometry={cubeGeometry}
          material={cubeMaterial}
          mat={{ roughness: 0.9, metalness: 0.5, color: 0x8fd2ff }}
          pos={cubePositions[i]}
          scale={cubeScalings[i]}
          castShadow
          receiveShadow
        />
      {/each}

      <Mesh
        {scene}
        geometry={floorGeometry}
        material={floorMaterial}
        mat={{
          roughness: 0.7,
          metalness: 0.5,
          // side: DoubleSide,
          color: 0xf7fafc,
        }}
        pos={[0, -0.5, 0]}
        rot={[MathUtils.degToRad(-90), 0, 0]}
        scale={[horiNumber, horiNumber, 1]}
        receiveShadow
      />

      <!-- <OrbitControls {scene} autoRotate enableDamping /> -->
      <OrbitControls {scene} enableDamping />
    </Scene>

    <WebGLRenderer
      {sti}
      sceneId="scene1"
      camId="cam1"
      config={{ antialias: false, alpha: false }}
      enableShadowMap
      shadowMapType={PCFSoftShadowMap}
    />
  </Canvas>
</main>

<style>
  canvas {
    border-radius: 1em;
  }
</style>

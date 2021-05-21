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
    PlaneBufferGeometry,
    Mesh,
    MeshStandardMaterial,
    WebGLRenderer,
    OrbitControls,
    DoubleSide,
    MathUtils,
  } from "../public/build/svelthree";

  let cubeGeometry = new BoxBufferGeometry(1, 1, 1);
  let cubeMaterial = new MeshStandardMaterial();

  let floorGeometry = new PlaneBufferGeometry(4, 4, 1);
  let floorMaterial = new MeshStandardMaterial();

  let vertNumber = 30;
  let horiNumber = 7;
  let cubePositions = [];
  let cubeScalings = [];
  let cubeOffset = Math.floor(horiNumber / 2);

  let dropPropability = 0.5;
  let levelDropCounter = 0;
  let minElementPerLevel = horiNumber;
  recalcCubes();

  function recalcCubes() {
    cubePositions = [];
    cubeScalings = [];

    for (let z = 0; z < vertNumber; z++) {
      levelDropCounter -= 1;
      for (let x = 0; x < horiNumber; x++) {
        if (
          horiNumber - levelDropCounter > minElementPerLevel &&
          Math.random() < dropPropability
        ) {
          levelDropCounter += 1;
          continue;
        }

        if (z % 2 == 0) {
          cubePositions.push([x - cubeOffset, z, 0]);
          cubeScalings.push([1, 1, horiNumber]);
          levelDropCounter -= 1;
        } else {
          cubePositions.push([0, z, x - cubeOffset]);
          cubeScalings.push([horiNumber, 1, 1]);
          levelDropCounter -= 1;
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
      <AmbientLight {scene} intensity={1.25} />
      <DirectionalLight
        {scene}
        pos={[1, 2, 1]}
        intensity={0.8}
        shadowMapSize={512 * 2}
        castShadow
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

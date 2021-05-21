<script>
  import { Color, RGBADepthPacking, TetrahedronGeometry } from "./svelthree";

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
  } from "./svelthree.ts";

  let cubeGeometry = new BoxBufferGeometry(1, 1, 1);
  let cubeMaterial = new MeshStandardMaterial();

  let floorGeometry = new PlaneBufferGeometry(4, 4, 1);
  let floorMaterial = new MeshStandardMaterial();

  let vertNumber = 10;
  let horiNumber = 3;
</script>

<main>
  <Canvas let:sti w={window.innerWidth * 0.9} h={window.innerHeight * 0.6}>
    <Scene {sti} let:scene id="scene1" props={{ background: 0xedf2f7 }}>
      <PerspectiveCamera
        {scene}
        id="cam1"
        pos={[0, 0, 30]}
        lookAt={[0, 0, 15]}
      />
      <AmbientLight {scene} intensity={1.25} />
      <DirectionalLight
        {scene}
        pos={[1, 2, 1]}
        intensity={0.8}
        shadowMapSize={512 * 2}
        castShadow
      />

      {#each Array(vertNumber) as _, iy}
        {#each Array(horiNumber) as _, ix}
          {#if iy % 2 == 0}
            <Mesh
              {scene}
              geometry={cubeGeometry}
              material={cubeMaterial}
              mat={{ roughness: 0.9, metalness: 0.5, color: 0x8fd2ff }}
              pos={[ix, iy, 0]}
              rot={[0, 0, 0]}
              scale={[1, 1, horiNumber]}
              castShadow
              receiveShadow
            />
          {:else}
            <Mesh
              {scene}
              geometry={cubeGeometry}
              material={cubeMaterial}
              mat={{ roughness: 0.9, metalness: 0.5, color: 0x8fd2ff }}
              pos={[
                Math.floor(horiNumber / 2),
                iy,
                -Math.floor(horiNumber / 2) + ix,
              ]}
              rot={[0, MathUtils.degToRad(90), 0]}
              scale={[1, 1, horiNumber]}
              castShadow
              receiveShadow
            />
          {/if}
        {/each}
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
        pos={[0, -0.501, 0]}
        rot={[MathUtils.degToRad(-90), 0, 0]}
        scale={[1, 1, 1]}
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

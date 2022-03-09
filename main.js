import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/three@0.137.0/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/libs/stats.module.js";
import { particleObject } from "/particleObject.js";

let camera, scene, renderer, stats, controls;
let spaceParticles;
let spaceVertices = [];
let sceneObjects = [];

let classTest;

let darkMode = false;
let lastZoom;

const colorPallete = {
  color1: 0x4fcfae,
  color2: 0x74d5a7,
  color3: 0x84d6cd,
  color4: 0x9ce5f0,
  color5: 0xe1e9f1,
};

const params = {
  sizeMult: 0.8,
  countMult: 50,
  partCount: 80000,
  backgroundColor: 0xdfe9f2,
  darkBackground: 0x000000,
  changeBG: function () {
    darkMode = !darkMode;
    if (darkMode) {
      classTest.changeRimColor(new THREE.Color("rgb(0, 0, 0)"));
      renderer.setClearColor(params.darkBackground);
    } else {
      classTest.changeRimColor(new THREE.Color("rgb(255, 255, 255)"));
      renderer.setClearColor(0, 0);
    }
  },
};

const tweenParams = {
  transition: 0,
  duration: 200,
  startAnim: function () {
    if (this.transition == 1) {
      buildTween.to({ transition: 0 }, tweenParams.duration).start();
      animDirection = false;
    }
    if (this.transition == 0) {
      buildTween.to({ transition: 1 }, tweenParams.duration).start();
      animDirection = true;
    }
  },
};

let buildTween = new TWEEN.Tween(tweenParams)
  .to({ transition: 1 })
  .easing(TWEEN.Easing.Quartic.Out)
  .onComplete(() => {
    if (tweenParams.transition == 1) console.log("complete!");
  })
  .onUpdate(() => {
    buildAnimation();
  });

const stage = {
  objects: [],
};

init();
animate();

function init() {
  scene = new THREE.Scene();

  //---------------- Camera --------------------------

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 3000);
  camera.position.set(8, 15, 10);

  //---------------- Lights --------------------------

  const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
  light1.position.set(0, 100, 250);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
  light2.position.set(0, -100, -250);
  scene.add(light2);

  scene.add(new THREE.AmbientLight(0x999999));

  //---------------- Render --------------------------

  renderer = new THREE.WebGLRenderer({ antyalias: true, alpha: true });

  // renderer.setClearAlpha(0,0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //---------------- Controls --------------------------

  controls = new OrbitControls(camera, renderer.domElement);
  // controls.target = new THREE.Vector3(0, 18, 0);
  controls.enableDamping = true;
  lastZoom = 0;
  // controls.addEventListener("change", () => {
  //   for (let i = 0; i < sceneObjects.length; i++) {
  //     const pos = sceneObjects[i].position;
  //     let d = pos.distanceTo(camera.position);
  //     sceneObjects[i].zoomResample(d);
  //   }
  // });
  // controls.autoRotate = true;
  // controls.autoRotateSpeed = 0.5;
  window.addEventListener("resize", onWindowResize);

  //---------------- GUI --------------------------

  // stats = new Stats();
  // document.body.appendChild(stats.dom);

  const gui = new GUI();
  const folder1 = gui.addFolder("Particles");
  // folder1.add(params, "particleCount", 1000, 500000).onChange(resample).listen();
  folder1
    .add(params, "sizeMult", 0, 2, 0.01)
    .onChange(() => {
      classTest.params.particleSizeMult = params.sizeMult;
      classTest.changeParticleSize();
    })
    .listen();
  // folder1.add(params, "particleSizeVariation", 0, 1, 0.01).onChange(changeParticleSize);
  // folder1.add(params, "particlesWobble", 0, 1, 0.01);
  folder1.add(params, "countMult", 10, 100).onChange(() => {
    for (let i = 0; i < sceneObjects.length; i++) {
      sceneObjects[i].params.particleCntMult = params.countMult;
      sceneObjects[i].resample();
    }
  });
  gui.add(params, "changeBG");
  // gui.close();

  buildSpaceParticles();

  // zoomResample();

  for (let o = 0; o < 8; o++) {
    const tmp = new particleObject(scene, "gltf/cell.glb", colorPallete.color1);
    tmp.changeParticleSize();
    tmp.setScale(new THREE.Vector3(0.5, 0.5, 0.5));
    tmp.setPosition(new THREE.Vector3(50 * Math.random() - 25, 50 * Math.random() - 25, 50 * Math.random() - 25));
    sceneObjects.push(tmp);
  }
}

//---------------- Animate --------------------------

function animate(time) {
  requestAnimationFrame(animate);
  render();
  controls.update();
  // stats.update();
  TWEEN.update(time);
}

//---------------- Render --------------------------

function render() {
  spaceParticles.rotation.y += 0.0002;
  // spaceParticles.rotation.x += 0.0002;

  for (let i = 0; i < sceneObjects.length; i++) {
    sceneObjects[i].update(camera);
  }

  renderer.render(scene, camera);
}
//---------------- Window resize --------------------------

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildSpaceParticles() {
  let spaceParticlesGeo = new THREE.BufferGeometry();
  const sprite = new THREE.TextureLoader().load("img/pointSprite.png");

  for (let i = 0; i < 2000; i++) {
    const x = 800 * Math.random() - 400;
    const y = 800 * Math.random() - 400;
    const z = 800 * Math.random() - 400;

    spaceVertices.push(x, y, z);
  }
  spaceParticlesGeo.setAttribute("position", new THREE.Float32BufferAttribute(spaceVertices, 3));

  let mat = new THREE.PointsMaterial({
    size: 5,
    sizeAttenuation: true,
    map: sprite,
    // blending: THREE.AdditiveBlending,
    depthTest: false,
    alphaTest: 0.1,
    transparent: true,
  });
  mat.color.set(colorPallete.color1);

  spaceParticles = new THREE.Points(spaceParticlesGeo, mat);
  scene.add(spaceParticles);
}

// function buildAnimation() {
//   const positions = particles.geometry.attributes.position.array;

//   let trans = tweenParams.transition;
//   const originPoint = new THREE.Vector3(0);

//   for (let i = 0; i < surfaceVerts.length; i++) {
//     positions[i * 3] = surfaceVerts[i].x + (originPoint.x - surfaceVerts[i].x) * trans;
//     positions[i * 3 + 1] = surfaceVerts[i].y + (originPoint.y - surfaceVerts[i].y) * trans;
//     positions[i * 3 + 2] = surfaceVerts[i].z + (originPoint.z - surfaceVerts[i].z) * trans;
//   }

//   particles.geometry.attributes.position.needsUpdate = true;
// }

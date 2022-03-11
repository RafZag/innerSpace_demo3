import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/three@0.137.0/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/libs/stats.module.js";
import { particleObject } from "./particleObject.js";

let camera, scene, renderer, stats, controls;
let spaceParticles;
let spaceVertices = [];
let plusZ = 0;

const storyStage = {
  sceneObjects: [],
  stageCointainer: new THREE.Object3D(),
};

let darkMode = false;

let mouse = new THREE.Vector2();
let camTargetRotX = 0;
let camTargetRotY = 0;

const colorPallete = [0x4fcfae, 0x74d5a7, 0x84d6cd, 0x9ce5f0, 0xe1e9f1];

const params = {
  camRot: 0.4,
  sizeMult: 0.6,
  countMult: 25,
  backgroundColor: 0xdfe9f2,
  darkBackground: 0x000000,
  changeBG: function () {
    darkMode = !darkMode;
    if (darkMode) {
      for (let i = 0; i < storyStage.sceneObjects.length; i++) {
        storyStage.sceneObjects[i].changeRimColor(new THREE.Color("rgb(0, 0, 0)"));
        renderer.setClearColor(params.darkBackground);
      }
    } else {
      for (let i = 0; i < storyStage.sceneObjects.length; i++) {
        storyStage.sceneObjects[i].changeRimColor(new THREE.Color("rgb(255, 255, 255)"));
        renderer.setClearColor(0, 0);
      }
    }
  },
};

init();
animate();

function init() {
  scene = new THREE.Scene();

  //---------------- Camera --------------------------

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 3000);
  camera.position.set(0, 0, 10);

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

  // controls = new OrbitControls(camera, renderer.domElement);
  // // controls.target = new THREE.Vector3(0, 18, 0);
  // controls.enableDamping = true;
  // controls.addEventListener("change", () => {
  //   for (let i = 0; i < sceneObjects.length; i++) {
  //     const pos = sceneObjects[i].position;
  //     let d = pos.distanceTo(camera.position);
  //     sceneObjects[i].zoomResample(d);
  //   }
  // });
  // controls.autoRotate = true;
  // controls.autoRotateSpeed = 0.5;

  //---------------------- Listeners -----------------

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("mousemove", onDocumentMouseMove, false);
  document.addEventListener("wheel", onDocumentWheel, false);

  //---------------- GUI --------------------------

  // stats = new Stats();
  // document.body.appendChild(stats.dom);

  const gui = new GUI();
  const folder1 = gui.addFolder("Particles");
  // folder1.add(params, "particleCount", 1000, 500000).onChange(resample).listen();
  folder1
    .add(params, "sizeMult", 0, 2, 0.01)
    .onChange(() => {
      for (let i = 0; i < storyStage.sceneObjects.length; i++) {
        storyStage.sceneObjects[i].params.particleSizeMult = params.sizeMult;
        storyStage.sceneObjects[i].changeParticleSize();
      }
    })
    .listen();
  // folder1.add(params, "particleSizeVariation", 0, 1, 0.01).onChange(changeParticleSize);
  // folder1.add(params, "particlesWobble", 0, 1, 0.01);
  folder1.add(params, "countMult", 10, 100).onChange(() => {
    for (let i = 0; i < storyStage.sceneObjects.length; i++) {
      storyStage.sceneObjects[i].params.particleCntMult = params.countMult;
      storyStage.sceneObjects[i].zoomResample(camera);
    }
  });
  gui.add(params, "changeBG");
  // gui.close();

  buildSpaceParticles();

  ///////////////////// Build scene, add objects

  for (let o = 0; o < 8; o++) {
    // const tmp = new particleObject(scene, "gltf/cell.glb", colorPallete[Math.floor(Math.random() * (colorPallete.length - 1))]);
    const tmp = new particleObject(storyStage.stageCointainer, "gltf/cell.glb", colorPallete[0]);
    tmp.changeParticleSize();
    tmp.setScale(new THREE.Vector3(0.5, 0.5, 0.5));
    tmp.setRotation(
      new THREE.Vector3(2 * Math.PI * Math.random() - Math.PI, 2 * Math.PI * Math.random() - Math.PI, 2 * Math.PI * Math.random() - Math.PI)
    );
    tmp.setPosition(new THREE.Vector3(50 * Math.random() - 25, 30 * Math.random() - 15, -50 * Math.random()));
    tmp.zoomResample(camera);
    // tmp.changeColor(colorPallete[3]);
    storyStage.sceneObjects.push(tmp);
  }
  scene.add(storyStage.stageCointainer);
}

//---------------- Animate --------------------------

function animate(time) {
  camera.rotation.x += (camTargetRotX - camera.rotation.x) * 0.03;
  camera.rotation.y += (camTargetRotY - camera.rotation.y) * 0.03;

  plusZ += (0 - plusZ) * 0.05;
  storyStage.stageCointainer.position.z += plusZ;

  requestAnimationFrame(animate);
  render();
  // controls.update();
  // stats.update();
  TWEEN.update(time);
}

//---------------- Render --------------------------

function render() {
  spaceParticles.rotation.y += 0.0002;
  // spaceParticles.rotation.x += 0.0002;

  for (let i = 0; i < storyStage.sceneObjects.length; i++) {
    storyStage.sceneObjects[i].update();
  }

  renderer.render(scene, camera);
}
// ----------------------Event handlers----------------------------

function onDocumentMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  camTargetRotX = mouse.y * params.camRot;
  camTargetRotY = -mouse.x * params.camRot;
}

function onDocumentWheel(event) {
  // for (let i = 0; i < sceneObjects.length; i++) {
  //   sceneObjects[i].position.z += event.deltaY / 200;
  //   sceneObjects[i].setPosition(sceneObjects[i].position);
  // }

  plusZ += event.deltaY / 400;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------------

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
  mat.color.set(colorPallete[0]);
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

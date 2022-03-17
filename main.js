import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/three@0.137.0/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/libs/stats.module.js";
import { particleObject } from "./particleObject.js";
import { ambientParticles } from "./ambientParticles.js";

///////////////////////////// BROWSER CHECK

let isSafari = false;
let isMobile = false;

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  isMobile = true;
} else {
  isMobile = false;
}

let camera, scene, renderer, stats, controls;

let ambParticles;

let plusZ = 0;
let stageMoveDistance = 0;

const storyStage = {
  sceneObjects: [],
  stageCointainer: new THREE.Object3D(),
  moveForwardThreshold: 50,
  moveBackThreshold: -10,
  transitionSpeed: 4,
  flyRange: 500,
};

let darkMode = false;

let mouse = new THREE.Vector3(0, 0, 0.5);
let camTargetRotX = 0;
let camTargetRotY = 0;

const colorPallete = [0x4fcfae, 0x74d5a7, 0x84d6cd, 0x9ce5f0, 0xe1e9f1];

const params = {
  camRot: 0.4,
  sizeMult: 0.44,
  countMult: 65,
  backgroundColor: 0xdfe9f2,
  darkBackground: 0x000000,
  changeBG: function () {
    darkMode = !darkMode;
    if (darkMode) {
      for (let i = 0; i < storyStage.sceneObjects.length; i++) {
        storyStage.sceneObjects[i].changeRimColor(new THREE.Color(params.darkBackground));
      }
      renderer.setClearColor(params.darkBackground);
    } else {
      for (let i = 0; i < storyStage.sceneObjects.length; i++) {
        storyStage.sceneObjects[i].changeRimColor(new THREE.Color(0xffffff));
      }
      renderer.setClearColor(0, 0);
    }
  },
};

/////////////////////// RAYCASTER

const raycaster = new THREE.Raycaster();
// raycaster.layers.set(1);

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
  document.addEventListener("click", onDocumentClick, false);

  //---------------- GUI --------------------------

  // stats = new Stats();
  // document.body.appendChild(stats.dom);

  const gui = new GUI();
  const folder1 = gui.addFolder("Particles");
  folder1
    .add(params, "sizeMult", 0, 2, 0.01)
    .onChange(() => {
      for (let i = 0; i < storyStage.sceneObjects.length; i++) {
        storyStage.sceneObjects[i].params.particleSizeMult = params.sizeMult;
        storyStage.sceneObjects[i].changeParticleSize();
      }
    })
    .listen();
  folder1.add(params, "countMult", 10, 100).onChange(() => {
    for (let i = 0; i < storyStage.sceneObjects.length; i++) {
      storyStage.sceneObjects[i].params.particleCntMult = params.countMult;
      storyStage.sceneObjects[i].zoomResample(camera);
    }
  });
  gui.add(params, "changeBG");
  gui.close();

  ///////////////////// Build scene, add objects

  scene.add(storyStage.stageCointainer);
  // buildSpaceParticles();
  buildScene();
  ambParticles = new ambientParticles(storyStage.stageCointainer);
}

//---------------- Animate --------------------------

function animate(time) {
  camera.rotation.x += (camTargetRotX - camera.rotation.x) * 0.03;
  camera.rotation.y += (camTargetRotY - camera.rotation.y) * 0.03;

  plusZ += (0 - plusZ) * 0.05;
  storyStage.stageCointainer.position.z += plusZ;

  if (storyStage.stageCointainer.position.z > storyStage.moveForwardThreshold) {
    for (let i = 0; i < storyStage.sceneObjects.length; i++) {
      storyStage.sceneObjects[i].particles.position.z += storyStage.transitionSpeed;
      if (storyStage.sceneObjects[i].particles.position.z >= storyStage.flyRange)
        storyStage.sceneObjects[i].particles.position.z = -storyStage.flyRange;
    }
    ambParticles.speed = storyStage.transitionSpeed;
    stageMoveDistance += storyStage.transitionSpeed;
    ambParticles.fly();
  } else if (storyStage.stageCointainer.position.z <= storyStage.moveBackThreshold) {
    for (let i = 0; i < storyStage.sceneObjects.length; i++) {
      storyStage.sceneObjects[i].particles.position.z -= storyStage.transitionSpeed;
      if (storyStage.sceneObjects[i].particles.position.z < -storyStage.flyRange)
        storyStage.sceneObjects[i].particles.position.z = storyStage.flyRange;
    }
    ambParticles.speed = -storyStage.transitionSpeed;
    stageMoveDistance -= storyStage.transitionSpeed;
    ambParticles.fly();
  } else ambParticles.stop();

  if (Math.abs(stageMoveDistance) >= 1.9 * storyStage.flyRange) {
    stageMoveDistance = 0;
    storyStage.stageCointainer.position.z = 0;
    for (let i = 0; i < storyStage.sceneObjects.length; i++) {
      storyStage.sceneObjects[i].particles.position.z = storyStage.sceneObjects[i].position.z;
    }
    ambParticles.stop();
  }

  // console.log(storyStage.stageCointainer.position.z);

  requestAnimationFrame(animate);
  render();
  // controls.update();
  // stats.update();
  TWEEN.update(time);
}

//---------------- Render --------------------------

function render() {
  // spaceParticles.rotation.y += 0.0002;
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

  mouse.unproject(camera);
  let raycaster = new THREE.Raycaster(camera.position, mouse.sub(camera.position).normalize());
  const intersects = raycaster.intersectObjects(storyStage.stageCointainer.children);

  if (intersects.length > 0) {
    if (intersects[0].object.visible) document.body.style.cursor = "pointer";
    // for (let i = 0; i < storyStage.sceneObjects.length; i++) {
    //   if (storyStage.sceneObjects[i].uuid == intersects[0].object.uuid) {
    //     storyStage.sceneObjects[i].scale = 0.7;
    //   }
    // }
  } else {
    document.body.style.cursor = "default";
    // for (let i = 0; i < storyStage.sceneObjects.length; i++) {
    //   storyStage.sceneObjects[i].scale = 0.5;
    // }
  }
}

function onDocumentClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  mouse.unproject(camera);
  let raycaster = new THREE.Raycaster(camera.position, mouse.sub(camera.position).normalize());
  const intersects = raycaster.intersectObjects(storyStage.stageCointainer.children);

  if (intersects.length > 0) {
    for (let i = 0; i < storyStage.sceneObjects.length; i++) {
      if (storyStage.sceneObjects[i].uuid == intersects[0].object.uuid) {
        // console.log(storyStage.sceneObjects[i].uuid);
        storyStage.sceneObjects[i].changeColor(colorPallete[Math.floor(Math.random() * (colorPallete.length - 1))]);
      }
    }
    //console.log(intersects[0].object.uuid);
    // intersects[0].object.visible = false;
  }
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

function buildScene() {
  for (let o = 0; o < 8; o++) {
    const tmp = new particleObject(storyStage.stageCointainer, "gltf/cell.glb", colorPallete[0]);
    tmp.changeParticleSize();
    tmp.setScale(0.5);
    tmp.setRotation(
      new THREE.Vector3(2 * Math.PI * Math.random() - Math.PI, 2 * Math.PI * Math.random() - Math.PI, 2 * Math.PI * Math.random() - Math.PI)
    );
    tmp.setPosition(new THREE.Vector3(50 * Math.random() - 25, 30 * Math.random() - 15, -100 * Math.random()));
    tmp.zoomResample(camera);
    storyStage.sceneObjects.push(tmp);
  }
}

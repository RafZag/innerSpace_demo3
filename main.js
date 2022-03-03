import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "https://cdn.skypack.dev/three@0.137.0/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/libs/stats.module.js";
import { MeshSurfaceSampler } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/math/MeshSurfaceSampler.js";
// import { VertexNormalsHelper } from 'https://cdn.skypack.dev/three@0.132.0/examples/jsm/helpers/VertexNormalsHelper.js';

let camera, scene, renderer, stats, controls;
let particles;
let spaceParticles;
let spaceVertices = [];

let vertices = [];
let surfaceVerts = [];
let partColors = [];
let sizes = [];
let geometry = new THREE.BufferGeometry();
let shaderMaterial;
const meshURL = "gltf/human.glb";
const gltfLoader = new GLTFLoader();
const MAX_PARTICLES = 500000;
const MAX_SIZE = 6;
let uniformsValues;
let animDirection = true;
let lastZoom;

let viewportSurfaceArea = window.innerWidth * window.innerHeight * 0.0000001;

const colorPallete = {
  color1: 0x69bc9f,
  color2: 0x74d5a7,
  color3: 0x84d6cd,
  color4: 0x9ce5f0,
  color5: 0xe1e9f1,
};

const params = {
  backgroundColor: 0xdfe9f2,
  particleColor: 0x4fcfae,
  particleCount: 80000,
  particleSize: 1.25,
  particleSizeVariation: 0.025,
  particlesWobble: 0.08,
  wobbleSpeed: 0.03,
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

// ------------------ Sampler --------------------

let surfaceMesh;
let sampler;
const _position = new THREE.Vector3();

init();
animate();

function init() {
  scene = new THREE.Scene();

  //---------------- Camera --------------------------

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 3000);
  camera.position.set(8, 25, 18);

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
  // renderer.setClearColor(params.backgroundColor);
  // renderer.setClearAlpha(0,0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //---------------- Controls --------------------------

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 18, 0);
  controls.enableDamping = true;
  lastZoom = 0;
  controls.addEventListener("change", () => {
    zoomResample();
  });
  // controls.autoRotate = true;
  // controls.autoRotateSpeed = 0.5;
  window.addEventListener("resize", onWindowResize);

  //---------------- GUI --------------------------

  // stats = new Stats();
  // document.body.appendChild(stats.dom);

  const gui = new GUI();
  const folder1 = gui.addFolder("Particles");
  folder1.add(params, "particleCount", 1000, 500000).onChange(resample).listen();
  folder1.add(params, "particleSize", 0, 5).onChange(changeParticleSize).listen();
  folder1.add(params, "particleSizeVariation", 0, 1, 0.01).onChange(changeParticleSize);
  folder1.add(params, "particlesWobble", 0, 1, 0.01);
  folder1.add(params, "wobbleSpeed", 0, 2, 0.01);
  gui.add(tweenParams, "startAnim");

  gui.close();

  buildSpaceParticles();
  buildParticles();
  zoomResample();
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
  uniformsValues["time"].value = performance.now() * params.wobbleSpeed * 0.0000001;
  uniformsValues["wobble"].value = params.particlesWobble;
  // uniformsValues.needsUpdate = true;
  renderer.render(scene, camera);
}
//---------------- Window resize --------------------------

function onWindowResize() {
  viewportSurfaceArea = window.innerWidth * window.innerHeight * 0.0000001;
  changeParticleSize();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function buildSpaceParticles() {
  let spaceParticlesGeo = new THREE.BufferGeometry();
  const sprite = new THREE.TextureLoader().load("img/pointSprite.png");

  for (let i = 0; i < 2000; i++) {
    const x = 1000 * Math.random() - 500;
    const y = 1000 * Math.random() - 500;
    const z = 1000 * Math.random() - 500;

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
  mat.color.set(params.particleColor);

  spaceParticles = new THREE.Points(spaceParticlesGeo, mat);
  scene.add(spaceParticles);
}

function buildParticles() {
  const pc = new THREE.Color(params.particleColor);
  geometry = new THREE.BufferGeometry();

  for (let j = 0; j < MAX_PARTICLES; j++) {
    vertices.push(0, 0, 0);
    partColors.push(pc.r, pc.g, pc.b);
    sizes.push(params.particleSize * viewportSurfaceArea + (Math.random() - 0.5) * 2 * params.particleSizeVariation);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(partColors, 3));
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));

  geometry.setDrawRange(0, params.particleCount);

  uniformsValues = {
    rimColor: { value: new THREE.Color("rgb(255, 255, 255)") },
    time: { value: 0.0 },
    wobble: { value: params.particlesWobble },
  };

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniformsValues,
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
    // blending: THREE.AdditiveBlending,
    // depthWrite: false,
    depthTest: true,
    transparent: true,
    vertexColors: true,
  });

  particles = new THREE.Points(geometry, shaderMaterial);
  particles.frustumCulled = false; ////  object visibility fixed
  scene.add(particles);
  loadMesh();
}

function loadMesh() {
  gltfLoader.load(
    meshURL,
    function (gltf) {
      // scene.add(gltf.scene);
      surfaceMesh = gltf.scene.children[0]; // Object
      // console.log(gltf);
      sampler = new MeshSurfaceSampler(surfaceMesh).setWeightAttribute("color").build();
      sampleSurface();
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened " + error);
    }
  );
}

function sampleSurface() {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    sampler.sample(_position);
    let v = new THREE.Vector3(_position.x, _position.y, _position.z);
    surfaceVerts.push(v);
  }
  surfaceScatter();
}

function surfaceScatter() {
  const positions = particles.geometry.attributes.position.array;
  let index = 0;

  for (let i = 0; i < MAX_PARTICLES; i++) {
    positions[index++] = surfaceVerts[i].x;
    positions[index++] = surfaceVerts[i].y;
    positions[index++] = surfaceVerts[i].z;
  }
  particles.geometry.attributes.position.needsUpdate = true;
  zoomResample();
}

function resample() {
  geometry.setDrawRange(0, params.particleCount);
  geometry.attributes.position.needsUpdate = true;
}

function zoomResample() {
  let dist = controls.getDistance();
  if (Math.abs(lastZoom - dist) > 1) {
    params.particleCount = (MAX_PARTICLES * 50) / (dist * dist);
    resample();
    params.particleSize = (MAX_SIZE * dist) / 70;
    changeParticleSize();
    lastZoom = dist;
  }
}

function changeParticleSize() {
  const sizes = geometry.attributes.size.array;

  for (let i = 0; i < geometry.attributes.size.array.length; i++) {
    sizes[i] = params.particleSize * viewportSurfaceArea + (Math.random() - 0.5) * 2 * params.particleSizeVariation;
  }
  geometry.attributes.size.needsUpdate = true;
}

function buildAnimation() {
  const positions = particles.geometry.attributes.position.array;

  let trans = tweenParams.transition;
  const originPoint = new THREE.Vector3(0);

  for (let i = 0; i < surfaceVerts.length; i++) {
    positions[i * 3] = surfaceVerts[i].x + (originPoint.x - surfaceVerts[i].x) * trans;
    positions[i * 3 + 1] = surfaceVerts[i].y + (originPoint.y - surfaceVerts[i].y) * trans;
    positions[i * 3 + 2] = surfaceVerts[i].z + (originPoint.z - surfaceVerts[i].z) * trans;
  }

  particles.geometry.attributes.position.needsUpdate = true;
}

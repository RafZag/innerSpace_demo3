import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "https://cdn.skypack.dev/three@0.137.0/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/libs/stats.module.js";
import { MeshSurfaceSampler } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/math/MeshSurfaceSampler.js";
// import { VertexNormalsHelper } from 'https://cdn.skypack.dev/three@0.132.0/examples/jsm/helpers/VertexNormalsHelper.js';

let camera, scene, renderer, stats, controls;
let particles;
let vertices = [];
let surfaceVerts = [];
let partColors = [];
let sizes = [];
let geometry = new THREE.BufferGeometry();
let shaderMaterial;
const meshURL = "gltf/human.glb";
const gltfLoader = new GLTFLoader();
const MAX_PARTICLES = 500000;

let viewportSurfaceArea = window.innerWidth * window.innerHeight * 0.0000001;

const params = {
  particleColor: 0x4fcfae,
  particleCount: 10000,
  surfaceColor: 0x999999,
  particleSize: 3,
  particleRes: 2,
  particleDist: 0.035,
  backgroundColor: 0xdfe9f2,
};

// ------------------ Sampler --------------------

let surfaceMesh;
let sampler;
const _position = new THREE.Vector3();

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 3000);
  camera.position.set(0, 24, 18);

  scene = new THREE.Scene();

  const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
  light1.position.set(0, 100, 250);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
  light2.position.set(0, -100, -250);
  scene.add(light2);

  scene.add(new THREE.AmbientLight(0x999999));

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //---------------- Render --------------------------

  renderer = new THREE.WebGLRenderer({ antyalias: true, alpha: true });
  // renderer.setClearColor(params.backgroundColor);
  // renderer.setClearAlpha(0,0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //---------------- Controls --------------------------

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 15, 0);
  controls.enableDamping = true;
  // controls.autoRotate = true;
  // controls.autoRotateSpeed = 0.5;
  window.addEventListener("resize", onWindowResize);

  //---------------- GUI --------------------------

  const gui = new GUI();
  const folder1 = gui.addFolder("Particles");
  folder1.add(params, "particleCount", 1000, 50000).onChange(resample);
  folder1.add(params, "particleSize", 0, 5).onChange(changeParticleSize);

  buildParticles();
}

//---------------- Animate --------------------------

function animate(time) {
  requestAnimationFrame(animate);
  render();
  controls.update();
  stats.update();
  TWEEN.update(time);
}

//---------------- Render --------------------------

function render() {
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

function buildParticles() {
  const pc = new THREE.Color(params.particleColor);
  geometry = new THREE.BufferGeometry();

  for (let j = 0; j < MAX_PARTICLES; j++) {
    vertices.push(0, 0, 0);
    partColors.push(pc.r, pc.g, pc.b);
    sizes.push(params.particleSize * viewportSurfaceArea);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(partColors, 3));
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));

  geometry.setDrawRange(0, params.particleCount);

  const uniforms = {
    rimColor: { value: new THREE.Color("rgb(255, 255, 255)") },
  };

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
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
}

function resample() {
  geometry.setDrawRange(0, params.particleCount);
  geometry.attributes.position.needsUpdate = true;
}

function changeParticleSize() {
  const sizes = geometry.attributes.size.array;

  for (let i = 0; i < geometry.attributes.size.array.length; i++) {
    sizes[i] = params.particleSize * viewportSurfaceArea;
  }
  geometry.attributes.size.needsUpdate = true;
}

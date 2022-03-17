import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/math/MeshSurfaceSampler.js";

class particleObject {
  parentContainer;
  position = new THREE.Vector3();
  rotation = new THREE.Vector3();
  scale = 1.0;
  spinRate = 0.2;
  floatRate = 0.5;
  uuid;

  visible = true;
  particles; // THREE.Points(); - main object added to scene
  vertices = []; // particles verts
  surfaceVerts = [];
  partColors = [];
  sizes = [];
  color;

  modelURL;
  gltfLoader = new GLTFLoader();
  geometry = new THREE.BufferGeometry();

  surfaceMesh;
  sampler;

  uniformsValues;

  lastZoom = 0;

  params = {
    particleColor: 0x4fcfae,
    particleCount: 20000,
    particleCntMult: 65,
    particleSize: 0.2,
    particleSizeMult: 0.44,
    particleSizeVariation: 0.025,
    particlesWobble: 0.08,
    wobbleSpeed: 0.03,
  };

  MAX_PARTICLES = 500000;
  MAX_SIZE = 6;

  constructor(parentContainer, model, col) {
    this.parentContainer = parentContainer;
    this.params.particleColor = new THREE.Color(col);
    this.modelURL = model;
    this.buildParticles();
  }

  buildParticles() {
    const pc = new THREE.Color(this.params.particleColor);

    for (let j = 0; j < this.MAX_PARTICLES; j++) {
      this.vertices.push(0, 0, 0);
      this.partColors.push(pc.r, pc.g, pc.b);
      this.sizes.push(this.params.particleSize);
    }

    this.geometry.setAttribute("color", new THREE.Float32BufferAttribute(this.partColors, 3));
    this.geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.vertices, 3));
    this.geometry.setAttribute("size", new THREE.Float32BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage));

    this.geometry.setDrawRange(0, this.params.particleCount);

    this.uniformsValues = {
      rimColor: { value: new THREE.Color("rgb(255, 255, 255)") },
      time: { value: 0.0 },
      wobble: { value: this.params.particlesWobble },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniformsValues,
      vertexShader: document.getElementById("vertexshader").textContent,
      fragmentShader: document.getElementById("fragmentshader").textContent,
      // blending: THREE.AdditiveBlending,
      // depthWrite: false,
      depthTest: true,
      transparent: true,
      vertexColors: true,
    });

    const sprite = new THREE.TextureLoader().load("img/pointAlpha.png");

    let mat = new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      // map: sprite,
      // blending: THREE.AdditiveBlending,
      depthTest: false,
      alphaTest: 0.1,
      alphaMap: sprite,
      transparent: true,
    });
    mat.color.set(this.params.particleColor);

    this.particles = new THREE.Points(this.geometry, shaderMaterial);
    this.uuid = this.particles.uuid;
    this.particles.frustumCulled = false; ////  object visibility fixed

    this.parentContainer.add(this.particles);
    this.loadMesh(this.modelURL);
  }

  loadMesh(url) {
    this.gltfLoader.load(
      url,
      function (gltf) {
        // this.parentContainer.add(gltf.scene);
        this.surfaceMesh = gltf.scene.children[0]; // Object
        // console.log(gltf);
        this.sampler = new MeshSurfaceSampler(this.surfaceMesh).setWeightAttribute("color").build();
        this.sampleSurface();
      }.bind(this),
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      function (error) {
        console.log("An error happened " + error);
      }
    );
  }

  sampleSurface() {
    let _position = new THREE.Vector3();
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.sampler.sample(_position);
      let v = new THREE.Vector3(_position.x, _position.y, _position.z);
      this.surfaceVerts.push(v);
    }
    this.surfaceScatter();
  }

  surfaceScatter() {
    const positions = this.particles.geometry.attributes.position.array;
    let index = 0;

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      positions[index++] = this.surfaceVerts[i].x;
      positions[index++] = this.surfaceVerts[i].y;
      positions[index++] = this.surfaceVerts[i].z;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  resample() {
    this.geometry.setDrawRange(0, this.params.particleCount);
    this.geometry.attributes.position.needsUpdate = true;
  }

  zoomResample(cam) {
    const dist = this.position.distanceTo(cam.position);
    // if (Math.abs(this.lastZoom - dist) > 1) {
    this.params.particleCount = (this.MAX_PARTICLES * this.params.particleCntMult) / (dist * dist);
    this.resample();
    this.params.particleSize = (this.MAX_SIZE * dist) / 500;
    this.changeParticleSize();
    // this.lastZoom = dist;
    // }
  }

  changeParticleSize() {
    let viewportSurfaceArea = window.innerWidth * window.innerHeight * 0.000001;

    const sizes = this.geometry.attributes.size.array;
    for (let i = 0; i < this.geometry.attributes.size.array.length; i++) {
      sizes[i] =
        this.params.particleSize * this.params.particleSizeMult * viewportSurfaceArea + (Math.random() - 0.5) * 2 * this.params.particleSizeVariation;
    }
    this.geometry.attributes.size.needsUpdate = true;
  }

  changeRimColor(col) {
    this.uniformsValues["rimColor"].value = col;
    this.uniformsValues.needsUpdate = true;
  }

  changeColor(col) {
    let c = new THREE.Color(col);
    const cols = this.geometry.attributes.color.array;
    for (let i = 0; i < this.geometry.attributes.size.array.length; i++) {
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    this.geometry.attributes.color.needsUpdate = true;
  }

  spin(speed) {
    this.particles.rotation.y = performance.now() * (speed * 0.0001);
  }
  float(speed) {
    this.particles.position.y += 0.1 * Math.sin(performance.now() * speed * 0.0001);
  }

  setScale(sc) {
    this.scale = sc;
    this.particles.scale.x = sc;
    this.particles.scale.y = sc;
    this.particles.scale.z = sc;
  }

  setPosition(vec) {
    this.position = vec;
    this.particles.position.x = vec.x;
    this.particles.position.y = vec.y;
    this.particles.position.z = vec.z;
  }

  setRotation(vec) {
    this.rotation = vec;
    this.particles.rotation.x = vec.x;
    this.particles.rotation.y = vec.y;
    this.particles.rotation.z = vec.z;
  }

  update() {
    // console.log(performance.now());
    this.spin(this.spinRate);
    if (this.scale != this.particles.scale.x) {
      const sc = this.scale - this.particles.scale.x;
      this.particles.scale.x += sc * 0.2;
      this.particles.scale.y += sc * 0.2;
      this.particles.scale.z += sc * 0.2;
    }
    // this.float(this.floatRate);
    this.uniformsValues["time"].value = performance.now() * this.params.wobbleSpeed * 0.0000008;
    this.uniformsValues["wobble"].value = this.params.particlesWobble;
    this.uniformsValues.needsUpdate = true;
  }
}

export { particleObject };

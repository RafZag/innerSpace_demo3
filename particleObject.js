import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/math/MeshSurfaceSampler.js";

class particleObject {
  scene;
  positon = new THREE.Vector3();
  rotation = new THREE.Vector3();

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
  _position = new THREE.Vector3();

  uniformsValues;

  params = {
    particleColor: 0x4fcfae,
    particleCount: 80000,
    particleSize: 0.25,
    particleSizeVariation: 0.025,
    particlesWobble: 0.08,
    wobbleSpeed: 0.03,
  };

  MAX_PARTICLES = 500000;
  MAX_SIZE = 6;

  constructor(scene, model, col) {
    this.scene = scene;
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
    this.particles.frustumCulled = false; ////  object visibility fixed

    this.scene.add(this.particles);
    this.loadMesh(this.modelURL);
  }

  loadMesh(url) {
    this.gltfLoader.load(
      url,
      function (gltf) {
        // this.scene.add(gltf.scene);
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
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.sampler.sample(this._position);
      let v = new THREE.Vector3(this._position.x, this._position.y, this._position.z);
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
    //zoomResample();
  }

  resample() {
    this.geometry.setDrawRange(0, this.params.particleCount);
    this.geometry.attributes.position.needsUpdate = true;
  }

  //   zoomResample() {
  //     let dist = controls.getDistance();
  //     if (Math.abs(lastZoom - dist) > 1) {
  //       params.particleCount = (MAX_PARTICLES * 50) / (dist * dist);
  //       resample();
  //       params.particleSize = (MAX_SIZE * dist) / 70;
  //       changeParticleSize();
  //       lastZoom = dist;
  //     }
  //   }

  //   changeParticleSize() {
  //     const sizes = this.geometry.attributes.size.array;
  //     for (let i = 0; i < geometry.attributes.size.array.length; i++) {
  //       sizes[i] = this.params.particleSize * viewportSurfaceArea + (Math.random() - 0.5) * 2 * this.params.particleSizeVariation;
  //     }
  //     geometry.attributes.size.needsUpdate = true;
  //   }

  update() {
    // console.log(performance.now());
    this.uniformsValues["time"].value = performance.now() * this.params.wobbleSpeed * 0.0000001;
    this.uniformsValues["wobble"].value = this.params.particlesWobble;
    this.uniformsValues.needsUpdate = true;
  }
}

export { particleObject };

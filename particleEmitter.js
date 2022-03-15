import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";

class particleEmitter {
  parentContainer;
  positon = new THREE.Vector3();
  direction = new THREE.Vector3(0, 0, 1);
  speed = 1;
  birthRate = 20;
  particleCount = 2000;

  particles; // THREE.Points(); - main object added to scene
  vertices = []; // particles verts
  partColors = [];
  sizes = [];
  directions = [];
  color = new THREE.Color(0x4fcfae);

  constructor(cont) {
    this.parentContainer = cont;
    this.positon.x = 10 * Math.random() - 5;
    this.positon.y = 10 * Math.random() - 5;
    this.positon.z = -100;
    this.buildEmitter();
  }

  buildEmitter() {
    let particlesParticlesGeo = new THREE.BufferGeometry();
    const sprite = new THREE.TextureLoader().load("img/pointSprite.png");

    for (let i = 0; i < this.particleCount; i++) {
      const x = this.positon.x;
      const y = this.positon.y;
      const z = this.positon.z;

      this.directions.push(Math.random() - 0.5, Math.random() - 0.5, Math.random());
      this.vertices.push(x, y, 0);
    }
    particlesParticlesGeo.setAttribute("position", new THREE.Float32BufferAttribute(this.vertices, 3));
    particlesParticlesGeo.setAttribute("direction", new THREE.Float32BufferAttribute(this.directions, 3));

    let mat = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: true,
      map: sprite,
      depthTest: false,
      transparent: true,
    });

    mat.color.set(this.color);
    this.particles = new THREE.Points(particlesParticlesGeo, mat);
    this.parentContainer.add(this.particles);
  }

  update() {
    let positions = this.particles.geometry.attributes.position.array;

    // const movex = this.directions.x * this.speed;
    // const movey = this.direction.y * this.speed;
    // const movez = this.direction.z * this.speed;

    for (let i = 0; i < positions.length; i++) {
      positions[i * 3] += this.directions[i * 3] * this.speed;
      positions[i * 3 + 1] += this.directions[i * 3 + 1] * this.speed;
      positions[i * 3 + 2] += this.directions[i * 3 + 2] * this.speed;
      if (positions[i * 3 + 2] > 10) {
        positions[i * 3] = 10 * Math.random() - 5;
        positions[i * 3 + 1] = 10 * Math.random() - 5;
        positions[i * 3 + 2] = -100;
      }
    }

    // console.log(positions[5 * 3 + 1]);
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}

export { particleEmitter };

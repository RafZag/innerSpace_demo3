import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";

class ambientParticles {
  parentContainer;
  pos = new THREE.Vector3();
  direction = new THREE.Vector3(0, 0, 1);
  speed = 4;
  birthRate = 20;
  particleCount = 2000;
  frontBirthDistane = -200;
  backBirthDistane = 20;
  flying = false;

  particles; // THREE.Points(); - main object added to scene
  vertices = []; // particles verts
  partColors = [];
  sizes = [];
  directions = [];
  color = new THREE.Color(0x4fcfae);

  constructor(cont) {
    this.parentContainer = cont;
    this.pos.z = -200;
    this.buildParticles();
  }

  buildParticles() {
    let particlesParticlesGeo = new THREE.BufferGeometry();
    const sprite = new THREE.TextureLoader().load("img/pointSprite.png");

    for (let i = 0; i < this.particleCount; i++) {
      const x = this.pos.x + 200 * Math.random() - 100;
      const y = this.pos.y + 200 * Math.random() - 100;
      const z = this.frontBirthDistane * Math.random();

      //const angle = Math.PI * 2 * Math.random();
      //this.directions.push(Math.cos(angle), Math.sin(angle), Math.random());
      this.vertices.push(x, y, z);
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

  stop() {
    if (this.flying) {
      this.speed *= 0.89;
      this.fly();
    }
    if (Math.abs(this.speed) < 0.01 && this.flying) {
      this.flying = false;
      console.log("stop!");
    }
  }

  fly() {
    if (!this.flying) this.flying = true;
    let positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i++) {
      positions[i * 3 + 2] += this.speed;
      if (positions[i * 3 + 2] > this.backBirthDistane) {
        positions[i * 3] = this.pos.x + 100 * Math.random() - 50;
        positions[i * 3 + 1] = this.pos.y + 100 * Math.random() - 50;
        positions[i * 3 + 2] = this.frontBirthDistane;
      }

      if (positions[i * 3 + 2] < this.frontBirthDistane) {
        positions[i * 3] = this.pos.x + 100 * Math.random() - 50;
        positions[i * 3 + 1] = this.pos.y + 100 * Math.random() - 50;
        positions[i * 3 + 2] = this.backBirthDistane;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  update() {}
}

export { ambientParticles };

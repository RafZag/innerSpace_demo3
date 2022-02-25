function loadImage() {
  loader.load(
    // resource URL
    imgURL,
    // onLoad callback
    function (image) {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      gridWidth = image.width;
      gridHeight = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      buildPixelGrid();
    },
    // onError callback
    function () {
      console.error("An error happened.");
    }
  );
}

function getPixel(imgData, x, y) {
  let position = (x + imgData.width * y) * 4,
    data = imgData.data;
  return { r: data[position], g: data[position + 1], b: data[position + 2], a: data[position + 3] };
}

function buildPixelGrid() {
  const color = new THREE.Color();
  const pc = new THREE.Color(params.particleColor);
  geometry = new THREE.BufferGeometry();

  particleCount = gridWidth * gridHeight;

  for (let j = 0; j < gridHeight; j++) {
    for (let i = 0; i < gridWidth; i++) {
      const x = i * params.particleDist - (params.particleDist * gridWidth) / 2;
      const y = j * params.particleDist - (params.particleDist * gridHeight) / 2;
      vertices.push(x, y, 0);

      let c = getPixel(imgData, i, j);
      color.setRGB(c.r / 255, c.g / 255, c.b / 255);
      // const col = new THREE.Color(params.particleColor);
      colors.push(color.r, color.g, color.b);
      partColors.push(pc.r, pc.g, pc.b);
      sizes.push(params.particleSize * viewportSurfaceArea);
    }
  }

  function disposeArray() {
    this.array = null;
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(partColors, 3));
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));

  const uniforms = {
    pointTexture: { value: new THREE.TextureLoader().load("img/pointAlpha.png") },
    rimColor: { value: new THREE.Color("rgb(255, 255, 255)") },
  };

  material = new THREE.PointsMaterial({
    size: params.particleSize,
    sizeAttenuation: true,
    map: colorTxt,
    alphaMap: alphaTxt,
    vertexColors: true,
    alphaTest: 0.5,
  });

  const shaderMaterial = new THREE.ShaderMaterial({
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
  scene.add(particles);

  buildPictureVerts();
  loadMesh();
}

function buildPictureVerts() {
  pictureVerts.length = 0;
  for (let i = 0; i < gridWidth * gridHeight; i++) {
    const xIndex = i % gridWidth;
    const yIndex = Math.floor(i / gridWidth);

    let v = new THREE.Vector3();
    v.x = xIndex * params.particleDist - (params.particleDist * gridWidth) / 2;
    v.y = yIndex * params.particleDist - (params.particleDist * gridHeight) / 2;
    v.z = -7;

    pictureVerts.push(camera.localToWorld(v));
  }
}

function makeTransition() {
  const positions = particles.geometry.attributes.position.array;
  const cols = particles.geometry.attributes.color.array;

  for (let i = 0; i < surfaceVerts.length; i++) {
    let c = new THREE.Color();
    const partCol = new THREE.Color(params.particleColor);
    const pixCol = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);

    c.lerpColors(partCol, pixCol, params.transition);

    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;

    positions[i * 3] = surfaceVerts[i].x + (pictureVerts[i].x - surfaceVerts[i].x) * params.transition;
    positions[i * 3 + 1] = surfaceVerts[i].y + (pictureVerts[i].y - surfaceVerts[i].y) * params.transition;
    positions[i * 3 + 2] = surfaceVerts[i].z + (pictureVerts[i].z - surfaceVerts[i].z) * params.transition;
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;
}

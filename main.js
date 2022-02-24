import * as THREE from "https://cdn.skypack.dev/three@0.132.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "https://cdn.skypack.dev/three@0.137.0/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/libs/stats.module.js";
import { MeshSurfaceSampler } from "https://cdn.skypack.dev/three@0.132.0/examples/jsm/math/MeshSurfaceSampler.js";
// import { VertexNormalsHelper } from 'https://cdn.skypack.dev/three@0.132.0/examples/jsm/helpers/VertexNormalsHelper.js';

let camera, scene, renderer, stats, controls;
let material, particles;
let vertices = [];
let surfaceVerts = [];
let pictureVerts = [];
let colors = [];
let partColors = [];
let sizes = [];
let geometry;
let gridWidth, gridHeight;
let particleCount;

const loader = new THREE.ImageLoader();
const imgURL = "img/braincells.png";
const alphaTxt = new THREE.TextureLoader().load("img/pointAlpha.png");
const colorTxt = new THREE.TextureLoader().load("img/pointColor.png");
let imgData;
let playAnim = false;
const meshURL = "gltf/human.glb";
const gltfLoader = new GLTFLoader();

let viewportSurfaceArea = window.innerWidth * window.innerHeight * 0.0000001;

const params = {
    particleColor: 0x4fcfae,
    particleCount: 20000,
    surfaceColor: 0x999999,
    particleSize: 1,
    particleRes: 2,
    particleDist: 0.035,
    backgroundColor: 0xdfe9f2,
    transition: 0,
    startAnim: function () {

        if (this.transition == 1){
            // controls.enabled = true;
            // controls.autoRotate = true;

            particles.material.map = colorTxt;            
            particles.material.vertexColors = false;
            particles.material.needsUpdate = true;

            tween.to({ transition: 0 }).start();
        }
        if (this.transition == 0) {
            // controls.enabled = false;
            // controls.autoRotate = false;

            particles.material.map = null;            
            particles.material.vertexColors = true;
            particles.material.needsUpdate = true;

            buildPictureVerts();
            tween.to({ transition: 1 }).start();
        }
        playAnim = !playAnim;
    },
};

let tween = new TWEEN.Tween(params)
.to({ transition: 1 })
.easing(TWEEN.Easing.Quartic.Out)
.onComplete(()=>{
    if (params.transition == 1) console.log("complete!")
})
.onUpdate(() => {
    makeTransition();
})

// ------------------ Sampler --------------------

let surfaceMesh;
let sampler;
const _position = new THREE.Vector3();
const _matrix = new THREE.Matrix4();
const _scale = new THREE.Vector3();

loadImage();

init();
animate();

function init() {
camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
camera.position.set(0, 8, 6);
// camera.lookAt(0, 5, 0);

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
// scene.add(surface);

//---------------- Render --------------------------

renderer = new THREE.WebGLRenderer({ antyalias: true, alpha: true });
// renderer.setClearColor(params.backgroundColor);
// renderer.setClearAlpha(0,0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0,5,0);
controls.enableDamping = true;
// controls.autoRotate = true;
// controls.autoRotateSpeed = 0.5;
window.addEventListener("resize", onWindowResize);

//---------------- GUI --------------------------

const gui = new GUI();
const folder1 = gui.addFolder("Particles");
    // folder1.add(params, "transition", 0, 1).onChange(makeTransition);
    folder1.add(params, "particleSize", 0, 3).onChange(changeParticleSize);
    // gui.add(params, "startAnim");
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

function loadMesh() {
    gltfLoader.load(
        // resource URL
        meshURL,
        // called when the resource is loaded
        function (gltf) {
            // scene.add(gltf.scene);
            // gltf.animations; // Array<THREE.AnimationClip>
            // gltf.scene; // THREE.Group
            // gltf.scenes; // Array<THREE.Group>
            // gltf.cameras; // Array<THREE.Camera>
            surfaceMesh = gltf.scene.children[0]; // Object
            console.log(gltf);
            sampler = new MeshSurfaceSampler(surfaceMesh).setWeightAttribute("color").build();            
            
            sampleSurface();
        },
        // called while loading is progressing
        function (xhr) {
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        // called when loading has errors
        function (error) {
            console.log("An error happened " + error);
        }
    );
}

function sampleSurface() {
    for (let i = 0; i < particleCount; i++) {
        sampler.sample(_position);
        let v = new THREE.Vector3(_position.x, _position.y, _position.z);
        surfaceVerts.push(v); //
    }
    //console.log(surfaceVerts);
    surfaceScatter();
}

function surfaceScatter() {
    
    const positions = particles.geometry.attributes.position.array;

    let index = 0;

    for (let i = 0; i < surfaceVerts.length; i++) {
        positions[index++] = surfaceVerts[i].x;
        positions[index++] = surfaceVerts[i].y;
        positions[index++] = surfaceVerts[i].z;
    }    

    particles.geometry.attributes.position.needsUpdate = true;
}

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
    let position = (x + imgData.width * y) * 4, data = imgData.data;
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
    geometry.setAttribute("size", new THREE.Float32BufferAttribute( sizes, 1 ).setUsage( THREE.DynamicDrawUsage ) );

    const uniforms = {
        pointTexture: { value: new THREE.TextureLoader().load( 'img/pointAlpha.png' ) },
        rimColor: {value: new THREE.Color("rgb(255, 255, 255)")}
    };

    material = new THREE.PointsMaterial({
        size: params.particleSize,
        sizeAttenuation: true,
        map: colorTxt,
        alphaMap: alphaTxt,
        vertexColors: true,
        alphaTest: 0.5,
    });    

    const shaderMaterial = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

        // blending: THREE.AdditiveBlending,
        // depthWrite: false,
        depthTest: true,
        transparent: true,
        vertexColors: true

    } );

    particles = new THREE.Points(geometry, shaderMaterial);
    scene.add(particles);
   
    buildPictureVerts();
    loadMesh();
}

function buildPictureVerts() {
    pictureVerts.length = 0    
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

function changeParticleSize() {

    // material.size = params.particleSize;
    const sizes = geometry.attributes.size.array;

    for ( let i = 0; i < geometry.attributes.size.array.length; i ++ ) {
        sizes[i] = params.particleSize * viewportSurfaceArea;
    }
    geometry.attributes.size.needsUpdate = true;        


}

function changeParams() {
    const positions = particles.geometry.attributes.position.array;

    let x, y, z, index;
    x = y = z = index = 0;

    for (let i = 0; i < gridWidth * gridHeight; i++) {
        const xIndex = i % gridWidth;
        const yIndex = Math.floor(i / gridWidth);

        positions[index++] = xIndex * params.particleDist - (params.particleDist * gridWidth) / 2;
        positions[index++] = yIndex * params.particleDist - (params.particleDist * gridHeight) / 2;
        positions[index++] = 0;
    }

    particles.geometry.attributes.position.needsUpdate = true;
}
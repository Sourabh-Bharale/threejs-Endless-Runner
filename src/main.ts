
import {
  WebGLRenderer, PerspectiveCamera, Scene, BoxGeometry, MeshPhongMaterial, Mesh, DirectionalLight,
} from 'three';

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new WebGLRenderer({
  canvas: document.getElementById('app') as HTMLCanvasElement,
  antialias: true,
  precision: 'mediump',
});

const mainCamera = new PerspectiveCamera(60, width / height, 0.1, 1000);
function onWindowResize() {
  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

renderer.setSize(width, height);

const geometry = new BoxGeometry();
const material = new MeshPhongMaterial({ color: 0x0000ff });
const cube = new Mesh(geometry, material);
cube.position.z = -5;
const scene = new Scene();

scene.add(cube);
const light = new DirectionalLight(0xFFFFFF, 1);
light.position.z = 2;
scene.add(light);

renderer.render(scene, mainCamera);

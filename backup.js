import * as THREE from "three";
import { Player, PlayerController, ThirdPersonCamera } from "./player.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"; //MESH
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'; //WARNA

class Main {
  static init() {
    var canvasRef = document.getElementById("canvas");

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasRef,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000);
    this.renderer.shadowMap.enabled = true;

    // plane
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshPhongMaterial({ color: 0xffffff })
    );

    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.castShadow = true;
    this.scene.add(plane);

    // DIrectional lighting
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.castShadow = true;
    directionalLight.position.set(3, 10, 10);
    this.scene.add(directionalLight);

    var thirdPerson = new ThirdPersonCamera(
      this.camera,
      new THREE.Vector3(-5, 5, 0),
      new THREE.Vector3(0, 0, 0)
    );

  
    var controller = new PlayerController();

    this.player = new Player (
        thirdPerson, controller, this.scene
    )


    this.generateMap();
  }

  static render(dt) {
    this.player.update(dt)
    this.renderer.render(this.scene, this.camera);
  }


  static generateMap(){
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      './objek/aquarium/materials.mtl', // Path to your MTL file
      (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          './objek/aquarium/model.obj', // Path to your OBJ file
          (object) => {
            object.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            // Set the scale for the entire object
            object.scale.set(20, 20, 20); // Adjust the scale values as needed
            this.scene.add(object);
          },
          (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          },
          (error) => {
            console.error('An error happened', error);
          }
        );
      })

  }


}

var clock = new THREE.Clock();
Main.init();

function animate() {
  Main.render(clock.getDelta());
  requestAnimationFrame(animate);

  if (orbitControls) {
    orbitControls.update();
  }
  renderer.render(this._scene, camera);
}

requestAnimationFrame(animate);


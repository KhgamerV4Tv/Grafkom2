import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// var _APP = null;
var isBallMode = false;

class CameraController{
	constructor(camera, target){
		this._camera = camera;
		this._target = target;
		this._xmove = 0;
		this._ymove = 0;
		this._zoom = 0;

		this._prevX = 0;
		this._prevY = 0;
		this._isHold = false;
		this._degree = 0;
		this._degreeSum = 0;

		this._Initialize();
	}

	_Initialize(){
		// WASD
		window.addEventListener('keydown', (e)=>{
			let v = new THREE.Vector3();
			v.copy(this._target).sub(this._camera.position);
			
			let u = new THREE.Vector3(0, 1, 0);
			let w = new THREE.Vector3();
			w.copy(v).cross(u)
		
			v.multiplyScalar(0.01);
			w.multiplyScalar(0.01);
		
			if(e.key == 'w'){
				this._camera.position.add(v);
				this._target.add(v);

				if(_APP._isCameraCollide()){
					this._camera.position.sub(v);
					this._target.sub(v);
				}
			}
			if(e.key == 's'){
				this._camera.position.sub(v);
				this._target.sub(v);

				if(_APP._isCameraCollide()){
					this._camera.position.add(v);
					this._target.add(v);
				}
			}
			if(e.key == 'a'){
				this._camera.position.sub(w);
				this._target.sub(w);

				if(_APP._isCameraCollide()){
					this._camera.position.add(w);
					this._target.add(w);
				}
			}
			if(e.key == 'd'){
				this._camera.position.add(w);
				this._target.add(w);

				if(_APP._isCameraCollide()){
					this._camera.position.sub(w);
					this._target.sub(w);
				}
			}
			if(e.key == ' '){
				isBallMode = !isBallMode;
				if(isBallMode){
					this._camera.position.x = _APP._ballBB.center.x - 20;
					this._camera.position.y = _APP._ballBB.center.y + 30;
					this._camera.position.z = _APP._ballBB.center.z - 20;
					this._camera.lookAt(_APP._ballBB.center);
				}
				else{
					this._camera.position.set(150, 35, 0);
				}
			}
			if(e.key == 'q'){
				this._degree += 2;
			}
			if(e.key == 'e'){
				this._degree -= 2;
			}
		});

		// Zoom
		window.addEventListener('wheel', (e)=>{
			let amount = e.deltaY;
			this._zoom += amount;
			this._zoom = Math.max(-1000, Math.min(1000, this._zoom));
		})

		// Left & Right View
		window.addEventListener('mousedown', (e)=>{
			this._isHold = true;
		})
		window.addEventListener('mouseup', (e)=>{
			this._isHold = false;
		})
		window.addEventListener('mousemove', (e)=>{
			if(this._isHold){
				this._xmove += (e.clientX - this._prevX);
				this._ymove += (e.clientY - this._prevY);
		
				this._ymove = Math.max(-1000, Math.min(1000, this._ymove));
			}
			this._prevX = e.clientX;
			this._prevY = e.clientY;
		})

		// Animation
		const keyframes = [
			{ start: { x: 11, y: 25, z: 32 }, end: { x: 3, y: 25, z: -34 } },
			{ start: { x: -30, y: 10, z: -30 }, end: { x: 30, y: 10, z: -30 } },
			{ start: { x: 25, y: 20, z: -10}, end: { x: -30, y:20, z: -10}},
			{ start: { x: 10, y: 40, z: 50}, end: { x: -10, y:10, z: -30}},
		];
		const duration = 15000;
		const tweens = [];

		for (let i = 0; i < keyframes.length; i++) {
			const { start, end } = keyframes[i];

			const tween = new TWEEN.Tween(start)
				.to(end, duration / keyframes.length) 
				.easing(TWEEN.Easing.Quadratic.InOut)
				.onUpdate(() => {
					this._camera.position.set(start.x, start.y, start.z)
					this._target.set(0, 10, 0);
					if(i == 0){
						this._target.set(-148, 30, 0);
					}
					if(i == 1){
						this._target.set(10, 10, 6);
					}
					if(i == 2){
						this._target.set(50, 0, -72);
					}
					if(i == 3){
						this._target.set(40, 1, 92);
					}
				});

			tweens.push(tween);
		}
		for (let i = 0; i < tweens.length - 1; i++) {
			tweens[i].chain(tweens[i + 1]);
		}

		tweens[0].start();
		tweens[tweens.length - 1].onComplete(() => {
			this._camera.position.set(150, 35, 0);
			this._target.set(0, 20, 0);
		});


	}

	_Update(){
		TWEEN.update();

		let u = new THREE.Vector3();
		u.copy(this._target).sub(this._camera.position);
		let v = new THREE.Vector3(0, 1, 0);
		let w = new THREE.Vector3();
		let initLength = u.length();
		w.copy(u).cross(v);

		let add1 = new THREE.Vector3();
		add1.copy(w).multiplyScalar(0.01 * this._xmove);
		this._xmove = 0;
		this._target.add(add1)

		let w2 = new THREE.Vector3();
		w2.copy(u).cross(w);

		let add2 = new THREE.Vector3();
		add2.copy(w2).multiplyScalar(0.00005 * this._ymove);
		this._ymove = 0;
		this._target.add(add2);

		let u2 = new THREE.Vector3();
		u2.copy(this._target).sub(this._camera.position);
		let mul = initLength / u2.length();
		let add3 = new THREE.Vector3();
		add3.copy(u2).multiplyScalar(mul);

		this._target.copy(this._camera.position).add(add3);

		let u3 = new THREE.Vector3();
		u3.copy(this._target).sub(this._camera.position);
		let add4 = new THREE.Vector3();
		add4.copy(u3).multiplyScalar(0.0005 * this._zoom);
		this._camera.position.add(add4);
		this._zoom = 0;

		console.log(this._camera.position);
		this._camera.lookAt(this._target);
	
                        
              console.log(this._target);
		if(isBallMode){			
			this._degreeSum += this._degree;
			let xs = Math.sin(THREE.MathUtils.degToRad(this._degreeSum));
			let zs = Math.cos(THREE.MathUtils.degToRad(this._degreeSum));
			
			// console.log(this._degreeSum)
			this._camera.position.x = _APP._ballBB.center.x + xs * 30;
			this._camera.position.y = _APP._ballBB.center.y + 40;
			this._camera.position.z = _APP._ballBB.center.z + zs * 30;

			// console.log(xs + " , " + zs);
			


			if(_APP._isCameraCollide()){
				this._degreeSum -= this._degree;
				let xs = Math.sin(THREE.MathUtils.degToRad(this._degreeSum));
				let zs = Math.cos(THREE.MathUtils.degToRad(this._degreeSum));
				
				this._camera.position.x = _APP._ballBB.center.x + xs * 30;
				this._camera.position.y = _APP._ballBB.center.y + 40;
				this._camera.position.z = _APP._ballBB.center.z + zs * 30;
			}

			this._degree = 0;

			this._camera.lookAt(_APP._ballBB.center)
		}
	}
}


class BasicWorldDemo {
	constructor() {
		this._Initialize();
	}

	_Initialize() {
		this._threejs = new THREE.WebGLRenderer({
			antialias: true,
		});
		this._threejs.shadowMap.enabled = true;
		this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
		this._threejs.setPixelRatio(window.devicePixelRatio);
		this._threejs.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this._threejs.domElement);

		window.addEventListener('resize', () => {
			this._OnWindowResize();
		}, false);

		// Camera
		const fov = 60;
		const aspect = 1920 / 1080;
		const near = 1.0;
		const far = 1000.0;
		this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this._camera.position.set(150, 35, 0);

		// Scene
		this._scene = new THREE.Scene();

		// Camera controller
		this._cameraController = new CameraController(this._camera, new THREE.Vector3(0, 20, 0));

		// Collision Box
		this._obstacleBB = [];
		this._ballBB;
		this._camBB;
		this._lowBB;

		this._RAF();
		this.generateMap();
	}

	async generateMap(){
		async function loadFBXModel(path) {
			return new Promise((resolve, reject) => {
				const fbxLoader = new FBXLoader();
				fbxLoader.load(
					path,
					function (object) {
						object.traverse((child) => {
							if (child.isMesh) {
								child.castShadow = true;   // Enable casting shadows
								child.receiveShadow = true; // Enable receiving shadows
							}
						});
						resolve(object);
					},
					undefined,
					function (error) {
						reject(error);
					}
				);
			});
		}
		async function loadMTLAndOBJ(mtlPath, objPath) {
			return new Promise((resolve, reject) => {
				const mtlLoader = new MTLLoader();
				mtlLoader.load(
					mtlPath,
					(materials) => {
						materials.preload();
						const objLoader = new OBJLoader();
						objLoader.setMaterials(materials);
						objLoader.load(
							objPath,
							(object) => {
								object.traverse((child) => {
									if (child.isMesh) {
										child.castShadow = true;
										child.receiveShadow = true;
									}
								});
		
								object.scale.set(1, 1, 1);
								object.position.set(0, 0, 0);
								object.rotation.set(0, 0, 0);
								resolve(object);
							},
							undefined,
							(error) => {
								reject(error);
							}
						);
					},
					undefined,
					(error) => {
						reject(error);
					}
				);
			});
		}

		// Ambient Light
		var ambientLight = new THREE.AmbientLight(0xFFFFFF, .3);
		this._scene.add(ambientLight);

		// Directional Light
		var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.castShadow = true;
		directionalLight.position.set(100, 60, 0);
		directionalLight.target.position.set(0, 20, 0);
		this._scene.add(directionalLight);
		var directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 10);
		// this._scene.add(directionalLightHelper)

		const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight2.position.set(50, 50, 50); // Position the light
		directionalLight2.target.position.set(0, 0, 0); // Point the light at the origin
		directionalLight2.castShadow = true; // Enable shadows
		
		// Configure shadow properties
		directionalLight2.shadow.mapSize.width = 1024;
		directionalLight2.shadow.mapSize.height = 1024;
		directionalLight2.shadow.camera.near = 0.5;
		directionalLight2.shadow.camera.far = 500;
		directionalLight2.shadow.camera.left = -50;
		directionalLight2.shadow.camera.right = 50;
		directionalLight2.shadow.camera.top = 50;
		directionalLight2.shadow.camera.bottom = -50;
		
		// Add the directional light and its target to the scene
		this._scene.add(directionalLight2);
		this._scene.add(directionalLight2.target);
		
		// Ground
		const groundGeometry = new THREE.PlaneGeometry(200, 200);
		const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false });
		const ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y -= 10
		ground.receiveShadow = true;
		// this._scene.add(ground);

		// Lower Cube
		var lowerCube = new THREE.Mesh(
			new THREE.BoxGeometry(150, 3, 150),
			new THREE.MeshPhongMaterial({color:0xefefef}),
		)
		lowerCube.castShadow = true;
		lowerCube.receiveShadow = true;
		this._scene.add(lowerCube);

		this._lowBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		this._lowBB.setFromObject(lowerCube);


		// right Cube
		var rightCube = new THREE.Mesh(
			new THREE.BoxGeometry(150, 50, 3),
			new THREE.MeshPhongMaterial({color:0xefefef}),
		)
		rightCube.castShadow = true;
		rightCube.receiveShadow = true;
		rightCube.position.z -= 73.5
		rightCube.position.y += 25
		this._scene.add(rightCube);

		let rightCubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		rightCubeBB.setFromObject(rightCube);
		this._obstacleBB.push(rightCubeBB);


		// left Cube
		var leftCube = new THREE.Mesh(
			new THREE.BoxGeometry(150, 50, 3),
			new THREE.MeshPhongMaterial({color:0xefefef}),
		)
		leftCube.castShadow = true;
		leftCube.receiveShadow = true;
		leftCube.position.z += 73.5
		leftCube.position.y += 25
		this._scene.add(leftCube);

		let leftCubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		leftCubeBB.setFromObject(leftCube);
		this._obstacleBB.push(leftCubeBB);


		// back cube
		var backCube = new THREE.Mesh(
			new THREE.BoxGeometry(3, 50, 150),
			new THREE.MeshPhongMaterial({color:0xefefef}),
		)
		backCube.castShadow = true;
		backCube.receiveShadow = true;
		backCube.position.y += 25
		backCube.position.x -= 73.5
		this._scene.add(backCube);

		let backCubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		backCubeBB.setFromObject(backCube);
		this._obstacleBB.push(backCubeBB);


		// front cube
		var frontCube = new THREE.Mesh(
			new THREE.BoxGeometry(3, 50, 150),
			new THREE.MeshPhongMaterial({color:0xefefef}),
		)
		frontCube.position.y += 25
		frontCube.position.x += 76.5
		frontCube.material.transparent = true;
		frontCube.material.opacity = 0;
		this._scene.add(frontCube);

		let frontCubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		frontCubeBB.setFromObject(frontCube);
		this._obstacleBB.push(frontCubeBB);


		// ball
		var ballTexture = new THREE.TextureLoader().load('objek/texture/basketball.jpg')
		var ball = new THREE.Mesh(
			new THREE.SphereGeometry(5, 32, 32),
			new THREE.MeshPhongMaterial({color:0xffdddd, map:ballTexture})
		)
		this._scene.add(ball);
		ball.position.y += 6;
		ball.position.z += 30;
		ball.position.x += 10;
		ball.castShadow = true;
		ball.receiveShadow = true;

		this._ballBB = new THREE.Sphere(ball.position, 5);


		let isBallStopped = false;

		document.addEventListener('keydown', (e) => {
			if (e.key == 'ArrowUp') {
				ball.position.x--;
				ball.rotation.z += THREE.MathUtils.degToRad(10);

				if(isBallMode){
					this._camera.position.x--;
				}
		
				if (this._isBallCollide() || this._isCameraCollide()) {
					if(isBallMode){
						this._camera.position.x++;
					}
					ball.position.x++;  // Revert to the original position
					ball.rotation.z -= THREE.MathUtils.degToRad(10);  // Revert to the original rotation
				}
			}
			if (e.key == 'ArrowDown') {
				ball.position.x++;
				ball.rotation.z -= THREE.MathUtils.degToRad(10);
		
				if(isBallMode){
					this._camera.position.x++;
				}
				if (this._isBallCollide() || this._isCameraCollide()) {
					if(isBallMode){
						this._camera.position.x--;
					}
					ball.position.x--;  // Revert to the original position
					ball.rotation.z += THREE.MathUtils.degToRad(10);  // Revert to the original rotation
				}
			}
			if (e.key == 'ArrowLeft') {
				ball.position.z++;
				ball.rotation.x += THREE.MathUtils.degToRad(10);
		
				if(isBallMode){
					this._camera.position.z++;
				}
				if (this._isBallCollide() || this._isCameraCollide()) {
					if(isBallMode){
						this._camera.position.z--;
					}
					ball.position.z--;  // Revert to the original position
					ball.rotation.x -= THREE.MathUtils.degToRad(10);  // Revert to the original rotation
				}
			}
			if (e.key == 'ArrowRight') {
				ball.position.z--;
				ball.rotation.x -= THREE.MathUtils.degToRad(10);
		
				if(isBallMode){
					this._camera.position.z--;
				}
				if (this._isBallCollide() || this._isCameraCollide()) {
					if(isBallMode){
						this._camera.position.z++;
					}
					ball.position.z++;  // Revert to the original position
					ball.rotation.x += THREE.MathUtils.degToRad(10);  // Revert to the original rotation
				}
			}
		});
		


		// Table Lamp
		var tableLamp = await loadFBXModel('objek/lamp/Table_Lamp.fbx');
		tableLamp.scale.set(0.2, 0.2, 0.2)
		tableLamp.position.y += 18;
		tableLamp.position.z -= 32;
		tableLamp.position.x += 35;
		tableLamp.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    child.material.color.set(0xa21f30); 
                    child.material.needsUpdate = true; 
					child.castShadow = true;
					child.receiveShadow = true;
                }
            }
        });
		this._scene.add(tableLamp)

		// Create a Point Light
		const pointLight = new THREE.PointLight(0xffff66, 1000, 200); // color, intensity, distance
		pointLight.position.set(0, 19, 0);
		pointLight.castShadow = true;
		tableLamp.add(pointLight);
	

		// Table
		var table = await loadFBXModel('objek/coffee-table/Coffee_Table.fbx');
		table.scale.set(0.4, 0.4, 0.4)
		table.position.y += 19;
		table.position.x -=40;
		table.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    child.material.color.set(0x65350f); 
                    child.material.needsUpdate = true; 
					child.castShadow = true;
					child.receiveShadow = true;
                }
            }
        });
		this._scene.add(table)

		var tableCube = new THREE.Mesh(
			new THREE.BoxGeometry(25, 40, 48),
			new THREE.MeshPhongMaterial({color:0x000000}),
		)
		tableCube.position.x = table.position.x
		tableCube.position.y = table.position.y
		tableCube.position.z = table.position.z
		tableCube.material.transparent = true;
		tableCube.material.opacity = 0
		this._scene.add(tableCube);

		let tableCubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		tableCubeBB.setFromObject(tableCube);
		this._obstacleBB.push(tableCubeBB);


		// Load the aquarium model
		const aquarium = await loadMTLAndOBJ('./objek/aquarium/FishTank.mtl', './objek/aquarium/FishTank.obj');
		table.add(aquarium);
		aquarium.scale.set(25, 25, 25);
		aquarium.position.x -= 10;



		// Sofa
		const sofa = await loadMTLAndOBJ('objek/sofa/F2_Furni_SofaAntique.mtl', 'objek/sofa/F2_Furni_SofaAntique.obj');
		this._scene.add(sofa)
		sofa.scale.set(3, 3, 3)
		sofa.position.z -= 72;
		sofa.position.x += 50;

		var sofaCube = new THREE.Mesh(
			new THREE.BoxGeometry(47, 50, 48),
			new THREE.MeshPhongMaterial({color:0x000000}),
		)
		sofaCube.position.x = sofa.position.x - 24
		sofaCube.position.y = sofa.position.y
		sofaCube.position.z = sofa.position.z
		sofaCube.material.transparent = true;
		sofaCube.material.opacity = 0
		this._scene.add(sofaCube);

		let sofaCubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		sofaCubeBB.setFromObject(sofaCube);
		this._obstacleBB.push(sofaCubeBB);

		var sofaCube2 = new THREE.Mesh(
			new THREE.BoxGeometry(20, 50, 20),
			new THREE.MeshPhongMaterial({color:0x000000}),
		)
		sofaCube2.position.x = sofa.position.x - 15
		sofaCube2.position.y = sofa.position.y
		sofaCube2.position.z = sofa.position.z + 40
		sofaCube2.material.transparent = true;
		sofaCube2.material.opacity = 0;
		this._scene.add(sofaCube2);

		let sofaCube2BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		sofaCube2BB.setFromObject(sofaCube2);
		this._obstacleBB.push(sofaCube2BB);

		

		// TV
		const tv = await loadMTLAndOBJ('objek/Flat-Screen TV/F2_Furni_TVLCD.mtl', 'objek/Flat-Screen TV/F2_Furni_TVLCD.obj');
		tv.scale.set(3,3,3)
		tv.rotation.y += THREE.MathUtils.degToRad(225)
		tv.position.z += 92;
		tv.position.y += 1;
		tv.position.x += 40;
		this._scene.add(tv)
		
		var tvLight = new THREE.PointLight(0xffffff, 1000, 10000);
		tvLight.castShadow = true;
		tvLight.position.y += 25;
		tvLight.position.z += 35;
		tvLight.position.x += 40;
		this._scene.add(tvLight)

		var tvCube = new THREE.Mesh(
			new THREE.BoxGeometry(55, 90, 10),
			new THREE.MeshPhongMaterial({color:0x000000}),
		)
		tvCube.position.x = tv.position.x
		tvCube.position.y = tv.position.y
		tvCube.position.z = tv.position.z - 35
		tvCube.material.transparent = true;
		tvCube.material.opacity = 0
		this._scene.add(tvCube);

		let tvCubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
		tvCubeBB.setFromObject(tvCube);
		this._obstacleBB.push(tvCubeBB);	
	}

	_isBallCollide(){
		for(let i = 0; i < this._obstacleBB.length;i++){
			if(this._ballBB.intersectsBox(this._obstacleBB[i])){
				return true;
			}
		}
		return false;
	}

	_isCameraCollide(){
		let ans = false;
		for(let i = 0; i < this._obstacleBB.length;i++){
			if(i==3) continue;
			if(this._camBB.intersectsBox(this._obstacleBB[i])){
				ans =  true;
			}
		}

		if(this._camBB.intersectsBox(this._lowBB)) ans = true;
		// if(isBallMode) ans = false;
		return ans;
	}

	_OnWindowResize() {
		this._camera.aspect = window.innerWidth / window.innerHeight;
		this._camera.updateProjectionMatrix();
		this._threejs.setSize(window.innerWidth, window.innerHeight);
	}

	_RAF() {
		requestAnimationFrame(() => {
			this._cameraController._Update();
			this._camBB = new THREE.Sphere(this._camera.position, 1);
			this._threejs.render(this._scene, this._camera);
			this._RAF();
		});
	}
}
// 3
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
	_APP = new BasicWorldDemo();
});
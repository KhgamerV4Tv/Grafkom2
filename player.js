import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js"

export class Player {
    constructor(camera, controller, scene) {
        this.camera = camera;
        this.controller = controller
        this.scene = scene;
        this.rotationVector = new THREE.Vector3();

        this.animations = {}
        this.state = 'idle'

        this.camera.setup(new THREE.Vector3(0, 0, 0), this.rotationVector);
        

        // this.mesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshPhongMaterial({ color: 0xFF1111})
        // );
        // this.mesh.receiveShadow = true;
        // this.mesh.castShadow = true;
        // //this.mesh.position.set(0, 5, 0)
        // this.scene.add(this.mesh)
        this.loadModel()
    }

    loadModel() {
        var loader = new FBXLoader();
        loader.setPath("../objek/Perenang/")
        loader.load("idle.fbx", (fbx) => {
            fbx.scale.setScalar(0.01)
            fbx.traverse(c => {
                c.castShadow = true;
            })
            this.mesh = fbx
            this.scene.add(this.mesh)

            this.mixer = new THREE.AnimationMixer(this.mesh)
            var onLoad = (animName, anim) => {
                var clip = anim.animations[0]
                var action = this.mixer.clipAction(clip)

                this.animations[animName] = {
                    clip:clip,
                    action:action
                }
            }

            var loader = new FBXLoader();
            loader.setPath("../objek/Perenang/")
            loader.load('idle.fbx', (fbx) => {onLoad('idle', fbx)})
            loader.load('Swimming.fbx', (fbx) => {onLoad('Swimming', fbx)})
        })
    }

    update(dt) {

        if(!this.mesh) return
        var direction = new THREE.Vector3(0, 0 ,0);
        if(this.controller.key['forward']) {
            direction.x = 1;
        }
        if(this.controller.key['backward']) {
            direction.x = -1;
        }
        if(this.controller.key['left']) {
            direction.z = 1;
        }
        if(this.controller.key['right']) {
            direction.z = -1;
        }

        var dtMouse = this.controller.deltaMousePos
        dtMouse.x = dtMouse.x / Math.PI
        dtMouse.y = dtMouse.y / Math.PI
        this.rotationVector.y += dtMouse.x * dt * 50;
        this.rotationVector.z += dtMouse.y * dt * 50;
        this.mesh.rotation.y = this.rotationVector.y;

        if(direction.length() == 0){
            if(this.animations['idle']) {
                if(this.state != 'idle') {
                    this.mixer.stopAllAction();
                    this.state = 'idle'
                }
                this.mixer.clipAction(this.animations['idle'].clip).play()
                this.mixer.update(dt)
            }
        } else {
            if(this.animations['Swimming']) {
                if(this.state != 'Swimming') {
                    this.mixer.stopAllAction();
                    this.state = 'Swimming'
                }
                this.mixer.clipAction(this.animations['Swimming'].clip).play()
                this.mixer.update(dt)
            }
        }

        var forwardVector = new THREE.Vector3(1, 0, 0)
        var rightVector = new THREE.Vector3(0, 0 ,1)
        forwardVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVector.y);
        rightVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVector.y)
        this.mesh.position.add(forwardVector.multiplyScalar(dt * 10 * direction.x));
        this.mesh.position.add(rightVector.multiplyScalar(dt * 10 * direction.z));

        this.camera.setup(this.mesh.position, this.rotationVector);
    }
}

export class PlayerController {
    constructor() {
        this.key = {
            "forward": false,
            "backward": false,
            "left": false,
            "right": false
        };
        this.mousePos = new THREE.Vector2();
        this.mouseDown = false;
        this.deltaMousePos = new THREE.Vector2();

        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
        document.addEventListener("keyup", (e) => this.onKeyUp(e), false);

        document.addEventListener("mousemove", (e) => this.onMouseMove(e), false)
        document.addEventListener("mousedown", (e) => this.onMouseDown(e), false)
        document.addEventListener("mouseup", (e) => this.onMouseUp(e), false)
    }

    onMouseDown(event) {
        this.mouseDown = true

    }

    onMouseUp(event) {
        this.mouseDown = false
    }

    onMouseMove(event) {
        var currentMousePos = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 -1,
            -(event.clientY / window.innerHeight) * 2 +1
        )

        this.deltaMousePos.addVectors(currentMousePos, this.mousePos.multiplyScalar(-1))
        this.mousePos.copy(currentMousePos)
        console.log(this.deltaMousePos)
    }


    onKeyDown(event) {
        switch(event.key) {
            case "W":
            case "w": this.key["forward"] = true; break;
            case "S":
            case "s": this.key["backward"] = true; break;
            case "A":
            case "a": this.key["right"] = true; break;
            case "D":
            case "d": this.key["left"] = true; break;
        }
        console.log(event)
    }
    onKeyUp(event) {
        switch(event.key) {
            case "W":
            case "w": this.key["forward"] = false; break;
            case "S":
            case "s": this.key["backward"] = false; break;
            case "A":
            case "a": this.key["right"] = false; break;
            case "D":
            case "d": this.key["left"] = false; break;
        }
    }
}

export class ThirdPersonCamera {
    constructor(camera, positionOffset, targetOffSet) {
        this.camera = camera;
        this.positionOffset = positionOffset;
        this.targetOffSet = targetOffSet;
    }
    setup(target, angle){
        var temp = new THREE.Vector3();
        temp.copy(this.positionOffset)
        temp.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle.y)
        temp.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle.z)
        temp.addVectors(target, temp)
        this.camera.position.copy(temp);

        temp = new THREE.Vector3();
        temp.addVectors(target, this.targetOffSet);
        this.camera.lookAt(temp);
    }
}
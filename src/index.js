import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { PhysicsController } from './physics';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mode } from 'babel-core/lib/transformation/file/options/config';
import { Chance } from 'chance';
export class main {
    
    init() {
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.chance = require('chance').Chance();
        this.camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
        this.camera.position.set(30,30,100);
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(new THREE.Color(0xEEEEEE));
        renderer.shadowMap.enabled = true;
        this.renderer = renderer;
        document.body.appendChild(renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animationMixers = [];
        this.fishArr = [];

        this.createLights();
        this.createPlane();
        for(var i = 0; i < 5; i++){
            let rand = this.chance.integer({min: -30, max: 30});
            let depth = this.chance.integer({min: -7, max: -3});
            this.createFish(rand, depth);
        }
        this.animate();
    }
    createLights(){
        this.spotLight = new THREE.SpotLight(0xFFFFFF);
		this.light = new THREE.AmbientLight( 0x404040 ); // soft white light
		this.scene.add( this.light );
		this.spotLight.position.set(30, 30, 100);
		// fogColor = new THREE.Color(0xffffff);
		// scene.fog = new THREE.Fog(fogColor, 1, 20);
		this.spotLight.shadow.mapSize.width = 2024; // default is 512
		this.spotLight.shadow.mapSize.height = 2024; // default is 512
    }
    createPlane(){
        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshPhysicalMaterial({
            color: 0x000080,
            metalness: 0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
        }));
        this.plane.rotation.x = Math.PI / 2;
        this.scene.add(this.plane);
        //console.log("Coordinates:",this.plane.position.x, " ", this.plane.position.y, " ", this.plane.position.z);
    }
    
    createFish(randNum, randNum2){
        const loader = new GLTFLoader();
        loader.load( 'fish/scene.gltf', ( gltf ) => {
            const model = gltf.scene;
            const fish = new THREE.Object3D();
            fish.add(model);
            model.scale.set(1, 1, 1);
            fish.position.y = randNum2;
            fish.rotation.y = Math.random() * (2 * Math.PI) - Math.PI;
            fish.position.x = randNum;
            fish.position.z = randNum;
            this.fishArr.push(fish);
            this.scene.add(fish);
            // Create an AnimationMixer, and get the list of AnimationClip instances
            const mixer = new THREE.AnimationMixer( model );
            const clips = gltf.animations;
            this.animationMixers.push(mixer);

            // Play a specific animation
            const clip = THREE.AnimationClip.findByName( clips, 'ArmatureAction' );
            const action = mixer.clipAction( clip );
            action.timeScale = 2;
            action.play();

        }, undefined, ( error ) => {
	        console.error( error );
        } );
    }
    animate(){
        const deltaSeconds = this.clock.getDelta();
        this.controls.update();
        for(let mixer of this.animationMixers){
            mixer.update( deltaSeconds );
        }
        for(let fish of this.fishArr){
            fish.translateZ( 0.05 );
            if( fish.position.z >= 30 || fish.position.z <= -30 || fish.position.x >= 30 || fish.position.x <= -30){
                fish.rotateY(1);
            }
        }
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}
const module = new main();
module.init();

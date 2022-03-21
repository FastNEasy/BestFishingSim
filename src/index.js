import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import waterNormal from '/assets/waternormals.jpg';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mode } from 'babel-core/lib/transformation/file/options/config';
import { Chance } from 'chance';
import { DoubleSide } from 'three';
import * as dat from 'dat.gui';

export class main {
    init() {
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.chance = require('chance').Chance();
        this.camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
        this.camera.position.set(0,30,0);
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(new THREE.Color(0xEEEEEE));
        renderer.shadowMap.enabled = true;
        this.renderer = renderer;
        document.body.appendChild( renderer.domElement );
        this.sun = new THREE.Vector3();
        this.boatObj = new THREE.Object3D();
        //sound things
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        //For fishes
        this.fishArr = [];//fishes swimming freely
        this.animationMixers = [];
        this.caughtFish = [];//fishes caught (to be displayed on screen)
        this.howDeep = 0;//depth of how deep you want the hook to go
        this.travelDistance = 0;
        //Score things
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.scoreElement.innerHTML = "Fish caught: " + this.score;
        this.fishCaughtElement = document.getElementById('fishCaught');
        this.fishCaughtElement.innerHTML = "You caught a fish!";
        this.frameWait = 5000;
        this.framesUntilHide = Math.round(Math.random() * this.frameWait);
        //for collisions
        this.colFish;
        this.colBait;
        //GUI things
        var gui = new dat.GUI({name: 'My GUI'});
        gui.autoPlace;
        const config = {hookDepth: 1};
        gui.add(config,"hookDepth", 1, 30, 1);
        gui.add({
            add: () => {
                this.howDeep = -config.hookDepth;
                console.log("new depth is: ", this.howDeep);
                if(this.bait){
                    if(this.bait.visible == false){
                        this.bait.visible = true;
                    }
                    this.bait.position.x = this.boat.position.x - 10;
                    this.bait.position.y = 4;
                    this.bait.position.z = this.boat.position.z - 10;
                    this.travelDistance = this.bait.position.y - this.howDeep;
                }
            }
        }, 'add').name("Lower the hook!");
        //TODO: add logic that if hook is cast, you cant drive for that moment
        //TODO: check collisions between the hook and fishes
        // Water
        const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
    
        this.water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load(waterNormal, function ( texture ) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    
                } ),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                side: DoubleSide,
                transparent: true,
                opacity: 0.1,
                fog: this.scene.fog !== undefined
            }
        );
    
        this.water.rotation.x = - Math.PI / 2;
        this.scene.add( this.water );
    
        //debesis
        this.sky = new Sky();
        this.sky.scale.setScalar( 10000 );
        this.scene.add( this.sky );
    
        const skyUniforms = this.sky.material.uniforms;
    
        skyUniforms[ 'turbidity' ].value = 10;
        skyUniforms[ 'rayleigh' ].value = 2;
        skyUniforms[ 'mieCoefficient' ].value = 0.005;
        skyUniforms[ 'mieDirectionalG' ].value = 0.8;
    
    
        this.pmremGenerator = new THREE.PMREMGenerator( renderer );

        this.controls = new OrbitControls( this.camera, renderer.domElement );
        this.controls.maxPolarAngle = Math.PI * 0.495;
        this.controls.target.set( 0, 10, 0 );
        this.controls.minDistance = 40.0;
        this.controls.maxDistance = 200.0;
        //this.controls.enabled = false;
        this.controls.update();
    
        const waterUniforms = this.water.material.uniforms;
        this.loadSound();
        //Boat sounds
        this.soundIdle = this.loadBoatSounds('sounds/boat_idle.mp3');
        this.soundMove = this.loadBoatSounds('sounds/boat_move.mp3');
        //score sound
        this.soundCaught = this.loadScoreSound('sounds/fish_caught_2.mp3');
        //
        this.updateSun();
        this.setupEvents();
        for(var i = 0; i < 75; i++){
            let rand = this.chance.integer({min: -200, max: 200});//gives a fish random start position
            let depth = this.chance.integer({min: -40, max: -5});//depth of the fish spawn
            this.createFish(rand, depth, i);// izveido zivi
        }
        this.loadBoat();
        this.loadFishingRod();
        this.createFishingBait();
        this.render();
        this.animate();
    }
    createFish(randNum, randNum2, i){//zius izveide TODO: pievienot collision box
        const loader = new GLTFLoader();
        loader.load( 'fish/scene.gltf', ( gltf ) => {
            const model = gltf.scene;
            const fish = new THREE.Object3D();
            fish.add(model);
            model.scale.set(1, 1, 1);
            fish.name = "fish" + i.toString();
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
    loadSound(){
        const sound = new THREE.Audio( this.listener );
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( 'sounds/ocean.mp3', function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( true );
            sound.setVolume( 0.8 );
            sound.play();
        });
    }
    loadBoatSounds(soundSrc){
        const sound = new THREE.Audio( this.listener );
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( soundSrc, function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( true );
            sound.setVolume( 0.45 );
        });
        return sound;
    }
    loadScoreSound(soundSrc){
        const sound = new THREE.Audio( this.listener );
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( soundSrc, function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 0.8 );
        });
        return sound;
    }
    updateSun() {
        const parameters = {
            elevation: 2,
            azimuth: 180
        }    
        const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
        const theta = THREE.MathUtils.degToRad( parameters.azimuth );

        this.sun.setFromSphericalCoords( 1, phi, theta );

        this.sky.material.uniforms[ 'sunPosition' ].value.copy( this.sun );
        this.water.material.uniforms[ 'sunDirection' ].value.copy( this.sun ).normalize();
        this.scene.environment = this.pmremGenerator.fromScene( this.sky ).texture;
    }
    createFishingBait(){
        const loader = new GLTFLoader();
        loader.load( 'fishing_hook/scene.gltf', ( gltf ) => {
            this.bait = gltf.scene;
            this.bait.rotateY(90);
            this.bait.name = "bait";
            this.bait.position.set(-1, 8, -16);
            this.bait.scale.set(0.5, 0.5, 0.5);
            //this.scene.add(model);
            this.scene.add(this.bait);
            this.bait.visible = false;
        }, undefined, ( error ) => {
	        console.error( error );
        } );
    }

    loadBoat(){
        this.loader = new GLTFLoader();
        this.loader.load('boat/scene.gltf', ( gltf ) => {
            this.boat = gltf.scene;
            this.boatObj.add(this.boat);
            this.scene.add( this.boatObj);
            this.boat.position.set(0,-0.5,0);
            this.boat.scale.set(300,300,300);
            this.boat.rotateY(90);
            this.boat.name = "boat";
            this.speed = {
                velocity: 0,
                rotation: 0
            };
        }, undefined,  ( error ) => {
            console.error( error );
        } );
    }
    loadFishingRod(){
        const loader = new GLTFLoader();
        loader.load( 'fishing_rod/scene.gltf', ( gltf ) => {
            const model = gltf.scene;
            model.scale.set(0.04, 0.04, 0.04);
            model.rotateY(90);
            model.name = "rod";
            this.boatObj.add(model);
            model.position.set(0, 4, 0);
            //this.scene.add(model);

        }, undefined, ( error ) => {
	        console.error( error );
        } );
    }
    
    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        window.addEventListener( 'keydown' ,(e) =>{
            if(e.key == "w"){
                this.speed.velocity = 0.25;
                if(this.soundIdle.isPlaying){
                    this.soundIdle.stop();
                }
                if(this.soundMove.isPlaying == false){
                    this.soundMove.play();
                }
            }
            if(e.key == "s"){
                this.speed.velocity = -0.25;
                if(this.soundIdle.isPlaying){
                    this.soundIdle.stop();
                }
                if(this.soundMove.isPlaying == false){
                    this.soundMove.play();
                }
            }
            if(e.key == "d"){
                this.speed.rotation = 0.01;
                
            }
            if(e.key == "a"){
                this.speed.rotation = -0.01;
            }
        });

        window.addEventListener('keyup', (e)=>{
            if(e.key == "w"){
                this.speed.velocity = 0;
                if(this.soundMove.isPlaying){
                    this.soundMove.stop();
                }
            }
            if(e.key == "s"){
                this.speed.velocity = 0;
                if(this.soundMove.isPlaying){
                    this.soundMove.stop();
                }
            }
            if(e.key == "d"){
                this.speed.rotation = 0;
            }
            if(e.key == "a"){
                this.speed.rotation = 0;
            }
            if(this.soundIdle.isPlaying == false){
                this.soundIdle.play();
            }
        });
    }

    animate() {
        const deltaSeconds = this.clock.getDelta();
        for(let mixer of this.animationMixers){
            mixer.update( deltaSeconds );
        }
        if(this.fishCaughtElement.hidden == false){
            if(--this.framesUntilHide == 0){
                this.fishCaughtElement.hidden = true;
            }
        }
        for(let fish of this.fishArr){
            if(this.caughtFish.includes(fish)){
                fish.translateZ( 0 );
                this.fishArr.splice(this.fishArr.indexOf(fish), 1);
                this.score += 1;
                this.scoreElement.innerHTML = "Fish caught: " + this.score;
                //this.scene.remove(fish);
            }else{
                fish.translateZ( 0.05 );
                if( fish.position.z >= 200 || fish.position.z <= -200 || fish.position.x >= 200 || fish.position.x <= -200){
                    fish.rotateY(1);
                }
            }  
        }
        if(this.howDeep <= -1){
            if(this.howDeep < this.bait.position.y){
                this.bait.position.y -= Math.min( 0.05, this.travelDistance);
                //console.log("Current y: ", this.bait.position.y);
            }
        }  
        requestAnimationFrame(() => this.animate());
        this.render();
        this.update();
    }

    render() {
        this.water.material.uniforms[ 'time' ].value += 0.2 / 60.0;
        this.renderer.render( this.scene, this.camera );
    }

    update(){
        if(this.boatObj.children.length > 1){
            this.boatObj.children[1].rotation.y += this.speed.rotation;
            this.boatObj.children[1].translateX(this.speed.velocity);//the boat
            this.boatObj.children[0].rotation.y += this.speed.rotation;
            this.boatObj.children[0].translateX(this.speed.velocity);//the fishing rod
            if( this.boatObj.children[1].position.z >= 200 || this.boatObj.children[1].position.z <= -200 || this.boatObj.children[1].position.x >= 200 || this.boatObj.children[1].position.x <= -200){
                this.boatObj.children[1].rotation.y += 180;
                this.boatObj.children[0].rotation.y += 180;
            }
            //this.camera.lookAt(this.boat.position);
        }
        for(let fishObj of this.fishArr){
            if(this.bait){
                this.colFish = new THREE.Box3().setFromObject(fishObj);
                this.colBait = new THREE.Box3().setFromObject(this.bait);
                var collision = this.colBait.intersectsBox(this.colFish);
                if(collision){
                    console.log("Fish: ", fishObj.name, " was touched by bait");
                    if(this.soundCaught.isPlaying == false){
                        this.soundCaught.play();
                        this.fishCaughtElement.hidden = false;
                        this.bait.position.y = 4;
                        this.bait.visible = false;
                    }
                    this.caughtFish.push(fishObj);
                    continue;
                }
                
            }
        }
    }
}
const module = new main();
module.init();














// import * as THREE from 'three';
// import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
// import * as dat from 'dat.gui';
// import { PhysicsController } from './physics';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { mode } from 'babel-core/lib/transformation/file/options/config';



import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import waterNormal from '/assets/waternormals.jpg';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Chance } from 'chance';





export class main {
    init() {

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
        this.camera.position.set( 30, 30, 100 );
        this.sun = new THREE.Vector3();
        var renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer = renderer;
        document.body.appendChild( renderer.domElement );
        
        //ūdens
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
        this.controls.update();
    
        const waterUniforms = this.water.material.uniforms;

        this.updateSun();
        this.setupEvents();
        this.animate();
        this.render();

        //ielādē laivas modeli
        const loader = new GLTFLoader();
        loader.load('/boat/scene.gltf', ( gltf ) => {
            this.boat = gltf.scene;
            this.scene.add( this.boat );
            this.boat.position.set(5,0,50);
            this.boat.scale.set(300,300,300);
            this.boat.rotateY(90);
            this.speed = {
                velocity: 0,
                rotation: 0,
            }
        }, undefined,  ( error ) => {

            console.error( error );

        } );
    }
    //saule
    updateSun() {
        const parameters = {
            elevation: 2,
            azimuth: 180
        };
    
        const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
        const theta = THREE.MathUtils.degToRad( parameters.azimuth );

        this.sun.setFromSphericalCoords( 1, phi, theta );

        this.sky.material.uniforms[ 'sunPosition' ].value.copy( this.sun );
        this.water.material.uniforms[ 'sunDirection' ].value.copy( this.sun ).normalize();
        this.scene.environment = this.pmremGenerator.fromScene( this.sky ).texture;
    }
    
    //key events
    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener( 'keydown' ,(e) =>{
            if(e.key == "w"){
                this.speed.velocity = 1
            }
            if(e.key == "s"){
                this.speed.velocity = -1
            }
            if(e.key == "d"){
                this.speed.rotation = 0.05
            }
            if(e.key == "a"){
                this.speed.rotation = -0.05
            }
        });
        window.addEventListener('keyup', (e)=>{
            this.speed.rotation = 0;
            this.speed.velocity = 0;
        })
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.render();
        this.update();
    }

    render() {
        this.water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
        this.renderer.render( this.scene, this.camera );
    }

    update(){
        if(this.boat){
            this.boat.rotation.y += this.speed.rotation;
            this.boat.translateX(this.speed.velocity)
        }
    }
}
const module = new main();
module.init();














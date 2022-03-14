import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { PhysicsController } from './physics';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mode } from 'babel-core/lib/transformation/file/options/config';
export class main {
    
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.set(5,5,5);
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
        this.createPlane();
    }
    createPlane(){
        var geometry = new THREE.BoxGeometry( 100, 100, 100 );
        var material = new THREE.MeshPhysicalMaterial( { 
            color: 0xff0000 , 
            opacity: 0.5,
            transparent: false,
        } );
        this.cube = new THREE.Mesh( geometry, material );

        this.scene.add( this.cube );
    }
    animate(){
        this.controls.update();
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}
const module = new main();
module.init();

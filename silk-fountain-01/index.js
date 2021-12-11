import * as THREE from 'three';
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import SilkShader from './shaders/SilkShader';
import metaversefile from 'metaversefile';
//const { useFrame, useLocalPlayer, useCleanup, /*useUi,*/ usePhysics} = metaversefile;
const { useFrame, useLoaders, usePhysics} = metaversefile;


export default () => {  

    const rootScene = new THREE.Object3D();
    const silkShaderMaterial = createShaderMaterial();
    
    const createShaderMaterial = () => {

        let testSilkTexture = new THREE.TextureLoader().load( './textures/silk/silk-contrast-noise.png' );
        testSilkTexture.wrapS = testSilkTexture.wrapT = THREE.RepeatWrapping;

        SilkShader.uniforms.noiseImage.value = testSilkTexture;

        const silkShaderMat = new THREE.ShaderMaterial({
            uniforms: SilkShader.uniforms,
            vertexShader: SilkShader.vertexShader,
            fragmentShader: SilkShader.fragmentShader,
        })

        return silkShaderMat;
    }

    loadModel( { 
        filePath: './',
        fileName: 'Silk_Fountain_Dream_1.glb',
        pos: { x: 0, y: 0, z: 0 },
    } ).then ( 
        result => {
            rootScene.add( result );
        }
    )

    const loadModel = ( params ) => {

        return new Promise( ( resolve, reject ) => {
                
            //const loader = new GLTFLoader();
            const {gltfLoader} = useLoaders();
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath( "./draco-decoder/" );
            gltfLoader.setDRACOLoader( dracoLoader );
    
            gltfLoader.load( params.filePath + params.fileName, function( gltf ) {
    
                let numVerts = 0;
    
                gltf.scene.traverse( function ( child ) {
    
                    if ( child.isMesh ) {
    
                        numVerts += child.geometry.index.count / 3;  
    
                        if( child.name == 'Silk-low' ){
                        
                            child.material = silkShaderMaterial;
                            
                            child.material.side = THREE.FrontSide;
                            child.castShadow = true;
                            child.receiveShadow = true;
    
                        } else {
                            child.material.side = THREE.DoubleSide;
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.material.roughness = 1;
                            child.material.metalness = 0.0;
                            // add light scatter chunk
                        }
                    }
                });
    
                console.log( `modelLoaded() -> ${ params.fileName } num verts: ` + numVerts );
    
                gltf.scene.position.set( params.pos.x, params.pos.y, params.pos.z  );

                resolve( gltf.scene );     
            });
        })
    }

    useFrame(( {timestamp} ) => {

        silkShaderMaterial.uniforms.time.value += 0.02;

    });

    return rootScene;
}


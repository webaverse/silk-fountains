import * as THREE from 'three';
import SilkShader from './shaders/SilkShader.js';
import metaversefile from 'metaversefile';
//const { useFrame, useLocalPlayer, useCleanup, /*useUi,*/ usePhysics} = metaversefile;
const {useApp, useFrame, useLoaders, usePhysics, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 


export default () => {  

    const app = useApp();
    const physics = usePhysics();
    const physicsIds = [];
    
    const createShaderMaterial = () => {

        let testSilkTexture = new THREE.TextureLoader().load( baseUrl + "textures/silk/silk-contrast-noise.png",
        function(){}, undefined, function( err ){ 'Silk Fountain 01 - error loading texture ' + err } );
        testSilkTexture.wrapS = testSilkTexture.wrapT = THREE.RepeatWrapping;

        SilkShader.uniforms.noiseImage.value = testSilkTexture;

        const silkShaderMat = new THREE.ShaderMaterial({
            uniforms: SilkShader.uniforms,
            vertexShader: SilkShader.vertexShader,
            fragmentShader: SilkShader.fragmentShader,
        })

        return silkShaderMat;
    }

    const silkShaderMaterial = createShaderMaterial();

    const loadModel = ( params ) => {

        return new Promise( ( resolve, reject ) => {
                
            //const loader = new GLTFLoader();
            const { gltfLoader } = useLoaders();
            const { dracoLoader } = useLoaders();
            //dracoLoader.setDecoderPath( baseUrl + "draco-decoder/" );
            gltfLoader.setDRACOLoader( dracoLoader );
    
            gltfLoader.load( params.filePath + params.fileName, function( gltf ) {
    
                let numVerts = 0;
    
                gltf.scene.traverse( function ( child ) {

                    const physicsId = physics.addGeometry( child );
                    physicsIds.push( physicsId );
    
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
    
                console.log( `Silk Fountain 01 modelLoaded() -> ${ params.fileName } num verts: ` + numVerts );
    
                gltf.scene.position.set( params.pos.x, params.pos.y, params.pos.z  );

                resolve( gltf.scene );     
            });
        })
    }

    loadModel( { 
        filePath: baseUrl,
        fileName: 'Silk_Fountain_Dream_1.glb',
        pos: { x: 0, y: 0, z: 0 },
    } ).then ( 
        result => {
            app.add( result );
        }
    )

    useFrame(( { timestamp } ) => {
        console.
        silkShaderMaterial.uniforms.time.value += 0.02;

    });

    useCleanup(() => {
      for (const physicsId of physicsIds) {
       physics.removeGeometry(physicsId);
      }
    });

    return app;
}

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var brain3d = (function() {

    var container = document.getElementById("brain3d");
    var stats;
    var camera, controls, scene, scene2, renderer, brain, brain2;

    init();
    animate();

    function init() {

        camera = new THREE.PerspectiveCamera( 60, $(container).width() / $(container).height(), 0.01, 1e10 );
        camera.position.set(115, 115, 115);

        scene = new THREE.Scene();
        scene2 = new THREE.Scene();

        scene.add( camera );

        // light

        var dirLight = new THREE.DirectionalLight( 0xaaaaaa );
        dirLight.position.set( 200, 200, 1000 ).normalize();
        camera.add( dirLight );
        camera.add( dirLight.target );

        var texture = new THREE.TextureLoader().load('img/brain_texture.jpg');


        var brainMaterial = new THREE.MeshPhongMaterial( { color: 0xe3b9a1, side: THREE.DoubleSide, opacity: 1.0, transparent: true } );
        var brainMaterial2 = new THREE.MeshPhongMaterial( { color: 0xe3b9a1, side: THREE.BackSide, opacity: 0.2, transparent: true } );

        var scale = 0.000001;
        var vtkLoader = new THREE.VTKLoader();
        vtkLoader.load( "models/jubrain-mpm-surf.vtk", function ( geometry ) {

            geometry.center();
            geometry.computeVertexNormals();

            brain = new THREE.Mesh( geometry, brainMaterial );
            brain.rotation.set(-Math.PI/2, 0, 0);
            brain.scale.multiplyScalar( scale );
            scene.add( brain );

            brain2 = new THREE.Mesh( geometry, brainMaterial2 );
            brain2.rotation.set(-Math.PI/2, 0, 0);
            brain2.scale.multiplyScalar( scale );
            brain2.renderOrder = 1000;
            brain2.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
            scene.add( brain2 );
        } );

        // Build renderer
        renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( $(container).width(), $(container).height() );
        renderer.sortObjects = false;
        //renderer.setClearColor( 0xffffff, 0);
        renderer.autoClear = false;
        //renderer.context.disable(renderer.context.DEPTH_TEST);

        // Build container
        container.appendChild( renderer.domElement );
        stats = new Stats();
        //container.appendChild( stats.dom );

        // On resize: Resize
        window.addEventListener( 'resize', onWindowResize, false );

        // Build controls
        controls = new THREE.OrbitControls( camera, container );
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.autoRotate = true;

    }

    function onWindowResize() {

        camera.aspect = $(container).width() / $(container).height();
        camera.updateProjectionMatrix();

        renderer.setSize( $(container).width(), $(container).height() );


        if ("handleResize" in controls) {
            controls.handleResize();
        }

    }

    function animate() {

        requestAnimationFrame( animate );

        controls.update();

        renderer.render( scene, camera );

        renderer.clearDepth();
        renderer.render( scene2, camera );

        stats.update();

    }

    return {
        addNode: function(node, color) {
            var partMaterial = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                opacity: 0.5,
                transparent: true,
                wireframe: false
            });

            if (typeof(node.mesh) == "undefined") {
                var mesh = new THREE.Mesh();
                mesh.material = partMaterial;
                scene2.add(mesh);
                node.mesh = mesh;
                mesh.node = node;

                var stlLoader = new THREE.STLLoader();
                stlLoader.load("models/" + node.original.model + ".stl", function (geometry) {

                    geometry.computeVertexNormals(true);
                    geometry.translate(-89.5, -110, -103);
                    geometry.rotateX(Math.PI / 2);
                    geometry.rotateY(-Math.PI);

                    mesh.geometry = geometry;

                });
            } else {
                node.mesh.material = partMaterial;
                scene2.add(node.mesh);
            }

        },

        removeNode: function(node) {
            scene2.remove(node.mesh);
        },

        removeNodes: function(nodes) {
            for (node in nodes) {
                this.removeNode(node);
            }
        },

        addNodes: function(nodes) {
            for (node in nodes) {
                this.addNode(node);
            }
        }
    }
})();

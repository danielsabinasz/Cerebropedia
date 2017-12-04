
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var brain3d = (function() {

    var views = {
        "3d": {
            "pos": new THREE.Vector3(0, 0, -1)
        },
        "left_lateral": {
            "pos": new THREE.Vector3(-1, 0, 0)
        },
        "right_lateral": {
            "pos": new THREE.Vector3(1, 0, 0)
        },
        "dorsal": {
            "pos": new THREE.Vector3(0, 1, 0)
        },
        "ventral": {
            "pos": new THREE.Vector3(0, -1, 0)
        },
        "anterior": {
            "pos": new THREE.Vector3(0, 0, -1)
        },
        "posterior": {
            "pos": new THREE.Vector3(0, 0, 1)
        }
    }

    var containers = {};
    var cameras = {};
    var scenes = {};
    var scenes_brain_regions = {};
    var renderers = {};
    var lights = {};
    var default_opacity = 0.2;

    var controls;

    init();
    animate();

    function init() {
        var camera_distance = 200;

        for (var view in views) {
            containers[view] = document.getElementById("container_" + view);
            scenes[view] = new THREE.Scene();
            scenes_brain_regions[view] = new THREE.Scene();

            // Camera
            cameras[view] = new THREE.PerspectiveCamera( 60, $(containers[view]).width() / $(containers[view]).height(), 0.01, 1e10 );
            var camera_pos = views[view]["pos"].normalize().multiplyScalar(camera_distance);
            cameras[view].position.set(camera_pos.x, camera_pos.y, camera_pos.z);
            cameras[view].lookAt(new THREE.Vector3(0, 0, 0));
            scenes[view].add( cameras[view] );

            // Light
            lights[view] = new THREE.DirectionalLight( 0xaaaaaa );
            lights[view].position.set( 1, 1, 1 ).normalize();
            cameras[view].add( lights[view] );

            // Build renderer
            renderers[view] = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
            renderers[view].setPixelRatio( window.devicePixelRatio );
            renderers[view].setSize( $(containers[view]).width(), $(containers[view]).height() );
            renderers[view].sortObjects = false;
            renderers[view].autoClear = false;
            containers[view].appendChild( renderers[view].domElement );
        }

        // Brain material
        //var brain_texture = new THREE.TextureLoader().load('img/brain_texture.jpg');
        var brain_material_outside = new THREE.MeshPhongMaterial( { color: 0xe3b9a1, side: THREE.DoubleSide, opacity: 1.0, transparent: true } );
        var brain_material_inside = new THREE.MeshPhongMaterial( { color: 0xe3b9a1, side: THREE.BackSide, opacity: default_opacity, transparent: true } );

        // Load brain model
        var scale = 0.00000100;
        var vtkLoader = new THREE.VTKLoader();
        vtkLoader.load( "models/jubrain-mpm-surf.vtk", function ( geometry ) {

            geometry.center();
            geometry.computeVertexNormals();

            for (var view in views) {

                var brain_outside = new THREE.Mesh( geometry, brain_material_outside );
                brain_outside.rotation.set(-Math.PI/2, 0, 0);
                brain_outside.scale.multiplyScalar( scale );
                scenes[view].add( brain_outside );
            }

            var brain_inside = new THREE.Mesh( geometry, brain_material_inside );
            brain_inside.rotation.set(-Math.PI/2, 0, 0);
            brain_inside.scale.multiplyScalar( scale );
            brain_inside.renderOrder = 1000;
            brain_inside.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
            scenes["3d"].add( brain_inside );
        } );


        //stats = new Stats();
        //container.appendChild( stats.dom );

        // On resize: Resize
        window.addEventListener( 'resize', onWindowResize, false );

        // Build controls
        controls = new THREE.OrbitControls( cameras["3d"], containers["3d"] );
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.autoRotate = true;

    }

    function onWindowResize() {
        for (var view in views) {
            cameras[view].aspect = $(containers[view]).width() / $(containers[view]).height();
            cameras[view].updateProjectionMatrix();
            renderers[view].setSize( $(containers[view]).width(), $(containers[view]).height() );
        }



        /*if ("handleResize" in controls) {
            controls.handleResize();
        }*/

    }

    function animate() {

        requestAnimationFrame( animate );
        controls.update();

        for (var view in views) {
            renderers[view].render( scenes[view], cameras[view] );
            renderers[view].clearDepth();
            renderers[view].render( scenes_brain_regions[view], cameras[view] );
        }

        // Render regions on top of 3D view
        //renderers["3d"].clearDepth();
        //renderers["3d"].render( scene_brain_regions, cameras["3d"] );
    }



    return {
        addNode: function(node, color) {
            var brain_region_material_solid = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                opacity: 0.5,
                transparent: true,
                wireframe: false
            });
            brain_region_material_opaque = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                opacity: 0.2,
                transparent: true,
                wireframe: false
            });

            if (typeof(node.meshes) == "undefined") {
                node.meshes = {};
                node.meshes_opaque = {};

                for (var view in views) {

                    var mesh = new THREE.Mesh();
                    mesh.node = node;
                    node.meshes[view] = mesh;

                    mesh = new THREE.Mesh();
                    mesh.node = node;
                    node.meshes_opaque[view] = mesh;
                }

                var stlLoader = new THREE.STLLoader();
                stlLoader.load("models/" + node.original.model + ".stl", function (geometry) {

                    geometry.computeVertexNormals(true);
                    geometry.translate(-89.5, -110, -103);
                    geometry.rotateX(Math.PI / 2);
                    geometry.rotateY(-Math.PI);

                    for (var view in views) {
                        node.meshes[view].geometry = geometry;
                        node.meshes_opaque[view].geometry = geometry;
                    }

                });
            }

            for (var view in views) {
                node.meshes[view].material = brain_region_material_solid;
                node.meshes_opaque[view].material = brain_region_material_opaque;
                scenes[view].add(node.meshes[view])
                scenes_brain_regions[view].add(node.meshes_opaque[view])
            }

        },

        removeNode: function(node) {
            for (var view in views) {
                scenes[view].remove(node.meshes[view]);
                scenes_brain_regions[view].remove(node.meshes_opaque[view]);
            }

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
        },

        setAutoRotate: function(autoRotate) {
            controls.autoRotate = autoRotate;
        },

        setOpacity: function(opacity) {
            default_opacity = opacity;

            for (var view in views) {
                scenes_brain_regions[view].traverse(function(node) {

                    if ( node instanceof THREE.Mesh ) {

                        // insert your code here, for example:
                        node.material.opacity = opacity;

                    }
                });
            }

        }
    }
})();

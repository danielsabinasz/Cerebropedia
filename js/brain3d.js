
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
    };

    var default_opacity = 0.2;

    var containers = {};
    var cameras = {};
    var scenes = {};
    var scenes_brain_regions = {};
    var renderers = {};
    var lights = {};
    var geometries = {};
    var materials = {};
    var brain_grey_meshes = {};
    var brain_white_meshes = {};
    var brain_csf_meshes = {};

    var controls;

    var progress;

    showLoadingOverlay();
    window.setTimeout(function() {
        loadModels();
    }, 1000);

    function showLoadingOverlay() {
        progress = new LoadingOverlayProgress({
            bar     : {
                "background"    : "#343a40",
                "bottom"        : "30px",
                "left"          : "30px",
                "right"         : "30px",
                "height"        : "30px",
                "border-radius" : "15px"
            },
            text    : {
                "color"         : "white",
                "vertical-align": "middle",
                "bottom"           : "35px"
            }
        });
        progress.itemsLoaded = 0;
        progress.itemsTotal = 3;
        $.LoadingOverlay("show", {
            custom: progress.Init(),
            image       : "loading.png",
            maxSize: 200,
            minSize: 200,
        });
    }

    function hideLoadingOverlay() {
        $.LoadingOverlay("hide");
    }

    function loadModel(path, loader) {
        loader.load( path, function(geometry) {

            geometry.center();
            geometry.computeVertexNormals();
            geometries[path] = geometry;
        }, function(p) {
            progress.Update(
                Math.round( 100 * (
                    progress.itemsLoaded/progress.itemsTotal
                    + 1.0/progress.itemsTotal * p.loaded/p.total
                ))
            );
        } );
    }

    function loadModels() {
        var manager = new THREE.LoadingManager();

        manager.onLoad = function ( ) {
            init();
            animate();
            hideLoadingOverlay();
        };
        manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
            progress.itemsTotal = itemsTotal;
            progress.itemsLoaded = itemsLoaded;
        };

        var vtkLoader = new THREE.VTKLoader(manager);
        loadModel("models/mni_grey.vtk", vtkLoader);
        loadModel("models/mni_white.vtk", vtkLoader);
        loadModel("models/mni_csf.vtk", vtkLoader);
    }

    function createViews() {
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
    }

    function createMaterials() {
        materials["grey"] = new THREE.MeshPhongMaterial( { color: 0xd2b8a3, side: THREE.DoubleSide, opacity: 1, transparent: true } );
        materials["white"] = new THREE.MeshPhongMaterial( { color: 0xfefaf7, side: THREE.DoubleSide, opacity: 1, transparent: true } );
        materials["csf"] = new THREE.MeshBasicMaterial( { color: 0x96a2c8, side: THREE.DoubleSide, opacity: 0.2, transparent: true } );

        materials["grey_opaque"] = new THREE.MeshPhongMaterial( { color: 0xd2b8a3, side: THREE.DoubleSide, opacity: 0.1, transparent: true } );
        materials["white_opaque"] = new THREE.MeshPhongMaterial( { color: 0xfefaf7, side: THREE.DoubleSide, opacity: 0.1, transparent: true } );
        materials["csf_opaque"] = new THREE.MeshBasicMaterial( { color: 0x96a2c8, side: THREE.DoubleSide, opacity: 0.1, transparent: true } );

    }

    function createBrain() {
        for (var view in views) {
            brain_grey_meshes[view] = new THREE.Mesh( geometries["models/mni_grey.vtk"], materials["grey"] );
            brain_grey_meshes[view].rotation.set(-Math.PI/2, 0, 0);
            scenes[view].add( brain_grey_meshes[view] );

            brain_white_meshes[view] = new THREE.Mesh( geometries["models/mni_white.vtk"], materials["white"] );
            brain_white_meshes[view].rotation.set(-Math.PI/2, 0, 0);
            scenes[view].add( brain_white_meshes[view] );

            brain_csf_meshes[view] = new THREE.Mesh( geometries["models/mni_csf.vtk"], materials["csf"] );
            brain_csf_meshes[view].rotation.set(-Math.PI/2, 0, 0);
            scenes[view].add( brain_csf_meshes[view] );
        }
        /*var brain_grey_opaque = new THREE.Mesh( geometries["models/mni_grey.vtk"], materials["grey_opaque"] );
        brain_grey_opaque.rotation.set(-Math.PI/2, 0, 0);
        scenes["3d"].add( brain_grey_opaque );*/

        /*var brain_inside = new THREE.Mesh( geometry, grey_material_inside );
        brain_inside.rotation.set(-Math.PI/2, 0, 0);
        brain_inside.renderOrder = 1000;
        brain_inside.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
        scenes["3d"].add( brain_inside );*/


        /*vtkLoader.load( "models/mni_head.vtk", function ( geometry ) {

            geometry.center();
            geometry.computeVertexNormals();
            var head_material = new THREE.MeshPhongMaterial( { color: 0xffd4bf, side: THREE.DoubleSide, opacity: 1, transparent: true } );

            for (var view in views) {

                var head_outside = new THREE.Mesh( geometry, head_material );
                head_outside.rotation.set(-Math.PI/2, 0, 0);
                head_outside.scale.multiplyScalar( scale );
                scenes[view].add( head_outside );
            }

        } );*/
    }

    function init() {
        createViews();
        createMaterials();
        createBrain();



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
        controls.autoRotate = false;

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
        slice: function(x, y, z) {

            showLoadingOverlay();
            window.setTimeout(function() {

                var step = 0;
                var totalSteps = 18.0;

                var grey_sliced = new THREE.Geometry().fromBufferGeometry(geometries["models/mni_grey.vtk"]);

                // x
                grey_sliced = sliceGeometry(
                    grey_sliced,
                    new THREE.Plane(new THREE.Vector3(1, 0, 0), -10*x[0])
                );
                console.log(Math.round(100 * ++step/totalSteps));
                progress.Update(Math.round(100 * ++step/totalSteps));
                grey_sliced = sliceGeometry(
                    grey_sliced,
                    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10*x[1])
                );
                console.log(Math.round(100 * ++step/totalSteps));
                progress.Update(Math.round(100 * ++step/totalSteps));
                // y
                grey_sliced = sliceGeometry(
                    grey_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 1, 0), -10*y[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                grey_sliced = sliceGeometry(
                    grey_sliced,
                    new THREE.Plane(new THREE.Vector3(0, -1, 0), 10*y[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                // z
                grey_sliced = sliceGeometry(
                    grey_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 0, 1), -10*z[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                grey_sliced = sliceGeometry(
                    grey_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 0, -1), 10*z[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));



                var white_sliced = new THREE.Geometry().fromBufferGeometry(geometries["models/mni_white.vtk"]);

                // x
                white_sliced = sliceGeometry(
                    white_sliced,
                    new THREE.Plane(new THREE.Vector3(1, 0, 0), -10*x[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                white_sliced = sliceGeometry(
                    white_sliced,
                    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10*x[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                // y
                white_sliced = sliceGeometry(
                    white_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 1, 0), -10*y[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                white_sliced = sliceGeometry(
                    white_sliced,
                    new THREE.Plane(new THREE.Vector3(0, -1, 0), 10*y[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                // z
                white_sliced = sliceGeometry(
                    white_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 0, 1), -10*z[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                white_sliced = sliceGeometry(
                    white_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 0, -1), 10*z[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));


                var csf_sliced = new THREE.Geometry().fromBufferGeometry(geometries["models/mni_csf.vtk"]);

                // x
                csf_sliced = sliceGeometry(
                    csf_sliced,
                    new THREE.Plane(new THREE.Vector3(1, 0, 0), -10*x[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                csf_sliced = sliceGeometry(
                    csf_sliced,
                    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10*x[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                // y
                csf_sliced = sliceGeometry(
                    csf_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 1, 0), -10*y[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                csf_sliced = sliceGeometry(
                    csf_sliced,
                    new THREE.Plane(new THREE.Vector3(0, -1, 0), 10*y[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                // z
                csf_sliced = sliceGeometry(
                    csf_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 0, 1), -10*z[0])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));
                csf_sliced = sliceGeometry(
                    csf_sliced,
                    new THREE.Plane(new THREE.Vector3(0, 0, -1), 10*z[1])
                );
                progress.Update(Math.round(100 * ++step/totalSteps));


                for (var view in views) {
                    brain_grey_meshes[view].geometry = grey_sliced;
                    brain_white_meshes[view].geometry = white_sliced;
                    brain_csf_meshes[view].geometry = csf_sliced;
                }

                hideLoadingOverlay();
            }, 1000);


                /*
                sliced_geometry = sliceGeometry(
                    sliced_geometry,
                    new THREE.Plane(views[view]["slice_plane"].clone().multiplyScalar(-1), slice_width/2.0)
                );*/
        },

        addNode: function(node, color) {

            var brain_region_material_solid = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                opacity: default_opacity,
                transparent: true,
                wireframe: false
            });

            if (typeof(node.meshes) == "undefined") {
                node.meshes = {};

                for (var view in views) {

                    var mesh = new THREE.Mesh();
                    mesh.node = node;
                    node.meshes[view] = mesh;

                }

                var stlLoader = new THREE.STLLoader();
                stlLoader.load("models/" + node.original.model + ".stl", function (geometry) {
                    if (node.original.model.indexOf("destrieux") !== -1) {
                        geometry.rotateX(-Math.PI/2);

                        geometry.translate(-76, -69, 91);

                        var geo = new THREE.Geometry().fromBufferGeometry(geometry);
                        console.log(geometry);

                        /*var minX = 100000;
                        var maxX = -100000;
                        var sumX = 0;
                        var minY = 100000;
                        var maxY = -100000;
                        var sumY = 0;
                        var minZ = 100000;
                        var maxZ = -100000;
                        var sumZ = 0;
                        for (var i = 0; i < geo.vertices.length; i++) {
                            var v = geo.vertices[i];
                            if (v.x < minX) minX = v.x;
                            if (v.x > maxX) maxX = v.x;
                            sumX += v.x;
                            if (v.y < minY) minY = v.y;
                            if (v.y > maxY) maxY = v.y;
                            sumY += v.y;
                            if (v.z < minZ) minZ = v.z;
                            if (v.z > maxZ) maxZ = v.z;
                            sumZ += v.z;
                        }
                        var avgX = sumX / geo.vertices.length;
                        var avgY = sumY / geo.vertices.length;
                        var avgZ = sumZ / geo.vertices.length;
                        console.log((maxX-minX)/2.0, (maxY-minY)/2.0, (maxZ-minZ)/2.0);
                        console.log(minX, minY, minZ);
                        console.log(maxX, maxY, maxZ);*/
                    } else {
                        geometry.computeVertexNormals(true);
                        geometry.translate(-89.5, -110, -103);
                        geometry.rotateX(Math.PI / 2);
                        geometry.rotateY(-Math.PI);
                    }


                    for (var view in views) {
                        node.meshes[view].geometry = geometry;
                    }

                });
            }

            for (var view in views) {
                node.meshes[view].material = brain_region_material_solid;
                scenes_brain_regions[view].add(node.meshes[view])
            }

        },

        removeNode: function(node) {
            for (var view in views) {
                scenes_brain_regions[view].remove(node.meshes[view]);
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

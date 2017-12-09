
var tree = (function(brain3d, wiki) {

    var jstree;

    var tree_index_by_id = {};
    var tree_index_by_wiki = {};

    /**
     * Define a list of well differentiable colors
     */
    var colors = [0x0082c8, 0x3cb44b, 0xffe119, 0xe6194b, 0xf58231, 0x911eb4, 0x46f0f0, 0xf032e6, 0xd2f53c, 0xfabebe, 0x008080, 0xe6beff, 0xaa6e28, 0xfffac8, 0x800000, 0xaaffc3, 0x808000, 0xffd8b1, 0x000080, 0x808080, 0xffffff, 0x000000];


    /**
     * Returns a list of jstree nodes that have to be visualized
     * when the specified node is selected
     */
    function get_visualized_nodes(node, visualized_nodes) {
        visualized_nodes = visualized_nodes || [];
        if (typeof(node.original.model) != "undefined") {
            // There is a model for this node. Return it
            visualized_nodes.push(node);
            return visualized_nodes;
        } else {
            // No model: We have to aggregate all children
            for (var i = 0; i < node.children.length; i++) {
                get_visualized_nodes(jstree.jstree(true).get_node(node.children[i]), visualized_nodes);
            }
            return visualized_nodes;
        }
    }

    /**
     * Manually select a node
     */
    function select_node(node_id) {
        jstree.jstree("deselect_all");
        jstree.jstree("select_node", node_id);
    }


    /**
     * Loads the specified nodes into the 3D view
     */

    var previously_selected = [];
    function load_3d_nodes(node_ids) {

        /**
         * Remove previous 3D nodes
         */
        for (var i = 0; i < previously_selected.length; i++) {
            var id = previously_selected[i];
            var node = jstree.jstree(true).get_node(id);
            var visualized_nodes = get_visualized_nodes(node);
            $("#"+id+" a").css("background-color",  "");
            for (var j = 0; j < visualized_nodes.length; j++) {
                brain3d.removeNode(visualized_nodes[j]);
            }
        }

        /**
         * Add 3D nodes
         */
        for (var i = 0; i < node_ids.length; i++) {
            var id = node_ids[i];
            var node = jstree.jstree(true).get_node(id);
            var visualized_nodes = get_visualized_nodes(node);
            if (typeof(node.color) == "undefined" || true) {
                node.color = colors[i % node_ids.length];
                $("#"+id+" a").css("background-color",  "#" + node.color.toString(16));
                $("#"+id+" a").css("color",  "black");
            }
            //node.color = 0x007bff;
            for (var j = 0; j < visualized_nodes.length; j++) {
                brain3d.addNode(visualized_nodes[j], node.color);
            }
        }

        /**
         * Add MNI nodes
         */
        var region_urls = "";
        for (var i = 0; i < node_ids.length; i++) {
            var id = node_ids[i];
            var node = jstree.jstree(true).get_node(id);
            var visualized_nodes = get_visualized_nodes(node);
            for (var j = 0; j < visualized_nodes.length; j++) {
                var visualized_node = visualized_nodes[j];
                if (typeof(visualized_node.original.model) != "undefined") {

                    var r = (node.color >> 16) & 255;
                    var g = (node.color >> 8) & 255;
                    var b = node.color & 255;
                    r = r/255.0;
                    g = g/255.0;
                    b = b/255.0;

                    var model_url = "nifti://http://cerebropedia.org/models/" + visualized_node.original.model + ".nii.gz";
                    var region_name = visualized_node.id;
                    region_urls += "_'" + region_name + "':{'type':'image'_'source':'" + model_url + "'_'shader':'void main() {\\n  emitRGBA(vec4(" + r + ", " + g + ", " + b + ", toNormalized(getDataValue())));\\n}\\n'}"
                }
            }
        }

        var zoom_factor = 0.4;
        var neuroglancer_url = "neuroglancer/#!{'layers':{'humanbrain.nii.gz':{'type':'image'_'source':'nifti://http://cerebropedia.org/models/humanbrain.nii.gz'}" + region_urls + "}_'navigation':{'pose':{'position':{'voxelSize':[0.4000000059604645_0.4000000059604645_0.4000000059604645]_'voxelCoordinates':[1.3749885559082031_-43.6250114440918_56.3749885559082]}}_'zoomFactor':" + zoom_factor + "}_'perspectiveOrientation':[0.3255828022956848_0.8877503275871277_-0.27015501260757446_-0.18141505122184753]_'perspectiveZoom':3_'showSlices':false_'showScaleBar':false}"
        $("#mri_link").attr("href", neuroglancer_url);
        $("#mri_link").css("visibility", "visible");

        previously_selected = node_ids.slice(0);
    }

    /**
     * Load brain data
     */
    function load_brain_data() {

        console.log("load brain data");
        $.getJSON("json/brain.json", function(json) {

            var brain_data = json;

            // Build tree
            jstree = $("#jstree");
            jstree.jstree({

                "plugins" : [ "search", "types" ],
                "core": {
                    "themes" : {
                        'name': 'proton',
                        'responsive': true
                    },
                    "data": brain_data
                },
                "types": {
                    /*"lobe": {
                        "icon": "img/Aikawns/L/blue.ico"
                    },
                    "lobule": {
                        "icon": "img/Aikawns/L/blue.ico"
                    },
                    "gyrus": {
                        "icon": "img/Aikawns/G/blue.ico"
                    },
                    "sulcus": {
                        "icon": "img/Aikawns/S/blue.ico"
                    },
                    "brodmann": {
                        "icon": "img/Aikawns/B/blue.ico"
                    },
                    "other": {
                        "icon": "img/Aikawns/A/blue.ico"
                    },
                    "cortex": {
                        "icon": "img/Aikawns/C/blue.ico"
                    }*/
                }
            }).on('loaded.jstree', function() {
                var all_nodes = jstree.jstree().get_json(jstree, {flat: true});
                for (var i = 0; i < all_nodes.length; i++) {
                    var node_id = all_nodes[i].id;
                    var node = jstree.jstree(true).get_node(node_id);
                    tree_index_by_id[node_id] = node;
                    if (typeof(node.original.wiki) != "undefined") {
                        if (typeof(node.original.wiki) == "string") {
                            tree_index_by_wiki[node.original.wiki] = node;
                        } else {
                            for (var j = 0; j < node.original.wiki.length; j++) {
                                tree_index_by_wiki[node.original.wiki[j]] = node;
                            }
                        }
                    }
                }
                //jstree.jstree('open_all');
            }).on("changed.jstree", function (e, data) {

                /**
                 * On change: Display 3D region
                 */

                if (data.action == "select_node" || data.action == "deselect_node") {
                    if (data.action == "select_node") {
                        wiki.load_wiki(data.node);
                    }

                    load_3d_nodes(data.selected);

                }
            });

            /**
             * Search
             */
            var to = false;
            $('#query').keyup(function () {
                if(to) { clearTimeout(to); }
                to = setTimeout(function () {
                    var v = $('#query').val();
                    jstree.jstree(true).search(v);
                }, 250);
            });
        });
    }

    load_brain_data();

    return {
        tree_index_by_id: tree_index_by_id,
        tree_index_by_wiki: tree_index_by_wiki
    }

})(brain3d, wiki);

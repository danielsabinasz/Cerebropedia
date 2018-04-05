
var tree = (function(brain3d, wiki) {

    var jstree;

    var tree_index_by_id = {};
    var tree_index_by_wiki = {};

    /**
     * Define a list of well differentiable colors
     */
    //0x007bff
    var colors = [0x28a745, 0xffc107, 0xdc3545, 0xf58231, 0x911eb4, 0x46f0f0, 0xf032e6, 0xd2f53c, 0xfabebe, 0x008080, 0xe6beff, 0xaa6e28, 0xfffac8, 0x800000, 0xaaffc3, 0x808000, 0xffd8b1, 0x000080, 0x808080, 0xffffff, 0x000000];

    /**
     * Returns a list of jstree nodes that have to be visualized
     * when the specified node is selected
     */
    function get_visualized_nodes(node, visualized_nodes, depth) {
        if (typeof(depth) == "undefined") depth = 0;

        visualized_nodes = visualized_nodes || [];
        if (
            typeof(node.original.model) != "undefined"
            //&& (node.original.model.indexOf("harvard_oxford") !== -1 || node.children.length == 0 && depth == 0)
        ) {
            // There is a model for this node. Return it
            visualized_nodes.push(node);
            return visualized_nodes;
        } else {
            // No model: We have to aggregate all children
            /*for (var i = 0; i < node.children.length; i++) {
                get_visualized_nodes(jstree.jstree(true).get_node(node.children[i]), visualized_nodes, depth + 1);
            }
            return visualized_nodes;*/
            return [];
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
        console.log("load_3d_nodes", node_ids);

        /**
         * Remove previous 3D nodes
         */
        for (var i = 0; i < previously_selected.length; i++) {
            var id = previously_selected[i];
            var node = jstree.jstree(true).get_node(id);
            if ($.inArray(id, node_ids) < 0) {
                brain3d.removeNode(node);
            }
            $("#"+id+" > div.jstree-wholerow").css("background-color",  "");
        }

        /**
         * Add 3D nodes
         */
        for (var i = 0; i < node_ids.length; i++) {
            var id = node_ids[i];
            var node = jstree.jstree(true).get_node(id);

            node.color = colors[i % node_ids.length];
            $("#"+id+" > div.jstree-wholerow").css("background",  "#" + ("000000"+node.color.toString(16)).slice(-6));
            $("#"+id+" a").css("color",  "black");

            if ($.inArray(id, previously_selected) < 0) {
                brain3d.addNode(node, node.color);
            }
        }

        /**
         * Add MNI nodes
         */
        /*var region_urls = "";
        for (var i = 0; i < node_ids.length; i++) {
            var id = node_ids[i];
            var node = jstree.jstree(true).get_node(id);
            var visualized_nodes = get_visualized_nodes(node);

            if (typeof(node.original.model) != "undefined") {

                var r = (node.color >> 16) & 255;
                var g = (node.color >> 8) & 255;
                var b = node.color & 255;
                r = r/255.0;
                g = g/255.0;
                b = b/255.0;

                var model_url = "nifti://http://cerebropedia.org/models/" + visualized_node.original.model + ".nii.gz";
                var region_name = node.id;
                region_urls += "_'" + region_name + "':{'type':'image'_'source':'" + model_url + "'_'shader':'void main() {\\n  emitRGBA(vec4(" + r + ", " + g + ", " + b + ", toNormalized(getDataValue())));\\n}\\n'}"
            }
        }

        var zoom_factor = 0.4;
        var neuroglancer_url = "neuroglancer/#!{'layers':{'humanbrain.nii.gz':{'type':'image'_'source':'nifti://http://cerebropedia.org/models/humanbrain.nii.gz'}" + region_urls + "}_'navigation':{'pose':{'position':{'voxelSize':[0.4000000059604645_0.4000000059604645_0.4000000059604645]_'voxelCoordinates':[1.3749885559082031_-43.6250114440918_56.3749885559082]}}_'zoomFactor':" + zoom_factor + "}_'perspectiveOrientation':[0.3255828022956848_0.8877503275871277_-0.27015501260757446_-0.18141505122184753]_'perspectiveZoom':3_'showSlices':false_'showScaleBar':false}"
        $("#mri_link").attr("href", neuroglancer_url);
        $("#mri_link").css("visibility", "visible");*/

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

                "plugins" : [ "search", "types", "wholerow" ],
                "core": {
                    "themes" : {
                        "name": "proton",
                        "responsive": true
                        //"variant" : "large"
                    },
                    "data": brain_data
                },
                "grid": {
                    "columns": [
                        {
                            "tree": true,
                            "header": "Name"
                        },
                        {
                            "tree": false,
                            "header": "Type"
                        }
                    ]
                },
                "types": {
                    "default": {
                        "icon": ""
                    },
                    "lobe": {
                        "icon": "img/Aikawns/L/blue.ico"
                    },
                    "lobule": {
                        "icon": "img/Aikawns/L/blue.ico"
                    },
                    "gyrus": {
                        "icon": "img/Aikawns/G/dg.ico"
                    },
                    "sulcus": {
                        "icon": "img/Aikawns/S/gold.ico"
                    },
                    "brodmann": {
                        "icon": "img/Aikawns/B/red.ico"
                    },
                    "area": {
                        "icon": "img/Aikawns/A/red.ico"
                    }
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

                    if (typeof(node.original.model) == "undefined" && node.children.length == 0) {
                        jstree.jstree(true).hide_node(node);
                    }

                }

                var selected = window.location.hash.split(",");
                jstree.jstree("set_state", {
                    "core": {
                        "selected": selected
                    }
                });

                //jstree.jstree('open_all');
            }).on("changed.jstree", function (e, data) {
                //window.location.hash = jstree.jstree("get_state").core.selected.join(",");

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
        tree_index_by_wiki: tree_index_by_wiki,
        select_node: select_node
    }

})(brain3d, wiki);

var brain_data;
var jstree;

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
 * Fix Wikipedia links
 */
function fix_wikipedia_links(links) {
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var link_wiki = link.href.split("/").slice(-1)[0];
        if (link_wiki in tree_index_by_wiki) {
            var node = tree_index_by_wiki[link_wiki];
            link.href = "javascript:select_node('" + node.id + "')";
        } else {
            link.href = "https://en.wikipedia.org/wiki/" + link_wiki;
            link.target = "_blank";
        }
    }
}

/**
 * Loads a node into the active view
 */
function load_node_details(node) {
    // Set title
    $("#title").html(node.text);

    // Load wiki article
    $("#wikipedia_text").html("");
    $("#wikipedia_images").html("");
    if (typeof(node.original.wiki) != "undefined") {

        $("#wikipedia_text").html("<div style='text-align: center;'><img src='img/Spinner.svg'></div>");

        var wiki;
        if (typeof(node.original.wiki) == "string") {
            wiki = node.original.wiki;
        } else {
            wiki = node.original.wiki[0];
        }
        wiki = wiki.split("#")[0];
        $.ajax({
            type: "GET",
            url: "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=" + wiki + "&callback=?",
            contentType: "application/json; charset=utf-8",
            async: false,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                var markup = data.parse.text["*"];
                var blurb = $('<div></div>').html(markup);

                fix_wikipedia_links($(blurb).find('a'));


                var text = $(blurb).find('p');
                var images = $(blurb).find('.infobox img');
                //images.css("margin-left", "10px");
                //images.css("margin-right", "10px");

                //console.log("image",image);

                $('#wikipedia_images').html("");
                images.each(function(i, image) {

                    /*
                            <img class="card-img-top">
                            <div class="card-body" style="flex: 0;">
                                <figcaption class="figure-caption text-center">Posterior view</figcaption>
                            </div>
                     */

                    var card = document.createElement("div");
                    $(card).css("text-align", "center");

                    //$(image).addClass("img-thumbnail");
                    $(image).addClass("mx-auto");

                    var card_body = document.createElement("div");
                    $(card_body).addClass("card-body");

                    var figcaption_text = $(image).parent().parent().find('div').html();
                    var figcaption = document.createElement("figcaption");
                    $(figcaption).addClass("figure-caption text-center");
                    $(figcaption).html(figcaption_text);
                    $(card_body).append(figcaption);

                    $(card).append(image);
                    $(card).append(card_body);
                    $('#wikipedia_images').append(card);
                })

                if (images.length > 0) {
                    $('#wikipedia_images_card').show();
                } else {
                    $('#wikipedia_images_card').hide();
                }

                $('#wikipedia_text').html("");
                $(text[text.length-1]).append(" <a href='http://en.wikipedia.org/wiki/" + wiki + "' target='_blank'>[Read more]</a>")

                $('#wikipedia_text').append(text);

            },
            error: function (errorMessage) {
                $("#wikipedia").html("");
            }
        });
    }
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
var tree_index_by_id = {};
var tree_index_by_wiki = {};
console.log("Load the JSON");
$.getJSON("json/brain.json", function(json) {
    brain_data = json;

    console.log("Here comes the JSON");

    // Build tree
    jstree = $("#jstree");
    jstree.jstree({

        "plugins" : [ "search" ],
        "core": {
            "themes" : {
                'name': 'proton',
                'responsive': true
            },
            "data": brain_data
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
                load_node_details(data.node);
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

    /**
     * Axial view
     */
    /*var axialViewer = OpenSeadragon({
        id: "mri_axial",
        prefixUrl: "js/libs/openseadragon/images/",
        tileSources: "http://localhost/hdd/bigbrain.loris.ca/BigBrainRelease.2015/2D_Final_Sections/Axial/Png/Thumbnail/pm2835o.png"
    });*/
});

// Rotate checkbox
$("#rotate").click(function() {
    console.log("set auto rotate", this.checked);
    brain3d.setAutoRotate(this.checked);
});

// Opacity slider
$( function() {
    $( "#opacity" ).slider({

        slide: function( event, ui ) {
            brain3d.setOpacity(ui.value/100.0);
        },

        value: 20

    });
} );

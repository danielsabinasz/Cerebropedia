
onmessage = function(e) {
    console.log('Message received from main script', e.data);
    console.log('Posting message back to main script');

    var geom = e.data.geom;
    for (var i = 0; i < e.data.planes.length; i++) {
        var plane = e.data.planes[i];
        geom = sliceGeometry(geom, plane);
    }

    console.log("Done!");
    postMessage(geom);
}

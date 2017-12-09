var talairach = (function(brain3d) {

    var x_slider;
    var y_slider;
    var z_slider;


    function updateSliderLabels() {
        $("#x-slider-val-lower").html(x_slider.getValue()[0] + " cm");
        $("#x-slider-val-upper").html(x_slider.getValue()[1] + " cm");
        $("#y-slider-val-lower").html(y_slider.getValue()[0] + " cm");
        $("#y-slider-val-upper").html(y_slider.getValue()[1] + " cm");
        $("#z-slider-val-lower").html(z_slider.getValue()[0] + " cm");
        $("#z-slider-val-upper").html(z_slider.getValue()[1] + " cm");
    }

    function setTalairachRanges(x, y, z) {
        x_slider.setValue(x);
        y_slider.setValue(y);
        z_slider.setValue(z);
        updateSliderLabels();
        sliceTalairachRanges();
    }

    function sliceTalairachRanges() {
        brain3d.slice(x_slider.getValue(), y_slider.getValue(), z_slider.getValue());
    }

    $( function() {
        x_slider = new Slider('#x-slider', {tooltip: 'always'});
        x_slider.on("slide", updateSliderLabels);
        x_slider.on("slideStop", sliceTalairachRanges);

        y_slider = new Slider('#y-slider', {tooltip: 'always'});
        y_slider.on("slide", updateSliderLabels);
        y_slider.on("slideStop", sliceTalairachRanges);

        z_slider = new Slider('#z-slider', {tooltip: 'always'});
        z_slider.on("slide", updateSliderLabels);
        z_slider.on("slideStop", sliceTalairachRanges);
    } );

    return {
        updateSliderLabels: updateSliderLabels,
        setTalairachRanges: setTalairachRanges,
        sliceTalairachRanges: sliceTalairachRanges
    }

})(brain3d);

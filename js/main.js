// Rotate checkbox
$("#rotate").click(function() {
    console.log("set auto rotate", this.checked);
    brain3d.setAutoRotate(this.checked);
});

// Opacity slider
var opacity_slider;
$( function() {
    opacity_slider = new Slider("#opacity-slider");
    opacity_slider.on("slide", function (value) {
        brain3d.setOpacity(value / 100.0);
    });
});

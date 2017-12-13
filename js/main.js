// Checkboxes
$("#rotate").click(function() {
    brain3d.setAutoRotate(this.checked);
});
$("#show_gray_matter").click(function() {
    brain3d.setShowGrayMatter(this.checked);
});
$("#show_white_matter").click(function() {
    brain3d.setShowWhiteMatter(this.checked);
});
$("#show_csf").click(function() {
    brain3d.setShowCSF(this.checked);
});

// Opacity slider
var opacity_slider;
$( function() {

    opacity_slider = new Slider("#opacity-slider");
    opacity_slider.on("slide", function (value) {
        brain3d.setOpacity(value / 100.0);
    });

});

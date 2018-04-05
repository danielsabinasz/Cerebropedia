
var opacity_2d_slider;
var opacity_3d_slider;
$( function() {

    opacity_2d_slider = new Slider("#opacity-2d-slider");
    opacity_2d_slider.on("slide", function (value) {
        brain3d.setOpacity2D(value / 100.0);
    });

    opacity_3d_slider = new Slider("#opacity-3d-slider");
    opacity_3d_slider.on("slide", function (value) {
        brain3d.setOpacity3D(value / 100.0);
    });


    // Checkboxes
    $("#flash").click(function() {
        brain3d.setFlash(this.checked);
    });
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

    $("input[name=mni-image]").change(function() {
        brain3d.setMniImage(this.value);
    });

});

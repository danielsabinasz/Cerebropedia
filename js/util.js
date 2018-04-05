function colorToRGB(color) {
    var r = color >> 16;
    var g = color >> 8 & 255;
    var b = color & 255;
    return [r, g, b];
}

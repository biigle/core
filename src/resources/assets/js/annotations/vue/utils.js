/**
 * All utility functions of the annotation tool.
 *
 * @type {Object}
 */
biigle.$declare('annotations.utils', {
    /**
     * Check if the image comes from a cross origin without CORS enabled
     * @param  HTMLImage image
     * @return Boolean
     */
    checkCors: function (image) {
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.drawImage(image, 0, 0);
        try {
            ctx.getImageData(0, 0, 1, 1);
        } catch (err) {
            // Error code 18 means we have a tainted canvas.
            return err.code !== 18;
        }

        return true;
    }
});

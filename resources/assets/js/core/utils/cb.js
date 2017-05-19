/**
 * Various functions for cross browser support that can be used throughout the
 * application.
 */
biigle.$declare('utils.cb', {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/exitFullscreen
    exitFullscreen: function () {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
});

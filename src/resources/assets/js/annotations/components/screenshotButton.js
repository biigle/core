/**
 * A button that produces a screenshot of the map
 *
 * @type {Object}
 */
biigle.$component('annotations.components.screenshotButton', {
    mixins: [biigle.$require('annotations.mixins.imageFilenameTracker')],
    computed: {
        messages: function () {
            return biigle.$require('messages.store');
        },
        screenshotSupported: function () {
            return !biigle.$require('annotations.volumeIsRemote');
        },
        screenshotTitle: function () {
            if (this.screenshotSupported) {
                return 'Get a screenshot of the visible area';
            }

            return 'Screenshots are not available for remote images';
        },
        filename: function () {
            if (this.currentImageFilename) {
                var name = this.currentImageFilename.split('.');
                if (name.length > 1) {
                    name[name.length - 1] = 'png';
                }
                name = name.join('.').toLowerCase();
                return 'biigle_screenshot_' + name;
            }

            return 'biigle_screenshot.png';
        },
    },
    methods: {
        // see: https://gist.github.com/remy/784508
        trimCanvas: function (canvas) {
            var ctx = canvas.getContext('2d');
            var copy = document.createElement('canvas').getContext('2d');
            var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var l = pixels.data.length;
            var i, x, y;
            var bound = {
                top: null,
                left: null,
                right: null,
                bottom: null
            };

            for (i = 0; i < l; i += 4) {
                if (pixels.data[i + 3] !== 0) {
                    x = (i / 4) % canvas.width;
                    y = ~~((i / 4) / canvas.width);

                    if (bound.top === null) {
                        bound.top = y;
                    }

                    if (bound.left === null) {
                        bound.left = x;
                    } else if (x < bound.left) {
                        bound.left = x;
                    }

                    if (bound.right === null) {
                        bound.right = x;
                    } else if (bound.right < x) {
                        bound.right = x;
                    }

                    if (bound.bottom === null) {
                        bound.bottom = y;
                    } else if (bound.bottom < y) {
                        bound.bottom = y;
                    }
                }
            }

            var trimHeight = bound.bottom - bound.top;
            var trimWidth = bound.right - bound.left;
            var trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

            copy.canvas.width = trimWidth;
            copy.canvas.height = trimHeight;
            copy.putImageData(trimmed, 0, 0);

            return copy.canvas;
        },
        makeBlob: function (canvas) {
            try {
                canvas = this.trimCanvas(canvas);
            } catch (error) {
                return Vue.Promise.reject('Could not create screenshot. Maybe the image is not loaded yet?');
            }

            var type = 'image/png';
            if (!HTMLCanvasElement.prototype.toBlob) {
                // fallback if toBlob is not implemented see 'Polyfill':
                // https://developer.mozilla.org/de/docs/Web/API/HTMLCanvasElement/toBlob
                var binStr = atob(canvas.toDataURL(type).split(',')[1]);
                var len = binStr.length;
                var arr = new Uint8Array(len);
                for (var i = 0; i < len; i++ ) {
                    arr[i] = binStr.charCodeAt(i);
                }

                return new Vue.Promise(function (resolve) {
                    resolve(new Blob([arr], {type: type}));
                });
            } else {
                return new Vue.Promise(function (resolve) {
                    canvas.toBlob(resolve, type);
                });
            }
        },
        download: function (blob) {
            var a = document.createElement('a');
            a.style = 'display: none';
            a.download = this.filename;
            a.href = URL.createObjectURL(blob);
            document.body.appendChild(a);
            a.click();
            window.setTimeout(function () {
                // wait a bit before revoking the blob (else the download might not work)
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }, 100);
        },
        capture: function () {
            var self = this;
            var map = biigle.$require('annotations.stores.map');
            map.once('postcompose', function (e) {
                self.makeBlob(e.context.canvas)
                    .then(self.download)
                    .catch(self.handleError);
            });
            map.renderSync();
        },
        handleError: function (message) {
            this.messages.danger(message);
        },
    },
});

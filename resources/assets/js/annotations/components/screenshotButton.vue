<template>
<button
    class="btn btn-default"
    title="Get a screenshot of the visible area 𝗣"
    @click="capture"
    >
    <span class="fa fa-camera" aria-hidden="true"></span>
    Capture screenshot
</button>
</template>
<script>
import Events from '@/core/events.js';
import Messages from '@/core/messages/store.js';
import Keyboard from '@/core/keyboard.js';

/**
 * A button that produces a screenshot of the map
 *
 * @type {Object}
 */
export default {
    props: {
        filenames: {
            type: Array,
            default: () => [],
        },
        currentId: {
            type: Number,
            default: -1,
        },
        ids: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            filesObj: {}
        }
    },
    computed: {
        filename() {
            if (this.currentId) {
                let name = this.filesObj[this.currentId].split('.');
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
        trimCanvas(canvas) {
            let ctx = canvas.getContext('2d');
            let copy = document.createElement('canvas').getContext('2d');
            let pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let l = pixels.data.length;
            let i, x, y;
            let bound = {
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

            let trimHeight = bound.bottom - bound.top;
            let trimWidth = bound.right - bound.left;
            let trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

            copy.canvas.width = trimWidth;
            copy.canvas.height = trimHeight;
            copy.putImageData(trimmed, 0, 0);

            return copy.canvas;
        },
        makeBlob(canvas) {
            try {
                canvas = this.trimCanvas(canvas);
            } catch (error) {
                return Promise.reject('Could not create screenshot. Maybe the image is not loaded yet?');
            }

            let type = 'image/png';
            if (!HTMLCanvasElement.prototype.toBlob) {
                // fallback if toBlob is not implemented see 'Polyfill':
                // https://developer.mozilla.org/de/docs/Web/API/HTMLCanvasElement/toBlob
                let binStr = atob(canvas.toDataURL(type).split(',')[1]);
                let len = binStr.length;
                let arr = new Uint8Array(len);
                for (let i = 0; i < len; i++ ) {
                    arr[i] = binStr.charCodeAt(i);
                }

                return new Promise(function (resolve) {
                    resolve(new Blob([arr], {type: type}));
                });
            } else {
                return new Promise(function (resolve) {
                    canvas.toBlob(resolve, type);
                });
            }
        },
        download(blob) {
            let a = document.createElement('a');
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
        capture() {
            if (this.map) {
                this.map.once('rendercomplete', this.handleRenderComplete);
                this.map.renderSync();
            }
        },
        handleRenderComplete(e) {
            // See: https://openlayers.org/en/v6.15.1/examples/export-map.html
            // This version is modified/simplified because we want the screenshot
            // in the actual device pixel ratio and not at the original size.
            const canvas = e.target
                .getViewport()
                .querySelector('.ol-layer canvas, canvas.ol-layer');

            this.makeBlob(canvas).then(this.download).catch(this.handleError);
        },
        handleError(message) {
            Messages.danger(message);
        },
        setMap(map) {
            this.map = map;
        },
    },
    created() {
        this.filenames.forEach((filename, index) => {
            this.filesObj[this.ids[index]] = filename;
        });
        Keyboard.on('p', this.capture);
        Events.on('videos.map.init', this.setMap);
        Events.on('annotations.map.init', this.setMap);
    },
};
</script>

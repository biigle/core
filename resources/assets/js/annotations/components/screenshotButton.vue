<template>
<button
    class="btn btn-default btn-block"
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
import MeasureComponent from '../mixins/measureComponent.vue';
import Settings from '../stores/settings.js';
import { getBottomRight, getTopLeft } from '@biigle/ol/extent';
import { trimCanvas, ScaleLineProperties } from '../utils';

/**
 * A button that produces a screenshot of the map
 *
 * @type {Object}
 */
export default {
    mixins: [MeasureComponent],
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
            default: () => [],
        },
    },
    data() {
        return {
            filesObj: {},
        };
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
        drawScaleLine(canvas) {
            const ratio = window.devicePixelRatio;
            const height = 4 * ratio;
            const x = 10 * ratio;
            const y = canvas.height - 10 * ratio - height;

            const scaleLineProperties = new ScaleLineProperties(this.map.getView().getResolution(), this.hasArea, this.pxWidthInMeter, Settings.get('preferredUnit'));
            const width = scaleLineProperties.width() * ratio;
            const ctx = canvas.getContext('2d');

            // black border
            ctx.fillStyle = '#000';
            ctx.fillRect(x, y, width, height);

            // white line
            ctx.fillStyle = '#FFF';
            ctx.fillRect(x + ratio, y + ratio, width - ratio * 2, height - ratio * 2);

            this.drawCenteredText(canvas, scaleLineProperties.text(), x + width / 2, y - 2 * ratio);
        },
        drawCenteredText(canvas, text, centerX, y) {
            const ratio = window.devicePixelRatio;
            const ctx = canvas.getContext('2d');
            const fontSize = 12 * ratio;

            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            // black text border
            ctx.lineWidth = 2 * ratio;
            ctx.strokeStyle = '#000';
            ctx.strokeText(text, centerX, y);

            // white text
            ctx.fillStyle = '#FFF';
            ctx.fillText(text, centerX, y);
        },
        makeBlob(canvas) {
            try {
                canvas = trimCanvas(canvas);
            } catch (error) {
                return Promise.reject('Could not create screenshot. Maybe the image is not loaded yet?');
            }

            if (this.image && this.hasArea && Settings.get('scaleLine')) {
                this.drawScaleLine(canvas);
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
        handleRenderComplete(e) {
            // See: https://openlayers.org/en/v6.15.1/examples/export-map.html
            // This version is modified/simplified because we want the screenshot
            // in the actual device pixel ratio and not at the original size.
            const map = e.target;
            const canvas = map
                .getViewport()
                .querySelector('.ol-layer canvas, canvas.ol-layer');

            // Only capture the area of the image/video. Anything that is drawn
            // outside of it (e.g. the sketch of an active drawing tool at the mouse
            // position) would otherwise add an empty margin to the screenshot.
            const [x, y, width, height] = this.getFileArea(map, canvas);
            const clone = document.createElement('canvas');
            clone.width = width;
            clone.height = height;
            const ctx = clone.getContext('2d');
            ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

            this.makeBlob(clone).then(this.download).catch(this.handleError);
        },
        // Get the area of the image/video on the map canvas as [x, y, width, height],
        // clipped to the canvas.
        getFileArea(map, canvas) {
            const extent = map.getView().getProjection().getExtent();
            const ratio = canvas.width / map.getSize()[0];
            const topLeft = map.getPixelFromCoordinate(getTopLeft(extent));
            const bottomRight = map.getPixelFromCoordinate(getBottomRight(extent));
            const left = Math.max(0, Math.round(topLeft[0] * ratio));
            const top = Math.max(0, Math.round(topLeft[1] * ratio));
            const right = Math.min(canvas.width, Math.round(bottomRight[0] * ratio));
            const bottom = Math.min(canvas.height, Math.round(bottomRight[1] * ratio));

            return [left, top, Math.max(0, right - left), Math.max(0, bottom - top)];
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

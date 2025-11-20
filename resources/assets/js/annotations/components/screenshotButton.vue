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
import { makeBlob } from '../makeBlobFromCanvas';

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
        handleRenderComplete(e) {
            // See: https://openlayers.org/en/v6.15.1/examples/export-map.html
            // This version is modified/simplified because we want the screenshot
            // in the actual device pixel ratio and not at the original size.
            const canvas = e.target
                .getViewport()
                .querySelector('.ol-layer canvas, canvas.ol-layer');

            makeBlob(canvas).then(this.download).catch(this.handleError);
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

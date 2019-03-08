/**
 * An interactive volume thumbnail that shows an overview of volume images
 * on mousemove.
 *
 * @type {Object}
 */
biigle.$component('projects.components.volumeThumbnail', {
    mixins: [biigle.$require('core.mixins.loader')],
    template:
    '<figure class="volume-thumbnail" :class="{loading: loading}" @mouseover="startFetching" @mousemove="updateIndex($event)" @click="clearTimeout" @mouseout="clearTimeout">' +
        '<span class="volume-thumbnail__close close" v-if="removable" @click.prevent="remove" :title="removeTitle">&times;</span>' +
        '<div class="volume-thumbnail__fallback" v-show="showFallback">' +
            '<slot></slot>' +
        '</div>' +
        '<div class="volume-thumbnail__images" v-if="initialized">' +
            '<img @error="failed[i] = true" v-show="thumbShown(i)" :src="thumbUri(uuid)" v-for="(uuid, i) in uuids">' +
        '</div>' +
        '<slot name="caption"></slot>' +
        '<span class="volume-thumbnail__progress" :style="{width: progress}"></span>' +
    '</figure>',
    props: {
        tid: {
            type: Number,
            required: true
        },
        uri: {
            type: String,
            required: true
        },
        format: {
            type: String,
            required: true
        },
        removable: {
            type: Boolean,
            default: false
        },
        removeTitle: {
            type: String,
            default: 'Remove this volume'
        },
    },
    data: function () {
        return {
            // The thumbnail UUIDs to display.
            uuids: [],
            // true if the UUIDs were fetched.
            initialized: false,
            // Index of the thumbnail to display.
            index: 0,
            // true at the index of the thumbnail if it failed to load (does not exist).
            failed: [],
            // ID of the fetching timeout.
            timeoutId: null
        };
    },
    computed: {
        // Width of the progress bar.
        progress: function () {
            if (this.initialized) {
                return (100 * this.index / (this.uuids.length - 1)) + '%';
            }
            // If this.loading is true, the progress bar should serve as a loading
            // indicator.
            return this.loading ? '100%' : '0%';
        },
        showFallback: function () {
            return !this.initialized || this.failed[this.index];
        },
    },
    methods: {
        fetchUuids: function () {
            biigle.$require('api.volumeSample').get({id: this.tid})
                .then(this.uuidsFetched)
                .finally(this.finishLoading);
        },
        uuidsFetched: function (response) {
            if (response.ok) {
                this.uuids = response.data;
                this.initialized = true;
            }
        },
        startFetching: function () {
            if (!this.initialized && !this.loading) {
                this.startLoading();
                // Wait before fetching the thumbnails. Maybe the user just wants to go
                // to the volume or just passes the mouse over the thumbnail. In this
                // case the timeout is cancelled.
                this.timeoutId = window.setTimeout(this.fetchUuids, 1000);
            }
        },
        thumbUri: function (uuid) {
            return this.uri + '/' + uuid[0] + uuid[1] + '/' + uuid[2] + uuid[3] + '/' + uuid + '.' + this.format;
        },
        thumbShown: function (i) {
            return this.index === i && !this.failed[i];
        },
        updateIndex: function (event) {
            var rect = this.$el.getBoundingClientRect();
            this.index = Math.max(0, Math.floor(this.uuids.length * (event.clientX - rect.left) / (rect.width)));
        },
        clearTimeout: function () {
            if (this.timeoutId) {
                window.clearTimeout(this.timeoutId);
                this.timeoutId = null;
                this.finishLoading();
            }
        },
        remove: function () {
            this.clearTimeout();
            this.$emit('remove', this.tid);
        }
    }
});

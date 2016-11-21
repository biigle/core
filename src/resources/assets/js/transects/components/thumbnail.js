/**
 * An interactive transect thumbnail that shows an overview of transect images
 * on mousemove.
 *
 * @type {Object}
 */
biigle.transects.components.thumbnail = {
    template:
    '<figure class="transect-thumbnail" v-bind:class="{loading: loading}" v-on:mouseover="fetchUuids" v-on:mousemove="updateIndex($event)" v-on:click="clearTimeout" v-on:mouseout="clearTimeout">' +
        '<slot></slot>' +
        '<div class="transect-thumbnail__images" v-if="initialized">' +
            '<img v-on:error="failed[i] = true" v-bind:class="{hidden: thumbHidden(i)}" v-bind:src="thumbUri(uuid)" v-for="(uuid, i) in uuids">' +
        '</div>' +
        '<slot name="caption"></slot>' +
        '<span class="transect-thumbnail__progress" v-bind:style="{width: progress}"></span>' +
    '</figure>',
    props: ['tid', 'uri', 'format'],
    data: function () {
        return {
            // The thumbnail UUIDs to display.
            uuids: [],
            // true if the UUIDs were fetched.
            initialized: false,
            // true if the UUIDs are currently being fetched.
            loading: false,
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
        }
    },
    methods: {
        fetchUuids: function () {
            if (this.initialized || this.loading) return;

            var self = this;
            self.loading = true;
            // Wait before fetching the thumbnails. Maybe the user just wants to go
            // to the transect or just passes the mouse over the thumbnail. In this case
            // the timeout is cancelled.
            self.timeoutId = setTimeout(function () {
                biigle.api.transectSample.get({id: self.tid})
                    .then(function (response) {
                        if (response.ok) {
                            self.uuids = response.data;
                            self.initialized = true;
                        }
                    })
                    .finally(function () {
                        self.loading = false;
                    });
            }, 1000);
        },
        thumbUri: function (uuid) {
            return this.uri + '/' + uuid + '.' + this.format;
        },
        thumbHidden: function (i) {
            return this.index !== i || this.failed[i];
        },
        updateIndex: function (event) {
            var rect = this.$el.getBoundingClientRect();
            this.index = Math.floor(this.uuids.length * (event.clientX - rect.left) / (rect.width));
        },
        clearTimeout: function () {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
                this.loading = false;
            }
        }
    }
};

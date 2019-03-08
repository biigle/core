/**
 * An interactive volume thumbnail that shows an overview of volume images
 * on mousemove.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoThumbnail', {
    mixins: [biigle.$require('projects.components.volumeThumbnail')],
    props: {
        uuid: {
            type: String,
            required: true,
        },
        thumbCount: {
            type: Number,
            default: 10,
        },
    },
    methods: {
        fetchUuids: function () {
            this.uuidsFetched({
                ok: true,
                data: Array.apply(null, {length: this.thumbCount})
                    .map(function (value, index) {
                        return this.uuid + '/' + index;
                    }, this),
            });
        },
    },
});

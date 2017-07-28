/**
 * An example annotation patch image.
 *
 * @type {Object}
 */
biigle.$component('largo.components.annotationPatch', {
    props: {
        id: {
            type: Number,
            required: true,
        },
        label: {
            type: Object,
            required: true,
        },
        emptySrc: {
            type: String,
            required: true,
        },
    },
    data: function () {
        return {
            blobUrl: '',
        };
    },
    computed: {
        title: function () {
            return 'Example annotation for label ' + this.label.name;
        },
        src: function () {
            return this.blobUrl || this.emptySrc;
        },
    },
    methods: {
        setBlobUrl: function (response) {
            var urlCreator = window.URL || window.webkitURL;
            this.blobUrl = urlCreator.createObjectURL(response.body);
        },
    },
    created: function () {
        biigle.$require('largo.api.annotations').get({id: this.id})
            .then(this.setBlobUrl);
    },
    destroyed: function () {
        if (this.blobUrl) {
            var urlCreator = window.URL || window.webkitURL;
            urlCreator.revokeObjectURL(this.blobUrl);
        }
    },
});

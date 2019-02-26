/**
 * An example annotation patch image.
 *
 * @type {Object}
 */
biigle.$component('largo.components.annotationPatch', {
    mixins: [biigle.$require('largo.mixins.annotationPatch')],
    props: {
        id: {
            type: String,
            required: true,
        },
        uuid: {
            type: String,
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
        urlTemplate: {
            type: String,
            required: true,
        },
    },
    data: function () {
        return {
            url: '',
        };
    },
    computed: {
        title: function () {
            return 'Example annotation for label ' + this.label.name;
        },
        src: function () {
            return this.url || this.emptySrc;
        },
    },
    methods: {
        showEmptyImage: function () {
            this.url = '';
        },
    },
    created: function () {
        this.url = this.getUrl();
    },
});

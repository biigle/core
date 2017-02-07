/**
 * An image of the Largo image grid
 *
 * @type {Object}
 */
biigle.$component('largo.components.imageGridImage', {
    template: '<figure class="image-grid__image">' +
        '<img :src="url || emptyUrl">' +
    '</figure>',
    data: function () {
        return {
            url: '',
            timeout: null,
        };
    },
    props: {
        id: {
            required: true,
        },
        emptyUrl: {
            type: String,
            required: true,
        },
    },
    computed: {
    },
    methods: {
        requestBlob: function () {
            return biigle.$require('largo.api.annotations').get({id: this.id});
        }
    },
    created: function () {
        var blobs = biigle.$require('largo.stores.blobs');
        if (blobs.hasOwnProperty(this.id)) {
            this.url = blobs[this.id];
        } else {
            var self = this;
            // use a timeout to skip requests when scrolling fast
            this.timeout = setTimeout(function () {
                self.requestBlob().then(function (response) {
                    var urlCreator = window.URL || window.webkitURL;
                    self.url = urlCreator.createObjectURL(response.body);
                    blobs[self.id] = self.url;
                });
            }, 50);
        }
    },
    beforeDestroy: function () {
        clearTimeout(this.timeout);
    },
});

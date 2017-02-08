/**
 * An image of the Largo image grid
 *
 * @type {Object}
 */
biigle.$component('volumes.components.imageGridImage', {
    template: '<figure class="image-grid__image" :class="classObject">' +
        '<img @click="toggleSelect" :src="url || emptyUrl" @error="showEmptyImage">' +
    '</figure>',
    data: function () {
        return {
            url: '',
            timeout: null,
        };
    },
    props: {
        image: {
            type: Object,
            required: true,
        },
        emptyUrl: {
            type: String,
            required: true,
        },
    },
    computed: {
        classObject: function () {
            return {
                'image-grid__image--selected': this.selected,
            };
        },
        selected: function () {
            return false;
        }
    },
    methods: {
        toggleSelect: function () {
            if (this.selected) {
                this.$emit('deselect', this.image);
            } else {
                this.$emit('select', this.image);
            }
        },
        gotBlob: function (response) {
            var urlCreator = window.URL || window.webkitURL;
            this.url = urlCreator.createObjectURL(response.body);
            this.image.blob = this.url;
        },
        showEmptyImage: function () {
            this.url = this.emptyUrl;
        },
    },
    created: function () {
        if (this.image.url) {
            this.url = this.image.url;
        } else if (this.image.blob) {
            this.url = this.image.blob;
        } else if (this.getUrl) {
            this.url = this.getUrl();
        } else if (this.getBlob) {
            var self = this;
            // use a timeout to skip requests when scrolling fast
            this.timeout = setTimeout(function () {
                self.getBlob().then(self.gotBlob);
            }, 50);
        }
    },
    beforeDestroy: function () {
        clearTimeout(this.timeout);
    },
});

/**
 * An image of the Largo image grid
 *
 * @type {Object}
 */
biigle.$component('largo.components.imageGridImage', {
    template: '<figure class="image-grid__image" :class="classObject">' +
        '<img @click="toggleSelect" :src="url || emptyUrl">' +
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
    },
    created: function () {
        if (this.image.blob) {
            this.url = this.image.blob;
        } else if (this.getBlob) {
            var self = this;
            // use a timeout to skip requests when scrolling fast
            this.timeout = setTimeout(function () {
                self.getBlob().then(function (response) {
                    var urlCreator = window.URL || window.webkitURL;
                    self.url = urlCreator.createObjectURL(response.body);
                    self.image.blob = self.url;
                });
            }, 50);
        }
    },
    beforeDestroy: function () {
        clearTimeout(this.timeout);
    },
});

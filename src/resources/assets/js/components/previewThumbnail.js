/**
 * An interactive thumbnail that shows an overview of (volume) images
 * on mousemove.
 *
 * @type {Object}
 */
biigle.$component('projects.components.previewThumbnail', {
    template:
    '<figure ' +
        'class="preview-thumbnail" ' +
        '@mousemove="updateIndex($event)" ' +
        '@mouseenter="updateHovered" ' +
        '>' +
            '<i ' +
                'v-if="icon" ' +
                'class="preview-thumbnail__icon fas fa-lg"' +
                ':class="iconClass" '+
                '></i>' +
            '<span ' +
                'v-if="removable" ' +
                'class="preview-thumbnail__close close" ' +
                '@click.prevent="remove" ' +
                ':title="removeTitle" ' +
                '>&times;</span>' +
            '<div class="preview-thumbnail__fallback">' +
                '<slot></slot>' +
            '</div>' +
            '<div class="preview-thumbnail__images" v-if="showPreview">' +
                '<img ' +
                    'v-for="(uri, i) in uris" ' +
                    'v-show="thumbShown(i)" ' +
                    '@error="failed(i)" ' +
                    ':src="uri" ' +
                    '>' +
            '</div>' +
            '<slot name="caption"></slot>' +
            '<span ' +
                'v-show="someLoaded" ' +
                'class="preview-thumbnail__progress" ' +
                ':style="{width: progress}" ' +
                '></span>' +
    '</figure>',
    props: {
        id: {
            type: Number,
            required: true,
        },
        // Either as array or comma separated string.
        thumbUris: {
            required: true,
        },
        removable: {
            type: Boolean,
            default: false,
        },
        removeTitle: {
            type: String,
            default: 'Remove this volume',
        },
        icon: {
            type: String,
        },
    },
    data: function () {
        return {
            index: 0,
            uris: [],
            hovered: false,
        };
    },
    computed: {
        // Width of the progress bar.
        progress: function () {
            return (100 * this.index / (this.uris.length - 1)) + '%';
        },
        showFallback: function () {
            return this.uris[this.index] === false;
        },
        showPreview: function () {
            return this.hovered && this.someLoaded;
        },
        someLoaded: function () {
            return this.uris.reduce(function (carry, item) {
                return carry || item !== false;
            }, false);
        },
        iconClass: function () {
            return this.icon ? 'fa-' + this.icon : '';
        },
    },
    methods: {
        thumbShown: function (i) {
            return this.index === i && !this.failed[i];
        },
        updateIndex: function (event) {
            var rect = this.$el.getBoundingClientRect();
            this.index = Math.max(0, Math.floor(this.uris.length * (event.clientX - rect.left) / (rect.width)));
        },
        remove: function () {
            this.$emit('remove', this.id);
        },
        failed: function(i) {
            this.uris.splice(i, 1, false);
        },
        updateHovered: function () {
            this.hovered = true;
        },
    },
    created: function () {
        if (Array.isArray(this.thumbUris)) {
            this.uris = this.thumbUris.slice();
        } else {
            this.uris = this.thumbUris.split(',');
        }
    }
});

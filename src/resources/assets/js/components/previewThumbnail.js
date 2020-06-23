/**
 * An interactive thumbnail that shows an overview of (volume) images
 * on mousemove.
 *
 * @type {Object}
 */
export default {
    template:
    `<figure
        class="preview-thumbnail"
        @mousemove="updateIndex($event)"
        @mouseenter="updateHovered"
        >
            <i
                v-if="icon"
                class="preview-thumbnail__icon fas fa-lg"
                :class="iconClass"
                ></i>
            <span
                v-if="removable"
                class="preview-thumbnail__close close"
                @click.prevent="remove"
                :title="removeTitle"
                >&times;</span>
            <div class="preview-thumbnail__images" v-if="showPreview">
                <img
                    v-for="(uri, i) in uris"
                    v-show="thumbShown(i)"
                    @error="failed(i)"
                    :src="uri"
                    >
            </div>
            <div v-else class="preview-thumbnail__fallback">
                <slot></slot>
            </div>
            <slot name="caption"></slot>
            <span
                v-show="someLoaded"
                class="preview-thumbnail__progress"
                :style="{width: progress}"
                ></span>
    </figure>`,
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
    data() {
        return {
            index: 0,
            uris: [],
            hovered: false,
        };
    },
    computed: {
        // Width of the progress bar.
        progress() {
            return (100 * this.index / (this.uris.length - 1)) + '%';
        },
        showFallback() {
            return this.uris[this.index] === false;
        },
        showPreview() {
            return this.hovered && this.someLoaded;
        },
        someLoaded() {
            return this.uris.reduce((carry, item) => carry || item !== false, false);
        },
        iconClass() {
            return this.icon ? 'fa-' + this.icon : '';
        },
    },
    methods: {
        thumbShown(i) {
            return this.index === i && !this.failed[i];
        },
        updateIndex(event) {
            let rect = this.$el.getBoundingClientRect();
            this.index = Math.max(0, Math.floor(this.uris.length * (event.clientX - rect.left) / (rect.width)));
        },
        remove() {
            this.$emit('remove', this.id);
        },
        failed: function(i) {
            this.uris.splice(i, 1, false);
        },
        updateHovered() {
            this.hovered = true;
        },
    },
    created() {
        if (Array.isArray(this.thumbUris)) {
            this.uris = this.thumbUris.slice();
        } else {
            this.uris = this.thumbUris.split(',');
        }
    },
};

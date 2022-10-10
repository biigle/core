<template>
    <figure class="image-grid__image" :class="classObject">
        <div v-if="showIcon" class="image-icon">
            <i class="fas" :class="iconClass"></i>
        </div>
        <img @click="toggleSelect" :src="srcUrl" @error="showEmptyImage">
    </figure>
</template>

<script>
/**
 * An image of the Largo image grid
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            thumbnailUrl: null,
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
        selectable: {
            type: Boolean,
            required: false,
        },
        selectedIcon: {
            type: String,
            default: 'check',
        },
        selectedFade: {
            type: Boolean,
            default: true,
        },
        smallIcon: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        classObject() {
            return {
                'image-grid__image--selected': this.selected,
                'image-grid__image--selectable': this.selectable,
                'image-grid__image--fade': this.selectedFade,
                'image-grid__image--small-icon': this.smallIcon,
            };
        },
        selected() {
            return false;
        },
        iconClass() {
            return 'fa-' + this.selectedIcon;
        },
        showIcon() {
            return this.selectable || this.selected;
        },
        srcUrl() {
            if (Array.isArray(this.thumbnailUrl)) {
                return this.thumbnailUrl[0];
            } else if (this.thumbnailUrl) {
                return this.thumbnailUrl;
            }

            return this.emptyUrl;
        },
    },
    methods: {
        toggleSelect(event) {
            if (this.selectable) {
                this.$emit('select', this.image, event);
            }
        },
        gotBlob(response) {
            let urlCreator = window.URL || window.webkitURL;
            this.thumbnailUrl = urlCreator.createObjectURL(response.body);
            /* eslint vue/no-mutating-props: "off" */
            this.image.blob = this.thumbnailUrl;
        },
        showEmptyImage() {
            this.thumbnailUrl = null;
        },
    },
    created() {
        if (this.image.thumbnailUrl) {
            this.thumbnailUrl = this.image.thumbnailUrl;
        } else if (this.image.blob) {
            this.thumbnailUrl = this.image.blob;
        } else if (this.getThumbnailUrl) {
            this.thumbnailUrl = this.getThumbnailUrl();
        } else if (this.getBlob) {
            // use a timeout to skip requests when scrolling fast
            this.timeout = setTimeout(() => this.getBlob().then(this.gotBlob), 50);
        }
    },
    beforeDestroy() {
        clearTimeout(this.timeout);
    },
};
</script>

/**
 * An image of the Largo image grid
 *
 * @type {Object}
 */
export default {
    template: `<figure class="image-grid__image" :class="classObject">
        <div v-if="showIcon" class="image-icon">
            <i class="fas" :class="iconClass"></i>
        </div>
        <img @click="toggleSelect" :src="url || emptyUrl" @error="showEmptyImage">
    </figure>`,
    data() {
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
    },
    methods: {
        toggleSelect(event) {
            if (this.selectable) {
                this.$emit('select', this.image, event);
            }
        },
        gotBlob(response) {
            let urlCreator = window.URL || window.webkitURL;
            this.url = urlCreator.createObjectURL(response.body);
            this.image.blob = this.url;
        },
        showEmptyImage() {
            this.url = this.emptyUrl;
        },
    },
    created() {
        if (this.image.url) {
            this.url = this.image.url;
        } else if (this.image.blob) {
            this.url = this.image.blob;
        } else if (this.getUrl) {
            this.url = this.getUrl();
        } else if (this.getBlob) {
            // use a timeout to skip requests when scrolling fast
            this.timeout = setTimeout(() => this.getBlob().then(this.gotBlob), 50);
        }
    },
    beforeDestroy() {
        clearTimeout(this.timeout);
    },
};

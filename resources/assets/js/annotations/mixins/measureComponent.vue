<script>
/**
 * Stuff that a component needs to measure lengths
 *
 * @type {Object}
 */
export default {
    props: {
        image: {
            type: Object,
            default: null
        },
        areas: {
            type: Object,
            default: null
        },
    },
    computed: {
        area() {
            if (this.areas && this.image) {
                return this.areas[this.image.id] || -1;
            }

            return -1;
        },
        hasArea() {
            return this.area !== -1;
        },
        pxWidthInMeter() {
            if (!this.hasArea || !this.image) {
                return null;
            }

            return Math.sqrt(this.area / (this.image.width * this.image.height));
        },
    }
};
</script>

/**
 * Tooltip showing information on the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.mixins.annotationTooltip', {
    props: {
        annotations: {
            required: true,
            type: Array,
        },
        position: {
            required: true,
            type: Array,
        },
        show: {
            required: true,
            type: Boolean,
        },
        positioning: {
            type: String,
            default: 'top-left',
        },
    },
    computed: {
        hasAnnotations: function () {
            return this.annotations.length > 0;
        },
        showThis: function () {
            return this.show && this.hasAnnotations;
        },
    },
    watch: {
        position: function (position) {
            this.overlay.setPosition(position);
        },
        showThis: function (show) {
            if (show) {
                this.$parent.map.addOverlay(this.overlay);
            } else {
                this.$parent.map.removeOverlay(this.overlay);
            }
        },
    },
    mounted: function () {
        this.overlay = new ol.Overlay({
            element: this.$el,
            offset: [15, 0],
            positioning: this.positioning,
        });
    },
    beforeDestroy: function () {
        this.$parent.map.removeOverlay(this.overlay);
    },
});

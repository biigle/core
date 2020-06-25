/**
 * Mixin for the videoScreen component that contains logic for the tooltips.
 *
 * @type {Object}
 */
biigle.$component('videos.components.videoScreen.tooltips', function () {
    return {
        components: {
            labelTooltip: biigle.$require('annotations.components.labelTooltip'),
        },
        data: function () {
            return {
                // Used to determine when to notify watchers for hovered annotations.
                hoveredFeaturesHash: '',
            };
        },
        computed: {
            showTooltip: function () {
                return this.isDefaultInteractionMode && this.showLabelTooltip;
            },
        },
        methods: {
            annotationLayerFilter: function (layer) {
                return layer.get('name') === 'annotations';
            },
            updateHoveredAnnotations: function (e) {
                var features = this.map.getFeaturesAtPixel(e.pixel, {layerFilter: this.annotationLayerFilter}) || [];
                var hash = features.map(function (f) {return f.getId();}).join('-');

                if (this.hoveredFeaturesHash !== hash) {
                    this.hoveredFeaturesHash = hash;
                    this.$emit('hoverFeatures', features);
                }
            },
            resetHoveredAnnotations: function () {
                this.hoveredFeaturesHash = '';
                this.$emit('hoverFeatures', []);
            },
            updateTooltipEventListeners: function () {
                if (this.showTooltip) {
                    this.map.on('pointermove', this.updateHoveredAnnotations);
                } else {
                    this.map.un('pointermove', this.updateHoveredAnnotations);
                    this.resetHoveredAnnotations();
                }
            },
        },
        watch: {
            showTooltip: function () {
                this.updateTooltipEventListeners();
            },
        },
        created: function () {
            this.$once('map-created', this.updateTooltipEventListeners);
        },
    };
});

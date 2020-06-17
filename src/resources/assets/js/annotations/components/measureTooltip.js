/**
 * Tooltip showing length/area of the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.measureTooltip', {
    template: '<div class="annotation-tooltip">' +
        '<ul class="annotation-tooltip__annotations">' +
            '<li v-for="measure in measuredGeometries" v-text="measure"></li>' +
        '</ul>' +
    '</div>',
    mixins: [
        biigle.$require('annotations.mixins.annotationTooltip'),
        biigle.$require('annotations.mixins.measureComponent'),
    ],
    data() {
        return {
            measuredGeometries: [],
        };
    },
    computed: {
        areaUnitMultipliers() {
            return this.unitMultipliers.map(function (multiplier) {
                return Math.pow(multiplier, 2);
            });
        },
    },
    methods: {
        updateGeometries(features) {
            this.measuredGeometries = features.map(function (feature) {
                    return feature.getGeometry();
                })
                .filter(function (geom) {
                    return this.isAeraGeometry(geom) || this.isLengthGeometry(geom);
                }, this)
                .map(function (geom) {
                    return this.measure(geom);
                }, this);
        },
        measure(geom) {
            if (geom.getArea) {
                return this.formatArea(geom.getArea());
            } else if (geom.getLength) {
                return this.formatLength(geom.getLength());
            } else if (geom.getRadius) {
                return this.formatArea(Math.pow(geom.getRadius(), 2) * Math.PI);
            }

            return '';
        },
        isAeraGeometry(geom) {
            return geom instanceof ol.geom.Polygon || geom instanceof ol.geom.Circle;
        },
        isLengthGeometry(geom) {
            return geom instanceof ol.geom.LineString;
        },
        formatArea(area) {
            var unit = 'px²';

            if (this.hasArea) {
                area *= Math.pow(this.pxWidthInMeter, 2);
                var index = this.unitNearest(area, this.areaUnitMultipliers, 1e-3);
                unit = this.unitNames[index] + '²';
                area = area / this.areaUnitMultipliers[index];
            }

            return this.formatMeasurement(area, unit, 3);
        },
        formatLength(length) {
            var unit = 'px';

            if (this.hasArea) {
                length = length * this.pxWidthInMeter;
                var index = this.unitNearest(length, this.unitMultipliers);
                unit = this.unitNames[index];
                length = length / this.unitMultipliers[index];
            }

            return this.formatMeasurement(length, unit);
        },
        formatMeasurement(measurement, unit, decimals) {
            decimals = Math.pow(10, decimals || 1);
            return (Math.round(measurement * decimals) / decimals) + ' ' + unit;
        },
        unitNearest(measurement, multipliers, min) {
            if (measurement === 0) {
                return multipliers.length - 1;
            }

            min = min || 1;
            var tmpMeasurement;
            for (var i = multipliers.length - 1; i >= 0 ; i--) {
                tmpMeasurement = measurement / multipliers[i];
                if (tmpMeasurement >= min && tmpMeasurement < 1000) {
                    break;
                }
            }

            return i;
        },
    },
    watch: {
        show(show) {
            // Do NOT pass the features as prop of this component because this would make
            // them reactive. As the features store a reference back to the map,
            // EVERYTHING would be made reactive.
            // See: https://github.com/biigle/annotations/issues/108
            if (show) {
                this.$parent.$on(this.watch, this.updateGeometries);
            } else {
                this.$parent.$off(this.watch, this.updateGeometries);
            }
        },
    }
});

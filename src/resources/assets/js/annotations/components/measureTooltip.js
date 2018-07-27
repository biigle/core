/**
 * Tooltip showing length/area of the hovered annotations.
 *
 * @type {Object}
 */
biigle.$component('annotations.components.measureTooltip', {
    mixins: [
        biigle.$require('annotations.mixins.annotationTooltip'),
        biigle.$require('annotations.mixins.measureComponent'),
    ],
    computed: {
        geometries: function () {
            return this.annotations.map(function (annotation) {
                return annotation.getGeometry();
            });
        },
        measurableGeometries: function () {
            return this.geometries.filter(function (geom) {
                return this.isAeraGeometry(geom) || this.isLengthGeometry(geom);
            }, this);
        },
        measuredGeometries: function () {
            return this.measurableGeometries.map(function (geom) {
                return this.measure(geom);
            }, this);
        },
        areaUnitMultipliers: function () {
            return this.unitMultipliers.map(function (multiplier) {
                return Math.pow(multiplier, 2);
            });
        },
    },
    methods: {
        measure: function (geom) {
            if (geom.getArea) {
                return this.formatArea(geom.getArea());
            } else if (geom.getLength) {
                return this.formatLength(geom.getLength());
            } else if (geom.getRadius) {
                return this.formatArea(Math.pow(geom.getRadius(), 2) * Math.PI);
            }

            return '';
        },
        isAeraGeometry: function (geom) {
            return geom instanceof ol.geom.Polygon || geom instanceof ol.geom.Circle;
        },
        isLengthGeometry: function (geom) {
            return geom instanceof ol.geom.LineString;
        },
        formatArea: function (area) {
            var unit = 'px²';

            if (this.hasArea) {
                area *= Math.pow(this.pxWidthInMeter, 2);
                var index = this.unitNearest(area, this.areaUnitMultipliers, 1e-3);
                unit = this.unitNames[index] + '²';
                area = area / this.areaUnitMultipliers[index];
            }

            return this.formatMeasurement(area, unit, 3);
        },
        formatLength: function (length) {
            var unit = 'px';

            if (this.hasArea) {
                length = length * this.pxWidthInMeter;
                var index = this.unitNearest(length, this.unitMultipliers);
                unit = this.unitNames[index];
                length = length / this.unitMultipliers[index];
            }

            return this.formatMeasurement(length, unit);
        },
        formatMeasurement: function (measurement, unit, decimals) {
            decimals = Math.pow(10, decimals || 1);
            return (Math.round(measurement * decimals) / decimals) + ' ' + unit;
        },
        unitNearest: function (measurement, multipliers, min) {
            min = min || 1;
            var tmpMeasurement;
            for (var i = multipliers.length -1; i >= 0 ; i--) {
                tmpMeasurement = measurement / multipliers[i];
                if (tmpMeasurement >= min && tmpMeasurement < 1000) {
                    break;
                }
            }

            return i;
        },
    },
});

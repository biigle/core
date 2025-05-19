<template>
    <div class="annotation-tooltip">
        <ul class="annotation-tooltip__annotations">
            <li v-for="measure in measuredGeometries" v-text="measure"></li>
        </ul>
    </div>
</template>

<script>
import AnnotationTooltip from '../mixins/annotationTooltip.vue';
import MeasureComponent from '../mixins/measureComponent.vue';
import Polygon from '@biigle/ol/geom/Polygon';
import Circle from '@biigle/ol/geom/Circle';
import LineString from '@biigle/ol/geom/LineString';

/**
 * Tooltip showing length/area of the hovered annotations.
 *
 * @type {Object}
 */
export default {
    extends: AnnotationTooltip,
    mixins: [MeasureComponent],
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
                .filter((geom) => {
                    return this.isAeraGeometry(geom) || this.isLengthGeometry(geom);
                })
                .map((geom) => {
                    return this.measure(geom);
                });
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
            return geom instanceof Polygon || geom instanceof Circle;
        },
        isLengthGeometry(geom) {
            return geom instanceof LineString;
        },
        formatArea(area) {
            let unit = 'px²';

            if (this.hasArea) {
                area *= Math.pow(this.pxWidthInMeter, 2);
                let index = this.unitNearest(area, this.areaUnitMultipliers, 1e-3);
                unit = this.unitNames[index] + '²';
                area = area / this.areaUnitMultipliers[index];
            }

            return this.formatMeasurement(area, unit, 3);
        },
        formatLength(length) {
            let unit = 'px';

            if (this.hasArea) {
                length = length * this.pxWidthInMeter;
                let index = this.unitNearest(length, this.unitMultipliers);
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
            let tmpMeasurement;
            let i;
            for (i = multipliers.length - 1; i >= 0 ; i--) {
                tmpMeasurement = measurement / multipliers[i];
                if (tmpMeasurement >= min && tmpMeasurement < 1000) {
                    break;
                }
            }

            return i;
        },
    },
    watch: {
        // This is a shallow array watcher on purpose.
        features(features) {
            if (this.show) {
                this.updateGeometries(features);
            }
        },
    }
};
</script>

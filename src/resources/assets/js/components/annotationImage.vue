<template>
    <svg v-if="hasSVG" xmlns="http://www.w3.org/2000/svg" :width="width" :height="height" @click="toggleSelect">
        <image :href="srcUrl" @error="showEmptyImage" />
        <component :is="component" :svgXML="svgXML" :labelColor="labelColor" :viewBox="viewBox"></component>
    </svg>
    <img v-else :src="srcUrl" @click="toggleSelect" @error="showEmptyImage">
</template>

<script>
import RectangleSVG from './annotationShapes/rectangle';
import CircleSVG from './annotationShapes/circle';
import EllipseSVG from './annotationShapes/ellipse';
import LineSVG from './annotationShapes/line';
import PolygonSVG from './annotationShapes/polygon';

export default {
    components: {
        RectangleSVG,
        CircleSVG,
        EllipseSVG,
        LineSVG,
        PolygonSVG,
    },
    data() {
        return {
            svgXML: SVGSVGElement,
        }
    },
    props: {
        svg: String,
        srcUrl: String,
        toggleSelect: Function,
        showEmptyImage: Function,
        labelColor: String,
    },
    computed: {
        width() {
            return this.svgXML.getAttribute('width');
        },
        height() {
            return this.svgXML.getAttribute('height');
        },
        viewBox() {
            return this.svgXML.getAttribute('viewBox');
        },
        hasSVG() {
            return this.svg.length > 0;
        },
        component() {
            let shape2comp = new Object({
                'rect': 'RectangleSVG',
                'circle': 'CircleSVG',
                'ellipse': 'EllipseSVG',
                'line': 'LineSVG',
                'polygon': 'PolygonSVG'
            });
            return shape2comp[this.svgXML.childNodes[0].nodeName];
        },
    },
    created() {
        if (this.hasSVG) {
            this.svgXML = new DOMParser().parseFromString(this.svg, "text/xml").documentElement;
        }
    }
}

</script>
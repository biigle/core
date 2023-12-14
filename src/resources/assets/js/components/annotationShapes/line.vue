<template>
    <svg width="100%" height="100%" :viewBox="viewBox">
        <line :x1="x1" :y1="y1" :x2="x2" :y2="y2" class="label-color outline" style="--color: white"
            vector-effect="non-scaling-stroke"></line>
        <line :x1="x1" :y1="y1" :x2="x2" :y2="y2" class="label-color innerline" :style="'--color: #' + this.labelColor"
            vector-effect="non-scaling-stroke">
        </line>
    </svg>
</template>

<script>
import Shape from './mixins/shape.vue';

export default {
    mixins: [Shape],
    props: {
        svgXML: SVGSVGElement,
        labelColor: String,
        viewBox: String
    },
}
</script>
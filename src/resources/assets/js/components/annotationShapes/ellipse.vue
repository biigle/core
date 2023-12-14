<template>
    <svg width="100%" height="100%" :viewBox="viewBox">
        <ellipse :cx="cx" :cy="cy" :rx="rx" :ry="ry" :transform="transform" class="label-color outline"
            style="--color: white" vector-effect="non-scaling-stroke"></ellipse>
        <ellipse :cx="cx" :cy="cy" :rx="rx" :ry="ry" :transform="transform" class="label-color innerline"
            :style="'--color: #' + this.labelColor" vector-effect="non-scaling-stroke"></ellipse>
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
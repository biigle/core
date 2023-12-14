<template>
    <svg width="100%" height="100%" :viewBox="viewBox">
        <rect id="test" :x="x" :y="y" :width="width" :height="height" :transform="transform" class="label-color outline"
            style="--color: white" vector-effect="non-scaling-stroke"></rect>
        <rect id="test" :x="x" :y="y" :width="width" :height="height" :transform="transform" class="label-color innerline"
            :style="'--color: #' + this.labelColor" vector-effect="non-scaling-stroke"></rect>
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
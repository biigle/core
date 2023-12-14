<template>
    <svg v-if="isCircle" width="100%" height="100%" :viewBox="viewBox">
        <circle :cx="cx" :cy="cy" :r="r" class="label-color outline" style="--color: white"
            vector-effect="non-scaling-stroke"></circle>
        <circle :cx="cx" :cy="cy" :r="r" class="label-color innerline" :style="'--color: #' + this.labelColor"
            vector-effect="non-scaling-stroke"></circle>
    </svg>
    <svg v-else width="100%" height="100%" :viewBox="viewBox">
        <circle :cx="cx" :cy="cy" r="5" class="point" style="--color: white"></circle>
        <circle :cx="cx" :cy="cy" r="4" class="point" :style="'--color: #' + this.labelColor"></circle>
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
    computed: {
        isCircle() {
            return this.r > 1;
        }
    }
}
</script>
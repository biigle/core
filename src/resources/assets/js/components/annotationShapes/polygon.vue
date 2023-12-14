<template>
    <svg width="100%" height="100%" :viewBox="viewBox">
        <polygon :points="points" class="label-color outline" style="--color: white" vector-effect="non-scaling-stroke">
        </polygon>
        <polygon :points="points" class="label-color innerline" :style="'--color: #' + this.labelColor"
            vector-effect="non-scaling-stroke"></polygon>
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
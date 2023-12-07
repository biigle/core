<template>
    <rect :x="x" :y="y" :width="width" :height="height" :transform="transform"></rect>
</template>

<script>
import Shape from './mixins/Shape.vue';

export default{
    mixins: [Shape],
    props: {
        svgXML: null
    },
}
</script>
<template>
    <ellipse :cx="cx" :cy="cy" :rx="rx" :ry="ry" :transform="transform"></ellipse>

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
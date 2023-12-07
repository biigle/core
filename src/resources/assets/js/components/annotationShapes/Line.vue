<template>
    <line :x1="x1" :y1="y1" :x2="x2" :y2="y2"></line>
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
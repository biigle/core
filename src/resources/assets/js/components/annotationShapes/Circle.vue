<template>
    <circle :cx="cx" :cy="cy" :r="r"></circle>

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
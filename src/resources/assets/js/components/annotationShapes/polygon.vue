<template>
    <polygon :points="points"></polygon>

</template>

<script>
import Shape from './mixins/Shape.vue';

export default{
    mixins: [Shape],
    props: {
        svgXML: SVGSVGElement 
    },
}
</script>
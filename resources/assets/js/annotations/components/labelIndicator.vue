<template>
<div class="label-indicator" title="Currently selected label" v-text="label.name"></div>
</template>
<script>
/**
 * The label indicator of the canvas element
 *
 * @type {Object}
 */
export default {
    props: {
        label: {
            required: true,
        },
    },
};
</script>

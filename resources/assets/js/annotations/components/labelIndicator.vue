<template>
<div class="label-indicator" title="Currently selected label">
    <span class="labelbot-indicator__color" :style="{ backgroundColor: '#'+label.color }"></span>
    {{ label.name }}
</div>
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
            type: Object,
        },
    },
};
</script>

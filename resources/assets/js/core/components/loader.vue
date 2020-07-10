<template>
    <span class="loader" :class="classObject"></span>
</template>

<script>
/**
 * A component for a loading spinner
 *
 * @type {Object}
 */
export default {
    props: {
        active: {
            type: Boolean,
            required: true,
        },
        fancy: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        classObject() {
            return {
                'loader--active': this.active,
                'loader--fancy': this.fancy,
            };
        },
    },
};
</script>

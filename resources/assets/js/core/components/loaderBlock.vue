<template>
    <div class="loader-block" :class="classObject">
        <loader :active="active" :fancy="true"></loader>
    </div>
</template>

<script>
import Loader from './loader';

/**
 * A component for a loading spinner element that acts as blocking overlay
 *
 * @type {Object}
 */
export default {
    components: {
        loader: Loader,
    },
    props: {
        active: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        classObject() {
            return {
                'loader-block--active': this.active,
            };
        },
    },
};
</script>

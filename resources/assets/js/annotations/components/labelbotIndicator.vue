<template>
    <span class="labelbot-state" :class="classObject">
    </span>
</template>

<script>
export default {
    props: {
        labelbotState: {
            type: String,
            required: true,
        }
    },
    computed: {
        classObject() {
            return this.labelbotState || '';
        }
    }
}
</script>

<template>
    <div
        class="labelbot-indicator"
        :title="'LabelBOT is ' + labelbotState"
        :class="classObject"
        >
        <span class="labelbot-indicator__dot"></span>
        LabelBOT
    </div>
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
        },
    },
}
</script>

<template>
<div>
    <div class="form-group">
        <power-toggle
            title="Show the labels of each {{type}}"
            :active="showLabels"
            v-on:on="enableLabels"
            v-on:off="disableLabels"
            >
                Show labels of each {{type}}
        </power-toggle>
        <loader :active="loadingLabels"></loader>
    </div>
    <label-trees
        :trees="labelTrees"
        :project-ids="projectIds"
        :show-favourites="true"
        v-on:select="handleSelectedLabel"
        v-on:deselect="handleDeselectedLabel"
        v-on:clear="handleDeselectedLabel"
        ></label-trees>
</div>
</template>
<script>
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import PowerToggle from '@/core/components/powerToggle.vue';

/**
 * View model for the volume filter tab
 */
export default {
    emits: [
        'deselect',
        'disable-labels',
        'enable-labels',
        'select',
    ],
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
        powerToggle: PowerToggle,
    },
    props: {
        volumeId: {
            type: Number,
            required: true,
        },
        showLabels: {
            type: Boolean,
            default: false,
        },
        loadingLabels: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            labelTrees: [],
            projectIds: [],
        };
    },
    methods: {
        handleSelectedLabel(label) {
            this.$emit('select', label);
        },
        handleDeselectedLabel(label) {
            this.$emit('deselect', label);
        },
        enableLabels() {
            this.$emit('enable-labels');
        },
        disableLabels() {
            this.$emit('disable-labels');
        },
    },
    created() {
        this.labelTrees = biigle.$require('volumes.labelTrees');
        this.projectIds = biigle.$require('volumes.projectIds');
    },
};
</script>

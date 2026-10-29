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
    <annotation-guideline-selector
        :model-value="guideline"
        :guidelines="guidelines"
        :must-use-guideline="mustUseGuideline"
        :volume-id="volumeId"
        :show-shapes="false"
        v-on:update:model-value="handleSelectedGuideline"
        ></annotation-guideline-selector>
    <label-trees
        :trees="labelTrees"
        :sorting-project-ids="projectIds"
        :show-favourites="true"
        :labels-in-guideline="labelsInGuideline"
        :enforce-guideline="enforceGuideline"
        v-on:select="handleSelectedLabel"
        v-on:deselect="handleDeselectedLabel"
        v-on:clear="handleDeselectedLabel"
        ></label-trees>
</div>
</template>
<script>
import AnnotationGuideline from '@/core/models/AnnotationGuideline.js';
import AnnotationGuidelineSelector from './annotationGuidelineSelector.vue';
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
        'select-guideline',
    ],
    mixins: [LoaderMixin],
    components: {
        annotationGuidelineSelector: AnnotationGuidelineSelector,
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
            guidelines: [],
            mustUseGuideline: false,
            guideline: null,
        };
    },
    computed: {
        labelsInGuideline() {
            return this.guideline?.labelIds ?? [];
        },
        enforceGuideline() {
            return !!this.guideline?.isEnforced;
        },
    },
    methods: {
        handleSelectedLabel(label) {
            this.$emit('select', label);
        },
        handleDeselectedLabel(label) {
            this.$emit('deselect', label);
        },
        handleSelectedGuideline(guideline) {
            this.guideline = guideline;
            this.$emit('select-guideline', guideline);
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
        // File labels have no shape, so no shape names are required.
        this.guidelines = biigle.$require('volumes.annotationGuidelines')
            .map(g => new AnnotationGuideline(g, {}));
        this.mustUseGuideline = biigle.$require('volumes.mustUseAnnotationGuideline');
    },
};
</script>

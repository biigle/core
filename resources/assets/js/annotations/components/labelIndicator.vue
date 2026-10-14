<template>
<div class="label-indicator">
    <span title="Currently selected label">
        <span class="labelbot-indicator__color" :style="{ backgroundColor: '#'+label.color }"></span>
        {{ label.name }}
    </span>
    <div v-if="hasGuidelineInfo" class="label-indicator__guideline text-muted">
        <div v-if="guidelineLabelShape">
            <span v-if="guideline?.enforced_for_user">
                Allowed shape:
            </span>
            <span v-else>
                Preferred shape:
            </span>
            <i class="icon" :class="`icon-${guidelineLabelShape.toLowerCase()}`" :title="guidelineLabelShape"></i>
        </div>
        <p
            v-if="guidelineLabel.description"
            class="label-indicator__description"
            v-text="guidelineLabel.description"
            ></p>
        <img
            v-if="guidelineLabel.reference_image_url"
            class="label-indicator__image"
            :src="guidelineLabel.reference_image_url"
            alt="Reference image of the label"
            >
    </div>
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
        // The currently selected annotation guideline.
        guideline: {
            type: Object,
            default: null,
        },
    },
    // Shape names, keyed by ID.
    inject: ['shapes'],
    computed: {
        guidelineLabel() {
            return this.guideline?.labels.find(l => l.id === this.label.id)?.pivot;
        },
        guidelineLabelShape() {
            return this.shapes[this.guidelineLabel?.shape];
        },
        hasGuidelineInfo() {
            return this.guidelineLabelShape
                || this.guidelineLabel?.description
                || this.guidelineLabel?.reference_image_url;
        },
    },
};
</script>

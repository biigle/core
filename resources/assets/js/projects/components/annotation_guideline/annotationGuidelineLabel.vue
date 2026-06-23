<template>
    <div class="row annotation-guideline-label">
        <div class="col-xs-4">
            <label-trees
                :trees="labelTrees"
                :labelsInGuideline="labelsInGuideline"
                @select="selectLabel"
                @deselect="deselectLabel"
            >
            </label-trees>
        </div>
        <div class="col-xs-8">
            <span
                v-if="isAdmin && editingMode && label.id"
                class="top-bar pull-right" >
                <button
                    class="btn btn-success btn-sm"
                    type="button"
                    @click="addAnnotationGuidelineLabel(false)"
                    title="Save label in the guideline"
                >
                    <span class="fa fa-check" aria-hidden="true"></span>
                    Save label
                </button>
                <span>
                    <button
                        class="btn btn-danger btn-sm"
                        type="button"
                        @click="deleteLabel"
                        title="Delete this label from the guideline"
                    >
                        <span class="fa fa-times" aria-hidden="true"></span>
                        Delete label
                    </button>
                </span>
            </span>
            <div v-if="displayLabelInfo" class="row">
                <h4>
                    <b>{{ label.name }}</b>
                </h4>
                <h4>Label description</h4>
                <div v-if="isAdmin && editingMode">
                    <textarea
                        v-model="description"
                        class="form-control guideline-description"
                        maxlength="200"
                        wrap="hard"
                        placeholder="Describe how this label should be used..."
                        @change="setWasEdited"
                    ></textarea>
                </div>
                <div v-else>
                    <span
                        v-if="hasDescription"
                        class="guideline-description-text"
                        >{{ description }}</span
                    >
                    <span v-else>No description was provided</span>
                </div>
                <h4>Shape</h4>
                <div v-if="isAdmin && editingMode">
                    <select
                        class="form-control"
                        v-model="shape"
                        title="Select shape"
                        @change="setWasEdited"
                    >
                        <option
                            v-for="(name, id) in availableShapes"
                            :value="id"
                            v-text="name"
                        ></option>
                    </select>
                </div>
                <div v-else>
                    <span v-if="shape">
                        <span class="btn control-button"
                            ><i
                                :class="`icon icon-white icon-${availableShapes[shape].toLowerCase()}`"
                            ></i
                        ></span>
                        <span>{{ availableShapes[shape] }}</span>
                    </span>
                    <span v-else> No preferred shape was provided </span>
                </div>
                <annotation-guideline-label-image
                    :base-url="baseUrl"
                    :label-id="labelId"
                    :project-id="projectId"
                    :display-image="displayImage"
                    :temporary-image="temporaryReferenceImageObject"
                    :is-admin="isAdmin"
                    :editable="editingMode"
                    :refresh-count="refreshCount[labelId]"
                    @reset-reference-image="resetReferenceImage"
                    @add-image="addImage"
                ></annotation-guideline-label-image>
            </div>
        </div>
    </div>
</template>
<script>
import AnnotationGuidelineLabelImage from './annotationGuidelineLabelImage.vue';
import AnnotationGuidelineLabelApi from '@/projects/api/annotationGuidelineLabel.js';
import { handleErrorResponse } from '@/core/messages/store.js';
import { resizeImage } from './resizeImage.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';

export default {
    mixins: [LoaderMixin],
    emits: ['add-label', 'delete-label', 'editing'],
    components: {
        annotationGuidelineLabelImage: AnnotationGuidelineLabelImage,
        labelTrees: LabelTrees,
    },
    props: {
        annotationGuidelineLabels: {
            type: Array,
            default: () => [],
        },
        editingMode: {
            type: Boolean,
            default: false,
        },
        availableShapes: {
            type: Object,
            required: true,
        },
        labelTrees: {
            type: Array,
            required: true,
        },
        projectId: {
            type: Number,
            required: true,
        },
        baseUrl: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            required: true,
        },
        // Used to force save the label if the annotationGuideline is saved
        forceSaveLabel: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        temporaryReferenceImageObject() {
            return this.temporaryImage
                ? URL.createObjectURL(this.temporaryImage)
                : false;
        },
        displayImage() {
            return this.hasReferenceImage || this.temporaryReferenceImageObject;
        },
        labelId() {
            return this.label.id ? this.label.id : -1;
        },
        labelsInGuideline() {
            return this.annotationGuidelineLabels.map((agl) => agl.label.id);
        },
        hasDescription() {
            return this.description && this.description.length !== 0;
        },
        displayLabelInfo() {
            return (
                (this.editingMode && this.label.id) ||
                this.labelsInGuideline.includes(this.label.id)
            );
        },
        currentAnnotationGuidelineLabel() {
            let agl = {
                label: this.label,
            };
            if (
                this.label &&
                this.annotationGuidelineLabels.filter(
                    (agl) => agl.label.id == this.label.id,
                )[0]
            ) {
                agl = this.annotationGuidelineLabels.filter(
                    (agl) => agl.label.id == this.label.id,
                )[0];
            }
            return agl;
        },

    },
    watch: {
        currentAnnotationGuidelineLabel: function (agl) {
            this.label = agl.label;
            //casting null to undefined
            this.shape = agl.shape ?? '';
            this.description = agl.description ?? '';
            this.hasReferenceImage = agl.reference_image;
            this.temporaryImage = false;
            this.$emit('editing', false);
        },
        forceSaveLabel: function(value) {
            if (value) {
                this.addAnnotationGuidelineLabel(true);
            }
        },
        temporaryImage: "setWasEdited",
    },
    data() {
        return {
            label: {},
            shape: undefined,
            description: '',
            hasReferenceImage: false,
            temporaryImage: false,
            changingLabel: false,
            refreshCount: {},
            wasEdited: false,
        };
    },
    methods: {
        setWasEdited() {
            if (this.editingMode && !this.changingLabel) {
                this.wasEdited = true;
                this.$emit('editing');
            }
        },
        increaseRefreshCount(labelId) {
            let labelRefreshCount = this.refreshCount[labelId] ?? 0
            this.refreshCount[labelId] = labelRefreshCount + 1;
        },
        selectLabel(label) {
            if (this.wasEdited) {
                this.addAnnotationGuidelineLabel(true);
            }
            this.increaseRefreshCount(label.id);
            this.label = label;
            setTimeout(() => this.wasEdited = false);
        },
        deselectLabel() {
            if (this.wasEdited) {
                this.addAnnotationGuidelineLabel(true);
            }
            this.label = {};
            setTimeout(() => this.wasEdited = false);
        },
        addAnnotationGuidelineLabel(automaticSave) {
            // Avoid accidental save, a label without any info is allowed only voluntarily
            if (
                automaticSave &&
                !this.shape &&
                !this.description &&
                !this.temporaryReferenceImageObject)
            {
                return;
            }
            let image = this.temporaryImage ? this.temporaryImage : null;

            if (this.labelId > 0) {
                this.$emit('add-label', {
                    label: this.label,
                    shape: this.shape,
                    description: this.description,
                    reference_image: image,
                });
            }
            this.wasEdited = false;
        },
        deleteLabel() {
            this.$emit('delete-label', this.label.id);
            this.wasEdited = false;
            this.deselectLabel();
        },
        addImage(file) {
            this.startLoading();
            resizeImage(file)
                .then((image) => this.setImage(image))
                .finally(this.finishLoading);
            this.increaseRefreshCount(this.labelId);
        },
        setImage(image) {
            this.temporaryImage = image;
        },
        resetImage() {
            this.temporaryImage = false;
            this.hasReferenceImage = false;
            this.$emit('editing');
            this.increaseRefreshCount(this.labelId);
        },
        resetReferenceImage() {
            this.startLoading();
            AnnotationGuidelineLabelApi.delete_image(
                { id: this.projectId },
                { label: this.label.id },
            )
                .then(this.resetImage, handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
};
</script>

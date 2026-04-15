<template>
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
            <span v-if="isAdmin && editingMode && label.id" class="top-bar pull-right">
                <button
                    class="btn btn-success btn-sm"
                    type="button"
                    @click="addAnnotationGuidelineLabel"
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
                <h4><b>{{ label.name }}</b></h4>
                <h4>Label description</h4>
                <div v-if="isAdmin && editingMode">
                    <textarea
                        v-model="description"
                        class="form-control guideline-description"
                        maxlength="200"
                        wrap="hard"
                        placeholder="Describe how this label should be used..."
                    ></textarea>
                </div>
                <div v-else>
                    <span v-if="hasDescription" class="guideline-description-text">{{ description }}</span>
                    <span v-else>No description was provided</span>
                </div>
                <h4>Shape</h4>
                <div v-if="isAdmin && editingMode">
                    <select
                        class="form-control"
                        v-model="shape"
                        title="Select shape"
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
                    <span v-else>
                        No preferred shape was provided
                    </span>
                </div>
                <annotation-guideline-label-image
                    :base-url="baseUrl"
                    :label-id="labelId"
                    :project-id="projectId"
                    :temporary-image="temporaryReferenceImage"
                    :is-admin="isAdmin"
                    :editable="editingMode"
                    @reset-reference-image="resetReferenceImage"
                    @add-image="addImage"
                ></annotation-guideline-label-image>
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
        emits: ['add-label', 'delete-label'],
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
            creating: {
                type: Boolean,
                default: false,
            },
            isAdmin: {
                type: Boolean,
                required: true,
            },
            remindToSave: {
                type: Boolean,
                default: false,
            },
            forceSaveLabel: {
                type: Boolean,
                required: true,
            },
    },
    computed: {
        temporaryReferenceImage() {
            return this.referenceImage
                ? URL.createObjectURL(this.referenceImage)
                : undefined;
        },
        labelId() {
            return this.label.id ? this.label.id : -1;
        },
        labelsInGuideline() {
            return this.annotationGuidelineLabels.map((asl) => asl.label.id);
        },
        hasDescription() {
            return this.description && this.description.length !== 0;
        },
        displayLabelInfo() {
            return this.editingMode && this.label.id || this.labelsInGuideline.includes(this.label.id);
        },
        currentAnnotationGuidelineLabel() {
            let asl = {
                label: this.label,
                reference_image: '',
            };
            if (this.label && this.annotationGuidelineLabels.filter((asl) => asl.label.id == this.label.id)[0]) {
                asl = this.annotationGuidelineLabels.filter((asl) => asl.label.id == this.label.id)[0]
            }
            return asl;
        },


    },
    watch: {
        currentAnnotationGuidelineLabel: function(asl) {
            this.label = asl.label;
            //casting null to undefined
            this.shape = asl.shape ?? undefined;
            this.description = asl.description;
            this.referenceImage = asl.reference_image;
        },
        forceSaveLabel: function() {
            this.addAnnotationGuidelineLabel();
        },
    },
    data() {
        return {
            label: {},
            shape: undefined,
            description: '',
            referenceImage: undefined,
            imageError: false,
        };
    },
    methods: {
        selectLabel(label) {
            this.label = label;
        },
        deselectLabel() {
            this.label = {};
        },
        addAnnotationGuidelineLabel() {
            if (this.labelId > 0) {
                this.$emit('add-label', {
                    label: this.label,
                    shape: this.shape,
                    description: this.description,
                    reference_image: this.referenceImage,
                });
            }
        },
        deleteLabel() {
            this.$emit('delete-label', this.label.id);
            this.deselectLabel();
        },
        addImage(file) {
            this.startLoading();
            resizeImage(file)
                .then((image) => this.setImage(image), this.setImageWarning)
                .finally(this.finishLoading);
        },
        setImageWarning() {
            this.imageError = true;
        },
        setImage(image) {
            this.referenceImage = image;
            this.imageError = false;
        },
        resetReferenceImage() {
            this.startLoading();
            AnnotationGuidelineLabelApi.delete_image(
                { id: this.projectId },
                { label: this.label.id },
            )
                .then(this.setReferenceImage, handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
};
</script>

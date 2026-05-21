<template>
<div>
    <div>
        <a
            class="btn btn-default pull-right"
            href="/manual/tutorials/projects/about#annotation-guideline"
            title="Learn more about annotation guidelines"
            target="_blank"
            >
            <i class="fa fa-question-circle"></i>
        </a>
    </div>
    <div>
        <p class="text-muted">
            An annotation guideline can provide detailed annotation instructions and constraints for the labels of a project.
        </p>
        <p class="text-muted" v-if="hasLabelTrees">
            Select labels and provide information to get started.
        </p>
    </div>
    <div class="row">
        <div class="col-xs-6">
            <div class="well well-sm">
                <label-trees
                    v-if="hasLabelTrees"
                    :trees="labelTrees"
                    :labelsInGuideline="labelsInGuideline"
                    @select="selectLabel"
                    @deselect="deselectLabel"
                >
                </label-trees>
                <span v-else>
                    Attach label trees to the project to get started.
                </span>
            </div>
        </div>
        <div class="col-xs-6">
            <form @submit.prevent="saveLabel" v-if="hasLabelTrees">
                <div class="form-group">
                    <label for="label-description">Description</label>
                    <textarea
                        v-model="labelDescription"
                        id="label-description"
                        :disabled="!selectedLabel"
                        class="form-control"
                        maxlength="200"
                        @change="isDirty = true"
                    ></textarea>
                    <p class="help-block">
                        Describe how objects with this label can be identified and how they should be annotated.
                    </p>
                </div>

                <div class="form-group">
                    <label>Shape</label>
                    <div class="btn-group btn-group-justified">
                        <div v-for="(shape, shapeId) in availableShapes" class="btn-group">
                            <button
                                class="btn btn-default"
                                :class="{'active btn-info': selectedShape == shapeId}"
                                :title="shape"
                                :disabled="!selectedLabel"
                                @click.prevent="selectShape(shapeId)"
                                >
                                <i
                                    class="icon"
                                    :class="[`icon-${shape.toLowerCase()}`, selectedShape == shapeId ? 'icon-white' : '']"
                                    ></i>
                            </button>
                        </div>
                    </div>
                    <p class="help-block">
                        Select a shape tool that should be used for annotations with this label.
                    </p>
                </div>

                <div class="form-group">
                    <label>Reference Image</label>
                    <div class="form-group">
                    <button
                        v-if="referenceImagePreview && referenceImagePreviewLoaded"
                        class="btn btn-default btn-sm pull-right"
                        title="Remove reference image"
                        @click.prevent="removeImage"
                        ><i class="fa fa-times"></i></button>
                        <input type="file" @change="addImage" :disabled="!selectedLabel" />
                    </div>
                    <div v-show="referenceImagePreviewLoaded" class="well well-sm">
                        <img
                            v-if="referenceImagePreview"
                            :src="referenceImagePreview"
                            @load="referenceImagePreviewLoaded = true"
                            @error="referenceImagePreview = null"
                            />
                    </div>
                    <p class="help-block">
                        Upload a reference image that helps to identify objects with this label.
                    </p>
                </div>

                <button
                    v-show="selectedLabel"
                    :disabled="!canSave"
                    class="btn btn-success"
                    :title="isInGuideline ? 'Update this label in the guideline' : 'Add this label to the guideline'"
                    >
                    <i class="fa fa-clipboard-list"></i> <span v-text="isInGuideline ? 'Update' : 'Add'"></span>
                </button>
                <loader :active="loading"></loader>
                <button
                    v-show="selectedLabel && isInGuideline"
                    title="Remove this label from the guideline"
                    :disabled="loading"
                    class="btn btn-danger pull-right"
                    @click.prevent="deleteLabel"
                    >
                    Remove
                </button>
            </form>
        </div>
    </div>
</div>
</template>
<script>
import AnnotationGuidelineApi from '@/projects/api/annotationGuideline.js';
import AnnotationGuidelineLabelApi from '@/projects/api/annotationGuidelineLabel.js';
import { handleErrorResponse } from '@/core/messages/store.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';

export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
    },
    props: {
        isAdmin: {
            type: Boolean,
            required: true,
        },
        imageMaxWidth: {
            type: Number,
            default: 300,
        },
        imageMaxHeight: {
            type: Number,
            default: 300,
        },
    },
    data() {
        return {
            labelTrees: biigle.$require('projects.labelTrees'),
            selectedLabel: null,
            annotationGuidelineLabels: new Map(),
            availableShapes: biigle.$require('projects.availableShapes'),
            projectId: biigle.$require('projects.project').id,
            annotationGuideline: biigle.$require('projects.annotationGuideline'),
            labelDescription: '',
            selectedShape: null,
            referenceImage: null,
            referenceImagePreviewLoaded: false,
            referenceImagePreview: null,
            clearReferenceImage: false,
            isDirty: false,
        };
    },
    computed: {
        labelsInGuideline() {
            return [...this.annotationGuidelineLabels.keys()];
        },
        creating() {
            return this.annotationGuideline === null;
        },
        hasLabelTrees() {
            return this.labelTrees.length > 0;
        },
        isInGuideline() {
            return this.selectedLabel && this.annotationGuidelineLabels.has(this.selectedLabel.id);
        },
        canSave() {
            return this.selectedLabel && !this.loading && (this.isDirty || !this.annotationGuidelineLabels.has(this.selectedLabel?.id));
        },
    },
    watch: {
        selectedLabel(label) {
            this.resetForm();
            const guidelineLabel = this.annotationGuidelineLabels.get(label?.id);
            if (guidelineLabel) {
                this.labelDescription = guidelineLabel.description || '';
                this.selectedShape = guidelineLabel.shape_id || null;
                this.referenceImagePreviewLoaded = false;
                this.referenceImagePreview = guidelineLabel.reference_image_url;
                this.isDirty = false;
            }
        },
    },
    created() {
        if (this.isAdmin) {
            window.addEventListener('beforeunload', (e) => {
                if (this.isDirty) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });
        }

        if (this.annotationGuideline) {
            this.annotationGuideline.labels.forEach((label) => {
                this.annotationGuidelineLabels.set(label.id, label.pivot);
            });
        }
    },
    methods: {
        selectLabel(label) {
            if (this.isDirty && confirm(`Save unsaved changes for "${this.selectedLabel.name}"?`)) {
                this.saveLabel().then(() => this.selectedLabel = label);
            } else {
                this.selectedLabel = label;
            }
        },
        selectShape(id) {
            this.isDirty = true;
            this.selectedShape = id;
        },
        deselectLabel() {
            if (this.isDirty && confirm(`Save unsaved changes for "${this.selectedLabel.name}"?`)) {
                this.saveLabel().then(() => {
                    this.selectedLabel = null;
                });
            } else {
                this.selectedLabel = null;
            }
        },
        resetForm() {
            this.labelDescription = '';
            this.selectedShape = null;
            this.referenceImage = null;
            this.clearReferenceImage = false;
            if (this.referenceImagePreview) {
                if (this.referenceImagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(this.referenceImagePreview);
                }
                this.referenceImagePreview = null;
            }
            this.isDirty = false;
        },
        removeImage() {
            this.referenceImage = null;
            if (this.referenceImagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(this.referenceImagePreview);
            }
            this.referenceImagePreview = null;
            this.clearReferenceImage = true;
            this.isDirty = true;
        },
        addImage(event) {
            const file = event.target.files[0] || null;
            if (!file) {
                this.referenceImage = null;
                return;
            }

            this.isDirty = true;
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                let {naturalWidth: w, naturalHeight: h} = img;
                const widthRatio = this.imageMaxWidth / w;
                const heightRatio = this.imageMaxHeight / h;
                const scale = Math.min(1, widthRatio, heightRatio);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(w * scale);
                canvas.height = Math.round(h * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    this.referenceImage = new File([blob], file.name, {type: blob.type});
                    if (this.referenceImagePreview?.startsWith('blob:')) {
                        URL.revokeObjectURL(this.referenceImagePreview);
                    }
                    this.referenceImagePreviewLoaded = false;
                    this.referenceImagePreview = URL.createObjectURL(blob);
                }, file.type);
            };
            img.src = url;
        },
        deleteLabel() {
            if (!confirm(`Remove "${this.selectedLabel.name}" from the guideline?`)) {
                return;
            }

            this.startLoading();
            AnnotationGuidelineLabelApi.delete({
                    id: this.annotationGuideline.id,
                    labelId: this.selectedLabel.id,
                })
                .then(() => {
                    this.annotationGuidelineLabels.delete(this.selectedLabel.id);
                    this.selectedLabel = null;
                }, handleErrorResponse)
                .finally(this.finishLoading);
        },
        saveLabel() {
            let formData = new FormData();
            formData.append('label_id', this.selectedLabel.id);
            formData.append('description', this.labelDescription || '');
            if (this.selectedShape) {
                formData.append('shape_id', this.selectedShape);
            }
            if (this.referenceImage !== null) {
                formData.append('reference_image', this.referenceImage);
            } else if (this.clearReferenceImage) {
                formData.append('reference_image', '');
            }

            this.startLoading();
            let promise = Promise.resolve();
            if (this.creating) {
                promise = AnnotationGuidelineApi.save({ id: this.projectId }, {})
                    .then(
                        (response) => { this.annotationGuideline = response.body; },
                        handleErrorResponse,
                    );
            }

            return promise
                .then(
                    () => AnnotationGuidelineLabelApi.save({ id: this.annotationGuideline.id }, formData),
                    handleErrorResponse,
                )
                .then((response) => {
                    const label = response.body;
                    this.annotationGuidelineLabels.set(label.label_id, label);
                    this.isDirty = false;
                }, handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
};
</script>

<style scoped>
:deep(.label-trees__body) {
    max-height: 600px;
}
</style>

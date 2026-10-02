<template>
<div>
    <div class="clearfix">
        <div class="pull-right">
            <loader :active="loading"></loader>
        </div>
        <p class="text-muted">
            An annotation guideline can provide detailed instructions and constraints for new annotations in a project. <a href="/manual/tutorials/projects/about#guideline" title="Learn more about annotation guidelines" target="_blank">Learn more.</a>
        </p>
    </div>
    <fieldset>
        <legend>General information</legend>
        <div v-if="!isEditingGuideline">
            <div v-if="annotationGuideline?.enforced" class="panel panel-warning">
                <div class="panel-body text-warning">
                    The guideline is enforced. Only allowed labels and shapes can be used in this project.
                </div>
            </div>

            <label>Description</label>
            <div v-if="annotationGuideline?.description" class="well well-sm">
                {{ annotationGuideline?.description }}
            </div>
            <p v-else class="text-muted">
                The guideline has no description.
            </p>

            <div v-if="annotationGuideline?.enforced">
                <label>Available shapes</label>
                <div v-if="annotationGuideline?.only_shapes" class="btn-group btn-group-justified form-group">
                    <div
                        v-for="[shapeId, shape] of allowedShapes"
                        :key="shapeId"
                        class="btn-group"
                        >
                        <button
                            class="btn btn-default"
                            :title="shape"
                            disabled
                            >
                            <i
                                class="icon icon-white"
                                :class="`icon-${shape.toLowerCase()}`"
                                ></i>
                        </button>
                    </div>
                </div>
                <p v-else class="text-muted">
                    All shapes are allowed.
                </p>
            </div>


            <div v-if="isAdmin" class="form-group">
                <button
                    class="btn btn-default"
                    @click.prevent="editGuideline"
                    title="Edit the general information of the guideline"
                    >
                    Edit
                </button>
            </div>
        </div>
        <form v-if="isEditingGuideline && isAdmin" @submit.prevent="saveGuideline">
            <div class="form-group">
                <label>Enforce guideline</label>
                <select class="form-control" v-model="guidelineIsEnforced">
                    <option :value="false">No</option>
                    <option :value="true">Yes</option>
                </select>
                <p class="help-block">
                    Enforce a guideline to restrict the available labels and shapes for new annotations.
                </p>
            </div>

            <div class="form-group">
                <label for="guideline-description">Guideline description</label>
                <textarea
                    id="guideline-description"
                    class="form-control"
                    v-model="guidelineDescription"
                    ></textarea>
                <p class="help-block">
                    The description helps users choose if multiple guidelines are available.
                </p>
            </div>

            <div v-if="guidelineIsEnforced" class="form-group">
                <label>Available shapes</label>
                <div class="btn-group btn-group-justified">
                    <div
                        v-for="[shapeId, shape] of availableShapes"
                        :key="shapeId"
                        class="btn-group"
                        >
                        <button
                            class="btn btn-default"
                            :class="{'active btn-info': guidelineShapes.has(shapeId)}"
                            :title="shape"
                            @click.prevent="selectGuidelineShape(shapeId)"
                            >
                            <i
                                class="icon"
                                :class="[`icon-${shape.toLowerCase()}`, guidelineShapes.has(shapeId) ? 'icon-white' : '']"
                                ></i>
                        </button>
                    </div>
                </div>
                <p class="help-block">
                    Limit available shapes for new annotations. Select none to allow all.
                </p>
            </div>

            <div class="form-group">
                <button class="btn btn-success" type="submit">
                    Save
                </button>
                <button class="btn btn-default" type="button" @click="cancelEditingGuideline">
                    Cancel
                </button>
                <button class="btn btn-danger pull-right" type="button" @click="deleteGuideline">
                    Delete guideline
                </button>
            </div>
        </form>
    </fieldset>
    <fieldset v-if="isAdmin || hasLabels">
        <legend>Label information</legend>
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
            <div class="col-xs-6" v-if="hasLabelTrees">
                <p v-if="!isAdmin && !isInGuideline" class="text-info">
                    Select a label with <i class="fa fa-clipboard-list"></i> to see guideline information.
                </p>
                <p class="text-info" v-if="isAdmin && !selectedLabel">
                    Select a label to edit the label information.
                </p>
                <form @submit.prevent="saveLabel" v-if="isAdmin && selectedLabel">
                    <div class="form-group">
                        <label for="label-description">Label description</label>
                        <textarea
                            v-model="labelDescription"
                            id="label-description"
                            class="form-control"
                            maxlength="200"
                            @input="isDirty = true"
                        ></textarea>
                        <p class="help-block">
                            Describe how objects with this label can be identified and how they should be annotated.
                        </p>
                    </div>

                    <div class="form-group">
                        <label>Label shape</label>
                        <div class="btn-group btn-group-justified">
                            <div
                                v-for="[shapeId, shape] of allowedShapes"
                                :key="shapeId"
                                class="btn-group"
                                >
                                <button
                                    class="btn btn-default"
                                    :class="{'active btn-info': selectedShape === shapeId}"
                                    :title="shape"
                                    @click.prevent="selectLabelShape(shapeId)"
                                    >
                                    <i
                                        class="icon"
                                        :class="[`icon-${shape.toLowerCase()}`, selectedShape === shapeId ? 'icon-white' : '']"
                                        ></i>
                                </button>
                            </div>
                        </div>
                        <p class="help-block">
                            Select a shape tool that should be used for annotations with this label.
                        </p>
                    </div>

                    <div class="form-group">
                        <label>Label reference image</label>
                        <div class="form-group">
                            <button
                                v-if="referenceImagePreview"
                                class="btn btn-default btn-sm pull-right"
                                title="Remove reference image"
                                @click.prevent="removeImage"
                                ><i class="fa fa-times"></i></button>
                                <input type="file" @change="addImage" :disabled="!selectedLabel" />
                        </div>
                        <div v-show="referenceImagePreview" class="well well-sm text-center">
                            <img
                                v-if="referenceImagePreview"
                                :src="referenceImagePreview"
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
                <div v-if="!isAdmin && selectedLabel">
                    <p v-if="isInGuideline">
                        This label belongs to the annotation guideline.
                    </p>

                    <div v-if="labelDescription" class="form-group">
                        <label for="label-description">Label description</label>
                        <textarea
                            v-model="labelDescription"
                            id="label-description"
                            readonly
                            class="form-control"
                            maxlength="200"
                        ></textarea>
                    </div>

                    <div v-if="selectedShape" class="form-group">
                        <label>Label shape</label>
                        <div class="btn-group btn-group-justified">
                            <div
                                v-for="[shapeId, shape] of allowedShapes"
                                :key="shapeId"
                                class="btn-group"
                                >
                                <button
                                    class="btn btn-default"
                                    :class="{'active btn-info': selectedShape === shapeId}"
                                    :title="shape"
                                    disabled
                                    >
                                    <i
                                        class="icon"
                                        :class="[`icon-${shape.toLowerCase()}`, selectedShape === shapeId ? 'icon-white' : '']"
                                        ></i>
                                </button>
                            </div>
                        </div>
                        <p class="help-block">
                            New annotations can only be created with this shape.
                        </p>
                    </div>

                    <div v-show="referenceImagePreview" class="form-group">
                        <label>Label reference image</label>
                        <div class="well well-sm text-center">
                            <img
                                v-if="referenceImagePreview"
                                :src="referenceImagePreview"
                                />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </fieldset>
</div>
</template>
<script>
import AnnotationGuidelineApi from '@/projects/api/annotationGuideline.js';
import AnnotationGuidelineLabelApi from '@/projects/api/annotationGuidelineLabel.js';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import Messages from '@/core/messages/store.js';
import { handleErrorResponse } from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    components: {
        LabelTrees,
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
            labelTrees: [],
            selectedLabel: null,
            annotationGuidelineLabels: new Map(),
            availableShapes: new Map(),
            projectId: null,
            annotationGuideline: null,
            labelDescription: '',
            selectedShape: null,
            referenceImage: null,
            referenceImagePreview: null,
            isDirty: false,
            guidelineDescription: null,
            guidelineIsEnforced: false,
            guidelineShapes: new Set(),
            isEditingGuideline: false,
        };
    },
    computed: {
        hasLabels() {
            return this.labelsInGuideline.length > 0;
        },
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
        onlyShapeIds() {
            return new Set(this.annotationGuideline?.only_shapes);
        },
        allowedShapes() {
            if (this.onlyShapeIds.size > 0) {
                const allowed = new Map();

                this.onlyShapeIds.forEach(id => allowed.set(id, this.availableShapes.get(id)));

                return allowed;
            }

            return this.availableShapes;
        },
    },
    watch: {
        selectedLabel(label) {
            this.resetForm();
            const guidelineLabel = this.annotationGuidelineLabels.get(label?.id);
            if (guidelineLabel) {
                this.labelDescription = guidelineLabel.description || '';
                this.selectedShape = guidelineLabel.shape_id || null;
                this.referenceImagePreview = guidelineLabel.reference_image_url;
                this.isDirty = false;
            }
        },
    },
    created() {
        this.labelTrees = biigle.$require('projects.labelTrees');
        const shapeEntries = Object.entries(biigle.$require('projects.availableShapes'))
            .map(([key, value]) => [parseInt(key), value]);
        this.availableShapes = new Map(shapeEntries);
        this.projectId = biigle.$require('projects.project').id;
        this.annotationGuideline = biigle.$require('projects.annotationGuideline');

        if (this.isAdmin) {
            window.addEventListener('beforeunload', (e) => {
                if (this.isDirty) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });
        }

        if (this.annotationGuideline) {
            this.guidelineDescription = this.annotationGuideline.description;
            this.guidelineIsEnforced = this.annotationGuideline.enforced;
            this.guidelineShapes = new Set(this.annotationGuideline?.only_shapes);
            this.annotationGuideline.labels.forEach((label) => {
                this.annotationGuidelineLabels.set(label.id, label.pivot);
            });
        }
    },
    methods: {
        async selectLabel(label) {
            if (this.isDirty && confirm(`Save unsaved changes for "${this.selectedLabel.name}"?`)) {
                if (!await this.saveLabel()) {
                    return;
                }
            }
            this.selectedLabel = label;
        },
        selectGuidelineShape(id) {
            if (this.guidelineShapes.has(id)) {
                this.guidelineShapes.delete(id);
            } else {
                this.guidelineShapes.add(id);
            }
        },
        selectLabelShape(id) {
            this.isDirty = true;
            id = Number(id);
            if (this.selectedShape === id) {
                this.selectedShape = null;
            } else {
                this.selectedShape = id;
            }
        },
        async deselectLabel() {
            if (this.isDirty && confirm(`Save unsaved changes for "${this.selectedLabel.name}"?`)) {
                if (!await this.saveLabel()) {
                    return;
                }
            }
            this.selectedLabel = null;
        },
        resetForm() {
            this.labelDescription = '';
            this.selectedShape = null;
            this.referenceImage = null;
            if (this.referenceImagePreview) {
                if (this.referenceImagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(this.referenceImagePreview);
                }
                this.referenceImagePreview = null;
            }
            this.isDirty = false;
        },
        removeImage() {
            if (this.referenceImagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(this.referenceImagePreview);
            }
            this.referenceImagePreview = null;
            this.referenceImage = null;
            this.isDirty = true;
        },
        addImage(event) {
            const file = event.target.files[0] || null;
            if (!file) {
                return;
            }

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
                const ctx = canvas.getContext('2d');
                // Fill white because JPEG has no alpha channel and transparent
                // areas would otherwise turn black.
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (!blob) {
                        Messages.danger('Failed to process the image.');
                        return;
                    }
                    this.referenceImage = new File([blob], 'reference.jpg', {type: blob.type});
                    if (this.referenceImagePreview?.startsWith('blob:')) {
                        URL.revokeObjectURL(this.referenceImagePreview);
                    }
                    this.referenceImagePreview = URL.createObjectURL(blob);
                    this.isDirty = true;
                }, 'image/jpeg', 0.9);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                Messages.danger('Failed to load the image.');
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
        async saveLabel() {
            if (this.loading || !this.isAdmin) {
                return false;
            }

            let formData = new FormData();
            formData.append('label_id', this.selectedLabel.id);
            formData.append('description', this.labelDescription || '');
            if (this.selectedShape) {
                formData.append('shape_id', this.selectedShape);
            }
            if (this.referenceImage !== null) {
                formData.append('reference_image', this.referenceImage);
            } else if (!this.referenceImagePreview) {
                // Only request deletion if no image should be shown. Otherwise an
                // existing image would be deleted even if the user didn't touch it.
                formData.append('reference_image', '');
            }

            if (this.creating) {
                if (!await this.createOrSaveGuideline()) {
                    return false;
                }
            }

            this.startLoading();
            return AnnotationGuidelineLabelApi.save({ id: this.annotationGuideline.id }, formData)
                .then(
                    (response) => {
                        const label = response.body;
                        this.annotationGuidelineLabels.set(label.label_id, label);
                        this.isDirty = false;
                        return true;
                    },
                    (error) => {
                        handleErrorResponse(error);
                        return false;
                    }
                )
                .finally(this.finishLoading);
        },
        async createOrSaveGuideline() {
            if (this.loading || !this.isAdmin) {
                return false;
            }

            this.startLoading();
            const payload = {
                description: this.guidelineDescription,
                enforced: this.guidelineIsEnforced,
            };

            if (this.guidelineIsEnforced && this.guidelineShapes.size > 0) {
                payload.only_shapes = Array.from(this.guidelineShapes);
            } else {
                payload.only_shapes = null;
            }

            if (this.creating) {
                return AnnotationGuidelineApi.save({ id: this.projectId }, payload)
                    .then(
                        (response) => {
                            this.annotationGuideline = response.body;
                            if (!this.annotationGuideline.only_shapes) {
                                this.guidelineShapes.clear();
                            }
                            return true;
                        },
                        (error) => {
                            handleErrorResponse(error);
                            return false;
                        },
                    )
                    .finally(this.finishLoading);
            }

            return AnnotationGuidelineApi.update({ id: this.annotationGuideline.id }, payload)
                    .then(
                        () => {
                            Object.assign(this.annotationGuideline, payload);
                            if (!payload.only_shapes) {
                                this.guidelineShapes.clear();
                            }
                            this.maybeUnsetLabelShapes();
                            return true;
                        },
                        (error) => {
                            handleErrorResponse(error);
                            return false;
                        }
                    )
                    .finally(this.finishLoading);

        },
        maybeUnsetLabelShapes() {
            if (this.onlyShapeIds.size > 0) {
                this.annotationGuidelineLabels.forEach((label) => {
                    if (label.shape_id && !this.onlyShapeIds.has(Number(label.shape_id))) {
                        label.shape_id = null;
                    }
                })
            }
        },
        editGuideline() {
            this.isEditingGuideline = true;
        },
        async saveGuideline() {
            if (await this.createOrSaveGuideline()) {
                this.isEditingGuideline = false;
            }
        },
        cancelEditingGuideline() {
            this.guidelineDescription = this.annotationGuideline?.description ?? null;
            this.guidelineIsEnforced = this.annotationGuideline?.enforced ?? false;
            this.guidelineShapes = new Set(this.annotationGuideline?.only_shapes);
            this.isEditingGuideline = false;
        },
        deleteGuideline() {
            if (this.annotationGuideline && !this.loading && this.isAdmin && confirm('Are you sure you want to delete this guideline?')) {
                this.startLoading();
                AnnotationGuidelineApi.delete({ id: this.annotationGuideline.id })
                    .then(this.reset, handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        reset() {
            this.resetForm();
            this.annotationGuideline = null;
            this.guidelineDescription = null;
            this.guidelineIsEnforced = false;
            this.guidelineShapes.clear();
            this.isEditingGuideline = false;
            this.selectedLabel = null;
            this.annotationGuidelineLabels.clear();
        },
    },
};
</script>

<style scoped>
:deep(.label-trees__body) {
    max-height: 600px;
}
</style>

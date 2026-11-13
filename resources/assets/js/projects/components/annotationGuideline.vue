<template>
<div>
    <div class="clearfix">
        <div class="pull-right">
            <loader :active="loading"></loader>
            <a
                v-if="annotationGuideline"
                class="btn btn-default"
                :href="printUrl"
                target="_blank"
                title="Print the guideline or save it as PDF"
                >
                <i class="fa fa-print"></i> Print
            </a>
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
                <div v-if="hasShapeRestrictions" class="btn-group btn-group-justified form-group">
                    <div
                        v-for="option of allowedShapeOptions"
                        :key="option.key"
                        class="btn-group"
                        >
                        <button
                            class="btn btn-default"
                            :title="option.title"
                            disabled
                            >
                            <i :class="getShapeOptionIcon(option, true)"></i>
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
                    Enforce a guideline to restrict the available labels and shapes for annotations and file labels.
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
                        v-for="option of availableShapeOptions"
                        :key="option.key"
                        class="btn-group"
                        >
                        <button
                            class="btn btn-default"
                            :class="{'active btn-info': isGuidelineShapeOptionActive(option)}"
                            :title="option.title"
                            @click.prevent="selectGuidelineShape(option)"
                            >
                            <i :class="getShapeOptionIcon(option, isGuidelineShapeOptionActive(option))"></i>
                        </button>
                    </div>
                </div>
                <p class="help-block">
                    Limit available shapes for new annotations. Select none to allow all.
                </p>
                <div v-if="mediaTypeShapeWarning" class="panel panel-warning">
                    <div class="panel-body text-warning" v-text="mediaTypeShapeWarning"></div>
                </div>
            </div>

            <div class="form-group">
                <button class="btn btn-success" type="submit" :disabled="loading">
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
                        <span
                            class="pull-right text-muted"
                            :class="{'text-warning': labelDescription.length === labelDescriptionMaxLength}"
                            v-text="`${labelDescription.length}/${labelDescriptionMaxLength}`"
                        ></span>
                        <label for="label-description">Label description</label>
                        <textarea
                            v-model="labelDescription"
                            id="label-description"
                            class="form-control"
                            :maxlength="labelDescriptionMaxLength"
                            @input="isDirty = true"
                        ></textarea>
                        <p class="help-block">
                            Describe how objects with this label can be identified and how they should be annotated.
                        </p>
                    </div>

                    <div v-if="canChooseLabelShape" class="form-group">
                        <label>Label shape</label>
                        <div class="btn-group btn-group-justified">
                            <div
                                v-for="option of allowedShapeOptions"
                                :key="option.key"
                                class="btn-group"
                                >
                                <button
                                    class="btn btn-default"
                                    :class="{'active btn-info': isLabelShapeOptionActive(option)}"
                                    :title="option.title"
                                    @click.prevent="selectLabelShape(option)"
                                    >
                                    <i :class="getShapeOptionIcon(option, isLabelShapeOptionActive(option))"></i>
                                </button>
                            </div>
                        </div>
                        <p class="help-block">
                            Select a shape tool that should be used for annotations with this label.
                        </p>
                        <div v-if="labelMediaTypeShapeWarning" class="panel panel-warning">
                            <div class="panel-body text-warning" v-text="labelMediaTypeShapeWarning"></div>
                        </div>
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
                        ></textarea>
                    </div>

                    <div v-if="selectedShape && canChooseLabelShape" class="form-group">
                        <label>Label shape</label>
                        <div class="btn-group btn-group-justified">
                            <div
                                v-for="option of allowedShapeOptions"
                                :key="option.key"
                                class="btn-group"
                                >
                                <button
                                    class="btn btn-default"
                                    :class="{'active btn-info': isLabelShapeOptionActive(option)}"
                                    :title="option.title"
                                    disabled
                                    >
                                    <i :class="getShapeOptionIcon(option, isLabelShapeOptionActive(option))"></i>
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
        printUrl: {
            type: String,
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
            // Only relevant if the selected shape is a rectangle.
            labelAllowAlignedRectangle: true,
            referenceImage: null,
            referenceImagePreview: null,
            isDirty: false,
            guidelineDescription: null,
            guidelineIsEnforced: false,
            guidelineShapes: new Set(),
            // State of the aligned rectangle button in the form. This is not the same
            // as allow_aligned_rectangle (see initGuidelineShapesForm).
            guidelineAllowAlignedRectangle: false,
            isEditingGuideline: false,
            labelDescriptionMaxLength: 256,
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
        // only_shapes is null if all shapes are allowed. An empty array means that no
        // shape is allowed, so only the separately allowed tools (e.g. the aligned
        // rectangle) can be used. The size of onlyShapeIds can't be used for this check.
        hasOnlyShapes() {
            return Array.isArray(this.annotationGuideline?.only_shapes);
        },
        allowedShapes() {
            if (this.hasOnlyShapes) {
                const allowed = new Map();

                this.onlyShapeIds.forEach(id => allowed.set(id, this.availableShapes.get(id)));

                return allowed;
            }

            return this.availableShapes;
        },
        rectangleId() {
            for (const [id, name] of this.availableShapes) {
                if (name === 'Rectangle') {
                    return id;
                }
            }

            return null;
        },
        alignedRectangleAllowed() {
            return !this.annotationGuideline?.enforced
                || this.annotationGuideline.allow_aligned_rectangle !== false;
        },
        hasShapeRestrictions() {
            return this.hasOnlyShapes || !this.alignedRectangleAllowed;
        },
        allowedShapeOptions() {
            return this.getShapeOptions(this.allowedShapes, this.alignedRectangleAllowed);
        },
        // A label shape has no effect if the guideline allows only a single shape (or
        // tool) anyway.
        canChooseLabelShape() {
            return this.allowedShapeOptions.length > 1;
        },
        availableShapeOptions() {
            return this.getShapeOptions(this.availableShapes, true);
        },
        mediaTypeShapeWarning() {
            // The aligned rectangle can be used in images and videos.
            if (this.guidelineAllowAlignedRectangle) {
                return '';
            }

            return this.getMediaTypeShapeWarning(this.guidelineShapes);
        },
        labelMediaTypeShapeWarning() {
            return this.getMediaTypeShapeWarning(this.selectedShape ? [this.selectedShape] : []);
        },
    },
    watch: {
        selectedLabel(label) {
            this.resetForm();
            const guidelineLabel = this.annotationGuidelineLabels.get(label?.id);
            if (guidelineLabel) {
                this.labelDescription = guidelineLabel.description || '';
                this.selectedShape = guidelineLabel.shape || null;
                this.labelAllowAlignedRectangle = guidelineLabel.allow_aligned_rectangle !== false;
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
            this.initGuidelineShapesForm();
            this.annotationGuideline.labels.forEach((label) => {
                this.annotationGuidelineLabels.set(label.id, label.pivot);
            });
        }
    },
    methods: {
        getMediaTypeShapeWarning(shapeIds) {
            const ids = [...shapeIds];

            if (ids.length !== 1) {
                return '';
            }

            const name = this.availableShapes.get(ids[0]);

            if (name === 'Ellipse') {
                return 'Only image annotations can be created using the selected shape.';
            }

            if (name === 'WholeFrame') {
                return 'Only video annotations can be created using the selected shape.';
            }

            return '';
        },
        async selectLabel(label) {
            if (this.isDirty && confirm(`Save unsaved changes for "${this.selectedLabel.name}"?`)) {
                if (!await this.saveLabel()) {
                    return;
                }
            }
            this.selectedLabel = label;
        },
        // The aligned rectangle is a separate option next to the rectangle, although it
        // is stored as rectangle shape with the allow_aligned_rectangle flag.
        getShapeOptions(shapes, withAlignedRectangle) {
            const options = [];
            this.availableShapes.forEach((name, id) => {
                if (shapes.has(id)) {
                    options.push({key: name, id, title: name});
                }

                if (withAlignedRectangle && id === this.rectangleId) {
                    options.push({key: 'AlignedRectangle', id, title: 'Aligned rectangle'});
                }
            });

            return options;
        },
        getShapeOptionIcon(option, active) {
            return ['icon', `icon-${option.key.toLowerCase()}`, {'icon-white': active}];
        },
        isGuidelineShapeOptionActive(option) {
            if (option.key === 'AlignedRectangle') {
                return this.guidelineAllowAlignedRectangle;
            }

            return this.guidelineShapes.has(option.id);
        },
        selectGuidelineShape(option) {
            if (option.key === 'AlignedRectangle') {
                this.guidelineAllowAlignedRectangle = !this.guidelineAllowAlignedRectangle;
            } else if (this.guidelineShapes.has(option.id)) {
                this.guidelineShapes.delete(option.id);
            } else {
                this.guidelineShapes.add(option.id);
            }

            // Everything selected is saved as no restriction, which the form shows as
            // nothing selected (see initGuidelineShapesForm). Clear it right away so the
            // selection doesn't flip only after saving.
            if (this.guidelineAllowAlignedRectangle && this.guidelineShapes.size === this.availableShapes.size) {
                this.guidelineShapes.clear();
                this.guidelineAllowAlignedRectangle = false;
            }
        },
        // In the form, the aligned rectangle is selected like any other shape and no
        // selected shape means that all shapes are allowed. The guideline instead
        // stores the regular shapes in only_shapes (null if all are allowed) and the
        // aligned rectangle in allow_aligned_rectangle (true by default). The two
        // functions below convert between both representations. If all regular shapes
        // are selected, only_shapes is saved as null:
        //
        // only_shapes | allow_aligned_rectangle | form
        // null        | true                    | nothing selected
        // null        | false                   | all regular shapes selected
        // [ids]       | true/false              | the shapes, aligned rectangle on/off
        // []          | true                    | only the aligned rectangle selected
        //
        // An empty only_shapes array doesn't imply the aligned rectangle on its own. More
        // tools that are allowed separately may be added in the future, so the flags of
        // all of them must be checked.
        initGuidelineShapesForm() {
            const onlyShapes = this.annotationGuideline?.only_shapes ?? null;
            const allowAlignedRectangle = this.annotationGuideline?.allow_aligned_rectangle !== false;

            if (onlyShapes === null) {
                this.guidelineShapes = allowAlignedRectangle ? new Set() : new Set(this.availableShapes.keys());
                this.guidelineAllowAlignedRectangle = false;
            } else {
                this.guidelineShapes = new Set(onlyShapes);
                this.guidelineAllowAlignedRectangle = allowAlignedRectangle;
            }
        },
        getGuidelineShapesPayload() {
            const nothingSelected = this.guidelineShapes.size === 0
                && !this.guidelineAllowAlignedRectangle;

            // The backend also resets the attributes if the guideline is not enforced.
            if (!this.guidelineIsEnforced || nothingSelected) {
                return {only_shapes: null, allow_aligned_rectangle: true};
            }

            const allRegularSelected = this.guidelineShapes.size === this.availableShapes.size;

            return {
                // This is an empty array if only separate tools are selected.
                only_shapes: allRegularSelected ? null : Array.from(this.guidelineShapes),
                allow_aligned_rectangle: this.guidelineAllowAlignedRectangle,
            };
        },
        isLabelShapeOptionActive(option) {
            if (this.selectedShape !== option.id) {
                return false;
            }

            return option.id !== this.rectangleId || this.labelAllowAlignedRectangle === (option.key === 'AlignedRectangle');
        },
        selectLabelShape(option) {
            this.isDirty = true;
            if (this.isLabelShapeOptionActive(option)) {
                this.selectedShape = null;
            } else {
                this.selectedShape = option.id;
                this.labelAllowAlignedRectangle = option.key === 'AlignedRectangle';
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
            this.labelAllowAlignedRectangle = true;
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
                formData.append('shape', this.selectedShape);
            }
            if (this.selectedShape === this.rectangleId) {
                formData.append('allow_aligned_rectangle', this.labelAllowAlignedRectangle ? '1' : '0');
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
                ...this.getGuidelineShapesPayload(),
            };

            if (this.creating) {
                return AnnotationGuidelineApi.save({ id: this.projectId }, payload)
                    .then(
                        (response) => {
                            this.annotationGuideline = response.body;
                            this.initGuidelineShapesForm();
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
                            this.initGuidelineShapesForm();
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
        // This mirrors the update of the guideline labels in the backend.
        maybeUnsetLabelShapes() {
            this.annotationGuidelineLabels.forEach((label) => {
                if (!label.shape) {
                    return;
                }

                if (label.shape === this.rectangleId && label.allow_aligned_rectangle !== false) {
                    if (!this.alignedRectangleAllowed) {
                        label.shape = null;
                    }
                } else if (this.hasOnlyShapes && !this.onlyShapeIds.has(label.shape)) {
                    label.shape = null;
                }
            });
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
            this.initGuidelineShapesForm();
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
            this.guidelineAllowAlignedRectangle = false;
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

<template>
    <div>
        <button
            class="btn btn-default pull-right"
            @click="emitCancelEditing"
        >
            Cancel Editing
        </button>
    </div>
    <div class="form-group annotation-strategy-description">
        <textarea
            v-model="strategyDescription"
            class="strategy-description"
            maxlength="2000"
            wrap="hard"
            placeholder="Edit the strategy description here..."
        ></textarea>
        <div
            v-if="editing || modifiedAnnotationStrategyLabels.length > 0"
            id="add-annotation-strategy-label"
        >
            <div class="form-group">
                <div class="row">
                    <div class="col-xs-3">
                        <h4>Label</h4>
                    </div>
                    <div class="col-xs-3">
                        <h4>Label description</h4>
                    </div>
                    <div class="col-xs-2">
                        <h4>Shape</h4>
                    </div>
                    <div class="col-xs-3 center-container">
                        <h4>Reference Image</h4>
                    </div>
                </div>
                <div
                    v-for="annotationStrategyLabel in modifiedAnnotationStrategyLabels"
                >
                    <div
                        v-if="!annotationStrategyLabelIsSelected(annotationStrategyLabel)"
                    >
                        <div class="row annotation-strategy-label">
                            <div class="col-xs-3">
                                <ul class="label-tree__list">
                                    <label-tree-label
                                        :label="annotationStrategyLabel.label"
                                        :flat="true"
                                        :showFavorites="false"
                                    ></label-tree-label>
                                </ul>
                            </div>
                            <div class="col-xs-3">
                                <span>{{
                                    annotationStrategyLabel.description
                                }}</span>
                            </div>
                            <div class="col-xs-2">
                                <span
                                    class="btn control-button"
                                    v-if="annotationStrategyLabel.shape"
                                    ><i
                                        :class="`icon icon-white icon-${mapShape(annotationStrategyLabel.shape).toLowerCase()}`"
                                    ></i
                                ></span>
                                <span>{{
                                    mapShape(annotationStrategyLabel.shape)
                                }}</span>
                            </div>
                            <div class="col-xs-3">
                                <annotation-strategy-label-image
                                    :base-url="baseUrl"
                                    :project-id="projectId"
                                    :reference-image="annotationStrategyLabel.reference_image || ''"
                                ></annotation-strategy-label-image>
                            </div>
                            <div class="col-xs-1">
                                <button
                                    title="Edit the annotation strategy for this label"
                                    @click.stop="editStrategyLabel(annotationStrategyLabel.label)"
                                    class="btn btn-default btn"
                                >
                                    <span
                                        aria-hidden="true"
                                        class="fa fa-pencil-alt"
                                    >
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="editing">
                    <div class="row annotation-strategy-label-edit">
                        <div class="col-xs-3">
                            <div
                                v-if="!selectedLabel"
                                v-cloak
                                class="annotation-strategy-label-options"
                            >
                                <label-trees
                                    :trees="labelTrees"
                                    :multiselect="false"
                                    @select="selectLabel"
                                    @deselect="deselectLabel"
                                >
                                </label-trees>
                            </div>
                            <div v-else>
                                <ul class="label-tree__list">
                                    <label-tree-label
                                        :label="selectedLabel"
                                        :flat="true"
                                        :showFavorites="false"
                                    ></label-tree-label>
                                </ul>
                            </div>
                        </div>
                        <div v-show="selectedLabel">
                            <div class="col-xs-3" id="description-editor">
                                <textarea
                                    v-model="labelDescription"
                                    class="strategy-description"
                                    maxlength="200"
                                    wrap="hard"
                                    placeholder="Describe how this label should be used..."
                                ></textarea>
                            </div>
                            <div v-if="hasLabelDescription">
                                <div class="col-xs-2">
                                    <select
                                        class="form-control"
                                        selected=""
                                        v-model="selectedShape"
                                        title="Select shape"
                                        @change="selectShape"
                                    >
                                        <option :value="undefined">None</option>
                                        <option
                                            v-for="(
                                                name, id
                                            ) in availableShapes"
                                            :value="id"
                                            v-text="name"
                                        ></option>
                                    </select>
                                </div>
                                <div class="col-xs-3">
                                    <annotation-strategy-label-image
                                        :base-url="baseUrl"
                                        :editable="true"
                                        :project-id="projectId"
                                        :reference-image="selectedReferenceImage || ''"
                                        @set-reference-image="setReferenceImage"
                                        @reset-reference-image="resetReferenceImage"
                                        @upload-image="uploadImage"
                                    ></annotation-strategy-label-image>
                                </div>
                                <div class="col-xs-1">
                                    <button
                                        class="btn btn-success btn-block btn-asl"
                                        :disabled="disableAddAnnotationStrategyLabel"
                                        type="button"
                                        @click="addAnnotationStrategyLabel"
                                        :title="editingStrategyLabelText"
                                    >
                                        <span
                                            v-if="currentlyEditingStrategyLabel"
                                            class="fa fa-check"
                                            aria-hidden="true"
                                        ></span>
                                        <span
                                            v-else
                                            class="fa fa-plus"
                                            aria-hidden="true"
                                        ></span>
                                    </button>
                                    <span v-if="currentlyEditingStrategyLabel">
                                        <button
                                            class="btn btn-danger btn-block btn-asl"
                                            type="button"
                                            @click="deleteAnnotationStrategyLabel"
                                            title="Delete the strategy for this label"
                                        >
                                            <span
                                                class="fa fa-times"
                                                aria-hidden="true"
                                            ></span>
                                        </button>
                                    </span>
                                    <button
                                        class="btn btn-warning btn-block btn-asl"
                                        type="button"
                                        @click="resetEditing"
                                        title="Go back"
                                    >
                                        <span
                                            class="fa fa-backward"
                                            aria-hidden="true"
                                        ></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xs-2" v-if="!editing">
                <button
                    class="btn btn-success btn-block"
                    type="button"
                    @click="toggleEditing"
                    title="Add new label to the annotation strategy"
                >
                    <i class="fa fa-tags"></i>
                    <span class="fa fa-plus" aria-hidden="true"></span>
                </button>
            </div>
            <div class="col-xs-2">
                <button
                    class="btn btn-success btn-block"
                    type="button"
                    @click="sendUpdateAnnotationStrategy"
                >
                    <span v-if="creating"> Create strategy </span>
                    <span v-else> Save changes </span>
                </button>
            </div>
            <div v-if="!creating" class="col-xs-2">
                <button
                    class="btn btn-danger btn-block"
                    type="submit"
                    @click="sendDeleteAnnotationStrategy"
                    title="Delete the annotation strategy"
                >
                    Delete strategy
                </button>
            </div>
        </div>
    </div>
</template>
<script>
import AnnotationStrategy from '@/projects/api/annotationStrategy.js';
import AnnotationStrategyLabel from '@/projects/api/annotationStrategyLabel.js';
import AnnotationStrategyLabelImage from './annotationStrategyLabelImage.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LabelTreeLabel from '@/label-trees/components/labelTreeLabel.vue';
import { handleErrorResponse } from '@/core/messages/store.js';
import { toRaw } from 'vue';

export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
        labelTreeLabel: LabelTreeLabel,
        annotationStrategyLabelImage: AnnotationStrategyLabelImage,
    },
    emits: [
        'refresh-strategy',
        'cancel-editing',
    ],
    props: {
        annotationStrategy: {
            type: Object,
            required: true,
        },
        annotationStrategyLabels: {
            type: Array,
            required: true,
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
    },
    computed: {
        hasLabelDescription() {
            return (
                this.labelDescription && this.labelDescription.trim().length > 0
            );
        },
        disableAddAnnotationStrategyLabel() {
            return (
                this.selectedLabel !== undefined && !this.hasLabelDescription
            );
        },
        creating() {
            return this.annotationStrategy.description === undefined;
        },
        currentlyEditingStrategyLabel() {
            return (
                this.selectedLabel &&
                this.editingExistingStrategyLabel(this.selectedLabel.id)
            );
        },
        hasEditedDescription() {
            return (
                this.strategyDescription !== this.annotationStrategy.description
            );
        },
        hasEditedStrategyLabels() {
            return (
                this.modifiedAnnotationStrategyLabels !==
                    toRaw(this.annotationStrategyLabels) ||
                this.currentlyEditingStrategyLabel
            );
        },
        editingStrategyLabelText() {
            if (this.currentlyEditingStrategyLabel) {
                return 'Edit strategy for this label';
            }
            return 'Create strategy for a label';
        },
    },
    created() {
        if (this.annotationStrategy !== null) {
            this.strategyDescription = this.annotationStrategy.description;
        }
        window.addEventListener('beforeunload', (e) => {
            if (
                (this.hasEditedDescription || this.hasEditedStrategyLabels) &&
                !this.automatedReload
            ) {
                e.preventDefault();
                e.returnValue = '';
                return 'This page is asking you to confirm that you want to leave — information you’ve entered may not be saved.';
            }
        });
    },
    data() {
        //TODO: move these values to parent and pass them as props
        return {
            editing: false,
            labelDescription: '',
            selectedLabel: undefined,
            selectedShape: undefined,
            modifiedAnnotationStrategyLabels: structuredClone(toRaw(this.annotationStrategyLabels)),
            strategyDescription: '',
            selectedReferenceImage: '',
            automatedReload: false,
        };
    },
    methods: {
        getImageUrl(label_id) {
            return this.baseUrl + '/' + label_id;
        },
        mapShape(shape) {
            if (!shape) {
                return 'No preferred shape selected';
            }
            return this.availableShapes[shape];
        },
        sendUpdateAnnotationStrategy() {
            if (
                !this.strategyDescription ||
                this.strategyDescription.trim().length == 0
            ) {
                alert('The description of the strategy is empty.');
                return;
            }

            if (this.selectedLabel || this.hasLabelDescription) {
                alert('You did not save the latest label strategy!');
                return;
            }

            if (
                this.modifiedAnnotationStrategyLabels.some(function (asl) {
                    return !asl.description || asl.description.trim() == 0;
                })
            ) {
                alert('The description of one of the labels is empty.');
                return;
            }

            AnnotationStrategy.save(
                { id: this.projectId },
                { description: this.strategyDescription },
            ).then(
                this.sendAnnotationStrategyLabelUpdate,
                this.handleErrorResponse,
            );
        },
        sendAnnotationStrategyLabelUpdate() {
            let labels = this.modifiedAnnotationStrategyLabels.map(
                (item) => item.label.id,
            );
            let descriptions = this.modifiedAnnotationStrategyLabels.map(
                (item) => item.description,
            );
            let shapes = this.modifiedAnnotationStrategyLabels.map(
                (item) => item.shape,
            );
            let referenceImages = this.modifiedAnnotationStrategyLabels.map(
                (item) => item.reference_image,
            );
            AnnotationStrategyLabel.save(
                {
                    id: this.projectId,
                },
                {
                    labels: labels,
                    descriptions: descriptions,
                    shapes: shapes,
                    reference_images: referenceImages,
                },
            ).then(this.refreshStrategy, this.handleErrorResponse);
        },
        sendDeleteAnnotationStrategy() {
            let response = prompt(
                `This will delete the strategy for this project. Please enter 'delete' to confirm.`,
            );

            if (response !== 'delete') {
                return;
            }
            AnnotationStrategy.delete({ id: this.projectId }, {}).then(
                this.refreshStrategy,
                handleErrorResponse,
            );
        },

        refreshStrategy() {
            this.automatedReload = true;
            this.$emit('refresh-strategy');
        },
        editStrategyLabel(label) {
            this.editing = true;
            this.selectedLabel = label;
            this.editThis(
                this.modifiedAnnotationStrategyLabels.find(
                    (asl) => asl.label.id === label.id,
                ),
            );
        },
        selectLabel(label) {
            if (this.editingExistingStrategyLabel(label.id)) {
                alert('A strategy for ths label already exists');
                return;
            }
            this.editing = true;
            this.selectedLabel = label;
        },
        deselectLabel() {
            //TODO: check if we can use a computed property for the label
            this.selectedLabel = undefined;
        },
        addAnnotationStrategyLabel() {
            if (this.editingExistingStrategyLabel(this.selectedLabel.id)) {
                Object.assign(
                    this.modifiedAnnotationStrategyLabels.filter(
                        (asl) => asl.label.id == this.selectedLabel.id,
                    )[0],
                    {
                        shape: this.selectedShape,
                        description: this.labelDescription,
                        reference_image: this.selectedReferenceImage,
                    },
                );
            } else {
                this.modifiedAnnotationStrategyLabels.push({
                    label: this.selectedLabel,
                    shape: this.selectedShape,
                    description: this.labelDescription,
                    reference_image: this.selectedReferenceImage,
                });
            }
            this.resetEditing();
        },
        editThis(strategyLabel) {
            this.selectedShape = strategyLabel.shape;
            this.selectedLabel = strategyLabel.label;
            this.labelDescription = strategyLabel.description;
            this.selectedReferenceImage = strategyLabel.reference_image;
        },
        editingExistingStrategyLabel(label_id) {
            if (
                this.modifiedAnnotationStrategyLabels.some(
                    (asl) => asl.label.id == label_id,
                )
            ) {
                return true;
            }
            return false;
        },
        annotationStrategyLabelIsSelected(asl) {
            return this.selectedLabel && this.selectedLabel.id == asl.label.id;
        },
        toggleEditing() {
            this.editing = true;
        },
        resetEditing() {
            this.selectedShape = undefined;
            this.selectedLabel = undefined;
            this.labelDescription = '';
            this.editing = false;
            this.selectedReferenceImage = '';
        },
        deleteAnnotationStrategyLabel() {
            if (this.selectedReferenceImage.length > 0) {
                let response = prompt(
                    `This will delete the reference image for this label. Please enter 'delete' to confirm.`,
                );

                if (response !== 'delete') {
                    return;
                }
                this.resetReferenceImage();
            }
            if (
                this.selectedLabel &&
                this.editingExistingStrategyLabel(this.selectedLabel.id)
            ) {
                this.modifiedAnnotationStrategyLabels.splice(
                    this.modifiedAnnotationStrategyLabels.indexOf(
                        this.selectedLabel,
                    ),
                );
            }
            this.resetEditing();
        },
        setReferenceImage(filename) {
            this.selectedReferenceImage = filename;
        },
        resetReferenceImage() {
            this.startLoading();
            AnnotationStrategyLabel.delete_image(
                { id: this.projectId },
                { reference_image: this.referenceImage },
            )
                .then(this.setReferenceImage(''), handleErrorResponse)
                .finally(this.finishLoading);
        },
        uploadImage(formData) {
            this.startLoading();
            AnnotationStrategyLabel.upload_image(
                { id: this.projectId },
                formData,
            )
                .then(
                    (response) =>
                        this.setReferenceImage(response.body.filename),
                    handleErrorResponse,
                )
                .finally(this.finishLoading);
        },
        emitCancelEditing() {
            let confirmExit = true;
            if (this.hasEditedDescription || this.hasEditedStrategyLabels) {
                confirmExit = confirm(
                    `You have edited the annotation strategy, but you have not saved. Are you sure you want to leave?`,
                );
            }
            if (confirmExit) {
                this.resetEditing();
                this.strategyDescription = this.annotationStrategy.description;
                this.modifiedAnnotationStrategyLabels = structuredClone(toRaw(this.annotationStrategyLabels));
                this.$emit('cancel-editing');
            }
        }
    },
};
</script>

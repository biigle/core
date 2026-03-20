<template>
    <div>
        <h3><span v-if="creating">Create </span>Annotation Strategy</h3>
        <div v-if="isAdmin && !creating">
            <div v-if="!creating">
                <div v-if="editingStrategyDescription">
                    <button
                        class="btn btn-default pull-right"
                        @click="stopEditingDescription"
                    >
                        Stop editing strategy description
                    </button>
                </div>
                <div v-if="!editingStrategyDescription">
                    <button
                        class="btn btn-default pull-right"
                        @click="editStrategyDescription"
                    >
                        Edit strategy description
                    </button>
                </div>
            </div>
        </div>
        <h4>Description</h4>
        <div>
            <div class="form-group">
                <div
                    v-if="editingStrategyDescription || creating"
                    :class="{ 'has-error': missingDescription }"
                >
                    <textarea
                        v-model="annotationStrategy.description"
                        class="strategy-description form-control"
                        maxlength="2000"
                        wrap="hard"
                        placeholder="Edit the strategy description here..."
                    ></textarea>
                    <span v-if="missingDescription" class="help-block"
                        >The description of the strategy is missing</span
                    >
                </div>
                <div v-else>
                    <p class="strategy-description-text">
                        {{ annotationStrategy.description }}
                    </p>
                </div>
            </div>
            <div v-if="annotationStrategyLabels.length > 0" class="row">
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
            <div v-for="annotationStrategyLabel in annotationStrategyLabels">
                <annotation-strategy-label
                    :annotation-strategy-label="annotationStrategyLabel"
                    :project-id="projectId"
                    :creating="false"
                    :available-shapes="availableShapes"
                    :editing="annotationStrategyLabel.editing"
                    :base-url="baseUrl"
                    :is-admin="isAdmin"
                    @edit-label="setLabelEditing"
                    @add-label="addLabel"
                    @delete-label="deleteLabel"
                >
                </annotation-strategy-label>
            </div>
            <div v-if="addingNewLabel">
                <annotation-strategy-label
                    :is-admin="isAdmin"
                    :label-trees="labelTrees"
                    :project-id="projectId"
                    :creating="true"
                    :available-shapes="availableShapes"
                    :base-url="baseUrl"
                    :labels-to-exclude="labelsInStrategy"
                    @edit-label="setLabelEditing"
                    @add-label="addLabel"
                    @delete-label="deleteLabel"
                >
                </annotation-strategy-label>
            </div>
            <div v-if="isAdmin" class="row">
                <div class="col-xs-2" v-if="!addingNewLabel || editingLabel">
                    <button
                        class="btn btn-success btn-block"
                        type="button"
                        @click="addNewLabel"
                        title="Add new label to the annotation strategy"
                        :disabled="!hasLabelTrees"
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
    </div>
</template>
<script>
import AnnotationStrategy from '@/projects/api/annotationStrategy.js';
import AnnotationStrategyLabelApi from '@/projects/api/annotationStrategyLabel.js';
import AnnotationStrategyLabel from './annotationStrategyLabel.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import { handleErrorResponse } from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    components: {
        annotationStrategyLabel: AnnotationStrategyLabel,
    },
    props: {
        isAdmin: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        creating() {
            return Object.keys(this.annotationStrategy).length === 0;
        },
        hasSelectedLabel() {
            return this.selectedLabel === undefined;
        },
        editingLabel() {
            return this.annotationStrategyLabels.filter(
                (asl) => asl.editing === true,
            )[0];
        },
        hasDescription() {
            return (
                this.annotationStrategy.description &&
                this.annotationStrategy.description.trim().length > 0
            );
        },
        hasLabelTrees() {
            return this.labelTrees.length > 0;
        },
        labelsInStrategy() {
            return this.annotationStrategyLabels.map((asl) => asl.label.id);
        },
    },
    watch: {
        //At most one label is edited
        editingLabel: function (editingAsl) {
            if (editingAsl) {
                Object.assign(
                    this.annotationStrategyLabels.filter(
                        (asl) => asl.label.id != editingAsl.label.id,
                    ),
                    { editing: false },
                );
            }
        },
    },
    data() {
        let shapes = biigle.$require('projects.availableShapes');
        shapes[undefined] = 'None';
        return {
            editing: false,
            projectId: biigle.$require('projects.project').id,
            labelTrees: biigle.$require('projects.labelTrees'),
            annotationStrategy: biigle.$require('projects.annotationStrategy'),
            annotationStrategyLabels: biigle.$require(
                'projects.annotationStrategyLabels',
            ),
            availableShapes: shapes,
            baseUrl: biigle.$require(
                'projects.annotationStrategyLabelsBaseUrl',
            ),
            mightHaveEdited: false,
            addingNewLabel: false,
            editingStrategyDescription: false,
            missingDescription: false,
        };
    },
    created() {
        window.addEventListener('beforeunload', (e) => {
            if (this.mightHaveEdited) {
                e.preventDefault();
                e.returnValue = '';
                return 'This page is asking you to confirm that you want to leave — information you’ve entered may not be saved.';
            }
        });
    },
    methods: {
        refreshStrategy() {
            this.startLoading();
            AnnotationStrategy.get({ id: this.projectId }, {})
                .then(
                    (response) => this.setAnnotationStrategy(response.body),
                    handleErrorResponse,
                )
                .then(this.resetEditing)
                .finally(this.finishLoading);
        },
        resetEditing() {
            this.editingStrategyDescription = false;
            this.mightHaveEdited = false;
        },
        setAnnotationStrategy(responseBody) {
            this.annotationStrategy = responseBody.annotation_strategy;
            this.annotationStrategyLabels =
                responseBody.annotation_strategy_labels;
        },
        cancelEditing() {
            let confirmExit = confirm(
                `Are you sure you want to exit editing without saving?`,
            );
            if (confirmExit) {
                this.setEditing(false);
            }
        },
        setLabelEditing(label) {
            if (this.editingLabel || this.addingNewLabel) {
                alert('You are already editing another label!');
                return;
            }
            Object.assign(
                this.annotationStrategyLabels.filter(
                    (asl) => asl.label.id == label.id,
                )[0],
                { editing: true },
            );
        },
        addLabel(annotationStrategyLabel) {
            this.mightHaveEdited = true;
            if (this.editingLabel) {
                Object.assign(this.editingLabel, annotationStrategyLabel);
                this.editingLabel.editing = false;
                return;
            }
            this.annotationStrategyLabels.push(annotationStrategyLabel);
            this.addingNewLabel = false;
        },
        addNewLabel() {
            this.mightHaveEdited = true;
            this.addingNewLabel = true;
        },
        editStrategyDescription() {
            this.mightHaveEdited = true;
            this.editingStrategyDescription = true;
        },
        deleteLabel() {
            if (this.addingNewLabel) {
                this.addingNewLabel = false;
            } else {
                this.annotationStrategyLabels.splice(
                    this.annotationStrategyLabels.findIndex(
                        (asl) => asl.label.id == this.editingLabel.id,
                    ),
                );
            }
        },
        sendUpdateAnnotationStrategy() {
            if (!this.hasDescription) {
                this.missingDescription = true;
                return;
            }
            this.missingDescription = false;
            if (this.editingLabel || this.addingNewLabel) {
                alert('You did not save the latest changes to the label!');
                return;
            }

            let data = this.generateLabelUpdate();

            this.startLoading();
            AnnotationStrategy.save(
                { id: this.projectId },
                { description: this.annotationStrategy.description },
            )
                .then(
                    AnnotationStrategyLabelApi.save(
                        { id: this.projectId },
                        data,
                    ),
                    this.handleErrorResponse,
                )
                .catch(this.handleErrorResponse)
                .finally(() => {
                    this.finishLoading();
                    this.refreshStrategy();
                });
        },
        generateLabelUpdate() {
            let formData = new FormData();

            if (this.annotationStrategyLabels.length === 0) {
                return;
            }

            this.annotationStrategyLabels.forEach((item, index) => {
                formData.append(`labels[${index}]`, item.label.id);
                formData.append(`descriptions[${index}]`, item.description);

                //If not set to '', if undefined will be cast to string
                formData.append(
                    `shapes[${index}]`,
                    item.shape ? item.shape : '',
                );
                formData.append(
                    `reference_images[${index}]`,
                    item.reference_image ? item.reference_image : '',
                );
            });
            return formData;
        },
        sendDeleteAnnotationStrategy() {
            let response = prompt(
                `This will delete the strategy for this project. Please enter 'delete' to confirm.`,
            );

            if (response !== 'delete') {
                return;
            }
            this.mightHaveEdited = false;
            AnnotationStrategy.delete({ id: this.projectId }, {}).then(
                this.reloadPage,
                handleErrorResponse,
            );
        },
        reloadPage() {
            setTimeout(() => location.reload(), 100);
        },
        stopEditingDescription() {
            this.editingStrategyDescription = false;
        },
    },
};
</script>

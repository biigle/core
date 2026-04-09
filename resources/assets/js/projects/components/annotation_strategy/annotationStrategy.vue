<template>
    <div>
        <h3>
            <span v-if="creating">Create </span>Annotation Strategy
            <a
                class="btn"
                href="/manual/tutorials/projects/about#annotation-strategy"
                title="Learn more about annotation strategies"
                target="_blank">
                <i class="fa fa-question-circle">
                </i>
            </a>
        </h3>
        <div class="row">
            <div class="col-xs-6">
                <span>
                    <h4>Description
                        <span v-if="isAdmin && !creating">
                            <span v-if="!editingDescription">
                                <a
                                    @click="editDescription"
                                    class="btn"
                                    title="Edit the strategy description"
                                >
                                    <span aria-hidden="true" class="fa fa-pencil-alt"> </span>
                                </a>
                            </span>
                            <span v-else>
                                <a
                                    title="Stop editing the strategy description"
                                    @click="stopEditingDescription"
                                    class="btn"
                                >
                                    <i aria-hidden="true" class="fa fa-check"> </i>
                                </a>
                            </span>
                        </span>
                    </h4>
                </span>
            </div>
            <div class="col-xs-6">
                <span v-if="isAdmin" class="top-bar pull-right">
                    <button
                        class="btn btn-success btn-sm"
                        type="button"
                        @click="sendUpdateAnnotationStrategy"
                        title="Save annotation strategy"
                    >
                        <span class="fa fa-check"></span>
                        Save strategy
                    </button>
                    <span v-if="!creating">
                        <button
                            class="btn btn-danger btn-sm"
                            type="submit"
                            @click="sendDeleteAnnotationStrategy"
                            title="Delete the annotation strategy"
                        >
                            <span class="fa fa-trash"></span>
                            Delete strategy
                        </button>
                    </span>
                </span>
            </div>
        </div>
        <div>
            <div class="form-group">
                <div
                    v-if="editingDescription || creating"
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
                        >
                        The description of the strategy is missing
                    </span>
                </div>
                <div v-else>
                    <p class="strategy-description-text well">
                        {{ annotationStrategy.description }}
                    </p>
                </div>
            </div>
            <div  v-if="hasLabelTrees">
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
                <div class="row annotation-strategy-label">
                    <annotation-strategy-label
                        :annotation-strategy-labels="annotationStrategyLabels"
                        :labelTrees="labelTrees"
                        :project-id="projectId"
                        :creating="false"
                        :available-shapes="availableShapes"
                        :base-url="baseUrl"
                        :is-admin="isAdmin"
                        @add-label="addLabel"
                        @delete-label="deleteLabel"
                    >
                    </annotation-strategy-label>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import AnnotationStrategy from '@/projects/api/annotationStrategy.js';
import AnnotationStrategyLabelApi from '@/projects/api/annotationStrategyLabel.js';
import AnnotationStrategyLabel from './annotationStrategyLabel.vue';
import Messages from '@/core/messages/store.js';
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
        hasDescription() {
            return (
                this.annotationStrategy.description &&
                this.annotationStrategy.description.trim().length > 0
            );
        },
        hasLabelTrees() {
            return this.labelTrees.length > 0;
        },
    },
    data() {
        let shapes = biigle.$require('projects.availableShapes');
        shapes[undefined] = 'None';
        return {
            editing: false,
            projectId: biigle.$require('projects.project').id,
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
            editingDescription: false,
            missingDescription: false,
            remindToSave: false,
            labelTrees: biigle.$require('projects.labelTrees'),
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
            this.editingDescription = false;
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
        addLabel(annotationStrategyLabel) {
            this.mightHaveEdited = true;
            let existingAsl = this.annotationStrategyLabels.find((asl) => asl.label.id == annotationStrategyLabel.label.id)
            if (existingAsl) {
                Object.assign(existingAsl, annotationStrategyLabel);
                return;
            }
            this.annotationStrategyLabels.push(annotationStrategyLabel);
        },
        editDescription() {
            this.mightHaveEdited = true;
            this.editingDescription = true;
        },
        deleteLabel(id) {
            this.annotationStrategyLabels.splice(
                this.annotationStrategyLabels.findIndex(
                    (asl) => asl.label.id == id,
            ));
        },
        checkIsEditingLabel() {
            if (this.addingNewLabel) {
                Messages.danger('Save the new label before saving the strategy');
                this.remindToSave = true;
                return true;
            }

            if (this.editingLabel) {
                this.addLabel(this.editingLabel);
            }

            return false;
        },
        sendUpdateAnnotationStrategy() {
            if (!this.hasDescription) {
                this.missingDescription = true;
                Messages.warning('Add a description before saving')
                return;
            }

            if (this.checkIsEditingLabel()) {
                return;
            }


            this.missingDescription = false;
            let data = this.generateLabelUpdate();

            this.startLoading();
            AnnotationStrategy.save(
                { id: this.projectId },
                { description: this.annotationStrategy.description },
            )
                .then(
                    () => AnnotationStrategyLabelApi.save(
                        { id: this.projectId },
                        data,
                    ),
                    this.handleErrorResponse,
                )
                .then(() => this.sendSuccessMessage(), this.handleErrorResponse)
                .then(this.refreshStrategy)
                .finally(this.finishLoading);
        },
        sendSuccessMessage() {
            Messages.success('Strategy saved.');
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
            this.editingDescription = false;
        },
    },
};
</script>

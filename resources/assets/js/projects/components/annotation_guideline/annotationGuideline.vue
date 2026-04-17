<template>
    <div>
        <h3>
            <span v-if="creating">Create </span>Annotation Guideline
            <a
                class="btn"
                href="/manual/tutorials/projects/about#annotation-guideline"
                title="Learn more about annotation guidelines"
                target="_blank">
                <i class="fa fa-question-circle">
                </i>
            </a>
        </h3>
        <div class="row">
            <div class="col-xs-6">
                <span>
                    <h4>Description</h4>
                </span>
            </div>
            <div class="col-xs-6">
                <span v-if="isAdmin" class="top-bar pull-right">
                    <span v-if="editingMode">
                        <button
                            class="btn btn-success btn-sm"
                            type="button"
                            @click="sendUpdateAnnotationGuideline"
                            title="Save annotation guideline"
                        >
                            <span class="fa fa-check"></span>
                            Save guideline
                        </button>
                        <span v-if="!creating">
                            <button
                                class="btn btn-danger btn-sm"
                                type="submit"
                                @click="sendDeleteAnnotationGuideline"
                                title="Delete the annotation guideline"
                            >
                                <span class="fa fa-trash" aria-hidden="true"></span>
                                Delete guideline
                            </button>
                        </span>
                    </span>
                    <span v-else>
                        <button
                            class="btn btn-default btn-sm"
                            type="button"
                            @click="setEditing"
                            title="Edit the guideline"
                        >
                            <span class="fa fa-pen" aria-hidden="true"></span>
                            Edit guideline
                        </button>
                    </span>
                </span>
            </div>
        </div>
        <div>
            <div class="form-group">
                <div
                    v-if="editingMode || creating"
                    :class="{ 'has-error': missingDescription }"
                >
                    <textarea
                        v-model="annotationGuideline.description"
                        class="guideline-description form-control"
                        maxlength="2000"
                        wrap="hard"
                        placeholder="Edit the guideline description here..."
                    ></textarea>
                    <span v-if="missingDescription" class="help-block"
                        >
                        The description of the guideline is missing
                    </span>
                </div>
                <div v-else>
                    <p class="guideline-description-text well">
                        {{ annotationGuideline.description }}
                    </p>
                </div>
            </div>
            <div  v-if="hasLabelTrees">
                <div class="row annotation-guideline-label">
                    <annotation-guideline-label
                        :annotation-guideline-labels="annotationGuidelineLabels"
                        :label-trees="labelTrees"
                        :project-id="projectId"
                        :creating="false"
                        :available-shapes="availableShapes"
                        :base-url="baseUrl"
                        :is-admin="isAdmin"
                        :editingMode="editingMode"
                        :force-save-label="forceSaveLabel"
                        @add-label="addLabel"
                        @delete-label="deleteLabel"
                    >
                    </annotation-guideline-label>
                </div>
            </div>
            <div v-else>
                There are no label trees associated to this project. To add labels to the guideline, add label trees first.
            </div>
        </div>
    </div>
</template>
<script>
import AnnotationGuideline from '@/projects/api/annotationGuideline.js';
import AnnotationGuidelineLabelApi from '@/projects/api/annotationGuidelineLabel.js';
import AnnotationGuidelineLabel from './annotationGuidelineLabel.vue';
import Messages from '@/core/messages/store.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import { handleErrorResponse } from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    components: {
        annotationGuidelineLabel: AnnotationGuidelineLabel,
    },
    props: {
        isAdmin: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        creating() {
            return Object.keys(this.annotationGuideline).length === 0;
        },
        hasDescription() {
            return (
                this.annotationGuideline.description &&
                this.annotationGuideline.description.trim().length > 0
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
            annotationGuideline: biigle.$require('projects.annotationGuideline'),
            annotationGuidelineLabels: biigle.$require(
                'projects.annotationGuidelineLabels',
            ),
            availableShapes: shapes,
            baseUrl: biigle.$require(
                'projects.annotationGuidelineLabelsBaseUrl',
            ),
            mightHaveEdited: false,
            addingNewLabel: false,
            editingMode: false,
            missingDescription: false,
            remindToSave: false,
            labelTrees: biigle.$require('projects.labelTrees'),
            forceSaveLabel: false,
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
        if (this.creating) {
            this.editingMode = true;
        }
    },
    methods: {
        refreshGuideline() {
            this.startLoading();
            AnnotationGuideline.get({ id: this.projectId }, {})
                .then(
                    (response) => this.setAnnotationGuideline(response.body),
                    handleErrorResponse,
                )
                .finally(this.finishLoading);
        },
        setEditing() {
            this.editingMode = true;
            this.mightHaveEdited = true;
        },
        resetEditing() {
            this.editingMode = false;
            this.mightHaveEdited = false;
            this.forceSaveLabel = false;
        },
        setAnnotationGuideline(responseBody) {
            this.annotationGuideline = responseBody.annotation_guideline;
            this.annotationGuidelineLabels =
                responseBody.annotation_guideline_labels;
        },
        cancelEditing() {
            let confirmExit = confirm(
                `Are you sure you want to exit editing without saving?`,
            );
            if (confirmExit) {
                this.resetEditing();
            }
        },
        addLabel(annotationGuidelineLabel) {
            if (!this.checkHasDescription()) {
                return;
            }
            let element = "Label";
            let data = this.generateLabelUpdate(annotationGuidelineLabel);

            //To add a label to a guideline, we need to first create the guideline.
            let createAnnotationGuideline = Promise.resolve("");
            if (this.creating) {
                element = element + " and guideline";
                createAnnotationGuideline = AnnotationGuideline.save(
                    { id: this.projectId },
                    { description: this.annotationGuideline.description },
                )
            }
            this.startLoading()
            createAnnotationGuideline
                .then(
                    () => AnnotationGuidelineLabelApi.save(
                        { id: this.projectId },
                        data,
                    ),
                    this.handleErrorResponse,
                )
                .then(() => this.sendSuccessMessage(element), this.handleErrorResponse)
                .then(this.refreshGuideline)
                .finally(this.finishLoading);
        },
        deleteLabel(id) {
            let response = prompt(
                `This will all the information about this label, including the image. Please enter 'delete' to confirm.`,
            );

            if (response !== 'delete') {
                return;
            }

            AnnotationGuidelineLabelApi.delete({ id: this.projectId }, { label: id })
                    .catch(this.handleErrorResponse);

            this.annotationGuidelineLabels.splice(
                this.annotationGuidelineLabels.findIndex(
                    (agl) => agl.label.id == id,
            ));
        },
        checkIsEditingLabel() {
            if (this.addingNewLabel) {
                Messages.danger('Save the new label before saving the guideline');
                this.remindToSave = true;
                return true;
            }

            if (this.editingLabel) {
                this.addLabel(this.editingLabel);
            }

            return false;
        },
        checkHasDescription() {
            if (!this.hasDescription) {
                this.missingDescription = true;
                Messages.warning('Add a description before saving')
                return false;
            }
            return true;
        },
        sendUpdateAnnotationGuideline() {
            if (!this.checkHasDescription()) {
                return;
            }

            this.forceSaveLabel = true;
            this.missingDescription = false;

            //Leave some time to save the label
            setTimeout(
                () => AnnotationGuideline.save(
                    { id: this.projectId },
                    { description: this.annotationGuideline.description },
                )
                .then(this.refreshGuideline)
                .then(() => this.sendSuccessMessage("Guideline"))
                .then(this.resetEditing)
                .finally(this.finishLoading),
                500
            )
        },
        sendSuccessMessage(element) {
            Messages.success(element + ' saved.');
        },
        generateLabelUpdate(agl) {
            let formData = new FormData();

            formData.append(`label`, agl.label.id);

            //If not set to '', if undefined will be cast to string
            formData.append(
                `description`,
                agl.description ? agl.description : ''
            );

            formData.append(
                `shape`,
                agl.shape ? agl.shape : '',
            );
            formData.append(
                `reference_image`,
                agl.reference_image ? agl.reference_image : '',
            );
            return formData;
        },
        sendDeleteAnnotationGuideline() {
            let response = prompt(
                `This will delete the guideline for this project. Please enter 'delete' to confirm.`,
            );

            if (response !== 'delete') {
                return;
            }

            AnnotationGuideline.delete({ id: this.projectId }, {}).then(
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

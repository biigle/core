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
                        placeholder=""
                    ></textarea>
                    <p class="help-block">
                        Describe how objects with this label can be identified and how they should be annotated.
                    </p>
                </div>

                <div class="form-group">
                    <label>Shape</label>
                    <div class="btn-group btn-group-justified">
                        <div v-for="shape in availableShapes" class="btn-group">
                            <button
                                class="btn btn-default"
                                :title="shape"
                                :disabled="!selectedLabel"
                                >
                                <i class="icon" :class="`icon-${shape.toLowerCase()}`"></i>
                            </button>
                        </div>
                    </div>
                    <p class="help-block">
                        Select a shape tool that should be used for annotations with this label.
                    </p>
                </div>

                <div class="form-group">
                    <label>Reference Image</label>
                    <input type="file" @change="addImage" :disabled="!selectedLabel" />
                    <p class="help-block">
                        Upload a reference image that helps to identify objects with this label.
                    </p>
                </div>

                <button :disabled="!selectedLabel" class="btn btn-success">
                    Save
                </button>
            </form>
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
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import { handleErrorResponse } from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    components: {
        annotationGuidelineLabel: AnnotationGuidelineLabel,
        labelTrees: LabelTrees,
    },
    props: {
        isAdmin: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        labelsInGuideline() {
            return this.annotationGuidelineLabels.map((agl) => agl.label.id);
        },

        creating() {
            return this.annotationGuideline === null;
        },
        hasLabelTrees() {
            return this.labelTrees.length > 0;
        },
    },
    watch: {
        'annotationGuideline.description': "setMightHaveEdited",
        'annotationGuidelineLabel': "setMightHaveEdited",
    },
    data() {
        return {
            labelTrees: biigle.$require('projects.labelTrees'),
            selectedLabel: null,
            annotationGuidelineLabels: [],
            availableShapes: biigle.$require('projects.availableShapes'),


            editing: false,
            projectId: biigle.$require('projects.project').id,
            annotationGuideline: biigle.$require('projects.annotationGuideline'),
            description: '',
            baseUrl: biigle.$require(
                'projects.annotationGuidelineLabelsBaseUrl',
            ),
            mightHaveEdited: false,
            addingNewLabel: false,
            editingMode: false,
            forceSaveLabel: false,
        };
    },
    created() {
        if (this.isAdmin) {
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
        }

        if (this.annotationGuideline) {
            this.description = this.annotationGuideline.description;
            this.annotationGuidelineLabels = this.annotationGuideline.labels;
        }
    },
    methods: {
        selectLabel(label) {
            this.selectedLabel = label;
        },
        deselectLabel() {
            this.selectedLabel = null;
        },


        setMightHaveEdited() {
            this.mightHaveEdited = true;
        },
        refreshGuideline() {
            this.startLoading();
            AnnotationGuideline.get({ id: this.projectId }, {})
                .then(
                    (response) => this.setAnnotationGuideline(response.body),
                    handleErrorResponse,
                )
                .finally(this.finishLoading);
            this.mightHaveEdited = false;
        },
        setEditing() {
            this.editingMode = true;
        },
        resetEditing() {
            this.editingMode = false;
            this.mightHaveEdited = false;
            this.forceSaveLabel = false;
        },
        setAnnotationGuideline(responseBody) {
            this.annotationGuideline = responseBody;
            this.annotationGuidelineLabels = responseBody.labels;
            this.mightHaveEdited = false;
        },
        addLabel(annotationGuidelineLabel) {
            let data = this.generateLabelUpdate(annotationGuidelineLabel);

            // If the user tries to save a label before creating a guideline,
            // we need to save the guideline first.
            let createAnnotationGuideline = Promise.resolve("");
            if (this.creating) {
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
                .then(() => this.sendSuccessMessage("Label"), this.handleErrorResponse)
                .then(() => this.refreshGuideline())
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

            const index = this.annotationGuidelineLabels.findIndex(
                (agl) => agl.label.id == id,
            );
            if (index !== -1) {
                this.annotationGuidelineLabels.splice(index, 1);
            }
        },
        updateAnnotationGuideline() {
            this.forceSaveLabel = true;

            //Leave some time to save the label
            setTimeout(
                () => AnnotationGuideline.update(
                    { id: this.annotationGuideline.id },
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
        deleteAnnotationGuideline() {
            let response = prompt(
                `This will delete the guideline for this project. Please enter 'delete' to confirm.`,
            );

            if (response !== 'delete') {
                return;
            }

            this.mightHaveEdited = false;

            AnnotationGuideline.delete({ id: this.annotationGuideline.id }, {}).then(
                this.reloadPage,
                handleErrorResponse,
            );
        },
        reloadPage() {
            setTimeout(() => location.reload(), 100);
        },
    },
};
</script>

<style scoped>
:deep(.label-trees__body) {
    max-height: 600px;

}
</style>

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
                    <input type="file" @change="addImage" :disabled="!selectedLabel" />
                    <p class="help-block">
                        Upload a reference image that helps to identify objects with this label.
                    </p>
                </div>

                <button
                    :disabled="!selectedLabel || loading || !isDirty"
                    class="btn btn-success"
                    >
                    Save
                </button>
            </form>
        </div>
    </div>
</div>
</template>
<script>
import AnnotationGuidelineApi from '@/projects/api/annotationGuideline.js';
import AnnotationGuidelineLabelApi from '@/projects/api/annotationGuidelineLabel.js';
import Messages, { handleErrorResponse } from '@/core/messages/store.js';
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
    },
    watch: {
        selectedLabel(label) {
            this.resetForm();
            const guidelineLabel = this.annotationGuidelineLabels.get(label?.id);
            if (guidelineLabel) {
                console.log(guidelineLabel);
                this.labelDescription = guidelineLabel.description || '';
                this.selectedShape = guidelineLabel.shape_id || null;
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
            this.isDirty = false;
        },
        addImage(event) {
            this.isDirty = true;
            this.referenceImage = event.target.files[0] || null;
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

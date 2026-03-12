<template>
    <div class="form-group annotation-strategy-description ">
        <textarea v-model="strategyDescription" class="strategy-description" maxlength=2000 wrap="hard"
            placeholder="Edit the strategy description here..."
            ></textarea>
        <div v-if="editing || modifiedAnnotationStrategyLabels.length > 0" id="add-annotation-strategy-label">
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
                <div v-for="annotationStrategyLabel in modifiedAnnotationStrategyLabels">
                    <div v-if="!annotationStrategyLabelIsSelected(annotationStrategyLabel)">
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
                                <span>{{ annotationStrategyLabel.description }}</span>
                            </div>
                            <div class="col-xs-2">
                               <span class="btn control-button" v-if="annotationStrategyLabel.shape_id"><i :class="`icon icon-white icon-${mapShape(annotationStrategyLabel.shape_id).toLowerCase()}`"></i></span>
                               <span>{{ mapShape(annotationStrategyLabel.shape_id) }}</span>
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
                                    class="btn btn-default btn">
                                    <span aria-hidden="true" class="fa fa-pencil-alt">
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="editing">
                    <div class="row annotation-strategy-label-edit">
                        <div class="col-xs-3">
                            <div v-if="!selectedLabel" v-cloak class="annotation-strategy-label-options">
                                <label-trees
                                    :trees="labelTrees"
                                    :multiselect="false"
                                    @select="selectLabel"
                                    @deselect="deselectLabel">
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
                                <textarea v-model="labelDescription" class="strategy-description" maxlength=200 wrap="hard"
                                    placeholder="Describe how this label should be used..."
                                    ></textarea>
                            </div>
                            <div v-if="hasLabelDescription">
                                <div class="col-xs-2">
                                    <select
                                        class="form-control"
                                        selected=""
                                        v-model="selectedShape" title="Select shape" @change="selectShape"
                                        >
                                        <option :value="undefined">None</option>
                                        <option
                                            v-for="name, id in availableShapes"
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
                                        <span v-if="currentlyEditingStrategyLabel" class="fa fa-check" aria-hidden="true"></span>
                                        <span v-else class="fa fa-plus" aria-hidden="true"></span>
                                    </button>
                                    <span v-if="currentlyEditingStrategyLabel">
                                        <button
                                            class="btn btn-danger btn-block btn-asl"
                                            type="button"
                                            @click="deleteAnnotationStrategyLabel"
                                            title="Delete the strategy for this label"
                                        >
                                            <span class="fa fa-times" aria-hidden="true"></span>
                                        </button>
                                    </span>
                                    <button
                                        class="btn btn-warning btn-block btn-asl"
                                        type="button"
                                        @click="resetEditing"
                                        title="Go back"
                                    >
                                        <span class="fa fa-backward" aria-hidden="true"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xs-2">
                <button
                    class="btn btn-success btn-block"
                    type="submit"
                    @click="toggleEditing"
                    title="Add new label to the annotation strategy "
                >
                    <i class="fa fa-tags"></i>
                    <span class="fa fa-plus" aria-hidden="true"></span>
                </button>
            </div>
            <div class="col-xs-2">
                <button
                    class="btn btn-success btn-block" type="button" @click="sendUpdateAnnotationStrategy" >
                    <span v-if='creating'>
                        Create strategy
                    </span>
                    <span v-else>
                        Save changes
                    </span>
                </button>
            </div>
            <div v-if='!creating' class="col-xs-2">
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
import {handleErrorResponse} from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
        labelTreeLabel: LabelTreeLabel,
        annotationStrategyLabelImage: AnnotationStrategyLabelImage,
    },
    emits: [
        'refresh-strategy',
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
        }
    },
    computed: {
        hasLabelDescription() {
            return this.labelDescription && this.labelDescription.trim().length > 0;
        },
        disableAddAnnotationStrategyLabel() {
            return this.selectedLabel !== undefined && !this.hasLabelDescription;
        },
        creating() {
            return this.annotationStrategy.description === undefined;
        },
        currentlyEditingStrategyLabel () {
            return this.selectedLabel && this.editingExistingStrategyLabel(this.selectedLabel.id);
        },
        hasEditedDescription() {
            return this.strategyDescription !== this.annotationStrategy.description;
        },
        hasEditedStrategyLabels() {
            return this.modifiedAnnotationStrategyLabels !== this.annotationStrategyLabels || this.currentlyEditingStrategyLabel;
        },
        editingStrategyLabelText() {
            if (this.currentlyEditingStrategyLabel) {
                return 'Edit ruleset for this label';
            }
            return 'Create ruleset';
        },
    },
    created() {
        if (this.annotationStrategy !== null) {
            this.strategyDescription = this.annotationStrategy.description;
        }
        window.addEventListener('beforeunload', (e) => {
            if (this.hasEditedDescription || this.hasEditedStrategyLabels || this.editing) {
                e.preventDefault();
                e.returnValue = '';
            }});
    },
    data() {
        //TODO: move these values to parent and pass them as props
        return {
            editing: false,
            labelDescription: "",
            selectedLabel: undefined,
            selectedShape: undefined,
            modifiedAnnotationStrategyLabels: this.annotationStrategyLabels,
            strategyDescription: "",
            labelImagePath: "",
            selectedReferenceImage: "",
            automatedReload: false,
        }
    },
    methods: {
        getImageUrl(label_id) {
            return this.baseUrl + '/' + label_id
        },
        mapShape(shape_id) {
            if (!shape_id) {
                return "No preferred shape selected";
            }
            return this.availableShapes[shape_id];
        },
        sendUpdateAnnotationStrategy() {
            if (!this.strategyDescription || this.strategyDescription.trim().length == 0) {
                alert("The description of the strategy is empty.");
                return;
            }

            if (this.selectedLabel || this.hasLabelDescription) {
                alert('You did not save the latest label strategy!')
                return;
            }

            if (this.modifiedAnnotationStrategyLabels.some(function (asl) {
                return !asl.description || asl.description.trim() == 0;
            })) {
                alert("The description of one of the labels is empty.");
                return;
            }

            AnnotationStrategy
                .save({ id: this.projectId }, { description: this.strategyDescription })
                .then(this.sendAnnotationStrategyLabelUpdate, this.handleErrorResponse)

        },
        sendAnnotationStrategyLabelUpdate() {
            let labels = this.modifiedAnnotationStrategyLabels.map(item => item.label.id);
            let descriptions = this.modifiedAnnotationStrategyLabels.map(item => item.description);
            let shapes = this.modifiedAnnotationStrategyLabels.map(item => item.shape_id);
            let referenceImages = this.modifiedAnnotationStrategyLabels.map(item => item.reference_image);
            AnnotationStrategyLabel.save(
                {
                    id: this.projectId
                },
                {
                    labels: labels,
                    descriptions: descriptions,
                    shapes: shapes,
                    reference_images: referenceImages
                })
                .then(this.refreshStrategy ,this.handleErrorResponse);

        },
        sendDeleteAnnotationStrategy() {
            let response = prompt(`This will delete the strategy for this project. Please enter 'delete' to confirm.`);

            if (response !== 'delete') {
                return;
            }
            AnnotationStrategy.delete({ id: this.projectId }, {})
                .then(this.refreshStrategy, handleErrorResponse)
        },


        refreshStrategy() {
            this.$emit('refresh-strategy');
        },
        editStrategyLabel(label) {
            this.editing = true;
            this.selectedLabel = label;
            this.editThis(this.modifiedAnnotationStrategyLabels.find((asl) => asl.label.id === label.id));
        },
        selectLabel(label) {
            if (this.editingExistingStrategyLabel(label.id)) {
                alert('A strategy for ths label already exists')
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
                Object.assign(this.modifiedAnnotationStrategyLabels
                    .filter((asl) => asl.label.id == this.selectedLabel.id)[0],
                    {
                        'shape_id':this.selectedShape,
                        'description': this.labelDescription,
                        "reference_image": this.selectedReferenceImage,
                    });
            } else {
                this.modifiedAnnotationStrategyLabels.push({
                    "label":this.selectedLabel,
                    "shape_id": this.selectedShape,
                    "description": this.labelDescription,
                    "reference_image": this.selectedReferenceImage,
                });
            }
            this.resetEditing();
        },
        editThis(strategyLabel) {
            this.selectedShape = strategyLabel.shape_id;
            this.selectedLabel = strategyLabel.label;
            this.labelDescription = strategyLabel.description;
            this.selectedReferenceImage = strategyLabel.reference_image;
        },
        editingExistingStrategyLabel(label_id) {
            if (this.modifiedAnnotationStrategyLabels.some((asl) => asl.label.id == label_id)) {
                return true;
            }
            return false
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
            this.labelDescription = "";
            this.labelImagePath = ""
            this.editing = false;
            this.selectedReferenceImage = "";
        },
        deleteAnnotationStrategyLabel() {
            if (this.selectedLabel && this.editingExistingStrategyLabel(this.selectedLabel.id)) {
                this.modifiedAnnotationStrategyLabels.splice(this.modifiedAnnotationStrategyLabels.indexOf(this.selectedLabel));
            }
            this.resetEditing();
        },
        setReferenceImage(reference_image) {
            this.selectedReferenceImage = reference_image;
        },
        resetReferenceImage() {
            this.selectedReferenceImage = "";
        },
    }
};
</script>

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
                    <div class="col-xs-2">
                        <h4>Shape</h4>
                    </div>
                    <div class="col-xs-3">
                        <h4>Reference Image</h4>
                    </div>
                    <div class="col-xs-3">
                        <h4>Label description</h4> </div>
                </div>
                <div v-for="annotationStrategyLabel in modifiedAnnotationStrategyLabels">
                    <div v-if="!annotationStrategyLabelIsSelected(annotationStrategyLabel)">
                        <div class="row">
                            <div class="col-xs-3">
                                <ul class="label-tree__list">
                                    <label-tree-label
                                        :label="annotationStrategyLabel.label"
                                        :flat="true"
                                        :showFavorites="false"
                                        ></label-tree-label>
                                </ul>
                            </div>
                            <div class="col-xs-2">
                                <span>{{ mapShape(annotationStrategyLabel.shape) }}</span>
                            </div>
                            <div class="col-xs-3">
                                <span>exampleimage</span>
                            </div>
                            <div class="col-xs-3">
                                <span>{{ annotationStrategyLabel.description }}</span>
                            </div>
                            <div class="col-xs-1">
                                <button title="Edit the annotation strategy for this label" @click.stop="editStrategyLabel(annotationStrategyLabel.label)" class="btn btn-default btn"><span aria-hidden="true" class="fa fa-pencil-alt"></span></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="editing">
                    <div class="row">
                        <div class="col-sm-3">
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
                            <div class="col-sm-2">
                                <select
                                    class="form-control"
                                    selected=""
                                    v-model="selectedShape" title="Select shape" @change="selectShape"
                                    clearable="true"
                                    >
                                    <option
                                        v-for="name, id in availableShapes"
                                        :value="id"
                                        v-text="name"
                                    ></option>
                                </select>
                            </div>
                            <div class="col-sm-3">
                                <label>Select a reference image</label>
                                <input type="file" name="referenceImage" @change="uploadFile" required>
                            </div>
                            <div class="col-sm-3">
                                <textarea v-model="labelDescription" class="strategy-description" maxlength=200 wrap="hard"
                                    placeholder="Describe how this label should be used..."
                                    ></textarea>
                            </div>
                            <div class="col-sm-1">
                                    <button
                                        class="btn btn-success btn-block"
                                        :disabled="disableAddAnnotationStrategyLabel"
                                        type="submit"
                                        @click="addAnnotationStrategyLabel"
                                        :title="editingStrategyLabelText"
                                    >
                                        <span v-if="currentlyEditingStrategyLabel" class="fa fa-pen" aria-hidden="true"></span>
                                        <span v-else class="fa fa-plus" aria-hidden="true"></span>
                                    </button>
                                    <button
                                        class="btn btn-danger btn-block"
                                        :disabled="!currentlyEditingStrategyLabel"
                                        type="submit"
                                        @click="deleteAnnotationStrategyLabel"
                                        title="Delete the strategy for this label"
                                    >
                                        <span class="fa fa-times" aria-hidden="true"></span>
                                    </button>
                                    <button
                                        class="btn btn-warning btn-block"
                                        type="submit"
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
            <div class="row">
                <div v-if="!editing" class="col-xs-2">
                    <button
                        class="btn btn-success btn-block"
                        type="submit"
                        @click="toggleEditing"
                        title="Add new label to the annotation strategy "
                    >
                        <span class="fa fa-plus" aria-hidden="true"></span>
                    </button>
                </div>
                <div>
                    <div class="col-xs-2">
                        <button
                            class="btn btn-success btn-block" type="submit" @click="sendUpdateAnnotationStrategy" >
                            <span v-if='creating'>
                                Create strategy
                            </span>
                            <span v-else>
                                Save changes
                            </span>
                        </button>
                    </div>
                    <div class="col-xs-2">
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
import AnnotationStrategyLabel from '@/projects/api/annotationStrategyLabel.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LabelTreeLabel from '@/label-trees/components/labelTreeLabel.vue';
import {handleErrorResponse} from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
        labelTreeLabel: LabelTreeLabel,
    },
    emits: [
        'deselect',
        'select',
    ],
    props: {
        annotationStrategy: {
            type: Object,
            default: null,
        },
        annotationStrategyLabels: {
            type: Object,
            default: null,
        },
    },
    computed: {
        disableAddAnnotationStrategyLabel() {
            return this.selectedLabel === undefined || !this.labelDescription || this.labelDescription.trim().lenght == 0;
        },
        creating() {
            return this.annotationStrategy === null;
        },
        currentlyEditingStrategyLabel () {
            return this.selectedLabel && this.editingExistingStrategyLabel(this.selectedLabel.id);
        },
        editingStrategyLabelText() {
            if (this.currentlyEditingStrategyLabel) {
                return 'Edit label strategy';
            }
            return 'Create new label strategy';
        },
    },
    created() {
        if (this.annotationStrategy !== null) {
            this.strategyDescription = this.annotationStrategy.description;
        }
    },
    data() {
        //TODO: annotationStrategyLabel --> we should it here
        return {
            editing: false,
            projectId: biigle.$require('projects.project').id,
            labelTrees: biigle.$require('projects.labelTrees'),
            labelDescription: "",
            selectedLabel: undefined,
            selectedShape: undefined,
            modifiedAnnotationStrategyLabels: this.annotationStrategyLabels ? this.annotationStrategyLabels : [],
            availableShapes: biigle.$require("projects.availableShapes"),
            strategyDescription: "",
        }
    },
    methods: {
        mapShape(shape_id) {
            if (shape_id === undefined) {
                return "";
            }
            return this.availableShapes[shape_id];
        },
        sendUpdateAnnotationStrategy() {
            //TODO: find the way to reload here
            if (!this.strategyDescription || this.strategyDescription.trim().length == 0) { alert("The description of the strategy is empty."); return;
            }

            if (this.modifiedAnnotationStrategyLabels.some(function (asl) {
                return !asl.description || asl.description.trim() == 0;
            })) {
                alert("The description of one of the labels is empty.");
                return;
            }

            AnnotationStrategy
                .save({ id: this.projectId }, { description: this.strategyDescription })
                .then(this.sendAnnotationStrategyLabelUpdate, handleErrorResponse)
                .then(this.reloadPageIfSuccessful, handleErrorResponse)

        },
        sendAnnotationStrategyLabelUpdate() {
            let label = this.modifiedAnnotationStrategyLabels.map(item => item.label.id);
            let description = this.modifiedAnnotationStrategyLabels.map(item => item.description);
            let shape = this.modifiedAnnotationStrategyLabels.map(item => item.shape);
            AnnotationStrategyLabel.save({id: this.projectId}, {labels: label, descriptions: description, shapes: shape});
        },
        sendDeleteAnnotationStrategy() {
            AnnotationStrategy.delete({ id: this.projectId }, {})
                .then(this.reloadPageIfSuccessful).catch(handleErrorResponse)
        },
        reloadPageIfSuccessful(response) {
            console.log(response);
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
            this.selectedShape = undefined;
            this.labelDescription = "";
        },
        deselectLabel() {
            //TODO: check if we can use a computed property for the label
            this.selectedLabel = undefined;
        },
        addAnnotationStrategyLabel() {
            if (this.editingExistingStrategyLabel(this.selectedLabel.id)) {
                Object.assign(this.modifiedAnnotationStrategyLabels
                    .filter((asl) => asl.label.id == this.selectedLabel.id)[0],
                    {'shape':this.selectedShape, 'description': this.labelDescription});
            } else {
                this.modifiedAnnotationStrategyLabels.push({
                    "label":this.selectedLabel,
                    "shape": this.selectedShape,
                    "description": this.labelDescription,
                });
            }
            this.resetEditing();
        },
        editThis(strategyLabel) {
            this.selectedShape = strategyLabel.shape;
            this.selectedLabel = strategyLabel.label;
            this.labelDescription = strategyLabel.description;
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
            this.editing = false;
        },
        deleteAnnotationStrategyLabel() {
            if (this.selectedLabel && this.editingExistingStrategyLabel(this.selectedLabel.id)) {
                this.modifiedAnnotationStrategyLabels.splice(this.modifiedAnnotationStrategyLabels.indexOf(this.selectedLabel));
            }
            this.resetEditing();
        },
        uploadFile(event) {
            this.startLoading();
            if (event.target.files[0].size > 5 * 1024 * 1024) {
                alert('The file is too big');
                event.target.files[0].value = undefined;
                event.target.value = undefined; // Reset the input
                this.finishLoading();
                return;
            }
            let filename = event.target.files[0].file;
            AnnotationStrategyLabel.upload_file({ id: this.projectId }, { file: event.target.files[0].value })
                .then(this.setFilename(filename), handleErrorResponse);
        },
        setFilename(filename) {
            this.annotationStrategyLabelFilename = filename;
        },
    }
};
</script>


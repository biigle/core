<template>
    <div>
        <h3><span v-if="editing">Edit </span><span v-if="creating">Create </span>Annotation Strategy</h3>
        <div v-if="isAdmin && !editing && !creating">
            <button class="btn btn-default pull-right" @click="setEditing(true)">Edit</button>
        </div>
        <div v-if="isAdmin && editing">
            <button class="btn btn-default pull-right" @click="setEditing(false)">Cancel Editing</button>
        </div>
        <a class="pull-right" href="/manual/tutorials/projects/about#members" title="Learn more about project members" target="_blank"><i class="fa fa-question-circle"></i></a>
        <h4>Description</h4>
        <div v-if="editing || creating">
            <form @submit.prevent="">
                <div class="form-group annotation-strategy-description ">
                    <textarea v-model="strategyDescription" class="strategy-description" maxlength=2000 wrap="hard"
                        :placeholder="descriptionPlaceholder"
                        ></textarea>
                        <div>
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
                                    <h4>Label description</h4>
                                </div>
                                <div class="col-xs-1">
                                </div>
                            </div>
                        <div v-for="annotationStrategyLabel in annotationStrategyLabels">
                            <!-- TODO: probably better to use a ul here? -->
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
                                    <button title="Edit the strategy for this label" @click.stop="editThis" class="btn btn-default btn"><span aria-hidden="true" class="fa fa-pencil-alt"></span></button>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div id="add-annotation-strategy-label">
                        <div class="form-group">
                            <div class="row">
                                <div class="col-sm-3">
                                    make this smaller
                                    <div v-show="true" v-cloak class="annotation-strategy-label-options">
                                        <label-trees
                                            :trees="labelTrees"
                                            :multiselect="false"
                                            @select="selectLabel">
                                        </label-trees>
                                    </div>
                                </div>
                                <div class="col-sm-2">
                                    <select
                                        class="form-control"
                                        selected=""
                                        v-model="selectedShape"
                                        title="Select shape"
                                        @change="selectShape"
                                    >
                                        <option
                                            v-for="name, id in availableShapes"
                                            :value="id"
                                            v-text="name"
                                        ></option>
                                    </select>
                                </div>
                                <div class="col-sm-2">
                                    <span>upload. here we should see the image present</span>
                                </div>
                                <div class="col-sm-3">
                                    fix placeholder
                                    <textarea v-model="labelDescription" class="strategy-description" maxlength=200 wrap="hard"
                                        :placeholder="descriptionPlaceholder"
                                        ></textarea>
                                </div>

                                <div class="col-sm-2">
                                    <button
                                        class="btn btn-success btn-block"
                                        :disabled="hasSelectedLabel"
                                        type="submit"
                                        @click="addAnnotationStrategyLabel"
                                        title="Add new label rule to the annotation strategy"
                                    >
                                        <span class="fa fa-plus" aria-hidden="true"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <button
                            class="btn btn-success btn-block" type="submit" @click="sendAnnotationStrategyUpdate" >
                            <span v-if='creating'>
                                Create strategy
                            </span>
                            <span v-if='editing'>
                                Save changes
                            </span>
                        </button>
                    </div>
                    <div class="col-sm-6">
                        <button
                            class="btn btn-danger btn-block"
                            type="submit"
                            @click="sendAnnotationStrategyDelete"
                            >
                            Delete
                        </button>
                    </div>
                </div>
            </form>
        </div>
        <div v-else>
            <div class="form-group annotation-strategy-description ">
                <p>{{ strategyDescription }}</p>
            </div>
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
                                <h4>Label description</h4>
                            </div>
                            <div class="col-xs-1">
                            </div>
                        </div>

                        <div v-for="annotationStrategyLabel in annotationStrategyLabels">
                            <!-- TODO: probably better to use a ul here? -->
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
                                    <button title="Edit the strategy for this label" @click.stop="editThis" class="btn btn-default btn"><span aria-hidden="true" class="fa fa-pencil-alt"></span></button>
                                </div>
                            </div>
                        </div>
                        </div>
                        </div>
</template>
<script>
import AnnotationStrategy from '@/projects/api/annotationStrategy.js';
import AnnotationStrategyLabel from '@/projects/api/annotationStrategyLabel.js';
import {handleErrorResponse} from '@/core/messages/store.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LabelTreeLabel from '@/label-trees/components/labelTreeLabel.vue';

export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
        labelTreeLabel: LabelTreeLabel,
    },
    emits: [
        'deselect',
    ],
    props: {
        //TODO: should be undefined. FIX PHP
        annotationStrategy: {
            type: Object,
            default: null,
        },
        annotationStrategyLabels: {
            type: Object,
            default: null,
        },
        isAdmin: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        descriptionPlaceholder() {
            return this.strategyDescription ? this.strategyDescription.length > 0 : "Describe the annotation strategy here..."
        },
        creating() {
            return this.annotationStrategy === null;
        },
        hasSelectedLabel() {
            return this.selectedLabel === undefined;
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
            strategyDescription: "",
            projectId: biigle.$require('projects.project').id,
            labelTrees: biigle.$require('projects.labelTrees'),
            labelDescription: "",
            selectedLabel: undefined,
            availableShapes: biigle.$require("projects.availableShapes"),
        }
    },
    methods: {
        mapShape(shape_id) {
            if (shape_id === undefined) {
                return "";
            }
            return this.availableShapes[shape_id];
        },
        sendAnnotationStrategyUpdate() {
            //TODO: find the way to reload here
            if (this.strategyDescription.length == 0) {
                alert("The description of the strategy is empty.");
                return;
            }


            AnnotationStrategy
                .save({ id: this.projectId }, { description: this.strategyDescription })
                .then(this.sendAnnotationStrategyLabelUpdate, handleErrorResponse)
                .then(this.reloadPageIfSuccessful, handleErrorResponse)

        },
        sendAnnotationStrategyLabelUpdate() {
            if (this.annotationStrategyLabels.length > 0) {
                let label = this.annotationStrategyLabels.map(item => item.label.id);
                let description = this.annotationStrategyLabels.map(item => item.description);
                let shape = this.annotationStrategyLabels.map(item => item.shape);
                AnnotationStrategyLabel.save({id: this.projectId}, {labels: label, descriptions: description, shapes: shape});
            }
        },
        sendAnnotationStrategyDelete() {
            AnnotationStrategy.delete({ id: this.projectId }, {})
                .then(this.reloadPageIfSuccessful).catch(handleErrorResponse)
        },
        reloadPageIfSuccessful(response) {
            console.log("should reload");
        },
        mapLabels() {},
        setEditing(val) {
            this.editing = val;
        },
        selectLabel(label) {
            //TODO: check if label is already present
            this.selectedLabel = label;
        },
        addAnnotationStrategyLabel() {
            //tODO: is it really necessary?
            this.annotationStrategyLabels.push({
                "label":this.selectedLabel,
                "shape": this.selectedShape,
                "description": this.labelDescription,
            });
            //TODO: find best way to emit the deselect this.$emit('deselect', this.selectedLabel);
            this.selectedShape = undefined;
            this.selectedLabel = undefined;
            this.labelDescription = "";
        }
    }
};

</script>

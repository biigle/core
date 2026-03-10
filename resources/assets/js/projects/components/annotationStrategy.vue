<template>
    <div>
        <h3><span v-if="editing">Edit </span><span v-if="creating">Create </span>Annotation Strategy</h3>
        <div v-if="isAdmin && !creating">
            <div v-if="editing">
                <button class="btn btn-default pull-right" @click="setEditing(false)">Cancel Editing</button>
            </div>
            <div v-else>
                <button class="btn btn-default pull-right" @click="setEditing(true)">Edit</button>
            </div>
        </div>
        <a class="pull-right" href="/manual/tutorials/projects/about#members" title="Learn more about project members" target="_blank"><i class="fa fa-question-circle"></i></a>
        <h4>Description</h4>
        <div v-if="editing || creating">
            <annotation-strategy-editor
                :annotation-strategy="annotationStrategy"
                :annotation-strategy-labels="annotationStrategyLabels"
                ></annotation-strategy-editor>
        </div>
        <div v-else>
            <div class="form-group annotation-strategy-description ">
                <p>{{ strategyDescription }}</p>
            </div>
            <div v-if="annotationStrategyLabels.length > 0" class="row">
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
            <div v-for="annotationStrategyLabel in annotationStrategyLabels">
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
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import AnnotationStrategy from '@/projects/api/annotationStrategy.js';
import AnnotationStrategyLabel from '@/projects/api/annotationStrategyLabel.js';
import AnnotationStrategyEditor from './annotationStrategyEditor.vue';
import {handleErrorResponse} from '@/core/messages/store.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTreeLabel from '@/label-trees/components/labelTreeLabel.vue';

export default {
    mixins: [LoaderMixin],
    components: {
        annotationStrategyEditor: AnnotationStrategyEditor,
        labelTreeLabel: LabelTreeLabel,
    },
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
        sendDeleteAnnotationStrategy() {
            AnnotationStrategy.delete({ id: this.projectId }, {})
                .then(this.reloadPageIfSuccessful).catch(handleErrorResponse)
        },
        reloadPageIfSuccessful(response) {
            console.log("should reload");
        },
        setEditing(val) {
            this.editing = val;
        },
    }
};

</script>

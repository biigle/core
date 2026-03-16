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
        <h4>Description</h4>
        <div v-if="editing || creating">
            <annotation-strategy-editor
                :annotation-strategy="annotationStrategy"
                :annotation-strategy-labels="annotationStrategyLabels"
                :available-shapes="availableShapes"
                :label-trees="labelTrees"
                :project-id="projectId"
                :base-url="baseUrl"
                @refresh-strategy="refreshStrategy"
                ></annotation-strategy-editor>
        </div>
        <div v-else>
            <div class="form-group">
                <p id="strategy-description-text">{{ annotationStrategy.description }}</p>
            </div>
            <div v-if="annotationStrategyLabels.length > 0" class="row ">
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
                        <span class="btn control-button" v-if="annotationStrategyLabel.shape"><i :class="`icon icon-white icon-${mapShape(annotationStrategyLabel.shape).toLowerCase()}`"></i></span>
                        <span>{{ mapShape(annotationStrategyLabel.shape) }}</span>
                    </div>
                    <div class="col-xs-3">
                        <annotation-strategy-label-image
                            :base-url="baseUrl"
                            :reference-image="annotationStrategyLabel.reference_image || ''"
                            :project-id="projectId"
                            ></annotation-strategy-label-image>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import AnnotationStrategy from '@/projects/api/annotationStrategy.js';
import AnnotationStrategyEditor from './annotationStrategyEditor.vue';
import AnnotationStrategyLabelImage from './annotationStrategyLabelImage.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTreeLabel from '@/label-trees/components/labelTreeLabel.vue';
import {handleErrorResponse} from '@/core/messages/store.js';

export default {
    mixins: [LoaderMixin],
    components: {
        annotationStrategyEditor: AnnotationStrategyEditor,
        labelTreeLabel: LabelTreeLabel,
        annotationStrategyLabelImage: AnnotationStrategyLabelImage,
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
    },
    data() {
        //TODO: annotationStrategyLabel --> we should it here
        return {
            editing: false,
            projectId: biigle.$require('projects.project').id,
            labelTrees: biigle.$require('projects.labelTrees'),
            annotationStrategy: biigle.$require('projects.annotationStrategy'),
            annotationStrategyLabels: biigle.$require('projects.annotationStrategyLabels'),
            labelDescription: "",
            selectedLabel: undefined,
            availableShapes: biigle.$require("projects.availableShapes"),
            baseUrl: biigle.$require('projects.annotationStrategyLabelsBaseUrl'),
        }
    },
    methods: {
        mapShape(shape) {
            if (!shape) {
                return "No preferred shape selected";
            }
            return this.availableShapes[shape];
        },
        setEditing(val) {
            this.editing = val;
        },
        refreshStrategy() {
            this.startLoading();
            AnnotationStrategy.get({id: this.projectId}, {})
                .then((response) => this.setAnnotationStrategy(response.body), handleErrorResponse)
                .then(this.setEditing(false))
                .finally(this.finishLoading);
        },
        setAnnotationStrategy(responseBody) {
            this.annotationStrategy = responseBody.annotation_strategy;
            this.annotationStrategyLabels = responseBody.annotation_strategy_labels;
        },
    }
};

</script>

<template>
    <div class="row annotation-strategy-label">
        <div class="col-xs-3">
            <div v-if="creating && !hasLabel" :class="{ 'has-error': missingLabel }">
                <typeahead
                    class="typeahead--block"
                    :items="labels"
                    placeholder="Search a label here..."
                    :clear-on-select="true"
                    v-on:select="selectLabel">
                </typeahead>
                <span class="help-block" v-if="missingLabel">
                    Choose a label
                </span>
            </div>
            <div v-else>
                <ul class="label-tree__list">
                    <label-tree-label
                        :label="label"
                        :flat="true"
                        :showFavorites="false"
                    ></label-tree-label>
                </ul>
            </div>
        </div>
        <div class="col-xs-3">
            <div v-if="editMode" :class="{ 'has-error': missingDescription }">
                <textarea
                    v-model="description"
                    class="form-control strategy-description"
                    maxlength="200"
                    wrap="hard"
                    placeholder="Describe how this label should be used..."
                ></textarea>
                <span class="help-block" v-if="missingDescription"
                    >
                    Add a description to this label
                 </span>
            </div>
            <div v-else>
                <span class="strategy-description-text">{{ description }}</span>
            </div>
        </div>
        <div class="col-xs-2">
            <div v-if="editMode">
                <select
                    class="form-control"
                    v-model="shape"
                    title="Select shape"
                >
                    <option
                        v-for="(name, id) in availableShapes"
                        :value="id"
                        v-text="name"
                    ></option>
                </select>
            </div>
            <div v-else>
                <span class="btn control-button" v-if="shape"
                    ><i
                        :class="`icon icon-white icon-${availableShapes[shape].toLowerCase()}`"
                    ></i
                ></span>
                <span>{{ availableShapes[shape] }}</span>
            </div>
        </div>
        <div class="col-xs-3">
            <annotation-strategy-label-image
                :base-url="baseUrl"
                :label-id="labelId"
                :project-id="projectId"
                :editable="editMode"
                :temporary-image="temporaryReferenceImage"
                :is-admin="isAdmin"
                @reset-reference-image="resetReferenceImage"
                @add-image="addImage"
            ></annotation-strategy-label-image>
        </div>
        <div v-if="isAdmin" class="col-xs-1">
            <div v-if="editMode" :class="{ 'has-error': remindToSave }">
                <button
                    class="btn btn-success btn-block btn-asl"
                    type="button"
                    @click="addAnnotationStrategyLabel"
                    :title="editingStrategyLabelText"
                >
                    <span
                        v-if="editing"
                        class="fa fa-check"
                        aria-hidden="true"
                    ></span>
                    <span v-else class="fa fa-plus" aria-hidden="true"></span>
                </button>
                <span>
                    <button
                        class="btn btn-danger btn-block btn-asl"
                        type="button"
                        @click="deleteLabel"
                        title="Delete this label from the strategy"
                    >
                        <span class="fa fa-times" aria-hidden="true"></span>
                    </button>
                </span>
                <span v-if="remindToSave" class="help-block">
                    Save or delete this label before saving the strategy
                </span>
            </div>
            <div v-else>
                <button
                    title="Edit this label in the strategy"
                    @click.stop="emitEdit"
                    class="btn btn-default btn"
                >
                    <span aria-hidden="true" class="fa fa-pencil-alt"> </span>
                </button>
            </div>
        </div>
    </div>
</template>
<script>
import AnnotationStrategyLabelImage from './annotationStrategyLabelImage.vue';
import AnnotationStrategyLabelApi from '@/projects/api/annotationStrategyLabel.js';
import LabelTreeLabel from '@/label-trees/components/labelTreeLabel.vue';
import { handleErrorResponse } from '@/core/messages/store.js';
import { resizeImage } from './resizeImage.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import Typeahead from '@/core/components/typeahead.vue';

export default {
    mixins: [LoaderMixin],
    emits: ['edit-label', 'add-label', 'delete-label'],
    components: {
        labelTreeLabel: LabelTreeLabel,
        annotationStrategyLabelImage: AnnotationStrategyLabelImage,
        typeahead: Typeahead,
    },
    props: {
        annotationStrategyLabel: {
            type: Object,
            default: () => {},
        },
        editing: {
            type: Boolean,
            default: false,
        },
        availableShapes: {
            type: Object,
            required: true,
        },
        labels: {
            type: Array,
            default: () => [],
        },
        projectId: {
            type: Number,
            required: true,
        },
        baseUrl: {
            type: String,
            required: true,
        },
        creating: {
            type: Boolean,
            default: false,
        },
        isAdmin: {
            type: Boolean,
            required: true,
        },
        labelsToExclude: {
            type: Array,
            default: () => [],
        },
        remindToSave: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        editingStrategyLabelText() {
            if (this.editing) {
                return 'Edit label in the strategy';
            }
            return 'Add label to the strategy';
        },
        temporaryReferenceImage() {
            return this.referenceImage
                ? URL.createObjectURL(this.referenceImage)
                : undefined;
        },
        labelId() {
            return this.label.id ? this.label.id : NaN;
        },
        hasLabel() {
            return !isNaN(this.labelId);
        },
        hasDescription() {
            return this.description.length !== 0;
        },
        editMode() {
            return this.editing || this.creating;
        },
    },
    data() {
        return {
            label: {},
            shape: undefined,
            description: '',
            referenceImage: undefined,
            missingLabel: false,
            missingDescription: false,
        };
    },
    created() {
        if (!this.creating) {
            this.setup();
        }
    },
    methods: {
        selectLabel(label) {
            this.label = label;
        },
        deselectLabel() {
            this.label = {};
        },
        emitEdit() {
            this.$emit('edit-label', this.label);
        },
        setup() {
            this.label = this.annotationStrategyLabel.label;
            //casting null to undefined
            this.shape = this.annotationStrategyLabel.shape ?? undefined;
            this.description = this.annotationStrategyLabel.description;
            this.referenceImage = this.annotationStrategyLabel.reference_image;
        },
        addAnnotationStrategyLabel() {
            if (!this.hasLabel || !this.hasDescription) {
                this.missingDescription = !this.hasDescription;
                this.missingLabel = !this.hasLabel;
                return;
            }
            this.missingDescription = false;
            this.missingLabel = false;
            this.$emit('add-label', {
                label: this.label,
                shape: this.shape,
                description: this.description,
                reference_image: this.referenceImage,
            });
        },
        deleteLabel() {
            this.$emit('delete-label');
        },
        addImage(file) {
            this.startLoading();
            resizeImage(file)
                .then((image) => this.setImage(image))
                .finally(this.finishLoading);
        },
        setImage(image) {
            this.referenceImage = image;
        },
        resetReferenceImage() {
            this.startLoading();
            AnnotationStrategyLabelApi.delete_image(
                { id: this.projectId },
                { label: this.labelId },
            )
                .then(this.setReferenceImage, handleErrorResponse)
                .finally(this.finishLoading);
        },
    },
};
</script>

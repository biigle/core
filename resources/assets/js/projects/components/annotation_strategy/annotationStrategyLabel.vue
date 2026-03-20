<template>
    <div class="row annotation-strategy-label">
        <div class="col-xs-3">
            <div v-if="creating">
                <ul class="label-tree__list">
                    <label-trees
                        :trees="labelTrees"
                        :multiselect="false"
                        :disabled-labels="labelsToExclude"
                        @select="selectLabel"
                        @deselect="deselectLabel"
                    >
                    </label-trees>
                </ul>
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
            <div v-if="editMode">
                <textarea
                    v-model="description"
                    class="strategy-description"
                    maxlength="200"
                    wrap="hard"
                    placeholder="Describe how this label should be used..."
                ></textarea>
            </div>
            <div v-else>
                <span>{{ description }}</span>
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
            <div v-if="editMode">
                <button
                    class="btn btn-success btn-block btn-asl"
                    :disabled="!hasLabelDescription"
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
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import LabelTreeLabel from '@/label-trees/components/labelTreeLabel.vue';
import { handleErrorResponse } from '@/core/messages/store.js';
import { resizeImage } from './resizeImage.js';
import LoaderMixin from '@/core/mixins/loader.vue';
export default {
    mixins: [LoaderMixin],
    emits: ['edit-label', 'add-label', 'delete-label'],
    components: {
        labelTrees: LabelTrees,
        labelTreeLabel: LabelTreeLabel,
        annotationStrategyLabelImage: AnnotationStrategyLabelImage,
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
        labelTrees: {
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
        hasLabelDescription() {
            return !isNaN(this.labelId) && this.description.length !== 0;
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
            this.shape = this.annotationStrategyLabel.shape;
            this.description = this.annotationStrategyLabel.description;
            this.referenceImage = this.annotationStrategyLabel.reference_image;
        },
        addAnnotationStrategyLabel() {
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

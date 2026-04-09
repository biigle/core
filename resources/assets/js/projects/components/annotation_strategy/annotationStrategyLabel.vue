<template>
        <div class="col-xs-3">
            <label-trees
                :trees="labelTrees"
                @select="selectLabel"
                @deselect="deselectLabel"
                >
            </label-trees>
        </div>
        <div v-if="label.id" class="col-xs-3">
            <div v-if="isAdmin" :class="{ 'has-error': missingDescription }">
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
                <span v-if="hasDescription" class="strategy-description-text">{{ description }}</span>
            </div>
        </div>
        <div v-if="label.id" class="col-xs-2">
            <div v-if="isAdmin">
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
                <span v-if="shape">
                    <span class="btn control-button"
                        ><i
                            :class="`icon icon-white icon-${availableShapes[shape].toLowerCase()}`"
                        ></i
                    ></span>
                    <span>{{ availableShapes[shape] }}</span>
                </span>
                <span v-else>
                    No preferred shape
                </span>
            </div>
        </div>
        <div v-if="label.id" class="col-xs-3">
            <annotation-strategy-label-image
                :base-url="baseUrl"
                :label-id="labelId"
                :project-id="projectId"
                :temporary-image="temporaryReferenceImage"
                :is-admin="isAdmin"
                @reset-reference-image="resetReferenceImage"
                @add-image="addImage"
            ></annotation-strategy-label-image>
            <span v-if="imageError" class="has-error">Image dimensions are invalid. Please select a different image</span>
        </div>
        <div v-if="isAdmin && label.id" class="col-xs-1">
            <div :class="{ 'has-error': remindToSave }">
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
        </div>
</template>
<script>
import AnnotationStrategyLabelImage from './annotationStrategyLabelImage.vue';
import AnnotationStrategyLabelApi from '@/projects/api/annotationStrategyLabel.js';
import { handleErrorResponse } from '@/core/messages/store.js';
import { resizeImage } from './resizeImage.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import LabelTrees from '@/label-trees/components/labelTrees.vue';

export default {
    mixins: [LoaderMixin],
    emits: ['add-label', 'delete-label'],
    components: {
        annotationStrategyLabelImage: AnnotationStrategyLabelImage,
        labelTrees: LabelTrees,
    },
    props: {
        annotationStrategyLabels: {
            type: Array,
            default: () => [],
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
            required: true,
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
        hasDescription() {
            return this.description.length !== 0;
        },
        editMode() {
            return this.editing || this.creating;
        },
        currentAnnotationStrategyLabel() {
            let asl = {
                label: this.label
            };
            if (this.label && this.annotationStrategyLabels.filter((asl) => asl.label.id == this.label.id)[0]) {
                asl = this.annotationStrategyLabels.filter((asl) => asl.label.id == this.label.id)[0]
            }
            return asl
        },

    },
    watch: {
        currentAnnotationStrategyLabel: function(asl) {
            this.label = asl.label;
            //casting null to undefined
            this.shape = asl.shape ?? undefined;
            this.description = asl.description;
            this.referenceImage = asl.reference_image;
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
            imageError: false,
        };
    },
    methods: {
        selectLabel(label) {
            this.label = label;
        },
        deselectLabel() {
            this.label = {};
        },
        addAnnotationStrategyLabel() {
            if (!this.hasDescription) {
                this.missingDescription = !this.hasDescription;
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
            this.$emit('delete-label', this.label.id);
            this.deselectLabel();
        },
        addImage(file) {
            this.startLoading();
            resizeImage(file)
                .then((image) => this.setImage(image), this.setImageWarning)
                .catch(console.log)
                .finally(this.finishLoading);
        },
        setImageWarning() {
            debugger;
            this.imageError = true;
        },
        setImage(image) {
            this.referenceImage = image;
            this.imageError = false;
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

<template>
    <h4>Reference Image</h4>
    <div v-if="displayImage">
        <img
            :src="getImageUrl"
            class="reference-image"
        />
        <span v-if="isAdmin && editable">
            <button
                class="btn btn-danger"
                @click="deleteImage"
                title="Remove this image"
            >
                <span class="fa fa-times"></span>
            </button>
        </span>
    </div>
    <div v-else>
        <span>No reference image was provided</span>
        <div v-if="isAdmin && editable">
            <label>Select a reference image</label>
            <input
                type="file"
                name="referenceImage"
                @change="addImage"
                required
            />
        </div>
    </div>
</template>
<script>
import Messages from '@/core/messages/store.js';
export default {
    emits: ['reset-reference-image', 'add-image'],
    props: {
        baseUrl: {
            type: String,
            required: true,
        },
        labelId: {
            type: Number,
            required: true,
        },
        projectId: {
            type: Number,
            required: true,
        },
        editable: {
            type: Boolean,
            default: false,
        },
        temporaryImage: {
            type: [String, Boolean],
            default: false,
        },
        isAdmin: {
            type: Boolean,
            required: true,
        },
        refreshCount: {
            type: Number,
            default: 0,
        },
        displayImage: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        getImageUrl() {
            if (this.labelId > 0) {
                return this.temporaryImage
                    ? this.temporaryImage
                    : this.baseUrl + '/' + this.labelId + '.jpg?v=' + this.refreshCount;
            }
            return '';
        },
    },
    methods: {
        deleteImage() {
            let response = prompt(
                `This will delete the image for this label. Please enter 'delete' to confirm.`,
            );
            if (response !== 'delete') {
                return;
            }
            this.emitResetReferenceImage();
        },
        emitResetReferenceImage() {
            this.$emit('reset-reference-image');
        },
        addImage(event) {
            if (event.target.files.length > 1) {
                Messages.warning('Please select only one file');
                return;
            }
            let file = event.target.files[0];
            this.$emit('add-image', file);
        },
    },
};
</script>

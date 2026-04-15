<template>
    <h4>Reference Image</h4>
    <div v-if="displayImage">
        <img
            :src="getImageUrl"
            @error="displayText"
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
            <label>Select a reference image (max 5 MB)</label>
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
    },
    computed: {
        hasFilename() {
            return (
                this.displayImage &&
                this.referenceImage &&
                this.referenceImage.length > 0
            );
        },
        getImageUrl() {
            if (this.labelId > 0) {
                return this.temporaryImage
                    ? this.temporaryImage
                    : this.baseUrl + '/' + this.labelId + '.jpg?v=' + this.refresh;
            }
            return '';
        },
    },
    data() {
        return {
            displayImage: true,
            refresh: 0,
        };
    },
    watch: {
        temporaryImage: "attemptDisplayImage",
        labelId: "attemptDisplayImage",
    },
    methods: {
        displayText() {
            this.displayImage = false;
        },
        deleteImage() {
            let response = prompt(
                `This will delete the image for this label. Please enter 'delete' to confirm.`,
            );
            if (response !== 'delete') {
                return;
            }
            this.displayText();
            this.emitResetReferenceImage();
        },
        emitResetReferenceImage() {
            this.$emit('reset-reference-image');
        },
        attemptDisplayImage() {
            this.displayImage = true;
        },
        forceRefresh() {
            this.refresh += 1;
        },
        addImage(event) {
            if (event.target.files.length > 1) {
                Messages.warning('Please select only one file');
                return;
            }
            let file = event.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                Messages.warning('The file is too big');
                return;
            }
            this.$emit('add-image', file);
            setTimeout(() => this.attemptDisplayImage(), 250);
        },
    },
};
</script>

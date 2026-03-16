<template>
    <div class="row center-container">
        <div v-if="hasFilename">
            <img
                :src="getImageUrl()"
                @error="displayText"
                class="reference-image"
            />
            <div v-if="editable">
                <button
                    class="btn btn-default"
                    @click="deleteImage(labelId)"
                    title="Remove this image"
                >
                    <span class="fa fa-times"></span>
                </button>
            </div>
        </div>
        <div v-else>
            <span>No reference image selected</span>
            <div v-if="editable">
                <label>Select a reference image (max 5 MB)</label>
                <input
                    type="file"
                    name="referenceImage"
                    @change="uploadReferenceImage"
                    required
                />
            </div>
        </div>
    </div>
</template>
<script>
import LoaderMixin from '@/core/mixins/loader.vue';

export default {
    mixins: [LoaderMixin],
    emits: ['set-reference-image', 'reset-reference-image', 'upload-image'],
    props: {
        baseUrl: {
            type: String,
            required: true,
        },
        referenceImage: {
            type: String,
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
    },
    computed: {
        hasFilename() {
            return (
                this.displayImage &&
                this.referenceImage &&
                this.referenceImage.length > 0
            );
        },
    },
    data() {
        return {
            displayImage: true,
        };
    },
    methods: {
        getImageUrl() {
            return this.baseUrl + '/' + this.referenceImage;
        },
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
        uploadReferenceImage(event) {
            this.startLoading();
            if (event.target.files.length > 1) {
                alert('Please select only one file');
                this.finishLoading();
                return;
            }
            if (event.target.files[0].size > 5 * 1024 * 1024) {
                alert('The file is too big');
                this.finishLoading();
                return;
            }
            const formData = new FormData();
            formData.append('file', event.target.files[0]);
            this.$emit('upload-image', formData);
            this.attemptDisplayImage();
        },
    },
};
</script>

<template>
    <div class="row center-container">
        <div v-if="displayImage">
            <img
                :src="getImageUrl"
                @error="displayText"
                class="reference-image"
            />
            <div v-if="editable && isAdmin" class="center-container">
                <button
                    class="btn btn-danger btn-asl"
                    @click="deleteImage"
                    title="Remove this image"
                >
                    <span class="fa fa-times"></span>
                </button>
            </div>
        </div>
        <div v-else>
            <span>No reference image selected</span>
            <div v-if="editable && isAdmin">
                <label>Select a reference image (max 5 MB)</label>
                <input
                    type="file"
                    name="referenceImage"
                    @change="addImage"
                    required
                />
            </div>
        </div>
    </div>
</template>
<script>
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
            if (isNaN(this.labelId)) {
                return '';
            }
            return this.temporaryImage
                ? this.temporaryImage
                : this.baseUrl + '/' + this.labelId;
        },
    },
    data() {
        return {
            displayImage: true,
        };
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
        addImage(event) {
            if (event.target.files.length > 1) {
                alert('Please select only one file');
                return;
            }
            let file = event.target.files[0];

            if (file.size > 5 * 1024 * 1024) {
                alert('The file is too big');
                return;
            }

            this.$emit('add-image', file);
            setTimeout(() => this.attemptDisplayImage(), 250);
        },
    },
};
</script>

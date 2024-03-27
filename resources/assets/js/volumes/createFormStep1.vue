<script>
import LoaderMixin from '../core/mixins/loader';

export const MEDIA_TYPE = {
    IMAGE: 'image',
    VIDEO: 'video',
};

export default {
    mixins: [LoaderMixin],
    data() {
        return {
            mediaType: MEDIA_TYPE.IMAGE,
            hasFile: false,
            initialized: false,
        };
    },
    computed: {
        isImageMediaType() {
            return this.mediaType === MEDIA_TYPE.IMAGE;
        },
        isVideoMediaType() {
            return this.mediaType === MEDIA_TYPE.VIDEO;
        },
        imageTypeButtonClass() {
            return {
                active: this.isImageMediaType,
                'btn-info': this.isImageMediaType,
            };
        },
        videoTypeButtonClass() {
            return {
                active: this.isVideoMediaType,
                'btn-info': this.isVideoMediaType,
            };
        },
        fileButtonClass() {
            return {
                active: this.hasFile,
                'btn-info': this.hasFile,
            };
        },
    },
    methods: {
        selectImageMediaType() {
            this.mediaType = MEDIA_TYPE.IMAGE;
        },
        selectVideoMediaType() {
            this.mediaType = MEDIA_TYPE.VIDEO;
        },
        selectFile() {
            this.$refs.metadataFileField.click();
        },
        handleSelectedFile() {
            this.hasFile = this.$refs.metadataFileField.files.length > 0;
        },
    },
    created() {
        this.mediaType = biigle.$require('volumes.mediaType');
        // Used to hide a dummy button that masks a flashing selected state on load.
        this.initialized = true;
    },
};
</script>

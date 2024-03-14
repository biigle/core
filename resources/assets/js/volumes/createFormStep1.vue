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
                'btn-default': !this.isImageMediaType,
                active: this.isImageMediaType,
                'btn-info': this.isImageMediaType,
            };
        },
        videoTypeButtonClass() {
            return {
                'btn-default': !this.isVideoMediaType,
                active: this.isVideoMediaType,
                'btn-info': this.isVideoMediaType,
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
    },
    created() {
        this.mediaType = biigle.$require('volumes.mediaType');
    },
};
</script>

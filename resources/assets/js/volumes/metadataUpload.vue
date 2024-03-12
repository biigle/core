<script>
import Dropdown from 'uiv/dist/Dropdown';
import LoaderMixin from '../core/mixins/loader';
import MetadataApi from './api/volumeMetadata';
import MessageStore from '../core/messages/store';

/**
 * The metadata upload of the volume edit page.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        dropdown: Dropdown,
    },
    data() {
        return {
            volumeId: null,
            error: false,
            success: false,
            message: undefined,
            hasMetadata: false,
        };
    },
    computed: {
        //
    },
    methods: {
        handleSuccess() {
            this.error = false;
            this.success = true;
        },
        handleError(response) {
            this.success = false;
            let knownError = response.body.errors && response.body.errors.file;
            if (knownError) {
                if (Array.isArray(knownError)) {
                    this.error = knownError[0];
                } else {
                    this.error = knownError;
                }
            } else {
                this.handleErrorResponse(response);
            }
        },
        submitFile() {
            this.$refs.fileInput.click();
        },
        handleFile(event) {
            this.startLoading();
            let data = new FormData();
            data.append('file', event.target.files[0]);
            MetadataApi.save({id: this.volumeId}, data)
                .then(() => this.hasMetadata = true)
                .then(this.handleSuccess)
                .catch(this.handleError)
                .finally(this.finishLoading);
        },
        deleteFile() {
            this.startLoading();
            MetadataApi.delete({id: this.volumeId})
                .then(this.handleFileDeleted, this.handleErrorResponse)
                .finally(this.finishLoading);
        },
        handleFileDeleted() {
            this.hasMetadata = false;
            MessageStore.success('The metadata file was deleted.');
        },
    },
    created() {
        this.volumeId = biigle.$require('volumes.id');
        this.hasMetadata = biigle.$require('volumes.hasMetadata');
    },
};
</script>

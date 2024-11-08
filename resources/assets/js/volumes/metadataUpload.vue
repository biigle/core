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
            hasMetadataAnnotations: false,
            hasMetadataFileLabels: false,
            parsers: [],
            selectedParser: null,
            importForm: {
                importAnnotations: 0,
                importFileLabels: 0,
            },
        };
    },
    computed: {
        showImportDropdown() {
            return this.hasMetadataAnnotations && this.hasMetadataFileLabels;
        },
        showImportAnnotations() {
            return this.hasMetadataAnnotations && !this.hasMetadataFileLabels;
        },
        showImportFileLabels() {
            return !this.hasMetadataAnnotations && this.hasMetadataFileLabels;
        },
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
        handleFile(event) {
            this.startLoading();
            let data = new FormData();
            data.append('file', event.target.files[0]);
            data.append('parser', this.selectedParser.parserClass);
            MetadataApi.save({id: this.volumeId}, data)
                .then((response) => {
                    this.hasMetadata = true
                    this.hasMetadataAnnotations = response.body.has_annotations;
                    this.hasMetadataFileLabels = response.body.has_file_labels;
                })
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
            this.hasMetadataAnnotations = false;
            this.hasMetadataFileLabels = false;
            MessageStore.success('The metadata file was deleted.');
        },
        selectFile(parser) {
            this.selectedParser = parser;
            // Use $nextTick so the input element will have the appropriate MIME type
            // filter from the selected parser.
            this.$nextTick(() => this.$refs.fileInput.click());
        },
        importAnnotations() {
            this.importForm.importAnnotations = 1;
            this.importForm.importFileLabels = 0;
            this.$nextTick(() => this.$refs.importForm.submit());
        },
        importFileLabels() {
            this.importForm.importAnnotations = 0;
            this.importForm.importFileLabels = 1;
            this.$nextTick(() => this.$refs.importForm.submit());
        },
    },
    created() {
        this.volumeId = biigle.$require('volumes.id');
        this.hasMetadata = biigle.$require('volumes.hasMetadata');
        this.hasMetadataAnnotations = biigle.$require('volumes.hasMetadataAnnotations');
        this.hasMetadataFileLabels = biigle.$require('volumes.hasMetadataFileLabels');
        this.parsers = biigle.$require('volumes.parsers');
    },
};
</script>

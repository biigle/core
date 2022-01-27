<script>
import LoaderMixin from '../core/mixins/loader';
import MetadataApi from './api/volumeImageMetadata';
import ParseIfdoFileApi from './api/parseIfdoFile';
import Tab from 'uiv/dist/Tab';
import Tabs from 'uiv/dist/Tabs';
import {handleErrorResponse} from '../core/messages/store';

/**
 * The metadata upload of the volume edit page.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        tabs: Tabs,
        tab: Tab,
    },
    data() {
        return {
            volumeId: null,
            error: false,
            success: false,
            message: undefined,
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
            let knownError = response.body.errors.metadata || response.body.errors.ifdo_file;
            if (knownError) {
                if (Array.isArray(knownError)) {
                    this.error = knownError[0];
                } else {
                    this.error = knownError;
                }
            } else {
                handleErrorResponse(response);
            }
        },
        submitCsv() {
            this.$refs.csvInput.click();
        },
        uploadCsv(event) {
            this.startLoading();
            let data = new FormData();
            data.append('metadata_csv', event.target.files[0]);
            this.upload(data).finally(this.finishLoading);
        },
        submitIfdo() {
            this.$refs.ifdoInput.click();
        },
        prepareIfdo(event) {
            this.startLoading();
            let data = new FormData();
            data.append('file', event.target.files[0]);
            ParseIfdoFileApi.save(data)
                .then(this.uploadIfdo, handleErrorResponse)
                .finally(this.finishLoading);
        },
        uploadIfdo(response) {
            let ifdo = response.body;
            let data = new FormData();
            data.append('ifdo_file', this.$refs.ifdoInput.files[0]);
            data.append('metadata_text', ifdo.files.map(row => row.join(',')).join("\n"));

            return this.upload(data);
        },
        upload(data) {
            return MetadataApi.save({id: this.volumeId}, data)
                .then(this.handleSuccess, this.handleError);
        },
    },
    created() {
        this.volumeId = biigle.$require('volumes.id');
    },
};
</script>

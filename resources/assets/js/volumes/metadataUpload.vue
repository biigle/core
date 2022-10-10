<script>
import Dropdown from 'uiv/dist/Dropdown';
import LoaderMixin from '../core/mixins/loader';
import MetadataApi from './api/volumeMetadata';
import ParseIfdoFileApi from './api/parseIfdoFile';
import VolumeIfdoApi from './api/volumeIfdo';
import Tab from 'uiv/dist/Tab';
import Tabs from 'uiv/dist/Tabs';
import MessageStore from '../core/messages/store';

/**
 * The metadata upload of the volume edit page.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        tabs: Tabs,
        tab: Tab,
        dropdown: Dropdown,
    },
    data() {
        return {
            volumeId: null,
            error: false,
            success: false,
            message: undefined,
            hasIfdo: false,
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
            let knownError = response.body.errors.metadata || response.body.errors.ifdo_file || response.body.errors.file;
            if (knownError) {
                if (Array.isArray(knownError)) {
                    this.error = knownError[0];
                } else {
                    this.error = knownError;
                }
            } else {
                MessageStore.handleErrorResponse(response);
            }
        },
        submitCsv() {
            this.$refs.csvInput.click();
        },
        uploadCsv(event) {
            this.startLoading();
            let data = new FormData();
            data.append('metadata_csv', event.target.files[0]);
            this.upload(data)
                .then(this.handleSuccess, this.handleError)
                .finally(this.finishLoading);
        },
        submitIfdo() {
            this.$refs.ifdoInput.click();
        },
        handleIfdo(event) {
            this.startLoading();
            let data = new FormData();
            data.append('file', event.target.files[0]);
            ParseIfdoFileApi.save(data)
                .then(this.uploadIfdo)
                .then(() => this.hasIfdo = true)
                .then(this.handleSuccess)
                .catch(this.handleError)
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
            return MetadataApi.save({id: this.volumeId}, data);
        },
        deleteIfdo() {
            this.startLoading();
            VolumeIfdoApi.delete({id: this.volumeId})
                .then(this.handleIfdoDeleted, MessageStore.handleErrorResponse)
                .finally(this.finishLoading);
        },
        handleIfdoDeleted() {
            this.hasIfdo = false;
            MessageStore.success('The iFDO file was deleted.');
        },
    },
    created() {
        this.volumeId = biigle.$require('volumes.id');
        this.hasIfdo = biigle.$require('volumes.hasIfdo');
    },
};
</script>

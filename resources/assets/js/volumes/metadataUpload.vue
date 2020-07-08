<script>
import LoaderMixin from '../core/mixins/loader';
import MetadataApi from './api/volumeImageMetadata';
import {handleErrorResponse} from '../core/messages/store';

/**
 * The metadata upload of the volume edit page.
 */
export default {
    mixins: [LoaderMixin],
    data() {
        return {
            volumeId: null,
            csv: undefined,
            error: false,
            success: false,
            message: undefined,
        };
    },
    methods: {
        handleSuccess() {
            this.error = false;
            this.success = true;
        },
        handleError(response) {
            this.success = false;
            if (response.data.file) {
                if (Array.isArray(response.data.file)) {
                    this.error = response.data.file[0];
                } else {
                    this.error = response.data.file;
                }
            } else {
                handleErrorResponse(response);
            }
        },
        submit() {
            if (!this.csv) return;

            this.startLoading();
            let data = new FormData();
            data.append('file', this.csv);
            MetadataApi.save({id: this.volumeId}, data)
                .bind(this)
                .then(this.handleSuccess, this.handleError)
                .finally(this.finishLoading);
        },
        setCsv(event) {
            this.csv = event.target.files[0];
        }
    },
    created() {
        this.volumeId = biigle.$require('volumes.id');
    },
};
</script>

<script>
import LoaderMixin from '../core/mixins/loader';
import Messages from '../core/messages/store';
import metadataModal from './components/metadataModal';

/**
 * The video container for metadata.
 */
export default {
    mixins: [
        LoaderMixin,
    ],
    components: {
        metadataModal: metadataModal,
    },
    data() {
        return {
            showModal: false,
            times: [],
            items: [],
            name: "",
        };
    },
    methods: {
        getTimes(values) {
            // If modal has been opened before, use cached data
            if (this.times.length === 0) {
                let dateStrings = [];
                const options = { year: "numeric", month: "numeric", day: "numeric", hour: '2-digit', minute:'2-digit', second:'2-digit'}
                values.forEach(element => {
                    dateStrings.push(new Date(element).toLocaleDateString(undefined, options));
                });
                this.times = dateStrings;
            }
        },
        showTimes() {
            if (this.times.length === 0)
                this.handleError("No times data found.");
            this.name = "Times";
            this.showModal = true;
        },
        getMetadata(key, data) {
            this.name = key;
            this.items = data;
            this.showModal = true;
        },
        hideMetadataModal() {
            // reset items for next metadata
            this.items = [];
            this.showModal = false;
        },
        handleError(message) {
            Messages.danger(message);
        },
    },
};
</script>

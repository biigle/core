<script>
import LoaderMixin from '../core/mixins/loader.vue';
import Messages from '../core/messages/store.js';
import metadataModal from './components/metadataModal.vue';

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
            metadata: null,
            metadataMap: {},
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
        showMetadata(field) {
            this.name = this.metadataMap[field];
            this.items = this.metadata[field];
            this.showModal = true;
        },
        hideMetadataModal() {
            this.showModal = false;
        },
        handleError(message) {
            Messages.danger(message);
        },
    },
    created() {
        this.getTimes(biigle.$require('videos.times'));
        this.metadata = biigle.$require('videos.metadata');
        this.metadataMap = biigle.$require('videos.metadataMap');
    }
};
</script>

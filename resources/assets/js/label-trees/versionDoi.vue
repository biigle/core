<script>
import LabelTreeVersionApi from '@/core/api/labelTreeVersion.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import {handleErrorResponse} from '@/core/messages/store.vue';

/**
 * The panel for editing the information of a label tree version
 */
export default {
    mixins: [LoaderMixin],
    data() {
        return {
            doi: '',
            doiSaved: false,
            version: null,
        };
    },
    computed: {
        doiUrl() {
            return 'https://doi.org/' + this.doi;
        },
        doiTitle() {
            return 'DOI: ' + this.doi;
        },
    },
    methods: {
        cleanDoi(doi) {
            return doi.replace(/^https?:\/\/doi\.org\//, '');
        },
        saveDoi() {
            this.doi = this.cleanDoi(this.doi);
            LabelTreeVersionApi.update({id: this.version.id}, {doi: this.doi})
                .then(this.handleDoiSaved, handleErrorResponse);
        },
        handleDoiSaved() {
            this.doiSaved = true;
        },
    },
    created() {
        this.version = biigle.$require('labelTrees.version');
    },
};
</script>

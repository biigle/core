<script>
import LabelFormComponent from '../mixins/labelFormComponent.vue';
import LabelSourceApi from '@/core/api/labelSource.js';
import WormsResultItem from './wormsResultItem.vue';
import {handleErrorResponse} from '@/core/messages/store.vue';

/**
 * A component for a form to manually create a new label for a label tree
 *
 * @type {Object}
 */
export default {
    mixins: [LabelFormComponent],
    components: {
        wormsResultItem: WormsResultItem,
    },
    data() {
        return {
            results: [],
            recursive: false,
            hasSearched: false,
            unaccepted: false,
            worms: null,
        };
    },
    computed: {
        hasResults() {
            return this.results.length > 0;
        },
        recursiveButtonClass() {
            return {
                active: this.recursive,
                'btn-info': this.recursive,
            };
        },
        unacceptedButtonClass() {
            return {
                active: this.unaccepted,
                'btn-info': this.unaccepted,
            };
        },
    },
    methods: {
        findName() {
            this.$emit('load-start');

            let query = {id: this.worms.id, query: this.selectedName};

            if (this.unaccepted) {
                query.unaccepted = 'true';
            }

            LabelSourceApi.query(query)
                .then(this.updateResults, handleErrorResponse)
                .finally(() => {
                    this.hasSearched = true;
                    this.$emit('load-finish');
                });
        },
        updateResults(response) {
            this.results = response.data;
        },
        importItem(item) {
            let label = {
                name: item.name,
                color: this.selectedColor,
                source_id: item.aphia_id,
                label_source_id: this.worms.id,
            };

            if (this.recursive) {
                label.recursive = 'true';
            } else if (this.parent) {
                label.parent_id = this.parent.id;
            }

            this.$emit('submit', label);
        },
        toggleRecursive() {
            this.recursive = !this.recursive;
        },
        toggleUnaccepted() {
            this.unaccepted = !this.unaccepted;
        },
    },
    created() {
        this.worms = biigle.$require('labelTrees.wormsLabelSource');
    },
};
</script>

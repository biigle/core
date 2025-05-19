<script>
import Typeahead from '@/core/components/typeahead.vue';

/**
 * The merge label trees index view.
 */
export default {
    components: {
        typeahead: Typeahead,
    },
    data() {
        return {
            mergeUrlTemplate: null,
            mergeCandidates: [],
            chosenCandidate: null,
        };
    },
    computed: {
        cannotContinue() {
            return this.chosenCandidate === null;
        },
        continueUrl() {
            if (this.chosenCandidate) {
                return this.mergeUrlTemplate.replace(':id', this.chosenCandidate.id);
            }

            return '';
        },
    },
    methods: {
        parseLabelTreeVersionedName(tree) {
            if (tree.version) {
                tree.name = tree.name + ' @ ' + tree.version.name;
            }

            return tree;
        },
        chooseCandidate(tree) {
            this.chosenCandidate = tree;
        },
    },
    created() {
        this.mergeUrlTemplate = biigle.$require('labelTrees.mergeUrlTemplate');
        this.mergeCandidates = biigle.$require('labelTrees.mergeCandidates')
            .map(this.parseLabelTreeVersionedName);
    },
};
</script>

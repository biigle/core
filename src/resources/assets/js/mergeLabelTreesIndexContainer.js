/**
 * The merge label trees index view.
 */
biigle.$viewModel('merge-label-trees-index-container', function (element) {
    var mergeUrlTemplate = biigle.$require('labelTrees.mergeUrlTemplate');
    new Vue({
        el: element,
        components: {
            typeahead: biigle.$require('core.components.typeahead'),
        },
        data: {
            mergeCandidates: [],
            typeaheadTemplate: '<span v-text="item.name"></span><br><small v-text="item.description"></small>',
            chosenCandidate: null,
        },
        computed: {
            cannotContinue() {
                return this.chosenCandidate === null;
            },
            continueUrl() {
                if (this.chosenCandidate) {
                    return mergeUrlTemplate.replace(':id', this.chosenCandidate.id);
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
            this.mergeCandidates = biigle.$require('labelTrees.mergeCandidates')
                .map(this.parseLabelTreeVersionedName);
        },
    });
});

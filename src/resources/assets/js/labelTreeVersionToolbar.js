/**
 * The panel for editing the information of a label tree version
 */
biigle.$viewModel('label-tree-version-toolbar', function (element) {
    var messages = biigle.$require('messages.store');
    var version = biigle.$require('labelTrees.version');
    var labelTreeVersionApi = biigle.$require('api.labelTreeVersion');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        data: {
            doi: '',
            doiSaved: false,
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
                return doi.replace(/^https?\:\/\/doi\.org\//, '');
            },
            saveDoi() {
                this.doi = this.cleanDoi(this.doi);
                labelTreeVersionApi.update({id: version.id}, {doi: this.doi})
                    .then(this.handleDoiSaved, messages.handleErrorResponse);
            },
            handleDoiSaved() {
                this.doiSaved = true;
            },
        }
    });
});

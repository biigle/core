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
            doiUrl: function () {
                return 'https://doi.org/' + this.doi;
            },
            doiTitle: function () {
                return 'DOI: ' + this.doi;
            },
        },
        methods: {
            cleanDoi: function (doi) {
                return doi.replace(/^https?\:\/\/doi\.org\//, '');
            },
            saveDoi: function () {
                this.doi = this.cleanDoi(this.doi);
                labelTreeVersionApi.update({id: version.id}, {doi: this.doi})
                    .then(this.handleDoiSaved, messages.handleErrorResponse);
            },
            handleDoiSaved: function () {
                this.doiSaved = true;
            },
        }
    });
});

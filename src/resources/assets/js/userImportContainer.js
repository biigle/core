/**
 * View model for the user import container
 */
biigle.$viewModel('user-import-container', function (element) {
    var messages = biigle.$require('messages.store');
    var importApi = biigle.$require('sync.api.import');
    var importToken = biigle.$require('sync.importToken');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            entityChooser: biigle.$require('sync.components.entityChooser'),
        },
        data: {
            importCandidates: biigle.$require('sync.importCandidates'),
            chosenCandidates: [],
            success: false,
        },
        computed: {
            users: function () {
                return this.importCandidates.map(function (user) {
                    user.name = user.firstname + ' ' + user.lastname;
                    if (user.email) {
                        user.description = user.email;
                    }

                    return user;
                });
            },
            hasNoChosenUsers: function () {
                return this.chosenCandidates.length === 0;
            },
            chosenCandidateIds: function () {
                return this.chosenCandidates.map(function (user) {
                    return user.id;
                });
            },
        },
        methods: {
            handleChosenUsers: function (users) {
                this.chosenCandidates = users;
            },
            performImport: function () {
                this.startLoading();
                var payload = {};
                if (this.chosenCandidates.length < this.importCandidates.length) {
                    payload.only = this.chosenCandidateIds;
                }
                importApi.update({token: importToken}, payload)
                    .then(this.importSuccess, messages.handleErrorResponse)
                    .finally(this.finishLoading);
            },
            importSuccess: function () {
                this.success = true;
            },
        },
        watch: {
            //
        },
        created: function () {
            //
        },
    });
});

/**
 * View model for the export container
 */
biigle.$viewModel('export-container', function (element) {
    var messages = biigle.$require('messages.store');

    // Elements in these arrays must have the same ordering than the tabs in the view.
    var fetchEntitiesApi = [
        biigle.$require('api.volumes'),
        biigle.$require('api.labelTree'),
        biigle.$require('api.users'),
    ];

    var exportApiUrl = biigle.$require('sync.exportApiUrl');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            tabs: VueStrap.tabs,
            tab: VueStrap.tab,
            entityChooser: biigle.$require('sync.components.entityChooser'),
        },
        data: {
            entities: [[], [], []],
            chosenEntities: [[], [], []],
            currentTab: 0,
        },
        computed: {
            volumes: function () {
                return this.entities[0];
            },
            labelTrees: function () {
                return this.entities[1];
            },
            users: function () {
                return this.entities[2].map(function (user) {
                    user.name = user.firstname + ' ' + user.lastname;
                    if (user.email) {
                        user.description = user.email;
                    }

                    return user;
                });
            },
            hasChosenVolumes: function () {
                return this.chosenEntities[0].length > 0;
            },
            hasChosenLabelTrees: function () {
                return this.chosenEntities[1].length > 0;
            },
            hasChosenUsers: function () {
                return this.chosenEntities[2].length > 0;
            },
            volumeRequestUrl: function () {
                return exportApiUrl + '/volumes';
            },
            labelTreeRequestUrl: function () {
                return exportApiUrl + '/label-trees';
            },
            userRequestUrl: function () {
                return exportApiUrl + '/users';
            },
        },
        methods: {
            handleSwitchedTab: function (index) {
                this.currentTab = index;
            },
            fetchEntities: function (index) {
                if (this.entities[index].length === 0) {
                    this.startLoading();
                    fetchEntitiesApi[index].get().bind(this)
                        .then(function (response) {
                            Vue.set(this.entities, index, response.data);
                        }, messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            setEntities: function (response) {
                this.entities = response.body;
            },
            handleChosenVolumes: function (volumes) {
                Vue.set(this.chosenEntities, 0, volumes);
            },
            handleChosenLabelTrees: function (labelTrees) {
                Vue.set(this.chosenEntities, 1, labelTrees);
            },
            handleChosenUsers: function (users) {
                Vue.set(this.chosenEntities, 2, users);
            },
        },
        watch: {
            currentTab: function (index) {
                this.fetchEntities(index);
            },
        },
        created: function () {
            this.fetchEntities(this.currentTab);
        },
    });
});

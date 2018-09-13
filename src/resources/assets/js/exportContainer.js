/**
 * View model for the export container
 */
biigle.$viewModel('export-container', function (element) {
    var messages = biigle.$require('messages.store');

    // Elements in these arrays must have the same ordering than the tabs in the view.
    var fetchEntitiesApi = {
        volumes: biigle.$require('api.volumes'),
        labelTrees: biigle.$require('api.labelTree'),
        users: biigle.$require('api.users'),
    };

    var exportApiUrl = biigle.$require('sync.exportApiUrl');
    var allowedExports = biigle.$require('sync.allowedExports');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            tabs: VueStrap.tabs,
            tab: VueStrap.tab,
            entityChooser: biigle.$require('sync.components.entityChooser'),
        },
        data: {
            entities: {
                volumes: [],
                labelTrees: [],
                users: [],
            },
            chosenEntities: {
                volumes: [],
                labelTrees: [],
                users: [],
            },
            currentTab: 0,
        },
        computed: {
            indexMap: function () {
                // Do it like this because the ordering in allowedExports may be
                // arbitrary but the ordering in indexMap must match the tabs in the
                // view.
                return ['volumes', 'labelTrees', 'users'].filter(function (item) {
                    return allowedExports.indexOf(item) !== -1;
                });
            },
            volumes: function () {
                return this.entities.volumes.map(function (volume) {
                    volume.description = volume.projects
                        .map(function (project) {
                            return project.name;
                        })
                        .join(', ');

                    return volume;
                });
            },
            labelTrees: function () {
                return this.entities.labelTrees;
            },
            users: function () {
                return this.entities.users.map(function (user) {
                    user.name = user.firstname + ' ' + user.lastname;
                    if (user.email) {
                        user.description = user.email;
                    }

                    return user;
                });
            },
            hasNoChosenVolumes: function () {
                return this.chosenEntities.volumes.length === 0;
            },
            hasNoChosenLabelTrees: function () {
                return this.chosenEntities.labelTrees.length === 0;
            },
            hasNoChosenUsers: function () {
                return this.chosenEntities.users.length === 0;
            },
            volumeRequestUrl: function () {
                return exportApiUrl + '/volumes' + this.getQueryString('volumes');
            },
            labelTreeRequestUrl: function () {
                return exportApiUrl + '/label-trees' + this.getQueryString('labelTrees');
            },
            userRequestUrl: function () {
                return exportApiUrl + '/users' + this.getQueryString('users');
            },
        },
        methods: {
            handleSwitchedTab: function (index) {
                this.currentTab = index;
            },
            fetchEntities: function (name) {
                if (this.entities[name].length === 0) {
                    this.startLoading();
                    fetchEntitiesApi[name].get().bind(this)
                        .then(function (response) {
                            this.entities[name] = response.data;
                        }, messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            handleChosenVolumes: function (volumes) {
                this.chosenEntities.volumes = volumes;
            },
            handleChosenLabelTrees: function (labelTrees) {
                this.chosenEntities.labelTrees = labelTrees;
            },
            handleChosenUsers: function (users) {
                this.chosenEntities.users = users;
            },
            getQueryString: function (name) {
                var entities = this.entities[name];
                var chosenEntities = this.chosenEntities[name];

                if ((entities.length / 2) > chosenEntities.length) {
                    return '?only=' + (chosenEntities.map(function (e) {
                            return e.id;
                        }).join(',') || -1);
                } else if (entities.length > chosenEntities.length) {
                    return '?except=' + entities.filter(function (e) {
                            return chosenEntities.indexOf(e) === -1;
                        }).map(function (e) {
                            return e.id;
                        }).join(',');
                }

                return '';
            }
        },
        watch: {
            currentTab: function (index) {
                this.fetchEntities(this.indexMap[index]);
            },
        },
        created: function () {
            this.fetchEntities(this.indexMap[0]);
        },
    });
});

/**
 * The panel for editing annotation sessions
 */
biigle.$viewModel('annotation-session-panel', function (element) {
    var messages = biigle.$require('messages.store');
    var volumesApi = biigle.$require('api.volumes');

    var volumeId = biigle.$require('volumes.id');
    var now = new Date();
    var emptySession = function () {
        return {
            name: null,
            description: null,
            starts_at_iso8601: null,
            ends_at_iso8601: null,
            hide_other_users_annotations: false,
            hide_own_annotations: false,
            users: [],
        };
    };

    var listItem = {
        props: ['session', 'editing', 'editId'],
        computed: {
            title: function () {
                return this.editing ? 'Edit this annotation session' : this.session.name;
            },
            active: function () {
                return this.session.starts_at_iso8601 < now && this.session.ends_at_iso8601 >= now;
            },
            currentlyEdited: function () {
                return this.session.id === this.editId;
            },
            classObject: function () {
                return {
                    'session--active': this.active,
                    'list-group-item-info': this.currentlyEdited,
                };
            },
        },
        methods: {
            edit: function () {
                if (!this.editing || this.currentlyEdited) return;
                this.$emit('edit', this.session);
            },
        },
    };

    var userTag = {
        props: ['user'],
        computed: {
            name: function () {
                return this.user.firstname + ' ' + this.user.lastname;
            },
            title: function () {
                return 'Remove ' + this.name;
            },
        },
        methods: {
            remove: function () {
                this.$emit('remove', this.user);
            },
        },
    };

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
            biigle.$require('core.mixins.editor'),
        ],
        data: {
            sessions: biigle.$require('volumes.annotationSessions'),
            editedSession: emptySession(),
            users: [],
        },
        components: {
            typeahead: biigle.$require('core.components.typeahead'),
            listItem: listItem,
            userTag: userTag,
            datepicker: VueStrap.datepicker,
        },
        computed: {
            classObject: function () {
                return {
                    'panel-warning panel--editing': this.editing,
                };
            },
            hasSessions: function () {
                return this.sessions.length > 0;
            },
            hasNewSession: function () {
                return this.editedSession.id === undefined;
            },
            availableUsers: function () {
                var members = this.editedSession.users.map(function (user) {
                    return user.id;
                });
                var users = [];
                for (var i = this.users.length - 1; i >= 0; i--) {
                    if (members.indexOf(this.users[i].id) === -1) {
                        users.push(this.users[i]);
                    }
                }

                return users;
            },
        },
        methods: {
            submit: function () {
                console.log('submit', JSON.stringify(this.editedSession));
            },
            hasError: function (name) {
                return false;
            },
            getError: function (name) {
                return '';
            },
            editSession: function (session) {
                // lazy way to deep copy the object
                this.editedSession = JSON.parse(JSON.stringify(session));
            },
            deleteSession: function () {
                if (confirm('Are you sure you want to delete the annotation session \'' + this.editedSession.name + '\'?')) {
                    console.log('delete', this.editedSession);
                }
            },
            clearEditedSession: function () {
                this.editedSession = emptySession();
            },
            loadUsers: function () {
                volumesApi.queryUsers({id: volumeId})
                    .then(this.usersLoaded, messages.handleResponseError);
            },
            usersLoaded: function (response) {
                response.data.forEach(function (user) {
                    // Assemble full username that can be used for searching in the
                    // typeahead.
                    user.name = user.firstname + ' ' + user.lastname;
                });
                Vue.set(this, 'users', response.data);
            },
            selectUser: function (user) {
                this.editedSession.users.push(user);
            },
            removeUser: function (user) {
                for (var i = this.editedSession.users.length - 1; i >= 0; i--) {
                    if (this.editedSession.users[i].id === user.id) {
                        this.editedSession.users.splice(i, 1);
                    }
                }
            },
            // convert a date object to yyyy-MM-dd
            stringifyDate: function (d) {
                var month = d.getMonth() + 1;
                month = month < 10 ? '0' + month : month;
                return d.getFullYear() + '-' + month + '-' + d.getDate();
            },
            // convert a yyyy-MM-dd string to a date object
            parseDate: function (s) {
                if (!s) return;
                s = s.split('-');
                return new Date(s[0], s[1] - 1, s[2]);
            },
            setStartsAt: function (date) {
                this.editedSession.starts_at_iso8601 = this.parseDate(date);
                this.editedSession.starts_at = date;
            },
            setEndsAt: function (date) {
                this.editedSession.ends_at_iso8601 = this.parseDate(date);
                this.editedSession.ends_at = date;
            },
        },
        created: function () {
            var date;
            for (var i = this.sessions.length - 1; i >= 0; i--) {
                date = new Date(this.sessions[i].starts_at_iso8601);
                this.sessions[i].starts_at_iso8601 = date;
                this.sessions[i].starts_at = this.stringifyDate(date);

                date = new Date(this.sessions[i].ends_at_iso8601);
                this.sessions[i].ends_at_iso8601 = date;
                this.sessions[i].ends_at = this.stringifyDate(date);
            }
            this.$once('editing.start', this.loadUsers);
        },
    });
});

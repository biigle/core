/**
 * The panel for editing annotation sessions
 */
biigle.$viewModel('annotation-session-panel', function (element) {
    var messages = biigle.$require('messages.store');
    var volumesApi = biigle.$require('api.volumes');
    var sessionsApi = biigle.$require('api.annotationSessions');

    var volumeId = biigle.$require('volumes.id');
    var now = new Date();
    var emptySession = function () {
        return {
            name: null,
            description: null,
            starts_at_iso8601: null,
            starts_at: null,
            ends_at_iso8601: null,
            ends_at: null,
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
            orderedSessions: function () {
                return this.sessions.sort(function (a, b) {
                    return b.starts_at_iso8601.getTime() - a.starts_at_iso8601.getTime();
                });
            },
        },
        methods: {
            clone: function (thing) {
                return JSON.parse(JSON.stringify(thing));
            },
            submit: function () {
                if (this.loading) return;

                this.startLoading();
                var self = this;
                var session = this.editedSession;
                if (this.hasNewSession) {
                    sessionsApi.save({volume_id: volumeId}, this.packSession(session))
                        .then(this.sessionSaved)
                        .catch(this.handleErrorResponse)
                        .finally(this.finishLoading);
                } else {
                    sessionsApi.update({id: session.id}, this.packSession(session))
                        .then(function () {self.sessionUpdated(session);})
                        .catch(this.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            sessionUpdated: function (session) {
                for (var i = this.sessions.length - 1; i >= 0; i--) {
                    if (this.sessions[i].id === session.id) {
                        this.sessions.splice(i, 1, session);
                        this.clearEditedSession();
                    }
                }
            },
            sessionSaved: function (response) {
                this.sessions.push(this.parseSession(response.data));
                this.clearEditedSession();
            },
            packSession: function (session) {
                // The API endpoint expects an array of user IDs and not user objects.
                // Deep copy the session first so the original object remains the same.
                session = this.clone(session);
                session.users = session.users.map(function (user) {
                    return user.id;
                });
                // Replace the human readable dates with the exact dates for storage.
                session.starts_at = session.starts_at_iso8601;
                session.ends_at = session.ends_at_iso8601;
                // Remove these to minimize the request payload.
                delete session.starts_at_iso8601;
                delete session.ends_at_iso8601;

                return session;
            },
            handleErrorResponse: function (response) {
                messages.handleErrorResponse(response);
            },
            hasError: function (name) {
                return false;
            },
            getError: function (name) {
                return '';
            },
            editSession: function (session) {
                this.editedSession = this.clone(session);
            },
            deleteSession: function () {
                if (this.loading || this.hasNewSession) return;

                if (confirm('Are you sure you want to delete the annotation session \'' + this.editedSession.name + '\'?')) {
                    this.startLoading();
                    var self = this;
                    var id = this.editedSession.id;
                    sessionsApi.delete({id: id})
                        .then(function () {self.sessionDeleted(id);})
                        .catch(messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }
            },
            sessionDeleted: function (id) {
                for (var i = this.sessions.length - 1; i >= 0; i--) {
                    if (this.sessions[i].id === id) {
                        this.sessions.splice(i, 1);
                        this.clearEditedSession();
                    }
                }
            },
            clearEditedSession: function () {
                this.editedSession = emptySession();
            },
            loadUsers: function () {
                volumesApi.queryUsers({id: volumeId})
                    .then(this.usersLoaded, messages.handleErrorResponse);
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
            // convert session date strings to date objects
            parseSession: function (session) {
                var date = new Date(session.starts_at_iso8601);
                session.starts_at_iso8601 = date;
                session.starts_at = this.stringifyDate(date);
                date = new Date(session.ends_at_iso8601);
                session.ends_at_iso8601 = date;
                session.ends_at = this.stringifyDate(date);

                return session;
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
            this.sessions.map(this.parseSession);
            this.$once('editing.start', this.loadUsers);
        },
    });
});

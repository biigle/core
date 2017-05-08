/**
 * The filter component of the annotations tab
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsFilter', {
    components: {
    },
    props: {
        annotations: {
            type: Array,
            required: true,
        },
    },
    data: function () {
        return {
            availableFilters: ['label', 'user', 'shape', 'session'],
            selectedFilter: null,
            selectedData: null,
            active: false,
        };
    },
    computed: {
        labelData: function () {
            var map = {};
            var data = [];
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    map[annotationLabel.label.id] = annotationLabel.label;
                });
            });

            for (var id in map) {
                if (map.hasOwnProperty(id)) {
                    data.push(map[id]);
                }
            }

            return data;
        },
        userData: function () {
            var map = {};
            var data = [];
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    map[annotationLabel.user.id] = annotationLabel.user;
                });
            });

            for (var id in map) {
                if (map.hasOwnProperty(id)) {
                    map[id].name = map[id].firstname + ' ' + map[id].lastname;
                    data.push(map[id]);
                }
            }

            return data;
        },
        shapeData: function () {
            var shapes = biigle.$require('annotations.shapes');
            var data = [];
            for (var id in shapes) {
                if (shapes.hasOwnProperty(id)) {
                    data.push({id: id, name: shapes[id]});
                }
            }

            return data;
        },
        sessionData: function () {
            return biigle.$require('annotations.sessions').map(function (session) {
                session.starts_at = new Date(session.starts_at);
                session.ends_at = new Date(session.ends_at);

                return session;
            });
        },
        data: function () {
            if (this.selectedFilter) {
                return this[this.selectedFilter + 'Data'] || [];
            }

            return [];
        },
    },
    methods: {
        labelFilterFunction: function (label) {
            return function (annotation) {
                return annotation.labels.filter(function (annotationLabel) {
                    return annotationLabel.label.id === label.id;
                }).length > 0;
            };
        },
        userFilterFunction: function (user) {
            return function (annotation) {
                return annotation.labels.filter(function (annotationLabel) {
                    return annotationLabel.user.id === user.id;
                }).length > 0;
            };
        },
        shapeFilterFunction: function (shape) {
            return function (annotation) {
                return annotation.shape_id === shape.id;
            };
        },
        sessionFilterFunction: function (session) {
            var userMap = {};
            session.users.forEach(function (user) {
                userMap[user.id] = null;
            });

            return function (annotation) {
                /*
                 * Dates without timezone (like these) are interpreted as dates of the
                 * timezone of the browser. Since the application can run in any
                 * timezone, these dates may not be interpreted correctly. But since the
                 * dates of the annotation session are not interpreted correctly, too
                 * (in the same way), we can still use them for comparison. Just be sure
                 * not to use the iso_8601 dates of the annotation session for
                 * comparison with the dates of the annotations.
                 */
                for (var i = annotation.labels.length - 1; i >= 0; i--) {
                    if (userMap.hasOwnProperty(annotation.labels[i].user.id)) {
                        var created_at = new Date(annotation.created_at);
                        // If the annotation has a label of a user that belongs to the
                        // session, it may be valid if created_at belongs to the session,
                        // too.
                        return created_at >= session.starts_at && created_at < session.ends_at;
                    }
                }

                return false;
            };
        },
        activateFilter: function () {
            if (this.selectedFilter && this.selectedData) {
                this.active = true;
                this.$emit('filter', this[this.selectedFilter + 'FilterFunction'](this.selectedData));
            }
        },
        deactivateFilter: function () {
            this.active = false;
            this.$emit('filter', null);
        },
    },
});

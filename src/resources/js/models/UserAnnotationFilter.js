biigle.$declare('videos.models.UserAnnotationFilter', function () {
    return Vue.extend({
        mixins: [biigle.$require('videos.mixins.annotationFilter')],
        data: function () {
            return {
                name: 'user',
                annotations: [],
                placeholder: 'user name',
            };
        },
        computed: {
            items: function () {
                var map = {};
                this.annotations.forEach(function (annotation) {
                    annotation.labels.forEach(function (annotationLabel) {
                        map[annotationLabel.user_id] = annotationLabel.user;
                    });
                });

                return Object.values(map).map(function (user) {
                    user.name = user.firstname + ' ' + user.lastname;
                    return user;
                });
            },
        },
        methods: {
            filter: function (annotations) {
                var id = this.selectedItem.id;

                return annotations.filter(function (annotation) {
                    return annotation.labels.reduce(function (carry, annotationLabel) {
                        return carry || annotationLabel.user_id === id;
                    }, false);
                });
            },
        },
    });
});

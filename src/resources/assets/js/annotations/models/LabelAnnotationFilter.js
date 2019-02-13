biigle.$declare('annotations.models.LabelAnnotationFilter', function () {
    return Vue.extend({
        mixins: [biigle.$require('annotations.mixins.annotationFilter')],
        components: {
            typeahead: biigle.$require('labelTrees.components.labelTypeahead'),
        },
        data: function () {
            return {
                name: 'label',
                annotations: [],
                placeholder: 'label name',
            };
        },
        computed: {
            items: function () {
                var map = {};
                this.annotations.forEach(function (annotation) {
                    annotation.labels.forEach(function (annotationLabel) {
                        map[annotationLabel.label.id] = annotationLabel.label;
                    });
                });

                return Object.values(map);
            },
        },
        methods: {
            filter: function (annotations) {
                var id = this.selectedItem.id;

                return annotations.filter(function (annotation) {
                    return annotation.labels.reduce(function (carry, annotationLabel) {
                        return carry || annotationLabel.label.id === id;
                    }, false);
                });
            },
        },
    });
});

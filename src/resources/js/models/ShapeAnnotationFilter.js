biigle.$declare('videos.models.ShapeAnnotationFilter', function () {
    return Vue.extend({
        mixins: [biigle.$require('videos.mixins.annotationFilter')],
        data: function () {
            return {
                name: 'shape',
                shapes: [],
                placeholder: 'shape name',
            };
        },
        computed: {
            items: function () {
                return Object.keys(this.shapes).map(function (id) {
                    return {
                        id: parseInt(id),
                        name: this.shapes[id],
                    };
                }, this);
            },
        },
        methods: {
            filter: function (annotations) {
                return annotations.filter(function (annotation) {
                    return annotation.shape_id === this.selectedItem.id;
                }, this);
            },
        },
    });
});

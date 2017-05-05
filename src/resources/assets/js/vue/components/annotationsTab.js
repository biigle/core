/**
 * The annotations tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsTab', {
    components: {
        labelItem: biigle.$require('annotations.components.annotationsTabItem'),
    },
    props: {
        annotations: {
            type: Array,
            required: true,
        },
    },
    data: function () {
        return {
        };
    },
    computed: {
        // Compiles a list of all labels and their associated annotations.
        items: function () {
            var labels = [];
            var annotations = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotation_label) {
                    if (annotations.hasOwnProperty(annotation_label.label.id)) {
                        annotations[annotation_label.label.id].push(annotation);
                    } else {
                        annotations[annotation_label.label.id] = [annotation];
                        labels.push(annotation_label.label);
                    }
                });
            });

            return labels.map(function (label) {
                return {
                    label: label,
                    annotations: annotations[label.id]
                };
            });
        },
    },
    methods: {
    },
    watch: {
    },
    created: function () {
        // console.log(this.annotationsByLabel);
    },
});

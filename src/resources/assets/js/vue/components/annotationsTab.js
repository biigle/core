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
    computed: {
        // Compiles a list of all labels and their associated annotations.
        items: function () {
            var labels = [];
            var annotations = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    var item = {
                        annotation: annotation,
                        annotationLabel: annotationLabel,
                    };

                    if (annotations.hasOwnProperty(annotationLabel.label.id)) {
                        annotations[annotationLabel.label.id].push(item);
                    } else {
                        annotations[annotationLabel.label.id] = [item];
                        labels.push(annotationLabel.label);
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
});

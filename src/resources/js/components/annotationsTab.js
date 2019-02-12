biigle.$component('videos.components.annotationsTab', {
    components: {
        powerToggle: biigle.$require('core.components.powerToggle'),
        labelItem: biigle.$require('videos.components.annotationsTabLabelItem'),
    },
    props: {
        annotations: {
            type: Array,
            default: [],
        },
    },
    data: function () {
        return {
            //
        };
    },
    computed: {
        labelItems: function () {
            var labels = {};
            var annotations = {};

            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    if (!labels.hasOwnProperty(annotationLabel.label.id)) {
                        labels[annotationLabel.label.id] = annotationLabel.label;
                        annotations[annotationLabel.label.id] = [];
                    }

                    annotations[annotationLabel.label.id].push(annotation);
                });
            });

            return Object.keys(labels).map(function (id) {
                return {
                    id: id,
                    label: labels[id],
                    annotations: annotations[id],
                };
            });
        },
    },
    methods: {
        handleSelect: function (annotation, shift) {
            if (annotation.isSelected && shift) {
                this.$emit('deselect', annotation);
            } else {
                this.$emit('select', annotation, annotation.startFrame, shift);
            }
        },
        emitDetach: function (annotation, annotationLabel) {
            this.$emit('detach', annotation, annotationLabel);
        },
    },
    watch: {
        //
    },
    created: function () {
        //
    },
});

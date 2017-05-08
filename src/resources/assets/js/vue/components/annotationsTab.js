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
    methods: {
        reallyScrollIntoView: function (annotations) {
            var scrollTop = this.$el.scrollTop;
            var height = this.$el.offsetHeight;
            var top = Infinity;
            var bottom = 0;

            var element;
            annotations.forEach(function (annotation) {
                var elements = this.$el.querySelectorAll(
                    '[data-annotation-id="' + annotation.id + '"]'
                );
                for (var i = elements.length - 1; i >= 0; i--) {
                    element = elements[i];
                    top = Math.min(element.offsetTop, top);
                    bottom = Math.max(element.offsetTop + element.offsetHeight, bottom);
                }
            }, this);

            // Scroll $el so all list items of selected annotations are visible or
            // scroll to the first list item if all items don't fit inside $el.
            if (scrollTop > top) {
                this.$el.scrollTop = top;
            } else if ((scrollTop + height) < bottom) {
                if (height >= (bottom - top)) {
                    this.$el.scrollTop = bottom - this.$el.offsetHeight;
                } else {
                    this.$el.scrollTop = top;
                }
            }
        },
        scrollIntoView: function (annotations) {
            if (annotations.length === 0) {
                return;
            }

            // Wait for the annotations list to be rendered so the offsetTop of each
            // item can be determined.
            this.$nextTick(function () {
                this.reallyScrollIntoView(annotations);
            });
        },
        keepElementPosition: function (element) {
            var positionBefore = element.offsetTop - this.$el.scrollTop;
            // Wait until everything is rendered.
            this.$nextTick(function () {
                this.$nextTick(function () {
                    var positionAfter = element.offsetTop - this.$el.scrollTop;
                    // Scroll so the element has the same relative position than before.
                    this.$el.scrollTop += positionAfter - positionBefore;
                });
            });
        },
    },
});
